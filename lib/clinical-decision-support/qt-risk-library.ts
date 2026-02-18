/**
 * QT-Risk Library for Psychotropic Medications
 * Central database for QTc prolongation risks and safer alternatives
 * Based on CredibleMeds and clinical pharmacology guidelines
 */

export type QTRiskCategory = 'known' | 'possible' | 'conditional' | 'low' | 'unknown';

export interface QTRiskDrug {
  name: string;
  genericName: string;
  class: string;
  qtRisk: QTRiskCategory;
  qtcEffect: string; // Description of QTc effect
  riskFactors: string[]; // Conditions that increase risk
  monitoring: string[];
  alternatives: string[]; // Lower QT-risk alternatives
  dosing: string;
  notes: string;
  sources: string[];
}

export interface QTRiskAssessment {
  drugs: QTRiskDrug[];
  totalRisk: 'high' | 'moderate' | 'low';
  recommendations: string[];
  monitoring: string[];
  alternatives: AlternativeRecommendation[];
  warnings: string[];
}

export interface AlternativeRecommendation {
  currentDrug: string;
  alternative: string;
  rationale: string;
  dosing: string;
}


/**
 * Comprehensive QT-Risk Database for Psychotropic Medications
 * Risk categories based on CredibleMeds classification:
 * - known: Known risk of TdP
 * - possible: Possible risk of TdP
 * - conditional: Conditional risk (specific circumstances)
 * - low: Generally considered low risk
 */
export const QT_RISK_DATABASE: Record<string, QTRiskDrug> = {
  // ANTIHISTAMINES / SEDATIVES
  hydroxyzine: {
    name: 'Hydroxyzine',
    genericName: 'hydroxyzine',
    class: 'Antihistamine/Anxiolytic',
    qtRisk: 'known',
    qtcEffect: 'Dose-dependent QTc prolongation; significant at doses >100mg/day',
    riskFactors: ['Elderly', 'Hepatic impairment', 'Hypokalemia', 'Hypomagnesemia', 'Concurrent QT-prolonging drugs'],
    monitoring: ['Baseline ECG', 'ECG 1-2 weeks after initiation', 'Electrolytes (K+, Mg2+)'],
    alternatives: ['Melatonin (0.5-5mg)', 'Buspirone (5-10mg BID)', 'Trazodone (25-50mg, with caution)'],
    dosing: 'Max 50mg/day in elderly; avoid if QTc >470ms',
    notes: 'AVOID in patients with baseline QTc prolongation. Consider melatonin or buspirone as first-line alternatives.',
    sources: ['CredibleMeds', 'FDA Drug Safety Communication 2015'],
  },
  diphenhydramine: {
    name: 'Diphenhydramine',
    genericName: 'diphenhydramine',
    class: 'Antihistamine',
    qtRisk: 'conditional',
    qtcEffect: 'QTc prolongation at high doses or in overdose',
    riskFactors: ['Overdose', 'Elderly', 'Cardiac disease'],
    monitoring: ['ECG if high doses used'],
    alternatives: ['Melatonin', 'Doxylamine (lower QT risk)'],
    dosing: '25-50mg at bedtime',
    notes: 'Lower risk than hydroxyzine at standard doses',
    sources: ['CredibleMeds'],
  },

  // SSRIs
  fluoxetine: {
    name: 'Fluoxetine',
    genericName: 'fluoxetine',
    class: 'SSRI',
    qtRisk: 'conditional',
    qtcEffect: 'Modest QTc prolongation, dose-dependent; generally <10ms at therapeutic doses',
    riskFactors: ['High doses (>40mg)', 'CYP2D6 poor metabolizers', 'Concurrent QT drugs', 'Hypokalemia'],
    monitoring: ['Baseline ECG if risk factors', 'Follow-up ECG if QTc borderline'],
    alternatives: ['Sertraline (lower QT risk)', 'Escitalopram (with dose limits)'],
    dosing: '20-80mg daily; consider max 40mg if QTc concerns',
    notes: 'Benefits often outweigh modest QT risk in depression. Continue with monitoring if clinically necessary.',
    sources: ['CredibleMeds', 'FDA', 'NEJM Depression in Adolescents 2021'],
  },
  citalopram: {
    name: 'Citalopram',
    genericName: 'citalopram',
    class: 'SSRI',
    qtRisk: 'known',
    qtcEffect: 'Dose-dependent QTc prolongation; FDA max 40mg (20mg in elderly/hepatic impairment)',
    riskFactors: ['Doses >40mg', 'Age >60', 'Hepatic impairment', 'Hypokalemia', 'Concurrent QT drugs'],
    monitoring: ['Baseline ECG', 'ECG after dose changes', 'Electrolytes'],
    alternatives: ['Sertraline', 'Fluoxetine (lower QT risk at equivalent doses)'],
    dosing: 'Max 40mg/day; max 20mg in elderly or hepatic impairment',
    notes: 'FDA black box warning for QTc. Prefer sertraline if QT concerns.',
    sources: ['FDA Drug Safety Communication 2011', 'CredibleMeds'],
  },
  escitalopram: {
    name: 'Escitalopram',
    genericName: 'escitalopram',
    class: 'SSRI',
    qtRisk: 'conditional',
    qtcEffect: 'QTc prolongation at doses >20mg; less than citalopram at equivalent doses',
    riskFactors: ['Doses >20mg', 'Elderly', 'Hepatic impairment', 'Concurrent QT drugs'],
    monitoring: ['ECG if doses >20mg or risk factors present'],
    alternatives: ['Sertraline'],
    dosing: 'Max 20mg/day; max 10mg in elderly',
    notes: 'Lower QT risk than citalopram but still requires caution at higher doses',
    sources: ['FDA', 'CredibleMeds'],
  },
  sertraline: {
    name: 'Sertraline',
    genericName: 'sertraline',
    class: 'SSRI',
    qtRisk: 'low',
    qtcEffect: 'Minimal QTc effect at therapeutic doses',
    riskFactors: ['Very high doses', 'Severe hepatic impairment'],
    monitoring: ['Routine monitoring; ECG not routinely required'],
    alternatives: [],
    dosing: '50-200mg daily',
    notes: 'PREFERRED SSRI when QTc prolongation is a concern. First-line in cardiac patients.',
    sources: ['CredibleMeds', 'AHA Scientific Statement'],
  },

  // OTHER ANTIDEPRESSANTS
  trazodone: {
    name: 'Trazodone',
    genericName: 'trazodone',
    class: 'SARI (Serotonin Antagonist and Reuptake Inhibitor)',
    qtRisk: 'conditional',
    qtcEffect: 'Can prolong QTc; generally lower risk than many alternatives but still requires monitoring',
    riskFactors: ['High doses', 'Concurrent QT drugs', 'Cardiac disease', 'Electrolyte abnormalities'],
    monitoring: ['ECG if cardiac risk factors', 'Monitor for orthostatic hypotension'],
    alternatives: ['Melatonin (for insomnia)', 'Mirtazapine (with caution)'],
    dosing: '25-100mg at bedtime for insomnia; up to 300-400mg for depression',
    notes: 'Lower QT risk than hydroxyzine; acceptable alternative for insomnia with monitoring. NOT "minimal QTc effects" - requires caution.',
    sources: ['CredibleMeds', 'Clinical Pharmacology'],
  },
  mirtazapine: {
    name: 'Mirtazapine',
    genericName: 'mirtazapine',
    class: 'NaSSA (Noradrenergic and Specific Serotonergic Antidepressant)',
    qtRisk: 'low',
    qtcEffect: 'Minimal QTc prolongation at therapeutic doses',
    riskFactors: ['Overdose'],
    monitoring: ['Routine monitoring'],
    alternatives: [],
    dosing: '15-45mg at bedtime',
    notes: 'Good option when QTc is a concern; also helps with insomnia and appetite',
    sources: ['CredibleMeds'],
  },
  bupropion: {
    name: 'Bupropion',
    genericName: 'bupropion',
    class: 'NDRI (Norepinephrine-Dopamine Reuptake Inhibitor)',
    qtRisk: 'low',
    qtcEffect: 'No significant QTc prolongation',
    riskFactors: ['Seizure risk (not QT-related)'],
    monitoring: ['Monitor for seizures; no QT monitoring needed'],
    alternatives: [],
    dosing: '150-450mg daily (divided doses for IR)',
    notes: 'Safe from QT perspective; avoid if seizure risk',
    sources: ['CredibleMeds', 'FDA'],
  },

  // ANTIPSYCHOTICS
  haloperidol: {
    name: 'Haloperidol',
    genericName: 'haloperidol',
    class: 'Typical Antipsychotic',
    qtRisk: 'known',
    qtcEffect: 'Significant QTc prolongation, especially IV administration',
    riskFactors: ['IV administration', 'High doses', 'Hypokalemia', 'Hypomagnesemia', 'Concurrent QT drugs'],
    monitoring: ['Baseline ECG', 'Continuous telemetry for IV', 'Electrolytes'],
    alternatives: ['Olanzapine (lower QT)', 'Aripiprazole (minimal QT)'],
    dosing: 'Avoid IV if possible; oral 0.5-5mg',
    notes: 'HIGH QT RISK especially IV. Use alternatives when possible.',
    sources: ['FDA Black Box Warning', 'CredibleMeds'],
  },
  ziprasidone: {
    name: 'Ziprasidone',
    genericName: 'ziprasidone',
    class: 'Atypical Antipsychotic',
    qtRisk: 'known',
    qtcEffect: 'Mean QTc increase ~20ms; highest among atypicals',
    riskFactors: ['Concurrent QT drugs', 'Hypokalemia', 'Cardiac disease'],
    monitoring: ['Baseline ECG', 'Periodic ECG monitoring', 'Electrolytes'],
    alternatives: ['Aripiprazole', 'Olanzapine', 'Risperidone'],
    dosing: '20-80mg BID with food',
    notes: 'AVOID if QTc >500ms or history of arrhythmia. Contraindicated with other QT-prolonging drugs.',
    sources: ['FDA', 'CredibleMeds'],
  },
  quetiapine: {
    name: 'Quetiapine',
    genericName: 'quetiapine',
    class: 'Atypical Antipsychotic',
    qtRisk: 'conditional',
    qtcEffect: 'Modest QTc prolongation; less than ziprasidone',
    riskFactors: ['High doses', 'Concurrent QT drugs', 'Elderly'],
    monitoring: ['ECG if risk factors present'],
    alternatives: ['Aripiprazole', 'Olanzapine'],
    dosing: '25-800mg daily depending on indication',
    notes: 'Moderate QT risk; often used for insomnia at low doses',
    sources: ['CredibleMeds'],
  },
  aripiprazole: {
    name: 'Aripiprazole',
    genericName: 'aripiprazole',
    class: 'Atypical Antipsychotic',
    qtRisk: 'low',
    qtcEffect: 'Minimal to no QTc prolongation',
    riskFactors: ['Minimal'],
    monitoring: ['Routine monitoring; no specific QT monitoring'],
    alternatives: [],
    dosing: '2-30mg daily',
    notes: 'PREFERRED antipsychotic when QTc is a concern',
    sources: ['CredibleMeds', 'FDA'],
  },
  olanzapine: {
    name: 'Olanzapine',
    genericName: 'olanzapine',
    class: 'Atypical Antipsychotic',
    qtRisk: 'low',
    qtcEffect: 'Minimal QTc prolongation at therapeutic doses',
    riskFactors: ['Very high doses', 'IM administration with benzodiazepines'],
    monitoring: ['Metabolic monitoring more important than QT'],
    alternatives: ['Aripiprazole'],
    dosing: '5-20mg daily',
    notes: 'Low QT risk but significant metabolic effects',
    sources: ['CredibleMeds'],
  },

  // STIMULANTS
  lisdexamfetamine: {
    name: 'Lisdexamfetamine',
    genericName: 'lisdexamfetamine',
    class: 'Stimulant (ADHD)',
    qtRisk: 'low',
    qtcEffect: 'Generally safe from QTc standpoint; may increase heart rate',
    riskFactors: ['Structural cardiac abnormalities', 'Pre-existing arrhythmias'],
    monitoring: ['Heart rate and blood pressure', 'ECG if cardiac concerns'],
    alternatives: ['Atomoxetine (non-stimulant)', 'Guanfacine'],
    dosing: '20-70mg daily',
    notes: 'Continue for ADHD management; cardiac monitoring prudent in polypharmacy',
    sources: ['FDA', 'AAP ADHD Guidelines'],
  },
  methylphenidate: {
    name: 'Methylphenidate',
    genericName: 'methylphenidate',
    class: 'Stimulant (ADHD)',
    qtRisk: 'low',
    qtcEffect: 'No significant QTc prolongation',
    riskFactors: ['Structural cardiac disease'],
    monitoring: ['Heart rate and blood pressure'],
    alternatives: ['Atomoxetine', 'Guanfacine'],
    dosing: '5-60mg daily (varies by formulation)',
    notes: 'Safe from QT perspective',
    sources: ['FDA', 'CredibleMeds'],
  },
  // ANXIOLYTICS
  buspirone: {
    name: 'Buspirone',
    genericName: 'buspirone',
    class: 'Anxiolytic (5-HT1A Agonist)',
    qtRisk: 'low',
    qtcEffect: 'No significant QTc prolongation',
    riskFactors: ['Minimal'],
    monitoring: ['Routine monitoring'],
    alternatives: [],
    dosing: '5-10mg BID-TID, max 60mg/day',
    notes: 'PREFERRED anxiolytic when QTc is a concern. Non-QT-prolonging alternative to hydroxyzine.',
    sources: ['CredibleMeds', 'Clinical Pharmacology'],
  },
  // SLEEP AIDS
  melatonin: {
    name: 'Melatonin',
    genericName: 'melatonin',
    class: 'Sleep Aid (Hormone)',
    qtRisk: 'low',
    qtcEffect: 'No QTc prolongation',
    riskFactors: ['None'],
    monitoring: ['None required'],
    alternatives: [],
    dosing: '0.5-5mg at bedtime (start low)',
    notes: 'FIRST-LINE non-QT-prolonging option for insomnia in patients with QTc concerns',
    sources: ['Clinical Guidelines'],
  },
};


/**
 * Assess QT risk for a list of medications
 */
export function assessQTRisk(medications: string[]): QTRiskAssessment {
  const normalizedMeds = medications.map(m => m.toLowerCase().trim());
  const drugs: QTRiskDrug[] = [];
  const recommendations: string[] = [];
  const monitoring: string[] = [];
  const alternatives: AlternativeRecommendation[] = [];
  const warnings: string[] = [];

  let knownRiskCount = 0;
  let possibleRiskCount = 0;

  for (const med of normalizedMeds) {
    const drugInfo = QT_RISK_DATABASE[med];
    if (drugInfo) {
      drugs.push(drugInfo);
      if (drugInfo.qtRisk === 'known') {
        knownRiskCount++;
        warnings.push(`⚠️ ${drugInfo.name}: KNOWN QTc prolongation risk - ${drugInfo.qtcEffect}`);
        if (drugInfo.alternatives.length > 0) {
          alternatives.push({
            currentDrug: drugInfo.name,
            alternative: drugInfo.alternatives[0],
            rationale: `Lower QT risk than ${drugInfo.name}`,
            dosing: QT_RISK_DATABASE[drugInfo.alternatives[0].toLowerCase()]?.dosing || 'See prescribing information',
          });
        }
      } else if (drugInfo.qtRisk === 'possible' || drugInfo.qtRisk === 'conditional') {
        possibleRiskCount++;
        warnings.push(`⚡ ${drugInfo.name}: ${drugInfo.qtRisk} QTc risk - ${drugInfo.qtcEffect}`);
      }
      monitoring.push(...drugInfo.monitoring);
    }
  }

  // Determine total risk
  let totalRisk: 'high' | 'moderate' | 'low';
  if (knownRiskCount >= 2 || (knownRiskCount >= 1 && possibleRiskCount >= 1)) {
    totalRisk = 'high';
    recommendations.push('HIGH QT RISK: Multiple QT-prolonging medications. Consider alternatives.');
    recommendations.push('Obtain baseline ECG and repeat within 1-2 weeks');
    recommendations.push('Check and correct electrolytes (K+, Mg2+)');
    recommendations.push('Avoid adding additional QT-prolonging drugs');
  } else if (knownRiskCount === 1 || possibleRiskCount >= 2) {
    totalRisk = 'moderate';
    recommendations.push('MODERATE QT RISK: Monitor ECG and electrolytes');
    recommendations.push('Consider alternatives if QTc >470ms');
  } else {
    totalRisk = 'low';
    recommendations.push('LOW QT RISK: Routine monitoring appropriate');
  }

  // Deduplicate monitoring
  const uniqueMonitoring = Array.from(new Set(monitoring));

  return { drugs, totalRisk, recommendations, monitoring: uniqueMonitoring, alternatives, warnings };
}

/**
 * Format QT risk assessment for AI prompt injection
 */
export function formatQTRiskForPrompt(assessment: QTRiskAssessment): string {
  const riskEmoji = { high: '🔴', moderate: '🟡', low: '🟢' };
  
  let formatted = '\n\n--- QT RISK ASSESSMENT (AUTO-GENERATED) ---\n\n';
  formatted += `**OVERALL QT RISK:** ${riskEmoji[assessment.totalRisk]} ${assessment.totalRisk.toUpperCase()}\n\n`;

  if (assessment.warnings.length > 0) {
    formatted += '**MEDICATION QT RISKS:**\n';
    assessment.warnings.forEach(w => formatted += `${w}\n`);
    formatted += '\n';
  }

  formatted += '**RECOMMENDATIONS:**\n';
  assessment.recommendations.forEach(r => formatted += `• ${r}\n`);
  formatted += '\n';

  if (assessment.alternatives.length > 0) {
    formatted += '**SAFER ALTERNATIVES:**\n';
    assessment.alternatives.forEach(alt => {
      formatted += `• Replace ${alt.currentDrug} → ${alt.alternative} (${alt.rationale})\n`;
      formatted += `  Dosing: ${alt.dosing}\n`;
    });
    formatted += '\n';
  }

  formatted += '**MONITORING:**\n';
  assessment.monitoring.forEach(m => formatted += `• ${m}\n`);
  formatted += '\n--- END QT RISK ASSESSMENT ---\n\n';

  return formatted;
}

/**
 * Check if query involves QT-prolonging medications
 */
export function hasQTRiskMedications(query: string): string[] {
  const found: string[] = [];
  const queryLower = query.toLowerCase();
  
  for (const [drugName, drugInfo] of Object.entries(QT_RISK_DATABASE)) {
    if (queryLower.includes(drugName) || queryLower.includes(drugInfo.name.toLowerCase())) {
      found.push(drugName);
    }
  }
  return found;
}

/**
 * Get safer alternatives for a specific drug
 */
export function getSaferAlternatives(drugName: string): AlternativeRecommendation[] {
  const drug = QT_RISK_DATABASE[drugName.toLowerCase()];
  if (!drug || drug.alternatives.length === 0) return [];

  return drug.alternatives.map(alt => ({
    currentDrug: drug.name,
    alternative: alt,
    rationale: `Lower QT risk than ${drug.name}`,
    dosing: QT_RISK_DATABASE[alt.toLowerCase().split(' ')[0]]?.dosing || 'See prescribing information',
  }));
}
