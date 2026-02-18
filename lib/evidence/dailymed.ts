/**
 * DailyMed Integration for FDA Drug Information
 * 
 * DailyMed provides official FDA-approved drug labeling information (SPL - Structured Product Labels)
 * This includes package inserts, prescribing information, contraindications, dosing, and safety data.
 * 
 * Key Features:
 * - Search by drug name, NDC code, RxCUI, or active ingredient
 * - Get complete FDA-approved labeling information
 * - Access drug interactions, contraindications, and warnings
 * - Retrieve dosing information and administration guidelines
 * - Get packaging and NDC information
 */

interface DailyMedSPL {
  setid: string;
  title: string;
  published_date: string;
  spl_version: string;
}

interface DailyMedSearchResult {
  metadata: {
    total_elements: string;
    elements_per_page: string;
    total_pages: string;
    current_page: string;
  };
  data: DailyMedSPL[];
}

// Interface expected by the evidence engine
export interface DailyMedDrug {
  setId: string;
  title: string;
  publishedDate: string;
  activeIngredients: string[];
  dosageForm: string;
  route: string;
  manufacturer: string;
  ndcCodes: string[];
  indications: string;
  contraindications: string;
  warnings: string;
  dosage: string;
  adverseReactions: string;
  drugInteractions: string;
  clinicalPharmacology: string;
  howSupplied: string;
  genericName?: string;
  brandName?: string;
}

interface DailyMedDrugInfo {
  setid: string;
  title: string;
  published_date: string;
  active_ingredients: string[];
  dosage_form: string;
  route: string;
  manufacturer: string;
  ndc_codes: string[];
  indications: string;
  contraindications: string;
  warnings: string;
  dosage: string;
  adverse_reactions: string;
  drug_interactions: string;
  clinical_pharmacology: string;
  how_supplied: string;
}

/**
 * Comprehensive DailyMed search - Main function expected by evidence engine
 * ENHANCED: Now prioritizes recent drug labeling updates (2023-2025)
 */
export async function comprehensiveDailyMedSearch(query: string): Promise<{ drugs: DailyMedDrug[] }> {
  try {
    console.log(`🔍 DailyMed: Comprehensive search for "${query}"`);

    // Extract drug names from the query
    const drugNames = extractDrugNamesFromQuery(query);

    if (drugNames.length === 0) {
      console.log('📭 No drug names detected in query');
      return { drugs: [] };
    }

    console.log(`💊 Detected drugs: ${drugNames.join(', ')}`);

    const allDrugs: DailyMedDrug[] = [];

    // Search for each detected drug
    for (const drugName of drugNames.slice(0, 3)) { // Limit to 3 drugs to avoid rate limits
      try {
        const drugInfo = await searchDailyMedByName(drugName, 3); // Get 3 results to find best quality

        // CRITICAL ENHANCEMENT: Filter for recent labeling updates (2023+)
        const currentYear = new Date().getFullYear();
        const recentDrugInfo = drugInfo.filter(drug => {
          const pubYear = new Date(drug.published_date).getFullYear();
          return pubYear >= currentYear - 2; // 2023+ if current year is 2025
        });

        // If no recent updates, keep the most recent ones
        const finalDrugInfo = recentDrugInfo.length > 0 ? recentDrugInfo : drugInfo.slice(0, 1);

        // Convert to expected format
        const convertedDrugs = finalDrugInfo.map(convertToDailyMedDrug);

        // CRITICAL FIX: Sort by number of filled sections (content quality)
        // This ensures manufacturer labels with full content rank above repackager labels
        convertedDrugs.sort((a, b) => {
          const sectionsA = countFilledSections(a);
          const sectionsB = countFilledSections(b);
          return sectionsB - sectionsA; // Descending order (most sections first)
        });

        // Only keep the best quality label per drug
        if (convertedDrugs.length > 0) {
          allDrugs.push(convertedDrugs[0]);
          console.log(`📋 Selected best label for ${drugName}: ${countFilledSections(convertedDrugs[0])} sections`);
        }

      } catch (error: any) {
        console.warn(`⚠️ DailyMed search failed for "${drugName}":`, error.message);
      }
    }

    console.log(`✅ DailyMed: Found ${allDrugs.length} drug records`);

    return { drugs: allDrugs };

  } catch (error: any) {
    console.error('❌ DailyMed comprehensive search error:', error.message);
    return { drugs: [] };
  }
}

/**
 * Count number of filled sections in a drug result
 */
function countFilledSections(drug: DailyMedDrug): number {
  let count = 0;
  if (drug.indications && drug.indications.length > 50) count++;
  if (drug.dosage && drug.dosage.length > 50) count++;
  if (drug.warnings && drug.warnings.length > 50) count++;
  if (drug.adverseReactions && drug.adverseReactions.length > 50) count++;
  if (drug.drugInteractions && drug.drugInteractions.length > 50) count++;
  if (drug.contraindications && drug.contraindications.length > 50) count++;
  if (drug.clinicalPharmacology && drug.clinicalPharmacology.length > 50) count++;
  return count;
}

/**
 * Extract drug names from query using simple pattern matching
 */
function extractDrugNamesFromQuery(query: string): string[] {
  const drugNames: string[] = [];
  const queryLower = query.toLowerCase();

  // CRITICAL FIX: Brand Name to Generic Name mapping
  // This ensures queries like "What is Tylenol?" find the correct DailyMed entry
  const BRAND_TO_GENERIC: Record<string, string> = {
    // Pain/OTC
    'tylenol': 'acetaminophen',
    'advil': 'ibuprofen',
    'motrin': 'ibuprofen',
    'aleve': 'naproxen',
    'excedrin': 'acetaminophen',
    'bayer': 'aspirin',
    // Statins
    'lipitor': 'atorvastatin',
    'crestor': 'rosuvastatin',
    'zocor': 'simvastatin',
    'pravachol': 'pravastatin',
    // PPIs
    'nexium': 'esomeprazole',
    'prilosec': 'omeprazole',
    'prevacid': 'lansoprazole',
    'protonix': 'pantoprazole',
    // Psychiatric
    'prozac': 'fluoxetine',
    'zoloft': 'sertraline',
    'lexapro': 'escitalopram',
    'xanax': 'alprazolam',
    'ambien': 'zolpidem',
    'ativan': 'lorazepam',
    // Anticoagulants
    'eliquis': 'apixaban',
    'xarelto': 'rivaroxaban',
    'pradaxa': 'dabigatran',
    'savaysa': 'edoxaban',
    'coumadin': 'warfarin',
    // Diabetes SGLT2i
    'jardiance': 'empagliflozin',
    'farxiga': 'dapagliflozin',
    'invokana': 'canagliflozin',
    // Diabetes GLP-1
    'ozempic': 'semaglutide',
    'wegovy': 'semaglutide',
    'trulicity': 'dulaglutide',
    'victoza': 'liraglutide',
    'mounjaro': 'tirzepatide',
    'zepbound': 'tirzepatide',
    // Heart Failure
    'entresto': 'sacubitril/valsartan',
    // Blood Pressure
    'norvasc': 'amlodipine',
    'zestril': 'lisinopril',
    'prinivil': 'lisinopril',
    'diovan': 'valsartan',
    'cozaar': 'losartan',
    'toprol': 'metoprolol',
    'lopressor': 'metoprolol',
    // Thyroid
    'synthroid': 'levothyroxine',
    // Respiratory
    'ventolin': 'albuterol',
    'proair': 'albuterol',
    'advair': 'fluticasone/salmeterol',
    'symbicort': 'budesonide/formoterol',
    // Antibiotics
    'augmentin': 'amoxicillin/clavulanate',
    'zithromax': 'azithromycin',
    'zpack': 'azithromycin',
    'z-pack': 'azithromycin',
    'cipro': 'ciprofloxacin',
    'levaquin': 'levofloxacin',
    // Other common
    'lasix': 'furosemide',
    'neurontin': 'gabapentin',
    'lyrica': 'pregabalin',
    'humira': 'adalimumab',
  };

  // Step 1: Check for brand names and add their generic equivalents
  for (const [brand, generic] of Object.entries(BRAND_TO_GENERIC)) {
    if (queryLower.includes(brand)) {
      drugNames.push(generic);
      console.log(`💊 Brand name "${brand}" detected → adding generic "${generic}"`);
    }
  }

  // Common drug patterns and known drugs
  // EXPANDED: Added oncology (TKIs, mAbs), diabetes (SGLT2i, GLP-1), biologics, anticoagulants
  const commonDrugs = [
    // Cardiovascular/Metabolic
    'metformin', 'insulin', 'aspirin', 'ibuprofen', 'acetaminophen', 'lisinopril',
    'atorvastatin', 'simvastatin', 'amlodipine', 'omeprazole', 'levothyroxine',
    'warfarin', 'clopidogrel', 'prednisone', 'albuterol', 'furosemide',
    'hydrochlorothiazide', 'losartan', 'gabapentin', 'sertraline', 'fluoxetine',
    'digoxin', 'propranolol', 'carvedilol', 'metoprolol', 'diltiazem',
    'spironolactone', 'enalapril', 'ramipril', 'valsartan', 'candesartan',
    'rosuvastatin', 'pravastatin', 'ezetimibe', 'fenofibrate', 'gemfibrozil',
    // Antibiotics
    'amoxicillin', 'azithromycin', 'ciprofloxacin', 'doxycycline', 'penicillin',
    'vancomycin', 'fidaxomicin', 'metronidazole',
    // Pain/Opioids
    'morphine', 'oxycodone', 'tramadol', 'codeine', 'fentanyl',
    // Diabetes - SGLT2 inhibitors
    'empagliflozin', 'dapagliflozin', 'canagliflozin', 'ertugliflozin', 'sotagliflozin',
    // Diabetes - GLP-1 agonists
    'semaglutide', 'liraglutide', 'dulaglutide', 'tirzepatide', 'exenatide',
    // Diabetes - DPP-4 inhibitors
    'sitagliptin', 'saxagliptin', 'linagliptin', 'alogliptin',
    // Diabetes - Other
    'glipizide', 'glyburide', 'pioglitazone',
    // Anticoagulants - DOACs
    'apixaban', 'rivaroxaban', 'dabigatran', 'edoxaban',
    // Heart Failure - ARNI
    'sacubitril', 'entresto',
    // Oncology - Monoclonal antibodies (mAbs)
    'adalimumab', 'etanercept', 'infliximab', 'rituximab', 'bevacizumab',
    'trastuzumab', 'pembrolizumab', 'nivolumab', 'ipilimumab', 'atezolizumab',
    'amivantamab', 'cetuximab', 'panitumumab', 'necitumumab',
    // Oncology - Tyrosine kinase inhibitors (TKIs)
    'osimertinib', 'mobocertinib', 'erlotinib', 'gefitinib', 'afatinib',
    'lapatinib', 'neratinib', 'tucatinib', 'lorlatinib', 'crizotinib',
    'alectinib', 'brigatinib', 'ceritinib', 'sotorasib', 'adagrasib',
    // Asthma biologics
    'mepolizumab', 'benralizumab', 'dupilumab', 'tezepelumab', 'omalizumab',
    // IBD biologics
    'vedolizumab', 'ustekinumab', 'risankizumab', 'ozanimod', 'tofacitinib',
    // Chemotherapy
    'carboplatin', 'cisplatin', 'pemetrexed', 'docetaxel', 'paclitaxel',
  ];

  // Check for exact matches
  for (const drug of commonDrugs) {
    if (queryLower.includes(drug)) {
      drugNames.push(drug);
    }
  }

  // Look for drug class patterns
  // EXPANDED: Added oncology (mab, tinib), biologics, and more drug class suffixes
  const drugClassPatterns = [
    /(\w+)statin\b/g, // statins
    /(\w+)pril\b/g, // ACE inhibitors
    /(\w+)sartan\b/g, // ARBs
    /(\w+)olol\b/g, // beta blockers
    /(\w+)flozin\b/g, // SGLT2 inhibitors
    /(\w+)gliptin\b/g, // DPP-4 inhibitors
    /(\w+)glutide\b/g, // GLP-1 agonists
    /(\w+)mab\b/g, // Monoclonal antibodies (oncology, biologics)
    /(\w+)tinib\b/g, // Tyrosine kinase inhibitors (oncology)
    /(\w+)ciclib\b/g, // CDK4/6 inhibitors
    /(\w+)parib\b/g, // PARP inhibitors
    /(\w+)zumab\b/g, // Humanized mAbs
    /(\w+)ximab\b/g, // Chimeric mAbs
    /(\w+)mumab\b/g, // Human mAbs
  ];

  for (const pattern of drugClassPatterns) {
    const matches = queryLower.matchAll(pattern);
    for (const match of matches) {
      if (match[0] && match[0].length > 3) {
        drugNames.push(match[0]);
      }
    }
  }

  // Remove duplicates and return
  return [...new Set(drugNames)];
}

/**
 * Convert internal DailyMedDrugInfo to expected DailyMedDrug format
 */
function convertToDailyMedDrug(drugInfo: DailyMedDrugInfo): DailyMedDrug {
  // Extract generic and brand names from title
  const { genericName, brandName } = extractNamesFromTitle(drugInfo.title);

  return {
    setId: drugInfo.setid,
    title: drugInfo.title,
    publishedDate: drugInfo.published_date,
    activeIngredients: drugInfo.active_ingredients,
    dosageForm: drugInfo.dosage_form,
    route: drugInfo.route,
    manufacturer: drugInfo.manufacturer,
    ndcCodes: drugInfo.ndc_codes,
    indications: drugInfo.indications,
    contraindications: drugInfo.contraindications,
    warnings: drugInfo.warnings,
    dosage: drugInfo.dosage,
    adverseReactions: drugInfo.adverse_reactions,
    drugInteractions: drugInfo.drug_interactions,
    clinicalPharmacology: drugInfo.clinical_pharmacology,
    howSupplied: drugInfo.how_supplied,
    genericName,
    brandName,
  };
}

/**
 * Extract generic and brand names from drug title
 */
function extractNamesFromTitle(title: string): { genericName?: string; brandName?: string } {
  // Pattern: "BRAND NAME (GENERIC NAME) FORM [MANUFACTURER]"
  const brandMatch = title.match(/^([A-Z][A-Z\s]+?)\s*\(/);
  const genericMatch = title.match(/\(([^)]+)\)/);

  return {
    brandName: brandMatch ? brandMatch[1].trim() : undefined,
    genericName: genericMatch ? genericMatch[1].trim() : undefined,
  };
}
export async function searchDailyMedByName(drugName: string, limit: number = 10): Promise<DailyMedDrugInfo[]> {
  try {
    const apiKey = process.env.NCBI_API_KEY_DAILYMED;
    console.log(`🔍 DailyMed: Searching for "${drugName}"`);

    // First, search for SPLs containing the drug name
    const searchUrl = `https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json?drug_name=${encodeURIComponent(drugName)}&pagesize=${limit}`;

    const headers: Record<string, string> = {
      'User-Agent': 'OpenWork-AI/1.0 (Medical Evidence System)',
    };

    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }

    const response = await fetch(searchUrl, { headers });

    if (!response.ok) {
      console.warn(`⚠️ DailyMed search failed: ${response.status}`);
      return [];
    }

    const searchResult: DailyMedSearchResult = await response.json();

    if (!searchResult.data || searchResult.data.length === 0) {
      console.log(`📭 No DailyMed results for "${drugName}"`);
      return [];
    }

    console.log(`✅ Found ${searchResult.data.length} DailyMed SPLs for "${drugName}"`);

    // Get detailed information for each SPL
    const drugInfoPromises = searchResult.data.slice(0, 5).map(spl =>
      getDailyMedSPLDetails(spl.setid)
    );

    const drugInfoResults = await Promise.allSettled(drugInfoPromises);
    const validResults = drugInfoResults
      .filter((result): result is PromiseFulfilledResult<DailyMedDrugInfo | null> =>
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value!);

    return validResults;

  } catch (error: any) {
    console.error('❌ DailyMed search error:', error.message);
    return [];
  }
}

/**
 * Search DailyMed by RxCUI (RxNorm Concept Unique Identifier)
 */
export async function searchDailyMedByRxCUI(rxcui: string, limit: number = 10): Promise<DailyMedDrugInfo[]> {
  try {
    const apiKey = process.env.NCBI_API_KEY_DAILYMED;
    console.log(`🔍 DailyMed: Searching by RxCUI "${rxcui}"`);

    const searchUrl = `https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json?rxcui=${rxcui}&pagesize=${limit}`;

    const headers: Record<string, string> = {
      'User-Agent': 'OpenWork-AI/1.0 (Medical Evidence System)',
    };

    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }

    const response = await fetch(searchUrl, { headers });

    if (!response.ok) {
      console.warn(`⚠️ DailyMed RxCUI search failed: ${response.status}`);
      return [];
    }

    const searchResult: DailyMedSearchResult = await response.json();

    if (!searchResult.data || searchResult.data.length === 0) {
      console.log(`📭 No DailyMed results for RxCUI "${rxcui}"`);
      return [];
    }

    console.log(`✅ Found ${searchResult.data.length} DailyMed SPLs for RxCUI "${rxcui}"`);

    // Get detailed information for each SPL
    const drugInfoPromises = searchResult.data.slice(0, 5).map(spl =>
      getDailyMedSPLDetails(spl.setid)
    );

    const drugInfoResults = await Promise.allSettled(drugInfoPromises);
    const validResults = drugInfoResults
      .filter((result): result is PromiseFulfilledResult<DailyMedDrugInfo | null> =>
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value!);

    return validResults;

  } catch (error: any) {
    console.error('❌ DailyMed RxCUI search error:', error.message);
    return [];
  }
}

/**
 * LOINC codes for FDA drug label sections
 */
const LOINC_SECTION_CODES: Record<string, string> = {
  '34067-9': 'indications',           // Indications and Usage
  '34068-7': 'dosage',                // Dosage and Administration
  '43685-7': 'warnings',              // Warnings and Precautions
  '34071-1': 'warnings',              // Warnings (alternative)
  '34084-4': 'adverse_reactions',     // Adverse Reactions
  '34073-7': 'drug_interactions',     // Drug Interactions
  '34090-1': 'clinical_pharmacology', // Clinical Pharmacology
  '34069-5': 'how_supplied',          // How Supplied
  '34070-3': 'contraindications',     // Contraindications
};

/**
 * Get detailed SPL information by SET ID - FIXED: Now fetches and parses full SPL XML
 */
export async function getDailyMedSPLDetails(setid: string): Promise<DailyMedDrugInfo | null> {
  try {
    const headers: Record<string, string> = {
      'User-Agent': 'OpenWork-AI/1.0 (Medical Evidence System)',
    };

    // Step 1: Fetch the full SPL XML document
    const splXmlUrl = `https://dailymed.nlm.nih.gov/dailymed/services/v2/spls/${setid}.xml`;
    console.log(`📄 Fetching SPL XML for ${setid}...`);

    const xmlResponse = await fetch(splXmlUrl, { headers });

    if (!xmlResponse.ok) {
      console.warn(`⚠️ DailyMed SPL XML fetch failed for ${setid}: ${xmlResponse.status}`);
      return null;
    }

    const xmlText = await xmlResponse.text();

    // Step 2: Parse LOINC-coded sections from SPL XML
    const sections = parseSPLSections(xmlText);

    // Step 3: Extract metadata from XML
    const titleMatch = xmlText.match(/<title[^>]*>([^<]+)<\/title>/i);
    const dateMatch = xmlText.match(/<effectiveTime[^>]*value="(\d{8})"/i);

    const publishedDate = dateMatch
      ? `${dateMatch[1].substring(0, 4)}-${dateMatch[1].substring(4, 6)}-${dateMatch[1].substring(6, 8)}`
      : '';

    // Step 4: Get NDC codes separately (quick API call)
    let ndcCodes: string[] = [];
    try {
      const ndcUrl = `https://dailymed.nlm.nih.gov/dailymed/services/v2/spls/${setid}/ndcs.json`;
      const ndcResponse = await fetch(ndcUrl, { headers });
      if (ndcResponse.ok) {
        const ndcData = await ndcResponse.json();
        ndcCodes = ndcData.data?.ndcs?.map((ndc: any) => ndc.ndc) || [];
      }
    } catch (e) {
    // NDC fetch failed, continue without
    }

    const title = titleMatch ? titleMatch[1].trim() : 'Unknown Drug';

    const drugInfo: DailyMedDrugInfo = {
      setid: setid,
      title: title,
      published_date: publishedDate,
      active_ingredients: extractActiveIngredientsFromTitle(title),
      dosage_form: extractDosageFormFromTitle(title),
      route: extractRouteFromTitle(title),
      manufacturer: extractManufacturerFromTitle(title),
      ndc_codes: ndcCodes,
      indications: sections.indications || '',
      contraindications: sections.contraindications || '',
      warnings: sections.warnings || '',
      dosage: sections.dosage || '',
      adverse_reactions: sections.adverse_reactions || '',
      drug_interactions: sections.drug_interactions || '',
      clinical_pharmacology: sections.clinical_pharmacology || '',
      how_supplied: sections.how_supplied || (ndcCodes.length > 0 ? `NDC: ${ndcCodes.join(', ')}` : ''),
    };

    // Log success with section counts
    const filledSections = Object.entries(sections).filter(([_, v]) => v && v.length > 0).length;
    console.log(`✅ SPL parsed: ${filledSections} sections extracted for ${setid}`);

    return drugInfo;

  } catch (error: any) {
    console.error(`❌ DailyMed SPL details error for ${setid}:`, error.message);
    return null;
  }
}

/**
 * Parse LOINC-coded sections from SPL XML
 */
function parseSPLSections(xmlText: string): Record<string, string> {
  const sections: Record<string, string> = {
    indications: '',
    contraindications: '',
    warnings: '',
    dosage: '',
    adverse_reactions: '',
    drug_interactions: '',
    clinical_pharmacology: '',
    how_supplied: '',
  };

  // Find all component sections with LOINC codes
  // Pattern: <code code="XXXXX-X" codeSystem="2.16.840.1.113883.6.1"/>
  for (const [loincCode, sectionName] of Object.entries(LOINC_SECTION_CODES)) {
    try {
      // Find section with this LOINC code
      const sectionPattern = new RegExp(
        `<code[^>]*code="${loincCode}"[^>]*>.*?</code>.*?<text[^>]*>(.*?)</text>`,
        'is'
      );

      const match = xmlText.match(sectionPattern);

      if (match && match[1]) {
        // Clean up XML/HTML content
        let content = match[1]
          .replace(/<[^>]+>/g, ' ')           // Remove XML tags
          .replace(/&lt;/g, '<')              // Decode entities
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/\s+/g, ' ')               // Normalize whitespace
          .trim();

        // Limit content length (2000 chars max per section)
        if (content.length > 2000) {
          content = content.substring(0, 2000) + '...';
        }

        // Only set if we got meaningful content (>50 chars)
        if (content.length > 50) {
          // If section already has content (e.g., warnings from multiple LOINC codes), append
          if (sections[sectionName] && sections[sectionName].length > 0) {
            sections[sectionName] += '\n\n' + content;
          } else {
            sections[sectionName] = content;
          }
        }
      }
    } catch (e) {
      // Continue to next section on error
    }
  }

  // Alternative parsing: Look for section titles if LOINC parsing missed them
  if (!sections.indications) {
    sections.indications = extractSectionByTitle(xmlText, ['INDICATIONS AND USAGE', 'INDICATIONS']);
  }
  if (!sections.warnings) {
    sections.warnings = extractSectionByTitle(xmlText, ['WARNINGS AND PRECAUTIONS', 'WARNINGS']);
  }
  if (!sections.adverse_reactions) {
    sections.adverse_reactions = extractSectionByTitle(xmlText, ['ADVERSE REACTIONS']);
  }
  if (!sections.drug_interactions) {
    sections.drug_interactions = extractSectionByTitle(xmlText, ['DRUG INTERACTIONS']);
  }
  if (!sections.dosage) {
    sections.dosage = extractSectionByTitle(xmlText, ['DOSAGE AND ADMINISTRATION']);
  }
  if (!sections.contraindications) {
    sections.contraindications = extractSectionByTitle(xmlText, ['CONTRAINDICATIONS']);
  }

  return sections;
}

/**
 * Extract section content by title (fallback when LOINC parsing fails)
 */
function extractSectionByTitle(xmlText: string, titleVariants: string[]): string {
  for (const title of titleVariants) {
    try {
      // Look for title element followed by text content
      const pattern = new RegExp(
        `<title[^>]*>${title}</title>.*?<text[^>]*>(.*?)</text>`,
        'is'
      );

      const match = xmlText.match(pattern);

      if (match && match[1]) {
        let content = match[1]
          .replace(/<[^>]+>/g, ' ')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/\s+/g, ' ')
          .trim();

        if (content.length > 2000) {
          content = content.substring(0, 2000) + '...';
        }

        if (content.length > 50) {
          return content;
        }
      }
    } catch (e) {
      // Continue to next variant
    }
  }
  return '';
}

/**
 * Extract active ingredients from title (simplified approach)
 */
function extractActiveIngredientsFromTitle(title: string): string[] {
  if (!title) return [];

  // Look for ingredients in parentheses or before dosage form
  const ingredientMatch = title.match(/\(([^)]+)\)/);
  if (ingredientMatch) {
    return [ingredientMatch[1].trim()];
  }

  // Extract from the beginning of the title
  const words = title.split(' ');
  if (words.length > 0) {
    return [words[0]];
  }

  return [];
}

/**
 * Extract dosage form from title
 */
function extractDosageFormFromTitle(title: string): string {
  if (!title) return 'Unknown';

  const forms = ['TABLET', 'CAPSULE', 'INJECTION', 'CREAM', 'OINTMENT', 'SOLUTION', 'SUSPENSION', 'PATCH', 'GEL', 'LOTION'];
  const upperTitle = title.toUpperCase();

  for (const form of forms) {
    if (upperTitle.includes(form)) {
      return form.toLowerCase();
    }
  }

  return 'Unknown';
}

/**
 * Extract route from title
 */
function extractRouteFromTitle(title: string): string {
  if (!title) return 'Unknown';

  const upperTitle = title.toUpperCase();

  if (upperTitle.includes('TABLET') || upperTitle.includes('CAPSULE')) return 'Oral';
  if (upperTitle.includes('INJECTION')) return 'Injectable';
  if (upperTitle.includes('CREAM') || upperTitle.includes('OINTMENT') || upperTitle.includes('GEL')) return 'Topical';
  if (upperTitle.includes('PATCH')) return 'Transdermal';

  return 'Unknown';
}

/**
 * Extract manufacturer from title
 */
function extractManufacturerFromTitle(title: string): string {
  if (!title) return 'Unknown';

  // Manufacturer is typically in brackets at the end
  const manufacturerMatch = title.match(/\[([^\]]+)\]$/);
  return manufacturerMatch ? manufacturerMatch[1] : 'Unknown';
}

/**
 * Format DailyMed results for evidence system
 */
export function formatDailyMedForEvidence(drugs: DailyMedDrug[]): string {
  if (drugs.length === 0) return '';

  let formatted = '\n--- DAILYMED FDA DRUG INFORMATION ---\n\n';

  drugs.forEach((drug, index) => {
    formatted += `**${index + 1}. ${drug.title}**\n`;
    formatted += `Published: ${drug.publishedDate}\n`;
    formatted += `Manufacturer: ${drug.manufacturer}\n`;

    if (drug.activeIngredients.length > 0) {
      formatted += `Active Ingredients: ${drug.activeIngredients.join(', ')}\n`;
    }

    formatted += `Dosage Form: ${drug.dosageForm}\n`;
    formatted += `Route: ${drug.route}\n`;

    if (drug.ndcCodes.length > 0) {
      formatted += `NDC Codes: ${drug.ndcCodes.slice(0, 3).join(', ')}${drug.ndcCodes.length > 3 ? '...' : ''}\n`;
    }

    if (drug.genericName) {
      formatted += `Generic Name: ${drug.genericName}\n`;
    }

    if (drug.brandName) {
      formatted += `Brand Name: ${drug.brandName}\n`;
    }

    if (drug.indications) {
      formatted += `\n**Indications:**\n${drug.indications.substring(0, 500)}${drug.indications.length > 500 ? '...' : ''}\n`;
    }

    if (drug.contraindications) {
      formatted += `\n**Contraindications:**\n${drug.contraindications.substring(0, 300)}${drug.contraindications.length > 300 ? '...' : ''}\n`;
    }

    if (drug.warnings) {
      formatted += `\n**Warnings:**\n${drug.warnings.substring(0, 400)}${drug.warnings.length > 400 ? '...' : ''}\n`;
    }

    if (drug.dosage) {
      formatted += `\n**Dosage:**\n${drug.dosage.substring(0, 400)}${drug.dosage.length > 400 ? '...' : ''}\n`;
    }

    if (drug.drugInteractions) {
      formatted += `\n**Drug Interactions:**\n${drug.drugInteractions.substring(0, 400)}${drug.drugInteractions.length > 400 ? '...' : ''}\n`;
    }

    formatted += `\nDailyMed SET ID: ${drug.setId}\n`;
    formatted += `URL: https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=${drug.setId}\n\n`;
  });

  formatted += '--- END DAILYMED INFORMATION ---\n\n';

  return formatted;
}

/**
 * Search for drug interactions using DailyMed
 */
export async function searchDailyMedInteractions(drugNames: string[]): Promise<string> {
  if (drugNames.length === 0) return '';

  console.log(`🔍 DailyMed: Searching interactions for ${drugNames.length} drugs`);

  const interactionInfo: string[] = [];

  for (const drugName of drugNames.slice(0, 3)) { // Limit to 3 drugs to avoid rate limits
    try {
      const drugInfo = await searchDailyMedByName(drugName, 2);

      for (const drug of drugInfo) {
        if (drug.drug_interactions) {
          interactionInfo.push(`**${drug.title}:**\n${drug.drug_interactions.substring(0, 600)}${drug.drug_interactions.length > 600 ? '...' : ''}`);
        }
      }
    } catch (error) {
      console.warn(`⚠️ Could not get DailyMed interactions for ${drugName}`);
    }
  }

  if (interactionInfo.length === 0) return '';

  return `\n--- DAILYMED DRUG INTERACTIONS ---\n\n${interactionInfo.join('\n\n')}\n\n--- END INTERACTIONS ---\n\n`;
}

/**
 * Get comprehensive drug information for evidence system
 */
export async function getDailyMedDrugEvidence(drugNames: string[]): Promise<string> {
  if (drugNames.length === 0) return '';

  console.log(`🔍 DailyMed: Getting evidence for ${drugNames.length} drugs`);

  const allDrugInfo: DailyMedDrugInfo[] = [];

  for (const drugName of drugNames.slice(0, 5)) { // Limit to 5 drugs
    try {
      const drugInfo = await searchDailyMedByName(drugName, 2);
      allDrugInfo.push(...drugInfo);
    } catch (error) {
      console.warn(`⚠️ Could not get DailyMed info for ${drugName}`);
    }
  }

  // Convert to expected format
  const convertedDrugs = allDrugInfo.map(convertToDailyMedDrug);

  return formatDailyMedForEvidence(convertedDrugs);
}