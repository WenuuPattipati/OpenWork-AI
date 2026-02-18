/**
 * PubMed Central (PMC) API Integration via E-Utilities
 * Official documentation: https://www.ncbi.nlm.nih.gov/books/NBK25501/
 * 
 * PMC provides free full-text access to biomedical and life sciences journal literature
 * 
 * Key Features:
 * - Full-text articles (not just abstracts)
 * - Open access content
 * - NLM-hosted full text
 * - Direct integration with PubMed
 */

const API_TOOL_NAME = "OpenWork-AI";
const API_CONTACT_EMAIL = "wenuupattipati@gmail.com";

// NCBI API Key rotation for better rate limits
function getNCBIApiKey(): string {
  const keys = [
    process.env.NCBI_API_KEY,
    process.env.NCBI_API_KEY_DAILYMED
  ].filter(Boolean);
  
  if (keys.length === 0) {
    console.warn('⚠️  No NCBI API keys found - using default rate limits');
    return '';
  }
  
  // Rotate between available keys
  const keyIndex = Math.floor(Math.random() * keys.length);
  return keys[keyIndex] as string;
}

function buildApiUrl(baseUrl: string): string {
  const apiKey = getNCBIApiKey();
  const toolParam = `&tool=${API_TOOL_NAME}&email=${API_CONTACT_EMAIL}`;
  const keyParam = apiKey ? `&api_key=${apiKey}` : '';
  return `${baseUrl}${toolParam}${keyParam}`;
}

export interface PMCArticle {
  pmcId: string;
  title: string;
  url: string;
  journal: string;
  year: string;
  authors: string[];
  pubDate: string;
  articleIds?: {
    pmid?: string;
    doi?: string;
  };
}

/**
 * Helper function to retry API calls with exponential backoff
 */
async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      
      // If rate limited (429) or server error (500), retry with backoff
      if (response.status === 429 || response.status >= 500) {
        if (i === retries - 1) return response;
        
        const waitTime = Math.pow(2, i) * 1000 + Math.random() * 1000;
        console.warn(`PMC API ${response.status}, retrying in ${Math.round(waitTime)}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      
      const waitTime = Math.pow(2, i) * 1000 + Math.random() * 1000;
      console.warn(`PMC API error, retrying in ${Math.round(waitTime)}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw new Error("PMC API failed after retries");
}

/**
 * Search PubMed Central for full-text articles
 * Returns open access full-text articles
 */
export async function searchPMC(
  query: string,
  maxResults: number = 5
): Promise<PMCArticle[]> {
  try {
    // Step 1: Search for PMC IDs with API key rotation
    const searchBaseUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pmc&term=${encodeURIComponent(query)}&retmode=json&retmax=${maxResults}&sort=relevance`;
    const searchUrl = buildApiUrl(searchBaseUrl);
    
    const searchRes = await fetchWithRetry(searchUrl);
    
    if (!searchRes.ok) {
      console.error("PMC search error:", searchRes.status);
      return [];
    }
    
    const searchData = await searchRes.json();
    const ids = searchData.esearchresult?.idlist || [];
    
    if (ids.length === 0) {
      return [];
    }
    
    // Step 2: Fetch article summaries with API key rotation
    const summaryBaseUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pmc&id=${ids.join(',')}&retmode=json`;
    const summaryUrl = buildApiUrl(summaryBaseUrl);
    
    const summaryRes = await fetchWithRetry(summaryUrl);
    
    if (!summaryRes.ok) {
      console.error("PMC summary error:", summaryRes.status);
      return [];
    }
    
    const summaryData = await summaryRes.json();
    
    const articles: PMCArticle[] = [];
    
    ids.forEach((id: string) => {
      const doc = summaryData.result?.[id];
      if (doc) {
        const year = doc.pubdate ? doc.pubdate.split(' ')[0] : '';
        const pmcId = `PMC${id}`;
        
        // Extract article IDs (PMID, DOI)
        const articleIds: { pmid?: string; doi?: string } = {};
        if (doc.articleids) {
          doc.articleids.forEach((idObj: any) => {
            if (idObj.idtype === 'pmid') articleIds.pmid = idObj.value;
            if (idObj.idtype === 'doi') articleIds.doi = idObj.value;
          });
        }
        
        articles.push({
          pmcId,
          title: doc.title || 'Untitled',
          url: `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcId}/`,
          journal: doc.source || 'Unknown Journal',
          year,
          pubDate: doc.pubdate || '',
          authors: doc.authors?.map((a: any) => a.name).slice(0, 5) || [],
          articleIds,
        });
      }
    });
    
    return articles;
  } catch (error) {
    console.error("Error searching PMC:", error);
    return [];
  }
}

/**
 * Search PMC for recent articles (last 2 years)
 */
export async function searchRecentPMC(
  query: string,
  maxResults: number = 5
): Promise<PMCArticle[]> {
  const currentYear = new Date().getFullYear();
  const twoYearsAgo = currentYear - 2;
  
  const dateQuery = `${query} AND ${twoYearsAgo}:${currentYear}[pdat]`;
  
  return searchPMC(dateQuery, maxResults);
}

/**
 * Search PMC for systematic reviews and meta-analyses
 */
export async function searchPMCReviews(
  query: string,
  maxResults: number = 3
): Promise<PMCArticle[]> {
  const reviewQuery = `${query} AND (systematic review[ti] OR meta-analysis[ti])`;
  
  return searchPMC(reviewQuery, maxResults);
}

/**
 * Comprehensive PMC search
 * Searches for general articles, recent articles, and reviews
 */
export async function comprehensivePMCSearch(
  query: string
): Promise<{
  allArticles: PMCArticle[];
  articles: PMCArticle[];
  recentArticles: PMCArticle[];
  reviews: PMCArticle[];
}> {
  try {
    const [articles, recentArticles, reviews] = await Promise.all([
      searchPMC(query, 5),
      searchRecentPMC(query, 3),
      searchPMCReviews(query, 2),
    ]);
    
    return {
      allArticles: articles, // Add this for backward compatibility
      articles,
      recentArticles,
      reviews,
    };
  } catch (error) {
    console.error("Error in comprehensive PMC search:", error);
    return {
      allArticles: [],
      articles: [],
      recentArticles: [],
      reviews: [],
    };
  }
}

/**
 * Format PMC results for AI prompt
 */
export function formatPMCForPrompt(
  articles: PMCArticle[],
  recentArticles: PMCArticle[],
  reviews: PMCArticle[]
): string {
  if (articles.length === 0 && recentArticles.length === 0 && reviews.length === 0) {
    return "";
  }
  
  let formatted = "";
  
  // PMC Reviews (highest priority)
  if (reviews.length > 0) {
    formatted += "**SYSTEMATIC REVIEWS (PMC Full-Text):**\n";
    reviews.forEach((article, i) => {
      formatted += `${i + 1}. ${article.title}\n`;
      formatted += `   PMCID: ${article.pmcId}`;
      if (article.articleIds?.pmid) formatted += ` | PMID: ${article.articleIds.pmid}`;
      if (article.articleIds?.doi) formatted += ` | DOI: ${article.articleIds.doi}`;
      formatted += "\n";
      if (article.authors.length > 0) {
        formatted += `   Authors: ${article.authors.slice(0, 3).join(", ")}${article.authors.length > 3 ? " et al." : ""}\n`;
      }
      formatted += `   Journal: ${article.journal} (${article.year})\n`;
      formatted += `   Full Text: ${article.url}\n`;
      formatted += `   ⭐ FULL TEXT AVAILABLE\n\n`;
    });
  }
  
  // Recent PMC Articles
  if (recentArticles.length > 0) {
    formatted += "**RECENT FULL-TEXT ARTICLES (PMC):**\n";
    recentArticles.forEach((article, i) => {
      formatted += `${i + 1}. ${article.title}\n`;
      formatted += `   PMCID: ${article.pmcId}`;
      if (article.articleIds?.pmid) formatted += ` | PMID: ${article.articleIds.pmid}`;
      formatted += "\n";
      if (article.authors.length > 0) {
        formatted += `   ${article.authors.slice(0, 2).join(", ")}${article.authors.length > 2 ? " et al." : ""} (${article.year})\n`;
      }
      formatted += `   ${article.journal}\n`;
      formatted += `   Full Text: ${article.url}\n\n`;
    });
  }
  
  // General PMC Articles
  if (articles.length > 0) {
    formatted += "**FULL-TEXT ARTICLES (PMC):**\n";
    articles.slice(0, 3).forEach((article, i) => {
      formatted += `${i + 1}. ${article.title}\n`;
      formatted += `   PMCID: ${article.pmcId} | ${article.journal} (${article.year})\n`;
      formatted += `   Full Text: ${article.url}\n\n`;
    });
  }
  
  return formatted;
}
