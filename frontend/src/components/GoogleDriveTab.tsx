import React, { useState, useEffect } from 'react';
import { getDriveStatus, syncDriveNow } from '../services/api';
import ChatInterface, { type DriveStatus } from './ChatInterface';
import { motion } from 'framer-motion';

interface GoogleDriveTabProps {
    isVoiceEnabled: boolean;
    onToggleVoice: () => void;
}

export const GoogleDriveTab: React.FC<GoogleDriveTabProps> = ({ isVoiceEnabled, onToggleVoice }) => {
    const [status, setStatus] = useState<DriveStatus | undefined>(undefined);
    const [isSyncing, setIsSyncing] = useState(false);

    const fetchStatus = async () => {
        try {
            const data = await getDriveStatus();
            setStatus(data);
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
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full h-full"
        >
            {/* The ChatInterface handles the specific drive UI internally now */}
            <ChatInterface
                mode="drive"
                isVoiceEnabled={isVoiceEnabled}
                onToggleVoice={onToggleVoice}
                driveStatus={status}
                isSyncing={isSyncing}
                onSyncDrive={handleSyncNow}
            />
        </motion.div>
    );
};

export default GoogleDriveTab;
