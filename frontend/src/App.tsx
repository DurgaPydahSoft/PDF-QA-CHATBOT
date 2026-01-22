import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import ChatInterface from './components/ChatInterface';
import GoogleDriveTab from './components/GoogleDriveTab';
import AgentAvatar from './components/AgentAvatar';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, FileCheck, Upload, HardDrive, LayoutGrid } from 'lucide-react';
import Home from './components/Home';

const App: React.FC = () => {
    const [view, setView] = useState<'home' | 'app'>('home');
    const [activeTab, setActiveTab] = useState<'local' | 'drive'>('local');
    const [isUploaded, setIsUploaded] = useState(false);
    const [chunksCount, setChunksCount] = useState(0);
    const [initialSuggestions, setInitialSuggestions] = useState<string[]>([]);
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
    const [agentMode, setAgentMode] = useState<'idle' | 'processing' | 'interacting' | 'speaking'>('idle');

    const handleUploadSuccess = (chunks: number, suggestions: string[]) => {
        setAgentMode('processing');
        setTimeout(() => {
            setChunksCount(chunks);
            setInitialSuggestions(suggestions);
            setIsUploaded(true);
            setAgentMode('speaking');
            setTimeout(() => setAgentMode('idle'), 3000);
        }, 2000);
    };

    const toggleVoice = () => setIsVoiceEnabled(prev => !prev);

    return (
        <div className="min-h-screen flex flex-col items-center relative bg-bg-light dark:bg-bg-dark text-slate-800 dark:text-slate-100 py-4 sm:py-6 px-4 sm:px-6 lg:py-10 selection:bg-primary/20 selection:text-primary-dark overflow-hidden">
            {/* Background patterns */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-20 dark:opacity-10">
                <div className="absolute rounded-full blur-[100px] top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#38bdf8]" />
                <div className="absolute rounded-full blur-[100px] top-[20%] right-[-5%] w-[30%] h-[50%] bg-[#60a5fa]" />
                <div className="absolute rounded-full blur-[100px] bottom-[-10%] left-[20%] w-[50%] h-[30%] bg-[#818cf8]" />
                {/* Grid Overlay */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            </div>

            <AnimatePresence mode="wait">
                {view === 'home' ? (
                    <motion.div
                        key="home-view"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4 }}
                        className="w-full relative z-10"
                    >
                        <Home onGetStarted={() => setView('app')} />
                    </motion.div>
                ) : (
                    <motion.main
                        key="app-view"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="relative z-10 w-full max-w-5xl flex flex-col items-center mt-2 flex-1 min-h-0"
                    >
                        {/* Top Navigation & Agent Bar */}
                        <div className="w-full flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-3 sm:gap-4 glass px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl relative overflow-hidden">
                            {/* Agent Integration in Header */}
                            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-start">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="relative">
                                        <AgentAvatar mode={agentMode} size="sm" />
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-primary/40 blur-[2px] rounded-full" />
                                    </div>

                                    <div className="flex flex-col">
                                        <h2 className="text-xs sm:text-sm font-bold bg-clip-text text-transparent bg-linear-to-r from-slate-700 to-slate-500 dark:from-white dark:to-slate-400">
                                            DocBot AI
                                        </h2>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                                            <span className={`w-1.5 h-1.5 rounded-full ${agentMode === 'idle' ? 'bg-green-500' : 'bg-primary'} animate-pulse`} />
                                            <span>
                                                {agentMode === 'idle' && !isUploaded && "IDLE // READY"}
                                                {agentMode === 'idle' && isUploaded && `INDEXED // ${chunksCount}`}
                                                {agentMode === 'processing' && "PROCESSING..."}
                                                {agentMode === 'interacting' && "AWAITING INPUT"}
                                                {agentMode === 'speaking' && "RESPONSE READY"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile Exit Button */}
                                <button
                                    onClick={() => setView('home')}
                                    className="sm:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors group text-xs font-medium text-slate-500"
                                >
                                    <Bot size={14} className="text-slate-400 group-hover:text-primary transition-colors" />
                                    <span>Exit</span>
                                </button>
                            </div>

                            {/* Center Tabs */}
                            <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700/50 relative w-full sm:w-auto">
                                <button
                                    className={`relative flex items-center gap-1.5 sm:gap-2 py-1.5 px-3 sm:px-4 rounded-md sm:rounded-lg text-xs font-bold transition-colors flex-1 sm:flex-none sm:w-28 md:w-32 justify-center ${activeTab === 'local' ? 'text-slate-800 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                    onClick={() => setActiveTab('local')}
                                >
                                    {activeTab === 'local' && (
                                        <motion.div
                                            layoutId="activeTabHeader"
                                            className="absolute inset-0 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-md sm:rounded-lg"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                                        <HardDrive size={12} className="sm:w-5 sm:h-5" />
                                        <span className="hidden xs:inline">Local</span>
                                        <span className="xs:hidden">Local</span>
                                    </span>
                                </button>
                                <button
                                    className={`relative flex items-center gap-1.5 sm:gap-2 py-1.5 px-3 sm:px-4 rounded-md sm:rounded-lg text-xs font-bold transition-colors flex-1 sm:flex-none sm:w-28 md:w-32 justify-center ${activeTab === 'drive' ? 'text-slate-800 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                    onClick={() => setActiveTab('drive')}
                                >
                                    {activeTab === 'drive' && (
                                        <motion.div
                                            layoutId="activeTabHeader"
                                            className="absolute inset-0 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-md sm:rounded-lg"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                                        <LayoutGrid size={12} className="sm:w-5 sm:h-5" />
                                        <span>Cloud</span>
                                    </span>
                                </button>
                            </div>

                            {/* Desktop Right Actions */}
                            <button
                                onClick={() => setView('home')}
                                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors group text-xs font-medium text-slate-500"
                            >
                                <Bot size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
                                <span>Exit</span>
                            </button>
                        </div>

                        {/* Main Content Area */}
                        <div className="w-full h-[calc(100vh-180px)] sm:h-[calc(100vh-200px)]">
                            <AnimatePresence mode="wait">
                                {activeTab === 'local' ? (
                                    <motion.div
                                        key="local-tab"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ duration: 0.3 }}
                                        className="h-full flex flex-col"
                                    >
                                        {!isUploaded ? (
                                            <div className="h-full flex flex-col justify-center">
                                                <FileUpload onUploadSuccess={handleUploadSuccess} />
                                            </div>
                                        ) : (
                                            <div className="h-full flex flex-col">
                                                <div className="flex justify-between items-center mb-3 sm:mb-4 px-1">
                                                    <h3 className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                                        <FileCheck size={16} className="sm:w-5 sm:h-5 text-green-500" />
                                                        <span>Analysis Active</span>
                                                    </h3>
                                                    <button
                                                        onClick={() => setIsUploaded(false)}
                                                        className="text-xs font-semibold text-primary flex items-center gap-1.5 hover:underline opacity-80 hover:opacity-100 transition-opacity px-2 py-1 rounded-lg hover:bg-primary/5"
                                                    >
                                                        <Upload size={12} className="sm:w-5 sm:h-5" />
                                                        <span className="hidden sm:inline">New Upload</span>
                                                        <span className="sm:hidden">New</span>
                                                    </button>
                                                </div>

                                                <div className="flex-1 min-h-0">
                                                    <ChatInterface
                                                        mode="local"
                                                        initialSuggestions={initialSuggestions}
                                                        isVoiceEnabled={isVoiceEnabled}
                                                        onToggleVoice={toggleVoice}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="drive-tab"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3 }}
                                        className="h-full"
                                    >
                                        <GoogleDriveTab
                                            isVoiceEnabled={isVoiceEnabled}
                                            onToggleVoice={toggleVoice}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.main>
                )}
            </AnimatePresence>


        </div>
    );
};

export default App;
