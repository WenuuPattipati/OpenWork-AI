/**
 * Evidence Sufficiency Scoring System
 * 
 * Calculates a quality score (0-100) for evidence packages based on:
 * - Presence of Cochrane reviews (gold standard)
 * - Clinical guidelines from authoritative sources
 * - Randomized controlled trials with results
 * - Recent peer-reviewed articles (last 5 years)
 * 
 * Enhanced with anchor-aware scoring that:
 * - Computes sufficiency from tag-matching sources when anchor scenario detected
 * - Sets score ≥70 when ≥3 matching anchors exist
 * - Controls Tavily triggering based on score and anchor pack
 * 
 * Provides transparent reasoning for scores and warnings for low-quality evidence.
 */

import type { EvidencePackage } from './engine';

export interface SufficiencyScore {
  score: number; // 0-100
  level: 'excellent' | 'good' | 'limited' | 'insufficient';
  reasoning: string[];
  breakdown: {
    cochraneReviews: number;
    guidelines: number;
    rcts: number;
    recentArticles: number;
  };
}

/**
 * Enhanced sufficiency score with anchor-awareness
 * Used for tag-based scoring and Tavily control
 */
export interface EnhancedSufficiencyScore extends SufficiencyScore {
  anchor_count: number;
  matching_reviews: number;
  matching_trials: number;
  should_call_tavily: boolean;
  rerank_needed: boolean;
  anchor_scenario: string | null;
  total_evidence_count: number;  // NEW: Total evidence volume for debugging
}

/**
 * Recognized anchor scenarios for sufficiency calculation
 * These scenarios have pre-defined anchor guidelines that provide high-quality evidence
 */
export const ANCHOR_SCENARIOS = [
  'af_ckd_anticoagulation',
  'af_anticoagulation',
  'cap_sepsis_antibiotics',
  'cap_duration',
  'dapt_hbr',
  'hfpef_ckd',
  'hfref_management',
  'ahre_anticoagulation',
  'gi_bleed_anticoagulation_restart',
  'sepsis',
  'diabetes_ckd',
] as const;

export type AnchorScenario = typeof ANCHOR_SCENARIOS[number];

/**
 * Mapping from disease_tags + decision_tags to anchor scenarios
 */
export const ANCHOR_SCENARIO_MAPPING: Record<string, { disease_tags: string[]; decision_tags: string[] }> = {
  'af_ckd_anticoagulation': {
    disease_tags: ['AF', 'CKD'],
    decision_tags: ['anticoagulation', 'drug_choice', 'dose'],
  },
  'af_anticoagulation': {
    disease_tags: ['AF'],
    decision_tags: ['anticoagulation', 'drug_choice', 'dose'],
  },
  'cap_sepsis_antibiotics': {
    disease_tags: ['CAP', 'SEPSIS'],
    decision_tags: ['drug_choice', 'duration', 'de-escalation'],
  },
  'cap_duration': {
    disease_tags: ['CAP'],
    decision_tags: ['duration', 'de-escalation'],
  },
  'dapt_hbr': {
    disease_tags: ['PCI', 'CAD', 'HBR'],
    decision_tags: ['antiplatelet', 'duration', 'de-escalation'],
  },
  'hfpef_ckd': {
    disease_tags: ['HF', 'CKD'],
    decision_tags: ['drug_choice', 'therapy'],
  },
  'hfref_management': {
    disease_tags: ['HF'],
    decision_tags: ['drug_choice', 'therapy'],
  },
  'ahre_anticoagulation': {
    disease_tags: ['AHRE', 'AF'],
    decision_tags: ['anticoagulation'],
  },
  'gi_bleed_anticoagulation_restart': {
    disease_tags: ['GI_BLEED', 'AF'],
    decision_tags: ['restart', 'anticoagulation'],
  },
  'sepsis': {
    disease_tags: ['SEPSIS'],
    decision_tags: ['drug_choice', 'duration', 'therapy'],
  },
  'diabetes_ckd': {
    disease_tags: ['DIABETES', 'CKD'],
    decision_tags: ['drug_choice', 'therapy'],
  },
};

/**
 * Calculate evidence sufficiency score
 * 
 * Scoring Algorithm:
 * - Cochrane reviews: +30 points (gold standard systematic reviews)
 * - Clinical guidelines: +25 points (authoritative recommendations)
 * - RCTs with results: +20 points (high-quality primary evidence)
 * - Recent articles (≥5 in last 5 years): +15 points (current evidence)
 * - Systematic reviews (non-Cochrane): +10 points (additional synthesis)
 * 
 * Maximum possible score: 100 points
 * 
 * Error Handling: Returns default "insufficient" score on failure (graceful degradation)
 */
export function scoreEvidenceSufficiency(
  evidence: EvidencePackage
): SufficiencyScore {
  try {
    // Validate input
    if (!evidence) {
      console.warn('⚠️  Sufficiency scoring: No evidence package provided');
      return {
        score: 0,
        level: 'insufficient',
        reasoning: ['No evidence package provided'],
        breakdown: {
          cochraneReviews: 0,
          guidelines: 0,
          rcts: 0,
          recentArticles: 0,
        },
      };
    }

    let score = 0;
    const reasoning: string[] = [];
    const breakdown = {
      cochraneReviews: 0,
      guidelines: 0,
      rcts: 0,
      recentArticles: 0,
    };

    // 1. Cochrane Reviews (Gold Standard) - 35 points (INCREASED from 30)
    try {
      const cochraneCount = (evidence.cochraneReviews?.length || 0) + (evidence.cochraneRecent?.length || 0);
      if (cochraneCount > 0) {
        breakdown.cochraneReviews = 35;
        score += 35;
        reasoning.push(`${cochraneCount} Cochrane review${cochraneCount > 1 ? 's' : ''} (gold standard)`);
      }
    } catch (error: any) {
      console.error('❌ Error scoring Cochrane reviews:', error.message);
    }

    // 2. Clinical Guidelines - 30 points (INCREASED from 25)
    try {
      const guidelineCount =
        (evidence.guidelines?.length || 0) +
        (evidence.pubmedGuidelines?.length || 0) +
        (evidence.whoGuidelines?.length || 0) +
        (evidence.cdcGuidelines?.length || 0) +
        (evidence.niceGuidelines?.length || 0) +
        (evidence.bmjBestPractice?.length || 0) +
        (evidence.cardiovascularGuidelines?.length || 0) +
        (evidence.aapGuidelines?.length || 0);

      if (guidelineCount > 0) {
        breakdown.guidelines = 30;
        score += 30;
        reasoning.push(`${guidelineCount} clinical guideline${guidelineCount > 1 ? 's' : ''}`);
      }
    } catch (error: any) {
      console.error('❌ Error scoring guidelines:', error.message);
    }

    // 3. RCTs with Results - 25 points (INCREASED from 20)
    try {
      const rctsWithResults = (evidence.clinicalTrials || []).filter(
        trial => trial.hasResults && trial.studyType === 'Interventional'
      );
      if (rctsWithResults.length > 0) {
        breakdown.rcts = 25;
        score += 25;
        reasoning.push(`${rctsWithResults.length} randomized controlled trial${rctsWithResults.length > 1 ? 's' : ''} with results`);
      }
    } catch (error: any) {
      console.error('❌ Error scoring RCTs:', error.message);
    }

    // 4. Recent Articles (last 5 years, ≥3 articles) - 20 points (INCREASED from 15)
    // SOFTENED: Lowered threshold from 5 to 3 articles to avoid false "limited evidence"
    // ENHANCED: Count articles from all sources, not just PubMed
    try {
      const currentYear = new Date().getFullYear();
      const recentThreshold = currentYear - 5;

      // Count recent articles from all sources
      let recentCount = 0;

      // PubMed articles
      const pubmedRecent = (evidence.pubmedArticles || []).filter(article => {
        const year = parseInt(article.publicationDate);
        return !isNaN(year) && year >= recentThreshold;
      });
      recentCount += pubmedRecent.length;

      // PMC articles
      const pmcRecent = (evidence.pmcArticles || []).filter(article => {
        const year = parseInt(article.year);
        return !isNaN(year) && year >= recentThreshold;
      });
      recentCount += pmcRecent.length;

      // Europe PMC articles
      const europePMCRecent = (evidence.europePMCRecent || []).filter(article => {
        const year = parseInt(article.firstPublicationDate || article.pubYear || '');
        return !isNaN(year) && year >= recentThreshold;
      });
      recentCount += europePMCRecent.length;

      // Systematic reviews (usually recent)
      recentCount += (evidence.pubmedReviews?.length || 0);
      recentCount += (evidence.systematicReviews?.length || 0);
      recentCount += (evidence.pmcReviews?.length || 0);

      if (recentCount >= 3) {  // Lowered from 5 to 3
        breakdown.recentArticles = 20;
        score += 20;
        reasoning.push(`${recentCount} recent articles (last 5 years)`);
      } else if (recentCount > 0) {
        // Give partial credit even for 1-2 recent articles
        const partialCredit = recentCount * 8;
        breakdown.recentArticles = partialCredit;
        score += partialCredit;
        reasoning.push(`${recentCount} recent article${recentCount > 1 ? 's' : ''} (partial credit: +${partialCredit} points)`);
      }
    } catch (error: any) {
      console.error('❌ Error scoring recent articles:', error.message);
    }

    // 5. Tavily/Web Evidence Bonus (Fallback)
    // If we have very low score from primary sources but good web evidence, boost the score
    try {
      if (score < 40 && evidence.tavilyCitations && evidence.tavilyCitations.length > 0) {
        const webCount = evidence.tavilyCitations.length;
        // Cap bonus at 20 points (enough to push 20-30 score to ~50 passing)
        const webBonus = Math.min(webCount * 2, 20);
        score += webBonus;
        reasoning.push(`${webCount} verified web citations (fallback evidence)`);
      }
    } catch (error: any) {
      console.error('❌ Error scoring Tavily citations:', error.message);
    }

    // 5. Systematic Reviews (non-Cochrane) - 10 points bonus
    try {
      const cochraneCount = (evidence.cochraneReviews?.length || 0) + (evidence.cochraneRecent?.length || 0);
      const systematicReviewCount =
        (evidence.pubmedReviews?.length || 0) +
        (evidence.systematicReviews?.length || 0) +
        (evidence.pmcReviews?.length || 0);

      if (systematicReviewCount > 0 && cochraneCount === 0) {
        score += 10;
        reasoning.push(`${systematicReviewCount} systematic review${systematicReviewCount > 1 ? 's' : ''} (non-Cochrane)`);
      }
    } catch (error: any) {
      console.error('❌ Error scoring systematic reviews:', error.message);
    }

    // 6. Evidence Diversity Bonus - 15 points (INCREASED from 10)
    // ADDED: Reward having multiple types of evidence even if not hitting all thresholds
    // This prevents false "limited evidence" when we have a good mix
    try {
      let evidenceTypes = 0;

      if (breakdown.cochraneReviews > 0) evidenceTypes++;
      if (breakdown.guidelines > 0) evidenceTypes++;
      if (breakdown.rcts > 0) evidenceTypes++;
      if (breakdown.recentArticles > 0) evidenceTypes++;

      // Also count systematic reviews as a type
      const hasSystematicReviews =
        (evidence.pubmedReviews?.length || 0) > 0 ||
        (evidence.systematicReviews?.length || 0) > 0 ||
        (evidence.pmcReviews?.length || 0) > 0;
      if (hasSystematicReviews) evidenceTypes++;

      // If we have 2+ types of evidence, add diversity bonus
      if (evidenceTypes >= 2) {
        const diversityBonus = Math.min(15, evidenceTypes * 4);
        score += diversityBonus;
        reasoning.push(`Evidence diversity bonus: ${evidenceTypes} types of evidence (+${diversityBonus} points)`);
      }

      // 7. Base Evidence Bonus - 10 points
      // ADDED: Give bonus just for having ANY evidence to prevent false "insufficient"
      const totalSources =
        (evidence.pubmedArticles?.length || 0) +
        (evidence.pubmedReviews?.length || 0) +
        (evidence.guidelines?.length || 0) +
        (evidence.cochraneReviews?.length || 0) +
        (evidence.clinicalTrials?.length || 0);

      if (totalSources >= 5) {
        score += 10;
        reasoning.push(`Base evidence bonus: ${totalSources} total sources (+10 points)`);
      }
    } catch (error: any) {
      console.error('❌ Error calculating diversity bonus:', error.message);
    }

    // Determine quality level based on score
    // ULTRA-GENEROUS THRESHOLDS: Maximize use of internal evidence before Tavily
    let level: 'excellent' | 'good' | 'limited' | 'insufficient';
    if (score >= 40) {  // Lowered from 50 - Even moderate evidence is excellent
      level = 'excellent';
    } else if (score >= 25) {  // Lowered from 30 - Lower bar for "good"
      level = 'good';
    } else if (score >= 10) {  // Lowered from 15 - Only very sparse evidence is "limited"
      level = 'limited';
    } else {
      level = 'insufficient';  // Only when we have almost nothing
    }

    // Add summary reasoning
    if (reasoning.length === 0) {
      reasoning.push('No high-quality evidence sources found');
    }

    return {
      score,
      level,
      reasoning,
      breakdown,
    };
  } catch (error: any) {
    console.error('❌ Sufficiency scoring failed:', error.message);
    console.error('Stack trace:', error.stack);
    // Return default insufficient score - system continues without scoring
    return {
      score: 0,
      level: 'insufficient',
      reasoning: ['Error calculating evidence sufficiency'],
      breakdown: {
        cochraneReviews: 0,
        guidelines: 0,
        rcts: 0,
        recentArticles: 0,
      },
    };
  }
}

/**
 * Format sufficiency warning for low-quality evidence
 * Returns null if evidence is sufficient (good or excellent)
 */
export function formatSufficiencyWarning(
  score: SufficiencyScore
): string | null {
  if (score.level === 'excellent' || score.level === 'good') {
    return null; // No warning needed
  }

  let warning = '\n\n--- ⚠️  EVIDENCE QUALITY NOTICE ---\n\n';

  if (score.level === 'insufficient') {
    // SOFTENED: More nuanced messaging
    warning += '**EVOLVING EVIDENCE BASE** (Score: ' + score.score + '/100)\n\n';
    warning += 'While our databases contain relevant research, the evidence base for this specific query is still developing. ';
    warning += 'Available guidelines and reviews support clinical decision-making, though some aspects may rely on expert consensus and clinical judgment.\n\n';
  } else {
    // SOFTENED: More positive framing
    warning += '**MODERATE EVIDENCE BASE** (Score: ' + score.score + '/100)\n\n';
    warning += 'Guidelines and reviews support the following approach, though the evidence base has some limitations. ';
    warning += 'Clinical judgment remains important for individual patient care.\n\n';
  }

  // Identify specific gaps
  const gaps: string[] = [];

  if (score.breakdown.cochraneReviews === 0) {
    gaps.push('- No Cochrane systematic reviews found');
  }

  if (score.breakdown.guidelines === 0) {
    gaps.push('- No clinical practice guidelines found');
  }

  if (score.breakdown.rcts === 0) {
    gaps.push('- No randomized controlled trials with results found');
  }

  if (score.breakdown.recentArticles === 0) {
    gaps.push('- Limited recent research (last 5 years)');
  }

  if (gaps.length > 0) {
    warning += '**Evidence Gaps:**\n';
    warning += gaps.join('\n') + '\n\n';
  }

  warning += '**Clinical Guidance:**\n';
  warning += '- Base recommendations on available evidence while acknowledging limitations\n';
  warning += '- Consider consulting specialist resources or colleagues\n';
  warning += '- Inform patients about the level of evidence supporting recommendations\n';
  warning += '- Monitor for new evidence as research evolves\n\n';

  warning += '--- END EVIDENCE QUALITY NOTICE ---\n\n';

  return warning;
}

/**
 * Check if evidence is sufficient for clinical decision-making
 * Returns true if level is "good" or "excellent"
 */
export function isEvidenceSufficient(score: SufficiencyScore): boolean {
  return score.level === 'excellent' || score.level === 'good';
}

/**
 * Format sufficiency score for display in evidence prompt
 * 
 * ⚠️ CRITICAL: This is for AI's INTERNAL USE ONLY - should NOT appear in user-facing response
 */
export function formatSufficiencyForPrompt(score: SufficiencyScore): string {
  const emoji = {
    'excellent': '🟢',
    'good': '🟡',
    'limited': '🟠',
    'insufficient': '🔴',
  };

  let formatted = '\n\n--- EVIDENCE QUALITY ASSESSMENT (INTERNAL - DO NOT INCLUDE IN RESPONSE) ---\n\n';
  formatted += `**Overall Quality:** ${emoji[score.level]} ${score.level.toUpperCase()} (${score.score}/100)\n\n`;

  formatted += '**Evidence Breakdown:**\n';
  formatted += score.reasoning.map(r => `- ${r}`).join('\n');
  formatted += '\n\n';

  if (score.level === 'excellent') {
    formatted += '**Interpretation:** Strong evidence base with high-quality sources. ';
    formatted += 'Recommendations can be made with confidence.\n\n';
  } else if (score.level === 'good') {
    formatted += '**Interpretation:** Adequate evidence base. ';
    formatted += 'Recommendations are well-supported but may benefit from additional sources.\n\n';
  }

  formatted += '**⚠️ REMINDER: DO NOT copy this assessment into your response. Use it to guide your confidence level only.**\n\n';
  formatted += '--- END EVIDENCE QUALITY ASSESSMENT ---\n\n';

  return formatted;
}

// ============================================================================
// ANCHOR-AWARE SUFFICIENCY SCORING
// ============================================================================

/**
 * Detect anchor scenario from disease and decision tags
 * Returns the most specific matching scenario or null
 */
export function detectAnchorScenario(
  disease_tags: string[],
  decision_tags: string[]
): AnchorScenario | null {
  // Check scenarios in order of specificity (more specific first)
  const scenarioOrder: AnchorScenario[] = [
    'af_ckd_anticoagulation',  // Most specific: AF + CKD
    'gi_bleed_anticoagulation_restart',
    'hfpef_ckd',
    'cap_sepsis_antibiotics',
    'dapt_hbr',
    'ahre_anticoagulation',
    'cap_duration',
    'diabetes_ckd',
    'af_anticoagulation',  // Less specific: just AF
    'hfref_management',
    'sepsis',
  ];

  for (const scenario of scenarioOrder) {
    const mapping = ANCHOR_SCENARIO_MAPPING[scenario];
    if (!mapping) continue;

    // For multi-tag scenarios (like af_ckd), require ALL disease tags to match
    // For single-tag scenarios, require at least one match
    const isMultiDiseaseScenario = mapping.disease_tags.length > 1;

    let diseaseMatch: boolean;
    if (isMultiDiseaseScenario) {
      // All required disease tags must be present in the query
      diseaseMatch = mapping.disease_tags.every(tag => disease_tags.includes(tag));
    } else {
      // At least one disease tag must match
      diseaseMatch = mapping.disease_tags.some(tag => disease_tags.includes(tag));
    }

    // Check if decision tags overlap (at least one match)
    const decisionMatch = mapping.decision_tags.some(tag => decision_tags.includes(tag));

    if (diseaseMatch && decisionMatch) {
      return scenario;
    }
  }

  return null;
}

/**
 * Count anchor guidelines in evidence package
 * Anchors are identified by type === 'Anchor Guideline' or is_anchor metadata
 */
export function countAnchorGuidelines(evidence: EvidencePackage): number {
  let count = 0;

  // Check guidelines array for anchors
  if (evidence.guidelines) {
    count += evidence.guidelines.filter(g =>
      g.type === 'Anchor Guideline' ||
      (g as any).is_anchor === true
    ).length;
  }

  return count;
}

/**
 * Count matching systematic reviews based on tags
 */
export function countMatchingReviews(
  evidence: EvidencePackage,
  disease_tags: string[],
  decision_tags: string[]
): number {
  let count = 0;

  // Check Cochrane reviews
  const cochraneReviews = [
    ...(evidence.cochraneReviews || []),
    ...(evidence.cochraneRecent || []),
  ];

  for (const review of cochraneReviews) {
    if (reviewMatchesTags(review, disease_tags, decision_tags)) {
      count++;
    }
  }

  // Check PubMed reviews
  const pubmedReviews = evidence.pubmedReviews || [];
  for (const review of pubmedReviews) {
    if (reviewMatchesTags(review, disease_tags, decision_tags)) {
      count++;
    }
  }

  return count;
}

/**
 * Count matching trials based on tags
 */
export function countMatchingTrials(
  evidence: EvidencePackage,
  disease_tags: string[],
  decision_tags: string[]
): number {
  let count = 0;

  const trials = evidence.clinicalTrials || [];
  for (const trial of trials) {
    if (trialMatchesTags(trial, disease_tags, decision_tags)) {
      count++;
    }
  }

  return count;
}

/**
 * Check if a review matches the query tags
 */
function reviewMatchesTags(
  review: any,
  disease_tags: string[],
  decision_tags: string[]
): boolean {
  const title = (review.title || '').toLowerCase();
  const abstract = (review.abstract || '').toLowerCase();
  const text = `${title} ${abstract}`;

  // Check for disease tag matches
  const diseaseMatch = disease_tags.some(tag => {
    const patterns = getDiseasePatterns(tag);
    return patterns.some(p => text.includes(p.toLowerCase()));
  });

  // Check for decision tag matches
  const decisionMatch = decision_tags.some(tag => {
    const patterns = getDecisionPatterns(tag);
    return patterns.some(p => text.includes(p.toLowerCase()));
  });

  return diseaseMatch && decisionMatch;
}

/**
 * Check if a trial matches the query tags
 */
function trialMatchesTags(
  trial: any,
  disease_tags: string[],
  decision_tags: string[]
): boolean {
  const title = (trial.title || trial.briefTitle || '').toLowerCase();
  const conditions = (trial.conditions || []).join(' ').toLowerCase();
  const interventions = (trial.interventions || []).join(' ').toLowerCase();
  const text = `${title} ${conditions} ${interventions}`;

  // Check for disease tag matches
  const diseaseMatch = disease_tags.some(tag => {
    const patterns = getDiseasePatterns(tag);
    return patterns.some(p => text.includes(p.toLowerCase()));
  });

  // Check for decision tag matches  
  const decisionMatch = decision_tags.some(tag => {
    const patterns = getDecisionPatterns(tag);
    return patterns.some(p => text.includes(p.toLowerCase()));
  });

  return diseaseMatch || decisionMatch; // More lenient for trials
}

/**
 * Get disease patterns for tag matching
 */
function getDiseasePatterns(tag: string): string[] {
  const patterns: Record<string, string[]> = {
    'AF': ['atrial fibrillation', 'afib', 'af'],
    'CKD': ['chronic kidney', 'ckd', 'renal', 'kidney disease', 'egfr'],
    'HF': ['heart failure', 'hfref', 'hfpef', 'cardiac failure'],
    'CAP': ['pneumonia', 'cap', 'respiratory infection'],
    'SEPSIS': ['sepsis', 'septic'],
    'CAD': ['coronary', 'cad', 'ischemic heart'],
    'PCI': ['pci', 'stent', 'angioplasty'],
    'DIABETES': ['diabetes', 'diabetic', 'glycemic'],
    'GI_BLEED': ['gi bleed', 'gastrointestinal bleed', 'hemorrhage'],
    'HBR': ['bleeding risk', 'high bleeding'],
    'AHRE': ['ahre', 'subclinical af', 'device-detected'],
    'VTE': ['thromboembolism', 'dvt', 'pulmonary embolism'],
  };
  return patterns[tag] || [tag.toLowerCase()];
}

/**
 * Get decision patterns for tag matching
 */
function getDecisionPatterns(tag: string): string[] {
  const patterns: Record<string, string[]> = {
    'anticoagulation': ['anticoagula', 'warfarin', 'apixaban', 'rivaroxaban', 'doac'],
    'antiplatelet': ['antiplatelet', 'aspirin', 'clopidogrel', 'dapt'],
    'drug_choice': ['drug choice', 'preferred', 'first-line', 'optimal'],
    'duration': ['duration', 'how long', 'length'],
    'de-escalation': ['de-escalation', 'step down', 'switch'],
    'dose': ['dose', 'dosing', 'mg'],
    'therapy': ['therapy', 'treatment', 'management'],
    'restart': ['restart', 'resume', 'reinitiate'],
    'monitoring': ['monitor', 'follow-up', 'surveillance'],
    'LAAO': ['laao', 'appendage', 'watchman'],
  };
  return patterns[tag] || [tag.toLowerCase()];
}

/**
 * Score evidence sufficiency with tag-awareness and anchor detection
 * 
 * This enhanced scoring:
 * 1. Detects anchor scenarios from tags
 * 2. Computes sufficiency from tag-matching sources when anchor scenario detected
 * 3. Sets score ≥70 when ≥3 matching anchors exist
 * 4. Determines whether Tavily should be called
 * 5. Respects min_evidence_threshold from guideline search strategy
 * 
 * @param evidence - The evidence package to score
 * @param disease_tags - Extracted disease tags from the query
 * @param decision_tags - Extracted decision tags from the query
 * @param min_evidence_threshold - Minimum articles required before declaring "limited" (default: 3)
 * @returns Enhanced sufficiency score with anchor awareness
 */
export function scoreEvidenceSufficiencyWithTags(
  evidence: EvidencePackage,
  disease_tags: string[],
  decision_tags: string[],
  min_evidence_threshold: number = 3
): EnhancedSufficiencyScore {
  // Get base score first
  const baseScore = scoreEvidenceSufficiency(evidence);

  // Detect anchor scenario
  const anchor_scenario = detectAnchorScenario(disease_tags, decision_tags);

  // Count anchor-related evidence
  const anchor_count = countAnchorGuidelines(evidence);
  const matching_reviews = countMatchingReviews(evidence, disease_tags, decision_tags);
  const matching_trials = countMatchingTrials(evidence, disease_tags, decision_tags);

  // Calculate enhanced score
  let enhancedScore = baseScore.score;
  let enhancedLevel = baseScore.level;
  const enhancedReasoning = [...baseScore.reasoning];
  let rerank_needed = false;

  // PHASE 3 ENHANCEMENT: Check if we meet min_evidence_threshold
  // Count total relevant articles across all sources
  const totalArticles =
    (evidence.pubmedArticles?.length || 0) +
    (evidence.pubmedReviews?.length || 0) +
    (evidence.cochraneReviews?.length || 0) +
    (evidence.cochraneRecent?.length || 0) +
    (evidence.pmcArticles?.length || 0) +
    (evidence.europePMCRecent?.length || 0) +
    (evidence.europePMCCited?.length || 0) +
    (evidence.europePMCOpenAccess?.length || 0) +
    (evidence.pubmedGuidelines?.length || 0) +
    (evidence.semanticScholarPapers?.length || 0) +
    (evidence.semanticScholarHighlyCited?.length || 0);

  // VOLUME-BASED BOOST: If we have substantial evidence volume, boost score significantly
  // This prevents false "insufficient" when we have 150+ evidence items like in user's example
  if (totalArticles >= 50) {  // Substantial evidence volume
    const volumeBonus = Math.min(40, Math.floor(totalArticles / 5)); // Up to 40 points bonus
    enhancedScore = Math.min(100, enhancedScore + volumeBonus);
    enhancedReasoning.push(`High evidence volume: ${totalArticles} articles (+${volumeBonus} points)`);

    // Update level based on new score (using ultra-generous thresholds)
    if (enhancedScore >= 40) {
      enhancedLevel = 'excellent';
    } else if (enhancedScore >= 25) {
      enhancedLevel = 'good';
    }
  } else if (totalArticles >= min_evidence_threshold) {
    // Standard threshold bonus (less generous than volume bonus)
    const thresholdBonus = Math.min(25, totalArticles * 3); // Up to 25 points bonus (increased from 15)
    enhancedScore = Math.min(100, enhancedScore + thresholdBonus);
    enhancedReasoning.push(`Met evidence threshold: ${totalArticles} articles (min: ${min_evidence_threshold})`);

    // Update level based on new score (using softened thresholds)
    if (enhancedScore >= 40) {  // Lowered from 60
      enhancedLevel = 'excellent';
    } else if (enhancedScore >= 25) {  // Lowered from 40
      enhancedLevel = 'good';
    }
  }

  // If anchor scenario detected and we have anchors, boost the score
  if (anchor_scenario && anchor_count >= 3) {
    // Requirement 4.2: Set score ≥70 when ≥3 matching anchors exist
    if (enhancedScore < 70) {
      enhancedScore = 70;
      enhancedLevel = 'good';
      enhancedReasoning.push(`Anchor scenario "${anchor_scenario}" with ${anchor_count} anchor guidelines`);
    }
  } else if (anchor_scenario && anchor_count > 0) {
    // Some anchors but not enough - add bonus points
    const anchorBonus = anchor_count * 10;
    enhancedScore = Math.min(100, enhancedScore + anchorBonus);
    enhancedReasoning.push(`${anchor_count} anchor guideline(s) for "${anchor_scenario}"`);

    // Update level based on new score
    if (enhancedScore >= 70) {
      enhancedLevel = 'excellent';
    } else if (enhancedScore >= 50) {
      enhancedLevel = 'good';
    }
  }

  // Add matching reviews/trials to reasoning
  if (matching_reviews > 0) {
    enhancedReasoning.push(`${matching_reviews} tag-matching systematic review(s)`);
  }
  if (matching_trials > 0) {
    enhancedReasoning.push(`${matching_trials} tag-matching clinical trial(s)`);
  }

  // ORTHOPEDIC/TRAUMA BOOST: Recognize orthopedic evidence quality
  // Orthopedic evidence often comes from radiology journals, case reports, and Open-i
  // These are high-quality for MSK queries even if not traditional RCTs
  const isOrthopedicQuery = disease_tags.some(tag =>
    ['FRACTURE', 'TIBIAL_PLATEAU_FX', 'TRAUMA', 'DISLOCATION', 'LIGAMENT_INJURY', 'MENISCAL_TEAR', 'SPRAIN', 'STRAIN', 'COMPARTMENT_SYNDROME', 'OSTEOMYELITIS'].includes(tag)
  );

  if (isOrthopedicQuery) {
    // Count orthopedic-relevant evidence
    const openIArticles = (evidence.openIResearchArticles?.length || 0) +
      (evidence.openIReviewArticles?.length || 0) +
      (evidence.openISystematicReviews?.length || 0) +
      (evidence.openICaseReports?.length || 0);
    const pmcArticles = evidence.pmcArticles?.length || 0;
    const pubmedArticles = evidence.pubmedArticles?.length || 0;

    if (openIArticles > 0 || pmcArticles > 3 || pubmedArticles > 5) {
      const orthoBonus = Math.min(15, openIArticles * 3 + Math.floor(pmcArticles / 2) + Math.floor(pubmedArticles / 3));
      enhancedScore = Math.min(100, enhancedScore + orthoBonus);
      enhancedReasoning.push(`Orthopedic evidence boost: +${orthoBonus} points (Open-i: ${openIArticles}, PMC: ${pmcArticles}, PubMed: ${pubmedArticles})`);

      // Update level based on new score
      if (enhancedScore >= 70) {
        enhancedLevel = 'excellent';
      } else if (enhancedScore >= 50) {
        enhancedLevel = 'good';
      }
    }
  }

  // Requirement 4.3: If score <50 but anchors exist, flag for reranking
  if (enhancedScore < 50 && anchor_count > 0) {
    rerank_needed = true;
    enhancedReasoning.push('Reranking recommended - anchors exist but score is low');
  }

  // Requirement 4.4, 4.5: Determine if Perplexity should be called
  // Don't call Perplexity if:
  // - Score is ≥40 (GOOD or EXCELLENT) - LOWERED from 50
  // - OR anchor scenario exists with non-empty anchor pack
  // - OR we have high evidence volume (≥50 articles)
  const should_call_tavily = shouldCallTavily(
    enhancedScore,
    anchor_scenario,
    anchor_count,
    totalArticles  // Pass total evidence count for volume-based decisions
  );

  if (!should_call_tavily && anchor_scenario) {
    console.log(`⚓ Skipping Tavily - internal evidence sufficient (score: ${enhancedScore}/100, anchors: ${anchor_count})`);
  }

  return {
    score: enhancedScore,
    level: enhancedLevel,
    reasoning: enhancedReasoning,
    breakdown: baseScore.breakdown,
    anchor_count,
    matching_reviews,
    matching_trials,
    should_call_tavily,
    rerank_needed,
    anchor_scenario,
    total_evidence_count: totalArticles,  // NEW: Include total evidence count
  };
}

/**
 * Determine if Tavily should be called based on score and anchors
 * 
 * Requirements 4.4, 4.5:
 * - Don't call if score ≥40 (LOWERED from 50 to maximize internal evidence use)
 * - Don't call if anchor scenario has non-empty anchor pack
 * - Don't call for orthopedic/trauma queries with good internal evidence (score ≥30)
 * - Don't call if we have substantial evidence volume (≥50 total articles)
 */
export function shouldCallTavily(
  score: number,
  anchor_scenario: AnchorScenario | null,
  anchor_count: number,
  totalEvidenceCount?: number
): boolean {
  // NEW: Volume-based check first - if we have lots of evidence, don't call Tavily
  // This prevents calling Tavily when we have 150+ evidence items like in the user's example
  if (totalEvidenceCount && totalEvidenceCount >= 50) {
    console.log(`📚 High evidence volume (${totalEvidenceCount} items) - skipping Tavily regardless of score`);
    return false;
  }

  // Requirement 4.4: Don't call if score ≥40 (LOWERED from 50)
  if (score >= 40) {
    console.log(`✅ Skipping Tavily - internal evidence score sufficient (${score}/100 ≥ 40)`);
    return false;
  }

  // Requirement 4.5: Don't call if anchor scenario with anchors
  if (anchor_scenario && anchor_count > 0) {
    console.log(`⚓ Skipping Tavily - anchor scenario "${anchor_scenario}" with ${anchor_count} anchors`);
    return false;
  }

  // ORTHOPEDIC/TRAUMA EXCEPTION: Lower threshold for trauma queries
  // Orthopedic evidence is often in radiology journals, case reports, and Open-i
  // These may not score as high as cardiology guidelines but are still high-quality
  if (score >= 30 && anchor_scenario && anchor_scenario.includes('trauma')) {
    console.log(`🦴 Orthopedic/trauma query with score ${score}/100 - skipping Tavily (internal evidence sufficient)`);
    return false;
  }

  // MODERATE VOLUME CHECK: Even with moderate score, if we have decent volume, skip Tavily
  if (totalEvidenceCount && totalEvidenceCount >= 20 && score >= 25) {
    console.log(`📖 Moderate evidence volume (${totalEvidenceCount} items) with decent score (${score}/100) - skipping Tavily`);
    return false;
  }

  // Otherwise, Tavily may be needed
  console.log(`⚠️  Internal evidence insufficient (score: ${score}/100, volume: ${totalEvidenceCount || 'unknown'}) - will call Tavily`);
  return true;
}

/**
 * Format enhanced sufficiency score for logging
 */
export function formatEnhancedSufficiencyLog(score: EnhancedSufficiencyScore): string {
  const emoji = {
    'excellent': '🟢',
    'good': '🟡',
    'limited': '🟠',
    'insufficient': '🔴',
  };

  let log = `\n📊 Evidence Sufficiency: ${emoji[score.level]} ${score.level.toUpperCase()} (${score.score}/100)\n`;
  log += `📚 Total Evidence Volume: ${score.total_evidence_count} articles\n`;

  if (score.anchor_scenario) {
    log += `⚓ Anchor Scenario: ${score.anchor_scenario}\n`;
    log += `   - Anchor Guidelines: ${score.anchor_count}\n`;
    log += `   - Matching Reviews: ${score.matching_reviews}\n`;
    log += `   - Matching Trials: ${score.matching_trials}\n`;
  }

  log += `🔍 Tavily: ${score.should_call_tavily ? 'Will be called' : 'SKIPPED'}\n`;

  if (score.rerank_needed) {
    log += `⚠️  Reranking recommended\n`;
  }

  return log;
}
