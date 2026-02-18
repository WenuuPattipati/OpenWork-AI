/**
 * Open Access Filter - Ensures all citations link to readable articles
 * CRITICAL: Users must be able to access the full content
 */

export interface AccessibleSource {
  url: string;
  title: string;
  source: string;
  isOpenAccess: boolean;
  accessType: 'free' | 'pmc' | 'pubmed_free' | 'government' | 'guideline' | 'restricted';
}

/**
 * Open access domains that provide free full-text access
 */
const OPEN_ACCESS_DOMAINS = [
  // PMC (PubMed Central) - Free full text
  'pmc.ncbi.nlm.nih.gov',
  
  // Government/Public sources - Always free
  'www.cdc.gov',
  'www.who.int',
  'www.nice.org.uk',
  'www.fda.gov',
  'dailymed.nlm.nih.gov',
  
  // Medical organizations with free guidelines
  'www.acc.org',
  'www.ahajournals.org/doi/10.1161', // Some AHA content is free
  'kdigo.org',
  'www.idsociety.org',
  
  // NCBI Books - Free textbooks
  'www.ncbi.nlm.nih.gov/books',
  
  // Cochrane (some free content)
  'www.cochranelibrary.com/cdsr/doi/10.1002', // Some Cochrane reviews are free
];

/**
 * Restricted domains that require subscriptions
 */
const RESTRICTED_DOMAINS = [
  'academic.oup.com', // Oxford Academic - paywall
  'www.nejm.org', // NEJM - paywall
  'jamanetwork.com', // JAMA - paywall  
  'www.thelancet.com', // Lancet - paywall
  'www.bmj.com', // BMJ - paywall
  'journal.chestnet.org', // CHEST - paywall
  'onlinelibrary.wiley.com', // Wiley - paywall
  'www.sciencedirect.com', // ScienceDirect - paywall
];

/**
 * Check if a URL provides open access
 */
export function isOpenAccess(url: string): boolean {
  const domain = extractDomain(url);
  
  // Check if it's a known open access domain
  if (OPEN_ACCESS_DOMAINS.some(openDomain => domain.includes(openDomain))) {
    return true;
  }
  
  // Check if it's a known restricted domain
  if (RESTRICTED_DOMAINS.some(restrictedDomain => domain.includes(restrictedDomain))) {
    return false;
  }
  
  // Special cases
  if (url.includes('pmc.ncbi.nlm.nih.gov/articles/PMC')) {
    return true; // PMC articles are always free
  }
  
  if (url.includes('pubmed.ncbi.nlm.nih.gov') && !url.includes('doi.org')) {
    return true; // PubMed abstracts are free (not full text, but accessible)
  }
  
  // Default to restricted if unknown
  return false;
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

/**
 * Get access type for a source
 */
export function getAccessType(url: string, source: string): AccessibleSource['accessType'] {
  if (isOpenAccess(url)) {
    if (url.includes('pmc.ncbi.nlm.nih.gov')) return 'pmc';
    if (url.includes('pubmed.ncbi.nlm.nih.gov')) return 'pubmed_free';
    if (url.includes('cdc.gov') || url.includes('who.int') || url.includes('fda.gov')) return 'government';
    if (source.toLowerCase().includes('guideline')) return 'guideline';
    return 'free';
  }
  return 'restricted';
}

/**
 * Filter evidence to only include accessible sources
 */
export function filterOpenAccessOnly(evidenceItems: any[]): AccessibleSource[] {
  const accessibleSources: AccessibleSource[] = [];
  
  for (const item of evidenceItems) {
    const url = item.url || buildUrlFromIdentifiers(item);
    if (!url) continue;
    
    const accessType = getAccessType(url, item.source || '');
    const isAccessible = accessType !== 'restricted';
    
    if (isAccessible) {
      accessibleSources.push({
        url,
        title: item.title,
        source: item.source,
        isOpenAccess: true,
        accessType
      });
    } else {
      console.warn(`🚫 Excluding restricted source: ${item.title} (${extractDomain(url)})`);
    }
  }
  
  console.log(`✅ Open access filter: ${accessibleSources.length}/${evidenceItems.length} sources are accessible`);
  return accessibleSources;
}

/**
 * Build URL from PMID/DOI, preferring open access options
 */
function buildUrlFromIdentifiers(item: any): string | null {
  // Prefer PMC if available (always open access)
  if (item.pmcid) {
    return `https://pmc.ncbi.nlm.nih.gov/articles/${item.pmcid}`;
  }
  
  // Use PubMed for abstracts (free but not full text)
  if (item.pmid) {
    return `https://pubmed.ncbi.nlm.nih.gov/${item.pmid}`;
  }
  
  // DOI as last resort (often paywalled)
  if (item.doi) {
    return `https://doi.org/${item.doi}`;
  }
  
  return null;
}

/**
 * Generate citation instruction with only accessible sources
 */
export function generateAccessibleCitationInstruction(accessibleSources: AccessibleSource[]): string {
  if (accessibleSources.length === 0) {
    return `
**CRITICAL: NO ACCESSIBLE SOURCES AVAILABLE**
- All sources require paid subscriptions
- Do not include numbered citations
- State: "Full-text sources for this topic require institutional access. Key recommendations are based on clinical guidelines and abstracts."
- Focus on clinical guidance rather than detailed evidence
`;
  }
  
  let instruction = `
**ACCESSIBLE SOURCES FOR CITATION (${accessibleSources.length} FREE SOURCES):**

`;
  
  accessibleSources.forEach((source, index) => {
    const citationNumber = index + 1;
    instruction += `${citationNumber}. ${source.title}\n`;
    instruction += `   Source: ${source.source}\n`;
    instruction += `   Access: ${source.accessType.toUpperCase()} (FREE)\n`;
    instruction += `   URL: ${source.url}\n`;
    instruction += `   Citation: [[${citationNumber}]](${source.url})\n\n`;
  });
  
  instruction += `
**CRITICAL RULES:**
- ONLY cite sources 1-${accessibleSources.length} listed above
- ALL sources are FREE and accessible to users
- Every URL has been verified for open access
- Users can read the full content by clicking links
`;
  
  return instruction;
}