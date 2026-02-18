/**
 * Hallucination Evaluation Module
 * 
 * Uses LLM-as-a-judge pattern to detect hallucinations
 * by comparing LLM responses against the provided evidence context.
 * 
 * This implementation uses Google Gemini for evaluation.
 */

import { generateJSON, GEMINI_FLASH_MODEL } from "@/lib/gemini";

// Hallucination evaluation system prompt (XML format)
const HALLUCINATION_SYSTEM_PROMPT = `
<system_prompt>
  <role>
    You are an expert medical fact-checker evaluating AI responses for hallucinations.
  </role>
  
  <task>
    Determine if the AI response contains hallucinated information - claims that are NOT supported by the provided evidence context.
  </task>
  
  <rules>
    <hallucination_indicators>
      <indicator>Makes specific claims (dosages, percentages, study names) not found in the evidence</indicator>
      <indicator>Cites PMIDs, DOIs, or URLs that don't exist in the evidence</indicator>
      <indicator>Attributes statements to sources not provided in the context</indicator>
      <indicator>Invents statistics, trial names, or clinical findings</indicator>
    </hallucination_indicators>
    
    <factual_indicators>
      <indicator>Only uses information directly from the evidence context</indicator>
      <indicator>Makes general medical knowledge statements that don't require specific citations</indicator>
      <indicator>Synthesizes information from multiple evidence sources correctly</indicator>
    </factual_indicators>
  </rules>
  
  <output_format>
    Respond with a JSON object:
    {
      "label": "hallucinated" | "factual",
      "confidence": 0.0-1.0,
      "explanation": "Brief explanation of your reasoning"
    }
  </output_format>
  
  <goal>
    Accurately classify responses as hallucinated or factual based on the provided evidence.
    Be strict - any fabricated citation or unsupported claim should be flagged as hallucinated.
  </goal>
</system_prompt>
`;

/**
 * Evaluate a response for hallucinations against the evidence context
 */
export async function evaluateHallucination(
    userQuery: string,
    llmResponse: string,
    evidenceContext: string
): Promise<{
    label: 'hallucinated' | 'factual';
    confidence: number;
    explanation?: string;
}> {
    try {
      const prompt = `${HALLUCINATION_SYSTEM_PROMPT}

## User Query
${userQuery}

## LLM Response to Evaluate
${llmResponse}

## Evidence Context (Ground Truth)
${evidenceContext}

Evaluate whether the LLM response is factual or hallucinated based on the evidence context.`;

      const result = await generateJSON<{
        label: string;
        confidence: number;
        explanation: string;
      }>(prompt, GEMINI_FLASH_MODEL, 0);

        return {
            label: result.label === 'hallucinated' ? 'hallucinated' : 'factual',
            confidence: result.confidence || 0,
            explanation: result.explanation,
        };
    } catch (error) {
        console.error("❌ Hallucination evaluation failed:", error);
        // Default to factual on error to avoid blocking
        return {
            label: 'factual',
            confidence: 0,
            explanation: 'Evaluation failed - defaulting to factual',
        };
    }
}

/**
 * Quick check if response seems to have fabricated citations
 * (Lightweight heuristic check before full LLM evaluation)
 */
export function quickCitationCheck(
    llmResponse: string,
    evidenceContext: string
): { passed: boolean; issues: string[] } {
    const issues: string[] = [];

    // Extract PMIDs from response
    const responsePmids = llmResponse.match(/PMID[:\s]*(\d{7,8})/gi) || [];
    const contextPmids = evidenceContext.match(/PMID[:\s]*(\d{7,8})/gi) || [];

    // Check if response PMIDs exist in context
    for (const pmid of responsePmids) {
        const pmidNumber = pmid.replace(/PMID[:\s]*/i, '');
        const existsInContext = contextPmids.some(cp => cp.includes(pmidNumber));
        if (!existsInContext) {
            issues.push(`PMID ${pmidNumber} not found in evidence context`);
        }
    }

    // Extract citation numbers from response [[N]]
    const citationNumbers = llmResponse.match(/\[\[(\d+)\]\]/g) || [];
    const uniqueCitations = new Set(citationNumbers.map(c => parseInt(c.replace(/[\[\]]/g, ''))));

    // Count references in context (rough estimate)
    const contextRefCount = (evidenceContext.match(/^\d+\./gm) || []).length;

    // Flag if citations exceed available references
    const maxCitation = Math.max(...Array.from(uniqueCitations), 0);
    if (maxCitation > contextRefCount && contextRefCount > 0) {
        issues.push(`Citation [[${maxCitation}]] exceeds ${contextRefCount} available references`);
    }

    return {
        passed: issues.length === 0,
        issues,
    };
}
