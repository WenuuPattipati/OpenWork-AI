/**
 * Response Enhancer - Intent-Based Response Structure Optimization
 * 
 * This module provides enhanced response structuring based on detected query intent.
 * It works with the intent router to provide better organized responses for specific
 * clinical question types without disrupting the existing system.
 */

import type { QueryIntent } from './intent-router';

// ============================================================================
// RESPONSE STRUCTURE TEMPLATES
// ============================================================================

/**
 * Get enhanced prompt instructions based on detected intent
 */
export function getIntentBasedPromptEnhancement(
  intent: QueryIntent,
  confidence: number,
  query: string
): string {
  // Only provide enhancements for high-confidence cases
  if (confidence < 0.8 || intent === 'general_clinical') {
    return '';
  }

  const enhancements = {
    research_synthesis: `
**RESEARCH SYNTHESIS MODE ACTIVATED**

For this comparative effectiveness question, structure your response to:
1. **Direct Comparison**: State the primary comparison clearly in the first paragraph
2. **Quantified Outcomes**: Include specific risk reductions, NNT, confidence intervals
3. **Evidence Synthesis**: Aggregate findings from multiple studies using pattern-based language
4. **Clinical Context**: Address patient-specific factors that influence choice
5. **Strength of Evidence**: Explicitly state the quality and consistency of evidence

**CRITICAL**: Use phrases like "Meta-analyses show..." rather than citing individual studies.
Include absolute risk reductions with confidence intervals when available.
`,

    treatment_planning: `
**TREATMENT PLANNING MODE ACTIVATED**

For this management question, provide a clear stepwise approach:
1. **First-Line Approach**: State the primary recommended intervention with specific dosing
2. **Stepwise Escalation**: Outline what to add/change if first-line is insufficient
3. **Monitoring Plan**: Specify what to monitor and when
4. **Special Considerations**: Address comorbidities, contraindications, patient factors
5. **Evidence Basis**: Link each step to specific guidelines or landmark trials

**CRITICAL**: Provide actionable, sequential steps that a clinician can implement immediately.
`,

    drug_safety: `
**DRUG SAFETY MODE ACTIVATED**

For this safety/adverse event question, organize your response around:
1. **Risk Quantification**: Provide specific incidence rates and risk factors
2. **Recognition**: Key signs/symptoms to monitor for
3. **Management Protocol**: Step-by-step approach if adverse event occurs
4. **Prevention Strategies**: How to minimize risk (dosing, monitoring, contraindications)
5. **Risk-Benefit Context**: When benefits outweigh risks

**CRITICAL**: Include specific incidence percentages and clear monitoring parameters.
`,

    differential_diagnosis: `
**DIFFERENTIAL DIAGNOSIS MODE ACTIVATED**

For this diagnostic reasoning question, structure as:
1. **Key Differentials**: List 3-5 most likely diagnoses in order of probability
2. **Discriminating Features**: For each diagnosis, provide distinguishing clinical/lab features
3. **Diagnostic Strategy**: Recommend the most efficient diagnostic approach
4. **Next Best Test**: Identify the single most useful next diagnostic step
5. **Clinical Decision Rules**: Include relevant scoring systems with thresholds

**CRITICAL**: Focus on practical differentiation - what helps distinguish between conditions.
`,

    guideline_dosing: `
**GUIDELINE DOSING MODE ACTIVATED**

For this dosing/protocol question, provide:
1. **Standard Dosing**: Evidence-based starting dose with clear administration details
2. **Dose Adjustments**: Specific adjustments for renal/hepatic impairment, age, weight
3. **Titration Protocol**: How and when to adjust doses based on response/tolerance
4. **Monitoring Requirements**: What to check and when during treatment
5. **Guideline Authority**: Cite specific guideline sections and years

**CRITICAL**: Include exact mg/kg doses, frequency, and adjustment criteria.
`,

    clinical_workup: `
**CLINICAL WORKUP MODE ACTIVATED**

For this diagnostic workup question, organize as:
1. **Initial Assessment**: Bedside tests and immediate evaluation
2. **Laboratory Studies**: Specific tests in order of priority with normal ranges
3. **Imaging Strategy**: When and what imaging to order
4. **Interpretation Guide**: How to interpret results and what abnormalities suggest
5. **Decision Points**: When to escalate, consult, or change approach

**CRITICAL**: Provide a tiered approach - what to do first, second, third.
`,

    primary_evidence: `
**PRIMARY EVIDENCE MODE ACTIVATED**

For this trial/evidence question, structure as:
1. **Landmark Trials**: Name specific pivotal trials with populations and endpoints
2. **Effect Sizes**: Provide hazard ratios, absolute risk reductions, NNT with confidence intervals
3. **Study Quality**: Comment on trial design, limitations, generalizability
4. **Clinical Impact**: How these trials changed practice
5. **Evidence Gaps**: What questions remain unanswered

**CRITICAL**: Name trials explicitly (DAPA-CKD, EMPEROR-Reduced, etc.) with specific results.
`,

    exam_preparation: `
**EXAM PREPARATION MODE ACTIVATED**

For this educational question, provide:
1. **High-Yield Facts**: Key points likely to be tested
2. **Clinical Vignette**: Create a realistic patient scenario
3. **Teaching Points**: Explain the underlying principles
4. **Common Pitfalls**: What students often get wrong
5. **Memory Aids**: Mnemonics or frameworks to remember key concepts

**CRITICAL**: Focus on board-relevant, testable material with clear explanations.
`,

    pediatric_medicine: `
**PEDIATRIC MEDICINE MODE ACTIVATED**

For this pediatric question, ensure you address:
1. **Age-Specific Considerations**: How management differs by age group
2. **Weight-Based Dosing**: Provide mg/kg calculations with maximum doses
3. **Developmental Factors**: Consider cognitive, social, physical development
4. **Family-Centered Care**: Include parent/caregiver education and involvement
5. **AAP Guidelines**: Reference specific AAP recommendations and policy statements

**CRITICAL**: Always include weight-based dosing and age-appropriate considerations.
`
  };

  return enhancements[intent as keyof typeof enhancements] || '';
}

/**
 * Get response structure guidance based on intent
 */
export function getResponseStructureGuidance(
  intent: QueryIntent,
  responseStructure: 'standard' | 'focused' | 'tabbed'
): string {
  if (responseStructure === 'focused') {
    return `
**USE FOCUSED STRUCTURE (3-4 CONCISE PARAGRAPHS)**

This query has multiple sub-questions. Structure your response as:
- **Paragraph 1**: Answer first sub-question (2-3 sentences + citations)
- **Paragraph 2**: Answer second sub-question (2-3 sentences + citations)  
- **Paragraph 3**: Answer third sub-question (2-3 sentences + citations)
- **Paragraph 4**: Brief summary/protocol (1-2 sentences)

**CRITICAL**: Maximum 400 words total. Each paragraph addresses ONE specific sub-question.
No section headers - just flowing paragraphs with dense citation coverage.
`;
  }

  if (responseStructure === 'tabbed') {
    return `
**USE TABBED STRUCTURE FOR COMPREHENSIVE ANALYSIS**

Organize your response with clear section headers for the tabbed interface:
- Use the standard Doctor Mode section structure
- Ensure each tab has substantial, unique content
- Avoid repetition between tabs
`;
  }

  return `
**USE STANDARD STRUCTURE**

Follow the standard Doctor Mode response format with appropriate sections.
`;
}

/**
 * Get evidence utilization guidance based on intent
 */
export function getEvidenceUtilizationGuidance(
  intent: QueryIntent,
  evidencePriority: string[]
): string {
  const priorityGuidance = evidencePriority.slice(0, 3).map((priority, index) => {
    const priorityMap: Record<string, string> = {
      'anchor_guidelines': 'Pre-selected gold-standard guidelines (HIGHEST PRIORITY)',
      'cochrane_reviews': 'Cochrane systematic reviews (gold standard evidence)',
      'systematic_reviews': 'High-quality meta-analyses and systematic reviews',
      'landmark_trials': 'Curated pivotal trials that changed practice',
      'clinical_guidelines': 'Major society guidelines (ACC/AHA, ESC, IDSA, etc.)',
      'drug_labels': 'FDA labels and official prescribing information',
      'safety_reviews': 'Safety-focused systematic reviews and pharmacovigilance data',
      'diagnostic_criteria': 'Official diagnostic criteria and clinical decision rules'
    };

    return `${index + 1}. ${priorityMap[priority] || priority}`;
  }).join('\n');

  return `
**EVIDENCE PRIORITIZATION FOR THIS QUERY TYPE**

Based on the detected intent (${intent}), prioritize evidence in this order:
${priorityGuidance}

**INTEGRATION RULE**: Synthesize across these evidence types rather than citing them separately.
Use the highest-tier evidence to make primary recommendations, and lower-tier evidence to provide context or fill gaps.
`;
}

/**
 * Generate complete enhanced prompt based on intent analysis
 */
export function generateIntentBasedPromptEnhancement(
  intent: QueryIntent,
  confidence: number,
  query: string,
  evidencePriority: string[],
  responseStructure: 'standard' | 'focused' | 'tabbed'
): string {
  if (confidence < 0.8) {
    return ''; // No enhancement for low-confidence cases
  }

  const intentEnhancement = getIntentBasedPromptEnhancement(intent, confidence, query);
  const structureGuidance = getResponseStructureGuidance(intent, responseStructure);
  const evidenceGuidance = getEvidenceUtilizationGuidance(intent, evidencePriority);

  return `
${intentEnhancement}

${structureGuidance}

${evidenceGuidance}

**QUALITY ASSURANCE FOR ${intent.toUpperCase()} QUERIES**
- Ensure your response directly addresses the specific question type
- Use the evidence prioritization above to focus on most relevant sources
- Follow the structural guidance to optimize readability and clinical utility
- Maintain the high citation standards expected in Doctor Mode

`;
}

// ============================================================================
// RESPONSE VALIDATION
// ============================================================================

/**
 * Validate that the response structure matches the intended format
 */
export function validateResponseStructure(
  response: string,
  intent: QueryIntent,
  expectedStructure: 'standard' | 'focused' | 'tabbed'
): {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check word count for focused structure
  if (expectedStructure === 'focused') {
    const wordCount = response.split(/\s+/).length;
    if (wordCount > 450) {
      issues.push(`Response is ${wordCount} words (target: 350-400 for focused structure)`);
      suggestions.push('Condense to 3-4 focused paragraphs, maximum 400 words');
    }
  }

  // Check for appropriate citations
  const citationCount = (response.match(/\[\[\d+\]\]/g) || []).length;
  if (citationCount < 3) {
    issues.push(`Only ${citationCount} citations found (minimum: 6 for Doctor Mode)`);
    suggestions.push('Add more citations to support clinical statements');
  }

  // Intent-specific validations
  switch (intent) {
    case 'research_synthesis':
      if (!response.includes('meta-analys') && !response.includes('systematic review')) {
        issues.push('Research synthesis should reference meta-analyses or systematic reviews');
      }
      break;
      
    case 'drug_safety':
      if (!response.match(/\d+%|\d+\.\d+%/)) {
        issues.push('Drug safety responses should include specific incidence percentages');
      }
      break;
      
    case 'guideline_dosing':
      if (!response.match(/\d+\s*mg/)) {
        issues.push('Dosing responses should include specific mg doses');
      }
      break;
  }

  return {
    isValid: issues.length === 0,
    issues,
    suggestions
  };
}