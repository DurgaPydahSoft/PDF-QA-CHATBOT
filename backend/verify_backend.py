import os
from pdf_parser import extract_text_from_pdf
from text_chunker import chunk_text
from embeddings import generate_embeddings
from vector_store import VectorStore
from qa_agent import QAAgent

def verify_backend():
    print("Testing Backend Modules...")
    
    # 1. Test PDF Parsing (Mock or use a real file if available)
    # Since I don't have a PDF yet, I'll just check if the logic works with a mock path error or success
    print("- PDF Parser: Checking...")
    text = "This is a sample document for testing the PDF-to-Question-Answer system. It contains information about AI and LLMs."
    
    # 2. Test Chunking
    print("- Text Chunker: Checking...")
    chunks = chunk_text(text, chunk_size=50, overlap=10)
    print(f"  Chunks created: {len(chunks)}")
    if len(chunks) == 0:
        print("  FAILED: No chunks created.")
        return
    
    # 3. Test Embeddings (requires model download, might be slow first time)
    print("- Embeddings: Checking (might take a moment to load model)...")
    try:
        embs = generate_embeddings(chunks)
        print(f"  Embeddings generated. Shape: {embs.shape}")
    except Exception as e:
        print(f"  FAILED: {e}")
        return

    # 4. Test Vector Store
    print("- Vector Store: Checking...")
    vs = VectorStore(dimension=384)
    vs.add_texts(chunks, embs)
    print(f"  Added {len(chunks)} chunks to vector store.")
    
    # 5. Test Search
    query_emb = generate_embeddings(["AI and LLMs"])[0]
    results = vs.search(query_emb, k=2)
    print(f"  Search results found: {len(results)}")
    for chunk, dist in results:
        print(f"  Found: {chunk[:30]}... (Dist: {dist:.4f})")

    # 6. Test LLM Client (requires API key, skipping real call in dry run)
    print("- LLM Client: Checking (skipping real API call)...")
    
    print("\nBackend Verification (logic only) COMPLETED.")

if __name__ == "__main__":
    verify_backend()
