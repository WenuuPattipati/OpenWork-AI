/**
 * NCBI Bookshelf API Integration
 * Access to authoritative medical textbooks including StatPearls
 * 
 * Official documentation: https://www.ncbi.nlm.nih.gov/books/NBK25497/
 * 
 * Key books available:
 * - StatPearls (comprehensive medical encyclopedia)
 * - Harrison's Principles of Internal Medicine
 * - Madame Curie Bioscience Database
 * - Clinical guidelines in book format
 */

const EUTILS_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const API_KEY = process.env.NCBI_API_KEY || "";
const REQUEST_DELAY = API_KEY ? 100 : 350;

let lastRequestTime = 0;

async function fetchWithRateLimit(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < REQUEST_DELAY) {
    await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
  
  return fetch(url, { signal: AbortSignal.timeout(10000) });
}

export interface NCBIBook {
  bookId: string;
  title: string;
  bookTitle: string;
  authors: string[];
  publisher: string;
  publicationYear: string;
  abstract?: string;
  url: string;
  source: "NCBI Books";
}

/**
 * Search NCBI Bookshelf
 */
export async function searchNCBIBooks(
  query: string,
  maxResults: number = 5
): Promise<NCBIBook[]> {
  try {
    console.log(`📚 Searching NCBI Bookshelf: "${query}"`);
    
    // Search books database
    const params = new URLSearchParams({
      db: "books",
      term: query,
      retmode: "json",
      retmax: maxResults.toString(),
      ...(API_KEY && { api_key: API_KEY }),
    });

    const url = `${EUTILS_BASE}/esearch.fcgi?${params}`;
    const response = await fetchWithRateLimit(url);

    if (!response.ok) {
      console.error(`NCBI Books API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const bookIds = data.esearchresult?.idlist || [];

    if (bookIds.length === 0) {
      console.log("⚠️  No books found");
      return [];
    }

    console.log(`✅ Found ${bookIds.length} books`);

    // Fetch book summaries
    return fetchBookSummaries(bookIds);
  } catch (error: any) {
    console.error("Error searching NCBI Books:", error.message);
    return [];
  }
}

/**
 * Fetch book summaries using ESummary
 */
async function fetchBookSummaries(bookIds: string[]): Promise<NCBIBook[]> {
  if (bookIds.length === 0) return [];

  try {
    const params = new URLSearchParams({
      db: "books",
      id: bookIds.join(","),
      retmode: "json",
      ...(API_KEY && { api_key: API_KEY }),
    });

    const url = `${EUTILS_BASE}/esummary.fcgi?${params}`;
    const response = await fetchWithRateLimit(url);

    if (!response.ok) {
      console.error("NCBI Books ESummary error:", response.status);
      return [];
    }

    const data = await response.json();
    const result = data.result;

    const books: NCBIBook[] = [];

    for (const bookId of bookIds) {
      const book = result[bookId];
      if (!book || book.error) continue;

      books.push({
        bookId,
        title: book.title || "",
        bookTitle: book.booktitle || book.title || "",
        authors: (book.authors || []).map((a: any) => a.name || "").slice(0, 3),
        publisher: book.publisher || "NCBI",
        publicationYear: book.pubdate || "",
        abstract: book.summary || undefined,
        url: `https://www.ncbi.nlm.nih.gov/books/${bookId}`,
        source: "NCBI Books",
      });
    }

    return books;
  } catch (error: any) {
    console.error("Error fetching book summaries:", error.message);
    return [];
  }
}

/**
 * Extract key medical terms from a query for better search results
 */
function extractKeyTerms(query: string): string {
  const queryLower = query.toLowerCase();
  
  // Remove common question words and stopwords
  const stopwords = [
    'what', 'are', 'the', 'potential', 'long-term', 'long', 'term', 'of', 'in',
    'how', 'why', 'when', 'where', 'which', 'is', 'can', 'could', 'should',
    'would', 'may', 'might', 'do', 'does', 'did', 'have', 'has', 'had',
    'this', 'that', 'these', 'those', 'a', 'an', 'for', 'with', 'to', 'from',
    'untreated', 'treated', 'treatment', 'treatments', 'complications', 'complication'
  ];
  
  // Extract meaningful medical terms
  const words = queryLower
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopwords.includes(word));
  
  // Take the most important terms (usually condition + population)
  const keyTerms = words.slice(0, 4).join(' ');
  
  return keyTerms || query.slice(0, 50);
}

/**
 * Search StatPearls specifically (most useful medical encyclopedia)
 */
export async function searchStatPearls(
  query: string,
  maxResults: number = 3
): Promise<NCBIBook[]> {
  try {
    // Extract key medical terms for better search
    const keyTerms = extractKeyTerms(query);
    
    // StatPearls-specific search with simplified query
    const enhancedQuery = `${keyTerms} AND StatPearls[book]`;
    
    console.log(`📖 Searching StatPearls: "${keyTerms}"`);
    
    const params = new URLSearchParams({
      db: "books",
      term: enhancedQuery,
      retmode: "json",
      retmax: maxResults.toString(),
      ...(API_KEY && { api_key: API_KEY }),
    });

    const url = `${EUTILS_BASE}/esearch.fcgi?${params}`;
    const response = await fetchWithRateLimit(url);

    if (!response.ok) {
      console.error(`StatPearls API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    let bookIds = data.esearchresult?.idlist || [];

    // If no results, try a broader search with just the main condition
    if (bookIds.length === 0) {
      console.log("⚠️  No StatPearls articles found, trying broader search...");
      
      // Try with just the first 2 key terms
      const broaderTerms = keyTerms.split(' ').slice(0, 2).join(' ');
      const broaderQuery = `${broaderTerms} AND StatPearls[book]`;
      
      const broaderParams = new URLSearchParams({
        db: "books",
        term: broaderQuery,
        retmode: "json",
        retmax: maxResults.toString(),
        ...(API_KEY && { api_key: API_KEY }),
      });
      
      const broaderUrl = `${EUTILS_BASE}/esearch.fcgi?${broaderParams}`;
      const broaderResponse = await fetchWithRateLimit(broaderUrl);
      
      if (broaderResponse.ok) {
        const broaderData = await broaderResponse.json();
        bookIds = broaderData.esearchresult?.idlist || [];
      }
    }

    if (bookIds.length === 0) {
      console.log("⚠️  No StatPearls articles found");
      return [];
    }

    console.log(`✅ Found ${bookIds.length} StatPearls articles`);

    return fetchBookSummaries(bookIds);
  } catch (error: any) {
    console.error("Error searching StatPearls:", error.message);
    return [];
  }
}

/**
 * Format NCBI Books for prompt
 * IMPORTANT: Format is designed to make it easy for AI to extract title and URL for citations
 */
export function formatNCBIBooksForPrompt(books: NCBIBook[]): string {
  if (books.length === 0) return "";

  let formatted = "## ZONE 25: NCBI BOOKSHELF (Authoritative Medical Textbooks)\n";
  formatted += "**Peer-reviewed medical textbooks and encyclopedias**\n\n";
  formatted += "⚠️ CITATION FORMAT: Use [ARTICLE_TITLE](URL) - NOT author names or source names!\n\n";

  books.forEach((book, i) => {
    // Make title very prominent and provide ready-to-use citation format
    formatted += `${i + 1}. ARTICLE_TITLE: "${book.title}"\n`;
    formatted += `   READY-TO-CITE: [${book.title}](${book.url})\n`;
    formatted += `   SOURCE: StatPearls/NCBI Books\n`;
    if (book.authors.length > 0) {
      formatted += `   AUTHORS: ${book.authors.join(", ")}${book.authors.length >= 3 ? " et al." : ""}\n`;
    }
    formatted += `   YEAR: ${book.publicationYear}\n`;
    formatted += `   URL: ${book.url}\n`;
    if (book.abstract) {
      formatted += `   SUMMARY: ${book.abstract.substring(0, 300)}...\n`;
    }
    formatted += "\n";
  });

  return formatted;
}
