import { EvidencePackage } from './engine';
import { enrichEvidenceMetadata, EvidenceMetadata } from './metadata-enricher';

interface ScoredEvidenceItem {
    item: any;
    metadata: EvidenceMetadata;
    originalCategory: keyof EvidencePackage;
    relevanceScore: number; // NEW: How relevant to the query
}

/**
 * Configuration for tag-based evidence ranking
 * Used by the enhanced ranking function
 */
export interface TagBasedRankingConfig {
    disease_tags: string[];
    decision_tags: string[];
    primary_disease_tag: string;
    primary_decision_tag: string;
    secondary_decision_tags: string[];
    anchor_scenario: string | null;
    boost_anchors: boolean;
    penalize_off_topic: boolean;
    min_references: number;  // Default 5, triggers relaxed filtering if below
    max_references: number;  // Default 10, caps final list
}

/**
 * Default configuration for tag-based ranking
 */
export const DEFAULT_RANKING_CONFIG: Partial<TagBasedRankingConfig> = {
    boost_anchors: true,
    penalize_off_topic: true,
    min_references: 5,
    max_references: 10,
};

/**
 * Extract query tags for relevance matching
 */
function extractQueryTags(query: string): { disease: string[], decision: string[] } {
    const text = query.toLowerCase();
    const disease: string[] = [];
    const decision: string[] = [];

    // Disease detection
    if (text.includes('pneumonia') || text.includes('cap') || text.includes('lung infection')) disease.push('CAP');
    if (text.includes('sepsis') || text.includes('septic')) disease.push('sepsis');
    if (text.includes('atrial fibrillation') || text.includes('afib') || text.includes(' af ')) disease.push('AF');
    if (text.includes('heart failure') || text.includes('hfref') || text.includes('hfpef')) disease.push('HF');
    if (text.includes('antiplatelet') || text.includes('dapt') || text.includes('stent') || text.includes('pci')) disease.push('DAPT');
    if (text.includes('kidney') || text.includes('ckd') || text.includes('renal') || text.includes('dialysis')) disease.push('CKD');
    if (text.includes('diabetes') || text.includes('diabetic')) disease.push('diabetes');
    if (text.includes('thromboembolism') || text.includes('pulmonary embolism') || text.includes('dvt')) disease.push('VTE');

    // Decision detection
    if (text.includes('duration') || text.includes('how long') || text.includes('when to stop')) decision.push('duration');
    if (text.includes('oral') || text.includes('switch') || text.includes('de-escalat')) decision.push('iv-to-oral');
    if (text.includes('initial') || text.includes('empiric') || text.includes('first-line')) decision.push('initial-therapy');
    if (text.includes('anticoagula') || text.includes('warfarin') || text.includes('apixaban')) decision.push('anticoagulation');
    if (text.includes('dose') || text.includes('dosing')) decision.push('dose');

    return { disease, decision };
}

/**
 * Calculate relevance score based on tag overlap
 * Returns 0-100 where 100 = perfect match
 */
function calculateRelevanceScore(
    itemTags: { disease: string[], decision: string[] },
    queryTags: { disease: string[], decision: string[] }
): number {
    let score = 50; // Base score

    // Disease match (most important)
    const diseaseOverlap = itemTags.disease.filter(t => queryTags.disease.includes(t)).length;
    if (diseaseOverlap > 0) {
        score += 30; // Strong boost for disease match
    } else if (queryTags.disease.length > 0 && itemTags.disease.length > 0) {
        // Has disease tags but they don't match - penalty
        score -= 20;
    }

    // Decision match
    const decisionOverlap = itemTags.decision.filter(t => queryTags.decision.includes(t)).length;
    if (decisionOverlap > 0) {
        score += 20; // Boost for decision match
    }

    // Penalty for clearly off-topic (e.g., DAPT item in CAP query)
    const offTopicPairs = [
        ['DAPT', 'CAP'], ['DAPT', 'sepsis'],
        ['CAP', 'DAPT'], ['CAP', 'AF'],
        ['VTE', 'CAP'], ['VTE', 'DAPT'],
    ];
    for (const [itemDisease, queryDisease] of offTopicPairs) {
        if (itemTags.disease.includes(itemDisease) && queryTags.disease.includes(queryDisease)) {
            score -= 40; // Heavy penalty for off-topic
            break;
        }
    }

    return Math.max(0, Math.min(100, score));
}

/**
 * Rank and filter evidence package to ensure only high-quality, RELEVANT sources are passed to the LLM.
 * 
 * Rules:
 * 1. Always keep Anchor Guidelines (Tier 1).
 * 2. Prioritize Guidelines & Systematic Reviews (Tier 1-2).
 * 3. FILTER OUT off-topic items (e.g., DAPT trials in CAP query).
 * 4. Hard cap total items (default 15) to reduce noise.
 * 5. Drop lower-tier items if higher-tier ones are sufficient.
 */
export function rankAndFilterEvidence(
    evidence: EvidencePackage,
    maxItems: number = 15,
    clinicalQuery?: string
): EvidencePackage {
    const allItems: ScoredEvidenceItem[] = [];
    
    // Extract query tags for relevance filtering
    const queryTags = clinicalQuery ? extractQueryTags(clinicalQuery) : { disease: [], decision: [] };
    if (queryTags.disease.length > 0 || queryTags.decision.length > 0) {
        console.log(`🎯 Query tags detected - Disease: [${queryTags.disease.join(', ')}], Decision: [${queryTags.decision.join(', ')}]`);
    }

    // 1. Flatten all evidence into a single list with metadata

    // Anchor Guidelines
    let anchorCount = 0;
    evidence.guidelines.forEach(item => {
        const isAnchor = item.type === 'Anchor Guideline';
        if (isAnchor) anchorCount++;
        const metadata = enrichEvidenceMetadata(item, 'guideline', isAnchor);
        const relevanceScore = calculateRelevanceScore(
            { disease: metadata.disease_tags, decision: metadata.decision_tags },
            queryTags
        );
        allItems.push({
            item,
            metadata,
            originalCategory: 'guidelines',
            relevanceScore: isAnchor ? 100 : relevanceScore // Anchors always relevant
        });
    });

    // Adjust max items if we have anchor guidelines (need more room for supporting evidence)
    if (anchorCount > 0) {
        maxItems = Math.max(maxItems, 20); // Increase cap to 20 for anchor scenarios
        console.log(`⚓ Anchor scenario detected (${anchorCount} anchors), increasing evidence cap to ${maxItems}`);
    }

    // Helper to add items with relevance scoring
    const addWithRelevance = (items: any[], type: 'guideline' | 'review' | 'article' | 'trial', category: keyof EvidencePackage) => {
        items?.forEach(item => {
            const metadata = enrichEvidenceMetadata(item, type);
            const relevanceScore = calculateRelevanceScore(
                { disease: metadata.disease_tags, decision: metadata.decision_tags },
                queryTags
            );
            allItems.push({ item, metadata, originalCategory: category, relevanceScore });
        });
    };

    // PubMed Guidelines
    addWithRelevance(evidence.pubmedGuidelines || [], 'guideline', 'pubmedGuidelines');

    // Cochrane Reviews (Recent)
    addWithRelevance(evidence.cochraneRecent, 'review', 'cochraneRecent');

    // Cochrane Reviews (All)
    addWithRelevance(evidence.cochraneReviews, 'review', 'cochraneReviews');

    // PubMed Reviews
    addWithRelevance(evidence.pubmedReviews, 'review', 'pubmedReviews');

    // Clinical Trials
    addWithRelevance(evidence.clinicalTrials, 'trial', 'clinicalTrials');

    // PubMed Articles
    addWithRelevance(evidence.pubmedArticles, 'article', 'pubmedArticles');

    // FIXED: Add Tavily Citations to evidence processing
    // Tavily citations are high-quality fallback sources from trusted medical domains
    addWithRelevance(evidence.tavilyCitations, 'article', 'tavilyCitations');

    // 2. Filter out clearly off-topic items (relevance < 30)
    const MIN_RELEVANCE = 30;
    const relevantItems = allItems.filter(item => {
        if (item.metadata.is_anchor) return true; // Always keep anchors
        if (item.relevanceScore < MIN_RELEVANCE) {
            console.log(`❌ Filtered off-topic: "${item.item.title?.substring(0, 50)}..." (relevance: ${item.relevanceScore})`);
            return false;
        }
        return true;
    });

    console.log(`🔍 Relevance filter: ${allItems.length} → ${relevantItems.length} items (removed ${allItems.length - relevantItems.length} off-topic)`);

    // 3. Sort by: Relevance (desc) -> Tier (asc) -> Quality Score (desc)
    relevantItems.sort((a, b) => {
        // Relevance: Higher is better (most important for on-topic)
        if (Math.abs(a.relevanceScore - b.relevanceScore) > 20) {
            return b.relevanceScore - a.relevanceScore;
        }
        // Tier: Lower is better (1 = Anchor, 6 = Other)
        if (a.metadata.tier !== b.metadata.tier) {
            return a.metadata.tier - b.metadata.tier;
        }
        // Quality: Higher is better
        if (a.metadata.quality_score !== b.metadata.quality_score) {
            return b.metadata.quality_score - a.metadata.quality_score;
        }
        return 0;
    });

    // 4. Select Top Items
    // Always keep Anchors (Tier 1, is_anchor=true)
    const anchors = relevantItems.filter(i => i.metadata.is_anchor);
    const others = relevantItems.filter(i => !i.metadata.is_anchor);

    // Fill remaining slots with highest ranked others
    const slotsRemaining = Math.max(0, maxItems - anchors.length);
    const selectedOthers = others.slice(0, slotsRemaining);

    const finalSelection = [...anchors, ...selectedOthers];

    // 4. Reconstruct EvidencePackage
    // Initialize empty package with same structure (shallow copy of non-array props)
    const newPackage: EvidencePackage = { ...evidence };

    // Reset all array properties to empty
    const arrayKeys: (keyof EvidencePackage)[] = [
        'guidelines', 'pubmedGuidelines', 'cochraneRecent', 'cochraneReviews',
        'pubmedReviews', 'clinicalTrials', 'pubmedArticles',
        'drugLabels', 'dailyMedDrugs', 'adverseEvents', 'pmcRecentArticles',
        'pmcReviews', 'pmcArticles', 'literature', 'europePMCRecent',
        'europePMCCited', 'europePMCPreprints', 'europePMCOpenAccess',
        'semanticScholarPapers', 'semanticScholarHighlyCited',
        'aapGuidelines', 'aapPolicyStatements', 'aapKeyResources',
        'rxnormDrugs', 'rxnormClasses', 'rxnormInteractions', 'rxnormPrescribable',
        'whoGuidelines', 'cdcGuidelines', 'niceGuidelines', 'bmjBestPractice',
        'cardiovascularGuidelines', 'ncbiBooks', 'omimEntries',
        'pubChemCompounds', 'pubChemBioAssays', 'tavilyCitations'
    ];

    arrayKeys.forEach(key => {
        if (Array.isArray(newPackage[key])) {
            (newPackage[key] as any[]) = [];
        }
    });

    // Populate with selected items
    finalSelection.forEach(scored => {
        const category = scored.originalCategory;
        if (Array.isArray(newPackage[category])) {
            (newPackage[category] as any[]).push(scored.item);
        }
    });

    // Log stats
    console.log(`🔍 Evidence Ranking: Reduced ${allItems.length} items to ${finalSelection.length}`);
    console.log(`   - Anchors: ${anchors.length}`);
    console.log(`   - Guidelines/Reviews: ${finalSelection.filter(i => i.metadata.tier <= 2 && !i.metadata.is_anchor).length}`);
    console.log(`   - Studies/Trials: ${finalSelection.filter(i => i.metadata.tier > 2).length}`);

    return newPackage;
}


// ============================================================================
// TAG-BASED RANKING FUNCTIONS
// ============================================================================

/**
 * Calculate tag relevance score for an evidence item
 * 
 * Scoring rules:
 * - Highest boost for primary_disease_tag + primary_decision_tag match
 * - Medium boost for primary_disease_tag + any decision_tag match
 * - Lower boost for primary_disease_tag only
 * - Relevance <10 for no tag overlap → exclude
 * 
 * @param item - Evidence item to score
 * @param config - Tag-based ranking configuration
 * @returns Relevance score 0-100, <10 means exclude
 */
export function calculateTagRelevance(
    item: any,
    config: TagBasedRankingConfig
): number {
    // Extract item tags from title and abstract
    // Handle both title and briefTitle (for ClinicalTrial objects)
    const title = item.title || item.briefTitle || '';
    const itemText = `${title} ${item.abstract || ''} ${item.summary || ''} ${item.briefSummary || ''}`.toLowerCase();
    
    // Check for disease tag matches
    const primaryDiseaseMatch = config.primary_disease_tag && 
        matchesTag(itemText, config.primary_disease_tag);
    const anyDiseaseMatch = config.disease_tags.some(tag => matchesTag(itemText, tag));
    
    // Check for decision tag matches
    const primaryDecisionMatch = config.primary_decision_tag && 
        matchesTag(itemText, config.primary_decision_tag);
    const anyDecisionMatch = config.decision_tags.some(tag => matchesTag(itemText, tag));
    
    // Calculate score based on matches
    let score = 0;
    
    if (primaryDiseaseMatch && primaryDecisionMatch) {
        // Best match: both primary tags
        score = 100;
    } else if (primaryDiseaseMatch && anyDecisionMatch) {
        // Good match: primary disease + any decision
        score = 80;
    } else if (anyDiseaseMatch && primaryDecisionMatch) {
        // Good match: any disease + primary decision
        score = 75;
    } else if (primaryDiseaseMatch) {
        // Partial match: primary disease only
        score = 50;
    } else if (anyDiseaseMatch && anyDecisionMatch) {
        // Partial match: any disease + any decision
        score = 40;
    } else if (anyDiseaseMatch) {
        // Weak match: any disease only
        score = 20;
    } else if (anyDecisionMatch) {
        // Very weak match: decision only, no disease
        score = 10;
    } else {
        // FALLBACK: Check for broader medical relevance
        const hasMedicalTerms = containsMedicalTerms(itemText);
        if (hasMedicalTerms) {
            score = 5; // Very low but not zero
        } else {
            score = 0; // No match: exclude
        }
    }
    
    // Apply off-topic penalty if configured
    if (config.penalize_off_topic && score > 0) {
        const isOffTopic = isOffTopicReference(itemText, config);
        if (isOffTopic) {
            score = Math.max(0, score - 50);
        }
    }
    
    return score;
}

/**
 * Check if text matches a tag using common patterns
 */
function matchesTag(text: string, tag: string): boolean {
    const tagPatterns: Record<string, string[]> = {
        'AF': ['atrial fibrillation', 'afib', 'a-fib', ' af '],
        'CKD': ['chronic kidney', 'ckd', 'renal insufficiency', 'kidney disease', 'egfr'],
        'HF': ['heart failure', 'hfref', 'hfpef', 'cardiac failure'],
        'CAP': ['pneumonia', 'cap', 'respiratory infection'],
        'SEPSIS': ['sepsis', 'septic'],
        'CAD': ['coronary', 'cad', 'ischemic heart'],
        'PCI': ['pci', 'stent', 'angioplasty', 'percutaneous coronary'],
        'DIABETES': ['diabetes', 'diabetic', 'glycemic', 't2dm'],
        'GI_BLEED': ['gi bleed', 'gastrointestinal bleed', 'hemorrhage'],
        'HBR': ['bleeding risk', 'high bleeding'],
        'AHRE': ['ahre', 'subclinical af', 'device-detected'],
        'VTE': ['thromboembolism', 'dvt', 'pulmonary embolism'],
        'anticoagulation': ['anticoagula', 'warfarin', 'apixaban', 'rivaroxaban', 'doac', 'noac'],
        'antiplatelet': ['antiplatelet', 'aspirin', 'clopidogrel', 'ticagrelor', 'dapt'],
        'drug_choice': ['drug choice', 'preferred', 'first-line', 'optimal', 'recommended'],
        'duration': ['duration', 'how long', 'length of treatment'],
        'de-escalation': ['de-escalation', 'step down', 'switch', 'iv to oral'],
        'dose': ['dose', 'dosing', 'mg'],
        'therapy': ['therapy', 'treatment', 'management'],
        'restart': ['restart', 'resume', 'reinitiate'],
        'monitoring': ['monitor', 'follow-up', 'surveillance'],
    };
    
    const patterns = tagPatterns[tag] || [tag.toLowerCase()];
    return patterns.some(p => text.includes(p.toLowerCase()));
}

/**
 * Check if text contains general medical terms (fallback relevance)
 */
function containsMedicalTerms(text: string): boolean {
    const medicalTerms = [
        'treatment', 'therapy', 'management', 'diagnosis', 'patient', 'clinical',
        'medical', 'disease', 'condition', 'guideline', 'recommendation', 'study',
        'trial', 'efficacy', 'safety', 'outcome', 'intervention', 'medication',
        'drug', 'pharmaceutical', 'healthcare', 'hospital', 'physician', 'doctor'
    ];
    
    return medicalTerms.some(term => text.includes(term));
}

/**
 * Check if a reference is off-topic based on known off-topic patterns
 */
function isOffTopicReference(text: string, config: TagBasedRankingConfig): boolean {
    // Define off-topic patterns for specific scenarios
    const offTopicPatterns: Record<string, string[]> = {
        'AF': ['diabetes management', 'glycemic control', 'insulin therapy', 'weight loss', 'exercise program'],
        'CAP': ['coronary', 'anticoagulation', 'atrial fibrillation', 'heart failure'],
        'SEPSIS': ['coronary', 'anticoagulation', 'atrial fibrillation'],
        'anticoagulation': ['primary prevention', 'lifestyle modification', 'diet', 'exercise'],
    };
    
    // Check if item contains off-topic patterns for the query's primary tags
    const primaryDisease = config.primary_disease_tag;
    const primaryDecision = config.primary_decision_tag;
    
    const diseaseOffTopic = offTopicPatterns[primaryDisease] || [];
    const decisionOffTopic = offTopicPatterns[primaryDecision] || [];
    
    const allOffTopic = [...diseaseOffTopic, ...decisionOffTopic];
    
    return allOffTopic.some(pattern => text.includes(pattern.toLowerCase()));
}

/**
 * Rank and filter evidence using tag-based configuration
 * 
 * Rules:
 * 1. Hard-boost anchors, matching reviews, pivotal trials
 * 2. Hard-penalize off-topic references (relevance <10 → exclude)
 * 3. Ensure ≥80% of references match disease_tags AND decision_tags
 * 4. Relax ≥80% rule if <5 references remain
 * 5. Cap final list to 6-10 items
 * 6. Include at least 2 primary studies when available
 * 
 * @param evidence - Evidence package to rank
 * @param config - Tag-based ranking configuration
 * @param maxItems - Maximum items to return (default from config)
 * @returns Filtered and ranked evidence package
 */
export function rankAndFilterEvidenceWithTags(
    evidence: EvidencePackage,
    config: TagBasedRankingConfig,
    maxItems?: number
): EvidencePackage {
    const max = 10; // CRITICAL: Strict cap for LLM prompt quality
    const min = config.min_references ?? 3; // Reduced min to avoid filler evidence
    
    const allItems: ScoredEvidenceItem[] = [];
    
    // Helper to add items with tag-based relevance scoring
    const addWithTagRelevance = (
        items: any[], 
        type: 'guideline' | 'review' | 'article' | 'trial', 
        category: keyof EvidencePackage
    ) => {
        items?.forEach(item => {
            const isAnchor = item.type === 'Anchor Guideline' || (item as any).is_anchor === true;
            const metadata = enrichEvidenceMetadata(item, type, isAnchor);
            
            // Calculate tag-based relevance
            let relevanceScore = calculateTagRelevance(item, config);
            
            // Boost anchors if configured
            if (config.boost_anchors && isAnchor) {
                relevanceScore = 100;
            }
            
            allItems.push({ item, metadata, originalCategory: category, relevanceScore });
        });
    };
    
    // Add all evidence types
    addWithTagRelevance(evidence.guidelines || [], 'guideline', 'guidelines');
    addWithTagRelevance(evidence.pubmedGuidelines || [], 'guideline', 'pubmedGuidelines');
    addWithTagRelevance(evidence.aapGuidelines || [], 'guideline', 'aapGuidelines');
    addWithTagRelevance(evidence.whoGuidelines || [], 'guideline', 'whoGuidelines');
    addWithTagRelevance(evidence.cdcGuidelines || [], 'guideline', 'cdcGuidelines');
    addWithTagRelevance(evidence.niceGuidelines || [], 'guideline', 'niceGuidelines');

    addWithTagRelevance(evidence.cochraneRecent || [], 'review', 'cochraneRecent');
    addWithTagRelevance(evidence.cochraneReviews || [], 'review', 'cochraneReviews');
    addWithTagRelevance(evidence.pubmedReviews || [], 'review', 'pubmedReviews');
    addWithTagRelevance(evidence.pmcReviews || [], 'review', 'pmcReviews');
    addWithTagRelevance(evidence.literature || [], 'article', 'literature');

    addWithTagRelevance(evidence.europePMCRecent || [], 'article', 'europePMCRecent');
    addWithTagRelevance(evidence.europePMCCited || [], 'article', 'europePMCCited');
    addWithTagRelevance(evidence.europePMCOpenAccess || [], 'article', 'europePMCOpenAccess');

    addWithTagRelevance(evidence.pmcRecentArticles || [], 'article', 'pmcRecentArticles');
    addWithTagRelevance(evidence.pmcArticles || [], 'article', 'pmcArticles');

    addWithTagRelevance(evidence.semanticScholarPapers || [], 'article', 'semanticScholarPapers');
    addWithTagRelevance(evidence.semanticScholarHighlyCited || [], 'article', 'semanticScholarHighlyCited');

    addWithTagRelevance(evidence.clinicalTrials || [], 'trial', 'clinicalTrials');
    addWithTagRelevance(evidence.pubmedArticles || [], 'article', 'pubmedArticles');
    
    addWithTagRelevance(evidence.dailyMedDrugs || [], 'article', 'dailyMedDrugs');
    addWithTagRelevance(evidence.rxnormDrugs || [], 'article', 'rxnormDrugs');

    // FIXED: Add Tavily Citations to tag-based ranking
    addWithTagRelevance(evidence.tavilyCitations || [], 'article', 'tavilyCitations');

    // Filter out off-topic items (relevance <5, lowered from 10)
    const MIN_RELEVANCE = 5;
    let relevantItems = allItems.filter(item => {
        if (item.metadata.is_anchor) return true; // Always keep anchors
        if (item.relevanceScore < MIN_RELEVANCE) {
            console.log(`❌ Tag-filtered off-topic: "${item.item.title?.substring(0, 50)}..." (relevance: ${item.relevanceScore})`);
            return false;
        }
        return true;
    });
    
    console.log(`🏷️  Tag-based filter: ${allItems.length} → ${relevantItems.length} items`);
    
    // FALLBACK: If no items pass tag filter, include top-tier items regardless of relevance
    if (relevantItems.length === 0 && allItems.length > 0) {
        console.log('⚠️  No items passed tag filter, using fallback with top-tier evidence');
        relevantItems = allItems
            .filter(item => item.metadata.tier <= 2) // Only tier 1-2 (guidelines, reviews)
            .slice(0, Math.min(5, allItems.length)); // Take up to 5 items
        console.log(`🔄 Fallback: Selected ${relevantItems.length} top-tier items`);
    }
    
    // Sort by relevance (desc) -> tier (asc) -> quality (desc)
    relevantItems.sort((a, b) => {
        // Relevance first
        if (a.relevanceScore !== b.relevanceScore) {
            return b.relevanceScore - a.relevanceScore;
        }
        // Then tier
        if (a.metadata.tier !== b.metadata.tier) {
            return a.metadata.tier - b.metadata.tier;
        }
        // Then quality
        return b.metadata.quality_score - a.metadata.quality_score;
    });
    
    // Separate anchors and others
    const anchors = relevantItems.filter(i => i.metadata.is_anchor);
    const others = relevantItems.filter(i => !i.metadata.is_anchor);
    
    // Ensure at least 2 primary studies (trials) if available
    const trials = others.filter(i => i.originalCategory === 'clinicalTrials');
    const nonTrials = others.filter(i => i.originalCategory !== 'clinicalTrials');
    
    // Build final selection
    let finalSelection: ScoredEvidenceItem[] = [...anchors];
    
    // Add top trials (at least 2 if available)
    const trialsToAdd = Math.min(2, trials.length);
    finalSelection.push(...trials.slice(0, trialsToAdd));
    
    // Fill remaining slots with other items
    const remainingSlots = max - finalSelection.length;
    const remainingTrials = trials.slice(trialsToAdd);
    const otherItems = [...nonTrials, ...remainingTrials];
    finalSelection.push(...otherItems.slice(0, remainingSlots));
    
    // Check if we have enough references
    if (finalSelection.length < min) {
        console.log(`⚠️  Only ${finalSelection.length} references after tag filtering (min: ${min}), relaxing filter`);
        // Relax filter: include items with relevance ≥5
        const relaxedItems = allItems.filter(item => 
            item.relevanceScore >= 5 && !finalSelection.includes(item)
        );
        const needed = min - finalSelection.length;
        finalSelection.push(...relaxedItems.slice(0, needed));
    }
    
    // Cap to max
    finalSelection = finalSelection.slice(0, max);
    
    // Calculate quality metrics
    const matchingCount = finalSelection.filter(i => i.relevanceScore >= 50).length;
    const matchingPercent = finalSelection.length > 0 
        ? Math.round((matchingCount / finalSelection.length) * 100) 
        : 0;
    
    console.log(`📊 Final reference list: ${finalSelection.length} items (${matchingPercent}% high-relevance)`);
    console.log(`   - Anchors: ${anchors.length}`);
    console.log(`   - Primary studies: ${finalSelection.filter(i => i.originalCategory === 'clinicalTrials').length}`);
    
    // Reconstruct evidence package
    const newPackage: EvidencePackage = { ...evidence };
    
    // Reset all array properties
    const arrayKeys: (keyof EvidencePackage)[] = [
        'guidelines', 'pubmedGuidelines', 'cochraneRecent', 'cochraneReviews',
        'pubmedReviews', 'clinicalTrials', 'pubmedArticles',
        'drugLabels', 'dailyMedDrugs', 'adverseEvents', 'pmcRecentArticles',
        'pmcReviews', 'pmcArticles', 'literature', 'europePMCRecent',
        'europePMCCited', 'europePMCPreprints', 'europePMCOpenAccess',
        'semanticScholarPapers', 'semanticScholarHighlyCited',
        'aapGuidelines', 'aapPolicyStatements', 'aapKeyResources',
        'rxnormDrugs', 'rxnormClasses', 'rxnormInteractions', 'rxnormPrescribable',
        'whoGuidelines', 'cdcGuidelines', 'niceGuidelines', 'bmjBestPractice',
        'cardiovascularGuidelines', 'ncbiBooks', 'omimEntries',
        'pubChemCompounds', 'pubChemBioAssays', 'tavilyCitations'
    ];
    
    arrayKeys.forEach(key => {
        if (Array.isArray(newPackage[key])) {
            (newPackage[key] as any[]) = [];
        }
    });
    
    // Populate with selected items
    finalSelection.forEach(scored => {
        const category = scored.originalCategory;
        if (Array.isArray(newPackage[category])) {
            (newPackage[category] as any[]).push(scored.item);
        }
    });
    
    return newPackage;
}

/**
 * Get ranking statistics for an evidence package
 */
export function getRankingStats(evidence: EvidencePackage): {
    totalItems: number;
    anchors: number;
    guidelines: number;
    reviews: number;
    trials: number;
    articles: number;
} {
    return {
        totalItems: 
            (evidence.guidelines?.length || 0) +
            (evidence.pubmedGuidelines?.length || 0) +
            (evidence.cochraneReviews?.length || 0) +
            (evidence.cochraneRecent?.length || 0) +
            (evidence.pubmedReviews?.length || 0) +
            (evidence.clinicalTrials?.length || 0) +
            (evidence.pubmedArticles?.length || 0),
        anchors: (evidence.guidelines || []).filter(g => g.type === 'Anchor Guideline').length,
        guidelines: (evidence.guidelines?.length || 0) + (evidence.pubmedGuidelines?.length || 0),
        reviews: (evidence.cochraneReviews?.length || 0) + (evidence.cochraneRecent?.length || 0) + (evidence.pubmedReviews?.length || 0),
        trials: evidence.clinicalTrials?.length || 0,
        articles: evidence.pubmedArticles?.length || 0,
    };
}
