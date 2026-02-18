/**
 * Relevance Filter - Removes off-topic evidence before prompt injection
 * 
 * CRITICAL FIX: Prevents citing irrelevant papers (e.g., PFO closure for BNP questions)
 * 
 * Strategy:
 * 1. Extract key clinical concepts from query (disease, biomarker, intervention)
 * 2. Score each evidence item for relevance
 * 3. Filter out low-relevance items (< 30% match)
 */

import { PubMedArticle } from './pubmed';
import { CochraneReview } from './cochrane';
import { PMCArticle } from './pmc';
import { EuropePMCArticle } from './europepmc';
import {
  extractDiseaseTags,
  extractDecisionTags,
  DISEASE_TAGS,
  DECISION_TAGS
} from './pico-extractor';

interface RelevanceScore {
  score: number; // 0-100
  reason: string;
  shouldInclude: boolean;
}

/**
 * Extract key clinical concepts from query
 * Uses pico-extractor for robust regex-based extraction
 */
function extractClinicalConcepts(query: string): {
  diseases: string[];
  biomarkers: string[];
  interventions: string[];
  outcomes: string[];
} {
  // Use robust regex-based extraction from pico-extractor
  const diseases = extractDiseaseTags(query);
  const decisionTags = extractDecisionTags(query);

  // Interventions are primarily decision tags
  const interventions = decisionTags;

  // Biomarkers (Legacy/Regex fallback)
  // TODO: Move these to pico-extractor DECISION_TAGS eventually
  const biomarkers: string[] = [];
  const biomarkerPatterns = [
    'bnp', 'b-type natriuretic peptide', 'nt-probnp', 'nt-pro-bnp',
    'elevated bnp', 'elevated b-type natriuretic peptide',
    'troponin',
    'd-dimer', 'crp', 'procalcitonin', 'lactate', 'creatinine',
    'hba1c', 'glucose', 'ldl', 'hdl', 'triglycerides'
  ];

  const lowerQuery = query.toLowerCase();
  for (const biomarker of biomarkerPatterns) {
    // Use word boundaries for biomarkers too
    const regex = new RegExp(`\\b${biomarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(lowerQuery)) {
      biomarkers.push(biomarker);
    }
  }

  // Outcomes (Legacy/Regex fallback)
  const outcomes: string[] = [];
  const outcomePatterns = [
    'mortality', 'survival', 'hospitalization', 'readmission',
    'quality of life', 'adverse events', 'bleeding', 'stroke',
    'myocardial infarction', 'death', 'cure', 'remission', 'safety', 'efficacy'
  ];

  for (const outcome of outcomePatterns) {
    const regex = new RegExp(`\\b${outcome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(lowerQuery)) {
      outcomes.push(outcome);
    }
  }

  return { diseases, biomarkers, interventions, outcomes };
}

/**
 * Score relevance of an article to the query
 */
function scoreArticleRelevance(
  article: { title: string; abstract?: string; meshTerms?: string[] },
  concepts: ReturnType<typeof extractClinicalConcepts>
): RelevanceScore {
  const titleLower = article.title.toLowerCase();
  const abstractLower = article.abstract?.toLowerCase() || '';
  const meshLower = article.meshTerms?.map(m => m.toLowerCase()) || [];

  let score = 0;
  const reasons: string[] = [];

  // Check disease match (40 points max)
  let diseaseMatch = 0;
  for (const diseaseTag of concepts.diseases) {
    // Expand tag to patterns for matching against article text
    const patterns = DISEASE_TAGS[diseaseTag] || [diseaseTag.toLowerCase()];

    // Check if any pattern matches title/mesh
    const matchesTitleOrMesh = patterns.some(p => {
      const pLower = p.toLowerCase();
      // For article matching, standard inclusion is usually safer/faster than regex 
      // given we are looking for concepts in long text, 
      // but strictly we should check coverage. 
      // However, article titles are natural language.
      return titleLower.includes(pLower) || meshLower.some(m => m.includes(pLower));
    });

    if (matchesTitleOrMesh) {
      diseaseMatch += 20;
      reasons.push(`Disease match: ${diseaseTag}`);
    } else {
      // Check abstract
      const matchesAbstract = patterns.some(p => abstractLower.includes(p.toLowerCase()));
      if (matchesAbstract) {
        diseaseMatch += 10;
        reasons.push(`Disease in abstract: ${diseaseTag}`);
      }
    }
  }
  score += Math.min(diseaseMatch, 40);

  // Check biomarker match (30 points max)
  let biomarkerMatch = 0;
  for (const biomarker of concepts.biomarkers) {
    // Biomarkers are strings (patterns) here
    if (titleLower.includes(biomarker) || meshLower.some(m => m.includes(biomarker))) {
      biomarkerMatch += 15;
      reasons.push(`Biomarker match: ${biomarker}`);
    } else if (abstractLower.includes(biomarker)) {
      biomarkerMatch += 7;
      reasons.push(`Biomarker in abstract: ${biomarker}`);
    }
  }
  score += Math.min(biomarkerMatch, 30);

  // Check intervention match (20 points max)
  let interventionMatch = 0;
  for (const interventionTag of concepts.interventions) {
    // Interventions are decision tags
    const patterns = DECISION_TAGS[interventionTag] || [interventionTag.toLowerCase()];

    const matchesTitleOrMesh = patterns.some(p => {
      const pLower = p.toLowerCase();
      return titleLower.includes(pLower) || meshLower.some(m => m.includes(pLower));
    });

    if (matchesTitleOrMesh) {
      interventionMatch += 10;
      reasons.push(`Intervention match: ${interventionTag}`);
    } else if (patterns.some(p => abstractLower.includes(p.toLowerCase()))) {
      interventionMatch += 5;
      reasons.push(`Intervention in abstract: ${interventionTag}`);
    }
  }
  score += Math.min(interventionMatch, 20);

  // Check outcome match (10 points max)
  let outcomeMatch = 0;
  for (const outcome of concepts.outcomes) {
    if (titleLower.includes(outcome) || abstractLower.includes(outcome)) {
      outcomeMatch += 5;
      reasons.push(`Outcome match: ${outcome}`);
    }
  }
  score += Math.min(outcomeMatch, 10);

  // Determine if should include (threshold: 30%)
  const shouldInclude = score >= 30;

  return {
    score,
    reason: reasons.join('; ') || 'No concept matches',
    shouldInclude
  };
}

/**
 * Filter PubMed articles by relevance
 */
export function filterRelevantPubMedArticles(
  articles: PubMedArticle[],
  query: string,
  minScore: number = 30
): { filtered: PubMedArticle[]; removed: number; reasons: string[] } {
  const concepts = extractClinicalConcepts(query);
  const filtered: PubMedArticle[] = [];
  const removedReasons: string[] = [];

  for (const article of articles) {
    const relevance = scoreArticleRelevance(article, concepts);

    if (relevance.shouldInclude && relevance.score >= minScore) {
      filtered.push(article);
    } else {
      removedReasons.push(
        `Removed: "${article.title.substring(0, 60)}..." (score: ${relevance.score}/100, reason: ${relevance.reason})`
      );
    }
  }

  return {
    filtered,
    removed: articles.length - filtered.length,
    reasons: removedReasons
  };
}

/**
 * Filter Cochrane reviews by relevance
 */
export function filterRelevantCochraneReviews(
  reviews: CochraneReview[],
  query: string,
  minScore: number = 30
): { filtered: CochraneReview[]; removed: number; reasons: string[] } {
  const concepts = extractClinicalConcepts(query);
  const filtered: CochraneReview[] = [];
  const removedReasons: string[] = [];

  for (const review of reviews) {
    const relevance = scoreArticleRelevance(review, concepts);

    if (relevance.shouldInclude && relevance.score >= minScore) {
      filtered.push(review);
    } else {
      removedReasons.push(
        `Removed: "${review.title.substring(0, 60)}..." (score: ${relevance.score}/100, reason: ${relevance.reason})`
      );
    }
  }

  return {
    filtered,
    removed: reviews.length - filtered.length,
    reasons: removedReasons
  };
}

/**
 * Filter PMC articles by relevance
 */
export function filterRelevantPMCArticles(
  articles: PMCArticle[],
  query: string,
  minScore: number = 30
): { filtered: PMCArticle[]; removed: number; reasons: string[] } {
  const concepts = extractClinicalConcepts(query);
  const filtered: PMCArticle[] = [];
  const removedReasons: string[] = [];

  for (const article of articles) {
    const relevance = scoreArticleRelevance(
      { title: article.title, abstract: undefined, meshTerms: undefined },
      concepts
    );

    if (relevance.shouldInclude && relevance.score >= minScore) {
      filtered.push(article);
    } else {
      removedReasons.push(
        `Removed: "${article.title.substring(0, 60)}..." (score: ${relevance.score}/100, reason: ${relevance.reason})`
      );
    }
  }

  return {
    filtered,
    removed: articles.length - filtered.length,
    reasons: removedReasons
  };
}

/**
 * Filter Europe PMC articles by relevance
 */
export function filterRelevantEuropePMCArticles(
  articles: EuropePMCArticle[],
  query: string,
  minScore: number = 30
): { filtered: EuropePMCArticle[]; removed: number; reasons: string[] } {
  const concepts = extractClinicalConcepts(query);
  const filtered: EuropePMCArticle[] = [];
  const removedReasons: string[] = [];

  for (const article of articles) {
    const relevance = scoreArticleRelevance(
      { title: article.title, abstract: article.abstractText, meshTerms: undefined },
      concepts
    );

    if (relevance.shouldInclude && relevance.score >= minScore) {
      filtered.push(article);
    } else {
      removedReasons.push(
        `Removed: "${article.title.substring(0, 60)}..." (score: ${relevance.score}/100, reason: ${relevance.reason})`
      );
    }
  }

  return {
    filtered,
    removed: articles.length - filtered.length,
    reasons: removedReasons
  };
}
