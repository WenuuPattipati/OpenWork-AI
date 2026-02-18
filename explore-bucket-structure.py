#!/usr/bin/env python3
"""
Explore the structure of the limitless-medical-guidelines bucket
to understand the parent/child/grandchild organization
"""

import os
import json
import urllib.request
import urllib.parse
import ssl
from pathlib import Path
from collections import defaultdict

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

def list_bucket_structure(access_token, bucket_name, max_results=100):
    """List bucket contents and analyze structure"""
    try:
        url = f"https://storage.googleapis.com/storage/v1/b/{bucket_name}/o?maxResults={max_results}"
        
        req = urllib.request.Request(
            url,
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        with urllib.request.urlopen(req, context=ssl_context) as response:
            result = json.loads(response.read().decode('utf-8'))
        
        items = result.get('items', [])
        return items
    
    except Exception as e:
        print(f"Error listing bucket: {e}")
        return []

def analyze_structure(items):
    """Analyze the bucket structure"""
    
    structure = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
    file_types = defaultdict(int)
    
    print("📁 Analyzing Bucket Structure...")
    print("=" * 50)
    
    for item in items:
        name = item.get('name', '')
        size = int(item.get('size', 0))
        
        # Count file types
        if name.endswith('.json'):
            file_types['JSON'] += 1
        elif name.endswith('.pdf'):
            file_types['PDF'] += 1
        elif name.endswith('.txt'):
            file_types['TXT'] += 1
        else:
            file_types['OTHER'] += 1
        
        # Analyze path structure
        path_parts = name.split('/')
        
        if len(path_parts) >= 3:
            parent = path_parts[0]
            child = path_parts[1] if len(path_parts) > 1 else 'root'
            grandchild = path_parts[2] if len(path_parts) > 2 else 'files'
            filename = path_parts[-1]
            
            structure[parent][child][grandchild].append({
                'name': filename,
                'size': size,
                'full_path': name
            })
    
    return structure, file_types

def sample_file_content(access_token, bucket_name, file_path):
    """Sample content from a JSON file"""
    try:
        url = f"https://storage.googleapis.com/storage/v1/b/{bucket_name}/o/{urllib.parse.quote(file_path, safe='')}?alt=media"
        
        req = urllib.request.Request(
            url,
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        with urllib.request.urlopen(req, context=ssl_context) as response:
            content = response.read().decode('utf-8')
        
        # Try to parse as JSON
        try:
            data = json.loads(content)
            return data
        except:
            return content[:1000]  # Return first 1000 chars if not JSON
    
    except Exception as e:
        return f"Error reading file: {e}"

def main():
    """Main exploration function"""
    print("🔍 Exploring limitless-medical-guidelines Bucket Structure")
    print("=" * 60)
    
    # Load environment
    load_env_file()
    
    project_id = os.getenv('GOOGLE_CLOUD_PROJECT_ID')
    bucket_name = os.getenv('GOOGLE_CLOUD_STORAGE_BUCKET')
    
    print(f"📊 Project: {project_id}")
    print(f"🗂️  Bucket: {bucket_name}")
    print()
    
    # Get access token
    access_token = get_access_token()
    if not access_token:
        print("❌ Could not get access token")
        return
    
    # List bucket contents
    print("📋 Fetching bucket contents...")
    items = list_bucket_structure(access_token, bucket_name, max_results=200)
    
    if not items:
        print("❌ No items found or error accessing bucket")
        return
    
    print(f"✅ Found {len(items)} items")
    print()
    
    # Analyze structure
    structure, file_types = analyze_structure(items)
    
    # Print file type summary
    print("📊 File Type Summary:")
    for file_type, count in file_types.items():
        print(f"  {file_type}: {count} files")
    print()
    
    # Print directory structure
    print("🌳 Directory Structure (Parent/Child/Grandchild):")
    for parent, children in structure.items():
        print(f"📁 {parent}/")
        for child, grandchildren in children.items():
            print(f"  📁 {child}/")
            for grandchild, files in grandchildren.items():
                print(f"    📁 {grandchild}/ ({len(files)} files)")
                
                # Show sample files
                for file_info in files[:3]:  # Show first 3 files
                    size_mb = file_info['size'] / (1024 * 1024)
                    print(f"      📄 {file_info['name']} ({size_mb:.1f} MB)")
                
                if len(files) > 3:
                    print(f"      ... and {len(files) - 3} more files")
        print()
    
    # Sample a JSON file to understand content structure
    print("🔍 Sampling File Content...")
    json_files = [item for item in items if item.get('name', '').endswith('.json')]
    
    if json_files:
        sample_file = json_files[0]
        file_path = sample_file.get('name')
        print(f"📄 Sampling: {file_path}")
        
        content = sample_file_content(access_token, bucket_name, file_path)
        
        if isinstance(content, dict):
            print("📋 JSON Structure:")
            for key, value in list(content.items())[:5]:  # Show first 5 keys
                if isinstance(value, str):
                    preview = value[:100] + "..." if len(value) > 100 else value
                    print(f"  {key}: {preview}")
                else:
                    print(f"  {key}: {type(value).__name__}")
        else:
            print("📋 Content Preview:")
            print(content[:500] + "..." if len(str(content)) > 500 else content)
    
    print()
    print("🎯 Key Insights:")
    print("1. Your bucket contains processed Indian medical guidelines")
    print("2. Files are organized in a hierarchical parent/child/grandchild structure")
    print("3. Content appears to be in JSON format (processed from PDFs)")
    print("4. This is the RAW DATA that needs to be chunked for vector search")

if __name__ == "__main__":
    main()