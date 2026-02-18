
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { MedicalEvidenceOrchestrator } from '../lib/agents/medical-evidence-orchestrator';

async function runTest() {
  console.log('🚀 Starting End-to-End Pipeline Test (Bypassing Next.js)...');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ Missing GEMINI_API_KEY in .env.local');
    process.exit(1);
  }

  const orchestrator = new MedicalEvidenceOrchestrator({
    google_ai_api_key: apiKey,
    ncbi_api_key: process.env.NCBI_API_KEY || '',
    tavily_api_key: process.env.TAVILY_API_KEY || ''
  });

  const query = "What are the RSSDI guidelines for metformin dosing in Type 2 diabetes with chronic kidney disease, and what drug interactions should be monitored according to Indian clinical practice?";
  const sessionId = `test-${Date.now()}`;

  console.log(`\n❓ Query: "${query}"`);
  console.log(`🆔 Session ID: ${sessionId}`);

  const startTime = Date.now();

  try {
    const response = await orchestrator.processQuery(query, sessionId);
    const totalTime = Date.now() - startTime;

    console.log('\n==========================================');
    console.log('🎉 TEST COMPLETE');
    console.log('==========================================');
    console.log(`⏱️ Total Time: ${totalTime} ms (${(totalTime / 1000).toFixed(2)}s)`);
    console.log(`📚 Sources: ${response.metadata?.sources_count}`);
    console.log(`📝 Citations: ${response.citations.length}`);
    console.log(`🛡️ Grounding Score: ${response.metadata?.grounding_score}`);
    console.log(`⚠️ Hallucination Detected: ${response.metadata?.hallucination_detected}`);
    
    if (response.warning) {
        console.log(`⚠️ Warning: ${response.warning}`);
    }

    console.log('\n📄 Synthesis Preview:');
    console.log(response.synthesis.substring(0, 500) + '...');

    // Verification of optimizations
    if (totalTime < 60000) {
        console.log('\n✅ PASS: Response time < 60s');
    } else {
        console.log('\n❌ FAIL: Response time > 60s');
    }

    // Check if Agent 7 batching worked (indirectly via timing)
    // If Agent 7 took < 5s with multiple citations, batching is working
    // (We can't see internal logs here easily without hooking stdout, but total time is the comprehensive metric)

  } catch (error) {
    console.error('❌ Test Failed:', error);
  }
}

runTest();
