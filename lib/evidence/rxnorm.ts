/**
 * RxNorm API Integration
 * National Library of Medicine's standardized drug nomenclature
 * 
 * Provides:
 * - Drug name normalization
 * - Drug class information
 * - Drug-drug interactions
 * - Related drug concepts
 * 
 * API Documentation: https://rxnav.nlm.nih.gov/RxNormAPIs.html
 * Free, no API key required
 */

export interface RxNormDrug {
  rxcui: string;
  name: string;
  synonym?: string;
  tty?: string; // Term type (e.g., SBD, SCD, IN)
  language?: string;
  suppress?: string;
}

export interface RxNormDrugClass {
  classId: string;
  className: string;
  classType: string;
  source?: string;
}

export interface RxNormInteraction {
  severity: string;
  description: string;
  drug1: string;
  drug2: string;
  source: string;
}

export interface RxNormRelatedDrug {
  rxcui: string;
  name: string;
  relationship: string;
  tty?: string;
}

const RXNORM_BASE_URL = 'https://rxnav.nlm.nih.gov/REST';

/**
 * Search for drugs by name and get RxCUI
 */
export async function searchRxNormDrugs(drugName: string): Promise<RxNormDrug[]> {
  try {
    const url = `${RXNORM_BASE_URL}/drugs.json?name=${encodeURIComponent(drugName)}`;
    
    console.log(`💊 Searching RxNorm for: "${drugName}"`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'OpenWork-AI/1.0'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      console.error(`❌ RxNorm search error: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    
    if (!data.drugGroup?.conceptGroup) {
      return [];
    }
    
    const drugs: RxNormDrug[] = [];
    
    for (const group of data.drugGroup.conceptGroup) {
      if (group.conceptProperties) {
        for (const concept of group.conceptProperties) {
          drugs.push({
            rxcui: concept.rxcui,
            name: concept.name,
            synonym: concept.synonym,
            tty: concept.tty,
            language: concept.language,
            suppress: concept.suppress
          });
        }
      }
    }
    
    console.log(`✅ Found ${drugs.length} RxNorm concepts for "${drugName}"`);
    return drugs;
  } catch (error: any) {
    console.error('❌ RxNorm search error:', error.message);
    return [];
  }
}

/**
 * Get drug classes for a given RxCUI
 */
export async function getDrugClasses(rxcui: string): Promise<RxNormDrugClass[]> {
  try {
    const url = `${RXNORM_BASE_URL}/rxclass/class/byRxcui.json?rxcui=${rxcui}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'OpenWork-AI/1.0'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    
    if (!data.rxclassDrugInfoList?.rxclassDrugInfo) {
      return [];
    }
    
    const classes: RxNormDrugClass[] = [];
    
    for (const info of data.rxclassDrugInfoList.rxclassDrugInfo) {
      if (info.rxclassMinConceptItem) {
        classes.push({
          classId: info.rxclassMinConceptItem.classId,
          className: info.rxclassMinConceptItem.className,
          classType: info.rxclassMinConceptItem.classType,
          source: info.rxclassMinConceptItem.source
        });
      }
    }
    
    return classes;
  } catch (error: any) {
    console.error('❌ RxNorm class lookup error:', error.message);
    return [];
  }
}

/**
 * Get drug-drug interactions for a list of RxCUIs
 */
export async function getDrugInteractions(rxcuis: string[]): Promise<RxNormInteraction[]> {
  if (rxcuis.length < 2) {
    return [];
  }
  
  try {
    const rxcuiList = rxcuis.join('+');
    const url = `${RXNORM_BASE_URL}/interaction/list.json?rxcuis=${rxcuiList}`;
    
    console.log(`💊 Checking RxNorm interactions for: ${rxcuis.join(', ')}`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'OpenWork-AI/1.0'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    
    if (!data.fullInteractionTypeGroup) {
      return [];
    }
    
    const interactions: RxNormInteraction[] = [];
    
    for (const group of data.fullInteractionTypeGroup) {
      if (group.fullInteractionType) {
        for (const interaction of group.fullInteractionType) {
          if (interaction.interactionPair) {
            for (const pair of interaction.interactionPair) {
              interactions.push({
                severity: pair.severity || 'Unknown',
                description: pair.description || '',
                drug1: pair.interactionConcept?.[0]?.minConceptItem?.name || '',
                drug2: pair.interactionConcept?.[1]?.minConceptItem?.name || '',
                source: group.sourceName || 'RxNorm'
              });
            }
          }
        }
      }
    }
    
    console.log(`✅ Found ${interactions.length} drug interactions`);
    return interactions;
  } catch (error: any) {
    console.error('❌ RxNorm interaction check error:', error.message);
    return [];
  }
}

/**
 * Get related drugs (same ingredient, different forms/strengths)
 */
export async function getRelatedDrugs(rxcui: string): Promise<RxNormRelatedDrug[]> {
  try {
    const url = `${RXNORM_BASE_URL}/rxcui/${rxcui}/related.json?tty=SBD+SCD+GPCK+BPCK`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'OpenWork-AI/1.0'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    
    if (!data.relatedGroup?.conceptGroup) {
      return [];
    }
    
    const related: RxNormRelatedDrug[] = [];
    
    for (const group of data.relatedGroup.conceptGroup) {
      if (group.conceptProperties) {
        for (const concept of group.conceptProperties) {
          related.push({
            rxcui: concept.rxcui,
            name: concept.name,
            relationship: group.tty || 'Related',
            tty: concept.tty
          });
        }
      }
    }
    
    return related.slice(0, 10); // Limit to 10 related drugs
  } catch (error: any) {
    console.error('❌ RxNorm related drugs error:', error.message);
    return [];
  }
}

/**
 * Get prescribable drugs for a given ingredient
 */
export async function getPrescribableDrugs(ingredientName: string): Promise<RxNormDrug[]> {
  try {
    // First, get the RxCUI for the ingredient
    const drugs = await searchRxNormDrugs(ingredientName);
    
    if (drugs.length === 0) {
      return [];
    }
    
    // Find the ingredient concept (IN type)
    const ingredient = drugs.find(d => d.tty === 'IN') || drugs[0];
    
    // Get prescribable forms
    const url = `${RXNORM_BASE_URL}/rxcui/${ingredient.rxcui}/related.json?tty=SBD+SCD`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'OpenWork-AI/1.0'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    
    if (!data.relatedGroup?.conceptGroup) {
      return [];
    }
    
    const prescribable: RxNormDrug[] = [];
    
    for (const group of data.relatedGroup.conceptGroup) {
      if (group.conceptProperties) {
        for (const concept of group.conceptProperties) {
          prescribable.push({
            rxcui: concept.rxcui,
            name: concept.name,
            tty: concept.tty
          });
        }
      }
    }
    
    return prescribable.slice(0, 15); // Limit results
  } catch (error: any) {
    console.error('❌ RxNorm prescribable drugs error:', error.message);
    return [];
  }
}

/**
 * Comprehensive RxNorm search for a drug query
 */
export async function comprehensiveRxNormSearch(query: string, drugNames: string[] = []): Promise<{
  drugs: RxNormDrug[];
  classes: RxNormDrugClass[];
  interactions: RxNormInteraction[];
  prescribable: RxNormDrug[];
}> {
  try {
    // Extract drug names from query if not provided
    const searchTerms = drugNames.length > 0 ? drugNames : extractDrugTerms(query);
    
    if (searchTerms.length === 0) {
      return { drugs: [], classes: [], interactions: [], prescribable: [] };
    }
    
    console.log(`💊 Comprehensive RxNorm search for: ${searchTerms.join(', ')}`);
    
    // Search for each drug
    const drugSearches = await Promise.all(
      searchTerms.map(term => searchRxNormDrugs(term))
    );
    
    const allDrugs = drugSearches.flat();
    
    // Get unique RxCUIs
    const rxcuis = [...new Set(allDrugs.map(d => d.rxcui))];
    
    // Get drug classes for first drug
    let classes: RxNormDrugClass[] = [];
    if (rxcuis.length > 0) {
      classes = await getDrugClasses(rxcuis[0]);
    }
    
    // Check interactions if multiple drugs
    let interactions: RxNormInteraction[] = [];
    if (rxcuis.length >= 2) {
      interactions = await getDrugInteractions(rxcuis.slice(0, 5));
    }
    
    // Get prescribable forms for first drug
    let prescribable: RxNormDrug[] = [];
    if (searchTerms.length > 0) {
      prescribable = await getPrescribableDrugs(searchTerms[0]);
    }
    
    return {
      drugs: allDrugs.slice(0, 10),
      classes: classes.slice(0, 5),
      interactions,
      prescribable: prescribable.slice(0, 10)
    };
  } catch (error: any) {
    console.error('❌ Comprehensive RxNorm search error:', error.message);
    return { drugs: [], classes: [], interactions: [], prescribable: [] };
  }
}

/**
 * Extract potential drug names from a query
 */
function extractDrugTerms(query: string): string[] {
  // Common drug suffixes and patterns
  const drugPatterns = [
    /\b\w+mab\b/gi,      // Monoclonal antibodies
    /\b\w+nib\b/gi,      // Kinase inhibitors
    /\b\w+pril\b/gi,     // ACE inhibitors
    /\b\w+sartan\b/gi,   // ARBs
    /\b\w+statin\b/gi,   // Statins
    /\b\w+olol\b/gi,     // Beta blockers
    /\b\w+azole\b/gi,    // Antifungals
    /\b\w+cillin\b/gi,   // Penicillins
    /\b\w+mycin\b/gi,    // Antibiotics
    /\b\w+prazole\b/gi,  // PPIs
    /\b\w+dipine\b/gi,   // Calcium channel blockers
    /\b\w+floxacin\b/gi, // Fluoroquinolones
    /\b\w+vir\b/gi,      // Antivirals
    /\b\w+pine\b/gi,     // Various
    /\b\w+ine\b/gi,      // Various (careful - many false positives)
  ];
  
  const foundDrugs: string[] = [];
  
  for (const pattern of drugPatterns) {
    const matches = query.match(pattern);
    if (matches) {
      foundDrugs.push(...matches);
    }
  }
  
  // Also check for common drug names
  const commonDrugs = [
    'aspirin', 'ibuprofen', 'acetaminophen', 'metformin', 'insulin',
    'lisinopril', 'amlodipine', 'metoprolol', 'omeprazole', 'losartan',
    'gabapentin', 'hydrochlorothiazide', 'atorvastatin', 'simvastatin',
    'levothyroxine', 'prednisone', 'amoxicillin', 'azithromycin',
    'warfarin', 'clopidogrel', 'furosemide', 'albuterol', 'fluticasone'
  ];
  
  const lowerQuery = query.toLowerCase();
  for (const drug of commonDrugs) {
    if (lowerQuery.includes(drug)) {
      foundDrugs.push(drug);
    }
  }
  
  // Return unique drugs
  return [...new Set(foundDrugs.map(d => d.toLowerCase()))];
}

/**
 * Format RxNorm data for prompt
 */
export function formatRxNormForPrompt(data: {
  drugs: RxNormDrug[];
  classes: RxNormDrugClass[];
  interactions: RxNormInteraction[];
  prescribable: RxNormDrug[];
}): string {
  if (data.drugs.length === 0 && data.interactions.length === 0) {
    return '';
  }
  
  let formatted = "## ZONE 20: RXNORM DRUG INFORMATION (NLM)\n";
  
  if (data.drugs.length > 0) {
    formatted += "**Drug Concepts:**\n";
    data.drugs.slice(0, 5).forEach((drug, i) => {
      formatted += `${i + 1}. ${drug.name} (RxCUI: ${drug.rxcui})\n`;
      if (drug.tty) formatted += `   Type: ${drug.tty}\n`;
    });
    formatted += "\n";
  }
  
  if (data.classes.length > 0) {
    formatted += "**Drug Classes:**\n";
    data.classes.forEach((cls, i) => {
      formatted += `${i + 1}. ${cls.className} (${cls.classType})\n`;
    });
    formatted += "\n";
  }
  
  if (data.interactions.length > 0) {
    formatted += "**⚠️ Drug Interactions:**\n";
    data.interactions.forEach((interaction, i) => {
      formatted += `${i + 1}. ${interaction.drug1} + ${interaction.drug2}\n`;
      formatted += `   Severity: ${interaction.severity}\n`;
      formatted += `   ${interaction.description}\n`;
      formatted += `   Source: ${interaction.source}\n\n`;
    });
  }
  
  if (data.prescribable.length > 0) {
    formatted += "**Prescribable Forms:**\n";
    data.prescribable.slice(0, 5).forEach((drug, i) => {
      formatted += `${i + 1}. ${drug.name}\n`;
    });
    formatted += "\n";
  }
  
  return formatted;
}
