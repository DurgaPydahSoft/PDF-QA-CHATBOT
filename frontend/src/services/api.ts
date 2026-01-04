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

export const askQuestion = async (question: string) => {
    const response = await axios.post(`${API_BASE_URL}/ask`, { question });
    return response.data;
};
