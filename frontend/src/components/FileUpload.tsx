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
        <div className="max-w-full sm:max-w-[500px] w-full mx-auto h-full flex items-center justify-center px-2 sm:px-0">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-4 sm:p-5 relative overflow-hidden bg-white/60 dark:bg-slate-900/60 w-full rounded-xl sm:rounded-2xl"
            >
                {/* Decorative header gradient */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-400 to-primary" />

                <div className="text-center mb-4 sm:mb-6">
                    <h2 className="text-base sm:text-lg font-bold flex items-center justify-center gap-2 text-slate-800 dark:text-white uppercase tracking-wider">
                        <Upload size={18} className="sm:w-5 sm:h-5 text-primary animate-bounce" />
                        Import File
                    </h2>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-mono uppercase tracking-wider sm:tracking-widest">
                        Supported Formats: PDF • DOCX • XLSX • PPTX
                    </p>
                </div>

                <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center cursor-pointer transition-all duration-300 group overflow-hidden
                    ${files.length > 0
                            ? 'border-primary/50 bg-primary/5'
                            : 'border-slate-300 dark:border-slate-700 hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                >
                    {/* Scanning Line Effect on Hover */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary/50 shadow-[0_0_10px_#0ea5e9] opacity-0 group-hover:opacity-100 group-hover:animate-scanline pointer-events-none transition-opacity duration-300" />

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="sr-only"
                        accept=".pdf,.docx,.xlsx,.xls,.pptx"
                        multiple
                    />

                    {files.length === 0 ? (
                        <div className="flex flex-col items-center gap-2.5 sm:gap-3 py-3 sm:py-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                                <Upload size={20} className="sm:w-6 sm:h-6 text-slate-400 group-hover:text-primary transition-colors" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-600 dark:text-slate-300 text-xs sm:text-sm">Initiate Data Transfer</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1">CLICK TO BROWSE OR DRAG FILES</p>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full max-h-[160px] sm:max-h-[180px] overflow-y-auto flex flex-col gap-2 p-1 custom-scrollbar">
                            {files.map((file, idx) => (
                                <div key={idx} className="bg-white dark:bg-slate-800 p-2 sm:p-2.5 rounded-lg flex items-center justify-between border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group/file relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/0 group-hover/file:bg-primary transition-colors" />
                                    <div className="flex items-center gap-2 sm:gap-3 overflow-hidden ml-1.5 sm:ml-2">
                                        {getFileIcon(file.name)}
                                        <div className="flex flex-col items-start min-w-0">
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate w-full max-w-[120px] xs:max-w-[150px] sm:max-w-[200px]">
                                                {file.name}
                                            </span>
                                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                                        className="text-slate-400 hover:text-red-500 p-1 sm:p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors shrink-0"
                                    >
                                        <X size={12} className="sm:w-[14px] sm:h-[14px]" />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                className="text-primary text-xs font-bold hover:underline p-1.5 sm:p-2 uppercase tracking-wide text-left sm:text-center"
                            >
                                + Add Data Module
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
                    className="w-full py-2.5 sm:py-3 px-4 mt-4 sm:mt-5 bg-primary text-white border-none rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm cursor-pointer transition-all duration-200 active:scale-[0.98] disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed hover:bg-primary-dark shadow-lg shadow-primary/20 flex items-center justify-center gap-2 uppercase tracking-wide"
                >
                    {status === 'uploading' ? (
                        <>
                            <Loader2 size={14} className="sm:w-4 sm:h-4 animate-spin" />
                            <span className="hidden xs:inline">Uploading Data Stream...</span>
                            <span className="xs:hidden">Uploading...</span>
                        </>
                    ) : status === 'success' ? (
                        <>
                            <CheckCircle size={14} className="sm:w-4 sm:h-4" />
                            <span className="hidden xs:inline">Transfer Complete</span>
                            <span className="xs:hidden">Complete</span>
                        </>
                    ) : (
                        <span>Start Processing</span>
                    )}
                </button>

            </motion.div>
        </div>
    );
};

export default FileUpload;
