/**
 * COMPLETE PIPELINE TEST - Agent 1 → Agent 2 → Agent 2.1
 * Test the full integration with query intelligence routing
 */

import { QueryIntelligenceAgent } from './lib/agents/query-intelligence';
import { MultiSourceRetrievalCoordinator } from './lib/agents/multi-source-retrieval';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function testCompletePipeline() {
  console.log('🚀 COMPLETE PIPELINE TEST - Agent 1 → Agent 2 → Agent 2.1\n');

  const queryIntelligence = new QueryIntelligenceAgent(process.env.GEMINI_API_KEY!);
  const multiSourceRetrieval = new MultiSourceRetrievalCoordinator({
    ncbi_api_key: process.env.NCBI_API_KEY!,
    tavily_api_key: process.env.TAVILY_API_KEY!
  });
  
  const traceContext = {
    traceId: `pipeline_${Date.now()}`,
    sessionId: 'pipeline_test',
    timestamp: Date.now()
  };

  // Test query that should trigger guidelines
  const testQuery = "What are the ICMR guidelines for diabetes management in India?";
  console.log(`🔍 Testing Query: "${testQuery}"`);
  
  try {
    // Step 1: Agent 1 - Query Intelligence
    console.log('\n📊 STEP 1: Agent 1 - Query Intelligence Analysis');
    const result = await queryIntelligence.analyzeQuery(testQuery, traceContext);
    const analysis = result.data;
    
    console.log(`   Query Type: ${analysis.query_type || analysis.intent}`);
    console.log(`   Complexity: ${analysis.complexity_score}`);
    console.log(`   Medical Domains: ${analysis.medical_domains ? analysis.medical_domains.join(', ') : 'Not specified'}`);
    console.log(`   Sub-agents to call:`);
    
    if (analysis.sub_agent_queries) {
      Object.entries(analysis.sub_agent_queries).forEach(([agent, config]) => {
        if (config && typeof config === 'object' && 'should_call' in config) {
          const typedConfig: any = config;
          if (typedConfig.should_call) {
            const queries = typedConfig.rephrased_queries || typedConfig.drug_names || [];
            console.log(`     ✅ ${agent}: ${Array.isArray(queries) && queries.length > 0 ? queries.join(', ') : 'No queries'}`);
          } else {
            console.log(`     ❌ ${agent}: Not needed`);
          }
        }
      });
    } else {
      console.log('     No sub-agent queries found');
    }

    // Step 2: Agent 2 - Multi-Source Retrieval
    console.log('\n🔍 STEP 2: Agent 2 - Multi-Source Retrieval Coordination');
    const evidence = await multiSourceRetrieval.retrieveAll(analysis, traceContext, testQuery);
    
    console.log(`   Total evidence sources: ${Object.keys(evidence).length}`);
    
    // Count total items across all sources
    const totalItems = Object.values(evidence).reduce((sum, items) => sum + (Array.isArray(items) ? items.length : 0), 0);
    console.log(`   Total evidence items: ${totalItems}`);
    
    console.log('   Evidence by source:');
    Object.entries(evidence).forEach(([source, items]) => {
      const count = Array.isArray(items) ? items.length : 0;
      if (count > 0) {
        console.log(`     ${source}: ${count} items`);
      }
    });

    // Step 3: Verify Guidelines Integration
    const guidelinesEvidence = evidence.guidelines || [];
    
    if (guidelinesEvidence.length > 0) {
      console.log('\n🎉 STEP 3: Guidelines Integration SUCCESS!');
      console.log(`   Retrieved ${guidelinesEvidence.length} guideline chunks`);
      
      console.log('\n📋 Top Guidelines Results:');
      guidelinesEvidence.slice(0, 3).forEach((item, i) => {
        console.log(`\n   ${i + 1}. ${item.title || 'Unknown Title'}`);
        console.log(`      Organization: ${item.organization || 'Unknown'}`);
        console.log(`      Section: ${item.parent_section || 'Unknown'}`);
        console.log(`      Similarity: ${item.similarity_score?.toFixed(3) || 'N/A'}`);
        console.log(`      Content: "${(item.text || item.content || '').substring(0, 100)}..."`);
      });

      console.log('\n✅ COMPLETE PIPELINE SUCCESS:');
      console.log('   🧠 Agent 1 Query Intelligence: ✓');
      console.log('   🔄 Agent 2 Multi-Source Coordination: ✓');
      console.log('   📚 Agent 2.1 Guidelines Retrieval: ✓');
      console.log('   🇮🇳 Indian Guidelines Integration: ✓');
      console.log('   🎯 End-to-End Pipeline: ✓');

    } else {
      console.log('\n⚠️ No guidelines evidence found - checking routing...');
      console.log('Agent 1 Analysis:', JSON.stringify(analysis.sub_agent_queries.guidelines, null, 2));
    }

  } catch (error) {
    console.error('❌ Pipeline test failed:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
  }
}

testCompletePipeline().catch(console.error);