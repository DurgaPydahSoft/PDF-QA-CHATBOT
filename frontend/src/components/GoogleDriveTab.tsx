import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
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
            <div className="flex justify-center mb-8">
                <AnimatePresence mode="wait">
                    {!status?.service_account_exists || !status?.mongodb_connected ? (
                        <motion.div
                            key="status-error"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="flex flex-wrap items-center justify-center gap-3 bg-red-500/10 text-red-600 dark:text-red-400 px-5 py-2.5 rounded-full text-sm font-bold border border-red-500/20 shadow-sm"
                        >
                            <AlertTriangle size={18} />
                            <span>System Issue: {!status?.service_account_exists ? 'Missing service_account.json' : 'Database Offline'}</span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="status-ok"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="flex items-center gap-3 bg-green-500/10 text-green-600 dark:text-green-400 px-5 py-2.5 rounded-full text-sm font-bold border border-green-500/20 shadow-sm"
                        >
                            <div className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </div>
                            <span>Cloud Archive: {status.total_chunks || 0} chunks indexed</span>
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
                />
            </section>

            {/* Sync Button (Below Chat) */}
            <div className="text-center mt-10">
                <button
                    onClick={handleSyncNow}
                    disabled={isSyncing}
                    className="py-3.5 px-10 rounded-2xl border-2 border-primary/20 text-primary font-bold hover:bg-primary/5 hover:border-primary/40 transition-all duration-200 shadow-sm group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                    <span className="flex items-center gap-3">
                        <RefreshCcw size={18} className={`transition-transform ${isSyncing ? 'animate-spin' : 'group-hover:rotate-180 duration-500'}`} />
                        {isSyncing ? 'Synchronizing Cloud Data...' : 'Sync Drive Now'}
                    </span>
                </button>
            </div>
        </div>
    );
};

export default GoogleDriveTab;
