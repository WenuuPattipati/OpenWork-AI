/**
 * OMIM (Online Mendelian Inheritance in Man) API Integration
 * 
 * OMIM is the authoritative database of human genes and genetic disorders
 * Essential for rare diseases, genetic conditions, and gene-disease relationships
 * 
 * Official API: https://omim.org/api
 * Note: Requires API key from OMIM
 */

const OMIM_API_BASE = "https://api.omim.org/api";
const OMIM_API_KEY = process.env.OMIM_API_KEY || "";

export interface OMIMEntry {
  mimNumber: string;
  title: string;
  alternativeTitles?: string[];
  textSections?: {
    textSectionName: string;
    textSectionContent: string;
  }[];
  phenotypeMap?: {
    phenotype: string;
    phenotypeMimNumber: string;
    phenotypeMapping: string;
    gene: string;
    geneSymbol: string;
  }[];
  geneMap?: {
    chromosome: string;
    geneSymbol: string;
    geneName: string;
    approvedSymbol: string;
  };
  clinicalSynopsis?: Record<string, string[]>;
  url: string;
  source: "OMIM";
}

/**
 * Search OMIM database
 */
export async function searchOMIM(
  query: string,
  maxResults: number = 5
): Promise<OMIMEntry[]> {
  if (!OMIM_API_KEY) {
    console.log("⚠️  OMIM API key not configured, skipping OMIM search");
    return [];
  }

  try {
    console.log(`🧬 Searching OMIM: "${query}"`);
    
    // OMIM API search endpoint
    const params = new URLSearchParams({
      search: query,
      start: "0",
      limit: maxResults.toString(),
      format: "json",
      apiKey: OMIM_API_KEY,
    });

    const url = `${OMIM_API_BASE}/entry/search?${params}`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(`OMIM API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    
    if (!data.omim?.searchResponse?.entryList) {
      console.log("⚠️  No OMIM entries found");
      return [];
    }

    const entries = data.omim.searchResponse.entryList;
    console.log(`✅ Found ${entries.length} OMIM entries`);

    // Fetch detailed information for each entry
    return fetchOMIMDetails(entries.map((e: any) => e.entry.mimNumber));
  } catch (error: any) {
    console.error("Error searching OMIM:", error.message);
    return [];
  }
}

/**
 * Fetch detailed OMIM entry information
 */
async function fetchOMIMDetails(mimNumbers: string[]): Promise<OMIMEntry[]> {
  if (mimNumbers.length === 0 || !OMIM_API_KEY) return [];

  try {
    const params = new URLSearchParams({
      mimNumber: mimNumbers.join(","),
      include: "text:description,clinicalSynopsis,geneMap,phenotypeMap",
      format: "json",
      apiKey: OMIM_API_KEY,
    });

    const url = `${OMIM_API_BASE}/entry?${params}`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(`OMIM details API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    
    if (!data.omim?.entryList) {
      return [];
    }

    const entries: OMIMEntry[] = [];

    for (const entryData of data.omim.entryList) {
      const entry = entryData.entry;
      
      entries.push({
        mimNumber: entry.mimNumber,
        title: entry.titles?.preferredTitle || "",
        alternativeTitles: entry.titles?.alternativeTitles?.map((t: any) => t.title),
        textSections: entry.textSectionList?.map((section: any) => ({
          textSectionName: section.textSection.textSectionName,
          textSectionContent: section.textSection.textSectionContent?.substring(0, 500) + "...",
        })),
        phenotypeMap: entry.phenotypeMapList?.map((pm: any) => ({
          phenotype: pm.phenotypeMap.phenotype,
          phenotypeMimNumber: pm.phenotypeMap.phenotypeMimNumber,
          phenotypeMapping: pm.phenotypeMap.phenotypeMapping,
          gene: pm.phenotypeMap.gene,
          geneSymbol: pm.phenotypeMap.geneSymbol,
        })),
        geneMap: entry.geneMap ? {
          chromosome: entry.geneMap.chromosome,
          geneSymbol: entry.geneMap.geneSymbol,
          geneName: entry.geneMap.geneName,
          approvedSymbol: entry.geneMap.approvedSymbol,
        } : undefined,
        clinicalSynopsis: entry.clinicalSynopsis,
        url: `https://omim.org/entry/${entry.mimNumber}`,
        source: "OMIM",
      });
    }

    return entries;
  } catch (error: any) {
    console.error("Error fetching OMIM details:", error.message);
    return [];
  }
}

/**
 * Search OMIM by gene symbol
 */
export async function searchOMIMByGene(
  geneSymbol: string,
  maxResults: number = 3
): Promise<OMIMEntry[]> {
  if (!OMIM_API_KEY) {
    return [];
  }

  try {
    console.log(`🧬 Searching OMIM by gene: ${geneSymbol}`);
    
    const query = `${geneSymbol}[gene]`;
    return searchOMIM(query, maxResults);
  } catch (error: any) {
    console.error("Error searching OMIM by gene:", error.message);
    return [];
  }
}

/**
 * Search OMIM by phenotype/condition
 */
export async function searchOMIMByPhenotype(
  phenotype: string,
  maxResults: number = 3
): Promise<OMIMEntry[]> {
  if (!OMIM_API_KEY) {
    return [];
  }

  try {
    console.log(`🧬 Searching OMIM by phenotype: ${phenotype}`);
    
    const query = `${phenotype}[phenotype]`;
    return searchOMIM(query, maxResults);
  } catch (error: any) {
    console.error("Error searching OMIM by phenotype:", error.message);
    return [];
  }
}

/**
 * Format OMIM entries for prompt
 */
export function formatOMIMForPrompt(entries: OMIMEntry[]): string {
  if (entries.length === 0) return "";

  let formatted = "## ZONE 26: OMIM (Genetic Disorders Database)\n";
  formatted += "**Authoritative database of human genes and genetic disorders**\n\n";

  entries.forEach((entry, i) => {
    formatted += `${i + 1}. **${entry.title}** (MIM: ${entry.mimNumber})\n`;
    formatted += `   SOURCE: OMIM | URL: ${entry.url}\n`;
    
    if (entry.geneMap) {
      formatted += `   Gene: ${entry.geneMap.geneSymbol} (${entry.geneMap.geneName})\n`;
      formatted += `   Chromosome: ${entry.geneMap.chromosome}\n`;
    }
    
    if (entry.phenotypeMap && entry.phenotypeMap.length > 0) {
      formatted += `   Associated Phenotypes:\n`;
      entry.phenotypeMap.slice(0, 3).forEach(pm => {
        formatted += `   - ${pm.phenotype} (${pm.phenotypeMapping})\n`;
      });
    }
    
    if (entry.textSections && entry.textSections.length > 0) {
      const description = entry.textSections.find(s => s.textSectionName === "description");
      if (description) {
        formatted += `   Description: ${description.textSectionContent}\n`;
      }
    }
    
    if (entry.clinicalSynopsis) {
      formatted += `   Clinical Features: Available in OMIM database\n`;
    }
    
    formatted += "\n";
  });

  return formatted;
}

/**
 * Check if query is likely genetic/rare disease related
 */
export function isGeneticQuery(query: string): boolean {
  const queryLower = query.toLowerCase();
  
  const geneticKeywords = [
    'genetic', 'gene', 'mutation', 'inherited', 'hereditary', 'familial',
    'syndrome', 'disorder', 'rare disease', 'congenital', 'chromosomal',
    'dna', 'variant', 'allele', 'genotype', 'phenotype', 'pedigree',
    'brca', 'cftr', 'huntington', 'marfan', 'sickle cell', 'thalassemia',
    'hemophilia', 'duchenne', 'fragile x', 'down syndrome', 'turner syndrome'
  ];
  
  return geneticKeywords.some(keyword => queryLower.includes(keyword));
}
