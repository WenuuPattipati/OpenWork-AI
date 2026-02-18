/**
 * Drug Interaction Checker
 * Uses openFDA and evidence sources to check for drug interactions
 */

import { searchDrugLabels } from "./evidence/openfda";

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: "major" | "moderate" | "minor" | "unknown";
  description: string;
  mechanism?: string;
  clinicalEffects?: string;
  management?: string;
  sources: string[];
}

export interface InteractionCheckResult {
  drugs: string[];
  interactions: DrugInteraction[];
  warnings: string[];
  recommendations: string[];
}

/**
 * Known major drug interactions (common pairs)
 * This is a simplified database - in production, use a comprehensive API
 */
const KNOWN_INTERACTIONS: Record<string, DrugInteraction[]> = {
  "warfarin": [
    {
      drug1: "warfarin",
      drug2: "aspirin",
      severity: "major",
      description: "Increased risk of bleeding",
      mechanism: "Both drugs affect hemostasis through different mechanisms",
      clinicalEffects: "Increased risk of major bleeding, including GI and intracranial hemorrhage",
      management: "Use combination with caution. Monitor INR closely. Consider gastroprotection.",
      sources: ["FDA Drug Label", "Clinical Guidelines"],
    },
    {
      drug1: "warfarin",
      drug2: "ibuprofen",
      severity: "major",
      description: "Increased risk of bleeding",
      mechanism: "NSAIDs inhibit platelet function and may cause GI ulceration",
      clinicalEffects: "Increased bleeding risk, particularly GI bleeding",
      management: "Avoid if possible. If necessary, use lowest effective dose and monitor closely.",
      sources: ["FDA Drug Label"],
    },
  ],
  "metformin": [
    {
      drug1: "metformin",
      drug2: "insulin",
      severity: "moderate",
      description: "Increased risk of hypoglycemia",
      mechanism: "Additive glucose-lowering effects",
      clinicalEffects: "May cause hypoglycemia, especially if doses not adjusted",
      management: "Monitor blood glucose closely. May need to reduce insulin dose.",
      sources: ["Clinical Guidelines"],
    },
  ],
  "lisinopril": [
    {
      drug1: "lisinopril",
      drug2: "ibuprofen",
      severity: "moderate",
      description: "Reduced antihypertensive effect, increased risk of renal impairment",
      mechanism: "NSAIDs may reduce ACE inhibitor efficacy and affect renal function",
      clinicalEffects: "Decreased blood pressure control, potential acute kidney injury",
      management: "Monitor blood pressure and renal function. Consider alternative analgesic.",
      sources: ["FDA Drug Label", "Clinical Guidelines"],
    },
  ],
  "aspirin": [
    {
      drug1: "aspirin",
      drug2: "ibuprofen",
      severity: "moderate",
      description: "Ibuprofen may reduce cardioprotective effect of aspirin",
      mechanism: "Ibuprofen competes for COX-1 binding site",
      clinicalEffects: "Reduced antiplatelet effect of aspirin",
      management: "Take aspirin at least 2 hours before ibuprofen, or use alternative NSAID",
      sources: ["FDA Drug Label", "Clinical Studies"],
    },
  ],
};

/**
 * Check for interactions between multiple drugs
 */
export async function checkDrugInteractions(drugs: string[]): Promise<InteractionCheckResult> {
  const normalizedDrugs = drugs.map(d => d.toLowerCase().trim());
  const interactions: DrugInteraction[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  
  // Check each pair of drugs
  for (let i = 0; i < normalizedDrugs.length; i++) {
    for (let j = i + 1; j < normalizedDrugs.length; j++) {
      const drug1 = normalizedDrugs[i];
      const drug2 = normalizedDrugs[j];
      
      // Check known interactions
      const knownInteractions = findKnownInteractions(drug1, drug2);
      interactions.push(...knownInteractions);
    }
  }
  
  // Fetch FDA drug labels for additional warnings
  for (const drug of normalizedDrugs) {
    try {
      const labels = await searchDrugLabels(drug, 1);
      if (labels.length > 0) {
        const label = labels[0];
        
        // Extract warnings
        if (label.warnings) {
          const warningText = label.warnings.substring(0, 500);
          warnings.push(`${label.brandName}: ${warningText}...`);
        }
        
        // Extract contraindications
        if (label.contraindications) {
          const contraindicationText = label.contraindications.substring(0, 300);
          warnings.push(`${label.brandName} Contraindications: ${contraindicationText}...`);
        }
      }
    } catch (error) {
      console.error(`Error fetching label for ${drug}:`, error);
    }
  }
  
  // Generate recommendations
  if (interactions.length === 0) {
    recommendations.push("No major known interactions found in our database.");
    recommendations.push("However, always consult drug labels and clinical references for complete information.");
  } else {
    const majorCount = interactions.filter(i => i.severity === "major").length;
    const moderateCount = interactions.filter(i => i.severity === "moderate").length;
    
    if (majorCount > 0) {
      recommendations.push(`⚠️ ${majorCount} MAJOR interaction(s) detected. Use combination with extreme caution.`);
    }
    if (moderateCount > 0) {
      recommendations.push(`⚡ ${moderateCount} MODERATE interaction(s) detected. Monitor closely.`);
    }
    
    recommendations.push("Review each interaction below for specific management recommendations.");
    recommendations.push("Consider consulting a pharmacist or specialist for complex regimens.");
  }
  
  return {
    drugs: normalizedDrugs,
    interactions,
    warnings,
    recommendations,
  };
}

/**
 * Find known interactions between two drugs
 */
function findKnownInteractions(drug1: string, drug2: string): DrugInteraction[] {
  const interactions: DrugInteraction[] = [];
  
  // Check drug1's interactions
  if (KNOWN_INTERACTIONS[drug1]) {
    const matches = KNOWN_INTERACTIONS[drug1].filter(
      i => i.drug2.toLowerCase() === drug2 || i.drug1.toLowerCase() === drug2
    );
    interactions.push(...matches);
  }
  
  // Check drug2's interactions
  if (KNOWN_INTERACTIONS[drug2]) {
    const matches = KNOWN_INTERACTIONS[drug2].filter(
      i => i.drug2.toLowerCase() === drug1 || i.drug1.toLowerCase() === drug1
    );
    interactions.push(...matches);
  }
  
  return interactions;
}

/**
 * Format interaction check results for AI prompt
 */
export function formatInteractionResults(result: InteractionCheckResult): string {
  let formatted = "\n\n--- DRUG INTERACTION CHECK ---\n\n";
  
  formatted += `**Drugs Checked**: ${result.drugs.join(", ")}\n\n`;
  
  if (result.interactions.length > 0) {
    formatted += "**INTERACTIONS FOUND:**\n\n";
    
    result.interactions.forEach((interaction, i) => {
      const severityEmoji = {
        major: "🔴",
        moderate: "🟡",
        minor: "🟢",
        unknown: "⚪",
      };
      
      formatted += `${i + 1}. ${severityEmoji[interaction.severity]} **${interaction.drug1.toUpperCase()} + ${interaction.drug2.toUpperCase()}** (${interaction.severity.toUpperCase()})\n`;
      formatted += `   ${interaction.description}\n`;
      if (interaction.mechanism) formatted += `   Mechanism: ${interaction.mechanism}\n`;
      if (interaction.clinicalEffects) formatted += `   Clinical Effects: ${interaction.clinicalEffects}\n`;
      if (interaction.management) formatted += `   Management: ${interaction.management}\n`;
      formatted += `   Sources: ${interaction.sources.join(", ")}\n\n`;
    });
  }
  
  if (result.warnings.length > 0) {
    formatted += "**FDA WARNINGS & CONTRAINDICATIONS:**\n\n";
    result.warnings.forEach((warning, i) => {
      formatted += `${i + 1}. ${warning}\n\n`;
    });
  }
  
  formatted += "**RECOMMENDATIONS:**\n";
  result.recommendations.forEach(rec => {
    formatted += `• ${rec}\n`;
  });
  
  formatted += "\n--- END DRUG INTERACTION CHECK ---\n\n";
  
  return formatted;
}

/**
 * Quick check if drugs have known interactions
 */
export function hasKnownInteractions(drugs: string[]): boolean {
  const normalizedDrugs = drugs.map(d => d.toLowerCase().trim());
  
  for (let i = 0; i < normalizedDrugs.length; i++) {
    for (let j = i + 1; j < normalizedDrugs.length; j++) {
      const interactions = findKnownInteractions(normalizedDrugs[i], normalizedDrugs[j]);
      if (interactions.length > 0) return true;
    }
  }
  
  return false;
}
