
const { Firestore } = require('@google-cloud/firestore');
const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');
dotenv.config();

console.log('🚀 Script starting...');
console.log('   Project ID:', process.env.GOOGLE_CLOUD_PROJECT_ID);
console.log('   Key available:', !!process.env.GOOGLE_CLOUD_PRIVATE_KEY);

// Minimal Guidelines Retriever Stub
class GuidelinesRetrieverStub {
    constructor() {
        console.log('   Initializing Firestore...');
        this.db = new Firestore();
        console.log('   Firestore initialized.');
        if (process.env.GEMINI_API_KEY) {
            this.genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        }
    }

    async getGeminiEmbedding(text) {
        if (!this.genAI) return new Array(768).fill(0);
        try {
            const modelEnv = process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004';
            const modelName = modelEnv.startsWith('models/') ? modelEnv : `models/${modelEnv}`;
            const result = await this.genAI.models.embedContent({
                model: modelName,
                contents: [{ role: 'user', parts: [{ text }] }],
                config: { outputDimensionality: 768 }
            });
            return result.embeddings?.[0]?.values || new Array(768).fill(0);
        } catch (error) {
            console.error('❌ Embedding failed:', error.message);
            return new Array(768).fill(0);
        }
    }

    async search(query) {
        console.log(`🔍 Searching for: "${query}"`);
        const embedding = await this.getGeminiEmbedding(query);
        console.log(`   📏 Embedding Dimension: ${embedding.length}`);

        if (embedding.every(v => v === 0)) return [];

        const collection = this.db.collection(process.env.FIRESTORE_COLLECTION_GUIDELINE_CHUNKS || 'guideline_chunks');
        const vectorQuery = collection.findNearest({
            vectorField: 'embedding_vector',
            queryVector: embedding,
            limit: 5,
            distanceMeasure: 'COSINE',
            distanceResultField: 'vector_distance'
        });

        const snapshot = await vectorQuery.get();
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                title: data.title || data.guideline_title,
                organization: data.organization,
                year: data.year,
                similarity: 1 - (data.vector_distance || 0)
            };
        });
    }
}

async function verifyFirestore() {
    console.log('🔍 Starting Firestore Verification (JS Mode)...');

    const db = new Firestore();
    const collectionName = process.env.FIRESTORE_COLLECTION_GUIDELINE_CHUNKS || 'guideline_chunks';
    console.log(`   Collection: ${collectionName}`);

    try {
        // 1. Check Embeddings
        const snapshot = await db.collection(collectionName).limit(1).get();
        if (snapshot.empty) {
            console.error('❌ Collection EMPTY');
        } else {
            const data = snapshot.docs[0].data();
            const emb = data.embedding_vector;
            if (Array.isArray(emb) && emb.length === 768) {
                console.log('✅ Embedding Dimension Check PASSED (768)');
            } else {
                console.error(`❌ Embedding Dimension FAILED: ${emb?.length}`);
            }
        }

        // 2. Test Retrieval
        console.log('\n🏥 Performing "Cancer" Retrieval Test...');
        const retriever = new GuidelinesRetrieverStub();
        const results = await retriever.search('lung cancer treatment guidelines India');

        console.log(`\n📋 Results (${results.length}):`);
        results.forEach((r, i) => {
            console.log(`   ${i + 1}. [${r.similarity.toFixed(3)}] ${r.title} (${r.organization}, ${r.year})`);
        });

    } catch (error) {
        console.error('❌ Verification Failed:', error);
    }
}

verifyFirestore();
