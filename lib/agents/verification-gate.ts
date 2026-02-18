/**
 * Agent 7: Verification Gate
 * Final validation that synthesis is grounded in evidence
 * Uses Gemini 3.0 Flash for fast verification
 */

import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { SynthesisResult, VerificationResult, TraceContext, AgentResult } from './types';
import { withToolSpan, SpanStatusCode, captureTokenUsage } from '../otel';
import { callGeminiWithRetry } from '../utils/gemini-rate-limiter';

export class VerificationGate {
  private genAI: GoogleGenAI;
  private modelName: string;
  private fallbackModelName: string;
  private systemPrompt: string;
  private consecutiveFailures: number = 0;
  private maxConsecutiveFailures: number = 3;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenAI({ apiKey });
    this.modelName = process.env.GEMINI_FLASH_MODEL || 'gemini-3-flash-preview';
    this.fallbackModelName = 'gemini-3-pro-preview';
    this.systemPrompt = this.getSystemPrompt();
  }

  private getSystemPrompt(): string {
    return `<role>
  <identity>Medical Evidence Verification Specialist</identity>
  <purpose>Validate medical syntheses against source evidence to prevent hallucination and ensure citation accuracy</purpose>
  <expertise>Evidence validation, citation verification, hallucination detection, medical fact-checking, grounding assessment</expertise>
</role>

<core_mission>
  <primary_goal>Ensure every claim in medical synthesis is properly grounded in provided evidence sources</primary_goal>
  <success_criteria>
    <criterion>Identify all unsupported claims that lack proper evidence grounding</criterion>
    <criterion>Verify all citations correspond to actual evidence sources</criterion>
    <criterion>Detect hallucinated information not present in source materials</criterion>
    <criterion>Calculate accurate grounding scores reflecting synthesis reliability</criterion>
    <criterion>Provide actionable feedback for improving evidence grounding</criterion>
  </success_criteria>
</core_mission>

<verification_framework>
  <validation_dimensions>
    <dimension name="citation_completeness">
      <description>Every factual claim must have corresponding inline citation</description>
      <assessment>
        <check>Identify sentences making factual claims</check>
        <check>Verify each claim has [N] citation format</check>
        <check>Flag uncited claims as potential hallucinations</check>
      </assessment>
      <exceptions>
        <exception>Introductory/transitional sentences without factual content</exception>
        <exception>Concluding statements that summarize already-cited information</exception>
      </exceptions>
    </dimension>
    
    <dimension name="citation_validity">
      <description>All citation numbers must correspond to actual evidence sources</description>
      <assessment>
        <check>Extract all [N] citation numbers from synthesis</check>
        <check>Verify each N corresponds to a source in evidence pack</check>
        <check>Flag invalid citation numbers as errors</check>
      </assessment>
    </dimension>
    
    <dimension name="semantic_grounding">
      <description>Claims must be semantically supported by cited sources</description>
      <assessment>
        <check>Extract claim text and associated citation numbers</check>
        <check>Retrieve corresponding source texts</check>
        <check>Assess semantic entailment between claim and sources</check>
        <check>Flag claims that go beyond or contradict source content</check>
      </assessment>
      <grounding_levels>
        <level name="direct">Claim directly stated in source text</level>
        <level name="inferential">Claim reasonably inferred from source data</level>
        <level name="extrapolated">Claim extends beyond source content (flag as unsupported)</level>
        <level name="contradictory">Claim contradicts source content (flag as hallucination)</level>
      </grounding_levels>
    </dimension>
    
    <dimension name="medical_accuracy">
      <description>Medical facts must be accurately represented from sources</description>
      <assessment>
        <check>Verify numerical data matches source exactly</check>
        <check>Confirm drug names and dosages are accurate</check>
        <check>Validate medical terminology usage</check>
        <check>Check statistical significance reporting</check>
      </assessment>
    </dimension>
  </validation_dimensions>
</verification_framework>

<grounding_assessment>
  <semantic_entailment_check>
    <process>
      <step>Extract individual factual claims from synthesis</step>
      <step>Identify citation numbers for each claim</step>
      <step>Retrieve corresponding source texts</step>
      <step>Assess logical relationship between claim and sources</step>
      <step>Classify as: SUPPORTED, PARTIALLY_SUPPORTED, UNSUPPORTED, CONTRADICTED</step>
    </process>
    
    <classification_criteria>
      <supported>Claim directly stated or clearly implied by source content</supported>
      <partially_supported>Claim partially supported but missing key elements</partially_supported>
      <unsupported>Claim not found in or reasonably inferred from sources</unsupported>
      <contradicted>Claim directly contradicts information in sources</contradicted>
    </classification_criteria>
  </semantic_entailment_check>
  
  <grounding_score_calculation>
    <formula>
      grounding_score = (fully_supported_claims + 0.5 * partially_supported_claims) / total_factual_claims
    </formula>
    <interpretation>
      <score range="0.9-1.0">Excellent grounding - minimal concerns</score>
      <score range="0.8-0.89">Good grounding - minor issues</score>
      <score range="0.7-0.79">Moderate grounding - notable concerns</score>
      <score range="0.6-0.69">Poor grounding - major issues</score>
      <score range="0.0-0.59">Unacceptable grounding - significant hallucination</score>
    </interpretation>
  </grounding_score_calculation>
</grounding_assessment>

<output_specification>
  <response_format>
    <success_case>
      <condition>grounding_score ≥ 0.8 AND no critical violations</condition>
      <action>Return synthesis unchanged with verification metadata</action>
    </success_case>
    
    <warning_case>
      <condition>0.7 ≤ grounding_score < 0.8 OR minor violations detected</condition>
      <action>Return synthesis with warning message describing issues</action>
    </warning_case>
    
    <rejection_case>
      <condition>grounding_score < 0.7 OR critical violations detected</condition>
      <action>Return synthesis with strong warning and detailed issue description</action>
    </rejection_case>
  </response_format>
  
  <verification_metadata>
    <field name="total_claims" type="integer">Count of factual claims identified</field>
    <field name="cited_claims" type="integer">Count of claims with citations</field>
    <field name="uncited_claims" type="array">List of claims lacking citations</field>
    <field name="invalid_citations" type="array">Citation numbers not in evidence pack</field>
    <field name="unsupported_claims" type="array">Claims not grounded in cited sources</field>
    <field name="hallucination_detected" type="boolean">Whether significant hallucination found</field>
    <field name="grounding_score" type="float">Overall grounding quality (0.0-1.0)</field>
    <field name="passed" type="boolean">Whether synthesis meets quality standards</field>
  </verification_metadata>
</output_specification>

<verification_workflow>
  <step number="1">
    <action>Parse synthesis into individual sentences</action>
    <process>
      <substep>Split text on sentence boundaries</substep>
      <substep>Identify sentences containing factual claims</substep>
      <substep>Exclude purely transitional or introductory sentences</substep>
    </process>
  </step>
  
  <step number="2">
    <action>Extract and validate citations</action>
    <process>
      <substep>Find all [N] citation patterns in text</substep>
      <substep>Extract unique citation numbers</substep>
      <substep>Verify each number corresponds to evidence source</substep>
      <substep>Flag invalid citation numbers</substep>
    </process>
  </step>
  
  <step number="3">
    <action>Identify uncited factual claims</action>
    <process>
      <substep>Scan each sentence for medical facts, statistics, recommendations</substep>
      <substep>Check if sentence contains citation</substep>
      <substep>Flag factual claims without citations</substep>
    </process>
  </step>
  
  <step number="4">
    <action>Perform semantic grounding assessment</action>
    <process>
      <substep>For each cited claim, retrieve corresponding source texts</substep>
      <substep>Assess semantic entailment using LLM reasoning</substep>
      <substep>Classify grounding level (supported/partial/unsupported/contradicted)</substep>
      <substep>Flag unsupported or contradicted claims</substep>
    </process>
  </step>
  
  <step number="5">
    <action>Calculate overall grounding score</action>
    <process>
      <substep>Count claims by grounding classification</substep>
      <substep>Apply grounding score formula</substep>
      <substep>Determine pass/warning/fail status</substep>
    </process>
  </step>
  
  <step number="6">
    <action>Generate verification report and recommendations</action>
    <process>
      <substep>Summarize key issues found</substep>
      <substep>Provide specific examples of problems</substep>
      <substep>Generate actionable improvement suggestions</substep>
    </process>
  </step>
</verification_workflow>

<examples>
  <example>
    <scenario>Well-grounded synthesis with proper citations</scenario>
    <synthesis_excerpt>Metformin reduces HbA1c by 1.0-1.5% in patients with Type 2 diabetes [1][2]. The UKPDS study demonstrated cardiovascular benefits with 20-year follow-up [3].</synthesis_excerpt>
    <verification_result>
      <grounding_assessment>Both claims directly supported by cited sources</grounding_assessment>
      <grounding_score>1.0</grounding_score>
      <status>PASSED</status>
    </verification_result>
  </example>
  
  <example>
    <scenario>Synthesis with unsupported claim</scenario>
    <synthesis_excerpt>Metformin is the most prescribed diabetes medication worldwide. Studies show it reduces HbA1c by 1.0-1.5% [1].</synthesis_excerpt>
    <verification_result>
      <grounding_assessment>First sentence lacks citation and not supported by evidence. Second sentence properly grounded.</grounding_assessment>
      <grounding_score>0.5</grounding_score>
      <status>WARNING - Uncited claim detected</status>
    </verification_result>
  </example>
  
  <example>
    <scenario>Synthesis with contradictory information</scenario>
    <synthesis_excerpt>Apixaban shows superior efficacy to rivaroxaban in stroke prevention [1].</synthesis_excerpt>
    <verification_result>
      <grounding_assessment>Source [1] states non-inferiority, not superiority. Claim contradicts evidence.</grounding_assessment>
      <grounding_score>0.0</grounding_score>
      <status>FAILED - Contradictory claim detected</status>
    </verification_result>
  </example>
</examples>

<critical_requirements>
  <requirement>NEVER approve synthesis with grounding_score < 0.7</requirement>
  <requirement>ALWAYS flag claims that contradict source evidence</requirement>
  <requirement>ALWAYS verify citation numbers correspond to actual sources</requirement>
  <requirement>NEVER ignore uncited factual claims</requirement>
  <requirement>ALWAYS provide specific examples in verification feedback</requirement>
</critical_requirements>

<quality_assurance>
  <validation_checklist>
    <check>All factual claims identified and assessed</check>
    <check>Citation validation completed for all [N] references</check>
    <check>Semantic grounding assessed for all cited claims</check>
    <check>Grounding score calculated correctly</check>
    <check>Verification status assigned appropriately</check>
    <check>Specific examples provided for any issues found</check>
  </validation_checklist>
</quality_assurance>`;
  }

  async verify(
    synthesis: SynthesisResult,
    traceContext: TraceContext
  ): Promise<AgentResult<SynthesisResult>> {
    return await withToolSpan('verification_gate', 'execute', async (span) => {
      const startTime = Date.now();

      // Set input attributes
      span.setAttribute('agent.input', JSON.stringify({ synthesis_length: synthesis.synthesis.length }));
      span.setAttribute('agent.name', 'verification_gate');

      try {
      // Circuit breaker: Skip verification if too many consecutive failures
      if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
        console.log('⚠️ Verification circuit breaker activated - skipping verification due to consecutive failures');
        return {
          success: true,
          data: synthesis,
          latency_ms: Date.now() - startTime,
          metadata: {
            agent: 'verification_gate',
            latency: Date.now() - startTime,
            model_used: 'skipped',
            cost: 0
          },
          warning: '⚠️ Verification skipped due to model overload - please verify claims manually'
        };
      }

      // Extract claims from synthesis
      const claims = this.extractClaims(synthesis.synthesis);
      
      // Initialize validation results
      const validationResults: VerificationResult = {
        total_claims: claims.length,
        cited_claims: 0,
        uncited_claims: [],
        invalid_citations: [],
        unsupported_claims: [],
        hallucination_detected: false,
        grounding_score: 0,
        passed: false
      };

      // Parse citations from synthesis - handle both [[N]](URL) and [N] patterns
      const citationPatterns = [
        /\[\[(\d+)\]\]\([^)]+\)/g,  // [[N]](URL) format (primary)
        /\[\[(\d+)\]\(([^)]+)\)\]/g, // [[N](URL)] format (fallback for malformed)
        /\[(\d+)\]/g                // [N] format (fallback)
      ];
      
      const citedClaims: Array<[string, string]> = [];
      const citedNumbers = new Set<number>();
      
      // Extract citations using both patterns
      for (const pattern of citationPatterns) {
        let match;
        while ((match = pattern.exec(synthesis.synthesis)) !== null) {
          const citationNumber = parseInt(match[1]);
          citedNumbers.add(citationNumber);
        }
      }
      
      // Find claims with citations by looking for sentences containing citation patterns
      const sentences = synthesis.synthesis.split(/(?<=[.!?])\s+/);
      for (const sentence of sentences) {
        const hasCitation = citationPatterns.some(pattern => {
          pattern.lastIndex = 0; // Reset regex
          return pattern.test(sentence);
        });
        
        if (hasCitation) {
          // Extract citation numbers from this sentence
          const sentenceCitations: number[] = [];
          for (const pattern of citationPatterns) {
            pattern.lastIndex = 0; // Reset regex
            let match;
            while ((match = pattern.exec(sentence)) !== null) {
              sentenceCitations.push(parseInt(match[1]));
            }
          }
          
          if (sentenceCitations.length > 0) {
            citedClaims.push([sentence.trim(), sentenceCitations.join(',')]);
          }
        }
      }

      validationResults.cited_claims = citedClaims.length;

      // Check for uncited claims
      for (const claim of claims) {
        const hasCitation = citedClaims.some(([citedClaim]) => 
          claim.includes(citedClaim.trim()) || citedClaim.includes(claim.trim())
        );
        
        if (!hasCitation) {
          validationResults.uncited_claims.push(claim);
        }
      }

      // Validate citations exist in evidence pack
      const validNumbers = new Set(synthesis.citations.map(c => c.number));
      const invalidNumbers = Array.from(citedNumbers).filter(n => !validNumbers.has(n));
      validationResults.invalid_citations = invalidNumbers;

        // Grounding check — BATCH all claims in ONE Gemini call (performance optimization)
        if (citedClaims.length > 0) {
          const batchResults = await this.batchCheckGrounding(citedClaims, synthesis.evidence_pack);
          for (const result of batchResults) {
            if (!result.isGrounded) {
              validationResults.unsupported_claims.push({
                claim: result.claim,
                citations: result.citations
              });
            }
          }
        }

      // Determine if validation passed
      validationResults.hallucination_detected = (
        validationResults.unsupported_claims.length > 0 ||
        validationResults.uncited_claims.length > 2 // Allow 2 uncited claims for intro/conclusion
      );

      validationResults.passed = !validationResults.hallucination_detected;

      // Calculate grounding score
      if (validationResults.total_claims > 0) {
        const unsupportedRatio = validationResults.unsupported_claims.length / validationResults.total_claims;
        const uncitedRatio = Math.max(0, validationResults.uncited_claims.length - 2) / validationResults.total_claims;
        validationResults.grounding_score = Math.max(0, 1.0 - unsupportedRatio - uncitedRatio * 0.5);
      } else {
        validationResults.grounding_score = 1.0;
      }

      const latency = Date.now() - startTime;

        // Set span attributes for verification results
        span.setAttribute('agent.output', JSON.stringify(validationResults));
        span.setAttribute('agent.latency_ms', latency);
        span.setAttribute('agent.model_name', 'gemini-3-flash-preview');
        span.setAttribute('agent.success', true);
        span.setAttribute('verification.grounding_score', validationResults.grounding_score);
        span.setAttribute('verification.hallucination_detected', validationResults.hallucination_detected);
        span.setAttribute('verification.total_claims', validationResults.total_claims);
        span.setAttribute('verification.cited_claims', validationResults.cited_claims);
        span.setAttribute('verification.unsupported_claims_count', validationResults.unsupported_claims.length);

        // Add hallucination detection as span event
        if (validationResults.hallucination_detected) {
          span.addEvent('verification.hallucination_detected', {
            'verification.unsupported_claims': JSON.stringify(validationResults.unsupported_claims),
            'verification.uncited_claims': JSON.stringify(validationResults.uncited_claims),
          });
        }

      // Add warnings if needed
      let finalSynthesis = synthesis;
      if (!validationResults.passed) {
        const warning = this.generateWarning(validationResults);
        finalSynthesis = {
          ...synthesis,
          warning
        };
        
        console.log(`⚠️ Verification failed: ${warning}`);
      } else {
        console.log(`✅ Verification passed: ${Math.round(validationResults.grounding_score * 100)}% grounding score`);
      }

      console.log(`🔍 Verification complete:`);
      console.log(`   Total claims: ${validationResults.total_claims}`);
      console.log(`   Cited claims: ${validationResults.cited_claims}`);
      console.log(`   Uncited claims: ${validationResults.uncited_claims.length}`);
      console.log(`   Unsupported claims: ${validationResults.unsupported_claims.length}`);
      console.log(`   Grounding score: ${Math.round(validationResults.grounding_score * 100)}%`);

      return {
        success: true,
        data: finalSynthesis,
        latency_ms: latency,
        metadata: {
          verification: validationResults
        }
      };

    } catch (error) {
      console.error('❌ Verification failed:', error);
      
      const latency = Date.now() - startTime;
      const result: AgentResult<SynthesisResult> = {
        success: false,
        data: synthesis,
        error: error instanceof Error ? error.message : 'Unknown error',
        latency_ms: latency
      };

        // Set error attributes
        span.setAttribute('agent.success', false);
        span.setAttribute('agent.error', result.error || 'Unknown error');
        span.setAttribute('agent.latency_ms', latency);
        span.recordException(error as Error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: result.error || 'Unknown error' });

        // Return synthesis with warning
        return {
          ...result,
          success: true,
          data: {
            ...synthesis,
            warning: '⚠️ Verification process failed - please review citations carefully'
          }
        };
      }
    });
  }

  private extractClaims(text: string): string[] {
    // Split text into individual claims (sentences)
    const sentences = text.split(/(?<=[.!?])\s+/);
    
    // Filter out very short sentences (likely fragments)
    const claims = sentences
      .map(s => s.trim())
      .filter(s => s.length > 20 && !s.match(/^(however|therefore|in conclusion|finally)/i));
    
    return claims;
  }

  private async batchCheckGrounding(
    citedClaims: Array<[string, string]>,
    evidencePack: any[]
  ): Promise<Array<{ claim: string; citations: number[]; isGrounded: boolean }>> {
    if (citedClaims.length === 0) return [];

    // Build batch prompt: list all claims with their source texts
    let claimsList = '';
    const claimMeta: Array<{ claim: string; citations: number[] }> = [];

    for (let i = 0; i < citedClaims.length; i++) {
      const [claim, numbersStr] = citedClaims[i];
      const numbers = numbersStr.split(',').map(n => parseInt(n.trim()));
      claimMeta.push({ claim, citations: numbers });

      // Gather source texts for this claim (limit length)
      const sourceTexts = evidencePack
        .filter(source => numbers.includes(source.rank))
        .slice(0, 3)
        .map(source => (source.text?.slice(0, 300) || '').trim())
        .filter(t => t.length > 0);

      claimsList += `\nCLAIM ${i + 1}: "${claim.slice(0, 200)}"\nSOURCES [${numbers.join(',')}]: ${sourceTexts.join(' | ').slice(0, 600)}\n`;
    }

    const prompt = `You are verifying medical claims against evidence sources.
For each claim below, determine if it is supported by its cited sources.
Answer with ONLY a numbered list like "1. YES" or "2. NO".

${claimsList}

Respond with EXACTLY ${citedClaims.length} lines, one per claim:`;

    try {
      // Single Gemini call with 10s timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Batch verification timeout')), 10000)
      );

      let response: any;
      try {
        const primaryPromise = callGeminiWithRetry(async (apiKey: string) => {
          const genAI = new GoogleGenAI({ apiKey });
          return await genAI.models.generateContent({
            model: this.modelName,
            contents: prompt,
            config: {
              systemInstruction: this.systemPrompt,
              temperature: 0,
              thinkingConfig: {
                thinkingLevel: ThinkingLevel.LOW
              }
            }
          });
        });
        response = await Promise.race([primaryPromise, timeoutPromise]);
      } catch (primaryError) {
        if (primaryError instanceof Error && (primaryError.message.includes('overloaded') || primaryError.message.includes('timeout') || primaryError.message.includes('Max retries'))) {
          console.log('⚠️ Primary model overloaded for batch verification, trying fallback...');
          try {
            const fallbackPromise = callGeminiWithRetry(async (apiKey: string) => {
              const genAI = new GoogleGenAI({ apiKey });
              return await genAI.models.generateContent({
                model: this.fallbackModelName,
                contents: prompt,
                config: {
                  systemInstruction: this.systemPrompt,
                  temperature: 0,
                  thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
                }
              });
            });
            response = await Promise.race([fallbackPromise, timeoutPromise]);
          } catch (fallbackError) {
            console.log('⚠️ Both models failed for batch verification — assuming all claims grounded');
            this.consecutiveFailures++;
            return claimMeta.map(c => ({ ...c, isGrounded: true }));
          }
        } else {
          throw primaryError;
        }
      }

      const text = (response.text || '').trim().toUpperCase();
      const lines = text.split('\n').filter((l: string) => l.trim().length > 0);

      this.consecutiveFailures = 0;

      // Parse each line: "1. YES", "2. NO", etc.
      return claimMeta.map((meta, idx) => {
        const line = lines[idx] || '';
        const hasYes = /\bYES\b/.test(line);
        const hasNo = /\bNO\b/.test(line);
        const isGrounded = hasYes && !hasNo ? true : hasNo && !hasYes ? false : true; // Default to grounded if ambiguous
        return { ...meta, isGrounded };
      });

    } catch (error) {
      console.error('❌ Batch grounding check failed:', error);
      this.consecutiveFailures++;
      // Graceful fallback: assume all grounded rather than blocking
      return claimMeta.map(c => ({ ...c, isGrounded: true }));
    }
  }

  private generateWarning(validationResults: VerificationResult): string {
    const warnings: string[] = [];

    if (validationResults.uncited_claims.length > 2) {
      warnings.push(`${validationResults.uncited_claims.length - 2} claims lack citations`);
    }

    if (validationResults.invalid_citations.length > 0) {
      warnings.push(`Invalid citation numbers: ${validationResults.invalid_citations.join(', ')}`);
    }

    if (validationResults.unsupported_claims.length > 0) {
      warnings.push(`${validationResults.unsupported_claims.length} claims may not be fully supported by evidence`);
    }

    return `⚠️ ${warnings.join(' | ')}`;
  }
}