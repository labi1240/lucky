'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { LayoutDashboard, Mail, Plus, Settings, ChevronDown, ChevronRight, Copy, Check, X, Archive } from 'lucide-react';
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
    const [showArchived, setShowArchived] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopyEmail = async (e: React.MouseEvent, email: string, id: string) => {
        e.stopPropagation();
        await navigator.clipboard.writeText(email);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Separate archived from visible
    const archivedClients = clients
        .filter(c => c.is_archived)
        .sort((a, b) => a.user_email.localeCompare(b.user_email));
    
    const visibleClients = clients
        .filter(c => !c.is_archived)
        .sort((a, b) => a.user_email.localeCompare(b.user_email));

    // Split into "Today" (24h) and "History"
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const recentAccounts = visibleClients.filter((client: OutlookClient) => {
        if (!client.last_accessed) return false;
        const lastTime = new Date(client.last_accessed);
        return lastTime > oneDayAgo;
    });

    const inactiveAccounts = visibleClients.filter((client: OutlookClient) => {
        if (!client.last_accessed) return true;
        const lastTime = new Date(client.last_accessed);
        return lastTime <= oneDayAgo;
    });

    const casinoLogos: Record<string, string> = {
        'luckydays': 'https://luckydays.ca/favicon.ico',
        'betty.com': 'https://betty.ca/favicon/apple-icon-57x57.png',
        'betty.ca': 'https://betty.ca/favicon/apple-icon-57x57.png'
    };

    const ClientButton = ({ client, isInactive }: { client: OutlookClient; isInactive?: boolean }) => {
        const activeCasinos = (client.casinos || '').split(',').filter(c => c.trim() !== '');
        
        return (
            <div
                key={client.id}
                onClick={() => onSelectClient(client.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all group cursor-pointer border border-transparent ${
                    activeClientId === client.id
                    ? 'bg-blue-600/20 text-blue-100 border-blue-500/30 shadow-lg shadow-blue-900/20 backdrop-blur-sm'
                    : isInactive
                        ? 'hover:bg-white/5 text-slate-500 hover:text-slate-300'
                        : 'hover:bg-white/10 text-slate-400 hover:text-white'
                    }`}
            >
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 shadow-sm ${
                    isInactive ? 'bg-slate-700' : client.status === 'connected' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-amber-500 shadow-amber-500/50'
                }`} />
                <span className={`truncate text-sm font-medium flex-1 ${isInactive ? 'opacity-60' : ''}`}>{client.user_email}</span>
                
                {activeCasinos.length > 0 && (
                    <div className="flex -space-x-1 shrink-0 bg-white/5 p-0.5 rounded-lg border border-white/5 mx-1">
                        {activeCasinos.map(casino => (
                            <div key={casino} className="w-3.5 h-3.5 rounded-md border border-slate-900 bg-white overflow-hidden shadow-sm shrink-0 relative" title={casino}>
                                <Image 
                                    src={casinoLogos[casino]} 
                                    alt={casino} 
                                    fill 
                                    sizes="14px"
                                    className="object-contain" 
                                    unoptimized
                                />
                            </div>
                        ))}
                    </div>
                )}
                
                <button
                    onClick={(e) => handleCopyEmail(e, client.user_email, client.id)}
                    className={`p-1.5 hover:bg-white/10 rounded-lg transition-all shrink-0 ${
                        activeClientId === client.id 
                        ? 'opacity-100 text-blue-400' 
                        : 'opacity-100 md:opacity-0 md:group-hover:opacity-100 text-slate-500 hover:text-white'
                    }`}
                    title="Copy email"
                >
                    {copiedId === client.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                        <Copy className="w-3.5 h-3.5" />
                    )}
                </button>
            </div>
        );
    };

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 z-50
                w-72 md:w-64 bg-slate-950/90 backdrop-blur-xl border-r border-white/5 text-slate-300
                transform transition-transform duration-300 ease-out shadow-2xl
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                {/* Header - fixed height */}
                <div className="h-[80px] px-6 flex items-center justify-between text-white border-b border-white/5 bg-slate-900/50">
                    <div
                        className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => onSelectClient(null)}
                    >
                        <div className="bg-linear-to-br from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
                            <Mail className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-lg tracking-tight font-sans">Outlook<span className="text-blue-500">Mgr</span></span>
                    </div>
                    {/* Mobile close button */}
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors md:hidden"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable content */}
                <div
                    className="absolute left-0 right-0 overflow-y-auto py-6"
                    style={{ top: '80px', bottom: '100px', WebkitOverflowScrolling: 'touch' }}
                >
                    <div className="px-6 mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        Overview
                    </div>
                    <nav className="space-y-1 px-3 mb-8">
                        <button
                            onClick={() => onSelectClient(null)}
                            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all ${activeClientId === null
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                : 'hover:bg-white/5 text-slate-400 hover:text-white'
                                }`}
                        >
                            <LayoutDashboard className="w-5 h-5 opacity-90" />
                            <span className="font-medium text-sm">Dashboard</span>
                        </button>
                    </nav>

                    <div className="px-6 mb-3 flex items-center justify-between group">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            Accounts
                        </span>
                        <button
                            onClick={onAddClient}
                            className="text-slate-500 hover:text-white transition-colors bg-white/5 hover:bg-blue-600 rounded-full p-1"
                            title="Add Account"
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>

                    {/* Today's Focus */}
                    {recentAccounts.length > 0 && (
                        <div className="mb-6">
                            <div className="px-6 mb-2 text-xs font-semibold text-blue-400/90 flex items-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2 animate-pulse"></div>
                                {"Today's Focus"} ({recentAccounts.length})
                            </div>
                            <nav className="space-y-1 px-3">
                                {recentAccounts.map((client: OutlookClient) => (
                                    <ClientButton key={client.id} client={client} isInactive={false} />
                                ))}
                            </nav>
                        </div>
                    )}

                    {/* Logic for History:
                        If we have recent accounts, we collapse history by default or show it?
                        User said: "use 3-4 accounts for 1 day then not much use".
                        So old accounts are "History".
                    */}
                    {inactiveAccounts.length > 0 && (
                        <div>
                            <button
                                onClick={() => setShowInactive(!showInactive)}
                                className="w-full px-6 mb-2 flex items-center justify-between text-xs font-medium text-slate-600 hover:text-slate-400 transition-colors group"
                            >
                                <span>History ({inactiveAccounts.length})</span>
                                {showInactive ? (
                                    <ChevronDown className="w-3 h-3 group-hover:text-blue-400 transition-colors" />
                                ) : (
                                    <ChevronRight className="w-3 h-3 group-hover:text-blue-400 transition-colors" />
                                )}
                            </button>
                            {showInactive && (
                                <nav className="space-y-1 px-3 relative">
                                    {/* Vertical line for hierarchy */}
                                    <div className="absolute left-6 top-0 bottom-0 w-px bg-white/5"></div>
                                    {inactiveAccounts.map((client: OutlookClient) => (
                                        <ClientButton key={client.id} client={client} isInactive={true} />
                                    ))}
                                </nav>
                            )}
                        </div>
                    )}

                    {/* Archived */}
                    {archivedClients.length > 0 && (
                        <div className="mt-2">
                            <button
                                onClick={() => setShowArchived(!showArchived)}
                                className="w-full px-6 mb-2 flex items-center justify-between text-xs font-medium text-slate-600 hover:text-slate-400 transition-colors group"
                            >
                                <span className="flex items-center gap-1.5">
                                    <Archive className="w-3 h-3" />
                                    Archived ({archivedClients.length})
                                </span>
                                {showArchived ? (
                                    <ChevronDown className="w-3 h-3 group-hover:text-blue-400 transition-colors" />
                                ) : (
                                    <ChevronRight className="w-3 h-3 group-hover:text-blue-400 transition-colors" />
                                )}
                            </button>
                            {showArchived && (
                                <nav className="space-y-1 px-3 relative">
                                    <div className="absolute left-6 top-0 bottom-0 w-px bg-white/5"></div>
                                    {archivedClients.map((client: OutlookClient) => (
                                        <ClientButton key={client.id} client={client} isInactive={true} />
                                    ))}
                                </nav>
                            )}
                        </div>
                    )}

                    {clients.length === 0 && (
                        <div className="px-6 py-8 text-sm text-slate-600 italic text-center border-t border-white/5 border-dashed m-4">
                            No accounts active
                        </div>
                    )}
                </div>

                {/* Footer - fixed at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-[100px] p-4 border-t border-white/5 bg-slate-950/50 backdrop-blur-xl">
                    <button className="flex items-center space-x-3 text-slate-400 hover:text-white transition-colors w-full px-3 py-2 rounded-lg hover:bg-white/5">
                        <Settings className="w-5 h-5" />
                        <span className="font-medium text-sm">Settings</span>
                    </button>
                    <div className="mt-2 flex items-center space-x-3 px-3 py-2 rounded-xl bg-white/5 border border-white/5">
                        <div className="w-8 h-8 rounded-full bg-linear-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-xs text-white font-bold ring-2 ring-slate-900 shrink-0">
                             AD
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">Admin User</div>
                            <div className="text-xs text-slate-500 truncate">admin@platform.com</div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
