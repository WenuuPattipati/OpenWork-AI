/**
 * Semantic Reranking Layer - MedCPT-based relevance scoring
 * 
 * ARCHITECTURE: Works AFTER API retrieval, BEFORE BGE Cross-Encoder
 * Pipeline: Structured Query → API Results → Semantic Rerank → BGE Rerank
 * 
 * CRITICAL FIX: Uses UNION scoring, not intersection
 * Combines API relevance (40%) + semantic similarity (60%) for final score
 */

import { getMedCPTEmbedder, MedCPTEmbedder } from './medcpt-embedder';
import type { PubMedArticle } from './pubmed';
import type { EuropePMCArticle } from './europepmc';
import type { CochraneReview } from './cochrane';
import type { PMCArticle } from './pmc';

interface SemanticScore<T> {
  article: T;
  semanticSimilarity: number;
  combinedScore: number;
  rank: number;
}

interface SemanticRerankingConfig {
  minSimilarityThreshold: number; // Default: 0.45 for PubMedBERT (45% similarity)
  topK?: number; // Optional: limit results
  combineWithKeywordScore?: boolean; // Combine with API relevance score
  keywordWeight?: number; // Default: 0.4 (40% keyword, 60% semantic)
}

export class SemanticReranker {
  private embedder: MedCPTEmbedder;

  constructor() {
    this.embedder = getMedCPTEmbedder();
  }

  /**
   * Rerank PubMed articles using MedCPT semantic similarity
   * CRITICAL: Uses weighted combination, not intersection
   */
  async rerankPubMedArticles(
    clinicalQuery: string,
    articles: PubMedArticle[],
    config: SemanticRerankingConfig = {
      minSimilarityThreshold: 0.45, // Lowered for PubMedBERT
      combineWithKeywordScore: true,
      keywordWeight: 0.3 // 70% semantic, 30% keyword
    }
  ): Promise<PubMedArticle[]> {
    if (articles.length === 0) return [];

    console.log(`🔍 Semantic reranking ${articles.length} PubMed articles...`);

    // Step 1: Generate query embedding (once)
    const queryEmbedding = await this.embedder.embedQuery(clinicalQuery);

    // Step 2: Generate article embeddings (batch)
    const articleEmbeddings = await this.embedder.embedArticlesBatch(
      articles.map(a => ({ title: a.title, abstract: a.abstract }))
    );

    // Step 3: Compute semantic similarities
    const scoredArticles = articles.map((article, i) => {
      const semanticSimilarity = MedCPTEmbedder.cosineSimilarity(
        queryEmbedding,
        articleEmbeddings[i]
      );

      // CRITICAL FIX: Combine with keyword score if API provides relevance
      let finalScore = semanticSimilarity;

      // Note: relevanceScore is optional and only present when article comes from certain sources
      const articleWithScore = article as PubMedArticle & { relevanceScore?: number };
      if (config.combineWithKeywordScore && articleWithScore.relevanceScore) {
        const semanticWeight = 1 - (config.keywordWeight || 0.4);
        finalScore = (semanticWeight * semanticSimilarity) +
          (config.keywordWeight! * articleWithScore.relevanceScore);
      }

      return {
        article,
        semanticSimilarity,
        combinedScore: finalScore,
        rank: 0 // Will be set after sorting
      };
    });

    // Step 4: Sort by combined score and filter
    scoredArticles.sort((a, b) => b.combinedScore - a.combinedScore);

    const filtered = scoredArticles.filter(
      s => s.semanticSimilarity >= config.minSimilarityThreshold
    );

    // Step 5: Apply topK limit if specified
    const limited = config.topK ? filtered.slice(0, config.topK) : filtered;

    // Add rank numbers
    limited.forEach((item, i) => {
      item.rank = i + 1;
    });

    console.log(`✅ Semantic filter: ${articles.length} → ${limited.length} articles`);
    console.log(`📊 Top 3 similarities: ${limited.slice(0, 3).map(s => s.semanticSimilarity.toFixed(3)).join(', ')}`);

    // Return articles with updated metadata
    return limited.map(s => ({
      ...s.article,
      semanticScore: s.semanticSimilarity,
      combinedScore: s.combinedScore
    }));
  }

  /**
   * Rerank Europe PMC articles
   */
  async rerankEuropePMCArticles(
    clinicalQuery: string,
    articles: EuropePMCArticle[],
    config: SemanticRerankingConfig = { minSimilarityThreshold: 0.45 }
  ): Promise<EuropePMCArticle[]> {
    if (articles.length === 0) return [];

    console.log(`🔍 Semantic reranking ${articles.length} Europe PMC articles...`);

    const queryEmbedding = await this.embedder.embedQuery(clinicalQuery);

    const articleEmbeddings = await this.embedder.embedArticlesBatch(
      articles.map(a => ({
        title: a.title,
        abstract: a.abstractText || ''
      }))
    );

    const scoredArticles = articles.map((article, i) => ({
      article,
      semanticSimilarity: MedCPTEmbedder.cosineSimilarity(
        queryEmbedding,
        articleEmbeddings[i]
      )
    }));

    scoredArticles.sort((a, b) => b.semanticSimilarity - a.semanticSimilarity);

    const filtered = scoredArticles.filter(
      s => s.semanticSimilarity >= config.minSimilarityThreshold
    );

    const limited = config.topK ? filtered.slice(0, config.topK) : filtered;

    console.log(`✅ Europe PMC semantic filter: ${articles.length} → ${limited.length} articles`);

    return limited.map(s => ({
      ...s.article,
      semanticScore: s.semanticSimilarity
    }));
  }

  /**
   * Rerank Cochrane reviews
   */
  async rerankCochraneReviews(
    clinicalQuery: string,
    reviews: CochraneReview[],
    config: SemanticRerankingConfig = { minSimilarityThreshold: 0.45 }
  ): Promise<CochraneReview[]> {
    if (reviews.length === 0) return [];

    console.log(`🔍 Semantic reranking ${reviews.length} Cochrane reviews...`);

    const queryEmbedding = await this.embedder.embedQuery(clinicalQuery);

    const reviewEmbeddings = await this.embedder.embedArticlesBatch(
      reviews.map(r => ({
        title: r.title,
        abstract: r.abstract || ''  // CochraneReview has abstract field
      }))
    );

    const scoredReviews = reviews.map((review, i) => ({
      review,
      semanticSimilarity: MedCPTEmbedder.cosineSimilarity(
        queryEmbedding,
        reviewEmbeddings[i]
      )
    }));

    scoredReviews.sort((a, b) => b.semanticSimilarity - a.semanticSimilarity);

    const filtered = scoredReviews.filter(
      s => s.semanticSimilarity >= config.minSimilarityThreshold
    );

    const limited = config.topK ? filtered.slice(0, config.topK) : filtered;

    console.log(`✅ Cochrane semantic filter: ${reviews.length} → ${limited.length} reviews`);

    return limited.map(s => ({
      ...s.review,
      semanticScore: s.semanticSimilarity
    }));
  }

  /**
   * Rerank PMC articles
   */
  async rerankPMCArticles(
    clinicalQuery: string,
    articles: PMCArticle[],
    config: SemanticRerankingConfig = { minSimilarityThreshold: 0.45 }
  ): Promise<PMCArticle[]> {
    if (articles.length === 0) return [];

    console.log(`🔍 Semantic reranking ${articles.length} PMC articles...`);

    const queryEmbedding = await this.embedder.embedQuery(clinicalQuery);

    const articleEmbeddings = await this.embedder.embedArticlesBatch(
      articles.map(a => ({
        title: a.title,
        abstract: ''  // PMCArticle has no abstract field
      }))
    );

    const scoredArticles = articles.map((article, i) => ({
      article,
      semanticSimilarity: MedCPTEmbedder.cosineSimilarity(
        queryEmbedding,
        articleEmbeddings[i]
      )
    }));

    scoredArticles.sort((a, b) => b.semanticSimilarity - a.semanticSimilarity);

    const filtered = scoredArticles.filter(
      s => s.semanticSimilarity >= config.minSimilarityThreshold
    );

    const limited = config.topK ? filtered.slice(0, config.topK) : filtered;

    console.log(`✅ PMC semantic filter: ${articles.length} → ${limited.length} articles`);

    return limited.map(s => ({
      ...s.article,
      semanticScore: s.semanticSimilarity
    }));
  }

  /**
   * Generic semantic reranking for any article type
   * Useful for new evidence sources
   */
  async rerankGenericArticles<T extends { title: string; abstract?: string }>(
    clinicalQuery: string,
    articles: T[],
    config: SemanticRerankingConfig = { minSimilarityThreshold: 0.45 }
  ): Promise<T[]> {
    if (articles.length === 0) return [];

    console.log(`🔍 Semantic reranking ${articles.length} generic articles...`);

    const queryEmbedding = await this.embedder.embedQuery(clinicalQuery);

    const articleEmbeddings = await this.embedder.embedArticlesBatch(
      articles.map(a => ({
        title: a.title,
        abstract: a.abstract || ''
      }))
    );

    const scoredArticles = articles.map((article, i) => ({
      article,
      semanticSimilarity: MedCPTEmbedder.cosineSimilarity(
        queryEmbedding,
        articleEmbeddings[i]
      )
    }));

    scoredArticles.sort((a, b) => b.semanticSimilarity - a.semanticSimilarity);

    const filtered = scoredArticles.filter(
      s => s.semanticSimilarity >= config.minSimilarityThreshold
    );

    const limited = config.topK ? filtered.slice(0, config.topK) : filtered;

    console.log(`✅ Generic semantic filter: ${articles.length} → ${limited.length} articles`);

    return limited.map(s => ({
      ...s.article,
      semanticScore: s.semanticSimilarity
    }));
  }

  /**
   * Batch rerank multiple evidence sources efficiently
   * Processes all sources with single query embedding
   */
  async rerankAllEvidenceSources(
    clinicalQuery: string,
    evidence: {
      pubmedArticles: PubMedArticle[];
      europePMCArticles: EuropePMCArticle[];
      cochraneReviews: CochraneReview[];
      pmcArticles: PMCArticle[];
    },
    config: SemanticRerankingConfig = { minSimilarityThreshold: 0.45 }
  ): Promise<{
    pubmedArticles: PubMedArticle[];
    europePMCArticles: EuropePMCArticle[];
    cochraneReviews: CochraneReview[];
    pmcArticles: PMCArticle[];
  }> {
    console.log(`🔄 Batch semantic reranking all evidence sources...`);

    // Process all sources in parallel for efficiency
    const [pubmedArticles, europePMCArticles, cochraneReviews, pmcArticles] = await Promise.all([
      this.rerankPubMedArticles(clinicalQuery, evidence.pubmedArticles, config),
      this.rerankEuropePMCArticles(clinicalQuery, evidence.europePMCArticles, config),
      this.rerankCochraneReviews(clinicalQuery, evidence.cochraneReviews, config),
      this.rerankPMCArticles(clinicalQuery, evidence.pmcArticles, config)
    ]);

    const totalBefore = evidence.pubmedArticles.length + evidence.europePMCArticles.length +
      evidence.cochraneReviews.length + evidence.pmcArticles.length;
    const totalAfter = pubmedArticles.length + europePMCArticles.length +
      cochraneReviews.length + pmcArticles.length;

    console.log(`✅ Batch semantic reranking complete: ${totalBefore} → ${totalAfter} articles`);

    return {
      pubmedArticles,
      europePMCArticles,
      cochraneReviews,
      pmcArticles
    };
  }

  /**
   * Get semantic similarity statistics for debugging
   */
  async getSemanticStats(
    clinicalQuery: string,
    articles: Array<{ title: string; abstract?: string }>
  ): Promise<{
    mean: number;
    median: number;
    min: number;
    max: number;
    aboveThreshold: number;
    totalArticles: number;
  }> {
    if (articles.length === 0) {
      return { mean: 0, median: 0, min: 0, max: 0, aboveThreshold: 0, totalArticles: 0 };
    }

    const queryEmbedding = await this.embedder.embedQuery(clinicalQuery);
    const articleEmbeddings = await this.embedder.embedArticlesBatch(articles);

    const similarities = articleEmbeddings.map(embedding =>
      MedCPTEmbedder.cosineSimilarity(queryEmbedding, embedding)
    );

    similarities.sort((a, b) => a - b);

    const mean = similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length;
    const median = similarities[Math.floor(similarities.length / 2)];
    const min = similarities[0];
    const max = similarities[similarities.length - 1];
    const aboveThreshold = similarities.filter(sim => sim >= 0.45).length;

    return {
      mean: Math.round(mean * 1000) / 1000,
      median: Math.round(median * 1000) / 1000,
      min: Math.round(min * 1000) / 1000,
      max: Math.round(max * 1000) / 1000,
      aboveThreshold,
      totalArticles: articles.length
    };
  }
}

// Export singleton instance
let semanticRerankerInstance: SemanticReranker | null = null;

export function getSemanticReranker(): SemanticReranker {
  if (!semanticRerankerInstance) {
    semanticRerankerInstance = new SemanticReranker();
  }
  return semanticRerankerInstance;
}