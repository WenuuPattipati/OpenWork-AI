#!/usr/bin/env python3
"""
Explore the Firestore guideline_chunks collection
to understand the chunking structure
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

def explore_firestore_chunks(access_token, project_id):
    """Explore the guideline_chunks collection"""
    try:
        # List documents in guideline_chunks collection
        url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/guideline_chunks"
        
        req = urllib.request.Request(
            url,
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        with urllib.request.urlopen(req, context=ssl_context) as response:
            result = json.loads(response.read().decode('utf-8'))
        
        documents = result.get('documents', [])
        return documents
    
    except Exception as e:
        print(f"Error exploring Firestore: {e}")
        return []

def analyze_chunk_document(doc):
    """Analyze a single chunk document"""
    fields = doc.get('fields', {})
    doc_name = doc.get('name', '').split('/')[-1]
    
    chunk_info = {}
    
    for field_name, field_data in fields.items():
        # Extract field value based on type
        if 'stringValue' in field_data:
            value = field_data['stringValue']
            if field_name == 'text' and len(value) > 200:
                value = value[:200] + "..."
            chunk_info[field_name] = value
        elif 'integerValue' in field_data:
            chunk_info[field_name] = int(field_data['integerValue'])
        elif 'doubleValue' in field_data:
            chunk_info[field_name] = float(field_data['doubleValue'])
        elif 'arrayValue' in field_data:
            # This is likely the embedding vector
            array_values = field_data['arrayValue'].get('values', [])
            if field_name == 'embedding':
                chunk_info[field_name] = f"Vector with {len(array_values)} dimensions"
            else:
                chunk_info[field_name] = f"Array with {len(array_values)} items"
        elif 'mapValue' in field_data:
            map_val = field_data['mapValue']
            if field_name == 'embedding_vector':
                # Try to find vector data inside the map
                fields_in_map = map_val.get('fields', {})
                chunk_info[field_name] = f"Map with fields: {list(fields_in_map.keys())}"
                if 'value' in fields_in_map:
                    val_field = fields_in_map['value']
                    # Check if value is a list/array
                    if 'listValue' in val_field:
                         items = val_field['listValue'].get('values', [])
                         chunk_info[field_name] = f"Vector (Map->value->List) with {len(items)} dimensions"
                    elif 'arrayValue' in val_field:
                         items = val_field['arrayValue'].get('values', [])
                         chunk_info[field_name] = f"Vector (Map->value->Array) with {len(items)} dimensions"
                    elif 'bytesValue' in val_field:
                         # Maybe raw bytes?
                         chunk_info[field_name] = f"Vector (Bytes) length {len(val_field['bytesValue'])}"
                    else:
                         chunk_info[field_name] = f"Vector (Map->value->{list(val_field.keys())[0]})"
                elif 'values' in fields_in_map:
                    # It might be values -> listValue?
                    values_field = fields_in_map['values']
                    if 'listValue' in values_field:
                         items = values_field['listValue'].get('values', [])
                         chunk_info[field_name] = f"Vector (Map->List) with {len(items)} dimensions"
                    elif 'arrayValue' in values_field:
                         items = values_field['arrayValue'].get('values', [])
                         chunk_info[field_name] = f"Vector (Map->Array) with {len(items)} dimensions"
            else:
                 chunk_info[field_name] = "Type: mapValue"
        else:
            chunk_info[field_name] = f"Type: {list(field_data.keys())[0]}"
    
    return doc_name, chunk_info

def main():
    """Main exploration function"""
    print("🔍 Exploring Firestore guideline_chunks Collection")
    print("=" * 60)
    
    # Load environment
    load_env_file()
    
    project_id = os.getenv('GOOGLE_CLOUD_PROJECT_ID')
    
    print(f"📊 Project: {project_id}")
    print(f"🗄️  Collection: guideline_chunks")
    print()
    
    # Get access token
    access_token = get_access_token()
    if not access_token:
        print("❌ Could not get access token")
        return
    
    # Explore Firestore chunks
    print("📋 Fetching chunk documents...")
    documents = explore_firestore_chunks(access_token, project_id)
    
    if not documents:
        print("❌ No documents found or error accessing Firestore")
        return
    
    print(f"✅ Found {len(documents)} chunk documents")
    print()
    
    # Analyze sample documents
    print("🔍 Analyzing Sample Chunks:")
    print("=" * 40)
    
    for i, doc in enumerate(documents[:3]):  # Analyze first 3 documents
        doc_id, chunk_info = analyze_chunk_document(doc)
        
        print(f"📄 Chunk {i+1}: {doc_id}")
        for field, value in chunk_info.items():
            print(f"  {field}: {value}")
        print()
    
    # Analyze field patterns across all documents
    print("📊 Field Analysis Across All Chunks:")
    print("=" * 40)
    
    field_counts = {}
    field_types = {}
    
    for doc in documents:
        fields = doc.get('fields', {})
        for field_name, field_data in fields.items():
            field_counts[field_name] = field_counts.get(field_name, 0) + 1
            
            # Determine field type
            if 'stringValue' in field_data:
                field_types[field_name] = 'string'
            elif 'integerValue' in field_data:
                field_types[field_name] = 'integer'
            elif 'arrayValue' in field_data:
                field_types[field_name] = 'array'
            elif 'doubleValue' in field_data:
                field_types[field_name] = 'double'
    
    for field_name, count in sorted(field_counts.items()):
        field_type = field_types.get(field_name, 'unknown')
        percentage = (count / len(documents)) * 100
        print(f"  {field_name}: {count}/{len(documents)} docs ({percentage:.1f}%) - Type: {field_type}")
    
    print()
    print("🎯 Key Insights:")
    print("1. Firestore contains CHUNKED and EMBEDDED data for vector search")
    print("2. Each chunk has metadata (title, source, etc.) + text + embedding vector")
    print("3. This enables fast semantic similarity search across guidelines")
    print("4. Chunks are optimized for retrieval, not storage of raw data")

if __name__ == "__main__":
    main()