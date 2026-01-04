import faiss
import numpy as np
from typing import List, Tuple
import os

class VectorStore:
    def __init__(self, dimension: int = 384): # Default for all-MiniLM-L6-v2
        self.dimension = dimension
        self.index = faiss.IndexFlatL2(dimension)
        self.chunks = []

    def add_texts(self, texts: List[str], embeddings: np.ndarray):
        """Adds texts and their corresponding embeddings to the index."""
        if len(texts) != len(embeddings):
            raise ValueError("Texts and embeddings must have the same length.")
        
        self.index.add(embeddings.astype('float32'))
        self.chunks.extend(texts)

    def search(self, query_embedding: np.ndarray, k: int = 5) -> List[Tuple[str, float]]:
        """Searches for the k most similar chunks to the query embedding."""
        if self.index.ntotal == 0:
            return []
        
        distances, indices = self.index.search(query_embedding.reshape(1, -1).astype('float32'), k)
        
        results = []
        for i in range(len(indices[0])):
            idx = indices[0][i]
            if idx != -1:
                results.append((self.chunks[idx], float(distances[0][i])))
                
        return results

    def save(self, path: str):
        """Saves the index and chunks to disk."""
        faiss.write_index(self.index, path + ".index")
        with open(path + ".chunks", "w", encoding="utf-8") as f:
            for chunk in self.chunks:
                f.write(chunk.replace("\n", "\\n") + "\n")

    def load(self, path: str):
        """Loads the index and chunks from disk."""
        if os.path.exists(path + ".index"):
            self.index = faiss.read_index(path + ".index")
        if os.path.exists(path + ".chunks"):
            with open(path + ".chunks", "r", encoding="utf-8") as f:
                self.chunks = [line.strip().replace("\\n", "\n") for line in f]

if __name__ == "__main__":
    # Test
    vs = VectorStore(dimension=384)
    texts = ["How to bake a cake", "Python programming tutorial"]
    embs = np.random.rand(2, 384).astype('float32') # Mock embeddings
    vs.add_texts(texts, embs)
    
    query_emb = np.random.rand(1, 384).astype('float32')
    res = vs.search(query_emb, k=1)
    print(f"Search result: {res}")
