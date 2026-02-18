/**
 * Hybrid Search with Reciprocal Rank Fusion (RRF)
 * 
 * Combines keyword-based and semantic search results using RRF algorithm.
 * RRF is a simple yet effective method for combining ranked lists.
 * 
 * Algorithm: score(d) = Σ 1 / (k + rank(d))
 * where k is a constant (typically 60) and rank(d) is the rank of document d
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

export interface RankedResult<T = any> {
  item: T;
  score: number;
  sources: string[]; // Which searches found this item
  keywordRank?: number;
  semanticRank?: number;
}

export interface HybridSearchOptions {
  k?: number; // RRF constant (default: 60)
  keywordWeight?: number; // Weight for keyword results (default: 1.0)
  semanticWeight?: number; // Weight for semantic results (default: 1.0)
}

/**
 * Reciprocal Rank Fusion (RRF) implementation
 */
export class HybridSearch {
  /**
   * Combine two ranked lists using Reciprocal Rank Fusion
   * 
   * @param keywordResults - Results from keyword search (ordered by relevance)
   * @param semanticResults - Results from semantic search (ordered by similarity)
   * @param getId - Function to extract unique ID from result
   * @param options - RRF options
   */
  fuseResults<T>(
    keywordResults: T[],
    semanticResults: T[],
    getId: (item: T) => string,
    options: HybridSearchOptions = {}
  ): RankedResult<T>[] {
    const {
      k = 60,
      keywordWeight = 1.0,
      semanticWeight = 1.0,
    } = options;

    // Map to store combined scores
    const scoreMap = new Map<string, {
      item: T;
      score: number;
      sources: Set<string>;
      keywordRank?: number;
      semanticRank?: number;
    }>();

    // Process keyword results
    keywordResults.forEach((item, rank) => {
      const id = getId(item);
      const score = keywordWeight / (k + rank + 1);
      
      scoreMap.set(id, {
        item,
        score,
        sources: new Set(['keyword']),
        keywordRank: rank,
      });
    });

    // Process semantic results
    semanticResults.forEach((item, rank) => {
      const id = getId(item);
      const score = semanticWeight / (k + rank + 1);
      
      const existing = scoreMap.get(id);
      if (existing) {
        // Item found in both searches - combine scores
        existing.score += score;
        existing.sources.add('semantic');
        existing.semanticRank = rank;
      } else {
        // Item only in semantic search
        scoreMap.set(id, {
          item,
          score,
          sources: new Set(['semantic']),
          semanticRank: rank,
        });
      }
    });

    // Convert to array and sort by score (descending)
    const fusedResults: RankedResult<T>[] = Array.from(scoreMap.values())
      .map(entry => ({
        item: entry.item,
        score: entry.score,
        sources: Array.from(entry.sources),
        keywordRank: entry.keywordRank,
        semanticRank: entry.semanticRank,
      }))
      .sort((a, b) => b.score - a.score);

    return fusedResults;
  }

  /**
   * Deduplicate results by ID
   * Keeps the first occurrence of each unique ID
   */
  deduplicate<T>(
    results: T[],
    getId: (item: T) => string
  ): T[] {
    const seen = new Set<string>();
    const deduplicated: T[] = [];

    for (const item of results) {
      const id = getId(item);
      if (!seen.has(id)) {
        seen.add(id);
        deduplicated.push(item);
      }
    }

    return deduplicated;
  }

  /**
   * Combine multiple ranked lists using RRF
   * Generalized version for more than 2 lists
   */
  fuseMultiple<T>(
    rankedLists: T[][],
    getId: (item: T) => string,
    options: HybridSearchOptions = {}
  ): RankedResult<T>[] {
    const { k = 60 } = options;

    // Map to store combined scores
    const scoreMap = new Map<string, {
      item: T;
      score: number;
      sources: Set<number>;
      ranks: number[];
    }>();

    // Process each ranked list
    rankedLists.forEach((list, listIndex) => {
      list.forEach((item, rank) => {
        const id = getId(item);
        const score = 1 / (k + rank + 1);
        
        const existing = scoreMap.get(id);
        if (existing) {
          existing.score += score;
          existing.sources.add(listIndex);
          existing.ranks[listIndex] = rank;
        } else {
          const ranks = new Array(rankedLists.length).fill(undefined);
          ranks[listIndex] = rank;
          scoreMap.set(id, {
            item,
            score,
            sources: new Set([listIndex]),
            ranks,
          });
        }
      });
    });

    // Convert to array and sort by score (descending)
    const fusedResults: RankedResult<T>[] = Array.from(scoreMap.values())
      .map(entry => ({
        item: entry.item,
        score: entry.score,
        sources: Array.from(entry.sources).map(i => `list_${i}`),
      }))
      .sort((a, b) => b.score - a.score);

    return fusedResults;
  }
}

/**
 * Singleton instance
 */
let hybridSearchInstance: HybridSearch | null = null;

/**
 * Get the singleton hybrid search instance
 */
export function getHybridSearch(): HybridSearch {
  if (!hybridSearchInstance) {
    hybridSearchInstance = new HybridSearch();
  }
  return hybridSearchInstance;
}

/**
 * Convenience function for RRF fusion
 */
export function fuseSearchResults<T>(
  keywordResults: T[],
  semanticResults: T[],
  getId: (item: T) => string,
  options?: HybridSearchOptions
): T[] {
  const hybridSearch = getHybridSearch();
  const fused = hybridSearch.fuseResults(keywordResults, semanticResults, getId, options);
  return fused.map(result => result.item);
}
