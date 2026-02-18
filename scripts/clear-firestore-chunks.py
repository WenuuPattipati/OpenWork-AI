
import os
from google.cloud import firestore
from dotenv import load_dotenv

load_dotenv('.env.local')

PROJECT_ID = os.getenv('GOOGLE_CLOUD_PROJECT_ID', 'limitless-ai-483404')
COLLECTION_NAME = os.getenv('FIRESTORE_COLLECTION_GUIDELINE_CHUNKS', 'guideline_chunks')

def delete_collection(coll_ref, batch_size):
    docs = coll_ref.limit(batch_size).stream()
    deleted = 0

    for doc in docs:
        print(f'Deleting doc {doc.id}')
        doc.reference.delete()
        deleted = deleted + 1

    if deleted >= batch_size:
        return delete_collection(coll_ref, batch_size)
    return deleted

def main():
    print(f"🗑️ Clearing collection: {COLLECTION_NAME} in project {PROJECT_ID}")
    
    # Initialize Firestore
    db = firestore.Client(project=PROJECT_ID)
    coll_ref = db.collection(COLLECTION_NAME)
    
    delete_collection(coll_ref, 100)
    print("✅ Collection cleared.")

if __name__ == "__main__":
    main()
