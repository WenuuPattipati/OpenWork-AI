/**
 * Evidence Engine - Coordinates all 57+ medical database evidence sources
 * This is the main interface for retrieving clinical evidence
 * 
 * RAG INTEGRATION: Now uses intelligent evidence retrieval with scenario-specific queries
 * Note: Google Search grounding is handled separately in the API route as fallback
 */

// Initialize evidence system and validate configuration
import './init';

// RAG SYSTEM IMPORTS
import { rankRAGEvidence, type RAGRankingConfig } from './rag-evidence-ranker';

import { searchClinicalTrials, ClinicalTrial } from "./clinical-trials";
import { searchDrugLabels, searchAdverseEvents, DrugLabel, AdverseEvent } from "./openfda";
import { searchLiterature, searchSystematicReviews, searchRecentLiterature, searchClinicalTrials as searchOpenAlexClinicalTrials, ScholarlyWork } from "./openalex";
import { comprehensivePubMedSearch, PubMedArticle } from "./pubmed";
import { comprehensiveSearch, EuropePMCArticle } from "./europepmc";
import { scoreEvidence, formatQualityScore, EvidenceScore } from "./quality-scorer";
import { searchSemanticScholar, searchHighlyCitedMedical, SemanticScholarPaper } from "./semantic-scholar";
import { comprehensiveMedlinePlusSearch, formatMedlinePlusForPrompt, MedlinePlusResult } from "./medlineplus";
import { comprehensivePMCSearch, formatPMCForPrompt, PMCArticle } from "./pmc";
import { comprehensiveCochraneSearch, formatCochraneForPrompt, CochraneReview } from "./cochrane";
import { comprehensiveDailyMedSearch, DailyMedDrug } from "./dailymed";
import { comprehensiveAAPSearch, formatAAPForPrompt, AAPGuideline, isPediatricQuery } from "./aap";
import { comprehensiveRxNormSearch, formatRxNormForPrompt, RxNormDrug, RxNormDrugClass, RxNormInteraction } from "./rxnorm";
// New international guideline sources
import { searchWHOGuidelines, formatWHOGuidelinesForPrompt, WHOGuideline } from "./who-guidelines";
import { searchCDCGuidelines, formatCDCGuidelinesForPrompt, CDCGuideline } from "./cdc-guidelines";
import { searchNICEGuidelines, formatNICEGuidelinesForPrompt, NICEGuideline } from "./nice-guidelines";
import { searchBMJBestPractice, formatBMJBestPracticeForPrompt, BMJBestPractice } from "./bmj-best-practice";
// Cardiovascular guidelines (ACC/AHA, ESC)
import { searchCardiovascularGuidelines, formatCardiovascularGuidelinesForPrompt, getLDLTargetComparison, CardiovascularGuideline } from "./cardiovascular-guidelines";
// Enhanced NCBI sources
import { searchStatPearls, formatNCBIBooksForPrompt, NCBIBook } from "./ncbi-books";
import { enhanceQueryWithMeSH, isLifestyleQuery, generateLifestyleSearchQueries } from "./mesh-mapper";
import { searchOMIM, isGeneticQuery, formatOMIMForPrompt, OMIMEntry } from "./omim";
import { comprehensivePubChemSearch, formatPubChemForPrompt, shouldUsePubChemFallback, extractDrugTermsFromQuery, PubChemCompound, PubChemBioAssay } from "./pubchem";
// Tavily AI fallback for when primary databases return insufficient results
import { searchTavilyMedical, formatTavilyForPrompt, shouldTriggerTavilyFallback, TavilyCitation, TavilySearchResult, extractSourceInfo } from "./tavily";
// Phase 2: Semantic Enhancement → Now using BGE Cross-Encoder for better accuracy
import {
  rerankPubMedWithBGE,
  rerankCochraneWithBGE,
  rerankEuropePMCWithBGE,
  rerankOpenAlexWithBGE,
  rerankSemanticScholarWithBGE,
  rerankPMCWithBGE,
  rerankClinicalTrialsWithBGE,
  rerankDailyMedWithBGE,
  rerankAAPWithBGE
} from "./bge-reranker";
import { enrichEvidenceMetadata, formatBadges } from "./metadata-enricher";
// Landmark Trials Database
import { searchLandmarkTrials, formatLandmarkTrialsForPrompt, LandmarkTrial } from "./landmark-trials";
// Open-i (NLM) - Articles and Images
import { comprehensiveOpenIArticleSearch } from "../open-i-client";
// PICO-First Pipeline (Quality Fix)
import { generateTagsFromQuery, decomposeQuery, type PICOExtraction } from "./pico-extractor";
import { classifyQuery } from "./query-classifier";
// Query Clarification (Phase 1 Enhancement)
import { clarifyQuery, type ClarifiedQuery } from "./query-clarifier";
// Medical Observation Extraction (Phase 2 Enhancement)
import { extractMedicalObservations, type MedicalObservationSummary } from "./observation-extractor";
// Guideline Search Strategy (Phase 3 Enhancement)
import { generateGuidelineSearchStrategy, type GuidelineSearchStrategy } from "./guideline-search-strategy";
import { scoreEvidenceSufficiencyWithTags, detectAnchorScenario } from "./sufficiency-scorer";
import { rankAndFilterEvidenceWithTags, type TagBasedRankingConfig } from "./evidence-ranker";
// Evidence filtering by classification
import { filterEvidenceByClassification } from "./evidence-filter";
// Full-text fetching for top articles (DOI → PMC → Abstract fallback)
import {
  fetchFullTextForTopArticles,
  formatFullTextForPrompt,
  // NEW: Chunk-based processing
  fetchAndChunkFullTextForTopArticles,
  formatChunksForPrompt,
  type ArticleChunk
} from "./fulltext-fetcher";
// NEW: Chunk-level reranking
import {
  rerankChunksWithBGE,
  articleChunksToRerankFormat,
  type ChunkForRerank
} from "./bge-reranker";
// NEW: Abstract chunking for PubMed articles
import {
  createAbstractChunksFromArticles,
  abstractChunksToRerankFormat,
  type AbstractChunk
} from "./sentence-splitter";

export interface ClinicalGuideline {
  source: string;
  type: string;
  title: string;
  url: string;
  journal: string;
  year: string;
  authors: string;
  summary: string;
}

export interface EvidencePackage {
  clinicalTrials: ClinicalTrial[];
  drugLabels: DrugLabel[];
  adverseEvents: AdverseEvent[];
  literature: ScholarlyWork[];
  systematicReviews: ScholarlyWork[];
  pubmedArticles: PubMedArticle[];
  pubmedReviews: PubMedArticle[];
  pubmedGuidelines: PubMedArticle[]; // NEW: Guidelines from PubMed
  europePMCRecent: EuropePMCArticle[];
  europePMCCited: EuropePMCArticle[];
  europePMCPreprints: EuropePMCArticle[];
  europePMCOpenAccess: EuropePMCArticle[];
  semanticScholarPapers: SemanticScholarPaper[];
  semanticScholarHighlyCited: SemanticScholarPaper[];
  medlinePlus: MedlinePlusResult;
  pmcArticles: PMCArticle[];
  pmcRecentArticles: PMCArticle[];
  pmcReviews: PMCArticle[];
  cochraneReviews: CochraneReview[];
  cochraneRecent: CochraneReview[];
  dailyMedDrugs: DailyMedDrug[];
  aapGuidelines: AAPGuideline[];
  aapPolicyStatements: AAPGuideline[];
  aapKeyResources: AAPGuideline[];
  rxnormDrugs: RxNormDrug[];
  rxnormClasses: RxNormDrugClass[];
  rxnormInteractions: RxNormInteraction[];
  rxnormPrescribable: RxNormDrug[];
  guidelines: ClinicalGuideline[];
  // International guidelines
  whoGuidelines: WHOGuideline[];
  cdcGuidelines: CDCGuideline[];
  niceGuidelines: NICEGuideline[];
  bmjBestPractice: BMJBestPractice[];
  // Cardiovascular guidelines (ACC/AHA, ESC)
  cardiovascularGuidelines: CardiovascularGuideline[];
  // Enhanced NCBI sources
  ncbiBooks: NCBIBook[];
  omimEntries: OMIMEntry[];
  // PubChem (fallback for DailyMed)
  pubChemCompounds: PubChemCompound[];
  pubChemBioAssays: PubChemBioAssay[];
  // Tavily AI (fallback when primary sources insufficient)
  tavilyResult: TavilySearchResult | null;
  tavilyCitations: TavilyCitation[];
  // Landmark Trials (curated high-impact trials)
  landmarkTrials: LandmarkTrial[];
  // Open-i articles (NLM biomedical literature)
  openIResearchArticles: any[]; // OpenIArticle[]
  openIReviewArticles: any[]; // OpenIArticle[]
  openISystematicReviews: any[]; // OpenIArticle[]
  openICaseReports: any[]; // OpenIArticle[]
  // PICO tags (for tag-based ranking and filtering)
  picoTags?: PICOExtraction;
  timestamp: string;
}

/**
 * Extract patient age from query
 * Matches patterns like "52-year-old", "52 year old", "52yo", "age 52"
 */
function extractPatientAge(query: string): number | null {
  const patterns = [
    /(\d+)[-\s]year[-\s]old/i,
    /(\d+)\s*yo\b/i,
    /age\s*(\d+)/i,
    /(\d+)\s*y\.?o\.?/i
  ];

  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match) {
      const age = parseInt(match[1]);
      console.log(`👤 Extracted patient age: ${age} years`);
      return age;
    }
  }

  return null;
}

/**
 * Filter out age-inappropriate guidelines and articles
 * Excludes pediatric/neonatal content for adult patients and vice versa
 */
function filterByAge<T extends { title: string; abstract?: string }>(
  articles: T[],
  patientAge: number | null
): { filtered: T[]; removed: number; reasons: string[] } {
  if (!patientAge) {
    return { filtered: articles, removed: 0, reasons: [] };
  }

  const isAdult = patientAge >= 18;
  const isPediatric = patientAge < 18;
  const isNeonatal = patientAge < 0.1; // < 1 month

  const filtered: T[] = [];
  const reasons: string[] = [];

  for (const article of articles) {
    const title = article.title.toLowerCase();
    const abstract = (article.abstract || '').toLowerCase();
    const text = `${title} ${abstract}`;

    let shouldFilter = false;
    let filterReason = '';

    // Exclude pediatric/neonatal for adults
    if (isAdult) {
      const pediatricKeywords = [
        'neonatal', 'neonate', 'infant', 'pediatric', 'paediatric',
        'child', 'children', 'adolescent', 'newborn', 'nicu'
      ];

      // Check if article is specifically about pediatric population
      const isPediatricArticle = pediatricKeywords.some(keyword =>
        text.includes(keyword) &&
        !text.includes('adult') // Allow if it mentions both
      );

      if (isPediatricArticle) {
        shouldFilter = true;
        filterReason = `Pediatric/neonatal article excluded for adult patient (age ${patientAge})`;
      }
    }

    // Exclude adult-specific for pediatric
    if (isPediatric) {
      const adultKeywords = ['elderly', 'geriatric', 'older adult'];
      const isAdultArticle = adultKeywords.some(keyword => text.includes(keyword));

      if (isAdultArticle) {
        shouldFilter = true;
        filterReason = `Adult-specific article excluded for pediatric patient (age ${patientAge})`;
      }
    }

    if (shouldFilter) {
      reasons.push(`${filterReason}: "${article.title}"`);
    } else {
      filtered.push(article);
    }
  }

  const removed = articles.length - filtered.length;
  if (removed > 0) {
    console.log(`🚫 Age-based filtering removed ${removed}/${articles.length} articles`);
  }

  return { filtered, removed, reasons };
}

/**
 * Detect if query is diabetes-related
 */
function isDiabetesQuery(query: string): boolean {
  const diabetesKeywords = [
    'diabetes', 'diabetic', 'dm', 't1d', 't2d', 'type 1', 'type 2',
    'insulin', 'metformin', 'hba1c', 'glucose', 'glycemic',
    'hyperglycemia', 'hypoglycemia', 'dka', 'diabetic ketoacidosis'
  ];

  const lowerQuery = query.toLowerCase();
  return diabetesKeywords.some(keyword => lowerQuery.includes(keyword));
}

/**
 * Enhanced query processing for drug comparison queries
 * Implements 3-bucket requirement: Condition + Therapy + Renal (if applicable)
 */
function enhanceQueryForDrugComparison(query: string): string {
  const lowerQuery = query.toLowerCase();

  // Detect drug comparison queries
  const isDrugComparison = /compare|versus|vs\.?|difference/i.test(query);
  const hasApixaban = /apixaban/i.test(query);
  const hasRivaroxaban = /rivaroxaban/i.test(query);
  const hasAtrialFib = /atrial fibrillation|af\b|nvaf/i.test(query);
  const hasCKD = /chronic kidney disease|ckd|renal|kidney|egfr/i.test(query);

  // CRITICAL FIX: Detect pneumonia antibiotic queries
  const isPneumoniaQuery = /pneumonia.*antibiotic|antibiotic.*pneumonia|hospital.*acquired.*pneumonia|HAP/i.test(query);
  const hasMRSA = /mrsa/i.test(query);
  const hasPseudomonas = /pseudomonas/i.test(query);
  const hasVancomycin = /vancomycin/i.test(query);
  const hasPiperacillin = /piperacillin.*tazobactam|pip.*tazo/i.test(query);
  const hasCefepime = /cefepime/i.test(query);

  if (isPneumoniaQuery && (hasMRSA || hasPseudomonas) && (hasVancomycin || hasPiperacillin || hasCefepime)) {
    // CRITICAL: 3-bucket requirement for pneumonia antibiotic queries
    // Bucket A (condition): hospital-acquired pneumonia
    // Bucket B (pathogens): MRSA AND Pseudomonas
    // Bucket C (antibiotics): vancomycin, piperacillin-tazobactam, cefepime

    let focused = '(hospital-acquired pneumonia OR HAP OR nosocomial pneumonia) AND (MRSA OR "methicillin-resistant staphylococcus aureus") AND (Pseudomonas aeruginosa OR "P. aeruginosa")';

    if (hasVancomycin && (hasPiperacillin || hasCefepime)) {
      focused += ' AND (vancomycin AND (piperacillin-tazobactam OR cefepime))';
    }

    // Add outcome terms
    focused += ' AND (empiric treatment OR antibiotic therapy OR antimicrobial therapy OR clinical outcomes OR nephrotoxicity OR efficacy)';

    console.log(`🎯 Pneumonia antibiotic query detected: 3-bucket constraint applied`);
    console.log(`   Query: "${focused}"`);
    return focused;
  }

  if (isDrugComparison && hasApixaban && hasRivaroxaban && hasAtrialFib) {
    // CRITICAL: 3-bucket requirement to prevent SGLT2 contamination
    // Bucket A (condition): atrial fibrillation
    // Bucket B (therapy): apixaban OR rivaroxaban  
    // Bucket C (renal): CKD terms if applicable

    let focused = '(atrial fibrillation OR AF) AND (apixaban OR rivaroxaban OR "factor Xa inhibitor" OR anticoagulant)';

    if (hasCKD) {
      focused += ' AND (chronic kidney disease OR CKD OR eGFR OR "creatinine clearance" OR "renal impairment")';
    }

    // Add outcome terms
    focused += ' AND (stroke prevention OR bleeding risk OR efficacy OR safety)';

    console.log(`🎯 Drug comparison query detected: 3-bucket constraint applied`);
    console.log(`   Query: "${focused}"`);
    return focused;
  }

  return query;
}

/**
 * Post-retrieval filter to exclude SGLT2 studies unless explicitly requested
 * Prevents DAPA-CKD/EMPA-KIDNEY contamination in AF anticoagulation queries
 */
function filterSGLT2Contamination<T extends { title: string; abstract?: string }>(
  articles: T[],
  query: string
): { filtered: T[]; removed: number; reasons: string[] } {
  const lowerQuery = query.toLowerCase();
  const explicitSGLT2Request = /sglt2|empagliflozin|dapagliflozin|canagliflozin|sotagliflozin/i.test(query);

  if (explicitSGLT2Request) {
    // User explicitly asked about SGLT2 - don't filter
    return { filtered: articles, removed: 0, reasons: [] };
  }

  const sglt2Keywords = [
    'empagliflozin', 'dapagliflozin', 'canagliflozin', 'sotagliflozin',
    'sglt2', 'sglt-2', 'sodium-glucose cotransporter',
    'dapa-ckd', 'empa-kidney', 'emperor-reduced', 'emperor-preserved'
  ];

  const filtered: T[] = [];
  const reasons: string[] = [];

  for (const article of articles) {
    const title = article.title.toLowerCase();
    const abstract = (article.abstract || '').toLowerCase();
    const text = `${title} ${abstract}`;

    const hasSGLT2 = sglt2Keywords.some(keyword => text.includes(keyword));

    if (hasSGLT2) {
      reasons.push(`SGLT2 study filtered: "${article.title}"`);
    } else {
      filtered.push(article);
    }
  }

  const removed = articles.length - filtered.length;
  if (removed > 0) {
    console.log(`🚫 SGLT2 contamination filter removed ${removed}/${articles.length} articles`);
  }

  return { filtered, removed, reasons };
}

/**
 * Detect brain tumor + seizure scenario and enhance query for neuro-oncology
 */
function enhanceNeuroOncologyQuery(query: string): string {
  const hasBrainImaging = /brain\s+(mri|ct|scan|imaging)/i.test(query);
  const hasSeizure = /seizure/i.test(query);
  const hasBrainTumor = /brain\s+(tumor|tumour|neoplasm|mass|lesion)/i.test(query);
  const age = extractPatientAge(query);
  const isAdult = age && age >= 18;

  if ((hasBrainImaging || hasBrainTumor) && hasSeizure && isAdult) {
    // This is likely an adult brain tumor scenario
    console.log('🧠 Neuro-oncology scenario detected: enhancing query for adult brain tumor literature');
    return `${query} (adult glioma OR meningioma OR brain neoplasm) AND (new-onset seizure OR focal seizure)`;
  }

  return query;
}

/**
 * Boost relevance for neuro-oncology articles
 * Prioritizes adult brain tumor literature over pediatric seizure guidelines
 */
function boostNeuroOncologyRelevance<T extends { title: string; abstract?: string }>(
  articles: T[],
  query: string
): T[] {
  const hasBrainTumor = /brain\s+(tumor|tumour|neoplasm|mass|lesion)/i.test(query);
  const hasSeizure = /seizure/i.test(query);
  const age = extractPatientAge(query);
  const isAdult = age && age >= 18;

  if (!hasBrainTumor && !hasSeizure) return articles;
  if (!isAdult) return articles; // Only boost for adult patients

  console.log('🎯 Applying neuro-oncology relevance boosting for adult brain tumor scenario');

  // Add relevance scores
  const scored = articles.map(article => {
    const title = article.title.toLowerCase();
    const abstract = (article.abstract || '').toLowerCase();
    const text = `${title} ${abstract}`;
    let boost = 1.0;

    // Boost adult brain tumor articles
    if (title.includes('glioma')) boost *= 1.5;
    if (title.includes('meningioma')) boost *= 1.5;
    if (title.includes('brain neoplasm') || title.includes('brain tumor') || title.includes('brain tumour')) boost *= 1.4;
    if (text.includes('adult') && text.includes('seizure')) boost *= 1.3;
    if (text.includes('new-onset seizure') || text.includes('new onset seizure')) boost *= 1.3;
    if (text.includes('maximal safe resection')) boost *= 1.2;
    if (text.includes('brain surgery') || text.includes('neurosurgery')) boost *= 1.2;

    // Penalize pediatric articles (should already be filtered, but double-check)
    if (title.includes('neonatal') || title.includes('infant')) boost *= 0.1;
    if (title.includes('pediatric') || title.includes('paediatric') || title.includes('child')) boost *= 0.3;

    return {
      article,
      relevance_score: boost
    };
  });

  // Sort by relevance score (descending)
  scored.sort((a, b) => b.relevance_score - a.relevance_score);

  // Log top boosted articles
  const topBoosted = scored.filter(s => s.relevance_score > 1.0).slice(0, 3);
  if (topBoosted.length > 0) {
    console.log(`📈 Top boosted articles:`);
    topBoosted.forEach(s => console.log(`   ${s.relevance_score.toFixed(2)}x: "${s.article.title}"`));
  }

  return scored.map(s => s.article);
}

/**
 * Get relevant clinical guidelines based on query
 */
function getRelevantGuidelines(query: string): ClinicalGuideline[] {
  const guidelines: ClinicalGuideline[] = [];

  // ADA Standards of Care for diabetes queries
  if (isDiabetesQuery(query)) {
    guidelines.push({
      source: 'ADA Standards',
      type: 'Guideline',
      title: 'Standards of Care in Diabetes—2026',
      url: 'https://diabetesjournals.org/care/issue/47/Supplement_1',
      journal: 'Diabetes Care',
      year: '2026',
      authors: 'American Diabetes Association Professional Practice Committee',
      summary: 'The American Diabetes Association (ADA) Standards of Medical Care in Diabetes provides comprehensive, evidence-based recommendations for diabetes diagnosis, treatment, and management. Updated annually, these guidelines represent the gold standard for diabetes care.',
    });
  }

  return guidelines;
}

/**
 * RAG-ENABLED EVIDENCE RETRIEVAL FUNCTION
 * 
 * Uses intelligent scenario-aware evidence retrieval instead of generic search
 * Supports both Doctor Mode (clinical) and General Mode (consumer) queries
 * 
 * RAG PROCESS:
 * 1. Query Analysis & Tag Extraction
 * 2. Scenario Detection (HFpEF, VTE failure, AF+CKD, etc.)
 * 3. Sub-Query Generation (guidelines, trials, safety, outcomes)
 * 4. Targeted Evidence Retrieval
 * 5. Relevance Ranking & Filtering
 * 6. Final Evidence Package Assembly
 */
// COMMENTED OUT - RAG system dependencies removed
// export async function gatherEvidenceRAG(
//   clinicalQuery: string,
//   mode: 'doctor' | 'general' = 'doctor',
//   drugNames: string[] = []
// ): Promise<{ evidence: EvidencePackage; debug: RAGDebugInfo }> {
//   console.log(`🤖 RAG Evidence Gathering Started (${mode.toUpperCase()} MODE)`);
//   
//   // Use RAG system for intelligent evidence retrieval
//   const { evidence, debug } = await getRAGEvidencePackage(clinicalQuery, mode, drugNames);
//   
//   // Apply RAG ranking and filtering
//   const rankingConfig: RAGRankingConfig = {
//     mode,
//     queryTags: debug.queryTags,
//     detectedScenario: debug.detectedScenario,
//     maxEvidenceItems: mode === 'doctor' ? 25 : 15, // Doctor mode gets more evidence
//     prioritizeRecent: true,
//     requireOpenAccess: true // Only accessible sources
//   };
//   
//   const rankedEvidence = rankRAGEvidence(evidence, rankingConfig);
//   
//   console.log(`✅ RAG Evidence Gathering Complete`);
//   console.log(`📊 Final evidence: ${debug.totalEvidence} → ${getTotalEvidenceCount(rankedEvidence)} items`);
//   
//   return { evidence: rankedEvidence, debug };
// }

/**
 * LEGACY EVIDENCE RETRIEVAL FUNCTION (Fallback)
 * 
 * Original evidence gathering function - kept for backward compatibility
 * Use gatherEvidenceRAG for new implementations
 */
export async function gatherEvidence(
  clinicalQuery: string,
  drugNames: string[] = []
): Promise<EvidencePackage> {
  console.log("🔍 Gathering evidence for:", clinicalQuery);

  // STEP 0: PICO-First Pipeline - Extract tags for downstream modules
  // Use fast pattern-based extraction wrapped in full PICO structure
  let picoTags: PICOExtraction;
  let clarifiedQuery: any = null; // Will store ClarifiedQuery if available

  try {
    // Use pattern-based tag extraction (fast, no API call)
    const tags = generateTagsFromQuery(clinicalQuery);

    // Wrap in full PICO structure
    picoTags = {
      patient: '',
      intervention: '',
      comparison: null,
      outcome: '',
      condition: tags.primary_disease_tag || '',
      ...tags,
    };

    console.log(`📋 PICO Tags: diseases=[${picoTags.disease_tags.join(', ')}], decisions=[${picoTags.decision_tags.join(', ')}]`);

    // Classify query based on tags
    const classification = classifyQuery(picoTags.disease_tags, picoTags.decision_tags);
    console.log(`🏷️  Query classification: ${classification.classification} (confidence: ${Math.round(classification.confidence * 100)}%)`);
  } catch (error: any) {
    console.error('⚠️  PICO extraction failed, falling back to original behavior:', error.message);
    // Fallback: create empty tags
    picoTags = {
      patient: '',
      intervention: '',
      comparison: null,
      outcome: '',
      condition: '',
      disease_tags: [],
      decision_tags: [],
      primary_disease_tag: '',
      secondary_disease_tags: [],
      primary_decision_tag: '',
      secondary_decision_tags: [],
    };
  }

  // STEP 0.5: Query Decomposition for long queries (>100 words)
  const wordCount = clinicalQuery.split(/\s+/).length;
  let searchQueries = [clinicalQuery]; // Default to original query

  if (wordCount > 100 && picoTags.disease_tags.length > 0) {
    try {
      const decomposition = await decomposeQuery(clinicalQuery, picoTags);
      if (decomposition.should_decompose && decomposition.sub_queries.length > 0) {
        searchQueries = decomposition.sub_queries.map((sq: any) => sq.query);
        console.log(`📝 Decomposed long query (${wordCount} words) into ${searchQueries.length} focused sub-queries`);
      }
    } catch (error: any) {
      console.error('⚠️  Query decomposition failed, using original query:', error.message);
    }
  }

  // STEP 1: Intelligent abbreviation-aware search strategy
  const {
    generateSearchVariants,
    createEvidenceSearchStrategy,
    getAbbreviationCoverage
  } = await import('./medical-abbreviations');

  // Analyze abbreviations in query
  const coverage = getAbbreviationCoverage(clinicalQuery);
  const searchStrategy = createEvidenceSearchStrategy(clinicalQuery);

  console.log(`📊 Abbreviation Analysis:`);
  console.log(`   Coverage: ${Math.round(coverage.coverage * 100)}%`);
  console.log(`   Known: ${coverage.knownAbbrevs.join(', ') || 'none'}`);
  if (coverage.unknownAbbrevs.length > 0) {
    console.log(`   ⚠️  Unknown: ${coverage.unknownAbbrevs.join(', ')}`);
  }
  console.log(`   Strategy: ${searchStrategy.strategy}`);
  console.log(`   Reasoning: ${searchStrategy.reasoning}`);

  // Generate all search variants
  const queryVariants = generateSearchVariants(clinicalQuery);
  if (queryVariants.length > 1) {
    console.log(`🔄 Generated ${queryVariants.length} search variants for comprehensive evidence retrieval`);
    console.log(`   Original: "${clinicalQuery}"`);
    queryVariants.slice(1).forEach((variant, idx) => {
      console.log(`   Variant ${idx + 1}: "${variant}"`);
    });
  }

  // Use strategy-recommended primary query
  const primarySearchQuery = searchStrategy.primaryQuery;
  const secondarySearchQuery = searchStrategy.secondaryQuery;

  console.log(`🎯 Primary search: "${primarySearchQuery}"`);
  if (secondarySearchQuery) {
    console.log(`🎯 Secondary search: "${secondarySearchQuery}"`);
  }

  // STEP 1.4: MEDICAL OBSERVATION EXTRACTION (Phase 2 Enhancement)
  // Extract vitals, labs, imaging, exam findings for clinical context awareness
  let observations: MedicalObservationSummary | null = null;
  try {
    observations = extractMedicalObservations(clinicalQuery, primarySearchQuery);

    // Store observations for downstream use
    if (observations.has_observations) {
      console.log(`🔬 Medical Observations: ${observations.urgency_level.toUpperCase()} urgency`);
      if (observations.red_flags.length > 0) {
        console.log(`   ⚠️  RED FLAGS: ${observations.red_flags.slice(0, 3).join('; ')}`);
      }
    }
  } catch (error: any) {
    console.error('⚠️  Medical observation extraction failed:', error.message);
    // Continue without observations - system will work without them
  }

  // STEP 1.5: QUERY CLARIFICATION (Phase 1 Enhancement)
  // Transform fuzzy query into structured ClarifiedQuery object
  // This eliminates noise in tag extraction and boosts classification confidence
  let guidelineSearchStrategy: GuidelineSearchStrategy | null = null;

  try {
    const clarificationResult = await clarifyQuery(
      clinicalQuery,
      primarySearchQuery, // Use expanded query
      picoTags.disease_tags,
      picoTags.decision_tags,
      observations // Pass observations for context
    );

    clarifiedQuery = clarificationResult.clarified;

    console.log(`🔍 Query Clarification:`);
    console.log(`   Decision type: ${clarifiedQuery.decision_type}`);
    console.log(`   Guideline bodies: ${clarifiedQuery.guideline_bodies.join(', ') || 'none'}`);
    console.log(`   Key drugs: ${clarifiedQuery.key_drugs.join(', ') || 'none'}`);
    console.log(`   Key biomarkers: ${clarifiedQuery.key_biomarkers.join(', ') || 'none'}`);
    console.log(`   Confidence: ${Math.round(clarifiedQuery.confidence * 100)}%`);

    if (clarificationResult.validation_warnings.length > 0) {
      console.log(`   ⚠️  Warnings: ${clarificationResult.validation_warnings.join('; ')}`);
    }

    // STEP 1.6: GUIDELINE SEARCH STRATEGY (Phase 3 Enhancement)
    // Generate progressive search strategy for guideline queries
    if (clarifiedQuery.decision_type === 'guideline') {
      guidelineSearchStrategy = generateGuidelineSearchStrategy(clarifiedQuery, clinicalQuery);

      console.log(`📋 Guideline Search Strategy:`);
      console.log(`   Primary query: "${guidelineSearchStrategy.primary_query}"`);
      console.log(`   Relaxed queries: ${guidelineSearchStrategy.relaxed_queries.length}`);
      console.log(`   Fallback queries: ${guidelineSearchStrategy.fallback_queries.length}`);
      console.log(`   Min evidence threshold: ${guidelineSearchStrategy.min_evidence_threshold}`);
    }

  } catch (error: any) {
    console.error('⚠️  Query clarification failed:', error.message);
    // Continue without clarification - system will use existing PICO tags
  }

  // STEP 1.7: Detect if this is a lifestyle/prevention query
  const isLifestyle = isLifestyleQuery(clinicalQuery);
  if (isLifestyle) {
    console.log("🏃 Lifestyle/prevention query detected - using enhanced search strategy");
  }

  // STEP 1.8: Extract patient age for age-based filtering
  const patientAge = extractPatientAge(clinicalQuery);
  if (patientAge) {
    console.log(`👤 Patient age detected: ${patientAge} years (${patientAge >= 18 ? 'adult' : 'pediatric'})`);
  }

  // STEP 2: Multi-Database Query Optimization
  // Enhance query for each database type to maximize evidence retrieval
  // Start with the expanded query that has full terms instead of abbreviations
  let enhancedQuery = primarySearchQuery;
  let guidelineQuery = primarySearchQuery;
  let trialQuery = primarySearchQuery;

  // CRITICAL FIX: Apply drug comparison enhancement first
  enhancedQuery = enhanceQueryForDrugComparison(enhancedQuery);

  // Use primary query from guideline strategy if available
  if (guidelineSearchStrategy?.is_guideline_query) {
    enhancedQuery = guidelineSearchStrategy.primary_query;
    guidelineQuery = guidelineSearchStrategy.primary_query;
  }

  try {
    const classification = classifyQuery(picoTags.disease_tags, picoTags.decision_tags);

    // PubMed-specific enhancement with MeSH terms
    enhancedQuery = enhanceQueryWithMeSH(enhancedQuery, classification.allowed_mesh_terms);

    // NEURO-ONCOLOGY ENHANCEMENT: Detect brain tumor + seizure scenarios
    enhancedQuery = enhanceNeuroOncologyQuery(enhancedQuery);

    // Guideline-specific query (focus on recommendations)
    guidelineQuery = `${primarySearchQuery} guideline recommendation`;

    // Trial-specific query (focus on outcomes)
    trialQuery = `${primarySearchQuery} randomized controlled trial`;

    console.log(`🔍 Query optimization complete:`);
    console.log(`   PubMed: "${enhancedQuery}"`);
    console.log(`   Guidelines: "${guidelineQuery}"`);
    console.log(`   Trials: "${trialQuery}"`);
  } catch (error: any) {
    console.error('⚠️  Query optimization failed, using original:', error.message);
    enhancedQuery = guidelineQuery = trialQuery = primarySearchQuery;
  }

  // STEP 3: Generate additional search queries for lifestyle topics
  const additionalQueries = isLifestyle ? generateLifestyleSearchQueries(clinicalQuery) : [];
  if (additionalQueries.length > 1) {
    console.log(`📋 Generated ${additionalQueries.length} search variations for better coverage`);
  }

  // STEP 4: Detect anchor guidelines for this clinical scenario
  const { detectClinicalScenarios, getAnchorGuidelines } = await import('./guideline-anchors');
  const clinicalScenarios = detectClinicalScenarios(clinicalQuery);
  if (clinicalScenarios.length > 0) {
    console.log(`🎯 Detected ${clinicalScenarios.length} clinical scenario(s) with anchor guidelines`);
  }

  // Get relevant clinical guidelines (Diabetes specific)
  const guidelines = getRelevantGuidelines(clinicalQuery);

  // Add detected Anchor Guidelines
  const anchorGuidelines = getAnchorGuidelines(clinicalQuery);
  if (anchorGuidelines.length > 0) {
    console.log(`⚓ Adding ${anchorGuidelines.length} Anchor Guidelines to evidence package`);
    anchorGuidelines.forEach(anchor => {
      guidelines.unshift({
        source: anchor.organization,
        type: 'Anchor Guideline',
        title: anchor.name,
        url: anchor.url,
        journal: anchor.organization, // Use org as journal fallback
        year: anchor.year.toString(),
        authors: anchor.organization,
        summary: anchor.summary
      });
    });
  }

  // Search international guidelines (synchronous, from curated database)
  const whoGuidelines = searchWHOGuidelines(clinicalQuery, 3);
  const cdcGuidelines = searchCDCGuidelines(clinicalQuery, 3);
  const niceGuidelines = searchNICEGuidelines(clinicalQuery, 3);
  const bmjBestPractice = searchBMJBestPractice(clinicalQuery, 3);
  // Search cardiovascular guidelines (ACC/AHA, ESC) - important for lipid/CV queries
  const cardiovascularGuidelines = searchCardiovascularGuidelines(clinicalQuery, 5);

  console.log("📋 International guidelines found:", {
    WHO: whoGuidelines.length,
    CDC: cdcGuidelines.length,
    NICE: niceGuidelines.length,
    BMJ: bmjBestPractice.length,
    "ACC/AHA/ESC": cardiovascularGuidelines.length,
  });

  // Landmark trials (synchronous search from curated database)
  const landmarkTrials = searchLandmarkTrials(clinicalQuery, 5);
  console.log("🏆 Landmark trials found:", landmarkTrials.length);

  // Run all PRIMARY searches in parallel for speed
  // NOTE: Open-i and Tavily are FALLBACKS - called only if primary evidence is insufficient
  const [
    clinicalTrials,
    literature,
    systematicReviews,
    pubmedData,
    europePMCData,
    pmcData,
    cochraneData,
    semanticScholarPapers,
    semanticScholarHighlyCited,
    medlinePlusData,
    dailyMedData,
    aapData,
    rxnormData,
    ncbiBooks,
    omimData,
    ...drugData
  ] = await Promise.all([
    // Clinical trials - INCREASED from 5 to 8
    withRetrieverSpan('retrieve_clinical_trials', async (span) => {
      const result = await searchClinicalTrials(clinicalQuery, 8);
      // CRITICAL FIX: Null-safety for results
      const trials = result || [];
      return {
        result,
        documents: trials.map(t => ({
          id: t.nctId || t.briefTitle,
          content: `${t.briefTitle}\n${t.briefSummary || ''}`,
          metadata: { url: t.nctId ? `https://clinicaltrials.gov/study/${t.nctId}` : undefined, source: 'ClinicalTrials.gov', ...t }
        }))
      };
    }),

    // General literature (OpenAlex) - INCREASED from 5 to 8
    withRetrieverSpan('retrieve_openalex_literature', async (span) => {
      const result = await searchLiterature(clinicalQuery, 8);
      // CRITICAL FIX: Null-safety for results
      const literature = result || [];
      return {
        result,
        documents: literature.map(a => ({
          id: a.doi || a.id || a.title,
          content: `${a.title}\n${a.abstract || ''}`,
          metadata: { url: a.doi, source: 'OpenAlex', year: a.publicationYear, ...a }
        }))
      };
    }),

    // Systematic reviews (OpenAlex) - INCREASED from 2 to 5
    withRetrieverSpan('retrieve_openalex_reviews', async (span) => {
      const result = await searchSystematicReviews(clinicalQuery, 5);
      // CRITICAL FIX: Null-safety for results
      const reviews = result || [];
      return {
        result,
        documents: reviews.map(a => ({
          id: a.doi || a.id || a.title,
          content: `${a.title}\n${a.abstract || ''}`,
          metadata: { url: a.doi, source: 'OpenAlex (Reviews)', ...a }
        }))
      };
    }),

    // PubMed comprehensive search (articles + reviews + guidelines) - with MeSH enhancement
    withRetrieverSpan('retrieve_pubmed', async (span) => {
      const result = await comprehensivePubMedSearch(
        enhancedQuery,
        guidelineSearchStrategy?.is_guideline_query || false,
        guidelineSearchStrategy?.guideline_bodies || clarifiedQuery?.guideline_bodies || []
      );
      // CRITICAL FIX: Null-safety for all sub-arrays
      const articles = result?.articles || [];
      const systematicReviews = result?.systematicReviews || [];
      const guidelines = result?.guidelines || [];

      return {
        result,
        documents: [
          ...articles.map(a => ({ id: a.pmid, content: `${a.title}\n${a.abstract || ''}`, metadata: { source: 'PubMed', ...a } })),
          ...systematicReviews.map(a => ({ id: a.pmid, content: `${a.title}\n${a.abstract || ''}`, metadata: { source: 'PubMed (Review)', ...a } })),
          ...guidelines.map(a => ({ id: a.pmid, content: `${a.title}\n${a.abstract || ''}`, metadata: { source: 'PubMed (Guideline)', ...a } })),
        ]
      };
    }),

    // Europe PMC comprehensive search
    withRetrieverSpan('retrieve_europepmc', async (span) => {
      span.setAttribute('search.query', primarySearchQuery);
      const result = await comprehensiveSearch(primarySearchQuery);
      // CRITICAL FIX: Null-safety for sub-arrays
      const recent = result?.recent || [];
      const cited = result?.cited || [];
      const preprints = result?.preprints || [];
      const openAccess = result?.openAccess || [];

      return {
        result,
        documents: [
          ...recent.map(a => ({ id: a.id, content: `${a.title}\n${a.abstractText || ''}`, metadata: { ...a, tool_source: 'EuropePMC', type: 'recent' } })),
          ...cited.map(a => ({ id: a.id, content: `${a.title}\n${a.abstractText || ''}`, metadata: { ...a, tool_source: 'EuropePMC', type: 'cited' } })),
          ...preprints.map(a => ({ id: a.id, content: `${a.title}\n${a.abstractText || ''}`, metadata: { ...a, tool_source: 'EuropePMC', type: 'preprint' } })),
          ...openAccess.map(a => ({ id: a.id, content: `${a.title}\n${a.abstractText || ''}`, metadata: { ...a, tool_source: 'EuropePMC', type: 'open_access' } })),
        ]
      };
    }),

    // PMC full-text search
    withRetrieverSpan('retrieve_pmc', async (span) => {
      span.setAttribute('search.query', primarySearchQuery);
      const result = await comprehensivePMCSearch(primarySearchQuery);
      // CRITICAL FIX: Null-safety for sub-arrays
      const articles = result?.articles || [];
      const recentArticles = result?.recentArticles || [];
      const reviews = result?.reviews || [];

      return {
        result,
        documents: [
          ...articles.map(a => ({ id: a.pmcId || a.title, content: a.title, metadata: { source: 'PMC', ...a } })),
          ...recentArticles.map(a => ({ id: a.pmcId || a.title, content: a.title, metadata: { source: 'PMC (Recent)', ...a } })),
          ...reviews.map(a => ({ id: a.pmcId || a.title, content: a.title, metadata: { source: 'PMC (Review)', ...a } })),
        ]
      };
    }),

    // Cochrane Library systematic reviews
    withRetrieverSpan('retrieve_cochrane', async (span) => {
      span.setAttribute('search.query', primarySearchQuery);
      const result = await comprehensiveCochraneSearch(primarySearchQuery);
      // CRITICAL FIX: Null-safety for sub-arrays
      const allReviews = result?.allReviews || [];
      const recentReviews = result?.recentReviews || [];

      return {
        result,
        documents: [
          ...allReviews.map(r => ({ id: r.doi || r.pmid, content: `${r.title}\n${r.abstract || ''}`, metadata: { source: 'Cochrane', ...r } })),
          ...recentReviews.map(r => ({ id: r.doi || r.pmid, content: `${r.title}\n${r.abstract || ''}`, metadata: { source: 'Cochrane (Recent)', ...r } })),
        ]
      };
    }),

    // Semantic Scholar search
    withRetrieverSpan('retrieve_semantic_scholar', async (span) => {
      span.setAttribute('search.query', primarySearchQuery);
      const result = await searchSemanticScholar(primarySearchQuery, 8);
      // CRITICAL FIX: Null-safety for result
      const articles = result || [];
      return {
        result,
        documents: articles.map(a => ({
          id: a.paperId,
          content: `${a.title}\n${a.abstract || ''}`,
          metadata: { ...a, source: 'Semantic Scholar' }
        }))
      };
    }),

    withRetrieverSpan('retrieve_semantic_scholar_highly_cited', async (span) => {
      span.setAttribute('search.query', primarySearchQuery);
      const result = await searchHighlyCitedMedical(primarySearchQuery, 8);
      // CRITICAL FIX: Null-safety for result
      const articles = result || [];
      return {
        result,
        documents: articles.map(a => ({
          id: a.paperId,
          content: `${a.title}\n${a.abstract || ''}`,
          metadata: { ...a, source: 'Semantic Scholar (Highly Cited)' }
        }))
      };
    }),

    // MedlinePlus
    withRetrieverSpan('retrieve_medlineplus', async (span) => {
      const result = await comprehensiveMedlinePlusSearch(primarySearchQuery, drugNames);
      // CRITICAL FIX: Null-safety for healthTopics
      const healthTopics = result?.healthTopics || [];
      return {
        result,
        documents: healthTopics.map(t => ({ id: t.url, content: `${t.title}\n${t.snippet}`, metadata: { source: 'MedlinePlus', ...t } }))
      };
    }),

    // DailyMed
    withRetrieverSpan('retrieve_dailymed', async (span) => {
      const result = await comprehensiveDailyMedSearch(primarySearchQuery);
      // CRITICAL FIX: Null-safety for drugs
      const drugs = result?.drugs || [];
      return {
        result,
        documents: drugs.map(d => ({
          id: d.setId,
          content: `${d.title}\n${d.activeIngredients?.join(', ') || ''}`,
          metadata: { source: 'DailyMed', ...d }
        }))
      };
    }),

    // AAP guidelines
    withRetrieverSpan('retrieve_aap', async (span) => {
      const result = await comprehensiveAAPSearch(primarySearchQuery);
      // CRITICAL FIX: Null-safety for AAP arrays
      const guidelines = result?.guidelines || [];
      const policyStatements = result?.policyStatements || [];
      const keyResources = result?.keyResources || [];
      return {
        result,
        documents: [
          ...guidelines.map(g => ({ id: g.url, content: g.title, metadata: { source: 'AAP', ...g } })),
          ...policyStatements.map(g => ({ id: g.url, content: g.title, metadata: { source: 'AAP (Policy)', ...g } })),
          ...keyResources.map(g => ({ id: g.url, content: g.title, metadata: { source: 'AAP (Resource)', ...g } })),
        ]
      };
    }),

    // RxNorm
    withRetrieverSpan('retrieve_rxnorm', async (span) => {
      const result = await comprehensiveRxNormSearch(primarySearchQuery, drugNames);
      // CRITICAL FIX: Null-safety for result.drugs to prevent "g.map is not a function" error
      const drugs = result?.drugs || [];
      return {
        result,
        documents: drugs.map(d => ({ id: d.rxcui, content: d.name, metadata: { source: 'RxNorm', ...d } }))
      };
    }),

    // NCBI Books (StatPearls)
    // NCBI Books (StatPearls)
    withRetrieverSpan('retrieve_ncbi_books', async (span) => {
      const result = await searchStatPearls(primarySearchQuery, 5);
      return {
        result,
        documents: result.map(b => ({
          id: b.bookId,
          content: `${b.title}\n${b.abstract || ''}`,
          metadata: { tool_source: 'NCBI Books', ...b }
        }))
      };
    }),

    // OMIM
    // OMIM
    withRetrieverSpan('retrieve_omim', async (span) => {
      const result = await (isGeneticQuery(primarySearchQuery) ? searchOMIM(primarySearchQuery, 5) : Promise.resolve([]));
      return {
        result,
        documents: result.map(o => ({
          id: o.mimNumber,
          content: `${o.title}\n${o.textSections?.find(s => s.textSectionName === 'description')?.textSectionContent || ''}`,
          metadata: { tool_source: 'OMIM', ...o }
        }))
      };
    }),

    // Drug-specific data (if drug names provided)
    ...drugNames.flatMap(drug => [
      withRetrieverSpan(`retrieve_drug_labels_${drug}`, async (span) => {
        const result = await searchDrugLabels(drug, 2);
        return {
          result,
          documents: result.map(d => ({
            id: d.brandName,
            content: `${d.brandName} (${d.genericName})\n${d.indications || ''}`,
            metadata: { source: 'OpenFDA', drug }
          }))
        };
      }),
      withRetrieverSpan(`retrieve_adverse_events_${drug}`, async (span) => {
        const result = await searchAdverseEvents(drug, 5);
        return {
          result,
          documents: result.map((e, idx) => ({
            id: `ae-${drug}-${idx}`,
            content: `${e.reaction}: ${e.count} reports`,
            metadata: { source: 'OpenFDA', drug }
          }))
        };
      }),
    ]),
  ]);

  // Organize drug data
  const drugLabels: DrugLabel[] = [];
  const adverseEvents: AdverseEvent[] = [];

  for (let i = 0; i < drugData.length; i += 2) {
    drugLabels.push(...(drugData[i] as DrugLabel[]));
    adverseEvents.push(...(drugData[i + 1] as AdverseEvent[]));
  }

  // PubChem fallback (if DailyMed has insufficient results)
  const pubChemCompounds: PubChemCompound[] = [];
  const pubChemBioAssays: PubChemBioAssay[] = [];

  // Get drug terms - either from provided drugNames or extract from query
  // USE EXPANDED QUERY for better drug term extraction
  const drugTermsForPubChem = drugNames.length > 0 ? drugNames : extractDrugTermsFromQuery(primarySearchQuery);

  if (shouldUsePubChemFallback(dailyMedData.drugs.length, primarySearchQuery) && drugTermsForPubChem.length > 0) {
    console.log(`💊 DailyMed has ${dailyMedData.drugs.length} results, using PubChem fallback for: ${drugTermsForPubChem.join(', ')}...`);

    try {
      for (const drugName of drugTermsForPubChem.slice(0, 2)) { // Limit to 2 drugs
        const pubChemResult = await comprehensivePubChemSearch(drugName);
        pubChemCompounds.push(...pubChemResult.compounds);
        pubChemBioAssays.push(...pubChemResult.bioAssays);
      }
      console.log(`🧪 PubChem: ${pubChemCompounds.length} compounds, ${pubChemBioAssays.length} bioassays`);
    } catch (error: any) {
      console.error("PubChem fallback error:", error.message);
    }
  } else if (dailyMedData.drugs.length === 0 && drugTermsForPubChem.length === 0) {
    console.log(`ℹ️  No drug terms detected in query, skipping PubChem search`);
  }

  // CRITICAL FIX: Apply relevance filtering BEFORE reranking
  console.log("🔍 Filtering evidence for relevance to query...");
  const {
    filterRelevantPubMedArticles,
    filterRelevantCochraneReviews,
    filterRelevantPMCArticles,
    filterRelevantEuropePMCArticles
  } = await import('./relevance-filter');

  // Filter PubMed articles - Lower threshold (15) to let BGE reranker do quality assessment
  const pubmedArticlesFiltered = filterRelevantPubMedArticles(pubmedData.articles, clinicalQuery, 15);
  const pubmedReviewsFiltered = filterRelevantPubMedArticles(pubmedData.systematicReviews, clinicalQuery, 15);

  // Filter Cochrane reviews
  const cochraneReviewsFiltered = filterRelevantCochraneReviews(cochraneData.allReviews, clinicalQuery, 15);
  const cochraneRecentFiltered = filterRelevantCochraneReviews(cochraneData.recentReviews, clinicalQuery, 15);

  // Filter PMC articles
  const pmcArticlesFiltered = filterRelevantPMCArticles(pmcData.articles, clinicalQuery, 15);
  const pmcRecentFiltered = filterRelevantPMCArticles(pmcData.recentArticles, clinicalQuery, 15);
  const pmcReviewsFiltered = filterRelevantPMCArticles(pmcData.reviews, clinicalQuery, 15);

  // Filter Europe PMC articles
  const europePMCRecentFiltered = filterRelevantEuropePMCArticles(europePMCData.recent, clinicalQuery, 15);
  const europePMCCitedFiltered = filterRelevantEuropePMCArticles(europePMCData.cited, clinicalQuery, 15);
  const europePMCOpenAccessFiltered = filterRelevantEuropePMCArticles(europePMCData.openAccess, clinicalQuery, 15);

  console.log(`🗑️  Relevance filtering removed:`);
  console.log(`   PubMed articles: ${pubmedArticlesFiltered.removed}/${pubmedData.articles.length}`);
  console.log(`   PubMed reviews: ${pubmedReviewsFiltered.removed}/${pubmedData.systematicReviews.length}`);
  console.log(`   Cochrane reviews: ${cochraneReviewsFiltered.removed}/${cochraneData.allReviews.length}`);
  console.log(`   PMC articles: ${pmcArticlesFiltered.removed}/${pmcData.articles.length}`);

  // Log removed items for debugging
  if (pubmedArticlesFiltered.removed > 0) {
    console.log(`📋 Removed PubMed articles (off-topic):`);
    pubmedArticlesFiltered.reasons.slice(0, 3).forEach(r => console.log(`   ${r}`));
  }

  // NEURO-ONCOLOGY FIX: Apply age-based filtering to remove pediatric guidelines for adults
  console.log("🔍 Applying age-based filtering...");
  const pubmedArticlesAgeFiltered = filterByAge(pubmedArticlesFiltered.filtered, patientAge);
  const pubmedReviewsAgeFiltered = filterByAge(pubmedReviewsFiltered.filtered, patientAge);
  const cochraneReviewsAgeFiltered = filterByAge(cochraneReviewsFiltered.filtered, patientAge);
  const cochraneRecentAgeFiltered = filterByAge(cochraneRecentFiltered.filtered, patientAge);
  const pubmedGuidelinesAgeFiltered = filterByAge(pubmedData.guidelines || [], patientAge);

  // Log age-based filtering results
  if (pubmedArticlesAgeFiltered.removed > 0) {
    console.log(`🚫 Age-based filtering removed ${pubmedArticlesAgeFiltered.removed} PubMed articles`);
    pubmedArticlesAgeFiltered.reasons.slice(0, 3).forEach(r => console.log(`   ${r}`));
  }
  if (pubmedGuidelinesAgeFiltered.removed > 0) {
    console.log(`🚫 Age-based filtering removed ${pubmedGuidelinesAgeFiltered.removed} PubMed guidelines`);
    pubmedGuidelinesAgeFiltered.reasons.slice(0, 3).forEach(r => console.log(`   ${r}`));
  }

  // CRITICAL FIX: Apply SGLT2 contamination filter BEFORE reranking
  console.log("🚫 Applying SGLT2 contamination filter...");
  const pubmedArticlesSGLT2Filtered = filterSGLT2Contamination(pubmedArticlesAgeFiltered.filtered, clinicalQuery);
  const pubmedReviewsSGLT2Filtered = filterSGLT2Contamination(pubmedReviewsAgeFiltered.filtered, clinicalQuery);
  const europePMCRecentSGLT2Filtered = filterSGLT2Contamination(europePMCRecentFiltered.filtered, clinicalQuery);
  const pmcArticlesSGLT2Filtered = filterSGLT2Contamination(pmcArticlesFiltered.filtered, clinicalQuery);

  // Log SGLT2 filtering results
  if (pubmedArticlesSGLT2Filtered.removed > 0) {
    console.log(`🚫 SGLT2 filter removed ${pubmedArticlesSGLT2Filtered.removed} PubMed articles`);
    pubmedArticlesSGLT2Filtered.reasons.slice(0, 3).forEach(r => console.log(`   ${r}`));
  }

  // PHASE 2 ENHANCEMENT: Apply semantic reranking to improve relevance
  console.log("🔄 Applying comprehensive semantic reranking to ALL evidence sources...");
  let rerankedPubMedArticles = pubmedArticlesSGLT2Filtered.filtered;
  let rerankedPubMedReviews = pubmedReviewsSGLT2Filtered.filtered;
  let rerankedCochraneReviews = cochraneReviewsAgeFiltered.filtered;
  let rerankedCochraneRecent = cochraneRecentAgeFiltered.filtered;

  // Initialize reranked versions of ALL evidence sources (using SGLT2-filtered data)
  let rerankedEuropePMCRecent = europePMCRecentSGLT2Filtered.filtered;
  let rerankedEuropePMCCited = europePMCData.cited;
  let rerankedEuropePMCOpenAccess = europePMCData.openAccess;
  let rerankedLiterature = literature;
  let rerankedSystematicReviews = systematicReviews;
  let rerankedSemanticScholarPapers = semanticScholarPapers;
  let rerankedSemanticScholarHighlyCited = semanticScholarHighlyCited;
  let rerankedPMCArticles = pmcArticlesSGLT2Filtered.filtered;
  let rerankedPMCReviews = pmcData.reviews;
  let rerankedClinicalTrials = clinicalTrials;
  let rerankedDailyMedDrugs = dailyMedData.drugs;
  let rerankedAAPGuidelines = aapData.guidelines;

  try {
    // Environment-configurable minimum score (default 0.8 for high quality)
    const minScore = parseFloat(process.env.BGE_RERANK_MIN_SCORE || '0.8');

    // CRITICAL: Rerank ALL evidence sources, not just PubMed and Cochrane

    // 1. PubMed Sources (existing)
    if (rerankedPubMedArticles.length >= 3) {
      rerankedPubMedArticles = await withRerankerSpan('rerank_pubmed_articles',
        rerankedPubMedArticles.map(a => ({ id: a.pmid, content: `${a.title}\n${a.abstract || ''}`, metadata: { source: 'PubMed', ...a } })),
        async (span) => {
          const result = await rerankPubMedWithBGE(clinicalQuery, rerankedPubMedArticles, {
            topK: 50,
            minScore,
            debugScores: true, // Enable debug logging
          });
          console.log(`✅ Reranked ${result.length} PubMed articles (BGE Cross-Encoder)`);
          return {
            result,
            rerankedDocuments: result.map(a => ({ id: a.pmid, content: `${a.title}\n${a.abstract || ''}`, metadata: { source: 'PubMed', ...a } })),
          };
        }
      );
    }

    if (rerankedPubMedReviews.length >= 2) {
      rerankedPubMedReviews = await withRerankerSpan('rerank_pubmed_reviews',
        rerankedPubMedReviews.map(a => ({ id: a.pmid, content: `${a.title}\n${a.abstract || ''}`, metadata: { source: 'PubMed (Review)', ...a } })),
        async (span) => {
          const result = await rerankPubMedWithBGE(clinicalQuery, rerankedPubMedReviews, {
            topK: 20,
            minScore,
          });
          console.log(`✅ Reranked ${result.length} PubMed reviews (BGE Cross-Encoder)`);
          return {
            result,
            rerankedDocuments: result.map(a => ({ id: a.pmid, content: `${a.title}\n${a.abstract || ''}`, metadata: { source: 'PubMed (Review)', ...a } })),
          };
        }
      );
    }

    // 2. Cochrane Sources (existing)
    if (rerankedCochraneReviews.length >= 2) {
      rerankedCochraneReviews = await withRerankerSpan('rerank_cochrane_reviews',
        rerankedCochraneReviews.map(r => ({ id: r.doi || r.pmid, content: `${r.title}\n${r.abstract || ''}`, metadata: { source: 'Cochrane', ...r } })),
        async (span) => {
          const result = await rerankCochraneWithBGE(clinicalQuery, rerankedCochraneReviews, {
            topK: 10,
            minScore,
          });
          console.log(`✅ Reranked ${result.length} Cochrane reviews (BGE Cross-Encoder)`);
          return {
            result,
            rerankedDocuments: result.map(r => ({ id: r.doi || r.pmid, content: `${r.title}\n${r.abstract || ''}`, metadata: { source: 'Cochrane', ...r } })),
          };
        }
      );
    }

    if (rerankedCochraneRecent.length >= 2) {
      rerankedCochraneRecent = await withRerankerSpan('rerank_cochrane_recent',
        rerankedCochraneRecent.map(r => ({ id: r.doi || r.pmid, content: `${r.title}\n${r.abstract || ''}`, metadata: { source: 'Cochrane (Recent)', ...r } })),
        async (span) => {
          const result = await rerankCochraneWithBGE(clinicalQuery, rerankedCochraneRecent, {
            topK: 5,
            minScore,
          });
          console.log(`✅ Reranked ${result.length} recent Cochrane reviews (BGE Cross-Encoder)`);
          return {
            result,
            rerankedDocuments: result.map(r => ({ id: r.doi || r.pmid, content: `${r.title}\n${r.abstract || ''}`, metadata: { source: 'Cochrane (Recent)', ...r } })),
          };
        }
      );
    }

    // 3. Europe PMC Sources (NEW)
    if (rerankedEuropePMCRecent.length >= 2) {
      rerankedEuropePMCRecent = await withRerankerSpan('rerank_europepmc_recent',
        rerankedEuropePMCRecent.map(a => ({ id: a.id, content: `${a.title}\n${a.abstractText || ''}`, metadata: { tool_source: 'EuropePMC', type: 'recent', ...a } })),
        async (span) => {
          const result = await rerankEuropePMCWithBGE(clinicalQuery, rerankedEuropePMCRecent, {
            topK: 15,
            minScore,
          });
          console.log(`✅ Reranked ${result.length} Europe PMC recent articles (BGE Cross-Encoder)`);
          return {
            result,
            rerankedDocuments: result.map(a => ({ id: a.id, content: `${a.title}\n${a.abstractText || ''}`, metadata: { tool_source: 'EuropePMC', type: 'recent', ...a } })),
          };
        }
      );
    }

    if (rerankedEuropePMCCited.length >= 2) {
      rerankedEuropePMCCited = await withRerankerSpan('rerank_europepmc_cited',
        rerankedEuropePMCCited.map(a => ({ id: a.id, content: `${a.title}\n${a.abstractText || ''}`, metadata: { tool_source: 'EuropePMC', type: 'cited', ...a } })),
        async (span) => {
          const result = await rerankEuropePMCWithBGE(clinicalQuery, rerankedEuropePMCCited, {
            topK: 10,
            minScore,
          });
          console.log(`✅ Reranked ${result.length} Europe PMC highly cited articles (BGE Cross-Encoder)`);
          return {
            result,
            rerankedDocuments: result.map(a => ({ id: a.id, content: `${a.title}\n${a.abstractText || ''}`, metadata: { tool_source: 'EuropePMC', type: 'cited', ...a } })),
          };
        }
      );
    }

    if (rerankedEuropePMCOpenAccess.length >= 2) {
      rerankedEuropePMCOpenAccess = await withRerankerSpan('rerank_europepmc_open_access',
        rerankedEuropePMCOpenAccess.map(a => ({ id: a.id, content: `${a.title}\n${a.abstractText || ''}`, metadata: { tool_source: 'EuropePMC', type: 'open_access', ...a } })),
        async (span) => {
          const result = await rerankEuropePMCWithBGE(clinicalQuery, rerankedEuropePMCOpenAccess, {
            topK: 10,
            minScore,
          });
          console.log(`✅ Reranked ${result.length} Europe PMC open access articles (BGE Cross-Encoder)`);
          return {
            result,
            rerankedDocuments: result.map(a => ({ id: a.id, content: `${a.title}\n${a.abstractText || ''}`, metadata: { tool_source: 'EuropePMC', type: 'open_access', ...a } })),
          };
        }
      );
    }

    // 4. OpenAlex Sources (NEW)
    if (rerankedLiterature.length >= 2) {
      rerankedLiterature = await withRerankerSpan('rerank_openalex_literature',
        rerankedLiterature.map(a => ({ id: a.doi || a.id || a.title, content: `${a.title}\n${a.abstract || ''}`, metadata: { source: 'OpenAlex', ...a } })),
        async (span) => {
          const result = await rerankOpenAlexWithBGE(clinicalQuery, rerankedLiterature, {
            topK: 15,
            minScore,
          });
          console.log(`✅ Reranked ${result.length} OpenAlex literature (BGE Cross-Encoder)`);
          return {
            result,
            rerankedDocuments: result.map(a => ({ id: a.doi || a.id || a.title, content: `${a.title}\n${a.abstract || ''}`, metadata: { source: 'OpenAlex', ...a } })),
          };
        }
      );
    }

    if (rerankedSystematicReviews.length >= 2) {
      rerankedSystematicReviews = await withRerankerSpan('rerank_openalex_reviews',
        rerankedSystematicReviews.map(a => ({ id: a.doi || a.id || a.title, content: `${a.title}\n${a.abstract || ''}`, metadata: { source: 'OpenAlex (Reviews)', ...a } })),
        async (span) => {
          const result = await rerankOpenAlexWithBGE(clinicalQuery, rerankedSystematicReviews, {
            topK: 10,
            minScore,
          });
          console.log(`✅ Reranked ${result.length} OpenAlex systematic reviews (BGE Cross-Encoder)`);
          return {
            result,
            rerankedDocuments: result.map(a => ({ id: a.doi || a.id || a.title, content: `${a.title}\n${a.abstract || ''}`, metadata: { source: 'OpenAlex (Reviews)', ...a } })),
          };
        }
      );
    }

    // 5. Semantic Scholar Sources (NEW)
    if (rerankedSemanticScholarPapers.length >= 2) {
      rerankedSemanticScholarPapers = await withRerankerSpan('rerank_semantic_scholar',
        rerankedSemanticScholarPapers.map(a => ({ id: a.paperId, content: `${a.title}\n${a.abstract || ''}`, metadata: { ...a, source: 'Semantic Scholar' } })),
        async (span) => {
          const result = await rerankSemanticScholarWithBGE(clinicalQuery, rerankedSemanticScholarPapers, {
            topK: 15,
            minScore,
          });
          console.log(`✅ Reranked ${result.length} Semantic Scholar papers (BGE Cross-Encoder)`);
          return {
            result,
            rerankedDocuments: result.map(a => ({ id: a.paperId, content: `${a.title}\n${a.abstract || ''}`, metadata: { ...a, source: 'Semantic Scholar' } })),
          };
        }
      );
    }

    if (rerankedSemanticScholarHighlyCited.length >= 2) {
      rerankedSemanticScholarHighlyCited = await withRerankerSpan('rerank_semantic_scholar_highly_cited',
        rerankedSemanticScholarHighlyCited.map(a => ({ id: a.paperId, content: `${a.title}\n${a.abstract || ''}`, metadata: { ...a, source: 'Semantic Scholar (Highly Cited)' } })),
        async (span) => {
          const result = await rerankSemanticScholarWithBGE(clinicalQuery, rerankedSemanticScholarHighlyCited, {
            topK: 10,
            minScore,
          });
          console.log(`✅ Reranked ${result.length} Semantic Scholar highly cited papers (BGE Cross-Encoder)`);
          return {
            result,
            rerankedDocuments: result.map(a => ({ id: a.paperId, content: `${a.title}\n${a.abstract || ''}`, metadata: { ...a, source: 'Semantic Scholar (Highly Cited)' } })),
          };
        }
      );
    }

    // 6. PMC Sources (NEW)
    if (rerankedPMCArticles.length >= 2) {
      rerankedPMCArticles = await withRerankerSpan('rerank_pmc',
        rerankedPMCArticles.map(a => ({ id: a.pmcId || a.title, content: a.title, metadata: { source: 'PMC', ...a } })),
        async (span) => {
          const result = await rerankPMCWithBGE(clinicalQuery, rerankedPMCArticles, {
            topK: 15,
            minScore,
          });
          console.log(`✅ Reranked ${result.length} PMC articles (BGE Cross-Encoder)`);
          return {
            result,
            rerankedDocuments: result.map(a => ({ id: a.pmcId || a.title, content: a.title, metadata: { source: 'PMC', ...a } })),
          };
        }
      );
    }

    if (rerankedPMCReviews.length >= 2) {
      rerankedPMCReviews = await withRerankerSpan('rerank_pmc_reviews',
        rerankedPMCReviews.map(a => ({ id: a.pmcId || a.title, content: a.title, metadata: { source: 'PMC (Review)', ...a } })),
        async (span) => {
          const result = await rerankPMCWithBGE(clinicalQuery, rerankedPMCReviews, {
            topK: 10,
            minScore,
          });
          console.log(`✅ Reranked ${result.length} PMC reviews (BGE Cross-Encoder)`);
          return {
            result,
            rerankedDocuments: result.map(a => ({ id: a.pmcId || a.title, content: a.title, metadata: { source: 'PMC (Review)', ...a } })),
          };
        }
      );
    }

    // 7. Clinical Trials (NEW)
    if (rerankedClinicalTrials.length >= 2) {
      rerankedClinicalTrials = await withRerankerSpan('rerank_clinical_trials',
        rerankedClinicalTrials.map(t => ({ id: t.nctId || t.briefTitle, content: `${t.briefTitle}\n${t.briefSummary || ''}`, metadata: { url: `https://clinicaltrials.gov/study/${t.nctId}`, source: 'ClinicalTrials.gov', ...t } })),
        async (span) => {
          const result = await rerankClinicalTrialsWithBGE(clinicalQuery, rerankedClinicalTrials, {
            topK: 10,
            minScore: minScore * 0.8, // Slightly lower threshold for trials
          });
          console.log(`✅ Reranked ${result.length} Clinical Trials (BGE Cross-Encoder)`);
          return {
            result,
            rerankedDocuments: result.map(t => ({ id: t.nctId || t.briefTitle, content: `${t.briefTitle}\n${t.briefSummary || ''}`, metadata: { url: `https://clinicaltrials.gov/study/${t.nctId}`, source: 'ClinicalTrials.gov', ...t } })),
          };
        }
      );
    }

    // 8. DailyMed Drug Information (NEW)
    if (rerankedDailyMedDrugs.length >= 1) {
      rerankedDailyMedDrugs = await withRerankerSpan('rerank_dailymed',
        rerankedDailyMedDrugs.map(d => ({ id: d.setId, content: `${d.title}\n${d.activeIngredients.join(', ')}`, metadata: { source: 'DailyMed', ...d } })),
        async (span) => {
          const result = await rerankDailyMedWithBGE(clinicalQuery, rerankedDailyMedDrugs, {
            topK: 5,
            minScore: minScore * 0.7, // Lower threshold for drug info
          });
          console.log(`✅ Reranked ${result.length} DailyMed drugs (BGE Cross-Encoder)`);
          return {
            result,
            rerankedDocuments: result.map(d => ({ id: d.setId, content: `${d.title}\n${d.activeIngredients.join(', ')}`, metadata: { source: 'DailyMed', ...d } })),
          };
        }
      );
    }

    // 9. AAP Guidelines (NEW)
    if (rerankedAAPGuidelines.length >= 1) {
      rerankedAAPGuidelines = await withRerankerSpan('rerank_aap',
        rerankedAAPGuidelines.map(g => ({ id: g.url, content: g.title, metadata: { source: 'AAP', ...g } })),
        async (span) => {
          const result = await rerankAAPWithBGE(clinicalQuery, rerankedAAPGuidelines, {
            topK: 5,
            minScore: minScore * 0.8, // Slightly lower threshold for guidelines
          });
          console.log(`✅ Reranked ${result.length} AAP guidelines (BGE Cross-Encoder)`);
          return {
            result,
            rerankedDocuments: result.map(g => ({ id: g.url, content: g.title, metadata: { source: 'AAP', ...g } })),
          };
        }
      );
    }

  } catch (error: any) {
    console.error("⚠️ Comprehensive semantic reranking error, using filtered results:", error.message);
    // Graceful degradation - use filtered results
  }

  // NEURO-ONCOLOGY FIX: Apply keyword boosting for brain tumor scenarios
  rerankedPubMedArticles = boostNeuroOncologyRelevance(rerankedPubMedArticles, clinicalQuery);
  rerankedPubMedReviews = boostNeuroOncologyRelevance(rerankedPubMedReviews, clinicalQuery);
  rerankedCochraneReviews = boostNeuroOncologyRelevance(rerankedCochraneReviews, clinicalQuery);

  // STEP 5: Build initial evidence package (with ALL filtered and reranked results)
  // NOTE: Open-i is NOT included here - it's a fallback like Tavily
  const initialEvidence: EvidencePackage = {
    clinicalTrials: rerankedClinicalTrials, // UPDATED: Use reranked clinical trials
    drugLabels,
    adverseEvents,
    literature: rerankedLiterature, // UPDATED: Use reranked OpenAlex literature
    systematicReviews: rerankedSystematicReviews, // UPDATED: Use reranked OpenAlex systematic reviews
    pubmedArticles: rerankedPubMedArticles,
    pubmedReviews: rerankedPubMedReviews,
    pubmedGuidelines: pubmedGuidelinesAgeFiltered.filtered,
    europePMCRecent: rerankedEuropePMCRecent, // UPDATED: Use reranked Europe PMC recent
    europePMCCited: rerankedEuropePMCCited, // UPDATED: Use reranked Europe PMC cited
    europePMCPreprints: europePMCData.preprints, // Keep preprints unfiltered (usually small)
    europePMCOpenAccess: rerankedEuropePMCOpenAccess, // UPDATED: Use reranked Europe PMC open access
    pmcArticles: rerankedPMCArticles, // UPDATED: Use reranked PMC articles
    pmcRecentArticles: pmcRecentFiltered.filtered,
    pmcReviews: rerankedPMCReviews, // UPDATED: Use reranked PMC reviews
    cochraneReviews: rerankedCochraneReviews,
    cochraneRecent: rerankedCochraneRecent,
    semanticScholarPapers: rerankedSemanticScholarPapers, // UPDATED: Use reranked Semantic Scholar papers
    semanticScholarHighlyCited: rerankedSemanticScholarHighlyCited, // UPDATED: Use reranked Semantic Scholar highly cited
    medlinePlus: medlinePlusData,
    dailyMedDrugs: rerankedDailyMedDrugs, // UPDATED: Use reranked DailyMed drugs
    aapGuidelines: rerankedAAPGuidelines, // UPDATED: Use reranked AAP guidelines
    aapPolicyStatements: aapData.policyStatements,
    aapKeyResources: aapData.keyResources,
    rxnormDrugs: rxnormData.drugs,
    rxnormClasses: rxnormData.classes,
    rxnormInteractions: rxnormData.interactions,
    rxnormPrescribable: rxnormData.prescribable,
    guidelines,
    whoGuidelines,
    cdcGuidelines,
    niceGuidelines,
    bmjBestPractice,
    cardiovascularGuidelines,
    ncbiBooks: ncbiBooks as NCBIBook[],
    omimEntries: omimData as OMIMEntry[],
    pubChemCompounds,
    pubChemBioAssays,
    landmarkTrials,
    openIResearchArticles: [], // Empty - will be filled only if needed as fallback
    openIReviewArticles: [],
    openISystematicReviews: [],
    openICaseReports: [],
    tavilyResult: null, // Will be set conditionally
    tavilyCitations: [],
    timestamp: new Date().toISOString(),
  };

  // STEP 6: Anchor-Aware Sufficiency Scoring - Determine if fallbacks (Tavily, Open-i) are needed
  let tavilyResult: TavilySearchResult | null = null;
  let openIArticles: any = {
    researchArticles: [],
    reviewArticles: [],
    systematicReviews: [],
    caseReports: []
  };

  try {
    const anchorScenario = detectAnchorScenario(picoTags.disease_tags, picoTags.decision_tags);

    // Use min_evidence_threshold from guideline search strategy if available
    const minThreshold = guidelineSearchStrategy?.min_evidence_threshold || 3;

    const sufficiencyScore = scoreEvidenceSufficiencyWithTags(
      initialEvidence,
      picoTags.disease_tags,
      picoTags.decision_tags,
      minThreshold
    );

    console.log(`📊 Evidence sufficiency: ${sufficiencyScore.score}/100 (${sufficiencyScore.level})`);
    if (anchorScenario) {
      console.log(`⚓ Anchor scenario detected: ${anchorScenario} (${sufficiencyScore.anchor_count} anchors)`);
    }

    // CRITICAL FIX: Only call fallbacks if internal evidence is insufficient
    // Primary sources (PubMed, Europe PMC, Cochrane, PMC) should be used first

    // SECONDARY CHECK: Even if raw score is high, if filtered counts are 0, we need Tavily
    const filteredPrimaryCount = rerankedPubMedArticles.length +
      rerankedPubMedReviews.length +
      rerankedCochraneReviews.length +
      pmcArticlesFiltered.filtered.length;

    const needsTavilyDueToFiltering = filteredPrimaryCount < 5;

    if (needsTavilyDueToFiltering) {
      console.log(`⚠️  Primary sources filtered to only ${filteredPrimaryCount} items - forcing Tavily fallback`);
    }

    if (sufficiencyScore.should_call_tavily || needsTavilyDueToFiltering) {
      console.log(`⚠️  Internal evidence insufficient (score: ${sufficiencyScore.score}/100, filtered: ${filteredPrimaryCount})`);
      console.log(`🔍 Calling fallback sources: Open-i and Tavily...`);

      // Call both fallbacks in parallel
      const [openIResult, tavilyRes] = await Promise.all([
        withRetrieverSpan('retrieve_openi', async (span) => {
          span.setAttribute('search.query', clinicalQuery);
          const result = await comprehensiveOpenIArticleSearch(clinicalQuery);
          // CRITICAL FIX: Null-safety for researchArticles
          const articles = result?.researchArticles || [];
          return {
            result,
            documents: articles.map((a: any) => ({
              id: a.id || a.title,
              content: `${a.title}\n${a.abstract || ''}`,
              metadata: { source: 'OpenI', ...a }
            }))
          };
        }),
        withRetrieverSpan('retrieve_tavily_fallback', async (span) => {
          span.setAttribute('search.query', clinicalQuery);
          const result = await searchTavilyMedical(clinicalQuery, {
            maxResults: 10,
          });
          // CRITICAL FIX: Null-safety for citations
          const citations = result?.citations || [];
          return {
            result,
            documents: citations.map(c => ({
              id: c.url,
              content: `${c.title}\n${c.content}`,
              metadata: { source: 'Tavily', ...c }
            }))
          };
        })
      ]);

      openIArticles = openIResult;
      tavilyResult = tavilyRes;

      // STEP 6.5: Rerank Tavily citations for relevance (NEW)
      if (tavilyResult && tavilyResult.citations.length >= 2) {
        console.log(`🔄 Reranking ${tavilyResult.citations.length} Tavily citations...`);
        try {
          const { rerankTavilyWithBGE } = await import('./bge-reranker');
          const minScore = parseFloat(process.env.BGE_RERANK_MIN_SCORE || '0.2');

          const currentTavilyResult = tavilyResult;
          const rerankedCitations = await withRerankerSpan('rerank_tavily',
            currentTavilyResult.citations.map(c => ({ id: c.url, content: `${c.title}\n${c.content}`, metadata: { source: 'Tavily', ...c } })),
            async (span) => {
              const result = await rerankTavilyWithBGE(clinicalQuery, currentTavilyResult.citations, {
                topK: 10,
                minScore: minScore * 0.6, // Lower threshold for Tavily (60% of default)
              });
              return {
                result,
                rerankedDocuments: result.map(c => ({ id: c.url, content: `${c.title}\n${c.content}`, metadata: { source: 'Tavily', ...c } })),
              };
            }
          );

          // Update tavilyResult with reranked citations
          tavilyResult = {
            ...tavilyResult,
            citations: rerankedCitations,
          };

          console.log(`✅ Reranked ${rerankedCitations.length} Tavily citations (BGE Cross-Encoder)`);
        } catch (error: any) {
          console.error('⚠️ Tavily reranking failed, using original order:', error.message);
          // Continue with original citations
        }
      }

      console.log(`📚 Open-i fallback: ${openIResult.researchArticles.length + openIResult.reviewArticles.length} articles`);
      console.log(`🌐 Tavily fallback: ${tavilyResult?.citations.length || 0} citations`);
    } else {
      console.log(`✅ Skipping fallbacks - internal evidence sufficient (score: ${sufficiencyScore.score}/100, filtered: ${filteredPrimaryCount})`);
      console.log(`📊 Primary sources used: PubMed (${rerankedPubMedArticles.length}), Europe PMC (${europePMCRecentFiltered.filtered.length}), Cochrane (${rerankedCochraneReviews.length}), PMC (${pmcArticlesFiltered.filtered.length})`);
    }
  } catch (error: any) {
    console.error('⚠️  Sufficiency scoring failed, calling fallbacks:', error.message);
    // Fallback: call both if scoring fails
    const [openIResult, tavilyRes] = await Promise.all([
      comprehensiveOpenIArticleSearch(clinicalQuery),
      searchTavilyMedical(clinicalQuery, {
        maxResults: 10,
      })
    ]);
    openIArticles = openIResult;
    tavilyResult = tavilyRes;

    // STEP 6.5: Rerank Tavily citations for relevance (NEW - fallback case)
    if (tavilyResult && tavilyResult.citations.length >= 2) {
      console.log(`🔄 Reranking ${tavilyResult.citations.length} Tavily citations (fallback)...`);
      try {
        const { rerankTavilyWithBGE } = await import('./bge-reranker');
        const minScore = parseFloat(process.env.BGE_RERANK_MIN_SCORE || '0.2');
        const rerankedCitations = await rerankTavilyWithBGE(clinicalQuery, tavilyResult.citations, {
          topK: 10,
          minScore: minScore * 0.6, // Lower threshold for Tavily (60% of default)
        });

        // Update tavilyResult with reranked citations
        tavilyResult = {
          ...tavilyResult,
          citations: rerankedCitations,
        };

        console.log(`✅ Reranked ${rerankedCitations.length} Tavily citations (BGE Cross-Encoder)`);
      } catch (error: any) {
        console.error('⚠️ Tavily reranking failed, using original order:', error.message);
        // Continue with original citations
      }
    }
  }

  // STEP 7: Update evidence package with fallback results (Open-i, Tavily) and PICO tags
  let evidence: EvidencePackage = {
    ...initialEvidence,
    openIResearchArticles: openIArticles.researchArticles,
    openIReviewArticles: openIArticles.reviewArticles,
    openISystematicReviews: openIArticles.systematicReviews,
    openICaseReports: openIArticles.caseReports,
    tavilyResult,
    tavilyCitations: tavilyResult?.citations || [],
    picoTags, // Store tags for downstream use
  };

  // STEP 8: Filter evidence by classification to remove off-topic results
  // This ensures pediatric queries don't get cardiology evidence, etc.
  try {
    const classification = classifyQuery(picoTags.disease_tags, picoTags.decision_tags);
    evidence = filterEvidenceByClassification(evidence, classification);
  } catch (error: any) {
    console.error('⚠️  Evidence filtering failed, using unfiltered results:', error.message);
    // Graceful degradation - use unfiltered evidence
  }

  // PRIORITIZE OPEN ACCESS SOURCES
  console.log("🔓 OPEN ACCESS PRIORITY SOURCES:");
  console.log(`   PMC Articles: ${pmcData.articles.length + pmcData.recentArticles.length} (FREE FULL TEXT)`);
  console.log(`   Government Guidelines: ${whoGuidelines.length + cdcGuidelines.length + niceGuidelines.length} (FREE)`);
  console.log(`   NCBI Books: ${(ncbiBooks as NCBIBook[]).length} (FREE TEXTBOOKS)`);
  console.log(`   DailyMed: ${dailyMedData.drugs.length} (FREE DRUG INFO)`);

  console.log("✅ Evidence gathered:", {
    trials: clinicalTrials.length,
    labels: drugLabels.length,
    events: adverseEvents.length,
    dailyMedDrugs: dailyMedData.drugs.length,
    aapGuidelines: aapData.guidelines.length,
    aapPolicyStatements: aapData.policyStatements.length,
    rxnormDrugs: rxnormData.drugs.length,
    rxnormClasses: rxnormData.classes.length,
    rxnormInteractions: rxnormData.interactions.length,
    openAlexPapers: literature.length,
    openAlexReviews: systematicReviews.length,
    pubmedArticles: pubmedData.articles.length,
    pubmedReviews: pubmedData.systematicReviews.length,
    pubmedGuidelines: (pubmedData.guidelines || []).length, // NEW
    pmcArticles: pmcData.articles.length,
    pmcRecentArticles: pmcData.recentArticles.length,
    pmcReviews: pmcData.reviews.length,
    cochraneReviews: cochraneData.allReviews.length,
    cochraneRecent: cochraneData.recentReviews.length,
    europePMCRecent: europePMCData.recent.length,
    europePMCCited: europePMCData.cited.length,
    europePMCPreprints: europePMCData.preprints.length,
    europePMCOpenAccess: europePMCData.openAccess.length,
    semanticScholarPapers: semanticScholarPapers.length,
    semanticScholarHighlyCited: semanticScholarHighlyCited.length,
    medlinePlusTopics: medlinePlusData.healthTopics.length,
    medlinePlusDrugs: medlinePlusData.drugInfo.length,
    guidelines: guidelines.length,
    whoGuidelines: whoGuidelines.length,
    cdcGuidelines: cdcGuidelines.length,
    niceGuidelines: niceGuidelines.length,
    bmjBestPractice: bmjBestPractice.length,
    cardiovascularGuidelines: cardiovascularGuidelines.length,
    ncbiBooks: (ncbiBooks as NCBIBook[]).length,
    omimEntries: (omimData as OMIMEntry[]).length,
    pubChemCompounds: pubChemCompounds.length,
    landmarkTrials: landmarkTrials.length,
    pubChemBioAssays: pubChemBioAssays.length,
    openIResearch: openIArticles.researchArticles.length,
    openIReviews: openIArticles.reviewArticles.length,
    openISystematicReviews: openIArticles.systematicReviews.length,
    openICaseReports: openIArticles.caseReports.length,
    tavilyCitations: evidence.tavilyCitations.length,
  });

  return evidence;
}

/**
 * Helper function to count total evidence items
 */
function getTotalEvidenceCount(evidence: EvidencePackage): number {
  return evidence.guidelines.length +
    evidence.whoGuidelines.length +
    evidence.cdcGuidelines.length +
    evidence.niceGuidelines.length +
    evidence.landmarkTrials.length +
    evidence.cochraneReviews.length +
    evidence.pubmedArticles.length +
    evidence.pubmedReviews.length +
    evidence.clinicalTrials.length;
}

/**
 * Format evidence package for inclusion in AI prompt
 * 
 * IMPORTANT: This function organizes evidence into 21 medical knowledge zones:
 * 1. Clinical Guidelines Zone - Authoritative practice guidelines
 * 2. Systematic Reviews Zone - Cochrane and other systematic reviews
 * 3. Meta-Analysis Zone - Pooled analysis studies
 * 4. Clinical Trials Zone - RCTs and ongoing trials
 * 5. Drug Information Zone - FDA labels, DailyMed, drug safety
 * 6. Drug Interactions Zone - Drug-drug interactions
 * 7. Adverse Events Zone - FDA FAERS data
 * 8. Treatment Protocols Zone - Standard treatment approaches
 * 9. Diagnostic Criteria Zone - Diagnostic guidelines
 * 10. Pathophysiology Zone - Disease mechanisms
 * 11. Epidemiology Zone - Disease prevalence and risk factors
 * 12. Prognosis Zone - Outcomes and survival data
 * 13. Prevention Zone - Preventive measures
 * 14. Pediatric Zone - Age-specific considerations
 * 15. Geriatric Zone - Elderly patient considerations
 * 16. Pregnancy Zone - Maternal-fetal medicine
 * 17. Genetics Zone - Genetic factors and pharmacogenomics
 * 18. Imaging Zone - Radiology and imaging findings
 * 19. Laboratory Zone - Lab values and interpretation
 * 20. Patient Education Zone - Consumer health information
 * 21. Emerging Research Zone - Preprints and recent findings
 * 
 * Each evidence item includes its SOURCE for proper citation.
 */
import { rankAndFilterEvidence } from "./evidence-ranker";

/**
 * Format evidence package for inclusion in AI prompt
 * 
 * ENHANCED VERSION: Now includes explicit recommendation strengths, trial classifications,
 * and stepwise protocols to address accuracy issues identified in suggestions.md
 */
import { extractRecommendationStrength, formatRecommendationStrength, detectStepwiseProtocol, extractStepwiseProtocol } from "./recommendation-strength-extractor";
import { classifyTrial } from "./trial-classifier";
import { addRecencyFilters, filterByRecency } from "./recent-data-prioritizer";

/**
 * Format evidence package for inclusion in AI prompt
 * ...
 */
export async function formatEvidenceForPrompt(
  rawEvidence: EvidencePackage,
  clinicalQuery?: string,
  picoTags?: PICOExtraction
): Promise<string> {
  // STEP 0: Apply Recent Data Prioritization (2025/2024/2023 first)
  console.log('📅 Applying recent data prioritization (2025/2024/2023 first)...');

  // Filter all evidence arrays for recency
  const recentEvidence = {
    ...rawEvidence,
    pubmedArticles: filterByRecency(rawEvidence.pubmedArticles, 60), // 2020+
    pubmedReviews: filterByRecency(rawEvidence.pubmedReviews, 70), // 2021+
    pubmedGuidelines: filterByRecency(rawEvidence.pubmedGuidelines, 60), // 2020+
    // Europe PMC uses 'firstPublicationDate' field - cast to expected type
    europePMCRecent: filterByRecency(
      rawEvidence.europePMCRecent.map(a => ({ ...a, publicationDate: a.firstPublicationDate })),
      80
    ) as unknown as EuropePMCArticle[], // 2022+
    cochraneReviews: filterByRecency(rawEvidence.cochraneReviews, 70), // 2021+
    clinicalTrials: rawEvidence.clinicalTrials // Keep all trials, will be classified separately
  };

  // STEP 0.5: Rank and Filter Evidence (Curation Layer)
  // Use tag-based ranking if tags are available, otherwise use original ranker
  let evidence: EvidencePackage;

  if (picoTags && picoTags.disease_tags.length > 0) {
    // Use tag-based ranking for better relevance
    console.log('🏷️  Using tag-based evidence ranking');
    const anchorScenario = detectAnchorScenario(picoTags.disease_tags, picoTags.decision_tags);
    const rankingConfig: TagBasedRankingConfig = {
      disease_tags: picoTags.disease_tags,
      decision_tags: picoTags.decision_tags,
      primary_disease_tag: picoTags.primary_disease_tag,
      primary_decision_tag: picoTags.primary_decision_tag,
      secondary_decision_tags: picoTags.secondary_decision_tags,
      anchor_scenario: anchorScenario,
      boost_anchors: true,
      penalize_off_topic: true,
      min_references: 5,
      max_references: 10,
    };
    evidence = rankAndFilterEvidenceWithTags(recentEvidence, rankingConfig, 10);
  } else {
    // Fallback to original ranking
    evidence = rankAndFilterEvidence(recentEvidence, 15, clinicalQuery);
  }

  // STEP 0.5: Apply Reference Cap for Complex Scenarios (User Request)
  // For complex topics like AF + CKD, user wants to limit noise and focus on key anchors.
  try {
    const { ANCHOR_GUIDELINES } = require('./guideline-anchors');
    let isComplexScenario = false;

    // Check if any anchor guidelines match a complex scenario definition
    // We iterate through scenarios and check if their primary guidelines are present
    Object.values(ANCHOR_GUIDELINES).forEach((scenario: any) => {
      if (scenario.microprompt && scenario.primaryGuidelines) {
        const hasMatchingGuideline = evidence.guidelines.some(g =>
          scenario.primaryGuidelines.some((pg: any) => g.title.includes(pg.name) || pg.name.includes(g.title))
        );
        if (hasMatchingGuideline) isComplexScenario = true;
      }
    });

    if (isComplexScenario) {
      console.log("🔒 Complex Scenario Detected: Capping references to reduce noise.");
      // Cap at top 3-4 per category to keep total around 8-10 high-quality sources
      evidence.clinicalTrials = evidence.clinicalTrials.slice(0, 3);
      evidence.pubmedArticles = evidence.pubmedArticles.slice(0, 4);
      evidence.pubmedReviews = evidence.pubmedReviews.slice(0, 3);
      // We keep guidelines as is, assuming they are high value
    }
  } catch (error) {
    console.error("Error applying reference cap:", error);
  }

  let formatted = "\n\n--- EVIDENCE RETRIEVED FROM MULTIPLE DATABASES ---\n\n";

  // STEP 0.5: Add Medical Abbreviation Expansions (CRITICAL FOR LLM UNDERSTANDING)
  // This ensures the LLM always understands the full meaning of medical abbreviations
  if (clinicalQuery) {
    try {
      const { getAbbreviationCoverage, getExpandedTerms } = await import('./medical-abbreviations');
      const coverage = getAbbreviationCoverage(clinicalQuery);

      if (coverage.knownAbbrevs.length > 0 || coverage.unknownAbbrevs.length > 0) {
        formatted += "**📖 MEDICAL ABBREVIATIONS IN THIS QUERY:**\n\n";
        formatted += "The following medical abbreviations were detected and expanded for your understanding:\n\n";

        // Show known abbreviations with their expansions
        if (coverage.knownAbbrevs.length > 0) {
          formatted += "**Known Abbreviations:**\n";
          const expandedTerms = getExpandedTerms(clinicalQuery);
          coverage.knownAbbrevs.forEach((abbr, idx) => {
            if (expandedTerms[idx]) {
              formatted += `- **${abbr}** = ${expandedTerms[idx]}\n`;
            }
          });
          formatted += "\n";
        }

        // Flag unknown abbreviations for LLM interpretation
        if (coverage.unknownAbbrevs.length > 0) {
          formatted += "**Unknown Abbreviations (interpret from context):**\n";
          coverage.unknownAbbrevs.forEach(abbr => {
            formatted += `- **${abbr}** = (interpret based on clinical context)\n`;
          });
          formatted += "\n";
        }

        formatted += "**🎯 USE THESE FULL TERMS when searching the evidence below and in your response.**\n\n";
        formatted += "---\n\n";
      }
    } catch (error) {
      console.error("Error adding abbreviation expansions:", error);
    }
  }

  // STEP 0.6: Build Citation Whitelist for LLM (CRITICAL for preventing hallucination)
  const citationWhitelist: string[] = [];

  // Add PMIDs from all evidence sources
  evidence.pubmedArticles.forEach(article => {
    if (article.pmid) citationWhitelist.push(article.pmid);
  });
  evidence.pubmedReviews.forEach(article => {
    if (article.pmid) citationWhitelist.push(article.pmid);
  });
  evidence.pubmedGuidelines.forEach(article => {
    if (article.pmid) citationWhitelist.push(article.pmid);
  });
  evidence.cochraneReviews.forEach(review => {
    if (review.pmid) citationWhitelist.push(review.pmid);
  });
  evidence.europePMCRecent.forEach(article => {
    if (article.pmid) citationWhitelist.push(article.pmid);
  });
  evidence.pmcArticles.forEach(article => {
    if (article.articleIds?.pmid) citationWhitelist.push(article.articleIds.pmid);
  });

  console.log(`📋 Citation whitelist: ${citationWhitelist.length} valid PMIDs for LLM`);

  formatted += "**🚨 CITATION WHITELIST (MANDATORY)**:\n";
  formatted += "You may ONLY cite the following PMIDs that appear in the evidence:\n";
  formatted += citationWhitelist.slice(0, 20).join(", ") + (citationWhitelist.length > 20 ? "..." : "") + "\n";
  formatted += "**DO NOT cite any PMID not in this list. DO NOT invent PMIDs.**\n\n";
  formatted += "---\n\n";

  // STEP 0.7: Inject Anchor Guidelines Section (CRITICAL FIX)
  // This ensures anchor guidelines are prominently displayed and prioritized
  if (clinicalQuery) {
    try {
      const { formatAnchorGuidelinesForPrompt, getAnchorGuidelines } = require('./guideline-anchors');
      const anchorGuidelines = getAnchorGuidelines(clinicalQuery);
      if (anchorGuidelines.length > 0) {
        formatted += formatAnchorGuidelinesForPrompt(anchorGuidelines);
        console.log(`⚓ Injected ${anchorGuidelines.length} Anchor Guidelines into prompt`);
      }
    } catch (error) {
      console.error("Error injecting anchor guidelines:", error);
    }
  }

  // STEP 0.7: Inject Landmark Trials Section (CRITICAL FIX)
  // These are high-impact trials that inform current clinical practice
  if (evidence.landmarkTrials && evidence.landmarkTrials.length > 0) {
    formatted += formatLandmarkTrialsForPrompt(evidence.landmarkTrials);
    console.log(`🏆 Injected ${evidence.landmarkTrials.length} Landmark Trials into prompt`);
  }

  // STEP 0.8: CHUNK-BASED FULL-TEXT PROCESSING (Online Chunking System)
  // Instead of big 3k-char blocks, we now:
  // 1. Fetch full-text for top articles
  // 2. Split into granular section-level chunks
  // 3. Rerank chunks with BGE cross-encoder
  // 4. Include only the highest-relevance chunks in the prompt

  let rankedChunks: ArticleChunk[] = [];

  if (evidence.pubmedArticles && evidence.pubmedArticles.length > 0) {
    try {
      console.log('📖 PHASE: Chunk-based full-text processing...');

      // Step 1: Select top articles for chunking
      const articlesForChunking = evidence.pubmedArticles.slice(0, 8).map(article => ({
        pmid: article.pmid,
        doi: article.doi,
        title: article.title,
        abstract: article.abstract,
      }));

      // Step 2: Fetch full-text and create chunks
      const chunkMap = await fetchAndChunkFullTextForTopArticles(articlesForChunking, 8);

      // Step 3: Flatten all chunks into a single array for reranking
      const allChunks: ArticleChunk[] = [];
      for (const [, chunks] of chunkMap) {
        allChunks.push(...chunks);
      }

      console.log(`📦 Created ${allChunks.length} chunks from ${chunkMap.size} articles`);

      // Step 4: Also create abstract chunks for articles without full-text
      const abstractChunks = createAbstractChunksFromArticles(
        evidence.pubmedArticles.slice(0, 10),
        2 // 2 sentences per chunk
      );

      // Convert abstract chunks to ArticleChunk format
      const abstractAsArticleChunks: ArticleChunk[] = abstractChunks.map(ac => ({
        id: ac.id,
        pmid: ac.pmid,
        title: ac.title,
        journal: ac.journal,
        year: ac.year ? parseInt(ac.year) : undefined,
        sectionType: 'abstract' as const,
        sectionHeading: 'Abstract',
        chunkIndex: ac.sentenceIndices[0] || 0,
        text: ac.text,
        source: 'abstract' as const,
      }));

      // Combine full-text chunks with abstract chunks (full-text takes priority)
      const fullTextPmids = new Set(Array.from(chunkMap.keys()));
      const filteredAbstractChunks = abstractAsArticleChunks.filter(
        c => !fullTextPmids.has(c.pmid)
      );

      const combinedChunks = [...allChunks, ...filteredAbstractChunks];
      console.log(`📦 Total chunks for reranking: ${combinedChunks.length} (${allChunks.length} full-text + ${filteredAbstractChunks.length} abstract)`);

      // Step 5: Rerank all chunks using BGE cross-encoder
      if (combinedChunks.length > 0 && clinicalQuery) {
        const chunksForRerank = articleChunksToRerankFormat(combinedChunks);

        const rerankedChunkResults = await rerankChunksWithBGE(
          clinicalQuery,
          chunksForRerank,
          {
            topK: 40,      // Consider up to 40 chunks
            minScore: 0.5, // Require decent relevance
            maxLength: 384 // Smaller token limit for chunks
          }
        );

        // Map back reranked scores to ArticleChunks
        const chunkIdToScore = new Map(
          rerankedChunkResults.map(c => [c.id, c.score || 0])
        );

        rankedChunks = combinedChunks
          .map(c => ({
            ...c,
            score: chunkIdToScore.get(c.id) || 0,
          }))
          .filter(c => c.score && c.score >= 0.5)
          .sort((a, b) => (b.score || 0) - (a.score || 0))
          .slice(0, 15); // Keep top 15 chunks

        console.log(`🎯 Selected ${rankedChunks.length} high-relevance chunks after reranking`);

        // Add PMIDs from chunks to citation whitelist
        rankedChunks.forEach(chunk => {
          if (chunk.pmid && !citationWhitelist.includes(chunk.pmid)) {
            citationWhitelist.push(chunk.pmid);
          }
        });
      }

      // Step 6: Format ranked chunks for the prompt
      if (rankedChunks.length > 0) {
        const chunksSection = formatChunksForPrompt(rankedChunks, 12, 800);
        formatted += chunksSection;
        console.log(`📚 Injected ${Math.min(rankedChunks.length, 12)} granular chunks into prompt`);
      } else {
        // Fallback to old full-text approach if chunking fails
        console.log('⚠️ No chunks passed reranking threshold, falling back to full-text...');
        const fullTextResults = await fetchFullTextForTopArticles(articlesForChunking, 5);
        const fullTextSection = formatFullTextForPrompt(fullTextResults, 3000);
        if (fullTextSection && fullTextSection.length > 100) {
          formatted += fullTextSection;
          console.log(`📚 Fallback: Injected full-text for ${fullTextResults.size} articles`);
        }
      }

    } catch (error) {
      console.warn('⚠️ Chunk-based processing failed, continuing with abstracts:', error);
    }
  }

  // CRITICAL WARNING about zone numbers
  formatted += "⚠️ **CITATION WARNING - READ CAREFULLY:**\n";
  formatted += "The evidence below is organized into ZONES (Zone 0, Zone 1, Zone 21, etc.) for internal organization ONLY.\n";
  formatted += "**DO NOT use zone numbers as citation numbers!**\n";
  formatted += "- ❌ WRONG: [[1B.1]], [[21.3]], [[22.3]], [[P1]]\n";
  formatted += "- ✅ CORRECT: [[1]], [[2]], [[3]], [[4]], [[5]]\n";
  formatted += "When you cite sources, renumber them sequentially starting from 1.\n\n";

  formatted += "**IMPORTANT: Each evidence item includes its SOURCE and BADGES. Use this to cite properly.**\n";
  formatted += "**Available sources: PubMed, Cochrane, Europe PMC, Semantic Scholar, ClinicalTrials.gov, OpenAlex, PMC, DailyMed, MedlinePlus, FDA, WHO, CDC, NICE, Open-i (NLM), Mayo Clinic, ADA, AHA**\n\n";

  // SOURCE-SPECIFIC RULES (Critical for quality)
  formatted += "### SOURCE-SPECIFIC CITATION RULES (MANDATORY)\n\n";
  formatted += "**GUIDELINES (Primary Sources)**:\n";
  formatted += "- Society guidelines (IDSA, ACC/AHA, ESC, AAP) = PRIMARY for specialty details\n";
  formatted += "- WHO/NICE = BACKUP or for global/LMIC context\n";
  formatted += "- ❌ DO NOT cite BMJ Best Practice directly - use it only to find underlying guidelines/trials\n\n";

  formatted += "**SYSTEMATIC REVIEWS (Tier 2)**:\n";
  formatted += "- Cochrane reviews = GOLD STANDARD - cite when available\n";
  formatted += "- Require at least 1 SR/meta-analysis matching disease + decision before saying 'evidence limited'\n";
  formatted += "- Pick 1-2 highest-quality (recent, high-impact journal) if multiple exist\n\n";

  formatted += "**TRIALS (Tier 3)**:\n";
  formatted += "- Landmark trials (DAPA-CKD, MASTER-DAPT, etc.) = cite by name when relevant to disease area\n";
  formatted += "- ❌ DO NOT cite trials outside their disease area (no DAPT trials for CAP questions)\n";
  formatted += "- Registry-only trials (no published results) = mention in 'Evidence Gaps' only, never for management\n\n";

  formatted += "**DRUG INFO (Dosing/Safety)**:\n";
  formatted += "- DailyMed/OpenFDA = REQUIRED for dosing, contraindications, boxed warnings\n";
  formatted += "- RxNorm = for drug names only, not as evidence source\n";
  formatted += "- ❌ PubChem = mechanism/basic science only, never for clinical dosing\n\n";

  formatted += "**REFERENCE SOURCES (Background Only)**:\n";
  formatted += "- NCBI Books/StatPearls = pathophysiology and summaries, not front-line management\n";
  formatted += "- OMIM = genetic/rare disease queries ONLY\n";
  formatted += "- ❌ MedlinePlus = General Mode only, DO NOT cite in Doctor Mode\n\n";

  formatted += "**REAL-TIME SEARCH (Last Resort)**:\n";
  formatted += "- Tavily = only if guidelines + reviews + trials are inadequate\n";
  formatted += "- ❌ NEVER output Tavily URLs or generic search URLs in references\n";
  formatted += "- Re-resolve any Tavily lead via PubMed/PMC before citing\n\n";

  // INSTRUCTION: Gap Analysis & Citation Rules
  // INSTRUCTION: Gap Analysis & Citation Rules
  formatted += "## INSTRUCTIONS FOR RESPONSE GENERATION\n";
  formatted += "### 1. RESPONSE STYLE (CRITICAL)\n";
  formatted += "- **CONCISE & ACTIONABLE**: Target 300-400 words MAXIMUM. Professional clinical responses should be ~400 words. Match that length.\n";
  formatted += "- **PROFESSIONAL TONE**: Write for a peer (doctor-to-doctor). Be precise and high-density. NO FLUFF.\n";
  formatted += "- **ELIMINATE REPETITION**: Do NOT repeat the same information in multiple sections. Say it once, clearly.\n";
  formatted += "- **FOCUS ON DECISION**: What should the doctor DO? Skip background pathophysiology unless essential.\n";
  formatted += "- **HONESTY ABOUT UNCERTAINTY**: If evidence is weak, say so briefly. Don't pad with speculation.\n";
  formatted += "- **PATTERN-BASED SYNTHESIS**: Aggregate results from multiple studies. E.g., 'Meta-analyses show...' not 'Study X found... Study Y found...'\n";
  formatted += "- **DOSING**: Only include doses if directly relevant to the question. Don't list every possible regimen.\n\n";

  formatted += "### 2. STRUCTURE & FORMATTING\n";
  formatted += "- **QUICK ANSWER**: 2-3 sentences. Direct answer only.\n";
  formatted += "- **CLINICAL ANSWER**: 1 paragraph. Guideline + practical plan. NO REPETITION of Quick Answer.\n";
  formatted += "- **EVIDENCE SUMMARY**: 1-2 paragraphs MAXIMUM. Focus on:\n";
  formatted += "   1) Key guideline (e.g., 'ATS/IDSA 2019 recommends...')\n";
  formatted += "   2) Supporting evidence (1-2 trials/meta-analyses by name)\n";
  formatted += "   3) Strength of evidence (strong/moderate/weak)\n";
  formatted += "- **CLINICAL RECOMMENDATIONS**: BRIEF bullet points. Only include if question asks for specific management steps.\n";
  formatted += "- **SKIP SECTIONS** that don't add value. If the question is answered in 2 paragraphs, stop there.\n";
  formatted += "- **IMAGES**: If images are provided, ONLY reference images that DIRECTLY answer the question. Ignore generic teaching diagrams, off-topic flowcharts, or images from different conditions.\n";
  formatted += "- **CITATION STYLE**: Use simple numbered tags [1], [2] in the text. DO NOT repeat DOIs or titles in the text.\n";
  formatted += "- **REFERENCE LIST**: Format references EXACTLY as shown below:\n\n";
  formatted += "   **REQUIRED FORMAT (3 lines per reference):**\n";
  formatted += "   ```\n";
  formatted += "   1. [Article Title](URL)\n";
  formatted += "      Authors. Journal. Year. PMID:xxxxx doi:xxxxx\n";
  formatted += "      [Source Badge] - [Quality Badge]\n";
  formatted += "   ```\n\n";
  formatted += "   **HOW TO EXTRACT METADATA FROM EVIDENCE:**\n";
  formatted += "   Each evidence item in the zones above contains:\n";
  formatted += "   - Title: Use the exact title shown\n";
  formatted += "   - Authors: Listed after 'Authors:' (use first 3 + 'et al.')\n";
  formatted += "   - Journal: Listed after 'Journal:'\n";
  formatted += "   - Year: Extract from publication date or year field\n";
  formatted += "   - PMID: Listed after 'PMID:' (if available)\n";
  formatted += "   - DOI: Listed after 'DOI:' or 'doi:' (if available)\n";
  formatted += "   - Source: Listed after 'SOURCE:' (e.g., PubMed, Cochrane, PMC)\n\n";
  formatted += "   **URL CONSTRUCTION RULES (CRITICAL - NO EXCEPTIONS):**\n";
  formatted += "   Build URLs from the metadata provided in each evidence item:\n";
  formatted += "   \n";
  formatted += "   **PRIORITY ORDER (use the first available):**\n";
  formatted += "   1. ✓ If PMID exists: https://pubmed.ncbi.nlm.nih.gov/[PMID] (HIGHEST PRIORITY)\n";
  formatted += "   2. ✓ If PMCID exists: https://pmc.ncbi.nlm.nih.gov/articles/[PMCID]\n";
  formatted += "   3. ✓ If DOI exists: https://doi.org/[DOI]\n";
  formatted += "   4. ✓ Anchor Guidelines: Use the 'url' field if provided\n";
  formatted += "   \n";
  formatted += "   **CRITICAL RULES:**\n";
  formatted += "   ✅ ALWAYS prefer PubMed/PMC URLs over journal-specific URLs\n";
  formatted += "   ✅ PubMed/PMC are public domain and freely accessible to all users\n";
  formatted += "   ✅ Users can click 'View Full Text' on PubMed to access the article\n";
  formatted += "   ❌ NEVER use journal-specific URLs (nejm.org, jamanetwork.com, thelancet.com, etc.)\n";
  formatted += "   ❌ NEVER use google.com/search URLs - this is a CRITICAL ERROR\n";
  formatted += "   ❌ NEVER fabricate PMIDs or DOIs - only use what's in the evidence\n";
  formatted += "   ❌ If no PMID/PMCID/DOI/URL exists, DO NOT cite that source\n";
  formatted += "   \n";
  formatted += "   **WHY PubMed/PMC?**\n";
  formatted += "   - Part of National Library of Medicine (NLM)\n";
  formatted += "   - Free and accessible to everyone\n";
  formatted += "   - Provides 'View Full Text' links to original sources\n";
  formatted += "   - No subscription required\n";
  formatted += "   \n";
  formatted += "   **MAJOR ORGANIZATIONS (NEJM, Mayo Clinic, NCCN, etc.):**\n";
  formatted += "   Even for articles from prestigious sources, ALWAYS use PubMed/PMC URLs:\n";
  formatted += "   ✅ NEJM article → Use PubMed URL (pubmed.ncbi.nlm.nih.gov/[PMID])\n";
  formatted += "   ✅ JAMA article → Use PubMed URL (pubmed.ncbi.nlm.nih.gov/[PMID])\n";
  formatted += "   ✅ Lancet article → Use PubMed URL (pubmed.ncbi.nlm.nih.gov/[PMID])\n";
  formatted += "   ✅ Mayo Clinic Proceedings → Use PubMed URL (pubmed.ncbi.nlm.nih.gov/[PMID])\n";
  formatted += "   ✅ Circulation → Use PubMed URL (pubmed.ncbi.nlm.nih.gov/[PMID])\n";
  formatted += "   ✅ Kidney International → Use PubMed URL (pubmed.ncbi.nlm.nih.gov/[PMID])\n";
  formatted += "   ❌ NEVER link directly to nejm.org, jamanetwork.com, thelancet.com, mayoclinicproceedings.org, etc.\n";
  formatted += "   \n";
  formatted += "   **REASON:** PubMed provides free access and 'View Full Text' links. Journal sites may require subscriptions.\n\n";
  formatted += "   **EXAMPLE (from ZONE 4 evidence):**\n";
  formatted += "   Evidence shows:\n";
  formatted += "   ```\n";
  formatted += "   1. Atypical pneumonia: Pathophysiology, diagnosis, and treatment\n";
  formatted += "      SOURCE: PubMed | PMID: 34750083\n";
  formatted += "      Authors: Miyashita N, Matsushima T, Oka M\n";
  formatted += "      Journal: Respiratory Investigation (2022)\n";
  formatted += "   ```\n";
  formatted += "   Your reference should be:\n";
  formatted += "   ```\n";
  formatted += "   3. [Atypical pneumonia: Pathophysiology, diagnosis, and treatment](https://pubmed.ncbi.nlm.nih.gov/34750083)\n";
  formatted += "      Miyashita N, Matsushima T, Oka M. Respiratory Investigation. 2022. PMID:34750083\n";
  formatted += "      [PubMed] - [Recent (≤3y)]\n";
  formatted += "   ```\n\n";
  formatted += "   **REFERENCE COUNT**: You MUST cite **6-10 high-quality sources**. Do NOT rely on just 1-2 sources. Synthesize the Anchor Guidelines, Systematic Reviews, and Key Trials provided.\n";
  formatted += "   **REFERENCE DISTRIBUTION CHECKLIST (MANDATORY)**:\n";
  formatted += "      □ 1-2 major guidelines (ACC/AHA, ESC, IDSA, KDIGO, Surviving Sepsis, etc.)\n";
  formatted += "      □ 1-2 Cochrane reviews or meta-analyses (if available in evidence)\n";
  formatted += "      □ 2-3 pivotal RCTs or key observational studies\n";
  formatted += "      □ Total: 6-10 references\n";
  formatted += "      □ All references directly answer the clinical question (no off-topic papers)\n";
  formatted += "      □ All references have real PMIDs or DOIs (no Google URLs)\n";
  formatted += "   **BADGE SELECTION:**\n";
  formatted += "   Source Badge (choose based on SOURCE field):\n";
  formatted += "   - [PubMed] - for PubMed articles\n";
  formatted += "   - [Cochrane] - for Cochrane Library\n";
  formatted += "   - [PMC] - for PMC articles\n";
  formatted += "   - [Practice Guideline] - for clinical guidelines\n";
  formatted += "   - [ScienceDirect] - for ScienceDirect articles\n";
  formatted += "   - [Europe PMC] - for Europe PMC articles\n\n";
  formatted += "   Quality Badge (choose based on evidence characteristics):\n";
  formatted += "   - [Systematic Review] - if title contains 'systematic review' or 'meta-analysis'\n";
  formatted += "   - [Recent (≤3y)] - if published 2022 or later\n";
  formatted += "   - [High-Impact] - if journal is NEJM, Lancet, JAMA, BMJ, Circulation\n";
  formatted += "   - [Pivotal RCT] - for landmark trials\n\n";
  formatted += "   **PARITY RULE**: The Reference List must contain ONLY the sources you explicitly cited in the text (e.g., if you have [1]..[6] in text, list ONLY 1..6). Do NOT list sources you did not cite.\n\n";
  formatted += "   **QUALITY CHECK**: Before finalizing references, verify:\n";
  formatted += "   ✓ EVERY reference MUST have a real PMID or DOI from the evidence (not fabricated)\n";
  formatted += "   ✓ DO NOT include references without PMID/DOI/URL - they won't be clickable\n";
  formatted += "   ✓ Each reference directly addresses the clinical question\n";
  formatted += "   ✓ No google.com/search URLs (use direct article links from evidence)\n";
  formatted += "   ✓ At least 50% are from Tier 1-2 sources (Guidelines, Meta-analyses)\n";
  formatted += "   ✓ All metadata (authors, journal, year) is extracted from the evidence zones\n\n";
  formatted += "   **CRITICAL**: If a source doesn't have a PMID/DOI/URL in the evidence, DO NOT cite it. Only cite sources with verifiable identifiers.\n\n";

  // INJECT MICROPROMPTS (Scenario-Specific Instructions)
  // This logic detects clinical scenarios from the query and injects their microprompts
  try {
    const { detectClinicalScenarios, ANCHOR_GUIDELINES } = require('./guideline-anchors');
    let injectedMicroprompts = "";

    // Method 1: Detect scenarios directly from the clinical query (most reliable)
    if (clinicalQuery) {
      const detectedScenarios = detectClinicalScenarios(clinicalQuery);
      detectedScenarios.forEach((scenario: any) => {
        if (scenario.microprompt) {
          injectedMicroprompts += `\n⚠️ **SCENARIO-SPECIFIC INSTRUCTION**: ${scenario.microprompt}\n`;
        }
      });
    }

    // Method 2: Fallback - check if any anchor guidelines in evidence match a scenario with microprompt
    if (!injectedMicroprompts) {
      Object.values(ANCHOR_GUIDELINES).forEach((scenario: any) => {
        if (scenario.microprompt && scenario.primaryGuidelines) {
          const hasMatchingGuideline = evidence.guidelines.some(g =>
            scenario.primaryGuidelines.some((pg: any) => g.title.includes(pg.name) || pg.name.includes(g.title))
          );

          if (hasMatchingGuideline) {
            injectedMicroprompts += `\n⚠️ **SCENARIO-SPECIFIC INSTRUCTION**: ${scenario.microprompt}\n`;
          }
        }
      });
    }

    if (injectedMicroprompts) {
      formatted += "### 4. SPECIAL INSTRUCTIONS FOR THIS TOPIC (CRITICAL)\n";
      formatted += injectedMicroprompts + "\n";
    }

    // CRITICAL FIX: Add guideline + drug selection instructions
    // This addresses the user's feedback on KDIGO + potassium binder questions
    if (clinicalQuery) {
      const lowerQuery = clinicalQuery.toLowerCase();
      const hasKDIGO = lowerQuery.includes('kdigo') || lowerQuery.includes('kidney disease improving');
      const hasDrugSelection = lowerQuery.includes('patiromer') ||
        lowerQuery.includes('sodium zirconium') ||
        lowerQuery.includes('szc') ||
        lowerQuery.includes('binder') ||
        lowerQuery.includes('versus') ||
        lowerQuery.includes('vs');
      const hasGuideline = lowerQuery.includes('guideline') || lowerQuery.includes('recommendation');

      if ((hasKDIGO || hasGuideline) && hasDrugSelection) {
        formatted += "\n⚠️ **GUIDELINE + DRUG SELECTION PATTERN (CRITICAL)**:\n";
        formatted += "For questions about clinical guidelines + specific drug choices:\n";
        formatted += "1. **Explicitly state the guideline's position**: Make the connection between the guideline and the drug/intervention crystal clear (e.g., 'KDIGO 2024 supports using potassium binders to preserve RAAS inhibitor therapy')\n";
        formatted += "2. **Core principle first**: State the overarching clinical goal from the guideline (e.g., maintain RAAS inhibitor-based GDMT in CKD whenever possible)\n";
        formatted += "3. **Drug comparison**: Provide concise, clinically useful contrast between options with key differentiators:\n";
        formatted += "   - Onset of action (fast vs slow)\n";
        formatted += "   - Drug-drug interactions (many vs few)\n";
        formatted += "   - Special considerations (sodium load, GI effects, etc.)\n";
        formatted += "4. **Guideline specificity**: Acknowledge when guideline doesn't mandate one drug over another - explain that choice is based on drug properties and patient factors\n";
        formatted += "5. **Safety caveats**: Include brief, specific safety warnings for each option:\n";
        formatted += "   - Example: 'SZC: sodium-related edema/heart failure risk in volume-sensitive patients'\n";
        formatted += "   - Example: 'Patiromer: GI side effects, multiple drug-drug interactions requiring dose separation'\n";
        formatted += "6. **Patient selection**: Make recommendations sharp and actionable based on patient characteristics\n\n";
      }
    }
  } catch (error) {
    console.error("Error injecting microprompts:", error);
  }

  formatted += "### 3. EVIDENCE USAGE (CRITICAL)\n";
  formatted += "- **INTERNAL EVIDENCE BRAIN FIRST**: You have access to 20+ medical databases (PubMed, Cochrane, Europe PMC, OpenAlex, Landmark Trials, etc.). USE THESE FIRST. They are curated, verified, and high-quality.\n";
  formatted += "- **ANCHOR GUIDELINES MANDATORY**: If 'ANCHOR GUIDELINES' section exists, cite at least 2-3 of them. These are pre-selected gold standards.\n";
  formatted += "- **LANDMARK TRIALS**: If landmark trials are provided, prioritize citing them. They are curated high-impact studies.\n";
  formatted += "- **EXTERNAL SOURCES LAST**: Only use Tavily or external sources if internal evidence is insufficient. Our evidence brain is comprehensive.\n";
  formatted += "- **OFF-TOPIC FILTER (CRITICAL)**: Do NOT cite papers that don't directly address the clinical question. Ask yourself: 'Does this paper help answer the specific question asked?'\n";
  formatted += "   **Examples of what NOT to cite**:\n";
  formatted += "   ❌ MINOCA imaging studies in a DAPT duration question\n";
  formatted += "   ❌ Exercise/HIIT studies in an antibiotic question\n";
  formatted += "   ❌ AF anticoagulation in a heart failure question (unless overlap)\n";
  formatted += "   ❌ Biomarker studies (procalcitonin, CRP) in an antibiotic choice question\n";
  formatted += "   ❌ Duration studies in an initial regimen question\n";
  formatted += "   ❌ Pathophysiology papers in a treatment question\n";
  formatted += "   ❌ Diagnostic criteria papers in a management question\n";
  formatted += "   **Rule**: If the paper's main focus is NOT the question's main focus, DO NOT cite it.\n";
  formatted += "- **EVIDENCE HIERARCHY**: If a Tier 1 (Guideline) or Tier 2 (Systematic Review) source answers a question, **DO NOT** cite lower-tier trials/studies unless they provide clearly new information.\n";
  formatted += "- **REFERENCE COUNT**: You MUST cite 6-10 sources. Distribution:\n";
  formatted += "   ✓ At least 1-2 major guidelines (ACC/AHA, ESC, KDIGO, IDSA, etc.)\n";
  formatted += "   ✓ At least 1-2 meta-analyses or systematic reviews (Cochrane preferred)\n";
  formatted += "   ✓ At least 2-3 pivotal RCTs or key observational studies\n";
  formatted += "   ✓ No more than 1-2 'Other/Unknown' sources\n";
  formatted += "- **GAP ANALYSIS (INTERNAL CHECK)**: At the end of your response, generate a 'Gap Analysis' section to verify your evidence usage.\n";
  formatted += "   Format:\n";
  formatted += "   ### Analysis of Gap\n";
  formatted += "   - **Evidence Collected**: [List key guidelines provided in context]\n";
  formatted += "   - **Evidence Used**: [List guidelines you actually cited]\n";
  formatted += "   - **Missing Key Points**: [Note any missed recommendations]\n";
  formatted += "   - **Formatting Issues**: [Self-correct any formatting errors]\n";
  formatted += "   - **Anchor Check**: [Did I cite the Anchor Guidelines provided? Yes/No]\n\n";

  // PHASE 1 ENHANCEMENT: Calculate and display evidence sufficiency score
  // Error handling: If scoring fails, continue without it (graceful degradation)
  try {
    const { scoreEvidenceSufficiency, formatSufficiencyForPrompt, formatSufficiencyWarning } = require('./sufficiency-scorer');
    const sufficiencyScore = scoreEvidenceSufficiency(evidence);

    // Add instruction to NOT include this in the response
    formatted += "\n\n**🚨 CRITICAL INSTRUCTION - INTERNAL USE ONLY:**\n";
    formatted += "The following 'EVIDENCE QUALITY ASSESSMENT' section is for YOUR INTERNAL USE ONLY.\n";
    formatted += "**DO NOT include this section in your response to the user.**\n";
    formatted += "**DO NOT copy or paraphrase this assessment in your Clinical Answer or Evidence Summary.**\n";
    formatted += "Use this information to guide your confidence level, but DO NOT display it.\n\n";

    formatted += formatSufficiencyForPrompt(sufficiencyScore);

    // Add warning if evidence is limited or insufficient
    const warning = formatSufficiencyWarning(sufficiencyScore);
    if (warning) {
      formatted += warning;
    }

    // Log sufficiency metrics
    console.log(`📊 Evidence Sufficiency: ${sufficiencyScore.level.toUpperCase()} (${sufficiencyScore.score}/100)`);
  } catch (error: any) {
    console.error('❌ Evidence sufficiency scoring failed:', error.message);
    console.error('Continuing without sufficiency score (graceful degradation)');
    // Continue without sufficiency score - backward compatible
  }

  // PHASE 1 ENHANCEMENT: Detect and display conflicts between authoritative sources
  // Error handling: If conflict detection fails, continue without it (graceful degradation)
  try {
    const { detectConflicts, formatConflictsForPrompt } = require('./conflict-detector');
    const conflicts = detectConflicts(evidence);
    if (conflicts.length > 0) {
      formatted += formatConflictsForPrompt(conflicts);
    }
  } catch (error: any) {
    console.error('❌ Conflict detection failed:', error.message);
    console.error('Continuing without conflict detection (graceful degradation)');
    // Continue without conflict detection - backward compatible
  }

  // Additional Medical Sources (from real-time search - sources like Mayo Clinic, CDC, WHO, etc.)
  if (evidence.tavilyResult && evidence.tavilyResult.answer) {
    formatted += formatTavilyForPrompt(evidence.tavilyResult);
  }

  // FIXED: Tavily Citations with Full Content (High-Quality Fallback Sources)
  if (evidence.tavilyCitations && evidence.tavilyCitations.length > 0) {
    formatted += "## ZONE 0B: TAVILY MEDICAL CITATIONS (Trusted Sources)\n";
    formatted += "**High-quality medical sources from trusted domains (Mayo Clinic, CDC, WHO, etc.)**\n\n";

    evidence.tavilyCitations.forEach((citation, i) => {
      const metadata = enrichEvidenceMetadata(citation, 'article');

      // Extract source information from URL
      const sourceInfo = extractSourceInfo(citation.url);

      formatted += `${i + 1}. ${citation.title || sourceInfo.title}\n`;
      formatted += `   SOURCE: ${sourceInfo.sourceName}\n`;
      formatted += `   URL: ${citation.url}\n`;

      // CRITICAL FIX: Use full content instead of truncated snippets
      if (citation.content) {
        // Use full content - this is the key fix for better evidence quality
        const fullContent = citation.content.length > 2000
          ? citation.content.substring(0, 2000) + '...'
          : citation.content;
        formatted += `   FULL CONTENT: ${fullContent}\n`;
      }

      if (citation.published_date) formatted += `   Published: ${citation.published_date}\n`;
      if (citation.score) formatted += `   Relevance Score: ${citation.score}\n`;
      formatted += `   Badges: ${formatBadges(metadata)}\n`;
      formatted += `   ⭐ PRIORITY: Trusted medical source - cite with proper attribution to ${sourceInfo.sourceName}\n`;
      formatted += `\n`;
    });
  }

  // Clinical Guidelines (highest priority - authoritative recommendations)
  if (evidence.guidelines.length > 0) {
    formatted += "## ZONE 1: CLINICAL PRACTICE GUIDELINES (Authoritative)\n";
    evidence.guidelines.forEach((guideline, i) => {
      const metadata = enrichEvidenceMetadata(guideline, 'guideline', true);

      // CRITICAL ENHANCEMENT: Extract recommendation strength and stepwise protocols
      const strengthInfo = extractRecommendationStrength(
        guideline.summary || guideline.title,
        guideline.title,
        guideline.source
      );

      const hasStepwiseProtocol = detectStepwiseProtocol(guideline.summary || '');
      const stepwiseSteps = hasStepwiseProtocol ? extractStepwiseProtocol(guideline.summary || '') : [];

      formatted += `${i + 1}. ${guideline.title}\n`;
      formatted += `   SOURCE: ${guideline.source} | Type: ${guideline.type}\n`;
      formatted += `   Authors: ${guideline.authors}\n`;
      formatted += `   Journal: ${guideline.journal} (${guideline.year})\n`;

      // CRITICAL FIX: Add explicit recommendation strength
      const strengthDisplay = formatRecommendationStrength(strengthInfo);
      if (strengthDisplay) {
        formatted += `   🎯 RECOMMENDATION STRENGTH: ${strengthDisplay}\n`;
      }

      formatted += `   Summary: ${guideline.summary}\n`;

      // CRITICAL FIX: Add stepwise protocol if detected
      if (stepwiseSteps.length > 0) {
        formatted += `   📋 STEPWISE PROTOCOL DETECTED:\n`;
        stepwiseSteps.forEach((step, idx) => {
          formatted += `      ${idx + 1}. ${step.trim()}\n`;
        });
      }

      formatted += `   URL: ${guideline.url}\n`;
      formatted += `   Badges: ${formatBadges(metadata)}\n`;
      formatted += `   ⭐ PRIORITY: Use these evidence-based guidelines as the foundation for clinical recommendations.\n`;

      // CRITICAL INSTRUCTION: Emphasize citing recommendation strength
      if (strengthDisplay) {
        formatted += `   🚨 MUST CITE: Include recommendation strength "${strengthDisplay}" when citing this guideline.\n`;
      }

      formatted += `\n`;
    });
  }

  // Landmark Trials (curated high-impact trials)
  if (evidence.landmarkTrials && evidence.landmarkTrials.length > 0) {
    formatted += formatLandmarkTrialsForPrompt(evidence.landmarkTrials);
  }

  // PubMed Guidelines (from authoritative sources like JAMA, Lancet, Circulation)
  if (evidence.pubmedGuidelines && evidence.pubmedGuidelines.length > 0) {
    formatted += "## ZONE 1B: PUBMED CLINICAL GUIDELINES & POSITION STATEMENTS\n";
    formatted += "**Guidelines from major medical journals and organizations**\n\n";
    evidence.pubmedGuidelines.forEach((article, i) => {
      const metadata = enrichEvidenceMetadata(article, 'guideline');

      // CRITICAL ENHANCEMENT: Extract recommendation strength from abstract
      const strengthInfo = extractRecommendationStrength(
        article.abstract || article.title,
        article.title,
        article.journal
      );

      const hasStepwiseProtocol = detectStepwiseProtocol(article.abstract || '');
      const stepwiseSteps = hasStepwiseProtocol ? extractStepwiseProtocol(article.abstract || '') : [];

      formatted += `${i + 1}. ${article.title}\n`;
      formatted += `   SOURCE: PubMed | PMID: ${article.pmid}\n`;
      formatted += `   Authors: ${article.authors.slice(0, 3).join(", ")}${article.authors.length > 3 ? " et al." : ""}\n`;
      formatted += `   Journal: ${article.journal} (${article.publicationDate})\n`;

      // CRITICAL FIX: Add explicit recommendation strength
      const strengthDisplay = formatRecommendationStrength(strengthInfo);
      if (strengthDisplay) {
        formatted += `   🎯 RECOMMENDATION STRENGTH: ${strengthDisplay}\n`;
      }

      if (article.abstract) formatted += `   Abstract: ${article.abstract}\n`;
      if (article.publicationType && article.publicationType.length > 0) {
        formatted += `   Type: ${article.publicationType.join(", ")}\n`;
      }

      // CRITICAL FIX: Add stepwise protocol if detected
      if (stepwiseSteps.length > 0) {
        formatted += `   📋 STEPWISE PROTOCOL DETECTED:\n`;
        stepwiseSteps.forEach((step, idx) => {
          formatted += `      ${idx + 1}. ${step.trim()}\n`;
        });
      }

      if (article.doi) formatted += `   DOI: ${article.doi}\n`;
      formatted += `   Badges: ${formatBadges(metadata)}\n`;
      formatted += `   ⭐ PRIORITY: Authoritative guideline - cite this for evidence-based recommendations.\n`;

      // CRITICAL INSTRUCTION: Emphasize citing recommendation strength
      if (strengthDisplay) {
        formatted += `   🚨 MUST CITE: Include recommendation strength "${strengthDisplay}" when citing this guideline.\n`;
      }

      formatted += `\n`;
    });
  }

  // Cochrane Reviews (gold standard systematic reviews)
  if (evidence.cochraneRecent.length > 0 || evidence.cochraneReviews.length > 0) {
    formatted += "## ZONE 2: COCHRANE SYSTEMATIC REVIEWS (Gold Standard)\n";
    formatted += "⭐⭐⭐ **HIGHEST PRIORITY**: Cochrane reviews are the gold standard for systematic reviews.\n";
    formatted += "⭐⭐⭐ **MANDATORY**: If a Cochrane review exists for this topic, YOU MUST CITE IT in your response.\n";
    formatted += "⭐⭐⭐ Cochrane reviews should be prioritized over individual RCTs or observational studies.\n\n";
    if (evidence.cochraneRecent.length > 0) {
      formatted += "**Recent Cochrane Reviews (Last 2 Years):**\n";
      evidence.cochraneRecent.forEach((review, i) => {
        const metadata = enrichEvidenceMetadata(review, 'review');
        formatted += `${i + 1}. ${review.title}\n`;
        formatted += `   SOURCE: Cochrane Library | PMID: ${review.pmid}\n`;
        formatted += `   Authors: ${review.authors.slice(0, 3).join(", ")}${review.authors.length > 3 ? " et al." : ""}\n`;
        formatted += `   Published: ${review.publicationDate}\n`;
        if (review.abstract) formatted += `   Abstract: ${review.abstract}\n`;
        if (review.doi) formatted += `   DOI: ${review.doi}\n`;
        formatted += `   Badges: ${formatBadges(metadata)}\n`;
        formatted += "\n";
      });
    }
    if (evidence.cochraneReviews.length > 0) {
      formatted += "**All Cochrane Reviews:**\n";
      evidence.cochraneReviews.forEach((review, i) => {
        const metadata = enrichEvidenceMetadata(review, 'review');
        formatted += `${i + 1}. ${review.title}\n`;
        formatted += `   SOURCE: Cochrane Library | PMID: ${review.pmid}\n`;
        formatted += `   Authors: ${review.authors.slice(0, 3).join(", ")}${review.authors.length > 3 ? " et al." : ""}\n`;
        formatted += `   Published: ${review.publicationDate}\n`;
        if (review.doi) formatted += `   DOI: ${review.doi}\n`;
        formatted += `   Badges: ${formatBadges(metadata)}\n`;
        formatted += "\n";
      });
    }
  }

  // PMC Systematic Reviews (full-text access)
  if (evidence.pmcReviews.length > 0) {
    formatted += "## ZONE 3: PMC SYSTEMATIC REVIEWS (Full-Text Access)\n";
    evidence.pmcReviews.forEach((article, i) => {
      formatted += `${i + 1}. ${article.title}\n`;
      formatted += `   SOURCE: PMC | PMCID: ${article.pmcId}`;
      if (article.articleIds?.pmid) formatted += ` | PMID: ${article.articleIds.pmid}`;
      formatted += "\n";
      formatted += `   Authors: ${article.authors?.slice(0, 3).join(", ") || "N/A"}${(article.authors?.length || 0) > 3 ? " et al." : ""}\n`;
      formatted += `   Journal: ${article.journal} (${article.pubDate})\n`;
      if (article.articleIds?.doi) formatted += `   DOI: ${article.articleIds.doi}\n`;
      formatted += "\n";
    });
  }

  // PubMed Systematic Reviews (highest priority - from PubMed)
  if (evidence.pubmedReviews.length > 0) {
    formatted += "## ZONE 4: PUBMED SYSTEMATIC REVIEWS & META-ANALYSES\n";
    evidence.pubmedReviews.forEach((article, i) => {
      const metadata = enrichEvidenceMetadata(article, 'review');
      formatted += `${i + 1}. ${article.title}\n`;
      formatted += `   SOURCE: PubMed | PMID: ${article.pmid}\n`;
      formatted += `   Authors: ${article.authors.slice(0, 3).join(", ")}${article.authors.length > 3 ? " et al." : ""}\n`;
      formatted += `   Journal: ${article.journal} (${article.publicationDate})\n`;
      if (article.abstract) formatted += `   Abstract: ${article.abstract}\n`;
      if (article.meshTerms) formatted += `   MeSH: ${article.meshTerms.join(", ")}\n`;
      if (article.doi) formatted += `   DOI: ${article.doi}\n`;
      formatted += `   Badges: ${formatBadges(metadata)}\n`;
      formatted += "\n";
    });
  }

  // OpenAlex Systematic Reviews (supplementary)
  if (evidence.systematicReviews.length > 0) {
    formatted += "## ZONE 5: OPENALEX SYSTEMATIC REVIEWS\n";
    evidence.systematicReviews.forEach((work, i) => {
      formatted += `${i + 1}. ${work.title}\n`;
      formatted += `   SOURCE: OpenAlex | Citations: ${work.citationCount}\n`;
      formatted += `   Authors: ${work.authors.join(", ")}\n`;
      formatted += `   Journal: ${work.journal} (${work.publicationYear})\n`;
      if (work.abstract) formatted += `   Abstract: ${work.abstract}\n`;
      formatted += "\n";
    });
  }

  // Clinical Trials
  if (evidence.clinicalTrials.length > 0) {
    formatted += "## ZONE 6: CLINICAL TRIALS (ClinicalTrials.gov)\n";
    evidence.clinicalTrials.forEach((trial, i) => {
      const metadata = enrichEvidenceMetadata(trial, 'trial');
      formatted += `${i + 1}. ${trial.briefTitle}\n`;
      formatted += `   SOURCE: ClinicalTrials.gov | NCT ID: ${trial.nctId}\n`;
      formatted += `   Status: ${trial.overallStatus} | Phase: ${trial.phases.join(", ") || "N/A"}\n`;
      formatted += `   Study Type: ${trial.studyType} | Has Results: ${trial.hasResults ? "Yes" : "No"}\n`;
      formatted += `   Conditions: ${trial.conditions.slice(0, 3).join(", ")}${trial.conditions.length > 3 ? "..." : ""}\n`;
      formatted += `   Interventions: ${trial.interventions.slice(0, 3).join(", ")}${trial.interventions.length > 3 ? "..." : ""}\n`;
      if (trial.enrollment) formatted += `   Enrollment: ${trial.enrollment} participants\n`;
      if (trial.leadSponsor) formatted += `   Sponsor: ${trial.leadSponsor}\n`;
      if (trial.briefSummary) formatted += `   Summary: ${trial.briefSummary.substring(0, 200)}...\n`;
      formatted += `   Badges: ${formatBadges(metadata)}\n`;
      formatted += "\n";
    });
  }

  // Drug Labels (FDA)
  if (evidence.drugLabels.length > 0) {
    formatted += "## ZONE 7: FDA DRUG LABELS (OpenFDA)\n";
    evidence.drugLabels.forEach((label, i) => {
      formatted += `${i + 1}. ${label.brandName} (${label.genericName})\n`;
      formatted += `   SOURCE: FDA/OpenFDA\n`;
      if (label.contraindications) formatted += `   Contraindications: ${label.contraindications.substring(0, 200)}...\n`;
      if (label.warnings) formatted += `   Warnings: ${label.warnings.substring(0, 200)}...\n`;
      formatted += "\n";
    });
  }

  // DailyMed FDA Drug Labels
  if (evidence.dailyMedDrugs.length > 0) {
    formatted += "## ZONE 8: DAILYMED DRUG INFORMATION (Official FDA Labels)\n";
    evidence.dailyMedDrugs.forEach((drug, i) => {
      formatted += `${i + 1}. ${drug.title}\n`;
      formatted += `   SOURCE: DailyMed (NLM) | SetID: ${drug.setId}\n`;
      if (drug.genericName) formatted += `   Generic: ${drug.genericName}\n`;
      if (drug.brandName) formatted += `   Brand: ${drug.brandName}\n`;
      if (drug.manufacturer) formatted += `   Manufacturer: ${drug.manufacturer}\n`;
      if (drug.dosageForm) formatted += `   Form: ${drug.dosageForm} | Route: ${drug.route || 'N/A'}\n`;
      formatted += `   URL: https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${drug.setId}\n\n`;
    });
  }

  // Adverse Events
  if (evidence.adverseEvents.length > 0) {
    formatted += "## ZONE 9: ADVERSE EVENTS (FDA FAERS Database)\n";
    evidence.adverseEvents.slice(0, 5).forEach((event, i) => {
      formatted += `${i + 1}. ${event.reaction} - ${event.count} reports\n`;
      formatted += `   SOURCE: FDA FAERS\n`;
    });
    formatted += "\n";
  }

  // PMC Full-Text Articles (recent and general) - PRIORITY: OPEN ACCESS
  if (evidence.pmcRecentArticles.length > 0 || evidence.pmcArticles.length > 0) {
    formatted += "## ZONE 10: PMC FULL-TEXT ARTICLES (FREE ACCESS)\n";
    formatted += "🔓 **PRIORITY SOURCES**: These are FREE and fully accessible to users\n";
    formatted += "🔗 **CITATION FORMAT**: Use [ARTICLE_TITLE](URL) - NOT author names!\n\n";
    if (evidence.pmcRecentArticles.length > 0) {
      formatted += "**Recent PMC Articles:**\n";
      evidence.pmcRecentArticles.slice(0, 3).forEach((article, i) => {
        const pmcUrl = `https://pmc.ncbi.nlm.nih.gov/articles/${article.pmcId}`;
        formatted += `${i + 1}. ARTICLE_TITLE: "${article.title}"\n`;
        formatted += `   READY-TO-CITE: [${article.title}](${pmcUrl})\n`;
        formatted += `   SOURCE: PMC | PMCID: ${article.pmcId}`;
        if (article.articleIds?.pmid) formatted += ` | PMID: ${article.articleIds.pmid}`;
        formatted += "\n";
        formatted += `   AUTHORS: ${article.authors?.slice(0, 2).join(", ") || "N/A"}${(article.authors?.length || 0) > 2 ? " et al." : ""}\n`;
        formatted += `   JOURNAL: ${article.journal} (${article.pubDate})\n`;
        if (article.articleIds?.doi) formatted += `   DOI: ${article.articleIds.doi}\n`;
        formatted += "\n";
      });
    }
    if (evidence.pmcArticles.length > 0) {
      formatted += "**General PMC Articles:**\n";
      evidence.pmcArticles.slice(0, 3).forEach((article, i) => {
        const pmcUrl = `https://pmc.ncbi.nlm.nih.gov/articles/${article.pmcId}`;
        formatted += `${i + 1}. ARTICLE_TITLE: "${article.title}"\n`;
        formatted += `   READY-TO-CITE: [${article.title}](${pmcUrl})\n`;
        formatted += `   SOURCE: PMC | PMCID: ${article.pmcId}`;
        if (article.articleIds?.pmid) formatted += ` | PMID: ${article.articleIds.pmid}`;
        formatted += "\n";
        formatted += `   JOURNAL: ${article.journal} (${article.pubDate})\n`;
        if (article.articleIds?.doi) formatted += `   DOI: ${article.articleIds.doi}\n`;
        formatted += "\n";
      });
    }
  }

  // PubMed Articles (peer-reviewed, indexed)
  if (evidence.pubmedArticles.length > 0) {
    formatted += "## ZONE 11: PUBMED LITERATURE (Peer-Reviewed)\n";
    formatted += "🔗 **CRITICAL: ALL ITEMS BELOW HAVE CLICKABLE LINKS**\n\n";
    evidence.pubmedArticles.slice(0, 5).forEach((article, i) => {
      const metadata = enrichEvidenceMetadata(article, 'article');
      const pubmedUrl = `https://pubmed.ncbi.nlm.nih.gov/${article.pmid}`;
      formatted += `${i + 1}. **TITLE**: ${article.title}\n`;
      formatted += `   **CLICKABLE_LINK**: [${article.title}](${pubmedUrl})\n`;
      formatted += `   **SOURCE**: PubMed\n`;
      formatted += `   **PMID**: ${article.pmid}\n`;
      formatted += `   **AUTHORS**: ${article.authors.slice(0, 2).join(", ")}${article.authors.length > 2 ? " et al." : ""}\n`;
      formatted += `   **JOURNAL**: ${article.journal} (${article.publicationDate})\n`;
      if (article.doi) formatted += `   **DOI**: ${article.doi}\n`;
      formatted += `   **BADGES**: ${formatBadges(metadata)}\n`;
      formatted += `   **REFERENCE_FORMAT**: [${article.title}](${pubmedUrl})\n`;
      formatted += "\n";
    });
  }

  // OpenAlex Literature (supplementary)
  if (evidence.literature.length > 0) {
    formatted += "## ZONE 12: OPENALEX LITERATURE\n";
    evidence.literature.slice(0, 3).forEach((work, i) => {
      formatted += `${i + 1}. ${work.title}\n`;
      formatted += `   SOURCE: OpenAlex | Citations: ${work.citationCount}\n`;
      formatted += `   Authors: ${work.authors.slice(0, 2).join(", ")}${work.authors.length > 2 ? " et al." : ""}\n`;
      formatted += `   Journal: ${work.journal} (${work.publicationYear})\n`;
      formatted += "\n";
    });
  }

  // Europe PMC Recent Articles
  if (evidence.europePMCRecent.length > 0) {
    formatted += "## ZONE 13: EUROPE PMC RECENT RESEARCH\n";
    evidence.europePMCRecent.slice(0, 3).forEach((article, i) => {
      formatted += `${i + 1}. ${article.title}\n`;
      formatted += `   SOURCE: Europe PMC`;
      if (article.pmid) formatted += ` | PMID: ${article.pmid}`;
      if (article.doi) formatted += ` | DOI: ${article.doi}`;
      formatted += "\n";
      if (article.authorString) formatted += `   Authors: ${article.authorString}\n`;
      if (article.journalTitle) formatted += `   Journal: ${article.journalTitle} (${article.pubYear})\n`;
      formatted += "\n";
    });
  }

  // Europe PMC Highly Cited
  if (evidence.europePMCCited.length > 0) {
    formatted += "## ZONE 14: HIGHLY CITED RESEARCH (Europe PMC)\n";
    evidence.europePMCCited.slice(0, 3).forEach((article, i) => {
      formatted += `${i + 1}. ${article.title}\n`;
      formatted += `   SOURCE: Europe PMC | Citations: ${article.citedByCount || 0}`;
      if (article.pmid) formatted += ` | PMID: ${article.pmid}`;
      if (article.doi) formatted += ` | DOI: ${article.doi}`;
      formatted += "\n";
      if (article.authorString) formatted += `   Authors: ${article.authorString} (${article.pubYear})\n`;
      formatted += "\n";
    });
  }

  // Europe PMC Preprints (cutting-edge, not yet peer-reviewed)
  if (evidence.europePMCPreprints.length > 0) {
    formatted += "## ZONE 15: PREPRINTS (Europe PMC - Not Yet Peer-Reviewed)\n";
    evidence.europePMCPreprints.slice(0, 3).forEach((article, i) => {
      formatted += `${i + 1}. ${article.title}\n`;
      formatted += `   SOURCE: Europe PMC (Preprint)`;
      if (article.doi) formatted += ` | DOI: ${article.doi}`;
      if (article.firstPublicationDate) formatted += ` | Published: ${article.firstPublicationDate}`;
      formatted += "\n";
      if (article.authorString) formatted += `   Authors: ${article.authorString}\n`;
      formatted += "\n";
    });
  }

  // Semantic Scholar Papers
  if (evidence.semanticScholarPapers.length > 0) {
    formatted += "## ZONE 16: SEMANTIC SCHOLAR RESEARCH\n";
    evidence.semanticScholarPapers.slice(0, 3).forEach((paper, i) => {
      formatted += `${i + 1}. ${paper.title}\n`;
      formatted += `   SOURCE: Semantic Scholar | Citations: ${paper.citationCount}`;
      if (paper.doi) formatted += ` | DOI: ${paper.doi}`;
      formatted += "\n";
      formatted += `   Authors: ${paper.authors.slice(0, 2).join(", ")}${paper.authors.length > 2 ? " et al." : ""} (${paper.year})\n`;
      if (paper.journal) formatted += `   Journal: ${paper.journal}\n`;
      formatted += "\n";
    });
  }

  // Semantic Scholar Highly Cited (influential papers)
  if (evidence.semanticScholarHighlyCited.length > 0) {
    formatted += "## ZONE 17: HIGHLY CITED RESEARCH (Semantic Scholar)\n";
    evidence.semanticScholarHighlyCited.slice(0, 3).forEach((paper, i) => {
      formatted += `${i + 1}. ${paper.title}\n`;
      formatted += `   SOURCE: Semantic Scholar (Highly Cited) | Citations: ${paper.citationCount}`;
      if (paper.doi) formatted += ` | DOI: ${paper.doi}`;
      formatted += "\n";
      formatted += `   Authors: ${paper.authors.join(", ")}${paper.authors.length > 3 ? " et al." : ""} (${paper.year})\n`;
      if (paper.journal) formatted += `   Journal: ${paper.journal}\n`;
      formatted += "\n";
    });
  }

  // MedlinePlus Consumer Health Information
  if (evidence.medlinePlus.totalResults > 0) {
    formatted += "## ZONE 18: MEDLINEPLUS CONSUMER HEALTH INFORMATION\n";
    formatted += formatMedlinePlusForPrompt(evidence.medlinePlus);
  }

  // Europe PMC Open Access
  if (evidence.europePMCOpenAccess.length > 0) {
    formatted += "## ZONE 19: OPEN ACCESS ARTICLES (Europe PMC)\n";
    evidence.europePMCOpenAccess.slice(0, 3).forEach((article, i) => {
      formatted += `${i + 1}. ${article.title}\n`;
      formatted += `   SOURCE: Europe PMC (Open Access)`;
      if (article.pmid) formatted += ` | PMID: ${article.pmid}`;
      if (article.doi) formatted += ` | DOI: ${article.doi}`;
      formatted += "\n";
      if (article.authorString) formatted += `   Authors: ${article.authorString} (${article.pubYear})\n`;
      formatted += "\n";
    });
  }

  // American Academy of Pediatrics (AAP) Guidelines - for pediatric queries
  const totalAAP = evidence.aapGuidelines.length + evidence.aapPolicyStatements.length + evidence.aapKeyResources.length;
  if (totalAAP > 0) {
    formatted += formatAAPForPrompt(evidence.aapGuidelines, evidence.aapPolicyStatements, evidence.aapKeyResources);
  }

  // RxNorm Drug Information (NLM standardized nomenclature)
  const totalRxNorm = evidence.rxnormDrugs.length + evidence.rxnormInteractions.length;
  if (totalRxNorm > 0) {
    formatted += formatRxNormForPrompt({
      drugs: evidence.rxnormDrugs,
      classes: evidence.rxnormClasses,
      interactions: evidence.rxnormInteractions,
      prescribable: evidence.rxnormPrescribable
    });
  }

  // WHO Guidelines (World Health Organization)
  if (evidence.whoGuidelines && evidence.whoGuidelines.length > 0) {
    formatted += formatWHOGuidelinesForPrompt(evidence.whoGuidelines);
  }

  // CDC Guidelines (Centers for Disease Control)
  if (evidence.cdcGuidelines && evidence.cdcGuidelines.length > 0) {
    formatted += formatCDCGuidelinesForPrompt(evidence.cdcGuidelines);
  }

  // NICE Guidelines (UK National Institute for Health and Care Excellence)
  if (evidence.niceGuidelines && evidence.niceGuidelines.length > 0) {
    formatted += formatNICEGuidelinesForPrompt(evidence.niceGuidelines);
  }

  // BMJ Best Practice (Clinical Decision Support)
  if (evidence.bmjBestPractice && evidence.bmjBestPractice.length > 0) {
    formatted += formatBMJBestPracticeForPrompt(evidence.bmjBestPractice);
  }

  // Cardiovascular Guidelines (ACC/AHA, ESC) - Critical for lipid/CV queries
  if (evidence.cardiovascularGuidelines && evidence.cardiovascularGuidelines.length > 0) {
    formatted += formatCardiovascularGuidelinesForPrompt(evidence.cardiovascularGuidelines);

    // If this looks like a guideline comparison query, add the comparison table
    const hasLipidGuidelines = evidence.cardiovascularGuidelines.some(g =>
      g.category === "Lipid Management" || g.ldlTargets
    );
    if (hasLipidGuidelines && evidence.cardiovascularGuidelines.length >= 2) {
      formatted += "\n## ACC/AHA vs ESC GUIDELINE COMPARISON\n";
      formatted += getLDLTargetComparison();
      formatted += "\n";
    }
  }

  // NCBI Books (StatPearls and medical textbooks)
  if (evidence.ncbiBooks && evidence.ncbiBooks.length > 0) {
    formatted += formatNCBIBooksForPrompt(evidence.ncbiBooks);
  }

  // OMIM (Genetic disorders - only if genetic query)
  if (evidence.omimEntries && evidence.omimEntries.length > 0) {
    formatted += formatOMIMForPrompt(evidence.omimEntries);
  }

  // PubChem (Chemical data - fallback for DailyMed)
  if (evidence.pubChemCompounds && evidence.pubChemCompounds.length > 0) {
    formatted += formatPubChemForPrompt(evidence.pubChemCompounds, evidence.pubChemBioAssays || []);
  }

  // Open-i (NLM) Articles - Research, Reviews, Systematic Reviews, Case Reports
  const totalOpenI =
    (evidence.openIResearchArticles?.length || 0) +
    (evidence.openIReviewArticles?.length || 0) +
    (evidence.openISystematicReviews?.length || 0) +
    (evidence.openICaseReports?.length || 0);

  if (totalOpenI > 0) {
    const { formatOpenIArticlesForPrompt } = await import('../open-i-client');
    formatted += formatOpenIArticlesForPrompt({
      researchArticles: evidence.openIResearchArticles || [],
      reviewArticles: evidence.openIReviewArticles || [],
      systematicReviews: evidence.openISystematicReviews || [],
      caseReports: evidence.openICaseReports || []
    });
  }

  formatted += "--- END EVIDENCE ---\n\n";
  formatted += `**CRITICAL INSTRUCTIONS FOR USING THIS EVIDENCE:**

1. **SYNTHESIZE, DON'T COPY**: Read all the evidence above and create a coherent, flowing answer in your own words. Do NOT list every study or copy abstracts verbatim.

2. **WRITE LIKE AN EXPERT**: Imagine you're a senior clinician explaining this topic to a colleague. Use clear, professional prose with well-structured paragraphs.

3. **CITE WITH SOURCE INFORMATION**: When creating references, ALWAYS include:
   - The SOURCE database (PubMed, Cochrane, Europe PMC, Semantic Scholar, ClinicalTrials.gov, etc.)
   - PMID if available (e.g., PMID:12345678)
   - DOI if available (e.g., doi:10.xxxx/xxxxx)
   - This allows proper linking and verification

4. **USE DIVERSE SOURCES**: The evidence comes from 19+ databases. Use evidence from MULTIPLE sources, not just PubMed:
   - Cochrane Library for systematic reviews (gold standard)
   - ClinicalTrials.gov for trial data
   - Europe PMC for European research
   - Semantic Scholar for highly cited papers
   - DailyMed/FDA for drug information
   - MedlinePlus for patient education

5. **PRIORITIZE INTERNAL EVIDENCE BRAIN**: Our 20+ databases are comprehensive. Use them in this order:
   - **Tier 1**: Anchor Guidelines + Landmark Trials (pre-curated for this exact scenario)
   - **Tier 2**: Clinical Guidelines (ACC/AHA, ESC, NICE, WHO, CDC, AAP)
   - **Tier 3**: Systematic Reviews (Cochrane, PubMed, PMC, OpenAlex)
   - **Tier 4**: Clinical Trials (ClinicalTrials.gov, Landmark Trials)
   - **Tier 5**: Primary Literature (PubMed, Europe PMC, Semantic Scholar)
   - **Tier 6**: Drug Information (DailyMed, FDA, RxNorm)
   - **Last Resort**: Tavily (only if internal evidence insufficient)

6. **REFERENCE FORMAT**: In your References section, format as:
   Author et al. Title. Journal. Year. SOURCE: [Database] | PMID:xxxxx or DOI:10.xxxx/xxxxx

Remember: You are a clinical expert synthesizing evidence from MULTIPLE databases, not just PubMed!\n\n`;

  // CRITICAL: Scan for and warn about Google search URLs in the formatted text
  try {
    const { isGoogleSearchURL } = await import('./reference-formatter');
    const googleURLPattern = /https?:\/\/[^\s\)]+/g;
    const urls = formatted.match(googleURLPattern) || [];
    const googleURLs = urls.filter(url => isGoogleSearchURL(url));

    if (googleURLs.length > 0) {
      console.warn(`⚠️  WARNING: Found ${googleURLs.length} Google search URLs in formatted evidence:`);
      googleURLs.forEach(url => console.warn(`   - ${url}`));
      console.warn(`⚠️  These URLs should be replaced with direct article links (PMID/PMC/DOI)`);

      // Add critical warning to the formatted output
      formatted += `\n\n⚠️  **CRITICAL URL WARNING FOR AI**: ${googleURLs.length} Google search URLs detected.\n`;
      formatted += `**MANDATORY ACTION**: You MUST NOT use these Google search URLs in your references.\n`;
      formatted += `For each Google URL, you MUST:\n`;
      formatted += `1. Find the actual PMID from the evidence above\n`;
      formatted += `2. Use https://pubmed.ncbi.nlm.nih.gov/[PMID] format\n`;
      formatted += `3. If no PMID exists, use the DOI: https://doi.org/[DOI]\n`;
      formatted += `4. If neither exists, DO NOT cite that reference\n\n`;
      formatted += `**Google URLs to AVOID**:\n`;
      googleURLs.forEach(url => {
        formatted += `❌ ${url}\n`;
      });
      formatted += `\n**Remember**: Every reference MUST have a direct article link (PMID/PMC/DOI), never a search URL.\n\n`;
    } else {
      console.log('✅ No Google search URLs detected in formatted evidence');
    }
  } catch (error: any) {
    console.error('Error checking for Google URLs:', error.message);
  }

  return formatted;
}
