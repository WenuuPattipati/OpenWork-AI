/**
 * Recommendation Strength Extractor
 * 
 * Extracts and standardizes recommendation strength and quality levels from guidelines.
 * Addresses the critical issue identified in suggestions.md where recommendation strengths
 * (Strong vs Weak, Class I vs 2b, LOE A vs C) are not explicitly stated.
 */

export interface RecommendationStrength {
  strength: 'Strong' | 'Weak' | 'Conditional' | 'Suggestion' | 'Unknown';
  quality: 'High' | 'Moderate' | 'Low' | 'Very Low' | 'Unknown';
  classification?: string; // e.g., "Class I", "Class IIa", "Class IIb", "Class III"
  levelOfEvidence?: string; // e.g., "LOE A", "LOE B", "LOE C"
  originalText?: string; // Original strength statement from guideline
}

/**
 * Patterns for detecting recommendation strength in guideline text
 */
const STRENGTH_PATTERNS = {
  // GRADE system (WHO, Cochrane, many societies)
  strong: [
    /we recommend/i,
    /strong recommendation/i,
    /grade.*strong/i,
    /class\s*i\b/i, // Class I (not Class II)
    /level\s*a\b/i,
    /should\s+(be\s+)?used/i,
    /is\s+recommended/i
  ],
  
  weak: [
    /we suggest/i,
    /weak recommendation/i,
    /conditional recommendation/i,
    /grade.*weak/i,
    /class\s*ii[ab]?/i, // Class IIa, Class IIb
    /level\s*[bc]\b/i,
    /may\s+be\s+considered/i,
    /might\s+be\s+reasonable/i,
    /can\s+be\s+useful/i
  ],

  // Specific classification systems
  classI: [
    /class\s*i\b(?!\s*i)/i, // Class I but not Class II
    /class\s*1\b/i
  ],
  
  classIIa: [
    /class\s*ii\s*a/i,
    /class\s*2\s*a/i
  ],
  
  classIIb: [
    /class\s*ii\s*b/i,
    /class\s*2\s*b/i
  ],
  
  classIII: [
    /class\s*iii/i,
    /class\s*3/i,
    /not\s+recommended/i,
    /should\s+not\s+be\s+used/i
  ]
};

/**
 * Patterns for detecting quality/level of evidence
 */
const QUALITY_PATTERNS = {
  high: [
    /high.*quality/i,
    /high.*certainty/i,
    /level\s*a/i,
    /loe\s*a/i,
    /grade\s*a/i
  ],
  
  moderate: [
    /moderate.*quality/i,
    /moderate.*certainty/i,
    /level\s*b/i,
    /loe\s*b/i,
    /grade\s*b/i
  ],
  
  low: [
    /low.*quality/i,
    /low.*certainty/i,
    /level\s*c/i,
    /loe\s*c/i,
    /grade\s*c/i,
    /very\s+low.*quality/i
  ]
};

/**
 * Extract recommendation strength from guideline text
 */
export function extractRecommendationStrength(
  text: string,
  title?: string,
  source?: string
): RecommendationStrength {
  const result: RecommendationStrength = {
    strength: 'Unknown',
    quality: 'Unknown'
  };

  // Clean text for analysis
  const cleanText = text.toLowerCase().replace(/\s+/g, ' ').trim();
  
  // Extract strength
  if (STRENGTH_PATTERNS.strong.some(pattern => pattern.test(cleanText))) {
    result.strength = 'Strong';
  } else if (STRENGTH_PATTERNS.weak.some(pattern => pattern.test(cleanText))) {
    result.strength = 'Weak';
  }

  // Extract classification (ACC/AHA, ESC style)
  if (STRENGTH_PATTERNS.classI.some(pattern => pattern.test(cleanText))) {
    result.classification = 'Class I';
    result.strength = 'Strong'; // Class I = Strong
  } else if (STRENGTH_PATTERNS.classIIa.some(pattern => pattern.test(cleanText))) {
    result.classification = 'Class IIa';
    result.strength = 'Weak'; // Class IIa = Weak but reasonable
  } else if (STRENGTH_PATTERNS.classIIb.some(pattern => pattern.test(cleanText))) {
    result.classification = 'Class IIb';
    result.strength = 'Weak'; // Class IIb = Weak, may be considered
  } else if (STRENGTH_PATTERNS.classIII.some(pattern => pattern.test(cleanText))) {
    result.classification = 'Class III';
    result.strength = 'Strong'; // Class III = Strong recommendation AGAINST
  }

  // Extract quality/level of evidence
  if (QUALITY_PATTERNS.high.some(pattern => pattern.test(cleanText))) {
    result.quality = 'High';
    result.levelOfEvidence = 'LOE A';
  } else if (QUALITY_PATTERNS.moderate.some(pattern => pattern.test(cleanText))) {
    result.quality = 'Moderate';
    result.levelOfEvidence = 'LOE B';
  } else if (QUALITY_PATTERNS.low.some(pattern => pattern.test(cleanText))) {
    result.quality = 'Low';
    result.levelOfEvidence = 'LOE C';
  }

  // Special handling for known guideline sources
  if (source) {
    const enhanced = enhanceWithSourceSpecificRules(result, source, cleanText);
    result.strength = enhanced.strength;
    result.quality = enhanced.quality;
    result.classification = enhanced.classification;
    result.levelOfEvidence = enhanced.levelOfEvidence;
  }

  // Extract original strength statement for reference
  const strengthMatch = text.match(/(class\s*i{1,3}[ab]?|strong\s+recommendation|weak\s+recommendation|we\s+recommend|we\s+suggest)[^.]{0,100}/i);
  if (strengthMatch) {
    result.originalText = strengthMatch[0].trim();
  }

  return result;
}

/**
 * Apply source-specific rules for better accuracy
 */
function enhanceWithSourceSpecificRules(
  result: RecommendationStrength,
  source: string,
  text: string
): RecommendationStrength {
  const sourceLower = source.toLowerCase();
  
  // Surviving Sepsis Campaign specific patterns
  if (sourceLower.includes('sepsis') || sourceLower.includes('ssc')) {
    if (text.includes('we recommend')) {
      result.strength = 'Strong';
    } else if (text.includes('we suggest')) {
      result.strength = 'Weak';
    }
  }
  
  // ACC/AHA Guidelines
  if (sourceLower.includes('acc') || sourceLower.includes('aha') || sourceLower.includes('american heart')) {
    // ACC/AHA uses Class I/IIa/IIb/III system
    if (result.classification) {
      // Already extracted above
    }
  }
  
  // ESC Guidelines
  if (sourceLower.includes('esc') || sourceLower.includes('european society')) {
    // ESC also uses Class I/IIa/IIb/III system
    if (result.classification) {
      // Already extracted above
    }
  }
  
  // IDSA Guidelines
  if (sourceLower.includes('idsa') || sourceLower.includes('infectious diseases')) {
    if (text.includes('strong recommendation')) {
      result.strength = 'Strong';
    } else if (text.includes('weak recommendation')) {
      result.strength = 'Weak';
    }
  }

  return result;
}

/**
 * Format recommendation strength for display in LLM response
 */
export function formatRecommendationStrength(strength: RecommendationStrength): string {
  const parts: string[] = [];
  
  if (strength.classification) {
    parts.push(strength.classification);
  } else if (strength.strength !== 'Unknown') {
    parts.push(`${strength.strength} Recommendation`);
  }
  
  if (strength.levelOfEvidence) {
    parts.push(strength.levelOfEvidence);
  } else if (strength.quality !== 'Unknown') {
    parts.push(`${strength.quality} Quality Evidence`);
  }
  
  return parts.length > 0 ? parts.join(', ') : '';
}

/**
 * Check if a guideline text contains stepwise recommendations
 */
export function detectStepwiseProtocol(text: string): boolean {
  const stepwisePatterns = [
    /first[- ]line/i,
    /second[- ]line/i,
    /initial.*therapy/i,
    /step\s*\d+/i,
    /algorithm/i,
    /flowchart/i,
    /sequential/i,
    /escalat/i,
    /add.*to/i,
    /instead\s+of/i,
    /rather\s+than/i
  ];
  
  return stepwisePatterns.some(pattern => pattern.test(text));
}

/**
 * Extract stepwise protocol from guideline text
 */
export function extractStepwiseProtocol(text: string): string[] {
  const steps: string[] = [];
  
  // Look for numbered steps
  const numberedSteps = text.match(/(?:step\s*\d+|first[- ]line|second[- ]line|third[- ]line)[^.]*\./gi);
  if (numberedSteps) {
    steps.push(...numberedSteps);
  }
  
  // Look for "add X to Y" patterns
  const additionSteps = text.match(/add\s+\w+[^.]*\./gi);
  if (additionSteps) {
    steps.push(...additionSteps);
  }
  
  // Look for "instead of" patterns
  const insteadSteps = text.match(/instead\s+of[^.]*\./gi);
  if (insteadSteps) {
    steps.push(...insteadSteps);
  }
  
  return steps.slice(0, 5); // Limit to 5 steps to avoid noise
}