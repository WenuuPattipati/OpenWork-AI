/**
 * Sub-Agent 2.2: PubMed Intelligence
 * Multi-variant PubMed search with MeSH expansion and Medical Source Bible integration
 * ENHANCED: Now uses comprehensive evidence engine + specialty-specific journal filtering
 */

import { TraceContext } from '../types';
import { withRetrieverSpan, SpanStatusCode } from '../../otel';
import { callGeminiWithRetry } from '../../utils/gemini-rate-limiter';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
// EVIDENCE ENGINE INTEGRATION - Dynamic import for performance
// MEDICAL SOURCE BIBLE INTEGRATION - Dynamic import for performance

export interface PubMedSearchResult {
  pmid: string;
  title: string;
  abstract: string;
  authors: string[];
  journal: string;
  pub_date: string;
  pub_types: string[];
  doi?: string;
  pmcid?: string;
  full_text_available: boolean;
  specialty_relevance?: string[];
  journal_tier?: 'tier_1' | 'specialty_elite' | 'standard';
}

export class PubMedIntelligence {
  private apiKey: string;
  private genAI: GoogleGenAI;
  private modelName: string;
  private systemPrompt: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.modelName = 'gemini-3-flash-preview';

    // Initialize Gemini for intelligent query construction
    if (process.env.GEMINI_API_KEY) {
      this.genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } else {
      this.genAI = null as any;
      console.warn('⚠️ GEMINI_API_KEY not set - PubMed Intelligence will use basic queries');
    }

    // Import system prompt
    const { PUBMED_INTELLIGENCE_SYSTEM_PROMPT } = require('../system-prompts/pubmed-intelligence-prompt');
    this.systemPrompt = PUBMED_INTELLIGENCE_SYSTEM_PROMPT;
  }

  /**
   * Map entities to MeSH terms using Gemini 3 Flash (thinking_level: low)
   */
  private async mapToMeSHTerms(entities: { diseases: string[]; drugs: string[]; procedures: string[] }): Promise<string[]> {
    if (!this.genAI || (entities.diseases.length === 0 && entities.drugs.length === 0 && entities.procedures.length === 0)) {
      return [];
    }

    try {
      const prompt = `Map these medical entities to MeSH (Medical Subject Headings) terms for PubMed search. Return only comma-separated MeSH terms.

Diseases: ${entities.diseases.join(', ') || 'none'}
Drugs: ${entities.drugs.join(', ') || 'none'}
Procedures: ${entities.procedures.join(', ') || 'none'}

MeSH terms:`;

      // CRITICAL FIX: Use rate limiter with multi-key support
      const response = await callGeminiWithRetry(async (apiKey: string) => {
        const genAI = new GoogleGenAI({ apiKey });
        return await genAI.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config: {
            systemInstruction: 'You are a medical terminology specialist. Map medical terms to official MeSH headings.',
            temperature: 0.1,
            maxOutputTokens: 200,
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.LOW // Straightforward MeSH mapping
            }
          }
        });
      });

      const meshTerms = response.text?.trim().split(',').map((t: string) => t.trim()).filter(Boolean) || [];
      console.log(`   🏷️ Mapped to ${meshTerms.length} MeSH terms`);
      return meshTerms;
    } catch (error) {
      console.warn('⚠️ MeSH mapping failed, using entity names:', error);
      return [...entities.diseases, ...entities.drugs, ...entities.procedures];
    }
  }

  /**
   * Construct optimized PubMed query using Gemini 3 Flash (thinking_level: minimal)
   */
  private async constructOptimizedQuery(searchVariant: string, meshTerms: string[]): Promise<string> {
    if (!this.genAI) {
      return searchVariant;
    }

    try {
      const prompt = `Create an optimized PubMed search query using this variant and MeSH terms. Keep it concise and use PubMed syntax.

Variant: ${searchVariant}
MeSH terms: ${meshTerms.join(', ')}

Optimized PubMed query:`;

      // CRITICAL FIX: Use rate limiter with multi-key support
      const response = await callGeminiWithRetry(async (apiKey: string) => {
        const genAI = new GoogleGenAI({ apiKey });
        return await genAI.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config: {
            systemInstruction: 'You are a PubMed search expert. Create efficient search queries using MeSH terms and Boolean operators.',
            temperature: 0.1,
            maxOutputTokens: 150,
            thinkingConfig: {
              thinkingLevel: 'include_thoughts' as any // Use include_thoughts as minimal is not available
            }
          }
        });
      });

      const optimizedQuery = response.text?.trim() || searchVariant;
      console.log(`   🔧 Optimized query: "${optimizedQuery.substring(0, 100)}..."`);
      return optimizedQuery;
    } catch (error) {
      console.warn('⚠️ Query optimization failed, using original:', error);
      return searchVariant;
    }
  }

  async search(
    searchVariants: string[],
    entities: { diseases: string[]; drugs: string[]; procedures: string[] },
    traceContext: TraceContext,
    originalQuery?: string
  ): Promise<PubMedSearchResult[]> {
    return await withRetrieverSpan('pubmed_intelligence', async (span) => {
      const startTime = Date.now();

      // Set retrieval attributes
      span.setAttribute('retrieval.source', 'pubmed_intelligence');
      span.setAttribute('retrieval.query', searchVariants.join(' | '));

    try {
      console.log(`🔬 PubMed Intelligence: Enhanced search with Medical Source Bible integration`);
      // #region debug log
      fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'pubmed-intelligence.ts:142', message: 'PubMed search starting', data: { subAgent: 'pubmed', variants: searchVariants.length, entities: entities.diseases.length + entities.drugs.length + entities.procedures.length, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => { });
      // #endregion

      // STEP 1: Map entities to MeSH terms using Gemini 3 Flash
      const meshTerms = await this.mapToMeSHTerms(entities);
      // #region debug log
      fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'pubmed-intelligence.ts:146', message: 'MeSH terms mapped', data: { subAgent: 'pubmed', meshTermCount: meshTerms.length, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => { });
      // #endregion

      // STEP 2: Route query to medical specialties using Medical Source Bible (dynamic import)
      let relevantSpecialties: string[] = [];
      let relevantGuidelineBodies: string[] = [];
      let eliteJournalFilter = '';
      let TIER_1_GENERAL_JOURNALS_DATA: any = null;
      let MEDICAL_SPECIALTIES_DATA: any[] = [];

      if (originalQuery) {
        try {
          const medicalSourceBible = await import('../../medical-source-bible');
          relevantSpecialties = medicalSourceBible.routeQueryToSpecialties(originalQuery);
          TIER_1_GENERAL_JOURNALS_DATA = medicalSourceBible.TIER_1_GENERAL_JOURNALS;
          MEDICAL_SPECIALTIES_DATA = medicalSourceBible.MEDICAL_SPECIALTIES;

          // Get specialty-specific journal filters AND guideline organizations
          if (relevantSpecialties.length > 0) {
            eliteJournalFilter = medicalSourceBible.getPubMedEliteFilter(relevantSpecialties);

            // Extract guideline organizations for identified specialties
            relevantSpecialties.forEach(specId => {
              const specData = MEDICAL_SPECIALTIES_DATA.find((s: any) => s.id === specId);
              if (specData && specData.guideline_organizations) {
                specData.guideline_organizations.forEach((org: any) => {
                  if (org.abbreviation) {
                    // Handle combined abbreviations like "AHA/ACC"
                    const parts = org.abbreviation.split('/');
                    parts.forEach((p: string) => relevantGuidelineBodies.push(p.trim()));
                  }
                });
              }
            });
          } else {
            eliteJournalFilter = TIER_1_GENERAL_JOURNALS_DATA.pubmed_combined_filter;
          }

        } catch (error) {
          console.warn('Medical source bible import failed, using basic search:', error);
          relevantSpecialties = [];
          eliteJournalFilter = '';
        }
      }

      // De-duplicate guideline bodies
      const uniqueGuidelineBodies: string[] = [...new Set(relevantGuidelineBodies)];

      console.log(`📋 Detected specialties: ${relevantSpecialties.join(', ') || 'general'}`);
      console.log(`🎯 Using elite journal filter for specialties: ${relevantSpecialties.join(', ')}`);
      if (uniqueGuidelineBodies.length > 0) {
        console.log(`🏛️  Targeting guideline organizations: ${uniqueGuidelineBodies.join(', ')}`);
      }

      // STEP 3: Use comprehensive evidence engine for each search variant with optimized queries
      const allResults: any[] = [];

      for (const variant of searchVariants) {
        try {
          // CRITICAL FIX: Try optimization, but if it fails or takes too long, use raw variant
          let optimizedVariant = variant;
          try {
            const optimizationStart = Date.now();
            optimizedVariant = await Promise.race([
              this.constructOptimizedQuery(variant, meshTerms),
              new Promise<string>((resolve) => setTimeout(() => resolve(variant), 5000)) // 5s timeout for optimization
            ]);
            if (Date.now() - optimizationStart > 5000) {
              console.warn(`⚠️ Query optimization timed out, using raw variant`);
              optimizedVariant = variant;
            }
          } catch (optError) {
            console.warn(`⚠️ Query optimization failed, using raw variant:`, optError);
            optimizedVariant = variant;
          }

          // Use evidence engine's comprehensive PubMed search (dynamic import)
          let result;
          try {
            console.log(`🔬 PubMed Intelligence: Calling comprehensivePubMedSearch`);
            console.log(`   Original variant: "${variant.substring(0, 100)}..."`);
            console.log(`   Using query: "${optimizedVariant.substring(0, 150)}..."`);
            // #region debug log
            fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'pubmed-intelligence.ts:186', message: 'Calling comprehensivePubMedSearch', data: { subAgent: 'pubmed', variant: optimizedVariant.substring(0, 100), timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => { });
            // #endregion
            const { comprehensivePubMedSearch } = await import('../../evidence/pubmed');
            const searchStartTime = Date.now();

            // Determine if this looks like a guideline query to enable specific organization searches
            const isGuidelineRelated =
              uniqueGuidelineBodies.length > 0 ||
              variant.toLowerCase().includes('guideline') ||
              variant.toLowerCase().includes('recommendation');

            result = await comprehensivePubMedSearch(
              optimizedVariant,
              isGuidelineRelated, // Dynamic check
              uniqueGuidelineBodies, // Pass identified organizations
              eliteJournalFilter // CRITICAL: Apply journal filter
            );
            const searchElapsed = Date.now() - searchStartTime;
            console.log(`✅ PubMed comprehensive search completed in ${searchElapsed}ms: ${result.articles?.length || 0} articles, ${result.systematicReviews?.length || 0} reviews, ${result.guidelines?.length || 0} guidelines`);
            // #region debug log
            fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'pubmed-intelligence.ts:194', message: 'comprehensivePubMedSearch completed', data: { subAgent: 'pubmed', articles: result.articles.length, systematicReviews: result.systematicReviews.length, guidelines: result.guidelines.length, elapsed: searchElapsed, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => { });
            // #endregion
          } catch (importError) {
            // #region debug log
            fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'pubmed-intelligence.ts:197', message: 'PubMed search import failed', data: { subAgent: 'pubmed', error: importError instanceof Error ? importError.message : 'Unknown', timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => { });
            // #endregion
            // #region debug log
            fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'pubmed-intelligence.ts:217', message: 'PubMed search import failed', data: { subAgent: 'pubmed', error: importError instanceof Error ? importError.message : 'Unknown', timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => { });
            // #endregion
            console.error('❌ PubMed search import failed:', importError);
            result = { articles: [], systematicReviews: [], guidelines: [] };
          }

          // Combine all result types
          const totalResults = (result.articles?.length || 0) + (result.systematicReviews?.length || 0) + (result.guidelines?.length || 0);
          // #region debug log
          fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'pubmed-intelligence.ts:198', message: 'PubMed results received from engine', data: { subAgent: 'pubmed', variant: optimizedVariant.substring(0, 50), articles: result.articles?.length || 0, reviews: result.systematicReviews?.length || 0, guidelines: result.guidelines?.length || 0, total: totalResults, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => { });
          // #endregion

          if (totalResults === 0) {
            console.warn(`⚠️ PubMed optimized query returned 0 results, retrying with raw variant (evidence engine)...`);
            try {
              const { comprehensivePubMedSearch } = await import('../../evidence/pubmed');
              const fallbackResult = await comprehensivePubMedSearch(
                variant.trim(),
                false,
                []
              );
              const fallbackTotal = (fallbackResult.articles?.length || 0) + (fallbackResult.systematicReviews?.length || 0) + (fallbackResult.guidelines?.length || 0);
              if (fallbackTotal > 0) {
                console.log(`   ✅ Fallback raw query returned ${fallbackTotal} results`);
                allResults.push(...(fallbackResult.articles || []));
                allResults.push(...(fallbackResult.systematicReviews || []));
                allResults.push(...(fallbackResult.guidelines || []));
              } else {
                allResults.push(...result.articles);
                allResults.push(...result.systematicReviews);
                allResults.push(...result.guidelines);
              }
            } catch (fallbackErr) {
              console.warn('Fallback PubMed search failed:', fallbackErr);
              allResults.push(...result.articles);
              allResults.push(...result.systematicReviews);
              allResults.push(...result.guidelines);
            }
          } else {
            allResults.push(...result.articles);
            allResults.push(...result.systematicReviews);
            allResults.push(...result.guidelines);
          }

        } catch (error) {
          // #region debug log
          fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'pubmed-intelligence.ts:203', message: 'PubMed variant search failed', data: { subAgent: 'pubmed', variant: variant.substring(0, 50), error: error instanceof Error ? error.message : 'Unknown', timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => { });
          // #endregion
          console.error(`❌ Search variant failed: ${variant}`, error);
        }
      }

      // #region debug log
      fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'pubmed-intelligence.ts:207', message: 'PubMed allResults collected', data: { subAgent: 'pubmed', totalResults: allResults.length, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => { });
      // #endregion

      // STEP 4: Enhance results with Medical Source Bible metadata
      const enhancedResults = this.enhanceWithSourceBible(allResults, relevantSpecialties, TIER_1_GENERAL_JOURNALS_DATA, MEDICAL_SPECIALTIES_DATA);

      // STEP 5: Apply intelligent filtering and ranking
      const filteredResults = this.applyIntelligentFiltering(enhancedResults, relevantSpecialties);
      
      // #region debug log
      fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'pubmed-intelligence.ts:214', message: 'PubMed filtering complete', data: { subAgent: 'pubmed', beforeFiltering: enhancedResults.length, afterFiltering: filteredResults.length, tier1: filteredResults.filter(r => r.journal_tier === 'tier_1').length, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => { });
      // #endregion

      if (filteredResults.length === 0 && allResults.length > 0) {
        console.warn(`⚠️ PubMed filtering removed ALL ${allResults.length} results - this may cause over-reliance on Tavily`);
      }
      // #region debug log
      fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'pubmed-intelligence.ts:211', message: 'PubMed filtering completed', data: { subAgent: 'pubmed', totalResults: allResults.length, filteredResults: filteredResults.length, tier1: filteredResults.filter(r => r.journal_tier === 'tier_1').length, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => { });
      // #endregion

      const latency = Date.now() - startTime;

      // Set span attributes
      span.setAttribute('retrieval.result_count', filteredResults.length);
      span.setAttribute('retrieval.latency_ms', latency);
      span.setAttribute('retrieval.variants_searched', searchVariants.length);
      span.setAttribute('retrieval.specialties_detected', JSON.stringify(relevantSpecialties));
      span.setAttribute('retrieval.total_results', allResults.length);
      span.setAttribute('retrieval.after_filtering', filteredResults.length);
      span.setAttribute('retrieval.tier_1_journals', filteredResults.filter(r => r.journal_tier === 'tier_1').length);
      span.setAttribute('retrieval.specialty_elite', filteredResults.filter(r => r.journal_tier === 'specialty_elite').length);
      span.setAttribute('retrieval.pmc_available', filteredResults.filter(r => r.pmcid).length);

      console.log(`✅ PubMed Intelligence: ${filteredResults.length} articles (${filteredResults.filter(r => r.journal_tier === 'tier_1').length} Tier 1, ${filteredResults.filter(r => r.journal_tier === 'specialty_elite').length} Specialty Elite)`);

      // Convert to documents format for span events
      const documents = filteredResults.map(r => ({
        id: r.pmid,
        content: r.abstract || r.title,
        score: 1.0, // PubMed doesn't have similarity scores
        metadata: {
          title: r.title,
          journal: r.journal,
          pub_date: r.pub_date,
          journal_tier: r.journal_tier,
          pmcid: r.pmcid,
          doi: r.doi
        }
      }));

      return { result: filteredResults, documents };

    } catch (error) {
      console.error('❌ PubMed Intelligence failed:', error);
      // #region debug log
      fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'pubmed-intelligence.ts:246', message: 'PubMed Intelligence error', data: { subAgent: 'pubmed', error: error instanceof Error ? error.message : 'Unknown', stack: error instanceof Error ? error.stack : '', elapsed: Date.now() - startTime, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => { });
      // #endregion

      // Set error attributes
      span.setAttribute('retrieval.result_count', 0);
      span.setAttribute('retrieval.latency_ms', Date.now() - startTime);
      span.setAttribute('retrieval.error', error instanceof Error ? error.message : 'Unknown error');
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error instanceof Error ? error.message : 'Unknown error' });

      // CRITICAL: Return empty results instead of throwing - don't break the pipeline
      // This allows other sources (like Tavily) to still work, but we log the failure
      console.warn('⚠️ PubMed search failed - this will cause over-reliance on Tavily. Returning empty results.');
      return { result: [], documents: [] };
    }
    }, { source: 'pubmed_intelligence' });
  }

  private enhanceWithSourceBible(results: any[], specialties: string[], tier1Data: any, specialtiesData: any[]): PubMedSearchResult[] {
    return results.map(article => {
      const journal = article.journal || '';
      let journalTier: 'tier_1' | 'specialty_elite' | 'standard' = 'standard';

      // Check if it's a Tier 1 general journal
      const isTier1 = tier1Data?.journals?.some((j: any) =>
        journal.toLowerCase().includes(j.abbreviation.toLowerCase()) ||
        journal.toLowerCase().includes(j.name.toLowerCase())
      ) || false;

      if (isTier1) {
        journalTier = 'tier_1';
      } else {
        // Check if it's a specialty elite journal
        for (const specialtyId of specialties) {
          const specialty = specialtiesData.find((s: any) => s.id === specialtyId);
          if (specialty) {
            const isSpecialtyElite = specialty.top_journals?.some((j: any) =>
              journal.toLowerCase().includes(j.abbreviation.toLowerCase()) ||
              journal.toLowerCase().includes(j.name.toLowerCase())
            );
            if (isSpecialtyElite) {
              journalTier = 'specialty_elite';
              break;
            }
          }
        }
      }

      return {
        pmid: article.pmid || article.id,
        title: article.title,
        abstract: article.abstract || '',
        authors: Array.isArray(article.authors) ? article.authors :
                 typeof article.authors === 'string' ? [article.authors] : [],
        journal: journal,
        pub_date: article.pub_date || article.publicationDate || '',
        pub_types: article.pub_types || article.publicationTypes || [],
        doi: article.doi,
        pmcid: article.pmcid,
        full_text_available: !!article.pmcid,
        specialty_relevance: specialties,
        journal_tier: journalTier
      };
    });
  }

  private applyIntelligentFiltering(results: PubMedSearchResult[], specialties: string[]): PubMedSearchResult[] {
    // Sort by journal tier and recency
    const sorted = results.sort((a, b) => {
      // First priority: Journal tier
      const tierPriority = { 'tier_1': 3, 'specialty_elite': 2, 'standard': 1 };
      const tierDiff = tierPriority[b.journal_tier || 'standard'] - tierPriority[a.journal_tier || 'standard'];
      if (tierDiff !== 0) return tierDiff;

      // Second priority: Publication date (more recent first)
      const dateA = new Date(a.pub_date || '1900-01-01').getTime();
      const dateB = new Date(b.pub_date || '1900-01-01').getTime();
      return dateB - dateA;
    });

    // Apply intelligent limits based on journal tiers
    const tier1Articles = sorted.filter(r => r.journal_tier === 'tier_1').slice(0, 15);
    const specialtyEliteArticles = sorted.filter(r => r.journal_tier === 'specialty_elite').slice(0, 20);
    const standardArticles = sorted.filter(r => r.journal_tier === 'standard').slice(0, 15);

    // Combine and deduplicate
    const combined = [...tier1Articles, ...specialtyEliteArticles, ...standardArticles];
    const seen = new Set<string>();
    const deduped = combined.filter(article => {
      if (seen.has(article.pmid)) return false;
      seen.add(article.pmid);
      return true;
    });

    return deduped.slice(0, 50); // Final limit
  }
}
