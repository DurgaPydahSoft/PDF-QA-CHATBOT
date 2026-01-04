import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import ChatInterface from './components/ChatInterface';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, FileCheck, Sparkles } from 'lucide-react';
import './App.css';

const App: React.FC = () => {
  const [isUploaded, setIsUploaded] = useState(false);
  const [chunksCount, setChunksCount] = useState(0);

  const handleUploadSuccess = (chunks: number) => {
    setChunksCount(chunks);
    setIsUploaded(true);
  };

  return (
    <div className="app-container">
      {/* Background patterns */}
      <div className="bg-blobs">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <main className="main-content">
        {/* Header */}
        <header className="hero-header">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="logo-badge"
          >
            <Bot size={32} color="#0ea5e9" style={{ marginRight: '0.5rem' }} />
            <div style={{ display: 'flex', gap: '4px' }}>
              <div style={{ width: '6px', height: '6px', background: '#0ea5e9', borderRadius: '50%' }} />
              <div style={{ width: '6px', height: '6px', background: '#38bdf8', borderRadius: '50%' }} />
              <div style={{ width: '6px', height: '6px', background: '#7dd3fc', borderRadius: '50%' }} />
            </div>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="main-title"
          >
            Ask your PDF anything.
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="hero-subtitle"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            Upload a document and get instant, accurate answers.
            <Sparkles size={20} color="#eab308" />
          </motion.p>
        </header>

        {/* Content Area */}
        <div style={{ width: '100%' }}>
          <AnimatePresence mode="wait">
            {!isUploaded ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
              >
                <FileUpload onUploadSuccess={handleUploadSuccess} />

                {/* Features Section */}
                <div className="feature-grid">
                  {[
                    { title: 'Semantic Search', desc: 'Finds meaning, not just words', icon: '🔍' },
                    { title: 'Context Grounding', desc: 'No hallucinations, only facts', icon: '🛡️' },
                    { title: 'Privacy First', desc: 'Your data stays local and secure', icon: '🔒' }
                  ].map((feat, i) => (
                    <div key={i} className="feature-card">
                      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{feat.icon}</div>
                      <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{feat.title}</h3>
                      <p style={{ fontSize: '0.875rem', color: '#64748b' }}>{feat.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, type: 'spring', damping: 20 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', color: '#16a34a', padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.875rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <FileCheck size={16} />
                    Document processed: {chunksCount} chunks found
                  </motion.div>
                </div>
                <ChatInterface />
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                  <button
                    onClick={() => setIsUploaded(false)}
                    style={{ background: 'transparent', border: 'none', color: '#0ea5e9', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '4px' }}
                  >
                    Upload a different document
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer style={{ marginTop: '5rem', color: '#94a3b8', fontSize: '0.875rem' }}>
          © 2026 PDF-QA Agent • Built with FastAPI & React
        </footer>
      </main>
    </div>
  );
};

export default App;
