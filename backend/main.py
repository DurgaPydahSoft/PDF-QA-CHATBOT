from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from typing import Optional, List

print("Starting AI-Based PDF Q&A Agent API...")
from doc_parser import extract_text
from text_chunker import chunk_text
print("Initializing Core Modules...")
from embeddings import generate_embeddings
from vector_store import VectorStore
from qa_agent import QAAgent

app = FastAPI(title="AI-Based PDF Q&A Agent API")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
vector_store = VectorStore(dimension=384)
qa_agent = QAAgent(vector_store)

@app.get("/")
async def root():
    return {"message": "Welcome to the AI-Based PDF Q&A Agent API by - Bannu"}

@app.post("/upload-pdf")
async def upload_pdf(files: List[UploadFile] = File(...)):
    # Validate all files first
    allowed_extensions = {".pdf", ".docx", ".xlsx", ".xls", ".pptx"}
    for file in files:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in allowed_extensions:
            raise HTTPException(status_code=400, detail=f"File {file.filename} is not a supported format.")
    
    # Reset vector store for the new batch of documents
    vector_store.index.reset()
    vector_store.chunks = []
    
    total_chunks = 0
    processed_files = []

    for file in files:
        try:
            # Read file content into memory
            file_content = await file.read()
            
            # Process the document
            text = extract_text(file_content, file.filename)
            if not text:
                print(f"Warning: Could not extract text from {file.filename}")
                continue
            
            chunks = chunk_text(text)
            if chunks:
                embeddings = generate_embeddings(chunks)
                vector_store.add_texts(chunks, embeddings)
                total_chunks += len(chunks)
                processed_files.append(file.filename)
        
        except Exception as e:
            print(f"Error processing {file.filename}: {e}")
            continue
    
    if not processed_files:
        raise HTTPException(status_code=500, detail="Could not process any of the uploaded PDFs.")

    return {
        "message": f"Successfully processed {len(processed_files)} files.",
        "files": processed_files,
        "chunks": total_chunks
    }

@app.post("/ask")
async def ask_question(payload: dict):
    question = payload.get("question")
    if not question:
        raise HTTPException(status_code=400, detail="Question is required.")
    
    if len(vector_store.chunks) == 0:
        raise HTTPException(status_code=400, detail="No PDF has been uploaded and processed yet.")
    
    try:
        answer = qa_agent.ask(question)
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
