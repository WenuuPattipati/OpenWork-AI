/**
 * PICO Extractor - Structured Query Analysis for Evidence Brain
 * 
 * This module extracts PICO components from clinical queries and generates
 * disease_tags and decision_tags that drive all downstream modules:
 * - Query classification
 * - MeSH expansion
 * - Evidence ranking
 * - Sufficiency scoring
 * - Image selection
 * 
 * PICO Framework:
 * - P: Patient/Population
 * - I: Intervention
 * - C: Comparison
 * - O: Outcome
 */

import { generateJSON, GEMINI_FLASH_MODEL } from "@/lib/gemini";
import { expandMedicalAbbreviations } from "./medical-abbreviations";

// ============================================================================
// INTERFACES
// ============================================================================

export interface PICOExtraction {
  patient: string;           // Patient/Population description
  intervention: string;      // Primary intervention being asked about
  comparison: string | null; // Comparison intervention if present
  outcome: string;           // Desired outcome
  condition: string;         // Primary medical condition

  // Generated tags
  disease_tags: string[];    // e.g., ['AF', 'CKD', 'GI_bleed']
  decision_tags: string[];   // e.g., ['anticoagulation', 'drug_choice', 'monitoring']
  primary_disease_tag: string;
  secondary_disease_tags: string[];
  primary_decision_tag: string;
  secondary_decision_tags: string[];
}

export interface SubQuery {
  query: string;           // ≤20 words
  category: 'core_decision' | 'complications' | 'duration_monitoring' | 'alternatives';
  target_evidence: 'guideline' | 'systematic_review' | 'trial' | 'cohort';
}

export interface QueryDecomposition {
  original_query: string;
  word_count: number;
  sub_queries: SubQuery[];
  should_decompose: boolean;
}

// ============================================================================
// TAG DEFINITIONS (Preserve these large objects)
// ============================================================================

// [PRESERVING TAGS - DO NOT DELETE]
// For brevity in this tool call, I will assume the tag dictionaries are preserved.
// Wait, I must include them if I use "Overwrite: true". 
// I will include them fully.

/**
 * Disease tags - extracted from queries
 */
// ============================================================================
// TAG DEFINITIONS (Loaded from Ontology)
// ============================================================================

import ontology from '../knowledge/ontology.json';

/**
 * Helper to escape regex special characters
 */
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const DISEASE_TAGS: Record<string, string[]> = ontology.diseases;
export const DECISION_TAGS: Record<string, string[]> = ontology.decisions;

export function extractDiseaseTags(query: string): string[] {
  const expandedQuery = expandMedicalAbbreviations(query);
  const tags: string[] = [];

  for (const [tag, patterns] of Object.entries(DISEASE_TAGS)) {
    for (const pattern of patterns) {
      // Use regex with word boundaries to prevent substring matching
      // e.g. preventing 'uc' matching 'reduced'
      const regex = new RegExp(`\\b${escapeRegExp(pattern)}\\b`, 'i');
      if (regex.test(expandedQuery)) {
        tags.push(tag);
        break;
      }
    }
  }
  return [...new Set(tags)];
}

export function extractDecisionTags(query: string): string[] {
  const expandedQuery = expandMedicalAbbreviations(query);
  const tags: string[] = [];

  for (const [tag, patterns] of Object.entries(DECISION_TAGS)) {
    for (const pattern of patterns) {
      const regex = new RegExp(`\\b${escapeRegExp(pattern)}\\b`, 'i');
      if (regex.test(expandedQuery)) {
        tags.push(tag);
        break;
      }
    }
  }
  return [...new Set(tags)];
}

export function prioritizeTags(tags: string[], query: string): { primary: string; secondary: string[] } {
  if (tags.length === 0) return { primary: '', secondary: [] };
  if (tags.length === 1) return { primary: tags[0], secondary: [] };

  // Use expanded query for consistency with extraction
  const expandedQuery = expandMedicalAbbreviations(query);
  let earliestIndex = Infinity;
  let primaryTag = tags[0];

  for (const tag of tags) {
    const patterns = DISEASE_TAGS[tag] || DECISION_TAGS[tag] || [];
    for (const pattern of patterns) {
      const regex = new RegExp(`\\b${escapeRegExp(pattern)}\\b`, 'i');
      const match = regex.exec(expandedQuery);
      if (match && match.index < earliestIndex) {
        earliestIndex = match.index;
        primaryTag = tag;
      }
    }
  }
  const secondary = tags.filter(t => t !== primaryTag);
  return { primary: primaryTag, secondary };
}

export function generateTagsFromQuery(query: string): any {
  const disease_tags = extractDiseaseTags(query);
  const decision_tags = extractDecisionTags(query);
  const diseasePriority = prioritizeTags(disease_tags, query);
  const decisionPriority = prioritizeTags(decision_tags, query);

  return {
    disease_tags,
    decision_tags,
    primary_disease_tag: diseasePriority.primary,
    secondary_disease_tags: diseasePriority.secondary,
    primary_decision_tag: decisionPriority.primary,
    secondary_decision_tags: decisionPriority.secondary,
  };
}

// ============================================================================
// PICO EXTRACTION (AI-POWERED)
// ============================================================================

/**
 * Extract PICO components from a clinical query using Gemini
 */
export async function extractPICO(query: string): Promise<PICOExtraction> {
  const tags = generateTagsFromQuery(query);

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.log("⚠️  No Gemini API key, using pattern-based PICO extraction");
    return {
      patient: extractPatientFromQuery(query),
      intervention: extractInterventionFromQuery(query),
      comparison: extractComparisonFromQuery(query),
      outcome: extractOutcomeFromQuery(query),
      condition: tags.primary_disease_tag || 'unknown',
      ...tags,
    };
  }

  try {
    const prompt = `Extract PICO components from this clinical query. Return JSON only.

Query: "${query}"

Extract:
- patient: Brief description of patient/population (age, conditions)
- intervention: Primary intervention being asked about
- comparison: Comparison intervention if mentioned (null if none)
- outcome: Desired clinical outcome
- condition: Primary medical condition (e.g., "atrial fibrillation", "pneumonia")

Return ONLY valid JSON:
{"patient": "...", "intervention": "...", "comparison": null or "...", "outcome": "...", "condition": "..."}`;

    const parsed = await generateJSON<Partial<PICOExtraction>>(prompt, GEMINI_FLASH_MODEL);

    return {
      patient: parsed.patient || extractPatientFromQuery(query),
      intervention: parsed.intervention || extractInterventionFromQuery(query),
      comparison: parsed.comparison || null,
      outcome: parsed.outcome || extractOutcomeFromQuery(query),
      condition: parsed.condition || tags.primary_disease_tag || 'unknown',
      ...tags,
    };

  } catch (error: any) {
    console.error("PICO extraction error:", error.message);
  }

  return {
    patient: extractPatientFromQuery(query),
    intervention: extractInterventionFromQuery(query),
    comparison: extractComparisonFromQuery(query),
    outcome: extractOutcomeFromQuery(query),
    condition: tags.primary_disease_tag || 'unknown',
    ...tags,
  };
}

// ============================================================================
// PATTERN-BASED HELPER FUNCTIONS
// ============================================================================

function extractPatientFromQuery(query: string): string {
  const ageMatch = query.match(/(\d+)[\s-]*(year|yr)[\s-]*(old)?/i);
  const genderMatch = query.match(/\b(man|woman|male|female|patient)\b/i);
  let patient = '';
  if (ageMatch) patient += `${ageMatch[1]}-year-old `;
  if (genderMatch) patient += genderMatch[1].toLowerCase();
  const tags = extractDiseaseTags(query);
  if (tags.length > 0) patient += ` with ${tags.join(', ')}`;
  return patient.trim() || 'adult patient';
}

function extractInterventionFromQuery(query: string): string {
  const decisionTags = extractDecisionTags(query);
  if (decisionTags.length > 0) return decisionTags[0].replace(/_/g, ' ');
  return 'treatment';
}

function extractComparisonFromQuery(query: string): string | null {
  const queryLower = query.toLowerCase();
  if (queryLower.includes(' vs ') || queryLower.includes(' versus ')) {
    const match = query.match(/(\w+)\s+(?:vs|versus)\s+(\w+)/i);
    if (match) return match[2];
  }
  if (queryLower.includes(' or ')) {
    const match = query.match(/(\w+)\s+or\s+(\w+)/i);
    if (match) return match[2];
  }
  return null;
}

function extractOutcomeFromQuery(query: string): string {
  const queryLower = query.toLowerCase();
  if (queryLower.includes('stroke prevention')) return 'stroke prevention';
  if (queryLower.includes('bleeding risk')) return 'minimize bleeding risk';
  if (queryLower.includes('mortality')) return 'reduce mortality';
  if (queryLower.includes('survival')) return 'improve survival';
  if (queryLower.includes('cure')) return 'cure infection';
  if (queryLower.includes('resolution')) return 'symptom resolution';
  return 'optimal clinical outcome';
}

// ============================================================================
// QUERY DECOMPOSITION
// ============================================================================

export function countWords(query: string): number {
  return query.trim().split(/\s+/).length;
}

export async function decomposeQuery(
  query: string,
  pico: PICOExtraction
): Promise<QueryDecomposition> {
  const wordCount = countWords(query);
  const shouldDecompose = wordCount > 100;

  if (!shouldDecompose) {
    return {
      original_query: query,
      word_count: wordCount,
      sub_queries: [],
      should_decompose: false,
    };
  }

  console.log(`📋 Query has ${wordCount} words, decomposing into sub-queries...`);

  const subQueries: SubQuery[] = [];

  const coreQuery = buildCoreDecisionQuery(pico);
  if (coreQuery) subQueries.push({ query: coreQuery, category: 'core_decision', target_evidence: 'guideline' });

  const complicationsQuery = buildComplicationsQuery(pico);
  if (complicationsQuery) subQueries.push({ query: complicationsQuery, category: 'complications', target_evidence: 'systematic_review' });

  const monitoringQuery = buildMonitoringQuery(pico);
  if (monitoringQuery) subQueries.push({ query: monitoringQuery, category: 'duration_monitoring', target_evidence: 'trial' });

  const alternativesQuery = buildAlternativesQuery(pico);
  if (alternativesQuery) subQueries.push({ query: alternativesQuery, category: 'alternatives', target_evidence: 'cohort' });

  subQueries.forEach((sq, i) => {
    console.log(`   ${i + 1}. [${sq.category}] ${sq.query}`);
  });

  return {
    original_query: query,
    word_count: wordCount,
    sub_queries: subQueries,
    should_decompose: true,
  };
}

function buildCoreDecisionQuery(pico: PICOExtraction): string | null {
  const parts: string[] = [];
  if (pico.primary_disease_tag) {
    const diseaseTerms = DISEASE_TAGS[pico.primary_disease_tag];
    if (diseaseTerms && diseaseTerms.length > 0) parts.push(diseaseTerms[0]);
  }
  if (pico.secondary_disease_tags.length > 0) {
    const secondaryTerms = DISEASE_TAGS[pico.secondary_disease_tags[0]];
    if (secondaryTerms && secondaryTerms.length > 0) parts.push(secondaryTerms[0]);
  }
  if (pico.primary_decision_tag) {
    const decisionTerms = DECISION_TAGS[pico.primary_decision_tag];
    if (decisionTerms && decisionTerms.length > 0) parts.push(decisionTerms[0]);
  }
  if (parts.length === 0) return null;
  return `${parts.join(' ')} guideline recommendations`.slice(0, 150);
}

function buildComplicationsQuery(pico: PICOExtraction): string | null {
  const hasAF = pico.disease_tags.includes('AF');
  const hasCKD = pico.disease_tags.includes('CKD');
  const hasGIBleed = pico.disease_tags.includes('GI_BLEED');
  const hasHBR = pico.disease_tags.includes('HBR');

  if (hasAF && hasCKD) return 'atrial fibrillation advanced chronic kidney disease anticoagulation outcomes';
  if (hasAF && hasGIBleed) return 'atrial fibrillation gastrointestinal bleeding restart anticoagulation timing';
  if (hasAF && hasHBR) return 'atrial fibrillation high bleeding risk anticoagulation strategy';

  if (pico.secondary_disease_tags.length > 0) {
    const primary = DISEASE_TAGS[pico.primary_disease_tag]?.[0] || pico.condition;
    const secondary = DISEASE_TAGS[pico.secondary_disease_tags[0]]?.[0] || '';
    return `${primary} ${secondary} management outcomes`.trim();
  }
  return null;
}

function buildMonitoringQuery(pico: PICOExtraction): string | null {
  const hasMonitoring = pico.decision_tags.includes('monitoring');
  const hasDuration = pico.decision_tags.includes('duration');
  const hasDose = pico.decision_tags.includes('dose');
  if (!hasMonitoring && !hasDuration && !hasDose) return null;

  const disease = DISEASE_TAGS[pico.primary_disease_tag]?.[0] || pico.condition;
  if (hasMonitoring) return `${disease} renal function bleeding risk monitoring frequency`;
  if (hasDuration) return `${disease} treatment duration optimal length`;
  if (hasDose) {
    const hasCKD = pico.disease_tags.includes('CKD');
    if (hasCKD) return `${disease} dosing chronic kidney disease renal adjustment`;
    return `${disease} dosing recommendations`;
  }
  return null;
}

function buildAlternativesQuery(pico: PICOExtraction): string | null {
  const hasLAAO = pico.decision_tags.includes('LAAO');
  const hasAF = pico.disease_tags.includes('AF');
  const hasCKD = pico.disease_tags.includes('CKD');
  if (hasLAAO || (hasAF && hasCKD)) return 'left atrial appendage occlusion advanced chronic kidney disease outcomes';
  if (pico.comparison) {
    const disease = DISEASE_TAGS[pico.primary_disease_tag]?.[0] || pico.condition;
    return `${disease} ${pico.intervention} versus ${pico.comparison} comparison`;
  }
  return null;
}
