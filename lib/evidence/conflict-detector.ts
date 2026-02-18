/**
 * Conflict Detection System
 * 
 * Identifies when authoritative medical sources (WHO, CDC, NICE, etc.)
 * provide contradictory recommendations on the same topic.
 * 
 * Phase 1 Implementation: Keyword-based conflict detection
 * Future: Semantic conflict detection using NLI models
 */

import type { EvidencePackage } from './engine';
import type { WHOGuideline } from './who-guidelines';
import type { CDCGuideline } from './cdc-guidelines';
import type { NICEGuideline } from './nice-guidelines';
import type { BMJBestPractice } from './bmj-best-practice';
import type { CardiovascularGuideline } from './cardiovascular-guidelines';

export interface Conflict {
  topic: string;
  sources: ConflictingSource[];
  severity: 'major' | 'minor';
  description: string;
}

export interface ConflictingSource {
  name: string; // "WHO", "CDC", "NICE", etc.
  position: string;
  url?: string;
  year?: string;
}

type Guideline = WHOGuideline | CDCGuideline | NICEGuideline | BMJBestPractice | CardiovascularGuideline;

/**
 * Keywords indicating positive recommendations
 */
const POSITIVE_KEYWORDS = [
  'recommend',
  'should',
  'advise',
  'suggest',
  'encourage',
  'support',
  'endorse',
  'favor',
  'prefer',
];

/**
 * Keywords indicating negative recommendations
 */
const NEGATIVE_KEYWORDS = [
  'not recommend',
  'should not',
  'avoid',
  'discourage',
  'against',
  'do not',
  'contraindicate',
  'warn against',
];

/**
 * Extract topic from guideline title
 * Removes organization names and common prefixes
 */
function extractTopic(title: string): string {
  // Remove organization names
  let topic = title
    .replace(/WHO|CDC|NICE|BMJ|ACC\/AHA|ESC|AAP/gi, '')
    .replace(/guideline|guidance|recommendation|statement/gi, '')
    .trim();
  
  // Take first meaningful phrase (up to first colon or dash)
  const match = topic.match(/^([^:—-]+)/);
  if (match) {
    topic = match[1].trim();
  }
  
  return topic.toLowerCase();
}

/**
 * Determine if guideline has positive or negative stance
 */
function getStance(text: string): 'positive' | 'negative' | 'neutral' {
  const lowerText = text.toLowerCase();
  
  // Check for negative keywords first (more specific)
  for (const keyword of NEGATIVE_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      return 'negative';
    }
  }
  
  // Check for positive keywords
  for (const keyword of POSITIVE_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      return 'positive';
    }
  }
  
  return 'neutral';
}

/**
 * Calculate similarity between two topics (simple word overlap)
 */
function topicSimilarity(topic1: string, topic2: string): number {
  const words1 = new Set(topic1.toLowerCase().split(/\s+/));
  const words2 = new Set(topic2.toLowerCase().split(/\s+/));
  
  // Calculate Jaccard similarity
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * Check if two guidelines conflict on a topic
 */
export function checkGuidelineConflict(
  guideline1: Guideline,
  guideline2: Guideline
): Conflict | null {
  // Extract topics
  const topic1 = extractTopic(guideline1.title);
  const topic2 = extractTopic(guideline2.title);
  
  // Check if topics are similar (>50% word overlap)
  const similarity = topicSimilarity(topic1, topic2);
  if (similarity < 0.5) {
    return null; // Different topics, no conflict
  }
  
  // Determine stances
  const text1 = `${guideline1.title} ${guideline1.summary || ''}`;
  const text2 = `${guideline2.title} ${guideline2.summary || ''}`;
  
  const stance1 = getStance(text1);
  const stance2 = getStance(text2);
  
  // Check for conflicting stances
  if (
    (stance1 === 'positive' && stance2 === 'negative') ||
    (stance1 === 'negative' && stance2 === 'positive')
  ) {
    // Major conflict: opposite recommendations
    return {
      topic: topic1,
      sources: [
        {
          name: getSourceName(guideline1),
          position: extractPosition(text1, stance1),
          url: guideline1.url,
          year: 'year' in guideline1 ? guideline1.year : undefined,
        },
        {
          name: getSourceName(guideline2),
          position: extractPosition(text2, stance2),
          url: guideline2.url,
          year: 'year' in guideline2 ? guideline2.year : undefined,
        },
      ],
      severity: 'major',
      description: `${getSourceName(guideline1)} and ${getSourceName(guideline2)} provide contradictory recommendations on ${topic1}`,
    };
  }
  
  // Check for minor conflicts (different thresholds, timing, etc.)
  if (stance1 !== 'neutral' && stance2 !== 'neutral' && stance1 === stance2) {
    // Both recommend same direction but might differ in details
    // Check for numerical differences (ages, doses, intervals)
    const numbers1 = text1.match(/\d+/g) || [];
    const numbers2 = text2.match(/\d+/g) || [];
    
    if (numbers1.length > 0 && numbers2.length > 0 && numbers1[0] !== numbers2[0]) {
      return {
        topic: topic1,
        sources: [
          {
            name: getSourceName(guideline1),
            position: extractPosition(text1, stance1),
            url: guideline1.url,
            year: 'year' in guideline1 ? guideline1.year : undefined,
          },
          {
            name: getSourceName(guideline2),
            position: extractPosition(text2, stance2),
            url: guideline2.url,
            year: 'year' in guideline2 ? guideline2.year : undefined,
          },
        ],
        severity: 'minor',
        description: `${getSourceName(guideline1)} and ${getSourceName(guideline2)} recommend different thresholds or timing for ${topic1}`,
      };
    }
  }
  
  return null; // No conflict detected
}

/**
 * Get source name from guideline
 */
function getSourceName(guideline: Guideline): string {
  // Check for organization property
  if ('organization' in guideline) {
    return (guideline as any).organization || 'Unknown';
  }
  
  // Check for source property
  if ('source' in guideline) {
    return (guideline as any).source || 'Unknown';
  }
  
  // Check for category (cardiovascular guidelines)
  if ('category' in guideline) {
    const category = (guideline as any).category || '';
    return category.includes('ACC') || category.includes('AHA') ? 'ACC/AHA' : 'ESC';
  }
  
  // Infer from title
  const title = (guideline as any).title || '';
  if (title.includes('WHO')) return 'WHO';
  if (title.includes('CDC')) return 'CDC';
  if (title.includes('NICE')) return 'NICE';
  if (title.includes('BMJ')) return 'BMJ';
  if (title.includes('ACC') || title.includes('AHA')) return 'ACC/AHA';
  if (title.includes('ESC')) return 'ESC';
  
  return 'Unknown';
}

/**
 * Extract position statement from text
 */
function extractPosition(text: string, stance: 'positive' | 'negative' | 'neutral'): string {
  // Find sentence containing recommendation
  const sentences = text.split(/[.!?]+/);
  
  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase();
    
    if (stance === 'positive') {
      for (const keyword of POSITIVE_KEYWORDS) {
        if (lowerSentence.includes(keyword)) {
          return sentence.trim();
        }
      }
    } else if (stance === 'negative') {
      for (const keyword of NEGATIVE_KEYWORDS) {
        if (lowerSentence.includes(keyword)) {
          return sentence.trim();
        }
      }
    }
  }
  
  // Fallback: return first sentence
  return sentences[0]?.trim() || text.substring(0, 150);
}

/**
 * Detect conflicts in evidence package
 * Scans all guideline pairs for contradictions
 * 
 * Error Handling: Returns empty array on failure (graceful degradation)
 */
export function detectConflicts(evidence: EvidencePackage): Conflict[] {
  try {
    const conflicts: Conflict[] = [];
    
    // Validate input
    if (!evidence) {
      console.warn('⚠️  Conflict detection: No evidence package provided');
      return conflicts;
    }
    
    // Collect all guidelines from different sources
    const allGuidelines: Guideline[] = [
      ...(evidence.whoGuidelines || []),
      ...(evidence.cdcGuidelines || []),
      ...(evidence.niceGuidelines || []),
      ...(evidence.bmjBestPractice || []),
      ...(evidence.cardiovascularGuidelines || []),
    ];
    
    if (allGuidelines.length < 2) {
      return conflicts; // Need at least 2 guidelines to have a conflict
    }
    
    console.log(`🔍 Checking ${allGuidelines.length} guidelines for conflicts...`);
    
    // Check all pairs of guidelines
    for (let i = 0; i < allGuidelines.length; i++) {
      for (let j = i + 1; j < allGuidelines.length; j++) {
        try {
          const conflict = checkGuidelineConflict(allGuidelines[i], allGuidelines[j]);
          
          if (conflict) {
            // Check if we already have a conflict for this topic
            const existingConflict = conflicts.find(c => 
              topicSimilarity(c.topic, conflict.topic) > 0.7
            );
            
            if (!existingConflict) {
              conflicts.push(conflict);
              console.log(`⚠️  Conflict detected: ${conflict.description}`);
            }
          }
        } catch (pairError: any) {
          // Log error but continue checking other pairs
          console.error(`❌ Error checking conflict between guidelines ${i} and ${j}:`, pairError.message);
        }
      }
    }
    
    console.log(`✅ Found ${conflicts.length} conflict(s)`);
    
    return conflicts;
  } catch (error: any) {
    console.error('❌ Conflict detection failed:', error.message);
    console.error('Stack trace:', error.stack);
    // Return empty array - system continues without conflict detection
    return [];
  }
}

/**
 * Format conflicts for inclusion in evidence prompt
 */
export function formatConflictsForPrompt(conflicts: Conflict[]): string {
  if (conflicts.length === 0) {
    return '';
  }
  
  let formatted = '\n\n--- ⚠️  CONFLICTING GUIDANCE DETECTED ---\n\n';
  formatted += '**IMPORTANT: The following authoritative sources provide different recommendations on the same topic.**\n\n';
  
  conflicts.forEach((conflict, index) => {
    formatted += `## Conflict ${index + 1}: ${conflict.topic}\n\n`;
    formatted += `**Severity:** ${conflict.severity === 'major' ? '🔴 MAJOR' : '🟡 MINOR'}\n\n`;
    formatted += `**Description:** ${conflict.description}\n\n`;
    
    formatted += '**Conflicting Positions:**\n\n';
    conflict.sources.forEach((source, i) => {
      formatted += `${i + 1}. **${source.name}** ${source.year ? `(${source.year})` : ''}\n`;
      formatted += `   - Position: ${source.position}\n`;
      if (source.url) {
        formatted += `   - Source: ${source.url}\n`;
      }
      formatted += '\n';
    });
    
    formatted += '**Clinical Guidance:**\n';
    if (conflict.severity === 'major') {
      formatted += '- These sources provide contradictory recommendations\n';
      formatted += '- Consider patient-specific factors, local guidelines, and specialist consultation\n';
      formatted += '- Present both options to the patient when appropriate\n';
    } else {
      formatted += '- These sources agree on the general approach but differ in specific thresholds or timing\n';
      formatted += '- Consider the most recent guideline and regional applicability\n';
    }
    formatted += '\n---\n\n';
  });
  
  formatted += '**Note:** When authoritative sources disagree, clinical judgment and patient-specific factors become especially important.\n\n';
  formatted += '--- END CONFLICTING GUIDANCE ---\n\n';
  
  return formatted;
}
