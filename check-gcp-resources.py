#!/usr/bin/env python3
"""
Check what Google Cloud resources actually exist in your project
"""

import os
import json
import urllib.request
import urllib.parse
import ssl
from pathlib import Path

# Fix SSL certificate issues on macOS
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

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

def get_access_token():
    """Get access token from ADC"""
    try:
        adc_path = Path.home() / '.config' / 'gcloud' / 'application_default_credentials.json'
        
        with open(adc_path, 'r') as f:
            creds = json.load(f)
        
        refresh_token = creds.get('refresh_token')
        client_id = creds.get('client_id')
        client_secret = creds.get('client_secret')
        
        data = {
            'client_id': client_id,
            'client_secret': client_secret,
            'refresh_token': refresh_token,
            'grant_type': 'refresh_token'
        }
        
        data_encoded = urllib.parse.urlencode(data).encode('utf-8')
        
        req = urllib.request.Request(
            'https://oauth2.googleapis.com/token',
            data=data_encoded,
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        
        with urllib.request.urlopen(req, context=ssl_context) as response:
            result = json.loads(response.read().decode('utf-8'))
        
        return result.get('access_token')
    
    except Exception as e:
        print(f"Error getting access token: {e}")
        return None

def list_buckets(access_token, project_id):
    """List all buckets in the project"""
    try:
        url = f"https://storage.googleapis.com/storage/v1/b?project={project_id}"
        
        req = urllib.request.Request(
            url,
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        with urllib.request.urlopen(req, context=ssl_context) as response:
            result = json.loads(response.read().decode('utf-8'))
        
        buckets = result.get('items', [])
        return buckets
    
    except Exception as e:
        print(f"Error listing buckets: {e}")
        return []

def list_gemini_models(api_key):
    """List available Gemini models"""
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
        
        req = urllib.request.Request(url)
        
        with urllib.request.urlopen(req, context=ssl_context) as response:
            result = json.loads(response.read().decode('utf-8'))
        
        models = result.get('models', [])
        return models
    
    except Exception as e:
        print(f"Error listing Gemini models: {e}")
        return []

def main():
    """Check what resources exist"""
    print("🔍 Checking Google Cloud Resources")
    print("=" * 50)
    
    # Load environment
    load_env_file()
    
    project_id = os.getenv('GOOGLE_CLOUD_PROJECT_ID')
    gemini_key = os.getenv('GEMINI_API_KEY')
    
    print(f"📊 Project ID: {project_id}")
    print()
    
    # Get access token
    access_token = get_access_token()
    if not access_token:
        print("❌ Could not get access token")
        return
    
    print("✅ Got access token")
    print()
    
    # List buckets
    print("🗂️  Checking Storage Buckets...")
    buckets = list_buckets(access_token, project_id)
    
    if buckets:
        print(f"Found {len(buckets)} buckets:")
        for bucket in buckets:
            name = bucket.get('name')
            location = bucket.get('location')
            storage_class = bucket.get('storageClass')
            print(f"  - {name} (Location: {location}, Class: {storage_class})")
    else:
        print("No buckets found in this project")
    
    print()
    
    # List Gemini models
    print("🤖 Checking Gemini Models...")
    models = list_gemini_models(gemini_key)
    
    if models:
        print(f"Found {len(models)} models:")
        flash_models = []
        pro_models = []
        
        for model in models:
            name = model.get('name', '').replace('models/', '')
            display_name = model.get('displayName', '')
            
            if 'flash' in name.lower():
                flash_models.append(name)
            elif 'pro' in name.lower():
                pro_models.append(name)
        
        print("Flash models:")
        for model in flash_models[:5]:  # Show first 5
            print(f"  - {model}")
        
        print("Pro models:")
        for model in pro_models[:5]:  # Show first 5
            print(f"  - {model}")
    else:
        print("No models found or API key issue")
    
    print()
    print("🎯 Recommendations:")
    
    if not buckets:
        print("1. Create a storage bucket for Indian guidelines:")
        print(f"   gsutil mb gs://limitless-ai-483404-indian-guidelines")
        print("   OR use the Google Cloud Console")
    
    if flash_models:
        print(f"2. Update GEMINI_FLASH_MODEL to: {flash_models[0]}")
    
    if pro_models:
        print(f"3. Update GEMINI_PRO_MODEL to: {pro_models[0]}")

if __name__ == "__main__":
    main()