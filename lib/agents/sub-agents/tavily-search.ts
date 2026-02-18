/**
 * Sub-Agent 2.5: Tavily Smart Search
 * Searches recent web content when evidence gaps detected
 * ENHANCED: Now uses Medical Source Bible for specialty-specific domain targeting
 */

import { TraceContext } from '../types';
import { withRetrieverSpan, SpanStatusCode } from '../../otel';
import { TAVILY_SEARCH_SYSTEM_PROMPT } from '../system-prompts/tavily-search-prompt';
import { callGeminiWithRetry } from '../../utils/gemini-rate-limiter';
// MEDICAL SOURCE BIBLE INTEGRATION - Dynamic import for performance

export interface TavilySearchResult {
  url: string;
  title: string;
  content: string;
  score: number;
  published_date?: string;
  specialty_relevance?: string[];
  source_type?: 'guideline_org' | 'journal' | 'government' | 'medical_institution';
}

export class TavilySmartSearch {
  private apiKey: string;
  private systemPrompt: string;
  private genAI: any;
  private modelName: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.modelName = 'gemini-3-flash-preview';
    this.genAI = null; // DISABLED: Pure Tavily search for speed

    // Import system prompt
    const { TAVILY_SEARCH_SYSTEM_PROMPT } = require('../system-prompts/tavily-search-prompt');
    this.systemPrompt = TAVILY_SEARCH_SYSTEM_PROMPT;
  }

  /**
   * Enhance query for web search using rule-based logic (FAST)
   * Removed LLM call to save time
   */
  private async enhanceQuery(query: string, specialties: string[]): Promise<string> {
    // Pure rule-based enhancement
    let enhanced = query;
    if (specialties.length > 0) {
      enhanced += ` ${specialties.slice(0, 2).join(' ')}`;
    }

    // Add medical context if not present
    if (!enhanced.toLowerCase().includes('medical') && !enhanced.toLowerCase().includes('clinical')) {
      enhanced += ' medical clinical';
    }

    return enhanced;
  }

  /**
   * Classify source type using rule-based URL patterns (FAST)
   * Removed LLM call to save time and dependencies
   */
  private async classifySourcesBatch(results: any[]): Promise<Map<string, 'guideline_org' | 'journal' | 'government' | 'medical_institution'>> {
    const classifications = new Map<string, 'guideline_org' | 'journal' | 'government' | 'medical_institution'>();

    results.forEach(result => {
      classifications.set(result.url, this.classifySourceBasic(result.url, result.title));
    });

    return classifications;
  }

  /**
   * Basic URL and Title-based source classification
   */
  private classifySourceBasic(url: string, title: string = ''): 'guideline_org' | 'journal' | 'government' | 'medical_institution' {
    const urlLower = url.toLowerCase();
    const titleLower = title.toLowerCase();

    // Guidelines (Explicit High Priority)
    if (titleLower.includes('guideline') || titleLower.includes('recommendation') || titleLower.includes('consensus') || titleLower.includes('standards')) {
      if (urlLower.includes('.org') || urlLower.includes('.gov')) return 'guideline_org';
    }

    // Government sources
    if (urlLower.includes('cdc.gov') || urlLower.includes('who.int') ||
      urlLower.includes('nih.gov') || urlLower.includes('fda.gov') ||
      urlLower.includes('nice.org.uk') || urlLower.includes('nhs.uk')) {
      return 'government';
    }

    // Medical journals
    if (urlLower.includes('nejm.org') || urlLower.includes('thelancet.com') ||
      urlLower.includes('jamanetwork.com') || urlLower.includes('bmj.com') ||
      urlLower.includes('nature.com') || urlLower.includes('pubmed') ||
      urlLower.includes('ncbi.nlm.nih.gov')) {
      return 'journal';
    }

    // Medical institutions
    if (urlLower.includes('mayoclinic.org') || urlLower.includes('clevelandclinic.org') ||
      urlLower.includes('hopkinsmedicine.org') || urlLower.includes('mskcc.org')) {
      return 'medical_institution';
    }

    return 'medical_institution'; // Default
  }

  async search(
    query: string,
    existingUrls: Set<string>,
    traceContext: TraceContext,
    originalQuery?: string
  ): Promise<TavilySearchResult[]> {
    return await withRetrieverSpan('tavily', async (span) => {
      const startTime = Date.now();

      // Set retrieval attributes
      span.setAttribute('retrieval.source', 'tavily');
      span.setAttribute('retrieval.query', query);

    if (!this.apiKey) {
      console.log('⚠️ Tavily API key not configured, skipping web search');
      span.setAttribute('retrieval.result_count', 0);
      span.setAttribute('retrieval.latency_ms', Date.now() - startTime);
      return { result: [], documents: [] };
    }

    try {
      console.log(`🌐 Tavily Smart Search: Enhanced with Medical Source Bible domain targeting`);

      // STEP 1: Route query to medical specialties using Medical Source Bible (dynamic import)
      let relevantSpecialties: string[] = [];
      let targetDomains: string[] = [];
      let enhancedQuery = query;

      if (originalQuery) {
        try {
          const medicalSourceBible = await import('../../medical-source-bible');
          relevantSpecialties = medicalSourceBible.routeQueryToSpecialties(originalQuery);

      // STEP 2: Get specialty-specific domains from Medical Source Bible
          targetDomains = relevantSpecialties.length > 0
            ? medicalSourceBible.getTavilyDomains(relevantSpecialties)
            : this.getGeneralMedicalDomains();

          // STEP 3: Enhance query using Gemini 3 Flash
          enhancedQuery = await this.enhanceQuery(query, relevantSpecialties);
        } catch (error) {
          console.warn('Medical source bible import failed, using basic search:', error);
          targetDomains = this.getGeneralMedicalDomains();
          enhancedQuery = await this.enhanceQuery(query, []);
        }
      } else {
        targetDomains = this.getGeneralMedicalDomains();
        enhancedQuery = await this.enhanceQuery(query, []);
      }

      console.log(`📋 Detected specialties for domain targeting: ${relevantSpecialties.join(', ') || 'general'}`);
      console.log(`🎯 Targeting ${targetDomains.length} specialty domains`);

      // Truncate query if too long to avoid Tavily API 400 errors
      if (enhancedQuery.length > 420) {
        console.log(`⚠️ Query too long (${enhancedQuery.length} chars), smart truncating to 420 chars`);
        enhancedQuery = this.smartTruncate(enhancedQuery, 420);
      }

      // STEP 4: Execute Tavily search with specialty domains
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          query: enhancedQuery,
          search_depth: 'advanced',
          max_results: 15,
          include_domains: targetDomains,
          exclude_domains: [
            'wikipedia.org', 'reddit.com', 'quora.com',
            'facebook.com', 'twitter.com', 'youtube.com'
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Tavily API error: ${response.status}`);
      }

      const data = await response.json();
      const rawResults = data.results || [];

      // STEP 5: Classify sources using Gemini 3 Flash for proper reference categorization
      const sourceClassifications = await this.classifySourcesBatch(rawResults);

      // STEP 6: Enhance results with classifications and metadata
      const enhancedResults = await this.enhanceWithSourceBible(rawResults, relevantSpecialties, existingUrls, sourceClassifications);

      // STEP 7: Apply intelligent filtering for medical relevance
      const filteredResults = this.applyMedicalFiltering(enhancedResults);

      const latency = Date.now() - startTime;

      // Set span attributes
      span.setAttribute('retrieval.result_count', filteredResults.length);
      span.setAttribute('retrieval.latency_ms', latency);
      span.setAttribute('retrieval.specialties_detected', JSON.stringify(relevantSpecialties));
      span.setAttribute('retrieval.domains_targeted', targetDomains.length);
      span.setAttribute('retrieval.total_results', rawResults.length);
      span.setAttribute('retrieval.deduped_results', filteredResults.length);
      span.setAttribute('retrieval.guideline_orgs', filteredResults.filter(r => r.source_type === 'guideline_org').length);
      span.setAttribute('retrieval.government_sources', filteredResults.filter(r => r.source_type === 'government').length);
      span.setAttribute('retrieval.query_type', 'specialty_targeted_search');

      console.log(`✅ Tavily Smart Search: ${filteredResults.length} new sources (${filteredResults.filter(r => r.source_type === 'guideline_org').length} guideline orgs, ${filteredResults.filter(r => r.source_type === 'government').length} government)`);
      console.log(`   📎 All results include URLs for proper reference section display`);

      // Convert to documents format for span events
      const documents = filteredResults.map(r => ({
        id: r.url,
        content: r.content,
        score: r.score,
        metadata: {
          title: r.title,
          url: r.url, // CRITICAL: URL preserved for reference section
          published_date: r.published_date,
          specialty_relevance: r.specialty_relevance,
          source_type: r.source_type
        }
      }));

      return { result: filteredResults, documents };

    } catch (error) {
      console.error('❌ Tavily Smart Search failed:', error);

      // Set error attributes
      span.setAttribute('retrieval.result_count', 0);
      span.setAttribute('retrieval.latency_ms', Date.now() - startTime);
      span.setAttribute('retrieval.error', error instanceof Error ? error.message : 'Unknown error');
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error instanceof Error ? error.message : 'Unknown error' });

        return { result: [], documents: [] };
      }
    }, { source: 'tavily' });
  }

  /**
   * Fetch structured metadata from NCBI for PubMed/PMC URLs
   */
  private async fetchNCBIMetadata(url: string): Promise<{ authors?: string[], journal?: string, year?: string, title?: string } | null> {
    try {
      let db = '';
      let id = '';

      if (url.includes('pubmed.ncbi.nlm.nih.gov')) {
        db = 'pubmed';
        const match = url.match(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/);
        if (match) id = match[1];
      } else if (url.includes('ncbi.nlm.nih.gov/pmc')) {
        db = 'pmc';
        const match = url.match(/PMC(\d+)/);
        if (match) id = match[1];
      }

      if (!db || !id || !process.env.NCBI_API_KEY) return null;

      const apiUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=${db}&id=${id}&retmode=json&api_key=${process.env.NCBI_API_KEY}`;
      const response = await fetch(apiUrl);
      if (!response.ok) return null;

      const data = await response.json();
      const uid = db === 'pubmed' ? id : Object.keys(data.result)[0]; // PMC IDs might differ in response
      const doc = data.result[uid];

      if (!doc) return null;

      // Extract metadata
      const authors = doc.authors?.map((a: any) => a.name) || [];
      const journal = doc.source || doc.fulljournalname;
      const pubDate = doc.pubdate || doc.epubdate;
      const year = pubDate ? pubDate.substring(0, 4) : '';

      return {
        authors: authors.slice(0, 5), // Top 5 authors
        journal,
        year,
        title: doc.title
      };

    } catch (error) {
      console.warn(`⚠️ NCBI metadata fetch failed for ${url}:`, error);
      return null;
    }
  }

  private async enhanceWithSourceBible(
    results: any[],
    specialties: string[],
    existingUrls: Set<string>,
    sourceClassifications: Map<string, 'guideline_org' | 'journal' | 'government' | 'medical_institution'>
  ): Promise<TavilySearchResult[]> {
    const enrichedResults: TavilySearchResult[] = [];

    // Process sequentially to be nice to NCBI API rate limits if multiple PubMed URLs found
    for (const result of results) {
      if (existingUrls.has(result.url)) continue;

      const sourceType = sourceClassifications.get(result.url) || this.classifySourceBasic(result.url, result.title);
      let metadata = {};

      // IF PubMed URL, fetch structured metadata
      if (result.url.includes('ncbi.nlm.nih.gov')) {
        const ncbiData = await this.fetchNCBIMetadata(result.url);
        if (ncbiData) {
          metadata = {
            authors: ncbiData.authors,
            journal: ncbiData.journal,
            year: ncbiData.year,
            // Use NCBI title if available as it's cleaner
            corrected_title: ncbiData.title
          }
        }
      } 
      // ELSE IF Guideline, try basic regex extraction from title
      else if (sourceType === 'guideline_org') {
        const yearMatch = result.title.match(/(20\d{2})/);
        if (yearMatch) {
          metadata = { year: yearMatch[1] };
        }
      }

      enrichedResults.push({
        url: result.url,
        title: (metadata as any).corrected_title || result.title,
        content: result.content,
        score: result.score || 0.7,
        published_date: (metadata as any).year || result.published_date,
        specialty_relevance: specialties,
        source_type: sourceType,
        ...metadata // Spread captured metadata (authors, journal)
      });
    }

    return enrichedResults;
  }

  private applyMedicalFiltering(results: TavilySearchResult[]): TavilySearchResult[] {
    // Sort by source type priority and score
    const sorted = results.sort((a, b) => {
      // First priority: Source type
      const typePriority = {
        'guideline_org': 4,
        'government': 3,
        'journal': 2,
        'medical_institution': 1
      };
      const typeDiff = typePriority[b.source_type || 'medical_institution'] - typePriority[a.source_type || 'medical_institution'];
      if (typeDiff !== 0) return typeDiff;

      // Second priority: Score
      return (b.score || 0) - (a.score || 0);
    });

    // Apply limits by source type
    const guidelineOrgs = sorted.filter(r => r.source_type === 'guideline_org').slice(0, 8);
    const government = sorted.filter(r => r.source_type === 'government').slice(0, 6);
    const journals = sorted.filter(r => r.source_type === 'journal').slice(0, 4);
    const institutions = sorted.filter(r => r.source_type === 'medical_institution').slice(0, 4);

    // Combine and deduplicate by URL
    const combined = [...guidelineOrgs, ...government, ...journals, ...institutions];
    const seen = new Set<string>();
    const deduped = combined.filter(result => {
      if (seen.has(result.url)) return false;
      seen.add(result.url);
      return true;
    });

    return deduped.slice(0, 20); // Final limit
  }

  private getGeneralMedicalDomains(): string[] {
    // Fallback domains when no specific specialties detected
    return [
      'cdc.gov', 'who.int', 'nih.gov', 'fda.gov',
      'mayoclinic.org', 'clevelandclinic.org', 'hopkinsmedicine.org',
      'nejm.org', 'thelancet.com', 'jamanetwork.com', 'bmj.com',
      'nice.org.uk', 'nhs.uk', 'uptodate.com', 'medscape.com'
    ];
  }

  /**
   * Smart truncation for Tavily queries - preserves context while meeting length limit
   */
  private smartTruncate(query: string, maxLength: number): string {
    // Step 1: Remove domain targeting patterns first (they're redundant with include_domains)
    let shortened = query.replace(/\(site:[^)]+\)/gi, '').trim();

    // Step 2: If still too long, remove common filler words
    if (shortened.length > maxLength) {
      const fillerPatterns = [
        /\bguidelines\s+recommendations\b/gi,
        /\bclinical\s+practice\s+guidelines\b/gi,
        /\bsystematic\s+review\s+meta-analysis\b/gi,
      ];
      for (const pattern of fillerPatterns) {
        if (shortened.length <= maxLength) break;
        shortened = shortened.replace(pattern, match => {
          // Keep first word only
          return match.split(/\s+/)[0];
        });
      }
    }

    // Step 3: Clean up extra spaces
    shortened = shortened.replace(/\s+/g, ' ').trim();

    // Step 4: If still too long, truncate at word boundary
    if (shortened.length > maxLength) {
      shortened = shortened.substring(0, maxLength);
      // Find last space to avoid cutting words
      const lastSpace = shortened.lastIndexOf(' ');
      if (lastSpace > maxLength * 0.7) {
        shortened = shortened.substring(0, lastSpace);
      }
    }

    return shortened.trim();
  }
}
