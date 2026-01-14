import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Trash2, Mic, Loader2, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { askQuestion, askDriveQuestion, generateAudio } from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
    role: 'user' | 'bot';
    content: string;
    sources?: string[];
}

interface ChatInterfaceProps {
    mode?: 'local' | 'drive';
    initialSuggestions?: string[];
    isVoiceEnabled: boolean;
    onToggleVoice: () => void;
    compact?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
    mode = 'local',
    initialSuggestions = [],
    isVoiceEnabled,
    onToggleVoice,
    compact = false
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

    return (
        <div className={`glass-card flex flex-col w-full overflow-hidden ${compact ? 'h-full rounded-2xl' : 'h-[75vh] md:h-[80vh] rounded-[2rem] shadow-card'}`}>
            <div className={`p-3 md:p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm`}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Bot size={18} className="text-primary" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-slate-800 dark:text-white m-0 leading-tight">AI Assistant</h3>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1.5 font-medium">
                            <span className="flex items-center gap-1 text-emerald-500">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                Online
                            </span>
                        </p>
                    </div>
                </div>
                <div className="flex gap-1 items-center">
                    <button
                        onClick={onToggleVoice}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${isVoiceEnabled ? 'bg-primary/10 text-primary' : 'bg-transparent text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        title={isVoiceEnabled ? "Mute Voice Response" : "Enable Voice Response"}
                    >
                        {isVoiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    </button>
                    <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
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
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 md:p-4 flex flex-col gap-3 md:gap-4">
                {messages.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-50">
                        <Bot size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
                        <p className="text-sm text-slate-500">Start a conversation...</p>
                    </div>
                )}

                <AnimatePresence>
                    {messages.map((msg, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={`flex items-end gap-2 max-w-[95%] text-sm ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
                        >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                {msg.role === 'user' ? <User size={12} className="text-white" /> : <Bot size={12} className="text-slate-600 dark:text-slate-300" />}
                            </div>
                            <div className={`py-2 px-3.5 rounded-2xl leading-relaxed ${msg.role === 'user'
                                ? 'bg-primary text-white rounded-br-none shadow-sm'
                                : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-bl-none shadow-sm dark:text-slate-200'
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
                                        }}
                                    >
                                        {msg.content}

                                    </ReactMarkdown>
                                )}
                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50 flex flex-wrap gap-1 items-center">
                                        <span className="text-[10px] text-slate-400 font-bold mr-1 uppercase tracking-wider">References:</span>
                                        {msg.sources.map((src, i) => (
                                            <span key={i} className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded-md font-medium border border-indigo-100 dark:border-indigo-800/50 flex items-center gap-1">
                                                <span className="w-1 h-1 rounded-full bg-indigo-400"></span>
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
                            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-slate-200 dark:bg-slate-700">
                                <Bot size={12} className="text-slate-600 dark:text-slate-300" />
                            </div>
                            <div className="py-2 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 rounded-bl-none flex items-center gap-1">
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
                                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 py-1.5 px-3 rounded-xl text-xs font-medium cursor-pointer transition-all hover:border-primary hover:text-primary hover:bg-primary/5 text-left shadow-sm"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </motion.div>
                    </div>
                )
            }

            {/* Input Area */}
            <div className="p-3 md:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                <div className="flex gap-2 items-center bg-slate-50 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                    <button
                        onClick={handleMicClick}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-transparent text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                        title={isListening ? "Stop Listening" : "Start Voice Input"}
                    >
                        {isListening ? <Loader2 size={16} className="animate-spin" /> : <Mic size={16} />}
                    </button>

                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={isListening ? "Listening..." : "Ask something..."}
                        className="flex-1 bg-transparent border-none p-1 outline-none text-slate-800 dark:text-slate-200 text-sm placeholder:text-slate-400"
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isLoading}
                        className={`bg-primary text-white w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 shadow-sm ${input.trim() && !isLoading ? 'opacity-100 scale-100 hover:bg-primary-dark' : 'opacity-50 scale-95 cursor-not-allowed'}`}
                    >
                        <Send size={14} />
                    </button>
                </div>
            </div>
        </div >
    );
};

export default ChatInterface;
