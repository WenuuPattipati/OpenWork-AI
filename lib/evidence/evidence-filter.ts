/**
 * Evidence Filter - Filters evidence based on query classification
 * 
 * This module filters gathered evidence to remove off-topic results based on
 * the query classification's excluded MeSH terms. This ensures that:
 * - Pediatric queries don't get cardiology evidence
 * - Cardiology queries don't get diabetes evidence
 * - Infectious disease queries don't get cardiovascular evidence
 * 
 * The filter is applied AFTER all evidence is gathered to maintain performance
 * while ensuring relevance.
 */

import type { EvidencePackage } from './engine';
import type { ClassificationResult } from './query-classifier';

/**
 * Check if a text contains any of the excluded terms
 * Uses case-insensitive partial matching
 */
function containsExcludedTerm(text: string, excludedTerms: string[]): boolean {
  if (!text || excludedTerms.length === 0) return false;
  
  const lowerText = text.toLowerCase();
  return excludedTerms.some(term => 
    lowerText.includes(term.toLowerCase())
  );
}

/**
 * Check if an article's MeSH terms contain any excluded terms
 */
function hasExcludedMeSH(meshTerms: string[] | undefined, excludedMeSH: string[]): boolean {
  if (!meshTerms || meshTerms.length === 0 || excludedMeSH.length === 0) {
    return false;
  }
  
  return meshTerms.some(term => 
    excludedMeSH.some(excluded => 
      term.toLowerCase().includes(excluded.toLowerCase()) ||
      excluded.toLowerCase().includes(term.toLowerCase())
    )
  );
}

/**
 * Filter PubMed articles by excluded MeSH terms
 */
function filterPubMedArticles<T extends { title: string; abstract?: string; meshTerms?: string[] }>(
  articles: T[],
  excludedMeSH: string[]
): T[] {
  if (excludedMeSH.length === 0) return articles;
  
  return articles.filter(article => {
    // Check MeSH terms first (most reliable)
    if (hasExcludedMeSH(article.meshTerms, excludedMeSH)) {
      return false;
    }
    
    // Fallback: check title and abstract for excluded terms
    // This catches articles that might not have MeSH terms indexed yet
    const textToCheck = `${article.title} ${article.abstract || ''}`;
    if (containsExcludedTerm(textToCheck, excludedMeSH)) {
      return false;
    }
    
    return true;
  });
}

/**
 * Filter Europe PMC articles by excluded terms
 */
function filterEuropePMCArticles<T extends { title: string; abstractText?: string }>(
  articles: T[],
  excludedMeSH: string[]
): T[] {
  if (excludedMeSH.length === 0) return articles;
  
  return articles.filter(article => {
    const textToCheck = `${article.title} ${article.abstractText || ''}`;
    return !containsExcludedTerm(textToCheck, excludedMeSH);
  });
}

/**
 * Filter Cochrane reviews by excluded terms
 */
function filterCochraneReviews<T extends { title: string; abstract?: string }>(
  reviews: T[],
  excludedMeSH: string[]
): T[] {
  if (excludedMeSH.length === 0) return reviews;
  
  return reviews.filter(review => {
    const textToCheck = `${review.title} ${review.abstract || ''}`;
    return !containsExcludedTerm(textToCheck, excludedMeSH);
  });
}

/**
 * Filter Semantic Scholar papers by excluded terms
 */
function filterSemanticScholarPapers<T extends { title: string; abstract?: string | null }>(
  papers: T[],
  excludedMeSH: string[]
): T[] {
  if (excludedMeSH.length === 0) return papers;
  
  return papers.filter(paper => {
    const textToCheck = `${paper.title} ${paper.abstract || ''}`;
    return !containsExcludedTerm(textToCheck, excludedMeSH);
  });
}

/**
 * Filter OpenAlex scholarly works by excluded terms
 */
function filterScholarlyWorks<T extends { title: string; abstract?: string }>(
  works: T[],
  excludedMeSH: string[]
): T[] {
  if (excludedMeSH.length === 0) return works;
  
  return works.filter(work => {
    const textToCheck = `${work.title} ${work.abstract || ''}`;
    return !containsExcludedTerm(textToCheck, excludedMeSH);
  });
}

/**
 * Filter PMC articles by excluded terms
 */
function filterPMCArticles<T extends { title: string; abstract?: string }>(
  articles: T[],
  excludedMeSH: string[]
): T[] {
  if (excludedMeSH.length === 0) return articles;
  
  return articles.filter(article => {
    const textToCheck = `${article.title} ${article.abstract || ''}`;
    return !containsExcludedTerm(textToCheck, excludedMeSH);
  });
}

/**
 * Filter clinical guidelines by excluded terms
 */
function filterGuidelines<T extends { title: string; summary?: string }>(
  guidelines: T[],
  excludedMeSH: string[]
): T[] {
  if (excludedMeSH.length === 0) return guidelines;
  
  return guidelines.filter(guideline => {
    const textToCheck = `${guideline.title} ${guideline.summary || ''}`;
    return !containsExcludedTerm(textToCheck, excludedMeSH);
  });
}

/**
 * Main filtering function - filters entire evidence package based on classification
 * 
 * @param evidence - The complete evidence package from gatherEvidence
 * @param classification - The query classification with excluded MeSH terms
 * @returns Filtered evidence package with off-topic results removed
 */
export function filterEvidenceByClassification(
  evidence: EvidencePackage,
  classification: ClassificationResult
): EvidencePackage {
  const { excluded_mesh_terms } = classification;
  
  // If no excluded terms, return original evidence
  if (excluded_mesh_terms.length === 0) {
    console.log('ℹ️  No excluded MeSH terms - skipping evidence filtering');
    return evidence;
  }
  
  console.log(`🔍 Filtering evidence with ${excluded_mesh_terms.length} excluded MeSH terms:`, excluded_mesh_terms.slice(0, 5).join(', '), '...');
  
  // Count original articles
  const originalCounts = {
    pubmedArticles: evidence.pubmedArticles.length,
    pubmedReviews: evidence.pubmedReviews.length,
    pubmedGuidelines: evidence.pubmedGuidelines.length,
    europePMCRecent: evidence.europePMCRecent.length,
    europePMCCited: evidence.europePMCCited.length,
    cochraneReviews: evidence.cochraneReviews.length,
    cochraneRecent: evidence.cochraneRecent.length,
    semanticScholarPapers: evidence.semanticScholarPapers.length,
    semanticScholarHighlyCited: evidence.semanticScholarHighlyCited.length,
    literature: evidence.literature.length,
    systematicReviews: evidence.systematicReviews.length,
    pmcArticles: evidence.pmcArticles.length,
    pmcRecentArticles: evidence.pmcRecentArticles.length,
    pmcReviews: evidence.pmcReviews.length,
  };
  
  // Apply filters to each evidence source
  const filtered: EvidencePackage = {
    ...evidence,
    
    // PubMed sources (have MeSH terms)
    pubmedArticles: filterPubMedArticles(evidence.pubmedArticles, excluded_mesh_terms),
    pubmedReviews: filterPubMedArticles(evidence.pubmedReviews, excluded_mesh_terms),
    pubmedGuidelines: filterPubMedArticles(evidence.pubmedGuidelines, excluded_mesh_terms),
    
    // Europe PMC sources
    europePMCRecent: filterEuropePMCArticles(evidence.europePMCRecent, excluded_mesh_terms),
    europePMCCited: filterEuropePMCArticles(evidence.europePMCCited, excluded_mesh_terms),
    europePMCPreprints: filterEuropePMCArticles(evidence.europePMCPreprints, excluded_mesh_terms),
    europePMCOpenAccess: filterEuropePMCArticles(evidence.europePMCOpenAccess, excluded_mesh_terms),
    
    // Cochrane reviews
    cochraneReviews: filterCochraneReviews(evidence.cochraneReviews, excluded_mesh_terms),
    cochraneRecent: filterCochraneReviews(evidence.cochraneRecent, excluded_mesh_terms),
    
    // Semantic Scholar
    semanticScholarPapers: filterSemanticScholarPapers(evidence.semanticScholarPapers, excluded_mesh_terms),
    semanticScholarHighlyCited: filterSemanticScholarPapers(evidence.semanticScholarHighlyCited, excluded_mesh_terms),
    
    // OpenAlex
    literature: filterScholarlyWorks(evidence.literature, excluded_mesh_terms),
    systematicReviews: filterScholarlyWorks(evidence.systematicReviews, excluded_mesh_terms),
    
    // PMC full-text
    pmcArticles: filterPMCArticles(evidence.pmcArticles, excluded_mesh_terms),
    pmcRecentArticles: filterPMCArticles(evidence.pmcRecentArticles, excluded_mesh_terms),
    pmcReviews: filterPMCArticles(evidence.pmcReviews, excluded_mesh_terms),
    
    // Guidelines (WHO, CDC, NICE, BMJ, Cardiovascular)
    whoGuidelines: filterGuidelines(evidence.whoGuidelines, excluded_mesh_terms),
    cdcGuidelines: filterGuidelines(evidence.cdcGuidelines, excluded_mesh_terms),
    niceGuidelines: filterGuidelines(evidence.niceGuidelines, excluded_mesh_terms),
    bmjBestPractice: filterGuidelines(evidence.bmjBestPractice, excluded_mesh_terms),
    cardiovascularGuidelines: filterGuidelines(evidence.cardiovascularGuidelines, excluded_mesh_terms),
    
    // Note: We don't filter these sources as they're highly specific:
    // - clinicalTrials (already specific to the query)
    // - drugLabels, adverseEvents (drug-specific)
    // - dailyMedDrugs, rxnorm* (drug databases)
    // - aap* (pediatric-specific, won't have cardiology content)
    // - ncbiBooks (textbook chapters, usually relevant)
    // - omimEntries (genetic disorders, highly specific)
    // - landmarkTrials (curated, already relevant)
    // - guidelines (curated anchor guidelines, already relevant)
  };
  
  // Count filtered articles
  const filteredCounts = {
    pubmedArticles: filtered.pubmedArticles.length,
    pubmedReviews: filtered.pubmedReviews.length,
    pubmedGuidelines: filtered.pubmedGuidelines.length,
    europePMCRecent: filtered.europePMCRecent.length,
    europePMCCited: filtered.europePMCCited.length,
    cochraneReviews: filtered.cochraneReviews.length,
    cochraneRecent: filtered.cochraneRecent.length,
    semanticScholarPapers: filtered.semanticScholarPapers.length,
    semanticScholarHighlyCited: filtered.semanticScholarHighlyCited.length,
    literature: filtered.literature.length,
    systematicReviews: filtered.systematicReviews.length,
    pmcArticles: filtered.pmcArticles.length,
    pmcRecentArticles: filtered.pmcRecentArticles.length,
    pmcReviews: filtered.pmcReviews.length,
  };
  
  // Calculate total removed
  const totalOriginal = Object.values(originalCounts).reduce((sum, count) => sum + count, 0);
  const totalFiltered = Object.values(filteredCounts).reduce((sum, count) => sum + count, 0);
  const totalRemoved = totalOriginal - totalFiltered;
  
  if (totalRemoved > 0) {
    console.log(`✅ Filtered out ${totalRemoved} off-topic articles (${totalOriginal} → ${totalFiltered})`);
    
    // Log significant removals
    Object.keys(originalCounts).forEach(key => {
      const original = originalCounts[key as keyof typeof originalCounts];
      const filtered = filteredCounts[key as keyof typeof filteredCounts];
      const removed = original - filtered;
      
      if (removed > 0) {
        console.log(`   - ${key}: ${original} → ${filtered} (removed ${removed})`);
      }
    });
  } else {
    console.log('✅ No off-topic articles found - all evidence relevant');
  }
  
  return filtered;
}
