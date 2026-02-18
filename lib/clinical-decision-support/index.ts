/**
 * Clinical Decision Support Module
 * Orchestrates suicide risk assessment, safety planning, QT risk evaluation,
 * and adolescent care coordination for psychiatric emergencies
 */

export * from './suicide-risk-assessment';
export * from './safety-plan-template';
export * from './qt-risk-library';
export * from './adolescent-care-templates';

import {
  assessSuicideRisk,
  formatSuicideRiskForPrompt,
  isSuicideRiskQuery,
  type SuicideRiskAssessment,
} from './suicide-risk-assessment';

import {
  generateSafetyPlan,
  formatSafetyPlanForPrompt,
  generateSafetyPlanSummary,
  type SafetyPlan,
} from './safety-plan-template';

import {
  assessQTRisk,
  formatQTRiskForPrompt,
  hasQTRiskMedications,
  type QTRiskAssessment,
} from './qt-risk-library';

import {
  generateAdolescentCareTemplate,
  formatAdolescentCareForPrompt,
  isAdolescentPatient,
  generateAdolescentCareSummary,
  type AdolescentCareTemplate,
} from './adolescent-care-templates';

export interface ClinicalDecisionSupportResult {
  suicideRisk?: SuicideRiskAssessment;
  safetyPlan?: SafetyPlan;
  qtRisk?: QTRiskAssessment;
  adolescentCare?: AdolescentCareTemplate;
  promptInjection: string;
  flags: {
    hasSuicideRisk: boolean;
    hasQTRisk: boolean;
    isAdolescent: boolean;
    requiresSafetyPlan: boolean;
  };
}


/**
 * Main orchestrator function for clinical decision support
 * Analyzes query and generates appropriate clinical guidance
 */
export function analyzeClinicalContext(
  query: string,
  medications?: string[]
): ClinicalDecisionSupportResult {
  const flags = {
    hasSuicideRisk: isSuicideRiskQuery(query),
    hasQTRisk: false,
    isAdolescent: isAdolescentPatient(query),
    requiresSafetyPlan: false,
  };

  let promptInjection = '';
  let suicideRisk: SuicideRiskAssessment | undefined;
  let safetyPlan: SafetyPlan | undefined;
  let qtRisk: QTRiskAssessment | undefined;
  let adolescentCare: AdolescentCareTemplate | undefined;

  // 1. Suicide Risk Assessment
  if (flags.hasSuicideRisk) {
    suicideRisk = assessSuicideRisk(query);
    promptInjection += formatSuicideRiskForPrompt(suicideRisk);
    flags.requiresSafetyPlan = suicideRisk.safetyPlanRequired;

    // Generate safety plan if needed (not inpatient)
    if (suicideRisk.safetyPlanRequired) {
      safetyPlan = generateSafetyPlan({
        isAdolescent: flags.isAdolescent,
        hasSelfHarm: /self[- ]?harm|cutting/i.test(query),
        hasSubstanceUse: /substance|alcohol|drug use/i.test(query),
      });
      promptInjection += formatSafetyPlanForPrompt(safetyPlan);
    }
  }

  // 2. QT Risk Assessment
  const qtMeds = medications || hasQTRiskMedications(query);
  if (qtMeds.length > 0) {
    qtRisk = assessQTRisk(typeof qtMeds === 'string' ? [qtMeds] : qtMeds);
    if (qtRisk.totalRisk !== 'low' || qtRisk.warnings.length > 0) {
      flags.hasQTRisk = true;
      promptInjection += formatQTRiskForPrompt(qtRisk);
    }
  }

  // 3. Adolescent Care Coordination
  if (flags.isAdolescent) {
    adolescentCare = generateAdolescentCareTemplate({
      isHighRisk: suicideRisk?.riskLevel === 'high',
      hasSchoolIssues: /school|academic|grades|attendance/i.test(query),
      hasFamilyConflict: /family (conflict|issues|problems)|parents? (worried|concerned)/i.test(query),
    });
    promptInjection += formatAdolescentCareForPrompt(adolescentCare);
  }

  // Add instruction header if any clinical support was generated
  if (promptInjection.length > 0) {
    const header = `
--- CLINICAL DECISION SUPPORT (USE THIS GUIDANCE IN YOUR RESPONSE) ---

The following clinical decision support has been auto-generated based on the query.
INCORPORATE this guidance into your response structure and recommendations.

`;
    promptInjection = header + promptInjection;
  }

  return {
    suicideRisk,
    safetyPlan,
    qtRisk,
    adolescentCare,
    promptInjection,
    flags,
  };
}

/**
 * Quick check if clinical decision support is needed
 */
export function needsClinicalDecisionSupport(query: string): boolean {
  return (
    isSuicideRiskQuery(query) ||
    hasQTRiskMedications(query).length > 0 ||
    isAdolescentPatient(query)
  );
}

/**
 * Get summary templates for inclusion in responses
 */
export function getClinicalSummaries(flags: {
  includeSafetyPlan?: boolean;
  includeAdolescentCare?: boolean;
}): string {
  let summary = '';
  
  if (flags.includeSafetyPlan) {
    summary += generateSafetyPlanSummary();
  }
  
  if (flags.includeAdolescentCare) {
    summary += generateAdolescentCareSummary();
  }
  
  return summary;
}
