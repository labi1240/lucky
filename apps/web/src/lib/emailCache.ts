import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { EmailMessage } from '../app/types';

interface EmailCacheDB extends DBSchema {
    emails: {
        key: string;
        value: {
            accountId: string;
            emails: EmailMessage[];
            lastUpdated: number;
        };
        indexes: { 'by-account': string };
    };
    metadata: {
        key: string;
        value: {
            key: string;
            value: unknown;
        };
    };
}

const DB_NAME = 'outlook-email-cache';
const DB_VERSION = 1;
const CACHE_EXPIRY = 1000 * 60 * 60; // 1 hour

let dbPromise: Promise<IDBPDatabase<EmailCacheDB>> | null = null;

function getDB() {
    if (!dbPromise) {
        dbPromise = openDB<EmailCacheDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                // Emails store
                if (!db.objectStoreNames.contains('emails')) {
                    const emailStore = db.createObjectStore('emails', { keyPath: 'accountId' });
                    emailStore.createIndex('by-account', 'accountId');
                }
                // Metadata store
                if (!db.objectStoreNames.contains('metadata')) {
                    db.createObjectStore('metadata', { keyPath: 'key' });
                }
            },
        });
    }
    return dbPromise;
}

export async function getCachedEmails(accountId: string): Promise<EmailMessage[] | null> {
    try {
        const db = await getDB();
        const cached = await db.get('emails', accountId);

        if (!cached) return null;

        // Check if cache is expired
        const isExpired = Date.now() - cached.lastUpdated > CACHE_EXPIRY;
        if (isExpired) {
            return null; // Return null to trigger fresh fetch, but data still exists
        }

        return cached.emails;
    } catch (error) {
        console.error('Error reading from cache:', error);
        return null;
    }
}

export async function getCachedEmailsWithMeta(accountId: string): Promise<{
    emails: EmailMessage[] | null;
    lastUpdated: number | null;
    isStale: boolean;
}> {
    try {
        const db = await getDB();
        const cached = await db.get('emails', accountId);

        if (!cached) {
            return { emails: null, lastUpdated: null, isStale: true };
        }

        const isStale = Date.now() - cached.lastUpdated > CACHE_EXPIRY;
        return {
            emails: cached.emails,
            lastUpdated: cached.lastUpdated,
            isStale
        };
    } catch (error) {
        console.error('Error reading from cache:', error);
        return { emails: null, lastUpdated: null, isStale: true };
    }
}

export async function cacheEmails(accountId: string, emails: EmailMessage[]): Promise<void> {
    try {
        const db = await getDB();
        await db.put('emails', {
            accountId,
            emails,
            lastUpdated: Date.now()
        });
    } catch (error) {
        console.error('Error writing to cache:', error);
    }
}

export async function clearEmailCache(accountId?: string): Promise<void> {
    try {
        const db = await getDB();
        if (accountId) {
            await db.delete('emails', accountId);
        } else {
            await db.clear('emails');
        }
    } catch (error) {
        console.error('Error clearing cache:', error);
    }
}

export async function getAllCachedAccountIds(): Promise<string[]> {
    try {
        const db = await getDB();
        return await db.getAllKeys('emails');
    } catch (error) {
        console.error('Error getting cached account IDs:', error);
        return [];
    }
}

export async function getCacheStats(): Promise<{
    accountCount: number;
    totalEmails: number;
    oldestCache: number | null;
}> {
    try {
        const db = await getDB();
        const allCached = await db.getAll('emails');

        let totalEmails = 0;
        let oldestCache: number | null = null;

        for (const cache of allCached) {
            totalEmails += cache.emails.length;
            if (!oldestCache || cache.lastUpdated < oldestCache) {
                oldestCache = cache.lastUpdated;
            }
        }

        return {
            accountCount: allCached.length,
            totalEmails,
            oldestCache
        };
    } catch (error) {
        console.error('Error getting cache stats:', error);
        return { accountCount: 0, totalEmails: 0, oldestCache: null };
    }
}
