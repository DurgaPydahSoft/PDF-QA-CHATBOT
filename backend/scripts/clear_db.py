import os
import sys

# Ensure the app module can be found
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
from app.rag.mongo_store import MongoVectorStore

def clear_database():
    load_dotenv()
    
    mongo_uri = os.getenv("MONGODB_URI")
    if not mongo_uri:
        print("Error: MONGODB_URI environment variable not found.")
        return

    print(f"Connecting to MongoDB...")
    
    # Use the same configuration as main.py
    store = MongoVectorStore(
        mongodb_uri=mongo_uri,
        db_name="doc-chat",
        collection_name="drive_knowledge",
        index_name="vector_index"
    )
    
    count_before = store.collection.count_documents({})
    print(f"Documents before clearing: {count_before}")
    
    if count_before > 0:
        store.clear()
        print("Successfully cleared all embeddings from MongoDB.")
    else:
        print("Database is already empty.")

if __name__ == "__main__":
    confirm = input("Are you sure you want to delete ALL embeddings from MongoDB? (y/n): ")
    if confirm.lower() == 'y':
        clear_database()
    else:
        print("Operation cancelled.")
