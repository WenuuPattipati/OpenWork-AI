/**
 * Reference Object Layer - Strict Reference Model
 * 
 * Prevents title/URL/badge mis-wiring by enforcing structured reference objects
 */

export interface Reference {
  id: string;
  title: string;
  year: string;
  source: string;
  url: string;
  type: 'guideline' | 'trial' | 'review' | 'article' | 'consumer';
  badges: string[];
  pmid?: string;
  doi?: string;
}

/**
 * Convert evidence item to structured reference
 */
export function createReference(evidenceItem: any, source: string): Reference | null {
  // Extract title
  const title = evidenceItem.title || evidenceItem.name || evidenceItem.briefTitle;
  if (!title) return null;
  
  // Extract identifiers
  const pmid = evidenceItem.pmid || evidenceItem.articleIds?.pmid;
  const doi = evidenceItem.doi || evidenceItem.articleIds?.doi;
  
  // Build URL
  let url = '';
  if (pmid) {
    url = `https://pubmed.ncbi.nlm.nih.gov/${pmid}`;
  } else if (doi) {
    url = `https://doi.org/${doi}`;
  } else if (evidenceItem.url) {
    url = evidenceItem.url;
  } else {
    return null; // No valid URL
  }
  
  // Determine type and badges
  const type = determineReferenceType(evidenceItem, source);
  const badges = generateBadges(evidenceItem, source, type);
  
  return {
    id: pmid || doi || url,
    title,
    year: extractYear(evidenceItem),
    source,
    url,
    type,
    badges,
    pmid,
    doi
  };
}

function determineReferenceType(item: any, source: string): Reference['type'] {
  if (source.includes('guideline') || item.type === 'Anchor Guideline') return 'guideline';
  if (source.includes('trial') || item.studyType) return 'trial';
  if (item.title?.toLowerCase().includes('systematic review') || 
      item.title?.toLowerCase().includes('meta-analysis')) return 'review';
  if (source.includes('medlineplus') || source.includes('cdc') || 
      source.includes('who')) return 'consumer';
  return 'article';
}

function generateBadges(item: any, source: string, type: Reference['type']): string[] {
  const badges: string[] = [];
  
  // Source badge
  if (source.includes('cochrane')) badges.push('Cochrane');
  else if (source.includes('pubmed')) badges.push('PubMed');
  else if (source.includes('pmc')) badges.push('PMC');
  else if (type === 'guideline') badges.push('Practice Guideline');
  else badges.push('Research Study');
  
  // Quality badge
  if (type === 'review') badges.push('Systematic Review');
  else if (isRecentPublication(item)) badges.push('Recent (≤3y)');
  else if (isHighImpactJournal(item)) badges.push('High-Impact');
  
  return badges;
}

function extractYear(item: any): string {
  if (item.year) return item.year.toString();
  if (item.publicationDate) return new Date(item.publicationDate).getFullYear().toString();
  if (item.pubDate) return new Date(item.pubDate).getFullYear().toString();
  return new Date().getFullYear().toString();
}

function isRecentPublication(item: any): boolean {
  const year = parseInt(extractYear(item));
  return year >= new Date().getFullYear() - 3;
}

function isHighImpactJournal(item: any): boolean {
  const journal = item.journal?.toLowerCase() || '';
  const highImpact = ['nejm', 'lancet', 'jama', 'bmj', 'circulation', 'nature', 'science'];
  return highImpact.some(j => journal.includes(j));
}

/**
 * Format references for display
 */
export function formatReferencesSection(references: Reference[]): string {
  if (references.length === 0) return '';
  
  let formatted = '## References\n\n';
  
  references.forEach((ref, index) => {
    formatted += `${index + 1}. ${ref.title}\n`;
    formatted += `   ${ref.source}. ${ref.year}.`;
    if (ref.pmid) formatted += ` PMID:${ref.pmid}`;
    if (ref.doi) formatted += ` doi:${ref.doi}`;
    formatted += '\n';
    formatted += `   ${ref.badges.join(' - ')}\n\n`;
  });
  
  return formatted;
}

/**
 * Check if URL is a Google search URL
 */
export function isGoogleSearchURL(url: string): boolean {
  return url.includes('google.com/search') || url.includes('google.com/url');
}