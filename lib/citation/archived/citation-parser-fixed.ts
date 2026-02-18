/**
 * FIXED Citation Parser - Simplified and Reliable
 * Replaces the complex multi-parser system with a single, robust parser
 */

export interface FixedReference {
  number: number;
  title: string;
  authors?: string;
  journal?: string;
  year?: string;
  pmid?: string;
  doi?: string;
  url: string;
  source: string;
  badges: string[];
}

export interface FixedParsedResponse {
  content: string;
  references: FixedReference[];
}

/**
 * Main parsing function - extracts references and cleans content
 */
export function parseResponseFixed(response: string): FixedParsedResponse {
  // Find references section
  const referenceMatch = response.match(/##?\s*References?\s*\n([\s\S]+)$/i);
  
  if (!referenceMatch) {
    return {
      content: cleanCitationMarkers(response),
      references: []
    };
  }
  
  const mainContent = response.substring(0, referenceMatch.index).trim();
  const referencesText = referenceMatch[1].trim();
  
  // Parse references
  const references = parseReferences(referencesText);
  
  return {
    content: cleanCitationMarkers(mainContent),
    references
  };
}

/**
 * Parse references from the references section
 */
function parseReferences(referencesText: string): FixedReference[] {
  const references: FixedReference[] = [];
  
  // Split by numbered items (1., 2., etc.)
  const refBlocks = referencesText.split(/\n(?=\d+\.)/);
  
  refBlocks.forEach((block, index) => {
    const trimmed = block.trim();
    if (!trimmed) return;
    
    // Extract reference number
    const numberMatch = trimmed.match(/^(\d+)\./);
    const number = numberMatch ? parseInt(numberMatch[1]) : index + 1;
    
    // Extract title (look for markdown link first, then plain text)
    let title = '';
    let url = '';
    
    const markdownMatch = trimmed.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (markdownMatch) {
      title = markdownMatch[1];
      url = markdownMatch[2];
    } else {
      // Extract title from first line after number
      const titleMatch = trimmed.match(/^\d+\.\s*(.+?)(?:\n|$)/);
      title = titleMatch ? titleMatch[1] : 'Untitled Reference';
    }
    
    // Extract metadata
    const pmidMatch = trimmed.match(/PMID:?\s*(\d+)/i);
    const doiMatch = trimmed.match(/doi:?\s*(10\.\S+)/i);
    const yearMatch = trimmed.match(/\b(20[0-2]\d)\b/);
    
    // Build URL if not found
    if (!url) {
      if (pmidMatch) {
        url = `https://pubmed.ncbi.nlm.nih.gov/${pmidMatch[1]}`;
      } else if (doiMatch) {
        url = `https://doi.org/${doiMatch[1]}`;
      }
    }
    
    // Extract authors (simple heuristic)
    let authors = '';
    const lines = trimmed.split('\n');
    if (lines.length > 1) {
      const secondLine = lines[1].trim();
      if (secondLine && !secondLine.includes('SOURCE:') && !secondLine.includes('PMID:')) {
        authors = secondLine.split('.')[0]; // Take first part before period
      }
    }
    
    // Extract journal
    let journal = '';
    if (authors) {
      const journalMatch = trimmed.match(new RegExp(authors.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\.\\s*([^.]+)\\.'));
      if (journalMatch) {
        journal = journalMatch[1];
      }
    }
    
    // Determine source
    let source = 'Journal';
    if (url.includes('pubmed')) source = 'PubMed';
    else if (url.includes('doi.org')) source = 'DOI';
    else if (trimmed.toLowerCase().includes('cochrane')) source = 'Cochrane';
    else if (trimmed.toLowerCase().includes('who')) source = 'WHO';
    else if (trimmed.toLowerCase().includes('cdc')) source = 'CDC';
    
    // Determine badges
    const badges: string[] = [];
    const lowerText = trimmed.toLowerCase();
    
    if (lowerText.includes('guideline') || lowerText.includes('recommendation')) {
      badges.push('Practice Guideline');
    }
    if (lowerText.includes('systematic review') || lowerText.includes('meta-analysis')) {
      badges.push('Systematic Review');
    }
    if (lowerText.includes('cochrane')) {
      badges.push('Cochrane');
    }
    if (yearMatch && parseInt(yearMatch[1]) >= 2022) {
      badges.push('Recent (≤3y)');
    }
    
    references.push({
      number,
      title: title.trim(),
      authors,
      journal,
      year: yearMatch ? yearMatch[1] : undefined,
      pmid: pmidMatch ? pmidMatch[1] : undefined,
      doi: doiMatch ? doiMatch[1] : undefined,
      url,
      source,
      badges
    });
  });
  
  return references;
}

/**
 * Clean citation markers from content
 */
function cleanCitationMarkers(content: string): string {
  let cleaned = content;
  
  // Remove various citation formats
  cleaned = cleaned.replace(/\[\[(\d+(?:,\s*\d+)*)\]\]\(([^)]+)\)/g, ''); // [[1]](url)
  cleaned = cleaned.replace(/\[\[(\d+(?:,\s*\d+)*)\]\]/g, ''); // [[1]]
  cleaned = cleaned.replace(/(?<!\[)\[(\d+(?:,\s*\d+)*)\](?!\()/g, ''); // [1] but not [text](url)
  cleaned = cleaned.replace(/\^\[(\d+(?:,\s*\d+)*)\]\^/g, ''); // ^[1]^
  cleaned = cleaned.replace(/\^+/g, ''); // standalone ^
  
  // Clean up extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

/**
 * Convert citations to clickable superscript links
 */
export function renderCitationsAsLinks(
  content: string, 
  references: FixedReference[],
  mode: 'doctor' | 'general' = 'doctor'
): string {
  let result = content;
  const color = mode === 'doctor' ? 'blue' : 'purple';
  
  // Convert [[N]](url) format
  result = result.replace(/\[\[(\d+(?:,\s*\d+)*)\]\]\(([^)]+)\)/g, (match, nums, url) => {
    const numbers = nums.split(',').map((n: string) => n.trim());
    return numbers.map((num: string) => {
      const ref = references.find(r => r.number === parseInt(num));
      const finalUrl = ref?.url || url;
      return `<sup><a href="${finalUrl}" target="_blank" rel="noopener noreferrer" class="citation-link text-${color}-600 hover:text-${color}-800 no-underline font-medium">[${num}]</a></sup>`;
    }).join('');
  });
  
  // Convert [[N]] format
  result = result.replace(/\[\[(\d+(?:,\s*\d+)*)\]\]/g, (match, nums) => {
    const numbers = nums.split(',').map((n: string) => n.trim());
    return numbers.map((num: string) => {
      const ref = references.find(r => r.number === parseInt(num));
      if (ref?.url) {
        return `<sup><a href="${ref.url}" target="_blank" rel="noopener noreferrer" class="citation-link text-${color}-600 hover:text-${color}-800 no-underline font-medium">[${num}]</a></sup>`;
      }
      return `<sup class="text-gray-500">[${num}]</sup>`;
    }).join('');
  });
  
  // Convert [N] format (but not markdown links)
  result = result.replace(/(?<!\[)\[(\d+(?:,\s*\d+)*)\](?!\()/g, (match, nums) => {
    const numbers = nums.split(',').map((n: string) => n.trim());
    return numbers.map((num: string) => {
      const ref = references.find(r => r.number === parseInt(num));
      if (ref?.url) {
        return `<sup><a href="${ref.url}" target="_blank" rel="noopener noreferrer" class="citation-link text-${color}-600 hover:text-${color}-800 no-underline font-medium">[${num}]</a></sup>`;
      }
      return `<sup class="text-gray-500">[${num}]</sup>`;
    }).join('');
  });
  
  return result;
}