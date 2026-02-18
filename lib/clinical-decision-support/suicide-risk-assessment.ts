/**
 * Suicide Risk Assessment Engine
 * Standardized risk tiering and disposition recommendations for psychiatric emergencies
 * Based on AAP/AACAP guidelines and evidence-based practice
 */

export type RiskLevel = 'high' | 'moderate' | 'low';
export type DispositionLevel = 'inpatient' | 'crisis-stabilization' | 'intensive-outpatient' | 'outpatient';

export interface RiskFactor {
  factor: string;
  present: boolean;
  weight: number; // 1-3, higher = more concerning
  category: 'ideation' | 'behavior' | 'psychiatric' | 'psychosocial' | 'protective';
}

export interface SuicideRiskAssessment {
  riskLevel: RiskLevel;
  riskScore: number;
  disposition: DispositionLevel;
  rationale: string[];
  riskFactors: RiskFactor[];
  protectiveFactors: RiskFactor[];
  immediateActions: string[];
  safetyPlanRequired: boolean;
  followUpTiming: string;
  guidelines: string[];
}

/**
 * High-risk indicators that typically warrant inpatient admission
 */
const HIGH_RISK_INDICATORS = [
  { pattern: /active suicidal ideation/i, weight: 3, category: 'ideation' as const },
  { pattern: /suicidal (thoughts?|ideation) with (plan|intent)/i, weight: 3, category: 'ideation' as const },
  { pattern: /daily suicidal (thoughts?|ideation)/i, weight: 3, category: 'ideation' as const },
  { pattern: /recent (suicide )?attempt/i, weight: 3, category: 'behavior' as const },
  { pattern: /self[- ]?harm|cutting|self[- ]?injury/i, weight: 2, category: 'behavior' as const },
  { pattern: /access to (lethal )?means|firearms?|guns?|weapons?/i, weight: 3, category: 'psychosocial' as const },
  { pattern: /psychosis|psychotic/i, weight: 3, category: 'psychiatric' as const },
  { pattern: /command (hallucinations?|auditory)/i, weight: 3, category: 'psychiatric' as const },
  { pattern: /substance (use|abuse|intoxication)/i, weight: 2, category: 'psychiatric' as const },
  { pattern: /prior (suicide )?attempt/i, weight: 2, category: 'behavior' as const },
  { pattern: /family history.*(suicide|attempt)/i, weight: 2, category: 'psychosocial' as const },
  { pattern: /hopelessness/i, weight: 2, category: 'ideation' as const },
  { pattern: /giving away possessions/i, weight: 3, category: 'behavior' as const },
  { pattern: /saying goodbye/i, weight: 3, category: 'behavior' as const },
];

/**
 * Moderate-risk indicators
 */
const MODERATE_RISK_INDICATORS = [
  { pattern: /passive (suicidal )?ideation/i, weight: 1, category: 'ideation' as const },
  { pattern: /wish(es)? (to be )?dead/i, weight: 2, category: 'ideation' as const },
  { pattern: /doesn'?t want to (live|be alive)/i, weight: 2, category: 'ideation' as const },
  { pattern: /major depressi(on|ve)/i, weight: 1, category: 'psychiatric' as const },
  { pattern: /bipolar/i, weight: 1, category: 'psychiatric' as const },
  { pattern: /anxiety|anxious/i, weight: 1, category: 'psychiatric' as const },
  { pattern: /insomnia|sleep (problems?|disturbance)/i, weight: 1, category: 'psychiatric' as const },
  { pattern: /weight (loss|gain)/i, weight: 1, category: 'psychiatric' as const },
  { pattern: /social isolation/i, weight: 1, category: 'psychosocial' as const },
  { pattern: /recent (loss|trauma|abuse)/i, weight: 2, category: 'psychosocial' as const },
  { pattern: /bullying/i, weight: 2, category: 'psychosocial' as const },
  { pattern: /functional decline/i, weight: 1, category: 'psychiatric' as const },
];

/**
 * Protective factors that may support lower-level care
 */
const PROTECTIVE_FACTORS = [
  { pattern: /strong (family )?support/i, weight: -1, category: 'protective' as const },
  { pattern: /engaged in (therapy|treatment)/i, weight: -1, category: 'protective' as const },
  { pattern: /reasons (for|to) liv(e|ing)/i, weight: -1, category: 'protective' as const },
  { pattern: /future[- ]?oriented/i, weight: -1, category: 'protective' as const },
  { pattern: /denies (plan|intent)/i, weight: -1, category: 'protective' as const },
  { pattern: /no (access to|lethal) means/i, weight: -1, category: 'protective' as const },
  { pattern: /willing to (contract|safety plan)/i, weight: -1, category: 'protective' as const },
  { pattern: /help[- ]?seeking/i, weight: -1, category: 'protective' as const },
];

/**
 * Assess suicide risk from clinical text
 */
export function assessSuicideRisk(clinicalText: string): SuicideRiskAssessment {
  const riskFactors: RiskFactor[] = [];
  const protectiveFactors: RiskFactor[] = [];
  let riskScore = 0;

  // Check high-risk indicators
  for (const indicator of HIGH_RISK_INDICATORS) {
    if (indicator.pattern.test(clinicalText)) {
      riskFactors.push({
        factor: indicator.pattern.source.replace(/[\\()]/g, '').replace(/\|/g, '/'),
        present: true,
        weight: indicator.weight,
        category: indicator.category,
      });
      riskScore += indicator.weight;
    }
  }

  // Check moderate-risk indicators
  for (const indicator of MODERATE_RISK_INDICATORS) {
    if (indicator.pattern.test(clinicalText)) {
      riskFactors.push({
        factor: indicator.pattern.source.replace(/[\\()]/g, '').replace(/\|/g, '/'),
        present: true,
        weight: indicator.weight,
        category: indicator.category,
      });
      riskScore += indicator.weight;
    }
  }

  // Check protective factors
  for (const factor of PROTECTIVE_FACTORS) {
    if (factor.pattern.test(clinicalText)) {
      protectiveFactors.push({
        factor: factor.pattern.source.replace(/[\\()]/g, '').replace(/\|/g, '/'),
        present: true,
        weight: factor.weight,
        category: factor.category,
      });
      riskScore += factor.weight; // Negative weight reduces score
    }
  }

  // Determine risk level
  let riskLevel: RiskLevel;
  let disposition: DispositionLevel;
  let followUpTiming: string;
  const rationale: string[] = [];
  const immediateActions: string[] = [];

  if (riskScore >= 6 || riskFactors.some(f => f.weight === 3 && f.category === 'ideation')) {
    riskLevel = 'high';
    disposition = 'inpatient';
    followUpTiming = 'Continuous monitoring during hospitalization; outpatient within 3-7 days of discharge';
    rationale.push('High-risk features present requiring inpatient psychiatric admission');
    immediateActions.push('Initiate 1:1 observation');
    immediateActions.push('Remove access to lethal means');
    immediateActions.push('Psychiatric consultation');
    immediateActions.push('Medical clearance if indicated');
  } else if (riskScore >= 3) {
    riskLevel = 'moderate';
    disposition = protectiveFactors.length >= 2 ? 'intensive-outpatient' : 'crisis-stabilization';
    followUpTiming = 'Mental health follow-up within 3-7 days';
    rationale.push('Moderate risk features present');
    if (protectiveFactors.length >= 2) {
      rationale.push('Protective factors support intensive outpatient with robust safety planning');
    } else {
      rationale.push('Consider crisis stabilization unit or partial hospitalization');
    }
    immediateActions.push('Complete comprehensive safety plan');
    immediateActions.push('Lethal means counseling with caregivers');
    immediateActions.push('Arrange rapid outpatient follow-up');
  } else {
    riskLevel = 'low';
    disposition = 'outpatient';
    followUpTiming = 'Mental health follow-up within 7 days';
    rationale.push('Lower risk profile with protective factors');
    rationale.push('Outpatient management appropriate with safety planning');
    immediateActions.push('Complete safety plan');
    immediateActions.push('Provide crisis resources');
    immediateActions.push('Schedule outpatient follow-up');
  }

  return {
    riskLevel,
    riskScore,
    disposition,
    rationale,
    riskFactors,
    protectiveFactors,
    immediateActions,
    safetyPlanRequired: riskLevel !== 'low' || disposition !== 'inpatient',
    followUpTiming,
    guidelines: [
      'AAP Clinical Report: Management of Pediatric Mental Health Emergencies (2023)',
      'AACAP Practice Parameter: Assessment and Treatment of Suicidal Behavior (2001, updated)',
      'Joint Commission National Patient Safety Goal 15.01.01',
    ],
  };
}

/**
 * Format suicide risk assessment for AI prompt injection
 */
export function formatSuicideRiskForPrompt(assessment: SuicideRiskAssessment): string {
  const riskEmoji = {
    high: '🔴',
    moderate: '🟡',
    low: '🟢',
  };

  const dispositionMap = {
    'inpatient': 'Inpatient Psychiatric Admission',
    'crisis-stabilization': 'Crisis Stabilization Unit / Partial Hospitalization',
    'intensive-outpatient': 'Intensive Outpatient Program + Safety Planning',
    'outpatient': 'Outpatient with Safety Planning',
  };

  let formatted = '\n\n--- SUICIDE RISK ASSESSMENT (AUTO-GENERATED) ---\n\n';
  
  formatted += `**RISK LEVEL:** ${riskEmoji[assessment.riskLevel]} ${assessment.riskLevel.toUpperCase()} (Score: ${assessment.riskScore})\n\n`;
  formatted += `**RECOMMENDED DISPOSITION:** ${dispositionMap[assessment.disposition]}\n\n`;
  
  formatted += '**RATIONALE:**\n';
  assessment.rationale.forEach(r => {
    formatted += `• ${r}\n`;
  });
  formatted += '\n';

  if (assessment.riskFactors.length > 0) {
    formatted += '**RISK FACTORS IDENTIFIED:**\n';
    assessment.riskFactors.forEach(f => {
      const severity = f.weight === 3 ? '⚠️ Critical' : f.weight === 2 ? '⚡ Significant' : '• Present';
      formatted += `${severity}: ${f.factor} (${f.category})\n`;
    });
    formatted += '\n';
  }

  if (assessment.protectiveFactors.length > 0) {
    formatted += '**PROTECTIVE FACTORS:**\n';
    assessment.protectiveFactors.forEach(f => {
      formatted += `✓ ${f.factor}\n`;
    });
    formatted += '\n';
  }

  formatted += '**IMMEDIATE ACTIONS:**\n';
  assessment.immediateActions.forEach((action, i) => {
    formatted += `${i + 1}. ${action}\n`;
  });
  formatted += '\n';

  formatted += `**FOLLOW-UP TIMING:** ${assessment.followUpTiming}\n\n`;
  
  formatted += `**SAFETY PLAN REQUIRED:** ${assessment.safetyPlanRequired ? 'Yes - Include Stanley-Brown Safety Plan' : 'Recommended'}\n\n`;

  formatted += '**GUIDELINE REFERENCES:**\n';
  assessment.guidelines.forEach(g => {
    formatted += `• ${g}\n`;
  });

  formatted += '\n--- END SUICIDE RISK ASSESSMENT ---\n\n';

  return formatted;
}

/**
 * Check if query involves suicide/self-harm risk
 */
export function isSuicideRiskQuery(query: string): boolean {
  const suicideKeywords = [
    /suicid/i,
    /self[- ]?harm/i,
    /cutting/i,
    /overdose/i,
    /kill (myself|themselves|himself|herself)/i,
    /want(s)? to die/i,
    /end (my|their|his|her) life/i,
    /not want(ing)? to (live|be alive)/i,
    /safety (plan|assessment)/i,
    /psychiatric emergency/i,
  ];

  return suicideKeywords.some(pattern => pattern.test(query));
}
