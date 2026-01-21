'use client';

import React from 'react';
import { Menu, Mail } from 'lucide-react';

interface MobileHeaderProps {
    onMenuClick: () => void;
    title: string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuClick, title }) => {
    return (
        <header className="fixed top-0 left-0 right-0 h-14 bg-slate-900 text-white flex items-center px-4 z-40 md:hidden">
            <button
                onClick={onMenuClick}
                className="p-2 -ml-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
                <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center ml-3">
                <div className="bg-blue-600 p-1.5 rounded-lg mr-2">
                    <Mail className="w-4 h-4" />
                </div>
                <span className="font-semibold truncate">{title}</span>
            </div>
        </header>
    );
};
