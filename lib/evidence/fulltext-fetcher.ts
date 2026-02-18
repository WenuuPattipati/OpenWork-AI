/**
 * Full-Text Fetcher
 * 
 * Fetches full-text content for top-ranked articles to provide richer context to the LLM.
 * Uses a cascading fallback strategy:
 * 1. DOI → Unpaywall API (finds open-access full-text)
 * 2. PMC ID → NCBI E-Utilities (fetches full-text from PubMed Central)
 * 3. Fallback → Use existing abstract from PubMed
 */

const NCBI_API_KEY = process.env.NCBI_API_KEY || '';
const UNPAYWALL_EMAIL = 'openwork-ai@example.com'; // Required by Unpaywall API

// Rate limiting for NCBI
const NCBI_REQUEST_DELAY = NCBI_API_KEY ? 100 : 350;
let lastNCBIRequestTime = 0;

async function ncbiRateLimitedFetch(url: string): Promise<Response> {
    const now = Date.now();
    const timeSinceLastRequest = now - lastNCBIRequestTime;
    if (timeSinceLastRequest < NCBI_REQUEST_DELAY) {
        await new Promise(resolve => setTimeout(resolve, NCBI_REQUEST_DELAY - timeSinceLastRequest));
    }
    lastNCBIRequestTime = Date.now();
    return fetch(url, { signal: AbortSignal.timeout(5000) });
}

/**
 * Result of full-text fetch operation
 */
export interface FullTextResult {
    pmid: string;
    title: string;
    fullText: string | null;
    sections: FullTextSection[];
    source: 'doi' | 'pmc' | 'abstract' | 'none';
    wordCount: number;
}

export interface FullTextSection {
    heading: string;
    content: string;
    type: 'abstract' | 'introduction' | 'methods' | 'results' | 'discussion' | 'conclusion' | 'other';
}

/**
 * ArticleChunk - A granular chunk of text from an article section
 * Used for chunk-level reranking and more precise evidence attribution
 */
export interface ArticleChunk {
    id: string;              // Format: pmid-sectionType-chunkIndex
    pmid: string;
    title: string;
    journal?: string;
    year?: number;
    sectionType: 'abstract' | 'introduction' | 'methods' | 'results' | 'discussion' | 'conclusion' | 'other';
    sectionHeading: string;
    chunkIndex: number;
    text: string;
    source: 'pmc' | 'doi' | 'abstract';
    score?: number;          // Populated after reranking
}

/**
 * Attempt to fetch full-text via DOI using Unpaywall API
 * Unpaywall provides legal open-access links for ~30M articles
 */
async function fetchViaUnpaywall(doi: string): Promise<string | null> {
    if (!doi) return null;

    try {
        const cleanDoi = doi.replace(/^https?:\/\/doi\.org\//, '');
        const url = `https://api.unpaywall.org/v2/${encodeURIComponent(cleanDoi)}?email=${UNPAYWALL_EMAIL}`;

        console.log(`[FullTextFetcher] Trying Unpaywall for DOI: ${cleanDoi}`);
        const response = await fetch(url, { signal: AbortSignal.timeout(5000) });

        if (!response.ok) {
            console.log(`[FullTextFetcher] Unpaywall returned ${response.status}`);
            return null;
        }

        const data = await response.json();

        // Check for open-access PDF or HTML link
        if (data.best_oa_location?.url_for_landing_page) {
            console.log(`[FullTextFetcher] ✅ Found OA link via Unpaywall`);
            // Note: We return the URL, not the content (fetching PDFs is complex)
            // For now, we'll use PMC for actual content
            return null; // Continue to PMC fallback for actual text
        }

        return null;
    } catch (error) {
        console.warn(`[FullTextFetcher] Unpaywall error:`, error);
        return null;
    }
}

/**
 * Fetch full-text from PubMed Central using PMC ID or PMID
 * Uses NCBI E-Utilities efetch endpoint with rettype=full
 */
async function fetchViaPMC(pmcid: string | null, pmid: string): Promise<string | null> {
    // Try PMC ID first
    if (pmcid) {
        try {
            const pmcIdClean = pmcid.replace(/^PMC/i, '');
            const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pmc&id=${pmcIdClean}&rettype=full&retmode=text${NCBI_API_KEY ? `&api_key=${NCBI_API_KEY}` : ''}`;

            console.log(`[FullTextFetcher] Fetching full-text from PMC: ${pmcid}`);
            const response = await ncbiRateLimitedFetch(url);

            if (response.ok) {
                const text = await response.text();
                // Basic validation - PMC returns XML, extract text content
                if (text && text.length > 1000 && !text.includes('Error')) {
                    console.log(`[FullTextFetcher] ✅ Got ${text.length} chars from PMC`);
                    return extractTextFromPMCXML(text);
                }
            }
        } catch (error) {
            console.warn(`[FullTextFetcher] PMC fetch error:`, error);
        }
    }

    // Try to find PMC ID via PMID link
    if (pmid && !pmcid) {
        try {
            const linkUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi?dbfrom=pubmed&db=pmc&id=${pmid}&retmode=json${NCBI_API_KEY ? `&api_key=${NCBI_API_KEY}` : ''}`;

            const linkResponse = await ncbiRateLimitedFetch(linkUrl);
            if (linkResponse.ok) {
                const linkData = await linkResponse.json();
                const pmcLinks = linkData?.linksets?.[0]?.linksetdbs?.find((db: any) => db.dbto === 'pmc');
                if (pmcLinks?.links?.[0]) {
                    const foundPmcId = pmcLinks.links[0];
                    console.log(`[FullTextFetcher] Found PMC ID via PMID link: PMC${foundPmcId}`);
                    return fetchViaPMC(`PMC${foundPmcId}`, pmid);
                }
            }
        } catch (error) {
            console.warn(`[FullTextFetcher] PMC link lookup error:`, error);
        }
    }

    return null;
}

/**
 * Extract readable text from PMC XML response
 * Parses key sections: abstract, intro, methods, results, discussion, conclusion
 */
function extractTextFromPMCXML(xml: string): string {
    const sections: string[] = [];

    // Extract body text (main content)
    const bodyMatch = xml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
        // Clean XML tags and normalize whitespace
        let text = bodyMatch[1]
            .replace(/<[^>]+>/g, ' ')  // Remove tags
            .replace(/\s+/g, ' ')       // Normalize whitespace
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .trim();

        // Limit to reasonable size (first ~8000 chars of body)
        if (text.length > 8000) {
            text = text.substring(0, 8000) + '... [truncated]';
        }
        sections.push(text);
    }

    // Also try to get abstract if body is not available
    if (sections.length === 0) {
        const abstractMatch = xml.match(/<abstract[^>]*>([\s\S]*?)<\/abstract>/i);
        if (abstractMatch) {
            const abstractText = abstractMatch[1]
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            sections.push(abstractText);
        }
    }

    return sections.join('\n\n');
}

/**
 * Parse full-text into semantic sections for better context understanding
 */
function parseIntoSections(text: string, title: string): FullTextSection[] {
    const sections: FullTextSection[] = [];

    // Common section header patterns
    const sectionPatterns = [
        { regex: /\b(abstract|summary)\b/i, type: 'abstract' as const },
        { regex: /\b(introduction|background)\b/i, type: 'introduction' as const },
        { regex: /\b(methods?|materials?\s+and\s+methods?|study\s+design)\b/i, type: 'methods' as const },
        { regex: /\b(results?|findings?)\b/i, type: 'results' as const },
        { regex: /\b(discussion)\b/i, type: 'discussion' as const },
        { regex: /\b(conclusion|conclusions?|summary)\b/i, type: 'conclusion' as const },
    ];

    // Simple section splitting - look for uppercase headers or numbered sections
    const lines = text.split(/\n|\. (?=[A-Z])/);
    let currentSection: FullTextSection = { heading: 'Content', content: '', type: 'other' };

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        // Check if this looks like a section header
        const isHeader = trimmedLine.length < 100 &&
            (trimmedLine === trimmedLine.toUpperCase() ||
                /^(\d+\.?\s*)?[A-Z][A-Za-z\s]+:?$/.test(trimmedLine));

        if (isHeader) {
            // Save current section if it has content
            if (currentSection.content.trim()) {
                sections.push(currentSection);
            }

            // Start new section
            let sectionType: FullTextSection['type'] = 'other';
            for (const pattern of sectionPatterns) {
                if (pattern.regex.test(trimmedLine)) {
                    sectionType = pattern.type;
                    break;
                }
            }
            currentSection = { heading: trimmedLine, content: '', type: sectionType };
        } else {
            currentSection.content += trimmedLine + ' ';
        }
    }

    // Add final section
    if (currentSection.content.trim()) {
        sections.push(currentSection);
    }

    // If no sections found, treat entire text as one section
    if (sections.length === 0 && text.trim()) {
        sections.push({
            heading: title || 'Full Text',
            content: text.substring(0, 4000),
            type: 'other'
        });
    }

    return sections;
}

/**
 * Main function: Fetch full-text for a single article
 * Cascading fallback: DOI → PMC → Abstract
 */
export async function fetchFullText(
    pmid: string,
    doi: string | null | undefined,
    pmcid: string | null | undefined,
    title: string,
    existingAbstract: string | null | undefined
): Promise<FullTextResult> {
    let fullText: string | null = null;
    let source: FullTextResult['source'] = 'none';

    // Strategy 1: Try DOI via Unpaywall
    // DISABLED: Currently returns null and adds latency
    /*
    if (doi) {
        fullText = await fetchViaUnpaywall(doi);
        if (fullText) source = 'doi';
    }
    */

    // Strategy 2: Try PMC
    if (!fullText) {
        fullText = await fetchViaPMC(pmcid || null, pmid);
        if (fullText) source = 'pmc';
    }

    // Strategy 3: Fall back to abstract
    if (!fullText && existingAbstract) {
        fullText = existingAbstract;
        source = 'abstract';
    }

    const sections = fullText ? parseIntoSections(fullText, title) : [];
    const wordCount = fullText ? fullText.split(/\s+/).length : 0;

    console.log(`[FullTextFetcher] PMID ${pmid}: ${source} (${wordCount} words, ${sections.length} sections)`);

    return {
        pmid,
        title,
        fullText,
        sections,
        source,
        wordCount
    };
}

/**
 * Batch fetch full-text for top N articles after reranking
 * Only fetches for the most relevant articles to minimize latency
 */
export async function fetchFullTextForTopArticles<T extends { pmid?: string; doi?: string; pmcid?: string; title: string; abstract?: string }>(
    articles: T[],
    topN: number = 5
): Promise<Map<string, FullTextResult>> {
    const results = new Map<string, FullTextResult>();

    console.log(`[FullTextFetcher] Fetching full-text for top ${Math.min(topN, articles.length)} articles...`);
    const startTime = Date.now();

    // Process top N articles in parallel (with concurrency limit)
    const articlesToFetch = articles.slice(0, topN).filter(a => a.pmid);

    const fetchPromises = articlesToFetch.map(async (article) => {
        const result = await fetchFullText(
            article.pmid!,
            article.doi,
            (article as any).pmcid || null,
            article.title,
            article.abstract
        );
        return result;
    });

    const fetchedResults = await Promise.all(fetchPromises);
    for (const result of fetchedResults) {
        results.set(result.pmid, result);
    }

    const elapsed = Date.now() - startTime;
    const successCount = Array.from(results.values()).filter(r => r.source !== 'none').length;
    console.log(`[FullTextFetcher] Completed in ${elapsed}ms: ${successCount}/${articlesToFetch.length} articles with full-text`);

    return results;
}

/**
 * Format full-text results for inclusion in LLM prompt
 * Prioritizes sections most relevant for clinical decision making
 */
export function formatFullTextForPrompt(
    results: Map<string, FullTextResult>,
    maxCharsPerArticle: number = 3000
): string {
    if (results.size === 0) return '';

    let formatted = '\n\n📚 **FULL-TEXT EVIDENCE (Expanded Context)**\n\n';

    for (const [pmid, result] of results) {
        if (result.source === 'none') continue;

        formatted += `### PMID: ${pmid} - ${result.title}\n`;
        formatted += `**Source**: ${result.source.toUpperCase()} | **Words**: ${result.wordCount}\n\n`;

        // Prioritize Results and Conclusion sections for clinical relevance
        const prioritySections = result.sections.filter(s =>
            s.type === 'results' || s.type === 'conclusion' || s.type === 'discussion'
        );
        const otherSections = result.sections.filter(s =>
            s.type !== 'results' && s.type !== 'conclusion' && s.type !== 'discussion'
        );

        let charsUsed = 0;
        const allSections = [...prioritySections, ...otherSections];

        for (const section of allSections) {
            if (charsUsed >= maxCharsPerArticle) {
                formatted += `\n[... additional content truncated]\n`;
                break;
            }

            const contentToAdd = section.content.substring(0, maxCharsPerArticle - charsUsed);
            formatted += `**${section.heading}** (${section.type}):\n${contentToAdd}\n\n`;
            charsUsed += contentToAdd.length;
        }

        formatted += '\n---\n\n';
    }

    return formatted;
}

// ============================================================================
// CHUNK-BASED PROCESSING (Phase 1: Online Chunking System)
// ============================================================================

/**
 * Split text into overlapping chunks at sentence boundaries
 * @param text - The text to split
 * @param maxChunkChars - Maximum characters per chunk (default: 1000)
 * @param overlapChars - Number of characters to overlap between chunks (default: 150)
 * @returns Array of text chunks
 */
export function splitTextIntoChunks(
    text: string,
    maxChunkChars: number = 1000,
    overlapChars: number = 150
): string[] {
    if (!text || text.trim().length === 0) {
        return [];
    }

    const chunks: string[] = [];
    const sentences = text.split(/(?<=[.!?])\s+/);

    let currentChunk = '';
    let lastChunkEnd = '';

    for (const sentence of sentences) {
        const trimmedSentence = sentence.trim();
        if (!trimmedSentence) continue;

        // If adding this sentence would exceed max, save current chunk and start new one
        if (currentChunk.length + trimmedSentence.length + 1 > maxChunkChars && currentChunk.length > 0) {
            chunks.push(currentChunk.trim());

            // Start new chunk with overlap from end of previous chunk
            const words = currentChunk.split(/\s+/);
            const overlapWords = [];
            let overlapLen = 0;
            for (let i = words.length - 1; i >= 0 && overlapLen < overlapChars; i--) {
                overlapWords.unshift(words[i]);
                overlapLen += words[i].length + 1;
            }
            lastChunkEnd = overlapWords.join(' ');
            currentChunk = lastChunkEnd + ' ' + trimmedSentence;
        } else {
            currentChunk = currentChunk ? currentChunk + ' ' + trimmedSentence : trimmedSentence;
        }
    }

    // Add final chunk
    if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

/**
 * Priority weights for different section types
 * Higher priority sections get more chunks
 */
const SECTION_PRIORITY: Record<FullTextSection['type'], { maxChunks: number; chunkSize: number }> = {
    'results': { maxChunks: 5, chunkSize: 1000 },
    'discussion': { maxChunks: 4, chunkSize: 1000 },
    'conclusion': { maxChunks: 3, chunkSize: 800 },
    'abstract': { maxChunks: 2, chunkSize: 800 },
    'methods': { maxChunks: 2, chunkSize: 600 },
    'introduction': { maxChunks: 2, chunkSize: 600 },
    'other': { maxChunks: 1, chunkSize: 500 },
};

/**
 * Create granular chunks from a full-text result
 * Prioritizes results/discussion/conclusion sections
 * 
 * @param result - The FullTextResult to chunk
 * @param maxChunkChars - Maximum characters per chunk (default: 1000)
 * @param overlapChars - Overlap between chunks (default: 150)
 * @returns Array of ArticleChunks
 */
export function createChunksFromFullText(
    result: FullTextResult,
    maxChunkChars: number = 1000,
    overlapChars: number = 150
): ArticleChunk[] {
    const allChunks: ArticleChunk[] = [];

    if (!result.sections || result.sections.length === 0) {
        // If no sections, create a single chunk from fullText
        if (result.fullText) {
            const textChunks = splitTextIntoChunks(result.fullText, maxChunkChars, overlapChars);
            textChunks.forEach((text, idx) => {
                allChunks.push({
                    id: `${result.pmid}-other-${idx}`,
                    pmid: result.pmid,
                    title: result.title,
                    sectionType: 'other',
                    sectionHeading: 'Full Text',
                    chunkIndex: idx,
                    text,
                    source: result.source === 'none' ? 'abstract' : result.source,
                });
            });
        }
        return allChunks;
    }

    // Process sections in priority order
    const priorityOrder: FullTextSection['type'][] = [
        'results', 'discussion', 'conclusion', 'abstract', 'methods', 'introduction', 'other'
    ];

    for (const sectionType of priorityOrder) {
        const sectionsOfType = result.sections.filter(s => s.type === sectionType);
        const config = SECTION_PRIORITY[sectionType];

        for (const section of sectionsOfType) {
            if (!section.content || section.content.trim().length === 0) continue;

            const textChunks = splitTextIntoChunks(section.content, config.chunkSize, overlapChars);
            const chunksToUse = textChunks.slice(0, config.maxChunks);

            chunksToUse.forEach((text, idx) => {
                allChunks.push({
                    id: `${result.pmid}-${sectionType}-${idx}`,
                    pmid: result.pmid,
                    title: result.title,
                    sectionType,
                    sectionHeading: section.heading,
                    chunkIndex: idx,
                    text,
                    source: result.source === 'none' ? 'abstract' : result.source,
                });
            });
        }
    }

    console.log(`[FullTextFetcher] Created ${allChunks.length} chunks for PMID ${result.pmid}`);
    return allChunks;
}

/**
 * Fetch full text for top articles and create granular chunks
 * Returns a map from PMID to array of ArticleChunks
 * 
 * @param articles - Array of articles with pmid, doi, title, abstract
 * @param topN - Number of top articles to process (default: 5)
 * @returns Map from pmid to ArticleChunk[]
 */
export async function fetchAndChunkFullTextForTopArticles<T extends {
    pmid?: string;
    doi?: string | null;
    pmcid?: string;
    title: string;
    abstract?: string | null
}>(
    articles: T[],
    topN: number = 5
): Promise<Map<string, ArticleChunk[]>> {
    const chunkMap = new Map<string, ArticleChunk[]>();

    console.log(`[FullTextFetcher] Fetching and chunking full-text for top ${Math.min(topN, articles.length)} articles...`);
    const startTime = Date.now();

    // First, fetch full text for top articles
    // Map to compatible type for fetchFullTextForTopArticles (null -> undefined)
    const compatibleArticles = articles.map(a => ({
        ...a,
        doi: a.doi ?? undefined,
        abstract: a.abstract ?? undefined,
    }));
    const fullTextResults = await fetchFullTextForTopArticles(compatibleArticles, topN);

    // Then, create chunks from each full-text result
    for (const [pmid, result] of fullTextResults) {
        const chunks = createChunksFromFullText(result);
        chunkMap.set(pmid, chunks);
    }

    const elapsed = Date.now() - startTime;
    const totalChunks = Array.from(chunkMap.values()).reduce((sum, chunks) => sum + chunks.length, 0);
    console.log(`[FullTextFetcher] Created ${totalChunks} chunks from ${chunkMap.size} articles in ${elapsed}ms`);

    return chunkMap;
}

/**
 * Format chunks for LLM prompt with granular evidence
 * Replaces the monolithic formatFullTextForPrompt approach
 * 
 * @param chunks - Array of ArticleChunks (should be pre-ranked)
 * @param maxChunks - Maximum number of chunks to include (default: 12)
 * @param maxCharsPerChunk - Max chars per chunk in output (default: 800)
 * @returns Formatted string for LLM prompt
 */
export function formatChunksForPrompt(
    chunks: ArticleChunk[],
    maxChunks: number = 12,
    maxCharsPerChunk: number = 800
): string {
    if (chunks.length === 0) return '';

    let formatted = '\n\n📚 **GRANULAR EVIDENCE CHUNKS (High-Relevance Sections)**\n\n';
    formatted += '> Each chunk below is a highly relevant section from a peer-reviewed article.\n';
    formatted += '> Use ONLY these chunks for evidence. Cite using the PMID provided.\n\n';

    const chunksToFormat = chunks.slice(0, maxChunks);

    for (const chunk of chunksToFormat) {
        const truncatedText = chunk.text.length > maxCharsPerChunk
            ? chunk.text.substring(0, maxCharsPerChunk) + '...'
            : chunk.text;

        formatted += `---\n`;
        formatted += `**[PMID: ${chunk.pmid}]** ${chunk.title}\n`;
        formatted += `📂 Section: ${chunk.sectionHeading} (${chunk.sectionType.toUpperCase()})\n`;
        if (chunk.score) {
            formatted += `🎯 Relevance Score: ${(chunk.score * 100).toFixed(1)}%\n`;
        }
        formatted += `\n${truncatedText}\n\n`;
    }

    formatted += '---\n\n';
    formatted += `> ⚠️ **CITATION RULE**: Only cite PMIDs listed above. Do NOT invent or hallucinate PMIDs.\n`;

    return formatted;
}

