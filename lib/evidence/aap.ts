/**
 * American Academy of Pediatrics (AAP) Integration
 * https://www.aap.org/
 * 
 * The AAP is the leading authority on pediatric health in the United States.
 * They publish clinical practice guidelines, policy statements, and technical reports
 * that are essential for evidence-based pediatric care.
 * 
 * Key Resources:
 * - Clinical Practice Guidelines
 * - Policy Statements
 * - Technical Reports
 * - Bright Futures (preventive care guidelines)
 * - Red Book (infectious diseases)
 * 
 * Note: AAP doesn't have a public API, so we search their content via PubMed
 * where AAP publications are indexed, and provide direct links to AAP resources.
 */

import { searchPubMed, fetchPubMedDetails, PubMedArticle } from "./pubmed";

export interface AAPGuideline {
  title: string;
  type: 'Clinical Practice Guideline' | 'Policy Statement' | 'Technical Report' | 'Clinical Report';
  authors: string[];
  journal: string;
  year: string;
  pmid?: string;
  doi?: string;
  abstract?: string;
  url: string;
  topics: string[];
}

// Key AAP topic areas for pediatric queries
const PEDIATRIC_KEYWORDS = [
  'pediatric', 'pediatrics', 'child', 'children', 'infant', 'infants', 'newborn', 'neonatal',
  'adolescent', 'adolescents', 'teen', 'teenager', 'youth', 'baby', 'babies', 'toddler',
  'childhood', 'juvenile', 'preschool', 'school-age', 'puberty', 'developmental',
  'vaccination', 'immunization', 'well-child', 'growth', 'breastfeeding', 'formula',
  'ADHD', 'autism', 'asthma', 'obesity', 'fever', 'otitis media', 'bronchiolitis',
  'jaundice', 'circumcision', 'sleep', 'screen time', 'car seat', 'safety'
];

// AAP-specific search terms for different guideline types
const AAP_GUIDELINE_FILTERS = {
  clinicalPractice: '"American Academy of Pediatrics"[Corporate Author] AND (guideline[pt] OR practice guideline[pt])',
  policyStatement: '"American Academy of Pediatrics"[Corporate Author] AND policy statement[ti]',
  technicalReport: '"American Academy of Pediatrics"[Corporate Author] AND technical report[ti]',
  clinicalReport: '"American Academy of Pediatrics"[Corporate Author] AND clinical report[ti]',
};

/**
 * Check if a query is pediatric-related
 */
export function isPediatricQuery(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  return PEDIATRIC_KEYWORDS.some(keyword => lowerQuery.includes(keyword));
}

/**
 * Search for AAP Clinical Practice Guidelines via PubMed
 */
export async function searchAAPGuidelines(
  query: string,
  maxResults: number = 5
): Promise<AAPGuideline[]> {
  try {
    // Build AAP-specific search query
    const aapQuery = `${query} AND "American Academy of Pediatrics"[Corporate Author]`;
    
    console.log("👶 Searching AAP guidelines for:", query);
    
    const searchResult = await searchPubMed(aapQuery, maxResults, false);
    
    if (searchResult.pmids.length === 0) {
      console.log("No AAP guidelines found for query");
      return [];
    }
    
    const articles = await fetchPubMedDetails(searchResult.pmids);
    
    // Convert to AAP guideline format
    const guidelines: AAPGuideline[] = articles.map(article => {
      // Determine guideline type from title
      let type: AAPGuideline['type'] = 'Clinical Report';
      const titleLower = article.title.toLowerCase();
      
      if (titleLower.includes('clinical practice guideline')) {
        type = 'Clinical Practice Guideline';
      } else if (titleLower.includes('policy statement')) {
        type = 'Policy Statement';
      } else if (titleLower.includes('technical report')) {
        type = 'Technical Report';
      }
      
      // Extract topics from MeSH terms
      const topics = article.meshTerms?.slice(0, 5) || [];
      
      return {
        title: article.title,
        type,
        authors: article.authors,
        journal: article.journal,
        year: article.publicationDate,
        pmid: article.pmid,
        doi: article.doi,
        abstract: article.abstract,
        url: `https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`,
        topics,
      };
    });
    
    console.log(`✅ Found ${guidelines.length} AAP guidelines`);
    return guidelines;
    
  } catch (error) {
    console.error("Error searching AAP guidelines:", error);
    return [];
  }
}

/**
 * Search for AAP Policy Statements
 */
export async function searchAAPPolicyStatements(
  query: string,
  maxResults: number = 3
): Promise<AAPGuideline[]> {
  try {
    const policyQuery = `${query} AND ${AAP_GUIDELINE_FILTERS.policyStatement}`;
    
    const searchResult = await searchPubMed(policyQuery, maxResults, false);
    
    if (searchResult.pmids.length === 0) {
      return [];
    }
    
    const articles = await fetchPubMedDetails(searchResult.pmids);
    
    return articles.map(article => ({
      title: article.title,
      type: 'Policy Statement' as const,
      authors: article.authors,
      journal: article.journal,
      year: article.publicationDate,
      pmid: article.pmid,
      doi: article.doi,
      abstract: article.abstract,
      url: `https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`,
      topics: article.meshTerms?.slice(0, 5) || [],
    }));
    
  } catch (error) {
    console.error("Error searching AAP policy statements:", error);
    return [];
  }
}

/**
 * Get AAP Bright Futures guidelines (preventive care)
 * These are the gold standard for well-child visits
 */
export function getAAPBrightFuturesInfo(): AAPGuideline {
  return {
    title: 'Bright Futures: Guidelines for Health Supervision of Infants, Children, and Adolescents, 4th Edition',
    type: 'Clinical Practice Guideline',
    authors: ['American Academy of Pediatrics', 'Bright Futures Steering Committee'],
    journal: 'American Academy of Pediatrics',
    year: '2017',
    url: 'https://www.aap.org/en/practice-management/bright-futures/',
    topics: ['Preventive Care', 'Well-Child Visits', 'Developmental Surveillance', 'Health Supervision'],
  };
}

/**
 * Get AAP Red Book info (infectious diseases)
 */
export function getAAPRedBookInfo(): AAPGuideline {
  return {
    title: 'Red Book: 2026-2028 Report of the Committee on Infectious Diseases',
    type: 'Clinical Practice Guideline',
    authors: ['American Academy of Pediatrics', 'Committee on Infectious Diseases'],
    journal: 'American Academy of Pediatrics',
    year: '2026',
    url: 'https://www.aap.org/en/catalog/red-book/',
    topics: ['Infectious Diseases', 'Immunization', 'Antimicrobial Therapy', 'Infection Control'],
  };
}

/**
 * Comprehensive AAP search
 * Searches for guidelines, policy statements, and includes key resources
 */
export async function comprehensiveAAPSearch(
  query: string
): Promise<{
  guidelines: AAPGuideline[];
  policyStatements: AAPGuideline[];
  keyResources: AAPGuideline[];
}> {
  // Only search if query is pediatric-related
  if (!isPediatricQuery(query)) {
    console.log("Query not pediatric-related, skipping AAP search");
    return {
      guidelines: [],
      policyStatements: [],
      keyResources: [],
    };
  }
  
  const [guidelines, policyStatements] = await Promise.all([
    searchAAPGuidelines(query, 5),
    searchAAPPolicyStatements(query, 3),
  ]);
  
  // Add key resources based on query content
  const keyResources: AAPGuideline[] = [];
  const lowerQuery = query.toLowerCase();
  
  // Add Bright Futures for preventive care queries
  if (lowerQuery.includes('well-child') || 
      lowerQuery.includes('preventive') || 
      lowerQuery.includes('screening') ||
      lowerQuery.includes('developmental')) {
    keyResources.push(getAAPBrightFuturesInfo());
  }
  
  // Add Red Book for infectious disease queries
  if (lowerQuery.includes('infection') || 
      lowerQuery.includes('vaccine') || 
      lowerQuery.includes('immunization') ||
      lowerQuery.includes('antibiotic')) {
    keyResources.push(getAAPRedBookInfo());
  }
  
  return {
    guidelines,
    policyStatements,
    keyResources,
  };
}

/**
 * Format AAP results for AI prompt
 */
export function formatAAPForPrompt(
  guidelines: AAPGuideline[],
  policyStatements: AAPGuideline[],
  keyResources: AAPGuideline[]
): string {
  const total = guidelines.length + policyStatements.length + keyResources.length;
  if (total === 0) return '';
  
  let formatted = "## ZONE 20: AMERICAN ACADEMY OF PEDIATRICS (AAP) GUIDELINES\n";
  formatted += "⭐ AAP is the leading authority on pediatric health in the United States.\n\n";
  
  // Clinical Practice Guidelines
  if (guidelines.length > 0) {
    formatted += "**AAP Clinical Practice Guidelines:**\n";
    guidelines.forEach((guideline, i) => {
      formatted += `${i + 1}. ${guideline.title}\n`;
      formatted += `   SOURCE: AAP | Type: ${guideline.type}`;
      if (guideline.pmid) formatted += ` | PMID: ${guideline.pmid}`;
      formatted += "\n";
      formatted += `   Authors: ${guideline.authors.slice(0, 3).join(", ")}${guideline.authors.length > 3 ? " et al." : ""}\n`;
      formatted += `   Journal: ${guideline.journal} (${guideline.year})\n`;
      if (guideline.abstract) formatted += `   Abstract: ${guideline.abstract.substring(0, 300)}...\n`;
      if (guideline.topics.length > 0) formatted += `   Topics: ${guideline.topics.join(", ")}\n`;
      formatted += `   URL: ${guideline.url}\n\n`;
    });
  }
  
  // Policy Statements
  if (policyStatements.length > 0) {
    formatted += "**AAP Policy Statements:**\n";
    policyStatements.forEach((statement, i) => {
      formatted += `${i + 1}. ${statement.title}\n`;
      formatted += `   SOURCE: AAP | Type: Policy Statement`;
      if (statement.pmid) formatted += ` | PMID: ${statement.pmid}`;
      formatted += "\n";
      formatted += `   Year: ${statement.year}\n`;
      if (statement.abstract) formatted += `   Summary: ${statement.abstract.substring(0, 200)}...\n`;
      formatted += `   URL: ${statement.url}\n\n`;
    });
  }
  
  // Key Resources
  if (keyResources.length > 0) {
    formatted += "**AAP Key Resources:**\n";
    keyResources.forEach((resource, i) => {
      formatted += `${i + 1}. ${resource.title}\n`;
      formatted += `   SOURCE: AAP | Type: ${resource.type}\n`;
      formatted += `   Topics: ${resource.topics.join(", ")}\n`;
      formatted += `   URL: ${resource.url}\n\n`;
    });
  }
  
  return formatted;
}
