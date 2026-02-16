export interface OutlookClient {
    id: string;
    user_email: string;
    client_id: string;
    refresh_token: string;
    status: 'connected' | 'error' | 'syncing';
    last_synced?: string;
    last_accessed?: string;
    is_favorite?: boolean;
    is_archived?: boolean;
    casinos?: string;
}

export interface EmailMessage {
    id?: string;
    from: string;
    to: string[];
    subject: string;
    date: string;
    body: string;
    attachments: any[];
    original_object?: any;
    isRead?: boolean;
}

export type ViewState = 'DASHBOARD' | 'CLIENT_INBOX';
