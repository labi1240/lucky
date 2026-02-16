import React, { useState } from 'react';
import { OutlookClient } from '../app/types';
import { RefreshCw, AlertCircle, CheckCircle, Plus, Clock, Star, Archive, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { toggleFavorite, toggleArchive, toggleCasino } from '../app/actions/accountActions';

// ─── Extracted Components (outside render to avoid React lint errors) ────────

const ClientCard = ({
    client,
    isInactive,
    onSelectClient,
    onRefreshDashboard
}: {
    client: OutlookClient;
    isInactive?: boolean;
    onSelectClient: (id: string | null) => void;
    onRefreshDashboard: () => void;
}) => {
    const [copied, setCopied] = useState(false);

    const handleCopyEmail = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await navigator.clipboard.writeText(client.user_email);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div
            className={`group relative overflow-hidden rounded-xl md:rounded-2xl transition-all duration-300 cursor-pointer
                ${isInactive
                    ? 'bg-white/50 border border-slate-200 hover:bg-white hover:shadow-lg hover:-translate-y-0.5'
                    : 'bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 hover:-translate-y-0.5'
                }
            `}
            onClick={() => onSelectClient(client.id)}
        >
            {/* Gradient accent top border for active cards */}
            {!isInactive && <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />}

            {/* Mobile: compact p-3, Desktop: spacious p-6 */}
            <div className="p-3 md:p-6">
                <div className="flex justify-between items-start mb-2 md:mb-5">
                    <div className={`p-1.5 md:p-2.5 rounded-lg md:rounded-xl transition-colors ${isInactive
                        ? 'bg-slate-100 text-slate-400'
                        : client.status === 'connected'
                            ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
                            : 'bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white'
                        }`}>
                        {isInactive ? (
                            <Clock className="w-4 h-4 md:w-5 md:h-5" />
                        ) : client.status === 'connected' ? (
                            <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                        ) : (
                            <AlertCircle className="w-4 h-4 md:w-5 md:h-5" />
                        )}
                    </div>
                    <div className="flex gap-1 md:gap-2">
                        <button
                            className="text-slate-300 hover:text-blue-600 hover:bg-blue-50 p-1.5 md:p-2 rounded-lg transition-colors"
                            onClick={handleCopyEmail}
                            title="Copy email address"
                        >
                            {copied ? (
                                <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" />
                            ) : (
                                <Copy className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            )}
                        </button>
                    <button
                        className={`transition-colors p-1.5 md:p-2 rounded-lg ${client.is_favorite
                            ? 'text-amber-400 bg-amber-50 hover:bg-amber-100'
                            : 'text-slate-300 hover:text-amber-400 hover:bg-slate-50'}`}
                        onClick={async (e) => {
                            e.stopPropagation();
                            await toggleFavorite(client.id, !client.is_favorite);
                            onRefreshDashboard();
                        }}
                        title={client.is_favorite ? "Unpin account" : "Pin account"}
                    >
                        <Star className={`w-3.5 h-3.5 md:w-4 md:h-4 ${client.is_favorite ? 'fill-current' : ''}`} />
                    </button>
                    <button
                        className="text-slate-300 hover:text-blue-500 hover:bg-blue-50 p-1.5 md:p-2 rounded-lg transition-colors"
                        onClick={async (e) => {
                            e.stopPropagation();
                            await toggleArchive(client.id, !client.is_archived);
                            onRefreshDashboard();
                        }}
                        title={client.is_archived ? "Unarchive account" : "Archive account"}
                    >
                        <Archive className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                </div>
            </div>

            <div className="mb-2 md:mb-4">
                <h3 className={`text-sm md:text-base font-bold truncate mb-0.5 md:mb-1 ${isInactive ? 'text-slate-600' : 'text-slate-900'}`}>
                    {client.user_email}
                </h3>
                <p className="text-[10px] md:text-xs font-medium text-slate-400 truncate flex items-center">
                    <span className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-slate-300 mr-1.5 md:mr-2"></span>
                    Microsoft Outlook
                </p>
            </div>

            {/* Casino Badges */}
            <div className="flex flex-wrap gap-2 mb-2 md:mb-4 px-3 md:px-0">
                {[
                    { id: 'luckydays', name: 'LuckyDays', logo: 'https://luckydays.ca/favicon.ico' },
                    { id: 'betty.com', name: 'Betty.com', logo: 'https://betty.ca/favicon/apple-icon-57x57.png' },
                    { id: 'betty.ca', name: 'Betty.ca', logo: 'https://betty.ca/favicon/apple-icon-57x57.png' }
                ].map(casino => {
                    const isSelected = (client.casinos || '').split(',').includes(casino.id);
                    return (
                        <button
                            key={casino.id}
                            className={`flex items-center space-x-1.5 px-2 py-1 rounded-lg transition-all border ${
                                isSelected
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20'
                                    : 'bg-slate-50 border-slate-200 text-slate-400 group-hover:border-slate-300'
                            }`}
                            onClick={async (e) => {
                                e.stopPropagation();
                                await toggleCasino(client.id, casino.id);
                                onRefreshDashboard();
                            }}
                            title={`Toggle ${casino.name} tracking`}
                        >
                            <div className={`w-3.5 h-3.5 md:w-4 md:h-4 rounded-md overflow-hidden bg-white flex-shrink-0 ${isSelected ? '' : 'grayscale opacity-60'}`}>
                                <img src={casino.logo} alt={casino.name} className="w-full h-full object-contain" />
                            </div>
                            <span className="text-[9px] md:text-[11px] font-bold uppercase tracking-tight">
                                {casino.name.split('.')[0]}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className={`flex items-center text-[10px] md:text-xs pt-2 md:pt-4 border-t ${isInactive ? 'border-slate-100 text-slate-400' : 'border-slate-50 text-slate-500'}`}>
                <RefreshCw className={`w-3 h-3 md:w-3.5 md:h-3.5 mr-1.5 md:mr-2 ${client.status === 'syncing' ? 'animate-spin text-blue-500' : ''}`} />
                <span>
                    {client.last_synced
                        ? <>Synced <span className="font-medium text-slate-700">{new Date(client.last_synced).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></>
                        : 'Never synced'
                    }
                </span>
            </div>
        </div>
    </div>
);
};

const AddButton = ({ onAddClient }: { onAddClient: () => void }) => (
    <button
        onClick={onAddClient}
        className="group relative flex flex-col items-center justify-center h-full min-h-[100px] md:min-h-[200px] rounded-xl md:rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300"
    >
        <div className="w-8 h-8 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl shadow-sm flex items-center justify-center mb-2 md:mb-4 group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
            <Plus className="w-4 h-4 md:w-6 md:h-6 text-slate-400 group-hover:text-blue-600" />
        </div>
        <span className="font-semibold text-xs md:text-base text-slate-600 group-hover:text-blue-700">Connect Account</span>
        <span className="text-[10px] md:text-xs text-slate-400 mt-0.5 md:mt-1 group-hover:text-blue-500/70">Outlook / Office 365</span>
    </button>
);

// ─── Main Component ──────────────────────────────────────────────────────────

interface ClientDashboardProps {
    clients: OutlookClient[];
    onSelectClient: (id: string | null) => void;
    onAddClient: () => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ clients, onSelectClient, onAddClient }) => {
    const [showArchived, setShowArchived] = useState(false);

    // Refresh dashboard by deselecting client (triggers re-fetch)
    const handleRefresh = () => onSelectClient(null);

    // Filter out archived accounts from main views
    const activeClients = clients.filter(c => !c.is_archived);

    // 1. Separate Favorites
    const favoriteAccounts = activeClients.filter(c => c.is_favorite);

    // 2. Filter remaining for Recent/Inactive
    const nonFavoriteClients = activeClients.filter(c => !c.is_favorite);

    // Split valid non-favorites into "Today" (24h) and "History"
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const recentAccounts = nonFavoriteClients.filter(client => {
        if (!client.last_accessed) return false;
        const lastTime = new Date(client.last_accessed);
        return lastTime > oneDayAgo;
    });

    const inactiveAccounts = nonFavoriteClients
        .filter(client => {
            if (!client.last_accessed) return true;
            const lastTime = new Date(client.last_accessed);
            return lastTime <= oneDayAgo;
        })
        .sort((a, b) => a.user_email.localeCompare(b.user_email));

    const archivedClients = clients
        .filter(c => c.is_archived)
        .sort((a, b) => a.user_email.localeCompare(b.user_email));

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-10 pb-20">
            <div className="max-w-7xl mx-auto space-y-8 md:space-y-12">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 pb-4 md:pb-6 border-b border-slate-200/60">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
                        <p className="text-sm md:text-base text-slate-500 mt-1">Manage your active sessions and account history.</p>
                    </div>
                    <button
                        onClick={onAddClient}
                        className="inline-flex items-center justify-center px-4 md:px-5 py-2 md:py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm md:text-base font-medium rounded-xl transition-all shadow-lg shadow-slate-900/20 hover:shadow-slate-900/30 active:scale-95"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Connect Account
                    </button>
                </header>

                {clients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 text-blue-500">
                            <Plus className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No accounts connected</h3>
                        <p className="text-slate-500 max-w-md mb-8 leading-relaxed">
                            Connect your first Outlook account to start managing your emails securely and efficiently.
                        </p>
                        <button
                            onClick={onAddClient}
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5"
                        >
                            Connect Outlook Account
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8 md:space-y-12">
                        {/* Favorites Section */}
                        {favoriteAccounts.length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                                    <div className="p-1 md:p-1.5 bg-amber-100 rounded-lg">
                                        <Star className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-600 fill-amber-600" />
                                    </div>
                                    <h2 className="text-base md:text-lg font-bold text-slate-800">
                                        Pinned Accounts
                                        <span className="ml-2 px-2 py-0.5 text-xs bg-slate-100 text-slate-500 rounded-full">{favoriteAccounts.length}</span>
                                    </h2>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                                    {favoriteAccounts.map(client => (
                                        <ClientCard key={client.id} client={client} isInactive={false} onSelectClient={onSelectClient} onRefreshDashboard={handleRefresh} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Today&apos;s Focus Section (24h) */}
                        {recentAccounts.length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                                    <div className="p-1 md:p-1.5 bg-blue-100 rounded-lg">
                                        <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600" />
                                    </div>
                                    <h2 className="text-base md:text-lg font-bold text-slate-800">
                                        {"Today's Focus"}
                                        <span className="ml-2 px-2 py-0.5 text-xs bg-slate-100 text-slate-500 rounded-full">{recentAccounts.length}</span>
                                    </h2>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                                    {recentAccounts.map(client => (
                                        <ClientCard key={client.id} client={client} isInactive={false} onSelectClient={onSelectClient} onRefreshDashboard={handleRefresh} />
                                    ))}
                                    <AddButton onAddClient={onAddClient} />
                                </div>
                            </section>
                        )}

                        {/* History Section */}
                        {inactiveAccounts.length > 0 && (
                            <section className="pt-6 md:pt-8 border-t border-slate-200">
                                <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                                    <div className="p-1 md:p-1.5 bg-slate-100 rounded-lg">
                                        <RefreshCw className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-500" />
                                    </div>
                                    <h2 className="text-base md:text-lg font-bold text-slate-600">
                                        Account History
                                        <span className="ml-2 px-2 py-0.5 text-xs bg-slate-100 text-slate-400 rounded-full">{inactiveAccounts.length}</span>
                                    </h2>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6 opacity-80 hover:opacity-100 transition-opacity">
                                    {inactiveAccounts.map(client => (
                                        <ClientCard key={client.id} client={client} isInactive={true} onSelectClient={onSelectClient} onRefreshDashboard={handleRefresh} />
                                    ))}
                                    {recentAccounts.length === 0 && <AddButton onAddClient={onAddClient} />}
                                </div>
                            </section>
                        )}

                        {/* Archived Section (collapsible) */}
                        {archivedClients.length > 0 && (
                            <section className="pt-6 md:pt-8 border-t border-slate-200/50">
                                <button
                                    onClick={() => setShowArchived(!showArchived)}
                                    className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6 group w-full text-left"
                                >
                                    <div className="p-1 md:p-1.5 bg-slate-100 rounded-lg">
                                        <Archive className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" />
                                    </div>
                                    <h2 className="text-base md:text-lg font-bold text-slate-400 group-hover:text-slate-600 transition-colors">
                                        Archived
                                        <span className="ml-2 px-2 py-0.5 text-xs bg-slate-100 text-slate-400 rounded-full">{archivedClients.length}</span>
                                    </h2>
                                    {showArchived
                                        ? <ChevronDown className="w-4 h-4 text-slate-400 ml-auto" />
                                        : <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
                                    }
                                </button>
                                {showArchived && (
                                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6 opacity-60 hover:opacity-90 transition-opacity">
                                        {archivedClients.map(client => (
                                            <ClientCard key={client.id} client={client} isInactive={true} onSelectClient={onSelectClient} onRefreshDashboard={handleRefresh} />
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}

                        {/* Fallback: Add button when no sections show it */}
                        {recentAccounts.length === 0 && inactiveAccounts.length === 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                                <AddButton onAddClient={onAddClient} />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
