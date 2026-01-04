from sentence_transformers import SentenceTransformer
from typing import List
import numpy as np

import time

print("Loading Embedding Model (all-MiniLM-L6-v2)...")
start_time = time.time()
# Load the model once
model = SentenceTransformer('all-MiniLM-L6-v2')
print(f"Model loaded successfully in {time.time() - start_time:.2f} seconds.")

def generate_embeddings(texts: List[str]) -> np.ndarray:
    """Generates embeddings for a list of texts."""
    if not texts:
        return np.array([])
    embeddings = model.encode(texts)
    return np.array(embeddings)

if __name__ == "__main__":
    texts = ["This is a test document.", "Another example text."]
    embs = generate_embeddings(texts)
    print(f"Generated embeddings shape: {embs.shape}")
