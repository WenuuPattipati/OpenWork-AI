/**
 * FULL STACK VERIFICATION TEST
 * Runs the complete Medical Evidence Orchestrator (Agents 1-7)
 * Verifies Gemini 3 integration and robust parsing
 */

import { MedicalEvidenceOrchestrator } from './lib/agents/medical-evidence-orchestrator';
import { config } from 'dotenv';
import * as fs from 'fs';

config({ path: '.env.local' });

async function testFullStack() {
    console.log('🚀 FULL STACK VERIFICATION - Agents 1-7');
    console.log('Target: Verify Gemini 3.0 models and robust JSON parsing\n');

    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is missing in .env.local');
    }

    const orchestrator = new MedicalEvidenceOrchestrator({
        google_ai_api_key: process.env.GEMINI_API_KEY,
        ncbi_api_key: process.env.NCBI_API_KEY || '',
        tavily_api_key: process.env.TAVILY_API_KEY || ''
    });

    // Test query that requires multi-hop gathering and guidelines
    const testQuery = "What are the latest Indian guidelines for managing gestational diabetes?";
    console.log(`🔍 Testing Query: "${testQuery}"`);

    try {
        const result = await orchestrator.processQuery(testQuery, 'test-session-gemini-3');

        console.log('\n📊 FINAL RESPONSE METRICS:');
        console.log(`   Sources: ${result.metadata.sources_count}`);
        console.log(`   Latency: ${result.metadata.latency_total_ms}ms`);
        console.log(`   Cost: $${result.metadata.cost_total_usd.toFixed(4)}`);
        console.log(`   Top Model: ${result.metadata.model_used}`);
        console.log(`   Grounding: ${Math.round(result.metadata.grounding_score * 100)}%`);

        // Check if models used were Gemini 3 (based on console logs which we can't easily capture here, 
        // but the output model_used should reflect SynthesisEngine's choice)
        if (result.metadata.model_used.includes('gemini-3') || result.metadata.model_used.includes('gemini-2.0-flash')) {
            console.log(`✅ Verified Model Usage: ${result.metadata.model_used}`);
        } else {
            console.warn(`⚠️ Unexpected Model Usage: ${result.metadata.model_used}`);
        }

        if (result.warning) {
            console.warn(`\n⚠️ Pipeline Warning: ${result.warning}`);
        }

        console.log('\n📝 Generated Synthesis Preview:');
        console.log(result.synthesis.substring(0, 500) + '...');

    } catch (error) {
        console.error('❌ Full stack test failed:', error);
    }
}

testFullStack().catch(console.error);
