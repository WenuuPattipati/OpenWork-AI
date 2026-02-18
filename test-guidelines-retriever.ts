/**
 * Test script: Explore Firestore guideline_chunks and test vector search
 * Run: npx tsx test-guidelines-retriever.ts
 */

import { Firestore } from '@google-cloud/firestore';
import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || 'limitless-ai-483404';
const COLLECTION = process.env.FIRESTORE_COLLECTION_GUIDELINE_CHUNKS || 'guideline_chunks';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

async function main() {
  console.log('=== Firestore Guidelines Explorer ===\n');
  console.log(`Project: ${PROJECT_ID}`);
  console.log(`Collection: ${COLLECTION}\n`);

  // Connect to Firestore
  const db = new Firestore({ projectId: PROJECT_ID });
  const collection = db.collection(COLLECTION);

  // ── Step 1: Count total documents ──
  console.log('── Step 1: Collection Overview ──');
  const countSnapshot = await collection.count().get();
  const totalDocs = countSnapshot.data().count;
  console.log(`Total documents: ${totalDocs}\n`);

  // ── Step 2: Sample a few documents to understand structure ──
  console.log('── Step 2: Document Structure (first 3 docs) ──');
  const sampleSnapshot = await collection.limit(3).get();

  for (const doc of sampleSnapshot.docs) {
    const data = doc.data();
    const fields = Object.keys(data);
    const embeddingField = data.embedding_vector;
    const embeddingType = embeddingField ?
      (Array.isArray(embeddingField) ? `array[${embeddingField.length}]` :
       embeddingField._values ? `VectorValue[${embeddingField._values.length}]` :
       typeof embeddingField) : 'MISSING';

    console.log(`\nDoc ID: ${doc.id}`);
    console.log(`  Fields: ${fields.filter(f => f !== 'embedding_vector').join(', ')}`);
    console.log(`  embedding_vector: ${embeddingType}`);
    console.log(`  title: ${data.guideline_title || data.title || data.document_title || 'N/A'}`);
    console.log(`  organization: ${data.organization || 'N/A'}`);
    console.log(`  year: ${data.year || data.publication_year || 'N/A'}`);
    console.log(`  section: ${data.parent_section || data.section_header || 'N/A'}`);
    console.log(`  content preview: ${(data.content || data.text || data.text_for_search || 'N/A').substring(0, 150)}...`);
  }

  // ── Step 3: Get unique organizations and titles ──
  console.log('\n\n── Step 3: Unique Guidelines (titles & organizations) ──');
  const allDocsSnapshot = await collection.select('guideline_title', 'title', 'document_title', 'organization', 'year', 'guideline_id').limit(500).get();

  const titleMap = new Map<string, { org: string; year: number | string; count: number }>();
  for (const doc of allDocsSnapshot.docs) {
    const data = doc.data();
    const title = data.guideline_title || data.title || data.document_title || 'Unknown';
    const org = data.organization || 'Unknown';
    const year = data.year || 'N/A';
    const key = `${title}|||${org}`;
    if (titleMap.has(key)) {
      titleMap.get(key)!.count++;
    } else {
      titleMap.set(key, { org, year, count: 1 });
    }
  }

  console.log(`\nUnique guidelines found: ${titleMap.size}`);
  const sortedTitles = [...titleMap.entries()].sort((a, b) => b[1].count - a[1].count);
  for (const [key, info] of sortedTitles.slice(0, 25)) {
    const title = key.split('|||')[0];
    console.log(`  [${info.count} chunks] ${title} (${info.org}, ${info.year})`);
  }
  if (sortedTitles.length > 25) {
    console.log(`  ... and ${sortedTitles.length - 25} more guidelines`);
  }

  // ── Step 4: Check if vector index exists by testing findNearest ──
  console.log('\n\n── Step 4: Test Native Vector Search (findNearest) ──');

  const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const testQueries = [
    'What is the recommended treatment for type 2 diabetes in India?',
    'Hypertension management guidelines',
    'Tuberculosis treatment protocol'
  ];

  for (const query of testQueries) {
    console.log(`\nQuery: "${query}"`);

    try {
      // Generate embedding
      const embResult = await genAI.models.embedContent({
        model: 'text-embedding-004',
        contents: query
      });
      const embedding = embResult.embeddings?.[0]?.values;

      if (!embedding || embedding.length === 0) {
        console.log('  ❌ Failed to generate embedding');
        continue;
      }
      console.log(`  ✅ Embedding generated (${embedding.length} dimensions)`);

      // Run findNearest
      const vectorQuery = collection.findNearest({
        vectorField: 'embedding_vector',
        queryVector: embedding,
        limit: 5,
        distanceMeasure: 'COSINE',
        distanceResultField: 'vector_distance'
      });

      const results = await vectorQuery.get();
      console.log(`  ✅ findNearest returned ${results.size} results`);

      for (const doc of results.docs) {
        const data = doc.data();
        const distance = data.vector_distance ?? 'N/A';
        const similarity = typeof distance === 'number' ? (1 - distance).toFixed(4) : 'N/A';
        const title = data.guideline_title || data.title || data.document_title || 'Unknown';
        const section = data.parent_section || data.section_header || 'N/A';
        const contentPreview = (data.content || data.text || data.text_for_search || '').substring(0, 120);

        console.log(`    📄 [sim=${similarity}] ${title}`);
        console.log(`       Section: ${section}`);
        console.log(`       Content: ${contentPreview}...`);
      }
    } catch (error: any) {
      console.log(`  ❌ Error: ${error.message}`);
      if (error.message?.includes('index')) {
        console.log('  ⚠️  This likely means a Firestore vector index needs to be created.');
        console.log('     Create it with: gcloud firestore indexes composite create \\');
        console.log(`       --collection-group=${COLLECTION} \\`);
        console.log('       --query-scope=COLLECTION \\');
        console.log('       --field-config=vector-config=\'{"dimension":"768","flat":{}}\',field-path=embedding_vector');
      }
    }
  }

  console.log('\n\n=== Test Complete ===');
}

main().catch(console.error);
