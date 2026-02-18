/**
 * Reference Enrichment Processor
 * Processes AI-generated responses to enrich references with DOIs/PMIDs
 */

import { parseReferenceString, enrichCitations, type CitationMetadata, type EnrichedCitation } from './reference-enrichment';

/**
 * Extract references section from response text
 */
function extractReferencesSection(responseText: string): {
  beforeRefs: string;
  refsSection: string;
  afterRefs: string;
  references: string[];
} | null {
  // Find the References section
  const refsMatch = responseText.match(/^#{1,3}\s*References?$/im);
  
  if (!refsMatch || !refsMatch.index) {
    return null;
  }
  
  const refsStartIndex = refsMatch.index;
  const beforeRefs = responseText.substring(0, refsStartIndex);
  
  // Find the next section after References (Follow-Up Questions, etc.)
  const afterRefsMatch = responseText.substring(refsStartIndex + refsMatch[0].length)
    .match(/^#{1,3}\s*(Follow[-\s]?Up Questions?|You Might Also Want to Know)/im);
  
  const refsEndIndex = afterRefsMatch && afterRefsMatch.index
    ? refsStartIndex + refsMatch[0].length + afterRefsMatch.index
    : responseText.length;
  
  const refsSection = responseText.substring(refsStartIndex, refsEndIndex);
  const afterRefs = responseText.substring(refsEndIndex);
  
  // Extract individual references
  const refLines = refsSection.split('\n')
    .filter(line => {
      const trimmed = line.trim();
      // Match lines that start with numbers like "1.", "2.", etc.
      return trimmed.match(/^\d+\.\s+/) && trimmed.length > 10;
    });
  
  return {
    beforeRefs,
    refsSection,
    afterRefs,
    references: refLines
  };
}

/**
 * Format an enriched citation back to string
 */
function formatEnrichedReference(index: number, citation: EnrichedCitation): string {
  const parts: string[] = [];
  
  // Title
  if (citation.title) {
    parts.push(citation.title);
  }
  
  // Authors
  if (citation.authors) {
    parts.push(citation.authors);
  }
  
  // Journal and year
  if (citation.journal) {
    let journalPart = citation.journal;
    if (citation.year) {
      journalPart += `. ${citation.year}`;
    }
    parts.push(journalPart);
  } else if (citation.year) {
    parts.push(citation.year);
  }
  
  // Build the reference string
  let refString = `${index + 1}. ${parts.join('. ')}.`;
  
  // Add PMID if available
  if (citation.pmid) {
    refString += ` PMID:${citation.pmid}`;
  }
  
  // Add DOI if available
  if (citation.doi) {
    refString += ` doi:${citation.doi}`;
  }
  
  // Add enrichment indicator (for debugging)
  if (citation.enriched) {
    const sourceLabel = citation.source === 'both' ? 'Crossref+PubMed' : 
                       citation.source === 'crossref' ? 'Crossref' : 'PubMed';
    refString += ` [Enriched: ${sourceLabel}]`;
  }
  
  return refString;
}

/**
 * Enrich references in a response text
 * Extracts references, enriches them with DOIs/PMIDs, and reconstructs the response
 */
export async function enrichReferencesInResponse(responseText: string): Promise<string> {
  // Extract references section
  const extracted = extractReferencesSection(responseText);
  
  if (!extracted || extracted.references.length === 0) {
    console.log("ℹ️  No references found to enrich");
    return responseText;
  }
  
  console.log(`📚 Found ${extracted.references.length} references to enrich`);
  
  // Parse references into structured metadata
  const citations: CitationMetadata[] = extracted.references.map(ref => 
    parseReferenceString(ref)
  );
  
  // Filter out references that already have both DOI and PMID
  const needsEnrichment = citations.filter(c => !c.doi || !c.pmid);
  
  if (needsEnrichment.length === 0) {
    console.log("✅ All references already have DOI/PMID");
    return responseText;
  }
  
  console.log(`🔍 ${needsEnrichment.length} references need enrichment`);
  
  // Enrich citations (with rate limiting)
  const enrichedCitations = await enrichCitations(citations, {
    maxConcurrent: 2, // Conservative to respect API rate limits
    delayMs: 1000 // 1 second delay between batches
  });
  
  // Reconstruct references section
  const newRefsLines = enrichedCitations.map((citation, index) => 
    formatEnrichedReference(index, citation)
  );
  
  const newRefsSection = `## References\n\n${newRefsLines.join('\n')}`;
  
  // Reconstruct full response
  const newResponse = extracted.beforeRefs + newRefsSection + '\n\n' + extracted.afterRefs;
  
  const enrichedCount = enrichedCitations.filter(c => c.enriched).length;
  console.log(`✅ Successfully enriched ${enrichedCount}/${citations.length} references`);
  
  return newResponse;
}

/**
 * Enrich a single reference string
 * Useful for testing or manual enrichment
 */
export async function enrichSingleReference(refString: string): Promise<string> {
  const citation = parseReferenceString(refString);
  const enriched = await enrichCitations([citation]);
  return formatEnrichedReference(0, enriched[0]);
}
