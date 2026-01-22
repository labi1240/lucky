import React from 'react';
import { OutlookClient } from '../app/types';
import { RefreshCw, AlertCircle, CheckCircle, ExternalLink, Plus, Clock, Star } from 'lucide-react';
import { toggleFavorite } from '../app/actions/accountActions';

interface ClientDashboardProps {
    clients: OutlookClient[];
    onSelectClient: (id: string) => void;
    onAddClient: () => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ clients, onSelectClient, onAddClient }) => {
    // 1. Separate Favorites
    const favoriteAccounts = clients.filter(c => c.is_favorite);

    // 2. Filter remaining for Recent/Inactive to avoid duplication? 
    // Usually favorites are also "Recent" or "Inactive". 
    // Let's SHOW them in both places or exclude them?
    // Exclude them from other lists for cleaner UI
    const nonFavoriteClients = clients.filter(c => !c.is_favorite);

    // Split valid non-favorites into recent and inactive
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentAccounts = nonFavoriteClients.filter(client => {
        if (!client.last_accessed) return false;
        const lastTime = new Date(client.last_accessed);
        return lastTime > sevenDaysAgo;
    });

    const inactiveAccounts = nonFavoriteClients.filter(client => {
        if (!client.last_accessed) return true;
        const lastTime = new Date(client.last_accessed);
        return lastTime <= sevenDaysAgo;
    });

    const ClientCard = ({ client, isInactive }: { client: OutlookClient; isInactive?: boolean }) => (
        <div
            key={client.id}
            className={`rounded-xl border shadow-sm hover:shadow-md transition-shadow cursor-pointer group ${isInactive
                ? 'bg-slate-50 border-slate-200 opacity-70 hover:opacity-100'
                : 'bg-white border-slate-200'
                }`}
            onClick={() => onSelectClient(client.id)}
        >
            <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-2 rounded-lg ${isInactive
                        ? 'bg-slate-100 text-slate-400'
                        : client.status === 'connected'
                            ? 'bg-green-50 text-green-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}>
                        {isInactive ? (
                            <Clock className="w-5 h-5" />
                        ) : client.status === 'connected' ? (
                            <CheckCircle className="w-5 h-5" />
                        ) : (
                            <AlertCircle className="w-5 h-5" />
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            className={`transition-colors p-1 rounded-full ${client.is_favorite
                                ? 'text-amber-400 hover:text-amber-500 bg-amber-50'
                                : 'text-slate-400 hover:text-amber-400 hover:bg-slate-100'}`}
                            onClick={async (e) => {
                                e.stopPropagation();
                                // Optimistic UI update could happen here if parent handles it, 
                                // but for now we rely on server action + parent refresh
                                await toggleFavorite(client.id, !client.is_favorite);
                                // Trigger a reload via parent-passed callback if available? 
                                // Since we don't have a callback to refresh data, we might need to 
                                // rely on Next.js Server Actions router.refresh() if this was a server component,
                                // but this is a Client Component.
                                // We need to trigger the parent's `loadAccounts`.
                                // Let's just reload the page for now or assume parent passes a refresh?
                                // Actually, `onSelectClient(null)` triggers a reload in parent.
                                // A bit hacky but we can call onSelectClient(null) to refresh.
                                onSelectClient(null);
                            }}
                            title={client.is_favorite ? "Unpin account" : "Pin account"}
                        >
                            <Star className={`w-4 h-4 ${client.is_favorite ? 'fill-current' : ''}`} />
                        </button>
                        <button className="text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <h3 className={`text-lg font-semibold truncate ${isInactive ? 'text-slate-600' : 'text-slate-900'}`}>
                    {client.user_email}
                </h3>
                <p className="text-xs font-mono text-slate-400 truncate mb-4">ID: {client.client_id.substring(0, 18)}...</p>

                <div className="flex items-center text-xs text-slate-500 border-t border-slate-100 pt-4">
                    <RefreshCw className="w-3 h-3 mr-1.5" />
                    <span>Last synced: {client.last_synced ? new Date(client.last_synced).toLocaleTimeString() : 'Never'}</span>
                </div>
            </div>
        </div>
    );

    const AddButton = () => (
        <button
            onClick={onAddClient}
            className="flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl hover:bg-slate-100 hover:border-slate-300 transition-all p-6 group h-full min-h-[180px]"
        >
            <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
            </div>
            <span className="font-medium text-slate-600 group-hover:text-slate-900">Add New Account</span>
        </button>
    );

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <header className="mb-6 md:mb-8">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-sm md:text-base text-slate-500">Overview of your connected Outlook instances.</p>
            </header>

            {clients.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-500">
                        <Plus className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">No accounts connected</h3>
                    <p className="text-slate-500 max-w-md mb-6">
                        Connect your first Outlook account using your Client ID and Refresh Token to start managing emails.
                    </p>
                    <button
                        onClick={onAddClient}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                    >
                        Connect Account
                    </button>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Favorites Section */}
                    {favoriteAccounts.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                                    Pinned Accounts ({favoriteAccounts.length})
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {favoriteAccounts.map(client => (
                                    <ClientCard key={client.id} client={client} isInactive={false} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Recently Accessed Section */}
                    {recentAccounts.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                                    Recently Accessed ({recentAccounts.length})
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {recentAccounts.map(client => (
                                    <ClientCard key={client.id} client={client} isInactive={false} />
                                ))}
                                <AddButton />
                            </div>
                        </section>
                    )}

                    {/* Inactive Section */}
                    {inactiveAccounts.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                                    Inactive ({inactiveAccounts.length})
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {inactiveAccounts.map(client => (
                                    <ClientCard key={client.id} client={client} isInactive={true} />
                                ))}
                                {recentAccounts.length === 0 && <AddButton />}
                            </div>
                        </section>
                    )}

                    {/* Show add button alone if only recent accounts exist */}
                    {recentAccounts.length > 0 && inactiveAccounts.length === 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AddButton />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
