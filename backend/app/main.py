from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import os
from typing import Optional, List
import json

print("Starting AI-Based PDF Q&A Agent API...")
from app.utils.doc_parser import extract_text
from app.utils.text_chunker import chunk_text
print("Initializing Core Modules...")
from app.rag.embeddings import generate_embeddings
from app.rag.vector_store import VectorStore
from app.rag.agent import QAAgent
from app.rag.mongo_store import MongoVectorStore
from app.services.drive_sync import DriveSyncService
from dotenv import load_dotenv
from app.services.tts import text_to_speech_base64

load_dotenv() # Load environment variables from .env

app = FastAPI(title="AI-Based PDF Q&A Agent API")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Configuration
MONGODB_URI = os.environ.get("MONGODB_URI", "your_mongodb_uri_here")

def extract_folder_id(input_str: str) -> str:
    """Extracts ID if a full Google Drive URL is provided."""
    if not input_str: return ""
    if "drive.google.com" in input_str:
        try:
            if "/folders/" in input_str:
                return input_str.split("/folders/")[1].split("?")[0].split("/")[0]
            elif "id=" in input_str:
                return input_str.split("id=")[1].split("&")[0]
        except Exception as e:
            print(f"Error parsing Drive URL: {e}")
    return input_str

DRIVE_FOLDER_ID = extract_folder_id(os.environ.get("DRIVE_FOLDER_ID", "1867NgaZZAtDLlUI1M1BmM0Od5C_pQYQ"))

# Global instances
local_vector_store = VectorStore(dimension=384)
# Drive vector store uses MongoDB Atlas
drive_vector_store = MongoVectorStore(
    mongodb_uri=MONGODB_URI,
    db_name="doc-chat",
    collection_name="drive_knowledge",
    index_name="vector_index"
)

local_agent = QAAgent(local_vector_store)
drive_agent = QAAgent(drive_vector_store)

drive_sync = DriveSyncService(drive_vector_store, folder_id=DRIVE_FOLDER_ID)
# Start sync immediately
drive_sync.start()

@app.get("/")
async def root():
    return {"message": "Welcome to the AI-Based PDF Q&A Agent API by Bannu"}

# --- LOCAL UPLOAD ENDPOINTS ---

@app.post("/upload-pdf")
async def upload_pdf(files: List[UploadFile] = File(...)):
    allowed_extensions = {".pdf", ".docx", ".xlsx", ".xls", ".pptx"}
    for file in files:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in allowed_extensions:
            raise HTTPException(status_code=400, detail=f"File {file.filename} is not a supported format.")
    
    # Reset local vector store for the new batch
    local_vector_store.index.reset()
    local_vector_store.chunks = []
    
    total_chunks = 0
    processed_files = []

    for file in files:
        try:
            file_content = await file.read()
            text = extract_text(file_content, file.filename)
            if not text: continue
            
            chunks = chunk_text(text)
            if chunks:
                embeddings = generate_embeddings(chunks)
                local_vector_store.add_texts(chunks, embeddings)
                total_chunks += len(chunks)
                processed_files.append(file.filename)
        except Exception as e:
            print(f"Error processing {file.filename}: {e}")
            continue
    
    # Generate initial suggestions
    suggestions = local_agent.get_initial_suggestions()

    return {
        "message": f"Successfully processed {len(processed_files)} files locally.",
        "files": processed_files,
        "chunks": total_chunks,
        "suggestions": suggestions
    }

@app.post("/ask")
async def ask_question(payload: dict):
    question = payload.get("question")
    if not question: raise HTTPException(status_code=400, detail="Question is required.")
    
    if len(local_vector_store.chunks) == 0:
        raise HTTPException(status_code=400, detail="No local documents uploaded.")
    
    try:
        agent_result = local_agent.ask(question)
        answer = agent_result["answer"]
        sources = agent_result["sources"]
        
        # Generate Audio
        audio_base64 = text_to_speech_base64(answer)
        
        return {
            "answer": answer,
            "sources": sources,
            "audio_base64": audio_base64
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- GOOGLE DRIVE ENDPOINTS ---

@app.get("/drive/status")
async def get_drive_status():
    # total_chunks logic is slightly different for MongoDB
    # We can skip expensive count for status if preferred, or use collection.count_documents
    try:
        count = drive_vector_store.collection.count_documents({})
    except:
        count = 0
        
    service_account_available = (
        os.path.exists("service_account.json") or 
        os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON") is not None or
        (os.getenv("GOOGLE_PRIVATE_KEY") is not None and os.getenv("GOOGLE_CLIENT_EMAIL") is not None)
    )

    return {
        "folder_id": drive_sync.folder_id,
        "is_syncing": drive_sync.is_syncing,
        "last_sync": drive_sync.last_sync_time,
        "total_chunks": count,
        "service_account_exists": service_account_available,
        "mongodb_connected": MONGODB_URI != "your_mongodb_uri_here"
    }

# Config endpoint is no longer needed but kept as stub to avoid front-end breakage
@app.post("/drive/config")
async def update_drive_config(payload: dict):
    return {"message": "Folder is hardcoded in the backend. Change ignored."}
@app.post("/drive/ask")
async def ask_drive_question(payload: dict):
    question = payload.get("question")
    if not question: raise HTTPException(status_code=400, detail="Question is required.")
    
    try:
        agent_result = drive_agent.ask(question)
        answer = agent_result["answer"]
        sources = agent_result["sources"]
        
        # Generate Audio
        audio_base64 = text_to_speech_base64(answer)
        
        return {
            "answer": answer,
            "sources": sources,
            "audio_base64": audio_base64
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/drive/sync-now")
async def trigger_sync(background_tasks: BackgroundTasks):
    if not drive_sync.folder_id:
        raise HTTPException(status_code=400, detail="No folder configured.")
    background_tasks.add_task(drive_sync.sync_now)
    return {"message": "Sync triggered in background."}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
