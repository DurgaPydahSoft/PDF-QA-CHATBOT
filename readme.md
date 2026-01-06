Perfect 👍
Based on your decision to use **Next.js for the frontend**, below is a **clean, structured NTT-style project documentation** that you can directly use for **college submission, internal review, or resume-backed projects**.

I am **fixing the requirements now** and presenting the **complete documentation**.

---

# 📘 Project Documentation (NTT Style)

## Project Title

**AI-Based PDF Question Answering Agent using LLMs**

---

## 1. Abstract

In the modern digital era, organizations and individuals deal with large volumes of unstructured documents such as PDFs. Extracting meaningful information manually from these documents is time-consuming and inefficient.
This project proposes an **AI-powered PDF Question Answering Agent** that allows users to upload PDF documents and ask natural language questions. The system intelligently parses, stores, and retrieves relevant information from the document and generates accurate responses using **Large Language Models (LLMs)** integrated through **OpenRouter**.

The application uses **Python-based backend services**, **vector-based semantic search**, and a **Next.js frontend** to provide a seamless and interactive user experience.

---

## 2. Problem Statement

Users often struggle to quickly retrieve specific information from lengthy PDF documents such as reports, research papers, manuals, and policies. Traditional keyword search fails to understand semantic meaning, context, and intent.

**Objective:**
To design and implement an intelligent agent that can:

* Understand the content of a PDF document
* Answer user queries accurately based on document context
* Reduce manual reading effort and improve productivity

---

## 3. Proposed Solution

The proposed system uses a **Retrieval-Augmented Generation (RAG)** approach where:

* PDF content is extracted and converted into vector embeddings
* Relevant document sections are retrieved based on semantic similarity
* A Large Language Model generates context-aware answers

The solution ensures that answers are **grounded strictly in the uploaded PDF**, preventing hallucinations and irrelevant responses.

---

## 4. System Architecture

User (Browser)
   ↓
Next.js Frontend (Dual-Tab Interface)
   ↓
FastAPI Backend
   ↓
┌───────────────────────┴───────────────────────┐
│                                               │
In-Memory PDF Processing               Google Drive Sync Service
(FAISS - Local Tab)                   (Background Polling)
│                                               │
└───────────────────────┬───────────────────────┘
   ↓
┌───────────────────────┴───────────────────────┐
│                                               │
Local In-Memory Vector Store         MongoDB Atlas Vector Search
(FAISS - Volatile)                 (Cloud Store - Persistent)
│                                               │
└───────────────────────┬───────────────────────┘
   ↓
LLM via OpenRouter
   ↓
Response to User
```

---

## 5. Technology Stack

### Frontend

* **Next.js (React Framework)**
* Tailwind CSS (UI styling)
* Axios / Fetch API (API communication)

### Backend

* **Python**
* **FastAPI**
* LangChain (optional for orchestration)

### AI & NLP

* OpenRouter (LLM integration)
* Mistral / LLaMA models
* Sentence Transformers (Embeddings)

### Storage

* **FAISS** (Local Vector Store - In-Memory)
* **MongoDB Atlas Vector Search** (Cloud-Native Persistent Store)
* **Google Drive API** (Source for automated document sync)
* **In-Memory Memory** (io.BytesIO for stateless processing)

---

## 6. Functional Requirements

### PDF Handling
* **Dual Upload Modes**: 
    - **Local Upload**: Drag-and-drop files for immediate, temporary chat.
    - **Drive Sync**: Connect a Google Drive folder for persistent, automated knowledge extraction.
* Extract text from PDF, DOCX, XLSX, and PPTX formats.
* Split text into semantic chunks and store in the appropriate vector store.

### Automated Sync (Google Drive)
* **Background Monitoring**: Polls a shared Drive folder every 5 minutes.
* **Incremental Updates**: Detects new or modified files and updates MongoDB Atlas instantly.
* **Stateless Processing**: Raw files are never saved to disk; they are processed entirely in RAM.

### User Interface
* **Tabbed Experience**: Fast switching between Local and Drive workspaces.
* **Real-time Status**: Monitor sync progress and database connection health directly from the UI.

---

## 7. Non-Functional Requirements

* **Performance:** Fast query response time
* **Scalability:** Can be extended to multiple PDFs
* **Security:** API key protection and file validation
* **Usability:** Simple and intuitive UI
* **Maintainability:** Modular backend design

---

## 8. Data Flow Description

### Step-by-Step Flow

1. User uploads a PDF through Next.js frontend
2. PDF is sent to FastAPI backend
3. Backend extracts text from PDF
4. Text is split into smaller chunks
5. Each chunk is converted into embeddings
6. Embeddings are stored in FAISS vector store
7. User enters a question
8. Relevant chunks are retrieved using similarity search
9. Context + question are sent to LLM via OpenRouter
10. LLM generates a response
11. Answer is displayed on frontend

---

### 1. Frontend Module (React/Next.js)
* Dual-tab navigation system.
* Dynamic status monitoring for Google Drive sync.

### 2. Google Drive Sync Module
* Service Account authentication.
* Background polling thread.
* Recursive file export (Google Docs/Sheets/Slides to PDF).

### 3. Mongo Vector Store Module
* High-performance semantic search using MongoDB Atlas.
* Persistent storage for Drive-sourced document embeddings.
* Stateless metadata tracking (last modified times).

### 4. Local Vector Store Module
* Volatile, in-memory FAISS store for quick local uploads.

---

## 10. API Design (Overview)

### Upload PDF

```
POST /upload-pdf
```

### Ask Question

```
POST /ask
Body:
{
  "question": "User query"
}
```

---

## 11. Project Folder Structure

```
pdf-qa-agent/
│
├── backend/
│   ├── main.py
│   ├── pdf_parser.py
│   ├── text_chunker.py
│   ├── embeddings.py
│   ├── vector_store.py
│   ├── llm_client.py
│   └── qa_agent.py
│
├── frontend/
│   └── nextjs-app/
│       ├── pages/
│       ├── components/
│       └── services/
│
├── vector_store/
│
├── docs/
│   └── NTT_Project_Documentation.md
│
├── requirements.txt
└── README.md
```

---

## 12. Advantages of the System

* Saves time and manual effort
* Context-aware and accurate answers
* Scalable and extensible architecture
* Real-world AI application
* Resume and interview-ready project

---

## 13. Applications

* Academic research assistance
* Legal and policy document analysis
* Corporate SOP search
* Medical and technical documentation
* Educational content exploration

---

## 14. Limitations

* Requires clean and readable PDFs
* Performance depends on embedding quality
* Large PDFs may increase processing time
* Internet dependency for LLM access

---

## 15. Future Enhancements

* Multi-PDF support
* Page number citations in answers
* User authentication
* Role-based access
* Cloud deployment (AWS/GCP)
* Voice-based querying
* Document summarization

---

## 16. Cloud Infrastructure Setup (New)

### 🔑 Google Drive Integration
1. **Service Account**: Place `service_account.json` in the `backend/` directory.
2. **Permission**: Share your target Google Drive folder with the service account email as a "Viewer".
3. **Environment Variable**: Add `DRIVE_FOLDER_ID=your_full_folder_link_or_id` to your `.env` file in the `backend/` directory.

### 🍃 MongoDB Atlas Vector Search
1. **Connection**: Add your `MONGODB_URI` to your `.env` file.
2. **Index**: Create an **Atlas Vector Search** index named `vector_index` on the `drive_knowledge` collection.
3. **Dimensions**: Use `384` dimensions with `cosine` similarity for the `embedding` field.

---

## 17. Conclusion

This project demonstrates the effective use of **AI, LLMs, and semantic search** to solve a real-world document understanding problem. By combining Python backend services, OpenRouter-based LLMs, and a modern Next.js frontend, the system provides an efficient, scalable, and intelligent solution for PDF-based question answering.

---

### 🚀 Next Steps (Optional)

If you want, I can:

1. Convert this into **college NTT format (PDF/Word-ready)**
2. Create **architecture diagrams**
3. Provide **complete backend + frontend code**
4. Help you deploy it on **AWS / Vercel**

Just tell me what you want next 👍
