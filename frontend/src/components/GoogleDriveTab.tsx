import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Cloud } from 'lucide-react';
import { getDriveStatus, syncDriveNow } from '../services/api';
import ChatInterface from './ChatInterface';
import { motion, AnimatePresence } from 'framer-motion';

interface GoogleDriveTabProps {
    isVoiceEnabled: boolean;
    onToggleVoice: () => void;
}

export const GoogleDriveTab: React.FC<GoogleDriveTabProps> = ({ isVoiceEnabled, onToggleVoice }) => {
    const [status, setStatus] = useState<any>(null);
    const [folderId, setFolderId] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);

    const fetchStatus = async () => {
        try {
            const data = await getDriveStatus();
            setStatus(data);
            if (data.folder_id && !folderId) {
                setFolderId(data.folder_id);
            }
        } catch (err) {
            console.error('Failed to fetch drive status', err);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 30000); // Poll status every 30s
        return () => clearInterval(interval);
    }, []);

    const handleSyncNow = async () => {
        setIsSyncing(true);
        try {
            await syncDriveNow();
            // Give it a moment then refresh status
            setTimeout(fetchStatus, 2000);
        } catch (err) {
            alert('Failed to trigger sync');
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="w-full flex flex-col items-center">
            {/* Status Badge (Centered Above Chat) */}
            <div className="flex justify-center mb-6">
                <AnimatePresence mode="wait">
                    {!status?.service_account_exists || !status?.mongodb_connected ? (
                        <motion.div
                            key="status-error"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="flex flex-wrap items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2 rounded-full text-xs font-bold border border-red-200 dark:border-red-900/30 shadow-sm"
                        >
                            <AlertTriangle size={16} />
                            <span>System Issue: {!status?.service_account_exists ? 'Missing service_account.json' : 'Database Offline'}</span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="status-ok"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-sm"
                        >
                            <div className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </div>
                            <span className="flex items-center gap-1">
                                <Cloud size={14} className="text-primary" />
                                Cloud Archive: {status.total_chunks || 0} chunks
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Chat Section */}
            <section className="w-full relative">
                <ChatInterface
                    mode="drive"
                    isVoiceEnabled={isVoiceEnabled}
                    onToggleVoice={onToggleVoice}
                    compact={false}
                />
            </section>

            {/* Sync Button (Below Chat) */}
            <div className="text-center mt-8">
                <button
                    onClick={handleSyncNow}
                    disabled={isSyncing}
                    className="py-2.5 px-6 rounded-xl border border-primary/20 text-primary text-sm font-bold hover:bg-primary/5 hover:border-primary/40 transition-all duration-200 shadow-sm group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white/50 dark:bg-slate-800/50"
                >
                    <span className="flex items-center gap-2">
                        <RefreshCcw size={16} className={`transition-transform ${isSyncing ? 'animate-spin' : 'group-hover:rotate-180 duration-500'}`} />
                        {isSyncing ? 'Synchronizing Cloud Data...' : 'Sync Drive Now'}
                    </span>
                </button>
            </div>
        </div>
    );
};

export default GoogleDriveTab;
