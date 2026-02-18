/**
 * Trial Classification System
 * 
 * Classifies clinical trials by type and relevance to prevent inappropriate citations
 * like using ARISE trial for vasopressor choice (identified in suggestions.md).
 */

export interface TrialClassification {
  trialType: string; // e.g., 'vasopressor', 'antibiotic', 'anticoagulation'
  interventionType: string; // e.g., 'drug-comparison', 'strategy-comparison', 'dose-finding'
  primaryEndpoint: string; // e.g., 'mortality', 'efficacy', 'safety'
  population: string; // e.g., 'septic-shock', 'pneumonia', 'heart-failure'
  relevantFor: string[]; // Queries this trial is relevant for
  notRelevantFor: string[]; // Queries this trial should NOT be cited for
}

/**
 * Known trial classifications to prevent misuse
 */
export const TRIAL_CLASSIFICATIONS: Record<string, TrialClassification> = {
  'ARISE': {
    trialType: 'resuscitation-strategy',
    interventionType: 'strategy-comparison',
    primaryEndpoint: 'mortality',
    population: 'early-septic-shock',
    relevantFor: ['early goal-directed therapy', 'sepsis resuscitation', 'fluid management'],
    notRelevantFor: ['vasopressor choice', 'norepinephrine vs vasopressin', 'vasopressor selection']
  },
  
  'VASST': {
    trialType: 'vasopressor',
    interventionType: 'drug-comparison',
    primaryEndpoint: 'mortality',
    population: 'septic-shock',
    relevantFor: ['vasopressor choice', 'norepinephrine vs vasopressin', 'vasopressor selection'],
    notRelevantFor: ['fluid resuscitation', 'early goal-directed therapy']
  },
  
  'SOAP II': {
    trialType: 'vasopressor',
    interventionType: 'drug-comparison', 
    primaryEndpoint: 'mortality',
    population: 'shock',
    relevantFor: ['dopamine vs norepinephrine', 'vasopressor choice'],
    notRelevantFor: ['fluid management', 'antibiotic choice']
  }
};

/**
 * Classify a trial based on title and abstract
 */
export function classifyTrial(
  title: string,
  abstract?: string,
  trialName?: string
): TrialClassification {
  
  // Check known trials first
  if (trialName && TRIAL_CLASSIFICATIONS[trialName.toUpperCase()]) {
    return TRIAL_CLASSIFICATIONS[trialName.toUpperCase()];
  }
  
  const text = `${title} ${abstract || ''}`.toLowerCase();
  
  // Classify by intervention type
  let trialType = 'unknown';
  let interventionType = 'unknown';
  let population = 'unknown';
  
  // Vasopressor trials
  if (text.includes('norepinephrine') || text.includes('vasopressin') || 
      text.includes('dopamine') || text.includes('epinephrine') ||
      text.includes('vasopressor')) {
    trialType = 'vasopressor';
    interventionType = 'drug-comparison';
  }
  
  // Antibiotic trials  
  if (text.includes('antibiotic') || text.includes('antimicrobial') ||
      text.includes('ceftriaxone') || text.includes('azithromycin')) {
    trialType = 'antibiotic';
    interventionType = 'drug-comparison';
  }
  
  // Strategy trials
  if (text.includes('strategy') || text.includes('protocol') ||
      text.includes('goal-directed') || text.includes('bundle')) {
    trialType = 'strategy';
    interventionType = 'strategy-comparison';
  }
  
  return {
    trialType,
    interventionType,
    primaryEndpoint: 'unknown',
    population,
    relevantFor: [],
    notRelevantFor: []
  };
}