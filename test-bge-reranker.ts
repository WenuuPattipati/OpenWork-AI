/**
 * Test script for Agent 4: BGE Reranker
 * Verifies Enhanced Deterministic Scoring works correctly
 */

import { TwoStageReranker } from './lib/agents/bge-reranker';
import { EvidenceCandidate, TraceContext } from './lib/agents/types';

// Mock Evidence Candidates representing different relevance levels
const mockCandidates: EvidenceCandidate[] = [
    {
        id: 'pmid-12345',
        source: 'pubmed',
        title: 'Efficacy of Metformin in Type 2 Diabetes: A Randomized Controlled Trial',
        text: 'Metformin is the first-line pharmacologic treatment for type 2 diabetes mellitus. This RCT shows significant HbA1c reduction.',
        metadata: {
            pub_types: ['Randomized Controlled Trial'],
            journal_tier: 'tier_1',
            pub_date: '2024-01-01'
        },
        full_text_available: false
    },
    {
        id: 'web-irrelevant',
        source: 'tavily_web',
        title: 'Best Chocolate Cake Recipe',
        text: 'Mix flour, sugar, and cocoa powder. Bake at 350 degrees for 45 minutes.',
        metadata: {},
        full_text_available: false
    },
    {
        id: 'guideline-ada',
        source: 'indian_guideline',
        title: 'ADA Standards of Medical Care in Diabetes 2025',
        text: 'Metformin should be continued as long as it is tolerated and not contraindicated. For patients with type 2 diabetes, lifestyle modification is essential.',
        metadata: {
            badges: ['Practice Guideline'],
            year: 2025
        },
        full_text_available: false
    },
    {
        id: 'pmid-67890',
        source: 'pubmed',
        title: 'Cardiovascular Benefits of Metformin in Diabetic Patients',
        text: 'Metformin reduces cardiovascular mortality in patients with diabetes mellitus. This meta-analysis of RCTs confirms significant risk reduction.',
        metadata: {
            pub_types: ['Meta-Analysis'],
            journal_tier: 'specialty_elite',
            pub_date: '2023-06-15'
        },
        full_text_available: false
    },
    {
        id: 'synonym-test',
        source: 'pubmed',
        title: 'Management of Essential HTN in Elderly Patients',
        text: 'Treatment of high blood pressure (HTN) reduces stroke risk. Thiazides are effective.',
        metadata: {
            pub_types: ['Review'],
            pub_date: '2023-01-01'
        },
        full_text_available: false
    }
];

// Full TraceContext
const traceContext: TraceContext = {
    traceId: 'test-trace-123',
    sessionId: 'test-session-456',
    timestamp: Date.now()
};

async function testReranker() {
    console.log('🧪 Testing Agent 4: BGE Reranker (Enhanced Deterministic Scoring)');
    console.log('═'.repeat(60));

    try {
        const apiKey = process.env.NCBI_API_KEY || 'test-key';
        const reranker = new TwoStageReranker(apiKey);

        // Test 1: Diabetes Query
        console.log('\n📋 TEST 1: Diabetes Query (Relevance + Quality)');
        console.log('🔍 Query: "metformin diabetes treatment efficacy"');
        let results = await reranker.rerank('metformin diabetes treatment efficacy', mockCandidates.slice(0, 4), traceContext);

        console.log('\n✅ RERANKING RESULTS (Diabetes):');
        results.forEach((r, i) => {
            const relevanceEmoji = r.score > 0.5 ? '✅' : r.score > 0.3 ? '⚠️' : '❌';
            console.log(`${i + 1}. ${relevanceEmoji} [${r.source}] ${r.title.substring(0, 50)}... (Score: ${r.score.toFixed(4)})`);
        });

        // Test 2: Synonym Query (HTN vs Hypertension)
        console.log('\n📋 TEST 2: Synonym Matching (HTN vs Hypertension)');
        console.log('🔍 Query: "hypertension management guidelines"');
        // Note: The document uses "HTN" and "high blood pressure", query uses "hypertension"
        // This tests if the synonym map works
        results = await reranker.rerank('hypertension management guidelines', [mockCandidates[4], mockCandidates[1]], traceContext);

        console.log('\n✅ RERANKING RESULTS (Synonyms):');
        results.forEach((r, i) => {
            const relevanceEmoji = r.score > 0.4 ? '✅' : '❌';
            console.log(`${i + 1}. ${relevanceEmoji} [${r.source}] ${r.title} (Score: ${r.score.toFixed(4)})`);
        });

        const htnDoc = results.find(r => r.id === 'synonym-test');
        if (htnDoc && htnDoc.score > 0.3) {
            console.log('✅ Synonym matching works! "Hypertension" query matched "HTN" in text.');
        } else {
            console.error('❌ Synonym matching FAILED.');
        }

    } catch (error) {

        console.error('\n❌ Test Failed with Error:', error);
        process.exit(1);
    }
}

testReranker();
