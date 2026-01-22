import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Send, User, Bot, Trash2, Mic, Loader2, Volume2, VolumeX, Cloud, RefreshCcw, AlertTriangle, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { askQuestion, askDriveQuestion, generateAudio } from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// --- Typewriter Component ---
const TypewriterEffect = ({ content, onComplete, onTyping }: { content: string, onComplete?: () => void, onTyping?: (text: string) => void }) => {
    const [displayedContent, setDisplayedContent] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (currentIndex < content.length) {
            const timeout = setTimeout(() => {
                const chunkSize = 5;
                const nextIndex = Math.min(currentIndex + chunkSize, content.length);
                const charSlice = content.slice(currentIndex, nextIndex);

                setDisplayedContent(prev => {
                    const newContent = prev + charSlice;
                    if (onTyping) onTyping(newContent);
                    return newContent;
                });
                setCurrentIndex(nextIndex);
            }, 1);
            return () => clearTimeout(timeout);
        } else {
            if (onComplete) onComplete();
        }
    }, [currentIndex, content, onComplete, onTyping]);

    // If content significantly changes (e.g. error msg replacement), reset
    useEffect(() => {
        if (content !== displayedContent && currentIndex === 0) {
            // New message starting
        } else if (content.length < displayedContent.length) {
            // Reset if content suddenly shrinks (shouldn't happen often but safe)
            setDisplayedContent('');
            setCurrentIndex(0);
        }
    }, [content]);

    return (
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
            {displayedContent}
        </ReactMarkdown>
    );
};


interface Message {
    role: 'user' | 'bot';
    content: string;
    sources?: string[];
}

export interface DriveFile {
    id: string;
    name: string;
    modified_time?: string;
}

export interface DriveStatus {
    service_account_exists: boolean;
    mongodb_connected: boolean;
    total_files: number;
    folder_id: string;
    last_sync?: string;
    files?: DriveFile[];
    connection_info?: {
        email: string;
        project_id: string;
        scopes: string[];
        folder_name?: string;
    };
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
    onUserInteraction?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
    mode = 'local',
    initialSuggestions = [],
    isVoiceEnabled,
    onToggleVoice,
    compact = false,
    driveStatus,
    isSyncing = false,
    onSyncDrive,
    onUserInteraction
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
    const [showDrivePanel, setShowDrivePanel] = useState(true); // Toggle for mobile/desktop
    const [hasInteracted, setHasInteracted] = useState(false); // Track if user has sent a message
    const [isTyping, setIsTyping] = useState(false); // Track if typewriter is active
    const [isInputExpanded, setIsInputExpanded] = useState(true); // Track if input bar is expanded

    const scrollRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const currentTypewriterTextRef = useRef<string>('');

    // Toggle input visibility based on activity
    useEffect(() => {
        if (isLoading || isTyping) {
            setIsInputExpanded(false);
        } else {
            setIsInputExpanded(true);
        }
    }, [isLoading, isTyping]);

    // Auto-close sidebar and expand view on first interaction
    useEffect(() => {
        if (messages.length > 1 && !hasInteracted) {
            setHasInteracted(true);
            if (mode === 'drive') {
                setShowDrivePanel(false);
            }
        }
    }, [messages, hasInteracted, mode]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]); // Scroll on typing updates too

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

    const handleStop = () => {
        if (isLoading && abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsLoading(false);
        } else if (isTyping) {
            // Stop the typewriter immediately
            setIsTyping(false);
            // Update the last message to be the truncated text
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg && lastMsg.role === 'bot') {
                    lastMsg.content = currentTypewriterTextRef.current;
                }
                return newMessages;
            });
        }
    };

    const handleSend = async (text: string = input) => {
        const messageToSend = text.trim();
        if (!messageToSend || isLoading || isTyping) return;

        const userMessage: Message = { role: 'user', content: messageToSend };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setSuggestions([]);
        setIsLoading(true);
        setIsTyping(false);
        currentTypewriterTextRef.current = '';

        if (onUserInteraction) onUserInteraction();

        // Create new AbortController
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const apiCall = mode === 'drive' ? askDriveQuestion : askQuestion;
            const data = await apiCall(messageToSend, controller.signal);
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

            // Start typing effect
            setIsTyping(true);
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
            if (err.name === 'CanceledError' || err.code === "ERR_CANCELED") {
                console.log("Request canceled");
            } else {
                console.error(err);
                const detail = err.response?.data?.detail || 'Connection to backend lost.';
                setMessages(prev => [...prev, { role: 'bot', content: `Error: ${detail}` }]);
            }
        } finally {
            if (abortControllerRef.current === controller) {
                setIsLoading(false);
                abortControllerRef.current = null;
            }
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
                <button
                    onClick={() => setShowDrivePanel(!showDrivePanel)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold border transition-colors ${showDrivePanel ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'}`}
                >
                    <Cloud size={12} />
                    <span>{driveStatus.total_files} files</span>
                </button>
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

    const DriveSidePanel = () => {
        if (!driveStatus) return null;

        return (
            <div className={`border-l border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 backdrop-blur-sm flex flex-col h-full overflow-hidden transition-all duration-200 ease-out ${showDrivePanel ? 'w-64 opacity-100' : 'w-0 opacity-0'}`}>
                <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60 min-w-[16rem]">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Connection Details</h3>

                    <div className="space-y-3">
                        <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
                            <div className="text-[10px] text-slate-400 font-semibold mb-1">SERVICE ACCOUNT</div>
                            <div className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate" title={driveStatus.connection_info?.email}>
                                {driveStatus.connection_info?.email || "Unknown"}
                            </div>
                        </div>

                        <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
                            <div className="text-[10px] text-slate-400 font-semibold mb-1">PROJECT ID</div>
                            <div className="text-xs font-mono text-slate-700 dark:text-slate-300">
                                {driveStatus.connection_info?.project_id || "Unknown"}
                            </div>
                        </div>

                        <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
                            <div className="text-[10px] text-slate-400 font-semibold mb-1">FOLDER ID</div>
                            <div className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate" title={driveStatus.folder_id}>
                                {driveStatus.folder_id}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 sticky top-0 bg-transparent">Indexed Files ({driveStatus.total_files})</h3>
                    <div className="space-y-2">
                        {driveStatus.files?.map((file, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 shadow-sm hover:border-primary/50 transition-colors group">
                                <div className="p-1.5 bg-red-50 text-red-500 rounded">
                                    <Cloud size={14} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate" title={file.name}>{file.name}</div>
                                    <div className="text-[10px] text-slate-400 truncate">{file.modified_time?.split('T')[0]}</div>
                                </div>
                            </div>
                        ))}
                        {(!driveStatus.files || driveStatus.files.length === 0) && (
                            <div className="text-center py-8 text-slate-400 text-xs">
                                No files synced yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={`glass-card flex w-full overflow-hidden transition-all duration-500 ease-in-out ${compact ? 'h-full rounded-2xl' : `${hasInteracted ? 'h-[85vh]' : 'h-[65vh] md:h-[70vh]'} rounded-2xl shadow-xl border border-slate-200/60 dark:border-slate-700/60`}`}>
            <div className="flex flex-col flex-1 min-w-0 min-h-0 h-full relative">
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
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 md:p-4 flex flex-col gap-4 scroll-smooth pb-[28rem]">
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
                                        // Use Typewriter only for the latest message if it's from bot and we just loaded it
                                        // But for simplicity, we can apply it to the last message if it's a bot
                                        (idx === messages.length - 1 && !isLoading && isTyping) ? (
                                            <TypewriterEffect
                                                content={msg.content}
                                                onComplete={() => setIsTyping(false)}
                                                onTyping={(text) => currentTypewriterTextRef.current = text}
                                            />
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
                                        )
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
            </div>

            {/* RIGHT SIDEBAR for Drive Mode */}
            {mode === 'drive' && <DriveSidePanel />}

            {/* Floating Input Portal - Fixed Footer Style */}
            {createPortal(
                <div className="fixed bottom-0 left-0 right-0 z-[100] flex flex-col items-center pointer-events-none">
                    <div className={`w-full max-w-270 h-35 pointer-events-auto flex flex-col px-4 md:px-6 transition-all duration-200 ease-out ${(mode === 'drive' && showDrivePanel && driveStatus) ? 'md:pr-[18rem]' : ''}`}>

                        {/* Input Footer Card */}
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{
                                y: isInputExpanded ? 0 : '30%',
                                opacity: isInputExpanded ? 1 : 0.9
                            }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            onClick={() => !isInputExpanded && setIsInputExpanded(true)}
                            className={`bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border-t border-x border-white/20 dark:border-slate-700/50 p-2 pb-6 rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] ring-1 ring-black/5 dark:ring-white/10 flex flex-col gap-2 transition-all duration-300 ${!isInputExpanded ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800' : ''}`}
                        >
                            {/* Suggestions inside card to prevent overlap */}
                            <AnimatePresence>
                                {(!isLoading && !isTyping && suggestions.length > 0) && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex gap-2 overflow-x-auto w-full px-1 py-1 no-scrollbar justify-start md:justify-center"
                                    >
                                        {suggestions.map((suggestion, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleSend(suggestion)}
                                                className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 py-1.5 px-3 rounded-full text-xs font-medium cursor-pointer transition-all hover:border-primary hover:text-primary hover:bg-primary/5 shadow-sm whitespace-nowrap flex-shrink-0"
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex gap-2 items-center bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all">
                                <button
                                    onClick={handleMicClick}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 ${isListening ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-200' : 'bg-transparent text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                    title={isListening ? "Stop Listening" : "Start Voice Input"}
                                >
                                    {isListening ? <Loader2 size={20} className="animate-spin" /> : <Mic size={20} />}
                                </button>

                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder={isListening ? "Listening..." : "Ask me anything about your documents..."}
                                    className="flex-1 bg-transparent border-none p-2 outline-none text-slate-800 dark:text-slate-200 text-sm placeholder:text-slate-400 font-medium"
                                />

                                <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

                                <button
                                    onClick={() => (isLoading || isTyping) ? handleStop() : handleSend()}
                                    disabled={(!isLoading && !isTyping) && !input.trim()}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 shadow-lg ${(input.trim() || isLoading || isTyping)
                                        ? 'bg-primary text-white hover:bg-primary-dark shadow-primary/30 hover:scale-105 active:scale-95'
                                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                        }`}
                                >
                                    {(isLoading || isTyping) ? <Square size={14} fill="currentColor" /> : <Send size={18} className="ml-0.5" />}
                                </button>
                            </div>

                            <div className="flex flex-col gap-1 mt-1">
                                <div className="text-[10px] text-center text-slate-500/80 dark:text-slate-400/80 font-medium">
                                    AI can make mistakes. Check important info.
                                </div>
                                <div className="text-[9px] text-center text-slate-400/50 dark:text-slate-600/50 font-mono uppercase tracking-widest">
                                    System v2.6.0 • Secure Connection Established
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default ChatInterface;
