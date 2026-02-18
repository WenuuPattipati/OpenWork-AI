/**
 * Debug script to test unified-parser.ts with actual response data
 */

// Minimal simulated response for testing
const testResponse = `
## Quick Answer
Current Indian consensus emphasizes a structured management approach for Type 2 diabetes[[2]](https://pubmed.ncbi.nlm.nih.gov/123456).

## Evidence Synthesis

Evidence shows metformin is effective[[1]](https://pubmed.ncbi.nlm.nih.gov/789012)[[3]](https://example.com).

## References

1. [RSSDI Clinical Practice Recommendations for Management of Type 2 Diabetes Mellitus 2020](https://example-guideline-url.com)
   Authors: Research Society for Study of Diabetes in India.
   Journal: Clinical Practice Guideline. 2020.
   Practice Guideline - Recent (≤3y)

2. [Consensus Statement on Use of Ambulatory Glucose Profile in Management](https://pubmed.ncbi.nlm.nih.gov/123456)
   Authors: Mohan V, et al.
   Journal: Diabetes Care. 2023.
   PMID: 123456

3. [Management of Hypertension in Patients with Type 2 Diabetes](https://example.com)
   Authors: Smith J, et al.
   Journal: NEJM. 2024.
   DOI: 10.1000/example

## Follow-Up Questions

1. What are the specific contraindications for metformin?
2. How should metformin be monitored in elderly patients?
3. What are the criteria for adding a second antidiabetic agent?
`;

// Import-style test - we need to copy the logic here since this is a standalone script
function extractReferencesSection(content: string): { mainContent: string; referencesText: string; } {
  const referencePatterns = [
    /##?\s*References?\s*\n([\s\S]+?)(?=##?\s*Image References?|##?\s*Follow-?Up|$)/i,
    /\*\*References?\*\*\s*\n([\s\S]+?)(?=##?\s*Image References?|##?\s*Follow-?Up|$)/i,
  ];
  
  let mainContent = content;
  let referencesText = '';
  
  for (const pattern of referencePatterns) {
    const match = content.match(pattern);
    if (match) {
      mainContent = content.substring(0, match.index).trim();
      referencesText = match[1].trim();
      break;
    }
  }
  
  return { mainContent, referencesText };
}

function parseReferences(referencesText: string): any[] {
  if (!referencesText) return [];
  
  const references: any[] = [];
  
  // Split by numbered lines (1., 2., 3., etc.)
  const refLines = referencesText.split(/\n(?=\d+\.)/);
  
  console.log('Number of reference lines found:', refLines.length);
  
  refLines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    
    const number = index + 1;
    
    // Extract title and URL from markdown link format: [Title](URL)
    const markdownMatch = trimmed.match(/\[([^\]]+)\]\(([^)]+)\)/);
    
    let title = '';
    let url = '';
    
    if (markdownMatch) {
      title = markdownMatch[1].trim();
      url = markdownMatch[2].trim();
    } else {
      const titleMatch = trimmed.match(/^\d+\.\s*(.+?)(?:\.|$)/);
      title = titleMatch ? titleMatch[1].trim() : trimmed.replace(/^\d+\.\s*/, '').trim();
    }
    
    const isValid = title.length > 5 && url.length > 0;
    
    console.log(`Reference ${number}: title="${title.substring(0, 50)}...", url="${url.substring(0, 50)}...", isValid=${isValid}`);
    
    if (isValid) {
      references.push({ number, title, url, isValid });
    }
  });
  
  return references;
}

// Run test
console.log('=== Testing Reference Parser ===\n');

const { mainContent, referencesText } = extractReferencesSection(testResponse);

console.log('Main content length:', mainContent.length);
console.log('References text length:', referencesText.length);
console.log('\n--- References Text ---\n', referencesText.substring(0, 500), '...\n');

const references = parseReferences(referencesText);

console.log('\n=== Parsed References ===');
console.log('Total valid references:', references.length);
references.forEach(ref => {
  console.log(`[${ref.number}] ${ref.title.substring(0, 60)}...`);
});
