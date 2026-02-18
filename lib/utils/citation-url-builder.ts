/**
 * Citation URL Builder
 * Constructs valid URLs for medical citations using multiple strategies
 */

// Compile regex patterns once for performance
const URL_PATTERN = /(https?:\/\/[^\s\)]+)/g;
const INVALID_URL_PATTERNS = [
  /google\.com\/search/i,
  /bing\.com\/search/i,
  /yahoo\.com\/search/i
];

export interface CitationIdentifiers {
  reference: string;
  doi?: string | null;
  pmid?: string | null;
  pmcid?: string | null;
  bookshelfId?: string | null;
  existingUrl?: string | null;
}

/**
 * Builds a valid citation URL using multiple strategies in priority order:
 * 1. Use existing URL if valid
 * 2. Extract URL from reference text
 * 3. Construct from DOI
 * 4. Construct from PMID
 * 5. Construct from PMCID
 * 6. Construct from Bookshelf ID
 * 
 * @param identifiers - Citation identifiers and reference text
 * @returns Valid URL or null if no URL can be constructed
 */
export function buildCitationURL(identifiers: CitationIdentifiers): string | null {
  // Strategy 1: Use existing URL if valid
  if (identifiers.existingUrl && isValidCitationURL(identifiers.existingUrl)) {
    return identifiers.existingUrl;
  }
  
  // Strategy 2: Extract from reference text
  const extractedUrl = extractURLFromReference(identifiers.reference);
  if (extractedUrl) {
    return extractedUrl;
  }
  
  // Strategy 3: Construct from identifiers (in priority order)
  return constructURLFromIdentifiers(identifiers);
}

/**
 * Checks if a URL is valid for citations (not a search engine URL)
 */
function isValidCitationURL(url: string): boolean {
  if (!url.startsWith('http')) {
    return false;
  }
  
  // Reject search engine URLs
  return !INVALID_URL_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * Extracts the first valid URL from reference text
 */
function extractURLFromReference(reference: string): string | null {
  const urlMatches = reference.match(URL_PATTERN);
  if (!urlMatches || urlMatches.length === 0) {
    return null;
  }
  
  // Find first valid (non-search-engine) URL
  const validUrl = urlMatches.find(url => isValidCitationURL(url));
  if (!validUrl) {
    return null;
  }
  
  // Clean trailing punctuation
  return cleanTrailingPunctuation(validUrl);
}

/**
 * Removes trailing punctuation from URLs
 */
function cleanTrailingPunctuation(url: string): string {
  return url.replace(/[.,;:)\]]+$/, '');
}

/**
 * Constructs URL from available identifiers (DOI, PMID, PMCID, Bookshelf ID)
 */
function constructURLFromIdentifiers(identifiers: CitationIdentifiers): string | null {
  const { doi, pmid, pmcid, bookshelfId } = identifiers;
  
  if (doi) {
    return `https://doi.org/${doi}`;
  }
  
  if (pmid) {
    return `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
  }
  
  if (pmcid) {
    return `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/`;
  }
  
  if (bookshelfId) {
    return `https://www.ncbi.nlm.nih.gov/books/${bookshelfId}/`;
  }
  
  return null;
}
