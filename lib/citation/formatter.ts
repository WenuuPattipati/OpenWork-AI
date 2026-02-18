/**
 * Citation Formatting Utilities
 * Formats evidence sources in standard medical citation styles
 */

export type CitationStyle = "ama" | "vancouver" | "apa" | "compact";

export interface CitationData {
  authors?: string | string[];
  title: string;
  journal?: string;
  year?: string | number;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  pmid?: string;
  url?: string;
}

/**
 * Format authors for citations
 */
function formatAuthors(authors: string | string[] | undefined, maxAuthors: number = 6): string {
  if (!authors) return "";
  
  const authorList = Array.isArray(authors) ? authors : [authors];
  
  if (authorList.length === 0) return "";
  if (authorList.length === 1) return authorList[0];
  
  if (authorList.length <= maxAuthors) {
    return authorList.join(", ");
  }
  
  // More than maxAuthors: show first 3 + et al
  return `${authorList.slice(0, 3).join(", ")}, et al`;
}

/**
 * Format citation in AMA (American Medical Association) style
 * Example: Smith J, Doe A. Title of article. J Med. 2023;10(2):123-130. doi:10.1234/example
 */
export function formatAMA(data: CitationData): string {
  const parts: string[] = [];
  
  // Authors
  const authors = formatAuthors(data.authors, 6);
  if (authors) parts.push(authors + ".");
  
  // Title
  parts.push(data.title + ".");
  
  // Journal
  if (data.journal) {
    let journalPart = data.journal;
    
    // Add volume/issue/pages
    if (data.year) journalPart += `. ${data.year}`;
    if (data.volume) {
      journalPart += `;${data.volume}`;
      if (data.issue) journalPart += `(${data.issue})`;
      if (data.pages) journalPart += `:${data.pages}`;
    }
    
    parts.push(journalPart + ".");
  }
  
  // DOI
  if (data.doi) {
    parts.push(`doi:${data.doi}`);
  }
  
  return parts.join(" ");
}

/**
 * Format citation in Vancouver style
 * Example: Smith J, Doe A. Title of article. J Med. 2023;10(2):123-30.
 */
export function formatVancouver(data: CitationData): string {
  const parts: string[] = [];
  
  // Authors (max 6, then et al)
  const authors = formatAuthors(data.authors, 6);
  if (authors) parts.push(authors + ".");
  
  // Title
  parts.push(data.title + ".");
  
  // Journal abbreviation + year;volume(issue):pages
  if (data.journal) {
    let journalPart = data.journal;
    if (data.year) journalPart += ` ${data.year}`;
    if (data.volume) {
      journalPart += `;${data.volume}`;
      if (data.issue) journalPart += `(${data.issue})`;
      if (data.pages) {
        // Vancouver uses abbreviated page numbers (123-30 instead of 123-130)
        const pageAbbrev = abbreviatePages(data.pages);
        journalPart += `:${pageAbbrev}`;
      }
    }
    parts.push(journalPart + ".");
  }
  
  return parts.join(" ");
}

/**
 * Format citation in APA style
 * Example: Smith, J., & Doe, A. (2023). Title of article. Journal of Medicine, 10(2), 123-130. https://doi.org/10.1234/example
 */
export function formatAPA(data: CitationData): string {
  const parts: string[] = [];
  
  // Authors with & before last
  if (data.authors) {
    const authorList = Array.isArray(data.authors) ? data.authors : [data.authors];
    if (authorList.length === 1) {
      parts.push(authorList[0] + ".");
    } else if (authorList.length === 2) {
      parts.push(`${authorList[0]}, & ${authorList[1]}.`);
    } else {
      const lastAuthor = authorList[authorList.length - 1];
      const otherAuthors = authorList.slice(0, -1).join(", ");
      parts.push(`${otherAuthors}, & ${lastAuthor}.`);
    }
  }
  
  // Year
  if (data.year) parts.push(`(${data.year}).`);
  
  // Title (sentence case)
  parts.push(data.title + ".");
  
  // Journal (title case) + volume/issue/pages
  if (data.journal) {
    let journalPart = data.journal;
    if (data.volume) {
      journalPart += `, ${data.volume}`;
      if (data.issue) journalPart += `(${data.issue})`;
      if (data.pages) journalPart += `, ${data.pages}`;
    }
    parts.push(journalPart + ".");
  }
  
  // DOI as URL
  if (data.doi) {
    parts.push(`https://doi.org/${data.doi}`);
  }
  
  return parts.join(" ");
}

/**
 * Format compact citation for inline use
 * Example: Smith et al. 2023, J Med
 */
export function formatCompact(data: CitationData): string {
  const parts: string[] = [];
  
  // First author + et al
  if (data.authors) {
    const authorList = Array.isArray(data.authors) ? data.authors : [data.authors];
    const firstAuthor = authorList[0].split(" ")[0]; // Get last name
    if (authorList.length > 1) {
      parts.push(`${firstAuthor} et al.`);
    } else {
      parts.push(firstAuthor);
    }
  }
  
  // Year
  if (data.year) parts.push(data.year.toString());
  
  // Journal abbreviation
  if (data.journal) {
    const abbrev = abbreviateJournal(data.journal);
    parts.push(abbrev);
  }
  
  return parts.join(", ");
}

/**
 * Abbreviate page numbers (Vancouver style)
 * 123-130 -> 123-30
 */
function abbreviatePages(pages: string): string {
  const match = pages.match(/^(\d+)-(\d+)$/);
  if (!match) return pages;
  
  const start = match[1];
  const end = match[2];
  
  // If same length, abbreviate
  if (start.length === end.length) {
    let i = 0;
    while (i < start.length && start[i] === end[i]) {
      i++;
    }
    return `${start}-${end.substring(i)}`;
  }
  
  return pages;
}

/**
 * Abbreviate journal name (simple version)
 */
function abbreviateJournal(journal: string): string {
  // Common abbreviations
  const abbrevMap: Record<string, string> = {
    "New England Journal of Medicine": "N Engl J Med",
    "Journal of the American Medical Association": "JAMA",
    "The Lancet": "Lancet",
    "British Medical Journal": "BMJ",
    "Nature": "Nature",
    "Science": "Science",
    "Cell": "Cell",
    "Circulation": "Circulation",
    "Journal of Clinical Oncology": "J Clin Oncol",
  };
  
  return abbrevMap[journal] || journal;
}

/**
 * Format citation based on style
 */
export function formatCitation(data: CitationData, style: CitationStyle = "ama"): string {
  switch (style) {
    case "ama":
      return formatAMA(data);
    case "vancouver":
      return formatVancouver(data);
    case "apa":
      return formatAPA(data);
    case "compact":
      return formatCompact(data);
    default:
      return formatAMA(data);
  }
}

/**
 * Generate clickable citation with links
 */
export function generateCitationLinks(data: CitationData): {
  pubmed?: string;
  doi?: string;
  pubmedSearch?: string;
} {
  const links: any = {};
  
  if (data.pmid) {
    links.pubmed = `https://pubmed.ncbi.nlm.nih.gov/${data.pmid}/`;
  }
  
  if (data.doi) {
    links.doi = `https://doi.org/${data.doi}`;
  }
  
  // PubMed search link (fallback for references without PMID)
  if (data.title) {
    const searchQuery = encodeURIComponent(data.title);
    links.pubmedSearch = `https://pubmed.ncbi.nlm.nih.gov/?term=${searchQuery}`;
  }
  
  return links;
}

/**
 * Format citation with HTML links
 */
export function formatCitationWithLinks(data: CitationData, style: CitationStyle = "ama"): string {
  const citation = formatCitation(data, style);
  const links = generateCitationLinks(data);
  
  let formatted = citation;
  
  // Add PMID link
  if (data.pmid && links.pubmed) {
    formatted += ` [<a href="${links.pubmed}" target="_blank" rel="noopener">PMID: ${data.pmid}</a>]`;
  }
  
  // Add DOI link if not already in citation
  if (data.doi && links.doi && !citation.includes(data.doi)) {
    formatted += ` [<a href="${links.doi}" target="_blank" rel="noopener">DOI</a>]`;
  }
  
  return formatted;
}
