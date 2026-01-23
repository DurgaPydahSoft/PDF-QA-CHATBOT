"""
API Key Manager for OpenRouter
Manages multiple API keys with session-based assignment and fallback logic
"""
import os
import random
from typing import List, Optional, Dict
from collections import defaultdict
import threading
from dotenv import load_dotenv

load_dotenv()

class APIKeyManager:
    """
    Manages multiple OpenRouter API keys with:
    - Session-based assignment (one key per conversation)
    - Automatic fallback on errors
    - Usage tracking
    - Round-robin or random selection
    """
    
    def __init__(self):
        self.keys: List[str] = []
        self.key_index = 0
        self.session_key_map: Dict[str, str] = {}  # session_id -> api_key
        self.key_usage: Dict[str, int] = defaultdict(int)  # Track usage per key
        self.key_errors: Dict[str, int] = defaultdict(int)  # Track errors per key
        self.lock = threading.Lock()
        self._load_keys()
    
    def _load_keys(self):
        """Load API keys from environment variables"""
        # Support multiple formats:
        # 1. OPENROUTER_API_KEY (single key, backward compatible)
        # 2. OPENROUTER_API_KEY_1, OPENROUTER_API_KEY_2, ... (multiple keys)
        # 3. OPENROUTER_API_KEYS (comma-separated)
        
        # Try single key first (backward compatible)
        single_key = os.getenv("OPENROUTER_API_KEY")
        if single_key:
            single_key = single_key.strip().strip('"').strip("'")
            if single_key:
                self.keys.append(single_key)
        
        # Try comma-separated keys
        keys_str = os.getenv("OPENROUTER_API_KEYS")
        if keys_str:
            keys_list = [k.strip().strip('"').strip("'") for k in keys_str.split(",")]
            for key in keys_list:
                if key and key not in self.keys:
                    self.keys.append(key)
        
        # Try numbered keys (OPENROUTER_API_KEY_1, OPENROUTER_API_KEY_2, ...)
        for i in range(1, 10):  # Support up to 9 additional keys
            key = os.getenv(f"OPENROUTER_API_KEY_{i}")
            if key:
                key = key.strip().strip('"').strip("'")
                if key and key not in self.keys:
                    self.keys.append(key)
        
        if not self.keys:
            print("WARNING: No OpenRouter API keys found in environment variables")
        else:
            print(f"Loaded {len(self.keys)} OpenRouter API key(s)")
    
    def get_key_for_session(self, session_id: Optional[str] = None, strategy: str = "round_robin") -> Optional[str]:
        """
        Get an API key for a session.
        
        Args:
            session_id: Optional session identifier. If provided, same key is returned for same session.
            strategy: "round_robin" or "random"
        
        Returns:
            API key string or None if no keys available
        """
        if not self.keys:
            return None
        
        with self.lock:
            # If session_id provided, return same key for that session
            if session_id:
                if session_id in self.session_key_map:
                    return self.session_key_map[session_id]
                # Assign new key for this session
                if strategy == "random":
                    key = random.choice(self.keys)
                else:  # round_robin
                    key = self.keys[self.key_index % len(self.keys)]
                    self.key_index += 1
                
                self.session_key_map[session_id] = key
                return key
            
            # No session_id, use round-robin or random
            if strategy == "random":
                return random.choice(self.keys)
            else:
                key = self.keys[self.key_index % len(self.keys)]
                self.key_index += 1
                return key
    
    def get_key_with_fallback(self, session_id: Optional[str] = None, exclude_keys: Optional[List[str]] = None) -> Optional[str]:
        """
        Get an API key with fallback logic (excludes failed keys).
        
        Args:
            session_id: Optional session identifier
            exclude_keys: List of keys to exclude (e.g., failed keys)
        
        Returns:
            API key string or None if no keys available
        """
        if not self.keys:
            return None
        
        available_keys = [k for k in self.keys if not exclude_keys or k not in exclude_keys]
        
        if not available_keys:
            # All keys excluded, reset and try again
            available_keys = self.keys
        
        with self.lock:
            if session_id and session_id in self.session_key_map:
                assigned_key = self.session_key_map[session_id]
                if assigned_key in available_keys:
                    return assigned_key
                # Assigned key is excluded, assign new one
                new_key = available_keys[0]
                self.session_key_map[session_id] = new_key
                return new_key
            
            # No session or session key excluded, pick from available
            return available_keys[0] if available_keys else None
    
    def record_success(self, api_key: str):
        """Record successful API call"""
        with self.lock:
            self.key_usage[api_key] += 1
            # Reset error count on success
            if api_key in self.key_errors:
                self.key_errors[api_key] = 0
    
    def record_error(self, api_key: str):
        """Record failed API call"""
        with self.lock:
            self.key_errors[api_key] += 1
    
    def get_stats(self) -> Dict:
        """Get usage statistics"""
        with self.lock:
            return {
                "total_keys": len(self.keys),
                "active_sessions": len(self.session_key_map),
                "usage": dict(self.key_usage),
                "errors": dict(self.key_errors)
            }
    
    def clear_session(self, session_id: str):
        """Clear a session's key assignment"""
        with self.lock:
            if session_id in self.session_key_map:
                del self.session_key_map[session_id]


# Global instance
api_key_manager = APIKeyManager()
