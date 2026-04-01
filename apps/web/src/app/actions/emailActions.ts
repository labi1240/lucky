'use server';

import { updateAccountSyncTime } from './accountActions';

interface EmailResult {
    from: string;
    to: string[];
    subject: string;
    date: string;
    body: string;
    attachments: string[];
    defects: string[];
    original_object: Record<string, unknown>;
}

interface FetchEmailsResponse {
    emails?: EmailResult[];
    error?: string;
}

interface DeleteEmailResponse {
    success: boolean;
    message?: string;
    error?: string;
}

interface GraphMessage {
    id: string;
    subject: string;
    receivedDateTime: string;
    from: {
        emailAddress: {
            name: string;
            address: string;
        };
    };
    toRecipients: Array<{
        emailAddress: {
            name: string;
            address: string;
        };
    }>;
    body: {
        contentType: string;
        content: string;
    };
    hasAttachments: boolean;
}


/**
 * Get access token from refresh token
 */
async function getAccessToken(clientId: string, refreshToken: string): Promise<{ token?: string; error?: string }> {
    const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

    const payload = new URLSearchParams({
        client_id: clientId,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.ReadWrite offline_access'
    });

    try {
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: payload.toString()
        });

        if (!response.ok) {
            const errorText = await response.text();
            return { error: `Token error (${response.status}): ${errorText}` };
        }

        const data = await response.json();

        if (!data.access_token) {
            // console.error('No access_token in response');
            return { error: 'No access_token in response' };
        }
        return { token: data.access_token };
    } catch (error) {
        return { error: `Failed to get access token: ${error}` };
    }
}

/**
 * Fetch emails from Outlook inbox using Microsoft Graph API
 */
/**
 * Helper to fetch messages from a specific folder
 */
async function fetchMessagesFromFolder(accessToken: string, folderName: string): Promise<GraphMessage[]> {
    const graphUrl = `https://graph.microsoft.com/v1.0/me/mailFolders/${folderName}/messages?$top=25&$orderby=receivedDateTime DESC`;

    try {
        const response = await fetch(graphUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error fetching from ${folderName}: ${response.status} ${errorText}`);
            throw new Error(`Graph API error (${response.status}) fetching ${folderName}: ${errorText || response.statusText}`);
        }

        const data = await response.json();
        return data.value || [];
    } catch (error) {
        console.error(`Exception fetching from ${folderName}:`, error);
        return [];
    }
}

/**
 * Fetch emails from Outlook inbox and junk folder using Microsoft Graph API
 */
export async function fetchEmails(
    clientId: string,
    refreshToken: string,
    userEmail: string,
    accountId: string
): Promise<FetchEmailsResponse> {
    // Get access token
    const { token: accessToken, error: tokenError } = await getAccessToken(clientId, refreshToken);

    if (!accessToken) {
        return { error: `Could not authenticate. Details: ${tokenError}` };
    }

    try {
        // Fetch emails from Inbox and Junk Email in parallel
        const [inboxMessages, junkMessages] = await Promise.all([
            fetchMessagesFromFolder(accessToken, 'inbox'),
            fetchMessagesFromFolder(accessToken, 'junkemail')
        ]);

        // Combine messages
        const allMessages = [...inboxMessages, ...junkMessages];

        if (allMessages.length === 0) {
            return { emails: [] };
        }

        // Sort by date descending (newest first)
        allMessages.sort((a, b) => {
            return new Date(b.receivedDateTime).getTime() - new Date(a.receivedDateTime).getTime();
        });

        // Transform messages to our format
        const emails: EmailResult[] = allMessages.map((msg) => ({
            from: `${msg.from?.emailAddress?.name || ''} <${msg.from?.emailAddress?.address || ''}>`,
            to: msg.toRecipients?.map((r) => r.emailAddress?.address) || [],
            subject: msg.subject || '(No Subject)',
            date: msg.receivedDateTime,
            body: msg.body?.content || '',
            attachments: [],
            defects: [],
            original_object: msg as unknown as Record<string, unknown>
        }));

        // Update sync time in database
        await updateAccountSyncTime(accountId);

        // Return all emails
        return { emails };

    } catch (error) {
        return { error: `Error fetching email via Graph: ${error}` };
    }
}

/**
 * Delete (move to trash) an email using Microsoft Graph API
 */
export async function deleteEmail(
    messageId: string,
    clientId: string,
    refreshToken: string
): Promise<DeleteEmailResponse> {
    // Get access token
    const { token: accessToken, error: tokenError } = await getAccessToken(clientId, refreshToken);

    if (!accessToken) {
        return { success: false, error: `Could not authenticate. Details: ${tokenError}` };
    }

    try {
        // Use well-known folder name 'deleteditems' to move message to trash
        // This is more robust than looking up by display name which varies by locale
        const moveUrl = `https://graph.microsoft.com/v1.0/me/messages/${messageId}/move`;
        const moveResponse = await fetch(moveUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                destinationId: 'deleteditems'
            })
        });

        if (moveResponse.ok) {
            return { success: true, message: 'Email moved to trash successfully' };
        } else {
            const errorText = await moveResponse.text();
            return { success: false, error: `Move failed (${moveResponse.status}): ${errorText}` };
        }

    } catch (error) {
        return { success: false, error: `Error deleting email: ${error}` };
    }
}
