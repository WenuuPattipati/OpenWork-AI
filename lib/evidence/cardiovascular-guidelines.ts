/**
 * Cardiovascular Guidelines Evidence Source
 * ACC/AHA (American) and ESC (European) clinical guidelines for cardiovascular disease
 * 
 * This module provides curated guideline data for:
 * - LDL-C targets and lipid management
 * - Secondary cardiovascular prevention
 * - Statin therapy escalation algorithms
 * - Heart failure management
 * - Hypertension management
 */

export interface CardiovascularGuideline {
  id: string;
  title: string;
  organization: "ACC/AHA" | "ESC" | "ESC/EAS";
  category: string;
  year: string;
  url: string;
  pmid?: string;
  doi?: string;
  summary: string;
  keyRecommendations: string[];
  ldlTargets?: {
    riskCategory: string;
    target: string;
    threshold: string;
  }[];
  treatmentAlgorithm?: string[];
  source: "ACC/AHA" | "ESC" | "ESC/EAS";
}

/**
 * Cardiovascular Guidelines Database
 * Curated key guidelines from ACC/AHA and ESC
 */
const CARDIOVASCULAR_GUIDELINES_DATABASE: CardiovascularGuideline[] = [
  // ACC/AHA Cholesterol Guidelines
  {
    id: "ACC-AHA-2018-Cholesterol",
    title: "2018 ACC/AHA Guideline on the Management of Blood Cholesterol",
    organization: "ACC/AHA",
    category: "Lipid Management",
    year: "2018",
    url: "https://www.ahajournals.org/doi/10.1161/CIR.0000000000000625",
    pmid: "30586774",
    doi: "10.1161/CIR.0000000000000625",
    summary: "Comprehensive guideline for cholesterol management emphasizing risk-based approach, high-intensity statin therapy, and LDL-C thresholds for adding non-statin therapies.",
    keyRecommendations: [
      "High-intensity statin therapy for clinical ASCVD patients ≤75 years",
      "Achieve ≥50% LDL-C reduction in very high-risk ASCVD",
      "Consider adding ezetimibe if LDL-C ≥70 mg/dL on maximally tolerated statin",
      "Consider PCSK9 inhibitor if LDL-C remains ≥70 mg/dL on statin + ezetimibe",
      "Risk-enhancing factors guide therapy intensification decisions",
    ],
    ldlTargets: [
      {
        riskCategory: "Very High-Risk ASCVD",
        target: "≥50% reduction from baseline",
        threshold: "Consider non-statin if LDL-C ≥70 mg/dL (1.8 mmol/L)",
      },
      {
        riskCategory: "Clinical ASCVD (not very high-risk)",
        target: "≥50% reduction from baseline",
        threshold: "Consider non-statin if LDL-C ≥70 mg/dL",
      },
      {
        riskCategory: "Primary Prevention (high risk)",
        target: "≥50% reduction",
        threshold: "LDL-C ≥190 mg/dL or diabetes with risk factors",
      },
    ],
    treatmentAlgorithm: [
      "Step 1: Maximize lifestyle modifications",
      "Step 2: High-intensity statin (atorvastatin 40-80mg or rosuvastatin 20-40mg)",
      "Step 3: If LDL-C ≥70 mg/dL, add ezetimibe 10mg",
      "Step 4: If LDL-C still ≥70 mg/dL, consider PCSK9 inhibitor",
    ],
    source: "ACC/AHA",
  },
  // ESC/EAS Dyslipidemia Guidelines
  {
    id: "ESC-EAS-2019-Dyslipidemia",
    title: "2019 ESC/EAS Guidelines for the Management of Dyslipidaemias",
    organization: "ESC/EAS",
    category: "Lipid Management",
    year: "2019",
    url: "https://academic.oup.com/eurheartj/article/41/1/111/5556353",
    pmid: "31504418",
    doi: "10.1093/eurheartj/ehz455",
    summary: "European guidelines emphasizing absolute LDL-C targets based on cardiovascular risk category, with more aggressive targets for very high-risk patients.",
    keyRecommendations: [
      "LDL-C goal <55 mg/dL (1.4 mmol/L) AND ≥50% reduction for very high-risk",
      "LDL-C goal <40 mg/dL (1.0 mmol/L) for recurrent events within 2 years",
      "LDL-C goal <70 mg/dL (1.8 mmol/L) for high-risk patients",
      "Combination therapy (statin + ezetimibe) if target not achieved",
      "PCSK9 inhibitors for very high-risk patients not at goal",
    ],
    ldlTargets: [
      {
        riskCategory: "Very High-Risk (established ASCVD)",
        target: "<55 mg/dL (1.4 mmol/L) AND ≥50% reduction",
        threshold: "Add ezetimibe if not at goal on max statin",
      },
      {
        riskCategory: "Very High-Risk with recurrent event <2 years",
        target: "<40 mg/dL (1.0 mmol/L)",
        threshold: "Consider PCSK9 inhibitor early",
      },
      {
        riskCategory: "High-Risk",
        target: "<70 mg/dL (1.8 mmol/L) AND ≥50% reduction",
        threshold: "Intensify therapy if not at goal",
      },
      {
        riskCategory: "Moderate-Risk",
        target: "<100 mg/dL (2.6 mmol/L)",
        threshold: "Consider statin therapy",
      },
    ],
    treatmentAlgorithm: [
      "Step 1: Lifestyle intervention + high-intensity statin",
      "Step 2: If not at LDL-C goal, add ezetimibe",
      "Step 3: For very high-risk not at goal, add PCSK9 inhibitor",
      "Step 4: Consider bempedoic acid if statin intolerant",
    ],
    source: "ESC/EAS",
  },
  // ACC/AHA Secondary Prevention Guidelines
  {
    id: "ACC-AHA-2019-Prevention",
    title: "2019 ACC/AHA Guideline on Primary Prevention of Cardiovascular Disease",
    organization: "ACC/AHA",
    category: "Cardiovascular Prevention",
    year: "2019",
    url: "https://www.ahajournals.org/doi/10.1161/CIR.0000000000000678",
    pmid: "30879355",
    doi: "10.1161/CIR.0000000000000678",
    summary: "Guideline emphasizing team-based care, shared decision-making, and risk assessment for primary prevention of ASCVD.",
    keyRecommendations: [
      "Heart-healthy lifestyle is foundation of ASCVD prevention",
      "Use pooled cohort equations for 10-year ASCVD risk assessment",
      "Statin therapy for LDL-C ≥190 mg/dL or diabetes age 40-75",
      "Risk discussion for intermediate-risk patients (7.5-20%)",
      "Consider coronary artery calcium score for risk refinement",
    ],
    source: "ACC/AHA",
  },
  // ESC Cardiovascular Prevention Guidelines
  {
    id: "ESC-2021-Prevention",
    title: "2021 ESC Guidelines on Cardiovascular Disease Prevention",
    organization: "ESC",
    category: "Cardiovascular Prevention",
    year: "2021",
    url: "https://academic.oup.com/eurheartj/article/42/34/3227/6358713",
    pmid: "34458905",
    doi: "10.1093/eurheartj/ehab484",
    summary: "Comprehensive European guidelines on CVD prevention emphasizing lifetime risk, SCORE2 risk assessment, and personalized treatment goals.",
    keyRecommendations: [
      "Use SCORE2 and SCORE2-OP for risk assessment",
      "Lifetime risk consideration for younger patients",
      "Stepwise treatment intensification based on risk",
      "LDL-C targets aligned with 2019 dyslipidemia guidelines",
      "Blood pressure target <130/80 mmHg for most patients",
    ],
    source: "ESC",
  },
  // Heart Failure Guidelines
  {
    id: "ACC-AHA-2022-HF",
    title: "2022 AHA/ACC/HFSA Guideline for the Management of Heart Failure",
    organization: "ACC/AHA",
    category: "Heart Failure",
    year: "2022",
    url: "https://www.ahajournals.org/doi/10.1161/CIR.0000000000001063",
    pmid: "35363499",
    doi: "10.1161/CIR.0000000000001063",
    summary: "Updated heart failure guidelines introducing new staging, emphasizing GDMT optimization, and incorporating SGLT2 inhibitors.",
    keyRecommendations: [
      "SGLT2 inhibitors recommended for HFrEF regardless of diabetes",
      "Four pillars of GDMT: ARNI/ACEi/ARB, beta-blocker, MRA, SGLT2i",
      "New Stage C classification based on symptoms and LVEF",
      "Rapid initiation and optimization of GDMT",
      "Consider device therapy (ICD, CRT) per guidelines",
    ],
    source: "ACC/AHA",
  },
  {
    id: "ESC-2021-HF",
    title: "2021 ESC Guidelines for the Diagnosis and Treatment of Heart Failure",
    organization: "ESC",
    category: "Heart Failure",
    year: "2021",
    url: "https://academic.oup.com/eurheartj/article/42/36/3599/6358045",
    pmid: "34447992",
    doi: "10.1093/eurheartj/ehab368",
    summary: "European heart failure guidelines with updated treatment algorithms and new HFmrEF recommendations.",
    keyRecommendations: [
      "Dapagliflozin and empagliflozin for HFrEF (Class I)",
      "ACEi/ARNI + beta-blocker + MRA + SGLT2i for HFrEF",
      "Consider vericiguat for recent HF hospitalization",
      "Diuretics for congestion relief",
      "Iron replacement if iron deficient",
    ],
    source: "ESC",
  },
];

/**
 * Search cardiovascular guidelines by query
 */
export function searchCardiovascularGuidelines(query: string, limit: number = 5): CardiovascularGuideline[] {
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/).filter((t) => t.length > 2);

  // Check for specific guideline comparison queries
  const isComparisonQuery = queryLower.includes('vs') || queryLower.includes('versus') || 
                            queryLower.includes('compare') || queryLower.includes('comparison');
  const isLDLQuery = queryLower.includes('ldl') || queryLower.includes('cholesterol') || 
                     queryLower.includes('lipid') || queryLower.includes('statin');
  const isACCQuery = queryLower.includes('acc') || queryLower.includes('aha') || queryLower.includes('american');
  const isESCQuery = queryLower.includes('esc') || queryLower.includes('european');

  const scored = CARDIOVASCULAR_GUIDELINES_DATABASE.map((guideline) => {
    let score = 0;
    const searchText = `${guideline.title} ${guideline.category} ${guideline.summary} ${guideline.keyRecommendations.join(" ")}`.toLowerCase();

    // Exact phrase match
    if (searchText.includes(queryLower)) {
      score += 100;
    }

    // Term matching
    for (const term of queryTerms) {
      if (searchText.includes(term)) {
        score += 10;
      }
      if (guideline.title.toLowerCase().includes(term)) {
        score += 25;
      }
      if (guideline.category.toLowerCase().includes(term)) {
        score += 20;
      }
    }

    // Boost for comparison queries - include both ACC/AHA and ESC
    if (isComparisonQuery && isLDLQuery) {
      if (guideline.category === "Lipid Management") {
        score += 50;
      }
    }

    // Boost for specific organization queries
    if (isACCQuery && guideline.organization.includes("ACC")) {
      score += 30;
    }
    if (isESCQuery && guideline.organization.includes("ESC")) {
      score += 30;
    }

    // Boost for LDL-specific queries
    if (isLDLQuery && guideline.ldlTargets && guideline.ldlTargets.length > 0) {
      score += 40;
    }

    return { guideline, score };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.guideline);
}

/**
 * Format cardiovascular guidelines for prompt
 * Includes detailed LDL targets and treatment algorithms for comparison queries
 */
export function formatCardiovascularGuidelinesForPrompt(guidelines: CardiovascularGuideline[]): string {
  if (guidelines.length === 0) return "";

  let formatted = "## ZONE 24: CARDIOVASCULAR GUIDELINES (ACC/AHA & ESC)\n";
  formatted += "**Authoritative American and European cardiovascular guidelines**\n\n";

  guidelines.forEach((guideline, i) => {
    formatted += `${i + 1}. **${guideline.title}** (${guideline.year})\n`;
    formatted += `   SOURCE: ${guideline.organization} | Category: ${guideline.category}\n`;
    if (guideline.pmid) formatted += `   PMID: ${guideline.pmid}`;
    if (guideline.doi) formatted += ` | DOI: ${guideline.doi}`;
    formatted += "\n";
    formatted += `   Summary: ${guideline.summary}\n`;
    formatted += `   Key Recommendations:\n`;
    guideline.keyRecommendations.forEach((rec) => {
      formatted += `   - ${rec}\n`;
    });

    // Include LDL targets if available
    if (guideline.ldlTargets && guideline.ldlTargets.length > 0) {
      formatted += `   \n   **LDL-C Targets:**\n`;
      guideline.ldlTargets.forEach((target) => {
        formatted += `   - ${target.riskCategory}: Target ${target.target}\n`;
        formatted += `     Threshold: ${target.threshold}\n`;
      });
    }

    // Include treatment algorithm if available
    if (guideline.treatmentAlgorithm && guideline.treatmentAlgorithm.length > 0) {
      formatted += `   \n   **Treatment Algorithm:**\n`;
      guideline.treatmentAlgorithm.forEach((step) => {
        formatted += `   - ${step}\n`;
      });
    }

    formatted += `   URL: ${guideline.url}\n\n`;
  });

  return formatted;
}

/**
 * Get LDL-C target comparison table for ACC/AHA vs ESC
 * Returns formatted comparison data for guideline comparison queries
 */
export function getLDLTargetComparison(): string {
  return `
## ACC/AHA vs ESC LDL-C Target Comparison Table

| Risk Category | ACC/AHA 2018 | ESC/EAS 2019 |
|---------------|--------------|--------------|
| Very High-Risk ASCVD | ≥50% reduction; consider non-statin if ≥70 mg/dL | <55 mg/dL (1.4 mmol/L) AND ≥50% reduction |
| Recurrent CV Event (<2 years) | Same as very high-risk | <40 mg/dL (1.0 mmol/L) |
| High-Risk | ≥50% reduction | <70 mg/dL (1.8 mmol/L) AND ≥50% reduction |
| Moderate-Risk | Based on risk discussion | <100 mg/dL (2.6 mmol/L) |

**Key Differences:**
1. ESC uses absolute LDL-C targets; ACC/AHA emphasizes percent reduction
2. ESC has more aggressive target (<40 mg/dL) for recurrent events
3. Both recommend high-intensity statins as first-line
4. Both recommend ezetimibe then PCSK9 inhibitors for escalation

**Treatment Escalation Algorithm:**
1. High-intensity statin (atorvastatin 40-80mg or rosuvastatin 20-40mg)
2. Add ezetimibe 10mg if not at goal
3. Add PCSK9 inhibitor (evolocumab or alirocumab) if still not at goal
`;
}
