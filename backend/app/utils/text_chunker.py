from typing import List

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    """
    Splits text recursively by separators to preserve semantic structure.
    Tries these separators in order: ['\n\n', '\n', '.', ' ', '']
    """
    if not text:
        return []

    separators = ["\n\n", "\n", ".", " ", ""]
    
    def _split_text(text: str, separators: List[str]) -> List[str]:
        final_chunks = []
        separator = separators[-1]
        new_separators = []
        
        # Find the best separator
        for i, sep in enumerate(separators):
            if sep == "":
                separator = ""
                break
            if sep in text:
                separator = sep
                new_separators = separators[i+1:]
                break
                
        # Split text using the separator
        splits = [text] if separator == "" else text.split(separator)
        
        current_chunk = []
        current_length = 0
        
        for split in splits:
            split_len = len(split)
            
            # If a single split is too big, recurse
            if split_len > chunk_size and new_separators:
                # Add what we have so far
                if current_chunk:
                    joined = separator.join(current_chunk)
                    final_chunks.append(joined)
                    current_chunk = []
                    current_length = 0
                
                # Recurse on the large split
                sub_chunks = _split_text(split, new_separators)
                final_chunks.extend(sub_chunks)
                continue
                
            # Add to current chunk if it fits
            # Note: We add len(separator) to account for re-joining
            if current_length + split_len + len(separator) <= chunk_size:
                current_chunk.append(split)
                current_length += split_len + len(separator)
            else:
                # Close current chunk
                if current_chunk:
                    final_chunks.append(separator.join(current_chunk))
                
                # Start new chunk with overlaps if implementation supported it, 
                # but for simplicity in recursion, we just start fresh or use a simple sliding window on the result.
                # Here we just start a new chunk with the current split.
                current_chunk = [split]
                current_length = split_len
                
        if current_chunk:
            final_chunks.append(separator.join(current_chunk))
            
        return final_chunks

    # Initial split
    words_chunks = _split_text(text, separators)
    
    # Post-processing: Merge small chunks if possible (simple aggregation)
    # The recursive function above handles breaking down. Now let's just ensure we respect overlap roughly.
    # Actually, a simpler robust approach for this function without using LangChain library is:
    
    final_docs = []
    current_doc = []
    current_len = 0
    
    # Flatten everything first? No, let's just reuse the LangChain-like logic if we had the library.
    # Since we don't, we'll keep the recursive result as "good enough" segments, 
    # but we might want to merge them if they are too small.
    
    merged_chunks = []
    temp_chunk = ""
    
    for chunk in words_chunks:
        if len(temp_chunk) + len(chunk) + 1 <= chunk_size:
             temp_chunk += (chunk + " ")
        else:
             merged_chunks.append(temp_chunk.strip())
             # Handle overlap - simplistic approach: keep last 'overlap' chars
             overlap_text = temp_chunk[-overlap:] if overlap > 0 else ""
             temp_chunk = overlap_text + chunk + " "
             
    if temp_chunk:
        merged_chunks.append(temp_chunk.strip())
        
    return merged_chunks

if __name__ == "__main__":
    test_text = "This is a test document to verify the chunking logic. " * 50
    chunks = chunk_text(test_text, chunk_size=100, overlap=20)
    for i, chunk in enumerate(chunks[:5]):
        print(f"Chunk {i}: {len(chunk)} chars -> {chunk[:20]}...")
