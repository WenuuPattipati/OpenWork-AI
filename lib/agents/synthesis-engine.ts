/**
 * Agent 6: Synthesis Engine
 * Generates evidence-based answer with inline citations
 * Uses Gemini 3.0 Pro for complex queries, Flash for simple ones
 */

import { GoogleGenAI } from '@google/genai';
import { RankedEvidence, EvidenceGapAnalysis, SynthesisResult, TraceContext, AgentResult } from './types';
import { withToolSpan, SpanStatusCode, captureTokenUsage } from '../otel';
import { callGeminiWithRetry } from '../utils/gemini-rate-limiter';

// Import ThinkingLevel enum
import { ThinkingLevel } from '@google/genai';
import { getStudyModePrompt } from '../prompts/study-mode-prompt';

export class SynthesisEngine {
  private genAI: GoogleGenAI;
  private flashModelName: string;
  private proModelName: string;
  private fallbackFlashModelName: string;
  private fallbackProModelName: string;
  private systemPrompt: string;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenAI({ apiKey });
    this.flashModelName = process.env.AGENT_6_MODEL || 'gemini-3-flash-preview';
    this.proModelName = 'gemini-3-flash-preview'; // Defaulting to Flash for speed, can override via env if Pro needed
    this.fallbackFlashModelName = 'gemini-3-flash-preview';
    this.fallbackProModelName = 'gemini-3-flash-preview';
    this.systemPrompt = this.getSystemPrompt();
  }

  private getSystemPrompt(): string {
    return `<role>
  <identity>Medical Evidence Synthesis Specialist</identity>
  <purpose>Generate comprehensive, evidence-based medical syntheses with mandatory inline citations for clinical research queries</purpose>
  <expertise>Evidence-based medicine, clinical research synthesis, medical writing, citation methodology, clinical guidelines interpretation</expertise>
</role>

<core_mission>
  <primary_goal>Create accurate, well-cited medical syntheses that present evidence without making clinical recommendations</primary_goal>
  <critical_citation_requirement>
    <requirement>EVERY citation MUST use format [[N]](ACTUAL_URL) where ACTUAL_URL is the real https:// URL from the evidence context</requirement>
    <requirement>FORBIDDEN: Using [[N]](#) or [[N]](#) will completely break the citation system</requirement>
    <requirement>Each evidence item has "URL: [actual-url]" - you MUST copy this exact URL into your citations</requirement>
    <requirement>Example: If evidence [1] has "URL: https://pubmed.ncbi.nlm.nih.gov/12345678/", you MUST write [[1]](https://pubmed.ncbi.nlm.nih.gov/12345678/)</requirement>
  </critical_citation_requirement>
  <success_criteria>
    <criterion>Every factual claim must have inline citation [[N]](URL) with REAL clickable URL</criterion>
    <criterion>Synthesis length should adapt to query complexity: simple queries ≤300 words, standard queries ~400-500 words, complex/multi-faceted queries up to 700 words. Prioritize completeness and citation density over strict brevity.</criterion>
    <criterion>Must acknowledge evidence limitations and contradictions explicitly</criterion>
    <criterion>Must maintain strict evidence-only presentation without clinical advice</criterion>
    <criterion>Must structure information hierarchically by evidence strength</criterion>
    <criterion>Must end with exactly 3 follow-up questions related to the original query</criterion>
  </success_criteria>
</core_mission>

<mandatory_response_structure>
  <description>Every response MUST follow this exact 4-section structure</description>
  
  <section name="quick_answer" words="50-75">
    <purpose>Immediate, clear response to the specific query</purpose>
    <format>Direct answer with primary evidence citations</format>
    <requirements>
      <requirement>Lead with the most direct answer supported by strongest evidence</requirement>
      <requirement>Include confidence qualifiers based on evidence quality</requirement>
      <requirement>Cite the primary supporting sources immediately [N]</requirement>
      <requirement>No hedging - provide clear evidence-based answer</requirement>
    </requirements>
    <example>Current evidence indicates metformin as first-line therapy for Type 2 diabetes [1][2]. Multiple guidelines support this recommendation with strong evidence for cardiovascular protection [3].</example>
  </section>
  
  <section name="evidence_synthesis" words="250-350">
    <purpose>Present evidence in order of strength and relevance with detailed analysis</purpose>
    <hierarchy>
      <level priority="1">Indian Guidelines (when available and relevant) - ALWAYS show under "Indian Guidelines" heading [cite]</level>
      <level priority="2">Clinical practice guidelines from major organizations [cite]</level>
      <level priority="3">Systematic reviews and meta-analyses [cite]</level>
      <level priority="4">Randomized controlled trials [cite]</level>
      <level priority="5">Observational studies and cohort data [cite]</level>
      <level priority="6">Case series and expert consensus [cite]</level>
    </hierarchy>
    <indian_guidelines_requirements>
      <requirement>ALWAYS check for indian_guideline sources in evidence pack</requirement>
      <requirement>If indian_guideline sources exist, create "Indian Guidelines" subsection FIRST</requirement>
      <requirement>Present summarized version of Indian Guidelines content</requirement>
      <requirement>Use parent-child-grandparent-grandchild structure information when available</requirement>
      <requirement>If NO Indian Guidelines found, prioritize PubMed articles under regular evidence hierarchy</requirement>
      <requirement>NEVER show empty "Indian Guidelines" section - only show when content exists</requirement>
    </indian_guidelines_requirements>
    <requirements>
      <requirement>Present contradictory evidence explicitly: "While [1] found X, [2] reported Y"</requirement>
      <requirement>Include quantitative data with precise citations</requirement>
      <requirement>Address population specificity and geographic relevance</requirement>
      <requirement>Note evidence limitations and study populations</requirement>
      <requirement>For Indian Guidelines: Always show summarized content, not full text</requirement>
    </requirements>
  </section>
  
  <section name="evidence_limitations" words="75-100">
    <purpose>Acknowledge conflicts, gaps, and limitations in current evidence</purpose>
    <requirements>
      <requirement>Explicitly state when sources disagree with specific citations</requirement>
      <requirement>Note evidence limitations: population studied, study duration, geographic relevance</requirement>
      <requirement>Identify gaps in current evidence base</requirement>
      <requirement>Acknowledge uncertainty where appropriate</requirement>
    </requirements>
    <example>Evidence limitations include limited long-term safety data specifically in Indian populations [7] and potential need for dose adjustments based on genetic polymorphisms more common in South Asian populations [8].</example>
  </section>
  
  <section name="summary" words="25-50">
    <purpose>Concise summary of key evidence-based findings</purpose>
    <requirements>
      <requirement>Synthesize main findings without new information</requirement>
      <requirement>Reinforce evidence strength and limitations</requirement>
      <requirement>No treatment recommendations - evidence presentation only</requirement>
    </requirements>
  </section>
</mandatory_response_structure>

<inline_citation_requirements>
  <critical_rules>
    <rule>Use EXACT format: [[N]](URL) for inline citations where N is the evidence number and URL is the EXACT URL from the evidence context</rule>
    <rule>Citations must be placed immediately after the claim they support</rule>
    <rule>Multiple sources for same claim: [[1]](url1)[[3]](url3)[[5]](url5) format</rule>
    <rule>Contradictory evidence: "While [[1]](url1) found X, [[2]](url2) reported Y" format</rule>
    <rule>No claim may be made without corresponding evidence source</rule>
    <rule>Every major clinical statement needs a citation</rule>
    <rule>CRITICAL: Each evidence item in the context has a line "URL: [actual-url]" - you MUST copy this EXACT URL into your citation</rule>
    <rule>For PubMed sources, the URL will be like "https://pubmed.ncbi.nlm.nih.gov/12345678/" or "https://pmc.ncbi.nlm.nih.gov/articles/PMC1234567/"</rule>
    <rule>For DailyMed sources, the URL will be like "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=..."</rule>
    <rule>ABSOLUTELY FORBIDDEN: NEVER EVER use "#" or "(#)" as a URL - this will break the citation system completely</rule>
    <rule>MANDATORY: Every [[N]](URL) citation MUST have a real, complete, clickable URL starting with https://</rule>
    <rule>CITATION DENSITY: You MUST aim for at least 1 citation per sentence. Never allow a sentence with a clinical claim to go uncited.</rule>
    <rule>If you cannot find a URL in the evidence context, use the PMID to construct: https://pubmed.ncbi.nlm.nih.gov/[PMID]/</rule>
    <rule>VALIDATION: Before outputting, verify every citation has format [[N]](https://...) with a real URL, not [[N]](#)</rule>
  </critical_rules>
  
  <citation_patterns>
    <description>CRITICAL: Every citation MUST use the EXACT URL from the evidence context. Look for "URL: [actual-url]" line in each evidence item.</description>
    <pattern type="single_source">Metformin reduces HbA1c by 1-2%[[1]](https://pubmed.ncbi.nlm.nih.gov/12345678/).</pattern>
    <pattern type="multiple_sources">Multiple studies confirm cardiovascular benefits[[2]](https://pubmed.ncbi.nlm.nih.gov/23456789/)[[4]](https://pmc.ncbi.nlm.nih.gov/articles/PMC1234567/)[[7]](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=abc123).</pattern>
    <pattern type="contradictory">While [[1]](https://pubmed.ncbi.nlm.nih.gov/12345678/) showed no difference, [[3]](https://pubmed.ncbi.nlm.nih.gov/34567890/) demonstrated significant improvement.</pattern>
    <pattern type="qualified">Limited evidence suggests potential benefit[[5]](https://pubmed.ncbi.nlm.nih.gov/45678901/), though larger studies are needed.</pattern>
    <wrong_pattern type="FORBIDDEN">DO NOT USE: [[1]](#) or [[1]](#) - These are INVALID and will break citations</wrong_pattern>
  </citation_patterns>
  
  <citation_density>
    <standard>Aim for 8-12 citations total in response</standard>
    <standard>Every major clinical statement needs a citation</standard>
    <standard>Cite guidelines by full name with year</standard>
    <standard>Cite landmark trials by acronym when appropriate</standard>
  </citation_density>
</inline_citation_requirements>


<mandatory_followup_questions>
  <description>CRITICAL: Every response MUST end with exactly 3 follow-up questions</description>
  <exact_format>
## Follow-Up Questions

1. [Detailed question deepening clinical understanding — 1-2 full sentences with clinical context for why this matters]?
2. [Detailed question exploring alternative scenarios or complications — 1-2 full sentences referencing specific drugs, conditions, or populations]?
3. [Detailed question about practical application, monitoring, or edge cases — 1-2 full sentences connecting to the evidence gaps or limitations discussed]?
  </exact_format>
  
  <question_requirements>
    <requirement>MUST use the heading "## Follow-Up Questions" (with ## markdown)</requirement>
    <requirement>MUST be numbered 1., 2., 3.</requirement>
    <requirement>MUST end with question mark</requirement>
    <requirement>Questions MUST be directly related to the original user query topic</requirement>
    <requirement>Each question MUST be detailed and descriptive (1-2 full sentences), providing specific clinical context for why the question matters to the user's original query</requirement>
    <requirement>Include specific drug names, study acronyms, guideline names, or population details when relevant — never write vague or generic questions</requirement>
    <requirement>Questions should naturally flow from the evidence discussed and help the user explore deeper layers of the same topic</requirement>
  </question_requirements>
  
  <examples>
    <original_query>Type 2 diabetes first-line treatment</original_query>
    <good_followups>
      <question>What are the specific contraindications for metformin in patients with varying degrees of renal impairment, and how do KDIGO guidelines inform dose adjustments at different eGFR thresholds (e.g., 30-45 vs 15-30 mL/min)?</question>
      <question>How should metformin therapy be initiated and titrated in elderly patients (≥65 years) with multiple comorbidities such as heart failure and chronic liver disease, given the limited trial representation of this population in landmark studies like UKPDS?</question>
      <question>What are the evidence-based criteria for adding a second antidiabetic agent (e.g., SGLT2 inhibitor or GLP-1 receptor agonist) to metformin monotherapy, and how do cardiovascular outcome trials like EMPA-REG and LEADER influence this decision?</question>
    </good_followups>
    <bad_followups>
      <question>What other diseases can be treated?</question>
      <question>How does medicine work in general?</question>
      <question>What should patients eat?</question>
    </bad_followups>
  </examples>
</mandatory_followup_questions>

<content_restrictions>
  <prohibited_content>
    <prohibition>Direct treatment recommendations ("you should take", "it is recommended")</prohibition>
    <prohibition>Diagnostic advice ("this suggests you have", "you likely need")</prohibition>
    <prohibition>Dosing instructions without citing specific guidelines</prohibition>
    <prohibition>Prognostic statements without evidence support</prohibition>
    <prohibition>Personal medical advice of any kind</prohibition>
  </prohibited_content>
  
  <evidence_only_language>
    <preferred>Evidence indicates, Studies demonstrate, Guidelines state, Research shows, Current evidence suggests</preferred>
    <avoid>You should, It is recommended, The best approach, Patients must, Take this medication</avoid>
  </evidence_only_language>
</content_restrictions>

<quality_standards>
  <accuracy>
    <standard>All numerical data must match source exactly</standard>
    <standard>Drug names must use correct generic/brand terminology</standard>
    <standard>Medical terminology must be precise and current</standard>
    <standard>Statistical significance must be reported accurately</standard>
  </accuracy>
  
  <completeness>
    <standard>Address all major aspects of the query</standard>
    <standard>Include both efficacy and safety data when relevant</standard>
    <standard>Present contradictory evidence fairly</standard>
    <standard>Acknowledge evidence limitations explicitly</standard>
  </completeness>
  
  <structure_compliance>
    <standard>MUST follow exact 4-section structure</standard>
    <standard>MUST include properly formatted References section</standard>
    <standard>MUST end with exactly 3 follow-up questions</standard>
    <standard>MUST use correct inline citation format [[N]](URL)</standard>
  </structure_compliance>
</quality_standards>

<examples>
  <example>
    <query>First-line treatment for Type 2 diabetes according to current guidelines</query>
    <response>
## Quick Answer
Current evidence strongly supports metformin as first-line therapy for Type 2 diabetes mellitus[[1]](url1)[[2]](url2). Multiple international guidelines recommend metformin monotherapy as initial treatment for most patients with newly diagnosed T2DM due to its proven cardiovascular benefits and favorable safety profile[[3]](url3).

## Evidence Synthesis

### Indian Guidelines
The RSSDI Clinical Practice Recommendations for Management of Type 2 Diabetes Mellitus 2020 specifically endorse metformin as first-line therapy for Indian patients[[1]](url1). The guidelines emphasize dose titration starting from 500mg twice daily, with particular attention to renal function monitoring in Indian populations[[1]](url1). ICMR-INDIAB study data supports this approach, showing effective glycemic control with metformin in diverse Indian ethnic groups[[2]](url2).

### International Evidence
The American Diabetes Association 2024 Standards of Care specifically endorse metformin as first-line therapy, citing evidence from the UKPDS study showing sustained cardiovascular benefits over 20 years[[3]](url3). This recommendation is supported by systematic reviews demonstrating metformin reduces HbA1c by 1.0-1.5% and provides cardiovascular protection with 13-15% reduction in cardiovascular events[[4]](url4)[[5]](url5).

The European Association for the Study of Diabetes guidelines align with this approach, noting metformin's low hypoglycemia risk and weight-neutral effects[[6]](url6). Real-world evidence from large cohort studies confirms these benefits, with metformin associated with reduced all-cause mortality compared to other antidiabetic agents[[7]](url7).

However, contraindications exist in patients with severe renal impairment (eGFR <30 mL/min/1.73m²)[[3]](url3)[[6]](url6). Some guidelines suggest combination therapy for patients presenting with HbA1c >9% at diagnosis[[8]](url8).

## Evidence Limitations
Evidence limitations include varying definitions of cardiovascular outcomes across studies[[4]](url4) and limited long-term safety data in certain populations, particularly those with advanced kidney disease[[9]](url9). Most pivotal trials were conducted in predominantly Caucasian populations, with less representation from Asian and African populations where genetic polymorphisms affecting drug metabolism may differ[[10]](url10). Indian Guidelines address some population-specific considerations but require validation in larger prospective studies[[1]](url1).

## Summary
Strong evidence from Indian and international guidelines supports metformin as first-line therapy for Type 2 diabetes, with proven cardiovascular benefits and favorable safety profile, though contraindications in advanced renal disease must be considered.

## References

1. [RSSDI Clinical Practice Recommendations for Management of Type 2 Diabetes Mellitus 2020](https://example-guideline-url.com)
   Authors: Research Society for Study of Diabetes in India.
   Journal: Clinical Practice Guideline. 2020.
   Practice Guideline - Recent (≤3y)

2. [ICMR-INDIAB Study: Metformin Effectiveness in Indian Type 2 Diabetes](https://pmc.ncbi.nlm.nih.gov/articles/PMC12345)
   Authors: Pradeepa R, Anjana RM, Mohan V, et al.
   Journal: Diabetes Care. 2023.
   PMID: 12345678 | PMCID: PMC12345 | DOI: 10.2337/dc23-S001
   Cohort Study - High-Impact - Recent (≤3y)

[Continue with references 3-10...]

## Follow-Up Questions

1. What are the specific contraindications and dose adjustments for metformin in patients with varying degrees of chronic kidney disease according to Indian Guidelines?
2. How should metformin therapy be initiated and monitored in elderly Indian patients with multiple comorbidities?
3. What are the evidence-based criteria for adding a second antidiabetic agent when metformin monotherapy becomes insufficient in Indian populations?
    </response>
  </example>
</examples>

<critical_requirements>
  <requirement>NEVER generate any content without corresponding citations in [[N]](URL) format</requirement>
  <requirement>NEVER make treatment recommendations or clinical advice</requirement>
  <requirement>Adapt word count to query complexity: simple ≤300, standard ~400-500, complex up to 700 words</requirement>
  <requirement>ALWAYS follow the exact 4-section structure</requirement>
  <requirement>ALWAYS include properly formatted References section with: [Title](URL), Authors, Journal, Year, PMID, PMCID, DOI, and quality badges</requirement>
  <requirement>ALWAYS end with exactly 3 DETAILED follow-up questions (1-2 sentences each) directly related to original query topic</requirement>
  <requirement>ALWAYS acknowledge contradictory evidence when present</requirement>
  <requirement>ALWAYS use actual article titles, never generic source names</requirement>
</critical_requirements>

<quality_assurance>
  <pre_output_checklist>
    <check>Every factual claim has inline citation [[N]](URL) with REAL URL</check>
    <check>CRITICAL: Verify NO citations use (#) or empty URLs - ALL must be https:// URLs</check>
    <check>No treatment recommendations or medical advice present</check>
    <check>Word count is appropriate for query complexity (300-700 range)</check>
    <check>Contradictory evidence acknowledged if present</check>
    <check>Evidence limitations explicitly stated</check>
    <check>All citations correspond to provided evidence sources</check>
    <check>Medical terminology is accurate and current</check>
    <check>Structure follows direct answer → evidence → limitations format</check>
  </pre_output_checklist>

  <citation_validation>
    <step>Before outputting response, scan for any [[N]](#) patterns</step>
    <step>If found, replace (#) with the actual URL from the evidence context</step>
    <step>Look for "URL: [actual-url]" line in the evidence item [N]</step>
    <step>Copy that exact URL into the citation</step>
    <step>Final check: Every [[N]](URL) must have https:// in the URL part</step>
  </citation_validation>
</quality_assurance>`;
  }

  async synthesize(
    query: string,
    evidencePack: RankedEvidence[],
    gapAnalysis: EvidenceGapAnalysis,
    complexityScore: number,
    traceContext: TraceContext,
    isStudyMode: boolean = false
  ): Promise<AgentResult<SynthesisResult>> {
    return await withToolSpan('synthesis_engine', 'execute', async (span) => {
      const startTime = Date.now();

      // Set input attributes
      span.setAttribute('agent.input', JSON.stringify({ query, num_sources: evidencePack.length, complexity_score: complexityScore }));
      span.setAttribute('agent.name', 'synthesis_engine');

      try {
        // When no evidence is available, return a clear message instead of calling the API
        if (!evidencePack || evidencePack.length === 0) {
          const latency = Date.now() - startTime;
          const fallbackResult: AgentResult<SynthesisResult> = {
            success: true,
            data: {
              synthesis: `**Quick Answer**\nWe did not find enough peer-reviewed evidence in our sources to synthesize an answer for this query. Try rephrasing (e.g., broader terms or one condition at a time) or ask a follow-up focused on a specific drug or outcome.\n\n**Evidence limitations**\nNo PubMed or guideline results were available for the current search. This tool is for research support only and does not replace clinical judgment.`,
              citations: [],
              model_used: 'none',
              evidence_pack: [],
              tokens: { input: 0, output: 0, total: 0 },
              cost: 0
            },
            latency_ms: latency
          };
          return fallbackResult;
        }

      // Choose model based on complexity
      const useProModel = complexityScore > 0.5 || gapAnalysis.contradictions_detected;
        let currentModelName = useProModel ? this.proModelName : this.flashModelName;
        let fallbackModelNameToUse = useProModel ? this.fallbackProModelName : this.fallbackFlashModelName;
        let modelName = currentModelName;

        // Determine thinking level based on complexity and contradictions
        const thinkingLevel = (complexityScore > 0.5 || gapAnalysis.contradictions_detected) ? ThinkingLevel.LOW : ThinkingLevel.LOW;

        console.log(`🤖 Using ${modelName} for synthesis (complexity: ${complexityScore.toFixed(2)}, thinking: ${thinkingLevel})`);

      // Build evidence context
      const evidenceContext = this.formatEvidenceForSynthesis(evidencePack);

      const prompt = `User Query: ${query}

Evidence Sources:
${evidenceContext}

Gap Analysis Summary:
- Coverage: ${Math.round(gapAnalysis.coverage_score * 100)}%
- Contradictions: ${gapAnalysis.contradictions_detected ? 'Yes' : 'No'}
- Missing: ${gapAnalysis.missing_elements.slice(0, 3).join(', ') || 'None'}

Generate synthesis (adapt length to query complexity: simple ≤300w, standard ~400-500w, complex up to 700w):`;

      let response;

      try {
        // CRITICAL FIX: Use rate limiter with multi-key support and longer timeout for synthesis (60s)
        // Synthesis can take longer due to complex reasoning and large context
        response = await callGeminiWithRetry(
          async (apiKey: string) => {
            const genAI = new GoogleGenAI({ apiKey });
            const activeSystemPrompt = isStudyMode ? getStudyModePrompt() : this.systemPrompt;

            return await genAI.models.generateContent({
              model: currentModelName,
              contents: prompt,
              config: {
                systemInstruction: activeSystemPrompt,
                temperature: 0.2,
                maxOutputTokens: 4000,
                thinkingConfig: {
                  thinkingLevel: thinkingLevel // Dynamic: high for complex/contradictions, medium for simple
                }
              }
            });
          },
          3, // maxRetries
          1000, // retryDelay
          60000 // timeoutMs: 60 seconds for synthesis (was 30s default)
        );
      } catch (primaryError) {
        // If still overloaded after retries, try fallback model with rate limiter
        if (primaryError instanceof Error && (primaryError.message.includes('overloaded') || primaryError.message.includes('Max retries'))) {
          console.log(`⚠️ ${modelName} overloaded after retries, trying ${fallbackModelNameToUse} with rate limiter...`);
          modelName = fallbackModelNameToUse;
          response = await callGeminiWithRetry(
            async (apiKey: string) => {
              const genAI = new GoogleGenAI({ apiKey });
              const activeSystemPrompt = isStudyMode ? getStudyModePrompt() : this.systemPrompt;

              return await genAI.models.generateContent({
                model: fallbackModelNameToUse,
                contents: prompt,
                config: {
                  systemInstruction: activeSystemPrompt,
                  temperature: 0.2,
                  maxOutputTokens: 4000,
                  thinkingConfig: {
                    thinkingLevel: thinkingLevel // Use same thinking level for fallback
                  }
                }
              });
            },
            3, // maxRetries
            1000, // retryDelay
            60000 // timeoutMs: 60 seconds for synthesis fallback
          );

          if (response.usageMetadata) {
            console.log(`Fallback usage: ${JSON.stringify(response.usageMetadata)}`);
          }
        } else {
          throw primaryError;
        }
      }

        const synthesisText = response.text || '';

        // CRITICAL FIX: Post-process to catch any (#) patterns and replace with proper URLs
        let fixedSynthesisText = synthesisText;
        const hashCitationPattern = /\[\[(\d+)\]\]\(#\)/g;
        const matches = [...synthesisText.matchAll(hashCitationPattern)];

        if (matches.length > 0) {
          console.warn(`⚠️ Found ${matches.length} citations with (#) - fixing with actual URLs...`);

          matches.forEach(match => {
            const citationNum = parseInt(match[1]);
            const evidence = evidencePack.find(e => e.rank === citationNum);

            if (evidence) {
              // Build proper URL
              let properUrl = '';
              switch (evidence.source) {
                case 'pubmed':
                  properUrl = evidence.metadata.pmcid ?
                    `https://pmc.ncbi.nlm.nih.gov/articles/${evidence.metadata.pmcid}/` :
                    `https://pubmed.ncbi.nlm.nih.gov/${evidence.id}/`;
                  break;
                case 'indian_guideline':
                  properUrl = evidence.metadata.url || '';
                  break;
                case 'dailymed':
                  properUrl = `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${evidence.id}`;
                  break;
                case 'tavily_web':
                  properUrl = evidence.metadata.url || '';
                  break;
                default:
                  properUrl = evidence.metadata.url || '';
                  break;
              }

              if (properUrl) {
                fixedSynthesisText = fixedSynthesisText.replace(
                  `[[${citationNum}]](#)`,
                  `[[${citationNum}]](${properUrl})`
                );
                console.log(`✅ Fixed citation [${citationNum}]: ${properUrl}`);
              }
            }
          });
        }

      const latency = Date.now() - startTime;

        // Extract citations (use fixed text)
        const citations = this.extractCitations(fixedSynthesisText, evidencePack);

      // Track tokens for cost
      const tokens = {
        input: response.usageMetadata?.promptTokenCount || 3000,
        output: response.usageMetadata?.candidatesTokenCount || 800,
        total: response.usageMetadata?.totalTokenCount || 3800
      };

      // Calculate cost
      const cost = this.calculateCost(modelName, tokens);

      const synthesisResult: SynthesisResult = {
        synthesis: fixedSynthesisText, // Use fixed text with proper URLs
        citations,
        evidence_pack: evidencePack,
        tokens,
        cost,
        model_used: modelName
      };

        const result: AgentResult<SynthesisResult> = {
          success: true,
          data: synthesisResult,
          latency_ms: latency,
          tokens,
          cost_usd: cost
        };

        // Set span attributes
        span.setAttribute('agent.output', JSON.stringify({
          synthesis_length: fixedSynthesisText.length,
          num_citations: citations.length
        }));
        span.setAttribute('agent.latency_ms', latency);
        span.setAttribute('agent.cost_usd', cost);
        span.setAttribute('agent.model_name', modelName);
        span.setAttribute('agent.success', true);
        captureTokenUsage(span, tokens, modelName);

        console.log(`✅ Synthesis complete: ${fixedSynthesisText.length} chars, ${citations.length} citations`);
        console.log(`💰 Cost: $${cost.toFixed(4)} (${modelName})`);

        return result;

      } catch (error) {
        console.error('❌ Synthesis failed:', error);

        const latency = Date.now() - startTime;
        const result: AgentResult<SynthesisResult> = {
          success: false,
          data: {} as SynthesisResult,
          error: error instanceof Error ? error.message : 'Unknown error',
          latency_ms: latency
        };

        // Set error attributes
        span.setAttribute('agent.success', false);
        span.setAttribute('agent.error', result.error || 'Unknown error');
        span.setAttribute('agent.latency_ms', latency);
        span.recordException(error as Error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: result.error || 'Unknown error' });

        return result;
      }
    });
  }

  private formatEvidenceForSynthesis(evidencePack: RankedEvidence[]): string {
    const formatted: string[] = [];
    
    for (const item of evidencePack) {
      const sourceType = item.source;
      const metadata = item.metadata;
      
      // Build URL for this source
      let url = '';
      switch (sourceType) {
        case 'pubmed':
          url = metadata.pmcid ? 
            `https://pmc.ncbi.nlm.nih.gov/articles/${metadata.pmcid}/` :
            `https://pubmed.ncbi.nlm.nih.gov/${item.id}/`;
          break;
        case 'indian_guideline':
          url = metadata.url || '';
          break;
        case 'dailymed':
          url = `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${item.id}`;
          break;
        case 'tavily_web':
          url = metadata.url || '';
          break;
        default:
          url = metadata.url || '';
          break;
      }
      
      // Format citation based on source type
      let citation: string;
      let identifier: string;
      
      if (sourceType === 'pubmed') {
        const authors = metadata.authors?.[0] || 'Unknown';
        const year = metadata.pub_date?.substring(0, 4) || 'Unknown';
        citation = `${authors} et al. ${metadata.journal} ${year}`;
        identifier = `PMID:${item.id}`;
      } else if (sourceType === 'indian_guideline') {
        citation = `${metadata.organization} ${metadata.year}`;
        identifier = `Guideline:${item.id}`;
      } else if (sourceType === 'dailymed') {
        const year = metadata.published?.substring(0, 4) || 'Unknown';
        citation = `FDA Label: ${metadata.drug_name} (${year})`;
        identifier = `SetID:${item.id}`;
      } else if (sourceType === 'tavily_web') {
        citation = `Web: ${metadata.url}`;
        identifier = `URL:${item.id}`;
      } else {
        citation = `${sourceType}: ${item.title}`;
        identifier = `ID:${item.id}`;
      }

      formatted.push(`
[${item.rank}] ${citation}
${identifier}
Title: ${item.title}
URL: ${url}
Relevance: ${item.score.toFixed(2)}

Content:
${item.text}

${item.chunk_info?.section ? `Section: ${item.chunk_info.section}` : ''}
---`);
    }

    return formatted.join('\n');
  }

  private extractCitations(synthesisText: string, evidencePack: RankedEvidence[]): Array<{
    number: number;
    source: string;
    id: string;
    title: string;
    metadata: any;
  }> {
    // Find all [[N]](URL) and [[N]] patterns
    const citationPatterns = [
      /\[\[(\d+)\]\]\([^)]+\)/g,  // [[N]](URL) format
      /\[\[(\d+)\]\(([^)]+)\)\]/g, // [[N](URL)] format (fallback for malformed)
      /\[\[(\d+)\]\]/g            // [[N]] format (fallback)
    ];
    
    const citationNumbers = new Set<number>();
    
    // Extract citation numbers from all patterns
    citationPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(synthesisText)) !== null) {
        citationNumbers.add(parseInt(match[1]));
      }
    });

    const citations = [];
    for (const num of citationNumbers) {
      // Find corresponding source
      const source = evidencePack.find(item => item.rank === num);
      
      if (source) {
        // Build rich metadata for UI components
        const richMetadata = this.buildRichMetadata(source);
        
        citations.push({
          number: num,
          source: source.source,
          id: source.id,
          title: source.title,
          metadata: richMetadata
        });
      }
    }

    return citations.sort((a, b) => a.number - b.number);
  }

  private buildRichMetadata(source: RankedEvidence): any {
    const metadata = source.metadata;
    const richMeta: any = {
      ...metadata,
      // Add UI-specific fields
      authors: [],
      journal: '',
      year: '',
      doi: '',
      pmid: '',
      pmcid: '',
      badges: [],
      url: ''
    };

    // Extract metadata based on source type
    switch (source.source) {
      case 'pubmed':
        richMeta.authors = metadata.authors || [];
        richMeta.journal = metadata.journal || '';
        richMeta.year = metadata.pub_date?.substring(0, 4) || '';
        richMeta.doi = metadata.doi || '';
        richMeta.pmid = source.id;
        richMeta.pmcid = metadata.pmcid || '';
        richMeta.url = metadata.pmcid ? 
          `https://pmc.ncbi.nlm.nih.gov/articles/${metadata.pmcid}/` :
          `https://pubmed.ncbi.nlm.nih.gov/${source.id}/`;
        
        // Add badges for PubMed sources
        if (metadata.pmcid) richMeta.badges.push('PMCID');
        if (metadata.pub_types?.includes('Systematic Review')) richMeta.badges.push('Systematic Review');
        if (metadata.pub_types?.includes('Meta-Analysis')) richMeta.badges.push('Meta-Analysis');
        if (metadata.pub_types?.includes('Practice Guideline')) richMeta.badges.push('Practice Guideline');
        
        // Check if recent (≤3 years)
        const currentYear = new Date().getFullYear();
        if (richMeta.year && parseInt(richMeta.year) >= currentYear - 3) {
          richMeta.badges.push('Recent');
        }
        
        // Check for leading journals
        const leadingJournals = [
          'new england journal', 'nejm', 'lancet', 'jama', 'bmj', 'british medical journal',
          'nature', 'science', 'cell', 'circulation', 'annals of internal medicine'
        ];
        if (leadingJournals.some(j => richMeta.journal.toLowerCase().includes(j))) {
          richMeta.badges.push('Leading Journal');
        }
        break;

      case 'indian_guideline':
        richMeta.authors = [metadata.organization || 'Unknown Organization'];
        richMeta.journal = 'Clinical Practice Guideline';
        richMeta.year = metadata.year?.toString() || '';
        richMeta.url = metadata.url || '';
        richMeta.badges.push('Practice Guideline');
        
        // Check if recent
        if (richMeta.year && parseInt(richMeta.year) >= new Date().getFullYear() - 3) {
          richMeta.badges.push('Recent');
        }
        break;

      case 'dailymed':
        richMeta.authors = ['FDA'];
        richMeta.journal = 'FDA Drug Label';
        richMeta.year = metadata.published?.substring(0, 4) || '';
        richMeta.url = `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${source.id}`;
        richMeta.badges.push('Drug Label');
        
        // Check if recent
        if (richMeta.year && parseInt(richMeta.year) >= new Date().getFullYear() - 3) {
          richMeta.badges.push('Recent');
        }
        break;

      case 'tavily_web':
        richMeta.authors = [this.extractDomainFromUrl(metadata.url) || 'Web Source'];
        richMeta.journal = 'Web Resource';
        richMeta.year = metadata.published_date?.substring(0, 4) || new Date().getFullYear().toString();
        richMeta.url = metadata.url || '';
        
        // Add badges based on domain
        const domain = this.extractDomainFromUrl(metadata.url);
        if (domain?.includes('nih.gov') || domain?.includes('cdc.gov') || domain?.includes('who.int')) {
          richMeta.badges.push('Authoritative Source');
        }
        break;

      default:
        richMeta.url = metadata.url || '';
        break;
    }

    return richMeta;
  }

  private extractDomainFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return null;
    }
  }

  private calculateCost(modelName: string, tokens: { input: number; output: number }): number {
    const pricing: Record<string, { input: number; output: number }> = {
      'gemini-3-flash-preview': {
        input: 0.10 / 1_000_000,
        output: 0.40 / 1_000_000
      },
      'gemini-3-pro-preview': {
        input: 1.25 / 1_000_000,
        output: 5.00 / 1_000_000
      },
      'gemini-2.0-flash-001': {
        input: 0.10 / 1_000_000,
        output: 0.40 / 1_000_000
      }
    };

    const rate = pricing[modelName] || pricing['gemini-2.0-flash-001'] || { input: 0, output: 0 };
    
    return tokens.input * rate.input + tokens.output * rate.output;
  }
}