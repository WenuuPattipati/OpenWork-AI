/**
 * NCBI E-utilities (PubMed) API Integration
 * Official documentation: https://www.ncbi.nlm.nih.gov/books/NBK25500/
 * 
 * Rate limits:
 * - Without API key: 3 requests/second
 * - With API key: 10 requests/second
 * 
 * IMPORTANT: Add delays between requests to avoid 429 errors
 */

import { getCachedEvidence, cacheEvidence } from './cache-manager';

const EUTILS_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const API_KEY = process.env.NCBI_API_KEY || "";

// Rate limiting: 350ms delay = ~2.8 req/sec (safe for 3 req/sec limit)
const REQUEST_DELAY = API_KEY ? 100 : 350;

let lastRequestTime = 0;

/**
 * Rate-limited fetch with retry logic
 */
async function fetchWithRateLimit(url: string, retries = 3): Promise<Response> {
  // Enforce rate limit
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < REQUEST_DELAY) {
    await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);

      // Handle rate limiting
      if (response.status === 429) {
        if (i === retries - 1) return response;

        const waitTime = Math.pow(2, i) * 1000 + Math.random() * 1000;
        console.warn(`PubMed rate limited (429), waiting ${Math.round(waitTime)}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      return response;
    } catch (error) {
      if (i === retries - 1) throw error;

      const waitTime = Math.pow(2, i) * 1000;
      console.warn(`PubMed error, retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw new Error("PubMed API failed after retries");
}

export interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  publicationDate: string;
  abstract?: string;
  doi?: string;
  publicationType: string[];
  citationCount?: number;
  meshTerms?: string[];
}

export interface PubMedSearchResult {
  count: number;
  pmids: string[];
  webEnv?: string;
  queryKey?: string;
}

export interface PubMedFilters {
  articleTypes?: ('systematic-review' | 'meta-analysis' | 'rct' | 'guideline' | 'review')[];
  yearsBack?: number; // Last N years
  humansOnly?: boolean;
  freeFullText?: boolean;
  hasAbstract?: boolean;
  clinicalCategory?: 'therapy' | 'diagnosis' | 'etiology' | 'prognosis' | 'clinical_prediction_guides';
  clinicalScope?: 'broad' | 'narrow';
}

/**
 * Build PubMed filter string from options
 * ENHANCED: Now includes 2025/2024/2023 prioritization
 */
function buildFilterString(filters?: PubMedFilters): string {
  if (!filters) return '';

  const filterParts: string[] = [];

  // Single date filter: avoid duplicate. Prefer yearsBack when provided.
  const currentYear = new Date().getFullYear();
  const yearsBack = filters.yearsBack !== undefined ? filters.yearsBack : 15;
  const startYear = currentYear - yearsBack;
  filterParts.push(`${startYear}:${currentYear}[dp]`);

  // Article type filters
  if (filters.articleTypes && filters.articleTypes.length > 0) {
    const typeFilters: string[] = [];
    for (const type of filters.articleTypes) {
      switch (type) {
        case 'systematic-review':
          typeFilters.push('systematic[sb]');
          break;
        case 'meta-analysis':
          typeFilters.push('meta-analysis[pt]');
          break;
        case 'rct':
          typeFilters.push('randomized controlled trial[pt]');
          break;
        case 'guideline':
          typeFilters.push('guideline[pt]');
          break;
        case 'review':
          typeFilters.push('review[pt]');
          break;
      }
    }
    if (typeFilters.length > 0) {
      filterParts.push(`(${typeFilters.join(' OR ')})`);
    }
  }

  // Humans only - STRICT FILTER
  if (filters.humansOnly) {
    // Exclude animal-only studies using set difference logic
    filterParts.push('("Humans"[MeSH Terms] NOT ("Animals"[MeSH Terms] NOT "Humans"[MeSH Terms]))');
  }

  // Clinical Study Categories
  if (filters.clinicalCategory) {
    const categoryMap: Record<string, string> = {
      'therapy': 'therapy',
      'diagnosis': 'diagnosis',
      'etiology': 'etiology',
      'prognosis': 'prognosis',
      'clinical_prediction_guides': 'clinical prediction guides'
    };

    const scopeSuffix = filters.clinicalScope === 'narrow' ? 'narrow' : 'broad';
    const catKey = categoryMap[filters.clinicalCategory];

    if (catKey) {
      if (catKey === 'clinical prediction guides') {
        filterParts.push(`"${catKey}"[Filter]`);
      } else {
        filterParts.push(`"${catKey}_${scopeSuffix}"[Filter]`);
      }
    }
  }

  // Free full text
  if (filters.freeFullText) {
    filterParts.push('free full text[sb]');
  }

  // Has abstract
  if (filters.hasAbstract) {
    filterParts.push('hasabstract');
  }

  return filterParts.length > 0 ? ' AND ' + filterParts.join(' AND ') : '';
}

/**
 * Search PubMed using ESearch with advanced filters
 * Returns PMIDs matching the query
 */
export async function searchPubMed(
  query: string,
  maxResults: number = 20,
  useHistory: boolean = true, // Always default to true now
  filters?: PubMedFilters
): Promise<PubMedSearchResult> {
  try {
    // Apply filters to query
    const filterString = buildFilterString(filters);
    const enhancedQuery = query + filterString;

    console.log(`🔍 PubMed search: "${query}"${filterString ? ` with filters: ${filterString}` : ''}`);

    // STEP 1: ESearch with usehistory=y to get WebEnv/QueryKey (and first batch of IDs if retmax > 0)
    // We set retmax=0 to just get the history pointer first, then fetch in batches
    const params = new URLSearchParams({
      db: "pubmed",
      term: enhancedQuery,
      retmode: "json",
      retmax: "0",
      usehistory: "y",
      sort: "relevance",
      ...(API_KEY && { api_key: API_KEY }),
    });

    const url = `${EUTILS_BASE}/esearch.fcgi?${params}`;
    console.log(`🔍 PubMed search executing: "${query.substring(0, 100)}..."`);
    console.log(`   Full query: "${enhancedQuery.substring(0, 200)}..."`);
    const response = await fetchWithRateLimit(url);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error(`❌ PubMed ESearch error: ${response.status} - ${errorText.substring(0, 200)}`);
      return { count: 0, pmids: [] };
    }

    const data = await response.json();
    const result = data.esearchresult;
    const count = parseInt(result.count || "0");
    const webEnv = result.webenv;
    const queryKey = result.querykey;

    console.log(`✅ PubMed search found ${count} articles for query: "${query.substring(0, 80)}..."`);
    if (count === 0) {
      console.warn(`⚠️ PubMed returned 0 results - query might be too narrow or filters too strict`);
    }

    if (count === 0 || !webEnv || !queryKey) {
      return { count: 0, pmids: [], webEnv, queryKey };
    }

    // STEP 2: Fetch PMIDs in batches using History
    const pmids: string[] = [];
    const batchSize = 500;
    const finalMax = maxResults < count ? maxResults : count;

    for (let start = 0; start < finalMax; start += batchSize) {
      const batchLimit = Math.min(batchSize, finalMax - start);

      const searchParams = new URLSearchParams({
        db: "pubmed",
        WebEnv: webEnv,
        query_key: queryKey,
        retstart: start.toString(),
        retmax: batchLimit.toString(),
        retmode: "json",
        ...(API_KEY && { api_key: API_KEY }),
      });

      // ESearch again to retrieve IDs from history
      const batchUrl = `${EUTILS_BASE}/esearch.fcgi?${searchParams}`;
      const batchResponse = await fetchWithRateLimit(batchUrl);

      if (batchResponse.ok) {
        const batchData = await batchResponse.json();
        const batchIds = batchData.esearchresult?.idlist || [];
        pmids.push(...batchIds);
      }
    }

    return {
      count,
      pmids,
      webEnv,
      queryKey,
    };
  } catch (error) {
    console.error("Error searching PubMed:", error);
    return { count: 0, pmids: [] };
  }
}

/**
 * Fetch article summaries using ESummary
 * More efficient than EFetch for getting basic info
 */
export async function fetchPubMedSummaries(
  pmids: string[]
): Promise<PubMedArticle[]> {
  if (pmids.length === 0) return [];

  try {
    const params = new URLSearchParams({
      db: "pubmed",
      id: pmids.join(","),
      retmode: "json",
      ...(API_KEY && { api_key: API_KEY }),
    });

    const url = `${EUTILS_BASE}/esummary.fcgi?${params}`;
    const response = await fetchWithRateLimit(url);

    if (!response.ok) {
      console.error("PubMed ESummary error:", response.status);
      return [];
    }

    const data = await response.json();
    const result = data.result;

    const articles: PubMedArticle[] = [];

    for (const pmid of pmids) {
      const article = result[pmid];
      if (!article || article.error) continue;

      articles.push({
        pmid: pmid,
        title: article.title || "",
        authors: (article.authors || []).map((a: any) => a.name || "").slice(0, 3),
        journal: article.fulljournalname || article.source || "",
        publicationDate: article.pubdate || "",
        doi: article.elocationid?.replace("doi: ", "") || article.articleids?.find((id: any) => id.idtype === "doi")?.value,
        publicationType: article.pubtype || [],
        meshTerms: undefined, // Not available in ESummary
      });
    }

    return articles;
  } catch (error) {
    console.error("Error fetching PubMed summaries:", error);
    return [];
  }
}

/**
 * Fetch full article details using EFetch (XML format)
 * Use this when you need abstracts and MeSH terms
 */
export async function fetchPubMedDetails(
  pmids: string[]
): Promise<PubMedArticle[]> {
  if (pmids.length === 0) return [];

  try {
    const params = new URLSearchParams({
      db: "pubmed",
      id: pmids.join(","),
      retmode: "xml",
      rettype: "abstract",
      ...(API_KEY && { api_key: API_KEY }),
    });

    const url = `${EUTILS_BASE}/efetch.fcgi?${params}`;
    const response = await fetchWithRateLimit(url);

    if (!response.ok) {
      console.error("PubMed EFetch error:", response.status);
      return [];
    }

    const xmlText = await response.text();
    return parsePubMedXML(xmlText);
  } catch (error) {
    console.error("Error fetching PubMed details:", error);
    return [];
  }
}

/**
 * Parse PubMed XML response
 * Extracts title, authors, abstract, MeSH terms, etc.
 */
function parsePubMedXML(xml: string): PubMedArticle[] {
  const articles: PubMedArticle[] = [];

  try {
    // Simple XML parsing - split by article tags
    const articleSections = xml.split(/<\/?PubmedArticle>/g).filter(s => s.trim());

    for (const articleXml of articleSections) {
      if (!articleXml.includes("<PMID")) continue;

      // Extract PMID
      const pmidMatch = articleXml.match(/<PMID[^>]*>(\d+)<\/PMID>/);
      const pmid = pmidMatch ? pmidMatch[1] : "";

      // Extract title
      const titleMatch = articleXml.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "") : "";

      // Extract authors
      const authors: string[] = [];
      const authorSections = articleXml.split(/<\/?Author[^>]*>/g);
      for (const section of authorSections) {
        const lastNameMatch = section.match(/<LastName>(.*?)<\/LastName>/);
        const foreNameMatch = section.match(/<ForeName>(.*?)<\/ForeName>/);
        if (lastNameMatch && foreNameMatch) {
          authors.push(`${foreNameMatch[1]} ${lastNameMatch[1]}`);
          if (authors.length >= 3) break;
        }
      }

      // Extract journal
      const journalMatch = articleXml.match(/<Title>(.*?)<\/Title>/);
      const journal = journalMatch ? journalMatch[1] : "";

      // Extract publication date
      const yearMatch = articleXml.match(/<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>/);
      const monthMatch = articleXml.match(/<PubDate>[\s\S]*?<Month>(\w+)<\/Month>/);
      const publicationDate = yearMatch ? `${yearMatch[1]}${monthMatch ? " " + monthMatch[1] : ""}` : "";

      // Extract abstract
      const abstractMatch = articleXml.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/);
      const abstract = abstractMatch ? abstractMatch[1].replace(/<[^>]+>/g, "").substring(0, 500) : undefined;

      // Extract DOI
      const doiMatch = articleXml.match(/<ArticleId IdType="doi">(.*?)<\/ArticleId>/);
      const doi = doiMatch ? doiMatch[1] : undefined;

      // Extract publication types
      const publicationType: string[] = [];
      const pubTypeSections = articleXml.split(/<\/?PublicationType[^>]*>/g);
      for (const section of pubTypeSections) {
        const trimmed = section.trim();
        if (trimmed && !trimmed.includes("<") && trimmed.length < 100) {
          publicationType.push(trimmed);
        }
      }

      // Extract MeSH terms
      const meshTerms: string[] = [];
      const meshSections = articleXml.split(/<\/?DescriptorName[^>]*>/g);
      for (const section of meshSections) {
        const trimmed = section.trim();
        if (trimmed && !trimmed.includes("<") && trimmed.length < 100) {
          meshTerms.push(trimmed);
          if (meshTerms.length >= 5) break;
        }
      }

      if (pmid && title) {
        articles.push({
          pmid,
          title,
          authors,
          journal,
          publicationDate,
          abstract,
          doi,
          publicationType,
          meshTerms: meshTerms.length > 0 ? meshTerms : undefined,
        });
      }
    }
  } catch (error) {
    console.error("Error parsing PubMed XML:", error);
  }

  return articles;
}

/**
 * Search for systematic reviews and meta-analyses specifically
 */
export async function searchSystematicReviews(
  query: string,
  maxResults: number = 10
): Promise<PubMedArticle[]> {
  const enhancedQuery = `${query} AND (systematic[sb] OR meta-analysis[pt])`;
  const searchResult = await searchPubMed(enhancedQuery, maxResults, false);

  if (searchResult.pmids.length === 0) return [];

  return fetchPubMedDetails(searchResult.pmids);
}

/**
 * Search for randomized controlled trials
 */
export async function searchRCTs(
  query: string,
  maxResults: number = 10
): Promise<PubMedArticle[]> {
  const enhancedQuery = `${query} AND randomized controlled trial[pt]`;
  const searchResult = await searchPubMed(enhancedQuery, maxResults, false);

  if (searchResult.pmids.length === 0) return [];

  return fetchPubMedDetails(searchResult.pmids);
}

/**
 * Detect if query is about lifestyle, prevention, or general health topics
 * These queries benefit from guideline-focused searches
 */
function isLifestyleOrPreventionQuery(query: string): boolean {
  const lifestyleKeywords = [
    // Physical activity
    'exercise', 'physical activity', 'fitness', 'workout', 'aerobic', 'strength training',
    'walking', 'running', 'swimming', 'yoga', 'stretching', 'sedentary', 'active',
    // Nutrition
    'diet', 'nutrition', 'healthy eating', 'food', 'vitamin', 'supplement', 'protein',
    'carbohydrate', 'fat', 'fiber', 'calorie', 'weight loss', 'weight gain', 'obesity',
    'mediterranean', 'vegetarian', 'vegan', 'fasting', 'sugar', 'salt', 'sodium',
    // Sleep
    'sleep', 'insomnia', 'rest', 'fatigue', 'tired', 'energy',
    // Lifestyle
    'healthy', 'wellness', 'wellbeing', 'lifestyle', 'prevention', 'longevity',
    'aging', 'stress', 'relaxation', 'meditation', 'mindfulness',
    // Substances
    'alcohol', 'smoking', 'tobacco', 'caffeine',
    // General health
    'stay healthy', 'be healthy', 'improve health', 'maintain health', 'good health',
    'how much', 'how often', 'recommended', 'guidelines', 'should i',
  ];

  const lowerQuery = query.toLowerCase();
  return lifestyleKeywords.some(keyword => lowerQuery.includes(keyword));
}

/**
 * Search for organization-specific guidelines (KDIGO, ACC/AHA, IDSA, etc.)
 * CRITICAL FIX: Specialized search for major guideline organizations
 */
export async function searchOrganizationGuidelines(
  query: string,
  organizations: string[],
  maxResults: number = 10
): Promise<PubMedArticle[]> {
  if (organizations.length === 0) return [];

  // Build organization-specific search
  const orgPatterns = organizations.map(org => {
    switch (org.toUpperCase()) {
      case 'KDIGO':
      case 'KDOQI':
        return `(KDIGO[tiab] OR "Kidney Disease Improving Global Outcomes"[tiab] OR KDOQI[tiab] OR "Kidney International"[Journal])`;
      case 'ACC/AHA':
      case 'ACC':
      case 'AHA':
        return `(ACC[tiab] OR AHA[tiab] OR "American College of Cardiology"[tiab] OR "American Heart Association"[tiab] OR "Journal of the American College of Cardiology"[Journal] OR Circulation[Journal])`;
      case 'IDSA':
        return `(IDSA[tiab] OR "Infectious Diseases Society of America"[tiab] OR "Clinical Infectious Diseases"[Journal])`;
      case 'ESC':
        return `(ESC[tiab] OR "European Society of Cardiology"[tiab] OR "European Heart Journal"[Journal])`;
      case 'ADA':
        return `(ADA[tiab] OR "American Diabetes Association"[tiab] OR "Diabetes Care"[Journal])`;
      case 'WHO':
        return `(WHO[tiab] OR "World Health Organization"[tiab])`;
      case 'CDC':
        return `(CDC[tiab] OR "Centers for Disease Control"[tiab])`;
      case 'NICE':
        return `(NICE[tiab] OR "National Institute for Health and Care Excellence"[tiab])`;
      default:
        return `${org}[tiab]`;
    }
  }).join(' OR ');

  const orgQuery = `${query} AND (${orgPatterns}) AND (guideline OR recommendation OR consensus OR statement)`;

  console.log(`🔍 Searching for ${organizations.join(', ')} guidelines...`);

  const searchResult = await searchPubMed(orgQuery, maxResults, false, {
    humansOnly: true,
    yearsBack: 15, // Look back 15 years for major guidelines
  });

  if (searchResult.pmids.length > 0) {
    console.log(`✅ Found ${searchResult.pmids.length} ${organizations.join('/')} guideline(s)`);
    return fetchPubMedDetails(searchResult.pmids);
  }

  return [];
}

/**
 * Search for clinical practice guidelines specifically
 * CRITICAL FIX: Enhanced to find recent guidelines more aggressively
 */
export async function searchGuidelines(
  query: string,
  maxResults: number = 10
): Promise<PubMedArticle[]> {
  // STRATEGY 1: Search for official guidelines (most specific)
  const guidelineQuery = `${query} AND (
    guideline[pt] OR 
    practice guideline[pt] OR 
    "clinical practice guideline"[tiab] OR
    consensus[tiab] OR 
    recommendation[tiab] OR 
    "position statement"[tiab] OR
    "consensus statement"[tiab] OR
    "clinical guideline"[tiab]
  )`;

  const searchResult = await searchPubMed(guidelineQuery, maxResults, false, {
    humansOnly: true,
    yearsBack: 10, // Look back 10 years to catch all recent guidelines
  });

  if (searchResult.pmids.length === 0) {
    console.log(`⚠️  No guidelines found with strict search, trying broader search...`);

    // STRATEGY 2: Broader search if strict search fails
    const broaderQuery = `${query} AND (guideline OR recommendation OR consensus)`;
    const broaderResult = await searchPubMed(broaderQuery, maxResults, false, {
      humansOnly: true,
      yearsBack: 10,
    });

    if (broaderResult.pmids.length === 0) return [];

    return fetchPubMedDetails(broaderResult.pmids);
  }

  return fetchPubMedDetails(searchResult.pmids);
}

/**
 * Search for authoritative sources (major medical organizations and journals)
 * CRITICAL FIX: Added Kidney International and other guideline-publishing journals
 */
export async function searchAuthoritativeSources(
  query: string,
  maxResults: number = 10
): Promise<PubMedArticle[]> {
  // Search from major medical organizations and guideline-publishing journals
  const orgQuery = `${query} AND (
    "American Heart Association"[Affiliation] OR 
    "American College of Cardiology"[Affiliation] OR
    "American Diabetes Association"[Affiliation] OR
    "World Health Organization"[Affiliation] OR
    "Centers for Disease Control"[Affiliation] OR
    "American College of Sports Medicine"[Affiliation] OR
    "American Medical Association"[Affiliation] OR
    "National Institutes of Health"[Affiliation] OR
    "Kidney Disease Improving Global Outcomes"[Affiliation] OR
    KDIGO[Affiliation] OR
    "Infectious Diseases Society of America"[Affiliation] OR
    IDSA[Affiliation] OR
    "European Society of Cardiology"[Affiliation] OR
    ESC[Affiliation] OR
    JAMA[Journal] OR
    "New England Journal of Medicine"[Journal] OR
    Lancet[Journal] OR
    Circulation[Journal] OR
    "Diabetes Care"[Journal] OR
    "Kidney International"[Journal] OR
    "American Journal of Kidney Diseases"[Journal] OR
    "Clinical Infectious Diseases"[Journal] OR
    "European Heart Journal"[Journal] OR
    "Journal of the American College of Cardiology"[Journal]
  )`;

  const searchResult = await searchPubMed(orgQuery, maxResults, false, {
    humansOnly: true,
    yearsBack: 10,
    hasAbstract: true,
  });

  if (searchResult.pmids.length === 0) return [];

  return fetchPubMedSummaries(searchResult.pmids);
}

/**
 * Combined search: Get high-quality articles + systematic reviews
 * Uses advanced filters for better results
 * Enhanced to include guidelines for lifestyle/prevention queries
 * 
 * NOW WITH CACHING: Checks Redis cache before hitting PubMed API
 */
export async function comprehensivePubMedSearch(
  query: string,
  isGuidelineQuery: boolean = false,
  guidelineBodies: string[] = [],
  journalFilter: string = ''
): Promise<{ articles: PubMedArticle[]; systematicReviews: PubMedArticle[]; guidelines: PubMedArticle[] }> {
  // PHASE 1 ENHANCEMENT: Check cache first
  // Error handling: If cache fails, continue with API call (graceful degradation)
  try {
    const cacheKey = journalFilter ? `${query}_${journalFilter}` : query;
    const cached = await getCachedEvidence<{ articles: PubMedArticle[]; systematicReviews: PubMedArticle[]; guidelines: PubMedArticle[] }>(
      cacheKey,
      'pubmed'
    );

    if (cached) {
      console.log(`📬 Using cached PubMed results for query (filter: ${!!journalFilter})`);
      return cached.data;
    }
  } catch (error: any) {
    console.error('❌ Cache read error in PubMed, falling back to API:', error.message);
    // Continue to API call
  }

  // Cache miss - fetch from API
  const isLifestyle = isLifestyleOrPreventionQuery(query);

  // CRITICAL FIX: Always search for guidelines if this is a guideline query
  const shouldSearchGuidelines = isGuidelineQuery || isLifestyle;

  // Build search promises
  // INCREASED LIMITS: Get MANY more candidates to ensure high relevance after filtering
  console.log(`📚 comprehensivePubMedSearch: Starting searches for query: "${query.substring(0, 100)}..." (Filter: ${journalFilter ? 'Active' : 'None'})`);

  // Apply journal filter to the general search if provided
  const generalQuery = journalFilter ? `${query} AND ${journalFilter}` : query;

  const searchPromises: Promise<any>[] = [
    // General search: 15 years + humans; avoid hasAbstract to maximize hits (we can filter later)
    searchPubMed(generalQuery, 50, false, {
      humansOnly: true,
      yearsBack: 15,
    }).then(result => {
      console.log(`📚 General PubMed search returned: ${result.count} total matches, ${result.pmids.length} PMIDs fetched`);
      return result;
    }).catch(err => {
      console.error(`❌ General PubMed search failed:`, err);
      return { count: 0, pmids: [] };
    }),
    // Systematic reviews - INCREASED from 8 to 20
    searchSystematicReviews(query, 20).then(result => {
      console.log(`📚 Systematic reviews search returned: ${result.length} reviews`);
      return result;
    }).catch(err => {
      console.error(`❌ Systematic reviews search failed:`, err);
      return [];
    }),
  ];

  // Add guideline search for guideline queries or lifestyle/prevention queries
  if (shouldSearchGuidelines) {
    if (isGuidelineQuery) {
      console.log("📋 Guideline query detected - searching for clinical practice guidelines");

      // CRITICAL FIX: If we have specific guideline bodies (KDIGO, ACC/AHA, etc.), search for them specifically
      if (guidelineBodies.length > 0) {
        console.log(`🎯 Searching specifically for ${guidelineBodies.join(', ')} guidelines`);
        searchPromises.push(searchOrganizationGuidelines(query, guidelineBodies, 30)); // INCREASED from 15 to 30
      }
    } else {
      console.log("🏃 Lifestyle/prevention query detected - adding guideline search");
    }
    searchPromises.push(searchGuidelines(query, 30)); // INCREASED from 15 to 30
    searchPromises.push(searchAuthoritativeSources(query, 25)); // INCREASED from 12 to 25
  }

  // #region debug log
  fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'pubmed.ts:726', message: 'comprehensivePubMedSearch executing', data: { query: query.substring(0, 100), searchPromises: searchPromises.length, isGuidelineQuery, guidelineBodies, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => { });
  // #endregion

  const results = await Promise.all(searchPromises);

  // #region debug log
  fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'pubmed.ts:730', message: 'comprehensivePubMedSearch results received', data: { resultCount: results.length, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => { });
  // #endregion

  // Handle variable number of results based on whether we searched for organization guidelines
  let generalSearch, reviewsSearch, guidelinesSearch, authoritativeSearch, orgGuidelinesSearch;

  if (isGuidelineQuery && guidelineBodies.length > 0) {
    [generalSearch, reviewsSearch, orgGuidelinesSearch, guidelinesSearch, authoritativeSearch] = results;
  } else {
    [generalSearch, reviewsSearch, guidelinesSearch, authoritativeSearch] = results;
    orgGuidelinesSearch = [];
  }

  console.log(`📚 Processing PubMed results: generalSearch has ${generalSearch.pmids?.length || 0} PMIDs`);
  const articles = (generalSearch?.pmids && generalSearch.pmids.length > 0)
    ? await fetchPubMedSummaries(generalSearch.pmids).then(arts => {
      console.log(`📚 Fetched ${arts.length} article summaries from PubMed`);
      return arts;
    }).catch(err => {
      console.error(`❌ Failed to fetch PubMed summaries:`, err);
      return [];
    })
    : [];

  if (articles.length === 0 && (generalSearch?.pmids?.length || 0) > 0) {
    console.warn(`⚠️ Warning: Had ${generalSearch.pmids.length} PMIDs but fetched 0 articles - fetchPubMedSummaries may have failed`);
  }

  // Combine guidelines from all searches if available
  let guidelines: PubMedArticle[] = [];
  if (shouldSearchGuidelines) {
    guidelines = [
      ...(orgGuidelinesSearch || []), // Organization-specific guidelines (KDIGO, ACC/AHA, etc.) - HIGHEST PRIORITY
      ...(guidelinesSearch || []),
      ...(authoritativeSearch || []),
    ];
    // Remove duplicates by PMID
    const seenPmids = new Set<string>();
    guidelines = guidelines.filter(g => {
      if (seenPmids.has(g.pmid)) return false;
      seenPmids.add(g.pmid);
      return true;
    });
    console.log(`📋 Found ${guidelines.length} guideline articles from PubMed`);
    if (orgGuidelinesSearch && orgGuidelinesSearch.length > 0) {
      console.log(`   ✅ Including ${orgGuidelinesSearch.length} organization-specific guideline(s)`);
    }
  }

  const result = {
    articles,
    systematicReviews: Array.isArray(reviewsSearch) ? reviewsSearch : [],
    guidelines,
  };

  // #region debug log
  fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'pubmed.ts:763', message: 'comprehensivePubMedSearch completed', data: { articles: articles.length, systematicReviews: reviewsSearch?.length || 0, guidelines: guidelines.length, total: articles.length + (reviewsSearch?.length || 0) + guidelines.length, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => { });
  // #endregion

  // PHASE 1 ENHANCEMENT: Cache the result
  // Error handling: If caching fails, continue anyway (graceful degradation)
  try {
    await cacheEvidence(query, 'pubmed', result);
  } catch (error: any) {
    console.error('❌ Cache write error in PubMed:', error.message);
    // Continue - result is still returned
  }

  return result;
}
