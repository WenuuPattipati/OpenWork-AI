/**
 * Semantic Evidence Engine - API-First with Semantic Reranking
 * 
 * CORRECTED ARCHITECTURE (Following System Design):
 * 1. Structured Query → PRIMARY Sources (PubMed > PMC > Cochrane > OpenAlex)
 * 2. Drug Detection → DailyMed (drug names only) + OpenFDA (safety data)
 * 3. Image Queries → OpenI (medical images only)
 * 4. MedCPT Semantic Reranking (filter to 45% similarity)
 * 5. BGE Cross-Encoder Reranking (final precision)
 * 6. Tavily Fallback (only if evidence insufficient)
 * 
 * CRITICAL FIXES:
 * - DailyMed: Extract drug names first, don't search entire query
 * - OpenI: Use for medical images only, not articles
 * - Remove RxNorm/PubChem from primary search (fallback only)
 * - Proper source prioritization: PubMed > PMC > Cochrane > OpenAlex
 * - Tavily fallback with proper trigger conditions
 */

import { getStructuredQueryBuilder } from './structured-query-builder';
import { getSemanticReranker } from './semantic-reranker';
import { getMedCPTEmbedder, MedCPTEmbedder } from './medcpt-embedder';
import { rerankWithBGE } from './bge-reranker';

// Import PRIMARY evidence sources (Tier 1 & 2)
import { comprehensivePubMedSearch } from './pubmed';
import { comprehensiveSearch as searchEuropePMC } from './europepmc';
import { comprehensiveCochraneSearch } from './cochrane';
import { comprehensivePMCSearch } from './pmc';
import { searchSemanticScholar, searchHighlyCitedMedical } from './semantic-scholar';
import { searchLiterature, searchSystematicReviews } from './openalex';

// Import SPECIALIZED sources (correct usage)
import { comprehensiveDailyMedSearch } from './dailymed';
import { searchDrugLabels, searchAdverseEvents } from './openfda';
import { searchClinicalTrials } from './clinical-trials';
import { searchWHOGuidelines } from './who-guidelines';
import { searchCDCGuidelines } from './cdc-guidelines';
import { searchNICEGuidelines } from './nice-guidelines';
import { searchBMJBestPractice } from './bmj-best-practice';
import { searchLandmarkTrials } from './landmark-trials';
import { searchStatPearls } from './ncbi-books';

// Import FALLBACK sources
import { searchTavilyMedical, shouldTriggerTavilyFallback } from './tavily';

// Import utility functions
import { extractDrugTermsFromQuery } from './pubchem';
import { isImageQuery, optimizeOpenIQuery } from '../open-i-client';

import type { EvidencePackage } from './engine';
import type { PubMedArticle } from './pubmed';
import type { EuropePMCArticle } from './europepmc';
import type { CochraneReview } from './cochrane';
import type { PMCArticle } from './pmc';

interface SemanticEvidenceConfig {
  maxApiResults: number; // Default: 200 per source
  semanticThreshold: number; // Default: 0.45 (45% similarity for PubMedBERT)
  bgeThreshold: number; // Default: 0.3 (30% relevance)
  enableSemanticReranking: boolean; // Default: true
  enableBGEReranking: boolean; // Default: true
}

interface SemanticEvidenceStats {
  totalApiResults: number;
  semanticFiltered: number;
  bgeFiltered: number;
  finalResults: number;
  processingTime: number;
  semanticStats: {
    mean: number;
    median: number;
    aboveThreshold: number;
  };
}

export class SemanticEvidenceEngine {
  private queryBuilder = getStructuredQueryBuilder();
  private semanticReranker = getSemanticReranker();
  private embedder = getMedCPTEmbedder();

  /**
   * Main evidence gathering with semantic pipeline - CORRECTED ARCHITECTURE
   * CRITICAL: Follows proper source prioritization and usage patterns
   */
  async gatherEvidenceWithSemanticReranking(
    clinicalQuery: string,
    config: SemanticEvidenceConfig = {
      maxApiResults: 50,        // Moderate size for performance
      semanticThreshold: 0.45,  // Optimized for PubMedBERT compatibility
      bgeThreshold: 0.4,        // Increased for better selectivity
      enableSemanticReranking: true,
      enableBGEReranking: true
    }
  ): Promise<{ evidence: EvidencePackage; stats: SemanticEvidenceStats }> {
    const startTime = Date.now();

    console.log(`🚀 SEMANTIC EVIDENCE PIPELINE STARTED (CORRECTED ARCHITECTURE)`);
    console.log(`   Query: "${clinicalQuery}"`);
    console.log(`   Config: API=${config.maxApiResults}, Semantic=${config.semanticThreshold}, BGE=${config.bgeThreshold}`);

    // STEP 1: Build structured queries for each database
    const structuredQuery = this.queryBuilder.buildStructuredQuery(clinicalQuery);
    console.log(`🎯 STEP 1: Structured query built`);

    // STEP 2: PRIMARY EVIDENCE SOURCES (Tier 1 & 2) - Parallel retrieval
    console.log(`🔄 STEP 2: Fetching from PRIMARY evidence sources...`);

    const [pubmedData, pmcData, cochraneData, europePMCData, semanticScholarData, openAlexLiterature, openAlexReviews] = await Promise.all([
      // Tier 1: Gold Standard
      this.searchPubMedWithStructuredQuery(structuredQuery, config.maxApiResults),
      this.searchPMCWithStructuredQuery(structuredQuery, config.maxApiResults),
      this.searchCochraneWithStructuredQuery(structuredQuery, config.maxApiResults),

      // Tier 2: High Quality
      this.searchEuropePMCWithStructuredQuery(structuredQuery, config.maxApiResults),
      this.searchSemanticScholarWithStructuredQuery(clinicalQuery, config.maxApiResults),
      this.searchOpenAlexLiteratureWithStructuredQuery(clinicalQuery, config.maxApiResults),
      this.searchOpenAlexReviewsWithStructuredQuery(clinicalQuery, config.maxApiResults)
    ]);

    // STEP 3: SPECIALIZED SOURCES (Only when appropriate)
    console.log(`🔄 STEP 3: Fetching from SPECIALIZED sources...`);

    // Drug information (only if drug names detected)
    const drugNames = extractDrugTermsFromQuery(clinicalQuery);
    let dailyMedData: any[] = [];
    let drugLabelsData: any[] = [];
    let adverseEventsData: any[] = [];

    if (drugNames.length > 0) {
      console.log(`💊 Detected drugs: ${drugNames.join(', ')}`);
      const [dailyMed, drugLabels, adverseEvents] = await Promise.all([
        this.searchDailyMedWithDrugNames(drugNames, config.maxApiResults),
        this.searchDrugLabelsWithDrugNames(drugNames, config.maxApiResults),
        this.searchAdverseEventsWithDrugNames(drugNames, config.maxApiResults)
      ]);
      dailyMedData = dailyMed;
      drugLabelsData = drugLabels;
      adverseEventsData = adverseEvents;
    } else {
      console.log(`📭 No drug names detected, skipping drug-specific sources`);
    }

    // Clinical trials and guidelines
    const [clinicalTrialsData, whoGuidelines, cdcGuidelines, niceGuidelines, bmjBestPractice, landmarkTrialsData, ncbiData] = await Promise.all([
      this.searchClinicalTrialsWithStructuredQuery(clinicalQuery, config.maxApiResults),
      this.searchWHOGuidelinesWithStructuredQuery(clinicalQuery, config.maxApiResults),
      this.searchCDCGuidelinesWithStructuredQuery(clinicalQuery, config.maxApiResults),
      this.searchNICEGuidelinesWithStructuredQuery(clinicalQuery, config.maxApiResults),
      this.searchBMJBestPracticeWithStructuredQuery(clinicalQuery, config.maxApiResults),
      this.searchLandmarkTrialsWithStructuredQuery(clinicalQuery, config.maxApiResults),
      this.searchNCBIBooksWithStructuredQuery(clinicalQuery, config.maxApiResults)
    ]);

    const totalApiResults = pubmedData.length + pmcData.length + cochraneData.length +
      europePMCData.length + semanticScholarData.length +
      openAlexLiterature.length + openAlexReviews.length +
      dailyMedData.length + drugLabelsData.length + adverseEventsData.length +
      clinicalTrialsData.length + whoGuidelines.length + cdcGuidelines.length +
      niceGuidelines.length + bmjBestPractice.length + landmarkTrialsData.length + ncbiData.length;

    console.log(`✅ STEP 3 COMPLETE: ${totalApiResults} articles from PRIMARY + SPECIALIZED sources`);
    console.log(`   📚 PRIMARY: PubMed=${pubmedData.length}, PMC=${pmcData.length}, Cochrane=${cochraneData.length}, Europe PMC=${europePMCData.length}`);
    console.log(`   🔬 SCHOLARLY: Semantic Scholar=${semanticScholarData.length}, OpenAlex Lit=${openAlexLiterature.length}, OpenAlex Reviews=${openAlexReviews.length}`);
    console.log(`   💊 DRUGS: DailyMed=${dailyMedData.length}, Drug Labels=${drugLabelsData.length}, Adverse Events=${adverseEventsData.length}`);
    console.log(`   🏥 CLINICAL: Trials=${clinicalTrialsData.length}, Landmark=${landmarkTrialsData.length}`);
    console.log(`   📋 GUIDELINES: WHO=${whoGuidelines.length}, CDC=${cdcGuidelines.length}, NICE=${niceGuidelines.length}, BMJ=${bmjBestPractice.length}`);
    console.log(`   📖 BOOKS: NCBI=${ncbiData.length}`);

    let semanticFiltered = 0;
    let bgeFiltered = 0;

    // Initialize final results with all sources
    let finalPubMed = pubmedData;
    let finalPMC = pmcData;
    let finalCochrane = cochraneData;
    let finalEuropePMC = europePMCData;
    let finalSemanticScholar = semanticScholarData;
    let finalOpenAlexLiterature = openAlexLiterature;
    let finalOpenAlexReviews = openAlexReviews;
    let finalDailyMed = dailyMedData;
    let finalDrugLabels = drugLabelsData;
    let finalAdverseEvents = adverseEventsData;
    let finalClinicalTrials = clinicalTrialsData;
    let finalWHOGuidelines = whoGuidelines;
    let finalCDCGuidelines = cdcGuidelines;
    let finalNICEGuidelines = niceGuidelines;
    let finalBMJBestPractice = bmjBestPractice;
    let finalLandmarkTrials = landmarkTrialsData;
    let finalNCBIBooks = ncbiData;

    // STEP 4: Semantic reranking (if enabled) - PRIMARY SOURCES ONLY
    if (config.enableSemanticReranking && totalApiResults > 0) {
      console.log(`🔄 STEP 4: MedCPT semantic reranking PRIMARY sources (threshold: ${config.semanticThreshold})...`);

      const semanticResults = await this.semanticReranker.rerankAllEvidenceSources(
        clinicalQuery,
        {
          pubmedArticles: pubmedData,
          europePMCArticles: europePMCData,
          cochraneReviews: cochraneData,
          pmcArticles: pmcData,
          // Note: Drug/guideline sources don't have title/abstract structure for semantic reranking
          // They'll be passed through unchanged
        },
        {
          minSimilarityThreshold: config.semanticThreshold,
          combineWithKeywordScore: true,
          keywordWeight: 0.4 // 40% keyword, 60% semantic
        }
      );

      finalPubMed = semanticResults.pubmedArticles;
      finalEuropePMC = semanticResults.europePMCArticles;
      finalCochrane = semanticResults.cochraneReviews;
      finalPMC = semanticResults.pmcArticles;

      semanticFiltered = finalPubMed.length + finalEuropePMC.length +
        finalCochrane.length + finalPMC.length +
        finalSemanticScholar.length + finalOpenAlexLiterature.length + finalOpenAlexReviews.length +
        finalDailyMed.length + finalDrugLabels.length + finalAdverseEvents.length +
        finalClinicalTrials.length + finalWHOGuidelines.length + finalCDCGuidelines.length +
        finalNICEGuidelines.length + finalBMJBestPractice.length + finalLandmarkTrials.length + finalNCBIBooks.length;

      console.log(`✅ STEP 4 COMPLETE: ${totalApiResults} → ${semanticFiltered} articles (semantic filter)`);
    } else {
      semanticFiltered = totalApiResults;
      console.log(`⏭️  STEP 4 SKIPPED: Semantic reranking disabled`);
    }

    // STEP 5: BGE Cross-Encoder reranking (if enabled) - PRIMARY SOURCES ONLY
    if (config.enableBGEReranking && semanticFiltered > 0) {
      console.log(`🔄 STEP 5: BGE Cross-Encoder reranking PRIMARY sources (threshold: ${config.bgeThreshold})...`);

      // Rerank only sources with title/abstract structure - WITH STRICT SELECTIVITY
      const [bgeRankedPubMed, bgeRankedEuropePMC, bgeRankedCochrane, bgeRankedPMC, bgeRankedDailyMed, bgeRankedClinicalTrials] = await Promise.all([
        finalPubMed.length > 0 ? rerankWithBGE(clinicalQuery, finalPubMed, {
          minScore: 0.7, // INCREASED selectivity from config.bgeThreshold (0.4)
          topK: 10 // REDUCED from 50 to 10
        }) : Promise.resolve([]),
        finalEuropePMC.length > 0 ? rerankWithBGE(clinicalQuery, finalEuropePMC, {
          minScore: 0.7, // INCREASED selectivity
          topK: 5 // REDUCED from 30 to 5
        }) : Promise.resolve([]),
        finalCochrane.length > 0 ? rerankWithBGE(clinicalQuery, finalCochrane, {
          minScore: 0.7, // INCREASED selectivity
          topK: 5 // REDUCED from 20 to 5
        }) : Promise.resolve([]),
        finalPMC.length > 0 ? rerankWithBGE(clinicalQuery, finalPMC, {
          minScore: 0.7, // INCREASED selectivity
          topK: 5 // REDUCED from 30 to 5
        }) : Promise.resolve([]),
        finalDailyMed.length > 0 ? rerankWithBGE(clinicalQuery, finalDailyMed, {
          minScore: 0.7, // INCREASED selectivity
          topK: 3 // REDUCED from 20 to 3
        }) : Promise.resolve([]),
        finalClinicalTrials.length > 0 ? rerankWithBGE(clinicalQuery, finalClinicalTrials, {
          minScore: 0.7, // INCREASED selectivity
          topK: 3 // REDUCED from 20 to 3
        }) : Promise.resolve([])
      ]);

      // Extract articles from BGE results
      finalPubMed = bgeRankedPubMed.map(r => r.article);
      finalEuropePMC = bgeRankedEuropePMC.map(r => r.article);
      finalCochrane = bgeRankedCochrane.map(r => r.article);
      finalPMC = bgeRankedPMC.map(r => r.article);
      finalDailyMed = bgeRankedDailyMed.map(r => r.article);
      finalClinicalTrials = bgeRankedClinicalTrials.map(r => r.article);

      bgeFiltered = finalPubMed.length + finalEuropePMC.length +
        finalCochrane.length + finalPMC.length +
        finalSemanticScholar.length + finalOpenAlexLiterature.length + finalOpenAlexReviews.length +
        finalDailyMed.length + finalDrugLabels.length + finalAdverseEvents.length +
        finalClinicalTrials.length + finalWHOGuidelines.length + finalCDCGuidelines.length +
        finalNICEGuidelines.length + finalBMJBestPractice.length + finalLandmarkTrials.length + finalNCBIBooks.length;

      console.log(`✅ STEP 5 COMPLETE: ${semanticFiltered} → ${bgeFiltered} articles (BGE filter)`);

      // CRITICAL: Apply final overall limit to ensure maximum 10 total results for 400-word answers
      const MAX_TOTAL_RESULTS = 10;
      if (bgeFiltered > MAX_TOTAL_RESULTS) {
        console.log(`🎯 FINAL SELECTIVITY: ${bgeFiltered} results exceed limit, applying final selection to top ${MAX_TOTAL_RESULTS}`);

        // Prioritize sources: PubMed > Cochrane > PMC > Guidelines > Others
        const allSources = [
          ...finalPubMed.map(a => ({ source: 'PubMed', priority: 1, article: a })),
          ...finalCochrane.map(a => ({ source: 'Cochrane', priority: 2, article: a })),
          ...finalPMC.map(a => ({ source: 'PMC', priority: 3, article: a })),
          ...finalWHOGuidelines.map(a => ({ source: 'WHO', priority: 4, article: a })),
          ...finalCDCGuidelines.map(a => ({ source: 'CDC', priority: 4, article: a })),
          ...finalNICEGuidelines.map(a => ({ source: 'NICE', priority: 4, article: a })),
          ...finalBMJBestPractice.map(a => ({ source: 'BMJ', priority: 4, article: a })),
          ...finalEuropePMC.map(a => ({ source: 'EuropePMC', priority: 5, article: a })),
          ...finalClinicalTrials.map(a => ({ source: 'ClinicalTrials', priority: 6, article: a })),
          ...finalLandmarkTrials.map(a => ({ source: 'Landmark', priority: 6, article: a })),
          ...finalNCBIBooks.map(a => ({ source: 'NCBI', priority: 7, article: a })),
          ...finalDailyMed.map(a => ({ source: 'DailyMed', priority: 8, article: a }))
        ];

        // Sort by priority and take top results
        const selectedSources = allSources
          .sort((a, b) => a.priority - b.priority)
          .slice(0, MAX_TOTAL_RESULTS);

        // Reset arrays and populate with selected results
        finalPubMed = selectedSources.filter(s => s.source === 'PubMed').map(s => s.article);
        finalCochrane = selectedSources.filter(s => s.source === 'Cochrane').map(s => s.article);
        finalPMC = selectedSources.filter(s => s.source === 'PMC').map(s => s.article);
        finalWHOGuidelines = selectedSources.filter(s => s.source === 'WHO').map(s => s.article);
        finalCDCGuidelines = selectedSources.filter(s => s.source === 'CDC').map(s => s.article);
        finalNICEGuidelines = selectedSources.filter(s => s.source === 'NICE').map(s => s.article);
        finalBMJBestPractice = selectedSources.filter(s => s.source === 'BMJ').map(s => s.article);
        finalEuropePMC = selectedSources.filter(s => s.source === 'EuropePMC').map(s => s.article);
        finalClinicalTrials = selectedSources.filter(s => s.source === 'ClinicalTrials').map(s => s.article);
        finalLandmarkTrials = selectedSources.filter(s => s.source === 'Landmark').map(s => s.article);
        finalNCBIBooks = selectedSources.filter(s => s.source === 'NCBI').map(s => s.article);
        finalDailyMed = selectedSources.filter(s => s.source === 'DailyMed').map(s => s.article);

        // Recalculate final count
        bgeFiltered = selectedSources.length;
        console.log(`✅ FINAL SELECTION: Limited to ${bgeFiltered} highest-priority sources`);
      }
    } else {
      bgeFiltered = semanticFiltered;
      console.log(`⏭️  STEP 5 SKIPPED: BGE reranking disabled`);
    }

    // STEP 6: Check for Tavily fallback (only if evidence insufficient)
    const evidenceCounts = {
      guidelines: finalWHOGuidelines.length + finalCDCGuidelines.length + finalNICEGuidelines.length + finalBMJBestPractice.length,
      systematicReviews: finalCochrane.length + finalOpenAlexReviews.length,
      trials: finalClinicalTrials.length + finalLandmarkTrials.length,
      pubmedArticles: finalPubMed.length,
      cochraneReviews: finalCochrane.length
    };

    let tavilyResult = null;
    let tavilyCitations: any[] = [];

    if (shouldTriggerTavilyFallback(evidenceCounts)) {
      console.log(`📡 STEP 6: Evidence insufficient, triggering Tavily fallback...`);
      try {
        tavilyResult = await searchTavilyMedical(clinicalQuery, { maxResults: 10 });
        tavilyCitations = tavilyResult.citations || [];
        console.log(`✅ Tavily fallback: ${tavilyCitations.length} additional citations`);
      } catch (error: any) {
        console.error('Tavily fallback failed:', error.message);
      }
    } else {
      console.log(`⏭️  STEP 6 SKIPPED: Evidence sufficient, no Tavily fallback needed`);
    }

    // STEP 7: Build final evidence package with CORRECTED structure
    console.log(`🔄 STEP 7: Building final evidence package...`);

    const evidence: EvidencePackage = {
      // PRIMARY EVIDENCE (Tier 1 & 2)
      pubmedArticles: finalPubMed,
      pubmedReviews: [], // Will be populated from PubMed results
      pubmedGuidelines: [],
      europePMCRecent: finalEuropePMC,
      europePMCCited: [],
      europePMCPreprints: [],
      europePMCOpenAccess: [],
      cochraneReviews: finalCochrane,
      cochraneRecent: [],
      pmcArticles: finalPMC,
      pmcRecentArticles: [],
      pmcReviews: [],

      // SCHOLARLY EVIDENCE
      semanticScholarPapers: finalSemanticScholar,
      semanticScholarHighlyCited: [],
      literature: finalOpenAlexLiterature,
      systematicReviews: finalOpenAlexReviews,

      // DRUG INFORMATION (only when drugs detected)
      dailyMedDrugs: finalDailyMed,
      drugLabels: finalDrugLabels,
      adverseEvents: finalAdverseEvents,
      rxnormDrugs: [], // Not used in semantic pipeline
      rxnormClasses: [],
      rxnormInteractions: [],
      rxnormPrescribable: [],

      // CLINICAL EVIDENCE
      clinicalTrials: finalClinicalTrials,
      landmarkTrials: finalLandmarkTrials,

      // GUIDELINES
      whoGuidelines: finalWHOGuidelines,
      cdcGuidelines: finalCDCGuidelines,
      niceGuidelines: finalNICEGuidelines,
      bmjBestPractice: finalBMJBestPractice,
      cardiovascularGuidelines: [],
      guidelines: [],

      // SPECIALIZED SOURCES
      ncbiBooks: finalNCBIBooks,
      aapGuidelines: [], // Not used in semantic pipeline
      aapPolicyStatements: [],
      aapKeyResources: [],
      omimEntries: [], // Not used in semantic pipeline
      pubChemCompounds: [], // Fallback only
      pubChemBioAssays: [],

      // IMAGES (not used in semantic pipeline - OpenI for images only)
      openIResearchArticles: [],
      openIReviewArticles: [],
      openISystematicReviews: [],
      openICaseReports: [],

      // FALLBACK
      tavilyResult,
      tavilyCitations,

      // OTHER
      medlinePlus: { healthTopics: [], drugInfo: [], totalResults: 0 },
      timestamp: new Date().toISOString()
    };

    // STEP 8: Calculate semantic statistics
    const allArticles = [
      ...pubmedData.map(a => ({ title: a.title, abstract: a.abstract })),
      ...europePMCData.map(a => ({ title: a.title, abstract: a.abstractText || '' })),
      ...cochraneData.map(a => ({ title: a.title, abstract: a.abstract || '' })),
      ...pmcData.map(a => ({ title: a.title, abstract: '' })),  // PMCArticle has no abstract field
      ...dailyMedData.map(a => ({ title: a.title, abstract: a.indications || '' })),
      ...clinicalTrialsData.map(a => ({ title: a.title, abstract: a.briefSummary || '' }))
    ];

    const semanticStats = allArticles.length > 0
      ? await this.semanticReranker.getSemanticStats(clinicalQuery, allArticles)
      : { mean: 0, median: 0, min: 0, max: 0, aboveThreshold: 0, totalArticles: 0 };

    const processingTime = Date.now() - startTime;

    const stats: SemanticEvidenceStats = {
      totalApiResults,
      semanticFiltered,
      bgeFiltered,
      finalResults: bgeFiltered,
      processingTime,
      semanticStats: {
        mean: semanticStats.mean,
        median: semanticStats.median,
        aboveThreshold: semanticStats.aboveThreshold
      }
    };

    console.log(`🎉 SEMANTIC EVIDENCE PIPELINE COMPLETE (CORRECTED ARCHITECTURE)`);
    console.log(`   📊 Results: ${totalApiResults} → ${semanticFiltered} → ${bgeFiltered} articles`);
    console.log(`   ⏱️  Time: ${processingTime}ms (${(processingTime / 1000).toFixed(1)}s)`);
    console.log(`   🎯 Semantic stats: mean=${semanticStats.mean}, median=${semanticStats.median}, above_threshold=${semanticStats.aboveThreshold}/${semanticStats.totalArticles}`);
    console.log(`   📡 Tavily fallback: ${tavilyResult ? 'triggered' : 'not needed'}`);

    return { evidence, stats };
  }

  /**
   * Search PubMed with structured query
   */
  private async searchPubMedWithStructuredQuery(
    structuredQuery: string,
    maxResults: number
  ): Promise<PubMedArticle[]> {
    try {
      // Use existing PubMed search but with structured query
      const results = await comprehensivePubMedSearch(structuredQuery, false, []);

      // Combine all PubMed results and limit
      const allArticles = [
        ...results.articles,
        ...results.systematicReviews,
        ...(results.guidelines || [])
      ];

      return allArticles.slice(0, maxResults);
    } catch (error: any) {
      console.error('PubMed structured search failed:', error.message);
      return [];
    }
  }

  /**
   * Search Europe PMC with structured query
   */
  private async searchEuropePMCWithStructuredQuery(
    structuredQuery: string,
    maxResults: number
  ): Promise<EuropePMCArticle[]> {
    try {
      const results = await searchEuropePMC(structuredQuery);

      // Combine all Europe PMC results and limit
      const allArticles = [
        ...results.recent,
        ...results.cited,
        ...results.openAccess
      ];

      return allArticles.slice(0, maxResults);
    } catch (error: any) {
      console.error('Europe PMC structured search failed:', error.message);
      return [];
    }
  }

  /**
   * Search Cochrane with structured query
   */
  private async searchCochraneWithStructuredQuery(
    structuredQuery: string,
    maxResults: number
  ): Promise<CochraneReview[]> {
    try {
      const results = await comprehensiveCochraneSearch(structuredQuery);

      // Combine all Cochrane results and limit
      const allReviews = [
        ...results.allReviews,
        ...results.recentReviews
      ];

      return allReviews.slice(0, maxResults);
    } catch (error: any) {
      console.error('Cochrane structured search failed:', error.message);
      return [];
    }
  }

  /**
   * Search PMC with structured query
   */
  private async searchPMCWithStructuredQuery(
    structuredQuery: string,
    maxResults: number
  ): Promise<PMCArticle[]> {
    try {
      const results = await comprehensivePMCSearch(structuredQuery);

      // Combine all PMC results and limit
      const allArticles = [
        ...results.articles,
        ...results.recentArticles,
        ...results.reviews
      ];

      return allArticles.slice(0, maxResults);
    } catch (error: any) {
      console.error('PMC structured search failed:', error.message);
      return [];
    }
  }

  /**
   * Search DailyMed with DRUG NAMES (not entire query)
   * CORRECTED: Extract drug names first, then search DailyMed
   */
  private async searchDailyMedWithDrugNames(
    drugNames: string[],
    maxResults: number
  ): Promise<any[]> {
    try {
      console.log(`🔍 Searching DailyMed for specific drugs: ${drugNames.join(', ')}`);
      const allDrugs: any[] = [];

      for (const drugName of drugNames.slice(0, 3)) { // Limit to 3 drugs
        try {
          const results = await comprehensiveDailyMedSearch(drugName);
          allDrugs.push(...results.drugs);
        } catch (error: any) {
          console.warn(`⚠️ DailyMed search failed for "${drugName}":`, error.message);
        }
      }

      console.log(`✅ Found ${allDrugs.length} DailyMed drug entries`);
      return allDrugs.slice(0, maxResults);
    } catch (error: any) {
      console.error('DailyMed search failed:', error.message);
      return [];
    }
  }

  /**
   * Search Drug Labels with DRUG NAMES (not entire query)
   */
  private async searchDrugLabelsWithDrugNames(
    drugNames: string[],
    maxResults: number
  ): Promise<any[]> {
    try {
      console.log(`🔍 Searching OpenFDA Drug Labels for: ${drugNames.join(', ')}`);
      const allLabels: any[] = [];

      for (const drugName of drugNames.slice(0, 3)) {
        try {
          const results = await searchDrugLabels(drugName, 2);
          allLabels.push(...results);
        } catch (error: any) {
          console.warn(`⚠️ Drug Labels search failed for "${drugName}":`, error.message);
        }
      }

      console.log(`✅ Found ${allLabels.length} drug labels`);
      return allLabels.slice(0, maxResults);
    } catch (error: any) {
      console.error('Drug Labels search failed:', error.message);
      return [];
    }
  }

  /**
   * Search Adverse Events with DRUG NAMES (not entire query)
   */
  private async searchAdverseEventsWithDrugNames(
    drugNames: string[],
    maxResults: number
  ): Promise<any[]> {
    try {
      console.log(`🔍 Searching OpenFDA Adverse Events for: ${drugNames.join(', ')}`);
      const allEvents: any[] = [];

      for (const drugName of drugNames.slice(0, 3)) {
        try {
          const results = await searchAdverseEvents(drugName, 5);
          allEvents.push(...results);
        } catch (error: any) {
          console.warn(`⚠️ Adverse Events search failed for "${drugName}":`, error.message);
        }
      }

      console.log(`✅ Found ${allEvents.length} adverse event reports`);
      return allEvents.slice(0, maxResults);
    } catch (error: any) {
      console.error('Adverse Events search failed:', error.message);
      return [];
    }
  }

  /**
   * Search OpenAlex Literature with structured query
   */
  private async searchOpenAlexLiteratureWithStructuredQuery(
    clinicalQuery: string,
    maxResults: number
  ): Promise<any[]> {
    try {
      console.log(`🔍 Searching OpenAlex Literature...`);
      const results = await searchLiterature(clinicalQuery);
      console.log(`✅ Found ${results.length} OpenAlex literature articles`);
      return results.slice(0, maxResults);
    } catch (error: any) {
      console.error('OpenAlex Literature search failed:', error.message);
      return [];
    }
  }

  /**
   * Search OpenAlex Reviews with structured query
   */
  private async searchOpenAlexReviewsWithStructuredQuery(
    clinicalQuery: string,
    maxResults: number
  ): Promise<any[]> {
    try {
      console.log(`🔍 Searching OpenAlex Systematic Reviews...`);
      const results = await searchSystematicReviews(clinicalQuery);
      console.log(`✅ Found ${results.length} OpenAlex systematic reviews`);
      return results.slice(0, maxResults);
    } catch (error: any) {
      console.error('OpenAlex Reviews search failed:', error.message);
      return [];
    }
  }

  /**
   * Search Clinical Trials with structured query
   */
  private async searchClinicalTrialsWithStructuredQuery(
    clinicalQuery: string,
    maxResults: number
  ): Promise<any[]> {
    try {
      console.log(`🔍 Searching Clinical Trials...`);
      const results = await searchClinicalTrials(clinicalQuery);
      console.log(`✅ Found ${results.length} clinical trials`);
      return results.slice(0, maxResults);
    } catch (error: any) {
      console.error('Clinical Trials search failed:', error.message);
      return [];
    }
  }

  /**
   * Search WHO Guidelines with structured query
   */
  private async searchWHOGuidelinesWithStructuredQuery(
    clinicalQuery: string,
    maxResults: number
  ): Promise<any[]> {
    try {
      console.log(`🔍 Searching WHO Guidelines...`);
      const results = await searchWHOGuidelines(clinicalQuery);
      console.log(`✅ Found ${results.length} WHO guidelines`);
      return results.slice(0, maxResults);
    } catch (error: any) {
      console.error('WHO Guidelines search failed:', error.message);
      return [];
    }
  }

  /**
   * Search CDC Guidelines with structured query
   */
  private async searchCDCGuidelinesWithStructuredQuery(
    clinicalQuery: string,
    maxResults: number
  ): Promise<any[]> {
    try {
      console.log(`🔍 Searching CDC Guidelines...`);
      const results = await searchCDCGuidelines(clinicalQuery);
      console.log(`✅ Found ${results.length} CDC guidelines`);
      return results.slice(0, maxResults);
    } catch (error: any) {
      console.error('CDC Guidelines search failed:', error.message);
      return [];
    }
  }

  /**
   * Search NICE Guidelines with structured query
   */
  private async searchNICEGuidelinesWithStructuredQuery(
    clinicalQuery: string,
    maxResults: number
  ): Promise<any[]> {
    try {
      console.log(`🔍 Searching NICE Guidelines...`);
      const results = await searchNICEGuidelines(clinicalQuery);
      console.log(`✅ Found ${results.length} NICE guidelines`);
      return results.slice(0, maxResults);
    } catch (error: any) {
      console.error('NICE Guidelines search failed:', error.message);
      return [];
    }
  }

  /**
   * Search BMJ Best Practice with structured query
   */
  private async searchBMJBestPracticeWithStructuredQuery(
    clinicalQuery: string,
    maxResults: number
  ): Promise<any[]> {
    try {
      console.log(`🔍 Searching BMJ Best Practice...`);
      const results = await searchBMJBestPractice(clinicalQuery);
      console.log(`✅ Found ${results.length} BMJ Best Practice articles`);
      return results.slice(0, maxResults);
    } catch (error: any) {
      console.error('BMJ Best Practice search failed:', error.message);
      return [];
    }
  }

  /**
   * Search Landmark Trials with structured query
   */
  private async searchLandmarkTrialsWithStructuredQuery(
    clinicalQuery: string,
    maxResults: number
  ): Promise<any[]> {
    try {
      console.log(`🔍 Searching Landmark Trials...`);
      const results = await searchLandmarkTrials(clinicalQuery);
      console.log(`✅ Found ${results.length} landmark trials`);
      return results.slice(0, maxResults);
    } catch (error: any) {
      console.error('Landmark Trials search failed:', error.message);
      return [];
    }
  }

  /**
   * Search Semantic Scholar with structured query
   */
  private async searchSemanticScholarWithStructuredQuery(
    clinicalQuery: string,
    maxResults: number
  ): Promise<any[]> {
    try {
      console.log(`🔍 Searching Semantic Scholar...`);
      const [papers, highlyCited] = await Promise.all([
        searchSemanticScholar(clinicalQuery),
        searchHighlyCitedMedical(clinicalQuery)
      ]);
      const allPapers = [...papers, ...highlyCited];
      console.log(`✅ Found ${allPapers.length} Semantic Scholar papers`);
      return allPapers.slice(0, maxResults);
    } catch (error: any) {
      console.error('Semantic Scholar search failed:', error.message);
      return [];
    }
  }

  /**
   * Search NCBI Books with structured query
   */
  private async searchNCBIBooksWithStructuredQuery(
    clinicalQuery: string,
    maxResults: number
  ): Promise<any[]> {
    try {
      console.log(`🔍 Searching NCBI Books (StatPearls)...`);
      const results = await searchStatPearls(clinicalQuery);
      console.log(`✅ Found ${results.length} NCBI book chapters`);
      return results.slice(0, maxResults);
    } catch (error: any) {
      console.error('NCBI Books search failed:', error.message);
      return [];
    }
  }

  /**
   * Test semantic similarity for a query without full pipeline
   * Useful for debugging and threshold tuning
   */
  async testSemanticSimilarity(
    clinicalQuery: string,
    testArticles: Array<{ title: string; abstract: string }>
  ): Promise<Array<{ title: string; similarity: number }>> {
    console.log(`🧪 Testing semantic similarity for: "${clinicalQuery}"`);

    const queryEmbedding = await this.embedder.embedQuery(clinicalQuery);
    const articleEmbeddings = await this.embedder.embedArticlesBatch(testArticles);

    const results = testArticles.map((article, i) => ({
      title: article.title,
      similarity: Math.round(
        MedCPTEmbedder.cosineSimilarity(queryEmbedding, articleEmbeddings[i]) * 1000
      ) / 1000
    }));

    // Sort by similarity
    results.sort((a, b) => b.similarity - a.similarity);

    console.log(`📊 Top 5 similarities:`);
    results.slice(0, 5).forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.similarity}: "${r.title.substring(0, 80)}..."`);
    });

    return results;
  }

  /**
   * Compare different threshold values
   * Helps optimize semantic filtering thresholds
   */
  async optimizeThresholds(
    clinicalQuery: string,
    testArticles: Array<{ title: string; abstract: string; isRelevant: boolean }>
  ): Promise<{
    threshold: number;
    precision: number;
    recall: number;
    f1: number;
  }[]> {
    console.log(`🎯 Optimizing thresholds for: "${clinicalQuery}"`);

    const queryEmbedding = await this.embedder.embedQuery(clinicalQuery);
    const articleEmbeddings = await this.embedder.embedArticlesBatch(testArticles);

    const similarities = testArticles.map((article, i) => ({
      similarity: MedCPTEmbedder.cosineSimilarity(queryEmbedding, articleEmbeddings[i]),
      isRelevant: article.isRelevant
    }));

    const thresholds = [0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8];
    const results = [];

    for (const threshold of thresholds) {
      const predicted = similarities.map(s => s.similarity >= threshold);
      const actual = similarities.map(s => s.isRelevant);

      const tp = predicted.filter((p, i) => p && actual[i]).length;
      const fp = predicted.filter((p, i) => p && !actual[i]).length;
      const fn = predicted.filter((p, i) => !p && actual[i]).length;

      const precision = tp / (tp + fp) || 0;
      const recall = tp / (tp + fn) || 0;
      const f1 = 2 * (precision * recall) / (precision + recall) || 0;

      results.push({ threshold, precision, recall, f1 });
    }

    // Sort by F1 score
    results.sort((a, b) => b.f1 - a.f1);

    console.log(`📊 Threshold optimization results:`);
    results.forEach(r => {
      console.log(`   ${r.threshold}: P=${r.precision.toFixed(3)}, R=${r.recall.toFixed(3)}, F1=${r.f1.toFixed(3)}`);
    });

    return results;
  }
}

// Export singleton instance
let semanticEngineInstance: SemanticEvidenceEngine | null = null;

export function getSemanticEvidenceEngine(): SemanticEvidenceEngine {
  if (!semanticEngineInstance) {
    semanticEngineInstance = new SemanticEvidenceEngine();
  }
  return semanticEngineInstance;
}