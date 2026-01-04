import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
    role: 'user' | 'bot';
    content: string;
}

const ChatInterface: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:8000/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: input }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessages(prev => [...prev, { role: 'bot', content: data.answer }]);
            } else {
                setMessages(prev => [...prev, { role: 'bot', content: `Error: ${data.detail || 'Failed to get response'}` }]);
            }
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'bot', content: 'Connection to backend lost.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="glass-card chat-window">
            {/* Header */}
            <div className="chat-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', background: 'rgba(14, 165, 233, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Bot size={24} color="#0ea5e9" />
                    </div>
                    <div>
                        <h3 style={{ fontWeight: 'bold', margin: 0 }}>AI Assistant</h3>
                        <p style={{ fontSize: '0.75rem', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500 }}>
                            <span style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%' }} />
                            Online
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setMessages([])}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center' }}
                    title="Clear Chat"
                >
                    <RefreshCcw size={20} color="#64748b" />
                </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="messages-area">
                {messages.length === 0 && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
                        <div style={{ width: '64px', height: '64px', background: 'white', borderRadius: '1.25rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
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
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: msg.role === 'user' ? '#0ea5e9' : '#e2e8f0' }}>
                                {msg.role === 'user' ? <User size={16} color="white" /> : <Bot size={16} color="#0ea5e9" />}
                            </div>
                            <div className="message-bubble">
                                {msg.content}
                            </div>
                        </motion.div>
                    ))}
                    {isLoading && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <div className="message bot">
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: '#e2e8f0' }}>
                                    <Bot size={16} color="#0ea5e9" />
                                </div>
                                <div className="message-bubble" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontStyle: 'italic', color: '#64748b' }}>
                                    <Loader2 size={16} className="loader" />
                                    Synthesizing answer...
                                </div>
                            </div>
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
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="send-button"
                        style={{ opacity: input.trim() && !isLoading ? 1 : 0.5 }}
                    >
                        <Send size={18} />
                    </button>
                </div>
                <p style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'center', marginTop: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'bold' }}>
                    Powered by Gemini & Mistral
                </p>
            </div>
        </div>
    );
};

export default ChatInterface;
