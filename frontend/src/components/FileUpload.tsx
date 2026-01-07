import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X, FileSpreadsheet, FileBox, FileArchive } from 'lucide-react';
import { motion } from 'framer-motion';
import { uploadFiles } from '../services/api';

interface FileUploadProps {
    onUploadSuccess: (chunks: number, suggestions: string[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getFileIcon = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'pdf': return <FileText size={16} className="text-red-500" />;
            case 'docx': return <FileBox size={16} className="text-blue-500" />;
            case 'xlsx':
            case 'xls': return <FileSpreadsheet size={16} className="text-green-500" />;
            case 'pptx': return <FileArchive size={16} className="text-orange-500" />;
            default: return <FileText size={16} className="text-slate-400" />;
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
            onUploadSuccess(data.chunks, data.suggestions || []);
        } catch (err: any) {
            console.error(err);
            setStatus('error');
            const message = err.response?.data?.detail || 'Upload failed';
            setError(message);
        }
    };

    return (
        <div className="max-w-[500px] w-full mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-5 relative overflow-hidden bg-white/60 dark:bg-slate-900/60"
            >
                {/* Decorative header gradient */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-400 to-primary" />

                <div className="text-center mb-6">
                    <h2 className="text-lg font-bold flex items-center justify-center gap-2 text-slate-800 dark:text-white">
                        <Upload size={20} className="text-primary" />
                        Upload Documents
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                        Supported: PDF, Word, Excel, PowerPoint
                    </p>
                </div>

                <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 group
                    ${files.length > 0
                            ? 'border-primary/50 bg-primary/5'
                            : 'border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
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
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Upload size={20} className="text-primary" />
                            </div>
                            <div>
                                <p className="font-semibold text-slate-600 dark:text-slate-300 text-sm">Click to browse</p>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium mt-1">or drag & drop here</p>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full max-h-[180px] overflow-y-auto flex flex-col gap-2 p-1 custom-scrollbar">
                            {files.map((file, idx) => (
                                <div key={idx} className="bg-white dark:bg-slate-800 p-2 rounded-lg flex items-center justify-between border border-slate-100 dark:border-slate-700 shadow-sm">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        {getFileIcon(file.name)}
                                        <div className="flex flex-col items-start min-w-0">
                                            <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate w-full max-w-[150px] sm:max-w-[200px]">
                                                {file.name}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                                        className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                className="text-primary text-xs font-semibold hover:underline p-2"
                            >
                                + Add more files
                            </button>
                        </div>
                    )}
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 p-2.5 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-lg flex items-start gap-2 border border-red-100 dark:border-red-900/20 text-xs"
                    >
                        <AlertCircle size={14} className="mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </motion.div>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={files.length === 0 || status === 'uploading' || status === 'success'}
                    className="w-full py-3 px-4 mt-5 bg-primary text-white border-none rounded-xl font-bold text-sm cursor-pointer transition-all duration-200 active:scale-[0.98] disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed hover:bg-primary-dark shadow-md shadow-primary/20 flex items-center justify-center gap-2"
                >
                    {status === 'uploading' ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Processing Documents...</span>
                        </>
                    ) : status === 'success' ? (
                        <>
                            <CheckCircle size={16} />
                            <span>Analysis Complete!</span>
                        </>
                    ) : (
                        <span>Start Analysis</span>
                    )}
                </button>

            </motion.div>
        </div>
    );
};

export default FileUpload;
