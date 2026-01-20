import os
from typing import List, Tuple
from pymongo import MongoClient
import numpy as np

class MongoVectorStore:
    def __init__(self, mongodb_uri: str, db_name: str, collection_name: str, index_name: str = "vector_index"):
        self.client = MongoClient(mongodb_uri)
        self.db = self.client[db_name]
        self.collection = self.db[collection_name]
        self.index_name = index_name

    def add_texts(self, texts: List[str], embeddings: np.ndarray, metadata: List[dict] = None):
        """Adds texts and their corresponding embeddings to MongoDB."""
        if len(texts) != len(embeddings):
            raise ValueError("Texts and embeddings must have the same length.")
        
        documents = []
        for i in range(len(texts)):
            doc = {
                "text": texts[i],
                "embedding": embeddings[i].tolist(),
                "metadata": metadata[i] if metadata else {}
            }
            documents.append(doc)
        
        if documents:
            self.collection.insert_many(documents)

    def search(self, query_embedding: np.ndarray, k: int = 5) -> List[Tuple[str, float]]:
        """Searches for the k most similar chunks using MongoDB Atlas Vector Search."""
        pipeline = [
            {
                "$vectorSearch": {
                    "index": self.index_name,
                    "path": "embedding",
                    "queryVector": query_embedding.tolist(),
                    "numCandidates": k * 10,
                    "limit": k
                }
            },
            {
                "$project": {
                    "text": 1,
                    "metadata": 1,
                    "score": {"$meta": "vectorSearchScore"}
                }
            }
        ]
        
        results = list(self.collection.aggregate(pipeline))
        return [(res["text"], res["score"], res.get("metadata", {})) for res in results]

    def clear(self):
        """Clears the collection."""
        self.collection.delete_many({})

    def get_file_list(self) -> List[dict]:
        """Retrieves a list of unique files with their IDs and names."""
        pipeline = [
            {"$group": {"_id": "$metadata.file_id", "name": {"$first": "$metadata.file_name"}, "last_modified": {"$max": "$metadata.modified_time"}}}
        ]
        results = self.collection.aggregate(pipeline)
        return [{"id": res["_id"], "name": res.get("name", "Unknown File"), "modified_time": res.get("last_modified")} for res in results if res["_id"]]

    def get_all_metadata(self) -> dict:
        """Retrieves all unique file IDs and their modified times from the documents."""
        # Instead of a separate metadata file, we store metadata in each chunk's document.
        # This helper helps the DriveSyncService know which files it has already processed.
        pipeline = [
            {"$group": {"_id": "$metadata.file_id", "last_modified": {"$max": "$metadata.modified_time"}}}
        ]
        results = self.collection.aggregate(pipeline)
        return {res["_id"]: res["last_modified"] for res in results if res["_id"]}

    def delete_by_file_id(self, file_id: str):
        """Deletes all chunks associated with a specific file ID."""
        self.collection.delete_many({"metadata.file_id": file_id})
