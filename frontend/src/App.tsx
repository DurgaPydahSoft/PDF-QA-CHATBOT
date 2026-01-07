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
    <div className="min-h-screen flex flex-col items-center relative bg-bg-light dark:bg-bg-dark text-[#1e293b] dark:text-[#f1f5f9] py-16 px-6 lg:py-24">
      {/* Background patterns */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20">
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
            transition={{ duration: 0.5 }}
            className="w-full relative z-10"
          >
            <Home onGetStarted={() => setView('app')} />
          </motion.div>
        ) : (
          <motion.main
            key="app-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 w-full max-w-4xl flex flex-col items-center"
          >
            {/* Top Navigation Bar */}
            <div className="w-full flex justify-between items-center mb-12">
              <button
                onClick={() => setView('home')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/50 dark:bg-white/5 border border-white/20 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10 transition-all group font-bold text-sm"
              >
                <Bot size={20} className="text-primary group-hover:rotate-12 transition-transform" />
                <span>Home</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                  <div className="w-1.5 h-1.5 bg-[#38bdf8] rounded-full animate-pulse [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-[#7dd3fc] rounded-full animate-pulse [animation-delay:0.4s]" />
                </div>
                <span className="text-xs font-bold text-[#64748b] uppercase tracking-widest">Live Session</span>
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-2 bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-md p-1.5 rounded-2xl shadow-sm mb-10 border border-white/20 dark:border-white/10 z-[100] w-fit">
              <button
                className={`py-2.5 px-8 md:px-10 rounded-xl border-none transition-all duration-300 font-bold cursor-pointer whitespace-nowrap text-sm ${activeTab === 'local' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-transparent text-[#64748b] hover:bg-black/5 dark:hover:bg-white/5'}`}
                onClick={() => setActiveTab('local')}
              >
                Local Files
              </button>
              <button
                className={`py-2.5 px-8 md:px-10 rounded-xl border-none transition-all duration-300 font-bold cursor-pointer whitespace-nowrap text-sm ${activeTab === 'drive' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-transparent text-[#64748b] hover:bg-black/5 dark:hover:bg-white/5'}`}
                onClick={() => setActiveTab('drive')}
              >
                Google Drive
              </button>
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
                    transition={{ duration: 0.3 }}
                    className="w-full"
                  >
                    {!isUploaded ? (
                      <motion.div key="upload" className="w-full">
                        <FileUpload onUploadSuccess={handleUploadSuccess} />
                      </motion.div>
                    ) : (
                      <motion.div key="chat" className="flex flex-col items-center w-full">
                        <div className="flex justify-center mb-8">
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex items-center gap-3 bg-green-500/10 text-green-600 dark:text-green-400 px-5 py-2.5 rounded-full text-sm font-bold border border-green-500/20 shadow-sm"
                          >
                            <FileCheck size={18} />
                            <span>Indexed: {chunksCount} document chunks</span>
                          </motion.div>
                        </div>
                        <ChatInterface
                          mode="local"
                          initialSuggestions={initialSuggestions}
                          isVoiceEnabled={isVoiceEnabled}
                          onToggleVoice={toggleVoice}
                        />
                        <div className="text-center mt-10">
                          <button
                            onClick={() => setIsUploaded(false)}
                            className="py-3.5 px-8 rounded-2xl border-2 border-primary/20 text-primary font-bold hover:bg-primary/5 hover:border-primary/40 transition-all duration-200 shadow-sm group"
                          >
                            <span className="flex items-center gap-2">
                              <Upload size={18} className="group-hover:-translate-y-0.5 transition-transform" />
                              Analyze another document
                            </span>
                          </button>
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
                    transition={{ duration: 0.3 }}
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

      <footer className="mt-24 mb-12 lg:mb-8 text-[#94a3b8] text-sm text-center font-medium">
        <p>© 2026 PDF-QA Agent • Built with FastAPI & React</p>
      </footer>
    </div>
  );
};

export default App;
