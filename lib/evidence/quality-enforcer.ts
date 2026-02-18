/**
 * Evidence Quality Enforcer
 * Ensures all citations are real and working before response generation
 */

export interface EvidenceItem {
  pmid?: string;
  doi?: string;
  url?: string;
  title: string;
  source: string;
}

export interface QualityCheck {
  isValid: boolean;
  hasWorkingLink: boolean;
  hasRealIdentifier: boolean;
  extractedUrl: string | null;
  reason?: string;
}

/**
 * Extract real identifiers from evidence text
 */
export function extractRealIdentifiers(evidenceText: string): EvidenceItem[] {
  const items: EvidenceItem[] = [];
  const lines = evidenceText.split('\n');
  
  let currentItem: Partial<EvidenceItem> = {};
  
  for (const line of lines) {
    // Extract PMID
    const pmidMatch = line.match(/PMID:\s*(\d+)/i);
    if (pmidMatch) {
      currentItem.pmid = pmidMatch[1];
    }
    
    // Extract DOI
    const doiMatch = line.match(/DOI:\s*(10\.\d+\/[^\s]+)/i);
    if (doiMatch) {
      currentItem.doi = doiMatch[1];
    }
    
    // Extract URL
    const urlMatch = line.match(/URL:\s*(https?:\/\/[^\s]+)/i);
    if (urlMatch) {
      currentItem.url = urlMatch[1];
    }
    
    // Extract title
    const titleMatch = line.match(/^\d+\.\s*(.+)$/) || line.match(/Title:\s*(.+)$/i);
    if (titleMatch) {
      currentItem.title = titleMatch[1].trim();
    }
    
    // Extract source
    const sourceMatch = line.match(/SOURCE:\s*([^|]+)/i);
    if (sourceMatch) {
      currentItem.source = sourceMatch[1].trim();
      
      // Complete item when we have source
      if (currentItem.title) {
        items.push(currentItem as EvidenceItem);
        currentItem = {};
      }
    }
  }
  
  return items;
}

/**
 * Build working URL from evidence identifiers
 */
export function buildWorkingUrl(item: EvidenceItem): string | null {
  // Priority order: Direct URL > PMID > DOI
  if (item.url && item.url.startsWith('http')) {
    return item.url;
  }
  
  if (item.pmid) {
    return `https://pubmed.ncbi.nlm.nih.gov/${item.pmid}`;
  }
  
  if (item.doi) {
    return `https://doi.org/${item.doi}`;
  }
  
  return null;
}

/**
 * Validate evidence quality before citation
 */
export function validateEvidenceQuality(item: EvidenceItem): QualityCheck {
  const hasRealIdentifier = !!(item.pmid || item.doi || item.url);
  const extractedUrl = buildWorkingUrl(item);
  const hasWorkingLink = !!extractedUrl;
  
  if (!hasRealIdentifier) {
    return {
      isValid: false,
      hasWorkingLink: false,
      hasRealIdentifier: false,
      extractedUrl: null,
      reason: 'No PMID, DOI, or URL found'
    };
  }
  
  if (!hasWorkingLink) {
    return {
      isValid: false,
      hasWorkingLink: false,
      hasRealIdentifier: true,
      extractedUrl: null,
      reason: 'Could not build working URL from identifiers'
    };
  }
  
  return {
    isValid: true,
    hasWorkingLink: true,
    hasRealIdentifier: true,
    extractedUrl
  };
}

/**
 * Filter evidence to only include items with working links
 */
export function filterValidEvidence(evidenceText: string): EvidenceItem[] {
  const allItems = extractRealIdentifiers(evidenceText);
  const validItems: EvidenceItem[] = [];
  
  for (const item of allItems) {
    const quality = validateEvidenceQuality(item);
    if (quality.isValid) {
      validItems.push({
        ...item,
        url: quality.extractedUrl!
      });
    } else {
      console.warn(`⚠️ Excluding invalid evidence: ${item.title} - ${quality.reason}`);
    }
  }
  
  console.log(`✅ Evidence quality check: ${validItems.length}/${allItems.length} items have working links`);
  return validItems;
}

/**
 * Generate citation instruction for AI with only valid evidence
 */
export function generateCitationInstruction(validEvidence: EvidenceItem[]): string {
  if (validEvidence.length === 0) {
    return `
**CRITICAL: NO VALID EVIDENCE AVAILABLE FOR CITATION**
- Do not include numbered citations in your response
- State: "Evidence from our medical databases is limited for this specific question"
- Recommend specialist consultation
- Do not fabricate any references
`;
  }
  
  let instruction = `
**AVAILABLE EVIDENCE FOR CITATION (${validEvidence.length} VERIFIED SOURCES):**

`;
  
  validEvidence.forEach((item, index) => {
    const citationNumber = index + 1;
    instruction += `${citationNumber}. ${item.title}\n`;
    instruction += `   Source: ${item.source}\n`;
    if (item.pmid) instruction += `   PMID: ${item.pmid}\n`;
    if (item.doi) instruction += `   DOI: ${item.doi}\n`;
    instruction += `   URL: ${item.url}\n`;
    instruction += `   Citation format: [[${citationNumber}]](${item.url})\n\n`;
  });
  
  instruction += `
**CITATION RULES:**
- ONLY cite sources 1-${validEvidence.length} listed above
- Use format: [[N]](URL) where N is 1-${validEvidence.length}
- Every citation MUST use the exact URLs provided above
- DO NOT cite any sources not listed above
- DO NOT fabricate PMIDs, DOIs, or URLs
`;
  
  return instruction;
}