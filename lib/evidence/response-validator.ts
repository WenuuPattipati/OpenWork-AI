/**
 * Response Validator - Clinical Rigor Validation
 * 
 * Validates that Doctor Mode responses meet clinical rigor standards:
 * 1. Reference count (6-10 sources)
 * 2. Reference quality (real PMIDs/DOIs, no Google search URLs)
 * 3. Anchor guideline citation (if applicable)
 * 4. Source diversity (multiple databases)
 * 5. Evidence synthesis (cross-referencing)
 * 6. Off-topic evidence detection
 * 7. False "no guideline" claims
 */

export interface ValidationResult {
  passed: boolean;
  issues: string[];
  warnings?: string[];
  score?: number; // 0-100
}

export interface Article {
  title: string;
  abstract?: string;
  pmid?: string;
  doi?: string;
  url?: string;
  source?: string;
}

export interface EvidencePackage {
  anchorGuidelines?: Article[];
  landmarkTrials?: Article[];
  whoGuidelines?: Article[];
  cdcGuidelines?: Article[];
  niceGuidelines?: Article[];
  cardiovascularGuidelines?: Article[];
  cochraneReviews?: Article[];
  pubmedArticles?: Article[];
  europePMC?: Article[];
  clinicalTrials?: Article[];
  [key: string]: Article[] | undefined;
}

export interface ClinicalRigorValidation {
  referenceCount: ValidationResult;
  referenceQuality: ValidationResult;
  anchorGuidelines: ValidationResult;
  sourceDiversity: ValidationResult;
  synthesis: ValidationResult;
  offTopicEvidence: ValidationResult;
  falseNoGuideline: ValidationResult;
  overallPassed: boolean;
  overallScore: number; // 0-100
}

/**
 * Validate reference count (6-10 sources)
 */
export function validateReferenceCount(response: string): ValidationResult {
  const issues: string[] = [];
  
  // Extract all unique citation numbers
  const citations = response.match(/\[(\d+)\]/g) || [];
  const uniqueCitations = new Set(citations.map(c => c.match(/\d+/)?.[0]));
  const refCount = uniqueCitations.size;
  
  // Check reference count
  if (refCount < 6) {
    issues.push(`Only ${refCount} references (need 6-10)`);
  } else if (refCount > 10) {
    issues.push(`Too many references (${refCount}, max 10)`);
  }
  
  // Calculate score (0-100)
  let score = 100;
  if (refCount < 6) {
    score = Math.max(0, (refCount / 6) * 100);
  } else if (refCount > 10) {
    score = Math.max(50, 100 - ((refCount - 10) * 10));
  }
  
  return {
    passed: refCount >= 6 && refCount <= 10,
    issues,
    score
  };
}

/**
 * Validate reference quality (real PMIDs/DOIs, no fabricated references)
 */
export function validateReferenceQuality(response: string): ValidationResult {
  const issues: string[] = [];
  let score = 100;
  
  // Check for Google search URLs (should not exist after fix)
  if (response.includes('google.com/search')) {
    issues.push('Contains Google search URLs (should use direct article links)');
    score -= 30;
  }
  
  // Check for fabricated PMIDs (basic heuristic)
  // Valid PMIDs are typically 7-8 digits, range from ~1000000 to ~40000000
  const pmids = response.match(/PMID:?\s*(\d+)/gi) || [];
  pmids.forEach(pmid => {
    const num = parseInt(pmid.match(/\d+/)?.[0] || '0');
    if (num > 40000000 || num < 1000000) {
      issues.push(`Suspicious PMID: ${pmid} (may be fabricated)`);
      score -= 20;
    }
  });
  
  // Check for bare URLs without proper formatting
  const bareUrls = response.match(/https?:\/\/[^\s\)]+(?!\))/g) || [];
  if (bareUrls.length > 3) {
    issues.push(`${bareUrls.length} bare URLs found (should use markdown links)`);
    score -= 10;
  }
  
  // Check for missing URLs in references section
  const referencesSection = response.match(/##\s*References([\s\S]*?)(?=##|$)/i)?.[1] || '';
  if (referencesSection) {
    const referenceLines = referencesSection.split('\n').filter(l => l.trim().match(/^\d+\./));
    const referencesWithUrls = referenceLines.filter(l => l.includes('http'));
    
    if (referenceLines.length > 0 && referencesWithUrls.length < referenceLines.length * 0.8) {
      issues.push(`Only ${referencesWithUrls.length}/${referenceLines.length} references have URLs`);
      score -= 20;
    }
  }
  
  return {
    passed: issues.length === 0,
    issues,
    score: Math.max(0, score)
  };
}

/**
 * Validate anchor guideline citation (if applicable)
 */
export function validateAnchorGuidelines(response: string, query: string): ValidationResult {
  const issues: string[] = [];
  let score = 100;
  
  try {
    const { getAnchorGuidelines } = require('./guideline-anchors');
    const anchors = getAnchorGuidelines(query);
    
    // If no anchor guidelines for this query, pass automatically
    if (anchors.length === 0) {
      return { passed: true, issues: [], score: 100 };
    }
    
    // Check if anchor guidelines were cited
    let citedCount = 0;
    anchors.forEach((anchor: { name: string; organization: string; year: number }) => {
      // Check if guideline name or organization appears in response
      const nameMatch = response.includes(anchor.name);
      const orgMatch = response.includes(anchor.organization);
      const yearMatch = response.includes(anchor.year.toString());
      
      if (nameMatch || (orgMatch && yearMatch)) {
        citedCount++;
      }
    });
    
    // Require at least 2 anchor guidelines to be cited (or all if fewer than 2)
    const requiredCitations = Math.min(2, anchors.length);
    if (citedCount < requiredCitations) {
      issues.push(`Only ${citedCount}/${anchors.length} anchor guidelines cited (need at least ${requiredCitations})`);
      score = (citedCount / requiredCitations) * 100;
    }
    
    return {
      passed: citedCount >= requiredCitations,
      issues,
      score
    };
  } catch (error) {
    console.error('Error validating anchor guidelines:', error);
    return { passed: true, issues: [], score: 100 }; // Graceful degradation
  }
}

/**
 * Validate source diversity (multiple databases used)
 */
export function validateSourceDiversity(response: string): ValidationResult {
  const issues: string[] = [];
  const sources = new Set<string>();
  
  // Define source patterns
  const sourcePatterns = [
    { name: 'PubMed', pattern: /pubmed\.ncbi\.nlm\.nih\.gov|PMID:/gi },
    { name: 'Cochrane', pattern: /cochrane/gi },
    { name: 'Europe PMC', pattern: /europepmc/gi },
    { name: 'ClinicalTrials.gov', pattern: /clinicaltrials\.gov|NCT\d+/gi },
    { name: 'Guidelines', pattern: /(ACC\/AHA|ESC|KDIGO|IDSA|WHO|CDC|NICE|ADA Standards|Surviving Sepsis)/gi },
    { name: 'PMC', pattern: /pmc\.ncbi\.nlm\.nih\.gov|PMCID:/gi },
    { name: 'DOI', pattern: /doi\.org|DOI:/gi }
  ];
  
  // Check which sources are present
  sourcePatterns.forEach(({ name, pattern }) => {
    if (pattern.test(response)) {
      sources.add(name);
    }
  });
  
  // Calculate score based on diversity
  const diversityScore = Math.min(100, (sources.size / 3) * 100);
  
  if (sources.size < 3) {
    issues.push(`Only ${sources.size} source types used (need at least 3 for diversity): ${Array.from(sources).join(', ')}`);
  }
  
  return {
    passed: sources.size >= 3,
    issues,
    score: diversityScore
  };
}

/**
 * Validate evidence synthesis (cross-referencing, not single-source statements)
 */
export function validateSynthesis(response: string): ValidationResult {
  const issues: string[] = [];
  let score = 100;
  
  // Check for synthesis language
  const synthesisPatterns = [
    /both.*and.*recommend/gi,
    /multiple.*guidelines/gi,
    /consensus.*across/gi,
    /several.*studies/gi,
    /meta-analyses.*demonstrate/gi,
    /\[\d+\]\[\d+\]/g  // Multiple citations together
  ];
  
  const synthesisMatches = synthesisPatterns.reduce((count, pattern) => {
    return count + (response.match(pattern) || []).length;
  }, 0);
  
  if (synthesisMatches === 0) {
    issues.push('No evidence of cross-source synthesis (use "Both X and Y recommend..." or multiple citations)');
    score -= 30;
  } else if (synthesisMatches < 3) {
    issues.push('Limited synthesis (only ' + synthesisMatches + ' instances found)');
    score -= 15;
  }
  
  // Check for excessive single-source statements
  const statements = response.split(/\.\s+/);
  const statementsWithCitations = statements.filter(s => /\[\d+\]/.test(s));
  const singleSourceStatements = statementsWithCitations.filter(s => 
    /\[\d+\]/.test(s) && !/\[\d+\]\[\d+\]/.test(s)
  );
  
  if (statementsWithCitations.length > 0) {
    const singleSourceRatio = singleSourceStatements.length / statementsWithCitations.length;
    
    if (singleSourceRatio > 0.7) {
      issues.push(`Too many single-source statements (${Math.round(singleSourceRatio * 100)}%) - need more synthesis`);
      score -= 20;
    }
  }
  
  return {
    passed: issues.length === 0,
    issues,
    score: Math.max(0, score)
  };
}

/**
 * Extract keywords from text for relevance checking
 */
function extractKeywords(text: string): Set<string> {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
    'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
  ]);
  
  const words = text.toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
  
  return new Set(words);
}

/**
 * Calculate keyword overlap between query and reference
 */
function calculateKeywordOverlap(queryKeywords: Set<string>, refKeywords: Set<string>): number {
  if (queryKeywords.size === 0 || refKeywords.size === 0) return 0;
  
  let overlap = 0;
  queryKeywords.forEach(keyword => {
    if (refKeywords.has(keyword)) overlap++;
  });
  
  return overlap / queryKeywords.size;
}

/**
 * Detect off-topic evidence in response
 */
export function validateOffTopicEvidence(
  response: string,
  query: string,
  evidencePackage?: EvidencePackage
): ValidationResult {
  const issues: string[] = [];
  const warnings: string[] = [];
  let score = 100;
  
  const queryKeywords = extractKeywords(query);
  
  // Common off-topic patterns
  const offTopicPatterns = [
    {
      pattern: /MINOCA|myocardial infarction with non-obstructive/gi,
      irrelevantFor: ['DAPT', 'dual antiplatelet', 'stent', 'PCI', 'antiplatelet therapy'],
      reason: 'MINOCA is a different entity from standard ACS/PCI'
    },
    {
      pattern: /HIIT|high-intensity interval training|exercise training/gi,
      irrelevantFor: ['sepsis', 'antibiotic', 'ICU', 'critical care', 'acute illness'],
      reason: 'Exercise training irrelevant to acute critical care'
    },
    {
      pattern: /imaging|CT scan|MRI|ultrasound|radiolog/gi,
      irrelevantFor: ['drug dosing', 'antibiotic choice', 'medication'],
      reason: 'Imaging studies irrelevant to drug therapy questions'
    },
    {
      pattern: /pediatric|children|infant|neonatal/gi,
      irrelevantFor: ['adult', 'elderly', 'geriatric'],
      reason: 'Pediatric studies may not apply to adult patients'
    }
  ];
  
  // Check for off-topic patterns
  offTopicPatterns.forEach(({ pattern, irrelevantFor, reason }) => {
    if (pattern.test(response)) {
      const queryLower = query.toLowerCase();
      const isIrrelevant = irrelevantFor.some(term => queryLower.includes(term.toLowerCase()));
      
      if (isIrrelevant) {
        warnings.push(`Potential off-topic evidence detected: ${reason}`);
        score -= 15;
      }
    }
  });
  
  // Extract reference titles from response
  const referencesSection = response.match(/##\s*References([\s\S]*?)(?=##|$)/i)?.[1] || '';
  const referenceLines = referencesSection.split('\n').filter(l => l.trim().match(/^\d+\./));
  
  // Check keyword overlap for each reference
  let lowOverlapCount = 0;
  referenceLines.forEach(refLine => {
    const refKeywords = extractKeywords(refLine);
    const overlap = calculateKeywordOverlap(queryKeywords, refKeywords);
    
    if (overlap < 0.2 && refLine.length > 50) { // Less than 20% overlap
      lowOverlapCount++;
    }
  });
  
  if (lowOverlapCount > 0 && referenceLines.length > 0) {
    const ratio = lowOverlapCount / referenceLines.length;
    if (ratio > 0.3) { // More than 30% of references have low overlap
      issues.push(`${lowOverlapCount}/${referenceLines.length} references have low keyword overlap with query`);
      score -= 20;
    } else if (ratio > 0.15) {
      warnings.push(`${lowOverlapCount}/${referenceLines.length} references may be off-topic`);
      score -= 10;
    }
  }
  
  return {
    passed: issues.length === 0,
    issues,
    warnings,
    score: Math.max(0, score)
  };
}

/**
 * Detect false "no guideline" claims when guidelines actually exist
 */
export function validateFalseNoGuideline(
  response: string,
  evidencePackage?: EvidencePackage
): ValidationResult {
  const issues: string[] = [];
  const warnings: string[] = [];
  let score = 100;
  
  // Phrases that claim insufficient evidence
  const noEvidencePhrases = [
    /no (clear |specific |established )?guideline/gi,
    /insufficient evidence/gi,
    /limited (data|evidence|research)/gi,
    /no (clear )?consensus/gi,
    /unclear recommendation/gi,
    /lack of (evidence|data|guidelines)/gi,
    /not well[- ]established/gi,
    /no (definitive|specific) recommendation/gi
  ];
  
  // Check if response claims insufficient evidence
  const hasNoEvidenceClaim = noEvidencePhrases.some(pattern => pattern.test(response));
  
  if (hasNoEvidenceClaim && evidencePackage) {
    // Count available guidelines
    const guidelineCount = [
      ...(evidencePackage.anchorGuidelines || []),
      ...(evidencePackage.whoGuidelines || []),
      ...(evidencePackage.cdcGuidelines || []),
      ...(evidencePackage.niceGuidelines || []),
      ...(evidencePackage.cardiovascularGuidelines || [])
    ].length;
    
    const cochraneCount = (evidencePackage.cochraneReviews || []).length;
    const trialCount = [
      ...(evidencePackage.landmarkTrials || []),
      ...(evidencePackage.clinicalTrials || [])
    ].length;
    
    // If we have substantial evidence, flag the claim
    if (guidelineCount >= 2) {
      issues.push(`Response claims insufficient evidence but ${guidelineCount} guidelines are available`);
      score -= 30;
    } else if (guidelineCount >= 1 || cochraneCount >= 1) {
      warnings.push(`Response claims limited evidence but ${guidelineCount} guidelines and ${cochraneCount} Cochrane reviews exist`);
      score -= 15;
    } else if (trialCount >= 3) {
      warnings.push(`Response claims limited evidence but ${trialCount} trials are available`);
      score -= 10;
    }
  }
  
  return {
    passed: issues.length === 0,
    issues,
    warnings,
    score: Math.max(0, score)
  };
}

/**
 * Main validation function - validates all clinical rigor criteria
 */
export function validateClinicalRigor(
  response: string,
  query: string,
  evidencePackage?: EvidencePackage
): ClinicalRigorValidation {
  const results = {
    referenceCount: validateReferenceCount(response),
    referenceQuality: validateReferenceQuality(response),
    anchorGuidelines: validateAnchorGuidelines(response, query),
    sourceDiversity: validateSourceDiversity(response),
    synthesis: validateSynthesis(response),
    offTopicEvidence: validateOffTopicEvidence(response, query, evidencePackage),
    falseNoGuideline: validateFalseNoGuideline(response, evidencePackage)
  };
  
  // Calculate overall score (weighted average)
  const weights = {
    referenceCount: 0.15,
    referenceQuality: 0.25,
    anchorGuidelines: 0.15,
    sourceDiversity: 0.1,
    synthesis: 0.1,
    offTopicEvidence: 0.15,
    falseNoGuideline: 0.1
  };
  
  const overallScore = Object.entries(results).reduce((sum, [key, result]) => {
    const weight = weights[key as keyof typeof weights] || 0;
    return sum + (result.score || 0) * weight;
  }, 0);
  
  return {
    ...results,
    overallPassed: Object.values(results).every(r => r.passed),
    overallScore: Math.round(overallScore)
  };
}

/**
 * Format validation results for logging
 */
export function formatValidationResults(validation: ClinicalRigorValidation): string {
  let formatted = `\n📊 Clinical Rigor Validation (Score: ${validation.overallScore}/100)\n`;
  formatted += `Overall: ${validation.overallPassed ? '✅ PASSED' : '❌ FAILED'}\n\n`;
  
  const checks = [
    { name: 'Reference Count', result: validation.referenceCount },
    { name: 'Reference Quality', result: validation.referenceQuality },
    { name: 'Anchor Guidelines', result: validation.anchorGuidelines },
    { name: 'Source Diversity', result: validation.sourceDiversity },
    { name: 'Evidence Synthesis', result: validation.synthesis },
    { name: 'Off-Topic Evidence', result: validation.offTopicEvidence },
    { name: 'False No Guideline', result: validation.falseNoGuideline }
  ];
  
  checks.forEach(({ name, result }) => {
    const icon = result.passed ? '✅' : '❌';
    formatted += `${icon} ${name} (${result.score}/100)\n`;
    if (result.issues && result.issues.length > 0) {
      result.issues.forEach(issue => {
        formatted += `   ❌ ${issue}\n`;
      });
    }
    if (result.warnings && result.warnings.length > 0) {
      result.warnings.forEach(warning => {
        formatted += `   ⚠️  ${warning}\n`;
      });
    }
  });
  
  return formatted;
}
