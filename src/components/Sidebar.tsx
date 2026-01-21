'use client';

import React, { useState } from 'react';
import { LayoutDashboard, Mail, Plus, Settings, ChevronDown, ChevronRight, Copy, Check, X } from 'lucide-react';
import { OutlookClient } from '../app/types';

interface SidebarProps {
    clients: OutlookClient[];
    activeClientId: string | null;
    onSelectClient: (id: string | null) => void;
    onAddClient: () => void;
    isOpen?: boolean;
    onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    clients,
    activeClientId,
    onSelectClient,
    onAddClient,
    isOpen = false,
    onClose
}) => {
    // Auto-expand inactive when there are no recent accounts
    const [showInactive, setShowInactive] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopyEmail = async (e: React.MouseEvent, email: string, id: string) => {
        e.stopPropagation();
        await navigator.clipboard.writeText(email);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Sort clients by lastAccessed (most recent first)
    const sortedClients = [...clients].sort((a, b) => {
        const aTime = a.last_accessed ? new Date(a.last_accessed).getTime() : 0;
        const bTime = b.last_accessed ? new Date(b.last_accessed).getTime() : 0;
        return bTime - aTime;
    });

    // Split into recent and inactive (accounts with no last_accessed are inactive)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentAccounts = sortedClients.filter(client => {
        if (!client.last_accessed) return false;
        const lastTime = new Date(client.last_accessed);
        return lastTime > sevenDaysAgo;
    });

    const inactiveAccounts = sortedClients.filter(client => {
        if (!client.last_accessed) return true;
        const lastTime = new Date(client.last_accessed);
        return lastTime <= sevenDaysAgo;
    });

    const ClientButton = ({ client, isInactive }: { client: OutlookClient; isInactive?: boolean }) => (
        <div
            key={client.id}
            onClick={() => onSelectClient(client.id)}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors group cursor-pointer ${activeClientId === client.id
                    ? 'bg-slate-800 text-white border-l-4 border-blue-500'
                    : isInactive
                        ? 'hover:bg-slate-800/50 text-slate-500 hover:text-slate-300'
                        : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                }`}
        >
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isInactive ? 'bg-slate-600' : client.status === 'connected' ? 'bg-green-500' : 'bg-amber-500'}`} />
            <span className={`truncate text-sm flex-1 ${isInactive ? 'opacity-60' : ''}`}>{client.user_email}</span>
            <button
                onClick={(e) => handleCopyEmail(e, client.user_email, client.id)}
                className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1.5 hover:bg-slate-700 rounded transition-opacity"
                title="Copy email"
            >
                {copiedId === client.id ? (
                    <Check className="w-3.5 h-3.5 text-green-400" />
                ) : (
                    <Copy className="w-3.5 h-3.5" />
                )}
            </button>
        </div>
    );

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 z-50
                w-72 md:w-64 bg-slate-900 text-slate-300 border-r border-slate-800
                transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                {/* Header - fixed height */}
                <div className="h-[72px] p-6 flex items-center justify-between text-white">
                    <div className="flex items-center space-x-3">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Mail className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-lg tracking-tight">Outlook Mgr</span>
                    </div>
                    {/* Mobile close button */}
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors md:hidden"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable content - explicit height calculation */}
                <div
                    className="absolute left-0 right-0 overflow-y-scroll py-4"
                    style={{ top: '72px', bottom: '140px', WebkitOverflowScrolling: 'touch' }}
                >
                <div className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Main
                </div>
                <nav className="space-y-1 px-2 mb-8">
                    <button
                        onClick={() => onSelectClient(null)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${activeClientId === null
                                ? 'bg-blue-600 text-white'
                                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        <span>Dashboard</span>
                    </button>
                </nav>

                <div className="px-4 mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Connected Accounts
                    </span>
                    <button
                        onClick={onAddClient}
                        className="text-slate-500 hover:text-white transition-colors"
                        title="Add Account"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {/* Recently Accessed */}
                {recentAccounts.length > 0 && (
                    <div className="mb-4">
                        <div className="px-4 mb-1 text-xs text-slate-600">
                            Recently Accessed ({recentAccounts.length})
                        </div>
                        <nav className="space-y-1 px-2">
                            {recentAccounts.map((client) => (
                                <ClientButton key={client.id} client={client} isInactive={false} />
                            ))}
                        </nav>
                    </div>
                )}

                {/* Inactive Accounts */}
                {inactiveAccounts.length > 0 && (
                    <div>
                        <button
                            onClick={() => setShowInactive(!showInactive)}
                            className="w-full px-4 mb-1 flex items-center justify-between text-xs text-slate-600 hover:text-slate-400 transition-colors"
                        >
                            <span>Inactive ({inactiveAccounts.length})</span>
                            {showInactive ? (
                                <ChevronDown className="w-3 h-3" />
                            ) : (
                                <ChevronRight className="w-3 h-3" />
                            )}
                        </button>
                        {showInactive && (
                            <nav className="space-y-1 px-2">
                                {inactiveAccounts.map((client) => (
                                    <ClientButton key={client.id} client={client} isInactive={true} />
                                ))}
                            </nav>
                        )}
                    </div>
                )}

                {clients.length === 0 && (
                    <div className="px-4 py-4 text-sm text-slate-600 italic text-center">
                        No accounts added yet.
                    </div>
                )}
            </div>

                {/* Footer - fixed at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-[140px] p-4 border-t border-slate-800 bg-slate-900">
                    <button className="flex items-center space-x-3 text-slate-400 hover:text-white transition-colors w-full px-2 py-2">
                        <Settings className="w-5 h-5" />
                        <span>Settings</span>
                    </button>
                    <div className="mt-4 flex items-center space-x-3 px-2">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white">
                            AD
                        </div>
                        <div className="flex-1">
                            <div className="text-sm font-medium text-white">Admin User</div>
                            <div className="text-xs text-slate-500">admin@platform.com</div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
