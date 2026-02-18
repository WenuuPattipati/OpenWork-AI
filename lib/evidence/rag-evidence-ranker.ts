/**
 * RAG EVIDENCE RANKER - Smart Filtering Component
 * 
 * Ranks and filters evidence based on query relevance and mode-specific priorities
 * Ensures only the most relevant evidence reaches the AI model
 */

import type { EvidencePackage } from './engine';
import type { QueryTags } from './rag-query-builder';

export interface RAGRankingConfig {
  mode: 'doctor' | 'general';
  queryTags: QueryTags;
  detectedScenario: string | null;
  maxEvidenceItems: number;
  prioritizeRecent: boolean;
  requireOpenAccess: boolean;
}

export interface RankedEvidence {
  item: any;
  relevanceScore: number;
  source: string;
  evidenceType: 'guideline' | 'trial' | 'review' | 'education' | 'lifestyle';
  accessType: 'open' | 'restricted';
  recency: 'recent' | 'older';
}

/**
 * Main RAG evidence ranking function
 */
export function rankRAGEvidence(
  evidence: EvidencePackage,
  config: RAGRankingConfig
): EvidencePackage {
  
  console.log(`🎯 RAG Evidence Ranking (${config.mode.toUpperCase()} MODE)`);
  console.log(`📊 Input evidence: ${getTotalEvidenceCount(evidence)} items`);
  
  // Step 1: Extract and score all evidence items
  const allItems = extractAllEvidenceItems(evidence);
  const scoredItems = scoreEvidenceRelevance(allItems, config);
  
  // Step 2: Apply mode-specific filtering
  const filteredItems = applyModeSpecificFiltering(scoredItems, config);
  
  // Step 3: Rank by relevance score
  const rankedItems = filteredItems.sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  // Step 4: Apply limits and build final evidence package
  const finalItems = rankedItems.slice(0, config.maxEvidenceItems);
  const rankedEvidence = buildRankedEvidencePackage(finalItems, evidence);
  
  console.log(`✅ RAG ranking complete: ${getTotalEvidenceCount(rankedEvidence)} items selected`);
  console.log(`📈 Top evidence types:`, getEvidenceTypeDistribution(finalItems));
  
  return rankedEvidence;
}

/**
 * Extract all evidence items with metadata
 */
function extractAllEvidenceItems(evidence: EvidencePackage): RankedEvidence[] {
  const items: RankedEvidence[] = [];
  
  // Guidelines (highest priority)
  evidence.guidelines.forEach(item => {
    items.push({
      item,
      relevanceScore: 0, // Will be calculated
      source: 'guidelines',
      evidenceType: 'guideline',
      accessType: 'open', // Guidelines are usually open
      recency: parseInt(item.year) >= 2022 ? 'recent' : 'older'
    });
  });
  
  // WHO Guidelines
  evidence.whoGuidelines.forEach(item => {
    items.push({
      item,
      relevanceScore: 0,
      source: 'who_guidelines',
      evidenceType: 'guideline',
      accessType: 'open',
      recency: 'recent' // WHO guidelines are usually recent
    });
  });
  
  // CDC Guidelines
  evidence.cdcGuidelines.forEach(item => {
    items.push({
      item,
      relevanceScore: 0,
      source: 'cdc_guidelines',
      evidenceType: 'guideline',
      accessType: 'open',
      recency: 'recent'
    });
  });
  
  // NICE Guidelines
  evidence.niceGuidelines.forEach(item => {
    items.push({
      item,
      relevanceScore: 0,
      source: 'nice_guidelines',
      evidenceType: 'guideline',
      accessType: 'open',
      recency: 'recent'
    });
  });
  
  // Landmark Trials
  evidence.landmarkTrials.forEach(item => {
    items.push({
      item,
      relevanceScore: 0,
      source: 'landmark_trials',
      evidenceType: 'trial',
      accessType: 'open', // Usually accessible
      recency: item.year >= 2020 ? 'recent' : 'older'
    });
  });
  
  // Cochrane Reviews
  evidence.cochraneReviews.forEach(item => {
    items.push({
      item,
      relevanceScore: 0,
      source: 'cochrane',
      evidenceType: 'review',
      accessType: 'restricted', // Often paywalled
      recency: new Date(item.publicationDate).getFullYear() >= 2022 ? 'recent' : 'older'
    });
  });
  
  // PubMed Articles
  evidence.pubmedArticles.forEach(item => {
    items.push({
      item,
      relevanceScore: 0,
      source: 'pubmed_articles',
      evidenceType: 'trial',
      accessType: 'restricted', // Often paywalled
      recency: new Date(item.publicationDate).getFullYear() >= 2022 ? 'recent' : 'older'
    });
  });
  
  // PubMed Reviews
  evidence.pubmedReviews.forEach(item => {
    items.push({
      item,
      relevanceScore: 0,
      source: 'pubmed_reviews',
      evidenceType: 'review',
      accessType: 'restricted',
      recency: new Date(item.publicationDate).getFullYear() >= 2022 ? 'recent' : 'older'
    });
  });
  
  return items;
}

/**
 * Score evidence relevance based on query tags and scenario
 */
function scoreEvidenceRelevance(
  items: RankedEvidence[],
  config: RAGRankingConfig
): RankedEvidence[] {
  
  return items.map(item => {
    let score = 0;
    
    // Base score by evidence type (mode-specific)
    if (config.mode === 'doctor') {
      switch (item.evidenceType) {
        case 'guideline': score += 100; break;
        case 'review': score += 80; break;
        case 'trial': score += 70; break;
        default: score += 50;
      }
    } else {
      switch (item.evidenceType) {
        case 'education': score += 100; break;
        case 'lifestyle': score += 90; break;
        case 'guideline': score += 70; break;
        default: score += 40;
      }
    }
    
    // Boost for anchor guidelines
    if (item.source === 'guidelines') {
      score += 50; // Anchor guidelines get highest priority
    }
    
    // Boost for landmark trials
    if (item.source === 'landmark_trials') {
      score += 40;
    }
    
    // Boost for open access
    if (item.accessType === 'open') {
      score += 30;
    }
    
    // Boost for recent evidence
    if (config.prioritizeRecent && item.recency === 'recent') {
      score += 20;
    }
    
    // Tag-based relevance scoring
    score += calculateTagRelevance(item, config.queryTags);
    
    // Scenario-specific boosting
    if (config.detectedScenario) {
      score += calculateScenarioRelevance(item, config.detectedScenario);
    }
    
    return {
      ...item,
      relevanceScore: score
    };
  });
}

/**
 * Calculate tag-based relevance score
 */
function calculateTagRelevance(item: RankedEvidence, queryTags: QueryTags): number {
  let score = 0;
  const itemText = getItemText(item.item).toLowerCase();
  
  // Primary disease tag match
  if (queryTags.primary_disease_tag && 
      itemText.includes(queryTags.primary_disease_tag.toLowerCase())) {
    score += 30;
  }
  
  // Primary decision tag match
  if (queryTags.primary_decision_tag && 
      itemText.includes(queryTags.primary_decision_tag.toLowerCase())) {
    score += 25;
  }
  
  // Secondary tag matches
  queryTags.disease_tags.forEach(tag => {
    if (itemText.includes(tag.toLowerCase())) {
      score += 10;
    }
  });
  
  queryTags.decision_tags.forEach(tag => {
    if (itemText.includes(tag.toLowerCase())) {
      score += 8;
    }
  });
  
  return score;
}

/**
 * Calculate scenario-specific relevance
 */
function calculateScenarioRelevance(item: RankedEvidence, scenario: string): number {
  let score = 0;
  const itemText = getItemText(item.item).toLowerCase();
  
  // Scenario-specific keywords
  const scenarioKeywords: Record<string, string[]> = {
    hfpef: ['hfpef', 'preserved ejection fraction', 'sglt2', 'empagliflozin', 'dapagliflozin'],
    vte_failure: ['recurrent vte', 'anticoagulation failure', 'lmwh', 'breakthrough'],
    af_ckd: ['atrial fibrillation', 'chronic kidney disease', 'apixaban', 'dialysis'],
    cap: ['community acquired pneumonia', 'antibiotic', 'idsa', 'ats']
  };
  
  const keywords = scenarioKeywords[scenario] || [];
  keywords.forEach(keyword => {
    if (itemText.includes(keyword)) {
      score += 15;
    }
  });
  
  return score;
}

/**
 * Apply mode-specific filtering
 */
function applyModeSpecificFiltering(
  items: RankedEvidence[],
  config: RAGRankingConfig
): RankedEvidence[] {
  
  let filtered = items;
  
  // Filter by access type if required
  if (config.requireOpenAccess) {
    filtered = filtered.filter(item => item.accessType === 'open');
    console.log(`🔓 Open access filter: ${filtered.length}/${items.length} items accessible`);
  }
  
  // Mode-specific source bans
  if (config.mode === 'doctor') {
    // Doctor mode: Ban consumer sites, prioritize clinical evidence
    filtered = filtered.filter(item => {
      const isBannedConsumer = item.source.includes('medlineplus') || 
                              item.source.includes('mayoclinic') ||
                              item.source.includes('webmd');
      const isValidClinical = ['guideline', 'trial', 'review'].includes(item.evidenceType);
      return !isBannedConsumer && isValidClinical;
    });
    console.log(`👨‍⚕️ Doctor mode: ${filtered.length} clinical sources after consumer ban`);
  } else {
    // General mode: Ban dense clinical PDFs, prioritize consumer health
    filtered = filtered.filter(item => {
      const isDenseClinical = item.source.includes('nejm') || 
                             item.source.includes('jama') ||
                             item.source.includes('lancet') ||
                             (item.evidenceType === 'trial' && !item.source.includes('medlineplus'));
      const isConsumerFriendly = ['education', 'lifestyle', 'guideline'].includes(item.evidenceType) ||
                                item.source.includes('medlineplus') ||
                                item.source.includes('who') ||
                                item.source.includes('cdc');
      return !isDenseClinical && isConsumerFriendly;
    });
    console.log(`👥 General mode: ${filtered.length} consumer sources after clinical ban`);
  }
  
  return filtered;
}

/**
 * Build final evidence package from ranked items
 */
function buildRankedEvidencePackage(
  rankedItems: RankedEvidence[],
  originalEvidence: EvidencePackage
): EvidencePackage {
  
  // Group items by source
  const itemsBySource = rankedItems.reduce((acc, item) => {
    if (!acc[item.source]) acc[item.source] = [];
    acc[item.source].push(item.item);
    return acc;
  }, {} as Record<string, any[]>);
  
  // Build new evidence package with only selected items
  return {
    ...originalEvidence,
    guidelines: itemsBySource.guidelines || [],
    whoGuidelines: itemsBySource.who_guidelines || [],
    cdcGuidelines: itemsBySource.cdc_guidelines || [],
    niceGuidelines: itemsBySource.nice_guidelines || [],
    landmarkTrials: itemsBySource.landmark_trials || [],
    cochraneReviews: itemsBySource.cochrane || [],
    pubmedArticles: itemsBySource.pubmed_articles || [],
    pubmedReviews: itemsBySource.pubmed_reviews || []
  };
}

/**
 * Helper functions
 */
function getItemText(item: any): string {
  return [
    item.title || '',
    item.name || '',
    item.summary || '',
    item.abstract || ''
  ].join(' ');
}

function getTotalEvidenceCount(evidence: EvidencePackage): number {
  return evidence.guidelines.length +
         evidence.whoGuidelines.length +
         evidence.cdcGuidelines.length +
         evidence.niceGuidelines.length +
         evidence.landmarkTrials.length +
         evidence.cochraneReviews.length +
         evidence.pubmedArticles.length +
         evidence.pubmedReviews.length;
}

function getEvidenceTypeDistribution(items: RankedEvidence[]): Record<string, number> {
  return items.reduce((acc, item) => {
    acc[item.evidenceType] = (acc[item.evidenceType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}