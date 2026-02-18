/**
 * Semantic Search Configuration
 * 
 * Centralized configuration for semantic search features.
 * Provides safe defaults and validation.
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

export interface SemanticSearchConfig {
  // Reranking options
  topK: number; // Number of results to rerank
  minSimilarity: number; // Minimum similarity threshold
  skipIfFewResults: number; // Skip reranking if fewer than N results
  enableReranking: boolean; // Enable/disable semantic reranking
  
  // Caching options
  useCache: boolean; // Enable caching
  cacheTTL: number; // Cache TTL in seconds
  
  // Hybrid search options
  rrfConstant: number; // RRF constant (k)
  keywordWeight: number; // Weight for keyword results
  semanticWeight: number; // Weight for semantic results
  
  // PICO extraction options
  enablePICO: boolean; // Enable PICO extraction
  maxExpandedQueries: number; // Maximum number of expanded queries
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: SemanticSearchConfig = {
  // Reranking
  topK: 50,
  minSimilarity: 0.0,
  skipIfFewResults: 10,
  enableReranking: true,
  
  // Caching
  useCache: true,
  cacheTTL: 24 * 60 * 60, // 24 hours
  
  // Hybrid search
  rrfConstant: 60,
  keywordWeight: 1.0,
  semanticWeight: 1.0,
  
  // PICO extraction
  enablePICO: true,
  maxExpandedQueries: 5,
};

/**
 * Current configuration (mutable)
 */
let currentConfig: SemanticSearchConfig = { ...DEFAULT_CONFIG };

/**
 * Validate configuration values
 */
function validateConfig(config: Partial<SemanticSearchConfig>): string[] {
  const errors: string[] = [];

  if (config.topK !== undefined && (config.topK < 1 || config.topK > 1000)) {
    errors.push('topK must be between 1 and 1000');
  }

  if (config.minSimilarity !== undefined && (config.minSimilarity < 0 || config.minSimilarity > 1)) {
    errors.push('minSimilarity must be between 0 and 1');
  }

  if (config.skipIfFewResults !== undefined && config.skipIfFewResults < 0) {
    errors.push('skipIfFewResults must be non-negative');
  }

  if (config.cacheTTL !== undefined && config.cacheTTL < 0) {
    errors.push('cacheTTL must be non-negative');
  }

  if (config.rrfConstant !== undefined && config.rrfConstant < 1) {
    errors.push('rrfConstant must be at least 1');
  }

  if (config.keywordWeight !== undefined && config.keywordWeight < 0) {
    errors.push('keywordWeight must be non-negative');
  }

  if (config.semanticWeight !== undefined && config.semanticWeight < 0) {
    errors.push('semanticWeight must be non-negative');
  }

  if (config.maxExpandedQueries !== undefined && (config.maxExpandedQueries < 1 || config.maxExpandedQueries > 20)) {
    errors.push('maxExpandedQueries must be between 1 and 20');
  }

  return errors;
}

/**
 * Get current configuration
 */
export function getSemanticConfig(): SemanticSearchConfig {
  return { ...currentConfig };
}

/**
 * Update configuration
 * Validates and applies safe defaults for invalid values
 */
export function updateSemanticConfig(updates: Partial<SemanticSearchConfig>): void {
  const errors = validateConfig(updates);

  if (errors.length > 0) {
    console.warn('[SemanticConfig] Invalid configuration values:', errors.join(', '));
    console.warn('[SemanticConfig] Using safe defaults for invalid values');
  }

  // Apply valid updates
  currentConfig = {
    ...currentConfig,
    ...updates,
  };

  // Ensure values are within safe ranges
  currentConfig.topK = Math.max(1, Math.min(1000, currentConfig.topK));
  currentConfig.minSimilarity = Math.max(0, Math.min(1, currentConfig.minSimilarity));
  currentConfig.skipIfFewResults = Math.max(0, currentConfig.skipIfFewResults);
  currentConfig.cacheTTL = Math.max(0, currentConfig.cacheTTL);
  currentConfig.rrfConstant = Math.max(1, currentConfig.rrfConstant);
  currentConfig.keywordWeight = Math.max(0, currentConfig.keywordWeight);
  currentConfig.semanticWeight = Math.max(0, currentConfig.semanticWeight);
  currentConfig.maxExpandedQueries = Math.max(1, Math.min(20, currentConfig.maxExpandedQueries));

  console.log('[SemanticConfig] Configuration updated');
}

/**
 * Reset configuration to defaults
 */
export function resetSemanticConfig(): void {
  currentConfig = { ...DEFAULT_CONFIG };
  console.log('[SemanticConfig] Configuration reset to defaults');
}

/**
 * Get default configuration
 */
export function getDefaultConfig(): SemanticSearchConfig {
  return { ...DEFAULT_CONFIG };
}
