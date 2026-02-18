/**
 * Reference Metadata Fetcher
 * 
 * Fetches real article metadata (title, authors, journal, date) from DOI/CrossRef API
 * This ensures reference displays match the actual article, not AI-generated text
 */

export interface ArticleMetadata {
  title: string;
  authors: string[];
  journal: string;
  publishedDate: string; // Format: "August 28, 2021" or "2021" if only year available
  year: string;
  doi?: string;
  pmid?: string;
  url: string;
  source: string; // e.g., "NEJM", "Lancet", "JAMA"
  isLeadingJournal: boolean;
}

// Leading journals list
const LEADING_JOURNALS: Record<string, string> = {
  'new england journal of medicine': 'NEJM',
  'nejm': 'NEJM',
  'n engl j med': 'NEJM',
  'lancet': 'Lancet',
  'the lancet': 'Lancet',
  'jama': 'JAMA',
  'journal of the american medical association': 'JAMA',
  'bmj': 'BMJ',
  'british medical journal': 'BMJ',
  'nature': 'Nature',
  'nature medicine': 'Nature Medicine',
  'science': 'Science',
  'circulation': 'Circulation',
  'european heart journal': 'Eur Heart J',
  'annals of internal medicine': 'Ann Intern Med',
  'cochrane database of systematic reviews': 'Cochrane',
  'cochrane database syst rev': 'Cochrane',
};

/**
 * Extract DOI from a URL
 */
export function extractDOIFromURL(url: string): string | null {
  // Pattern: https://doi.org/10.xxxx/xxxxx
  const doiOrgMatch = url.match(/doi\.org\/(10\.\d{4,9}\/[^\s\?#]+)/i);
  if (doiOrgMatch) return doiOrgMatch[1];
  
  // Pattern in other URLs: doi/10.xxxx/xxxxx or doi=10.xxxx/xxxxx
  const doiParamMatch = url.match(/doi[=/](10\.\d{4,9}\/[^\s\?#&]+)/i);
  if (doiParamMatch) return doiParamMatch[1];
  
  return null;
}

/**
 * Fetch metadata from CrossRef API using DOI
 */
export async function fetchMetadataFromDOI(doi: string): Promise<ArticleMetadata | null> {
  try {
    const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
      headers: {
        'User-Agent': 'OpenWork-AI/1.0 (mailto:support@openwork.ai)',
      },
    });
    
    if (!response.ok) {
      console.warn(`CrossRef API error for DOI ${doi}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const work = data.message;
    
    if (!work) return null;
    
    // Extract title
    const title = work.title?.[0] || '';
    
    // Extract authors (first 3 + et al)
    const authorList = work.author || [];
    const authors = authorList.slice(0, 3).map((a: any) => {
      if (a.given && a.family) {
        return `${a.given} ${a.family}`;
      }
      return a.name || a.family || '';
    }).filter(Boolean);
    
    if (authorList.length > 3) {
      authors.push('et al.');
    }
    
    // Extract journal
    const journal = work['container-title']?.[0] || work.publisher || '';
    
    // Extract publication date
    let publishedDate = '';
    let year = '';
    
    const dateParts = work.published?.['date-parts']?.[0] || 
                      work['published-print']?.['date-parts']?.[0] ||
                      work['published-online']?.['date-parts']?.[0];
    
    if (dateParts) {
      year = dateParts[0]?.toString() || '';
      
      if (dateParts.length >= 3) {
        // Full date: year, month, day
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
        const monthName = months[dateParts[1] - 1] || '';
        publishedDate = `${monthName} ${dateParts[2]}, ${dateParts[0]}`;
      } else if (dateParts.length >= 2) {
        // Month and year
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
        const monthName = months[dateParts[1] - 1] || '';
        publishedDate = `${monthName} ${dateParts[0]}`;
      } else {
        // Year only
        publishedDate = year;
      }
    }
    
    // Determine source badge and if leading journal
    const journalLower = journal.toLowerCase();
    let source = journal;
    let isLeadingJournal = false;
    
    for (const [key, abbrev] of Object.entries(LEADING_JOURNALS)) {
      if (journalLower.includes(key)) {
        source = abbrev;
        isLeadingJournal = true;
        break;
      }
    }
    
    return {
      title,
      authors,
      journal,
      publishedDate,
      year,
      doi,
      url: `https://doi.org/${doi}`,
      source,
      isLeadingJournal,
    };
  } catch (error) {
    console.error(`Error fetching metadata for DOI ${doi}:`, error);
    return null;
  }
}

/**
 * Fetch metadata from a reference URL
 * Supports DOI URLs and will expand to support PubMed URLs
 */
export async function fetchMetadataFromURL(url: string): Promise<ArticleMetadata | null> {
  // Try to extract DOI from URL
  const doi = extractDOIFromURL(url);
  if (doi) {
    return fetchMetadataFromDOI(doi);
  }
  
  // TODO: Add PubMed API support for pubmed.ncbi.nlm.nih.gov URLs
  // For now, return null for non-DOI URLs
  return null;
}

/**
 * Cache for metadata to avoid repeated API calls
 */
const metadataCache = new Map<string, ArticleMetadata | null>();

/**
 * Fetch metadata with caching
 */
export async function fetchMetadataWithCache(url: string): Promise<ArticleMetadata | null> {
  if (metadataCache.has(url)) {
    return metadataCache.get(url) || null;
  }
  
  const metadata = await fetchMetadataFromURL(url);
  metadataCache.set(url, metadata);
  return metadata;
}

/**
 * Clear the metadata cache
 */
export function clearMetadataCache(): void {
  metadataCache.clear();
}
