'use client';

import React, { useState, useEffect } from 'react';
import { OutlookClient, EmailMessage } from '../app/types';
import { Search, RotateCw, Trash2, ArrowLeft, Paperclip, WifiOff, Clock, Database } from 'lucide-react';
import { deleteEmail as deleteEmailAction } from '../app/actions/emailActions';
import { useCachedEmails } from '../hooks/useCachedEmails';

interface EmailViewerProps {
    client: OutlookClient;
    onBack: () => void;
}

const getPreviewText = (html: string) => {
    if (!html) return '';
    try {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        // Remove style and script tags
        const styles = doc.querySelectorAll('style, script, link, meta');
        styles.forEach(el => el.remove());
        return doc.body.textContent || doc.body.innerText || '';
    } catch (e) {
        // Fallback for SSR or error
        return html.replace(/<[^>]*>/g, '');
    }
};

export const EmailViewer: React.FC<EmailViewerProps> = ({ client, onBack }) => {
    const {
        emails,
        loading,
        refreshing,
        error,
        isOffline,
        isCached,
        lastUpdated,
        refresh
    } = useCachedEmails({
        clientId: client.client_id,
        refreshToken: client.refresh_token,
        userEmail: client.user_email,
        accountId: client.id
    });

    const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [iframeHeight, setIframeHeight] = useState('400px');

    // Handle iframe resize messages
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'resize-email-frame' && event.data?.height) {
                setIframeHeight(`${event.data.height + 40}px`);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // Reset height when email changes
    useEffect(() => {
        setIframeHeight('400px');
    }, [selectedEmail]);

    // Select first email when emails load (Desktop only)
    useEffect(() => {
        if (emails.length > 0 && !selectedEmail) {
            // Only auto-select on desktop (width >= 768px)
            if (window.innerWidth >= 768) {
                setSelectedEmail(emails[0]);
            }
        }
    }, [emails, selectedEmail]);

    const handleDelete = async () => {
        if (!selectedEmail?.original_object?.id) {
            alert('Cannot delete: Email ID not found');
            return;
        }

        if (isOffline) {
            alert('Cannot delete while offline');
            return;
        }

        if (!confirm('Are you sure you want to delete this email?')) {
            return;
        }

        setDeleting(true);
        try {
            const result: any = await deleteEmailAction(
                selectedEmail.original_object.id,
                client.client_id,
                client.refresh_token,
                client.user_email
            );

            if (result.success) {
                setSelectedEmail(null);
                // Refresh to update cache
                await refresh();
            } else {
                alert(`Delete failed: ${result.error}`);
            }
        } catch (e: any) {
            alert(`Delete error: ${e.message}`);
        } finally {
            setDeleting(false);
        }
    };

    const filteredEmails = emails.filter(e =>
        (e.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.from || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatLastUpdated = (date: Date | null) => {
        if (!date) return 'Never';
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="bg-white">
            {/* Offline/Cache Banner */}
            {(isOffline || isCached) && (
                <div className={`px-4 py-2 text-xs flex items-center justify-center gap-2 ${isOffline ? 'bg-amber-100 text-amber-800' : 'bg-blue-50 text-blue-700'
                    }`}>
                    {isOffline ? (
                        <>
                            <WifiOff className="w-3 h-3" />
                            <span>You're offline - showing cached emails</span>
                        </>
                    ) : (
                        <>
                            <Database className="w-3 h-3" />
                            <span>Showing cached data</span>
                            <span className="opacity-60">• Updated {formatLastUpdated(lastUpdated)}</span>
                        </>
                    )}
                </div>
            )}

            {/* Header */}
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white">
                <div className="h-14 md:h-16 flex items-center justify-between px-3 md:px-4">
                    <div className="flex items-center space-x-2 md:space-x-4 min-w-0">
                        <button onClick={onBack} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg md:hidden flex-shrink-0">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h2 className="font-semibold text-slate-800 truncate text-sm md:text-base">{client.user_email}</h2>
                        <span className={`hidden sm:inline text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${isOffline ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                            }`}>
                            {isOffline ? 'Offline' : 'Connected'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {isCached && !isOffline && (
                            <span className="hidden md:flex items-center text-xs text-slate-400 gap-1">
                                <Clock className="w-3 h-3" />
                                {formatLastUpdated(lastUpdated)}
                            </span>
                        )}
                        <button
                            onClick={refresh}
                            disabled={loading || refreshing || isOffline}
                            className={`p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-all disabled:opacity-50 ${refreshing ? 'animate-spin' : ''
                                }`}
                            title={isOffline ? 'Cannot refresh while offline' : 'Refresh emails'}
                        >
                            <RotateCw className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="px-3 md:px-4 pb-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search mail..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex flex-1 overflow-hidden h-[calc(100vh-140px)]">
                {/* Email List */}
                <div className={`md:w-1/3 lg:w-[400px] border-r border-slate-200 bg-slate-50 flex flex-col ${selectedEmail ? 'hidden md:flex' : 'flex'} h-full`}>
                    <div className="p-3 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase flex justify-between bg-slate-50 z-10 shrink-0">
                        <span>Inbox</span>
                        <span>{filteredEmails.length} messages</span>
                    </div>

                    <div className="overflow-y-auto flex-1">
                        {error && !emails.length && (
                            <div className="p-4 m-4 bg-red-50 text-red-600 text-xs rounded-lg border border-red-200">
                                {error}
                            </div>
                        )}

                        {loading && emails.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm">
                                <div className="animate-pulse">
                                    {isOffline ? 'Checking cache...' : 'Loading emails...'}
                                </div>
                            </div>
                        ) : (
                            <div>
                                {filteredEmails.map(email => (
                                    <div
                                        key={email.id}
                                        onClick={() => setSelectedEmail(email)}
                                        className={`p-4 border-b border-slate-100 cursor-pointer transition-colors ${selectedEmail?.id === email.id
                                            ? 'bg-white border-l-4 border-l-blue-500 shadow-sm'
                                            : 'hover:bg-white border-l-4 border-l-transparent'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-sm truncate pr-2 ${!email.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                                                {(email.from || '').split('<')[0]}
                                            </span>
                                            <span className="text-xs text-slate-400 whitespace-nowrap">
                                                {formatLastUpdated(email.date ? new Date(email.date) : null)}
                                            </span>
                                        </div>
                                        <div className={`text-sm mb-1 truncate ${!email.isRead ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
                                            {email.subject}
                                        </div>
                                        <div className="text-xs text-slate-400 line-clamp-2">
                                            {getPreviewText(email.body || '')}
                                        </div>
                                    </div>
                                ))}
                                {filteredEmails.length === 0 && !loading && (
                                    <div className="p-8 text-center text-slate-400 text-sm">
                                        {searchTerm ? 'No emails match your search' : 'No emails found'}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Email Detail */}
                <div className={`flex-1 bg-white flex flex-col h-full overflow-hidden ${!selectedEmail ? 'hidden md:flex' : 'flex'}`}>
                    {selectedEmail ? (
                        <div className="flex flex-col h-full">
                            <div className="p-4 md:p-6 border-b border-slate-100 shrink-0">
                                <div className="flex justify-between items-start mb-4 gap-2">
                                    <button onClick={() => setSelectedEmail(null)} className="md:hidden p-2 text-slate-400 flex-shrink-0 -ml-2">
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <h1 className="text-base md:text-xl font-bold text-slate-900 flex-1 min-w-0">{selectedEmail.subject}</h1>
                                    <button
                                        onClick={handleDelete}
                                        disabled={deleting || isOffline}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                                        title={isOffline ? 'Cannot delete while offline' : 'Delete email'}
                                    >
                                        <Trash2 className={`w-5 h-5 ${deleting ? 'animate-pulse' : ''}`} />
                                    </button>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs md:text-sm flex-shrink-0 shadow-sm">
                                        {(selectedEmail.from || 'A').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-slate-900 truncate">{selectedEmail.from}</div>
                                        <div className="text-xs text-slate-500 truncate flex items-center">
                                            To: {(selectedEmail.to || []).join(', ')}
                                            <span className="mx-1.5">•</span>
                                            {new Date(selectedEmail.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/30">
                                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-1 min-h-[calc(100%-2rem)]">
                                    <iframe
                                        className="w-full border-none bg-white rounded-lg"
                                        sandbox="allow-popups allow-popups-to-escape-sandbox allow-scripts"
                                        srcDoc={`
                                            <!DOCTYPE html>
                                            <html>
                                            <head>
                                                <base target="_blank">
                                                <style>
                                                    body {
                                                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                                                        margin: 0;
                                                        padding: 2rem;
                                                        color: #334155;
                                                        font-size: 0.95rem;
                                                        line-height: 1.6;
                                                        overflow-wrap: break-word;
                                                    }
                                                    img { max-width: 100%; height: auto; border-radius: 4px; }
                                                    a { color: #2563eb; text-decoration: none; font-weight: 500; }
                                                    a:hover { text-decoration: underline; }
                                                    p { margin-bottom: 1em; }
                                                    blockquote { border-left: 4px solid #e2e8f0; margin: 0; padding-left: 1rem; color: #64748b; }
                                                </style>
                                            </head>
                                            <body>
                                                ${(selectedEmail.body || '').replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")}
                                                <script>
                                                    const notifyHeight = () => {
                                                        const height = document.body.scrollHeight;
                                                        window.parent.postMessage({ type: 'resize-email-frame', height: height }, '*');
                                                    };
                                                    window.onload = notifyHeight;
                                                    new ResizeObserver(notifyHeight).observe(document.body);
                                                </script>
                                            </body>
                                            </html>
                                        `}
                                        style={{ minHeight: '400px', height: iframeHeight }}
                                    />
                                </div>

                                {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                                    <div className="mt-8 pt-4 border-t border-slate-200">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center">
                                            <Paperclip className="w-3 h-3 mr-2" />
                                            Attachments
                                        </h4>
                                        <div className="flex gap-2 flex-wrap">
                                            {selectedEmail.attachments.map((att, i) => (
                                                 <div key={i} className="p-3 border border-slate-200 bg-white rounded-lg text-sm text-slate-700 shadow-sm flex items-center gap-2 hover:border-blue-300 transition-colors cursor-pointer">
                                                    <Paperclip className="w-4 h-4 text-slate-400" />
                                                    Attachment {i + 1}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50/30">
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                                <Search className="w-10 h-10 text-slate-200" />
                            </div>
                            <p className="text-lg font-medium text-slate-500">Select an email to read</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
