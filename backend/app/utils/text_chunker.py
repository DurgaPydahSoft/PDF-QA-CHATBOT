from typing import List

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    """Splits text into chunks of specified size with overlap."""
    if not text:
        return []
    
    chunks = []
    start = 0
    
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        
        # If we've reached the end of the text, break
        if end >= len(text):
            break
            
        # Move forward by (chunk_size - overlap)
        start += (chunk_size - overlap)
        
    return chunks

if __name__ == "__main__":
    test_text = "This is a test document to verify the chunking logic. " * 50
    chunks = chunk_text(test_text, chunk_size=100, overlap=20)
    for i, chunk in enumerate(chunks[:5]):
        print(f"Chunk {i}: {len(chunk)} chars -> {chunk[:20]}...")
