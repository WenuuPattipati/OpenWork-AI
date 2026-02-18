#!/usr/bin/env python3
"""
Ingest Indian Guidelines from GCS to Firestore
- Reads JSON files from GCS (Document AI output)
- Extracts text and metadata
- Chunks text
- Generates embeddings (text-embedding-004)
- Uploads to Firestore
"""

import os
import json
import re
import time
from typing import List, Dict, Any
from google.cloud import storage
from google.cloud import firestore
import google.generativeai as genai
from google.api_core import retry

# Load environment variables
from dotenv import load_dotenv
load_dotenv('.env.local')

# Configuration
PROJECT_ID = os.getenv('GOOGLE_CLOUD_PROJECT_ID', 'limitless-ai-483404')
BUCKET_NAME = os.getenv('GOOGLE_CLOUD_STORAGE_BUCKET', 'limitless-medical-guidelines')
COLLECTION_NAME = os.getenv('FIRESTORE_COLLECTION_GUIDELINE_CHUNKS', 'guideline_chunks')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
EMBEDDING_MODEL = 'models/text-embedding-004'

# Initialize clients
storage_client = storage.Client(project=PROJECT_ID)
firestore_client = firestore.Client(project=PROJECT_ID)
genai.configure(api_key=GEMINI_API_KEY)

def extract_metadata(blob_name: str, content: Dict) -> Dict:
    """Extract metadata from filename and content"""
    filename = os.path.basename(blob_name)
    
    # Default values
    metadata = {
        'organization': 'Unknown',
        'year': 'Unknown',
        'guideline_title': filename.replace('.json', '').replace('.pdf', ''),
        'pdf_url': f"https://storage.googleapis.com/{BUCKET_NAME}/{blob_name}"
    }
    
    # Extract Organization
    if 'ICMR' in blob_name or 'ICMR' in filename:
        metadata['organization'] = 'ICMR'
    elif 'MOHFW' in blob_name:
        metadata['organization'] = 'MOHFW'
    
    # Extract Year
    year_match = re.search(r'(20\d{2})', filename)
    if year_match:
        metadata['year'] = year_match.group(1)
        
    return metadata

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 100) -> List[str]:
    """Split text into chunks with overlap"""
    if not text:
        return []
        
    chunks = []
    start = 0
    text_len = len(text)
    
    while start < text_len:
        end = start + chunk_size
        chunk = text[start:end]
        
        # Try to break at a newline or period if possible
        if end < text_len:
            last_break = max(chunk.rfind('\n'), chunk.rfind('. '))
            if last_break > chunk_size // 2:
                end = start + last_break + 1
                chunk = text[start:end]
        
        if len(chunk.strip()) > 50:  # Skip valid small chunks
            chunks.append(chunk.strip())
            
        start = end - overlap
        
    return chunks

@retry.Retry(predicate=retry.if_exception_type(Exception))
def generate_embedding(text: str) -> List[float]:
    """Generate embedding with retry logic"""
    result = genai.embed_content(
        model=EMBEDDING_MODEL,
        content=text,
        task_type="retrieval_document",
        output_dimensionality=768
    )
    return result['embedding']

def process_file(blob):
    """Process a single GCS file"""
    print(f"📄 Processing: {blob.name}")
    
    try:
        content_bytes = blob.download_as_bytes()
        content = json.loads(content_bytes)
    except Exception as e:
        print(f"❌ Failed to read/parse {blob.name}: {e}")
        return

    # Extract full text from Document AI output
    full_text = content.get('text', '')
    if not full_text:
        print(f"⚠️ No text found in {blob.name}")
        return

    metadata = extract_metadata(blob.name, content)
    chunks = chunk_text(full_text)
    
    print(f"   📝 Generated {len(chunks)} chunks")
    
    batch = firestore_client.batch()
    batch_count = 0
    
    for i, text_chunk in enumerate(chunks):
        chunk_id = f"{abs(hash(blob.name))}_{i}"
        doc_ref = firestore_client.collection(COLLECTION_NAME).document(chunk_id)
        
        try:
            embedding = generate_embedding(text_chunk)
        except Exception as e:
            print(f"   ❌ Embedding failed for chunk {i}: {e}")
            continue
            
        doc_data = {
            'chunk_id': chunk_id,
            'content': text_chunk,
            'text_for_search': f"Title: {metadata['guideline_title']}\nContent: {text_chunk}",
            'embedding_vector': embedding,
            'guideline_title': metadata['guideline_title'],
            'organization': metadata['organization'],
            'year': metadata['year'],
            'pdf_url': metadata['pdf_url'],
            'created_at': firestore.SERVER_TIMESTAMP
        }
        
        batch.set(doc_ref, doc_data)
        batch_count += 1
        
        if batch_count >= 100:
            batch.commit()
            batch = firestore_client.batch()
            batch_count = 0
            print(f"   💾 Committed batch of 100 chunks")
            time.sleep(1) # Rate limit protection

    if batch_count > 0:
        batch.commit()
        print(f"   💾 Committed final batch of {batch_count} chunks")

def main():
    print("🚀 Starting Indian Guidelines Ingestion")
    print(f"Bucket: {BUCKET_NAME}")
    print(f"Target: {COLLECTION_NAME}")
    
    # List available models to debug
    print("📋 Available embedding models:")
    available_models = []
    try:
        for m in genai.list_models():
            if 'embedContent' in m.supported_generation_methods:
                print(f"   - {m.name}")
                available_models.append(m.name)
    except Exception as e:
        print(f"   ⚠️ Could not list models: {e}")

    # Try to find a valid embedding model
    global EMBEDDING_MODEL
    
    # Check for specific models in priority order
    if 'models/text-embedding-004' in available_models:
        EMBEDDING_MODEL = 'models/text-embedding-004'
    elif 'models/gemini-embedding-001' in available_models:
        EMBEDDING_MODEL = 'models/gemini-embedding-001'
        print(f"⚠️ Falling back to {EMBEDDING_MODEL}")
    elif 'models/embedding-001' in available_models:
        EMBEDDING_MODEL = 'models/embedding-001'
        print(f"⚠️ Falling back to {EMBEDDING_MODEL}")
    else:
        # Fallback to env var or default
        env_model = os.getenv('GEMINI_EMBEDDING_MODEL', 'models/text-embedding-004')
        EMBEDDING_MODEL = env_model
        print(f"⚠️ Using configured model: {EMBEDDING_MODEL}")
        
    print(f"Using Model: {EMBEDDING_MODEL}")
    
    blobs = storage_client.list_blobs(BUCKET_NAME)
    
    # Filter for diabetes related files first to prioritize
    diabetes_blobs = []
    
    print("🔍 Scanning bucket for diabetes guidelines...")
    
    all_blobs = list(storage_client.list_blobs(BUCKET_NAME))
    
    # Filter and prioritize
    diabetes_blobs = []
    other_icmr_blobs = []
    
    for blob in all_blobs:
        if not blob.name.endswith('.json'):
            continue
            
        name_lower = blob.name.lower()
        if 'diabetes' in name_lower:
            diabetes_blobs.append(blob)
        elif 'icmr' in name_lower:
            other_icmr_blobs.append(blob)
            
    print(f"✅ Found {len(diabetes_blobs)} DIABETES files (Priority 1)")
    print(f"✅ Found {len(other_icmr_blobs)} other ICMR files (Priority 2)")
    
    # Process Diabetes FIRST
    print("🚀 Processing Diabetes files...")
    for blob in diabetes_blobs:
        process_file(blob)
        
    # Then others
    print("🚀 Processing other ICMR files...")
    for blob in other_icmr_blobs:
        process_file(blob)

if __name__ == "__main__":
    main()
