#!/usr/bin/env python3
"""
Google Cloud Authentication Setup for Open Work
Alternative approach when gcloud CLI is not working
"""

import os
import json
import webbrowser
from urllib.parse import urlencode

def setup_gcp_authentication():
    """
    Guide user through GCP authentication setup
    """
    
    print("🔐 Google Cloud Authentication Setup for Open Work")
    print("=" * 60)
    
    # Check current configuration
    project_id = os.getenv('GOOGLE_CLOUD_PROJECT_ID', 'limitless-ai')
    bucket_name = os.getenv('GOOGLE_CLOUD_STORAGE_BUCKET', 'limitless-ai-indian-guidelines')
    
    print(f"📊 Project ID: {project_id}")
    print(f"🗂️  Storage Bucket: {bucket_name}")
    print()
    
    print("Since gcloud CLI is having issues, we'll use alternative authentication methods:")
    print()
    
    print("🔧 Option 1: Service Account Key (Recommended for Development)")
    print("   1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts")
    print(f"   2. Select project: {project_id}")
    print("   3. Create a new service account or select existing one")
    print("   4. Click 'Keys' tab → 'Add Key' → 'Create new key' → JSON")
    print("   5. Download the JSON file and save it as 'gcp-service-account.json' in this directory")
    print()
    
    print("🔧 Option 2: Application Default Credentials (ADC)")
    print("   If you have Google Cloud SDK installed elsewhere:")
    print("   1. Run: gcloud auth application-default login")
    print("   2. This will open a browser for authentication")
    print()
    
    print("🔧 Option 3: Manual OAuth Setup")
    print("   1. Go to: https://console.cloud.google.com/apis/credentials")
    print(f"   2. Select project: {project_id}")
    print("   3. Create OAuth 2.0 Client ID for 'Desktop application'")
    print("   4. Download the client_secret.json file")
    print()
    
    # Check if service account key exists
    if os.path.exists('./gcp-service-account.json'):
        print("✅ Found gcp-service-account.json file")
        try:
            with open('./gcp-service-account.json', 'r') as f:
                key_data = json.load(f)
                print(f"   Project ID in key: {key_data.get('project_id', 'Not found')}")
                print(f"   Service Account: {key_data.get('client_email', 'Not found')}")
        except Exception as e:
            print(f"   ⚠️  Error reading key file: {e}")
    else:
        print("❌ No gcp-service-account.json file found")
    
    print()
    print("🚀 Next Steps:")
    print("1. Choose one of the authentication options above")
    print("2. Once authenticated, run: python test-gcp-connection.py")
    print("3. If successful, proceed with embedding the Indian guidelines")
    
    # Open relevant URLs
    choice = input("\nWould you like me to open the Google Cloud Console? (y/n): ").lower().strip()
    if choice == 'y':
        webbrowser.open(f"https://console.cloud.google.com/iam-admin/serviceaccounts?project={project_id}")

if __name__ == "__main__":
    setup_gcp_authentication()