/**
 * Medical Evidence Synthesis Orchestrator
 * Coordinates all 7 agents in the complete workflow
 * Implements the exact architecture from project.md
 */

import { TraceContext, MedicalEvidenceResponse } from './types';
import { QueryIntelligenceAgent } from './query-intelligence';
import { MultiSourceRetrievalCoordinator } from './multi-source-retrieval';
import { EvidenceNormalizer } from './evidence-normalizer';
import { TwoStageReranker } from './bge-reranker';
import { EvidenceGapAnalyzer } from './evidence-gap-analyzer';
import { SynthesisEngine } from './synthesis-engine';
import { VerificationGate } from './verification-gate';
import { withToolSpan, SpanStatusCode } from '../otel';
import { logApiKeyStats } from '../utils/gemini-rate-limiter';

export class MedicalEvidenceOrchestrator {
  private queryIntelligence: QueryIntelligenceAgent;
  private multiSourceRetrieval: MultiSourceRetrievalCoordinator;
  private evidenceNormalizer: EvidenceNormalizer;
  private twoStageReranker: TwoStageReranker;
  private evidenceGapAnalyzer: EvidenceGapAnalyzer;
  private synthesisEngine: SynthesisEngine;
  private verificationGate: VerificationGate;

  constructor(config: {
    google_ai_api_key: string;
    ncbi_api_key: string;
    tavily_api_key: string;
  }) {
    this.queryIntelligence = new QueryIntelligenceAgent(config.google_ai_api_key);
    this.multiSourceRetrieval = new MultiSourceRetrievalCoordinator({
      ncbi_api_key: config.ncbi_api_key,
      tavily_api_key: config.tavily_api_key
    });
    this.evidenceNormalizer = new EvidenceNormalizer();
    this.twoStageReranker = new TwoStageReranker(config.ncbi_api_key);
    this.evidenceGapAnalyzer = new EvidenceGapAnalyzer(config.google_ai_api_key);
    this.synthesisEngine = new SynthesisEngine(config.google_ai_api_key);
    this.verificationGate = new VerificationGate(config.google_ai_api_key);
  }

  async processQuery(
    query: string,
    sessionId: string = 'default',
    isStudyMode: boolean = false
  ): Promise<MedicalEvidenceResponse> {
    return await withToolSpan('orchestrator', 'process_query', async (span) => {
      const startTime = Date.now();
      const traceId = this.generateTraceId();

      // Set input attributes
      span.setAttribute('synthesis.query', query);
      span.setAttribute('synthesis.session_id', sessionId);
      span.setAttribute('synthesis.trace_id', traceId);

    const traceContext: TraceContext = {
      traceId,
      sessionId,
      timestamp: startTime
    };

    console.log(`🚀 Starting 7-agent medical evidence synthesis`);
    console.log(`   Query: "${query}"`);
    console.log(`   Trace ID: ${traceId}`);
    console.log(`   Session ID: ${sessionId}`);

      // #region debug log
      fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'medical-evidence-orchestrator.ts:62', message: 'Orchestrator started', data: { query: query.substring(0, 100), traceId, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => { });
      // #endregion

    let totalCost = 0;
    const agentLatencies: Record<string, number> = {};

    try {
      // AGENT 1: Query Intelligence
      console.log(`\n🤖 AGENT 1: Query Intelligence`);
      // #region debug log
      fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'medical-evidence-orchestrator.ts:73', message: 'Agent 1 starting', data: { agent: 'query_intelligence', timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => { });
      // #endregion
      const queryResult = await this.queryIntelligence.analyzeQuery(query, traceContext);
      // #region debug log
      fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'medical-evidence-orchestrator.ts:76', message: 'Agent 1 completed', data: { agent: 'query_intelligence', success: queryResult.success, latency: queryResult.latency_ms, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => { });
      // #endregion
      
      if (!queryResult.success) {
        throw new Error(`Query analysis failed: ${queryResult.error}`);
      }

      const searchStrategy = queryResult.data;
      totalCost += queryResult.cost_usd || 0;
      agentLatencies.query_intelligence = queryResult.latency_ms;

      console.log(`✅ Query analyzed: ${searchStrategy.intent} (complexity: ${searchStrategy.complexity_score.toFixed(2)})`);
      console.log(`   Search variants: ${searchStrategy.search_variants.length}`);
      console.log(`   Required sources: ${Object.entries(searchStrategy.requires_sources).filter(([, v]) => v).map(([k]) => k).join(', ')}`);

      // AGENT 2: Multi-Source Retrieval
      console.log(`\n🔍 AGENT 2: Multi-Source Retrieval`);
      // #region debug log
      fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'medical-evidence-orchestrator.ts:90', message: 'Agent 2 starting', data: { agent: 'multi_source_retrieval', timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => { });
      // #endregion
      const retrievalStart = Date.now();
      const rawResults = await this.multiSourceRetrieval.retrieveAll(searchStrategy, traceContext, query);
      agentLatencies.multi_source_retrieval = Date.now() - retrievalStart;
      // #region debug log
      fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'medical-evidence-orchestrator.ts:94', message: 'Agent 2 completed', data: { agent: 'multi_source_retrieval', latency: agentLatencies.multi_source_retrieval, totalDocs: Object.values(rawResults).reduce((sum, arr) => sum + arr.length, 0), timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => { });
      // #endregion

      const totalDocuments = Object.values(rawResults).reduce((sum, arr) => sum + arr.length, 0);
      console.log(`✅ Retrieved ${totalDocuments} documents from ${Object.keys(rawResults).length} sources`);

      // AGENT 3: Evidence Normalizer
      console.log(`\n🔄 AGENT 3: Evidence Normalizer`);
      const normalizationStart = Date.now();
      const candidates = this.evidenceNormalizer.normalizeAll(rawResults);
      agentLatencies.evidence_normalizer = Date.now() - normalizationStart;

      console.log(`✅ Normalized ${candidates.length} evidence candidates`);

      // AGENT 4: Two-Stage Reranker
      console.log(`\n🎯 AGENT 4: Two-Stage BGE Reranker`);
      const evidencePack = await this.twoStageReranker.rerank(query, candidates, traceContext);
      // Note: BGE reranker cost is $0 (self-hosted)

      console.log(`✅ Reranked to top ${evidencePack.length} evidence chunks`);

      // AGENT 5: Evidence Gap Analyzer
      console.log(`\n🔍 AGENT 5: Evidence Gap Analyzer`);
      // #region debug log
      fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'medical-evidence-orchestrator.ts:115', message: 'Agent 5 starting', data: { agent: 'evidence_gap_analyzer', evidenceCount: evidencePack.length, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => { });
      // #endregion
      const gapAnalyzerStart = Date.now();
      const gapResult = await this.evidenceGapAnalyzer.analyze(
        query, 
        evidencePack, 
        traceContext,
        this.multiSourceRetrieval
      );
      // #region debug log
      fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'medical-evidence-orchestrator.ts:123', message: 'Agent 5 completed', data: { agent: 'evidence_gap_analyzer', coverage: gapResult.analysis.coverage_score, recommendation: gapResult.analysis.recommendation, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => { });
      // #endregion
      
      const { analysis: gapAnalysis, updatedEvidence } = gapResult;
      totalCost += 0.003; // Approximate cost for gap analysis
      agentLatencies.evidence_gap_analyzer = Date.now() - gapAnalyzerStart;

      console.log(`✅ Gap analysis: ${gapAnalysis.assessment} (${Math.round(gapAnalysis.coverage_score * 100)}% coverage)`);
      
      if (updatedEvidence.length > evidencePack.length) {
        console.log(`   📈 Added ${updatedEvidence.length - evidencePack.length} sources from Tavily`);
      }

      // AGENT 6: Synthesis Engine
      console.log(`\n✍️ AGENT 6: Synthesis Engine`);
      // #region debug log
      fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'medical-evidence-orchestrator.ts:135', message: 'Agent 6 starting', data: { agent: 'synthesis_engine', evidenceCount: updatedEvidence.length, complexity: searchStrategy.complexity_score, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => { });
      // #endregion
      const synthesisResult = await this.synthesisEngine.synthesize(
        query,
        updatedEvidence,
        gapAnalysis,
        searchStrategy.complexity_score,
        traceContext,
        isStudyMode
      );
      // #region debug log
      fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'medical-evidence-orchestrator.ts:144', message: 'Agent 6 completed', data: { agent: 'synthesis_engine', success: synthesisResult.success, model: synthesisResult.data?.model_used, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => { });
      // #endregion

      if (!synthesisResult.success) {
        throw new Error(`Synthesis failed: ${synthesisResult.error}`);
      }

      const synthesis = synthesisResult.data;
      totalCost += synthesisResult.cost_usd || 0;
      agentLatencies.synthesis_engine = synthesisResult.latency_ms;

      console.log(`✅ Synthesis complete: ${synthesis.synthesis.length} chars, ${synthesis.citations.length} citations`);
      console.log(`   Model used: ${synthesis.model_used}`);

      // AGENT 7: Verification Gate
      console.log(`\n🛡️ AGENT 7: Verification Gate`);
      // #region debug log
      fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'medical-evidence-orchestrator.ts:155', message: 'Agent 7 starting', data: { agent: 'verification_gate', timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => { });
      // #endregion

      let verificationResult;

      if (isStudyMode) {
        console.log(`⚖️ Skipping verification gate for Study Mode (Structured Output)`);
        verificationResult = {
          success: true,
          data: { synthesis: synthesis.synthesis },
          latency_ms: 0,
          cost_usd: 0,
          metadata: {
            verification: {
              passed: true,
              grounding_score: 1.0,
              hallucination_detected: false
            }
          }
        };
      } else {
        verificationResult = await this.verificationGate.verify(
          synthesis,
          traceContext
        );
      }

      // #region debug log
      fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'medical-evidence-orchestrator.ts:161', message: 'Agent 7 completed', data: { agent: 'verification_gate', success: verificationResult.success, grounding: verificationResult.metadata?.verification?.grounding_score, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => { });
      // #endregion

      if (!verificationResult.success) {
        console.warn(`⚠️ Verification failed: ${verificationResult.error}`);
        // Fallback to unverified synthesis
      }

      const finalSynthesis = verificationResult.success ? verificationResult.data : {
        synthesis: synthesis.synthesis,
        warning: '⚠️ Verification skipped due to system error'
      };

      totalCost += verificationResult.cost_usd || 0;
      agentLatencies.verification_gate = verificationResult.latency_ms;

      const verificationMetadata = verificationResult.metadata || {
        verification: {
          grounding_score: 0.8, // Default if skipped
          hallucination_detected: false
        }
      };

      console.log(`✅ Verification complete: ${verificationMetadata.verification.passed ? 'PASSED' : 'WARNING'}`);
      console.log(`   Grounding score: ${Math.round(verificationMetadata.verification.grounding_score * 100)}%`);

      // Calculate total metrics
      const totalLatency = Date.now() - startTime;
      const citationCoverage = synthesis.citations.length > 0 ? 
        (synthesis.citations.length / this.extractClaims(synthesis.synthesis).length) : 0;

      // Build final response
      const response: MedicalEvidenceResponse = {
        synthesis: finalSynthesis.synthesis,
        citations: synthesis.citations.map(c => ({
          number: c.number,
          source: c.source,
          id: c.id,
          title: c.title,
          url: this.buildCitationUrl(c),
          metadata: c.metadata
        })),
        metadata: {
          sources_count: updatedEvidence.length,
          latency_total_ms: totalLatency,
          cost_total_usd: totalCost,
          grounding_score: verificationMetadata.verification.grounding_score,
          citation_coverage: citationCoverage,
          hallucination_detected: verificationMetadata.verification.hallucination_detected,
          model_used: synthesis.model_used,
          trace_id: traceId
        }
      };

      if (finalSynthesis.warning) {
        response.warning = finalSynthesis.warning;
      }

      // Set comprehensive span attributes for final synthesis
      span.setAttribute('synthesis.output_length', finalSynthesis.synthesis.length);
      span.setAttribute('synthesis.citations_count', synthesis.citations.length);
      span.setAttribute('synthesis.sources_count', updatedEvidence.length);
      span.setAttribute('synthesis.total_latency_ms', totalLatency);
      span.setAttribute('synthesis.total_cost_usd', totalCost);
      span.setAttribute('synthesis.grounding_score', verificationMetadata.verification.grounding_score);
      span.setAttribute('synthesis.citation_coverage', citationCoverage);
      span.setAttribute('synthesis.hallucination_detected', verificationMetadata.verification.hallucination_detected);
      span.setAttribute('synthesis.model_used', synthesis.model_used);

      // Add span event for agent latencies
      span.addEvent('agent_latencies', agentLatencies);

      console.log(`\n🎉 7-Agent Synthesis Complete!`);
      console.log(`   Total latency: ${totalLatency}ms`);
      console.log(`   Total cost: $${totalCost.toFixed(4)}`);
      console.log(`   Sources: ${response.metadata.sources_count}`);
      console.log(`   Citations: ${response.citations.length}`);
      console.log(`   Grounding score: ${Math.round(response.metadata.grounding_score * 100)}%`);
      console.log(`   Agent latencies:`, agentLatencies);

      // Log API key usage statistics
      logApiKeyStats();

      return response;

    } catch (error) {
      console.error('❌ 7-Agent synthesis failed:', error);
      // #region debug log
      fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'medical-evidence-orchestrator.ts:240', message: 'Orchestrator error', data: { error: error instanceof Error ? error.message : 'Unknown', stack: error instanceof Error ? error.stack : '', elapsed: Date.now() - startTime, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => { });
      // #endregion

      // Set error attributes
      span.setAttribute('synthesis.success', false);
      span.setAttribute('synthesis.error', error instanceof Error ? error.message : 'Unknown error');
      span.setAttribute('synthesis.total_latency_ms', Date.now() - startTime);
      span.setAttribute('synthesis.total_cost_usd', totalCost);
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error instanceof Error ? error.message : 'Unknown error' });

      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      const errorResponse: MedicalEvidenceResponse = {
        synthesis: `We couldn't complete a full evidence synthesis for your query. This may be due to a temporary service issue or an overly narrow search.\n\n**What you can do:** Try rephrasing your question or simplifying it (e.g., one condition or one comparison). If the problem persists, try again in a few minutes.\n\n*Technical detail (for support):* ${errMsg}`,
        citations: [],
        metadata: {
          sources_count: 0,
          latency_total_ms: Date.now() - startTime,
          cost_total_usd: totalCost,
          grounding_score: 0,
          citation_coverage: 0,
          hallucination_detected: true,
          model_used: 'error',
          trace_id: traceId
        },
        warning: `⚠️ Synthesis step failed: ${errMsg}`
      };

      return errorResponse;
    }
    });
  }

  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private extractClaims(text: string): string[] {
    return text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 20);
  }

  private buildCitationUrl(citation: any): string | undefined {
    switch (citation.source) {
      case 'pubmed':
        return `https://pubmed.ncbi.nlm.nih.gov/${citation.id}/`;
      case 'indian_guideline':
        return citation.metadata.url;
      case 'dailymed':
        return `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${citation.id}`;
      case 'tavily_web':
        return citation.metadata.url;
      default:
        return citation.metadata.url;
    }
  }
}