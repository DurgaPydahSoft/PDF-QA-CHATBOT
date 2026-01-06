---
title: DOC-CHAT-BOT
emoji: 📄
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
---

# PDF-QA-CHATBOT Backend
This space hosts the FastAPI backend for the PDF-QA-CHATBOT.

## Local Setup

1. **Create and Activate Virtual Environment**:
   ```powershell
   cd backend
   python -m venv venv
   .\venv\Scripts\activate
   ```

2. **Install Dependencies**:
   ```powershell
   pip install -r requirements.txt
   ```

3. **Environment Variables**:
   Ensure you have a `.env` file with the required variables (e.g., `MONGODB_URI`).

4. **Run the Server**:
   ```powershell
   python main.py
   ```
   Or with hot-reload:
   ```powershell
   uvicorn main:app --reload --port 7860
   ```
