
import dotenv from 'dotenv';
import { QueryIntelligenceAgent } from './lib/agents/query-intelligence';
import { MultiSourceRetrievalCoordinator } from './lib/agents/multi-source-retrieval';

dotenv.config({ path: '.env.local' });

async function runTest() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not found');

    console.log('🚀 Initializing Agents...');
    const agent1 = new QueryIntelligenceAgent(apiKey);
    const agent2 = new MultiSourceRetrievalCoordinator({
        ncbi_api_key: process.env.NCBI_API_KEY || '',
        tavily_api_key: process.env.TAVILY_API_KEY || ''
    });

    const query = "What is the first-line treatment for Hospital-Acquired Pneumonia?";
    console.log(`\n❓ Query: "${query}"`);

    // Step 1: Query Intelligence
    console.log('\n🧠 Running Agent 1 (Query Intelligence)...');
    const traceContext = { traceId: 'test-trace', sessionId: 'test-session', timestamp: Date.now() };

    const analysis = await agent1.analyzeQuery(query, traceContext);

    if (!analysis.data) {
        console.error('❌ Agent 1 failed to return data');
        if (analysis.error) console.error('Error:', analysis.error);
        return;
    }

    console.log('✅ Agent 1 Analysis:', JSON.stringify(analysis.data.sub_agent_queries, null, 2));

    // Step 2: Multi-Source Retrieval
    console.log('\n🔍 Running Agent 2 (Multi-Source Retrieval)...');
    // Removing type check for result property as implementation differs from typing
    const retrieval = await agent2.retrieveAll(analysis.data, traceContext, query) as any;

    // The actual implementation returns { result: ..., documents: ... } even if type says otherwise
    // Or if types were correct, it would be just the result object.
    // We'll inspect what we get.

    const resultObj = retrieval.result || retrieval;

    console.log('\n📊 Retrieval Results:');
    if (resultObj.pubmed) console.log(`- PubMed: ${resultObj.pubmed.length}`);
    if (resultObj.guidelines) console.log(`- Guidelines: ${resultObj.guidelines.length}`);
    if (resultObj.dailymed) console.log(`- DailyMed: ${resultObj.dailymed.length}`);
    if (resultObj.tavily) console.log(`- Web (Tavily): ${resultObj.tavily.length}`);

    // Log PubMed details if any
    if (resultObj.pubmed && resultObj.pubmed.length > 0) {
        console.log('First PubMed Result:', JSON.stringify(resultObj.pubmed[0], null, 2));
    } else {
        console.log('⚠️ No PubMed results found.');
    }

    // Log strict model config check
    console.log('\nChecking Agent 1 Model Name:', (agent1 as any).modelName);
}

runTest().catch(console.error);
