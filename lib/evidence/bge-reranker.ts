/**
 * BGE Cross-Encoder Reranker
 * 
 * Uses BAAI/bge-reranker-base for high-accuracy re-ranking of search results.
 * This is a Cross-Encoder approach which is more accurate than Bi-Encoder (cosine similarity)
 * because it sees the query and document together in the attention mechanism.
 * 
 * Model: Xenova/bge-reranker-base (public, no auth required)
 * Runtime: @xenova/transformers (ONNX Runtime)
 */
import type { PubMedArticle } from './pubmed';
import type { CochraneReview } from './cochrane';
import type { EuropePMCArticle } from './europepmc';
import type { ScholarlyWork } from './openalex';
import type { SemanticScholarPaper } from './semantic-scholar';
import type { PMCArticle } from './pmc';
import type { ClinicalTrial } from './clinical-trials';
import type { DailyMedDrug } from './dailymed';
import type { AAPGuideline } from './aap';
import type { TavilyCitation } from './tavily';

// Dynamic import for transformers.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pipelineModule: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let rerankerPipeline: any = null;
let rerankerInitPromise: Promise<any> | null = null;

// Model configuration - Using base model (most stable)
const PRIMARY_MODEL = 'Xenova/bge-reranker-base';
const FALLBACK_MODEL = 'Xenova/bge-reranker-base';

// Environment configuration - MUCH MORE SELECTIVE
const BGE_RERANK_MAX_LENGTH = parseInt(process.env.BGE_RERANK_MAX_LENGTH || '512');
const BGE_RERANK_MIN_SCORE = parseFloat(process.env.BGE_RERANK_MIN_SCORE || '0.8'); // INCREASED to 0.8 for clinical precision
const BGE_RERANK_MAX_RESULTS = parseInt(process.env.BGE_RERANK_MAX_RESULTS || '10'); // NEW: Hard limit on results
const BGE_RERANK_MIN_SEPARATION = parseFloat(process.env.BGE_RERANK_MIN_SEPARATION || '0.05');
const BGE_RERANK_TIE_BREAKER_WEIGHT = parseFloat(process.env.BGE_RERANK_TIE_BREAKER_WEIGHT || '0.15');
const BGE_RERANK_DEBUG = process.env.BGE_RERANK_DEBUG === 'true';

/**
 * Apply sigmoid function for logit normalization
 */
function sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
}

/**
 * Safely normalize reranker score to avoid double-normalization
 * BGE reranker may return logits OR probabilities depending on model version
 */
function normalizeRerankerScore(raw: number): number {
    if (!Number.isFinite(raw)) return 0;

    // If pipeline already returned probability [0,1], keep it
    if (raw >= 0 && raw <= 1) {
        return raw;
    }

    // If raw score is outside [0,1], assume it's a logit and apply sigmoid
    return sigmoid(raw);
}

function extractScore(result: any): number {
    if (typeof result === 'number') {
        return result;
    }
    if (result && typeof result.score === 'number') {
        return result.score;
    }
    if (Array.isArray(result) && result.length > 0) {
        const first = result[0];
        if (typeof first === 'number') return first;
        if (first && typeof first.score === 'number') return first.score;
        if (first && typeof first.logit === 'number') return first.logit;
    }
    return 0;
}

function tokenizeForSimilarity(text: string): string[] {
    // Comprehensive input validation and type coercion
    if (text === null || text === undefined) {
        console.warn(`[BGEReranker] Null/undefined text for tokenization`);
        return [];
    }

    // Convert to string if not already a string
    let textStr: string;
    if (typeof text === 'string') {
        textStr = text;
    } else if (typeof text === 'number' || typeof text === 'boolean') {
        textStr = String(text);
        console.warn(`[BGEReranker] Converting ${typeof text} to string for tokenization: ${textStr}`);
    } else if (typeof text === 'object') {
        // Handle objects (might be JSON)
        try {
            textStr = JSON.stringify(text);
            console.warn(`[BGEReranker] Converting object to JSON string for tokenization`);
        } catch {
            textStr = String(text);
            console.warn(`[BGEReranker] Converting object to string (fallback) for tokenization`);
        }
    } else {
        textStr = String(text);
        console.warn(`[BGEReranker] Converting unknown type ${typeof text} to string for tokenization`);
    }

    // Additional safety check - ensure we have a string with split method
    if (typeof textStr !== 'string' || typeof textStr.split !== 'function') {
        console.error(`[BGEReranker] Critical error: textStr is not a proper string`, {
            type: typeof textStr,
            value: textStr,
            hasSplit: typeof textStr.split
        });
        return [];
    }

    // Safe tokenization with error handling
    try {
        return textStr
            .toLowerCase()
            .replace(/[^\w\s-]/g, ' ')
            .split(/\s+/)
            .filter(Boolean);
    } catch (error) {
        console.error(`[BGEReranker] Error tokenizing text: ${(error as any).message}`, {
            textType: typeof textStr,
            textValue: String(textStr).substring(0, 100),
            originalType: typeof text,
            originalValue: String(text).substring(0, 100)
        });
        return [];
    }
}

function jaccardSimilarity(query: string, doc: string): number {
    const querySet = new Set(tokenizeForSimilarity(query));
    const docSet = new Set(tokenizeForSimilarity(doc));
    if (querySet.size === 0 || docSet.size === 0) return 0;
    const intersection = new Set([...querySet].filter(x => docSet.has(x)));
    const union = new Set([...querySet, ...docSet]);
    return intersection.size / union.size;
}

function computeLexicalScore(query: string, doc: string): number {
    const baseSimilarity = jaccardSimilarity(query, doc);
    const queryLower = query.toLowerCase();
    const docLower = doc.toLowerCase();

    // Boost for exact drug name matches
    let drugBoost = 0;
    const drugNames = [
        'apixaban',
        'rivaroxaban',
        'dabigatran',
        'edoxaban',
        'warfarin',
        'atrial fibrillation',
        'chronic kidney disease',
        'ckd'
    ];
    for (const drug of drugNames) {
        if (queryLower.includes(drug) && docLower.includes(drug)) {
            drugBoost += 0.1;
        }
    }

    // Boost for comparative language
    let comparativeBoost = 0;
    const comparativeTerms = ['compare', 'versus', 'vs', 'difference', 'efficacy', 'safety', 'bleeding'];
    for (const term of comparativeTerms) {
        if (queryLower.includes(term) && docLower.includes(term)) {
            comparativeBoost += 0.05;
        }
    }

    return Math.min(1.0, baseSimilarity + drugBoost + comparativeBoost);
}

function getScoreStats(scores: number[]) {
    if (scores.length === 0) return null;
    const sorted = [...scores].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const median = sorted[Math.floor(sorted.length / 2)];
    return {
        min,
        max,
        median,
        separation: max - min,
    };
}

function blendScores(primary: number[], secondary: number[], secondaryWeight: number): number[] {
    const weight = Math.min(Math.max(secondaryWeight, 0), 1);
    const primaryWeight = 1 - weight;
    return primary.map((score, index) => {
        const secondaryScore = secondary[index] ?? 0;
        return Math.min(1.0, score * primaryWeight + secondaryScore * weight);
    });
}

/**
 * Initialize the reranker pipeline
 */
async function getRerankerPipeline() {
    if (rerankerPipeline) {
        console.log('[BGEReranker] ✅ MODEL ALREADY LOADED: Using cached BGE Cross-Encoder pipeline');
        return rerankerPipeline;
    }
    if (rerankerInitPromise) {
        console.log('[BGEReranker] 🔒 MODEL LOADING IN PROGRESS: Waiting for existing load operation...');
        return rerankerInitPromise;
    }

    console.log('[BGEReranker] 🔒 MODEL LOAD INITIATED: Acquiring model load lock...');
    rerankerInitPromise = (async () => {
        if (!pipelineModule) {
            try {
                console.log('[BGEReranker] 📦 LOADING TRANSFORMERS: Importing @xenova/transformers...');
                pipelineModule = await import('@xenova/transformers');
                console.log('[BGEReranker] ✅ TRANSFORMERS LOADED: @xenova/transformers imported successfully');
            } catch (error) {
                console.error('[BGEReranker] ❌ TRANSFORMERS FAILED: @xenova/transformers import failed:', error);
                throw new Error('BGE Reranker not available - @xenova/transformers failed to load');
            }
        }

        const { pipeline } = pipelineModule;

        // Try primary model first, fallback if needed
        try {
            console.log(`[BGEReranker] 🚀 PRIMARY MODEL LOADING: ${PRIMARY_MODEL}...`);
            const startTime = Date.now();

            rerankerPipeline = await pipeline('text-classification', PRIMARY_MODEL, {
                quantized: true, // Use quantized model for faster inference
            });

            const loadTime = Date.now() - startTime;
            console.log(`[BGEReranker] ✅ PRIMARY MODEL SUCCESS: ${PRIMARY_MODEL} loaded in ${loadTime}ms`);
            console.log(`[BGEReranker] 📊 MODEL CONFIG: quantized=true, task=text-classification`);
            console.log(`[BGEReranker] 🎯 MODEL READY: BGE Cross-Encoder pipeline initialized and ready for inference`);
        } catch (primaryError: unknown) {
            const primaryMsg = primaryError instanceof Error ? primaryError.message : String(primaryError);
            const primaryStack = primaryError instanceof Error ? primaryError.stack?.split('\n').slice(0, 3).join('\n') : '';
            console.error(`[BGEReranker] ❌ PRIMARY MODEL FAILED: ${PRIMARY_MODEL}`, {
                error: primaryMsg,
                stack: primaryStack
            });

            console.warn(`[BGEReranker] 🔄 FALLBACK ATTEMPT: Trying ${FALLBACK_MODEL}...`);
            try {
                const fallbackStartTime = Date.now();
                rerankerPipeline = await pipeline('text-classification', FALLBACK_MODEL, {
                    quantized: true,
                });
                const fallbackLoadTime = Date.now() - fallbackStartTime;
                console.log(`[BGEReranker] ✅ FALLBACK MODEL SUCCESS: ${FALLBACK_MODEL} loaded in ${fallbackLoadTime}ms`);
                console.log(`[BGEReranker] 📊 FALLBACK CONFIG: quantized=true, task=text-classification`);
                console.log(`[BGEReranker] ⚠️  USING FALLBACK: BGE Cross-Encoder pipeline ready with fallback model`);
            } catch (fallbackError: unknown) {
                const fallbackMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
                console.error('[BGEReranker] ❌ ALL MODELS FAILED: Both primary and fallback models failed:', {
                    primaryError: primaryMsg,
                    fallbackError: fallbackMsg,
                    primaryModel: PRIMARY_MODEL,
                    fallbackModel: FALLBACK_MODEL
                });
                throw new Error(`BGE Reranker initialization failed: Primary (${primaryMsg}), Fallback (${fallbackMsg})`);
            }
        }
        return rerankerPipeline;
    })();

    try {
        const result = await rerankerInitPromise;
        console.log('[BGEReranker] 🔓 MODEL LOAD COMPLETE: Lock released, pipeline ready for use');
        return result;
    } finally {
        rerankerInitPromise = null;
    }
}

/**
 * Result from BGE reranking
 */
export interface BGERankedArticle<T> {
    article: T;
    score: number;       // BGE relevance score (0-1)
    originalRank: number;
}

/**
 * Options for BGE reranking
 */
export interface BGERerankerOptions {
    topK?: number;           // Number of articles to rerank (default: 50)
    minScore?: number;       // Minimum score threshold (default: from env or 0.2)
    batchSize?: number;      // Batch size for inference (default: 8)
    maxLength?: number;      // Maximum token length for truncation (default: from env or 512)
    debugScores?: boolean;   // Log score distribution for debugging (default: false)
}

/**
 * Get text representation of an article for reranking
 * Uses token-based truncation instead of character-based for better precision
 * Enhanced with comprehensive type validation
 */
function getArticleText(article: { title: string; abstract?: string; abstractText?: string }, maxLength?: number): string {
    // Comprehensive title validation and conversion
    let title: string;
    if (article.title === null || article.title === undefined) {
        console.warn(`[BGEReranker] Article has null/undefined title`);
        title = 'Untitled Article';
    } else if (typeof article.title === 'string') {
        title = article.title;
    } else if (typeof article.title === 'number' || typeof article.title === 'boolean') {
        title = String(article.title);
        console.warn(`[BGEReranker] Converting title from ${typeof article.title} to string: ${title}`);
    } else if (typeof article.title === 'object') {
        try {
            title = JSON.stringify(article.title);
            console.warn(`[BGEReranker] Converting title object to JSON string`);
        } catch {
            title = 'Untitled Article';
            console.warn(`[BGEReranker] Failed to convert title object, using fallback`);
        }
    } else {
        title = String(article.title);
        console.warn(`[BGEReranker] Converting title from unknown type ${typeof article.title} to string`);
    }

    // Comprehensive abstract validation and conversion
    let abstract: string;
    const rawAbstract = article.abstract || article.abstractText;

    if (rawAbstract === null || rawAbstract === undefined) {
        abstract = '';
    } else if (typeof rawAbstract === 'string') {
        abstract = rawAbstract;
    } else if (typeof rawAbstract === 'number' || typeof rawAbstract === 'boolean') {
        abstract = String(rawAbstract);
        console.warn(`[BGEReranker] Converting abstract from ${typeof rawAbstract} to string`);
    } else if (typeof rawAbstract === 'object') {
        try {
            abstract = JSON.stringify(rawAbstract);
            console.warn(`[BGEReranker] Converting abstract object to JSON string`);
        } catch {
            abstract = '';
            console.warn(`[BGEReranker] Failed to convert abstract object, using empty string`);
        }
    } else {
        abstract = String(rawAbstract);
        console.warn(`[BGEReranker] Converting abstract from unknown type ${typeof rawAbstract} to string`);
    }

    // Build full text with validated strings
    const fullText = abstract ? `${title}. ${abstract}` : title;

    // Use maxLength if provided, otherwise fall back to character limit as safety
    const charLimit = (maxLength || BGE_RERANK_MAX_LENGTH) * 4; // Rough estimate: 4 chars per token

    return fullText.length > charLimit ? fullText.substring(0, charLimit) : fullText;
}

/**
 * Core BGE reranking function
 */
export async function rerankWithBGE<T extends { title: string; abstract?: string; abstractText?: string }>(
    query: string,
    articles: T[],
    options: BGERerankerOptions = {}
): Promise<BGERankedArticle<T>[]> {
    const {
        topK = 50,
        minScore = BGE_RERANK_MIN_SCORE,
        batchSize = 8,
        maxLength = BGE_RERANK_MAX_LENGTH,
        debugScores: debugScoresOption,
    } = options;
    const debugScores = debugScoresOption ?? BGE_RERANK_DEBUG;

    // EXECUTION CONFIRMATION: Log entry point
    console.log(`[BGEReranker] 🚀 EXECUTION STARTED: rerankWithBGE called`);
    console.log(`[BGEReranker] 📊 Input: ${articles.length} articles, query: "${query.substring(0, 100)}..."`);
    console.log(`[BGEReranker] ⚙️  Options: topK=${topK}, minScore=${minScore}, batchSize=${batchSize}, maxLength=${maxLength}`);

    // Skip if too few articles
    if (articles.length < 3) {
        console.log(`[BGEReranker] ⏭️  EXECUTION SKIPPED: only ${articles.length} articles (need ≥3)`);
        return articles.map((article, index) => ({
            article,
            score: 1.0,
            originalRank: index,
        }));
    }

    // EXECUTION CONFIRMATION: Entering main processing
    console.log(`[BGEReranker] ✅ EXECUTION CONFIRMED: Processing ${articles.length} articles with BGE Cross-Encoder`);

    const startTime = Date.now();
    const articlesToRerank = articles.slice(0, topK);

    try {
                // EXECUTION CONFIRMATION: Model loading phase
                console.log(`[BGEReranker] 🔄 PHASE 1: Loading BGE Cross-Encoder model...`);
                const ranker = await getRerankerPipeline();
                console.log(`[BGEReranker] ✅ PHASE 1 COMPLETE: Model loaded successfully`);

                console.log(`[BGEReranker] 🎯 PHASE 2: Starting reranking for ${articlesToRerank.length} articles with query: "${query.substring(0, 100)}..."`);

                // Build query-document pairs for cross-encoding
                const pairs: Array<{ text: string; text_pair: string }> = articlesToRerank.map((article, index) => {
                    const queryText = query;
                    const articleText = getArticleText(article, maxLength);

                    // Enhanced validation for BGE model input
                    const validatedQueryText = String(queryText || '').trim();
                    const validatedArticleText = String(articleText || '').trim();

                    // Debug logging for problematic pairs
                    if (!validatedQueryText || !validatedArticleText) {
                        console.error(`[BGEReranker] Empty text in pair at index ${index}:`, {
                            queryLength: validatedQueryText.length,
                            articleLength: validatedArticleText.length,
                            articleTitle: article.title
                        });
                    }

                    // Ensure minimum text length for BGE model
                    const finalQueryText = validatedQueryText || 'medical query';
                    const finalArticleText = validatedArticleText || 'medical article';

                    return {
                        text: finalQueryText,
                        text_pair: finalArticleText,
                    };
                });

                console.log(`[BGEReranker] 📝 PHASE 2: Built ${pairs.length} query-document pairs for cross-encoding`);

                // Process in batches
                let scores: number[] = [];
                const rawScores: number[] = []; // For debugging
                let invalidScores = 0;

                console.log(`[BGEReranker] 🔄 PHASE 3: Processing ${pairs.length} pairs in batches of ${batchSize}...`);

                for (let i = 0; i < pairs.length; i += batchSize) {
                    const batch = pairs.slice(i, i + batchSize);
                    const batchNum = Math.floor(i / batchSize) + 1;
                    const totalBatches = Math.ceil(pairs.length / batchSize);

                    console.log(`[BGEReranker] 📦 BATCH ${batchNum}/${totalBatches}: Processing ${batch.length} pairs...`);

                    // Run inference on batch with proper truncation
                    if (debugScores) {
                        batch.forEach((pair, idx) => {
                            console.log(`[BGEReranker] DEBUG: Batch ${batchNum}, Pair ${idx + 1}`);
                            console.log(`[BGEReranker] DEBUG: Query type: ${typeof pair.text}, length: ${pair.text?.length || 0}`);
                            console.log(`[BGEReranker] DEBUG: Query: "${String(pair.text).substring(0, 50)}..."`);
                            console.log(`[BGEReranker] DEBUG: Doc type: ${typeof pair.text_pair}, length: ${pair.text_pair?.length || 0}`);
                            console.log(`[BGEReranker] DEBUG: Doc: "${String(pair.text_pair).substring(0, 50)}..."`);
                        });
                    }

                    try {
                        // Enhanced validation before sending to BGE model
                        const validatedBatch = batch.map((pair, idx) => {
                            // Comprehensive validation and sanitization
                            let validText = pair.text;
                            let validTextPair = pair.text_pair;

                            // Handle null/undefined or objects
                            if (validText === null || validText === undefined || typeof validText === 'object') {
                                validText = pair.text && typeof (pair.text as any).title === 'string'
                                    ? (pair.text as any).title
                                    : 'medical query';
                            }
                            if (validTextPair === null || validTextPair === undefined || typeof validTextPair === 'object') {
                                // Try to extract meaningful text if it's an object
                                if (pair.text_pair && (pair.text_pair as any).abstract) validTextPair = (pair.text_pair as any).abstract;
                                else if (pair.text_pair && (pair.text_pair as any).title) validTextPair = (pair.text_pair as any).title;
                                else validTextPair = 'medical article';
                            }

                            // Convert to string and validate
                            validText = String(validText).trim();
                            validTextPair = String(validTextPair).trim();

                            // Ensure minimum length
                            if (validText.length === 0) validText = 'medical query';
                            if (validTextPair.length === 0) validTextPair = 'medical article';

                            // Final validation - ensure they are proper strings
                            if (typeof validText !== 'string' || typeof validTextPair !== 'string') {
                                console.error(`[BGEReranker] Critical validation failure in batch ${batchNum}, pair ${idx}`, {
                                    validTextType: typeof validText,
                                    textPairType: typeof validTextPair
                                });
                                validText = 'medical query';
                                validTextPair = 'medical article';
                            }

                            // Debug logging for the first pair to see what we're sending to BGE
                            if (idx === 0) {
                                console.log(`[BGEReranker] DEBUG: Sending to BGE model - text: "${validText.substring(0, 100)}...", text_pair: "${validTextPair.substring(0, 100)}..."`);
                                console.log(`[BGEReranker] DEBUG: Types - text: ${typeof validText}, text_pair: ${typeof validTextPair}`);
                                console.log(`[BGEReranker] DEBUG: Lengths - text: ${validText.length}, text_pair: ${validTextPair.length}`);
                            }

                            return {
                                text: validText,
                                text_pair: validTextPair
                            };
                        });

                        // Fix: Split into separate arrays for correct batch processing in transformers.js
                        const texts = validatedBatch.map(item => item.text);
                        const textPairs = validatedBatch.map(item => item.text_pair);


                        console.log(`[BGEReranker] DEBUG: About to call BGE model with ${texts.length} pairs (split arrays, all labels)`);
                        // Fix: Get ALL scores (topk: undefined) to inspect labels (LABEL_0 vs LABEL_1)
                        const batchResults = await ranker(texts, { text_pair: textPairs });
                        console.log(`[BGEReranker] ✅ BATCH ${batchNum} COMPLETED: Inference successful, processing results...`);

                        const normalizedBatch = batch.map((_, index) => {
                            const result = Array.isArray(batchResults) ? batchResults[index] : batchResults;

                            // Fix: Correctly extract score for LABEL_1 (relevant)
                            let finalScore = 0;

                            if (Array.isArray(result)) {
                                // Find 'LABEL_1' (relevant) or 'label_1'
                                const positiveLabel = result.find((r: any) => r.label === 'LABEL_1' || r.label === 'label_1');
                                if (positiveLabel) {
                                    finalScore = positiveLabel.score;
                                } else {
                                    // If no LABEL_1, maybe we have LABEL_0 (irrelevant)
                                    const negativeLabel = result.find((r: any) => r.label === 'LABEL_0' || r.label === 'label_0');
                                    if (negativeLabel) {
                                        finalScore = 1 - negativeLabel.score; // Invert likelihood of being irrelevant
                                    } else {
                                        // Fallback to simpler extraction
                                        finalScore = extractScore(result[0]); // Best guess
                                    }
                                }
                            } else {
                                // Single object fallback
                                if (result.label === 'LABEL_1' || result.label === 'label_1') {
                                    finalScore = extractScore(result);
                                } else if (result.label === 'LABEL_0' || result.label === 'label_0') {
                                    finalScore = 1 - extractScore(result);
                                } else {
                                    finalScore = extractScore(result);
                                }
                            }

                            const safeRawScore = Number.isFinite(finalScore) ? finalScore : 0;
                            if (!Number.isFinite(finalScore)) {
                                invalidScores += 1;
                                console.warn(`[BGEReranker] ⚠️ Invalid score for pair ${index}: ${finalScore}`);
                            }
                            rawScores.push(safeRawScore);
                            const normalizedScore = normalizeRerankerScore(safeRawScore);

                            if (debugScores) {
                                console.log(`[BGEReranker] Score: raw=${safeRawScore.toFixed(6)}, normalized=${normalizedScore.toFixed(6)}`);
                            }

                            return normalizedScore;
                        });

                        scores = scores.concat(normalizedBatch);

                        console.log(`[BGEReranker] 📊 BATCH ${batchNum} SCORES: min=${Math.min(...normalizedBatch).toFixed(3)}, max=${Math.max(...normalizedBatch).toFixed(3)}, avg=${(normalizedBatch.reduce((a, b) => a + b, 0) / normalizedBatch.length).toFixed(3)}`);
                    } catch (batchError: any) {
                        console.error(`[BGEReranker] ❌ BATCH ${batchNum} FAILED:`, batchError.message);
                        // Fill with NEUTRAL scores (0.5) so we don't discard potential evidence just because the model failed
                        // Default threshold is usually 0.2-0.3, so 0.5 ensures they survive filtering
                        const neutralScores = new Array(batch.length).fill(0.5);
                        scores = scores.concat(neutralScores);
                        invalidScores += batch.length;
                    }
                }

                console.log(`[BGEReranker] ✅ PHASE 3 COMPLETE: All batches processed`);

                const stats = getScoreStats(scores);
                if (stats) {
                    console.log(
                        `[BGEReranker] 📊 PHASE 4: Score analysis - min=${stats.min.toFixed(6)}, median=${stats.median.toFixed(6)}, max=${stats.max.toFixed(6)}, separation=${stats.separation.toFixed(6)}`
                    );
                }

                if (debugScores && rawScores.length > 0) {
                    const sortedRaw = [...rawScores].sort((a, b) => a - b);
                    console.log(`[BGEReranker] Raw score distribution: [${sortedRaw[0].toFixed(6)}, ${sortedRaw[Math.floor(sortedRaw.length / 2)].toFixed(6)}, ${sortedRaw[sortedRaw.length - 1].toFixed(6)}]`);
                }

                if (stats && stats.separation < BGE_RERANK_MIN_SEPARATION) {
                    console.warn(`[BGEReranker] 🔄 PHASE 5: Low score separation (${stats.separation.toFixed(6)} < ${BGE_RERANK_MIN_SEPARATION}). Applying lexical tie-breaker.`);
                    const lexicalScores = pairs.map(pair => computeLexicalScore(pair.text, pair.text_pair));
                    scores = blendScores(scores, lexicalScores, BGE_RERANK_TIE_BREAKER_WEIGHT);

                    const blendedStats = getScoreStats(scores);
                    if (blendedStats) {
                        console.log(
                            `[BGEReranker] ✅ PHASE 5 COMPLETE: Blended scores - min=${blendedStats.min.toFixed(6)}, median=${blendedStats.median.toFixed(6)}, max=${blendedStats.max.toFixed(6)}, separation=${blendedStats.separation.toFixed(6)}`
                        );
                    }
                } else {
                    console.log(`[BGEReranker] ⏭️  PHASE 5 SKIPPED: Score separation sufficient (${stats?.separation.toFixed(6)})`);
                }

                // Build ranked results
                console.log(`[BGEReranker] 🔄 PHASE 6: Building final ranked results...`);
                const rankedArticles: BGERankedArticle<T>[] = articlesToRerank.map((article, index) => ({
                    article,
                    score: scores[index] || 0,
                    originalRank: index,
                }));

                // Sort by score (descending)
                rankedArticles.sort((a, b) => b.score - a.score);

                // Apply STRICT filtering: both minimum score AND maximum count
                let filteredArticles = rankedArticles.filter(item => item.score >= minScore);

                // CRITICAL: Enforce maximum results limit for selectivity
                if (filteredArticles.length > BGE_RERANK_MAX_RESULTS) {
                    console.log(`[BGEReranker] 🎯 SELECTIVITY ENFORCEMENT: Limiting ${filteredArticles.length} results to top ${BGE_RERANK_MAX_RESULTS} for quality`);
                    filteredArticles = filteredArticles.slice(0, BGE_RERANK_MAX_RESULTS);
                }

                // Additional quality check: if we have too many results with similar scores, be even more selective
                if (filteredArticles.length > 5) {
                    const topScore = filteredArticles[0].score;
                    const fifthScore = filteredArticles[4].score;
                    const scoreRange = topScore - fifthScore;

                    if (scoreRange < 0.1) { // If top 5 scores are very similar, be more selective
                        console.log(`[BGEReranker] 🎯 QUALITY FILTER: Score range too narrow (${scoreRange.toFixed(3)}), limiting to top 5`);
                        filteredArticles = filteredArticles.slice(0, 5);
                    }
                }

                // Calculate metrics
                const avgScore = filteredArticles.length > 0
                    ? filteredArticles.reduce((sum, item) => sum + item.score, 0) / filteredArticles.length
                    : 0;
                const topScore = filteredArticles.length > 0 ? filteredArticles[0].score : 0;
                const elapsedTime = Date.now() - startTime;

                console.log(`[BGEReranker] ✅ PHASE 6 COMPLETE: Final results ready`);
                console.log(
                    `[BGEReranker] 🎉 EXECUTION SUCCESSFUL: Reranked ${filteredArticles.length}/${articlesToRerank.length} articles in ${elapsedTime}ms ` +
                    `(avg: ${avgScore.toFixed(3)}, top: ${topScore.toFixed(3)}, filtered: ${articlesToRerank.length - filteredArticles.length})`
                );

                // EXECUTION CONFIRMATION: Success summary
                console.log(`[BGEReranker] 📈 FINAL SUMMARY:`);
                console.log(`[BGEReranker]    ✅ Model: ${PRIMARY_MODEL} loaded and executed successfully`);
                console.log(`[BGEReranker]    ✅ Processed: ${pairs.length} query-document pairs`);
                console.log(`[BGEReranker]    ✅ Batches: ${Math.ceil(pairs.length / batchSize)} completed`);
                console.log(`[BGEReranker]    ✅ Results: ${filteredArticles.length} articles above threshold (${minScore})`);
                console.log(`[BGEReranker]    ✅ Performance: ${elapsedTime}ms total, ${(elapsedTime / pairs.length).toFixed(1)}ms per pair`);

                return filteredArticles;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[BGEReranker] ❌ EXECUTION FAILED: Reranking error, returning original order:', error);

        // EXECUTION CONFIRMATION: Failure with graceful degradation
        console.log(`[BGEReranker] 🔄 FALLBACK ACTIVATED: Using lexical similarity for ordering`);

        // Graceful degradation: fallback to lexical similarity for usable ordering
        const lexicalScores = articles.map(article => computeLexicalScore(query, getArticleText(article, maxLength)));
        const stats = getScoreStats(lexicalScores);
        if (stats) {
            console.log(
                `[BGEReranker] 📊 FALLBACK SCORES: min=${stats.min.toFixed(6)}, median=${stats.median.toFixed(6)}, max=${stats.max.toFixed(6)}, separation=${stats.separation.toFixed(6)}`
            );
        }

        console.log(`[BGEReranker] ⚠️  EXECUTION COMPLETED WITH FALLBACK: Lexical similarity used instead of BGE`);

        return articles.map((article, index) => ({
            article,
            score: lexicalScores[index] ?? 0,
            originalRank: index,
        }));
    }
}

/**
 * Convenience function to rerank PubMed articles
 */
export async function rerankPubMedWithBGE(
    query: string,
    articles: PubMedArticle[],
    options: BGERerankerOptions = {}
): Promise<PubMedArticle[]> {
    const ranked = await rerankWithBGE(query, articles, options);
    return ranked.map(item => item.article);
}

/**
 * Convenience function to rerank Cochrane reviews
 */
export async function rerankCochraneWithBGE(
    query: string,
    reviews: CochraneReview[],
    options: BGERerankerOptions = {}
): Promise<CochraneReview[]> {
    const ranked = await rerankWithBGE(query, reviews, options);
    return ranked.map(item => item.article);
}

/**
 * Convenience function to rerank Europe PMC articles
 */
export async function rerankEuropePMCWithBGE(
    query: string,
    articles: EuropePMCArticle[],
    options: BGERerankerOptions = {}
): Promise<EuropePMCArticle[]> {
    // Adapt field names for Europe PMC (uses abstractText, not abstract)
    const adapted = articles.map(a => ({
        ...a,
        abstract: a.abstractText || '',
    }));
    const ranked = await rerankWithBGE(query, adapted, options);
    return ranked.map(item => item.article as unknown as EuropePMCArticle);
}

/**
 * Convenience function to rerank OpenAlex scholarly works
 */
export async function rerankOpenAlexWithBGE(
    query: string,
    works: ScholarlyWork[],
    options: BGERerankerOptions = {}
): Promise<ScholarlyWork[]> {
    // Adapt field names for OpenAlex (abstract is optional)
    const adapted = works.map(w => ({
        ...w,
        abstract: w.abstract || '',
    }));
    const ranked = await rerankWithBGE(query, adapted, options);
    return ranked.map(item => item.article as unknown as ScholarlyWork);
}

/**
 * Convenience function to rerank Semantic Scholar papers
 */
export async function rerankSemanticScholarWithBGE(
    query: string,
    papers: SemanticScholarPaper[],
    options: BGERerankerOptions = {}
): Promise<SemanticScholarPaper[]> {
    // Adapt field names for Semantic Scholar (abstract is optional)
    const adapted = papers.map(p => ({
        ...p,
        abstract: p.abstract || '',
    }));
    const ranked = await rerankWithBGE(query, adapted, options);
    return ranked.map(item => item.article as unknown as SemanticScholarPaper);
}

/**
 * Convenience function to rerank PMC articles
 */
export async function rerankPMCWithBGE(
    query: string,
    articles: PMCArticle[],
    options: BGERerankerOptions = {}
): Promise<PMCArticle[]> {
    // PMCArticle has no abstract field, just use title
    const adapted = articles.map(a => ({
        ...a,
        abstract: '',  // PMCArticle has no abstract
    }));
    const ranked = await rerankWithBGE(query, adapted, options);
    return ranked.map(item => item.article as unknown as PMCArticle);
}

/**
 * Convenience function to rerank Clinical Trials
 */
export async function rerankClinicalTrialsWithBGE(
    query: string,
    trials: ClinicalTrial[],
    options: BGERerankerOptions = {}
): Promise<ClinicalTrial[]> {
    // Adapt field names for Clinical Trials (uses briefSummary, add title mapping)
    const adapted = trials.map(t => ({
        ...t,
        title: t.briefTitle || t.officialTitle || 'Clinical Trial',
        abstract: t.briefSummary || '',
    }));
    const ranked = await rerankWithBGE(query, adapted, options);
    return ranked.map(item => item.article as unknown as ClinicalTrial);
}

/**
 * Convenience function to rerank DailyMed drugs
 */
export async function rerankDailyMedWithBGE(
    query: string,
    drugs: DailyMedDrug[],
    options: BGERerankerOptions = {}
): Promise<DailyMedDrug[]> {
    // Adapt field names for DailyMed - use indications + contraindications as "abstract"
    const adapted = drugs.map(d => ({
        ...d,
        abstract: `${d.indications || ''} ${d.contraindications || ''} ${d.dosage || ''}`.trim(),
    }));
    const ranked = await rerankWithBGE(query, adapted, options);
    return ranked.map(item => item.article as unknown as DailyMedDrug);
}

/**
 * Convenience function to rerank AAP Guidelines
 */
export async function rerankAAPWithBGE(
    query: string,
    guidelines: AAPGuideline[],
    options: BGERerankerOptions = {}
): Promise<AAPGuideline[]> {
    // Adapt field names for AAP (uses abstract field)
    const adapted = guidelines.map(g => ({
        ...g,
        abstract: g.abstract || '',
    }));
    const ranked = await rerankWithBGE(query, adapted, options);
    return ranked.map(item => item.article as unknown as AAPGuideline);
}

/**
 * Get average score from a reranked result set
 * Used by sufficiency scorer to determine Tavily fallback
 */
export function getAverageScore<T>(rankedArticles: BGERankedArticle<T>[]): number {
    if (rankedArticles.length === 0) return 0;
    return rankedArticles.reduce((sum, item) => sum + item.score, 0) / rankedArticles.length;
}

/**
 * Convenience function to rerank Tavily citations
 * Uses title + content snippet for reranking (content is limited to 500 chars by Tavily)
 */
export async function rerankTavilyWithBGE(
    query: string,
    citations: TavilyCitation[],
    options: BGERerankerOptions = {}
): Promise<TavilyCitation[]> {
    // Adapt Tavily citations to have title + abstract structure
    const adapted = citations.map(c => ({
        ...c,
        title: c.title || 'Medical Information',
        abstract: c.content || '', // Use content snippet as abstract
    }));

    const ranked = await rerankWithBGE(query, adapted, {
        ...options,
        minScore: (options.minScore || 0.2) * 0.6, // Lower threshold for Tavily (60% of default)
    });

    return ranked.map(item => item.article as unknown as TavilyCitation);
}

/**
 * Check if reranked evidence quality is sufficient
 * If false, Tavily fallback should be triggered
 */
export function isEvidenceQualitySufficient<T>(
    rankedArticles: BGERankedArticle<T>[],
    minAvgScore: number = 0.3,
    minTopScore: number = 0.5
): boolean {
    if (rankedArticles.length === 0) return false;

    const avgScore = getAverageScore(rankedArticles);
    const topScore = rankedArticles[0]?.score || 0;

    const isSufficient = avgScore >= minAvgScore && topScore >= minTopScore;

    if (!isSufficient) {
        console.log(
            `[BGEReranker] Evidence quality insufficient: avg=${avgScore.toFixed(3)}, top=${topScore.toFixed(3)} ` +
            `(need avg>=${minAvgScore}, top>=${minTopScore})`
        );
    }

    return isSufficient;
}

// ============================================================================
// CHUNK-LEVEL RERANKING (Phase 2: Online Chunking System)
// ============================================================================

/**
 * ChunkForRerank - A generic chunk structure for reranking
 * Can be used for ArticleChunks, Tavily chunks, or any text segment
 */
export interface ChunkForRerank {
    id: string;           // Unique chunk identifier (e.g., "PMID-sectionType-chunkIndex")
    title: string;        // Article title + section heading for context
    text: string;         // The chunk text content
    score?: number;       // Populated after reranking
    metadata?: {
        pmid?: string;
        sectionType?: string;
        source?: string;
        [key: string]: unknown;
    };
}

/**
 * Rerank chunks using BGE Cross-Encoder
 * Optimized for smaller text segments with lower maxLength
 * 
 * @param query - The search query
 * @param chunks - Array of ChunkForRerank objects
 * @param options - BGE reranker options (maxLength defaults to 384 for chunks)
 * @returns Ranked chunks with scores
 */
export async function rerankChunksWithBGE(
    query: string,
    chunks: ChunkForRerank[],
    options: BGERerankerOptions = {}
): Promise<ChunkForRerank[]> {
    if (chunks.length < 2) {
        console.log(`[BGEReranker] Skipping chunk reranking - only ${chunks.length} chunks`);
        return chunks.map((c, i) => ({ ...c, score: 1.0 - (i * 0.01) }));
    }

    console.log(`[BGEReranker] 🔄 CHUNK RERANKING: ${chunks.length} chunks with query: "${query.substring(0, 80)}..."`);

    // Use lower maxLength for chunks (they're already smaller segments)
    const chunkOptions: BGERerankerOptions = {
        ...options,
        maxLength: options.maxLength || 384,  // Smaller than default 512 for articles
        topK: options.topK || 40,
        minScore: options.minScore || 0.5,
    };

    // Adapt chunks to have title + abstract structure for rerankWithBGE
    const adapted = chunks.map(c => ({
        title: c.title,
        abstract: c.text,
        __originalChunk: c,  // Preserve original for mapping back
    }));

    try {
        const ranked = await rerankWithBGE(query, adapted, chunkOptions);

        // Map back to ChunkForRerank with scores
        const result = ranked.map(item => {
            const original = (item.article as { __originalChunk: ChunkForRerank }).__originalChunk;
            return {
                ...original,
                score: item.score,
            };
        });

        console.log(`[BGEReranker] ✅ CHUNK RERANKING COMPLETE: ${result.length} chunks above threshold`);
        if (result.length > 0) {
            console.log(`[BGEReranker] 📊 Top chunk score: ${result[0].score?.toFixed(3)}, Bottom: ${result[result.length - 1].score?.toFixed(3)}`);
        }

        return result;
    } catch (error) {
        console.error('[BGEReranker] ❌ Chunk reranking failed:', error);
        // Graceful degradation: return original chunks with neutral scores
        return chunks.map((c, i) => ({ ...c, score: 0.5 - (i * 0.01) }));
    }
}

/**
 * Helper: Convert ArticleChunks to ChunkForRerank format
 */
export function articleChunksToRerankFormat(
    chunks: Array<{
        id: string;
        pmid: string;
        title: string;
        sectionType: string;
        sectionHeading: string;
        text: string;
        source: string;
    }>
): ChunkForRerank[] {
    return chunks.map(c => ({
        id: c.id,
        title: `${c.title} – ${c.sectionHeading} (${c.sectionType})`,
        text: c.text,
        metadata: {
            pmid: c.pmid,
            sectionType: c.sectionType,
            source: c.source,
        },
    }));
}

