/**
 * Sub-Agent 2.3: Full-Text Fetcher
 * Fetches full-text for top documents (PMC + Unpaywall fallback)
 * Only called by Agent 4 after document-level re-ranking
 */

import { TraceContext } from '../types';
import { withRetrieverSpan, SpanStatusCode } from '../../otel';
import { FULLTEXT_FETCHER_SYSTEM_PROMPT } from '../system-prompts/fulltext-fetcher-prompt';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { callGeminiWithRetry } from '../../utils/gemini-rate-limiter';

export interface FullTextSections {
  [sectionName: string]: string;
}

export interface ContentChunk {
  chunk_id: string;
  parent_article: string;
  child_section: string;
  chunk_index: number;
  content: string;
  relevance_score: number;
  content_type: 'text' | 'table' | 'figure_caption';
}

export interface SelectedSection {
  section_title: string;
  section_type: string;
  relevance_score: number;
  content_summary: string;
  full_content: string;
  chunk_count: number;
  chunks: ContentChunk[];
}

export interface EnhancedArticle {
  // Original article metadata
  pmid?: string;
  pmcid?: string;
  doi?: string;
  title: string;
  authors?: string;
  journal?: string;
  abstract?: string;
  
  // Hierarchical content structure
  selected_sections: SelectedSection[];
  content_chunks: ContentChunk[];
  
  // Processing metadata
  full_text_source: 'pmc' | 'unpaywall' | 'enhanced_abstract' | 'available_content';
  pdf_url?: string;
  sections_analyzed: number;
  sections_selected: number;
  total_chunks: number;
  processing_timestamp: string;
  selection_criteria: string;
}

export class FullTextFetcher {
  private ncbiApiKey: string;
  private unpaywallEmail = 'research@openwork.ai';
  private systemPrompt: string;
  private genAI: any;
  private modelName: string;

  constructor(apiKey: string) {
    this.ncbiApiKey = apiKey;
    this.modelName = 'gemini-3-flash-preview';
    
    // Initialize Gemini for intelligent section selection
    if (process.env.GEMINI_API_KEY) {
      const { GoogleGenAI } = require('@google/genai');
      this.genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } else {
      this.genAI = null;
      console.warn('⚠️ GEMINI_API_KEY not set - FullText Fetcher will use basic section selection');
    }
    
    // Import system prompt
    const { FULLTEXT_FETCHER_SYSTEM_PROMPT } = require('../system-prompts/fulltext-fetcher-prompt');
    this.systemPrompt = FULLTEXT_FETCHER_SYSTEM_PROMPT;
  }

  /**
   * Score sections for relevance using Gemini 3 Flash (thinking_level: low)
   */
  private async scoreSections(sections: any[], query: string): Promise<any[]> {
    if (!this.genAI || sections.length === 0) {
      // Fallback to basic scoring
      return sections.map(section => ({
        ...section,
        relevance_score: this.getSectionTypeScore(section.type) * 0.8
      }));
    }

    try {
      const sectionsPreview = sections.slice(0, 10).map((s, idx) => 
        `[${idx}] ${s.title} (${s.type}) - ${s.content.substring(0, 100)}...`
      ).join('\n\n');

      const prompt = `Score these article sections for relevance to the query (0.0-1.0). Return format: "index:score" (e.g., "0:0.9,1:0.7,2:0.85").

Query: ${query}

Sections:
${sectionsPreview}

Scores:`;

      // CRITICAL FIX: Use rate limiter with multi-key support
      const response = await callGeminiWithRetry(async (apiKey: string) => {
        const genAI = new GoogleGenAI({ apiKey });
        return await genAI.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config: {
            systemInstruction: 'You are a medical content relevance specialist. Score sections based on query relevance.',
            temperature: 0.1,
            maxOutputTokens: 100,
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.LOW // Straightforward relevance scoring
            }
          }
        });
      });

      const scoresText = response.text?.trim() || '';
      const scoreMap = new Map<number, number>();
      
      // Parse scores
      const pairs = scoresText.split(',');
      pairs.forEach((pair: string) => {
        const [indexStr, scoreStr] = pair.split(':').map(s => s.trim());
        const index = parseInt(indexStr);
        const score = parseFloat(scoreStr);
        if (!isNaN(index) && !isNaN(score) && index < sections.length) {
          scoreMap.set(index, score);
        }
      });

      // Apply scores
      const scoredSections = sections.map((section, idx) => ({
        ...section,
        relevance_score: scoreMap.get(idx) || this.getSectionTypeScore(section.type) * 0.5
      }));

      console.log(`   📊 LLM scored ${scoreMap.size} sections`);
      return scoredSections;
    } catch (error) {
      console.warn('⚠️ LLM scoring failed, using basic scores:', error);
      return sections.map(section => ({
        ...section,
        relevance_score: this.getSectionTypeScore(section.type) * 0.8
      }));
    }
  }

  /**
   * Select top sections using Gemini 3 Flash (thinking_level: minimal)
   */
  private async selectTopSections(sections: any[], query: string, maxSections: number = 3): Promise<SelectedSection[]> {
    if (sections.length === 0) return [];
    
    // Score sections first
    const scoredSections = await this.scoreSections(sections, query);
    
    // Sort by composite score and select top sections
    scoredSections.sort((a, b) => b.relevance_score - a.relevance_score);
    const selectedSections = scoredSections.slice(0, maxSections);
    
    // Convert to SelectedSection format — preserve full content for chunking
    return selectedSections.map(section => ({
      section_title: section.title,
      section_type: section.type,
      relevance_score: section.relevance_score,
      content_summary: section.content.substring(0, 200) + '...',
      full_content: section.content,
      chunk_count: 0,
      chunks: []
    }));
  }

  /**
   * Get base score for section type
   */
  private getSectionTypeScore(sectionType: string): number {
    const typeScores: Record<string, number> = {
      'methods': 0.6,
      'results': 0.9,
      'discussion': 0.8,
      'introduction': 0.5,
      'conclusion': 0.7,
      'abstract': 0.4,
      'background': 0.5
    };
    return typeScores[sectionType.toLowerCase()] || 0.5;
  }

  async fetchFullText(article: any, originalQuery: string): Promise<EnhancedArticle> {
    return await withRetrieverSpan('fulltext_fetcher', async (span) => {
      const startTime = Date.now();
      
      // Set retrieval attributes
      span.setAttribute('retrieval.source', 'fulltext_fetcher');
      span.setAttribute('retrieval.query', originalQuery.substring(0, 200));
      span.setAttribute('retrieval.article_id', article.pmid || article.pmcid || article.doi || 'unknown');
      
      try {
      // Step 1: Comprehensive identifier analysis
      const identifiers = this.extractIdentifiers(article);
      
      // Step 2: Multi-tier retrieval attempt
      let fullTextContent = null;
      let source = 'available_content';
      let pdfUrl = null;
      
      // Try PMC first (highest priority)
      if (identifiers.pmcid || identifiers.pmid) {
        const pmcId = identifiers.pmcid || identifiers.pmid;
        if (pmcId) {
          fullTextContent = await this.fetchFromPMC(pmcId);
          if (fullTextContent) {
            source = 'pmc';
          }
        }
      }
      
      // Try Unpaywall if PMC failed and DOI available
      if (!fullTextContent && identifiers.doi) {
        pdfUrl = await this.checkUnpaywall(identifiers.doi);
        if (pdfUrl) {
          source = 'unpaywall';
          // For PDF, we'll process it differently
          fullTextContent = { pdf_url: pdfUrl };
        }
      }
      
      // Enhance with PubMed abstract if PMID available
      if (!fullTextContent && identifiers.pmid) {
        fullTextContent = await this.enhancePubMedAbstract(identifiers.pmid);
        if (fullTextContent) {
          source = 'enhanced_abstract';
        }
      }
      
      // Final fallback: use available content
      if (!fullTextContent) {
        fullTextContent = this.processAvailableContent(article);
      }
      
      // Step 3: Intelligent section analysis and selection
      const sections = await this.extractAndAnalyzeSections(fullTextContent, originalQuery);
      
      // Step 4: Select top 3 most relevant sections
      const selectedSections = await this.selectTopSections(sections, originalQuery, 3);
      
      // Step 5: Apply hierarchical chunking
      const contentChunks = await this.generateHierarchicalChunks(selectedSections, article);
      
      // Step 6: Compile enhanced article
      const enhancedArticle: EnhancedArticle = {
        // Preserve original metadata
        pmid: identifiers.pmid,
        pmcid: identifiers.pmcid,
        doi: identifiers.doi,
        title: article.title || '',
        authors: article.authors || '',
        journal: article.journal || '',
        abstract: article.abstract || '',
        
        // Hierarchical content
        selected_sections: selectedSections,
        content_chunks: contentChunks,
        
        // Processing metadata
        full_text_source: source as any,
        pdf_url: pdfUrl || undefined,
        sections_analyzed: sections.length,
        sections_selected: selectedSections.length,
        total_chunks: contentChunks.length,
        processing_timestamp: new Date().toISOString(),
        selection_criteria: `Query-based relevance scoring with section type prioritization`
      };
      
      const latency = Date.now() - startTime;
      
      // Set span attributes
      span.setAttribute('retrieval.latency_ms', latency);
      span.setAttribute('retrieval.sections_analyzed', sections.length);
      span.setAttribute('retrieval.sections_selected', selectedSections.length);
      span.setAttribute('retrieval.total_chunks', contentChunks.length);
      span.setAttribute('retrieval.full_text_source', source);
      span.setAttribute('retrieval.has_pdf_url', !!pdfUrl);
      
      console.log(`📄 Enhanced full-text processing: ${contentChunks.length} chunks from ${selectedSections.length} sections (${latency}ms)`);
      
      // Convert to documents format for span events
      const documents = selectedSections.map((s, index) => ({
        id: s.section_title || `section_${index}`,
        content: s.content_summary || '',
        score: s.relevance_score || 1.0,
        metadata: {
          section_type: s.section_type,
          section_title: s.section_title,
          chunk_count: s.chunk_count || 0
        }
      }));
      
      return { result: enhancedArticle, documents };
      
    } catch (error) {
      console.error('❌ Enhanced full-text processing failed:', error);
      
      // Set error attributes
      span.setAttribute('retrieval.latency_ms', Date.now() - startTime);
      span.setAttribute('retrieval.error', error instanceof Error ? error.message : 'Unknown error');
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error instanceof Error ? error.message : 'Unknown error' });
      
      // Return minimal enhanced article with available content
      const fallbackArticle = this.createFallbackEnhancedArticle(article);
      return { result: fallbackArticle, documents: [] };
      }
    }, { source: 'fulltext_fetcher' });
  }

  private async fetchFromPMC(identifier: string): Promise<FullTextSections | null> {
    // Handle both PMCID and PMID
    let pmcId = identifier;
    if (identifier.startsWith('PMC')) {
      pmcId = identifier.replace('PMC', '');
    }
    
    const url = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';
    const params = new URLSearchParams({
      db: 'pmc',
      id: pmcId,
      retmode: 'xml',
      api_key: this.ncbiApiKey
    });

    try {
      const response = await fetch(`${url}?${params}`);
      const xmlContent = await response.text();

      // Parse XML (simplified - in production use proper XML parser)
      const sections: FullTextSections = {};
      
      // Extract sections using regex (simplified approach)
      const sectionMatches = xmlContent.match(/<sec[^>]*>[\s\S]*?<\/sec>/g) || [];
      
      for (const sectionMatch of sectionMatches) {
        const titleMatch = sectionMatch.match(/<title[^>]*>([\s\S]*?)<\/title>/);
        const title = titleMatch ? titleMatch[1].toLowerCase() : 'other';
        
        // Extract text content (remove XML tags)
        const textContent = sectionMatch.replace(/<[^>]*>/g, ' ').trim();
        
        if (textContent.length > 50) { // Only include substantial sections
          sections[title] = textContent.substring(0, 2000); // Limit section length
        }
      }

      return Object.keys(sections).length > 0 ? sections : null;

    } catch (error) {
      console.error(`❌ PMC fetch failed for ${identifier}:`, error);
      return null;
    }
  }

  private extractIdentifiers(article: any): { pmcid?: string; pmid?: string; doi?: string } {
    const identifiers: { pmcid?: string; pmid?: string; doi?: string } = {};
    
    // Extract PMCID
    if (article.pmcid) {
      identifiers.pmcid = article.pmcid;
    }
    
    // Extract PMID
    if (article.pmid) {
      identifiers.pmid = article.pmid;
    }
    
    // Extract DOI
    if (article.doi) {
      identifiers.doi = article.doi;
    }
    
    return identifiers;
  }

  private async enhancePubMedAbstract(pmid: string): Promise<any> {
    const url = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';
    const params = new URLSearchParams({
      db: 'pubmed',
      id: pmid,
      retmode: 'xml',
      api_key: this.ncbiApiKey
    });

    try {
      const response = await fetch(`${url}?${params}`);
      const xmlContent = await response.text();
      
      // Parse enhanced abstract with MeSH terms and metadata
      const enhancedContent = this.parseEnhancedAbstract(xmlContent);
      return enhancedContent;
      
    } catch (error) {
      console.error(`❌ Enhanced abstract fetch failed for PMID ${pmid}:`, error);
      return null;
    }
  }

  private parseEnhancedAbstract(xmlContent: string): any {
    // Extract structured abstract sections
    const sections: any = {};
    
    // Look for structured abstract sections
    const abstractMatch = xmlContent.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g);
    if (abstractMatch) {
      abstractMatch.forEach((match, index) => {
        const labelMatch = match.match(/Label="([^"]*)"/) || match.match(/NlmCategory="([^"]*)"/);
        const label = labelMatch ? labelMatch[1].toLowerCase() : `section_${index}`;
        const content = match.replace(/<[^>]*>/g, ' ').trim();
        
        if (content.length > 20) {
          sections[label] = content;
        }
      });
    }
    
    return Object.keys(sections).length > 0 ? sections : null;
  }

  private processAvailableContent(article: any): any {
    const sections: any = {};
    
    // Use abstract as primary content
    if (article.abstract && article.abstract.length > 50) {
      sections.abstract = article.abstract;
    }
    
    // Use any other available content
    if (article.content && article.content.length > 50) {
      sections.content = article.content;
    }
    
    // Use snippet if available
    if (article.snippet && article.snippet.length > 50) {
      sections.snippet = article.snippet;
    }
    
    return Object.keys(sections).length > 0 ? sections : { abstract: article.title || 'No content available' };
  }

  private async extractAndAnalyzeSections(content: any, query: string): Promise<any[]> {
    if (!content) return [];
    
    const sections = [];
    
    // Handle PMC XML content
    if (typeof content === 'object' && !content.pdf_url) {
      for (const [sectionName, sectionContent] of Object.entries(content)) {
        if (typeof sectionContent === 'string' && sectionContent.length > 50) {
          sections.push({
            title: sectionName,
            content: sectionContent,
            type: this.classifySectionType(sectionName),
            length: sectionContent.length
          });
        }
      }
    }
    
    // Handle PDF content (placeholder for future PDF processing)
    else if (content.pdf_url) {
      // For now, create a single section for PDF
      sections.push({
        title: 'PDF Content',
        content: `PDF available at: ${content.pdf_url}`,
        type: 'pdf',
        length: 100,
        pdf_url: content.pdf_url
      });
    }
    
    return sections;
  }

  private classifySectionType(sectionName: string): string {
    const name = sectionName.toLowerCase();
    
    if (name.includes('result') || name.includes('finding')) return 'results';
    if (name.includes('discussion') || name.includes('interpretation')) return 'discussion';
    if (name.includes('conclusion') || name.includes('summary')) return 'conclusion';
    if (name.includes('method') || name.includes('methodology')) return 'methods';
    if (name.includes('introduction') || name.includes('background')) return 'introduction';
    if (name.includes('abstract')) return 'abstract';
    
    return 'other';
  }

  private async generateHierarchicalChunks(selectedSections: SelectedSection[], article: any): Promise<ContentChunk[]> {
    const allChunks: ContentChunk[] = [];

    for (let sectionIndex = 0; sectionIndex < selectedSections.length; sectionIndex++) {
      const section = selectedSections[sectionIndex];

      // Use the preserved full_content from selectTopSections
      const sectionContent = section.full_content || section.content_summary;
      if (!sectionContent || sectionContent.length < 50) continue;

      // Generate chunks for this section
      const chunks = this.chunkContent(sectionContent, {
        chunkSize: 1000,
        overlap: 200,
        preserveBoundaries: true
      });
      
      // Create ContentChunk objects
      const sectionChunks = chunks.map((chunk, chunkIndex) => ({
        chunk_id: `${article.pmid || 'article'}_${sectionIndex}_${chunkIndex}`,
        parent_article: article.title || 'Unknown Article',
        child_section: section.section_title,
        chunk_index: chunkIndex,
        content: chunk,
        relevance_score: section.relevance_score,
        content_type: 'text' as const
      }));
      
      // Update section with chunk count
      section.chunk_count = sectionChunks.length;
      section.chunks = sectionChunks;
      
      allChunks.push(...sectionChunks);
    }
    
    return allChunks;
  }

  private chunkContent(content: string, options: { chunkSize: number; overlap: number; preserveBoundaries: boolean }): string[] {
    const chunks: string[] = [];
    const { chunkSize, overlap, preserveBoundaries } = options;
    
    if (content.length <= chunkSize) {
      return [content];
    }
    
    let start = 0;
    while (start < content.length) {
      let end = Math.min(start + chunkSize, content.length);
      
      // If preserveBoundaries is true, try to end at sentence boundary
      if (preserveBoundaries && end < content.length) {
        const lastPeriod = content.lastIndexOf('.', end);
        const lastNewline = content.lastIndexOf('\n', end);
        const boundary = Math.max(lastPeriod, lastNewline);
        
        if (boundary > start + chunkSize * 0.5) {
          end = boundary + 1;
        }
      }
      
      chunks.push(content.substring(start, end).trim());
      start = end - overlap;
    }
    
    return chunks.filter(chunk => chunk.length > 20);
  }

  private createFallbackEnhancedArticle(article: any): EnhancedArticle {
    const fallbackChunk: ContentChunk = {
      chunk_id: `${article.pmid || 'fallback'}_0_0`,
      parent_article: article.title || 'Unknown Article',
      child_section: 'abstract',
      chunk_index: 0,
      content: article.abstract || article.title || 'No content available',
      relevance_score: 0.5,
      content_type: 'text'
    };
    
    const fallbackContent = article.abstract || article.title || 'No content available';
    const fallbackSection: SelectedSection = {
      section_title: 'Abstract',
      section_type: 'abstract',
      relevance_score: 0.5,
      content_summary: fallbackContent.substring(0, 200),
      full_content: fallbackContent,
      chunk_count: 1,
      chunks: [fallbackChunk]
    };
    
    return {
      pmid: article.pmid,
      pmcid: article.pmcid,
      doi: article.doi,
      title: article.title || 'Unknown Article',
      authors: article.authors || '',
      journal: article.journal || '',
      abstract: article.abstract || '',
      selected_sections: [fallbackSection],
      content_chunks: [fallbackChunk],
      full_text_source: 'available_content',
      sections_analyzed: 1,
      sections_selected: 1,
      total_chunks: 1,
      processing_timestamp: new Date().toISOString(),
      selection_criteria: 'Fallback processing due to retrieval failure'
    };
  }

  private async fetchPMCFullText(pmcid: string): Promise<FullTextSections | null> {
    const url = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';
    const params = new URLSearchParams({
      db: 'pmc',
      id: pmcid.replace('PMC', ''),
      retmode: 'xml',
      api_key: this.ncbiApiKey
    });

    try {
      const response = await fetch(`${url}?${params}`);
      const xmlContent = await response.text();

      // Parse XML (simplified - in production use proper XML parser)
      const sections: FullTextSections = {};
      
      // Extract sections using regex (simplified approach)
      const sectionMatches = xmlContent.match(/<sec[^>]*>[\s\S]*?<\/sec>/g) || [];
      
      for (const sectionMatch of sectionMatches) {
        const titleMatch = sectionMatch.match(/<title[^>]*>([\s\S]*?)<\/title>/);
        const title = titleMatch ? titleMatch[1].toLowerCase() : 'other';
        
        // Extract text content (remove XML tags)
        const textContent = sectionMatch.replace(/<[^>]*>/g, ' ').trim();
        
        if (textContent.length > 50) { // Only include substantial sections
          sections[title] = textContent.substring(0, 2000); // Limit section length
        }
      }

      return Object.keys(sections).length > 0 ? sections : null;

    } catch (error) {
      console.error(`❌ PMC fetch failed for ${pmcid}:`, error);
      return null;
    }
  }

  private async checkUnpaywall(doi: string): Promise<string | null> {
    const url = `https://api.unpaywall.org/v2/${doi}`;
    const params = new URLSearchParams({
      email: this.unpaywallEmail
    });

    try {
      const response = await fetch(`${url}?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.is_oa) {
          const bestOA = data.best_oa_location;
          return bestOA?.url_for_pdf || null;
        }
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Unpaywall check failed for ${doi}:`, error);
      return null;
    }
  }
}