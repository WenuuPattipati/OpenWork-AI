/**
 * PECS Inline Citation Parser
 * Parses AI responses and converts citation markers to Sources badges
 */

import type { ParsedReference, TextSegment, SourcesBadgeData, CitationMode } from '@/lib/types/citation';

export interface PECSParsedResponse {
  segments: TextSegment[];
  references: ParsedReference[];
  mainContent: string;
}

/**
 * Parse response and convert citation markers to Sources badge data
 */
export function parseResponseForPECS(
  response: string,
  mode: CitationMode
): PECSParsedResponse {
  // Extract main content and references section
  const { mainContent, references: refStrings } = extractContentAndReferences(response);
  
  // Parse references into structured format
  const references = parseReferencesFromStrings(refStrings);
  
  // Segment main content by sentences and extract citations
  const segments = segmentContentWithCitations(mainContent);
  
  return {
    segments,
    references,
    mainContent
  };
}

/**
 * Extract main content and references section from response
 */
function extractContentAndReferences(response: string): {
  mainContent: string;
  references: string[];
} {
  // Find references section
  const referencePatterns = [
    /##?\s*References?\s*\n([\s\S]+)$/i,
    /\*\*References?\*\*\s*\n([\s\S]+)$/i,
    /References?:?\s*\n([\s\S]+)$/i,
    /\n\s*References?\s*\n([\s\S]+)$/i
  ];
  
  let mainContent = response;
  let referencesText = '';
  
  for (const pattern of referencePatterns) {
    const match = response.match(pattern);
    if (match) {
      mainContent = response.substring(0, match.index).trim();
      referencesText = match[1].trim();
      break;
    }
  }
  
  // Parse references
  const references: string[] = [];
  if (referencesText) {
    const refLines = referencesText.split(/\n(?=\d+\.)/);
    
    refLines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      // Clean reference line
      const ref = trimmed.replace(/^\d+\.\s*/, '').trim();
      if (ref && ref.length > 5) {
        references.push(ref);
      }
    });
  }
  
  return { mainContent, references };
}

/**
 * Parse reference strings into structured ParsedReference objects
 */
function parseReferencesFromStrings(refStrings: string[]): ParsedReference[] {
  return refStrings.map((refString, index) => {
    const number = index + 1;
    
    // Extract title from markdown link or plain text
    let title = '';
    let url = '';
    
    const markdownMatch = refString.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (markdownMatch) {
      title = markdownMatch[1];
      url = markdownMatch[2];
    } else {
      // Extract title from plain text
      const titleMatch = refString.match(/^(.+?)(?:\.|$)/);
      title = titleMatch ? titleMatch[1] : refString;
    }
    
    // Extract PMID for URL construction
    if (!url) {
      const pmidMatch = refString.match(/PMID:?\s*(\d+)/i);
      if (pmidMatch) {
        url = `https://pubmed.ncbi.nlm.nih.gov/${pmidMatch[1]}/`;
      }
    }
    
    // Extract DOI for URL construction
    if (!url) {
      const doiMatch = refString.match(/doi:?\s*(10\.\S+)/i);
      if (doiMatch) {
        url = `https://doi.org/${doiMatch[1]}`;
      }
    }
    
    return {
      id: `ref-${number}`,
      number,
      title: title.trim(),
      authors: [],
      journal: '',
      year: '',
      doi: undefined,
      pmid: undefined,
      pmcid: undefined,
      url,
      badges: [],
      isValid: title.length > 5
    };
  });
}

/**
 * Segment content by sentences and extract citation markers
 */
function segmentContentWithCitations(content: string): TextSegment[] {
  const segments: TextSegment[] = [];
  
  // Split content into sentences (simple approach)
  const sentences = content.split(/(?<=[.!?])\s+/);
  
  sentences.forEach((sentence, index) => {
    const segmentId = `segment-${index}`;
    
    // Extract citation numbers from this sentence
    const citationNumbers = extractCitationNumbers(sentence);
    
    // Clean sentence (remove citation markers for display)
    const cleanText = removeCitationMarkers(sentence);
    
    segments.push({
      id: segmentId,
      text: cleanText,
      citationNumbers,
      originalText: sentence // Keep original for copy behavior
    });
  });
  
  return segments;
}

/**
 * Extract citation numbers from text
 */
function extractCitationNumbers(text: string): number[] {
  const numbers: number[] = [];
  
  // Match various citation formats: [[1]], [[1,2,3]], [1], ^[1]^
  const patterns = [
    /\[\[(\d+(?:,\s*\d+)*)\]\]/g,  // [[1]] or [[1,2,3]]
    /(?<!\[)\[(\d+(?:,\s*\d+)*)\](?!\()/g,  // [1] but not [text](url)
    /\^\[(\d+(?:,\s*\d+)*)\]\^/g   // ^[1]^
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

/**
 * Remove citation markers from text for clean display
 */
function removeCitationMarkers(text: string): string {
  let result = text;
  
  // Remove [[N]](url) format
  result = result.replace(/\[\[(\d+)\]\]\((https?:\/\/[^\s\)]+)\)/g, '');
  
  // Remove [[N]] format
  result = result.replace(/\[\[(\d+(?:,\s*\d+)*)\]\]/g, '');
  
  // Remove [N] format (but not markdown links)
  result = result.replace(/(?<!\[)\[(\d+(?:,\s*\d+)*)\](?!\()/g, '');
  
  // Remove ^[N]^ format
  result = result.replace(/\^\[(\d+(?:,\s*\d+)*)\]\^/g, '');
  
  // Remove standalone ^ symbols
  result = result.replace(/\^+/g, '');
  
  return result.trim();
}

/**
 * Generate Sources badge data for segments with citations
 */
export function generateSourcesBadges(
  segments: TextSegment[],
  mode: CitationMode
): SourcesBadgeData[] {
  const badges: SourcesBadgeData[] = [];
  
  segments.forEach(segment => {
    if (segment.citationNumbers.length > 0) {
      badges.push({
        id: `badge-${segment.id}`,
        label: 'Sources',
        refNumbers: segment.citationNumbers,
        mode
      });
    }
  });
  
  return badges;
}