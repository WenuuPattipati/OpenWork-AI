/**
 * Sub-Agent 2.1: Guidelines Retriever
 * Firestore Vector Search for Indian Clinical Practice Guidelines
 */

import { Firestore } from '@google-cloud/firestore';
import { GoogleGenAI } from '@google/genai';
import { TraceContext } from '../types';
import { withRetrieverSpan, SpanStatusCode } from '../../otel';
import { GUIDELINES_RETRIEVER_SYSTEM_PROMPT } from '../system-prompts/guidelines-retriever-prompt';
import { callGeminiWithRetry } from '../../utils/gemini-rate-limiter';
import * as fs from 'fs';

export class GuidelinesRetriever {
  private db: Firestore | null;
  private genAI: GoogleGenAI | null;
  private modelName: string;
  private systemPrompt: string;

  constructor() {
    this.modelName = 'gemini-3-flash-preview';
    this.systemPrompt = GUIDELINES_RETRIEVER_SYSTEM_PROMPT;
    // Check authentication methods in order of preference
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const hasEnvVars = process.env.GOOGLE_CLOUD_PROJECT_ID &&
      process.env.GOOGLE_CLOUD_PRIVATE_KEY &&
                      process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
    const hasProjectId = process.env.GOOGLE_CLOUD_PROJECT_ID;

    if (credentialsPath && fs.existsSync(credentialsPath)) {
      // Method 1: Service account file
      console.log('🔑 Using GCP service account file for authentication');
      this.db = new Firestore();
      this.genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    } else if (hasEnvVars) {
      // Method 2: Environment variables
      console.log('🔑 Using GCP environment variables for authentication');
      this.db = new Firestore({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        credentials: {
          client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }
      });
      this.genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    } else if (hasProjectId) {
      // Method 3: Application Default Credentials (ADC) with project ID
      console.log('🔑 Attempting GCP Application Default Credentials with project ID');
      try {
        this.db = new Firestore({
          projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
        });
        this.genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
        console.log(`✅ GCP Firestore initialized with project: ${process.env.GOOGLE_CLOUD_PROJECT_ID}`);
      } catch (error) {
        console.warn('⚠️ Failed to initialize with Application Default Credentials');
        console.warn(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        this.db = null;
        this.genAI = null;
      }
    } else {
      console.warn('⚠️ No GCP credentials found. Guidelines retrieval will be disabled.');
      console.warn('   Please set up either:');
      console.warn('   1. Service account file: gcp-service-account.json');
      console.warn('   2. Environment variables: GOOGLE_CLOUD_PROJECT_ID, GOOGLE_CLOUD_PRIVATE_KEY, GOOGLE_CLOUD_CLIENT_EMAIL');
      console.warn('   3. Application Default Credentials: gcloud auth application-default login');
      this.db = null;
      this.genAI = null;
      return;
    }
  }

  /**
   * Enhance query with medical context using Gemini 3 Flash (thinking_level: minimal)
   */
  private async enhanceQuery(query: string): Promise<string> {
    if (!this.genAI) return query;

    try {
      // #region debug log
      fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'guidelines-retriever.ts:79', message: 'Guidelines API call starting', data: { subAgent: 'guidelines', operation: 'enhanceQuery', apiKey: process.env.GEMINI_API_KEY?.substring(0, 10) || 'none', timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => { });
      // #endregion
      const prompt = `Enhance this medical query for Indian guideline search by adding relevant medical context, expanding abbreviations, and including Indian-specific terms. Keep it concise.

Query: ${query}

Enhanced query:`;

      // CRITICAL FIX: Use rate limiter with multi-key support to prevent overload
      const response = await callGeminiWithRetry(async (apiKey: string) => {
        const genAI = new GoogleGenAI({ apiKey });
        return await genAI.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config: {
            systemInstruction: 'You are a medical query enhancement specialist. Expand abbreviations, add medical context, and include Indian healthcare terms.',
            temperature: 0.1,
            maxOutputTokens: 200
          }
        });
      });
      // #region debug log
      fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'guidelines-retriever.ts:99', message: 'Guidelines API call completed', data: { subAgent: 'guidelines', operation: 'enhanceQuery', success: true, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => { });
      // #endregion

      const enhanced = response.text?.trim() || query;
      console.log(`   🔧 Enhanced query: "${enhanced.substring(0, 100)}..."`);
      return enhanced;
    } catch (error) {
      // #region debug log
      fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'guidelines-retriever.ts:103', message: 'Guidelines API call error', data: { subAgent: 'guidelines', operation: 'enhanceQuery', error: error instanceof Error ? error.message : 'Unknown', isOverload: error instanceof Error && (error.message.includes('overloaded') || error.message.includes('503') || error.message.includes('429')), timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => { });
      // #endregion
      console.warn('⚠️ Query enhancement failed, using original:', error);
      return query;
    }
  }

  /**
   * Rank results by relevance using Gemini 3 Flash (thinking_level: low)
   */
  private async rankResults(results: GuidelineSearchResult[], userQuery: string): Promise<GuidelineSearchResult[]> {
    if (!this.genAI || results.length === 0) return results;

    try {
      // For large result sets, use LLM to identify top candidates
      if (results.length > 10) {
        const resultsPreview = results.slice(0, 20).map((r, idx) =>
          `[${idx}] ${r.title} (${r.organization}, ${r.year}) - Similarity: ${r.similarity_score.toFixed(2)}`
        ).join('\n');

        const prompt = `Given this medical query and guideline results, identify the indices of the 10 most clinically relevant guidelines. Return only comma-separated indices (e.g., "0,3,5,7,9,12,15,18,19,20").

Query: ${userQuery}

Results:
${resultsPreview}

Top 10 indices:`;

        // CRITICAL FIX: Use rate limiter with multi-key support
        const response = await callGeminiWithRetry(async (apiKey: string) => {
          const genAI = new GoogleGenAI({ apiKey });
          return await genAI.models.generateContent({
            model: this.modelName,
            contents: prompt,
            config: {
              systemInstruction: 'You are a clinical relevance ranking specialist. Select the most relevant guidelines based on medical context.',
              temperature: 0.1,
              maxOutputTokens: 50
            }
          });
        });

        const indicesText = response.text?.trim() || '';
        const indices = indicesText.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n < results.length);

        if (indices.length > 0) {
          const rankedResults = indices.map(i => results[i]).filter(Boolean);
          console.log(`   🎯 LLM ranked ${rankedResults.length} guidelines`);
          return rankedResults;
        }
      }

      return results;
    } catch (error) {
      console.warn('⚠️ LLM ranking failed, using similarity scores:', error);
      return results;
    }
  }

  async search(
    searchVariants: string[],
    traceContext: TraceContext,
    userQuery: string = ''
  ): Promise<GuidelineSearchResult[]> {
    return await withRetrieverSpan('guidelines', async (span) => {
      const startTime = Date.now();

      // Set retrieval attributes
      span.setAttribute('retrieval.source', 'guidelines');
      span.setAttribute('retrieval.query', JSON.stringify({ search_variants: searchVariants, user_query: userQuery }));

      // Return empty results if GCP is not configured
      if (!this.db || !this.genAI) {
        console.warn('⚠️ Guidelines retrieval skipped - GCP not configured');
        span.setAttribute('retrieval.result_count', 0);
        span.setAttribute('retrieval.latency_ms', Date.now() - startTime);
        return { result: [], documents: [] };
      }

      try {
      console.log('🔍 Searching Indian Guidelines in Firestore...');
        console.log(`📋 Agent 1 routed to Guidelines - executing search with ${searchVariants.length} specialized queries`);
      const allResults: GuidelineSearchResult[] = [];
      const seenChunkIds = new Set<string>();

      for (const variant of searchVariants) {
        // Enhance query with Gemini 3 Flash
        const enhancedVariant = await this.enhanceQuery(variant);

        // Get embedding for enhanced variant
        const embedding = await this.getGeminiEmbedding(enhancedVariant);
        console.log(`   📏 Embedding dimension: ${embedding.length}`);

        // Skip if embedding generation failed (all zeros)
        if (embedding.every(v => v === 0)) {
          console.warn(`   ⚠️ Skipping variant with zero embedding: "${variant.substring(0, 50)}..."`);
          continue;
        }

        // Native Firestore vector search using findNearest()
        const collection = this.db.collection(process.env.FIRESTORE_COLLECTION_GUIDELINE_CHUNKS || 'guideline_chunks');

        const vectorQuery = collection.findNearest({
          vectorField: 'embedding_vector',
          queryVector: embedding,
          limit: 10,
          distanceMeasure: 'COSINE',
          distanceResultField: 'vector_distance'
        });

        const snapshot = await vectorQuery.get();

        console.log(`   Found ${snapshot.size} nearest results for variant: "${variant.substring(0, 60)}..."`);

        for (const doc of snapshot.docs) {
          const data = doc.data();
          const chunkId = data.chunk_id || doc.id;

          // Deduplicate across variants
          if (!seenChunkIds.has(chunkId)) {
            seenChunkIds.add(chunkId);

            // Firestore COSINE distance = 1 - cosine_similarity
            const distance = data.vector_distance ?? 1;
            const similarity = 1 - distance;

            if (similarity > 0.50) {
              allResults.push({
                chunk_id: chunkId,
                guideline_id: data.guideline_id || data.document_id,
                parent_section: data.parent_section || data.section_header,
                child_section: data.child_section || data.subsection,
                organization: data.organization || 'Indian Medical Guidelines',
                title: data.guideline_title || data.title || data.document_title || 'Indian Clinical Guideline',
                year: data.year || data.publication_year || new Date().getFullYear(),
                text: data.content || data.text || data.text_for_search,
                summary: data.summary || this.generateSummary(data.content || data.text || data.text_for_search),
                similarity_score: similarity,
                document_type: data.document_type || 'Clinical Guideline',
                page_number: data.page_number,
                section_hierarchy: data.section_hierarchy || [data.section_header, data.child_section].filter(Boolean)
              });
            }
          }
        }
      }

        // Sort by similarity and take top 20 for LLM ranking
        const topCandidates = allResults
        .sort((a, b) => b.similarity_score - a.similarity_score)
          .slice(0, 20);

        // Use LLM to rank top candidates
        const rankedResults = await this.rankResults(topCandidates, userQuery);

        // Take final top 15
        const topResults = rankedResults.slice(0, 15);

      const latency = Date.now() - startTime;

        // Set span attributes
        span.setAttribute('retrieval.result_count', topResults.length);
        span.setAttribute('retrieval.latency_ms', latency);

      console.log(`📋 Indian Guidelines search: ${topResults.length} relevant chunks found`);
      if (topResults.length > 0) {
        console.log(`   Organizations: ${[...new Set(topResults.map(r => r.organization))].join(', ')}`);
        console.log(`   Document types: ${[...new Set(topResults.map(r => r.document_type))].join(', ')}`);
      }

        // Convert to documents format for span events
        const documents = topResults.map(r => ({
          id: r.chunk_id,
          content: r.text,
          score: r.similarity_score,
          metadata: {
            guideline_id: r.guideline_id,
            organization: r.organization,
            title: r.title,
            year: r.year,
            document_type: r.document_type
          }
        }));

        return { result: topResults, documents };

    } catch (error) {
      console.error('❌ Guidelines retrieval failed:', error);

        // Set error attributes
        span.setAttribute('retrieval.result_count', 0);
        span.setAttribute('retrieval.latency_ms', Date.now() - startTime);
        span.setAttribute('retrieval.error', error instanceof Error ? error.message : 'Unknown error');
        span.recordException(error as Error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: error instanceof Error ? error.message : 'Unknown error' });

        return { result: [], documents: [] };
      }
    }, { source: 'guidelines' });
  }

  private async getGeminiEmbedding(text: string): Promise<number[]> {
    if (!this.genAI) {
      return new Array(768).fill(0);
    }

    try {
      // CRITICAL FIX: Use rate limiter for embeddings too
      const result = await callGeminiWithRetry(async (apiKey: string) => {
        const genAI = new GoogleGenAI({ apiKey });
        const modelEnv = process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004';
        const modelName = modelEnv.startsWith('models/') ? modelEnv : `models/${modelEnv}`;
        return await genAI.models.embedContent({
          model: modelName,
          contents: [{ role: 'user', parts: [{ text }] }],
          config: {
            outputDimensionality: 768
          }
        });
      });
      const values = result.embeddings?.[0]?.values;
      if (values) {
        console.log(`   📏 Embedding dimension: ${values.length}`);
        if (values.length !== 768) {
          console.warn(`   ⚠️ WARNING: Expected 768 dimensions, got ${values.length}. Mismatch with Firestore index may cause query failure.`);
        }
        return values;
      }
      return new Array(768).fill(0);
    } catch (error) {
      console.error('❌ Embedding generation failed:', error);
      // Return dummy embedding for fallback
      return new Array(768).fill(0);
    }
  }

  private generateSummary(text: string): string {
    if (!text || text.length < 100) return text;

    // Simple extractive summarization - take first 2 sentences and key points
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    if (sentences.length <= 2) return text;

    // Take first sentence and any sentence with key medical terms
    const keyTerms = ['recommend', 'should', 'must', 'guideline', 'treatment', 'therapy', 'diagnosis', 'management'];
    const importantSentences = sentences.filter((sentence, index) =>
      index === 0 || keyTerms.some(term => sentence.toLowerCase().includes(term))
    ).slice(0, 3);

    return importantSentences.join('. ').trim() + '.';
  }

}

export interface GuidelineSearchResult {
  chunk_id: string;
  guideline_id: string;
  parent_section?: string;
  child_section?: string;
  organization: string;
  title: string;
  year: number;
  text: string;
  summary?: string;
  similarity_score: number;
  document_type?: string;
  page_number?: number;
  section_hierarchy?: string[];
}
