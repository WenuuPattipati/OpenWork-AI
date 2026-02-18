/**
 * OpenAlex API Integration
 * Provides access to scholarly literature and research
 * 
 * Official Docs: https://docs.openalex.org/
 * Rate Limits: https://docs.openalex.org/how-to-use-the-api/rate-limits-and-authentication
 * 
 * Key Features:
 * - 100,000 requests/day limit
 * - Polite Pool: 10 req/sec (with email) vs Common Pool: 1 req/sec
 * - No authentication required
 * - Full-text abstracts and citations
 * - Open access detection
 */

const OPENALEX_BASE = "https://api.openalex.org";
const USER_EMAIL = process.env.OPENALEX_EMAIL || "hugeiftrue01@gmail.com"; // Polite pool access

export interface ScholarlyWork {
  id: string;
  title: string;
  authors: string[];
  publicationYear: number;
  journal: string;
  doi?: string;
  citationCount: number;
  abstract?: string;
  type: string;
  isOpenAccess: boolean;
  url?: string;
}

/**
 * Helper function to retry API calls with exponential backoff
 * Implements polite pool access for 10 req/sec rate limit
 * Docs: https://docs.openalex.org/how-to-use-the-api/rate-limits-and-authentication#the-polite-pool
 */
async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      // Add mailto parameter to URL for polite pool (10 req/sec)
      const urlWithEmail = url.includes('?') 
        ? `${url}&mailto=${USER_EMAIL}`
        : `${url}?mailto=${USER_EMAIL}`;
      
      const response = await fetch(urlWithEmail, {
        headers: {
          // User-Agent with email ensures polite pool access
          'User-Agent': `OpenWork-AI (mailto:${USER_EMAIL})`,
          'Accept': 'application/json',
        },
      });
      
      // Handle rate limiting (429) with exponential backoff
      if (response.status === 429) {
        if (i === retries - 1) {
          console.error("OpenAlex rate limit exceeded after retries");
          return response;
        }
        
        const waitTime = Math.pow(2, i) * 1000 + Math.random() * 1000;
        console.warn(`OpenAlex rate limited (429), waiting ${Math.round(waitTime)}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // Handle server errors (500+) with retry
      if (response.status >= 500) {
        if (i === retries - 1) return response;
        
        const waitTime = Math.pow(2, i) * 1000 + Math.random() * 1000;
        console.warn(`OpenAlex server error (${response.status}), retrying in ${Math.round(waitTime)}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      
      const waitTime = Math.pow(2, i) * 1000 + Math.random() * 1000;
      console.warn(`OpenAlex network error, retrying in ${Math.round(waitTime)}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw new Error("OpenAlex API failed after retries");
}

/**
 * Search OpenAlex for relevant medical literature
 * Uses polite pool for 10 req/sec rate limit
 * Docs: https://docs.openalex.org/quickstart-tutorial
 */
export async function searchLiterature(
  query: string,
  maxResults: number = 10
): Promise<ScholarlyWork[]> {
  try {
    // Use per-page=200 for efficiency (fewer API calls)
    const perPage = Math.min(maxResults, 200);
    
    // Filter for quality indicators
    // Note: Domain filtering removed due to API compatibility issues
    const filters = [
      "is_retracted:false", // Exclude retracted papers
    ].join(",");
    
    // Build URL - mailto added by fetchWithRetry for polite pool
    const url = `${OPENALEX_BASE}/works?search=${encodeURIComponent(query)}&filter=${filters}&per_page=${perPage}&sort=cited_by_count:desc`;
    
    const response = await fetchWithRetry(url);
    
    if (!response.ok) {
      console.error("OpenAlex API error:", response.status, await response.text());
      return [];
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      console.log("OpenAlex: No results found for query:", query);
      return [];
    }
    
    const works: ScholarlyWork[] = (data.results || []).map((work: any) => ({
      id: work.id || "",
      title: work.title || "",
      authors: work.authorships?.slice(0, 3).map((a: any) => 
        a.author?.display_name || "Unknown"
      ) || [],
      publicationYear: work.publication_year || 0,
      journal: work.primary_location?.source?.display_name || "Unknown",
      doi: work.doi?.replace("https://doi.org/", "") || undefined,
      citationCount: work.cited_by_count || 0,
      abstract: work.abstract_inverted_index ? 
        reconstructAbstract(work.abstract_inverted_index) : undefined,
      type: work.type || "article",
      isOpenAccess: work.open_access?.is_oa || false,
      url: work.open_access?.oa_url || work.doi || undefined,
    }));
    
    return works.slice(0, maxResults);
  } catch (error) {
    console.error("Error fetching OpenAlex literature:", error);
    return [];
  }
}

/**
 * Reconstruct abstract from inverted index
 */
function reconstructAbstract(invertedIndex: Record<string, number[]>): string {
  try {
    const words: [string, number][] = [];
    
    for (const [word, positions] of Object.entries(invertedIndex)) {
      for (const pos of positions) {
        words.push([word, pos]);
      }
    }
    
    words.sort((a, b) => a[1] - b[1]);
    const abstract = words.map(w => w[0]).join(" ");
    
    // Truncate if too long
    return abstract.length > 500 ? abstract.substring(0, 500) + "..." : abstract;
  } catch {
    return "";
  }
}

/**
 * Search for systematic reviews and meta-analyses specifically
 * Uses boolean operators for precise filtering
 * Docs: https://docs.openalex.org/how-to-use-the-api/get-lists-of-entities/search-entities
 */
export async function searchSystematicReviews(
  query: string,
  maxResults: number = 5
): Promise<ScholarlyWork[]> {
  try {
    // Boolean operators for systematic reviews and meta-analyses
    const enhancedQuery = `${query} AND ("systematic review" OR "meta-analysis" OR "meta analysis")`;
    
    const perPage = Math.min(maxResults, 200);
    
    // Filter for high-quality systematic reviews
    const filters = [
      "is_retracted:false",
      "cited_by_count:>30", // Well-cited reviews
    ].join(",");
    
    const url = `${OPENALEX_BASE}/works?search=${encodeURIComponent(enhancedQuery)}&filter=${filters}&per_page=${perPage}&sort=cited_by_count:desc`;
    
    const response = await fetchWithRetry(url);
    
    if (!response.ok) {
      console.error("OpenAlex systematic reviews error:", response.status);
      return [];
    }
    
    const data = await response.json();
    
    const works: ScholarlyWork[] = (data.results || []).map((work: any) => ({
      id: work.id || "",
      title: work.title || "",
      authors: work.authorships?.slice(0, 3).map((a: any) => 
        a.author?.display_name || "Unknown"
      ) || [],
      publicationYear: work.publication_year || 0,
      journal: work.primary_location?.source?.display_name || "Unknown",
      doi: work.doi?.replace("https://doi.org/", "") || undefined,
      citationCount: work.cited_by_count || 0,
      abstract: work.abstract_inverted_index ? 
        reconstructAbstract(work.abstract_inverted_index) : undefined,
      type: work.type || "article",
      isOpenAccess: work.open_access?.is_oa || false,
      url: work.open_access?.oa_url || work.doi || undefined,
    }));
    
    return works.slice(0, maxResults);
  } catch (error) {
    console.error("Error fetching systematic reviews:", error);
    return [];
  }
}

/**
 * Search for recent publications (last 3 years)
 * Sorted by publication date for latest research
 */
export async function searchRecentLiterature(
  query: string,
  maxResults: number = 10
): Promise<ScholarlyWork[]> {
  try {
    const currentYear = new Date().getFullYear();
    const threeYearsAgo = currentYear - 3;
    
    const perPage = Math.min(maxResults, 200);
    
    // Filter for recent, quality publications
    const filters = [
      `publication_year:${threeYearsAgo}-${currentYear}`,
      "is_retracted:false",
    ].join(",");
    
    const url = `${OPENALEX_BASE}/works?search=${encodeURIComponent(query)}&filter=${filters}&per_page=${perPage}&sort=publication_date:desc`;
    
    const response = await fetchWithRetry(url);
    
    if (!response.ok) {
      console.error("OpenAlex recent literature error:", response.status);
      return [];
    }
    
    const data = await response.json();
    
    const works: ScholarlyWork[] = (data.results || []).map((work: any) => ({
      id: work.id || "",
      title: work.title || "",
      authors: work.authorships?.slice(0, 3).map((a: any) => 
        a.author?.display_name || "Unknown"
      ) || [],
      publicationYear: work.publication_year || 0,
      journal: work.primary_location?.source?.display_name || "Unknown",
      doi: work.doi?.replace("https://doi.org/", "") || undefined,
      citationCount: work.cited_by_count || 0,
      abstract: work.abstract_inverted_index ? 
        reconstructAbstract(work.abstract_inverted_index) : undefined,
      type: work.type || "article",
      isOpenAccess: work.open_access?.is_oa || false,
      url: work.open_access?.oa_url || work.doi || undefined,
    }));
    
    return works.slice(0, maxResults);
  } catch (error) {
    console.error("Error fetching recent literature:", error);
    return [];
  }
}

/**
 * Search for clinical trials and RCTs
 * Filters for randomized controlled trials
 */
export async function searchClinicalTrials(
  query: string,
  maxResults: number = 5
): Promise<ScholarlyWork[]> {
  try {
    const enhancedQuery = `${query} AND ("randomized controlled trial" OR "RCT" OR "clinical trial")`;
    
    const perPage = Math.min(maxResults, 200);
    
    const filters = [
      "is_retracted:false",
      "cited_by_count:>10",
    ].join(",");
    
    const url = `${OPENALEX_BASE}/works?search=${encodeURIComponent(enhancedQuery)}&filter=${filters}&per_page=${perPage}&sort=cited_by_count:desc`;
    
    const response = await fetchWithRetry(url);
    
    if (!response.ok) {
      console.error("OpenAlex clinical trials error:", response.status);
      return [];
    }
    
    const data = await response.json();
    
    const works: ScholarlyWork[] = (data.results || []).map((work: any) => ({
      id: work.id || "",
      title: work.title || "",
      authors: work.authorships?.slice(0, 3).map((a: any) => 
        a.author?.display_name || "Unknown"
      ) || [],
      publicationYear: work.publication_year || 0,
      journal: work.primary_location?.source?.display_name || "Unknown",
      doi: work.doi?.replace("https://doi.org/", "") || undefined,
      citationCount: work.cited_by_count || 0,
      abstract: work.abstract_inverted_index ? 
        reconstructAbstract(work.abstract_inverted_index) : undefined,
      type: work.type || "article",
      isOpenAccess: work.open_access?.is_oa || false,
      url: work.open_access?.oa_url || work.doi || undefined,
    }));
    
    return works.slice(0, maxResults);
  } catch (error) {
    console.error("Error fetching clinical trials:", error);
    return [];
  }
}
