/**
 * Cochrane Library Integration via PubMed
 * 
 * Cochrane systematic reviews are indexed in PubMed and can be accessed
 * through NCBI E-utilities. This is a legitimate, free way to access
 * Cochrane content without requiring a Cochrane API key.
 * 
 * Cochrane reviews are the gold standard for systematic reviews and
 * meta-analyses in healthcare.
 */

import { searchPubMed, fetchPubMedDetails, PubMedArticle } from "./pubmed";
import { getCachedEvidence, cacheEvidence } from './cache-manager';

export interface CochraneReview extends PubMedArticle {
  cochraneId?: string;
  reviewType: "Intervention" | "Diagnostic" | "Methodology" | "Overview" | "Protocol";
  lastAssessed?: string;
  qualityRating: "High" | "Moderate" | "Low";
}

/**
 * Search for Cochrane systematic reviews via PubMed
 * Cochrane reviews are published in the Cochrane Database of Systematic Reviews
 */
export async function searchCochraneReviews(
  query: string,
  maxResults: number = 5
): Promise<CochraneReview[]> {
  try {
    // Search specifically for Cochrane reviews in PubMed
    // "Cochrane Database Syst Rev" is the journal name for Cochrane reviews
    const cochraneQuery = `${query} AND "Cochrane Database Syst Rev"[Journal]`;
    
    console.log("🔍 Searching Cochrane reviews:", cochraneQuery);
    
    const searchResult = await searchPubMed(cochraneQuery, maxResults, false);
    
    if (searchResult.pmids.length === 0) {
      console.log("No Cochrane reviews found");
      return [];
    }
    
    console.log(`Found ${searchResult.pmids.length} Cochrane reviews`);
    
    // Fetch full details including abstracts
    const articles = await fetchPubMedDetails(searchResult.pmids);
    
    // Convert to CochraneReview format with enhanced metadata
    const cochraneReviews: CochraneReview[] = articles.map(article => {
      // Determine review type from title/publication type
      let reviewType: CochraneReview["reviewType"] = "Intervention";
      const titleLower = article.title.toLowerCase();
      
      if (titleLower.includes("diagnostic")) {
        reviewType = "Diagnostic";
      } else if (titleLower.includes("protocol")) {
        reviewType = "Protocol";
      } else if (titleLower.includes("overview")) {
        reviewType = "Overview";
      } else if (titleLower.includes("methodology")) {
        reviewType = "Methodology";
      }
      
      // Cochrane reviews are generally high quality by default
      // Could be enhanced with more sophisticated quality assessment
      const qualityRating: CochraneReview["qualityRating"] = "High";
      
      // Extract Cochrane ID from DOI if available
      const cochraneId = article.doi?.includes("CD") 
        ? article.doi.match(/CD\d+/)?.[0] 
        : undefined;
      
      return {
        ...article,
        cochraneId,
        reviewType,
        qualityRating,
        lastAssessed: article.publicationDate,
      };
    });
    
    console.log(`✅ Retrieved ${cochraneReviews.length} Cochrane reviews`);
    
    return cochraneReviews;
  } catch (error) {
    console.error("Error searching Cochrane reviews:", error);
    return [];
  }
}

/**
 * Search for recent Cochrane reviews (last 2 years)
 * Useful for getting the most up-to-date evidence
 */
export async function searchRecentCochraneReviews(
  query: string,
  maxResults: number = 3
): Promise<CochraneReview[]> {
  try {
    const currentYear = new Date().getFullYear();
    const twoYearsAgo = currentYear - 2;
    
    const cochraneQuery = `${query} AND "Cochrane Database Syst Rev"[Journal] AND ${twoYearsAgo}:${currentYear}[pdat]`;
    
    console.log("🔍 Searching recent Cochrane reviews:", cochraneQuery);
    
    const searchResult = await searchPubMed(cochraneQuery, maxResults, false);
    
    if (searchResult.pmids.length === 0) {
      return [];
    }
    
    const articles = await fetchPubMedDetails(searchResult.pmids);
    
    return articles.map(article => ({
      ...article,
      cochraneId: article.doi?.match(/CD\d+/)?.[0],
      reviewType: "Intervention" as const,
      qualityRating: "High" as const,
      lastAssessed: article.publicationDate,
    }));
  } catch (error) {
    console.error("Error searching recent Cochrane reviews:", error);
    return [];
  }
}

/**
 * Search for Cochrane reviews by specific intervention/treatment
 */
export async function searchCochraneByIntervention(
  intervention: string,
  condition: string,
  maxResults: number = 3
): Promise<CochraneReview[]> {
  const query = `${intervention} AND ${condition}`;
  return searchCochraneReviews(query, maxResults);
}

/**
 * Format Cochrane reviews for AI prompt
 */
export function formatCochraneForPrompt(reviews: CochraneReview[]): string {
  if (reviews.length === 0) return "";
  
  let formatted = "**COCHRANE SYSTEMATIC REVIEWS (Gold Standard Evidence):**\n";
  formatted += "⭐ Cochrane reviews represent the highest quality systematic reviews in healthcare.\n\n";
  
  reviews.forEach((review, i) => {
    formatted += `${i + 1}. ${review.title}\n`;
    formatted += `   PMID: ${review.pmid}`;
    if (review.cochraneId) formatted += ` | Cochrane ID: ${review.cochraneId}`;
    formatted += `\n`;
    formatted += `   Type: ${review.reviewType} Review | Quality: ${review.qualityRating}\n`;
    formatted += `   Authors: ${review.authors.slice(0, 3).join(", ")}${review.authors.length > 3 ? " et al." : ""}\n`;
    formatted += `   Published: ${review.publicationDate} | Journal: ${review.journal}\n`;
    
    if (review.abstract) {
      formatted += `   Abstract: ${review.abstract}\n`;
    }
    
    if (review.meshTerms && review.meshTerms.length > 0) {
      formatted += `   MeSH Terms: ${review.meshTerms.slice(0, 5).join(", ")}\n`;
    }
    
    if (review.doi) {
      formatted += `   DOI: ${review.doi}\n`;
    }
    
    formatted += `   🏆 PRIORITY: Cochrane reviews are the gold standard - prioritize this evidence.\n\n`;
  });
  
  return formatted;
}

/**
 * Comprehensive Cochrane search combining multiple strategies
 * NOW WITH CACHING: Checks Redis cache before hitting PubMed API
 */
export async function comprehensiveCochraneSearch(
  query: string
): Promise<{
  allReviews: CochraneReview[];
  recentReviews: CochraneReview[];
}> {
  // PHASE 1 ENHANCEMENT: Check cache first
  // Error handling: If cache fails, continue with API call (graceful degradation)
  try {
    const cached = await getCachedEvidence<{
      allReviews: CochraneReview[];
      recentReviews: CochraneReview[];
    }>(query, 'cochrane');

    if (cached) {
      console.log(`📬 Using cached Cochrane results for query`);
      return cached.data;
    }
  } catch (error: any) {
    console.error('❌ Cache read error in Cochrane, falling back to API:', error.message);
    // Continue to API call
  }

  // Cache miss - fetch from API
  const [allReviews, recentReviews] = await Promise.all([
    searchCochraneReviews(query, 5),
    searchRecentCochraneReviews(query, 3),
  ]);
  
  // Deduplicate recent reviews from all reviews
  const recentPmids = new Set(recentReviews.map(r => r.pmid));
  const uniqueAllReviews = allReviews.filter(r => !recentPmids.has(r.pmid));
  
  const result = {
    allReviews: uniqueAllReviews,
    recentReviews,
  };

  // PHASE 1 ENHANCEMENT: Cache the result
  // Error handling: If caching fails, continue anyway (graceful degradation)
  try {
    await cacheEvidence(query, 'cochrane', result);
  } catch (error: any) {
    console.error('❌ Cache write error in Cochrane:', error.message);
    // Continue - result is still returned
  }

  return result;
}
