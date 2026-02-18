/**
 * Evidence Quality Scoring System
 * Assigns confidence scores to evidence based on multiple factors
 */

export interface EvidenceScore {
  overall: number; // 0-100
  studyDesign: number; // 0-100
  sampleSize: number; // 0-100
  recency: number; // 0-100
  citations: number; // 0-100
  level: "high" | "moderate" | "low" | "very-low";
  reasoning: string[];
}

/**
 * Study design hierarchy scores
 */
const STUDY_DESIGN_SCORES: Record<string, number> = {
  // Highest quality
  "systematic review": 100,
  "meta-analysis": 100,
  "guideline": 95,
  "consensus statement": 90,

  // High quality
  "randomized controlled trial": 85,
  "rct": 85,
  "double-blind": 85,

  // Moderate quality
  "cohort study": 70,
  "prospective": 70,
  "case-control": 65,

  // Lower quality
  "cross-sectional": 50,
  "case series": 40,
  "case report": 30,

  // Lowest quality
  "expert opinion": 20,
  "editorial": 15,
  "commentary": 10,
};

/**
 * Score based on study design/publication type
 */
function scoreStudyDesign(publicationType: string[]): { score: number; reasoning: string } {
  let maxScore = 0;
  let matchedType = "unknown";

  const typesLower = publicationType.map(t => t.toLowerCase());

  for (const [design, score] of Object.entries(STUDY_DESIGN_SCORES)) {
    if (typesLower.some(t => t.includes(design))) {
      if (score > maxScore) {
        maxScore = score;
        matchedType = design;
      }
    }
  }

  // Default score for unknown types
  if (maxScore === 0) {
    maxScore = 50;
    matchedType = "standard research article";
  }

  return {
    score: maxScore,
    reasoning: `Study design: ${matchedType} (${maxScore}/100)`,
  };
}

/**
 * Score based on sample size (for clinical trials)
 */
function scoreSampleSize(enrollment?: number): { score: number; reasoning: string } {
  if (!enrollment) {
    return { score: 50, reasoning: "Sample size not specified" };
  }

  let score = 0;
  let category = "";

  if (enrollment >= 10000) {
    score = 100;
    category = "very large";
  } else if (enrollment >= 1000) {
    score = 90;
    category = "large";
  } else if (enrollment >= 500) {
    score = 80;
    category = "moderate-large";
  } else if (enrollment >= 100) {
    score = 70;
    category = "moderate";
  } else if (enrollment >= 50) {
    score = 60;
    category = "small-moderate";
  } else {
    score = 40;
    category = "small";
  }

  return {
    score,
    reasoning: `Sample size: ${enrollment} participants (${category}, ${score}/100)`,
  };
}

/**
 * Score based on recency (publication year)
 */
function scoreRecency(year?: string | number): { score: number; reasoning: string } {
  if (!year) {
    return { score: 50, reasoning: "Publication year not specified" };
  }

  const pubYear = typeof year === "string" ? parseInt(year) : year;
  const currentYear = new Date().getFullYear();
  const age = currentYear - pubYear;

  let score = 0;
  let category = "";

  if (age <= 1) {
    score = 100;
    category = "very recent";
  } else if (age <= 3) {
    score = 90;
    category = "recent";
  } else if (age <= 5) {
    score = 80;
    category = "fairly recent";
  } else if (age <= 10) {
    score = 60;
    category = "moderately dated";
  } else if (age <= 15) {
    score = 40;
    category = "dated";
  } else {
    score = 20;
    category = "old";
  }

  return {
    score,
    reasoning: `Published ${pubYear} (${age} years ago, ${category}, ${score}/100)`,
  };
}

/**
 * Score based on citation count
 */
function scoreCitations(citationCount?: number): { score: number; reasoning: string } {
  if (!citationCount) {
    return { score: 50, reasoning: "Citation count not available" };
  }

  let score = 0;
  let category = "";

  if (citationCount >= 1000) {
    score = 100;
    category = "highly influential";
  } else if (citationCount >= 500) {
    score = 95;
    category = "very influential";
  } else if (citationCount >= 100) {
    score = 85;
    category = "influential";
  } else if (citationCount >= 50) {
    score = 75;
    category = "well-cited";
  } else if (citationCount >= 10) {
    score = 60;
    category = "moderately cited";
  } else if (citationCount >= 1) {
    score = 40;
    category = "minimally cited";
  } else {
    score = 20;
    category = "not yet cited";
  }

  return {
    score,
    reasoning: `${citationCount} citations (${category}, ${score}/100)`,
  };
}

/**
 * Calculate overall evidence quality score
 */
export function scoreEvidence(evidence: {
  publicationType?: string[];
  enrollment?: number;
  publicationYear?: string | number;
  citationCount?: number;
}): EvidenceScore {
  const designScore = scoreStudyDesign(evidence.publicationType || []);
  const sizeScore = scoreSampleSize(evidence.enrollment);
  const recencyScore = scoreRecency(evidence.publicationYear);
  const citationScore = scoreCitations(evidence.citationCount);

  // Weighted average: design (40%), citations (25%), recency (20%), size (15%)
  const overall = Math.round(
    designScore.score * 0.4 +
    citationScore.score * 0.25 +
    recencyScore.score * 0.2 +
    sizeScore.score * 0.15
  );

  // Determine quality level
  let level: "high" | "moderate" | "low" | "very-low";
  if (overall >= 80) {
    level = "high";
  } else if (overall >= 60) {
    level = "moderate";
  } else if (overall >= 40) {
    level = "low";
  } else {
    level = "very-low";
  }

  return {
    overall,
    studyDesign: designScore.score,
    sampleSize: sizeScore.score,
    recency: recencyScore.score,
    citations: citationScore.score,
    level,
    reasoning: [
      designScore.reasoning,
      sizeScore.reasoning,
      recencyScore.reasoning,
      citationScore.reasoning,
    ],
  };
}

/**
 * Format quality score for display
 */
export function formatQualityScore(score: EvidenceScore): string {
  const levelEmoji = {
    "high": "🟢",
    "moderate": "🟡",
    "low": "🟠",
    "very-low": "🔴",
  };

  return `${levelEmoji[score.level]} Quality: ${score.level.toUpperCase()} (${score.overall}/100)`;
}

/**
 * Get quality badge color
 */
export function getQualityBadgeColor(level: string): string {
  switch (level) {
    case "high":
      return "bg-green-100 text-green-800 border-green-200";
    case "moderate":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "low":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "very-low":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

/**
 * Helper to generate badges based on quality score
 */
export function getQualityBadges(score: EvidenceScore): string[] {
  const badges: string[] = [];

  if (score.level === 'high') {
    badges.push("High Quality");
  }

  if (score.citations >= 85) { // Influential or higher
    badges.push("Highly Cited");
  }

  return badges;
}
