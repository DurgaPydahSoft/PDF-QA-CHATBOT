import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Trash2, Mic, Loader2, Volume2, VolumeX, Cloud, RefreshCcw, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { askQuestion, askDriveQuestion, generateAudio } from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
    role: 'user' | 'bot';
    content: string;
    sources?: string[];
}

export interface DriveStatus {
    service_account_exists: boolean;
    mongodb_connected: boolean;
    total_files: number;
    folder_id: string;
    last_sync?: string;
}

interface ChatInterfaceProps {
    mode?: 'local' | 'drive';
    initialSuggestions?: string[];
    isVoiceEnabled: boolean;
    onToggleVoice: () => void;
    compact?: boolean;
    // Drive specific props
    driveStatus?: DriveStatus;
    isSyncing?: boolean;
    onSyncDrive?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
    mode = 'local',
    initialSuggestions = [],
    isVoiceEnabled,
    onToggleVoice,
    compact = false,
    driveStatus,
    isSyncing = false,
    onSyncDrive
}) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'bot',
            content: mode === 'local'
                ? "I have knowledge of your document now! Feel free to ask me any questions you have. 📚✨"
                : "I am connected to your Google Drive archive! How can I help you today? ☁️🤖"
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>(initialSuggestions);
    const [isListening, setIsListening] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const playAudio = (base64Audio: string) => {
        try {
            const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
            audio.play().catch(e => console.error("Audio play failed", e));
        } catch (e) {
            console.error("Audio init failed", e);
        }
    };

    const startListening = () => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onstart = () => setIsListening(true);

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                // Optional: Auto-send could be enabled here
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current.start();
        } else {
            alert("Your browser does not support voice input. Please use Chrome or Edge.");
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    const handleMicClick = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    const handleSend = async (text: string = input) => {
        const messageToSend = text.trim();
        if (!messageToSend || isLoading) return;

        const userMessage: Message = { role: 'user', content: messageToSend };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setSuggestions([]);
        setIsLoading(true);

        try {
            const apiCall = mode === 'drive' ? askDriveQuestion : askQuestion;
            const data = await apiCall(messageToSend);
            const fullResponse = data.answer;

            // Extract suggestions if present
            const parts = fullResponse.split(/Suggestions:/i);
            let mainAnswer = parts[0].trim();

            // Cleanup: Remove trailing ** which acts as a separator in some LLM outputs
            mainAnswer = mainAnswer.replace(/\*\*+$/, '').trim();
            const suggestionPart = parts[1] || '';

            // Parse suggestions (looking for 1. Q, 2. Q etc or just lines)
            const extractedSuggestions = suggestionPart
                .split(/\d\.\s+/)
                .map((s: string) => s.trim())
                .filter((s: string) => s.length > 5 && s.length < 100);

            setMessages(prev => [...prev, { role: 'bot', content: mainAnswer, sources: data.sources }]);
            setSuggestions(extractedSuggestions);

            if (isVoiceEnabled) {
                // Async TTS fetch
                generateAudio(mainAnswer)
                    .then(res => {
                        if (res.audio_base64) playAudio(res.audio_base64);
                    })
                    .catch(e => console.error("TTS Error:", e));
            }
        } catch (err: any) {
            console.error(err);
            const detail = err.response?.data?.detail || 'Connection to backend lost.';
            setMessages(prev => [...prev, { role: 'bot', content: `Error: ${detail}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Components ---

    const renderDriveStatus = () => {
        if (!driveStatus) return null;

        const isError = !driveStatus.service_account_exists || !driveStatus.mongodb_connected;

        if (isError) {
            return (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-200">
                    <AlertTriangle size={12} />
                    <span className="hidden sm:inline">Config Error</span>
                </div>
            );
        }

        return (
            <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-100">
                    <Cloud size={12} />
                    <span>{driveStatus.total_files} files</span>
                </div>
                {onSyncDrive && (
                    <button
                        onClick={onSyncDrive}
                        disabled={isSyncing}
                        className={`p-1.5 rounded-lg transition-all ${isSyncing ? 'bg-primary/10 text-primary' : 'bg-transparent text-slate-400 hover:bg-slate-100 hover:text-primary'}`}
                        title="Sync with Google Drive"
                    >
                        <RefreshCcw size={16} className={`${isSyncing ? 'animate-spin' : ''}`} />
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className={`glass-card flex flex-col w-full overflow-hidden ${compact ? 'h-full rounded-2xl' : 'h-[65vh] md:h-[70vh] rounded-2xl shadow-xl border border-slate-200/60 dark:border-slate-700/60'}`}>
            {/* Header */}
            <div className="p-3 md:px-4 md:py-3 border-b border-slate-200/60 dark:border-slate-800/60 flex justify-between items-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 ${mode === 'drive' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-primary/10 text-primary'} rounded-xl flex items-center justify-center`}>
                        {mode === 'drive' ? <Cloud size={18} /> : <Bot size={18} />}
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-slate-800 dark:text-white m-0 leading-tight">
                            {mode === 'drive' ? 'Drive Assistant' : 'PDF Assistant'}
                        </h3>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1.5 font-medium">
                            <span className="flex items-center gap-1 text-emerald-500">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                Online
                            </span>
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 items-center">
                    {/* Drive Specific Controls in Header */}
                    {mode === 'drive' && renderDriveStatus()}

                    <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

                    <button
                        onClick={onToggleVoice}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${isVoiceEnabled ? 'bg-primary/10 text-primary' : 'bg-transparent text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        title={isVoiceEnabled ? "Mute Voice Response" : "Enable Voice Response"}
                    >
                        {isVoiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    </button>

                    <button
                        onClick={() => { setMessages([]); setSuggestions([]); }}
                        className="p-1.5 rounded-lg bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="Clear Chat"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 md:p-4 flex flex-col gap-4 scroll-smooth">
                {messages.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-50">
                        {mode === 'drive' ? <Cloud size={48} className="text-slate-300 mb-4" /> : <Bot size={48} className="text-slate-300 mb-4" />}
                        <p className="text-sm text-slate-500">Start a conversation...</p>
                    </div>
                )}

                <AnimatePresence mode="popLayout">
                    {messages.map((msg, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={`flex items-end gap-2 max-w-[95%] text-sm ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
                        >
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-gradient-to-br from-primary to-primary-dark' : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700'}`}>
                                {msg.role === 'user' ? <User size={14} className="text-white" /> : <Bot size={14} className="text-slate-500 dark:text-slate-400" />}
                            </div>

                            <div className={`py-2.5 px-4 rounded-2xl leading-relaxed shadow-sm ${msg.role === 'user'
                                ? 'bg-primary text-white rounded-br-none shadow-primary/20'
                                : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-bl-none dark:text-slate-200'
                                } markdown-content`}>
                                {msg.role === 'user' ? (
                                    msg.content
                                ) : (
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            ul: ({ node, ...props }: any) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                                            ol: ({ node, ...props }: any) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                                            li: ({ node, ...props }: any) => <li className="mb-0.5" {...props} />,
                                            p: ({ node, ...props }: any) => <p className="mb-2 last:mb-0" {...props} />,
                                            h1: ({ node, ...props }: any) => <h1 className="text-lg font-bold mb-2 mt-1" {...props} />,
                                            h2: ({ node, ...props }: any) => <h2 className="text-base font-bold mb-2 mt-1" {...props} />,
                                            h3: ({ node, ...props }: any) => <h3 className="text-sm font-bold mb-1 mt-1" {...props} />,
                                            strong: ({ node, ...props }: any) => <strong className="font-bold text-slate-900 dark:text-slate-100" {...props} />,
                                            code: ({ node, ...props }: any) => <code className="bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded text-xs font-mono" {...props} />,
                                            table: ({ node, ...props }: any) => (
                                                <div className="overflow-x-auto my-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                                    <table className="w-full text-left text-sm border-collapse" {...props} />
                                                </div>
                                            ),
                                            thead: ({ node, ...props }: any) => <thead className="bg-slate-50 dark:bg-slate-900/50" {...props} />,
                                            tbody: ({ node, ...props }: any) => <tbody className="divide-y divide-slate-100 dark:divide-slate-800" {...props} />,
                                            tr: ({ node, ...props }: any) => <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors" {...props} />,
                                            th: ({ node, ...props }: any) => <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap" {...props} />,
                                            td: ({ node, ...props }: any) => <td className="px-4 py-3 text-slate-600 dark:text-slate-300 align-top" {...props} />,
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                )}
                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/50 flex flex-wrap gap-1.5 items-center">
                                        <span className="text-[10px] text-slate-400 font-bold mr-1 uppercase tracking-wider">Ref:</span>
                                        {msg.sources.map((src, i) => (
                                            <span key={i} className="text-[10px] bg-white/50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 flex items-center gap-1 select-all hover:border-primary/30 transition-colors">
                                                {src}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}

                    {isLoading && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end gap-2 self-start">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                                <Bot size={14} className="text-slate-500 dark:text-slate-400" />
                            </div>
                            <div className="py-3 px-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-bl-none flex items-center gap-1.5 shadow-sm">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-typing" />
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-typing [animation-delay:0.2s]" />
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-typing [animation-delay:0.4s]" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Suggestions (Horizontal Scroll) */}
            {
                !isLoading && suggestions.length > 0 && (
                    <div className="px-4 pb-2 border-t border-transparent">
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-wrap gap-2 py-2"
                        >
                            {suggestions.map((suggestion, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSend(suggestion)}
                                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 py-1.5 px-3 rounded-full text-xs font-medium cursor-pointer transition-all hover:border-primary hover:text-primary hover:bg-primary/5 text-left shadow-sm"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </motion.div>
                    </div>
                )
            }

            {/* Input Area */}
            <div className="p-3 md:px-4 md:py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800">
                <div className="flex gap-2 items-center bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all shadow-inner">
                    <button
                        onClick={handleMicClick}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 ${isListening ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-200' : 'bg-transparent text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                        title={isListening ? "Stop Listening" : "Start Voice Input"}
                    >
                        {isListening ? <Loader2 size={18} className="animate-spin" /> : <Mic size={18} />}
                    </button>

                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={isListening ? "Listening..." : "Ask something..."}
                        className="flex-1 bg-transparent border-none p-1 outline-none text-slate-800 dark:text-slate-200 text-sm placeholder:text-slate-400 font-medium"
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isLoading}
                        className={`bg-primary text-white w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 shadow-md shadow-primary/20 ${input.trim() && !isLoading ? 'opacity-100 scale-100 hover:scale-105 active:scale-95' : 'opacity-50 scale-95 cursor-not-allowed'}`}
                    >
                        <Send size={16} />
                    </button>
                </div>
                <div className="text-[10px] text-center text-slate-300 dark:text-slate-600 mt-2 font-medium">
                    AI can make mistakes. Check important info.
                </div>
            </div>
        </div >
    );
};

export default ChatInterface;
