/**
 * RAG QUERY BUILDER - Core RAG Component
 * 
 * Builds scenario-specific sub-queries for targeted evidence retrieval
 * Supports both Doctor Mode (clinical) and General Mode (consumer) queries
 */

import { expandMedicalAbbreviations, getExpandedTerms } from './medical-abbreviations';

export interface RAGSubQueries {
  guidelineQueries: string[];
  trialQueries: string[];
  safetyQueries: string[];
  outcomeQueries: string[];
  lifestyleQueries: string[]; // General Mode only
  educationQueries: string[]; // General Mode only
}

export interface QueryTags {
  disease_tags: string[];
  decision_tags: string[];
  primary_disease_tag: string;
  primary_decision_tag: string;
}

/**
 * Scenario-specific query templates for Doctor Mode
 */
const DOCTOR_MODE_SCENARIOS: Record<string, any> = {
  // Heart Failure with Preserved EF
  hfpef: {
    guidelines: [
      "HFpEF management guideline 2022 2023 2026",
      "heart failure preserved ejection fraction recommendation",
      "ACC AHA HFSA heart failure guideline"
    ],
    trials: [
      "SGLT2 inhibitor HFpEF randomized trial elderly",
      "EMPEROR-Preserved empagliflozin",
      "DELIVER dapagliflozin HFpEF"
    ],
    outcomes: [
      "HFpEF hospitalization mortality SGLT2i",
      "heart failure preserved EF cardiovascular death",
      "HFpEF quality of life outcomes"
    ],
    safety: [
      "SGLT2i contraindications elderly CKD",
      "HFpEF medication safety monitoring",
      "empagliflozin dapagliflozin adverse events"
    ],
    stepwise: [
      "HFpEF treatment algorithm step by step",
      "heart failure preserved EF management sequence",
      "SGLT2i MRA ACEi ARB treatment order HFpEF"
    ],
    elderly: [
      "HFpEF elderly patient management considerations",
      "SGLT2 inhibitor elderly dosing monitoring",
      "heart failure preserved EF age specific treatment"
    ]
  },

  // VTE Anticoagulation Failure
  vte_failure: {
    guidelines: [
      "venous thromboembolism recurrent anticoagulation failure guideline",
      "CHEST VTE anticoagulation 2021",
      "recurrent VTE management recommendation"
    ],
    trials: [
      "LMWH vs DOAC recurrent VTE trial",
      "anticoagulation failure treatment RCT",
      "extended anticoagulation VTE"
    ],
    outcomes: [
      "recurrent VTE mortality bleeding outcomes",
      "anticoagulation failure treatment success",
      "VTE recurrence prevention efficacy"
    ],
    safety: [
      "LMWH major bleeding risk factors",
      "anticoagulation escalation safety",
      "VTE treatment bleeding complications"
    ]
  },

  // Atrial Fibrillation + CKD
  af_ckd: {
    guidelines: [
      "atrial fibrillation chronic kidney disease guideline",
      "AF anticoagulation CKD recommendation",
      "ACC AHA AF guideline CKD section"
    ],
    trials: [
      "apixaban warfarin ESRD dialysis trial",
      "DOAC chronic kidney disease RCT",
      "AF anticoagulation renal impairment"
    ],
    outcomes: [
      "AF CKD stroke bleeding outcomes",
      "anticoagulation CKD mortality",
      "DOAC vs warfarin kidney disease"
    ],
    safety: [
      "DOAC dosing chronic kidney disease",
      "anticoagulation bleeding risk CKD",
      "AF medication renal adjustment"
    ]
  },

  // Community-Acquired Pneumonia
  cap: {
    guidelines: [
      "community acquired pneumonia guideline IDSA ATS 2019",
      "CAP antibiotic recommendation",
      "pneumonia treatment guideline"
    ],
    trials: [
      "CAP antibiotic duration RCT",
      "pneumonia treatment efficacy trial",
      "community pneumonia outcomes"
    ],
    outcomes: [
      "CAP mortality clinical cure",
      "pneumonia antibiotic treatment success",
      "community pneumonia hospitalization"
    ],
    safety: [
      "CAP antibiotic adverse events",
      "pneumonia treatment safety",
      "fluoroquinolone safety CAP"
    ]
  },

  // Atrial Fibrillation Anticoagulation
  af_anticoagulation: {
    guidelines: [
      "atrial fibrillation anticoagulation guideline ACC AHA ESC 2023 2026",
      "AF stroke prevention recommendation DOAC warfarin",
      "atrial fibrillation management guideline CHA2DS2-VASc"
    ],
    trials: [
      "DOAC vs warfarin atrial fibrillation randomized trial",
      "apixaban rivaroxaban dabigatran edoxaban AF RCT",
      "left atrial appendage occlusion LAAO trial WATCHMAN",
      "ARTESIA NOAH-AFNET subclinical atrial fibrillation"
    ],
    outcomes: [
      "atrial fibrillation stroke prevention efficacy DOAC",
      "AF anticoagulation mortality outcomes",
      "DOAC vs warfarin stroke bleeding outcomes",
      "LAAO vs anticoagulation outcomes"
    ],
    safety: [
      "DOAC bleeding risk atrial fibrillation",
      "warfarin contraindication alternative therapy AF",
      "anticoagulation bleeding complications AF",
      "HAS-BLED score bleeding risk assessment"
    ],
    alternatives: [
      "left atrial appendage occlusion LAAO WATCHMAN",
      "antiplatelet therapy atrial fibrillation",
      "AF management without anticoagulation",
      "DOAC contraindication alternative AF"
    ]
  },

  // Melanoma with BRAF Mutation
  melanoma_braf: {
    guidelines: [
      "melanoma BRAF mutation treatment guideline NCCN ESMO",
      "metastatic melanoma immunotherapy targeted therapy guideline",
      "BRAF mutant melanoma management recommendation"
    ],
    trials: [
      "BRAF MEK inhibitor melanoma randomized trial",
      "immunotherapy melanoma BRAF mutation RCT",
      "pembrolizumab nivolumab melanoma trial",
      "dabrafenib trametinib melanoma",
      "vemurafenib cobimetinib melanoma"
    ],
    outcomes: [
      "melanoma BRAF immunotherapy vs targeted therapy survival",
      "progression free survival melanoma BRAF",
      "overall survival melanoma immunotherapy targeted",
      "response rate melanoma BRAF mutation"
    ],
    safety: [
      "BRAF MEK inhibitor adverse events toxicity",
      "immunotherapy melanoma immune-related adverse events",
      "checkpoint inhibitor toxicity melanoma",
      "targeted therapy resistance melanoma"
    ],
    biomarkers: [
      "BRAF V600E V600K mutation melanoma",
      "PD-L1 expression melanoma immunotherapy",
      "tumor mutational burden melanoma",
      "lactate dehydrogenase LDH melanoma prognosis"
    ],
    sequencing: [
      "melanoma BRAF first-line treatment sequence",
      "immunotherapy after targeted therapy melanoma",
      "targeted therapy after immunotherapy melanoma",
      "combination vs sequential melanoma BRAF"
    ]
  },

  // Generic Oncology
  oncology: {
    guidelines: [
      "cancer treatment guideline NCCN ASCO ESMO",
      "oncology management recommendation",
      "cancer therapy guideline"
    ],
    trials: [
      "cancer treatment randomized controlled trial",
      "oncology therapy efficacy RCT",
      "cancer immunotherapy trial"
    ],
    outcomes: [
      "cancer treatment survival outcomes",
      "progression free survival overall survival",
      "cancer therapy response rate"
    ],
    safety: [
      "cancer treatment adverse events toxicity",
      "chemotherapy immunotherapy safety",
      "targeted therapy side effects"
    ]
  }
};

/**
 * Scenario-specific query templates for General Mode
 */
const GENERAL_MODE_SCENARIOS: Record<string, any> = {
  // Heart Health
  heart_health: {
    lifestyle: [
      "heart healthy diet exercise recommendations",
      "prevent heart disease lifestyle changes",
      "heart health nutrition physical activity"
    ],
    education: [
      "heart disease prevention patient education",
      "heart healthy living tips",
      "cardiovascular health consumer guide"
    ],
    symptoms: [
      "heart disease symptoms warning signs",
      "when to see doctor heart problems",
      "chest pain shortness breath medical care"
    ],
    prevention: [
      "heart disease prevention strategies",
      "reduce heart attack risk lifestyle",
      "cardiovascular disease prevention"
    ]
  },

  // Diabetes Management
  diabetes: {
    lifestyle: [
      "diabetes diet exercise blood sugar control",
      "type 2 diabetes lifestyle management",
      "diabetic meal planning physical activity"
    ],
    education: [
      "diabetes patient education materials",
      "blood sugar monitoring guide",
      "diabetes self-care education"
    ],
    symptoms: [
      "diabetes symptoms warning signs",
      "high blood sugar symptoms",
      "when to see doctor diabetes"
    ],
    prevention: [
      "prevent type 2 diabetes lifestyle",
      "prediabetes prevention strategies",
      "diabetes risk reduction"
    ]
  },

  // High Blood Pressure
  hypertension: {
    lifestyle: [
      "lower blood pressure diet exercise",
      "hypertension lifestyle modifications",
      "DASH diet blood pressure reduction"
    ],
    education: [
      "high blood pressure patient education",
      "blood pressure monitoring home",
      "hypertension self-management"
    ],
    symptoms: [
      "high blood pressure symptoms",
      "hypertension warning signs",
      "blood pressure emergency symptoms"
    ],
    prevention: [
      "prevent high blood pressure lifestyle",
      "hypertension prevention strategies",
      "blood pressure control methods"
    ]
  },

  // General Health
  general_health: {
    lifestyle: [
      "healthy lifestyle diet exercise",
      "wellness prevention health",
      "healthy habits daily routine"
    ],
    education: [
      "health education patient information",
      "wellness guidelines consumer",
      "healthy living tips"
    ],
    symptoms: [
      "when to see doctor symptoms",
      "health warning signs",
      "medical emergency symptoms"
    ],
    prevention: [
      "disease prevention lifestyle",
      "health promotion strategies",
      "preventive care guidelines"
    ]
  }
};

/**
 * Detect anchor scenario from query tags
 */
export function detectRAGScenario(tags: QueryTags, mode: 'doctor' | 'general'): string | null {
  const { disease_tags, decision_tags } = tags;

  if (mode === 'doctor') {
    // Melanoma with BRAF mutation scenario
    if ((disease_tags.includes('MELANOMA') || disease_tags.includes('BRAF_MUTATION')) && (
      decision_tags.includes('immunotherapy') ||
      decision_tags.includes('targeted_therapy') ||
      decision_tags.includes('therapy')
    )) {
      return 'melanoma_braf';
    }

    // Generic oncology scenario
    if (disease_tags.some(tag => 
      ['MELANOMA', 'LUNG_CANCER', 'BREAST_CANCER', 'COLORECTAL_CANCER', 
       'PROSTATE_CANCER', 'PANCREATIC_CANCER', 'RENAL_CANCER', 'OVARIAN_CANCER',
       'LEUKEMIA', 'LYMPHOMA', 'CANCER'].includes(tag)
    )) {
      return 'oncology';
    }

    // AF + CKD scenario (check BEFORE generic AF to prioritize comorbidity)
    if (disease_tags.includes('AF') && disease_tags.includes('CKD')) {
      return 'af_ckd';
    }

    // Generic AF scenario (anticoagulation, LAAO, etc.)
    if (disease_tags.includes('AF') && (
      decision_tags.includes('anticoagulation') ||
      decision_tags.includes('LAAO') ||
      decision_tags.includes('drug_choice') ||
      decision_tags.includes('therapy')
    )) {
      return 'af_anticoagulation';
    }

    // HFpEF scenario
    if (disease_tags.includes('HF') && (
      tags.primary_disease_tag === 'HF' ||
      decision_tags.includes('therapy')
    )) {
      return 'hfpef';
    }

    // VTE failure scenario (only if VTE is PRIMARY, not just mentioned)
    if (tags.primary_disease_tag === 'VTE' && (
      decision_tags.includes('anticoagulation') ||
      decision_tags.includes('duration')
    )) {
      return 'vte_failure';
    }

    // CAP scenario
    if (disease_tags.includes('CAP') && (
      decision_tags.includes('antiplatelet') || // This maps to antibiotics in context
      decision_tags.includes('duration')
    )) {
      return 'cap';
    }
  } else {
    // General Mode scenarios
    if (disease_tags.includes('HF') || disease_tags.includes('CAD')) {
      return 'heart_health';
    }

    if (disease_tags.includes('DIABETES')) {
      return 'diabetes';
    }

    if (disease_tags.includes('HTN')) {
      return 'hypertension';
    }

    // Always return general_health for consumer queries
    return 'general_health';
  }

  return null;
}

/**
 * Build scenario-specific sub-queries
 */
export function buildSubQueries(
  query: string,
  tags: QueryTags,
  mode: 'doctor' | 'general',
  anchorScenario: string | null = null
): RAGSubQueries {

  const scenario = anchorScenario || detectRAGScenario(tags, mode);

  if (mode === 'doctor' && scenario && DOCTOR_MODE_SCENARIOS[scenario]) {
    const template = DOCTOR_MODE_SCENARIOS[scenario];
    return {
      guidelineQueries: template.guidelines || [],
      trialQueries: template.trials || [],
      safetyQueries: template.safety || [],
      outcomeQueries: template.outcomes || [],
      lifestyleQueries: [],
      educationQueries: []
    };
  }

  if (mode === 'general') {
    // Always use scenario-based queries for General Mode
    const template = scenario && GENERAL_MODE_SCENARIOS[scenario]
      ? GENERAL_MODE_SCENARIOS[scenario]
      : GENERAL_MODE_SCENARIOS['general_health']; // Fallback to general_health

    return {
      guidelineQueries: [],
      trialQueries: [],
      safetyQueries: [],
      outcomeQueries: [],
      lifestyleQueries: template.lifestyle || [],
      educationQueries: template.education || []
    };
  }

  // Fallback: Generate generic queries from tags and original query
  return generateGenericQueries(tags, mode, query);
}

/**
 * Extract key medical terms from query text
 */
function extractKeyTermsFromQuery(query: string): string[] {
  const queryLower = query.toLowerCase();
  const terms: string[] = [];
  
  // Extract specific medical terms that aren't in tags
  const medicalTermPatterns = [
    /\b(melanoma|lung cancer|breast cancer|prostate cancer|pancreatic cancer)\b/gi,
    /\b(braf|egfr|kras|alk|ros1|pd-l1|her2)\s*(mutation|positive|v600e|v600k)?\b/gi,
    /\b(immunotherapy|targeted therapy|chemotherapy|radiation)\b/gi,
    /\b(pembrolizumab|nivolumab|ipilimumab|dabrafenib|vemurafenib|trametinib)\b/gi,
    /\b(metastatic|advanced|stage iv|recurrent|refractory)\b/gi,
    /\b(first[- ]line|second[- ]line|initial|subsequent)\b/gi,
    /\b(survival|response rate|progression|efficacy|outcomes)\b/gi,
  ];
  
  medicalTermPatterns.forEach(pattern => {
    const matches = query.match(pattern);
    if (matches) {
      terms.push(...matches.map(m => m.trim()));
    }
  });
  
  return [...new Set(terms)]; // Remove duplicates
}

/**
 * Generate generic queries when no specific scenario matches
 * Expands medical abbreviations for better search results
 */
function generateGenericQueries(tags: QueryTags, mode: 'doctor' | 'general', originalQuery?: string): RAGSubQueries {
  const { primary_disease_tag, primary_decision_tag, disease_tags, decision_tags } = tags;

  // Extract key terms from original query for better search
  const keyTerms = originalQuery ? extractKeyTermsFromQuery(originalQuery) : [];
  
  // Expand abbreviations in tags for better search
  const expandedDiseaseTerms = getExpandedTerms(primary_disease_tag);
  const expandedDecisionTerms = getExpandedTerms(primary_decision_tag);

  // Build comprehensive search terms
  const allDiseaseTerms = [
    primary_disease_tag,
    ...expandedDiseaseTerms,
    ...disease_tags,
    ...keyTerms.filter(t => t.length > 3)
  ].filter(Boolean);
  
  const allDecisionTerms = [
    primary_decision_tag,
    ...expandedDecisionTerms,
    ...decision_tags
  ].filter(Boolean);

  // Use the most specific terms available
  const diseaseQuery = allDiseaseTerms.slice(0, 3).join(' ');
  const decisionQuery = allDecisionTerms.slice(0, 2).join(' ');

  if (mode === 'doctor') {
    // Generate multiple query variations for better coverage
    const baseQuery = `${diseaseQuery} ${decisionQuery}`.trim();
    
    return {
      guidelineQueries: [
        `${baseQuery} guideline NCCN ASCO ESMO recommendation`,
        `${diseaseQuery} management guideline 2022 2023 2026`,
        `${baseQuery} clinical practice guideline`
      ],
      trialQueries: [
        `${baseQuery} randomized controlled trial`,
        `${diseaseQuery} ${decisionQuery} phase 3 trial`,
        `${baseQuery} RCT efficacy`,
        `${diseaseQuery} treatment trial meta-analysis`
      ],
      safetyQueries: [
        `${baseQuery} adverse events toxicity`,
        `${diseaseQuery} ${decisionQuery} safety profile`,
        `${baseQuery} contraindications warnings`
      ],
      outcomeQueries: [
        `${baseQuery} survival outcomes`,
        `${diseaseQuery} ${decisionQuery} progression free survival`,
        `${baseQuery} overall survival response rate`,
        `${diseaseQuery} treatment effectiveness outcomes`
      ],
      lifestyleQueries: [],
      educationQueries: []
    };
  } else {
    // Enhanced General Mode queries with expanded terms
    const diseaseTag = allDiseaseTerms[0] || 'health';

    return {
      guidelineQueries: [],
      trialQueries: [],
      safetyQueries: [],
      outcomeQueries: [],
      lifestyleQueries: [
        `${diseaseTag} lifestyle diet exercise prevention`,
        `${diseaseTag} healthy living wellness`,
        `${diseaseTag} prevention strategies lifestyle changes`
      ],
      educationQueries: [
        `${diseaseTag} patient education consumer health`,
        `${diseaseTag} symptoms warning signs when see doctor`,
        `${diseaseTag} self-care management tips`
      ]
    };
  }
}

/**
 * Add new scenario template (for easy expansion)
 */
export function addScenarioTemplate(
  scenarioKey: string,
  template: any,
  mode: 'doctor' | 'general'
): void {
  if (mode === 'doctor') {
    DOCTOR_MODE_SCENARIOS[scenarioKey] = template;
  } else {
    GENERAL_MODE_SCENARIOS[scenarioKey] = template;
  }

  console.log(`✅ Added ${mode} mode scenario: ${scenarioKey}`);
}