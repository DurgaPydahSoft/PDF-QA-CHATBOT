import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import ChatInterface from './components/ChatInterface';
import GoogleDriveTab from './components/GoogleDriveTab';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, FileCheck, Upload } from 'lucide-react';
import Home from './components/Home';

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'app'>('home');
  const [activeTab, setActiveTab] = useState<'local' | 'drive'>('local');
  const [isUploaded, setIsUploaded] = useState(false);
  const [chunksCount, setChunksCount] = useState(0);
  const [initialSuggestions, setInitialSuggestions] = useState<string[]>([]);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);

  const handleUploadSuccess = (chunks: number, suggestions: string[]) => {
    setChunksCount(chunks);
    setInitialSuggestions(suggestions);
    setIsUploaded(true);
  };

  const toggleVoice = () => setIsVoiceEnabled(prev => !prev);

  return (
    <div className="min-h-screen flex flex-col items-center relative bg-bg-light dark:bg-bg-dark text-slate-800 dark:text-slate-100 py-6 px-4 md:px-6 lg:py-10 selection:bg-primary/20 selection:text-primary-dark">
      {/* Background patterns */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20 dark:opacity-10">
        <div className="absolute rounded-full blur-[100px] top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#38bdf8]" />
        <div className="absolute rounded-full blur-[100px] top-[20%] right-[-5%] w-[30%] h-[50%] bg-[#60a5fa]" />
        <div className="absolute rounded-full blur-[100px] bottom-[-10%] left-[20%] w-[50%] h-[30%] bg-[#818cf8]" />
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
            className="relative z-10 w-full max-w-6xl flex flex-col items-center"
          >
            {/* Top Navigation Bar */}
            <div className="w-full flex justify-between items-center mb-6 md:mb-8 glass px-4 py-2.5 rounded-2xl">
              <button
                onClick={() => setView('home')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors group font-semibold text-sm"
              >
                <Bot size={18} className="text-primary group-hover:rotate-12 transition-transform" />
                <span className="hidden sm:inline">Back to Home</span>
              </button>

              <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
                <button
                  className={`py-1.5 px-4 rounded-lg text-xs font-semibold transition-all duration-200 ${activeTab === 'local' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  onClick={() => setActiveTab('local')}
                >
                  Local Files
                </button>
                <button
                  className={`py-1.5 px-4 rounded-lg text-xs font-semibold transition-all duration-200 ${activeTab === 'drive' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  onClick={() => setActiveTab('drive')}
                >
                  Google Drive
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">Online</span>
              </div>
            </div>

            {/* Tab Content */}
            <div className="w-full">
              <AnimatePresence mode="wait">
                {activeTab === 'local' ? (
                  <motion.div
                    key="local-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="w-full"
                  >
                    {!isUploaded ? (
                      <motion.div key="upload" className="w-full flex justify-center">
                        <FileUpload onUploadSuccess={handleUploadSuccess} />
                      </motion.div>
                    ) : (
                      <motion.div key="chat" className="flex flex-col items-center w-full">
                        <div className="w-full flex justify-end mb-4">
                          <button
                            onClick={() => setIsUploaded(false)}
                            className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline opacity-80 hover:opacity-100 transition-opacity"
                          >
                            <Upload size={14} />
                            Analyze New File
                          </button>
                        </div>

                        <div className="w-full flex gap-4 md:gap-6 flex-col md:flex-row h-[80vh] md:h-[calc(100vh-140px)]">
                          {/* Sidebar Info - Hidden on mobile, simplified on desktop */}
                          <div className="hidden md:flex flex-col gap-4 w-64 shrink-0">
                            <div className="glass-card p-4 flex flex-col gap-2">
                              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                                <FileCheck size={16} />
                                <span>Document Status</span>
                              </div>
                              <div className="text-2xl font-bold text-slate-700 dark:text-slate-200">
                                {chunksCount}
                              </div>
                              <div className="text-xs text-slate-500">chunks indexed successfully</div>
                            </div>
                            <div className="glass-card p-4 flex-1">
                              <h3 className="font-bold text-sm mb-3 text-slate-700 dark:text-slate-200">Suggested Queries</h3>
                              <div className="flex flex-col gap-2">
                                {initialSuggestions.slice(0, 5).map((s, i) => (
                                  <div key={i} className="text-xs text-slate-600 dark:text-slate-400 p-2 bg-white/50 dark:bg-white/5 rounded-lg border border-white/50 dark:border-white/5">
                                    {s}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Main Chat Area */}
                          <div className="flex-1 h-full">
                            <ChatInterface
                              mode="local"
                              initialSuggestions={initialSuggestions}
                              isVoiceEnabled={isVoiceEnabled}
                              onToggleVoice={toggleVoice}
                              compact={true}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="drive-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="w-full"
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

      <footer className="mt-8 text-slate-400 text-xs text-center font-medium">
        <p>© 2026 PDF-QA Agent • Built with FastAPI & React</p>
      </footer>
    </div>
  );
};

export default App;
