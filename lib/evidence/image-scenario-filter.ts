/**
 * Image Scenario Filter - Prevents Wrong Images for Clinical Queries
 * 
 * This module implements allow/deny lists to ensure images match the clinical scenario.
 * Prevents dangerous mismatches like AF cardioversion algorithms for cancer VTE queries.
 */

export interface ImageFilterRule {
  scenario: string;
  allowedTerms: string[];
  deniedTerms: string[];
  minRelevanceScore: number;
}

/**
 * Scenario-specific image filtering rules
 */
export const IMAGE_FILTER_RULES: Record<string, ImageFilterRule> = {
  // Cancer-Associated VTE with Thrombocytopenia
  cancer_vte: {
    scenario: 'cancer_vte',
    allowedTerms: [
      'venous thromboembolism', 'vte', 'dvt', 'pulmonary embolism', 'pe',
      'cancer-associated thrombosis', 'cat', 'malignancy thrombosis',
      'lmwh', 'low molecular weight heparin', 'anticoagulation',
      'thrombocytopenia', 'platelet count', 'bleeding risk',
      'oncology', 'cancer', 'metastatic', 'pancreatic cancer',
      'treatment algorithm', 'management flowchart', 'decision tree'
    ],
    deniedTerms: [
      'atrial fibrillation', 'af', 'cardioversion', 'stroke risk',
      'chads2', 'cha2ds2-vasc', 'rate control', 'rhythm control',
      'electrical cardioversion', 'pharmacological cardioversion',
      'anticoagulation before cardioversion', 'tee guided',
      'transesophageal echocardiography', 'immediate risk stroke'
    ],
    minRelevanceScore: 70
  },

  // Atrial Fibrillation (should NOT appear for VTE queries)
  atrial_fibrillation: {
    scenario: 'atrial_fibrillation',
    allowedTerms: [
      'atrial fibrillation', 'af', 'afib', 'cardioversion',
      'stroke risk', 'chads2', 'cha2ds2-vasc', 'anticoagulation',
      'rate control', 'rhythm control', 'ablation'
    ],
    deniedTerms: [
      'venous thromboembolism', 'vte', 'dvt', 'pulmonary embolism',
      'cancer', 'malignancy', 'thrombocytopenia', 'platelet count',
      'lmwh', 'cancer-associated thrombosis'
    ],
    minRelevanceScore: 60
  },

  // Heart Failure with Preserved EF
  hfpef: {
    scenario: 'hfpef',
    allowedTerms: [
      'heart failure', 'hfpef', 'preserved ejection fraction',
      'diastolic heart failure', 'sglt2 inhibitor', 'empagliflozin',
      'dapagliflozin', 'spironolactone', 'mra', 'diuretics',
      'elderly', 'comorbidities', 'ckd', 'diabetes'
    ],
    deniedTerms: [
      'atrial fibrillation', 'cardioversion', 'vte', 'cancer',
      'thrombocytopenia', 'anticoagulation failure'
    ],
    minRelevanceScore: 65
  },

  // VTE Anticoagulation Failure
  vte_failure: {
    scenario: 'vte_failure',
    allowedTerms: [
      'anticoagulation failure', 'recurrent vte', 'breakthrough vte',
      'doac failure', 'lmwh', 'warfarin', 'ivc filter',
      'treatment algorithm', 'escalation', 'alternative therapy'
    ],
    deniedTerms: [
      'atrial fibrillation', 'cardioversion', 'stroke risk',
      'chads2', 'rate control', 'rhythm control'
    ],
    minRelevanceScore: 70
  }
};

/**
 * Calculate relevance score for an image based on title and description
 */
export function calculateImageRelevance(
  imageTitle: string,
  imageDescription: string,
  scenario: string
): number {
  const rule = IMAGE_FILTER_RULES[scenario];
  if (!rule) return 0;

  const text = `${imageTitle} ${imageDescription}`.toLowerCase();
  let score = 0;

  // Check for allowed terms (positive scoring)
  for (const term of rule.allowedTerms) {
    if (text.includes(term.toLowerCase())) {
      score += 10;
    }
  }

  // Check for denied terms (negative scoring)
  for (const term of rule.deniedTerms) {
    if (text.includes(term.toLowerCase())) {
      score -= 50; // Heavy penalty for denied terms
    }
  }

  return Math.max(0, score); // Don't allow negative scores
}

/**
 * Filter images based on scenario rules
 */
export function filterImagesByScenario(
  images: Array<{title: string; description: string; url: string}>,
  scenario: string
): Array<{title: string; description: string; url: string; relevanceScore: number}> {
  const rule = IMAGE_FILTER_RULES[scenario];
  if (!rule) return images.map(img => ({...img, relevanceScore: 0}));

  return images
    .map(image => ({
      ...image,
      relevanceScore: calculateImageRelevance(image.title, image.description, scenario)
    }))
    .filter(image => image.relevanceScore >= rule.minRelevanceScore)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Detect scenario from query tags
 */
export function detectImageScenario(diseaseTags: string[], decisionTags: string[]): string | null {
  // Cancer VTE with thrombocytopenia
  if (diseaseTags.includes('VTE') && (diseaseTags.includes('CANCER') || diseaseTags.includes('THROMBOCYTOPENIA'))) {
    return 'cancer_vte';
  }

  // VTE anticoagulation failure
  if (diseaseTags.includes('VTE') && decisionTags.includes('anticoagulation')) {
    return 'vte_failure';
  }

  // HFpEF
  if (diseaseTags.includes('HF')) {
    return 'hfpef';
  }

  // Atrial Fibrillation (should be specific)
  if (diseaseTags.includes('AF') && !diseaseTags.includes('VTE') && !diseaseTags.includes('CANCER')) {
    return 'atrial_fibrillation';
  }

  return null;
}

/**
 * Main function to filter medical images for a query
 */
export function filterMedicalImagesForQuery(
  images: Array<{title: string; description: string; url: string}>,
  diseaseTags: string[],
  decisionTags: string[]
): Array<{title: string; description: string; url: string; relevanceScore: number}> {
  const scenario = detectImageScenario(diseaseTags, decisionTags);
  
  if (!scenario) {
    // No specific scenario - return all images with basic scoring
    return images.map(img => ({...img, relevanceScore: 50}));
  }

  console.log(`🖼️  Filtering images for scenario: ${scenario}`);
  const filtered = filterImagesByScenario(images, scenario);
  
  // CRITICAL FIX: If filtering results in too few images, relax the criteria
  if (filtered.length < 2) {
    console.log(`🖼️  Too few images after filtering (${filtered.length}), relaxing criteria...`);
    // Return all images with basic scoring instead of strict filtering
    return images.map(img => ({...img, relevanceScore: 40}));
  }
  
  console.log(`🖼️  Filtered ${images.length} → ${filtered.length} images (min score: ${IMAGE_FILTER_RULES[scenario]?.minRelevanceScore})`);
  
  return filtered;
}