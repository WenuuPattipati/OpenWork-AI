/**
 * Agent 2: Multi-Source Retrieval Coordinator
 * Orchestrates parallel retrieval from all required sources with intelligent sub-agent routing
 * ENHANCED: Now uses specialized queries from Agent 1 for optimal sub-agent performance
 */

import { QueryAnalysis, EvidenceCandidate, TraceContext } from './types';
import { withRetrieverSpan, SpanStatusCode } from '../otel';

// EVIDENCE ENGINE INTEGRATION - Lazy imports for better performance
// These will be imported only when needed to reduce compilation time

// Sub-agent imports with specialized query handling
import { GuidelinesRetriever } from './sub-agents/guidelines-retriever';
import { PubMedIntelligence } from './sub-agents/pubmed-intelligence';
import { DailyMedRetriever } from './sub-agents/dailymed-retriever';
import { TavilySmartSearch } from './sub-agents/tavily-search';

export interface RetrievalResults {
  guidelines: any[];
  pubmed: any[];
  dailymed: any[];
  clinical_trials: any[];
  cochrane: any[];
  bmj: any[];
  nice: any[];
  who: any[];
  cdc: any[];
  landmark_trials: any[];
  semantic_scholar: any[];
  europe_pmc: any[];
  pmc: any[];
  openalex: any[];
  tavily: any[];
}

export class MultiSourceRetrievalCoordinator {
  private guidelines: GuidelinesRetriever;
  private pubmedIntelligence: PubMedIntelligence;
  private dailymedRetriever: DailyMedRetriever;
  private tavily: TavilySmartSearch;

  constructor(config: {
    ncbi_api_key: string;
    tavily_api_key: string;
  }) {
    // Initialize sub-agents with specialized capabilities
    this.guidelines = new GuidelinesRetriever();
    this.pubmedIntelligence = new PubMedIntelligence(config.ncbi_api_key);
    this.dailymedRetriever = new DailyMedRetriever();
    this.tavily = new TavilySmartSearch(config.tavily_api_key);
  }

  async retrieveAll(
    searchStrategy: QueryAnalysis,
    traceContext: TraceContext,
    originalQuery?: string
  ): Promise<RetrievalResults> {
    return await withRetrieverSpan('intelligent_multi_source', async (span) => {
      const startTime = Date.now();

      // Set retrieval attributes
      span.setAttribute('retrieval.source', 'intelligent_multi_source');
      span.setAttribute('retrieval.query', searchStrategy.search_variants.join(' | '));
    const tasks: Promise<any>[] = [];
    const sources = searchStrategy.requires_sources;
    const subAgentQueries = searchStrategy.sub_agent_queries;

    console.log(`🔍 Starting intelligent sub-agent retrieval with specialized queries...`);
    console.log(`📋 Original query: "${originalQuery || 'Not provided'}"`);
    console.log(`🎯 Sub-agent routing decisions:`);
    console.log(`   Guidelines: ${subAgentQueries.guidelines?.should_call ? '✓' : '✗'} - ${subAgentQueries.guidelines?.reasoning}`);
    console.log(`   PubMed: ${subAgentQueries.pubmed?.should_call ? '✓' : '✗'} - ${subAgentQueries.pubmed?.reasoning}`);
    console.log(`   DailyMed: ${subAgentQueries.dailymed?.should_call ? '✓' : '✗'} - ${subAgentQueries.dailymed?.reasoning}`);

    // #region debug log
    fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'multi-source-retrieval.ts:69',message:'Multi-source retrieval starting',data:{guidelines:subAgentQueries.guidelines?.should_call,pubmed:subAgentQueries.pubmed?.should_call,dailymed:subAgentQueries.dailymed?.should_call,timestamp:Date.now()},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    // CRITICAL FIX: Increased timeout to 60 seconds to allow for rate-limited API calls
    // With rate limiting and retries, searches may take longer but should complete
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Retrieval timeout after 60 seconds')), 60000)
    );

    // 1. Guidelines Retriever - Use specialized queries from Agent 1
      if (subAgentQueries.guidelines?.should_call && (subAgentQueries.guidelines?.rephrased_queries?.length || 0) > 0) {
        console.log(`📋 Guidelines: Using ${subAgentQueries.guidelines!.rephrased_queries.length} specialized queries`);
      // #region debug log
      fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'multi-source-retrieval.ts:85',message:'Sub-agent guidelines starting',data:{subAgent:'guidelines',timestamp:Date.now()},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      tasks.push(
        this.guidelines.search(
          subAgentQueries.guidelines!.rephrased_queries,
          traceContext,
          originalQuery
        ).then(results => {
          // #region debug log
          fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'multi-source-retrieval.ts:92', message: 'Sub-agent guidelines completed', data: { subAgent: 'guidelines', resultCount: results.length || 0, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => { });
          // #endregion
          return { type: 'guidelines', results };
        }).catch(err => {
          // #region debug log
          fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'multi-source-retrieval.ts:96',message:'Sub-agent guidelines error',data:{subAgent:'guidelines',error:err instanceof Error?err.message:'Unknown',timestamp:Date.now()},timestamp:Date.now()})}).catch(()=>{});
          // #endregion
          throw err;
        })
      );
    } else {
      tasks.push(Promise.resolve({ type: 'guidelines', results: [] }));
    }

    // 2. PubMed Intelligence - Use specialized queries with MeSH terms from Agent 1
    // CRITICAL FIX: PubMed should ALWAYS be called - it's the primary evidence source
    // Even if Agent 1 didn't route to it, we should still call it as a fallback
    const shouldCallPubMed = subAgentQueries.pubmed?.should_call !== false; // Default to true
      const pubmedQueries = (subAgentQueries.pubmed?.rephrased_queries?.length || 0) > 0
        ? subAgentQueries.pubmed!.rephrased_queries 
      : searchStrategy.search_variants.slice(0, 3); // Fallback to search variants if no specialized queries
    
    if (shouldCallPubMed && pubmedQueries.length > 0) {
      console.log(`🔬 PubMed: Using ${pubmedQueries.length} ${subAgentQueries.pubmed?.rephrased_queries?.length ? 'specialized' : 'fallback'} queries with MeSH terms`);
      // #region debug log
      fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'multi-source-retrieval.ts:100', message: 'Sub-agent pubmed starting', data: { subAgent: 'pubmed', queryCount: pubmedQueries.length, isFallback: !(subAgentQueries.pubmed?.rephrased_queries?.length), timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => { });
      // #endregion
        const pubmedStartTime = Date.now();
        tasks.push(
          Promise.race([
            this.pubmedIntelligence.search(
              pubmedQueries,
              searchStrategy.entities,
              traceContext,
              originalQuery
            ).then(results => {
              // #region debug log
              fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'multi-source-retrieval.ts:107', message: 'Sub-agent pubmed completed', data: { subAgent: 'pubmed', resultCount: results.length || 0, elapsed: Date.now() - pubmedStartTime, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => { });
              // #endregion
              if (!results || results.length === 0) {
                console.warn('⚠️ PubMed returned no results - this may cause over-reliance on Tavily');
              }
              return { type: 'pubmed', results };
            }).catch(err => {
              // #region debug log
              fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'multi-source-retrieval.ts:111',message:'Sub-agent pubmed error',data:{subAgent:'pubmed',error:err instanceof Error?err.message:'Unknown',elapsed:Date.now()-pubmedStartTime,timestamp:Date.now()},timestamp:Date.now()})}).catch(()=>{});
              // #endregion
              console.error('❌ PubMed search failed - this will cause over-reliance on Tavily:', err);
              // Return empty results instead of throwing - don't break the pipeline
              return { type: 'pubmed', results: [] };
            }),
            // Individual timeout for PubMed (50 seconds)
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('PubMed search timeout after 50 seconds')), 50000)
            ).then(() => ({ type: 'pubmed', results: [] }))
          ]).catch(err => {
            // #region debug log
            fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'multi-source-retrieval.ts:120',message:'Sub-agent pubmed timeout/error',data:{subAgent:'pubmed',error:err instanceof Error?err.message:'Unknown',elapsed:Date.now()-pubmedStartTime,timestamp:Date.now()},timestamp:Date.now()})}).catch(()=>{});
            // #endregion
            console.error('❌ PubMed search timed out or failed:', err);
            return { type: 'pubmed', results: [] };
          })
        );
    } else {
      console.warn('⚠️ PubMed not called - this is unusual and may cause over-reliance on Tavily');
      tasks.push(Promise.resolve({ type: 'pubmed', results: [] }));
    }

    // 3. DailyMed Retriever - Use clean drug names from Agent 1
      if (subAgentQueries.dailymed?.should_call && (subAgentQueries.dailymed?.drug_names?.length || 0) > 0) {
        console.log(`💊 DailyMed: Using ${subAgentQueries.dailymed!.drug_names.length} clean drug names`);
      // #region debug log
      fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'multi-source-retrieval.ts:116',message:'Sub-agent dailymed starting',data:{subAgent:'dailymed',timestamp:Date.now()},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      tasks.push(
        this.dailymedRetriever.search(
          subAgentQueries.dailymed!.drug_names,
          traceContext,
          originalQuery
        ).then(results => {
          // #region debug log
          fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'multi-source-retrieval.ts:123', message: 'Sub-agent dailymed completed', data: { subAgent: 'dailymed', resultCount: results.length || 0, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => { });
          // #endregion
          return { type: 'dailymed', results };
        }).catch(err => {
          // #region debug log
          fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'multi-source-retrieval.ts:127',message:'Sub-agent dailymed error',data:{subAgent:'dailymed',error:err instanceof Error?err.message:'Unknown',timestamp:Date.now()},timestamp:Date.now()})}).catch(()=>{});
          // #endregion
          throw err;
        })
      );
    } else {
      tasks.push(Promise.resolve({ type: 'dailymed', results: [] }));
    }

    // 4. Clinical Trials (Evidence Engine) - Dynamic import for performance
    tasks.push(
      (async () => {
        try {
          const { searchClinicalTrials } = await import('../evidence/clinical-trials');
          const results = await searchClinicalTrials(
            searchStrategy.search_variants.join(' OR '),
            20 // maxResults
          );
          return { type: 'clinical_trials', results };
        } catch (error) {
          console.warn('Clinical trials search failed:', error);
          return { type: 'clinical_trials', results: [] };
        }
      })()
    );

    // 5. Cochrane Reviews (Evidence Engine) - Dynamic import for performance
    tasks.push(
      (async () => {
        try {
          const { comprehensiveCochraneSearch } = await import('../evidence/cochrane');
          const results = await comprehensiveCochraneSearch(
            searchStrategy.search_variants.join(' OR ')
          );
          return { type: 'cochrane', results: results.allReviews };
        } catch (error) {
          console.warn('Cochrane search failed:', error);
          return { type: 'cochrane', results: [] };
        }
      })()
    );

    // 6-14. Other sources - Use placeholder functions for now
    // TODO: Implement these functions in their respective files
    tasks.push(Promise.resolve({ type: 'bmj', results: [] }));
    tasks.push(Promise.resolve({ type: 'nice', results: [] }));
    tasks.push(Promise.resolve({ type: 'who', results: [] }));
    tasks.push(Promise.resolve({ type: 'cdc', results: [] }));
    tasks.push(Promise.resolve({ type: 'landmark_trials', results: [] }));
    tasks.push(Promise.resolve({ type: 'semantic_scholar', results: [] }));
    tasks.push(Promise.resolve({ type: 'europe_pmc', results: [] }));
    tasks.push(Promise.resolve({ type: 'pmc', results: [] }));
    tasks.push(Promise.resolve({ type: 'openalex', results: [] }));

    // Execute all tasks in parallel with timeout
    console.log(`⚡ Executing ${tasks.length} parallel searches with intelligent routing...`);
    // #region debug log
    fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'multi-source-retrieval.ts:173',message:'Waiting for parallel tasks',data:{taskCount:tasks.length,timestamp:Date.now()},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    
    try {
      const results = await Promise.race([
        Promise.all(tasks),
        timeoutPromise
      ]) as any[];
      // #region debug log
      fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'multi-source-retrieval.ts:179',message:'Parallel tasks completed',data:{resultCount:results.length,elapsed:Date.now()-startTime,timestamp:Date.now()},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      
      const totalLatency = Date.now() - startTime;

    // Organize results
    const organizedResults: RetrievalResults = {
      guidelines: [],
      pubmed: [],
      dailymed: [],
      clinical_trials: [],
      cochrane: [],
      bmj: [],
      nice: [],
      who: [],
      cdc: [],
      landmark_trials: [],
      semantic_scholar: [],
      europe_pmc: [],
      pmc: [],
      openalex: [],
      tavily: [] // Will be populated by Agent 5 if needed
    };

    for (const result of results) {
      organizedResults[result.type as keyof RetrievalResults] = result.results || [];
    }

    // Set comprehensive retrieval metrics with sub-agent intelligence
    const totalResults = Object.values(organizedResults).reduce((sum, arr) => sum + arr.length, 0);
    
    // Set span attributes
    span.setAttribute('retrieval.result_count', totalResults);
    span.setAttribute('retrieval.latency_ms', totalLatency);
    span.setAttribute('retrieval.guidelines_count', organizedResults.guidelines.length);
    span.setAttribute('retrieval.guidelines_called', subAgentQueries.guidelines?.should_call || false);
    span.setAttribute('retrieval.guidelines_queries', subAgentQueries.guidelines?.rephrased_queries.length || 0);
    span.setAttribute('retrieval.pubmed_count', organizedResults.pubmed.length);
    span.setAttribute('retrieval.pubmed_called', subAgentQueries.pubmed?.should_call || false);
    span.setAttribute('retrieval.pubmed_queries', subAgentQueries.pubmed?.rephrased_queries.length || 0);
    span.setAttribute('retrieval.pubmed_mesh_terms', subAgentQueries.pubmed?.mesh_terms.length || 0);
    span.setAttribute('retrieval.dailymed_count', organizedResults.dailymed.length);
    span.setAttribute('retrieval.dailymed_called', subAgentQueries.dailymed?.should_call || false);
    span.setAttribute('retrieval.dailymed_drugs', subAgentQueries.dailymed?.drug_names.length || 0);
    span.setAttribute('retrieval.clinical_trials_count', organizedResults.clinical_trials.length);
    span.setAttribute('retrieval.cochrane_count', organizedResults.cochrane.length);
    span.setAttribute('retrieval.bmj_count', organizedResults.bmj.length);
    span.setAttribute('retrieval.nice_count', organizedResults.nice.length);
    span.setAttribute('retrieval.who_count', organizedResults.who.length);
    span.setAttribute('retrieval.cdc_count', organizedResults.cdc.length);
    span.setAttribute('retrieval.landmark_trials_count', organizedResults.landmark_trials.length);
    span.setAttribute('retrieval.semantic_scholar_count', organizedResults.semantic_scholar.length);
    span.setAttribute('retrieval.europe_pmc_count', organizedResults.europe_pmc.length);
    span.setAttribute('retrieval.pmc_count', organizedResults.pmc.length);
    span.setAttribute('retrieval.openalex_count', organizedResults.openalex.length);
    span.setAttribute('retrieval.sub_agents_called', [
      subAgentQueries.guidelines?.should_call,
      subAgentQueries.pubmed?.should_call,
      subAgentQueries.dailymed?.should_call
    ].filter(Boolean).length);

    console.log(`✅ Intelligent evidence retrieval complete: ${totalResults} documents in ${totalLatency}ms`);
    console.log(`🎯 Sub-agent performance:`);
    console.log(`   📚 Guidelines: ${organizedResults.guidelines.length} (${subAgentQueries.guidelines?.rephrased_queries.length || 0} specialized queries)`);
    console.log(`   � PubMed: ${organizedResults.pubmed.length} (${subAgentQueries.pubmed?.rephrased_queries.length || 0} queries, ${subAgentQueries.pubmed?.mesh_terms.length || 0} MeSH terms)`);
    console.log(`   � DailyMed: ${organizedResults.dailymed.length} (${subAgentQueries.dailymed?.drug_names.length || 0} clean drug names)`);
    console.log(`   🧪 Clinical Trials: ${organizedResults.clinical_trials.length}`);
    console.log(`   📊 Cochrane: ${organizedResults.cochrane.length}`);
    console.log(`   🏥 BMJ: ${organizedResults.bmj.length}`);
    console.log(`   🇬🇧 NICE: ${organizedResults.nice.length}`);
    console.log(`   🌍 WHO: ${organizedResults.who.length}`);
    console.log(`   🇺🇸 CDC: ${organizedResults.cdc.length}`);
    console.log(`   ⭐ Landmark Trials: ${organizedResults.landmark_trials.length}`);
    console.log(`   🎓 Semantic Scholar: ${organizedResults.semantic_scholar.length}`);
    console.log(`   🇪🇺 Europe PMC: ${organizedResults.europe_pmc.length}`);
    console.log(`   📄 PMC Full-text: ${organizedResults.pmc.length}`);
    console.log(`   🔍 OpenAlex: ${organizedResults.openalex.length}`);

    // Convert to documents format for span events
    const allDocuments: any[] = [];
    Object.entries(organizedResults).forEach(([source, results]) => {
      results.forEach((result: any, index: number) => {
        allDocuments.push({
          id: result.id || result.pmid || result.setid || `${source}_${index}`,
          content: result.text || result.abstract || result.title || result.content || '',
          score: result.score || result.similarity_score || 1.0,
          metadata: {
            source,
            ...result.metadata,
            ...result
          }
        });
      });
    });

    return { result: organizedResults, documents: allDocuments };
    
    } catch (error) {
      console.error('❌ Intelligent evidence retrieval failed or timed out:', error);
      // #region debug log
      fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'multi-source-retrieval.ts:273',message:'Multi-source retrieval error',data:{error:error instanceof Error?error.message:'Unknown',elapsed:Date.now()-startTime,timestamp:Date.now()},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      
      // Set error attributes
      span.setAttribute('retrieval.result_count', 0);
      span.setAttribute('retrieval.latency_ms', Date.now() - startTime);
      span.setAttribute('retrieval.error', error instanceof Error ? error.message : 'Unknown error');
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error instanceof Error ? error.message : 'Unknown error' });
      
      // Return partial results if available
      const partialResults: RetrievalResults = {
        guidelines: [],
        pubmed: [],
        dailymed: [],
        clinical_trials: [],
        cochrane: [],
        bmj: [],
        nice: [],
        who: [],
        cdc: [],
        landmark_trials: [],
        semantic_scholar: [],
        europe_pmc: [],
        pmc: [],
        openalex: [],
        tavily: []
      };
      
      console.log('⚠️ Returning empty results due to intelligent retrieval failure/timeout');
      return { result: partialResults, documents: [] };
      }
    }, { source: 'intelligent_multi_source' });
  }

  // Method to be called by Agent 5 if Tavily search needed
  async searchTavily(
    query: string,
    existingUrls: Set<string>,
    traceContext: TraceContext,
    originalQuery?: string
  ): Promise<any[]> {
    return this.tavily.search(query, existingUrls, traceContext, originalQuery);
  }
}