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
            case 'pdf': return <FileText size={18} className="text-red-500" />;
            case 'docx': return <FileBox size={18} className="text-blue-500" />;
            case 'xlsx':
            case 'xls': return <FileSpreadsheet size={18} className="text-green-500" />;
            case 'pptx': return <FileArchive size={18} className="text-orange-500" />;
            default: return <FileText size={18} className="text-slate-400" />;
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
        <div className="max-w-[600px] w-full mx-auto p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-6 md:p-10 relative overflow-hidden rounded-[2rem] shadow-card"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#38bdf8] to-primary" />

                <h2 className="text-xl md:text-2xl font-bold mb-6 flex items-center gap-2 transition-all duration-300">
                    <Upload size={24} className="text-primary" />
                    Upload Documents
                </h2>

                <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-3xl p-8 md:p-12 text-center cursor-pointer transition-all duration-300 hover:border-primary hover:bg-primary/5 ${files.length > 0 ? 'border-primary bg-primary/5' : 'border-slate-300'}`}
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
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Upload size={24} className="text-primary" />
                            </div>
                            <p className="font-semibold text-slate-500 text-sm md:text-base">Upload Documents</p>
                            <p className="text-[0.7rem] md:text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">Tap to browse or drag & drop</p>
                        </div>
                    ) : (
                        <div className="w-full max-h-[200px] overflow-y-auto flex flex-col gap-2 p-1">
                            {files.map((file, idx) => (
                                <div key={idx} className="bg-white dark:bg-[#1e293b] p-2.5 md:p-3 rounded-xl flex items-center justify-between border border-[#e2e8f0] dark:border-white/10 shadow-sm">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        {getFileIcon(file.name)}
                                        <span className="text-xs md:text-sm font-semibold text-[#334155] dark:text-[#f1f5f9] truncate max-w-[120px] md:max-w-[180px]">
                                            {file.name}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                                        className="bg-transparent border-none cursor-pointer text-slate-400 hover:text-red-500 flex p-1 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                            <div className="mt-4 text-center">
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                    className="bg-transparent border-none text-primary text-xs font-bold cursor-pointer hover:underline p-2"
                                >
                                    + Add more files
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-4 p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-2 border border-red-100 dark:border-red-500/20"
                    >
                        <AlertCircle size={16} />
                        <span className="text-[0.75rem] font-semibold">{error}</span>
                    </motion.div>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={files.length === 0 || status === 'uploading' || status === 'success'}
                    className="w-full p-4 mt-4 md:mt-6 bg-primary text-white border-none rounded-2xl font-bold cursor-pointer transition-all duration-200 active:scale-[0.98] disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed hover:bg-primary-dark shadow-lg shadow-primary/20 flex items-center justify-center"
                >
                    {status === 'uploading' ? (
                        <div className="flex items-center justify-center gap-2">
                            <Loader2 size={18} className="animate-spin" />
                            <span>Processing...</span>
                        </div>
                    ) : status === 'success' ? (
                        <div className="flex items-center justify-center gap-2">
                            <CheckCircle size={18} />
                            <span>Complete!</span>
                        </div>
                    ) : (
                        <span className="text-sm md:text-base">
                            Analyze {files.length} Document${files.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </button>

            </motion.div>
        </div>
    );
};

export default FileUpload;
