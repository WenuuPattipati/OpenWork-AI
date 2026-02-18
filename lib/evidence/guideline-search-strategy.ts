/**
 * Guideline Search Strategy - Progressive Search for Clinical Guidelines
 * 
 * This module implements progressive search relaxation to eliminate false
 * "limited evidence" responses for guideline queries.
 * 
 * WHY THIS EXISTS:
 * - System searches "2024 KDIGO hyperkalemia" literally → 0 results → "limited evidence"
 * - Should search progressively: exact → relaxed year → relaxed topic → general guideline + trials
 * - Users ask for specific guidelines that may not exist as standalone documents
 * - Need to find related evidence even when exact match doesn't exist
 * 
 * WHAT IT DOES:
 * - Generates primary query (exact match attempt)
 * - Generates relaxed queries (drop year, drop specifics)
 * - Generates fallback queries (general guideline + related trials)
 * - Implements progressive search with min_evidence_threshold
 * - Provides transparent messaging when exact guideline doesn't exist
 * 
 * INTEGRATION POINT:
 * - Called during query enhancement (Step 5)
 * - Used by evidence gathering to search progressively
 * - Used by sufficiency scorer to determine if fallbacks needed
 */

import type { ClarifiedQuery } from './query-clarifier';

// ============================================================================
// INTERFACES
// ============================================================================

export interface GuidelineSearchStrategy {
  is_guideline_query: boolean;
  primary_query: string;              // Exact match attempt
  relaxed_queries: string[];          // Progressive relaxation
  fallback_queries: string[];         // General evidence when guideline missing
  min_evidence_threshold: number;     // Minimum articles before declaring "limited"
  guideline_bodies: string[];         // Organizations mentioned (KDIGO, ACC/AHA, etc.)
  search_terms: {
    disease: string[];                // Disease/condition terms
    intervention: string[];           // Intervention/management terms
    guideline_specific: string[];    // Guideline-specific terms
  };
  messaging: {
    exact_found: string;              // Message when exact guideline found
    relaxed_found: string;            // Message when relaxed search succeeds
    fallback_used: string;            // Message when using general evidence
  };
}

export interface SearchResult {
  query: string;
  strategy_level: 'primary' | 'relaxed' | 'fallback';
  articles_found: number;
  sufficient: boolean;
}

// ============================================================================
// GUIDELINE SEARCH STRATEGY GENERATION
// ============================================================================

/**
 * Generate guideline search strategy from clarified query
 * 
 * @param clarifiedQuery - Structured query from query clarifier
 * @param originalQuery - Original user query
 * @returns Guideline search strategy with progressive queries
 */
export function generateGuidelineSearchStrategy(
  clarifiedQuery: ClarifiedQuery,
  originalQuery: string
): GuidelineSearchStrategy {
  const is_guideline_query = clarifiedQuery.decision_type === 'guideline';
  
  if (!is_guideline_query) {
    // Not a guideline query - return simple strategy
    return {
      is_guideline_query: false,
      primary_query: originalQuery,
      relaxed_queries: [],
      fallback_queries: [],
      min_evidence_threshold: 3,
      guideline_bodies: [],
      search_terms: {
        disease: [],
        intervention: [],
        guideline_specific: [],
      },
      messaging: {
        exact_found: '',
        relaxed_found: '',
        fallback_used: '',
      },
    };
  }
  
  // Extract search terms
  const disease_terms = extractDiseaseTerms(clarifiedQuery);
  const intervention_terms = extractInterventionTerms(clarifiedQuery);
  const guideline_specific = extractGuidelineSpecificTerms(clarifiedQuery);
  
  // Generate primary query (exact match)
  const primary_query = buildPrimaryQuery(
    clarifiedQuery,
    disease_terms,
    intervention_terms,
    guideline_specific
  );
  
  // Generate relaxed queries (progressive relaxation)
  const relaxed_queries = buildRelaxedQueries(
    clarifiedQuery,
    disease_terms,
    intervention_terms,
    guideline_specific
  );
  
  // Generate fallback queries (general evidence)
  const fallback_queries = buildFallbackQueries(
    clarifiedQuery,
    disease_terms,
    intervention_terms
  );
  
  // Generate messaging
  const messaging = buildMessaging(clarifiedQuery);
  
  return {
    is_guideline_query: true,
    primary_query,
    relaxed_queries,
    fallback_queries,
    min_evidence_threshold: 3, // Need at least 3 relevant articles
    guideline_bodies: clarifiedQuery.guideline_bodies,
    search_terms: {
      disease: disease_terms,
      intervention: intervention_terms,
      guideline_specific,
    },
    messaging,
  };
}

/**
 * Extract disease terms from clarified query
 */
function extractDiseaseTerms(clarifiedQuery: ClarifiedQuery): string[] {
  const terms: string[] = [];
  
  // From population
  if (clarifiedQuery.population) {
    const pop = clarifiedQuery.population.toLowerCase();
    
    // Common disease patterns
    if (pop.includes('ckd') || pop.includes('chronic kidney')) {
      terms.push('chronic kidney disease', 'CKD');
    }
    if (pop.includes('hyperkalemia') || pop.includes('potassium')) {
      terms.push('hyperkalemia');
    }
    if (pop.includes('heart failure') || pop.includes('hf')) {
      terms.push('heart failure');
    }
    if (pop.includes('atrial fibrillation') || pop.includes('af')) {
      terms.push('atrial fibrillation');
    }
    if (pop.includes('diabetes')) {
      terms.push('diabetes');
    }
  }
  
  // From key biomarkers
  if (clarifiedQuery.key_biomarkers) {
    terms.push(...clarifiedQuery.key_biomarkers);
  }
  
  return [...new Set(terms)]; // Deduplicate
}

/**
 * Extract intervention terms from clarified query
 */
function extractInterventionTerms(clarifiedQuery: ClarifiedQuery): string[] {
  const terms: string[] = [];
  
  // From intervention_or_index
  if (clarifiedQuery.intervention_or_index) {
    const intervention = clarifiedQuery.intervention_or_index.toLowerCase();
    
    if (intervention.includes('management') || intervention.includes('managing')) {
      terms.push('management');
    }
    if (intervention.includes('treatment')) {
      terms.push('treatment');
    }
    if (intervention.includes('therapy')) {
      terms.push('therapy');
    }
  }
  
  // From key drugs
  if (clarifiedQuery.key_drugs && clarifiedQuery.key_drugs.length > 0) {
    terms.push(...clarifiedQuery.key_drugs);
  }
  
  return [...new Set(terms)]; // Deduplicate
}

/**
 * Extract guideline-specific terms
 */
function extractGuidelineSpecificTerms(clarifiedQuery: ClarifiedQuery): string[] {
  const terms: string[] = [];
  
  // Add guideline bodies
  if (clarifiedQuery.guideline_bodies && clarifiedQuery.guideline_bodies.length > 0) {
    terms.push(...clarifiedQuery.guideline_bodies);
  }
  
  // Add timeframe if present
  if (clarifiedQuery.timeframe) {
    terms.push(clarifiedQuery.timeframe);
  }
  
  // Add guideline-specific keywords
  terms.push('guideline', 'recommendation', 'consensus', 'statement');
  
  return [...new Set(terms)]; // Deduplicate
}

/**
 * Build primary query (exact match attempt)
 */
function buildPrimaryQuery(
  clarifiedQuery: ClarifiedQuery,
  disease_terms: string[],
  intervention_terms: string[],
  guideline_specific: string[]
): string {
  const parts: string[] = [];
  
  // Add guideline body (most specific)
  if (clarifiedQuery.guideline_bodies.length > 0) {
    parts.push(clarifiedQuery.guideline_bodies[0]); // Use first/primary
  }
  
  // Add timeframe if present
  if (clarifiedQuery.timeframe) {
    parts.push(clarifiedQuery.timeframe);
  }
  
  // Add disease terms
  if (disease_terms.length > 0) {
    parts.push(...disease_terms.slice(0, 2)); // Top 2 disease terms
  }
  
  // Add intervention terms
  if (intervention_terms.length > 0) {
    parts.push(...intervention_terms.slice(0, 2)); // Top 2 intervention terms
  }
  
  // Add "guideline"
  parts.push('guideline');
  
  return parts.join(' ');
}

/**
 * Build relaxed queries (progressive relaxation)
 */
function buildRelaxedQueries(
  clarifiedQuery: ClarifiedQuery,
  disease_terms: string[],
  intervention_terms: string[],
  guideline_specific: string[]
): string[] {
  const queries: string[] = [];
  
  // Relaxation 1: Drop timeframe (year)
  if (clarifiedQuery.timeframe && clarifiedQuery.guideline_bodies.length > 0) {
    const parts = [
      clarifiedQuery.guideline_bodies[0],
      ...disease_terms.slice(0, 2),
      ...intervention_terms.slice(0, 1),
      'guideline'
    ];
    queries.push(parts.join(' '));
  }
  
  // Relaxation 2: Drop specific intervention, keep disease
  if (clarifiedQuery.guideline_bodies.length > 0 && disease_terms.length > 0) {
    const parts = [
      clarifiedQuery.guideline_bodies[0],
      disease_terms[0], // Primary disease only
      'guideline'
    ];
    queries.push(parts.join(' '));
  }
  
  // Relaxation 3: General guideline body + year (if available)
  if (clarifiedQuery.guideline_bodies.length > 0) {
    const parts = [clarifiedQuery.guideline_bodies[0]];
    if (clarifiedQuery.timeframe) {
      parts.push(clarifiedQuery.timeframe);
    }
    parts.push('guideline');
    queries.push(parts.join(' '));
  }
  
  return queries;
}

/**
 * Build fallback queries (general evidence when guideline missing)
 */
function buildFallbackQueries(
  clarifiedQuery: ClarifiedQuery,
  disease_terms: string[],
  intervention_terms: string[]
): string[] {
  const queries: string[] = [];
  
  // Fallback 1: Disease + intervention + systematic review
  if (disease_terms.length > 0 && intervention_terms.length > 0) {
    queries.push(`${disease_terms[0]} ${intervention_terms[0]} systematic review meta-analysis`);
  }
  
  // Fallback 2: Disease + intervention + RCT
  if (disease_terms.length > 0 && intervention_terms.length > 0) {
    queries.push(`${disease_terms[0]} ${intervention_terms[0]} randomized controlled trial`);
  }
  
  // Fallback 3: Disease + key drugs (if available)
  if (disease_terms.length > 0 && clarifiedQuery.key_drugs.length > 0) {
    const drugs = clarifiedQuery.key_drugs.slice(0, 2).join(' ');
    queries.push(`${disease_terms[0]} ${drugs} clinical trial`);
  }
  
  // Fallback 4: General disease management
  if (disease_terms.length > 0) {
    queries.push(`${disease_terms[0]} management evidence-based`);
  }
  
  return queries;
}

/**
 * Build messaging for different search outcomes
 */
function buildMessaging(clarifiedQuery: ClarifiedQuery): {
  exact_found: string;
  relaxed_found: string;
  fallback_used: string;
} {
  const guideline_body = clarifiedQuery.guideline_bodies[0] || 'guideline';
  const timeframe = clarifiedQuery.timeframe || 'recent';
  const disease = clarifiedQuery.population || 'this condition';
  
  return {
    exact_found: `Found ${timeframe} ${guideline_body} guidelines addressing this specific question.`,
    
    relaxed_found: `No dedicated ${timeframe} ${guideline_body} guideline for this specific scenario was found. However, related ${guideline_body} guidelines and high-quality evidence support the following approach.`,
    
    fallback_used: `No specific ${guideline_body} guideline for this scenario was identified. The following recommendations are based on systematic reviews, randomized controlled trials, and expert consensus for ${disease}.`,
  };
}

// ============================================================================
// PROGRESSIVE SEARCH EXECUTION
// ============================================================================

/**
 * Execute progressive search strategy
 * 
 * This function would be called by the evidence engine to search progressively
 * until sufficient evidence is found.
 * 
 * @param strategy - Guideline search strategy
 * @param searchFunction - Function to execute search (returns article count)
 * @returns Search result with query used and articles found
 */
export async function executeProgressiveSearch(
  strategy: GuidelineSearchStrategy,
  searchFunction: (query: string) => Promise<number>
): Promise<SearchResult> {
  // Try primary query first
  console.log(`🔍 Guideline Search: Trying primary query...`);
  const primaryCount = await searchFunction(strategy.primary_query);
  
  if (primaryCount >= strategy.min_evidence_threshold) {
    console.log(`✅ Primary query succeeded: ${primaryCount} articles found`);
    return {
      query: strategy.primary_query,
      strategy_level: 'primary',
      articles_found: primaryCount,
      sufficient: true,
    };
  }
  
  console.log(`⚠️  Primary query insufficient: ${primaryCount} articles (need ${strategy.min_evidence_threshold})`);
  
  // Try relaxed queries
  for (let i = 0; i < strategy.relaxed_queries.length; i++) {
    const query = strategy.relaxed_queries[i];
    console.log(`🔍 Guideline Search: Trying relaxed query ${i + 1}/${strategy.relaxed_queries.length}...`);
    
    const count = await searchFunction(query);
    
    if (count >= strategy.min_evidence_threshold) {
      console.log(`✅ Relaxed query succeeded: ${count} articles found`);
      return {
        query,
        strategy_level: 'relaxed',
        articles_found: count,
        sufficient: true,
      };
    }
    
    console.log(`⚠️  Relaxed query ${i + 1} insufficient: ${count} articles`);
  }
  
  // Try fallback queries
  let totalFallbackCount = 0;
  const fallbackResults: string[] = [];
  
  for (let i = 0; i < strategy.fallback_queries.length; i++) {
    const query = strategy.fallback_queries[i];
    console.log(`🔍 Guideline Search: Trying fallback query ${i + 1}/${strategy.fallback_queries.length}...`);
    
    const count = await searchFunction(query);
    totalFallbackCount += count;
    
    if (count > 0) {
      fallbackResults.push(query);
    }
    
    // Check if we have enough evidence from fallbacks
    if (totalFallbackCount >= strategy.min_evidence_threshold) {
      console.log(`✅ Fallback queries succeeded: ${totalFallbackCount} articles found`);
      return {
        query: fallbackResults.join(' OR '),
        strategy_level: 'fallback',
        articles_found: totalFallbackCount,
        sufficient: true,
      };
    }
  }
  
  console.log(`❌ All search strategies insufficient: ${totalFallbackCount} total articles`);
  
  return {
    query: strategy.primary_query,
    strategy_level: 'primary',
    articles_found: totalFallbackCount,
    sufficient: false,
  };
}

/**
 * Get appropriate messaging based on search result
 */
export function getSearchResultMessage(
  strategy: GuidelineSearchStrategy,
  result: SearchResult
): string {
  if (!strategy.is_guideline_query) {
    return '';
  }
  
  switch (result.strategy_level) {
    case 'primary':
      return result.sufficient ? strategy.messaging.exact_found : '';
    case 'relaxed':
      return strategy.messaging.relaxed_found;
    case 'fallback':
      return strategy.messaging.fallback_used;
    default:
      return '';
  }
}

/**
 * Quick check if query is a guideline query
 * Used for fast path optimization
 */
export function isGuidelineQuery(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  const guidelineKeywords = [
    'guideline', 'recommendation', 'consensus', 'statement',
    'kdigo', 'acc/aha', 'esc', 'idsa', 'ada', 'ats', 'who', 'cdc', 'nice',
    'standards of care', 'practice guideline', 'clinical practice guideline'
  ];
  
  return guidelineKeywords.some(keyword => lowerQuery.includes(keyword));
}

/**
 * Extract guideline bodies from query (fast pattern-based)
 */
export function extractGuidelineBodies(query: string): string[] {
  const lowerQuery = query.toLowerCase();
  const bodies: string[] = [];
  
  const knownBodies = [
    'KDIGO', 'KDOQI', 'ACC/AHA', 'ACC', 'AHA', 'ESC', 'IDSA', 'ADA',
    'ATS', 'ERS', 'NCCN', 'ASCO', 'WHO', 'CDC', 'NICE', 'AAP'
  ];
  
  for (const body of knownBodies) {
    if (lowerQuery.includes(body.toLowerCase())) {
      bodies.push(body);
    }
  }
  
  return bodies;
}
