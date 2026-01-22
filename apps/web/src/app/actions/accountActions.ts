'use server';

import prisma from '../../lib/prisma';
import { OutlookClient } from '../types';

export async function getAllAccounts(): Promise<OutlookClient[]> {
    try {
        const accounts = await prisma.outlookAccount.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });

        return accounts.map(account => ({
            id: account.id,
            user_email: account.userEmail,
            client_id: account.clientId,
            refresh_token: account.refreshToken,
            status: account.status as 'connected' | 'error' | 'syncing',
            last_synced: account.lastSynced.toISOString(),
            last_accessed: account.lastAccessed?.toISOString(),
            is_favorite: account.isFavorite
        }));
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
            lastAccessed: new Date()
        }
    });

    return {
        id: account.id,
        user_email: account.userEmail,
        client_id: account.clientId,
        refresh_token: account.refreshToken,
        status: account.status as 'connected' | 'error' | 'syncing',
        last_synced: account.lastSynced.toISOString(),
        last_accessed: account.lastAccessed?.toISOString()
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
