
import { Firestore } from '@google-cloud/firestore';
import { GuidelinesRetriever } from '../lib/agents/sub-agents/guidelines-retriever';
import * as dotenv from 'dotenv';
dotenv.config();

async function verifyFirestore() {
  console.log('🔍 Starting Firestore Verification...');

  // 1. Initialize Firestore
  const db = new Firestore();
  const collectionName = process.env.FIRESTORE_COLLECTION_GUIDELINE_CHUNKS || 'guideline_chunks';
  console.log(`   Collection: ${collectionName}`);

  try {
    // 2. Fetch a sample document to check embedding dimension
    const snapshot = await db.collection(collectionName).limit(1).get();
    if (snapshot.empty) {
      console.error('❌ Firestore collection is EMPTY! No guidelines found.');
      return;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    const embedding = data.embedding_vector;

    console.log(`   Sample Doc ID: ${doc.id}`);
    console.log(`   Title: ${data.title || data.guideline_title}`);
    
    if (Array.isArray(embedding)) {
      console.log(`   ✅ Embedding Field Exists`);
      console.log(`   📏 Embedding Dimension: ${embedding.length}`);
      if (embedding.length === 768) {
        console.log('   ✅ Dimension Check PASSED (768)');
      } else {
        console.error(`   ❌ Dimension Check FAILED! Expected 768, got ${embedding.length}`);
      }
    } else {
      console.error('   ❌ Embedding field missing or not an array');
    }

    // 3. Real-time Retrieval Test (Cancer Query)
    console.log('\n🏥 Performing Real-time Retrieval Test (Sub-Agent 2.1)...');
    console.log('   Query: "lung cancer treatment guidelines India"');
    
    // Initialize Agent
    // Mock environment if needed, but dotenv should handle it
    const retriever = new GuidelinesRetriever();
    
    // Mock TraceContext
    const traceContext = { traceId: 'test-verification', spanId: 'test-span' };

    const results = await retriever.search(
      ['lung cancer treatment guidelines India', 'management of non-small cell lung cancer India', 'chemotherapy protocols for lung cancer India'], 
      traceContext,
      'lung cancer treatment guidelines India'
    );

    console.log(`\n📋 Retrieval Results (${results.length} found):`);
    results.forEach((r, i) => {
      console.log(`   ${i+1}. [${r.similarity_score.toFixed(3)}] ${r.title} (${r.organization}, ${r.year})`);
      console.log(`      Section: ${r.parent_section} > ${r.child_section}`);
    });

    if (results.length > 0) {
      console.log('   ✅ Sub-Agent 2.1 is WORKING and retrieving data.');
    } else {
      console.warn('   ⚠️ No results found. This might be due to lack of cancer guidelines in the database or threshold issues.');
    }

  } catch (error) {
    console.error('❌ Verification Failed:', error);
  }
}

verifyFirestore();
