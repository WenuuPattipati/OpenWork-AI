/**
 * Citation URL Validator
 * Validates and fixes citation URLs before sending to client
 */

export interface URLValidationResult {
  isValid: boolean;
  correctedUrl?: string;
  error?: string;
}

/**
 * Validate a citation URL
 */
export function validateCitationURL(url: string, pmid?: string, pmcid?: string, doi?: string): URLValidationResult {
  if (!url) {
    // Try to construct URL from identifiers
    if (pmcid) {
      return {
        isValid: true,
        correctedUrl: `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/`
      };
    }
    if (pmid) {
      return {
        isValid: true,
        correctedUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
      };
    }
    if (doi) {
      return {
        isValid: true,
        correctedUrl: `https://doi.org/${doi}`
      };
    }
    return {
      isValid: false,
      error: 'No URL or identifiers provided'
    };
  }

  try {
    const urlObj = new URL(url);
    
    // Check for common issues
    
    // 1. Google search URLs (invalid)
    if (urlObj.hostname.includes('google.com') && urlObj.pathname.includes('/search')) {
      return {
        isValid: false,
        error: 'Google search URL detected - not a valid citation'
      };
    }
    
    // 2. Tavily URLs (invalid for citations)
    if (urlObj.hostname.includes('tavily.com')) {
      return {
        isValid: false,
        error: 'Tavily URL detected - not a valid citation'
      };
    }
    
    // 3. Malformed PubMed URLs
    if (urlObj.hostname.includes('pubmed.ncbi.nlm.nih.gov')) {
      // Check if it's a search URL instead of article URL
      if (urlObj.search.includes('term=') || urlObj.pathname === '/') {
        if (pmid) {
          return {
            isValid: true,
            correctedUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
          };
        }
        return {
          isValid: false,
          error: 'PubMed search URL instead of article URL'
        };
      }
    }
    
    // 4. Malformed PMC URLs
    if (urlObj.hostname.includes('ncbi.nlm.nih.gov') && urlObj.pathname.includes('/pmc/')) {
      if (!urlObj.pathname.includes('/articles/PMC')) {
        if (pmcid) {
          return {
            isValid: true,
            correctedUrl: `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/`
          };
        }
      }
    }
    
    // 5. Prefer PMC over PubMed (full text vs abstract)
    if (pmcid && urlObj.hostname.includes('pubmed.ncbi.nlm.nih.gov')) {
      return {
        isValid: true,
        correctedUrl: `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/`
      };
    }
    
    // URL is valid
    return {
      isValid: true,
      correctedUrl: url
    };
    
  } catch (error) {
    return {
      isValid: false,
      error: `Invalid URL format: ${error}`
    };
  }
}

/**
 * Validate and fix all URLs in a response
 */
export function validateResponseURLs(response: string): {
  validatedResponse: string;
  fixedCount: number;
  removedCount: number;
} {
  let validatedResponse = response;
  let fixedCount = 0;
  let removedCount = 0;
  
  // Find all citation patterns with URLs: [[N]](URL)
  const citationPattern = /\[\[(\d+)\]\]\((https?:\/\/[^\s\)]+)\)/g;
  
  let match;
  const replacements: Array<{ original: string; replacement: string }> = [];
  
  while ((match = citationPattern.exec(response)) !== null) {
    const citationNumber = match[1];
    const url = match[2];
    const fullMatch = match[0];
    
    // Extract PMID/PMCID/DOI from surrounding context
    const contextStart = Math.max(0, match.index - 200);
    const contextEnd = Math.min(response.length, match.index + 200);
    const context = response.substring(contextStart, contextEnd);
    
    const pmidMatch = context.match(/PMID:?\s*(\d+)/i);
    const pmcMatch = context.match(/PMC(ID)?:?\s*(PMC\d+)/i);
    const doiMatch = context.match(/doi:?\s*(10\.\d{4,9}\/[-._;()\/:A-Za-z0-9]+)/i);
    
    const validation = validateCitationURL(
      url,
      pmidMatch?.[1],
      pmcMatch?.[2],
      doiMatch?.[1]
    );
    
    if (!validation.isValid) {
      // Remove invalid citation
      replacements.push({
        original: fullMatch,
        replacement: '' // Remove the citation
      });
      removedCount++;
      console.warn(`Removed invalid citation [[${citationNumber}]]: ${validation.error}`);
    } else if (validation.correctedUrl && validation.correctedUrl !== url) {
      // Fix URL
      replacements.push({
        original: fullMatch,
        replacement: `[[${citationNumber}]](${validation.correctedUrl})`
      });
      fixedCount++;
      console.log(`Fixed citation [[${citationNumber}]]: ${url} → ${validation.correctedUrl}`);
    }
  }
  
  // Apply all replacements
  for (const { original, replacement } of replacements) {
    validatedResponse = validatedResponse.replace(original, replacement);
  }
  
  return {
    validatedResponse,
    fixedCount,
    removedCount
  };
}

/**
 * Extract and validate all references from a response
 */
export function validateReferences(referencesText: string): {
  validReferences: string[];
  invalidReferences: string[];
} {
  const validReferences: string[] = [];
  const invalidReferences: string[] = [];
  
  // Split by numbered lines
  const refLines = referencesText.split(/\n(?=\d+\.)/);
  
  refLines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;
    
    // Extract URL from markdown link
    const urlMatch = trimmed.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (!urlMatch) {
      invalidReferences.push(trimmed);
      return;
    }
    
    const url = urlMatch[2];
    
    // Extract identifiers
    const pmidMatch = trimmed.match(/PMID:?\s*(\d+)/i);
    const pmcMatch = trimmed.match(/PMC(ID)?:?\s*(PMC\d+)/i);
    const doiMatch = trimmed.match(/doi:?\s*(10\.\d{4,9}\/[-._;()\/:A-Za-z0-9]+)/i);
    
    const validation = validateCitationURL(
      url,
      pmidMatch?.[1],
      pmcMatch?.[2],
      doiMatch?.[1]
    );
    
    if (validation.isValid) {
      if (validation.correctedUrl && validation.correctedUrl !== url) {
        // Replace URL in reference
        const correctedRef = trimmed.replace(url, validation.correctedUrl);
        validReferences.push(correctedRef);
      } else {
        validReferences.push(trimmed);
      }
    } else {
      invalidReferences.push(trimmed);
      console.warn(`Invalid reference: ${validation.error}`);
    }
  });
  
  return {
    validReferences,
    invalidReferences
  };
}
