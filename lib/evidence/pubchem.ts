/**
 * PubChem API Integration
 * 
 * PubChem is NCBI's database of chemical molecules and their activities
 * Used as fallback when DailyMed doesn't have drug information
 * 
 * Official API: https://pubchemdocs.ncbi.nlm.nih.gov/pug-rest
 * 
 * Key features:
 * - Chemical structures and properties
 * - Drug interactions
 * - Biological activities
 * - Pharmacological data
 * - Toxicology information
 */

const PUBCHEM_BASE = "https://pubchem.ncbi.nlm.nih.gov/rest/pug";

export interface PubChemCompound {
  cid: string;
  name: string;
  synonyms: string[];
  molecularFormula?: string;
  molecularWeight?: number;
  inchiKey?: string;
  canonicalSmiles?: string;
  description?: string;
  pharmacology?: string;
  mechanism?: string;
  toxicity?: string;
  interactions?: string[];
  url: string;
  source: "PubChem";
}

export interface PubChemBioAssay {
  aid: string;
  name: string;
  description: string;
  target?: string;
  activity?: string;
  outcome?: string;
  url: string;
  source: "PubChem BioAssay";
}

/**
 * Search PubChem compounds by name
 */
export async function searchPubChemCompounds(
  drugName: string,
  maxResults: number = 5
): Promise<PubChemCompound[]> {
  try {
    console.log(`💊 Searching PubChem compounds: "${drugName}"`);
    
    // First, get CIDs (compound IDs) for the drug name
    const searchUrl = `${PUBCHEM_BASE}/compound/name/${encodeURIComponent(drugName)}/cids/JSON`;
    
    const response = await fetch(searchUrl, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(`PubChem search error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const cids = data.IdentifierList?.CID || [];

    if (cids.length === 0) {
      console.log("⚠️  No PubChem compounds found");
      return [];
    }

    console.log(`✅ Found ${cids.length} PubChem compounds`);

    // Fetch detailed compound information
    return fetchCompoundDetails(cids.slice(0, maxResults));
  } catch (error: any) {
    console.error("Error searching PubChem compounds:", error.message);
    return [];
  }
}

/**
 * Fetch detailed compound information
 */
async function fetchCompoundDetails(cids: string[]): Promise<PubChemCompound[]> {
  if (cids.length === 0) return [];

  try {
    // Get basic compound properties
    const propsUrl = `${PUBCHEM_BASE}/compound/cid/${cids.join(',')}/property/MolecularFormula,MolecularWeight,InChIKey,CanonicalSMILES/JSON`;
    
    const propsResponse = await fetch(propsUrl, {
      signal: AbortSignal.timeout(10000),
    });

    if (!propsResponse.ok) {
      console.error(`PubChem properties error: ${propsResponse.status}`);
      return [];
    }

    const propsData = await propsResponse.json();
    const properties = propsData.PropertyTable?.Properties || [];

    const compounds: PubChemCompound[] = [];

    for (const prop of properties) {
      const cid = prop.CID.toString();
      
      // Get synonyms (drug names)
      const synonyms = await fetchCompoundSynonyms(cid);
      
      // Get description from PubChem annotations
      const description = await fetchCompoundDescription(cid);
      
      compounds.push({
        cid,
        name: synonyms[0] || `Compound ${cid}`,
        synonyms: synonyms.slice(0, 10), // Limit synonyms
        molecularFormula: prop.MolecularFormula,
        molecularWeight: prop.MolecularWeight,
        inchiKey: prop.InChIKey,
        canonicalSmiles: prop.CanonicalSMILES,
        description,
        url: `https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`,
        source: "PubChem",
      });
    }

    return compounds;
  } catch (error: any) {
    console.error("Error fetching compound details:", error.message);
    return [];
  }
}

/**
 * Fetch compound synonyms (drug names)
 */
async function fetchCompoundSynonyms(cid: string): Promise<string[]> {
  try {
    const url = `${PUBCHEM_BASE}/compound/cid/${cid}/synonyms/JSON`;
    
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.InformationList?.[0]?.Synonym || [];
  } catch (error) {
    return [];
  }
}

/**
 * Fetch compound description from PubChem annotations
 */
async function fetchCompoundDescription(cid: string): Promise<string | undefined> {
  try {
    const url = `${PUBCHEM_BASE}/compound/cid/${cid}/description/JSON`;
    
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return undefined;

    const data = await response.json();
    const descriptions = data.InformationList?.[0]?.Description || [];
    
    // Return the first description (usually from a reliable source)
    return descriptions[0]?.Description;
  } catch (error) {
    return undefined;
  }
}

/**
 * Search PubChem BioAssays for drug activity data
 */
export async function searchPubChemBioAssays(
  drugName: string,
  maxResults: number = 3
): Promise<PubChemBioAssay[]> {
  try {
    console.log(`🧪 Searching PubChem BioAssays: "${drugName}"`);
    
    // Search for assays by compound name
    const searchUrl = `${PUBCHEM_BASE}/assay/target/name/${encodeURIComponent(drugName)}/aids/JSON`;
    
    const response = await fetch(searchUrl, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.log("⚠️  No PubChem BioAssays found");
      return [];
    }

    const data = await response.json();
    const aids = data.IdentifierList?.AID || [];

    if (aids.length === 0) {
      return [];
    }

    console.log(`✅ Found ${aids.length} BioAssays`);

    // Fetch assay summaries
    return fetchAssaySummaries(aids.slice(0, maxResults));
  } catch (error: any) {
    console.error("Error searching PubChem BioAssays:", error.message);
    return [];
  }
}

/**
 * Fetch BioAssay summaries
 */
async function fetchAssaySummaries(aids: string[]): Promise<PubChemBioAssay[]> {
  if (aids.length === 0) return [];

  try {
    const url = `${PUBCHEM_BASE}/assay/aid/${aids.join(',')}/summary/JSON`;
    
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return [];

    const data = await response.json();
    const assays = data.AssaySummaries?.AssaySummary || [];

    return assays.map((assay: any) => ({
      aid: assay.AID.toString(),
      name: assay.Name || `Assay ${assay.AID}`,
      description: assay.Description || "",
      target: assay.Target?.[0]?.Name,
      activity: assay.ActivityOutcomeMethod,
      outcome: assay.ActivityOutcome,
      url: `https://pubchem.ncbi.nlm.nih.gov/bioassay/${assay.AID}`,
      source: "PubChem BioAssay",
    }));
  } catch (error: any) {
    console.error("Error fetching assay summaries:", error.message);
    return [];
  }
}

/**
 * Comprehensive PubChem search (compounds + bioassays)
 */
export async function comprehensivePubChemSearch(
  drugName: string
): Promise<{ compounds: PubChemCompound[]; bioAssays: PubChemBioAssay[] }> {
  const [compounds, bioAssays] = await Promise.all([
    searchPubChemCompounds(drugName, 3),
    searchPubChemBioAssays(drugName, 2),
  ]);

  return { compounds, bioAssays };
}

/**
 * Format PubChem data for prompt
 */
export function formatPubChemForPrompt(
  compounds: PubChemCompound[],
  bioAssays: PubChemBioAssay[]
): string {
  if (compounds.length === 0 && bioAssays.length === 0) return "";

  let formatted = "## ZONE 27: PUBCHEM (Chemical & Pharmacological Data)\n";
  formatted += "**NCBI database of chemical molecules and biological activities**\n\n";

  // Format compounds
  if (compounds.length > 0) {
    formatted += "### Chemical Information:\n";
    compounds.forEach((compound, i) => {
      formatted += `${i + 1}. **${compound.name}** (CID: ${compound.cid})\n`;
      formatted += `   SOURCE: PubChem | URL: ${compound.url}\n`;
      
      if (compound.synonyms.length > 0) {
        formatted += `   Synonyms: ${compound.synonyms.slice(0, 5).join(", ")}\n`;
      }
      
      if (compound.molecularFormula) {
        formatted += `   Molecular Formula: ${compound.molecularFormula}\n`;
      }
      
      if (compound.molecularWeight) {
        formatted += `   Molecular Weight: ${compound.molecularWeight} g/mol\n`;
      }
      
      if (compound.description) {
        formatted += `   Description: ${compound.description.substring(0, 300)}...\n`;
      }
      
      formatted += "\n";
    });
  }

  // Format bioassays
  if (bioAssays.length > 0) {
    formatted += "### Biological Activity Data:\n";
    bioAssays.forEach((assay, i) => {
      formatted += `${i + 1}. **${assay.name}** (AID: ${assay.aid})\n`;
      formatted += `   SOURCE: PubChem BioAssay | URL: ${assay.url}\n`;
      
      if (assay.target) {
        formatted += `   Target: ${assay.target}\n`;
      }
      
      if (assay.description) {
        formatted += `   Description: ${assay.description.substring(0, 200)}...\n`;
      }
      
      formatted += "\n";
    });
  }

  return formatted;
}

/**
 * Check if we should use PubChem as fallback
 * (when DailyMed has insufficient results)
 */
export function shouldUsePubChemFallback(dailyMedResults: number, query: string): boolean {
  // Use PubChem if:
  // 1. DailyMed has no results, OR
  // 2. DailyMed has very few results (<2) for drug queries
  
  const isDrugQuery = /\b(drug|medication|medicine|compound|chemical|pharmaceutical|treatment|therapy|antibiotic|antiviral|antiparasitic)\b/i.test(query);
  
  return dailyMedResults === 0 || (isDrugQuery && dailyMedResults < 2);
}

/**
 * Extract potential drug/treatment names from a query
 * Used when no explicit drug names are provided
 * 
 * IMPORTANT: Only returns actual drug compound names that PubChem can search
 * Do NOT include treatment phrases like "giardia treatment" - these cause 404 errors
 */
export function extractDrugTermsFromQuery(query: string): string[] {
  const queryLower = query.toLowerCase();
  const drugTerms: string[] = [];
  
  // Map conditions to their standard drug treatments
  // Key = actual drug name (searchable in PubChem)
  // Value = condition keywords that indicate this drug might be relevant
  const conditionToDrugMap: Record<string, string[]> = {
    // Antiparasitics for Giardia
    'metronidazole': ['giardia', 'giardiasis'],
    'tinidazole': ['giardia', 'giardiasis', 'tinidazole'],
    'nitazoxanide': ['giardia', 'cryptosporidium', 'nitazoxanide'],
    'albendazole': ['parasitic', 'helminth', 'worm', 'albendazole'],
    
    // H. pylori treatments
    'omeprazole': ['h pylori', 'helicobacter', 'peptic ulcer'],
    'clarithromycin': ['h pylori', 'helicobacter'],
    'amoxicillin': ['h pylori', 'helicobacter', 'amoxicillin'],
    
    // Common antibiotics
    'azithromycin': ['azithromycin', 'zithromax', 'z-pack', 'respiratory infection'],
    'ciprofloxacin': ['ciprofloxacin', 'cipro', 'urinary tract'],
    
    // GI medications
    'loperamide': ['diarrhea', 'diarrhoea', 'antidiarrheal'],
    'ondansetron': ['nausea', 'vomiting', 'antiemetic'],
    
    // Probiotics (for post-infectious)
    'lactobacillus': ['probiotic', 'post-infectious', 'gut flora', 'microbiome'],
  };
  
  for (const [drug, conditions] of Object.entries(conditionToDrugMap)) {
    if (conditions.some(c => queryLower.includes(c))) {
      // Only add if not already in the list
      if (!drugTerms.includes(drug)) {
        drugTerms.push(drug);
      }
    }
  }
  
  // Limit to 2 drugs to avoid too many API calls
  return drugTerms.slice(0, 2);
}
