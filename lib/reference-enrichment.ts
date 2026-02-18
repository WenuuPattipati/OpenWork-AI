/**
 * Reference Enrichment Module
 * Provides functions to parse, enrich, and format citations with DOIs/PMIDs
 */

export interface CitationMetadata {
  title?: string;
  authors?: string;
  journal?: string;
  year?: string;
  pmid?: string;
  doi?: string;
  url?: string;
}

export interface EnrichedCitation extends CitationMetadata {
  enriched: boolean;
  source?: 'pubmed' | 'crossref' | 'both';
}

export interface EnrichmentOptions {
  maxConcurrent?: number;
  delayMs?: number;
}

/**
 * Parse a reference string into structured metadata
 */
export function parseReferenceString(refString: string): CitationMetadata {
  const citation: CitationMetadata = {};
  
  // Extract PMID
  const pmidMatch = refString.match(/PMID:?\s*(\d+)/i);
  if (pmidMatch) {
    citation.pmid = pmidMatch[1];
  }
  
  // Extract DOI
  const doiMatch = refString.match(/doi:?\s*(10\.\d{4,9}\/[^\s\]]+)/i);
  if (doiMatch) {
    citation.doi = doiMatch[1];
  }
  
  // Extract year (4 digits)
  const yearMatch = refString.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    citation.year = yearMatch[0];
  }
  
  // Clean reference text for title extraction
  const cleanRef = refString
    .replace(/^\d+\.\s*/, '') // Remove numbering
    .replace(/PMID:?\s*\d+/gi, '') // Remove PMID
    .replace(/doi:?\s*10\.\d{4,9}\/[^\s\]]+/gi, '') // Remove DOI
    .replace(/\[Enriched:.*?\]/gi, '') // Remove enrichment indicators
    .trim();
  
  // Extract title (first sentence or up to first period)
  const titleMatch = cleanRef.match(/^([^.]+)/);
  if (titleMatch) {
    citation.title = titleMatch[1].trim();
  }
  
  return citation;
}

/**
 * Fetch metadata from PubMed API
 */
async function fetchFromPubMed(pmid: string): Promise<Partial<CitationMetadata> | null> {
  try {
    const response = await fetch(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmid}&retmode=json`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const article = data.result?.[pmid];
    
    if (!article) return null;
    
    return {
      title: article.title,
      authors: article.authors?.slice(0, 3).map((a: any) => a.name).join(', '),
      journal: article.fulljournalname || article.source,
      year: article.pubdate?.substring(0, 4),
      pmid: pmid
    };
  } catch (error) {
    console.error(`Error fetching PubMed data for PMID ${pmid}:`, error);
    return null;
  }
}

/**
 * Fetch metadata from CrossRef API
 */
async function fetchFromCrossRef(doi: string): Promise<Partial<CitationMetadata> | null> {
  try {
    const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
      headers: {
        'User-Agent': 'OpenWork-AI/1.0 (mailto:support@openwork.ai)',
      },
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const work = data.message;
    
    if (!work) return null;
    
    const authors = work.author?.slice(0, 3).map((a: any) => {
      if (a.given && a.family) {
        return `${a.given} ${a.family}`;
      }
      return a.name || a.family || '';
    }).filter(Boolean).join(', ');
    
    const year = work.published?.['date-parts']?.[0]?.[0]?.toString() || 
                 work['published-print']?.['date-parts']?.[0]?.[0]?.toString() ||
                 work['published-online']?.['date-parts']?.[0]?.[0]?.toString();
    
    return {
      title: work.title?.[0],
      authors: authors || undefined,
      journal: work['container-title']?.[0],
      year,
      doi: doi
    };
  } catch (error) {
    console.error(`Error fetching CrossRef data for DOI ${doi}:`, error);
    return null;
  }
}

/**
 * Enrich citations with additional metadata
 */
export async function enrichCitations(
  citations: CitationMetadata[], 
  options: EnrichmentOptions = {}
): Promise<EnrichedCitation[]> {
  const { maxConcurrent = 2, delayMs = 1000 } = options;
  const enriched: EnrichedCitation[] = [];
  
  for (let i = 0; i < citations.length; i += maxConcurrent) {
    const batch = citations.slice(i, i + maxConcurrent);
    
    const batchPromises = batch.map(async (citation): Promise<EnrichedCitation> => {
      const result: EnrichedCitation = { ...citation, enriched: false };
      
      // Try to enrich from PubMed if PMID exists
      if (citation.pmid && (!citation.title || !citation.authors)) {
        const pubmedData = await fetchFromPubMed(citation.pmid);
        if (pubmedData) {
          Object.assign(result, pubmedData);
          result.enriched = true;
          result.source = result.source ? 'both' : 'pubmed';
        }
      }
      
      // Try to enrich from CrossRef if DOI exists
      if (citation.doi && (!citation.title || !citation.authors)) {
        const crossrefData = await fetchFromCrossRef(citation.doi);
        if (crossrefData) {
          Object.assign(result, crossrefData);
          result.enriched = true;
          result.source = result.source === 'pubmed' ? 'both' : 'crossref';
        }
      }
      
      return result;
    });
    
    const batchResults = await Promise.all(batchPromises);
    enriched.push(...batchResults);
    
    // Add delay between batches
    if (i + maxConcurrent < citations.length && delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return enriched;
}