/**
 * Agent 4: Two-Stage BGE Reranker
 * Primary: BAAI/bge-reranker-v2-m3 via HuggingFace Inference API
 * Fallback: Enhanced deterministic scoring with medical synonym awareness
 * Evidence quality signals: journal tier, study type, recency, source authority
 *
 * Stage 1: Document-level (all candidates → Top 20)
 * Stage 2: Chunk-level (20 docs chunked → Top 10 chunks)
 */

import { EvidenceCandidate, RankedEvidence, TraceContext } from './types';
import { FullTextFetcher } from './sub-agents/fulltext-fetcher';
import { withToolSpan, SpanStatusCode } from '../otel';

export interface ChunkForRerank {
  source: string;
  id: string;
  title: string;
  text: string;
  metadata: any;
  section?: string;
  chunk_index?: number;
  doc_level_score?: number;
}

// Common medical synonym pairs for enhanced matching
const MEDICAL_SYNONYMS: Record<string, string[]> = {
  'hypertension': ['high blood pressure', 'htn', 'elevated bp'],
  'diabetes': ['dm', 'diabetes mellitus', 'hyperglycemia'],
  'myocardial infarction': ['heart attack', 'mi', 'stemi', 'nstemi'],
  'cerebrovascular accident': ['stroke', 'cva', 'brain attack'],
  'copd': ['chronic obstructive pulmonary disease', 'emphysema', 'chronic bronchitis'],
  'chf': ['congestive heart failure', 'heart failure', 'hf'],
  'ckd': ['chronic kidney disease', 'renal failure', 'renal insufficiency'],
  'dvt': ['deep vein thrombosis', 'venous thromboembolism', 'vte'],
  'pe': ['pulmonary embolism', 'pulmonary thromboembolism'],
  'uti': ['urinary tract infection', 'bladder infection', 'cystitis'],
  'nsaid': ['nonsteroidal anti-inflammatory', 'ibuprofen', 'naproxen'],
  'ace inhibitor': ['acei', 'angiotensin converting enzyme inhibitor', 'enalapril', 'lisinopril', 'ramipril'],
  'arb': ['angiotensin receptor blocker', 'losartan', 'valsartan', 'telmisartan'],
  'ssri': ['selective serotonin reuptake inhibitor', 'fluoxetine', 'sertraline', 'escitalopram'],
  'ppi': ['proton pump inhibitor', 'omeprazole', 'pantoprazole', 'esomeprazole'],
  'anticoagulant': ['blood thinner', 'warfarin', 'heparin', 'apixaban', 'rivaroxaban'],
  'efficacy': ['effectiveness', 'effect', 'outcome', 'benefit'],
  'adverse': ['side effect', 'adverse effect', 'adverse reaction', 'toxicity'],
  'contraindication': ['contraindicated', 'should not be used', 'avoid'],
  'prophylaxis': ['prevention', 'preventive', 'preventative'],
  'etiology': ['cause', 'pathogenesis', 'origin'],
  'prognosis': ['outcome', 'survival', 'mortality'],
  'neoplasm': ['cancer', 'tumor', 'malignancy', 'carcinoma'],
  'analgesic': ['painkiller', 'pain relief', 'pain management'],
  'antipyretic': ['fever reducer', 'fever reduction'],
  'metformin': ['glucophage', 'biguanide'],
  'atorvastatin': ['lipitor', 'statin'],
  'amlodipine': ['norvasc', 'calcium channel blocker', 'ccb'],
};

export class TwoStageReranker {
  private fullTextFetcher: FullTextFetcher;
  private hfApiKey: string | undefined;
  private useHuggingFace: boolean;
  private hfModelUrl: string;
  private hfTimeout: number;

  constructor(ncbiApiKey: string) {
    this.fullTextFetcher = new FullTextFetcher(ncbiApiKey);
    this.hfApiKey = process.env.HUGGINGFACE_API_KEY;
    
    // CRITICAL FIX: HuggingFace Inference API is unreliable (rate limits, 410 errors)
    // Use Enhanced Deterministic Scoring as PRIMARY method
    // Only enable HuggingFace if explicitly requested AND key exists
    const forceHF = process.env.FORCE_HUGGINGFACE_RERANKER === 'true';
    this.useHuggingFace = forceHF && !!this.hfApiKey;

    this.hfModelUrl = 'https://api-inference.huggingface.co/models/BAAI/bge-reranker-v2-m3';
    this.hfTimeout = 10000; // Reduced to 10s timeout

    // Log scoring method being used
    console.log('🔄 BGE Reranker: Enhanced Deterministic Scoring (medical synonyms + quality signals)');
    if (this.useHuggingFace) {
      console.log('   ⚡ HuggingFace neural reranking ENABLED (FORCE_HUGGINGFACE_RERANKER=true)');
    }
  }


  async rerank(
    query: string,
    candidates: EvidenceCandidate[],
    traceContext: TraceContext
  ): Promise<RankedEvidence[]> {
    return await withToolSpan('two_stage_reranker', 'execute', async (span) => {
      const startTime = Date.now();

      span.setAttribute('agent.input', JSON.stringify({
        query,
        input_docs: candidates.length
      }));
      span.setAttribute('agent.name', 'two_stage_reranker');

      try {
        // STAGE 1: Document-level re-ranking with quality signals
        console.log(`🔄 Stage 1: Document-level reranking (${candidates.length} → 20)`);
        const stage1Start = Date.now();

        const docScores = await this.scoreDocuments(query, candidates);

        // Combine semantic scores with evidence quality signals
        // CRITICAL FIX: Ensure PubMed sources get priority boost
        const scoredDocs = candidates.map((candidate, index) => {
          const semanticScore = docScores[index];
          const qualityBoost = this.calculateEvidenceQualityBoost(candidate);

          // ADDITIONAL BOOST: If PubMed source, give extra priority
          let pubmedBoost = 0;
          if (candidate.source === 'pubmed') {
            pubmedBoost = 0.10; // Extra boost for PubMed to ensure it's prioritized
          }

          // 70% semantic relevance, 25% evidence quality, 5% PubMed priority boost
          const combinedScore = 0.70 * semanticScore + 0.25 * qualityBoost + pubmedBoost;
          return { candidate, score: combinedScore, semanticScore, qualityBoost, pubmedBoost };
        });

        // Sort and take top 20
        // CRITICAL FIX: Ensure at least some PubMed sources are included if available
        const pubmedDocs = scoredDocs.filter(d => d.candidate.source === 'pubmed');
        const nonPubmedDocs = scoredDocs.filter(d => d.candidate.source !== 'pubmed');

        // Prioritize: Take top PubMed docs first, then fill remaining slots
        const topPubmedDocs = pubmedDocs.sort((a, b) => b.score - a.score).slice(0, Math.min(15, pubmedDocs.length));
        const topNonPubmedDocs = nonPubmedDocs.sort((a, b) => b.score - a.score).slice(0, 20 - topPubmedDocs.length);

        const top20Docs = [...topPubmedDocs, ...topNonPubmedDocs]
          .sort((a, b) => b.score - a.score)
          .slice(0, 20);

        const stage1Time = Date.now() - stage1Start;
        console.log(`✅ Stage 1 complete: ${top20Docs.length} docs in ${stage1Time}ms`);
        console.log(`   Top 3: ${top20Docs.slice(0, 3).map(d =>
          `[${d.candidate.source}] "${d.candidate.title?.substring(0, 50)}..." (sem=${d.semanticScore.toFixed(2)} qual=${d.qualityBoost.toFixed(2)} final=${d.score.toFixed(2)})`
        ).join('\n   ')}`);

        // STAGE 2: Fetch full-text and chunk-level re-ranking
        console.log(`🔄 Stage 2: Full-text fetching and chunk-level reranking`);
        const stage2Start = Date.now();

        // CRITICAL FIX: Use Promise.allSettled for robust parallel fetching
        // One failed fetch won't crash the entire process
        const fetchPromises = top20Docs.map(async ({ candidate, score }) => {
          if (candidate.full_text_available && !candidate.full_text_sections) {
            try {
              const enriched = await this.fullTextFetcher.fetchFullText(candidate, query);
              return { candidate: enriched, doc_level_score: score };
            } catch (error) {
              console.warn(`⚠️ Full-text fetch failed for ${candidate.id}, using original:`, error instanceof Error ? error.message : error);
              return { candidate, doc_level_score: score };
            }
          }
          return { candidate, doc_level_score: score };
        });

        const fetchResults = await Promise.allSettled(fetchPromises);
        const enrichedDocs = fetchResults
          .filter((result): result is PromiseFulfilledResult<{ candidate: any; doc_level_score: number }> => result.status === 'fulfilled')
          .map(result => result.value);

        // Chunk all documents
        const allChunks: ChunkForRerank[] = [];
        for (const { candidate, doc_level_score } of enrichedDocs) {
          const candidateForChunking: EvidenceCandidate = 'source' in candidate
            ? candidate as EvidenceCandidate
            : {
              source: 'pubmed' as const,
              id: candidate.pmid || 'unknown',
              title: candidate.title || 'Unknown Title',
              text: candidate.abstract || '',
              metadata: {
                pmid: candidate.pmid,
                doi: candidate.doi,
                journal: candidate.journal,
                authors: candidate.authors
              },
              full_text_available: true,
              full_text_sections: candidate.selected_sections?.reduce((acc: Record<string, string>, section: any) => {
                const sectionContent = section.full_content || section.chunks?.map((chunk: any) => chunk.content).join('\n\n') || '';
                if (sectionContent) {
                  acc[section.section_type] = sectionContent;
                }
                return acc;
              }, {} as Record<string, string>)
            };

          const chunks = this.chunkDocument(candidateForChunking);
          chunks.forEach(chunk => {
            chunk.doc_level_score = doc_level_score;
            allChunks.push(chunk);
          });
        }

        console.log(`📄 Created ${allChunks.length} chunks from ${enrichedDocs.length} documents`);

        // Re-rank chunks
        const chunkScores = await this.scoreChunks(query, allChunks);

        // Combine: chunk semantic score + doc-level score + evidence quality
        const finalScores = allChunks.map((chunk, index) => {
          const chunkSemanticScore = chunkScores[index];
          const docScore = chunk.doc_level_score || 0;
          const qualityBoost = this.calculateChunkQualityBoost(chunk);
          // 45% chunk relevance, 35% doc-level score (already includes quality), 20% chunk quality
          const combinedScore = 0.45 * chunkSemanticScore + 0.35 * docScore + 0.20 * qualityBoost;
          return { chunk, score: combinedScore };
        });

        // Sort and take top 10
        const top10Chunks = finalScores
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);

        const stage2Time = Date.now() - stage2Start;
        console.log(`✅ Stage 2 complete: ${top10Chunks.length} chunks in ${stage2Time}ms`);

        // Format for output
        const evidencePack: RankedEvidence[] = top10Chunks.map((item, index) => ({
          rank: index + 1,
          score: item.score,
          source: item.chunk.source,
          id: item.chunk.id,
          title: item.chunk.title,
          text: item.chunk.text,
          metadata: item.chunk.metadata,
          chunk_info: {
            section: item.chunk.section,
            chunk_index: item.chunk.chunk_index
          }
        }));

        const totalLatency = Date.now() - startTime;

        // Set span attributes
        span.setAttribute('agent.output', JSON.stringify({
          evidence_pack: evidencePack.map(e => ({
            rank: e.rank,
            score: e.score,
            source: e.source,
            title: e.title.substring(0, 100)
          }))
        }));
        span.setAttribute('agent.latency_ms', totalLatency);
        span.setAttribute('agent.model_name', this.useHuggingFace ? 'bge-reranker-v2-m3' : 'enhanced-deterministic');
        span.setAttribute('agent.success', true);
        span.setAttribute('reranker.input_docs', candidates.length);
        span.setAttribute('reranker.stage1_docs', top20Docs.length);
        span.setAttribute('reranker.total_chunks', allChunks.length);
        span.setAttribute('reranker.final_chunks', evidencePack.length);
        span.setAttribute('reranker.used_huggingface', this.useHuggingFace);

        console.log(`🎯 Two-stage reranking complete: ${evidencePack.length} final evidence chunks`);
        return evidencePack;

      } catch (error) {
        console.error('❌ Two-stage reranking failed:', error);

        // Fallback: score and sort candidates using quality signals
        const fallbackScored = candidates.map((candidate, index) => {
          const qualityBoost = this.calculateEvidenceQualityBoost(candidate);
          const textScore = this.calculateEnhancedSemanticScore(query,
            `${candidate.title || ''}\n\n${candidate.text || ''}`);
          return {
            candidate,
            score: 0.6 * textScore + 0.4 * qualityBoost
          };
        });

        fallbackScored.sort((a, b) => b.score - a.score);

        const fallbackEvidence: RankedEvidence[] = fallbackScored.slice(0, 10).map((item, index) => ({
          rank: index + 1,
          score: item.score,
          source: item.candidate.source,
          id: item.candidate.id,
          title: item.candidate.title,
          text: item.candidate.text,
          metadata: item.candidate.metadata,
          chunk_info: {
            section: 'abstract',
            chunk_index: 0
          }
        }));

        span.setAttribute('agent.success', false);
        span.setAttribute('agent.error', error instanceof Error ? error.message : 'Unknown error');
        span.setAttribute('agent.latency_ms', Date.now() - startTime);
        span.recordException(error as Error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: error instanceof Error ? error.message : 'Unknown error' });

        return fallbackEvidence;
      }
    });
  }

  // ──────────────────────────────────────────
  // SCORING: Document-level
  // ──────────────────────────────────────────

  private async scoreDocuments(query: string, candidates: EvidenceCandidate[]): Promise<number[]> {
    const texts = candidates.map(c =>
      `${c.title || 'Untitled'}\n\n${(c.text || 'No content available').substring(0, 1500)}`
    );

    // Try HuggingFace BGE first
    if (this.useHuggingFace) {
      const bgeScores = await this.callHuggingFaceBGE(query, texts);
      if (bgeScores) {
        console.log(`   ✅ Document scoring via HuggingFace BGE (${candidates.length} docs)`);
        return bgeScores;
      }
      console.log(`   ⚠️ HuggingFace BGE unavailable, using enhanced local scoring`);
    }

    // Fallback: enhanced deterministic scoring
    return texts.map(text => this.calculateEnhancedSemanticScore(query, text));
  }

  // ──────────────────────────────────────────
  // SCORING: Chunk-level
  // ──────────────────────────────────────────

  private async scoreChunks(query: string, chunks: ChunkForRerank[]): Promise<number[]> {
    const texts = chunks.map(c =>
      `${c.title || ''}\n${c.section || ''}\n\n${c.text || ''}`
    );

    if (this.useHuggingFace) {
      const bgeScores = await this.callHuggingFaceBGE(query, texts);
      if (bgeScores) {
        console.log(`   ✅ Chunk scoring via HuggingFace BGE (${chunks.length} chunks)`);
        return bgeScores;
      }
      console.log(`   ⚠️ HuggingFace BGE unavailable for chunks, using enhanced local scoring`);
    }

    return texts.map(text => this.calculateEnhancedSemanticScore(query, text));
  }

  // ──────────────────────────────────────────
  // HUGGINGFACE BGE RERANKER API
  // ──────────────────────────────────────────

  private async callHuggingFaceBGE(query: string, documents: string[]): Promise<number[] | null> {
    if (!this.hfApiKey || documents.length === 0) return null;

    const BATCH_SIZE = 32;
    const allScores: number[] = [];

    try {
      for (let i = 0; i < documents.length; i += BATCH_SIZE) {
        const batch = documents.slice(i, i + BATCH_SIZE);

        // Format as text pairs for cross-encoder classification
        const pairs = batch.map(doc => ({
          text: query.substring(0, 256),
          text_pair: doc.substring(0, 512)
        }));

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.hfTimeout);

        try {
          const response = await fetch(this.hfModelUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.hfApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ inputs: pairs }),
            signal: controller.signal
          });

          clearTimeout(timeout);

          if (!response.ok) {
            const errorBody = await response.text().catch(() => '');
            // Model loading (503) or removed/moved (404/410) — log and fallback
            if (response.status === 503 || response.status === 404 || response.status === 410) {
              console.warn(`⚠️ HuggingFace model unavailable (${response.status}). Falling back to local scoring.`);
              return null;
            }
            throw new Error(`HuggingFace API ${response.status}: ${errorBody.substring(0, 200)}`);
          }

          const results = await response.json();

          // Parse response — HuggingFace returns different formats depending on model/pipeline
          const scores = this.parseHuggingFaceScores(results, batch.length);
          allScores.push(...scores);

        } catch (batchError: any) {
          clearTimeout(timeout);
          if (batchError.name === 'AbortError') {
            console.warn(`⚠️ HuggingFace BGE timeout (${this.hfTimeout}ms). Falling back to local scoring.`);
            return null;
          }
          throw batchError;
        }
      }

      return allScores;

    } catch (error) {
      console.warn(`⚠️ HuggingFace BGE failed:`, error instanceof Error ? error.message : error);
      return null; // Signal to caller to use fallback
    }
  }

  private parseHuggingFaceScores(results: any, expectedCount: number): number[] {
    // Handle multiple possible response formats from HuggingFace Inference API

    // Format 1: Array of classification results [[{label, score}], ...]
    if (Array.isArray(results) && Array.isArray(results[0])) {
      return results.map((result: any[]) => {
        // For binary classification, take the positive class score
        const positive = result.find((r: any) => r.label === 'LABEL_1');
        if (positive) return positive.score;
        // If single label, apply sigmoid to treat as relevance score
        if (result.length === 1) return this.sigmoid(result[0].score);
        // Default: take highest score
        return Math.max(...result.map((r: any) => r.score));
      });
    }

    // Format 2: Array of single scores [0.8, 0.3, ...]
    if (Array.isArray(results) && typeof results[0] === 'number') {
      return results.map((s: number) => this.sigmoid(s));
    }

    // Format 3: Single classification result [{label, score}]
    if (Array.isArray(results) && results[0]?.label !== undefined) {
      return results.map((r: any) => {
        if (typeof r.score === 'number') return this.sigmoid(r.score);
        return 0.5;
      });
    }

    // Format 4: Object with scores array
    if (results?.scores && Array.isArray(results.scores)) {
      return results.scores.map((s: number) => this.sigmoid(s));
    }

    console.warn('⚠️ Unexpected HuggingFace response format, using defaults');
    return new Array(expectedCount).fill(0.5);
  }

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  // ──────────────────────────────────────────
  // EVIDENCE QUALITY SIGNALS
  // ──────────────────────────────────────────

  private calculateEvidenceQualityBoost(candidate: EvidenceCandidate): number {
    let boost = 0;
    const metadata = candidate.metadata || {};

    // 1. Source type authority (0 – 0.20)
    // CRITICAL FIX: Prioritize PubMed over Tavily - PubMed should always be preferred
    const source = candidate.source || '';
    const sourceBoosts: Record<string, number> = {
      'indian_guideline': 0.20,
      'guideline': 0.18,
      'cochrane': 0.18,
      'nice': 0.16,
      'who': 0.16,
      'cdc': 0.15,
      'bmj': 0.14,
      'dailymed': 0.12,
      'pubmed': 0.15,  // INCREASED from 0.08 to 0.15 - PubMed is primary source
      'europe_pmc': 0.12,  // INCREASED - PMC is also high quality
      'pmc': 0.12,  // INCREASED - PMC full-text is high quality
      'semantic_scholar': 0.06,
      'openalex': 0.06,
      'clinical_trials': 0.10,
      'tavily_web': 0.02,  // DECREASED from 0.03 - Tavily is backup only
    };
    boost += sourceBoosts[source] || 0.05;

    // 2. Study type / publication type (0 – 0.15)
    const pubTypes: string[] = metadata.pub_types || [];
    const pubTypesLower = pubTypes.map((t: string) => t.toLowerCase()).join(' ');
    const textLower = (candidate.text || '').toLowerCase();

    if (pubTypesLower.includes('systematic review') || pubTypesLower.includes('meta-analysis')) {
      boost += 0.15;
    } else if (pubTypesLower.includes('practice guideline') || pubTypesLower.includes('guideline')) {
      boost += 0.14;
    } else if (pubTypesLower.includes('randomized controlled trial') || pubTypesLower.includes('rct')) {
      boost += 0.12;
    } else if (pubTypesLower.includes('clinical trial')) {
      boost += 0.10;
    } else if (pubTypesLower.includes('review')) {
      boost += 0.08;
    } else if (pubTypesLower.includes('cohort') || textLower.includes('cohort study')) {
      boost += 0.06;
    } else if (pubTypesLower.includes('case-control') || textLower.includes('case-control')) {
      boost += 0.05;
    } else if (pubTypesLower.includes('case report') || pubTypesLower.includes('case series')) {
      boost += 0.02;
    }

    // 3. Journal tier (0 – 0.12)
    const journalTier = metadata.journal_tier || '';
    if (journalTier === 'tier_1') {
      boost += 0.12;
    } else if (journalTier === 'specialty_elite') {
      boost += 0.08;
    }

    // 4. Recency (0 – 0.10)
    const year = this.extractPublicationYear(metadata);
    if (year) {
      const currentYear = new Date().getFullYear();
      const age = currentYear - year;
      if (age <= 1) boost += 0.10;
      else if (age <= 2) boost += 0.08;
      else if (age <= 3) boost += 0.06;
      else if (age <= 5) boost += 0.04;
      else if (age <= 10) boost += 0.02;
    }

    // 5. Full text available (0 – 0.03)
    if (candidate.full_text_available || metadata.pmcid) {
      boost += 0.03;
    }

    // Normalize to 0-1 range (max possible boost is ~0.60)
    return Math.min(boost / 0.60, 1.0);
  }

  private calculateChunkQualityBoost(chunk: ChunkForRerank): number {
    let boost = 0;
    const metadata = chunk.metadata || {};

    // Source authority - CRITICAL FIX: Prioritize PubMed over Tavily
    const sourceBoosts: Record<string, number> = {
      'indian_guideline': 0.20, 'guideline': 0.18, 'cochrane': 0.18,
      'nice': 0.16, 'who': 0.16, 'cdc': 0.15, 'bmj': 0.14,
      'dailymed': 0.12, 'pubmed': 0.15, 'europe_pmc': 0.12,  // INCREASED PubMed priority
      'pmc': 0.12, 'clinical_trials': 0.10, 'tavily_web': 0.02,  // DECREASED Tavily priority
    };
    boost += sourceBoosts[chunk.source] || 0.05;

    // Section type relevance
    const sectionBoosts: Record<string, number> = {
      'results': 0.12, 'conclusion': 0.10, 'discussion': 0.08,
      'abstract': 0.06, 'methods': 0.04, 'introduction': 0.02,
    };
    boost += sectionBoosts[chunk.section || ''] || 0.03;

    // Recency from metadata
    const year = this.extractPublicationYear(metadata);
    if (year) {
      const age = new Date().getFullYear() - year;
      if (age <= 2) boost += 0.08;
      else if (age <= 5) boost += 0.04;
    }

    // Journal tier
    if (metadata.journal_tier === 'tier_1') boost += 0.10;
    else if (metadata.journal_tier === 'specialty_elite') boost += 0.06;

    return Math.min(boost / 0.50, 1.0);
  }

  private extractPublicationYear(metadata: any): number | null {
    const fields = ['pub_date', 'year', 'published', 'published_date', 'publicationDate'];
    for (const field of fields) {
      if (metadata[field]) {
        const yearMatch = String(metadata[field]).match(/\d{4}/);
        if (yearMatch) {
          const year = parseInt(yearMatch[0]);
          if (year >= 1990 && year <= new Date().getFullYear() + 1) return year;
        }
      }
    }
    return null;
  }

  // ──────────────────────────────────────────
  // ENHANCED DETERMINISTIC SCORING (fallback)
  // ──────────────────────────────────────────

  private calculateEnhancedSemanticScore(query: string, text: string): number {
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    const queryTerms = this.extractKeywords(queryLower);
    const textTerms = this.extractKeywords(textLower);

    if (queryTerms.length === 0) return 0.1;

    // 1. Exact keyword match score (0 – 0.35)
    let exactMatches = 0;
    for (const term of queryTerms) {
      if (textTerms.includes(term)) exactMatches++;
    }
    const exactScore = (exactMatches / queryTerms.length) * 0.35;

    // 2. Substring / partial match (0 – 0.15)
    let partialMatches = 0;
    for (const qt of queryTerms) {
      if (qt.length < 4) continue;
      for (const tt of textTerms) {
        if (tt.length < 4) continue;
        if (qt !== tt && (qt.includes(tt) || tt.includes(qt))) {
          partialMatches++;
          break;
        }
      }
    }
    const partialScore = (partialMatches / queryTerms.length) * 0.15;

    // 3. Medical synonym match (0 – 0.20) — KEY IMPROVEMENT
    let synonymMatches = 0;
    for (const [term, synonyms] of Object.entries(MEDICAL_SYNONYMS)) {
      const allForms = [term, ...synonyms];
      const queryHas = allForms.some(f => queryLower.includes(f));
      const textHas = allForms.some(f => textLower.includes(f));
      if (queryHas && textHas) {
        synonymMatches++;
      }
    }
    const synonymScore = Math.min(synonymMatches * 0.07, 0.20);

    // 4. Bigram match (0 – 0.15) — catches multi-word medical terms
    const queryBigrams = this.extractBigrams(queryLower);
    const textBigrams = this.extractBigrams(textLower);
    let bigramMatches = 0;
    for (const bg of queryBigrams) {
      if (textBigrams.includes(bg)) bigramMatches++;
    }
    const bigramScore = queryBigrams.length > 0
      ? (bigramMatches / queryBigrams.length) * 0.15
      : 0;

    // 5. Title relevance bonus (0 – 0.10)
    const titleLine = text.split('\n')[0] || '';
    const titleTerms = this.extractKeywords(titleLine.toLowerCase());
    let titleMatches = 0;
    for (const qt of queryTerms) {
      if (titleTerms.some(tt => tt.includes(qt) || qt.includes(tt))) {
        titleMatches++;
      }
    }
    const titleScore = queryTerms.length > 0
      ? (titleMatches / queryTerms.length) * 0.10
      : 0;

    // 6. Content richness bonus (0 – 0.05) — longer, substantive content
    const contentLength = text.length;
    const richnessScore = contentLength > 2000 ? 0.05
      : contentLength > 1000 ? 0.03
        : contentLength > 500 ? 0.02
          : 0.01;

    const finalScore = exactScore + partialScore + synonymScore + bigramScore + titleScore + richnessScore;

    // Clamp to [0.05, 1.0]
    return Math.max(Math.min(finalScore, 1.0), 0.05);
  }

  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
      'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'may', 'might', 'can', 'this', 'that', 'these', 'those', 'it', 'its',
      'not', 'no', 'from', 'as', 'if', 'so', 'than', 'more', 'most', 'also',
      'about', 'between', 'through', 'during', 'before', 'after', 'above',
      'below', 'both', 'each', 'all', 'any', 'few', 'other', 'some', 'such',
      'only', 'own', 'same', 'into', 'over', 'under', 'again', 'then',
      'once', 'here', 'there', 'when', 'where', 'why', 'how', 'what', 'which',
      'who', 'whom', 'being', 'having', 'doing', 'very', 'just', 'because'
    ]);

    return text
      .split(/[\s,;:()\[\]{}]+/)
      .map(word => word.replace(/[^\w\-]/g, '').toLowerCase())
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 30);
  }

  private extractBigrams(text: string): string[] {
    const words = text.split(/\s+/).filter(w => w.length > 2);
    const bigrams: string[] = [];
    for (let i = 0; i < words.length - 1; i++) {
      bigrams.push(`${words[i]} ${words[i + 1]}`);
    }
    return bigrams.slice(0, 40);
  }

  // ──────────────────────────────────────────
  // DOCUMENT CHUNKING
  // ──────────────────────────────────────────

  private chunkDocument(candidate: EvidenceCandidate): ChunkForRerank[] {
    const chunks: ChunkForRerank[] = [];

    // Enhanced article with hierarchical content (from fulltext-fetcher)
    if (candidate.content_chunks && Array.isArray(candidate.content_chunks)) {
      candidate.content_chunks.forEach((contentChunk: any) => {
        chunks.push({
          source: candidate.source,
          id: candidate.id,
          title: candidate.title,
          text: contentChunk.content,
          metadata: {
            ...candidate.metadata,
            parent_article: contentChunk.parent_article,
            child_section: contentChunk.child_section,
            chunk_index: contentChunk.chunk_index,
            relevance_score: contentChunk.relevance_score
          },
          section: contentChunk.child_section,
          chunk_index: contentChunk.chunk_index
        });
      });
    }
      // Legacy: full-text sections
    else if (candidate.full_text_sections) {
      for (const [sectionName, sectionText] of Object.entries(candidate.full_text_sections)) {
        const sectionChunks = this.splitTextIntoChunks(sectionText, 1000, 200);

        sectionChunks.forEach((chunkText, index) => {
          chunks.push({
            source: candidate.source,
            id: candidate.id,
            title: candidate.title,
            text: chunkText,
            metadata: candidate.metadata,
            section: sectionName,
            chunk_index: index
          });
        });
      }
    } else {
      // Abstract/snippet as single chunk
      chunks.push({
        source: candidate.source,
        id: candidate.id,
        title: candidate.title,
        text: candidate.text,
        metadata: candidate.metadata,
        section: 'abstract',
        chunk_index: 0
      });
    }

    return chunks;
  }

  private splitTextIntoChunks(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    let currentChunk = '';
    let currentSize = 0;

    for (const sentence of sentences) {
      const sentenceSize = sentence.length;

      if (currentSize + sentenceSize > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());

        const overlapText = currentChunk.substring(Math.max(0, currentChunk.length - overlap));
        currentChunk = overlapText + sentence;
        currentSize = overlapText.length + sentenceSize;
      } else {
        currentChunk += sentence + '. ';
        currentSize += sentenceSize;
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks.length > 0 ? chunks : [text];
  }
}
