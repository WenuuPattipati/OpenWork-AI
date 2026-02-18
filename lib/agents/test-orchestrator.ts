/**
 * Test script for the 7-Agent Medical Evidence Synthesis System
 * Run this to verify the system is working correctly
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' }); // Load environment variables from .env.local
import { MedicalEvidenceOrchestrator } from './medical-evidence-orchestrator';

async function testOrchestrator() {
  console.log('🧪 Testing 7-Agent Medical Evidence Synthesis System...\n');

  // Initialize orchestrator
  const orchestrator = new MedicalEvidenceOrchestrator({
    google_ai_api_key: process.env.GEMINI_API_KEY || '',
    ncbi_api_key: process.env.NCBI_API_KEY || '',
    tavily_api_key: process.env.TAVILY_API_KEY || ''
  });

  // Test queries
  const testQueries = [
    'What is the first-line treatment for Type 2 diabetes according to Indian guidelines?',
    // 'Compare apixaban vs rivaroxaban for stroke prevention in atrial fibrillation',
    // 'What are the side effects of metformin?'
  ];

  for (const query of testQueries) {
    console.log(`\n🔍 Testing query: "${query}"`);
    console.log('=' .repeat(80));

    try {
      const startTime = Date.now();
      const response = await orchestrator.processQuery(query, 'test-session');
      const duration = Date.now() - startTime;

      console.log(`✅ Query processed successfully in ${duration}ms`);
      console.log(`📊 Metadata:`);
      console.log(`   Sources: ${response.metadata.sources_count}`);
      console.log(`   Citations: ${response.citations.length}`);
      console.log(`   Cost: $${response.metadata.cost_total_usd.toFixed(4)}`);
      console.log(`   Grounding Score: ${Math.round(response.metadata.grounding_score * 100)}%`);
      console.log(`   Model Used: ${response.metadata.model_used}`);
      
      if (response.warning) {
        console.log(`⚠️ Warning: ${response.warning}`);
      }

      console.log(`\n📝 Synthesis Preview:`);
      console.log(response.synthesis.substring(0, 200) + '...');

      console.log(`\n📚 Citations:`);
      response.citations.slice(0, 3).forEach(citation => {
        console.log(`   [${citation.number}] ${citation.title.substring(0, 60)}...`);
      });

    } catch (error) {
      console.error(`❌ Query failed:`, error);
    }
  }

  console.log('\n🎉 Test completed!');
}

// Run test if this file is executed directly
if (require.main === module) {
  testOrchestrator().catch(console.error);
}

export { testOrchestrator };