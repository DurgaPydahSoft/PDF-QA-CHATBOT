import React from 'react';
import { motion } from 'framer-motion';
import { Bot, MoveRight, Shield, Search, Zap } from 'lucide-react';

interface HomeProps {
    onGetStarted: () => void;
}

const Home: React.FC<HomeProps> = ({ onGetStarted }) => {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 max-w-5xl mx-auto">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center py-3 px-6 bg-white dark:bg-[#1e293b] rounded-[1.25rem] shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1)] mb-8 border border-white/20 dark:border-white/10"
            >
                <Bot size={32} className="text-primary mr-2" />
                <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-[#38bdf8] rounded-full animate-pulse [animation-delay:0.2s]" />
                    <div className="w-2 h-2 bg-[#7dd3fc] rounded-full animate-pulse [animation-delay:0.4s]" />
                </div>
            </motion.div>

            <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-5xl md:text-7xl lg:text-8xl font-black leading-[1.05] bg-gradient-to-r from-[#0f172a] via-primary to-[#334155] dark:from-white dark:via-[#38bdf8] dark:to-[#94a3b8] bg-clip-text text-transparent mb-8 tracking-tight"
            >
                Ask your PDF anything.
            </motion.h1>

            <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xl md:text-2xl text-[#64748b] leading-relaxed max-w-2xl mb-12"
            >
                Experience the next generation of document intelligence.
                Instant answers, semantic search, and privacy-first design.
            </motion.p>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap justify-center gap-4 mb-20"
            >
                <button
                    onClick={onGetStarted}
                    className="group relative px-8 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:scale-105 active:scale-95 transition-all text-lg flex items-center gap-3 cursor-pointer"
                >
                    <span>Get Started</span>
                    <MoveRight className="group-hover:translate-x-1 transition-transform" />
                </button>
            </motion.div>

            {/* About / Features Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                {[
                    {
                        title: "Semantic Search",
                        desc: "Understand context and meaning, not just keywords.",
                        icon: <Search className="text-blue-500" size={32} />,
                        color: "bg-blue-500/10"
                    },
                    {
                        title: "Privacy First",
                        desc: "Your data stays local and secure. Privacy by design.",
                        icon: <Shield className="text-indigo-500" size={32} />,
                        color: "bg-indigo-500/10"
                    },
                    {
                        title: "Cloud Sync",
                        desc: "Connect your Google Drive for a unified cloud archive.",
                        icon: <Zap className="text-amber-500" size={32} />,
                        color: "bg-amber-500/10"
                    }
                ].map((feat, i) => (
                    <motion.div
                        key={i}
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className="flex flex-col items-center p-8 rounded-[2.5rem] bg-white/40 dark:bg-white/5 border border-white/10 hover:bg-white/60 dark:hover:bg-white/10 transition-colors shadow-sm text-center group"
                    >
                        <div className={`p-4 ${feat.color} rounded-2xl mb-6 group-hover:scale-110 transition-transform`}>
                            {feat.icon}
                        </div>
                        <h3 className="text-xl font-bold mb-3">{feat.title}</h3>
                        <p className="text-[#64748b] leading-relaxed">{feat.desc}</p>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Home;
