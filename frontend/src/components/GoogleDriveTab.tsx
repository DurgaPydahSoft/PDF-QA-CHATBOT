import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { getDriveStatus, syncDriveNow } from '../services/api';
import ChatInterface from './ChatInterface';

const GoogleDriveTab: React.FC = () => {
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
        <div className="drive-view-content simplified">
            {/* Status Bar / Setup Alerts */}
            <div className="drive-setup-alerts">
                {!status?.service_account_exists && (
                    <div className="setup-alert warning mini">
                        <AlertTriangle size={14} />
                        <span>Missing <code>service_account.json</code></span>
                    </div>
                )}
                {!status?.mongodb_connected && (
                    <div className="setup-alert warning mini">
                        <AlertTriangle size={14} />
                        <span>MongoDB not connected</span>
                    </div>
                )}
            </div>

            {/* Chat Section */}
            <section className="drive-chat-section full-height">
                <ChatInterface
                    mode="drive"
                    onSync={handleSyncNow}
                    syncStatus={status}
                    isSyncing={isSyncing}
                />
            </section>
        </div>
    );
};

export default GoogleDriveTab;
