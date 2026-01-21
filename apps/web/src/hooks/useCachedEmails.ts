'use client';

import { useState, useEffect, useCallback } from 'react';
import { EmailMessage } from '../app/types';
import { getCachedEmailsWithMeta, cacheEmails, clearEmailCache } from '../lib/emailCache';
import { fetchEmails as fetchEmailsAction } from '../app/actions/emailActions';

interface UseCachedEmailsOptions {
    clientId: string;
    refreshToken: string;
    userEmail: string;
    accountId: string;
}

interface UseCachedEmailsReturn {
    emails: EmailMessage[];
    loading: boolean;
    refreshing: boolean;
    error: string | null;
    isOffline: boolean;
    isCached: boolean;
    lastUpdated: Date | null;
    refresh: () => Promise<void>;
    clearCache: () => Promise<void>;
}

export function useCachedEmails({
    clientId,
    refreshToken,
    userEmail,
    accountId
}: UseCachedEmailsOptions): UseCachedEmailsReturn {
    const [emails, setEmails] = useState<EmailMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isOffline, setIsOffline] = useState(false);
    const [isCached, setIsCached] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // Monitor online/offline status
    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        setIsOffline(!navigator.onLine);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Fetch emails from network
    const fetchFromNetwork = useCallback(async (): Promise<EmailMessage[] | null> => {
        try {
            const data: any = await fetchEmailsAction(clientId, refreshToken, userEmail);

            if (data.error) {
                throw new Error(data.error);
            }

            const results = Array.isArray(data) ? data : [data];
            const formatted = results.map((e: any, idx: number) => ({
                ...e,
                id: e.id || `msg-${Date.now()}-${idx}`,
                isRead: false
            }));

            // Cache the emails
            await cacheEmails(accountId, formatted);

            return formatted;
        } catch (err: any) {
            console.error('Network fetch failed:', err);
            return null;
        }
    }, [clientId, refreshToken, userEmail, accountId]);

    // Initial load - cache first, then network
    useEffect(() => {
        let mounted = true;

        const loadEmails = async () => {
            setLoading(true);
            setError(null);

            // Try cache first
            const cached = await getCachedEmailsWithMeta(accountId);

            if (cached.emails && cached.emails.length > 0) {
                if (mounted) {
                    setEmails(cached.emails);
                    setIsCached(true);
                    setLastUpdated(cached.lastUpdated ? new Date(cached.lastUpdated) : null);
                    setLoading(false);
                }

                // If cache is stale and we're online, fetch fresh data in background
                if (cached.isStale && navigator.onLine) {
                    const freshEmails = await fetchFromNetwork();
                    if (freshEmails && mounted) {
                        setEmails(freshEmails);
                        setIsCached(false);
                        setLastUpdated(new Date());
                    }
                }
            } else {
                // No cache, fetch from network
                if (navigator.onLine) {
                    const freshEmails = await fetchFromNetwork();
                    if (mounted) {
                        if (freshEmails) {
                            setEmails(freshEmails);
                            setLastUpdated(new Date());
                        } else {
                            setError('Failed to fetch emails');
                        }
                        setLoading(false);
                    }
                } else {
                    if (mounted) {
                        setError('No cached data available and you are offline');
                        setLoading(false);
                    }
                }
            }
        };

        loadEmails();

        return () => {
            mounted = false;
        };
    }, [accountId, fetchFromNetwork]);

    // Manual refresh
    const refresh = useCallback(async () => {
        if (!navigator.onLine) {
            setError('Cannot refresh while offline');
            return;
        }

        setRefreshing(true);
        setError(null);

        const freshEmails = await fetchFromNetwork();

        if (freshEmails) {
            setEmails(freshEmails);
            setIsCached(false);
            setLastUpdated(new Date());
        } else {
            setError('Failed to refresh emails');
        }

        setRefreshing(false);
    }, [fetchFromNetwork]);

    // Clear cache
    const clearCacheHandler = useCallback(async () => {
        await clearEmailCache(accountId);
        setIsCached(false);
    }, [accountId]);

    return {
        emails,
        loading,
        refreshing,
        error,
        isOffline,
        isCached,
        lastUpdated,
        refresh,
        clearCache: clearCacheHandler
    };
}
