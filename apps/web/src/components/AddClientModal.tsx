import React, { useState } from 'react';
import { X, Lock, Mail, Key } from 'lucide-react';
import { OutlookClient } from '../app/types';

interface AddClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (client: Omit<OutlookClient, 'id' | 'status'>) => void;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose, onAdd }) => {
    const [formData, setFormData] = useState({
        user_email: '',
        client_id: '',
        refresh_token: '',
        casinos: ''
    });

    const [quickPaste, setQuickPaste] = useState('');

    const casinosMetadata: Record<string, { name: string, logo: string }> = {
        'luckydays': { name: 'LuckyDays', logo: 'https://luckydays.ca/favicon.ico' },
        'betty.com': { name: 'Betty.com', logo: 'https://betty.ca/favicon/apple-icon-57x57.png' },
        'betty.ca': { name: 'Betty.ca', logo: 'https://betty.ca/favicon/apple-icon-57x57.png' }
    };

    const casinoOptions = Object.keys(casinosMetadata);

    const toggleCasino = (casino: string) => {
        const currentCasinos = formData.casinos ? formData.casinos.split(',').filter(c => c.trim() !== '') : [];
        let newCasinos;
        if (currentCasinos.includes(casino)) {
            newCasinos = currentCasinos.filter(c => c !== casino);
        } else {
            newCasinos = [...currentCasinos, casino];
        }
        setFormData({ ...formData, casinos: newCasinos.join(',') });
    };

    const parseAccountString = (str: string) => {
        // Format: login:password:refresh_token:client_id:casinos(optional)
        const parts = str.trim().split(':');
        if (parts.length >= 4) {
            const [email, _, refreshToken, clientId, casinos] = parts;
            setFormData({
                user_email: email,
                client_id: clientId,
                refresh_token: refreshToken,
                casinos: casinos || ''
            });
            setQuickPaste(''); // Clear paste area after successful parse
        }
    };

    const handleQuickPasteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setQuickPaste(val);
        if (val.includes(':')) {
            parseAccountString(val);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd(formData);
        setFormData({ user_email: '', client_id: '', refresh_token: '', casinos: '' });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-0 md:p-4">
            <div className="bg-white rounded-t-xl md:rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain touch-pan-y animate-fade-in-up">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-800">Connect Outlook Account</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 pb-0">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Quick Import</label>
                        <textarea
                            className="w-full text-xs font-mono p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            rows={2}
                            placeholder="Paste login:password:refresh_token:client_id string here..."
                            value={quickPaste}
                            onChange={handleQuickPasteChange}
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Automatically fills fields below.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-4">
                    <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Manual Entry / Verified Data</div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input
                                required
                                type="email"
                                placeholder="user@example.com"
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                value={formData.user_email}
                                onChange={e => setFormData({ ...formData, user_email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Client ID (App ID)</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input
                                required
                                type="text"
                                placeholder="e.g., 7a8b9c..."
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono text-sm"
                                value={formData.client_id}
                                onChange={e => setFormData({ ...formData, client_id: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Refresh Token</label>
                        <div className="relative">
                            <Key className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                            <textarea
                                required
                                rows={3}
                                placeholder="Paste your long refresh token here..."
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono text-xs"
                                value={formData.refresh_token}
                                onChange={e => setFormData({ ...formData, refresh_token: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Track Casinos</label>
                        <div className="flex flex-wrap gap-3">
                            {casinoOptions.map(casino => {
                                const isSelected = formData.casinos.split(',').includes(casino);
                                const meta = casinosMetadata[casino];
                                return (
                                    <button
                                        key={casino}
                                        type="button"
                                        onClick={() => toggleCasino(casino)}
                                        className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                                            isSelected
                                                ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm ring-1 ring-blue-600/20'
                                                : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600'
                                        }`}
                                    >
                                        <div className="w-5 h-5 rounded-md overflow-hidden bg-white flex-shrink-0 border border-slate-100">
                                            <img src={meta.logo} alt={meta.name} className="w-full h-full object-contain" />
                                        </div>
                                        <span>{meta.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow-md transition-all"
                        >
                            Connect Account
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
