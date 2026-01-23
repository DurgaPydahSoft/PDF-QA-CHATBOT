import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Trash2, Mic, Loader2, Volume2, VolumeX, Cloud, RefreshCcw, AlertTriangle, Square, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { askQuestion, askDriveQuestion, generateAudio, type ConversationMessage } from '../services/api';
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
                ul: ({ node, ...props }: any) => <ul className="list-disc pl-3 sm:pl-4 mb-1 sm:mb-2 space-y-0.5 sm:space-y-1" {...props} />,
                ol: ({ node, ...props }: any) => <ol className="list-decimal pl-3 sm:pl-4 mb-1 sm:mb-2 space-y-0.5 sm:space-y-1" {...props} />,
                li: ({ node, ...props }: any) => <li className="mb-0.5 text-xs sm:text-sm" {...props} />,
                p: ({ node, ...props }: any) => <p className="mb-1.5 sm:mb-2 last:mb-0 text-xs sm:text-sm" {...props} />,
                h1: ({ node, ...props }: any) => <h1 className="text-sm sm:text-lg font-bold mb-1.5 sm:mb-2 mt-0.5 sm:mt-1" {...props} />,
                h2: ({ node, ...props }: any) => <h2 className="text-xs sm:text-base font-bold mb-1.5 sm:mb-2 mt-0.5 sm:mt-1" {...props} />,
                h3: ({ node, ...props }: any) => <h3 className="text-xs sm:text-sm font-bold mb-1 sm:mb-1 mt-0.5 sm:mt-1" {...props} />,
                strong: ({ node, ...props }: any) => <strong className="font-bold text-slate-900 dark:text-slate-100" {...props} />,
                code: ({ node, ...props }: any) => <code className="bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded text-[10px] sm:text-xs font-mono" {...props} />,
                table: ({ node, ...props }: any) => (
                    <div className="overflow-x-auto my-2 sm:my-4 rounded-lg border border-slate-200 dark:border-slate-700">
                        <table className="w-full text-left text-xs sm:text-sm border-collapse" {...props} />
                    </div>
                ),
                thead: ({ node, ...props }: any) => <thead className="bg-slate-50 dark:bg-slate-900/50" {...props} />,
                tbody: ({ node, ...props }: any) => <tbody className="divide-y divide-slate-100 dark:divide-slate-800" {...props} />,
                tr: ({ node, ...props }: any) => <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors" {...props} />,
                th: ({ node, ...props }: any) => <th className="px-2 sm:px-4 py-1.5 sm:py-3 font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap" {...props} />,
                td: ({ node, ...props }: any) => <td className="px-2 sm:px-4 py-1.5 sm:py-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 align-top" {...props} />,
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
    // Initialize sidebar state: hidden on mobile by default, visible on desktop
    const [showDrivePanel, setShowDrivePanel] = useState(() => {
        // Check if we're on mobile initially
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 768; // md breakpoint - only show on desktop
        }
        return false; // Default to hidden (mobile-first)
    });
    const [hasInteracted, setHasInteracted] = useState(false); // Track if user has sent a message
    const [isTyping, setIsTyping] = useState(false); // Track if typewriter is active

    const scrollRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const currentTypewriterTextRef = useRef<string>('');

    // Ensure messages are reset on component mount (page refresh)
    useEffect(() => {
        // Reset messages to initial state on mount
        // This ensures chat history is cleared on page refresh
        setMessages([
            {
                role: 'bot',
                content: mode === 'local'
                    ? "I have knowledge of your document now! Feel free to ask me any questions you have. 📚✨"
                    : "I am connected to your Google Drive archive! How can I help you today? ☁️🤖"
            }
        ]);
        setSuggestions([]);
        setInput('');
        setIsLoading(false);
        setIsTyping(false);
    }, [mode]); // Reset when mode changes or component mounts

    // Handle window resize to update sidebar visibility
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                // Desktop: show sidebar if drive mode
                if (mode === 'drive' && !showDrivePanel) {
                    setShowDrivePanel(true);
                }
            } else {
                // Mobile: hide sidebar
                if (showDrivePanel) {
                    setShowDrivePanel(false);
                }
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [mode, showDrivePanel]);

    // Auto-close sidebar on mobile when user interacts
    useEffect(() => {
        if (messages.length > 1 && !hasInteracted) {
            setHasInteracted(true);
            // On mobile, always hide sidebar after first interaction
            if (mode === 'drive' && window.innerWidth < 768) {
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
        
        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = '20px';
        }

        if (onUserInteraction) onUserInteraction();

        // Create new AbortController
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            // Prepare conversation history
            // Note: 'messages' here is the state BEFORE we added the current userMessage
            // So we need to include all messages except the initial greeting
            const conversationHistory: ConversationMessage[] = messages
                .filter((_, idx) => idx > 0) // Skip the first message (initial greeting)
                .map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'bot' as 'user' | 'bot',
                    content: msg.content
                }));
            
            // Debug logging
            console.log('Sending conversation history:', conversationHistory.length, 'messages');
            if (conversationHistory.length > 0) {
                console.log('First history msg:', conversationHistory[0].role, conversationHistory[0].content.substring(0, 50));
                console.log('Last history msg:', conversationHistory[conversationHistory.length - 1].role, conversationHistory[conversationHistory.length - 1].content.substring(0, 50));
            }
            console.log('Current question:', messageToSend);
            
            const apiCall = mode === 'drive' ? askDriveQuestion : askQuestion;
            const data = await apiCall(messageToSend, conversationHistory, controller.signal);
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
                <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold border border-red-200 dark:border-red-800">
                    <AlertTriangle size={12} />
                    <span className="hidden sm:inline">Config Error</span>
                    <span className="sm:hidden">Error</span>
                </div>
            );
        }

        return (
            <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                    onClick={() => setShowDrivePanel(!showDrivePanel)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold border transition-colors ${showDrivePanel ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'}`}
                >
                    <Cloud size={12} />
                    <span className="hidden xs:inline">{driveStatus.total_files} files</span>
                    <span className="xs:hidden">{driveStatus.total_files}</span>
                </button>
                {onSyncDrive && (
                    <button
                        onClick={onSyncDrive}
                        disabled={isSyncing}
                        className={`p-1.5 rounded-lg transition-all ${isSyncing ? 'bg-primary/10 text-primary' : 'bg-transparent text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary'}`}
                        title="Sync with Google Drive"
                    >
                        <RefreshCcw size={14} className={`sm:w-4 sm:h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    </button>
                )}
            </div>
        );
    };

    const DriveSidePanel = () => {
        if (!driveStatus) return null;

        return (
            <>
                {/* Mobile Overlay Backdrop */}
                {showDrivePanel && (
                    <div 
                        className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-[90] md:hidden"
                        onClick={() => setShowDrivePanel(false)}
                    />
                )}
                
                {/* Sidebar - Overlay on mobile, inline on desktop */}
                <div className={`
                    fixed md:relative
                    top-0 right-0
                    h-full
                    border-l border-slate-200/80 dark:border-slate-700/80 
                    bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl
                    flex flex-col overflow-hidden 
                    transition-all duration-300 ease-out 
                    z-[95] md:z-auto
                    shadow-xl md:shadow-none
                    pointer-events-none md:pointer-events-auto
                    ${showDrivePanel 
                        ? 'w-72 md:w-64 opacity-100 translate-x-0 pointer-events-auto' 
                        : 'w-0 md:w-0 opacity-0 md:opacity-0 translate-x-full md:translate-x-0 pointer-events-none'
                    }
                `}>
                    <div className="p-3 sm:p-4 border-b border-slate-200/80 dark:border-slate-700/80 min-w-[18rem] md:min-w-[16rem]">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">Connection Details</h3>
                            <button
                                onClick={() => setShowDrivePanel(false)}
                                className="md:hidden p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-2.5">
                            <div className="p-2.5 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mb-1">SERVICE ACCOUNT</div>
                                <div className="text-xs font-mono text-slate-700 dark:text-slate-200 truncate" title={driveStatus.connection_info?.email}>
                                    {driveStatus.connection_info?.email || "Unknown"}
                                </div>
                            </div>

                            <div className="p-2.5 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mb-1">PROJECT ID</div>
                                <div className="text-xs font-mono text-slate-700 dark:text-slate-200">
                                    {driveStatus.connection_info?.project_id || "Unknown"}
                                </div>
                            </div>

                            <div className="p-2.5 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mb-1">FOLDER ID</div>
                                <div className="text-xs font-mono text-slate-700 dark:text-slate-200 truncate" title={driveStatus.folder_id}>
                                    {driveStatus.folder_id}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-3 sticky top-0 bg-white/95 dark:bg-slate-900/95 py-1">Indexed Files ({driveStatus.total_files})</h3>
                        <div className="space-y-2">
                            {driveStatus.files?.map((file, i) => (
                                <div key={i} className="flex items-center gap-2 p-2.5 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:border-primary/50 transition-colors group">
                                    <div className="p-1.5 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg">
                                        <Cloud size={14} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate" title={file.name}>{file.name}</div>
                                        <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{file.modified_time?.split('T')[0]}</div>
                                    </div>
                                </div>
                            ))}
                            {(!driveStatus.files || driveStatus.files.length === 0) && (
                                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
                                    No files synced yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </>
        );
    };

    return (
        <div className={`glass-card flex w-full h-full overflow-hidden transition-all duration-500 ease-in-out rounded-xl sm:rounded-2xl shadow-xl border border-slate-200/60 dark:border-slate-700/60 relative`}>
            <div className="flex flex-col flex-1 min-w-0 min-h-0 h-full relative">
                {/* Header */}
                <div className="p-3 sm:p-4 border-b border-slate-200/60 dark:border-slate-800/60 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shrink-0">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 ${mode === 'drive' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-primary/10 text-primary'} rounded-lg sm:rounded-xl flex items-center justify-center shrink-0`}>
                            {mode === 'drive' ? <Cloud size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Bot size={16} className="sm:w-[18px] sm:h-[18px]" />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white m-0 leading-tight truncate">
                                {mode === 'drive' ? 'Drive Assistant' : 'PDF Assistant'}
                            </h3>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                                <span className="flex items-center gap-1 text-emerald-500">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                    Online
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-1.5 sm:gap-2 items-center shrink-0">
                        {/* Drive Specific Controls in Header */}
                        {mode === 'drive' && renderDriveStatus()}

                        {mode === 'drive' && renderDriveStatus() && (
                            <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-0.5 sm:mx-1" />
                        )}

                        <button
                            onClick={onToggleVoice}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${isVoiceEnabled ? 'bg-primary/10 text-primary' : 'bg-transparent text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            title={isVoiceEnabled ? "Mute Voice Response" : "Enable Voice Response"}
                        >
                            {isVoiceEnabled ? <Volume2 size={14} className="sm:w-4 sm:h-4" /> : <VolumeX size={14} className="sm:w-4 sm:h-4" />}
                        </button>

                        <button
                            onClick={() => { setMessages([]); setSuggestions([]); }}
                            className="p-1.5 rounded-lg bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                            title="Clear Chat"
                        >
                            <Trash2 size={14} className="sm:w-4 sm:h-4" />
                        </button>
                    </div>
                </div>

                {/* Messages Area - Scrollable */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 sm:p-4 flex flex-col gap-2 sm:gap-4 scroll-smooth min-h-0">
                    {messages.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 sm:p-8 opacity-50">
                            {mode === 'drive' ? <Cloud size={32} className="sm:w-12 sm:h-12 text-slate-300 mb-2 sm:mb-4" /> : <Bot size={32} className="sm:w-12 sm:h-12 text-slate-300 mb-2 sm:mb-4" />}
                            <p className="text-xs sm:text-sm text-slate-500">Start a conversation...</p>
                        </div>
                    )}

                    <AnimatePresence mode="popLayout">
                        {messages.map((msg, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className={`flex items-end gap-1.5 sm:gap-2 max-w-[92%] sm:max-w-[85%] text-xs sm:text-sm ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
                            >
                                <div className={`w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-gradient-to-br from-primary to-primary-dark' : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700'}`}>
                                    {msg.role === 'user' ? <User size={10} className="sm:w-[14px] sm:h-[14px] text-white" /> : <Bot size={10} className="sm:w-[14px] sm:h-[14px] text-slate-500 dark:text-slate-400" />}
                                </div>

                                <div className={`py-1.5 sm:py-2.5 px-2.5 sm:px-4 rounded-lg sm:rounded-2xl leading-tight sm:leading-relaxed shadow-sm ${msg.role === 'user'
                                    ? 'bg-primary text-white rounded-br-sm sm:rounded-br-none shadow-primary/20'
                                    : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-bl-sm sm:rounded-bl-none dark:text-slate-200'
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
                                                    ul: ({ node, ...props }: any) => <ul className="list-disc pl-3 sm:pl-4 mb-1 sm:mb-2 space-y-0.5 sm:space-y-1" {...props} />,
                                                    ol: ({ node, ...props }: any) => <ol className="list-decimal pl-3 sm:pl-4 mb-1 sm:mb-2 space-y-0.5 sm:space-y-1" {...props} />,
                                                    li: ({ node, ...props }: any) => <li className="mb-0.5 text-xs sm:text-sm" {...props} />,
                                                    p: ({ node, ...props }: any) => <p className="mb-1.5 sm:mb-2 last:mb-0 text-xs sm:text-sm" {...props} />,
                                                    h1: ({ node, ...props }: any) => <h1 className="text-sm sm:text-lg font-bold mb-1.5 sm:mb-2 mt-0.5 sm:mt-1" {...props} />,
                                                    h2: ({ node, ...props }: any) => <h2 className="text-xs sm:text-base font-bold mb-1.5 sm:mb-2 mt-0.5 sm:mt-1" {...props} />,
                                                    h3: ({ node, ...props }: any) => <h3 className="text-xs sm:text-sm font-bold mb-1 sm:mb-1 mt-0.5 sm:mt-1" {...props} />,
                                                    strong: ({ node, ...props }: any) => <strong className="font-bold text-slate-900 dark:text-slate-100" {...props} />,
                                                    code: ({ node, ...props }: any) => <code className="bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded text-[10px] sm:text-xs font-mono" {...props} />,
                                                    table: ({ node, ...props }: any) => (
                                                        <div className="overflow-x-auto my-2 sm:my-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                                            <table className="w-full text-left text-xs sm:text-sm border-collapse" {...props} />
                                                        </div>
                                                    ),
                                                    thead: ({ node, ...props }: any) => <thead className="bg-slate-50 dark:bg-slate-900/50" {...props} />,
                                                    tbody: ({ node, ...props }: any) => <tbody className="divide-y divide-slate-100 dark:divide-slate-800" {...props} />,
                                                    tr: ({ node, ...props }: any) => <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors" {...props} />,
                                                    th: ({ node, ...props }: any) => <th className="px-2 sm:px-4 py-1.5 sm:py-3 font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap" {...props} />,
                                                    td: ({ node, ...props }: any) => <td className="px-2 sm:px-4 py-1.5 sm:py-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 align-top" {...props} />,
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        )
                                    )}
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="mt-2 sm:mt-3 pt-1.5 sm:pt-2 border-t border-slate-100 dark:border-slate-700/50 flex flex-wrap gap-1 sm:gap-1.5 items-center">
                                            <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold mr-0.5 sm:mr-1 uppercase tracking-wider">Ref:</span>
                                            {msg.sources.map((src, i) => (
                                                <span key={i} className="text-[9px] sm:text-[10px] bg-white/50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 sm:px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 flex items-center gap-0.5 sm:gap-1 select-all hover:border-primary/30 transition-colors">
                                                    {src}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}

                        {isLoading && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end gap-1.5 sm:gap-2 self-start">
                                <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                                    <Bot size={10} className="sm:w-[14px] sm:h-[14px] text-slate-500 dark:text-slate-400" />
                                </div>
                                <div className="py-2 sm:py-3 px-3 sm:px-5 rounded-lg sm:rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-bl-sm sm:rounded-bl-none flex items-center gap-1 sm:gap-1.5 shadow-sm">
                                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-slate-400 rounded-full animate-typing" />
                                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-slate-400 rounded-full animate-typing [animation-delay:0.2s]" />
                                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-slate-400 rounded-full animate-typing [animation-delay:0.4s]" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Input Area - Integrated into container */}
                <div className="border-t border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md shrink-0">
                    {/* Suggestions */}
                    <AnimatePresence>
                        {(!isLoading && !isTyping && suggestions.length > 0) && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="px-2 sm:px-4 pt-1.5 sm:pt-2 pb-1 sm:pb-1.5 flex gap-1 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth"
                            >
                                {suggestions.map((suggestion, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSend(suggestion)}
                                        className="bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 py-1 sm:py-1.5 px-2 sm:px-3 rounded-full text-[10px] sm:text-xs font-medium cursor-pointer transition-all hover:border-primary hover:text-primary hover:bg-primary/5 active:scale-95 shadow-sm flex-shrink-0 max-w-[200px] sm:max-w-none overflow-hidden"
                                        title={suggestion}
                                    >
                                        <span className="block truncate">{suggestion}</span>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Input Container */}
                    <div className="px-3 sm:px-4 py-2 sm:py-2.5">
                        <div className="flex gap-1.5 sm:gap-2 items-center bg-white dark:bg-slate-800/80 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all py-1.5 sm:py-2">
                            {/* Voice Input Button */}
                            <button
                                onClick={handleMicClick}
                                className={`ml-1 sm:ml-1.5 w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center cursor-pointer transition-all duration-200 shrink-0 ${isListening 
                                    ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-200' 
                                    : 'bg-transparent text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200'
                                }`}
                                title={isListening ? "Stop Listening" : "Start Voice Input"}
                            >
                                {isListening ? <Loader2 size={16} className="sm:w-4 sm:h-4 animate-spin" /> : <Mic size={16} className="sm:w-4 sm:h-4" />}
                            </button>

                            {/* Text Input */}
                            <div className="flex-1 min-w-0 flex items-center">
                                <textarea
                                    ref={textareaRef}
                                    value={input}
                                    onChange={(e) => {
                                        setInput(e.target.value);
                                        // Auto-resize textarea
                                        const target = e.target;
                                        target.style.height = 'auto';
                                        target.style.height = `${Math.min(target.scrollHeight, 96)}px`;
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    placeholder={isListening ? "Listening..." : "Type your message..."}
                                    rows={1}
                                    className="w-full bg-transparent border-none p-0 outline-none text-slate-800 dark:text-slate-200 text-sm placeholder:text-slate-400 font-medium resize-none overflow-hidden"
                                    style={{ 
                                        minHeight: '20px',
                                        height: '20px',
                                        lineHeight: '20px',
                                    }}
                                />
                            </div>

                            {/* Send/Stop Button */}
                            <button
                                onClick={() => (isLoading || isTyping) ? handleStop() : handleSend()}
                                disabled={(!isLoading && !isTyping) && !input.trim()}
                                className={`mr-1 sm:mr-1.5 w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center cursor-pointer transition-all duration-200 shrink-0 ${(input.trim() || isLoading || isTyping)
                                    ? 'bg-primary text-white hover:bg-primary-dark shadow-sm shadow-primary/20 hover:scale-105 active:scale-95'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                                }`}
                                title={(isLoading || isTyping) ? "Stop" : "Send message"}
                            >
                                {(isLoading || isTyping) ? (
                                    <Square size={12} className="sm:w-3.5 sm:h-3.5" fill="currentColor" />
                                ) : (
                                    <Send size={14} className="sm:w-4 sm:h-4" />
                                )}
                            </button>
                        </div>

                        {/* Footer Info - Compact */}
                        <div className="flex items-center justify-between mt-1.5 px-0.5">
                            <div className="text-[8px] sm:text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                                AI can make mistakes. Verify important information.
                            </div>
                            <div className="text-[8px] sm:text-[9px] text-slate-400/60 dark:text-slate-500/60 font-mono uppercase tracking-wider">
                                v2.6.0
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDEBAR for Drive Mode */}
            {mode === 'drive' && <DriveSidePanel />}
        </div>
    );
};

export default ChatInterface;
