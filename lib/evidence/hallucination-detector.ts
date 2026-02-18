/**
 * Hallucination Detector
 * 
 * Detects and prevents hallucinations and off-topic evidence in AI responses.
 * Validates that cited references are relevant, real, and properly formatted.
 * 
 * Key Detection Areas:
 * 1. Off-topic reference detection (semantic mismatch)
 * 2. False "no guideline" claims (when guidelines exist)
 * 3. Fabricated reference detection (invalid PMIDs/DOIs)
 * 4. Google search URL detection (should use direct links)
 * 5. Reference distribution validation (proper evidence hierarchy)
 */

import type { EvidencePackage } from './engine';
import { getEmbeddingGenerator, cosineSimilarity } from './embedding-generator';

export interface OffTopicReference {
  reference: string;
  reason: string;
  keywordOverlap: number;
  semanticSimilarity?: number;
  suggestion: string;
}

export interface FalseNoGuidelineClaim {
  claim: string;
  availableGuidelines: string[];
  suggestion: string;
}

export interface FabricatedReference {
  reference: string;
  pmid?: string;
  doi?: string;
  reason: string;
}

export interface GoogleURLReference {
  reference: string;
  url: string;
  correctUrl?: string;
}

export interface ReferenceDistribution {
  guidelines: number;
  metaAnalyses: number;
  rcts: number;
  other: number;
  total: number;
  isBalanced: boolean;
  issues: string[];
}

export interface HallucinationReport {
  offTopicReferences: OffTopicReference[];
  falseNoGuidelineClaims: FalseNoGuidelineClaim[];
  fabricatedReferences: FabricatedReference[];
  googleURLReferences: GoogleURLReference[];
  referenceDistribution: ReferenceDistribution;
  overallScore: number; // 0-100, higher is better
  hasCriticalIssues: boolean;
  summary: string;
}

/**
 * Extract keywords from text for overlap analysis
 */
function extractKeywords(text: string): Set<string> {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
    'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));

  return new Set(words);
}

/**
 * Calculate keyword overlap between query and reference
 */
function calculateKeywordOverlap(queryKeywords: Set<string>, refKeywords: Set<string>): number {
  const intersection = new Set([...queryKeywords].filter(k => refKeywords.has(k)));
  const union = new Set([...queryKeywords, ...refKeywords]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Detect off-topic references using keyword overlap
 */
export function detectOffTopicReferences(
  query: string,
  references: Array<{ title: string; abstract?: string; pmid?: string; doi?: string }>
): OffTopicReference[] {
  const queryKeywords = extractKeywords(query);
  const offTopicRefs: OffTopicReference[] = [];

  // Known off-topic patterns
  const offTopicPatterns = [
    { pattern: /minoca|myocardial infarction with non-obstructive/i, topics: ['dapt', 'stent', 'antiplatelet'], reason: 'MINOCA is a different entity from DAPT/stent management' },
    { pattern: /hiit|high-intensity interval training|exercise/i, topics: ['sepsis', 'antibiotic', 'icu', 'critical'], reason: 'Exercise studies irrelevant to acute critical care' },
    { pattern: /imaging|mri|ct scan|ultrasound|radiology/i, topics: ['antibiotic', 'drug dosing', 'medication'], reason: 'Imaging studies irrelevant to drug therapy questions' },
    { pattern: /pediatric|children|infant|neonatal/i, topics: ['adult'], reason: 'Pediatric studies cited for adult-specific question' },
    { pattern: /procalcitonin|biomarker|crp|c-reactive protein/i, topics: ['antibiotic choice', 'initial regimen', 'empiric therapy'], reason: 'Biomarker studies don\'t inform initial antibiotic selection' },
    { pattern: /duration|short-course|antibiotic stewardship/i, topics: ['initial', 'first-line', 'empiric', 'starting'], reason: 'Duration studies irrelevant to initial regimen questions' },
    { pattern: /pathophysiology|mechanism|etiology|pathogenesis/i, topics: ['treatment', 'management', 'therapy', 'drug'], reason: 'Pathophysiology papers don\'t inform treatment decisions' },
    { pattern: /diagnostic|diagnosis|criteria|screening/i, topics: ['treatment', 'management', 'therapy'], reason: 'Diagnostic papers irrelevant to management questions' },
  ];

  for (const ref of references) {
    const refText = `${ref.title} ${ref.abstract || ''}`;
    const refKeywords = extractKeywords(refText);
    const overlap = calculateKeywordOverlap(queryKeywords, refKeywords);

    // Check for known off-topic patterns
    let patternMatch = false;
    for (const { pattern, topics, reason } of offTopicPatterns) {
      if (pattern.test(refText)) {
        const queryLower = query.toLowerCase();
        if (topics.some(topic => queryLower.includes(topic))) {
          offTopicRefs.push({
            reference: ref.title,
            reason,
            keywordOverlap: overlap,
            suggestion: 'Replace with relevant guideline or meta-analysis that directly addresses the question'
          });
          patternMatch = true;
          break;
        }
      }
    }

    // If no pattern match, check keyword overlap
    if (!patternMatch && overlap < 0.3) {
      offTopicRefs.push({
        reference: ref.title,
        reason: `Low keyword overlap (${(overlap * 100).toFixed(0)}%) - reference may not address the clinical question`,
        keywordOverlap: overlap,
        suggestion: 'Verify relevance or replace with more directly relevant evidence'
      });
    }
  }

  return offTopicRefs;
}

/**
 * Detect off-topic references using semantic similarity (async version)
 */
export async function detectOffTopicReferencesWithSemantics(
  query: string,
  references: Array<{ title: string; abstract?: string; pmid?: string; doi?: string }>,
  minSimilarity: number = 0.5
): Promise<OffTopicReference[]> {
  try {
    const generator = await getEmbeddingGenerator();
    const queryEmbedding = await generator.generateEmbedding(query);
    const offTopicRefs: OffTopicReference[] = [];

    for (const ref of references) {
      const refText = `${ref.title} ${ref.abstract || ''}`;
      const refEmbedding = await generator.generateEmbedding(refText);
      const similarity = cosineSimilarity(queryEmbedding, refEmbedding);

      if (similarity < minSimilarity) {
        const queryKeywords = extractKeywords(query);
        const refKeywords = extractKeywords(refText);
        const overlap = calculateKeywordOverlap(queryKeywords, refKeywords);

        offTopicRefs.push({
          reference: ref.title,
          reason: `Low semantic similarity (${(similarity * 100).toFixed(0)}%) - reference may not address the clinical question`,
          keywordOverlap: overlap,
          semanticSimilarity: similarity,
          suggestion: 'Replace with more semantically relevant evidence'
        });
      }
    }

    return offTopicRefs;
  } catch (error) {
    console.error('[HallucinationDetector] Semantic analysis failed, falling back to keyword-based detection:', error);
    return detectOffTopicReferences(query, references);
  }
}

/**
 * Detect false "no guideline" claims
 */
export function detectFalseNoGuidelineClaims(
  responseText: string,
  evidence: EvidencePackage
): FalseNoGuidelineClaim[] {
  const claims: FalseNoGuidelineClaim[] = [];

  const noGuidelinePhrases = [
    'no guideline',
    'insufficient evidence',
    'limited data',
    'no consensus',
    'unclear recommendation',
    'no specific recommendation',
    'guidelines do not provide',
    'lack of evidence',
    'limited evidence'
  ];

  const responseLower = responseText.toLowerCase();
  const hasNoGuidelinePhrase = noGuidelinePhrases.some(phrase => responseLower.includes(phrase));

  if (hasNoGuidelinePhrase) {
    // Check if we actually have guidelines
    const availableGuidelines: string[] = [];

    if (evidence.guidelines && evidence.guidelines.length > 0) {
      availableGuidelines.push(...evidence.guidelines.map(g => `${g.source}: ${g.title}`));
    }
    if (evidence.whoGuidelines && evidence.whoGuidelines.length > 0) {
      availableGuidelines.push(...evidence.whoGuidelines.map(g => `WHO: ${g.title}`));
    }
    if (evidence.cdcGuidelines && evidence.cdcGuidelines.length > 0) {
      availableGuidelines.push(...evidence.cdcGuidelines.map(g => `CDC: ${g.title}`));
    }
    if (evidence.niceGuidelines && evidence.niceGuidelines.length > 0) {
      availableGuidelines.push(...evidence.niceGuidelines.map(g => `NICE: ${g.title}`));
    }
    if (evidence.cardiovascularGuidelines && evidence.cardiovascularGuidelines.length > 0) {
      availableGuidelines.push(...evidence.cardiovascularGuidelines.map(g => `${g.organization}: ${g.title}`));
    }
    if (evidence.cochraneReviews && evidence.cochraneReviews.length > 0) {
      availableGuidelines.push(...evidence.cochraneReviews.map(r => `Cochrane: ${r.title}`));
    }

    if (availableGuidelines.length > 0) {
      // Find the specific phrase used
      const usedPhrase = noGuidelinePhrases.find(phrase => responseLower.includes(phrase)) || 'insufficient evidence';
      
      claims.push({
        claim: `Response claims "${usedPhrase}" but ${availableGuidelines.length} guideline(s) exist`,
        availableGuidelines: availableGuidelines.slice(0, 5), // Show first 5
        suggestion: 'Revise response to cite available guidelines instead of claiming insufficient evidence'
      });
    }
  }

  return claims;
}

/**
 * Detect fabricated references (invalid PMIDs/DOIs)
 */
export function detectFabricatedReferences(
  responseText: string,
  evidence: EvidencePackage
): FabricatedReference[] {
  const fabricated: FabricatedReference[] = [];

  // Extract PMIDs from response
  const pmidPattern = /PMID:?\s*(\d{5,8})/gi;
  const pmidMatches = [...responseText.matchAll(pmidPattern)];

  // Build set of valid PMIDs from evidence
  const validPMIDs = new Set<string>();
  
  // Collect PMIDs from all evidence sources
  evidence.pubmedArticles?.forEach(a => validPMIDs.add(a.pmid));
  evidence.pubmedReviews?.forEach(a => validPMIDs.add(a.pmid));
  evidence.pubmedGuidelines?.forEach(a => validPMIDs.add(a.pmid));
  evidence.cochraneReviews?.forEach(r => r.pmid && validPMIDs.add(r.pmid));
  evidence.europePMCRecent?.forEach(a => a.pmid && validPMIDs.add(a.pmid));
  evidence.europePMCCited?.forEach(a => a.pmid && validPMIDs.add(a.pmid));
  evidence.europePMCOpenAccess?.forEach(a => a.pmid && validPMIDs.add(a.pmid));

  // Check each PMID in response
  for (const match of pmidMatches) {
    const pmid = match[1];
    if (!validPMIDs.has(pmid)) {
      fabricated.push({
        reference: match[0],
        pmid,
        reason: 'PMID not found in evidence package - may be fabricated or from external source'
      });
    }
  }

  // Extract DOIs from response
  const doiPattern = /doi:?\s*(10\.\d{4,}\/[^\s\]]+)/gi;
  const doiMatches = [...responseText.matchAll(doiPattern)];

  // Build set of valid DOIs from evidence
  const validDOIs = new Set<string>();
  
  evidence.pubmedArticles?.forEach(a => a.doi && validDOIs.add(a.doi.toLowerCase()));
  evidence.pubmedReviews?.forEach(a => a.doi && validDOIs.add(a.doi.toLowerCase()));
  evidence.cochraneReviews?.forEach(r => r.doi && validDOIs.add(r.doi.toLowerCase()));
  evidence.europePMCRecent?.forEach(a => a.doi && validDOIs.add(a.doi.toLowerCase()));
  evidence.europePMCCited?.forEach(a => a.doi && validDOIs.add(a.doi.toLowerCase()));

  // Check each DOI in response
  for (const match of doiMatches) {
    const doi = match[1].toLowerCase();
    if (!validDOIs.has(doi)) {
      fabricated.push({
        reference: match[0],
        doi,
        reason: 'DOI not found in evidence package - may be fabricated or from external source'
      });
    }
  }

  return fabricated;
}

/**
 * Detect Google search URLs (should use direct links)
 */
export function detectGoogleURLReferences(
  responseText: string,
  evidence: EvidencePackage
): GoogleURLReference[] {
  const googleRefs: GoogleURLReference[] = [];

  // Pattern for Google search URLs
  const googlePattern = /\[([^\]]+)\]\((https?:\/\/(?:www\.)?google\.com\/search[^\)]+)\)/g;
  const matches = [...responseText.matchAll(googlePattern)];

  for (const match of matches) {
    const title = match[1];
    const url = match[2];

    // Try to find correct URL from evidence
    let correctUrl: string | undefined;

    // Check anchor guidelines
    const anchorMatch = evidence.guidelines?.find(g => 
      title.toLowerCase().includes(g.title.toLowerCase()) ||
      g.title.toLowerCase().includes(title.toLowerCase())
    );
    if (anchorMatch) {
      correctUrl = anchorMatch.url;
    }

    // Check PubMed articles
    if (!correctUrl) {
      const pubmedMatch = evidence.pubmedArticles?.find(a =>
        title.toLowerCase().includes(a.title.toLowerCase()) ||
        a.title.toLowerCase().includes(title.toLowerCase())
      );
      if (pubmedMatch) {
        correctUrl = `https://pubmed.ncbi.nlm.nih.gov/${pubmedMatch.pmid}`;
      }
    }

    googleRefs.push({
      reference: title,
      url,
      correctUrl
    });
  }

  return googleRefs;
}

/**
 * Validate reference distribution
 */
export function validateReferenceDistribution(
  responseText: string
): ReferenceDistribution {
  const issues: string[] = [];

  // Extract references from response
  const refPattern = /\[(\d+)\]/g;
  const refMatches = [...responseText.matchAll(refPattern)];
  const total = new Set(refMatches.map(m => m[1])).size;

  // Estimate distribution based on keywords in references section
  const referencesSection = responseText.split('References')[1] || responseText.split('## References')[1] || '';
  
  const guidelineKeywords = ['guideline', 'guidelines', 'standards of care', 'practice guideline', 'clinical practice', 'acc/aha', 'esc', 'idsa', 'kdigo', 'surviving sepsis'];
  const metaAnalysisKeywords = ['meta-analysis', 'systematic review', 'cochrane', 'pooled analysis'];
  const rctKeywords = ['randomized', 'rct', 'trial', 'clinical trial', 'controlled trial'];

  const guidelines = guidelineKeywords.reduce((count, kw) => 
    count + (referencesSection.toLowerCase().match(new RegExp(kw, 'g')) || []).length, 0
  );
  const metaAnalyses = metaAnalysisKeywords.reduce((count, kw) =>
    count + (referencesSection.toLowerCase().match(new RegExp(kw, 'g')) || []).length, 0
  );
  const rcts = rctKeywords.reduce((count, kw) =>
    count + (referencesSection.toLowerCase().match(new RegExp(kw, 'g')) || []).length, 0
  );
  const other = Math.max(0, total - guidelines - metaAnalyses - rcts);

  // Validate distribution
  if (total < 6) {
    issues.push(`Only ${total} references (minimum 6 required)`);
  }
  if (total > 10) {
    issues.push(`${total} references (maximum 10 recommended for conciseness)`);
  }
  if (guidelines < 1) {
    issues.push('Need at least 1-2 major guidelines');
  }
  if (metaAnalyses < 1) {
    issues.push('Need at least 1-2 meta-analyses or systematic reviews');
  }
  if (rcts < 2) {
    issues.push('Need at least 2-3 pivotal RCTs or key studies');
  }
  if (other > 2) {
    issues.push(`Too many "other" sources (${other}) - focus on guidelines, meta-analyses, and RCTs`);
  }

  const isBalanced = issues.length === 0;

  return {
    guidelines,
    metaAnalyses,
    rcts,
    other,
    total,
    isBalanced,
    issues
  };
}

/**
 * Generate comprehensive hallucination report
 */
export async function generateHallucinationReport(
  query: string,
  responseText: string,
  evidence: EvidencePackage,
  useSemantics: boolean = false
): Promise<HallucinationReport> {
  // Extract references from response for off-topic detection
  const references: Array<{ title: string; abstract?: string }> = [];
  
  // Try to extract from references section
  const referencesSection = responseText.split('References')[1] || responseText.split('## References')[1] || '';
  const refLines = referencesSection.split('\n').filter(line => line.trim().length > 0);
  
  for (const line of refLines) {
    const titleMatch = line.match(/\[([^\]]+)\]/);
    if (titleMatch) {
      references.push({ title: titleMatch[1] });
    }
  }

  // Detect issues
  const offTopicReferences = useSemantics
    ? await detectOffTopicReferencesWithSemantics(query, references)
    : detectOffTopicReferences(query, references);
  
  const falseNoGuidelineClaims = detectFalseNoGuidelineClaims(responseText, evidence);
  const fabricatedReferences = detectFabricatedReferences(responseText, evidence);
  const googleURLReferences = detectGoogleURLReferences(responseText, evidence);
  const referenceDistribution = validateReferenceDistribution(responseText);

  // Calculate overall score (0-100)
  let score = 100;
  
  // Deduct points for each issue
  score -= offTopicReferences.length * 10; // -10 per off-topic ref
  score -= falseNoGuidelineClaims.length * 20; // -20 per false claim
  score -= fabricatedReferences.length * 15; // -15 per fabricated ref
  score -= googleURLReferences.length * 10; // -10 per Google URL
  score -= referenceDistribution.issues.length * 5; // -5 per distribution issue

  score = Math.max(0, Math.min(100, score));

  // Determine if there are critical issues
  const hasCriticalIssues = 
    falseNoGuidelineClaims.length > 0 ||
    fabricatedReferences.length > 0 ||
    googleURLReferences.length > 0 ||
    offTopicReferences.length > 2;

  // Generate summary
  let summary = '';
  if (score >= 90) {
    summary = '✅ Excellent - No significant hallucination issues detected';
  } else if (score >= 70) {
    summary = '⚠️ Good - Minor issues detected, review recommended';
  } else if (score >= 50) {
    summary = '⚠️ Fair - Multiple issues detected, revision recommended';
  } else {
    summary = '❌ Poor - Critical issues detected, major revision required';
  }

  return {
    offTopicReferences,
    falseNoGuidelineClaims,
    fabricatedReferences,
    googleURLReferences,
    referenceDistribution,
    overallScore: score,
    hasCriticalIssues,
    summary
  };
}

/**
 * Format hallucination report for display
 */
export function formatHallucinationReport(report: HallucinationReport): string {
  let formatted = '\n=== HALLUCINATION DETECTION REPORT ===\n\n';
  formatted += `Overall Score: ${report.overallScore}/100\n`;
  formatted += `Status: ${report.summary}\n`;
  formatted += `Critical Issues: ${report.hasCriticalIssues ? 'YES ⚠️' : 'NO ✅'}\n\n`;

  if (report.offTopicReferences.length > 0) {
    formatted += `❌ OFF-TOPIC REFERENCES (${report.offTopicReferences.length}):\n`;
    report.offTopicReferences.forEach((ref, i) => {
      formatted += `  ${i + 1}. "${ref.reference}"\n`;
      formatted += `     Reason: ${ref.reason}\n`;
      formatted += `     Keyword Overlap: ${(ref.keywordOverlap * 100).toFixed(0)}%\n`;
      if (ref.semanticSimilarity !== undefined) {
        formatted += `     Semantic Similarity: ${(ref.semanticSimilarity * 100).toFixed(0)}%\n`;
      }
      formatted += `     Suggestion: ${ref.suggestion}\n\n`;
    });
  }

  if (report.falseNoGuidelineClaims.length > 0) {
    formatted += `❌ FALSE "NO GUIDELINE" CLAIMS (${report.falseNoGuidelineClaims.length}):\n`;
    report.falseNoGuidelineClaims.forEach((claim, i) => {
      formatted += `  ${i + 1}. ${claim.claim}\n`;
      formatted += `     Available Guidelines:\n`;
      claim.availableGuidelines.forEach(g => formatted += `       - ${g}\n`);
      formatted += `     Suggestion: ${claim.suggestion}\n\n`;
    });
  }

  if (report.fabricatedReferences.length > 0) {
    formatted += `❌ FABRICATED REFERENCES (${report.fabricatedReferences.length}):\n`;
    report.fabricatedReferences.forEach((ref, i) => {
      formatted += `  ${i + 1}. ${ref.reference}\n`;
      formatted += `     Reason: ${ref.reason}\n\n`;
    });
  }

  if (report.googleURLReferences.length > 0) {
    formatted += `❌ GOOGLE SEARCH URLs (${report.googleURLReferences.length}):\n`;
    report.googleURLReferences.forEach((ref, i) => {
      formatted += `  ${i + 1}. "${ref.reference}"\n`;
      formatted += `     Current URL: ${ref.url}\n`;
      if (ref.correctUrl) {
        formatted += `     Correct URL: ${ref.correctUrl}\n`;
      }
      formatted += '\n';
    });
  }

  formatted += `\nREFERENCE DISTRIBUTION:\n`;
  formatted += `  Guidelines: ${report.referenceDistribution.guidelines}\n`;
  formatted += `  Meta-analyses: ${report.referenceDistribution.metaAnalyses}\n`;
  formatted += `  RCTs: ${report.referenceDistribution.rcts}\n`;
  formatted += `  Other: ${report.referenceDistribution.other}\n`;
  formatted += `  Total: ${report.referenceDistribution.total}\n`;
  formatted += `  Balanced: ${report.referenceDistribution.isBalanced ? 'YES ✅' : 'NO ⚠️'}\n`;
  
  if (report.referenceDistribution.issues.length > 0) {
    formatted += `  Issues:\n`;
    report.referenceDistribution.issues.forEach(issue => {
      formatted += `    - ${issue}\n`;
    });
  }

  formatted += '\n=== END REPORT ===\n';

  return formatted;
}
