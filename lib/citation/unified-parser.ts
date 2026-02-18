/**
 * Unified Citation Parser
 * Consolidates all citation parsing logic for both Doctor and General modes
 * Supports PECS (Parse, Extract, Convert, Show) architecture
 */

import type { ParsedReference, CitationMode } from '@/lib/types/citation';

export interface UnifiedParsedResponse {
  mainContent: string;
  references: ParsedReference[];
  followUpQuestions: string[];
}

/**
 * Main parser - extracts content, references, and follow-up questions
 */
export function parseResponse(response: string, mode: CitationMode = 'doctor'): UnifiedParsedResponse {
  // Step 1: Extract follow-up questions (if present)
  const { content: contentWithoutFollowUp, followUpQuestions } = extractFollowUpQuestions(response);
  
  // Step 2: Extract references section
  const { mainContent, referencesText } = extractReferencesSection(contentWithoutFollowUp);
  
  // Step 3: Parse references into structured format
  const references = parseReferences(referencesText, mode);
  
  return {
    mainContent,
    references,
    followUpQuestions
  };
}

/**
 * Extract follow-up questions from response
 */
function extractFollowUpQuestions(response: string): {
  content: string;
  followUpQuestions: string[];
} {
  const followUpPatterns = [
    /##?\s*You Might Also Want to Know[:\s]*\n([\s\S]*?)(?=\n##|$)/i,
    /##?\s*Follow-?Up Questions?[:\s]*\n([\s\S]*?)(?=\n##|$)/i
  ];
  
  for (const pattern of followUpPatterns) {
    const match = response.match(pattern);
    if (match && match[1]) {
      const questions = match[1]
        .split('\n')
        .map(q => q.trim())
        .filter(q => {
          // Accept numbered (1., 2., 3.), bulleted (-, *), or plain questions
          return q.match(/^\d+\./) || q.startsWith('- ') || q.startsWith('* ') || q.endsWith('?');
        })
        .map(q => {
          // Remove numbering or bullets
          if (q.match(/^\d+\./)) {
            return q.replace(/^\d+\.\s*/, '').trim();
          }
          if (q.startsWith('- ') || q.startsWith('* ')) {
            return q.substring(2).trim();
          }
          return q.trim();
        })
        .filter(q => q.length > 0 && q.endsWith('?'));
      
      if (questions.length > 0) {
        const content = response.substring(0, match.index).trim();
        return { content, followUpQuestions: questions };
      }
    }
  }
  
  return { content: response, followUpQuestions: [] };
}

/**
 * Extract references section from content
 * Now also extracts Image References section
 */
function extractReferencesSection(content: string): {
  mainContent: string;
  referencesText: string;
} {
  // First, identify all potential sections
  const referenceHeaders = [
    /##?\s*References?\s*\n/i,
    /\*\*References?\*\*\s*\n/i,
    /References?:?\s*\n/i
  ];

  const imageReferenceHeaders = [
    /##?\s*Image References?\s*\n/i,
    /\*\*Image References?\*\*\s*\n/i,
    /Image References?:?\s*\n/i
  ];

  const followUpHeaders = [
    /##?\s*Follow-?Up Questions?\s*\n/i,
    /\*\*Follow-?Up Questions?\*\*\s*\n/i,
    /Follow-?Up Questions?:?\s*\n/i
  ];

  // Find the first occurrence of any reference header
  let firstRefIndex = -1;
  for (const header of [...referenceHeaders, ...imageReferenceHeaders]) {
    const match = content.match(header);
    if (match && (firstRefIndex === -1 || match.index! < firstRefIndex)) {
      firstRefIndex = match.index!;
    }
  }

  if (firstRefIndex === -1) {
    return { mainContent: content, referencesText: '' };
  }

  // Determine main content (everything before the first reference section)
  const mainContent = content.substring(0, firstRefIndex).trim();

  // Extract everything from firstRefIndex until follow-up questions or end of string
  let referencesContent = content.substring(firstRefIndex);

  let followUpIndex = -1;
  for (const header of followUpHeaders) {
    const match = referencesContent.match(header);
    if (match && (followUpIndex === -1 || match.index! < followUpIndex)) {
      followUpIndex = match.index!;
    }
  }

  const referencesText = followUpIndex !== -1
    ? referencesContent.substring(0, followUpIndex).trim()
    : referencesContent.trim();

  return { mainContent, referencesText };
}

/**
 * Parse references from text into structured format
 */
function parseReferences(referencesText: string, mode: CitationMode): ParsedReference[] {
  if (!referencesText) return [];
  
  const references: ParsedReference[] = [];
  
  // Split by numbered lines (1., 2., 3. or [1], [2], [3])
  const refLines = referencesText.split(/\n(?=\s*\d+\.\s|\[\d+\])/);
  
  refLines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    
    // Extract reference number from the string
    const numMatch = trimmed.match(/^(?:(\d+)\.|\[(\d+)\])/);
    const extractedNum = numMatch ? parseInt(numMatch[1] || numMatch[2]) : NaN;

    // Fallback to sequential if no number found, but prioritize extracted number
    // to match inline [[N]] citations
    const number = isNaN(extractedNum) ? references.length + 1 : extractedNum;
    
    // Parse reference metadata
    const parsed = parseReferenceMetadata(trimmed, number);
    
    // Only add if we haven't seen this number yet or if it's valid
    if (parsed.isValid) {
      const existingIdx = references.findIndex(r => r.number === parsed.number);
      if (existingIdx !== -1) {
        // If duplicate, pick the one with more metadata
        const existing = references[existingIdx];
        const currentScore = (parsed.pmid ? 1 : 0) + (parsed.url ? 1 : 0) + (parsed.authors.length > 0 ? 1 : 0);
        const existingScore = (existing.pmid ? 1 : 0) + (existing.url ? 1 : 0) + (existing.authors.length > 0 ? 1 : 0);

        if (currentScore > existingScore) {
          references[existingIdx] = parsed;
        }
      } else {
        references.push(parsed);
      }
    }
  });
  
  return references.sort((a, b) => a.number - b.number);
}

/**
 * Parse individual reference metadata
 */
function parseReferenceMetadata(refString: string, number: number): ParsedReference {
  let title = '';
  let url = '';
  let authors: string[] = [];
  let journal = '';
  let year = '';
  let doi: string | undefined;
  let pmid: string | undefined;
  let pmcid: string | undefined;
  const badges: string[] = [];
  let imageSource: 'Open-i' | 'InjuryMap' | undefined;
  let imageUrl: string | undefined;
  
  // Check if this is an image reference
  const refLower = refString.toLowerCase();
  if (refLower.includes('image from open-i') || 
      refLower.includes('image from open-i, national library') ||
      refLower.includes('open-i, national library of medicine') ||
      refLower.includes('openi.nlm.nih.gov')) {
    imageSource = 'Open-i';
  } else if (refLower.includes('image from injurymap') || 
             refLower.includes('injurymap free human anatomy')) {
    imageSource = 'InjuryMap';
  }
  
  // Extract title and URL from markdown link format: [Title](URL)
  const markdownMatch = refString.match(/\[([^\]]+)\]\(([^)]+)\)/);
  if (markdownMatch) {
    title = markdownMatch[1].trim();
    url = markdownMatch[2].trim();
    if (imageSource) {
      imageUrl = url;
    }
  } else {
    // Extract title from plain text (first line or sentence)
    const titleMatch = refString.match(/^(?:\d+\.|\[\d+\])\s*(.+?)(?:\.|$)/);
    title = titleMatch ? titleMatch[1].trim() : refString.replace(/^(?:\d+\.|\[\d+\])\s*/, '').trim();
    
    // For image references, try to extract URL from text
    if (imageSource) {
      const urlMatch = refString.match(/(https?:\/\/[^\s]+)/);
      if (urlMatch) {
        url = urlMatch[1].trim();
        imageUrl = url;
      }
    }
  }
  
  // Special handling for image references - extract title from the reference text
  if (imageSource) {
    // Try to extract article/image title before "Image from"
    const imageTitleMatch = refString.match(/^(?:\d+\.|\[\d+\])\s*(.+?)\.\s*Image from/i);
    if (imageTitleMatch) {
      title = imageTitleMatch[1].trim();
    } else {
      // If no title found, use a generic title
      title = title || `Medical Image from ${imageSource}`;
    }
  }
  
  // Extract PMCID first (prefer full-text over abstract)
  const pmcMatch = refString.match(/PMC(ID)?:?\s*(PMC\d+)/i);
  if (pmcMatch) {
    pmcid = pmcMatch[2];
    // PMC has priority - full text available
    if (!url) {
      url = `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/`;
    }
  }
  
  // Extract PMID
  const pmidMatch = refString.match(/PMID:?\s*(\d+)/i);
  if (pmidMatch) {
    pmid = pmidMatch[1];
    // Only use PMID URL if no PMC URL exists
    if (!url && !pmcid) {
      url = `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
    }
  }
  
  // Extract DOI
  const doiMatch = refString.match(/doi:?\s*(10\.\d{4,9}\/[-._;()\/:A-Za-z0-9]+)/i);
  if (doiMatch) {
    doi = doiMatch[1].replace(/[.,;:)\]]+$/, ''); // Clean trailing punctuation
    // Only use DOI if no PMC or PMID URL exists
    if (!url && !pmcid && !pmid) {
      url = `https://doi.org/${doi}`;
    }
  }
  
  // Extract NCBI Bookshelf ID
  const bookshelfMatch = refString.match(/NBK(\d+)/i);
  if (bookshelfMatch && !url) {
    url = `https://www.ncbi.nlm.nih.gov/books/NBK${bookshelfMatch[1]}/`;
  }
  
  // Extract Europe PMC ID
  const europePMCMatch = refString.match(/europepmc\.org\/article\/MED\/(\d+)/i);
  if (europePMCMatch && !url) {
    url = `https://europepmc.org/article/MED/${europePMCMatch[1]}`;
  }
  
  // Validate URL format
  if (url) {
    try {
      new URL(url);
    } catch (e) {
      console.warn(`Invalid URL detected: ${url}`);
      url = ''; // Clear invalid URL
    }
  }
  
  // Extract authors (look for pattern: "Authors: Name1, Name2, Name3")
  const authorsMatch = refString.match(/Authors?:\s*([^.]+)/i);
  if (authorsMatch) {
    authors = authorsMatch[1]
      .split(',')
      .map(a => a.trim())
      .filter(a => a.length > 0)
      .slice(0, 3); // Limit to first 3 authors
  }
  
  // Extract journal
  const journalMatch = refString.match(/Journal:\s*([^.]+)/i);
  if (journalMatch) {
    journal = journalMatch[1].trim();
  } else {
    // Try to extract journal from common patterns
    const journalPatterns = [
      /\.\s+([A-Z][^.]+)\.\s+\d{4}/,  // ". Journal Name. 2026"
      /\.\s+([A-Z][^.]+)\s+\(\d{4}\)/, // ". Journal Name (2026)"
    ];
    
    for (const pattern of journalPatterns) {
      const match = refString.match(pattern);
      if (match) {
        journal = match[1].trim();
        break;
      }
    }
  }
  
  // Extract year
  const yearMatch = refString.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    year = yearMatch[0];
  }
  
  // Detect quality badges
  // (refLower already declared above for image detection)
  
  // Image Reference - Add badge first if it's an image
  if (imageSource) {
    // Don't add other badges for image references
    // The component will show the image badge separately
  } else {
    // PMCID Badge - Add first if PMC article (full-text available)
    if (pmcid) {
      badges.push('PMCID');
    }
    
    // Practice Guideline
    if (refLower.includes('guideline') || refLower.includes('practice guideline') || 
        refLower.includes('clinical practice') || refLower.includes('standards of care')) {
      badges.push('Practice Guideline');
    }
    
    // Systematic Review / Meta-Analysis
    if (refLower.includes('systematic review') || refLower.includes('meta-analysis') || 
        refLower.includes('cochrane')) {
      badges.push('Systematic Review');
    }
    
    // Recent (≤3 years)
    const currentYear = new Date().getFullYear();
    if (year && parseInt(year) >= currentYear - 3) {
      badges.push('Recent');
    }
    
    // Leading Journal
    const leadingJournals = [
      'new england journal', 'nejm', 'lancet', 'jama', 'bmj', 'british medical journal',
      'nature', 'science', 'cell', 'circulation', 'annals of internal medicine'
    ];
    if (leadingJournals.some(j => refLower.includes(j))) {
      badges.push('Leading Journal');
    }
  }
  
  // Validate reference - relax title length, prioritize identifiers
  const isValid = (title.length > 2 || imageSource !== undefined) &&
    (url.length > 0 || pmid !== undefined || doi !== undefined || imageSource !== undefined);
  
  return {
    id: `ref-${number}`,
    number,
    title,
    authors,
    journal,
    year,
    doi,
    pmid,
    pmcid,
    url,
    badges: badges as any[],
    isValid,
    imageSource,
    imageUrl
  };
}

/**
 * Clean citation markers from text for display
 */
export function cleanCitationMarkers(text: string): string {
  let result = text;
  
  // 1. Remove bracketed/parenthetical citations that are likely to leave artifacts

  // Remove [[N]](url) format
  result = result.replace(/\[\[(\d+)\]\]\((https?:\/\/[^\s\)]+)\)/g, '');
  // Remove [[N](#)] format (malformed)
  result = result.replace(/\[\[(\d+)\]\(([^)]+)\)\]/g, '');
  // Remove [[N]] format
  result = result.replace(/\[\[(\d+(?:,\s*\d+)*)\]\]/g, '');
  // Remove [N] format (but not markdown links)
  result = result.replace(/(?<!\[)\[(\d+(?:,\s*\d+)*)\](?!\()/g, '');
  // Remove ^[N]^ format
  result = result.replace(/\^\[(\d+(?:,\s*\d+)*)\]\^/g, '');
  // Remove citation numbers in parentheses: ([1], ), ([1]), (1, 2), etc.
  result = result.replace(/\(\[?\d+(?:,\s*\d+)*\]?(?:,\s*)?\)/g, '');
  // Remove citation numbers with brackets followed by comma and space: [[1], ], [1], 
  result = result.replace(/\[?\[?\d+(?:,\s*\d+)*\]?\]?(?:,\s*)+/g, '');

  // 2. Clean up punctuation and spacing artifacts
  
  // Remove spaces before periods/commas (caused by removed citations)
  result = result.replace(/\s+([.,;!])/g, '$1');
  
  // Fix multiple spaces
  result = result.replace(/\s{2,}/g, ' ');
  
  // Remove empty parentheses/brackets left over (e.g., "( )" or "[ ]")
  result = result.replace(/\(\s*\)/g, '');
  result = result.replace(/\[\s*\]/g, '');

  // Remove standalone ^ symbols
  result = result.replace(/\^+/g, '');

  // Remove trailing commas and spaces that might be left over before a period
  result = result.replace(/,\s*\./g, '.');

  // Final trim and cleanup
  return result.trim();
}

/**
 * Extract citation numbers from text
 */
export function extractCitationNumbers(text: string): number[] {
  const numbers: number[] = [];
  
  const patterns = [
    /\[\[(\d+(?:,\s*\d+)*)\]\]\((https?:\/\/[^\s\)]+)\)/g,  // [[1]](url)
    /\[\[(\d+)\]\(([^)]+)\)\]/g,                            // [[1](#)] (malformed)
    /\[\[(\d+(?:,\s*\d+)*)\]\]/g,                           // [[1]]
    /(?<!\[)\[(\d+(?:,\s*\d+)*)\](?!\()/g,                  // [1]
    /\^\[(\d+(?:,\s*\d+)*)\]\^/g                            // ^[1]^
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const numberStr = match[1];
      const nums = numberStr.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
      numbers.push(...nums);
    }
  });
  
  // Remove duplicates and sort
  return [...new Set(numbers)].sort((a, b) => a - b);
}
