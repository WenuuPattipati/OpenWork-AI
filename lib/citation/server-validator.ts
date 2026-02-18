/**
 * Server-Side Citation Validator
 * Validates all citations before streaming response to client
 * Ensures all PMIDs/DOIs exist in evidence package
 */

import type { ParsedReference } from '@/lib/types/citation';

export interface EvidencePackage {
  pubmedArticles?: Array<{ pmid?: string; doi?: string; title?: string }>;
  pubmedReviews?: Array<{ pmid?: string; doi?: string; title?: string }>;
  cochraneReviews?: Array<{ doi?: string; title?: string }>;
  guidelines?: Array<{ url?: string; title?: string }>;
  clinicalTrials?: Array<{ nctId?: string; title?: string }>;
  pmcArticles?: Array<{ pmcid?: string; pmid?: string; doi?: string; title?: string }>;
  europePMCRecent?: Array<{ pmid?: string; pmcid?: string; doi?: string; title?: string }>;
  europePMCOpenAccess?: Array<{ pmid?: string; pmcid?: string; doi?: string; title?: string }>;
  whoGuidelines?: Array<{ url?: string; title?: string }>;
  cdcGuidelines?: Array<{ url?: string; title?: string }>;
  niceGuidelines?: Array<{ url?: string; title?: string }>;
  landmarkTrials?: Array<{ pmid?: string; doi?: string; title?: string }>;
  [key: string]: any;
}

export interface ValidationResult {
  isValid: boolean;
  validCitations: number[];
  invalidCitations: number[];
  errors: string[];
  warnings: string[];
}

/**
 * Build citation map from evidence package
 * Maps citation numbers to verifiable identifiers (PMID, DOI, URL)
 */
export function buildCitationMap(evidence: EvidencePackage): Map<string, { pmid?: string; doi?: string; url?: string; title?: string }> {
  const citationMap = new Map();
  let citationNumber = 1;
  
  // Helper to process articles with PMID/DOI
  const processArticles = (articles: any[] | undefined, source: string) => {
    if (articles && Array.isArray(articles)) {
      for (const article of articles) {
        if (article.pmid || article.doi || article.pmcid) {
          citationMap.set(citationNumber.toString(), {
            pmid: article.pmid,
            doi: article.doi,
            url: article.pmid 
              ? `https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`
              : article.pmcid
              ? `https://www.ncbi.nlm.nih.gov/pmc/articles/${article.pmcid}/`
              : article.doi
              ? `https://doi.org/${article.doi}`
              : undefined,
            title: article.title,
            source
          });
          citationNumber++;
        }
      }
    }
  };
  
  // Helper to process guidelines with URLs
  const processGuidelines = (guidelines: any[] | undefined, source: string) => {
    if (guidelines && Array.isArray(guidelines)) {
      for (const guideline of guidelines) {
        if (guideline.url) {
          citationMap.set(citationNumber.toString(), {
            url: guideline.url,
            title: guideline.title,
            source
          });
          citationNumber++;
        }
      }
    }
  };
  
  // Process all evidence sources
  processArticles(evidence.pubmedArticles, 'PubMed');
  processArticles(evidence.pubmedReviews, 'PubMed');
  processArticles(evidence.cochraneReviews, 'Cochrane');
  processArticles(evidence.pmcArticles, 'PMC');
  processArticles(evidence.europePMCRecent, 'Europe PMC');
  processArticles(evidence.europePMCOpenAccess, 'Europe PMC');
  processArticles(evidence.landmarkTrials, 'Landmark Trials');
  
  processGuidelines(evidence.guidelines, 'Guidelines');
  processGuidelines(evidence.whoGuidelines, 'WHO');
  processGuidelines(evidence.cdcGuidelines, 'CDC');
  processGuidelines(evidence.niceGuidelines, 'NICE');
  
  // Process clinical trials
  if (evidence.clinicalTrials && Array.isArray(evidence.clinicalTrials)) {
    for (const trial of evidence.clinicalTrials) {
      if (trial.nctId) {
        citationMap.set(citationNumber.toString(), {
          url: `https://clinicaltrials.gov/study/${trial.nctId}`,
          title: trial.title,
          source: 'ClinicalTrials.gov'
        });
        citationNumber++;
      }
    }
  }
  
  return citationMap;
}

/**
 * Extract citation numbers from response text
 */
export function extractCitationNumbers(response: string): number[] {
  const citations = new Set<number>();
  
  // Match [[N]](url) format
  const inlineLinkMatches = response.matchAll(/\[\[(\d+)\]\]\([^)]+\)/g);
  for (const match of inlineLinkMatches) {
    citations.add(parseInt(match[1]));
  }
  
  // Match [N] format
  const bracketMatches = response.matchAll(/\[(\d+)\]/g);
  for (const match of bracketMatches) {
    citations.add(parseInt(match[1]));
  }
  
  // Match ^[N]^ format
  const caretMatches = response.matchAll(/\^\[(\d+)\]\^/g);
  for (const match of caretMatches) {
    citations.add(parseInt(match[1]));
  }
  
  return Array.from(citations).sort((a, b) => a - b);
}

/**
 * Validate response citations against evidence package
 */
export function validateCitations(
  response: string,
  evidence: EvidencePackage
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validCitations: number[] = [];
  const invalidCitations: number[] = [];
  
  // Build citation map from evidence
  const citationMap = buildCitationMap(evidence);
  
  // Extract citations from response
  const citationsInResponse = extractCitationNumbers(response);
  
  if (citationsInResponse.length === 0) {
    warnings.push('No citations found in response');
    return {
      isValid: true, // Not an error, just a warning
      validCitations: [],
      invalidCitations: [],
      errors: [],
      warnings
    };
  }
  
  // Validate each citation
  for (const citationNum of citationsInResponse) {
    const citationData = citationMap.get(citationNum.toString());
    
    if (!citationData) {
      invalidCitations.push(citationNum);
      errors.push(`Citation [${citationNum}] not found in evidence package`);
    } else if (!citationData.pmid && !citationData.doi && !citationData.url) {
      invalidCitations.push(citationNum);
      errors.push(`Citation [${citationNum}] has no verifiable identifier (PMID/DOI/URL)`);
    } else {
      validCitations.push(citationNum);
    }
  }
  
  // Check for gaps in citation numbering
  const maxCitation = Math.max(...citationsInResponse);
  for (let i = 1; i <= maxCitation; i++) {
    if (!citationsInResponse.includes(i)) {
      warnings.push(`Citation gap: [${i}] is missing but [${maxCitation}] exists`);
    }
  }
  
  const isValid = invalidCitations.length === 0;
  
  return {
    isValid,
    validCitations,
    invalidCitations,
    errors,
    warnings
  };
}

/**
 * Format validation result for logging
 */
export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = [];
  
  lines.push(`Citation Validation: ${result.isValid ? 'PASS' : 'FAIL'}`);
  lines.push(`Valid: ${result.validCitations.length}, Invalid: ${result.invalidCitations.length}`);
  
  if (result.errors.length > 0) {
    lines.push('\nErrors:');
    result.errors.forEach(err => lines.push(`  - ${err}`));
  }
  
  if (result.warnings.length > 0) {
    lines.push('\nWarnings:');
    result.warnings.forEach(warn => lines.push(`  - ${warn}`));
  }
  
  return lines.join('\n');
}

/**
 * Sanitize response by removing invalid citations
 * Use this as a fallback when validation fails
 */
export function sanitizeResponse(
  response: string,
  validationResult: ValidationResult
): string {
  if (validationResult.isValid) {
    return response;
  }
  
  let sanitized = response;
  
  // Remove invalid citations
  for (const invalidNum of validationResult.invalidCitations) {
    // Remove [[N]](url) format
    sanitized = sanitized.replace(
      new RegExp(`\\[\\[${invalidNum}\\]\\]\\([^)]+\\)`, 'g'),
      ''
    );
    
    // Remove [N] format
    sanitized = sanitized.replace(
      new RegExp(`\\[${invalidNum}\\]`, 'g'),
      ''
    );
    
    // Remove ^[N]^ format
    sanitized = sanitized.replace(
      new RegExp(`\\^\\[${invalidNum}\\]\\^`, 'g'),
      ''
    );
  }
  
  // Clean up extra spaces
  sanitized = sanitized.replace(/\s{2,}/g, ' ');
  
  return sanitized;
}
