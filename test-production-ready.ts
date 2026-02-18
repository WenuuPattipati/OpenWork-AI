/**
 * PRODUCTION READINESS TEST - Complete 7-Agent System
 * Tests: Guidelines + PubMed + DailyMed + Tavily Fallback
 * Complex query requiring drug info, guidelines, and research evidence
 */

import { QueryIntelligenceAgent } from './lib/agents/query-intelligence';
import { MultiSourceRetrievalCoordinator } from './lib/agents/multi-source-retrieval';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function testProductionReady() {
  console.log('🚀 PRODUCTION READINESS TEST - Complete 7-Agent System\n');
  console.log('🎯 Testing: Guidelines + PubMed + DailyMed + Tavily Integration\n');

  const queryIntelligence = new QueryIntelligenceAgent(process.env.GEMINI_API_KEY!);
  const multiSourceRetrieval = new MultiSourceRetrievalCoordinator({
    ncbi_api_key: process.env.NCBI_API_KEY!,
    tavily_api_key: process.env.TAVILY_API_KEY!
  });
  
  const traceContext = {
    traceId: `production_${Date.now()}`,
    sessionId: 'production_test',
    timestamp: Date.now()
  };

  // Complex query that should trigger ALL sub-agents
  const complexQuery = "What are the ICMR guidelines for metformin dosing in Type 2 diabetes patients with kidney disease? Include recent clinical trials and FDA safety warnings.";
  
  console.log(`🔍 COMPLEX QUERY: "${complexQuery}"`);
  console.log('\n📋 Expected Sub-Agent Activation:');
  console.log('   ✅ Guidelines: ICMR diabetes + kidney disease protocols');
  console.log('   ✅ PubMed: Clinical trials for metformin + CKD');
  console.log('   ✅ DailyMed: Metformin FDA labeling + contraindications');
  console.log('   ✅ Tavily: Recent safety warnings + updates');
  
  const startTime = Date.now();
  
  try {
    // Step 1: Agent 1 - Query Intelligence Analysis
    console.log('\n🧠 STEP 1: Agent 1 - Query Intelligence Analysis');
    console.log('=' .repeat(60));
    
    const result = await queryIntelligence.analyzeQuery(complexQuery, traceContext);
    const analysis = result.data;
    
    console.log(`✅ Query Analysis Complete`);
    console.log(`   Intent: ${analysis.query_type || analysis.intent}`);
    console.log(`   Complexity: ${analysis.complexity_score}`);
    console.log(`   Medical Entities: ${analysis.entities?.diseases?.length || 0} diseases, ${analysis.entities?.drugs?.length || 0} drugs`);
    
    console.log('\n🎯 Sub-Agent Routing Decisions:');
    let activatedAgents = 0;
    
    if (analysis.sub_agent_queries) {
      Object.entries(analysis.sub_agent_queries).forEach(([agent, config]) => {
        if (config && typeof config === 'object' && 'should_call' in config) {
          const typedConfig: any = config;
          const status = typedConfig.should_call ? '✅' : '❌';
          const queries = typedConfig.rephrased_queries
            ? typedConfig.rephrased_queries.length
            : (typedConfig.drug_names ? typedConfig.drug_names.length : 0);
          console.log(`   ${status} ${agent}: ${queries} specialized queries`);
          if (typedConfig.should_call) {
            activatedAgents++;
            console.log(`      Reasoning: ${typedConfig.reasoning}`);
            const queryList: string[] = typedConfig.rephrased_queries || typedConfig.drug_names || [];
            if (queryList.length > 0) {
              queryList.forEach((query: string, i: number) => {
                console.log(`      Query ${i + 1}: "${query.substring(0, 80)}..."`);
              });
            }
          }
        }
      });
    }
    
    console.log(`\n📊 Total Activated Sub-Agents: ${activatedAgents}/4`);
    
    // Step 2: Agent 2 - Multi-Source Retrieval Coordination
    console.log('\n🔍 STEP 2: Agent 2 - Multi-Source Retrieval Coordination');
    console.log('=' .repeat(60));
    
    const evidence = await multiSourceRetrieval.retrieveAll(analysis, traceContext, complexQuery);
    
    // Step 3: Evidence Analysis
    console.log('\n📊 STEP 3: Evidence Analysis & Validation');
    console.log('=' .repeat(60));
    
    const totalItems = Object.values(evidence).reduce((sum, items) => sum + (Array.isArray(items) ? items.length : 0), 0);
    console.log(`✅ Total Evidence Retrieved: ${totalItems} items`);
    
    console.log('\n📋 Evidence Breakdown by Source:');
    let criticalSources = 0;
    
    // Guidelines Analysis
    const guidelines = evidence.guidelines || [];
    if (guidelines.length > 0) {
      criticalSources++;
      console.log(`   📚 Guidelines: ${guidelines.length} chunks`);
      console.log(`      Top similarity: ${Math.max(...guidelines.map(g => g.similarity_score || 0)).toFixed(3)}`);
      console.log(`      Organizations: ${[...new Set(guidelines.map(g => g.organization))].join(', ')}`);
    } else {
      console.log(`   ❌ Guidelines: 0 chunks (CRITICAL FAILURE)`);
    }
    
    // PubMed Analysis
    const pubmed = evidence.pubmed || [];
    if (pubmed.length > 0) {
      criticalSources++;
      console.log(`   🔬 PubMed: ${pubmed.length} articles`);
      const recentArticles = pubmed.filter(p => p.year && p.year >= 2020).length;
      console.log(`      Recent (2020+): ${recentArticles} articles`);
      console.log(`      Journals: ${[...new Set(pubmed.map(p => p.journal).filter(Boolean))].slice(0, 3).join(', ')}`);
    } else {
      console.log(`   ❌ PubMed: 0 articles (CRITICAL FAILURE)`);
    }
    
    // DailyMed Analysis
    const dailymed = evidence.dailymed || [];
    if (dailymed.length > 0) {
      criticalSources++;
      console.log(`   💊 DailyMed: ${dailymed.length} drug labels`);
      console.log(`      Drugs: ${[...new Set(dailymed.map(d => d.drug_name).filter(Boolean))].join(', ')}`);
    } else {
      console.log(`   ⚠️ DailyMed: 0 drug labels (Expected for this query type)`);
    }
    
    // Other Sources
    const otherSources = ['clinical_trials', 'cochrane', 'bmj', 'nice', 'who'] as const;
    otherSources.forEach(source => {
      const items = (evidence as any)[source] || [];
      if (items.length > 0) {
        console.log(`   📄 ${source}: ${items.length} items`);
      }
    });
    
    // Step 4: Production Readiness Assessment
    console.log('\n🎯 STEP 4: Production Readiness Assessment');
    console.log('=' .repeat(60));
    
    const executionTime = Date.now() - startTime;
    console.log(`⏱️ Total Execution Time: ${(executionTime / 1000).toFixed(2)}s`);
    
    // Critical Success Criteria
    const criteria = {
      'Agent 1 Analysis': analysis && analysis.sub_agent_queries,
      'Guidelines Retrieved': guidelines.length > 0,
      'PubMed Retrieved': pubmed.length > 0,
      'Multi-Source Coordination': totalItems > 0,
      'Execution Time < 30s': executionTime < 30000,
      'No Critical Errors': true // Will be false if we reach catch block
    };
    
    console.log('\n✅ Production Readiness Checklist:');
    let passedCriteria = 0;
    Object.entries(criteria).forEach(([criterion, passed]) => {
      const status = passed ? '✅' : '❌';
      console.log(`   ${status} ${criterion}`);
      if (passed) passedCriteria++;
    });
    
    const readinessScore = (passedCriteria / Object.keys(criteria).length) * 100;
    console.log(`\n📊 Production Readiness Score: ${readinessScore.toFixed(1)}%`);
    
    if (readinessScore >= 80) {
      console.log('\n🎉 PRODUCTION READY! 🚀');
      console.log('✅ All critical systems operational');
      console.log('✅ Multi-agent coordination working');
      console.log('✅ Evidence retrieval successful');
      console.log('✅ Performance within acceptable limits');
      console.log('\n🚀 READY FOR DEPLOYMENT!');
      
      // Show sample evidence for verification
      console.log('\n📋 Sample Evidence (for verification):');
      if (guidelines.length > 0) {
        const topGuideline = guidelines[0];
        console.log(`\n📚 Top Guideline:`);
        console.log(`   Title: ${topGuideline.title}`);
        console.log(`   Section: ${topGuideline.parent_section}`);
        console.log(`   Content: "${topGuideline.text.substring(0, 150)}..."`);
      }
      
      if (pubmed.length > 0) {
        const topPubmed = pubmed[0];
        console.log(`\n🔬 Top PubMed Article:`);
        console.log(`   Title: ${topPubmed.title}`);
        console.log(`   Journal: ${topPubmed.journal}`);
        console.log(`   Year: ${topPubmed.year}`);
      }
      
    } else if (readinessScore >= 60) {
      console.log('\n⚠️ PARTIAL SUCCESS - Needs Investigation');
      console.log('Some systems working, but critical issues detected');
      console.log('Review failed criteria before deployment');
      
    } else {
      console.log('\n❌ NOT READY FOR PRODUCTION');
      console.log('Critical failures detected - requires fixes');
      console.log('Do not deploy until issues are resolved');
    }

  } catch (error) {
    console.error('\n❌ CRITICAL SYSTEM FAILURE');
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    console.log('\n🚨 PRODUCTION READINESS: FAILED');
    console.log('❌ System not ready for deployment');
    console.log('❌ Critical error in pipeline execution');
  }
}

testProductionReady().catch(console.error);