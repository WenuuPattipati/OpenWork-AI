import { EvidenceScore, scoreEvidence } from './quality-scorer';

export interface EvidenceMetadata {
  tier: number; // 1-6 (Evidence Hierarchy)
  badges: string[]; // e.g., "Anchor Guideline", "Systematic Review", "High Quality"
  is_anchor: boolean;
  quality_score: number;
  source_type: string; // "Guideline", "Review", "RCT", "Study", etc.
  // NEW: Disease and decision tags for relevance filtering
  disease_tags: string[]; // e.g., ["CAP", "pneumonia", "sepsis"]
  decision_tags: string[]; // e.g., ["duration", "iv-to-oral", "anticoagulation"]
}

/**
 * Extract disease tags from title/abstract
 */
function extractDiseaseTags(item: any): string[] {
  const tags: string[] = [];
  const text = `${item.title || ''} ${item.abstract || ''} ${item.summary || ''}`.toLowerCase();
  
  // Disease patterns
  const diseasePatterns: Record<string, string[]> = {
    'CAP': ['community-acquired pneumonia', 'cap ', 'pneumonia'],
    'sepsis': ['sepsis', 'septic shock', 'severe infection'],
    'AF': ['atrial fibrillation', 'afib', ' af '],
    'HF': ['heart failure', 'hfref', 'hfpef', 'cardiac failure'],
    'DAPT': ['dual antiplatelet', 'dapt', 'antiplatelet therapy', 'pci', 'stent'],
    'CKD': ['chronic kidney disease', 'ckd', 'renal failure', 'esrd', 'dialysis'],
    'diabetes': ['diabetes', 'diabetic', 't2d', 'glycemic'],
    'VTE': ['venous thromboembolism', 'pulmonary embolism', 'dvt', 'vte'],
    'stroke': ['stroke', 'cerebrovascular', 'tia'],
    'ACS': ['acute coronary syndrome', 'stemi', 'nstemi', 'myocardial infarction'],
  };
  
  for (const [tag, patterns] of Object.entries(diseasePatterns)) {
    if (patterns.some(p => text.includes(p))) {
      tags.push(tag);
    }
  }
  
  return tags;
}

/**
 * Extract decision tags from title/abstract
 */
function extractDecisionTags(item: any): string[] {
  const tags: string[] = [];
  const text = `${item.title || ''} ${item.abstract || ''} ${item.summary || ''}`.toLowerCase();
  
  // Decision patterns
  const decisionPatterns: Record<string, string[]> = {
    'duration': ['duration', 'how long', 'length of therapy', 'treatment duration'],
    'iv-to-oral': ['iv to oral', 'iv-to-oral', 'oral switch', 'step-down', 'de-escalation'],
    'initial-therapy': ['initial therapy', 'empiric', 'first-line', 'starting treatment'],
    'anticoagulation': ['anticoagulation', 'anticoagulant', 'warfarin', 'doac', 'apixaban', 'rivaroxaban'],
    'dose': ['dosing', 'dose adjustment', 'dose reduction', 'mg bid', 'mg daily'],
    'risk-stratification': ['risk score', 'risk stratification', 'cha2ds2', 'curb-65', 'wells score', 'precise-dapt'],
  };
  
  for (const [tag, patterns] of Object.entries(decisionPatterns)) {
    if (patterns.some(p => text.includes(p))) {
      tags.push(tag);
    }
  }
  
  return tags;
}

/**
 * Enrich evidence item with metadata for the AI prompt
 */
export function enrichEvidenceMetadata(
  item: any,
  type: 'guideline' | 'review' | 'article' | 'trial' | 'drug' | 'other',
  isAnchor: boolean = false
): EvidenceMetadata {
  const badges: string[] = [];
  let tier = 6; // Default to lowest tier
  let sourceType = "Source";

  // 1. Determine Source Type & Tier
  if (isAnchor) {
    tier = 1;
    sourceType = "Anchor Guideline";
    badges.push("Anchor Guideline");
  } else if (type === 'guideline') {
    tier = 1;
    sourceType = "Practice Guideline";
    badges.push("Practice Guideline");
  } else if (type === 'review') {
    tier = 2;
    sourceType = "Systematic Review";
    badges.push("Systematic Review");
    
    // Check for Cochrane
    if (item.journal?.includes("Cochrane") || item.title?.includes("Cochrane")) {
      badges.push("Cochrane");
    }
    // Check for Meta-Analysis
    if (item.title?.toLowerCase().includes("meta-analysis") || item.publicationType?.includes("Meta-Analysis")) {
      badges.push("Meta-Analysis");
    }
  } else if (type === 'trial') {
    tier = 3;
    sourceType = "Clinical Trial";
    badges.push("Clinical Trial");
    
    // Check for RCT
    if (item.studyType?.toLowerCase().includes("randomized") || item.title?.toLowerCase().includes("randomized")) {
      badges.push("RCT");
    }
  } else if (type === 'article') {
    tier = 4;
    sourceType = "Research Study";
    badges.push("Research Study");
  } else if (type === 'drug') {
    tier = 5;
    sourceType = "Drug Label";
    badges.push("Drug Label");
  }

  // 2. Calculate Quality Score
  const evidenceForScoring = {
    publicationType: item.publicationType || (type === 'review' ? ['Systematic Review'] : []),
    enrollment: item.enrollment,
    publicationYear: item.publicationDate || item.year || item.published,
    citationCount: item.citationCount || item.citedByCount,
  };
  
  const quality = scoreEvidence(evidenceForScoring);
  
  // 3. Add Quality Badges
  if (quality.level === 'high') {
    // Only add "High Quality" if it's not already an Anchor or Guideline (to avoid badge clutter)
    if (tier > 1) {
      badges.push("High Quality");
    }
  }
  
  // Check for High Impact Journals (but don't add badge if journal name is already shown)
  // The journal name appears in the red badge, so we don't need to repeat it
  const highImpactJournals = [
    "New England Journal of Medicine", "NEJM",
    "Lancet",
    "JAMA", "Journal of the American Medical Association",
    "BMJ", "British Medical Journal",
    "Nature",
    "Science",
    "Circulation",
    "European Heart Journal",
    "Annals of Internal Medicine"
  ];
  
  const journalName = item.journal || item.source || "";
  const isHighImpact = highImpactJournals.some(j => journalName.includes(j));
  
  // Don't add High-Impact badge since journal name is already shown in the red badge
  // This prevents redundancy like "New England Journal of Medicine" + "High-Impact Journal"
  // The journal name itself indicates high impact
  
  // Check for Recency (<= 3 years)
  const yearStr = item.publicationDate || item.year || item.published || "";
  const yearMatch = yearStr.toString().match(/\d{4}/);
  if (yearMatch) {
    const year = parseInt(yearMatch[0]);
    const currentYear = new Date().getFullYear();
    if (currentYear - year <= 3) {
      badges.push("Recent (≤3y)");
    }
  }

  // Limit badges to 3 max to prevent clutter
  // Priority: Anchor/Guideline > Cochrane/RCT > High-Impact > Recent > Quality
  const prioritizedBadges = badges.slice(0, 3);

  // Extract disease and decision tags
  const disease_tags = extractDiseaseTags(item);
  const decision_tags = extractDecisionTags(item);

  return {
    tier,
    badges: prioritizedBadges,
    is_anchor: isAnchor,
    quality_score: quality.overall,
    source_type: sourceType,
    disease_tags,
    decision_tags
  };
}

/**
 * Format badges for display in the prompt
 * Output format: "[Badge 1] - [Badge 2] - [Badge 3]"
 */
export function formatBadges(metadata: EvidenceMetadata): string {
  if (metadata.badges.length === 0) return "";
  return metadata.badges.join(" - ");
}
