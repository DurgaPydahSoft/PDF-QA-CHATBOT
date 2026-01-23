import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const uploadFiles = async (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => {
        formData.append('files', file);
    });
    const response = await axios.post(`${API_BASE_URL}/upload-pdf`, formData);
    return response.data;
};

export interface ConversationMessage {
    role: 'user' | 'bot';
    content: string;
}

export const askQuestion = async (
    question: string, 
    conversation_history?: ConversationMessage[],
    signal?: AbortSignal
) => {
    const payload: { question: string; conversation_history?: ConversationMessage[] } = { question };
    if (conversation_history && conversation_history.length > 0) {
        payload.conversation_history = conversation_history;
    }
    const response = await axios.post(`${API_BASE_URL}/ask`, payload, { signal });
    return response.data;
};

// --- Google Drive API ---

export const getDriveStatus = async () => {
    const response = await axios.get(`${API_BASE_URL}/drive/status`);
    return response.data;
};

export const updateDriveConfig = async (folderId: string) => {
    const response = await axios.post(`${API_BASE_URL}/drive/config`, { folder_id: folderId });
    return response.data;
};

export const syncDriveNow = async () => {
    const response = await axios.post(`${API_BASE_URL}/drive/sync-now`);
    return response.data;
};

export const askDriveQuestion = async (
    question: string, 
    conversation_history?: ConversationMessage[],
    signal?: AbortSignal
) => {
    const payload: { question: string; conversation_history?: ConversationMessage[] } = { question };
    if (conversation_history && conversation_history.length > 0) {
        payload.conversation_history = conversation_history;
    }
    const response = await axios.post(`${API_BASE_URL}/drive/ask`, payload, { signal });
    return response.data;
};

export const generateAudio = async (text: string) => {
    const response = await axios.post(`${API_BASE_URL}/generate-audio`, { text });
    return response.data;
};
