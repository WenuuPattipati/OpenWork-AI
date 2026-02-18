/**
 * Europe PMC RESTful API Integration
 * Official documentation: https://europepmc.org/RestfulWebService
 * 
 * Features:
 * - Access to 40+ million abstracts (PubMed and others, 37.8M)
 * - Includes preprints (bioRxiv, medRxiv, etc.)
 * - Metadata for all full text articles (6.4M)
 * - All OA articles (3.2M)
 * - No API key required for basic usage
 * - Supports advanced queries and field search
 * 
 * Note: Using RESTful API (not SOAP) for better JSON support
 * Sort by date uses query syntax: "query sort_date:y"
 */

import { getCachedEvidence, cacheEvidence } from './cache-manager';

const EUROPEPMC_BASE = "https://www.ebi.ac.uk/europepmc/webservices/rest";

export interface EuropePMCArticle {
  id: string;
  source: string; // MED (PubMed), PMC, PPR (preprint), etc.
  pmid?: string;
  pmcid?: string;
  doi?: string;
  title: string;
  authorString?: string;
  journalTitle?: string;
  pubYear?: string;
  pubType?: string;
  isOpenAccess?: string;
  inEPMC?: string;
  inPMC?: string;
  hasPDF?: string;
  hasBook?: string;
  citedByCount?: number;
  abstractText?: string;
  firstPublicationDate?: string;
}

export interface EuropePMCSearchResult {
  hitCount: number;
  articles: EuropePMCArticle[];
  nextCursorMark?: string;
}

/**
 * Search Europe PMC
 * @param query - Search query (supports field search like AUTH:"smith" TITLE:"cancer")
 * @param options - Search options
 */
export async function searchEuropePMC(
  query: string,
  options: {
    pageSize?: number;
    cursorMark?: string;
    sort?: "relevance" | "date" | "cited";
    resultType?: "core" | "lite" | "idlist";
    synonym?: boolean;
  } = {}
): Promise<EuropePMCSearchResult> {
  try {
    const {
      pageSize = 25,
      cursorMark = "*",
      sort = "relevance",
      resultType = "core",
      synonym = true,
    } = options;

    // Build query with sort if needed
    let finalQuery = query;
    if (sort === "date") {
      finalQuery = `${query} sort_date:y`;
    }
    
    const params = new URLSearchParams({
      query: finalQuery,
      pageSize: pageSize.toString(),
      cursorMark,
      resultType,
      synonym: synonym.toString(),
      format: "json",
    });

    const url = `${EUROPEPMC_BASE}/search?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error("Europe PMC search error:", response.status);
      return { hitCount: 0, articles: [] };
    }

    const data = await response.json();
    
    return {
      hitCount: data.hitCount || 0,
      articles: (data.resultList?.result || []).map(mapArticle),
      nextCursorMark: data.nextCursorMark,
    };
  } catch (error) {
    console.error("Error searching Europe PMC:", error);
    return { hitCount: 0, articles: [] };
  }
}

/**
 * Search for COVID-19 related articles
 * Uses the comprehensive query from the provided URL
 */
export async function searchCOVID19(
  pageSize: number = 25
): Promise<EuropePMCSearchResult> {
  const covidQuery = `"2019-nCoV" OR "2019nCoV" OR "COVID-19" OR "SARS-CoV-2" OR ("wuhan" AND "coronavirus") OR "Coronavirus" OR "Corona virus" OR "corona-virus" OR "corona viruses" OR "coronaviruses" OR "SARS-CoV" OR "Orthocoronavirinae" OR "MERS-CoV" OR "Severe Acute Respiratory Syndrome" OR "Middle East Respiratory Syndrome" OR ("SARS" AND "virus") OR "soluble ACE2" OR ("ACE2" AND "virus") OR ("ARDS" AND "virus") OR ("angiotensin-converting enzyme 2" AND "virus")`;
  
  return searchEuropePMC(covidQuery, { pageSize, sort: "date" });
}

/**
 * Search for recent articles (sorted by date)
 */
export async function searchRecent(
  query: string,
  pageSize: number = 25
): Promise<EuropePMCSearchResult> {
  return searchEuropePMC(query, { pageSize, sort: "date" });
}

/**
 * Search for highly cited articles
 */
export async function searchHighlyCited(
  query: string,
  pageSize: number = 25
): Promise<EuropePMCSearchResult> {
  return searchEuropePMC(query, { pageSize, sort: "cited" });
}

/**
 * Search for open access articles only
 */
export async function searchOpenAccess(
  query: string,
  pageSize: number = 25
): Promise<EuropePMCSearchResult> {
  const openAccessQuery = `${query} AND OPEN_ACCESS:Y`;
  return searchEuropePMC(openAccessQuery, { pageSize });
}

/**
 * Search for preprints only
 */
export async function searchPreprints(
  query: string,
  pageSize: number = 25
): Promise<EuropePMCSearchResult> {
  const preprintQuery = `${query} AND SRC:PPR`;
  return searchEuropePMC(preprintQuery, { pageSize, sort: "date" });
}

/**
 * Get article by ID (PMID, PMCID, or DOI)
 * Uses search endpoint since direct article endpoint may not always work
 */
export async function getArticleById(
  id: string,
  source: "med" | "pmc" | "ppr" | "doi" = "med"
): Promise<EuropePMCArticle | null> {
  try {
    // Build query based on source type
    let query = "";
    if (source === "med") {
      query = `EXT_ID:${id}`;
    } else if (source === "pmc") {
      query = `PMCID:${id}`;
    } else if (source === "doi") {
      query = `DOI:"${id}"`;
    } else {
      query = id;
    }
    
    const result = await searchEuropePMC(query, { pageSize: 1, resultType: "core" });
    return result.articles.length > 0 ? result.articles[0] : null;
  } catch (error) {
    console.error("Error getting article from Europe PMC:", error);
    return null;
  }
}

/**
 * Get citations for an article
 */
export async function getCitations(
  id: string,
  source: "med" | "pmc" = "med",
  pageSize: number = 25
): Promise<EuropePMCSearchResult> {
  try {
    const params = new URLSearchParams({
      format: "json",
      pageSize: pageSize.toString(),
    });

    const url = `${EUROPEPMC_BASE}/${source}/${id}/citations?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error("Europe PMC citations error:", response.status);
      return { hitCount: 0, articles: [] };
    }

    const data = await response.json();

    return {
      hitCount: data.hitCount || 0,
      articles: (data.citationList?.citation || []).map(mapArticle),
    };
  } catch (error) {
    console.error("Error getting citations from Europe PMC:", error);
    return { hitCount: 0, articles: [] };
  }
}

/**
 * Get references for an article
 */
export async function getReferences(
  id: string,
  source: "med" | "pmc" = "med",
  pageSize: number = 25
): Promise<EuropePMCSearchResult> {
  try {
    const params = new URLSearchParams({
      format: "json",
      pageSize: pageSize.toString(),
    });

    const url = `${EUROPEPMC_BASE}/${source}/${id}/references?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error("Europe PMC references error:", response.status);
      return { hitCount: 0, articles: [] };
    }

    const data = await response.json();

    return {
      hitCount: data.hitCount || 0,
      articles: (data.referenceList?.reference || []).map(mapArticle),
    };
  } catch (error) {
    console.error("Error getting references from Europe PMC:", error);
    return { hitCount: 0, articles: [] };
  }
}

/**
 * Map Europe PMC API response to our article format
 */
function mapArticle(article: any): EuropePMCArticle {
  return {
    id: article.id,
    source: article.source,
    pmid: article.pmid,
    pmcid: article.pmcid,
    doi: article.doi,
    title: article.title || "",
    authorString: article.authorString,
    journalTitle: article.journalTitle || article.bookOrReportDetails?.publisher,
    pubYear: article.pubYear,
    pubType: article.pubType,
    isOpenAccess: article.isOpenAccess,
    inEPMC: article.inEPMC,
    inPMC: article.inPMC,
    hasPDF: article.hasPDF,
    hasBook: article.hasBook,
    citedByCount: article.citedByCount,
    abstractText: article.abstractText,
    firstPublicationDate: article.firstPublicationDate,
  };
}

/**
 * Comprehensive search combining multiple sources
 * NOW WITH CACHING: Checks Redis cache before hitting Europe PMC API
 */
export async function comprehensiveSearch(
  query: string
): Promise<{
  recent: EuropePMCArticle[];
  cited: EuropePMCArticle[];
  preprints: EuropePMCArticle[];
  openAccess: EuropePMCArticle[];
}> {
  // PHASE 1 ENHANCEMENT: Check cache first
  // Error handling: If cache fails, continue with API call (graceful degradation)
  try {
    const cached = await getCachedEvidence<{
      recent: EuropePMCArticle[];
      cited: EuropePMCArticle[];
      preprints: EuropePMCArticle[];
      openAccess: EuropePMCArticle[];
    }>(query, 'europepmc');

    if (cached) {
      console.log(`📬 Using cached Europe PMC results for query`);
      return cached.data;
    }
  } catch (error: any) {
    console.error('❌ Cache read error in Europe PMC, falling back to API:', error.message);
    // Continue to API call
  }

  // Cache miss - fetch from API
  const [recent, cited, preprints, openAccess] = await Promise.all([
    searchRecent(query, 10),
    searchHighlyCited(query, 10),
    searchPreprints(query, 10),
    searchOpenAccess(query, 10),
  ]);

  const result = {
    recent: recent.articles,
    cited: cited.articles,
    preprints: preprints.articles,
    openAccess: openAccess.articles,
  };

  // PHASE 1 ENHANCEMENT: Cache the result
  // Error handling: If caching fails, continue anyway (graceful degradation)
  try {
    await cacheEvidence(query, 'europepmc', result);
  } catch (error: any) {
    console.error('❌ Cache write error in Europe PMC:', error.message);
    // Continue - result is still returned
  }

  return result;
}
