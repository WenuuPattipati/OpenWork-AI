/**
 * Sub-Agent 2.4: DailyMed Retriever
 * Fetches FDA drug labels (SPL format)
 * ENHANCED: Now uses comprehensive evidence engine + Medical Source Bible drug routing
 */

import { TraceContext } from '../types';
import { withRetrieverSpan, SpanStatusCode } from '../../otel';
import { DAILYMED_RETRIEVER_SYSTEM_PROMPT } from '../system-prompts/dailymed-retriever-prompt';
import { callGeminiWithRetry } from '../../utils/gemini-rate-limiter';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

export class DailyMedRetriever {
  private systemPrompt: string;
  private genAI: any;
  private modelName: string;

  constructor() {
    this.modelName = 'gemini-3-flash-preview';

    // Initialize Gemini for intelligent drug processing
    if (process.env.GEMINI_API_KEY) {
      const { GoogleGenAI } = require('@google/genai');
      this.genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } else {
      this.genAI = null;
      console.warn('⚠️ GEMINI_API_KEY not set - DailyMed will use basic drug name processing');
    }

    // Set system prompt
    this.systemPrompt = DAILYMED_RETRIEVER_SYSTEM_PROMPT;
  }

  /**
   * Normalize drug names using Gemini 3 Flash (thinking_level: minimal)
   */
  private async normalizeDrugNames(drugNames: string[]): Promise<string[]> {
    if (!this.genAI || drugNames.length === 0) {
      return drugNames;
    }

    try {
      const prompt = `Normalize these drug names by removing formulation suffixes (XR, ER, SR, etc.) and expanding abbreviations. Return comma-separated generic names.

Drug names: ${drugNames.join(', ')}

Normalized names:`;

      // CRITICAL FIX: Use rate limiter with multi-key support
      const response = await callGeminiWithRetry(async (apiKey: string) => {
        const genAI = new GoogleGenAI({ apiKey });
        return await genAI.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config: {
            systemInstruction: 'You are a pharmaceutical terminology specialist. Normalize drug names to generic forms.',
            temperature: 0.1,
            maxOutputTokens: 150,
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.MINIMAL // Fast drug name normalization
            }
          }
        });
      });

      const normalized = response.text?.trim().split(',').map((d: string) => d.trim()).filter(Boolean) || drugNames;
      console.log(`   💊 Normalized ${drugNames.length} drug names`);
      return normalized;
    } catch (error) {
      console.warn('⚠️ Drug name normalization failed, using original:', error);
      return drugNames;
    }
  }

  /**
   * Prioritize drug label sections using Gemini 3 Flash (thinking_level: low)
   */
  private async prioritizeSections(drugs: any[], originalQuery?: string): Promise<any[]> {
    if (!this.genAI || drugs.length === 0 || !originalQuery) {
      return drugs;
    }

    try {
      // For large result sets, use LLM to identify most relevant drugs
      if (drugs.length > 15) {
        const drugsPreview = drugs.slice(0, 20).map((d, idx) =>
          `[${idx}] ${d.drug_name} - ${d.title.substring(0, 80)}`
        ).join('\n');

        const prompt = `Given this medical query and drug labels, identify the indices of the 12 most relevant drugs. Return only comma-separated indices (e.g., "0,2,5,7,9,11,13,15,17,19,20,21").

Query: ${originalQuery}

Drugs:
${drugsPreview}

Top 12 indices:`;

        // CRITICAL FIX: Use rate limiter with multi-key support
        const response = await callGeminiWithRetry(async (apiKey: string) => {
          const genAI = new GoogleGenAI({ apiKey });
          return await genAI.models.generateContent({
            model: this.modelName,
            contents: prompt,
            config: {
              systemInstruction: 'You are a pharmaceutical relevance specialist. Select the most relevant drug labels based on the query.',
              temperature: 0.1,
              maxOutputTokens: 50,
              thinkingConfig: {
                thinkingLevel: ThinkingLevel.LOW // Straightforward prioritization
              }
            }
          });
        });

        const indicesText = response.text?.trim() || '';
        const indices = indicesText.split(',').map((s: string) => parseInt(s.trim())).filter((n: number) => !isNaN(n) && n < drugs.length);

        if (indices.length > 0) {
          const prioritized = indices.map((i: number) => drugs[i]).filter(Boolean);
          console.log(`   🎯 LLM prioritized ${prioritized.length} drug labels`);
          return prioritized;
        }
      }

      return drugs;
    } catch (error) {
      console.warn('⚠️ LLM prioritization failed, using default ordering:', error);
      return drugs;
    }
  }

  async search(
    drugNames: string[],
    traceContext: TraceContext,
    originalQuery?: string
  ): Promise<DailyMedSearchResult[]> {
    return await withRetrieverSpan('dailymed', async (span) => {
      const startTime = Date.now();

      // Set retrieval attributes
      span.setAttribute('retrieval.source', 'dailymed');
      span.setAttribute('retrieval.query', drugNames.join(', '));

    try {
      console.log(`💊 DailyMed Retriever: Enhanced search with Medical Source Bible integration`);

      // STEP 1: Normalize drug names using Gemini 3 Flash
      const normalizedDrugNames = await this.normalizeDrugNames(drugNames);

      // STEP 2: Route query to medical specialties for drug context (dynamic import)
      let relevantSpecialties: string[] = [];
      if (originalQuery) {
        try {
          const { routeQueryToSpecialties } = await import('../../medical-source-bible');
          relevantSpecialties = routeQueryToSpecialties(originalQuery);
        } catch (error) {
          console.warn('Medical source bible import failed:', error);
          relevantSpecialties = [];
        }
      }
      console.log(`📋 Drug context specialties: ${relevantSpecialties.join(', ') || 'general'}`);

      // STEP 3: Use comprehensive evidence engine for drug search (dynamic import)
      const searchQuery = normalizedDrugNames.join(' OR ');
      let result;
      try {
        const { comprehensiveDailyMedSearch } = await import('../../evidence/dailymed');
        result = await comprehensiveDailyMedSearch(searchQuery);
      } catch (error) {
        console.warn('DailyMed search failed:', error);
        result = { allDrugs: [] };
      }

      // STEP 4: Enhance results with Medical Source Bible metadata
      const enhancedResults = this.enhanceWithSourceBible(result.drugs || [], relevantSpecialties, normalizedDrugNames);

      // STEP 5: Apply intelligent prioritization using Gemini 3 Flash
      const prioritizedResults = await this.prioritizeSections(enhancedResults, originalQuery);

      // STEP 6: Apply final filtering
      const filteredResults = this.applyDrugFiltering(prioritizedResults);

      const latency = Date.now() - startTime;

      // Set span attributes
      span.setAttribute('retrieval.result_count', filteredResults.length);
      span.setAttribute('retrieval.latency_ms', latency);
      span.setAttribute('retrieval.drugs_searched', drugNames.length);
      span.setAttribute('retrieval.specialties_detected', JSON.stringify(relevantSpecialties));
      span.setAttribute('retrieval.total_results', result.drugs?.length || 0);
      span.setAttribute('retrieval.after_filtering', filteredResults.length);
      span.setAttribute('retrieval.recent_updates', filteredResults.filter(r => r.is_recent_update).length);
      span.setAttribute('retrieval.labels_found', filteredResults.length);

      console.log(`✅ DailyMed Retriever: ${filteredResults.length} drug labels (${filteredResults.filter(r => r.is_recent_update).length} recent updates)`);

      // Convert to documents format for span events
      const documents = filteredResults.map(r => ({
        id: r.setid,
        content: r.title + ' ' + Object.values(r.sections).join(' '),
        score: 1.0,
        metadata: {
          drug_name: r.drug_name,
          title: r.title,
          published: r.published,
          specialty_relevance: r.specialty_relevance,
          is_recent_update: r.is_recent_update
        }
      }));

      return { result: filteredResults, documents };

    } catch (error) {
      console.error('❌ DailyMed Retriever failed:', error);

      // Set error attributes
      span.setAttribute('retrieval.result_count', 0);
      span.setAttribute('retrieval.latency_ms', Date.now() - startTime);
      span.setAttribute('retrieval.error', error instanceof Error ? error.message : 'Unknown error');
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error instanceof Error ? error.message : 'Unknown error' });

      return { result: [], documents: [] };
      }
    }, { source: 'dailymed' });
  }

  private enhanceWithSourceBible(drugs: any[], specialties: string[], searchedDrugs: string[]): DailyMedSearchResult[] {
    return drugs.map(drug => {
      // Check if this is a recent update (2023+)
      const pubYear = new Date(drug.publishedDate || '2000-01-01').getFullYear();
      const currentYear = new Date().getFullYear();
      const isRecentUpdate = pubYear >= currentYear - 2; // 2023+ if current year is 2025

      // Extract sections from the drug object
      const sections: Record<string, string> = {};

      if (drug.indications) sections.indications = drug.indications;
      if (drug.contraindications) sections.contraindications = drug.contraindications;
      if (drug.warnings) sections.warnings = drug.warnings;
      if (drug.dosage) sections.dosage = drug.dosage;
      if (drug.adverseReactions) sections.adverse_reactions = drug.adverseReactions;
      if (drug.drugInteractions) sections.drug_interactions = drug.drugInteractions;
      if (drug.clinicalPharmacology) sections.clinical_pharmacology = drug.clinicalPharmacology;
      if (drug.howSupplied) sections.how_supplied = drug.howSupplied;

      return {
        setid: drug.setId,
        drug_name: drug.genericName || drug.brandName || searchedDrugs[0] || 'Unknown',
        title: drug.title,
        published: drug.publishedDate,
        sections,
        specialty_relevance: specialties,
        is_recent_update: isRecentUpdate
      };
    });
  }

  private applyDrugFiltering(results: DailyMedSearchResult[]): DailyMedSearchResult[] {
    // Sort by recency and completeness
    const sorted = results.sort((a, b) => {
      // First priority: Recent updates
      if (a.is_recent_update && !b.is_recent_update) return -1;
      if (!a.is_recent_update && b.is_recent_update) return 1;

      // Second priority: Number of sections (more complete information)
      const sectionsA = Object.keys(a.sections).length;
      const sectionsB = Object.keys(b.sections).length;
      if (sectionsA !== sectionsB) return sectionsB - sectionsA;

      // Third priority: Publication date (more recent first)
      const dateA = new Date(a.published || '1900-01-01').getTime();
      const dateB = new Date(b.published || '1900-01-01').getTime();
      return dateB - dateA;
    });

    // Apply limits: prioritize recent updates and complete information
    const recentUpdates = sorted.filter(r => r.is_recent_update).slice(0, 8);
    const olderLabels = sorted.filter(r => !r.is_recent_update).slice(0, 4);

    // Combine and deduplicate by setid
    const combined = [...recentUpdates, ...olderLabels];
    const seen = new Set<string>();
    const deduped = combined.filter(drug => {
      if (seen.has(drug.setid)) return false;
      seen.add(drug.setid);
      return true;
    });

    return deduped.slice(0, 12); // Final limit
  }
}

// EVIDENCE ENGINE INTEGRATION - Dynamic import for performance
// MEDICAL SOURCE BIBLE INTEGRATION - Dynamic import for performance

export interface DailyMedSearchResult {
  setid: string;
  drug_name: string;
  title: string;
  published: string;
  sections: Record<string, string>;
  specialty_relevance?: string[];
  is_recent_update?: boolean;
}
