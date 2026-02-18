#!/usr/bin/env python3
"""
Setup Application Default Credentials for Google Cloud
Alternative method when gcloud CLI is not working
"""

import os
import json
import webbrowser
import urllib.parse
from pathlib import Path

def setup_application_default_credentials():
    """
    Guide user through ADC setup using OAuth2 flow
    """
    
    print("🔐 Setting up Application Default Credentials (ADC)")
    print("=" * 60)
    
    # Load environment
    load_env_file()
    
    project_id = os.getenv('GOOGLE_CLOUD_PROJECT_ID', 'limitless-ai')
    
    print(f"📊 Project ID: {project_id}")
    print()
    
    # Check if ADC already exists
    adc_path = Path.home() / '.config' / 'gcloud' / 'application_default_credentials.json'
    
    if adc_path.exists():
        print("✅ Application Default Credentials already exist!")
        print(f"   Location: {adc_path}")
        
        try:
            with open(adc_path, 'r') as f:
                creds = json.load(f)
            
            print(f"   Type: {creds.get('type', 'unknown')}")
            if 'quota_project_id' in creds:
                print(f"   Project: {creds.get('quota_project_id')}")
            
            # Test if credentials work
            test_choice = input("\nWould you like to test these credentials? (y/n): ").lower().strip()
            if test_choice == 'y':
                test_adc_connection()
            
        except Exception as e:
            print(f"   ⚠️  Error reading credentials: {e}")
    
    else:
        print("❌ No Application Default Credentials found")
        print()
        print("🔧 Setting up ADC manually...")
        print()
        
        print("Since gcloud CLI is having issues, here are alternative approaches:")
        print()
        
        print("📋 Method 1: Manual OAuth Setup")
        print("1. Go to Google Cloud Console OAuth consent screen:")
        print(f"   https://console.cloud.google.com/apis/credentials/consent?project={project_id}")
        print("2. Configure OAuth consent screen (if not done)")
        print("3. Go to Credentials page:")
        print(f"   https://console.cloud.google.com/apis/credentials?project={project_id}")
        print("4. Create OAuth 2.0 Client ID → Desktop Application")
        print("5. Download the client_secret.json file")
        print("6. Run the OAuth flow manually")
        print()
        
        print("📋 Method 2: Use Service Account (Recommended)")
        print("1. Go to Service Accounts:")
        print(f"   https://console.cloud.google.com/iam-admin/serviceaccounts?project={project_id}")
        print("2. Create service account with required permissions:")
        print("   - Storage Object Viewer (for bucket access)")
        print("   - Firestore User (for database access)")
        print("   - AI Platform User (for Gemini embeddings)")
        print("3. Download JSON key as 'gcp-service-account.json'")
        print()
        
        choice = input("Which method would you prefer? (1 for OAuth, 2 for Service Account): ").strip()
        
        if choice == "1":
            setup_oauth_flow(project_id)
        elif choice == "2":
            setup_service_account_guide(project_id)
        else:
            print("Please choose 1 or 2")

def setup_oauth_flow(project_id):
    """Guide through OAuth setup"""
    print("\n🔧 OAuth Setup Process:")
    
    # Open OAuth consent screen
    consent_url = f"https://console.cloud.google.com/apis/credentials/consent?project={project_id}"
    creds_url = f"https://console.cloud.google.com/apis/credentials?project={project_id}"
    
    print(f"Opening OAuth consent screen...")
    webbrowser.open(consent_url)
    
    input("Press Enter after configuring OAuth consent screen...")
    
    print(f"Opening credentials page...")
    webbrowser.open(creds_url)
    
    print("\n📝 Steps to complete:")
    print("1. Click 'Create Credentials' → 'OAuth 2.0 Client ID'")
    print("2. Choose 'Desktop application'")
    print("3. Download the JSON file")
    print("4. Save it as 'client_secret.json' in this directory")
    print("5. Run: python setup-adc.py --oauth")

def setup_service_account_guide(project_id):
    """Guide through service account setup"""
    print("\n🔧 Service Account Setup Process:")
    
    sa_url = f"https://console.cloud.google.com/iam-admin/serviceaccounts?project={project_id}"
    
    print(f"Opening service accounts page...")
    webbrowser.open(sa_url)
    
    print("\n📝 Steps to complete:")
    print("1. Click 'Create Service Account'")
    print("2. Name: 'open-work-service'")
    print("3. Description: 'Service account for Open Work medical AI'")
    print("4. Click 'Create and Continue'")
    print("5. Add these roles:")
    print("   - Storage Object Viewer")
    print("   - Cloud Datastore User")
    print("   - AI Platform User")
    print("6. Click 'Continue' → 'Done'")
    print("7. Click on the created service account")
    print("8. Go to 'Keys' tab → 'Add Key' → 'Create new key' → JSON")
    print("9. Download and save as 'gcp-service-account.json'")

def test_adc_connection():
    """Test if ADC credentials work"""
    print("\n🧪 Testing Application Default Credentials...")
    
    try:
        # Try to use the credentials without importing google-cloud libraries
        # We'll create a simple HTTP request to test
        import urllib.request
        import json
        
        # Try to get an access token using ADC
        adc_path = Path.home() / '.config' / 'gcloud' / 'application_default_credentials.json'
        
        if adc_path.exists():
            with open(adc_path, 'r') as f:
                creds = json.load(f)
            
            if creds.get('type') == 'authorized_user':
                print("✅ Found user credentials")
                print("   These should work for development")
                
                # Test by trying to list buckets (requires google-cloud-storage)
                print("   To fully test, we need to install google-cloud-storage")
                print("   Run: pip install google-cloud-storage google-cloud-firestore")
                
            elif creds.get('type') == 'service_account':
                print("✅ Found service account credentials")
                print("   These should work for production")
            else:
                print(f"⚠️  Unknown credential type: {creds.get('type')}")
        
    except Exception as e:
        print(f"❌ Error testing credentials: {e}")

def load_env_file():
    """Load environment variables from .env.local"""
    env_file = '.env.local'
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key] = value

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == '--oauth':
        print("OAuth flow not implemented yet - use service account method")
    else:
        setup_application_default_credentials()