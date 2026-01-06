import os
import io
import time
import json
import threading
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from doc_parser import extract_text
from text_chunker import chunk_text
from embeddings import generate_embeddings
from vector_store import VectorStore

from mongo_vector_store import MongoVectorStore

class DriveSyncService:
    def __init__(self, vector_store: MongoVectorStore, folder_id: str, credentials_path: str = "service_account.json"):
        self.vector_store = vector_store
        self.credentials_path = credentials_path
        self.folder_id = folder_id
        self.is_syncing = False
        self.last_sync_time = None
        self.stop_event = threading.Event()
        # Metadata is now handled within MongoVectorStore documents
        
    def start(self):
        if not self.is_syncing:
            self.is_syncing = True
            self.stop_event.clear()
            threading.Thread(target=self._sync_loop, daemon=True).start()
            print("Drive Sync Service started.")

    def stop(self):
        self.stop_event.set()
        self.is_syncing = False
        print("Drive Sync Service stopped.")

    def _sync_loop(self):
        while not self.stop_event.is_set():
            if self.folder_id:
                try:
                    self.sync_now()
                except Exception as e:
                    print(f"Error during Drive sync: {e}")
            
            # Poll every 5 minutes (adjustable)
            time.sleep(300)

    def sync_now(self):
        if not os.path.exists(self.credentials_path):
            print(f"Warning: {self.credentials_path} not found. Sync skipped.")
            return

        creds = service_account.Credentials.from_service_account_file(
            self.credentials_path, 
            scopes=['https://www.googleapis.com/auth/drive.readonly']
        )
        service = build('drive', 'v3', credentials=creds)

        # Get existing metadata from MongoDB
        processed_files = self.vector_store.get_all_metadata()

        # List files in the folder
        results = service.files().list(
            q=f"'{self.folder_id}' in parents and trashed = false",
            fields="files(id, name, modifiedTime, mimeType)"
        ).execute()
        files = results.get('files', [])

        new_files_count = 0
        for file in files:
            file_id = file['id']
            modified_time = file['modifiedTime']
            
            # Check if file is new or modified
            if file_id not in processed_files or processed_files[file_id] != modified_time:
                print(f"Processing new/updated file from Drive: {file['name']}")
                
                # If it's an update, clear old chunks for this file
                if file_id in processed_files:
                    self.vector_store.delete_by_file_id(file_id)

                content = self._download_file(service, file)
                if content:
                    # If it's a Google Doc/Sheet/Slide, we exported it as PDF, so treat it as one
                    process_name = file['name']
                    if 'google-apps' in file['mimeType']:
                        if not process_name.lower().endswith('.pdf'):
                            process_name += '.pdf'
                    
                    text = extract_text(content, process_name)
                    chunks = chunk_text(text)
                    if chunks:
                        embeddings = generate_embeddings(chunks)
                        # Add metadata to each chunk
                        chunk_metadata = [{"file_id": file_id, "file_name": file['name'], "modified_time": modified_time} for _ in chunks]
                        self.vector_store.add_texts(chunks, embeddings, metadata=chunk_metadata)
                        new_files_count += 1

        if new_files_count > 0:
            print(f"Sync complete. Added/Updated {new_files_count} files in MongoDB.")
        
        self.last_sync_time = time.strftime("%Y-%m-%d %H:%M:%S")

    def _download_file(self, service, file):
        file_id = file['id']
        mime_type = file['mimeType']
        
        # Buffer for in-memory download
        fh = io.BytesIO()
        
        try:
            if 'google-apps' in mime_type:
                # Handle Google Docs/Sheets/Slides by exporting to PDF
                request = service.files().export_media(fileId=file_id, mimeType='application/pdf')
            else:
                # Normal file
                request = service.files().get_media(fileId=file_id)
            
            downloader = MediaIoBaseDownload(fh, request)
            done = False
            while done is False:
                status, done = downloader.next_chunk()
            
            return fh.getvalue()
        except Exception as e:
            print(f"Error downloading {file['name']}: {e}")
            return None
