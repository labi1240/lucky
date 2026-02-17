'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { ClientDashboard } from '../components/ClientDashboard';
import { EmailViewer } from '../components/EmailViewer';
import { AddClientModal } from '../components/AddClientModal';
import { MobileHeader } from '../components/MobileHeader';
import { OutlookClient } from './types';
import { getAllAccounts, createAccount, updateLastAccessed } from './actions/accountActions';

export default function Home() {
    const [clients, setClients] = useState<OutlookClient[]>([]);
    const [activeClientId, setActiveClientId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const loadAccounts = async () => {
        setLoading(true);
        const accounts = await getAllAccounts();
        setClients(accounts);
        setLoading(false);
    };

    // Load accounts from database on mount
    useEffect(() => {
        const init = async () => {
            await loadAccounts();
        };
        init();
    }, []);

    const handleAddClient = async (newClientData: Omit<OutlookClient, 'id' | 'status'>) => {
        const newClient = await createAccount(newClientData);
        setClients([...clients, newClient]);
    };

    const handleSelectClient = async (id: string | null) => {
        setActiveClientId(id);
        setIsSidebarOpen(false); // Close sidebar on mobile when selecting

        if (id) {
            // Update lastAccessed timestamp when selecting
            await updateLastAccessed(id);
        }

        // Always reload to get updated sorting and sync times
        await loadAccounts();
    };

    const activeClient = clients.find(c => c.id === activeClientId);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading accounts...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-slate-50 font-sans text-slate-900">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-30">
                <MobileHeader
                    onMenuClick={() => setIsSidebarOpen(true)}
                    title={activeClient ? activeClient.user_email : 'Dashboard'}
                />
            </div>

            {/* Sidebar */}
            <Sidebar
                clients={clients}
                activeClientId={activeClientId}
                onSelectClient={handleSelectClient}
                onAddClient={() => setIsModalOpen(true)}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Main Content */}
            <main className="md:ml-64 min-h-screen pt-14 md:pt-0">
                {activeClientId && activeClient ? (
                    <EmailViewer
                        client={activeClient}
                        onBack={() => handleSelectClient(null)}
                        onRefresh={loadAccounts}
                    />
                ) : (
                    <ClientDashboard
                        clients={clients}
                        onSelectClient={handleSelectClient}
                        onAddClient={() => setIsModalOpen(true)}
                    />
                )}
            </main>

            <AddClientModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAdd={handleAddClient}
            />
        </div>
    );
}
