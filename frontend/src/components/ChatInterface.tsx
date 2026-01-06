import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { askQuestion, askDriveQuestion } from '../services/api';

interface Message {
    role: 'user' | 'bot';
    content: string;
}

interface ChatInterfaceProps {
    mode?: 'local' | 'drive';
    onSync?: () => Promise<void>;
    syncStatus?: any;
    isSyncing?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ mode = 'local', onSync, syncStatus, isSyncing: externalIsSyncing }) => {
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
            // ... (rest of the logic remains same)

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
        <div className="glass-card chat-window">
            {/* Header omitted for brevity in this tool call - assuming it remains the same */}
            <div className="chat-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="chat-bot-icon">
                        <Bot size={20} color="#0ea5e9" />
                    </div>
                    <div>
                        <h3 style={{ fontWeight: 'bold', margin: 0 }}>AI Assistant</h3>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#22c55e' }}>
                                <span style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%' }} />
                                Online
                            </span>
                            {mode === 'drive' && syncStatus && (
                                <span style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '0.5rem' }}>
                                    {syncStatus.total_chunks || 0} chunks indexed
                                </span>
                            )}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {mode === 'drive' && onSync && (
                        <button
                            onClick={onSync}
                            disabled={externalIsSyncing}
                            className={`header-action-btn ${externalIsSyncing ? 'is-loading' : ''}`}
                            title="Sync Drive Now"
                        >
                            <RefreshCcw size={18} className={externalIsSyncing ? 'spin' : ''} />
                            <span className="btn-label">Sync</span>
                        </button>
                    )}
                    <button
                        onClick={() => { setMessages([]); setSuggestions([]); }}
                        className="header-action-btn"
                        title="Clear Chat"
                    >
                        <RefreshCcw size={18} color="#64748b" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="messages-area">
                {messages.length === 0 && (
                    <div className="chat-empty-state">
                        <div className="chat-empty-icon">
                            <Bot size={32} color="#0ea5e9" />
                        </div>
                        <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#334155' }}>Start the conversation!</h4>
                        <p style={{ fontSize: '0.875rem', color: '#64748b', maxWidth: '250px', marginTop: '0.5rem' }}>
                            Ask any question based on the PDF you uploaded.
                        </p>
                    </div>
                )}

                <AnimatePresence>
                    {messages.map((msg, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={`message ${msg.role === 'user' ? 'user' : 'bot'}`}
                        >
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: msg.role === 'user' ? '#0ea5e9' : '#e2e8f0' }}>
                                {msg.role === 'user' ? <User size={14} color="white" /> : <Bot size={14} color="#0ea5e9" />}
                            </div>
                            <div className="message-bubble">
                                {msg.content}
                            </div>
                        </motion.div>
                    ))}

                    {isLoading && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <div className="message bot">
                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: '#e2e8f0' }}>
                                    <Bot size={14} color="#0ea5e9" />
                                </div>
                                <div className="message-bubble typing-dot-container">
                                    <span className="typing-dot" />
                                    <span className="typing-dot" />
                                    <span className="typing-dot" />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {!isLoading && suggestions.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="suggestions-container"
                        >
                            {suggestions.map((suggestion, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSend(suggestion)}
                                    className="suggestion-chip"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Input */}
            <div className="chat-input-area">
                <div className="input-wrapper">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask a question about the document..."
                        className="chat-input"
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isLoading}
                        className="send-button"
                        style={{ opacity: input.trim() && !isLoading ? 1 : 0.5 }}
                    >
                        <Send size={18} />
                    </button>
                </div>
                <p style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'center', marginTop: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'bold' }}>
                    Powered by Bannu AI
                </p>
            </div>
        </div>
    );
};

export default ChatInterface;
