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

    // Select first email when emails load
    useEffect(() => {
        if (emails.length > 0 && !selectedEmail) {
            setSelectedEmail(emails[0]);
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
                <div className={`px-4 py-2 text-xs flex items-center justify-center gap-2 ${
                    isOffline ? 'bg-amber-100 text-amber-800' : 'bg-blue-50 text-blue-700'
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
                        <span className={`hidden sm:inline text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                            isOffline ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
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
                            className={`p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-all disabled:opacity-50 ${
                                refreshing ? 'animate-spin' : ''
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
            <div className="md:flex">
                {/* Email List */}
                <div className={`md:w-1/3 lg:w-[400px] md:border-r border-slate-200 bg-slate-50 ${selectedEmail ? 'hidden md:block' : 'block'}`}>
                    <div className="p-3 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase flex justify-between sticky top-[104px] md:top-[112px] bg-slate-50 z-10">
                        <span>Inbox</span>
                        <span>{filteredEmails.length} messages</span>
                    </div>

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
                                    className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-white transition-colors ${
                                        selectedEmail?.id === email.id
                                            ? 'bg-white border-l-4 border-l-blue-500 shadow-sm'
                                            : 'border-l-4 border-l-transparent'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-sm truncate pr-2 ${!email.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                                            {(email.from || '').split('<')[0]}
                                        </span>
                                        <span className="text-xs text-slate-400 whitespace-nowrap">
                                            {email.date ? new Date(email.date).toLocaleDateString() : ''}
                                        </span>
                                    </div>
                                    <div className={`text-sm mb-1 truncate ${!email.isRead ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
                                        {email.subject}
                                    </div>
                                    <div className="text-xs text-slate-400 line-clamp-2">
                                        {(email.body || '').replace(/<[^>]*>/g, '')}
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

                {/* Email Detail */}
                <div className={`md:flex-1 bg-white ${!selectedEmail ? 'hidden md:block' : 'block'}`}>
                    {selectedEmail ? (
                        <div>
                            <div className="p-4 md:p-6 border-b border-slate-100">
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
                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs md:text-sm flex-shrink-0">
                                        {(selectedEmail.from || 'A').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-slate-900 truncate">{selectedEmail.from}</div>
                                        <div className="text-xs text-slate-500 truncate">
                                            To: {(selectedEmail.to || []).join(', ')} • {new Date(selectedEmail.date).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 md:p-6">
                                <div
                                    className="prose prose-sm max-w-none text-slate-700"
                                    dangerouslySetInnerHTML={{ __html: selectedEmail.body || '' }}
                                />

                                {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                                    <div className="mt-8 pt-4 border-t border-slate-100">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center">
                                            <Paperclip className="w-3 h-3 mr-2" />
                                            Attachments
                                        </h4>
                                        <div className="flex gap-2">
                                            <div className="p-3 border border-slate-200 rounded-lg text-sm text-slate-600">
                                                Attachment
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-slate-300">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <ArrowLeft className="w-8 h-8 opacity-20" />
                            </div>
                            <p className="text-lg font-medium">Select an email to read</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
