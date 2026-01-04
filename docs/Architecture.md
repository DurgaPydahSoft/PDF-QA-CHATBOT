# 🏗️ Software Architecture Documentation

## Project Title: AI-Based PDF Question Answering Agent

This document outlines the software architecture, technical components, and core concepts behind the AI-Based PDF Q&A Agent.

---

## 1. System Architecture Overview

The system follows the **Retrieval-Augmented Generation (RAG)** architecture. This pattern enhances the capabilities of Large Language Models (LLMs) by providing them with specific, retrieved context from a user's private document (PDF) before generating a response.

### High-Level Data Flow

```mermaid
graph TD
    A[User Uploads Multiple PDFs] --> B[FastAPI Backend]
    B --> C[Sequential Text Extraction]
    C --> D[Semantic Text Chunking]
    D --> E[Combined Embedding Generation]
    E --> F[FAISS Vector Store (Aggregated)]
    
    G[User Asks Question] --> H[Question Embedding]
    H --> I[Similarity Search in FAISS]
    I --> J[Context Retrieval]
    J --> K[LLM via OpenRouter]
    K --> L[Generate Context-Aware Answer]
    L --> M[Display to User]
```

---

## 2. Technical Concepts

### A. PDF Extraction
The system uses **PyMuPDF/PyPDF** to read raw data from the binary PDF structure and convert it into a UTF-8 encoded string. This is the first step in converting unstructured data into a processable format.

### B. Semantic Text Chunking
Long documents cannot be processed by LLMs in one go due to "context window" limits.
- **Concept:** We split the text into smaller pieces (chunks), typically 1000 characters.
- **Overlap:** We use a 200-character overlap between chunks to ensure that semantic context at the edges of a split is not lost.

### C. Vector Embeddings
- **Conceptual Logic:** Embeddings turn words/paragraphs into a list of numbers (vectors) in a high-dimensional space. Words with similar meanings are placed closer together in this space.
- **Model:** We use the `all-MiniLM-L6-v2` SentenceTransformer, which converts text into a 384-dimensional vector.

### D. Vector Database (FAISS)
- **FAISS (Facebook AI Similarity Search):** Instead of a traditional SQL database, we use a vector index. It is highly optimized for "Nearest Neighbor" searches, allowing the system to find the most relevant text chunks in milliseconds.

### E. Retrieval-Augmented Generation (RAG)
This is the "Brain" of the application.
1. **Retrieve:** When a question is asked, it is converted to a vector. We find the top 3 most similar chunks from the FAISS database.
2. **Augment:** We inject these chunks into a system prompt.
3. **Generate:** We send the augmented prompt to the LLM (OpenRouter) to generate a grounded answer.

---

## 3. Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React (Vite) | Interactive UI, File Handling |
| **Styling** | Vanilla CSS | Premium Glassmorphism UI |
| **Backend** | FastAPI (Python) | High-performance API orchestration |
| **Vector Index** | FAISS | Storage and Similarity Search |
| **Embeddings** | SentenceTransformers | Text-to-Vector conversion |
| **LLM Gateway** | OpenRouter | Access to Mistral/LLaMA models |

---

## 4. Performance & Scalability

- **Low Latency:** Using FAISS allows for O(log n) search time, making it extremely fast even for very large documents.
- **Stateless Backend:** The FastAPI endpoints are stateless, allowing for easy horizontal scaling.
- **Memory Efficient:** The `all-MiniLM` model is compact (90MB), enabling the backend to run on standard hardware without expensive GPUs.

---

## 5. Security & Privacy
- **Local Processing:** Embeddings and Vector indexing happen on your server.
- **Context Isolation:** The LLM only sees the specific fragments of the PDF needed to answer the question, not the entire document at once.

---
