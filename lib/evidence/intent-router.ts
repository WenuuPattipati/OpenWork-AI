/**
 * Intent Router - Enhanced Query Routing for Doctor Mode
 * 
 * This module provides intelligent routing for clinical queries to optimize
 * evidence retrieval and response structure. It works alongside the existing
 * PICO extraction and query classification systems.
 * 
 * DESIGN PRINCIPLES:
 * - Conservative approach: Only route clear-cut cases
 * - Fail gracefully: Default to existing system if uncertain
 * - No model confusion: Clear intent detection only
 */

import { generateTagsFromQuery, type PICOExtraction } from './pico-extractor';
import { classifyQuery, type ClassificationResult } from './query-classifier';

// ============================================================================
// INTENT TYPES
// ============================================================================

export type QueryIntent = 
  | 'research_synthesis'      // Compare treatments, meta-analyses
  | 'treatment_planning'      // Management approaches, stepwise therapy
  | 'drug_safety'            // Adverse events, contraindications
  | 'differential_diagnosis'  // Diagnostic reasoning, clinical features
  | 'guideline_dosing'       // Specific dosing, protocols
  | 'clinical_workup'        // Lab interpretation, diagnostic tests
  | 'primary_evidence'       // Landmark trials, pivotal studies
  | 'exam_preparation'       // Mock exams, board questions
  | 'pediatric_medicine'     // AAP guidelines, age-specific care
  | 'general_clinical';      // Default - use existing system

export interface IntentAnalysis {
  intent: QueryIntent;
  confidence: number;        // 0-1, only route if >0.8
  reasoning: string;
  shouldRoute: boolean;      // Only true for high-confidence cases
  evidencePriority: string[]; // Preferred evidence types
  responseStructure: 'standard' | 'focused' | 'tabbed';
}

// ============================================================================
// INTENT DETECTION PATTERNS
// ============================================================================

/**
 * High-confidence patterns for intent detection
 * Only includes very clear, unambiguous patterns
 */
const INTENT_PATTERNS = {
  research_synthesis: [
    /compare.*(?:sglt2|glp-1|arni|mra|inhibitors?|agonists?)/i,
    /meta-analyses?\s+show/i,
    /systematic\s+review.*outcomes?/i,
    /absolute\s+risk\s+reduction/i,
    /(?:vs|versus|compared?\s+to).*(?:efficacy|outcomes?)/i,
    /evidence.*comparing/i,
    /how\s+do.*compare/i,
    /compare.*in\s+terms\s+of/i,
    /(?:compare|comparison).*(?:outcomes?|efficacy|effectiveness)/i
  ],
  
  treatment_planning: [
    /(?:management|treatment)\s+plan/i,
    /stepwise.*(?:approach|therapy)/i,
    /initiation\s+order/i,
    /evidence-based.*(?:approach|treatment)/i,
    /how\s+should\s+you\s+(?:manage|treat|choose)/i,
    /recommended\s+approach/i,
    /choose\s+between/i,
    /outline.*(?:treatment|management)/i,
    /evidence-based.*plan/i
  ],
  
  drug_safety: [
    /adverse\s+(?:events?|effects?)/i,
    /safety\s+profile/i,
    /contraindications?/i,
    /(?:drug|medication).*(?:toxicity|safety)/i,
    /black\s+box\s+warning/i,
    /monitoring.*(?:parameters?|requirements?)/i,
    /(?:suspected|induced).*toxicity/i,
    /management\s+steps.*(?:toxicity|adverse)/i,
    /risks?.*(?:compare|hypoglycaemia|fractures?)/i,
    /recommended\s+management\s+steps/i,
    /amiodarone.*(?:induced|toxicity)/i,
    /pulmonary\s+toxicity/i
  ],
  
  differential_diagnosis: [
    /differential\s+diagnosis/i,
    /distinguish.*from/i,
    /(?:clinical|lab)\s+features?\s+help/i,
    /differentiate.*(?:between|from)/i,
    /diagnostic\s+(?:criteria|features?)/i,
    /presents?\s+with.*(?:distinguish|differentiate)/i,
    /how\s+do\s+you\s+distinguish/i,
    /next\s+best\s+test/i,
    /which.*features?\s+help/i
  ],
  
  guideline_dosing: [
    /dosing?\s+(?:recommendations?|guidelines?)/i,
    /(?:dose|dosage)\s+adjustment/i,
    /renal\s+(?:dosing?|adjustment)/i,
    /according\s+to.*guidelines?/i,
    /recommended\s+(?:dose|dosing?|sequence)/i,
    /titration.*protocol/i,
    /sequence\s+and\s+dosing/i,
    /how\s+should\s+you\s+adjust/i,
    /dosing.*across.*egfr/i
  ],
  
  clinical_workup: [
    /(?:initial|diagnostic)\s+workup/i,
    /(?:lab|laboratory)\s+interpretation/i,
    /which\s+(?:tests?|labs?)/i,
    /diagnostic\s+(?:approach|strategy)/i,
    /workup\s+for\s+suspected/i,
    /interpret.*(?:lab|test)\s+results?/i,
    /design.*workup/i,
    /outpatient\s+workup/i,
    /how\s+should\s+you\s+interpret/i
  ],
  
  primary_evidence: [
    /landmark\s+trials?/i,
    /pivotal\s+(?:trials?|studies?)/i,
    /which\s+trials?\s+(?:support|define)/i,
    /primary\s+evidence/i,
    /key\s+(?:trials?|studies?)/i,
    /trial\s+data/i,
    /trials?\s+define\s+current\s+practice/i,
    /summarize.*landmark\s+trials?/i,
    /which.*trials?.*changed/i
  ],
  
  exam_preparation: [
    /(?:exam|board)\s+question/i,
    /mock\s+(?:exam|test)/i,
    /quiz\s+me/i,
    /(?:usmle|comlex|board)\s+(?:prep|review)/i,
    /create.*question/i,
    /test\s+(?:question|item)/i,
    /generate.*(?:question|osce|station)/i,
    /examiner\s+mark\s+scheme/i,
    /mini-quiz/i,
    /osce\s+station\s+script/i,
    /\d+[\s-]*question.*(?:osce|exam|station)/i
  ],
  
  pediatric_medicine: [
    /aap\s+guidelines?/i,
    /pediatric.*(?:management|guidelines?)/i,
    /(?:child|children|infant).*(?:treatment|management)/i,
    /(?:months?|years?)\s+old.*(?:treatment|management)/i,
    /age.*(?:specific|appropriate)/i,
    /\d+[\s-]*(?:month|year)[\s-]*old/i,
    /how\s+do\s+aap\s+guidelines/i,
    /management\s+change.*(?:months?|years?)/i
  ]
};

// ============================================================================
// EVIDENCE PRIORITY MAPPING
// ============================================================================

const EVIDENCE_PRIORITIES: Record<QueryIntent, string[]> = {
  research_synthesis: [
    'anchor_guidelines',
    'cochrane_reviews', 
    'systematic_reviews',
    'landmark_trials',
    'meta_analyses'
  ],
  
  treatment_planning: [
    'anchor_guidelines',
    'clinical_guidelines',
    'landmark_trials',
    'systematic_reviews'
  ],
  
  drug_safety: [
    'drug_labels',
    'fda_safety',
    'adverse_events',
    'clinical_guidelines',
    'safety_reviews'
  ],
  
  differential_diagnosis: [
    'clinical_guidelines',
    'diagnostic_criteria',
    'systematic_reviews',
    'clinical_studies'
  ],
  
  guideline_dosing: [
    'clinical_guidelines',
    'drug_labels',
    'dosing_protocols',
    'renal_guidelines'
  ],
  
  clinical_workup: [
    'clinical_guidelines',
    'diagnostic_guidelines',
    'laboratory_guidelines',
    'systematic_reviews'
  ],
  
  primary_evidence: [
    'landmark_trials',
    'pivotal_rcts',
    'clinical_trials',
    'systematic_reviews'
  ],
  
  exam_preparation: [
    'clinical_guidelines',
    'educational_content',
    'board_review',
    'case_studies'
  ],
  
  pediatric_medicine: [
    'aap_guidelines',
    'pediatric_guidelines',
    'pediatric_studies',
    'age_specific_protocols'
  ],
  
  general_clinical: [
    'anchor_guidelines',
    'clinical_guidelines',
    'systematic_reviews',
    'clinical_studies'
  ]
};

// ============================================================================
// INTENT DETECTION FUNCTIONS
// ============================================================================

/**
 * Detect query intent using pattern matching
 * Conservative approach - only returns high-confidence matches
 */
export function detectQueryIntent(query: string): IntentAnalysis {
  const queryLower = query.toLowerCase();
  let bestMatch: QueryIntent = 'general_clinical';
  let maxScore = 0;
  let matchedPatterns: string[] = [];
  
  // Check each intent type
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    let score = 0;
    const currentMatches: string[] = [];
    
    for (const pattern of patterns) {
      if (pattern.test(queryLower)) {
        score += 1;
        currentMatches.push(pattern.source);
      }
    }
    
    if (score > maxScore) {
      maxScore = score;
      bestMatch = intent as QueryIntent;
      matchedPatterns = currentMatches;
    }
  }
  
  // Calculate confidence based on matches and query characteristics
  const confidence = calculateConfidence(maxScore, query, bestMatch);
  
  // Special handling for exam preparation - boost confidence if "generate" + "question" pattern
  if (bestMatch === 'exam_preparation' && /generate.*(?:question|osce|station)/i.test(queryLower)) {
    maxScore += 1;
  }
  
  // Only route if confidence is high (>0.8) to avoid confusion
  const shouldRoute = confidence > 0.8 && bestMatch !== 'general_clinical';
  
  return {
    intent: shouldRoute ? bestMatch : 'general_clinical',
    confidence,
    reasoning: shouldRoute 
      ? `High confidence match for ${bestMatch} (${maxScore} patterns matched)`
      : `Low confidence (${confidence.toFixed(2)}), using general clinical approach`,
    shouldRoute,
    evidencePriority: EVIDENCE_PRIORITIES[shouldRoute ? bestMatch : 'general_clinical'],
    responseStructure: determineResponseStructure(bestMatch, query)
  };
}

/**
 * Calculate confidence score based on pattern matches and query characteristics
 */
function calculateConfidence(patternMatches: number, query: string, intent: QueryIntent): number {
  let confidence = Math.min(patternMatches * 0.3, 1.0); // Base confidence from patterns
  
  // Boost confidence for specific characteristics
  const wordCount = query.split(/\s+/).length;
  
  // Longer, more specific queries get confidence boost
  if (wordCount > 15) confidence += 0.1;
  if (wordCount > 25) confidence += 0.1;
  
  // Specific medical terms boost confidence
  const medicalTerms = [
    'guideline', 'protocol', 'recommendation', 'evidence', 'trial',
    'meta-analysis', 'systematic review', 'dosing', 'adverse',
    'contraindication', 'differential', 'workup', 'diagnosis'
  ];
  
  const termMatches = medicalTerms.filter(term => 
    query.toLowerCase().includes(term)
  ).length;
  
  confidence += termMatches * 0.05;
  
  // Penalize very short or vague queries
  if (wordCount < 8) confidence *= 0.7;
  if (query.includes('?') === false) confidence *= 0.9; // Not a clear question
  
  return Math.min(confidence, 1.0);
}

/**
 * Determine appropriate response structure based on intent and query
 */
function determineResponseStructure(intent: QueryIntent, query: string): 'standard' | 'focused' | 'tabbed' {
  // Multi-part questions (timing, dosing, monitoring) use focused structure
  const hasMultipleParts = /(?:when.*stop|bridging|when.*restart)/i.test(query) ||
                          /(?:dose|dosing).*(?:monitoring|follow-up)/i.test(query) ||
                          /(?:first-line|second-line|alternative)/i.test(query);
  
  if (hasMultipleParts) {
    return 'focused';
  }
  
  // Exam preparation uses tabbed structure for detailed analysis
  if (intent === 'exam_preparation') {
    return 'tabbed';
  }
  
  // Default to standard structure
  return 'standard';
}

// ============================================================================
// INTEGRATION WITH EXISTING SYSTEMS
// ============================================================================

/**
 * Enhanced query analysis that combines intent detection with existing PICO/classification
 */
export function analyzeQueryWithIntent(query: string): {
  intent: IntentAnalysis;
  pico: ReturnType<typeof generateTagsFromQuery>;
  classification: ClassificationResult;
  shouldUseIntentRouting: boolean;
} {
  // Get intent analysis
  const intent = detectQueryIntent(query);
  
  // Get existing PICO tags and classification
  const pico = generateTagsFromQuery(query);
  const classification = classifyQuery(pico.disease_tags, pico.decision_tags);
  
  // Only use intent routing for high-confidence cases
  const shouldUseIntentRouting = intent.shouldRoute && intent.confidence > 0.8;
  
  return {
    intent,
    pico,
    classification,
    shouldUseIntentRouting
  };
}

/**
 * Get enhanced evidence configuration based on intent analysis
 */
export function getIntentBasedEvidenceConfig(analysis: ReturnType<typeof analyzeQueryWithIntent>) {
  if (!analysis.shouldUseIntentRouting) {
    // Use existing system configuration
    return {
      useIntentRouting: false,
      evidencePriority: EVIDENCE_PRIORITIES.general_clinical,
      responseStructure: 'standard' as const,
      maxEvidenceItems: 15
    };
  }
  
  const { intent } = analysis.intent;
  
  // Intent-specific configurations
  const configs = {
    research_synthesis: {
      maxEvidenceItems: 20, // More evidence for synthesis
      prioritizeRecent: true,
      requireSystematicReviews: true
    },
    treatment_planning: {
      maxEvidenceItems: 15,
      prioritizeGuidelines: true,
      requireLandmarkTrials: true
    },
    drug_safety: {
      maxEvidenceItems: 10,
      prioritizeSafetyData: true,
      requireDrugLabels: true
    },
    primary_evidence: {
      maxEvidenceItems: 12,
      prioritizeTrials: true,
      requireLandmarkTrials: true
    },
    exam_preparation: {
      maxEvidenceItems: 8,
      prioritizeGuidelines: true,
      includeEducationalContent: true
    }
  };
  
  const config = configs[intent as keyof typeof configs] || {
    maxEvidenceItems: 15,
    prioritizeGuidelines: true
  };
  
  return {
    useIntentRouting: true,
    evidencePriority: analysis.intent.evidencePriority,
    responseStructure: analysis.intent.responseStructure,
    ...config
  };
}

// ============================================================================
// LOGGING AND MONITORING
// ============================================================================

/**
 * Log intent routing decisions for monitoring and optimization
 */
export function logIntentRouting(query: string, analysis: ReturnType<typeof analyzeQueryWithIntent>) {
  console.log(`🎯 Intent Analysis: ${analysis.intent.intent} (confidence: ${(analysis.intent.confidence * 100).toFixed(1)}%)`);
  console.log(`   Routing: ${analysis.shouldUseIntentRouting ? 'ENABLED' : 'DISABLED'}`);
  console.log(`   Structure: ${analysis.intent.responseStructure}`);
  console.log(`   Reasoning: ${analysis.intent.reasoning}`);
  
  if (analysis.shouldUseIntentRouting) {
    console.log(`   Evidence Priority: ${analysis.intent.evidencePriority.slice(0, 3).join(', ')}...`);
  }
}

// ============================================================================
// VALIDATION AND SAFETY
// ============================================================================

/**
 * Validate that intent routing won't cause confusion
 */
export function validateIntentRouting(query: string, analysis: ReturnType<typeof analyzeQueryWithIntent>): boolean {
  // Don't route if query is too ambiguous
  if (query.split(/\s+/).length < 8) {
    return false;
  }
  
  // Don't route if multiple intents detected with similar confidence
  const allIntents = Object.keys(INTENT_PATTERNS).filter(intent => intent !== 'general_clinical');
  const intentScores = allIntents.map(intent => {
    const patterns = INTENT_PATTERNS[intent as keyof typeof INTENT_PATTERNS];
    return patterns ? patterns.filter(pattern => pattern.test(query.toLowerCase())).length : 0;
  });
  
  const maxScore = Math.max(...intentScores);
  const highScoreCount = intentScores.filter(score => score === maxScore && score > 0).length;
  
  // If multiple intents have the same high score, don't route
  if (highScoreCount > 1) {
    console.log(`⚠️  Multiple intents detected with equal confidence, using general approach`);
    return false;
  }
  
  return true;
}