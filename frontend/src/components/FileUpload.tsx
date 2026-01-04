import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X, FileSpreadsheet, FileBox, FileArchive } from 'lucide-react';
import { motion } from 'framer-motion';
import { uploadFiles } from '../services/api';

interface FileUploadProps {
    onUploadSuccess: (chunks: number) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getFileIcon = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'pdf': return <FileText size={18} color="#ef4444" />;
            case 'docx': return <FileBox size={18} color="#3b82f6" />;
            case 'xlsx':
            case 'xls': return <FileSpreadsheet size={18} color="#22c55e" />;
            case 'pptx': return <FileArchive size={18} color="#f97316" />;
            default: return <FileText size={18} color="#94a3b8" />;
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);
            const allowedExtensions = ['pdf', 'docx', 'xlsx', 'xls', 'pptx'];

            const validFiles = selectedFiles.filter(file => {
                const ext = file.name.split('.').pop()?.toLowerCase();
                return ext && allowedExtensions.includes(ext);
            });

            if (validFiles.length !== selectedFiles.length) {
                setError('Some files are not supported. Supported: PDF, Word, Excel, PowerPoint.');
            } else {
                setError(null);
            }

            setFiles(prev => [...prev, ...validFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (files.length === 0) return;

        setStatus('uploading');
        setError(null);

        try {
            const data = await uploadFiles(files);
            setStatus('success');
            onUploadSuccess(data.chunks);
        } catch (err: any) {
            console.error(err);
            setStatus('error');
            const message = err.response?.data?.detail || 'Upload failed';
            setError(message);
        }
    };

    return (
        <div className="upload-container">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card"
                style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}
            >
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(to right, #38bdf8, #0ea5e9)' }} />

                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Upload size={24} color="#0ea5e9" />
                    Upload Documents
                </h2>

                <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`dropzone ${files.length > 0 ? 'active' : ''}`}
                    style={{ padding: files.length > 0 ? '1.5rem' : '3rem' }}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="sr-only"
                        accept=".pdf,.docx,.xlsx,.xls,.pptx"
                        multiple
                    />

                    {files.length === 0 ? (
                        <div>
                            <div style={{ width: '64px', height: '64px', background: 'rgba(14, 165, 233, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                                <Upload size={32} color="#0ea5e9" style={{ margin: 'auto' }} />
                            </div>
                            <p style={{ fontWeight: 500, color: '#64748b' }}>Click to browse or drag and drop</p>
                            <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.25rem' }}>PDF, Word, Excel, PowerPoint</p>
                        </div>
                    ) : (
                        <div style={{ width: '100%', maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {files.map((file, idx) => (
                                <div key={idx} style={{ background: 'white', padding: '0.75rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                                        {getFileIcon(file.name)}
                                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {file.name}
                                        </span>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{ marginTop: '1rem', padding: '0.75rem', background: '#fef2f2', color: '#dc2626', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #fee2e2' }}
                    >
                        <AlertCircle size={16} />
                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{error}</span>
                    </motion.div>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={files.length === 0 || status === 'uploading' || status === 'success'}
                    className="upload-button"
                >
                    {status === 'uploading' ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <Loader2 size={20} className="loader" />
                            Processing {files.length} Document(s)...
                        </div>
                    ) : status === 'success' ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <CheckCircle size={20} />
                            Upload Complete
                        </div>
                    ) : (
                        `Process ${files.length} File${files.length !== 1 ? 's' : ''}`
                    )}
                </button>
            </motion.div>
        </div>
    );
};

export default FileUpload;
