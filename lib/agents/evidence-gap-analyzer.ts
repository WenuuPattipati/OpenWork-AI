/**
 * Agent 5: Evidence Gap Analyzer
 * Assesses if retrieved evidence is sufficient to answer query
 * Uses Gemini 3.0 Pro for complex analysis
 * Triggers Tavily search if gaps detected
 */

import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { RankedEvidence, EvidenceGapAnalysis, TraceContext, AgentResult } from './types';
import { withToolSpan, SpanStatusCode, captureTokenUsage } from '../otel';
import { MultiSourceRetrievalCoordinator } from './multi-source-retrieval';
import { callGeminiWithRetry } from '../utils/gemini-rate-limiter';

export class EvidenceGapAnalyzer {
  private genAI: GoogleGenAI;
  private modelName: string;
  private systemPrompt: string;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenAI({ apiKey });
    this.modelName = process.env.GEMINI_PRO_MODEL || 'gemini-3-pro-preview';
    this.systemPrompt = this.getSystemPrompt();
  }

  private getSystemPrompt(): string {
    return `<role>
  <identity>Evidence Gap Analysis Specialist</identity>
  <purpose>Assess evidence sufficiency and quality for medical research queries, identifying gaps that require additional search</purpose>
  <expertise>Evidence-based medicine, systematic review methodology, clinical research quality assessment, medical literature evaluation</expertise>
</role>

<core_mission>
  <primary_goal>Determine whether retrieved evidence is sufficient to provide a comprehensive, reliable answer to the medical query</primary_goal>
  <success_criteria>
    <criterion>Accurately assess evidence coverage across all query dimensions</criterion>
    <criterion>Identify temporal gaps requiring recent literature search</criterion>
    <criterion>Detect quality gaps in evidence hierarchy (guidelines > RCTs > observational)</criterion>
    <criterion>Recognize contradictory evidence requiring expert synthesis</criterion>
    <criterion>Make intelligent decisions about triggering additional search mechanisms</criterion>
  </success_criteria>
</core_mission>

<analysis_framework>
  <dimension name="coverage">
    <description>Does evidence address all aspects of the query?</description>
    <assessment_criteria>
      <criterion>All medical entities (diseases, drugs, procedures) are covered</criterion>
      <criterion>Query intent is fully addressed (treatment, comparison, mechanism, etc.)</criterion>
      <criterion>Population specificity matches query (pediatric, geriatric, comorbidities)</criterion>
      <criterion>Geographic relevance aligns with query context</criterion>
    </assessment_criteria>
    <scoring>
      <score value="1.0">Complete coverage of all query aspects</score>
      <score value="0.8">Minor gaps in secondary aspects</score>
      <score value="0.6">Moderate gaps in important aspects</score>
      <score value="0.4">Major gaps in primary query elements</score>
      <score value="0.2">Minimal coverage of query</score>
    </scoring>
  </dimension>
  
  <dimension name="recency">
    <description>Is evidence temporally appropriate for the query?</description>
    <assessment_criteria>
      <criterion>Most recent source within 3 years for rapidly evolving fields</criterion>
      <criterion>Most recent source within 5 years for established fields</criterion>
      <criterion>Presence of recent guidelines or systematic reviews</criterion>
      <criterion>No outdated recommendations that contradict current practice</criterion>
    </assessment_criteria>
    <concern_triggers>
      <trigger>All sources older than 3 years AND query asks about "current" or "latest"</trigger>
      <trigger>All sources older than 5 years for drug safety or emerging treatments</trigger>
      <trigger>Guidelines older than 5 years without recent updates</trigger>
    </concern_triggers>
  </dimension>
  
  <dimension name="quality">
    <description>Does evidence meet standards for clinical decision-making?</description>
    <evidence_hierarchy>
      <level rank="1">Systematic reviews and meta-analyses</level>
      <level rank="2">Randomized controlled trials</level>
      <level rank="3">Clinical practice guidelines from major organizations</level>
      <level rank="4">Cohort and case-control studies</level>
      <level rank="5">Case series and expert opinion</level>
    </evidence_hierarchy>
    <quality_thresholds>
      <threshold level="high">≥3 Level 1-2 sources OR ≥2 recent guidelines</threshold>
      <threshold level="moderate">≥2 Level 1-3 sources OR ≥1 guideline + ≥2 RCTs</threshold>
      <threshold level="low">Mostly Level 4-5 sources or insufficient high-quality evidence</threshold>
    </quality_thresholds>
  </dimension>
  
  <dimension name="contradictions">
    <description>Are there conflicting recommendations or findings?</description>
    <contradiction_indicators>
      <indicator>Different treatment recommendations from multiple guidelines</indicator>
      <indicator>Conflicting efficacy or safety data between studies</indicator>
      <indicator>Disagreement between recent and older evidence</indicator>
      <indicator>Geographic or population-specific variations in recommendations</indicator>
    </contradiction_indicators>
  </dimension>
</analysis_framework>

<output_specification>
  <format>JSON</format>
  <structure>
    <field name="assessment" type="enum" required="true">
      <description>Overall evidence sufficiency determination</description>
      <values>
        <value name="sufficient">Evidence comprehensively addresses query with high confidence</value>
        <value name="partial">Evidence addresses most aspects but has notable gaps</value>
        <value name="insufficient">Evidence has major gaps preventing reliable synthesis</value>
      </values>
    </field>
    
    <field name="coverage_score" type="float" required="true">
      <description>Quantitative assessment of query coverage (0.0-1.0)</description>
      <calculation>Weighted average of coverage across all query dimensions</calculation>
    </field>
    
    <field name="recency_concerns" type="boolean" required="true">
      <description>Whether evidence age is problematic for the query</description>
      <logic>True if temporal gaps identified AND query requires current information</logic>
    </field>
    
    <field name="oldest_source_year" type="integer" required="true">
      <description>Publication year of oldest source in evidence pack</description>
      <purpose>Assess temporal distribution of evidence</purpose>
    </field>
    
    <field name="quality_distribution" type="object" required="true">
      <description>Count of evidence sources by quality level</description>
      <subfields>
        <field name="guidelines" type="integer">Clinical practice guidelines count</field>
        <field name="rcts" type="integer">Randomized controlled trials count</field>
        <field name="observational" type="integer">Observational studies count</field>
        <field name="reviews" type="integer">Systematic reviews and meta-analyses count</field>
      </subfields>
    </field>
    
    <field name="contradictions_detected" type="boolean" required="true">
      <description>Whether conflicting evidence was identified</description>
    </field>
    
    <field name="contradiction_summary" type="string" required="false">
      <description>Brief description of contradictions if detected</description>
      <format>Source [X] reports Y, while Source [Z] reports W</format>
    </field>
    
    <field name="missing_elements" type="array" required="true">
      <description>Specific gaps identified in evidence coverage</description>
      <examples>["recent clinical trial data", "pediatric safety data", "long-term outcomes", "cost-effectiveness analysis"]</examples>
    </field>
    
    <field name="recommendation" type="enum" required="true">
      <description>Action recommendation for evidence pipeline</description>
      <values>
        <value name="proceed">Evidence sufficient for synthesis</value>
        <value name="search_recent">Trigger web search for recent information</value>
        <value name="search_specific_gap">Trigger targeted search for specific missing elements</value>
      </values>
      <decision_logic>
        <if_condition>recency_concerns=true AND query contains temporal markers</if_condition>
        <then>search_recent</then>
        
        <if_condition>coverage_score &lt; 0.6 AND &lt;5 high-quality sources</if_condition>
        <then>search_specific_gap</then>
        
        <else>proceed</else>
      </decision_logic>
    </field>
  </structure>
</output_specification>

<analysis_workflow>
  <step number="1">
    <action>Parse and categorize all evidence sources</action>
    <process>
      <substep>Identify source types (guideline, RCT, observational, review)</substep>
      <substep>Extract publication years and assess recency</substep>
      <substep>Map evidence to query entities and intent</substep>
    </process>
  </step>
  
  <step number="2">
    <action>Assess coverage completeness</action>
    <process>
      <substep>Check coverage of all diseases mentioned in query</substep>
      <substep>Verify coverage of all drugs/interventions</substep>
      <substep>Assess population relevance (age, comorbidities, geography)</substep>
      <substep>Evaluate intent fulfillment (treatment, comparison, mechanism)</substep>
    </process>
  </step>
  
  <step number="3">
    <action>Evaluate evidence quality distribution</action>
    <process>
      <substep>Count sources by evidence hierarchy level</substep>
      <substep>Assess methodological quality indicators</substep>
      <substep>Identify authoritative sources (major medical organizations)</substep>
    </process>
  </step>
  
  <step number="4">
    <action>Detect contradictions and conflicts</action>
    <process>
      <substep>Compare treatment recommendations across sources</substep>
      <substep>Identify conflicting efficacy or safety data</substep>
      <substep>Note temporal evolution of recommendations</substep>
    </process>
  </step>
  
  <step number="5">
    <action>Identify specific gaps and missing elements</action>
    <process>
      <substep>Compare evidence to comprehensive query requirements</substep>
      <substep>Note missing population subgroups</substep>
      <substep>Identify temporal gaps in rapidly evolving areas</substep>
    </process>
  </step>
  
  <step number="6">
    <action>Make recommendation for next steps</action>
    <decision_tree>
      <branch condition="High coverage + High quality + No major gaps">
        <recommendation>proceed</recommendation>
      </branch>
      <branch condition="Adequate coverage + Recency concerns + Temporal markers in query">
        <recommendation>search_recent</recommendation>
      </branch>
      <branch condition="Low coverage OR Major quality gaps">
        <recommendation>search_specific_gap</recommendation>
      </branch>
    </decision_tree>
  </step>
</analysis_workflow>

<examples>
  <example>
    <scenario>High-quality evidence for established treatment</scenario>
    <input_summary>Query about first-line diabetes treatment, 8 sources including recent ADA guidelines, 3 RCTs, 2 systematic reviews</input_summary>
    <output>
{
  "assessment": "sufficient",
  "coverage_score": 0.95,
  "recency_concerns": false,
  "oldest_source_year": 2021,
  "quality_distribution": {
    "guidelines": 2,
    "rcts": 3,
    "observational": 1,
    "reviews": 2
  },
  "contradictions_detected": false,
  "missing_elements": [],
  "recommendation": "proceed"
}
    </output>
  </example>
  
  <example>
    <scenario>Adequate evidence but recency concerns</scenario>
    <input_summary>Query about "latest COVID-19 treatment protocols", 6 sources but newest from 2022</input_summary>
    <output>
{
  "assessment": "partial",
  "coverage_score": 0.75,
  "recency_concerns": true,
  "oldest_source_year": 2020,
  "quality_distribution": {
    "guidelines": 2,
    "rcts": 2,
    "observational": 2,
    "reviews": 0
  },
  "contradictions_detected": false,
  "missing_elements": ["2024 treatment updates", "recent variant-specific protocols"],
  "recommendation": "search_recent"
}
    </output>
  </example>
  
  <example>
    <scenario>Insufficient evidence with major gaps</scenario>
    <input_summary>Query about rare disease treatment, only 3 sources, all case reports, no guidelines</input_summary>
    <output>
{
  "assessment": "insufficient",
  "coverage_score": 0.35,
  "recency_concerns": false,
  "oldest_source_year": 2019,
  "quality_distribution": {
    "guidelines": 0,
    "rcts": 0,
    "observational": 3,
    "reviews": 0
  },
  "contradictions_detected": false,
  "missing_elements": ["clinical practice guidelines", "systematic reviews", "larger cohort studies"],
  "recommendation": "search_specific_gap"
}
    </output>
  </example>
</examples>

<critical_requirements>
  <requirement>NEVER recommend "proceed" if coverage_score &lt; 0.6</requirement>
  <requirement>ALWAYS set recency_concerns=true if all sources &gt;3 years old AND query has temporal markers</requirement>
  <requirement>ALWAYS count evidence sources accurately by type</requirement>
  <requirement>NEVER ignore contradictory evidence - always flag and summarize</requirement>
  <requirement>ALWAYS provide specific, actionable missing_elements</requirement>
</critical_requirements>

<quality_assurance>
  <check>Verify coverage_score reflects actual query fulfillment</check>
  <check>Ensure quality_distribution counts match evidence pack</check>
  <check>Confirm recommendation aligns with assessment and gaps</check>
  <check>Validate contradiction detection and summary accuracy</check>
  <check>Check that missing_elements are specific and relevant</check>
</quality_assurance>`;
  }

  async analyze(
    query: string,
    evidencePack: RankedEvidence[],
    traceContext: TraceContext,
    retriever?: MultiSourceRetrievalCoordinator
  ): Promise<{ analysis: EvidenceGapAnalysis; updatedEvidence: RankedEvidence[] }> {
    return await withToolSpan('evidence_gap_analyzer', 'execute', async (span) => {
      const startTime = Date.now();

      // Set input attributes
      span.setAttribute('agent.input', JSON.stringify({ query, num_sources: evidencePack.length }));
      span.setAttribute('agent.name', 'evidence_gap_analyzer');

    try {
      // Format evidence for analysis
      const evidenceSummary = this.formatEvidence(evidencePack);

      const prompt = `User Query: ${query}

Retrieved Evidence:
${evidenceSummary}

Output JSON:`;

      // CRITICAL FIX: Use rate limiter with multi-key support
      const response = await callGeminiWithRetry(async (apiKey: string) => {
        const genAI = new GoogleGenAI({ apiKey });
        return await genAI.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config: {
            systemInstruction: this.systemPrompt,
            temperature: 0.2,
            responseMimeType: "application/json",
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.LOW // Reduced from HIGH to save latency
            }
          }
        });
      });

      let analysis: EvidenceGapAnalysis;
      try {
        const responseText = response.text || '';
        const jsonText = this.cleanJsonOutput(responseText);
        analysis = JSON.parse(jsonText) as EvidenceGapAnalysis;
      } catch (parseError) {
        console.warn('⚠️ JSON parsing failed, using conservative fallback analysis:', parseError);
        // Conservative fallback: trigger additional search since we couldn't assess quality
        analysis = {
          assessment: 'partial',
          coverage_score: 0.5,
          recency_concerns: true,
          oldest_source_year: new Date().getFullYear() - 5,
          quality_distribution: {
            guidelines: 0,
            rcts: 0,
            observational: evidencePack.length,
            reviews: 0
          },
          contradictions_detected: false,
          missing_elements: ['Analysis parsing failed — triggering supplementary search'],
          recommendation: 'search_specific_gap'
        } as EvidenceGapAnalysis;
      }
      
      const latency = Date.now() - startTime;

      // Calculate cost
      const tokens = {
        input: response.usageMetadata?.promptTokenCount || 2000,
        output: response.usageMetadata?.candidatesTokenCount || 500,
        total: response.usageMetadata?.totalTokenCount || 2500
      };

      const cost = this.calculateCost(tokens);

      console.log(`🔍 Evidence gap analysis: ${analysis.assessment} (${Math.round(analysis.coverage_score * 100)}% coverage)`);
      console.log(`   Quality: ${analysis.quality_distribution.guidelines} guidelines, ${analysis.quality_distribution.rcts} RCTs`);
      console.log(`   Recommendation: ${analysis.recommendation}`);

      let updatedEvidence = evidencePack;

      // CRITICAL FIX: Only call Tavily if PubMed results are truly insufficient
      // Check if we have PubMed sources - if yes, be more conservative about calling Tavily
      const hasPubMedSources = evidencePack.some(e => e.source === 'pubmed');
      const pubmedCount = evidencePack.filter(e => e.source === 'pubmed').length;

      // #region debug log
      fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'evidence-gap-analyzer.ts:400', message: 'Gap analysis Tavily decision', data: { recommendation: analysis.recommendation, coverage: analysis.coverage_score, hasPubMed: hasPubMedSources, pubmedCount, evidenceCount: evidencePack.length, willCallTavily: (analysis.recommendation === 'search_recent' || analysis.recommendation === 'search_specific_gap') && retriever && (!hasPubMedSources || pubmedCount < 3), timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => { });
      // #endregion

      // Trigger Tavily ONLY if:
      // 1. Gap detected AND
      // 2. No PubMed sources OR very few PubMed sources (<3) OR coverage is very low (<0.4)
      const shouldCallTavily = (analysis.recommendation === 'search_recent' || analysis.recommendation === 'search_specific_gap')
        && retriever
        && (!hasPubMedSources || pubmedCount < 3 || analysis.coverage_score < 0.4);

      if (shouldCallTavily) {
        const searchType = analysis.recommendation === 'search_recent' ? 'recent evidence' : 'specific gaps';
        console.log(`🌐 Triggering Tavily search for ${searchType}... (PubMed sources: ${pubmedCount}, coverage: ${Math.round(analysis.coverage_score * 100)}%)`);
        
        // SMART QUERY RESTRUCTURING for Tavily (must be <420 chars)
        // Agent 5 is responsible for creating concise, targeted queries
        const isGuidelineGap = analysis.missing_elements.some(e => e.toLowerCase().includes('guideline'));

        const tavilyQuery = this.buildTavilyQuery(
          query,
          analysis.recommendation,
          analysis.missing_elements || [],
          isGuidelineGap
        );
        
        const existingUrls = new Set(
          evidencePack
            .map(item => item.metadata.url || item.id)
            .filter(Boolean)
        );

        try {
          const tavilyResults = await retriever.searchTavily(tavilyQuery, existingUrls, traceContext, query);
          
          if (tavilyResults.length > 0) {
            console.log(`✅ Tavily found ${tavilyResults.length} additional sources`);
            
            // Convert Tavily results to RankedEvidence format
            const tavilyEvidence: RankedEvidence[] = tavilyResults.map((result, index) => ({
              rank: evidencePack.length + index + 1,
              score: result.score || 0.7,
              source: 'tavily_web',
              id: result.url,
              title: result.title,
              text: result.content,
              metadata: {
                url: result.url,
                published_date: result.published_date,
                tavily_score: result.score
              },
              chunk_info: {
                section: 'web_content',
                chunk_index: 0
              }
            }));

            // Append to evidence pack
            updatedEvidence = [...evidencePack, ...tavilyEvidence];
          } else {
            console.log(`⚠️ Tavily search returned no results - continuing with PubMed evidence only`);
          }
        } catch (tavilyError) {
          console.error('❌ Tavily search failed:', tavilyError);
          // Continue with original evidence
        }
      } else if ((analysis.recommendation === 'search_recent' || analysis.recommendation === 'search_specific_gap') && hasPubMedSources && pubmedCount >= 3) {
        console.log(`✅ Skipping Tavily - sufficient PubMed sources (${pubmedCount} articles) with ${Math.round(analysis.coverage_score * 100)}% coverage`);
      }

      const result: AgentResult<EvidenceGapAnalysis> = {
        success: true,
        data: analysis,
        latency_ms: latency,
        tokens,
        cost_usd: cost
      };

      // Set span attributes
      span.setAttribute('agent.output', JSON.stringify(analysis));
      span.setAttribute('agent.latency_ms', latency);
      span.setAttribute('agent.cost_usd', cost);
      span.setAttribute('agent.model_name', 'gemini-3-pro-preview');
      span.setAttribute('agent.success', true);
      span.setAttribute('gap_analysis.coverage_score', analysis.coverage_score);
      span.setAttribute('gap_analysis.contradictions_detected', analysis.contradictions_detected);
      span.setAttribute('gap_analysis.missing_elements_count', analysis.missing_elements.length);
      captureTokenUsage(span, tokens, 'gemini-3-pro-preview');

      return { analysis, updatedEvidence };

    } catch (error) {
      console.error('❌ Evidence gap analysis failed:', error);
      
      const latency = Date.now() - startTime;
      const result: AgentResult<EvidenceGapAnalysis> = {
        success: false,
        data: {} as EvidenceGapAnalysis,
        error: error instanceof Error ? error.message : 'Unknown error',
        latency_ms: latency
      };

      // Set error attributes
      span.setAttribute('agent.success', false);
      span.setAttribute('agent.error', result.error || 'Unknown error');
      span.setAttribute('agent.latency_ms', latency);
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: result.error || 'Unknown error' });

      // Conservative default: when analysis fails, trigger supplementary search
      // rather than blindly proceeding with potentially insufficient evidence
      const defaultAnalysis: EvidenceGapAnalysis = {
        assessment: 'partial',
        coverage_score: 0.5,
        recency_concerns: true,
        oldest_source_year: new Date().getFullYear() - 5,
        quality_distribution: {
          guidelines: 0,
          rcts: 0,
          observational: evidencePack.length,
          reviews: 0
        },
        contradictions_detected: false,
        missing_elements: ['Gap analysis failed — supplementary search recommended'],
        recommendation: 'search_specific_gap'
      };

      return { analysis: defaultAnalysis, updatedEvidence: evidencePack };
    }
    });
  }

  private cleanJsonOutput(text: string): string {
    let clean = text.trim();

    // 1. Handle "FINAL JSON OUTPUT:" marker
    if (clean.includes('FINAL JSON OUTPUT:')) {
      clean = clean.split('FINAL JSON OUTPUT:')[1].trim();
    }

    // 2. Remove markdown code blocks
    const codeBlockMatch = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      clean = codeBlockMatch[1].trim();
    }

    // 3. Strip surrounding text
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    }

    return clean;
  }

  private formatEvidence(evidencePack: RankedEvidence[]): string {
    const summaryParts: string[] = [];
    
    for (const item of evidencePack) {
      const year = this.extractYear(item.metadata);
      
      summaryParts.push(`
[Source ${item.rank}]
Type: ${item.source}
ID: ${item.id}
Title: ${item.title}
Year: ${year}
Relevance Score: ${item.score.toFixed(2)}
Text Preview: ${(item.text || item.title || 'No content available').substring(0, 300)}...
---`);
    }

    return summaryParts.join('\n');
  }

  private extractYear(metadata: any): string {
    // Try to extract year from various metadata fields
    if (metadata.pub_date) {
      return metadata.pub_date.substring(0, 4);
    }
    if (metadata.year) {
      return metadata.year.toString();
    }
    if (metadata.published) {
      return metadata.published.substring(0, 4);
    }
    if (metadata.published_date) {
      return metadata.published_date.substring(0, 4);
    }
    return 'unknown';
  }

  private calculateCost(tokens: { input: number; output: number }): number {
    // Gemini 3.0 Pro pricing: $1.25/1M input, $5.00/1M output
    const inputCost = (tokens.input / 1_000_000) * 1.25;
    const outputCost = (tokens.output / 1_000_000) * 5.00;
    return inputCost + outputCost;
  }

  /**
   * Build a concise Tavily query under 420 characters
   * Agent 5 is responsible for restructuring queries for Tavily
   * Strategy:
   * 1. Start with the core query (first 200 chars max)
   * 2. Add temporal markers for recency searches
   * 3. Add top 2-3 missing elements for gap searches
   * 4. Ensure total length stays under 420 chars
   */
  private buildTavilyQuery(
    originalQuery: string,
    recommendation: string,
    missingElements: string[],
    isGuidelineGap: boolean = false
  ): string {
    const MAX_LENGTH = 400; // Leave 20 char buffer

    // Extract core medical terms from query (limit to ~150 chars)
    let coreQuery = originalQuery.trim();
    if (coreQuery.length > 150) {
      // Find last space before 150 chars to avoid word cutoff
      const cutoff = coreQuery.lastIndexOf(' ', 150);
      coreQuery = coreQuery.substring(0, cutoff > 100 ? cutoff : 150);
    }

    let tavilyQuery = coreQuery;

    if (isGuidelineGap) {
      // ENHANCEMENT: Explicitly target global guidelines if missing
      // Agent 2.1 covers Indian guidelines; Agent 5 fills the gap for Global/US/UK
      tavilyQuery += ' guidelines (ADA OR NICE OR ESC OR AHA OR WHO)';
    } else if (recommendation === 'search_recent') {
      // For recency searches, add temporal markers
      const currentYear = new Date().getFullYear();
      tavilyQuery += ` latest ${currentYear - 1} ${currentYear}`;
    } else if (recommendation === 'search_specific_gap') {
      // For gap searches, add top 2-3 missing elements
      const topMissing = missingElements
        .slice(0, 3)
        .map(el => el.length > 30 ? el.substring(0, 30) : el)
        .join(' ');

      if (topMissing && (tavilyQuery.length + topMissing.length + 1) < MAX_LENGTH) {
        tavilyQuery += ' ' + topMissing;
      }
    }

    // Final safety check
    if (tavilyQuery.length > MAX_LENGTH) {
      const lastSpace = tavilyQuery.lastIndexOf(' ', MAX_LENGTH);
      tavilyQuery = tavilyQuery.substring(0, lastSpace > MAX_LENGTH * 0.7 ? lastSpace : MAX_LENGTH);
    }

    console.log(`🔧 Built Tavily query (${tavilyQuery.length} chars): "${tavilyQuery}"`);
    return tavilyQuery.trim();
  }
}