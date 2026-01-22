import React from 'react';
import { motion } from 'framer-motion';
import { Bot, MoveRight, Shield, Search, Cloud } from 'lucide-react';

interface HomeProps {
    onGetStarted: () => void;
}

const Home: React.FC<HomeProps> = ({ onGetStarted }) => {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 sm:px-6 max-w-4xl mx-auto">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center py-2 px-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-full shadow-sm mb-6 border border-slate-200 dark:border-slate-700"
            >
                <Bot size={20} className="text-primary mr-2" />
                <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                    <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-sky-300 rounded-full animate-pulse [animation-delay:0.4s]" />
                </div>
                <span className="ml-3 text-xs font-semibold text-slate-600 dark:text-slate-300">AI-Powered Analysis</span>
            </motion.div>

            <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight bg-gradient-to-r from-slate-900 via-primary to-slate-700 dark:from-white dark:via-sky-400 dark:to-slate-400 bg-clip-text text-transparent mb-4 sm:mb-6 tracking-tight"
            >
                Ask your PDF anything.
            </motion.h1>

            <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-base sm:text-lg text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl mb-8 sm:mb-10"
            >
                Experience the next generation of document intelligence.
                Instant answers, semantic search, and privacy-first design.
            </motion.p>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap justify-center gap-4 mb-12 sm:mb-16"
            >
                <button
                    onClick={onGetStarted}
                    className="group relative px-6 sm:px-8 py-3 sm:py-3.5 bg-primary text-white font-bold rounded-lg sm:rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all text-sm sm:text-base flex items-center gap-2 cursor-pointer"
                >
                    <span>Get Started</span>
                    <MoveRight size={16} className="sm:w-[18px] sm:h-[18px] group-hover:translate-x-1 transition-transform" />
                </button>
            </motion.div>

            {/* About / Features Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full">
                {[
                    {
                        title: "Semantic Search",
                        desc: "Understand context and meaning, not just keywords.",
                        icon: <Search className="text-blue-500" size={24} />,
                        color: "bg-blue-500/10"
                    },
                    {
                        title: "Privacy First",
                        desc: "Your data stays local and secure. Privacy by design.",
                        icon: <Shield className="text-indigo-500" size={24} />,
                        color: "bg-indigo-500/10"
                    },
                    {
                        title: "Cloud Sync",
                        desc: "Connect your Google Drive for a unified cloud archive.",
                        icon: <Cloud className="text-amber-500" size={24} />,
                        color: "bg-amber-500/10"
                    }
                ].map((feat, i) => (
                    <motion.div
                        key={i}
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className="glass-card flex flex-col items-center p-4 sm:p-6 bg-white/40 dark:bg-slate-800/40 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors text-center group rounded-xl sm:rounded-2xl"
                    >
                        <div className={`p-2.5 sm:p-3 ${feat.color} rounded-lg sm:rounded-xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
                            {feat.icon}
                        </div>
                        <h3 className="text-sm sm:text-base font-bold mb-2 text-slate-800 dark:text-slate-100">{feat.title}</h3>
                        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{feat.desc}</p>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Home;
