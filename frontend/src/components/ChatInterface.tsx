import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { askQuestion, askDriveQuestion } from '../services/api';

interface Message {
    role: 'user' | 'bot';
    content: string;
}

interface ChatInterfaceProps {
    mode?: 'local' | 'drive';
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ mode = 'local' }) => {
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
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

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
            const mainAnswer = parts[0].trim();
            const suggestionPart = parts[1] || '';

            // Parse suggestions (looking for 1. Q, 2. Q etc or just lines)
            const extractedSuggestions = suggestionPart
                .split(/\d\.\s+/)
                .map((s: string) => s.trim())
                .filter((s: string) => s.length > 5 && s.length < 100);

            setMessages(prev => [...prev, { role: 'bot', content: mainAnswer }]);
            setSuggestions(extractedSuggestions);
        } catch (err: any) {
            console.error(err);
            const detail = err.response?.data?.detail || 'Connection to backend lost.';
            setMessages(prev => [...prev, { role: 'bot', content: `Error: ${detail}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="glass flex flex-col h-[75vh] md:h-[80vh] w-full overflow-hidden rounded-[2rem] shadow-card">
            <div className="p-4 md:p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-white/20 dark:bg-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Bot size={18} className="text-primary md:size-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm md:text-base m-0 leading-tight">AI Assistant</h3>
                        <p className="text-[0.7rem] md:text-[0.75rem] text-[#64748b] flex items-center gap-1.5 font-medium">
                            <span className="flex items-center gap-1 text-[#22c55e]">
                                <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full" />
                                Online
                            </span>
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => { setMessages([]); setSuggestions([]); }}
                        className="p-2 rounded-lg bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                        title="Clear Chat"
                    >
                        <Trash2 size={18} className="text-[#94a3b8] group-hover:text-red-400 transition-colors" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4">
                {messages.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-white dark:bg-[#1e293b] rounded-[1.25rem] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] flex items-center justify-center mb-4">
                            <Bot size={24} className="text-primary md:size-8" />
                        </div>
                        <h4 className="text-base md:text-lg font-bold text-[#334155] dark:text-white">Start the conversation!</h4>
                        <p className="text-xs md:text-sm text-[#64748b] max-w-[250px] mt-2">
                            Ask any question based on the document you uploaded.
                        </p>
                    </div>
                )}

                <AnimatePresence>
                    {messages.map((msg, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={`flex items-end gap-2 md:gap-3 max-w-[92%] md:max-w-[80%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
                        >
                            <div className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary' : 'bg-[#e2e8f0]'}`}>
                                {msg.role === 'user' ? <User size={12} className="text-white md:size-[14px]" /> : <Bot size={12} className="text-primary md:size-[14px]" />}
                            </div>
                            <div className={`py-2.5 px-4 md:py-3 md:px-5 rounded-[1.25rem] text-sm md:text-[0.9375rem] leading-snug md:leading-6 ${msg.role === 'user' ? 'bg-primary text-white rounded-br-none shadow-md' : 'bg-white dark:bg-[#1e293b] border border-black/5 dark:border-white/10 rounded-bl-none shadow-sm dark:text-gray-100'}`}>
                                {msg.content}
                            </div>
                        </motion.div>
                    ))}

                    {isLoading && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end gap-2 md:gap-3 self-start">
                            <div className="w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center shrink-0 bg-[#e2e8f0]">
                                <Bot size={12} className="text-primary md:size-[14px]" />
                            </div>
                            <div className="py-2.5 px-4 md:py-3 md:px-5 rounded-[1.25rem] bg-[#f1f5f9] dark:bg-[#1e293b] rounded-bl-none flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-[#94a3b8] rounded-full animate-typing" />
                                <span className="w-1.5 h-1.5 bg-[#94a3b8] rounded-full animate-typing [animation-delay:0.2s]" />
                                <span className="w-1.5 h-1.5 bg-[#94a3b8] rounded-full animate-typing [animation-delay:0.4s]" />
                            </div>
                        </motion.div>
                    )}

                    {!isLoading && suggestions.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-wrap gap-2 mt-2 ml-8 md:ml-10 pb-2"
                        >
                            {suggestions.map((suggestion, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSend(suggestion)}
                                    className="bg-white dark:bg-primary/5 border border-primary text-primary py-1.5 px-3 md:py-2 md:px-4 rounded-full text-xs md:text-[0.8125rem] font-medium cursor-pointer transition-all duration-200 hover:bg-primary hover:text-white hover:translate-y-[-2px] hover:shadow-[0_4px_6px_-1px_rgba(14,165,233,0.2)] whitespace-nowrap"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Input Area */}
            <div className="p-4 md:p-6 bg-white dark:bg-[#0f172a] border-t border-black/5 dark:border-white/5">
                <div className="flex gap-2 md:gap-3 items-center bg-[#f1f5f9] dark:bg-[#1e293b] p-1.5 md:p-2 rounded-[1.25rem]">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask a question..."
                        className="flex-1 bg-transparent border-none p-2 md:p-3 outline-none text-inherit text-sm md:text-[0.9375rem]"
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isLoading}
                        className={`bg-primary text-white w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 ${input.trim() && !isLoading ? 'opacity-100 scale-100' : 'opacity-50 scale-95 cursor-not-allowed'}`}
                    >
                        <Send size={16} className="md:size-[18px]" />
                    </button>
                </div>
                <p className="text-[9px] md:text-[10px] text-[#94a3b8] text-center mt-3 uppercase tracking-widest font-bold">
                    Powered by Bannu AI
                </p>
            </div>
        </div>
    );
};

export default ChatInterface;
