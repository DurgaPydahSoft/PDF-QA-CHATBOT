#!/usr/bin/env python3
"""
Helper script to Base64 encode service account JSON for production deployment.

Usage:
    python scripts/encode_service_account.py [path_to_service_account.json]

If no path is provided, it will look for 'service_account.json' in the current directory.
"""

import base64
import json
import sys
import os

def encode_service_account(file_path: str) -> str:
    """Encodes a service account JSON file to Base64."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    
    with open(file_path, 'rb') as f:
        file_content = f.read()
    
    # Encode to Base64
    encoded = base64.b64encode(file_content).decode('utf-8')
    return encoded

def main():
    # Determine file path
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
    else:
        # Default to service_account.json in current directory
        file_path = "service_account.json"
        # Or try in backend directory if running from root
        if not os.path.exists(file_path):
            file_path = os.path.join("backend", "service_account.json")
    
    try:
        # Validate JSON first
        with open(file_path, 'r') as f:
            creds = json.load(f)
        
        # Check required fields
        required_fields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email']
        missing = [field for field in required_fields if field not in creds]
        if missing:
            print(f"⚠️  Warning: Missing fields in JSON: {', '.join(missing)}", file=sys.stderr)
        
        # Encode
        encoded = encode_service_account(file_path)
        
        print("=" * 80)
        print("✅ Service Account JSON successfully encoded to Base64!")
        print("=" * 80)
        print("\n📋 Copy the following string and add it to Hugging Face Secrets:")
        print("   Key: GOOGLE_SA_KEY_BASE64")
        print("   Value: (paste below)")
        print("\n" + "-" * 80)
        print(encoded)
        print("-" * 80)
        print(f"\n📊 Stats:")
        print(f"   Original file size: {os.path.getsize(file_path):,} bytes")
        print(f"   Base64 length: {len(encoded):,} characters")
        print(f"   Service account email: {creds.get('client_email', 'N/A')}")
        print(f"   Project ID: {creds.get('project_id', 'N/A')}")
        print("\n💡 Tip: The entire string above should be on ONE line in HF Secrets.")
        print("=" * 80)
        
    except FileNotFoundError as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        print(f"\nUsage: python {sys.argv[0]} [path_to_service_account.json]", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"❌ Error: Invalid JSON file: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
