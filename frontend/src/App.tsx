import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import ChatInterface from './components/ChatInterface';
import GoogleDriveTab from './components/GoogleDriveTab';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, FileCheck, Sparkles } from 'lucide-react';
import './App.css';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'local' | 'drive'>('local');
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

        {/* Tab Switcher */}
        <div className="tab-switcher">
          <button
            className={`tab-btn ${activeTab === 'local' ? 'active' : ''}`}
            onClick={() => setActiveTab('local')}
          >
            Local Uploads
          </button>
          <button
            className={`tab-btn ${activeTab === 'drive' ? 'active' : ''}`}
            onClick={() => setActiveTab('drive')}
          >
            Google Drive Sync
          </button>
        </div>

        {/* Content Area */}
        <div style={{ width: '100%' }}>
          <AnimatePresence mode="wait">
            {activeTab === 'local' ? (
              <motion.div
                key="local-tab"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {!isUploaded ? (
                  <motion.div key="upload">
                    <FileUpload onUploadSuccess={handleUploadSuccess} />
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
                  <motion.div key="chat" className="chat-view-container">
                    <div className="status-badge-container">
                      <div className="status-badge success">
                        <FileCheck size={16} />
                        Local: {chunksCount} chunks found
                      </div>
                    </div>
                    <ChatInterface mode="local" />
                    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                      <button onClick={() => setIsUploaded(false)} className="secondary-btn">
                        Upload a different document
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="drive-tab"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="drive-tab-container">
                  <GoogleDriveTab />
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
