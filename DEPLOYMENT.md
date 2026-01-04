# Deployment Guide 🚀

This document outlines the steps to deploy the PDF-QA-CHATBOT with a split architecture: **FastAPI Backend (Hugging Face Spaces)** and **React Frontend (Vercel)**.

## 1. Backend: Hugging Face Spaces (Docker)

The backend is configured to run in a Docker container on Hugging Face Spaces.

### Setup Steps:
1. **Create a New Space**:
   - Go to [huggingface.co/new-space](https://huggingface.co/new-space).
   - Select **Docker** as the SDK.
   - Choose a space name (e.g., `doc-chat-bot`).
2. **GitHub Actions Infrastructure**:
   - **Secrets**: Go to your GitHub Repository **Settings > Secrets and variables > Actions**. Add a new secret named `HF_TOKEN` with your Hugging Face "Write" token.
   - **Workflow File**: Create a file at `.github/workflows/deploy.yml` with the deployment script. This script should be configured to push the `backend` folder to your Hugging Face space every time you push to the `main` branch.
3. **Automatic Deployment**:
   - Once the secret and the workflow file are in place, every push to the `main` branch will automatically push your latest backend code to Hugging Face.
4. **Hugging Face Secrets**:
   - In your Hugging Face Space settings, add your LLM API keys (e.g., `GEMINI_API_KEY` or `OPENAI_API_KEY`) as Secrets to allow the backend to function.

---

## 2. Frontend: Vercel (React + Vite)

The frontend is a standard Vite project optimized for Vercel.

### Setup Steps:
1. **Create a New Project on Vercel**:
   - Import your GitHub repository.
   - Set the **Root Directory** to `frontend`.
2. **Environment Variables**:
   - During setup (or in Settings > Environment Variables), add:
     - `VITE_API_BASE_URL`: The URL of your Hugging Face Space (e.g., `https://username-space-name.hf.space`).
3. **Deploy**:
   - Vercel will automatically build and deploy the project.

---

## 3. Post-Deployment Verification
- Ensure the `VITE_API_BASE_URL` on Vercel does **not** have a trailing slash.
- Check the Hugging Face "Logs" tab to ensure the Docker container started correctly on port 7860.
- Verify CORS settings in `backend/main.py` if you encounter "Block by CORS" errors (add your Vercel URL to `allow_origins`).
