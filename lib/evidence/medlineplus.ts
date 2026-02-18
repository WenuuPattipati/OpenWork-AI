/**
 * MedlinePlus API Integration
 * Official documentation: https://medlineplus.gov/about/developers/webservices/
 * 
 * MedlinePlus is the National Library of Medicine's consumer health information service
 * 
 * Key Features:
 * - Consumer-friendly health information
 * - Drug information from ASHP
 * - Health topics with summaries
 * - No API key required
 * - Rate limit: 85 requests/minute per IP
 * - Free and open access
 * 
 * APIs Used:
 * - Web Service API: https://wsearch.nlm.nih.gov/ws/query
 * - MedlinePlus Connect: https://connect.medlineplus.gov/service
 */

const MEDLINEPLUS_SEARCH_BASE = "https://wsearch.nlm.nih.gov/ws/query";
const MEDLINEPLUS_CONNECT_BASE = "https://connect.medlineplus.gov/service";
const USER_EMAIL = process.env.MEDLINEPLUS_EMAIL || "wenuupattipati@gmail.com";

export interface MedlinePlusHealthTopic {
  title: string;
  url: string;
  language: string;
  snippet?: string;
  groupName?: string;
}

export interface MedlinePlusDrugInfo {
  title: string;
  url: string;
  snippet?: string;
}

export interface MedlinePlusResult {
  healthTopics: MedlinePlusHealthTopic[];
  drugInfo: MedlinePlusDrugInfo[];
  totalResults: number;
}

/**
 * Helper function to retry API calls with exponential backoff
 */
async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'OpenWork-AI (mailto:wenuupattipati@gmail.com)',
        },
      });
      
      // If rate limited (429) or server error (500), retry with backoff
      if (response.status === 429 || response.status >= 500) {
        if (i === retries - 1) return response;
        
        const waitTime = Math.pow(2, i) * 1000 + Math.random() * 1000;
        console.warn(`MedlinePlus API ${response.status}, retrying in ${Math.round(waitTime)}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      
      const waitTime = Math.pow(2, i) * 1000 + Math.random() * 1000;
      console.warn(`MedlinePlus API error, retrying in ${Math.round(waitTime)}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw new Error("MedlinePlus API failed after retries");
}

/**
 * Search MedlinePlus for health topics using Web Service API
 * Docs: https://medlineplus.gov/about/developers/webservices/
 * Returns consumer-friendly health information with summaries
 */
export async function searchMedlinePlus(
  query: string,
  maxResults: number = 5
): Promise<MedlinePlusResult> {
  try {
    // Use MedlinePlus Web Service API for health topics
    const params = new URLSearchParams({
      db: "healthTopics",
      term: query,
      retmax: maxResults.toString(),
      rettype: "brief", // Get brief format with snippets
      tool: "OpenWork-AI",
      email: USER_EMAIL,
    });
    
    const url = `${MEDLINEPLUS_SEARCH_BASE}?${params}`;
    
    const response = await fetchWithRetry(url);
    
    if (!response.ok) {
      console.error("MedlinePlus search error:", response.status);
      return { healthTopics: [], drugInfo: [], totalResults: 0 };
    }
    
    const xmlText = await response.text();
    const healthTopics = parseMedlinePlusXML(xmlText);
    
    return {
      healthTopics,
      drugInfo: [],
      totalResults: healthTopics.length,
    };
  } catch (error) {
    console.error("Error searching MedlinePlus:", error);
    return { healthTopics: [], drugInfo: [], totalResults: 0 };
  }
}

/**
 * Parse MedlinePlus XML response
 * Extracts health topics with titles, URLs, and snippets
 */
function parseMedlinePlusXML(xml: string): MedlinePlusHealthTopic[] {
  const topics: MedlinePlusHealthTopic[] = [];
  
  try {
    // Match all document tags with their content
    const documentRegex = /<document[^>]*rank="(\d+)"[^>]*url="([^"]+)"[^>]*>([\s\S]*?)<\/document>/g;
    let match;
    
    while ((match = documentRegex.exec(xml)) !== null) {
      const [, rank, url, content] = match;
      
      // Extract title (remove HTML tags like <span>)
      const titleMatch = content.match(/<content name="title">(.+?)<\/content>/);
      const titleRaw = titleMatch ? titleMatch[1] : "";
      const title = titleRaw.replace(/<[^>]+>/g, "").trim();
      
      // Extract snippet (remove HTML tags)
      const snippetMatch = content.match(/<content name="snippet">(.+?)<\/content>/);
      const snippetRaw = snippetMatch ? snippetMatch[1] : "";
      const snippet = snippetRaw.replace(/<[^>]+>/g, "").trim().substring(0, 200);
      
      // Extract first group name
      const groupMatch = content.match(/<content name="groupName">(.+?)<\/content>/);
      const groupRaw = groupMatch ? groupMatch[1] : "";
      const groupName = groupRaw.replace(/<[^>]+>/g, "").trim();
      
      if (title && url) {
        topics.push({
          title,
          url,
          language: "en",
          snippet: snippet || undefined,
          groupName: groupName || undefined,
        });
      }
    }
  } catch (error) {
    console.error("Error parsing MedlinePlus XML:", error);
  }
  
  return topics;
}

/**
 * Search MedlinePlus for drug information using MedlinePlus Connect
 * Docs: https://medlineplus.gov/medlineplus-connect/
 * Returns AHFS Consumer Medication Information
 */
export async function searchMedlinePlusDrugs(
  drugName: string
): Promise<MedlinePlusDrugInfo[]> {
  try {
    // MedlinePlus Connect API for drug information
    // Uses drug name directly (will be mapped to RxNorm internally)
    const params = new URLSearchParams({
      "mainSearchCriteria.v.cs": "2.16.840.1.113883.6.88", // RxNorm code system
      "mainSearchCriteria.v.dn": drugName, // Drug name
      "knowledgeResponseType": "application/json",
    });
    
    const url = `${MEDLINEPLUS_CONNECT_BASE}?${params}`;
    
    const response = await fetchWithRetry(url);
    
    if (!response.ok) {
      console.error("MedlinePlus drug search error:", response.status);
      return [];
    }
    
    const data = await response.json();
    
    const drugInfo: MedlinePlusDrugInfo[] = [];
    
    // Parse drug information from response
    if (data.feed && data.feed.entry) {
      const entries = Array.isArray(data.feed.entry) ? data.feed.entry : [data.feed.entry];
      
      entries.forEach((entry: any) => {
        if (entry.link && entry.link.length > 0) {
          const drug: MedlinePlusDrugInfo = {
            title: entry.title?._value || entry.title || "",
            url: entry.link[0].href || "",
            snippet: entry.summary?._value || entry.summary || undefined,
          };
          
          drugInfo.push(drug);
        }
      });
    }
    
    return drugInfo;
  } catch (error) {
    console.error("Error searching MedlinePlus drugs:", error);
    return [];
  }
}

/**
 * Get comprehensive MedlinePlus information
 * Searches both health topics and drug information
 */
export async function comprehensiveMedlinePlusSearch(
  query: string,
  drugNames: string[] = []
): Promise<MedlinePlusResult> {
  try {
    // Search health topics
    const healthTopicsResult = await searchMedlinePlus(query, 5);
    
    // Search drug information if drug names provided
    let allDrugInfo: MedlinePlusDrugInfo[] = [];
    
    if (drugNames.length > 0) {
      const drugSearches = await Promise.all(
        drugNames.map(drug => searchMedlinePlusDrugs(drug))
      );
      
      allDrugInfo = drugSearches.flat();
    }
    
    return {
      healthTopics: healthTopicsResult.healthTopics,
      drugInfo: allDrugInfo,
      totalResults: healthTopicsResult.healthTopics.length + allDrugInfo.length,
    };
  } catch (error) {
    console.error("Error in comprehensive MedlinePlus search:", error);
    return { healthTopics: [], drugInfo: [], totalResults: 0 };
  }
}

/**
 * Format MedlinePlus results for AI prompt
 * Provides consumer-friendly context
 */
export function formatMedlinePlusForPrompt(result: MedlinePlusResult): string {
  if (result.totalResults === 0) {
    return "";
  }
  
  let formatted = "\n\n--- CONSUMER HEALTH INFORMATION (MedlinePlus/NLM) ---\n\n";
  
  // Health Topics
  if (result.healthTopics.length > 0) {
    formatted += "**HEALTH TOPICS (Consumer-Friendly):**\n";
    result.healthTopics.forEach((topic, i) => {
      formatted += `${i + 1}. ${topic.title}\n`;
      if (topic.snippet) formatted += `   ${topic.snippet}\n`;
      if (topic.groupName) formatted += `   Category: ${topic.groupName}\n`;
      formatted += `   URL: ${topic.url}\n\n`;
    });
  }
  
  // Drug Information
  if (result.drugInfo.length > 0) {
    formatted += "**DRUG INFORMATION (Consumer-Friendly):**\n";
    result.drugInfo.forEach((drug, i) => {
      formatted += `${i + 1}. ${drug.title}\n`;
      if (drug.snippet) formatted += `   ${drug.snippet}\n`;
      formatted += `   URL: ${drug.url}\n\n`;
    });
  }
  
  formatted += "--- END CONSUMER HEALTH INFORMATION ---\n\n";
  formatted += "NOTE: MedlinePlus provides consumer-friendly explanations. Use this to understand patient perspective and provide accessible explanations.\n\n";
  
  return formatted;
}
