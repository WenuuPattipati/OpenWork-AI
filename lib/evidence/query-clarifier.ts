/**
 * Query Clarifier - Structured Query Understanding for Evidence Brain
 * 
 * This module transforms fuzzy natural language queries into structured
 * ClarifiedQuery objects that drive all downstream evidence retrieval.
 */

import { generateJSON, GEMINI_FLASH_MODEL } from "@/lib/gemini";

// ============================================================================
// INTERFACES
// ============================================================================

export interface ClarifiedQuery {
  clinical_question: string;          // Single focused question (1 sentence)
  population: string;                 // P: Patient/Population
  intervention_or_index: string;      // I: Intervention or Index condition
  comparator: string | null;          // C: Comparison (optional)
  outcomes: string[];                 // O: Outcomes of interest
  decision_type: 'diagnosis' | 'treatment' | 'guideline' | 'prognosis' | 'workup';
  guideline_bodies: string[];         // e.g., ['KDIGO', 'ACC/AHA', 'ESC']
  key_drugs: string[];                // e.g., ['patiromer', 'apixaban']
  key_biomarkers: string[];           // e.g., ['potassium', 'eGFR', 'troponin']
  has_medical_observations: boolean;  // Does query contain vitals/labs/imaging?
  timeframe?: string;                 // e.g., '2024', 'recent', 'last 5 years'
  confidence: number;                 // 0-1: LLM confidence in extraction
}

export interface QueryClarificationResult {
  clarified: ClarifiedQuery;
  validation_warnings: string[];      // Issues found during validation
  fallback_used: boolean;             // True if pattern-based fallback was used
}

// ============================================================================
// KNOWN ENTITIES FOR VALIDATION
// ============================================================================

/**
 * Known guideline bodies - used for validation
 */
const KNOWN_GUIDELINE_BODIES = [
  // Nephrology
  'KDIGO', 'KDOQI', 'NKF',
  // Cardiology
  'ACC/AHA', 'ACC', 'AHA', 'ESC', 'CCS',
  // Infectious Disease
  'IDSA', 'ESCMID', 'SHEA',
  // Endocrinology
  'ADA', 'AACE', 'Endocrine Society',
  // Pulmonary
  'ATS', 'ERS', 'CHEST',
  // Oncology
  'NCCN', 'ASCO', 'ESMO',
  // Hematology
  'ASH', 'ISTH',
  // Gastroenterology
  'ACG', 'AGA', 'ASGE',
  // Neurology
  'AAN', 'EAN',
  // Pediatrics
  'AAP',
  // International
  'WHO', 'CDC', 'NICE', 'SIGN',
  // Specialty
  'Surviving Sepsis Campaign', 'GOLD', 'GINA',
];

/**
 * Decision type keywords for pattern-based fallback
 */
const DECISION_TYPE_PATTERNS: Record<string, string[]> = {
  'guideline': ['guideline', 'recommendation', 'consensus', 'statement', 'standards of care', 'practice guideline'],
  'diagnosis': ['diagnosis', 'diagnostic', 'differential', 'workup', 'evaluation', 'rule out', 'ddx'],
  'treatment': ['treatment', 'therapy', 'management', 'drug', 'medication', 'intervention', 'approach to managing'],
  'prognosis': ['prognosis', 'outcome', 'survival', 'mortality', 'risk', 'prediction'],
  'workup': ['workup', 'evaluation', 'assessment', 'investigation', 'testing', 'screening'],
};

// ============================================================================
// QUERY CLARIFICATION FUNCTIONS
// ============================================================================

/**
 * Clarify a clinical query using LLM extraction
 */
export async function clarifyQuery(
  query: string,
  expandedQuery: string,
  disease_tags?: string[],
  decision_tags?: string[],
  observations?: any // MedicalObservationSummary from observation-extractor
): Promise<QueryClarificationResult> {
  console.log('🔍 Query Clarification: Starting structured extraction with Gemini...');

  try {
    // Use LLM to extract structured query
    const prompt = buildClarificationPrompt(query, expandedQuery, disease_tags, decision_tags);

    // We expect the LLM to return a JSON object with the structure of ClarifiedQuery
    // but the prompt returns a wrapper object with keys like "clinical_question", etc.
    // which effectively matches ClarifiedQuery structure directly.
    const parsed = await generateJSON<ClarifiedQuery>(prompt, GEMINI_FLASH_MODEL);

    // Validate and fill defaults
    const validated = validateClarifiedQuery(parsed);

    console.log('✅ Query Clarification: Structured extraction complete');
    console.log(`   Decision type: ${validated.decision_type}`);
    console.log(`   Guideline bodies: ${validated.guideline_bodies.join(', ') || 'none'}`);
    console.log(`   Key drugs: ${validated.key_drugs.join(', ') || 'none'}`);
    console.log(`   Confidence: ${Math.round(validated.confidence * 100)}%`);

    return {
      clarified: validated,
      validation_warnings: [],
      fallback_used: false
    };

  } catch (error: any) {
    console.error('❌ Query Clarification failed:', error.message);
    console.log('⚠️  Falling back to pattern-based extraction');
    return patternBasedClarification(query, expandedQuery, disease_tags, decision_tags, observations);
  }
}

/**
 * Helper to validate and clean the extracted query
 */
function validateClarifiedQuery(parsed: any): ClarifiedQuery {
  return {
    clinical_question: parsed.clinical_question || "",
    population: parsed.population || "",
    intervention_or_index: parsed.intervention_or_index || "",
    comparator: parsed.comparator || null,
    outcomes: Array.isArray(parsed.outcomes) ? parsed.outcomes : [],
    decision_type: ['diagnosis', 'treatment', 'guideline', 'prognosis', 'workup'].includes(parsed.decision_type) ? parsed.decision_type : 'treatment',
    guideline_bodies: Array.isArray(parsed.guideline_bodies) ? parsed.guideline_bodies : [],
    key_drugs: Array.isArray(parsed.key_drugs) ? parsed.key_drugs : [],
    key_biomarkers: Array.isArray(parsed.key_biomarkers) ? parsed.key_biomarkers : [],
    has_medical_observations: !!parsed.has_medical_observations,
    timeframe: parsed.timeframe || undefined,
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8
  };
}

/**
 * Build prompt for LLM query clarification
 */
function buildClarificationPrompt(
  query: string,
  expandedQuery: string,
  disease_tags?: string[],
  decision_tags?: string[]
): string {
  return `You are a medical query analyzer. Extract structured information from this clinical query.

**Original Query:**
${query}

**Expanded Query (abbreviations expanded):**
${expandedQuery}

${disease_tags && disease_tags.length > 0 ? `**Preliminary Disease Tags:** ${disease_tags.join(', ')}` : ''}
${decision_tags && decision_tags.length > 0 ? `**Preliminary Decision Tags:** ${decision_tags.join(', ')}` : ''}

**Task:** Extract the following structured information and return ONLY valid JSON:

{
  "clinical_question": "Single focused clinical question (1 sentence)",
  "population": "Patient population (P in PICO)",
  "intervention_or_index": "Intervention or index condition (I in PICO)",
  "comparator": "Comparison intervention if present, otherwise null",
  "outcomes": ["List of outcomes of interest"],
  "decision_type": "One of: diagnosis, treatment, guideline, prognosis, workup",
  "guideline_bodies": ["List of guideline organizations mentioned: KDIGO, ACC/AHA, ESC, IDSA, ADA, WHO, CDC, NICE, etc."],
  "key_drugs": ["List of specific drugs mentioned"],
  "key_biomarkers": ["List of biomarkers/lab tests mentioned: potassium, eGFR, troponin, BNP, etc."],
  "has_medical_observations": false,
  "timeframe": "Year or time period if mentioned, otherwise null",
  "confidence": 0.95
}

**Rules:**
1. decision_type:
   - "guideline" if asking about guidelines, recommendations, or standards
   - "treatment" if asking about therapy, management, or drugs
   - "diagnosis" if asking about diagnosis, differential, or workup
   - "prognosis" if asking about outcomes, survival, or risk
   - "workup" if asking about evaluation, testing, or screening

2. guideline_bodies: Extract ONLY if explicitly mentioned (KDIGO, ACC/AHA, ESC, IDSA, ADA, WHO, CDC, NICE, AAP, ATS, NCCN, etc.)

3. key_drugs: Extract specific drug names (generic or brand), not drug classes

4. key_biomarkers: Extract lab tests, biomarkers, vital signs mentioned

5. has_medical_observations: Set to true ONLY if query contains specific values (e.g., "K+ 6.2", "BP 90/50", "eGFR 25")

6. confidence: Your confidence in the extraction (0.0-1.0)

Return ONLY the JSON object, no other text.`;
}

/**
 * Parse and validate LLM response
 */
function parseAndValidateClarification(
  response: string,
  originalQuery: string
): QueryClarificationResult {
  const warnings: string[] = [];

  try {
    const parsed = JSON.parse(response) as ClarifiedQuery;

    // Validate decision_type
    const validDecisionTypes = ['diagnosis', 'treatment', 'guideline', 'prognosis', 'workup'];
    if (!validDecisionTypes.includes(parsed.decision_type)) {
      warnings.push(`Invalid decision_type: ${parsed.decision_type}, defaulting to 'treatment'`);
      parsed.decision_type = 'treatment';
    }

    // Validate guideline_bodies against known list
    if (parsed.guideline_bodies && parsed.guideline_bodies.length > 0) {
      const validated = parsed.guideline_bodies.filter(body => {
        const isKnown = KNOWN_GUIDELINE_BODIES.some(known =>
          body.toUpperCase().includes(known.toUpperCase()) ||
          known.toUpperCase().includes(body.toUpperCase())
        );
        if (!isKnown) {
          warnings.push(`Unknown guideline body: ${body} (keeping anyway)`);
        }
        return true; // Keep all, just warn
      });
      parsed.guideline_bodies = validated;
    }

    // Ensure arrays are arrays
    if (!Array.isArray(parsed.outcomes)) parsed.outcomes = [];
    if (!Array.isArray(parsed.guideline_bodies)) parsed.guideline_bodies = [];
    if (!Array.isArray(parsed.key_drugs)) parsed.key_drugs = [];
    if (!Array.isArray(parsed.key_biomarkers)) parsed.key_biomarkers = [];

    // Ensure confidence is valid
    if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
      parsed.confidence = 0.7; // Default moderate confidence
    }

    return {
      clarified: parsed,
      validation_warnings: warnings,
      fallback_used: false,
    };

  } catch (error: any) {
    console.error('❌ Failed to parse LLM response:', error.message);
    throw error; // Will trigger pattern-based fallback
  }
}

/**
 * Pattern-based fallback when LLM is unavailable or fails
 */
function patternBasedClarification(
  query: string,
  expandedQuery: string,
  disease_tags?: string[],
  decision_tags?: string[],
  observations?: any
): QueryClarificationResult {
  const lowerQuery = query.toLowerCase();
  const lowerExpanded = expandedQuery.toLowerCase();

  // Detect decision type
  let decision_type: ClarifiedQuery['decision_type'] = 'treatment'; // default
  for (const [type, patterns] of Object.entries(DECISION_TYPE_PATTERNS)) {
    if (patterns.some(pattern => lowerQuery.includes(pattern) || lowerExpanded.includes(pattern))) {
      decision_type = type as ClarifiedQuery['decision_type'];
      break;
    }
  }

  // Extract guideline bodies
  const guideline_bodies: string[] = [];
  for (const body of KNOWN_GUIDELINE_BODIES) {
    if (lowerQuery.includes(body.toLowerCase()) || lowerExpanded.includes(body.toLowerCase())) {
      guideline_bodies.push(body);
    }
  }

  // Extract timeframe
  const yearMatch = query.match(/\b(20\d{2})\b/);
  const timeframe = yearMatch ? yearMatch[1] : undefined;

  // Extract key biomarkers from observations if available
  const key_biomarkers: string[] = [];
  if (observations?.labs) {
    key_biomarkers.push(...observations.labs.map((l: any) => l.test));
  }

  // Build clarified query
  const clarified: ClarifiedQuery = {
    clinical_question: query,
    population: disease_tags?.join(', ') || 'patients',
    intervention_or_index: decision_tags?.join(', ') || 'management',
    comparator: null,
    outcomes: [],
    decision_type,
    guideline_bodies,
    key_drugs: [],
    key_biomarkers: [...new Set(key_biomarkers)], // Deduplicate
    has_medical_observations: observations?.has_observations || false,
    timeframe,
    confidence: 0.5, // Lower confidence for pattern-based
  };

  return {
    clarified,
    validation_warnings: ['Pattern-based fallback used (no LLM available)'],
    fallback_used: true,
  };
}

/**
 * Quick check if a query is a guideline query
 * Used for fast path optimization
 */
export function isGuidelineQuery(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  return DECISION_TYPE_PATTERNS['guideline'].some(pattern => lowerQuery.includes(pattern));
}

/**
 * Extract guideline bodies from query (fast pattern-based)
 * Used when full clarification isn't needed
 */
export function extractGuidelineBodies(query: string): string[] {
  const lowerQuery = query.toLowerCase();
  const bodies: string[] = [];

  for (const body of KNOWN_GUIDELINE_BODIES) {
    if (lowerQuery.includes(body.toLowerCase())) {
      bodies.push(body);
    }
  }

  return bodies;
}
