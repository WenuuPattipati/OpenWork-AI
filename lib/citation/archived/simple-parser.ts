/**
 * Simple citation parser - minimal implementation to fix citation display issues
 */

export interface SimpleParsedReference {
  number: number;
  title: string;
  url: string | null;
  fullText: string;
}

export interface SimpleParsedResponse {
  mainContent: string;
  references: SimpleParsedReference[];
}

/**
 * Simple parser that extracts references and converts citations to clickable links
 */
export function parseResponseSimple(response: string): SimpleParsedResponse {
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
  const references: SimpleParsedReference[] = [];
  if (referencesText) {
    const refLines = referencesText.split(/\n(?=\d+\.)/);

    refLines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Extract number
      const numberMatch = trimmed.match(/^(\d+)\./);
      const number = numberMatch ? parseInt(numberMatch[1]) : index + 1;

      // Extract title and URL from markdown link
      const markdownMatch = trimmed.match(/\[([^\]]+)\]\(([^)]+)\)/);
      let title = '';
      let url: string | null = null;

      if (markdownMatch) {
        title = markdownMatch[1];
        url = markdownMatch[2];
      } else {
        // Extract title from plain text
        // Handle formats: "1. Title", "[1] Title", "1) Title", "Title"
        // Remove leading numbers, brackets, dots, spaces
        const cleanLine = trimmed.replace(/^\[?\d+[\]\).]?\s*/, '');

        // Assume title is the first part before a period, or the whole thing if short
        const titleMatch = cleanLine.match(/^(.+?)(?:\.|$)/);
        title = titleMatch ? titleMatch[1] : cleanLine;
      }

      // Extract PMID for URL construction
      if (!url) {
        const pmidMatch = trimmed.match(/PMID:?\s*(\d+)/i);
        if (pmidMatch) {
          url = `https://pubmed.ncbi.nlm.nih.gov/${pmidMatch[1]}/`;
        }
      }

      // Extract DOI for URL construction
      if (!url) {
        const doiMatch = trimmed.match(/doi:?\s*(10\.\S+)/i);
        if (doiMatch) {
          url = `https://doi.org/${doiMatch[1]}`;
        }
      }

      // Fallback: Create Google Search URL if no URL found
      if (!url && title) {
        url = `https://www.google.com/search?q=${encodeURIComponent(title)}`;
      }

      if (title && title.length > 5) {
        references.push({
          number,
          title: title.trim(),
          url,
          fullText: trimmed
        });
      }
    });
  }

  return {
    mainContent,
    references
  };
}

/**
 * Convert citation markers in content to clickable superscript links
 */
export function convertCitationsToLinks(
  content: string,
  references: SimpleParsedReference[],
  mode: 'doctor' | 'general' = 'doctor'
): string {
  let result = content;

  // Convert [[N]](url) format
  result = result.replace(/\[\[(\d+)\]\]\(([^)]+)\)/g, (match, num, url) => {
    const ref = references.find(r => r.number === parseInt(num));
    const finalUrl = ref?.url || url;
    const color = mode === 'doctor' ? 'blue' : 'purple';
    return `<sup><a href="${finalUrl}" target="_blank" rel="noopener noreferrer" class="citation-link text-${color}-600 hover:text-${color}-800 no-underline font-medium">[${num}]</a></sup>`;
  });

  // Convert [[N]] format
  result = result.replace(/\[\[(\d+)\]\]/g, (match, num) => {
    const ref = references.find(r => r.number === parseInt(num));
    const color = mode === 'doctor' ? 'blue' : 'purple';
    if (ref?.url) {
      return `<sup><a href="${ref.url}" target="_blank" rel="noopener noreferrer" class="citation-link text-${color}-600 hover:text-${color}-800 no-underline font-medium">[${num}]</a></sup>`;
    }
    return `<sup class="text-gray-500">[${num}]</sup>`;
  });

  // Convert [N] format (but not markdown links)
  result = result.replace(/(?<!\[)\[(\d+)\](?!\()/g, (match, num) => {
    const ref = references.find(r => r.number === parseInt(num));
    const color = mode === 'doctor' ? 'blue' : 'purple';
    if (ref?.url) {
      return `<sup><a href="${ref.url}" target="_blank" rel="noopener noreferrer" class="citation-link text-${color}-600 hover:text-${color}-800 no-underline font-medium">[${num}]</a></sup>`;
    }
    return `<sup class="text-gray-500">[${num}]</sup>`;
  });

  // Convert ^[N]^ format
  result = result.replace(/\^\[(\d+)\]\^/g, (match, num) => {
    const ref = references.find(r => r.number === parseInt(num));
    const color = mode === 'doctor' ? 'blue' : 'purple';
    if (ref?.url) {
      return `<sup><a href="${ref.url}" target="_blank" rel="noopener noreferrer" class="citation-link text-${color}-600 hover:text-${color}-800 no-underline font-medium">[${num}]</a></sup>`;
    }
    return `<sup class="text-gray-500">[${num}]</sup>`;
  });

  // Remove standalone ^ symbols
  result = result.replace(/\^+/g, '');

  return result;
}