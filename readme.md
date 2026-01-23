# 🤖 AI-Powered PDF & Google Drive Q&A Chatbot

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.10%2B-blue)
![React](https://img.shields.io/badge/react-18-61DAFB?logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?logo=fastapi)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)

A powerful, modern **RAG (Retrieval-Augmented Generation)** application that allows users to chat with their **local PDF documents** and **Google Drive archives** seamlessly. Built with a focus on privacy, speed, and clean UI/UX.

## ✨ What Makes This Special?

- 🧠 **Conversation Memory**: Maintains context across multiple questions in a conversation
- 🔄 **Multi-API Key Support**: Intelligent key rotation with session-based assignment
- ⚡ **Lightning Fast**: Local embeddings + optimized vector search
- 🔒 **Privacy First**: All processing happens on your server
- 🎨 **Beautiful UI**: Modern glassmorphism design with smooth animations
- 🗣️ **Voice Ready**: Built-in TTS and STT support

---

## 🌟 Key Features

### 📄 Document Processing
* **Multi-Format Support**: PDF, DOCX, XLSX, XLS, and PPTX files
* **High-Fidelity Extraction**: Uses PyMuPDF for accurate text extraction
* **Smart Chunking**: Recursive character splitting with overlap for context preservation
* **Batch Processing**: Upload and process multiple files simultaneously

### 🧠 Advanced RAG Engine
* **Local Embeddings**: `all-MiniLM-L6-v2` model (384 dimensions) - **No API costs!**
* **Dual Vector Stores**:
  * **FAISS** (Local): In-memory for temporary session uploads
  * **MongoDB Atlas** (Cloud): Persistent vector search for Google Drive archives
* **Semantic Search**: Find relevant context even with different wording
* **Source Citation**: Automatically cites source files in responses

### 💬 Conversation Features
* **Context Memory**: Maintains conversation history (last 6 messages) for follow-up questions
* **Follow-up Support**: Handles pronouns ("both", "they", "these") and references
* **Smart Suggestions**: AI-generated follow-up questions after each response
* **Session Management**: Each conversation gets its own API key for consistency

### 🔑 API Key Management
* **Multi-Key Support**: Use multiple OpenRouter API keys for load distribution
* **Session-Based Assignment**: One key per conversation for consistency
* **Automatic Fallback**: Switches to backup keys on rate limits or errors
* **Usage Tracking**: Monitor key usage via `/api-keys/stats` endpoint

### ☁️ Google Drive Integration
* **Automatic Sync**: Background sync with designated Google Drive folder
* **Real-time Updates**: Manual sync trigger available
* **File Management**: View all indexed files with metadata
* **Secure Access**: Service account-based authentication

### 🎨 User Experience
* **Premium UI**: Glassmorphism design with smooth animations
* **Dark Mode**: Automatic theme detection
* **Responsive Design**: Works seamlessly on desktop and mobile
* **Voice Interaction**: Text-to-Speech and Speech-to-Text support
* **Typewriter Effect**: Smooth message rendering

---

## 🏗️ Architecture

This project uses a **Hybrid RAG** approach to handle both ephemeral local files and persistent cloud data.

```mermaid
graph TD
    A["User Frontend"] <-->|Rest API| B["FastAPI Backend"]
    B -->|Upload| C["Doc Parser (PyMuPDF)"]
    C -->|Text| D["Text Chunker"]
    D -->|Chunks| E["Embedding Model (MiniLM)"]
    E -->|Vectors| F{"Vector Store"}
    F -->|Ephemeral| G["FAISS (Local RAM)"]
    F -->|Persistent| H["MongoDB Atlas"]
  
    B -->|Query| I["RAG Agent"]
    I -->|Retrieve| F
    I -->|Context + Prompt| J["LLM (OpenRouter/Mistral)"]
    J -->|Answer| A
```

---

## 🛠️ Tech Stack

### Backend

* **Framework**: FastAPI (High-performance Async I/O)
* **Language**: Python 3.x
* **AI/ML Logic**:
  * `sentence-transformers` (Embeddings)
  * `pymupdf` (PDF Parsing)
  * `faiss-cpu` (Vector Search)
  * `pymongo` (Database Connectivity)
* **LLM Provider**: OpenRouter (Mistral AI models)

### Frontend

* **Library**: React (Vite)
* **Styling**: TailwindCSS
* **Animations**: Framer Motion
* **Icons**: Lucide React
* **HTTP Client**: Axios

---

## 🚀 Getting Started

### Prerequisites

* **Node.js** 18+ & npm
* **Python** 3.10+
* **MongoDB Atlas** Account (for Google Drive sync)
* **Google Cloud Service Account** (optional, for Drive integration)
* **OpenRouter API Key(s)** (free tier available)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/DurgaPydahSoft/PDF-QA-CHATBOT
   cd PDF-QA-CHATBOT
   ```

2. **Backend Setup**

   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**

   Create a `.env` file in the `backend/` directory:

   ```bash
   # Required: OpenRouter API Key
   # Option 1: Single key
   OPENROUTER_API_KEY=sk-or-v1-your-key-here
   
   # Option 2: Multiple keys (recommended for production)
   OPENROUTER_API_KEY_1=sk-or-v1-key1...
   OPENROUTER_API_KEY_2=sk-or-v1-key2...
   OPENROUTER_API_KEY_3=sk-or-v1-key3...
   OPENROUTER_API_KEY_4=sk-or-v1-key4...
   OPENROUTER_API_KEY_5=sk-or-v1-key5...
   
   # Optional: MongoDB (for Google Drive sync)
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/
   
   # Optional: Google Drive Folder ID
   DRIVE_FOLDER_ID=your_folder_id_here
   
   # Optional: Google Service Account (see docs/GOOGLE_DRIVE_SETUP.md)
   GOOGLE_SA_KEY_BASE64=base64_encoded_json_here
   ```

4. **Start Backend**

   ```bash
   python run.py
   # Server runs on http://localhost:7860
   ```

5. **Frontend Setup**

   ```bash
   cd frontend
   npm install
   
   # Create .env file
   echo "VITE_API_BASE_URL=http://localhost:7860" > .env
   
   npm run dev
   # Frontend runs on http://localhost:5173
   ```

---

---

## 📖 Configuration Guide

### Environment Variables

#### Backend (`.env` in `backend/`)

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | Yes* | Single OpenRouter API key (or use numbered keys) |
| `OPENROUTER_API_KEY_1` to `_5` | Yes* | Multiple API keys for load distribution |
| `MONGODB_URI` | Optional | MongoDB connection string (for Drive sync) |
| `DRIVE_FOLDER_ID` | Optional | Google Drive folder ID to sync |
| `GOOGLE_SA_KEY_BASE64` | Optional | Base64-encoded service account JSON |
| `PORT` | Optional | Backend port (default: 7860) |

*At least one API key format is required.

#### Frontend (`.env` in `frontend/`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | Yes | Backend API URL (e.g., `http://localhost:7860`) |


## 🔌 API Endpoints

### Document Management
- `POST /upload-pdf` - Upload and process local files
- `POST /ask` - Ask questions about local documents
- `GET /api-keys/stats` - View API key usage statistics

### Google Drive
- `GET /drive/status` - Get Drive sync status and file list
- `POST /drive/ask` - Ask questions about Drive documents
- `POST /drive/sync-now` - Trigger manual sync

### Utilities
- `POST /generate-audio` - Text-to-Speech conversion

---

## ☁️ Deployment

### Hugging Face Spaces (Docker)

The backend is optimized for deployment on Hugging Face Spaces using Docker.

1. **Create a Space**: Select "Docker" as the SDK.
2. **Environment Variables**: Go to "Settings" and add the variables from `.env`.
   * *Note*: Credentials can be pasted directly; the app automatically cleans quoted values.
3. **CI/CD Pipeline**:
   * This project includes a **GitHub Action** workflow.
   * Every push to `main` triggers a build and pushes the Docker image to Hugging Face automatically.

### Google Drive Setup

For Google Drive sync functionality, see the comprehensive setup guide:

📖 **[Google Drive Setup Guide](docs/GOOGLE_DRIVE_SETUP.md)**

**Quick Setup:**
- **Local Development**: Place `service_account.json` in `backend/` directory
- **Production**: Base64-encode the JSON and add as `GOOGLE_SA_KEY_BASE64` secret in Hugging Face Spaces

Use the helper script to encode your service account:
```bash
python backend/scripts/encode_service_account.py
```

---

---

### Performance Tips

- **Local Uploads**: Processed in-memory (FAISS) - fast but cleared on restart
- **Drive Sync**: First sync may take time depending on folder size
- **Conversation History**: Limited to last 6 messages to control token usage
- **Vector Search**: Typically <100ms for queries

---



### Backend Logs

The backend provides detailed debug logs:
- Embedding generation time
- Vector search time
- LLM generation time
- Conversation history usage
- API key assignments

---

## 🔒 Security & Privacy

- ✅ **Local Processing**: Embeddings generated locally (no external API calls)
- ✅ **No Data Storage**: Local uploads processed in-memory, not saved
- ✅ **Secure Credentials**: Environment variables for sensitive data
- ✅ **CORS Protection**: Configurable CORS settings
- ✅ **Input Validation**: All user inputs are validated

---

## 📚 Documentation

- 📖 [Architecture Overview](docs/Architecture.md)
- 📖 [Google Drive Setup](docs/GOOGLE_DRIVE_SETUP.md)
- 📖 [Deployment Guide](docs/DEPLOYMENT.md)
- 📖 [Docker Optimization](docs/DOCKER_OPTIMIZATION.md)

---

## 🛣️ Roadmap

- [ ] Support for more file formats (Markdown, TXT, etc.)
- [ ] Export conversation history
- [ ] Multi-language support
- [ ] Advanced search filters
- [ ] User authentication
- [ ] Conversation sharing

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Add comments for complex logic
- Update documentation for new features
- Test thoroughly before submitting PR

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- **OpenRouter** for LLM API access
- **Mistral AI** for the free model
- **Sentence Transformers** for embeddings
- **FAISS** for vector search
- **MongoDB Atlas** for cloud vector storage

---

## 📧 Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/DurgaPydahSoft/PDF-QA-CHATBOT/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/DurgaPydahSoft/PDF-QA-CHATBOT/discussions)
- 📧 **Email**: [Your Email]

---

<div align="center">

**Made with ❤️ by [Your Name/Team]**

⭐ Star this repo if you find it helpful!

</div>
