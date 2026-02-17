'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { OutlookClient } from '../types';

interface RawAccount {
    id: string;
    user_email: string;
    client_id: string;
    refresh_token: string;
    status: string;
    last_synced: string;
    last_accessed: string | null;
    is_favorite: boolean;
    is_archived: boolean;
    casinos: string | null;
}

export async function getAllAccounts(): Promise<OutlookClient[]> {
    try {
        // Use raw query to ensure we get ALL columns even if the client is stale
        const accounts = await prisma.$queryRaw<RawAccount[]>`
            SELECT 
                id, 
                user_email, 
                client_id, 
                refresh_token, 
                status, 
                last_synced, 
                last_accessed, 
                is_favorite, 
                is_archived, 
                created_at, 
                updated_at,
                casinos
            FROM outlook_accounts 
            WHERE is_archived = false
            ORDER BY user_email ASC
        `;
        
        // Map snake_case database columns back to properties matching OutlookClient interface
        return accounts.map(acc => ({
            id: acc.id,
            user_email: acc.user_email,
            client_id: acc.client_id,
            refresh_token: acc.refresh_token,
            status: acc.status as 'connected' | 'error' | 'syncing',
            last_synced: acc.last_synced,
            last_accessed: acc.last_accessed ?? undefined,
            is_favorite: acc.is_favorite,
            is_archived: acc.is_archived,
            casinos: acc.casinos || ""
        })) as OutlookClient[];
    } catch (error) {
        console.error('Error fetching accounts:', error);
        return [];
    }
}

export async function createAccount(data: Omit<OutlookClient, 'id' | 'status'>): Promise<OutlookClient> {
    const account = await prisma.outlookAccount.create({
        data: {
            userEmail: data.user_email,
            clientId: data.client_id,
            refreshToken: data.refresh_token,
            status: 'connected',
            lastSynced: new Date(),
            lastAccessed: new Date(),
            casinos: data.casinos || ''
        }
    });

    return {
        id: account.id,
        user_email: account.userEmail,
        client_id: account.clientId,
        refresh_token: account.refreshToken,
        status: account.status as 'connected' | 'error' | 'syncing',
        last_synced: account.lastSynced.toISOString(),
        last_accessed: account.lastAccessed?.toISOString(),
        is_archived: false,
        casinos: account.casinos
    };
}

export async function deleteAccount(id: string): Promise<boolean> {
    try {
        await prisma.outlookAccount.delete({
            where: { id }
        });
        return true;
    } catch (error) {
        console.error('Error deleting account:', error);
        return false;
    }
}

export async function updateAccountSyncTime(id: string): Promise<void> {
    await prisma.outlookAccount.update({
        where: { id },
        data: {
            lastSynced: new Date()
        }
    });
}

export async function updateLastAccessed(id: string): Promise<void> {
    await prisma.outlookAccount.update({
        where: { id },
        data: {
            lastAccessed: new Date()
        }
    });
}

export async function toggleFavorite(id: string, isFavorite: boolean): Promise<void> {
    await prisma.outlookAccount.update({
        where: { id },
        data: {
            isFavorite
        }
    });
}

export async function toggleArchive(id: string, isArchived: boolean): Promise<void> {
    await prisma.outlookAccount.update({
        where: { id },
        data: {
            isArchived
        }
    });
}

export async function toggleCasino(id: string, casinoName: string): Promise<void> {
    if (!id || typeof id !== 'string') {
        return;
    }
    
    try {
        // Use raw query for selection to ensure we get the casinos column even if the client is stale
        const results = await prisma.$queryRaw<{ casinos: string | null }[]>`SELECT casinos FROM outlook_accounts WHERE id = ${id}`;

        if (!results || results.length === 0) {
            console.error(`Account not found for ID: ${id}`);
            return;
        }

        const account = results[0];
        const currentCasinos = account.casinos || "";
        let casinos = currentCasinos.split(',').filter((c: string) => c.trim() !== '');
        
        if (casinos.includes(casinoName)) {
            casinos = casinos.filter((c: string) => c !== casinoName);
        } else {
            casinos.push(casinoName);
        }

        const updatedCasinos = casinos.join(',');
        
        // Use raw query for update
        await prisma.$executeRaw`UPDATE outlook_accounts SET casinos = ${updatedCasinos} WHERE id = ${id}`;
        
        // Revalidate the path to clear any server-side caches
        revalidatePath('/');
    } catch (error: unknown) {
        console.error('Error in toggleCasino:', error);
        throw error;
    }
}
