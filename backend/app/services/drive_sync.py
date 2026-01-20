import os
import io
import time
import json
import threading
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from app.utils.doc_parser import extract_text
from app.utils.text_chunker import chunk_text
from app.rag.embeddings import generate_embeddings
from app.rag.vector_store import VectorStore

from app.rag.mongo_store import MongoVectorStore

class DriveSyncService:
    def __init__(self, vector_store: MongoVectorStore, folder_id: str, credentials_path: str = "service_account.json"):
        self.vector_store = vector_store
        self.credentials_path = credentials_path
        self.folder_id = folder_id
        self.is_syncing = False
        self.last_sync_time = None
        self.stop_event = threading.Event()
        self.connection_info = {}
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

    def _get_env_clean(self, key, default=None):
        val = os.getenv(key, default)
        if val:
            val = val.strip()
            if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                return val[1:-1]
        return val

    def sync_now(self):
        creds_info = None
        
        # 1. Try Individual Environment Variables
        private_key = self._get_env_clean("GOOGLE_PRIVATE_KEY")
        client_email = self._get_env_clean("GOOGLE_CLIENT_EMAIL")
        project_id = self._get_env_clean("GOOGLE_PROJECT_ID")
        private_key_id = self._get_env_clean("GOOGLE_PRIVATE_KEY_ID")

        try:
            if private_key and client_email and project_id and private_key_id:
                print("Using Google credentials from individual environment variables.")
                creds_info = {
                    "type": self._get_env_clean("GOOGLE_TYPE", "service_account"),
                    "project_id": project_id,
                    "private_key_id": private_key_id,
                    "private_key": private_key,
                    "client_email": client_email,
                    "client_id": self._get_env_clean("GOOGLE_CLIENT_ID"),
                    "auth_uri": self._get_env_clean("GOOGLE_AUTH_URI", "https://accounts.google.com/o/oauth2/auth"),
                    "token_uri": self._get_env_clean("GOOGLE_TOKEN_URI", "https://oauth2.googleapis.com/token"),
                    "auth_provider_x509_cert_url": self._get_env_clean("GOOGLE_AUTH_PROVIDER_CERT_URL", "https://www.googleapis.com/oauth2/v1/certs"),
                    "client_x509_cert_url": self._get_env_clean("GOOGLE_CLIENT_CERT_URL") or f"https://www.googleapis.com/robot/v1/metadata/x509/{client_email.replace('@', '%40')}",
                    "universe_domain": self._get_env_clean("GOOGLE_UNIVERSE_DOMAIN", "googleapis.com")
                }
            
            # 2. Try Single JSON Environment Variable
            if not creds_info:
                env_creds = self._get_env_clean("GOOGLE_SERVICE_ACCOUNT_JSON")
                if env_creds:
                    print("Using Google credentials from JSON environment variable.")
                    creds_info = json.loads(env_creds)

            # 3. Try Local File
            if not creds_info and os.path.exists(self.credentials_path):
                print(f"Using Google credentials from local file: {self.credentials_path}")
                with open(self.credentials_path, 'r') as f:
                    creds_info = json.load(f)

            if not creds_info:
                print("Warning: No Google credentials found. Sync skipped.")
                return

            # --- AGGRESSIVE SANITIZATION (Applies to all sources) ---
            if 'private_key' in creds_info:
                pk = creds_info['private_key']
                # Replace literal \n and sanitize whitespace
                sanitized_pk = pk.replace('\\n', '\n').strip()
                creds_info['private_key'] = sanitized_pk
                
            creds = service_account.Credentials.from_service_account_info(
                creds_info,
                scopes=['https://www.googleapis.com/auth/drive.readonly']
            )
            service = build('drive', 'v3', credentials=creds)
        except Exception as e:
            print(f"Error initializing Google Drive credentials: {e}")
            return

        # Store connection info for frontend display
        if creds_info:
            self.connection_info = {
                "email": creds_info.get("client_email", "Unknown"),
                "project_id": creds_info.get("project_id", "Unknown"),
                "scopes": ["Read-Only"]  # We hardcode scopes based on the logic above
            }

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
        
        # --- DELETION LOGIC ---
        # Identify files present in DB but missing from current Drive list
        current_drive_ids = {f['id'] for f in files}
        existing_db_ids = set(processed_files.keys())
        
        files_to_delete = existing_db_ids - current_drive_ids
        
        for file_id in files_to_delete:
            print(f"File deleted from Drive. Removing from DB: {file_id}")
            self.vector_store.delete_by_file_id(file_id)
            
        if files_to_delete:
             print(f"Removed {len(files_to_delete)} orphaned files from MongoDB.")

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
