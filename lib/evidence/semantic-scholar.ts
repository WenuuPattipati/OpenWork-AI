/**
 * Semantic Scholar API Integration
 * Official documentation: https://api.semanticscholar.org/api-docs/
 * 
 * Key Features:
 * - 1000 requests/second rate limit (no API key required)
 * - Academic Graph API for paper search and details
 * - Recommendations API for related papers
 * - Advanced search with boolean operators
 * - Free and open access
 */

const SEMANTIC_SCHOLAR_BASE = "https://api.semanticscholar.org/graph/v1";

export interface SemanticScholarPaper {
  paperId: string;
  title: string;
  authors: string[];
  year: number;
  abstract?: string;
  citationCount: number;
  referenceCount: number;
  publicationTypes?: string[];
  publicationDate?: string;
  journal?: string;
  doi?: string;
  url: string;
  isOpenAccess: boolean;
  openAccessPdf?: string;
}

/**
 * Helper function to retry API calls with exponential backoff
 */
async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'OpenWork-AI (mailto:wenuupattipati@gmail.com)',
        },
      });
      
      // If rate limited (429) or server error (500), retry with backoff
      if (response.status === 429 || response.status >= 500) {
        if (i === retries - 1) return response;
        
        const waitTime = Math.pow(2, i) * 1000 + Math.random() * 1000;
        console.warn(`Semantic Scholar API ${response.status}, retrying in ${Math.round(waitTime)}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      
      const waitTime = Math.pow(2, i) * 1000 + Math.random() * 1000;
      console.warn(`Semantic Scholar API error, retrying in ${Math.round(waitTime)}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw new Error("Semantic Scholar API failed after retries");
}

/**
 * Search Semantic Scholar for medical literature
 * Uses paper bulk search endpoint for better performance
 */
export async function searchSemanticScholar(
  query: string,
  maxResults: number = 10
): Promise<SemanticScholarPaper[]> {
  try {
    // Per documentation: Use bulk search for better performance
    // Fields to request from API
    const fields = [
      "paperId",
      "title",
      "abstract",
      "year",
      "authors",
      "citationCount",
      "referenceCount",
      "publicationTypes",
      "publicationDate",
      "journal",
      "openAccessPdf",
      "isOpenAccess",
    ].join(",");
    
    // Limit to 100 per request (API max)
    const limit = Math.min(maxResults, 100);
    
    // Build URL with query parameters
    const params = new URLSearchParams({
      query,
      fields,
      limit: limit.toString(),
    });
    
    const url = `${SEMANTIC_SCHOLAR_BASE}/paper/search/bulk?${params}`;
    
    const response = await fetchWithRetry(url);
    
    if (!response.ok) {
      console.error("Semantic Scholar search error:", response.status);
      return [];
    }
    
    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      return [];
    }
    
    const papers: SemanticScholarPaper[] = data.data.map((paper: any) => ({
      paperId: paper.paperId || "",
      title: paper.title || "",
      authors: paper.authors?.slice(0, 3).map((a: any) => a.name || "Unknown") || [],
      year: paper.year || 0,
      abstract: paper.abstract?.substring(0, 500) || undefined,
      citationCount: paper.citationCount || 0,
      referenceCount: paper.referenceCount || 0,
      publicationTypes: paper.publicationTypes || [],
      publicationDate: paper.publicationDate || undefined,
      journal: paper.journal?.name || undefined,
      doi: paper.externalIds?.DOI || undefined,
      url: `https://www.semanticscholar.org/paper/${paper.paperId}`,
      isOpenAccess: paper.isOpenAccess || false,
      openAccessPdf: paper.openAccessPdf?.url || undefined,
    }));
    
    return papers.slice(0, maxResults);
  } catch (error) {
    console.error("Error searching Semantic Scholar:", error);
    return [];
  }
}

/**
 * Search for highly cited medical papers
 * Uses advanced query syntax to filter for medical research
 */
export async function searchHighlyCitedMedical(
  query: string,
  maxResults: number = 10
): Promise<SemanticScholarPaper[]> {
  try {
    // Per documentation: Use boolean operators for advanced search
    // Add medical terms and require high citations
    const enhancedQuery = `${query} AND (medicine OR clinical OR medical OR health)`;
    
    const fields = [
      "paperId",
      "title",
      "abstract",
      "year",
      "authors",
      "citationCount",
      "referenceCount",
      "publicationTypes",
      "publicationDate",
      "journal",
      "openAccessPdf",
      "isOpenAccess",
    ].join(",");
    
    const limit = Math.min(maxResults, 100);
    
    const params = new URLSearchParams({
      query: enhancedQuery,
      fields,
      limit: limit.toString(),
    });
    
    const url = `${SEMANTIC_SCHOLAR_BASE}/paper/search/bulk?${params}`;
    
    const response = await fetchWithRetry(url);
    
    if (!response.ok) {
      console.error("Semantic Scholar highly cited search error:", response.status);
      return [];
    }
    
    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      return [];
    }
    
    const papers: SemanticScholarPaper[] = data.data
      .filter((paper: any) => (paper.citationCount || 0) >= 10) // Filter for highly cited
      .map((paper: any) => ({
        paperId: paper.paperId || "",
        title: paper.title || "",
        authors: paper.authors?.slice(0, 3).map((a: any) => a.name || "Unknown") || [],
        year: paper.year || 0,
        abstract: paper.abstract?.substring(0, 500) || undefined,
        citationCount: paper.citationCount || 0,
        referenceCount: paper.referenceCount || 0,
        publicationTypes: paper.publicationTypes || [],
        publicationDate: paper.publicationDate || undefined,
        journal: paper.journal?.name || undefined,
        doi: paper.externalIds?.DOI || undefined,
        url: `https://www.semanticscholar.org/paper/${paper.paperId}`,
        isOpenAccess: paper.isOpenAccess || false,
        openAccessPdf: paper.openAccessPdf?.url || undefined,
      }))
      .sort((a: any, b: any) => b.citationCount - a.citationCount); // Sort by citations
    
    return papers.slice(0, maxResults);
  } catch (error) {
    console.error("Error searching highly cited papers:", error);
    return [];
  }
}

/**
 * Search for recent medical research (last 5 years)
 * Useful for getting latest findings
 */
export async function searchRecentMedical(
  query: string,
  maxResults: number = 10
): Promise<SemanticScholarPaper[]> {
  try {
    const currentYear = new Date().getFullYear();
    const fiveYearsAgo = currentYear - 5;
    
    // Per documentation: Use boolean operators for year filtering
    const enhancedQuery = `${query} AND (medicine OR clinical OR medical OR health)`;
    
    const fields = [
      "paperId",
      "title",
      "abstract",
      "year",
      "authors",
      "citationCount",
      "referenceCount",
      "publicationTypes",
      "publicationDate",
      "journal",
      "openAccessPdf",
      "isOpenAccess",
    ].join(",");
    
    const limit = Math.min(maxResults, 100);
    
    const params = new URLSearchParams({
      query: enhancedQuery,
      fields,
      limit: limit.toString(),
      year: `${fiveYearsAgo}-`, // Filter for recent years
    });
    
    const url = `${SEMANTIC_SCHOLAR_BASE}/paper/search/bulk?${params}`;
    
    const response = await fetchWithRetry(url);
    
    if (!response.ok) {
      console.error("Semantic Scholar recent search error:", response.status);
      return [];
    }
    
    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      return [];
    }
    
    const papers: SemanticScholarPaper[] = data.data.map((paper: any) => ({
      paperId: paper.paperId || "",
      title: paper.title || "",
      authors: paper.authors?.slice(0, 3).map((a: any) => a.name || "Unknown") || [],
      year: paper.year || 0,
      abstract: paper.abstract?.substring(0, 500) || undefined,
      citationCount: paper.citationCount || 0,
      referenceCount: paper.referenceCount || 0,
      publicationTypes: paper.publicationTypes || [],
      publicationDate: paper.publicationDate || undefined,
      journal: paper.journal?.name || undefined,
      doi: paper.externalIds?.DOI || undefined,
      url: `https://www.semanticscholar.org/paper/${paper.paperId}`,
      isOpenAccess: paper.isOpenAccess || false,
      openAccessPdf: paper.openAccessPdf?.url || undefined,
    }));
    
    return papers.slice(0, maxResults);
  } catch (error) {
    console.error("Error searching recent medical papers:", error);
    return [];
  }
}

/**
 * Get paper recommendations based on a seed paper
 * Uses Semantic Scholar's recommendation engine
 */
export async function getRecommendedPapers(
  seedPaperId: string,
  maxResults: number = 5
): Promise<SemanticScholarPaper[]> {
  try {
    const fields = [
      "paperId",
      "title",
      "abstract",
      "year",
      "authors",
      "citationCount",
      "referenceCount",
      "publicationTypes",
      "publicationDate",
      "journal",
      "openAccessPdf",
      "isOpenAccess",
    ].join(",");
    
    const limit = Math.min(maxResults, 100);
    
    const params = new URLSearchParams({
      fields,
      limit: limit.toString(),
    });
    
    const url = `https://api.semanticscholar.org/recommendations/v1/papers/forpaper/${seedPaperId}?${params}`;
    
    const response = await fetchWithRetry(url);
    
    if (!response.ok) {
      console.error("Semantic Scholar recommendations error:", response.status);
      return [];
    }
    
    const data = await response.json();
    
    if (!data.recommendedPapers || data.recommendedPapers.length === 0) {
      return [];
    }
    
    const papers: SemanticScholarPaper[] = data.recommendedPapers.map((paper: any) => ({
      paperId: paper.paperId || "",
      title: paper.title || "",
      authors: paper.authors?.slice(0, 3).map((a: any) => a.name || "Unknown") || [],
      year: paper.year || 0,
      abstract: paper.abstract?.substring(0, 500) || undefined,
      citationCount: paper.citationCount || 0,
      referenceCount: paper.referenceCount || 0,
      publicationTypes: paper.publicationTypes || [],
      publicationDate: paper.publicationDate || undefined,
      journal: paper.journal?.name || undefined,
      doi: paper.externalIds?.DOI || undefined,
      url: `https://www.semanticscholar.org/paper/${paper.paperId}`,
      isOpenAccess: paper.isOpenAccess || false,
      openAccessPdf: paper.openAccessPdf?.url || undefined,
    }));
    
    return papers.slice(0, maxResults);
  } catch (error) {
    console.error("Error getting recommended papers:", error);
    return [];
  }
}
