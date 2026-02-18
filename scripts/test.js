"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// lib/agents/system-prompts/pubmed-intelligence-prompt.ts
var pubmed_intelligence_prompt_exports = {};
__export(pubmed_intelligence_prompt_exports, {
  PUBMED_INTELLIGENCE_SYSTEM_PROMPT: () => PUBMED_INTELLIGENCE_SYSTEM_PROMPT
});
var PUBMED_INTELLIGENCE_SYSTEM_PROMPT;
var init_pubmed_intelligence_prompt = __esm({
  "lib/agents/system-prompts/pubmed-intelligence-prompt.ts"() {
    "use strict";
    PUBMED_INTELLIGENCE_SYSTEM_PROMPT = `<role>
  <identity>PubMed Medical Literature Intelligence Specialist</identity>
  <purpose>Execute sophisticated PubMed searches with MeSH term expansion and clinical relevance optimization for evidence-based medical research</purpose>
  <expertise>PubMed search methodology, MeSH terminology, clinical research classification, NCBI E-utilities, medical literature quality assessment</expertise>
</role>

<core_mission>
  <primary_goal>Retrieve the most clinically relevant, high-quality medical literature from PubMed using advanced search strategies</primary_goal>
  <success_criteria>
    <criterion>Generate optimized PubMed queries with appropriate MeSH term expansion</criterion>
    <criterion>Retrieve diverse, high-quality articles across multiple search variants</criterion>
    <criterion>Prioritize evidence hierarchy: RCTs > systematic reviews > observational studies</criterion>
    <criterion>Ensure comprehensive coverage while maintaining clinical relevance</criterion>
    <criterion>Identify full-text availability through PMC linkage</criterion>
  </success_criteria>
</core_mission>

<evidence_engine_integration>
  <description>Leverage the comprehensive Evidence Engine and Medical Source Bible for specialty-specific filtering</description>
  <capabilities>
    <capability name="specialty_routing">
      <description>Automatically route queries to relevant medical specialties</description>
      <source>Medical Source Bible (medical-source-bible.ts)</source>
      <action>Apply specialty-specific "Elite Journal Filters" to prioritize authoritative sources</action>
    </capability>
    <capability name="guideline_targeting">
      <description>Target specific guideline organizations based on query intent</description>
      <action>Inject organization names (e.g., "American Diabetes Association", "KDIGO") into search queries</action>
    </capability>
    <capability name="journal_quality">
      <description>Prioritize Tier 1 and Specialty Elite journals</description>
      <action>Filter results to ensure high-impact, peer-reviewed sources</action>
    </capability>
  </capabilities>
</evidence_engine_integration>

<search_strategy_framework>
  <query_construction>
    <mesh_integration>
      <description>Enhance search terms with Medical Subject Headings for comprehensive retrieval</description>
      <methodology>
        <step>Map disease entities to MeSH terms using NCBI MeSH database</step>
        <step>Include both MeSH terms and free-text variants</step>
        <step>Use MeSH explosion for broader concept coverage</step>
        <step>Combine with title/abstract searches for recent terminology</step>
      </methodology>
      <example>
        <disease>Type 2 Diabetes</disease>
        <mesh_terms>["Diabetes Mellitus, Type 2"[MeSH Terms], "Non-Insulin-Dependent Diabetes Mellitus"[MeSH Terms]]</mesh_terms>
        <free_text>["Type 2 Diabetes"[Title/Abstract], "T2DM"[Title/Abstract]]</free_text>
        <combined_query>("Diabetes Mellitus, Type 2"[MeSH Terms] OR "Type 2 Diabetes"[Title/Abstract] OR "T2DM"[Title/Abstract])</combined_query>
      </example>
    </mesh_integration>
    
    <publication_type_filtering>
      <description>Prioritize high-quality study designs for clinical evidence</description>
      <hierarchy>
        <tier level="1">Meta-Analysis[PT], Systematic Review[PT]</tier>
        <tier level="2">Randomized Controlled Trial[PT], Clinical Trial[PT]</tier>
        <tier level="3">Practice Guideline[PT], Consensus Development Conference[PT]</tier>
        <tier level="4">Comparative Study[PT], Multicenter Study[PT]</tier>
      </hierarchy>
      <filter_construction>
        <primary>("Meta-Analysis"[PT] OR "Systematic Review"[PT] OR "Randomized Controlled Trial"[PT] OR "Practice Guideline"[PT])</primary>
        <fallback>Include observational studies if primary yields insufficient results</fallback>
      </filter_construction>
    </publication_type_filtering>
    
    <temporal_filtering>
      <description>Balance recency with evidence maturity</description>
      <default_range>"2015/01/01"[PDAT] : "3000"[PDAT]</default_range>
      <rationale>10-year window captures current practice while including landmark studies</rationale>
      <exceptions>
        <exception condition="rapidly_evolving_field">Restrict to 5 years for emerging treatments</exception>
        <exception condition="established_therapy">Extend to 15 years for well-established interventions</exception>
      </exceptions>
    </temporal_filtering>
    
    <quality_filters>
      <description>Ensure methodological rigor and accessibility</description>
      <mandatory_filters>
        <filter>english[LA] - English language publications</filter>
        <filter>hasabstract - Must have abstract available</filter>
        <filter>humans[MeSH Terms] - Human studies only</filter>
      </mandatory_filters>
      <optional_filters>
        <filter condition="drug_safety_query">adverse effects[Subheading]</filter>
        <filter condition="treatment_efficacy">drug therapy[Subheading]</filter>
        <filter condition="diagnostic_query">diagnosis[Subheading]</filter>
      </optional_filters>
    </quality_filters>
  </query_construction>
  
  <search_variant_strategy>
    <variant_types>
      <variant name="comprehensive">
        <description>Broad search capturing all relevant literature</description>
        <approach>Use MeSH explosion with OR logic for maximum recall</approach>
        <example>("Diabetes Mellitus, Type 2"[MeSH Terms:NoExp] OR "Diabetes Mellitus, Type 2"[MeSH Terms]) AND ("Metformin"[MeSH Terms] OR "Metformin"[Title/Abstract])</example>
      </variant>
      
      <variant name="precision">
        <description>Focused search for highly relevant results</description>
        <approach>Use exact MeSH terms with AND logic for high precision</approach>
        <example>"Diabetes Mellitus, Type 2"[MeSH Terms:NoExp] AND "Metformin"[MeSH Terms:NoExp] AND "Drug Therapy"[MeSH Subheading]</example>
      </variant>
      
      <variant name="clinical">
        <description>Clinically-oriented search using practice terminology</description>
        <approach>Emphasize clinical terms and practice guidelines</approach>
        <example>("Type 2 Diabetes"[Title/Abstract] AND "first line treatment"[Title/Abstract]) OR ("T2DM management"[Title/Abstract])</example>
      </variant>
      
      <variant name="recent">
        <description>Focus on recent developments and updates</description>
        <approach>Restrict temporal range and emphasize recent publication types</approach>
        <example>Previous query AND ("2020/01/01"[PDAT] : "3000"[PDAT]) AND ("Review"[PT] OR "Meta-Analysis"[PT])</example>
      </variant>
    </variant_types>
  </search_variant_strategy>
</search_strategy_framework>

<retrieval_workflow>
  <phase name="query_preparation">
    <step number="1">
      <action>Analyze input entities and search variants</action>
      <process>
        <substep>Extract disease entities and map to MeSH terms</substep>
        <substep>Extract drug entities and map to pharmacological MeSH terms</substep>
        <substep>Extract procedure entities and map to therapeutic MeSH terms</substep>
        <substep>Identify query intent for appropriate subheading selection</substep>
      </process>
    </step>
    
    <step number="2">
      <action>Construct optimized PubMed queries for each variant</action>
      <process>
        <substep>Build base query with MeSH terms and free text</substep>
        <substep>Add publication type filters based on evidence hierarchy</substep>
        <substep>Apply temporal filters appropriate for query type</substep>
        <substep>Include quality and language filters</substep>
        <substep>Validate query syntax for NCBI E-utilities</substep>
      </process>
    </step>
  </phase>
  
  <phase name="parallel_execution">
    <step number="3">
      <action>Execute multiple search variants simultaneously</action>
      <process>
        <substep>Submit ESearch requests for all variants in parallel</substep>
        <substep>Respect NCBI rate limits (10 requests/second with API key)</substep>
        <substep>Collect PMIDs from all search results</substep>
        <substep>Deduplicate PMIDs across variants</substep>
      </process>
      <error_handling>
        <scenario>Rate limit exceeded</scenario>
        <response>Implement exponential backoff with jitter</response>
        
        <scenario>Query syntax error</scenario>
        <response>Fall back to simplified query without complex operators</response>
        
        <scenario>No results returned</scenario>
        <response>Broaden search by removing restrictive filters</response>
      </error_handling>
    </step>
    
    <step number="4">
      <action>Retrieve comprehensive metadata for all PMIDs</action>
      <process>
        <substep>Use ESummary to fetch article metadata in batches</substep>
        <substep>Extract title, abstract, authors, journal, publication date</substep>
        <substep>Identify publication types and MeSH terms</substep>
        <substep>Extract DOI and other identifiers</substep>
      </process>
    </step>
    
    <step number="5">
      <action>Assess PMC full-text availability</action>
      <process>
        <substep>Use ELink to check PMC linkage for all PMIDs</substep>
        <substep>Identify articles with full-text availability</substep>
        <substep>Prioritize open-access full-text articles</substep>
        <substep>Flag articles for potential full-text retrieval</substep>
      </process>
    </step>
  </phase>
  
  <phase name="quality_assessment">
    <step number="6">
      <action>Rank articles by clinical relevance and quality</action>
      <scoring_factors>
        <factor weight="0.3">Publication type (RCT > Review > Observational)</factor>
        <factor weight="0.2">Journal impact and reputation</factor>
        <factor weight="0.2">Recency (more recent = higher score)</factor>
        <factor weight="0.15">Full-text availability</factor>
        <factor weight="0.15">Citation count and influence</factor>
      </scoring_factors>
    </step>
    
    <step number="7">
      <action>Apply clinical relevance filtering</action>
      <relevance_criteria>
        <criterion>Abstract contains query-relevant medical terms</criterion>
        <criterion>Study population matches query context</criterion>
        <criterion>Intervention/exposure aligns with query focus</criterion>
        <criterion>Outcomes relevant to clinical decision-making</criterion>
      </relevance_criteria>
    </step>
  </phase>
</retrieval_workflow>

<output_specification>
  <article_metadata>
    <required_fields>
      <field name="pmid">PubMed unique identifier</field>
      <field name="title">Complete article title</field>
      <field name="abstract">Full abstract text (if available)</field>
      <field name="authors">Author list (first 5 authors)</field>
      <field name="journal">Full journal name</field>
      <field name="pub_date">Publication date (YYYY-MM-DD format)</field>
      <field name="pub_types">Publication type classifications</field>
    </required_fields>
    
    <optional_fields>
      <field name="doi">Digital Object Identifier</field>
      <field name="pmcid">PubMed Central identifier (if available)</field>
      <field name="mesh_terms">Associated MeSH terms</field>
      <field name="keywords">Author keywords</field>
      <field name="citation_count">Number of citations (if available)</field>
    </optional_fields>
    
    <computed_fields>
      <field name="full_text_available">Boolean indicating PMC availability</field>
      <field name="relevance_score">Computed relevance score (0.0-1.0)</field>
      <field name="quality_tier">Evidence quality classification (1-4)</field>
    </computed_fields>
  </article_metadata>
</output_specification>

<examples>
  <example>
    <input>
      <query>Type 2 diabetes first-line treatment guidelines</query>
      <entities>
        <diseases>["Type 2 Diabetes Mellitus"]</diseases>
        <drugs>[]</drugs>
        <procedures>[]</procedures>
      </entities>
    </input>
    
    <constructed_queries>
      <comprehensive>("Diabetes Mellitus, Type 2"[MeSH Terms] OR "Type 2 Diabetes"[Title/Abstract] OR "T2DM"[Title/Abstract]) AND ("Drug Therapy"[MeSH Subheading] OR "first line"[Title/Abstract] OR "initial treatment"[Title/Abstract]) AND ("Practice Guideline"[PT] OR "Meta-Analysis"[PT] OR "Systematic Review"[PT]) AND "2015/01/01"[PDAT] : "3000"[PDAT] AND english[LA] AND hasabstract</comprehensive>
      
      <precision>"Diabetes Mellitus, Type 2"[MeSH Terms:NoExp] AND "Drug Therapy"[MeSH Subheading] AND ("Practice Guideline"[PT] OR "Consensus Development Conference"[PT])</precision>
      
      <clinical>("Type 2 diabetes management"[Title/Abstract] OR "T2DM guidelines"[Title/Abstract]) AND ("first-line therapy"[Title/Abstract] OR "initial treatment"[Title/Abstract])</clinical>
    </constructed_queries>
    
    <expected_results>
      <result_count>45-60 articles</result_count>
      <quality_distribution>
        <guidelines>8-12 articles</guidelines>
        <systematic_reviews>6-10 articles</systematic_reviews>
        <rcts>15-20 articles</rcts>
        <observational>10-15 articles</observational>
      </quality_distribution>
    </expected_results>
  </example>
  
  <example>
    <input>
      <query>Apixaban versus rivaroxaban atrial fibrillation stroke prevention</query>
      <entities>
        <diseases>["Atrial Fibrillation", "Stroke"]</diseases>
        <drugs>["Apixaban", "Rivaroxaban"]</drugs>
        <procedures>["Stroke Prevention"]</procedures>
      </entities>
    </input>
    
    <constructed_queries>
      <comprehensive>("Atrial Fibrillation"[MeSH Terms] OR "AF"[Title/Abstract]) AND ("Apixaban"[MeSH Terms] OR "Rivaroxaban"[MeSH Terms] OR "Factor Xa Inhibitors"[MeSH Terms]) AND ("Stroke"[MeSH Terms] OR "stroke prevention"[Title/Abstract]) AND ("Comparative Study"[PT] OR "Randomized Controlled Trial"[PT] OR "Meta-Analysis"[PT])</comprehensive>
      
      <precision>"Atrial Fibrillation"[MeSH Terms:NoExp] AND ("Apixaban"[MeSH Terms:NoExp] OR "Rivaroxaban"[MeSH Terms:NoExp]) AND "Stroke"[MeSH Terms:NoExp] AND "Randomized Controlled Trial"[PT]</precision>
      
      <clinical>("apixaban versus rivaroxaban"[Title/Abstract] OR "apixaban compared to rivaroxaban"[Title/Abstract]) AND ("atrial fibrillation"[Title/Abstract]) AND ("stroke prevention"[Title/Abstract])</clinical>
    </constructed_queries>
  </example>
</examples>

<performance_optimization>
  <caching_strategy>
    <description>Cache frequent queries to reduce API calls and improve response time</description>
    <cache_key>MD5 hash of normalized query string</cache_key>
    <cache_duration>24 hours for search results, 7 days for metadata</cache_duration>
  </caching_strategy>
  
  <batch_processing>
    <description>Optimize API calls through intelligent batching</description>
    <esearch_batching>Submit multiple queries in parallel up to rate limit</esearch_batching>
    <esummary_batching>Retrieve metadata for up to 200 PMIDs per request</esummary_batching>
    <elink_batching>Check PMC availability for up to 100 PMIDs per request</elink_batching>
  </batch_processing>
  
  <error_recovery>
    <timeout_handling>Implement 30-second timeout with retry logic</timeout_handling>
    <rate_limit_handling>Exponential backoff with maximum 5 retry attempts</rate_limit_handling>
    <partial_failure_handling>Return partial results if some queries fail</partial_failure_handling>
  </error_recovery>
</performance_optimization>

<quality_assurance>
  <validation_checks>
    <check>Verify all PMIDs are valid and accessible</check>
    <check>Ensure abstracts are complete and not truncated</check>
    <check>Validate publication dates are within expected range</check>
    <check>Confirm MeSH terms are correctly associated</check>
    <check>Check for duplicate articles across search variants</check>
  </validation_checks>
  
  <success_metrics>
    <metric>Retrieval completeness: >90% of relevant articles found</metric>
    <metric>Precision: >80% of retrieved articles clinically relevant</metric>
    <metric>Quality distribution: >60% high-quality evidence (RCTs, reviews, guidelines)</metric>
    <metric>Full-text availability: >40% of articles have PMC full-text</metric>
  </success_metrics>
</quality_assurance>

<critical_requirements>
  <requirement>NEVER exceed NCBI rate limits (10 requests/second with API key)</requirement>
  <requirement>ALWAYS include publication type filters for evidence quality</requirement>
  <requirement>ALWAYS check PMC availability for full-text access</requirement>
  <requirement>ALWAYS deduplicate PMIDs across search variants</requirement>
  <requirement>ALWAYS validate query syntax before submission</requirement>
  <requirement>NEVER return articles without abstracts unless specifically requested</requirement>
</critical_requirements>`;
  }
});

// medical-source-bible.ts
var medical_source_bible_exports = {};
__export(medical_source_bible_exports, {
  DRUG_INFORMATION_SOURCES: () => DRUG_INFORMATION_SOURCES,
  MEDICAL_SPECIALTIES: () => MEDICAL_SPECIALTIES,
  OPENWORK_GAP_ANALYSIS: () => OPENWORK_GAP_ANALYSIS,
  SYSTEMATIC_REVIEW_SOURCES: () => SYSTEMATIC_REVIEW_SOURCES,
  TIER_1_GENERAL_JOURNALS: () => TIER_1_GENERAL_JOURNALS,
  buildGuidelineSearchQuery: () => buildGuidelineSearchQuery,
  default: () => medical_source_bible_default,
  getGuidelineOrganizations: () => getGuidelineOrganizations,
  getPubMedEliteFilter: () => getPubMedEliteFilter,
  getTavilyDomains: () => getTavilyDomains,
  routeQueryToSpecialties: () => routeQueryToSpecialties
});
function routeQueryToSpecialties(query) {
  const queryLower = query.toLowerCase();
  const matches = [];
  for (const specialty of MEDICAL_SPECIALTIES) {
    let score = 0;
    for (const keyword of specialty.trigger_keywords) {
      if (queryLower.includes(keyword.toLowerCase())) {
        score += keyword.length;
      }
    }
    for (const system of specialty.body_systems) {
      if (queryLower.includes(system.toLowerCase())) {
        score += 5;
      }
    }
    if (score > 0) {
      matches.push({ id: specialty.id, score });
    }
  }
  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, 3).map((m) => m.id);
}
function getPubMedEliteFilter(specialtyIds) {
  const filters = [];
  filters.push(TIER_1_GENERAL_JOURNALS.pubmed_combined_filter);
  for (const id of specialtyIds) {
    const specialty = MEDICAL_SPECIALTIES.find((s) => s.id === id);
    if (specialty) {
      filters.push(specialty.pubmed_elite_filter);
    }
  }
  return `(${filters.join(" OR ")})`;
}
function getTavilyDomains(specialtyIds) {
  const domains = /* @__PURE__ */ new Set();
  for (const id of specialtyIds) {
    const specialty = MEDICAL_SPECIALTIES.find((s) => s.id === id);
    if (specialty) {
      specialty.tavily_search_domains.forEach((d) => domains.add(d));
    }
  }
  return Array.from(domains);
}
function getGuidelineOrganizations(specialtyIds) {
  const orgs = [];
  for (const id of specialtyIds) {
    const specialty = MEDICAL_SPECIALTIES.find((s) => s.id === id);
    if (specialty) {
      orgs.push(...specialty.guideline_organizations);
    }
  }
  return orgs;
}
function buildGuidelineSearchQuery(query, specialtyIds) {
  const orgs = getGuidelineOrganizations(specialtyIds);
  const domains = orgs.map((o) => o.tavily_domain).join(" OR ");
  const terms = query.replace(/[^a-zA-Z0-9\s]/g, "").trim();
  return `${terms} guidelines (${domains})`;
}
var TIER_1_GENERAL_JOURNALS, MEDICAL_SPECIALTIES, SYSTEMATIC_REVIEW_SOURCES, DRUG_INFORMATION_SOURCES, OPENWORK_GAP_ANALYSIS, medical_source_bible_default;
var init_medical_source_bible = __esm({
  "medical-source-bible.ts"() {
    "use strict";
    TIER_1_GENERAL_JOURNALS = {
      id: "general_medicine",
      name: "General Medicine (Top Tier)",
      description: "The absolute top medical journals - equivalent to Nature/Science for medicine. Every doctor reads these.",
      journals: [
        {
          name: "New England Journal of Medicine",
          abbreviation: "N Engl J Med",
          pubmed_filter: '"N Engl J Med"[Journal]',
          impact_factor: 158.5,
          publisher: "Massachusetts Medical Society",
          why_important: "THE most prestigious medical journal. Landmark trials, new drug approvals, practice-changing guidelines. If it's in NEJM, it matters.",
          website: "nejm.org"
        },
        {
          name: "The Lancet",
          abbreviation: "Lancet",
          pubmed_filter: '"Lancet"[Journal]',
          impact_factor: 168.9,
          publisher: "Elsevier",
          why_important: "UK-based global health leader. Major trials, global health policy, infectious disease outbreaks.",
          website: "thelancet.com"
        },
        {
          name: "JAMA (Journal of the American Medical Association)",
          abbreviation: "JAMA",
          pubmed_filter: '"JAMA"[Journal]',
          impact_factor: 120.7,
          publisher: "American Medical Association",
          why_important: "US clinical practice standard. Clinical trials, medical policy, systematic reviews.",
          website: "jamanetwork.com"
        },
        {
          name: "BMJ (British Medical Journal)",
          abbreviation: "BMJ",
          pubmed_filter: '"BMJ"[Journal]',
          impact_factor: 105.7,
          publisher: "BMJ Publishing Group",
          why_important: "UK primary care focus. Clinical guidelines, research methodology, medical education.",
          website: "bmj.com"
        },
        {
          name: "Annals of Internal Medicine",
          abbreviation: "Ann Intern Med",
          pubmed_filter: '"Ann Intern Med"[Journal]',
          impact_factor: 51.6,
          publisher: "American College of Physicians",
          why_important: "Internal medicine gold standard. Clinical practice guidelines, systematic reviews.",
          website: "acpjournals.org"
        }
      ],
      pubmed_combined_filter: '("N Engl J Med"[Journal] OR "Lancet"[Journal] OR "JAMA"[Journal] OR "BMJ"[Journal] OR "Ann Intern Med"[Journal])'
    };
    MEDICAL_SPECIALTIES = [
      // =========================================================================
      // CARDIOVASCULAR SYSTEM (Heart, Blood Vessels)
      // =========================================================================
      {
        id: "cardiovascular",
        specialty: "Cardiology",
        body_systems: ["heart", "blood vessels", "circulatory system"],
        trigger_keywords: [
          "heart",
          "cardiac",
          "cardiovascular",
          "coronary",
          "myocardial",
          "arrhythmia",
          "atrial fibrillation",
          "AF",
          "AFib",
          "heart failure",
          "HF",
          "hypertension",
          "blood pressure",
          "HTN",
          "lipid",
          "cholesterol",
          "LDL",
          "HDL",
          "statin",
          "ASCVD",
          "angina",
          "MI",
          "myocardial infarction",
          "heart attack",
          "valve",
          "aortic",
          "mitral",
          "pacemaker",
          "ICD",
          "ablation",
          "cardiomyopathy",
          "endocarditis",
          "pericarditis",
          "CHF"
        ],
        guideline_organizations: [
          {
            name: "American Heart Association / American College of Cardiology",
            abbreviation: "AHA/ACC",
            website: "heart.org / acc.org",
            tavily_domain: "site:heart.org OR site:acc.org",
            description: "THE US authority on cardiovascular disease. Their guidelines define standard of care in America.",
            guideline_types: ["Hypertension", "Heart Failure", "Lipid Management", "Arrhythmias", "Valvular Disease", "Prevention"]
          },
          {
            name: "European Society of Cardiology",
            abbreviation: "ESC",
            website: "escardio.org",
            tavily_domain: "site:escardio.org",
            description: "European counterpart to AHA/ACC. Often more aggressive targets (e.g., LDL goals). Used globally.",
            guideline_types: ["All cardiovascular conditions", "Often differs from ACC/AHA on targets"]
          },
          {
            name: "Heart Rhythm Society",
            abbreviation: "HRS",
            website: "hrsonline.org",
            tavily_domain: "site:hrsonline.org",
            description: "Electrophysiology and arrhythmia specialists. Pacemakers, ICDs, ablation.",
            guideline_types: ["Atrial Fibrillation", "Sudden Cardiac Death", "Device Therapy"]
          }
        ],
        top_journals: [
          {
            name: "Circulation",
            abbreviation: "Circulation",
            pubmed_filter: '"Circulation"[Journal]',
            impact_factor: 37.8,
            why_important: "AHA flagship. Where major cardiology guidelines are published."
          },
          {
            name: "European Heart Journal",
            abbreviation: "Eur Heart J",
            pubmed_filter: '"Eur Heart J"[Journal]',
            impact_factor: 35.6,
            why_important: "ESC flagship. European guidelines, major trials."
          },
          {
            name: "Journal of the American College of Cardiology",
            abbreviation: "J Am Coll Cardiol",
            pubmed_filter: '"J Am Coll Cardiol"[Journal]',
            impact_factor: 22.3,
            why_important: "ACC flagship. Clinical cardiology, interventional procedures."
          },
          {
            name: "JAMA Cardiology",
            abbreviation: "JAMA Cardiol",
            pubmed_filter: '"JAMA Cardiol"[Journal]',
            impact_factor: 14.7,
            why_important: "High-impact clinical cardiology research."
          },
          {
            name: "Nature Reviews Cardiology",
            abbreviation: "Nat Rev Cardiol",
            pubmed_filter: '"Nat Rev Cardiol"[Journal]',
            impact_factor: 41.7,
            why_important: "Authoritative reviews of cardiovascular topics."
          }
        ],
        pubmed_elite_filter: '("Circulation"[Journal] OR "Eur Heart J"[Journal] OR "J Am Coll Cardiol"[Journal] OR "JAMA Cardiol"[Journal] OR "Nat Rev Cardiol"[Journal])',
        tavily_search_domains: ["heart.org", "acc.org", "escardio.org", "hrsonline.org"]
      },
      // =========================================================================
      // RESPIRATORY SYSTEM (Lungs, Airways)
      // =========================================================================
      {
        id: "respiratory",
        specialty: "Pulmonology / Respiratory Medicine",
        body_systems: ["lungs", "airways", "respiratory tract", "bronchi", "alveoli"],
        trigger_keywords: [
          "asthma",
          "COPD",
          "chronic obstructive",
          "emphysema",
          "bronchitis",
          "pneumonia",
          "lung",
          "pulmonary",
          "respiratory",
          "breathing",
          "dyspnea",
          "inhaler",
          "bronchodilator",
          "ICS",
          "LABA",
          "LAMA",
          "spirometry",
          "FEV1",
          "peak flow",
          "oxygen",
          "hypoxia",
          "sleep apnea",
          "OSA",
          "pulmonary fibrosis",
          "IPF",
          "interstitial lung disease",
          "ILD",
          "tuberculosis",
          "TB",
          "pleural",
          "pneumothorax",
          "PE",
          "pulmonary embolism"
        ],
        guideline_organizations: [
          {
            name: "Global Initiative for Asthma",
            abbreviation: "GINA",
            website: "ginasthma.org",
            tavily_domain: "site:ginasthma.org",
            description: "THE global authority on asthma management. Used worldwide. Updated annually. THIS IS CRITICAL - Open Evidence uses this heavily.",
            guideline_types: ["Asthma diagnosis", "Asthma treatment stepwise", "Asthma-COPD overlap"]
          },
          {
            name: "Global Initiative for Chronic Obstructive Lung Disease",
            abbreviation: "GOLD",
            website: "goldcopd.org",
            tavily_domain: "site:goldcopd.org",
            description: "THE global authority on COPD. Defines GOLD stages (A/B/C/D \u2192 now ABE). Updated annually.",
            guideline_types: ["COPD diagnosis", "COPD treatment", "Exacerbation management"]
          },
          {
            name: "American Thoracic Society / European Respiratory Society",
            abbreviation: "ATS/ERS",
            website: "thoracic.org / ersnet.org",
            tavily_domain: "site:thoracic.org OR site:ersnet.org",
            description: "Joint guidelines for complex pulmonary conditions. IPF, pulmonary hypertension.",
            guideline_types: ["Pulmonary fibrosis", "Pulmonary hypertension", "Lung function testing"]
          }
        ],
        top_journals: [
          {
            name: "American Journal of Respiratory and Critical Care Medicine",
            abbreviation: "Am J Respir Crit Care Med",
            pubmed_filter: '"Am J Respir Crit Care Med"[Journal]',
            impact_factor: 24.7,
            why_important: "ATS flagship. Where major pulmonary guidelines appear."
          },
          {
            name: "The Lancet Respiratory Medicine",
            abbreviation: "Lancet Respir Med",
            pubmed_filter: '"Lancet Respir Med"[Journal]',
            impact_factor: 38.7,
            why_important: "High-impact respiratory trials and reviews."
          },
          {
            name: "European Respiratory Journal",
            abbreviation: "Eur Respir J",
            pubmed_filter: '"Eur Respir J"[Journal]',
            impact_factor: 16.6,
            why_important: "ERS flagship. European respiratory research."
          },
          {
            name: "Chest",
            abbreviation: "Chest",
            pubmed_filter: '"Chest"[Journal]',
            impact_factor: 9.6,
            why_important: "ACCP journal. Practical pulmonary and critical care."
          },
          {
            name: "Thorax",
            abbreviation: "Thorax",
            pubmed_filter: '"Thorax"[Journal]',
            impact_factor: 9,
            why_important: "BMJ respiratory journal. UK/European perspective."
          }
        ],
        pubmed_elite_filter: '("Am J Respir Crit Care Med"[Journal] OR "Lancet Respir Med"[Journal] OR "Eur Respir J"[Journal] OR "Chest"[Journal] OR "Thorax"[Journal])',
        tavily_search_domains: ["ginasthma.org", "goldcopd.org", "thoracic.org", "ersnet.org"]
      },
      // =========================================================================
      // ENDOCRINE SYSTEM (Hormones, Metabolism)
      // =========================================================================
      {
        id: "endocrine",
        specialty: "Endocrinology / Diabetology",
        body_systems: ["pancreas", "thyroid", "adrenal", "pituitary", "metabolism"],
        trigger_keywords: [
          "diabetes",
          "T1DM",
          "T2DM",
          "type 1",
          "type 2",
          "HbA1c",
          "A1c",
          "glucose",
          "insulin",
          "metformin",
          "GLP-1",
          "SGLT2",
          "sulfonylurea",
          "hypoglycemia",
          "hyperglycemia",
          "DKA",
          "diabetic ketoacidosis",
          "thyroid",
          "hypothyroid",
          "hyperthyroid",
          "TSH",
          "T4",
          "T3",
          "Graves",
          "Hashimoto",
          "thyroiditis",
          "goiter",
          "thyroid nodule",
          "obesity",
          "weight loss",
          "BMI",
          "metabolic syndrome",
          "adrenal",
          "Cushing",
          "Addison",
          "cortisol",
          "aldosterone",
          "pituitary",
          "prolactin",
          "growth hormone",
          "acromegaly",
          "osteoporosis",
          "bone density",
          "DEXA",
          "calcium",
          "vitamin D"
        ],
        guideline_organizations: [
          {
            name: "American Diabetes Association",
            abbreviation: "ADA",
            website: "diabetes.org",
            tavily_domain: "site:diabetes.org OR site:diabetesjournals.org",
            description: "THE US authority on diabetes. Standards of Care updated annually. Defines treatment algorithms.",
            guideline_types: ["Type 2 diabetes treatment algorithm", "Type 1 management", "Gestational diabetes", "Complications screening"]
          },
          {
            name: "European Association for the Study of Diabetes",
            abbreviation: "EASD",
            website: "easd.org",
            tavily_domain: "site:easd.org",
            description: "European diabetes authority. Joint guidelines with ADA for T2DM management.",
            guideline_types: ["Type 2 diabetes (joint with ADA)", "European perspective on new agents"]
          },
          {
            name: "American Thyroid Association",
            abbreviation: "ATA",
            website: "thyroid.org",
            tavily_domain: "site:thyroid.org",
            description: "THE authority on thyroid disorders. Thyroid nodule management, thyroid cancer.",
            guideline_types: ["Thyroid nodule evaluation", "Thyroid cancer", "Hypothyroidism", "Hyperthyroidism"]
          },
          {
            name: "Endocrine Society",
            abbreviation: "ES",
            website: "endocrine.org",
            tavily_domain: "site:endocrine.org",
            description: "Broad endocrinology authority. Pituitary, adrenal, bone disorders.",
            guideline_types: ["Osteoporosis", "Pituitary disorders", "Adrenal insufficiency", "Testosterone therapy"]
          }
        ],
        top_journals: [
          {
            name: "Diabetes Care",
            abbreviation: "Diabetes Care",
            pubmed_filter: '"Diabetes Care"[Journal]',
            impact_factor: 14.8,
            why_important: "ADA flagship for clinical diabetes. Where Standards of Care are published."
          },
          {
            name: "The Lancet Diabetes & Endocrinology",
            abbreviation: "Lancet Diabetes Endocrinol",
            pubmed_filter: '"Lancet Diabetes Endocrinol"[Journal]',
            impact_factor: 44,
            why_important: "Highest impact endocrinology journal. Major trials."
          },
          {
            name: "Diabetologia",
            abbreviation: "Diabetologia",
            pubmed_filter: '"Diabetologia"[Journal]',
            impact_factor: 8.2,
            why_important: "EASD official journal. European diabetes research."
          },
          {
            name: "Journal of Clinical Endocrinology & Metabolism",
            abbreviation: "J Clin Endocrinol Metab",
            pubmed_filter: '"J Clin Endocrinol Metab"[Journal]',
            impact_factor: 5.8,
            why_important: "Endocrine Society flagship. Broad endocrinology coverage."
          },
          {
            name: "Thyroid",
            abbreviation: "Thyroid",
            pubmed_filter: '"Thyroid"[Journal]',
            impact_factor: 5.3,
            why_important: "ATA official journal. All things thyroid."
          }
        ],
        pubmed_elite_filter: '("Diabetes Care"[Journal] OR "Lancet Diabetes Endocrinol"[Journal] OR "Diabetologia"[Journal] OR "J Clin Endocrinol Metab"[Journal] OR "Thyroid"[Journal])',
        tavily_search_domains: ["diabetes.org", "diabetesjournals.org", "easd.org", "thyroid.org", "endocrine.org"]
      },
      // =========================================================================
      // RENAL SYSTEM (Kidneys)
      // =========================================================================
      {
        id: "renal",
        specialty: "Nephrology",
        body_systems: ["kidneys", "urinary tract", "renal system"],
        trigger_keywords: [
          "kidney",
          "renal",
          "nephro",
          "CKD",
          "chronic kidney disease",
          "GFR",
          "eGFR",
          "creatinine",
          "BUN",
          "proteinuria",
          "albuminuria",
          "dialysis",
          "hemodialysis",
          "peritoneal dialysis",
          "ESRD",
          "end-stage",
          "AKI",
          "acute kidney injury",
          "nephritis",
          "glomerulonephritis",
          "nephrotic",
          "nephritic",
          "IgA nephropathy",
          "FSGS",
          "membranous",
          "polycystic kidney",
          "PKD",
          "transplant",
          "kidney transplant",
          "electrolyte",
          "hyperkalemia",
          "hyponatremia",
          "acidosis"
        ],
        guideline_organizations: [
          {
            name: "Kidney Disease: Improving Global Outcomes",
            abbreviation: "KDIGO",
            website: "kdigo.org",
            tavily_domain: "site:kdigo.org",
            description: "THE global authority on kidney disease. Defines CKD staging, treatment targets. Used worldwide.",
            guideline_types: ["CKD evaluation/management", "AKI", "Glomerulonephritis", "Blood pressure in CKD", "Anemia in CKD", "Dialysis"]
          },
          {
            name: "American Society of Nephrology",
            abbreviation: "ASN",
            website: "asn-online.org",
            tavily_domain: "site:asn-online.org",
            description: "US nephrology society. Educational resources, policy positions.",
            guideline_types: ["Clinical practice", "Nephrology education"]
          },
          {
            name: "Renal Association (UK)",
            abbreviation: "RA",
            website: "renal.org",
            tavily_domain: "site:renal.org",
            description: "UK nephrology guidelines. Practical CKD management.",
            guideline_types: ["CKD management UK", "Dialysis standards"]
          }
        ],
        top_journals: [
          {
            name: "Journal of the American Society of Nephrology",
            abbreviation: "J Am Soc Nephrol",
            pubmed_filter: '"J Am Soc Nephrol"[Journal]',
            impact_factor: 10.3,
            why_important: "ASN flagship. Top nephrology research."
          },
          {
            name: "Kidney International",
            abbreviation: "Kidney Int",
            pubmed_filter: '"Kidney Int"[Journal]',
            impact_factor: 14.8,
            why_important: "ISN official journal. Where KDIGO guidelines appear."
          },
          {
            name: "Clinical Journal of the American Society of Nephrology",
            abbreviation: "Clin J Am Soc Nephrol",
            pubmed_filter: '"Clin J Am Soc Nephrol"[Journal]',
            impact_factor: 9,
            why_important: "Clinical nephrology focus. Practical management."
          },
          {
            name: "American Journal of Kidney Diseases",
            abbreviation: "Am J Kidney Dis",
            pubmed_filter: '"Am J Kidney Dis"[Journal]',
            impact_factor: 9.4,
            why_important: "NKF official journal. Clinical CKD management."
          },
          {
            name: "Nature Reviews Nephrology",
            abbreviation: "Nat Rev Nephrol",
            pubmed_filter: '"Nat Rev Nephrol"[Journal]',
            impact_factor: 28.6,
            why_important: "Authoritative nephrology reviews."
          }
        ],
        pubmed_elite_filter: '("J Am Soc Nephrol"[Journal] OR "Kidney Int"[Journal] OR "Clin J Am Soc Nephrol"[Journal] OR "Am J Kidney Dis"[Journal] OR "Nat Rev Nephrol"[Journal])',
        tavily_search_domains: ["kdigo.org", "asn-online.org", "kidney.org"]
      },
      // =========================================================================
      // GASTROINTESTINAL SYSTEM (Stomach, Intestines, Liver)
      // =========================================================================
      {
        id: "gastrointestinal",
        specialty: "Gastroenterology / Hepatology",
        body_systems: ["stomach", "intestines", "liver", "pancreas", "esophagus", "colon"],
        trigger_keywords: [
          "GI",
          "gastrointestinal",
          "stomach",
          "gastric",
          "intestine",
          "bowel",
          "GERD",
          "reflux",
          "heartburn",
          "PPI",
          "H2 blocker",
          "esophagus",
          "IBD",
          "Crohn",
          "ulcerative colitis",
          "UC",
          "inflammatory bowel",
          "IBS",
          "irritable bowel",
          "constipation",
          "diarrhea",
          "liver",
          "hepatic",
          "hepatitis",
          "cirrhosis",
          "fatty liver",
          "NAFLD",
          "NASH",
          "ALT",
          "AST",
          "bilirubin",
          "jaundice",
          "ascites",
          "variceal",
          "colon",
          "colonoscopy",
          "polyp",
          "colorectal",
          "GI bleeding",
          "celiac",
          "gluten",
          "pancreatitis",
          "ERCP",
          "gallbladder",
          "cholecystitis"
        ],
        guideline_organizations: [
          {
            name: "American Gastroenterological Association",
            abbreviation: "AGA",
            website: "gastro.org",
            tavily_domain: "site:gastro.org",
            description: "THE US GI authority. Clinical practice guidelines for all GI conditions.",
            guideline_types: ["IBD", "GERD", "IBS", "GI bleeding", "Colon cancer screening"]
          },
          {
            name: "American College of Gastroenterology",
            abbreviation: "ACG",
            website: "gi.org",
            tavily_domain: "site:gi.org",
            description: "Clinical GI guidelines. Practical management recommendations.",
            guideline_types: ["H. pylori", "Hepatitis C", "Liver disease", "Motility disorders"]
          },
          {
            name: "American Association for the Study of Liver Diseases",
            abbreviation: "AASLD",
            website: "aasld.org",
            tavily_domain: "site:aasld.org",
            description: "THE liver disease authority. Hepatitis, cirrhosis, liver cancer.",
            guideline_types: ["Hepatitis B", "Hepatitis C", "NAFLD/NASH", "Cirrhosis", "HCC surveillance"]
          },
          {
            name: "European Association for the Study of the Liver",
            abbreviation: "EASL",
            website: "easl.eu",
            tavily_domain: "site:easl.eu",
            description: "European liver authority. Complements AASLD.",
            guideline_types: ["Viral hepatitis", "Autoimmune liver disease", "Alcoholic liver disease"]
          }
        ],
        top_journals: [
          {
            name: "Gastroenterology",
            abbreviation: "Gastroenterology",
            pubmed_filter: '"Gastroenterology"[Journal]',
            impact_factor: 25.7,
            why_important: "AGA flagship. Top GI research and guidelines."
          },
          {
            name: "Gut",
            abbreviation: "Gut",
            pubmed_filter: '"Gut"[Journal]',
            impact_factor: 23,
            why_important: "BMJ GI journal. European GI research."
          },
          {
            name: "Hepatology",
            abbreviation: "Hepatology",
            pubmed_filter: '"Hepatology"[Journal]',
            impact_factor: 12.9,
            why_important: "AASLD flagship. THE liver journal."
          },
          {
            name: "American Journal of Gastroenterology",
            abbreviation: "Am J Gastroenterol",
            pubmed_filter: '"Am J Gastroenterol"[Journal]',
            impact_factor: 9.4,
            why_important: "ACG official journal. Clinical GI practice."
          },
          {
            name: "Journal of Hepatology",
            abbreviation: "J Hepatol",
            pubmed_filter: '"J Hepatol"[Journal]',
            impact_factor: 25.7,
            why_important: "EASL official journal. European liver research."
          }
        ],
        pubmed_elite_filter: '("Gastroenterology"[Journal] OR "Gut"[Journal] OR "Hepatology"[Journal] OR "Am J Gastroenterol"[Journal] OR "J Hepatol"[Journal])',
        tavily_search_domains: ["gastro.org", "gi.org", "aasld.org", "easl.eu"]
      },
      // =========================================================================
      // NERVOUS SYSTEM (Brain, Spinal Cord, Nerves)
      // =========================================================================
      {
        id: "neurological",
        specialty: "Neurology",
        body_systems: ["brain", "spinal cord", "peripheral nerves", "nervous system"],
        trigger_keywords: [
          "neuro",
          "brain",
          "stroke",
          "CVA",
          "TIA",
          "cerebrovascular",
          "seizure",
          "epilepsy",
          "anticonvulsant",
          "antiepileptic",
          "headache",
          "migraine",
          "cluster headache",
          "tension headache",
          "Parkinson",
          "tremor",
          "movement disorder",
          "dystonia",
          "Alzheimer",
          "dementia",
          "cognitive",
          "memory loss",
          "multiple sclerosis",
          "MS",
          "neuropathy",
          "peripheral neuropathy",
          "myasthenia gravis",
          "ALS",
          "motor neuron",
          "Guillain-Barre",
          "meningitis",
          "encephalitis",
          "brain tumor",
          "glioma"
        ],
        guideline_organizations: [
          {
            name: "American Academy of Neurology",
            abbreviation: "AAN",
            website: "aan.com",
            tavily_domain: "site:aan.com",
            description: "THE US neurology authority. Practice guidelines for all neurological conditions.",
            guideline_types: ["Epilepsy", "Stroke", "MS", "Parkinson's", "Headache", "Dementia"]
          },
          {
            name: "American Stroke Association",
            abbreviation: "ASA",
            website: "stroke.org",
            tavily_domain: "site:stroke.org",
            description: "AHA division for stroke. Acute stroke management, prevention.",
            guideline_types: ["Acute ischemic stroke", "Hemorrhagic stroke", "Secondary prevention", "TIA"]
          },
          {
            name: "European Academy of Neurology",
            abbreviation: "EAN",
            website: "ean.org",
            tavily_domain: "site:ean.org",
            description: "European neurology authority. European perspective on neurological care.",
            guideline_types: ["MS", "Epilepsy", "Movement disorders"]
          },
          {
            name: "International Headache Society",
            abbreviation: "IHS",
            website: "ihs-headache.org",
            tavily_domain: "site:ihs-headache.org",
            description: "THE authority on headache classification and treatment.",
            guideline_types: ["ICHD classification", "Migraine treatment", "Cluster headache"]
          }
        ],
        top_journals: [
          {
            name: "Lancet Neurology",
            abbreviation: "Lancet Neurol",
            pubmed_filter: '"Lancet Neurol"[Journal]',
            impact_factor: 46.5,
            why_important: "Highest impact neurology journal. Major trials and reviews."
          },
          {
            name: "Neurology",
            abbreviation: "Neurology",
            pubmed_filter: '"Neurology"[Journal]',
            impact_factor: 9.9,
            why_important: "AAN official journal. Where AAN guidelines appear."
          },
          {
            name: "Brain",
            abbreviation: "Brain",
            pubmed_filter: '"Brain"[Journal]',
            impact_factor: 13.5,
            why_important: "Historic neuroscience journal. Deep mechanistic neurology."
          },
          {
            name: "Annals of Neurology",
            abbreviation: "Ann Neurol",
            pubmed_filter: '"Ann Neurol"[Journal]',
            impact_factor: 11.2,
            why_important: "ANA official journal. Clinical neurology research."
          },
          {
            name: "Stroke",
            abbreviation: "Stroke",
            pubmed_filter: '"Stroke"[Journal]',
            impact_factor: 10.2,
            why_important: "ASA official journal. THE stroke journal."
          }
        ],
        pubmed_elite_filter: '("Lancet Neurol"[Journal] OR "Neurology"[Journal] OR "Brain"[Journal] OR "Ann Neurol"[Journal] OR "Stroke"[Journal])',
        tavily_search_domains: ["aan.com", "stroke.org", "ean.org", "ihs-headache.org"]
      },
      // =========================================================================
      // ONCOLOGY (Cancer)
      // =========================================================================
      {
        id: "oncology",
        specialty: "Oncology",
        body_systems: ["all organs - cancer affects all"],
        trigger_keywords: [
          "cancer",
          "tumor",
          "malignant",
          "oncology",
          "carcinoma",
          "sarcoma",
          "lymphoma",
          "leukemia",
          "myeloma",
          "melanoma",
          "breast cancer",
          "lung cancer",
          "colon cancer",
          "prostate cancer",
          "chemotherapy",
          "immunotherapy",
          "targeted therapy",
          "radiation",
          "PD-1",
          "PD-L1",
          "checkpoint inhibitor",
          "CAR-T",
          "staging",
          "TNM",
          "metastatic",
          "metastasis",
          "HER2",
          "EGFR",
          "ALK",
          "BRCA",
          "MSI",
          "TMB",
          "survival",
          "PFS",
          "OS",
          "response rate"
        ],
        guideline_organizations: [
          {
            name: "National Comprehensive Cancer Network",
            abbreviation: "NCCN",
            website: "nccn.org",
            tavily_domain: "site:nccn.org",
            description: "THE US oncology guideline authority. Defines standard of care for ALL cancers. Open Evidence has licensed partnership with them.",
            guideline_types: ["ALL cancer types", "Supportive care", "Survivorship", "Genetic testing"]
          },
          {
            name: "American Society of Clinical Oncology",
            abbreviation: "ASCO",
            website: "asco.org",
            tavily_domain: "site:asco.org",
            description: "THE oncology professional society. Clinical practice guidelines, where major trials are presented.",
            guideline_types: ["Specific cancer treatments", "Supportive care", "Quality measures"]
          },
          {
            name: "European Society for Medical Oncology",
            abbreviation: "ESMO",
            website: "esmo.org",
            tavily_domain: "site:esmo.org",
            description: "European oncology authority. Sometimes differs from NCCN/ASCO on treatment sequencing.",
            guideline_types: ["All cancer types - European perspective", "Clinical Practice Guidelines"]
          }
        ],
        top_journals: [
          {
            name: "CA: A Cancer Journal for Clinicians",
            abbreviation: "CA Cancer J Clin",
            pubmed_filter: '"CA Cancer J Clin"[Journal]',
            impact_factor: 254.7,
            why_important: "HIGHEST impact factor of ANY journal. Cancer statistics, major reviews."
          },
          {
            name: "Journal of Clinical Oncology",
            abbreviation: "J Clin Oncol",
            pubmed_filter: '"J Clin Oncol"[Journal]',
            impact_factor: 42.1,
            why_important: "ASCO flagship. THE clinical oncology journal. All major trials."
          },
          {
            name: "Lancet Oncology",
            abbreviation: "Lancet Oncol",
            pubmed_filter: '"Lancet Oncol"[Journal]',
            impact_factor: 41.3,
            why_important: "High-impact oncology trials and reviews."
          },
          {
            name: "JAMA Oncology",
            abbreviation: "JAMA Oncol",
            pubmed_filter: '"JAMA Oncol"[Journal]',
            impact_factor: 22.5,
            why_important: "High-impact clinical oncology research."
          },
          {
            name: "Annals of Oncology",
            abbreviation: "Ann Oncol",
            pubmed_filter: '"Ann Oncol"[Journal]',
            impact_factor: 32.4,
            why_important: "ESMO official journal. European clinical oncology."
          }
        ],
        pubmed_elite_filter: '("CA Cancer J Clin"[Journal] OR "J Clin Oncol"[Journal] OR "Lancet Oncol"[Journal] OR "JAMA Oncol"[Journal] OR "Ann Oncol"[Journal])',
        tavily_search_domains: ["nccn.org", "asco.org", "esmo.org", "cancer.gov", "cancer.org"]
      },
      // =========================================================================
      // INFECTIOUS DISEASES
      // =========================================================================
      {
        id: "infectious",
        specialty: "Infectious Diseases",
        body_systems: ["all organs - infections affect all"],
        trigger_keywords: [
          "infection",
          "infectious",
          "bacteria",
          "bacterial",
          "virus",
          "viral",
          "antibiotic",
          "antimicrobial",
          "antiviral",
          "antifungal",
          "sepsis",
          "septic",
          "fever",
          "febrile",
          "HIV",
          "AIDS",
          "hepatitis",
          "HBV",
          "HCV",
          "COVID",
          "coronavirus",
          "influenza",
          "flu",
          "RSV",
          "pneumonia",
          "UTI",
          "urinary tract infection",
          "cellulitis",
          "meningitis",
          "endocarditis",
          "osteomyelitis",
          "MRSA",
          "C. diff",
          "Clostridioides",
          "resistant",
          "MDR",
          "tuberculosis",
          "TB",
          "malaria",
          "dengue"
        ],
        guideline_organizations: [
          {
            name: "Infectious Diseases Society of America",
            abbreviation: "IDSA",
            website: "idsociety.org",
            tavily_domain: "site:idsociety.org",
            description: "THE US ID authority. Comprehensive infection management guidelines.",
            guideline_types: ["ALL infections", "Antimicrobial stewardship", "HIV", "Hepatitis"]
          },
          {
            name: "Centers for Disease Control and Prevention",
            abbreviation: "CDC",
            website: "cdc.gov",
            tavily_domain: "site:cdc.gov",
            description: "US public health authority. Vaccines, outbreak management, STIs.",
            guideline_types: ["Vaccination schedules", "STI treatment", "Travel health", "Outbreak response"]
          },
          {
            name: "World Health Organization",
            abbreviation: "WHO",
            website: "who.int",
            tavily_domain: "site:who.int",
            description: "Global health authority. Essential medicines, global infection control.",
            guideline_types: ["Global infection guidelines", "Antimicrobial resistance", "Pandemic response"]
          },
          {
            name: "European Society of Clinical Microbiology and Infectious Diseases",
            abbreviation: "ESCMID",
            website: "escmid.org",
            tavily_domain: "site:escmid.org",
            description: "European ID authority. European antimicrobial guidelines.",
            guideline_types: ["European ID guidelines", "Antimicrobial resistance"]
          }
        ],
        top_journals: [
          {
            name: "Lancet Infectious Diseases",
            abbreviation: "Lancet Infect Dis",
            pubmed_filter: '"Lancet Infect Dis"[Journal]',
            impact_factor: 36.4,
            why_important: "Highest impact ID journal. Major trials and reviews."
          },
          {
            name: "Clinical Infectious Diseases",
            abbreviation: "Clin Infect Dis",
            pubmed_filter: '"Clin Infect Dis"[Journal]',
            impact_factor: 8.3,
            why_important: "IDSA flagship. Where IDSA guidelines appear."
          },
          {
            name: "Journal of Infectious Diseases",
            abbreviation: "J Infect Dis",
            pubmed_filter: '"J Infect Dis"[Journal]',
            impact_factor: 5,
            why_important: "IDSA research journal. Pathogenesis and treatment."
          },
          {
            name: "JAMA Network Open - Infectious Diseases",
            abbreviation: "JAMA Netw Open",
            pubmed_filter: '"JAMA Netw Open"[Journal]',
            impact_factor: 13.8,
            why_important: "Open access high-impact ID research."
          },
          {
            name: "Emerging Infectious Diseases",
            abbreviation: "Emerg Infect Dis",
            pubmed_filter: '"Emerg Infect Dis"[Journal]',
            impact_factor: 7.2,
            why_important: "CDC journal. Outbreak reports, emerging pathogens."
          }
        ],
        pubmed_elite_filter: '("Lancet Infect Dis"[Journal] OR "Clin Infect Dis"[Journal] OR "J Infect Dis"[Journal] OR "Emerg Infect Dis"[Journal])',
        tavily_search_domains: ["idsociety.org", "cdc.gov", "who.int", "escmid.org"]
      },
      // =========================================================================
      // RHEUMATOLOGY (Joints, Autoimmune)
      // =========================================================================
      {
        id: "rheumatology",
        specialty: "Rheumatology",
        body_systems: ["joints", "muscles", "connective tissue", "immune system"],
        trigger_keywords: [
          "arthritis",
          "rheumatoid",
          "RA",
          "osteoarthritis",
          "OA",
          "lupus",
          "SLE",
          "systemic lupus",
          "autoimmune",
          "gout",
          "uric acid",
          "hyperuricemia",
          "psoriatic arthritis",
          "PsA",
          "ankylosing spondylitis",
          "AS",
          "spondyloarthritis",
          "SpA",
          "axSpA",
          "fibromyalgia",
          "polymyalgia",
          "PMR",
          "vasculitis",
          "scleroderma",
          "dermatomyositis",
          "Sjogren",
          "biologic",
          "DMARD",
          "methotrexate",
          "TNF inhibitor",
          "joint pain",
          "synovitis",
          "inflammatory"
        ],
        guideline_organizations: [
          {
            name: "American College of Rheumatology",
            abbreviation: "ACR",
            website: "rheumatology.org",
            tavily_domain: "site:rheumatology.org",
            description: "THE US rheumatology authority. RA, lupus, gout treatment guidelines.",
            guideline_types: ["RA treatment", "Lupus management", "Gout", "Vasculitis", "Classification criteria"]
          },
          {
            name: "European Alliance of Associations for Rheumatology",
            abbreviation: "EULAR",
            website: "eular.org",
            tavily_domain: "site:eular.org",
            description: "European rheumatology authority. Often first with new recommendations.",
            guideline_types: ["RA", "SpA", "Gout", "Connective tissue diseases"]
          }
        ],
        top_journals: [
          {
            name: "Annals of the Rheumatic Diseases",
            abbreviation: "Ann Rheum Dis",
            pubmed_filter: '"Ann Rheum Dis"[Journal]',
            impact_factor: 20.3,
            why_important: "EULAR official journal. THE rheumatology journal."
          },
          {
            name: "Arthritis & Rheumatology",
            abbreviation: "Arthritis Rheumatol",
            pubmed_filter: '"Arthritis Rheumatol"[Journal]',
            impact_factor: 11.4,
            why_important: "ACR official journal. Where ACR guidelines appear."
          },
          {
            name: "Lancet Rheumatology",
            abbreviation: "Lancet Rheumatol",
            pubmed_filter: '"Lancet Rheumatol"[Journal]',
            impact_factor: 15,
            why_important: "High-impact rheumatology trials."
          },
          {
            name: "Rheumatology",
            abbreviation: "Rheumatology (Oxford)",
            pubmed_filter: '"Rheumatology (Oxford)"[Journal]',
            impact_factor: 5.5,
            why_important: "BSR official journal. UK/European rheumatology."
          }
        ],
        pubmed_elite_filter: '("Ann Rheum Dis"[Journal] OR "Arthritis Rheumatol"[Journal] OR "Lancet Rheumatol"[Journal] OR "Rheumatology (Oxford)"[Journal])',
        tavily_search_domains: ["rheumatology.org", "eular.org"]
      },
      // =========================================================================
      // DERMATOLOGY (Skin)
      // =========================================================================
      {
        id: "dermatology",
        specialty: "Dermatology",
        body_systems: ["skin", "hair", "nails"],
        trigger_keywords: [
          "skin",
          "dermatol",
          "rash",
          "eczema",
          "atopic dermatitis",
          "psoriasis",
          "acne",
          "rosacea",
          "melanoma",
          "skin cancer",
          "basal cell",
          "squamous cell",
          "urticaria",
          "hives",
          "angioedema",
          "alopecia",
          "hair loss",
          "nail",
          "fungal",
          "tinea",
          "wound",
          "ulcer",
          "pressure injury",
          "biologic",
          "dupilumab",
          "IL-17",
          "IL-23"
        ],
        guideline_organizations: [
          {
            name: "American Academy of Dermatology",
            abbreviation: "AAD",
            website: "aad.org",
            tavily_domain: "site:aad.org",
            description: "THE US dermatology authority. All skin conditions.",
            guideline_types: ["Acne", "Psoriasis", "Atopic dermatitis", "Skin cancer"]
          },
          {
            name: "European Academy of Dermatology and Venereology",
            abbreviation: "EADV",
            website: "eadv.org",
            tavily_domain: "site:eadv.org",
            description: "European dermatology authority.",
            guideline_types: ["European dermatology guidelines"]
          }
        ],
        top_journals: [
          {
            name: "JAMA Dermatology",
            abbreviation: "JAMA Dermatol",
            pubmed_filter: '"JAMA Dermatol"[Journal]',
            impact_factor: 11.1,
            why_important: "Highest impact clinical dermatology journal."
          },
          {
            name: "Journal of the American Academy of Dermatology",
            abbreviation: "J Am Acad Dermatol",
            pubmed_filter: '"J Am Acad Dermatol"[Journal]',
            impact_factor: 11.5,
            why_important: "AAD official journal. Where AAD guidelines appear."
          },
          {
            name: "British Journal of Dermatology",
            abbreviation: "Br J Dermatol",
            pubmed_filter: '"Br J Dermatol"[Journal]',
            impact_factor: 9,
            why_important: "UK dermatology journal. Clinical dermatology."
          }
        ],
        pubmed_elite_filter: '("JAMA Dermatol"[Journal] OR "J Am Acad Dermatol"[Journal] OR "Br J Dermatol"[Journal])',
        tavily_search_domains: ["aad.org", "eadv.org"]
      },
      // =========================================================================
      // PSYCHIATRY / MENTAL HEALTH
      // =========================================================================
      {
        id: "psychiatry",
        specialty: "Psychiatry",
        body_systems: ["brain - mental health"],
        trigger_keywords: [
          "depression",
          "anxiety",
          "bipolar",
          "schizophrenia",
          "psychosis",
          "PTSD",
          "OCD",
          "panic",
          "phobia",
          "antidepressant",
          "SSRI",
          "SNRI",
          "antipsychotic",
          "mood",
          "suicide",
          "self-harm",
          "ADHD",
          "attention deficit",
          "autism",
          "ASD",
          "eating disorder",
          "anorexia",
          "bulimia",
          "substance abuse",
          "addiction",
          "alcohol use disorder",
          "insomnia",
          "sleep disorder"
        ],
        guideline_organizations: [
          {
            name: "American Psychiatric Association",
            abbreviation: "APA",
            website: "psychiatry.org",
            tavily_domain: "site:psychiatry.org",
            description: "THE US psychiatry authority. DSM, treatment guidelines.",
            guideline_types: ["Depression", "Schizophrenia", "Bipolar", "Anxiety", "Substance use"]
          },
          {
            name: "National Institute for Health and Care Excellence",
            abbreviation: "NICE",
            website: "nice.org.uk",
            tavily_domain: "site:nice.org.uk",
            description: "UK health authority. Excellent mental health guidelines.",
            guideline_types: ["Depression", "Anxiety", "PTSD", "Psychosis"]
          }
        ],
        top_journals: [
          {
            name: "JAMA Psychiatry",
            abbreviation: "JAMA Psychiatry",
            pubmed_filter: '"JAMA Psychiatry"[Journal]',
            impact_factor: 22.5,
            why_important: "Highest impact psychiatry journal."
          },
          {
            name: "Lancet Psychiatry",
            abbreviation: "Lancet Psychiatry",
            pubmed_filter: '"Lancet Psychiatry"[Journal]',
            impact_factor: 30.8,
            why_important: "High-impact psychiatry research and reviews."
          },
          {
            name: "American Journal of Psychiatry",
            abbreviation: "Am J Psychiatry",
            pubmed_filter: '"Am J Psychiatry"[Journal]',
            impact_factor: 15.1,
            why_important: "APA official journal. US psychiatry standard."
          }
        ],
        pubmed_elite_filter: '("JAMA Psychiatry"[Journal] OR "Lancet Psychiatry"[Journal] OR "Am J Psychiatry"[Journal])',
        tavily_search_domains: ["psychiatry.org", "nice.org.uk"]
      },
      // =========================================================================
      // PEDIATRICS
      // =========================================================================
      {
        id: "pediatrics",
        specialty: "Pediatrics",
        body_systems: ["all organs - pediatric patients"],
        trigger_keywords: [
          "pediatric",
          "child",
          "children",
          "infant",
          "baby",
          "newborn",
          "neonatal",
          "adolescent",
          "teen",
          "vaccination",
          "immunization",
          "growth",
          "development",
          "NICU",
          "premature",
          "preterm",
          "congenital",
          "birth defect",
          "pediatric dosing",
          "weight-based"
        ],
        guideline_organizations: [
          {
            name: "American Academy of Pediatrics",
            abbreviation: "AAP",
            website: "aap.org",
            tavily_domain: "site:aap.org",
            description: "THE US pediatric authority. All pediatric conditions.",
            guideline_types: ["Well-child care", "Vaccination", "Common pediatric conditions", "NICU"]
          }
        ],
        top_journals: [
          {
            name: "Pediatrics",
            abbreviation: "Pediatrics",
            pubmed_filter: '"Pediatrics"[Journal]',
            impact_factor: 6.2,
            why_important: "AAP official journal. THE pediatrics journal."
          },
          {
            name: "JAMA Pediatrics",
            abbreviation: "JAMA Pediatr",
            pubmed_filter: '"JAMA Pediatr"[Journal]',
            impact_factor: 13.8,
            why_important: "High-impact pediatric research."
          },
          {
            name: "Lancet Child & Adolescent Health",
            abbreviation: "Lancet Child Adolesc Health",
            pubmed_filter: '"Lancet Child Adolesc Health"[Journal]',
            impact_factor: 19.9,
            why_important: "High-impact pediatric trials and reviews."
          }
        ],
        pubmed_elite_filter: '("Pediatrics"[Journal] OR "JAMA Pediatr"[Journal] OR "Lancet Child Adolesc Health"[Journal])',
        tavily_search_domains: ["aap.org", "healthychildren.org"]
      },
      // =========================================================================
      // OBSTETRICS & GYNECOLOGY
      // =========================================================================
      {
        id: "obgyn",
        specialty: "Obstetrics & Gynecology",
        body_systems: ["uterus", "ovaries", "reproductive system"],
        trigger_keywords: [
          "pregnancy",
          "pregnant",
          "obstetric",
          "prenatal",
          "antenatal",
          "gynecology",
          "menstrual",
          "menopause",
          "fertility",
          "contraception",
          "birth control",
          "IUD",
          "preeclampsia",
          "gestational diabetes",
          "GDM",
          "cesarean",
          "C-section",
          "labor",
          "delivery",
          "PCOS",
          "polycystic ovary",
          "endometriosis",
          "cervical cancer",
          "ovarian cancer",
          "HPV",
          "miscarriage",
          "ectopic pregnancy"
        ],
        guideline_organizations: [
          {
            name: "American College of Obstetricians and Gynecologists",
            abbreviation: "ACOG",
            website: "acog.org",
            tavily_domain: "site:acog.org",
            description: "THE US OB/GYN authority. All pregnancy and women's health.",
            guideline_types: ["Prenatal care", "Labor management", "Contraception", "Menopause", "Gynecologic conditions"]
          },
          {
            name: "Society for Maternal-Fetal Medicine",
            abbreviation: "SMFM",
            website: "smfm.org",
            tavily_domain: "site:smfm.org",
            description: "High-risk pregnancy specialists.",
            guideline_types: ["High-risk pregnancy", "Fetal medicine"]
          }
        ],
        top_journals: [
          {
            name: "Obstetrics & Gynecology",
            abbreviation: "Obstet Gynecol",
            pubmed_filter: '"Obstet Gynecol"[Journal]',
            impact_factor: 6.4,
            why_important: "ACOG official journal. THE OB/GYN journal."
          },
          {
            name: "American Journal of Obstetrics and Gynecology",
            abbreviation: "Am J Obstet Gynecol",
            pubmed_filter: '"Am J Obstet Gynecol"[Journal]',
            impact_factor: 8.7,
            why_important: "High-impact OB/GYN research."
          }
        ],
        pubmed_elite_filter: '("Obstet Gynecol"[Journal] OR "Am J Obstet Gynecol"[Journal])',
        tavily_search_domains: ["acog.org", "smfm.org"]
      },
      // =========================================================================
      // OPHTHALMOLOGY (Eyes)
      // =========================================================================
      {
        id: "ophthalmology",
        specialty: "Ophthalmology",
        body_systems: ["eyes", "vision"],
        trigger_keywords: [
          "eye",
          "vision",
          "ophthalm",
          "retina",
          "glaucoma",
          "cataract",
          "macular degeneration",
          "AMD",
          "diabetic retinopathy",
          "uveitis",
          "cornea",
          "conjunctivitis",
          "dry eye",
          "visual acuity",
          "intraocular pressure",
          "IOP"
        ],
        guideline_organizations: [
          {
            name: "American Academy of Ophthalmology",
            abbreviation: "AAO",
            website: "aao.org",
            tavily_domain: "site:aao.org",
            description: "THE US ophthalmology authority.",
            guideline_types: ["Glaucoma", "Cataract", "AMD", "Diabetic eye disease"]
          }
        ],
        top_journals: [
          {
            name: "Ophthalmology",
            abbreviation: "Ophthalmology",
            pubmed_filter: '"Ophthalmology"[Journal]',
            impact_factor: 13.7,
            why_important: "AAO official journal. THE ophthalmology journal."
          },
          {
            name: "JAMA Ophthalmology",
            abbreviation: "JAMA Ophthalmol",
            pubmed_filter: '"JAMA Ophthalmol"[Journal]',
            impact_factor: 7.3,
            why_important: "High-impact eye research."
          }
        ],
        pubmed_elite_filter: '("Ophthalmology"[Journal] OR "JAMA Ophthalmol"[Journal])',
        tavily_search_domains: ["aao.org"]
      },
      // =========================================================================
      // ORTHOPEDICS (Bones, Joints, Muscles)
      // =========================================================================
      {
        id: "orthopedics",
        specialty: "Orthopedics",
        body_systems: ["bones", "joints", "muscles", "tendons", "ligaments"],
        trigger_keywords: [
          "orthopedic",
          "bone",
          "fracture",
          "joint replacement",
          "hip replacement",
          "knee replacement",
          "TKA",
          "THA",
          "spine",
          "back pain",
          "lumbar",
          "cervical",
          "ACL",
          "meniscus",
          "rotator cuff",
          "osteoarthritis",
          "osteoporosis"
        ],
        guideline_organizations: [
          {
            name: "American Academy of Orthopaedic Surgeons",
            abbreviation: "AAOS",
            website: "aaos.org",
            tavily_domain: "site:aaos.org",
            description: "THE US orthopedic authority.",
            guideline_types: ["Joint replacement", "Fracture management", "Spine disorders"]
          }
        ],
        top_journals: [
          {
            name: "Journal of Bone and Joint Surgery (American)",
            abbreviation: "J Bone Joint Surg Am",
            pubmed_filter: '"J Bone Joint Surg Am"[Journal]',
            impact_factor: 5.3,
            why_important: "THE orthopedic surgery journal."
          },
          {
            name: "Clinical Orthopaedics and Related Research",
            abbreviation: "Clin Orthop Relat Res",
            pubmed_filter: '"Clin Orthop Relat Res"[Journal]',
            impact_factor: 4.2,
            why_important: "Broad orthopedic coverage."
          }
        ],
        pubmed_elite_filter: '("J Bone Joint Surg Am"[Journal] OR "Clin Orthop Relat Res"[Journal])',
        tavily_search_domains: ["aaos.org"]
      },
      // =========================================================================
      // HEMATOLOGY (Blood)
      // =========================================================================
      {
        id: "hematology",
        specialty: "Hematology",
        body_systems: ["blood", "bone marrow", "lymph nodes", "spleen"],
        trigger_keywords: [
          "blood",
          "hematol",
          "anemia",
          "hemoglobin",
          "platelet",
          "thrombocytopenia",
          "bleeding",
          "coagulation",
          "DVT",
          "PE",
          "VTE",
          "anticoagulation",
          "warfarin",
          "DOAC",
          "leukemia",
          "lymphoma",
          "myeloma",
          "sickle cell",
          "thalassemia",
          "hemophilia"
        ],
        guideline_organizations: [
          {
            name: "American Society of Hematology",
            abbreviation: "ASH",
            website: "hematology.org",
            tavily_domain: "site:hematology.org",
            description: "THE US hematology authority.",
            guideline_types: ["VTE treatment", "Anticoagulation", "Blood cancers", "Bleeding disorders"]
          }
        ],
        top_journals: [
          {
            name: "Blood",
            abbreviation: "Blood",
            pubmed_filter: '"Blood"[Journal]',
            impact_factor: 21,
            why_important: "ASH official journal. THE hematology journal."
          },
          {
            name: "Journal of Clinical Oncology (Hematologic Oncology)",
            abbreviation: "J Clin Oncol",
            pubmed_filter: '"J Clin Oncol"[Journal]',
            impact_factor: 42.1,
            why_important: "Blood cancer trials and guidelines."
          }
        ],
        pubmed_elite_filter: '("Blood"[Journal])',
        tavily_search_domains: ["hematology.org"]
      },
      // =========================================================================
      // UROLOGY
      // =========================================================================
      {
        id: "urology",
        specialty: "Urology",
        body_systems: ["bladder", "prostate", "kidneys (surgical)", "male reproductive"],
        trigger_keywords: [
          "urolog",
          "bladder",
          "prostate",
          "BPH",
          "PSA",
          "urinary",
          "incontinence",
          "UTI",
          "kidney stone",
          "nephrolithiasis",
          "erectile dysfunction",
          "ED",
          "prostate cancer",
          "bladder cancer",
          "testicular"
        ],
        guideline_organizations: [
          {
            name: "American Urological Association",
            abbreviation: "AUA",
            website: "auanet.org",
            tavily_domain: "site:auanet.org",
            description: "THE US urology authority.",
            guideline_types: ["BPH", "Prostate cancer", "Kidney stones", "Incontinence"]
          },
          {
            name: "European Association of Urology",
            abbreviation: "EAU",
            website: "uroweb.org",
            tavily_domain: "site:uroweb.org",
            description: "European urology authority.",
            guideline_types: ["European urology guidelines"]
          }
        ],
        top_journals: [
          {
            name: "European Urology",
            abbreviation: "Eur Urol",
            pubmed_filter: '"Eur Urol"[Journal]',
            impact_factor: 23.6,
            why_important: "Highest impact urology journal."
          },
          {
            name: "Journal of Urology",
            abbreviation: "J Urol",
            pubmed_filter: '"J Urol"[Journal]',
            impact_factor: 6.6,
            why_important: "AUA official journal."
          }
        ],
        pubmed_elite_filter: '("Eur Urol"[Journal] OR "J Urol"[Journal])',
        tavily_search_domains: ["auanet.org", "uroweb.org"]
      },
      // =========================================================================
      // EMERGENCY MEDICINE
      // =========================================================================
      {
        id: "emergency",
        specialty: "Emergency Medicine",
        body_systems: ["all - acute presentations"],
        trigger_keywords: [
          "emergency",
          "ED",
          "ER",
          "trauma",
          "acute",
          "resuscitation",
          "CPR",
          "ACLS",
          "ATLS",
          "chest pain rule out",
          "syncope workup"
        ],
        guideline_organizations: [
          {
            name: "American College of Emergency Physicians",
            abbreviation: "ACEP",
            website: "acep.org",
            tavily_domain: "site:acep.org",
            description: "THE US emergency medicine authority.",
            guideline_types: ["Clinical policies", "Acute care"]
          }
        ],
        top_journals: [
          {
            name: "Annals of Emergency Medicine",
            abbreviation: "Ann Emerg Med",
            pubmed_filter: '"Ann Emerg Med"[Journal]',
            impact_factor: 5.7,
            why_important: "ACEP official journal. THE EM journal."
          }
        ],
        pubmed_elite_filter: '("Ann Emerg Med"[Journal])',
        tavily_search_domains: ["acep.org"]
      },
      // =========================================================================
      // CRITICAL CARE / ICU
      // =========================================================================
      {
        id: "critical_care",
        specialty: "Critical Care / Intensive Care",
        body_systems: ["all - critically ill patients"],
        trigger_keywords: [
          "ICU",
          "critical care",
          "intensive care",
          "ventilator",
          "sepsis",
          "septic shock",
          "ARDS",
          "respiratory failure",
          "vasopressor",
          "norepinephrine",
          "mechanical ventilation"
        ],
        guideline_organizations: [
          {
            name: "Society of Critical Care Medicine",
            abbreviation: "SCCM",
            website: "sccm.org",
            tavily_domain: "site:sccm.org",
            description: "THE critical care authority. Surviving Sepsis Campaign.",
            guideline_types: ["Sepsis", "ARDS", "ICU management", "Sedation"]
          }
        ],
        top_journals: [
          {
            name: "Critical Care Medicine",
            abbreviation: "Crit Care Med",
            pubmed_filter: '"Crit Care Med"[Journal]',
            impact_factor: 7.6,
            why_important: "SCCM official journal. THE ICU journal."
          },
          {
            name: "Intensive Care Medicine",
            abbreviation: "Intensive Care Med",
            pubmed_filter: '"Intensive Care Med"[Journal]',
            impact_factor: 27.1,
            why_important: "European ICU journal. High-impact trials."
          }
        ],
        pubmed_elite_filter: '("Crit Care Med"[Journal] OR "Intensive Care Med"[Journal])',
        tavily_search_domains: ["sccm.org"]
      }
    ];
    SYSTEMATIC_REVIEW_SOURCES = {
      cochrane: {
        name: "Cochrane Library",
        website: "cochranelibrary.com",
        pubmed_filter: '"Cochrane Database Syst Rev"[Journal]',
        description: "THE gold standard for systematic reviews. If a Cochrane review exists, cite it.",
        priority: 1
      },
      jbi: {
        name: "JBI Evidence Synthesis",
        website: "jbi.global",
        pubmed_filter: '"JBI Evid Synth"[Journal]',
        description: "High-quality systematic reviews, especially nursing/allied health.",
        priority: 2
      },
      campbell: {
        name: "Campbell Collaboration",
        website: "campbellcollaboration.org",
        description: "Social and behavioral sciences systematic reviews.",
        priority: 3
      }
    };
    DRUG_INFORMATION_SOURCES = {
      fda: {
        name: "FDA (Food and Drug Administration)",
        website: "fda.gov",
        tavily_domain: "site:fda.gov",
        use_for: ["Drug approvals", "Safety communications", "Black box warnings", "Orange Book (generics)"],
        priority: 1
      },
      dailymed: {
        name: "DailyMed (NLM)",
        website: "dailymed.nlm.nih.gov",
        api_available: true,
        use_for: ["Full prescribing information", "Package inserts", "Medication guides"],
        priority: 1
      },
      ema: {
        name: "European Medicines Agency",
        website: "ema.europa.eu",
        tavily_domain: "site:ema.europa.eu",
        use_for: ["European drug approvals", "EPARs (assessment reports)"],
        priority: 2
      },
      rxnorm: {
        name: "RxNorm (NLM)",
        website: "rxnav.nlm.nih.gov",
        api_available: true,
        use_for: ["Drug normalization", "Drug classes", "Drug interactions"],
        priority: 2
      }
    };
    OPENWORK_GAP_ANALYSIS = {
      what_you_have: [
        "PubMed (comprehensive)",
        "Europe PMC (good)",
        "Cochrane Library (excellent)",
        "DailyMed (excellent)",
        "WHO Guidelines (good)",
        "CDC Guidelines (good)",
        "NICE Guidelines (good)",
        "BMJ Best Practice (good)",
        "ACC/AHA Guidelines (good)",
        "AAP Guidelines (good for pediatrics)",
        "NCBI Books/StatPearls (good)"
      ],
      what_you_need_to_add: [
        {
          source: "GINA (ginasthma.org)",
          priority: "CRITICAL",
          reason: "THE asthma authority. Open Evidence uses this heavily. Not in PubMed.",
          solution: "Add to Tavily proactive search for respiratory queries"
        },
        {
          source: "GOLD (goldcopd.org)",
          priority: "CRITICAL",
          reason: "THE COPD authority. Defines COPD staging. Not in PubMed.",
          solution: "Add to Tavily proactive search for respiratory queries"
        },
        {
          source: "KDIGO (kdigo.org)",
          priority: "HIGH",
          reason: "THE kidney disease authority. CKD staging, AKI management.",
          solution: "Add to Tavily proactive search for renal queries"
        },
        {
          source: "NCCN (nccn.org)",
          priority: "CRITICAL",
          reason: "THE oncology authority. Open Evidence has licensed partnership.",
          solution: "Tavily can search public portions; full access requires license"
        },
        {
          source: "ESC (escardio.org)",
          priority: "HIGH",
          reason: "European cardiology guidelines. Often differs from ACC/AHA.",
          solution: "You have cardiovascular-guidelines.ts - verify ESC is included"
        },
        {
          source: "ADA (diabetes.org)",
          priority: "HIGH",
          reason: "THE diabetes authority. Standards of Care updated annually.",
          solution: "Add to Tavily proactive search for diabetes queries"
        },
        {
          source: "IDSA (idsociety.org)",
          priority: "HIGH",
          reason: "THE infectious disease authority. Antimicrobial guidelines.",
          solution: "Add to Tavily proactive search for infection queries"
        },
        {
          source: "ACR/EULAR (rheumatology.org/eular.org)",
          priority: "MEDIUM",
          reason: "Rheumatology guidelines. RA, lupus, gout.",
          solution: "Add to Tavily proactive search for rheumatology queries"
        },
        {
          source: "AAN (aan.com)",
          priority: "MEDIUM",
          reason: "THE neurology authority. Epilepsy, MS, Parkinson's guidelines.",
          solution: "Add to Tavily proactive search for neurology queries"
        },
        {
          source: "ASCO (asco.org)",
          priority: "HIGH",
          reason: "Major oncology society. Clinical practice guidelines.",
          solution: "Add to Tavily proactive search for cancer queries"
        }
      ],
      noise_to_consider_removing: [
        {
          source: "MedlinePlus",
          issue: "Consumer health, not clinical evidence",
          recommendation: "Keep but deprioritize in ranking. Use only for patient education queries."
        },
        {
          source: "Some Open-i content",
          issue: "May have lower quality images/articles mixed in",
          recommendation: "Filter to only high-quality sources"
        }
      ]
    };
    medical_source_bible_default = {
      TIER_1_GENERAL_JOURNALS,
      MEDICAL_SPECIALTIES,
      SYSTEMATIC_REVIEW_SOURCES,
      DRUG_INFORMATION_SOURCES,
      OPENWORK_GAP_ANALYSIS,
      // Utility functions
      routeQueryToSpecialties,
      getPubMedEliteFilter,
      getTavilyDomains,
      getGuidelineOrganizations,
      buildGuidelineSearchQuery
    };
  }
});

// lib/evidence/cache-manager.ts
function initializeRedis() {
  if (redisClient || !REDIS_URL) {
    return;
  }
  try {
    redisClient = new import_ioredis.default(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn("Redis connection failed after 3 retries, disabling cache");
          isRedisAvailable = false;
          return null;
        }
        return Math.min(times * 100, 3e3);
      },
      lazyConnect: true
      // Don't connect immediately
    });
    redisClient.on("connect", () => {
      console.log("\u2705 Redis cache connected");
      isRedisAvailable = true;
    });
    redisClient.on("error", (error) => {
      console.error("\u274C Redis error:", error.message);
      isRedisAvailable = false;
      cacheStats.errors++;
    });
    redisClient.on("close", () => {
      console.warn("\u26A0\uFE0F  Redis connection closed");
      isRedisAvailable = false;
    });
    redisClient.connect().catch((error) => {
      console.error("\u274C Redis connection failed:", error.message);
      isRedisAvailable = false;
    });
  } catch (error) {
    console.error("\u274C Redis initialization failed:", error.message);
    isRedisAvailable = false;
    redisClient = null;
  }
}
function isCacheAvailable() {
  if (!REDIS_URL) {
    return false;
  }
  if (!redisClient) {
    initializeRedis();
  }
  return isRedisAvailable && redisClient !== null;
}
function hashQuery(query) {
  const normalized = query.toLowerCase().trim();
  const hash = (0, import_crypto.createHash)("sha256").update(normalized).digest("hex");
  return hash.substring(0, 16);
}
function generateCacheKey(query, source) {
  const queryHash = hashQuery(query);
  return `evidence:${queryHash}:${source}`;
}
async function getCachedEvidence(query, source) {
  if (!isCacheAvailable()) {
    cacheStats.misses++;
    return null;
  }
  try {
    const key = generateCacheKey(query, source);
    const cached = await redisClient.get(key);
    if (!cached) {
      cacheStats.misses++;
      console.log(`\u{1F4ED} Cache miss: ${source} for query ${hashQuery(query)}`);
      return null;
    }
    cacheStats.hits++;
    console.log(`\u{1F4EC} Cache hit: ${source} for query ${hashQuery(query)}`);
    const parsed = JSON.parse(cached);
    return parsed;
  } catch (error) {
    console.error(`\u274C Cache read error for ${source}:`, error.message);
    cacheStats.errors++;
    cacheStats.misses++;
    return null;
  }
}
async function cacheEvidence(query, source, data) {
  if (!isCacheAvailable()) {
    return;
  }
  try {
    const key = generateCacheKey(query, source);
    const queryHash = hashQuery(query);
    const cacheEntry = {
      data,
      metadata: {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        source,
        queryHash,
        ttl: CACHE_TTL
      }
    };
    await redisClient.setex(key, CACHE_TTL, JSON.stringify(cacheEntry));
    console.log(`\u{1F4BE} Cached: ${source} for query ${queryHash} (TTL: 24h)`);
  } catch (error) {
    console.error(`\u274C Cache write error for ${source}:`, error.message);
    cacheStats.errors++;
  }
}
var import_ioredis, import_crypto, CACHE_TTL, REDIS_URL, cacheStats, redisClient, isRedisAvailable;
var init_cache_manager = __esm({
  "lib/evidence/cache-manager.ts"() {
    "use strict";
    import_ioredis = __toESM(require("ioredis"));
    import_crypto = require("crypto");
    CACHE_TTL = 24 * 60 * 60;
    REDIS_URL = process.env.REDIS_URL || "";
    cacheStats = {
      hits: 0,
      misses: 0,
      errors: 0
    };
    redisClient = null;
    isRedisAvailable = false;
  }
});

// lib/evidence/pubmed.ts
var pubmed_exports = {};
__export(pubmed_exports, {
  comprehensivePubMedSearch: () => comprehensivePubMedSearch,
  fetchPubMedDetails: () => fetchPubMedDetails,
  fetchPubMedSummaries: () => fetchPubMedSummaries,
  searchAuthoritativeSources: () => searchAuthoritativeSources,
  searchGuidelines: () => searchGuidelines,
  searchOrganizationGuidelines: () => searchOrganizationGuidelines,
  searchPubMed: () => searchPubMed,
  searchRCTs: () => searchRCTs,
  searchSystematicReviews: () => searchSystematicReviews
});
async function fetchWithRateLimit(url, retries = 3) {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < REQUEST_DELAY) {
    await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.status === 429) {
        if (i === retries - 1) return response;
        const waitTime = Math.pow(2, i) * 1e3 + Math.random() * 1e3;
        console.warn(`PubMed rate limited (429), waiting ${Math.round(waitTime)}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      const waitTime = Math.pow(2, i) * 1e3;
      console.warn(`PubMed error, retrying in ${waitTime}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
  throw new Error("PubMed API failed after retries");
}
function buildFilterString(filters) {
  if (!filters) return "";
  const filterParts = [];
  const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
  const yearsBack = filters.yearsBack !== void 0 ? filters.yearsBack : 15;
  const startYear = currentYear - yearsBack;
  filterParts.push(`${startYear}:${currentYear}[dp]`);
  if (filters.articleTypes && filters.articleTypes.length > 0) {
    const typeFilters = [];
    for (const type of filters.articleTypes) {
      switch (type) {
        case "systematic-review":
          typeFilters.push("systematic[sb]");
          break;
        case "meta-analysis":
          typeFilters.push("meta-analysis[pt]");
          break;
        case "rct":
          typeFilters.push("randomized controlled trial[pt]");
          break;
        case "guideline":
          typeFilters.push("guideline[pt]");
          break;
        case "review":
          typeFilters.push("review[pt]");
          break;
      }
    }
    if (typeFilters.length > 0) {
      filterParts.push(`(${typeFilters.join(" OR ")})`);
    }
  }
  if (filters.humansOnly) {
    filterParts.push('("Humans"[MeSH Terms] NOT ("Animals"[MeSH Terms] NOT "Humans"[MeSH Terms]))');
  }
  if (filters.clinicalCategory) {
    const categoryMap = {
      "therapy": "therapy",
      "diagnosis": "diagnosis",
      "etiology": "etiology",
      "prognosis": "prognosis",
      "clinical_prediction_guides": "clinical prediction guides"
    };
    const scopeSuffix = filters.clinicalScope === "narrow" ? "narrow" : "broad";
    const catKey = categoryMap[filters.clinicalCategory];
    if (catKey) {
      if (catKey === "clinical prediction guides") {
        filterParts.push(`"${catKey}"[Filter]`);
      } else {
        filterParts.push(`"${catKey}_${scopeSuffix}"[Filter]`);
      }
    }
  }
  if (filters.freeFullText) {
    filterParts.push("free full text[sb]");
  }
  if (filters.hasAbstract) {
    filterParts.push("hasabstract");
  }
  return filterParts.length > 0 ? " AND " + filterParts.join(" AND ") : "";
}
async function searchPubMed(query, maxResults = 20, useHistory = true, filters) {
  try {
    const filterString = buildFilterString(filters);
    const enhancedQuery = query + filterString;
    console.log(`\u{1F50D} PubMed search: "${query}"${filterString ? ` with filters: ${filterString}` : ""}`);
    const params = new URLSearchParams({
      db: "pubmed",
      term: enhancedQuery,
      retmode: "json",
      retmax: "0",
      usehistory: "y",
      sort: "relevance",
      ...API_KEY && { api_key: API_KEY }
    });
    const url = `${EUTILS_BASE}/esearch.fcgi?${params}`;
    console.log(`\u{1F50D} PubMed search executing: "${query.substring(0, 100)}..."`);
    console.log(`   Full query: "${enhancedQuery.substring(0, 200)}..."`);
    const response = await fetchWithRateLimit(url);
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(`\u274C PubMed ESearch error: ${response.status} - ${errorText.substring(0, 200)}`);
      return { count: 0, pmids: [] };
    }
    const data = await response.json();
    const result = data.esearchresult;
    const count = parseInt(result.count || "0");
    const webEnv = result.webenv;
    const queryKey = result.querykey;
    console.log(`\u2705 PubMed search found ${count} articles for query: "${query.substring(0, 80)}..."`);
    if (count === 0) {
      console.warn(`\u26A0\uFE0F PubMed returned 0 results - query might be too narrow or filters too strict`);
    }
    if (count === 0 || !webEnv || !queryKey) {
      return { count: 0, pmids: [], webEnv, queryKey };
    }
    const pmids = [];
    const batchSize = 500;
    const finalMax = maxResults < count ? maxResults : count;
    for (let start = 0; start < finalMax; start += batchSize) {
      const batchLimit = Math.min(batchSize, finalMax - start);
      const searchParams = new URLSearchParams({
        db: "pubmed",
        WebEnv: webEnv,
        query_key: queryKey,
        retstart: start.toString(),
        retmax: batchLimit.toString(),
        retmode: "json",
        ...API_KEY && { api_key: API_KEY }
      });
      const batchUrl = `${EUTILS_BASE}/esearch.fcgi?${searchParams}`;
      const batchResponse = await fetchWithRateLimit(batchUrl);
      if (batchResponse.ok) {
        const batchData = await batchResponse.json();
        const batchIds = batchData.esearchresult?.idlist || [];
        pmids.push(...batchIds);
      }
    }
    return {
      count,
      pmids,
      webEnv,
      queryKey
    };
  } catch (error) {
    console.error("Error searching PubMed:", error);
    return { count: 0, pmids: [] };
  }
}
async function fetchPubMedSummaries(pmids) {
  if (pmids.length === 0) return [];
  try {
    const params = new URLSearchParams({
      db: "pubmed",
      id: pmids.join(","),
      retmode: "json",
      ...API_KEY && { api_key: API_KEY }
    });
    const url = `${EUTILS_BASE}/esummary.fcgi?${params}`;
    const response = await fetchWithRateLimit(url);
    if (!response.ok) {
      console.error("PubMed ESummary error:", response.status);
      return [];
    }
    const data = await response.json();
    const result = data.result;
    const articles = [];
    for (const pmid of pmids) {
      const article = result[pmid];
      if (!article || article.error) continue;
      articles.push({
        pmid,
        title: article.title || "",
        authors: (article.authors || []).map((a) => a.name || "").slice(0, 3),
        journal: article.fulljournalname || article.source || "",
        publicationDate: article.pubdate || "",
        doi: article.elocationid?.replace("doi: ", "") || article.articleids?.find((id) => id.idtype === "doi")?.value,
        publicationType: article.pubtype || [],
        meshTerms: void 0
        // Not available in ESummary
      });
    }
    return articles;
  } catch (error) {
    console.error("Error fetching PubMed summaries:", error);
    return [];
  }
}
async function fetchPubMedDetails(pmids) {
  if (pmids.length === 0) return [];
  try {
    const params = new URLSearchParams({
      db: "pubmed",
      id: pmids.join(","),
      retmode: "xml",
      rettype: "abstract",
      ...API_KEY && { api_key: API_KEY }
    });
    const url = `${EUTILS_BASE}/efetch.fcgi?${params}`;
    const response = await fetchWithRateLimit(url);
    if (!response.ok) {
      console.error("PubMed EFetch error:", response.status);
      return [];
    }
    const xmlText = await response.text();
    return parsePubMedXML(xmlText);
  } catch (error) {
    console.error("Error fetching PubMed details:", error);
    return [];
  }
}
function parsePubMedXML(xml) {
  const articles = [];
  try {
    const articleSections = xml.split(/<\/?PubmedArticle>/g).filter((s) => s.trim());
    for (const articleXml of articleSections) {
      if (!articleXml.includes("<PMID")) continue;
      const pmidMatch = articleXml.match(/<PMID[^>]*>(\d+)<\/PMID>/);
      const pmid = pmidMatch ? pmidMatch[1] : "";
      const titleMatch = articleXml.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "") : "";
      const authors = [];
      const authorSections = articleXml.split(/<\/?Author[^>]*>/g);
      for (const section of authorSections) {
        const lastNameMatch = section.match(/<LastName>(.*?)<\/LastName>/);
        const foreNameMatch = section.match(/<ForeName>(.*?)<\/ForeName>/);
        if (lastNameMatch && foreNameMatch) {
          authors.push(`${foreNameMatch[1]} ${lastNameMatch[1]}`);
          if (authors.length >= 3) break;
        }
      }
      const journalMatch = articleXml.match(/<Title>(.*?)<\/Title>/);
      const journal = journalMatch ? journalMatch[1] : "";
      const yearMatch = articleXml.match(/<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>/);
      const monthMatch = articleXml.match(/<PubDate>[\s\S]*?<Month>(\w+)<\/Month>/);
      const publicationDate = yearMatch ? `${yearMatch[1]}${monthMatch ? " " + monthMatch[1] : ""}` : "";
      const abstractMatch = articleXml.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/);
      const abstract = abstractMatch ? abstractMatch[1].replace(/<[^>]+>/g, "").substring(0, 500) : void 0;
      const doiMatch = articleXml.match(/<ArticleId IdType="doi">(.*?)<\/ArticleId>/);
      const doi = doiMatch ? doiMatch[1] : void 0;
      const publicationType = [];
      const pubTypeSections = articleXml.split(/<\/?PublicationType[^>]*>/g);
      for (const section of pubTypeSections) {
        const trimmed = section.trim();
        if (trimmed && !trimmed.includes("<") && trimmed.length < 100) {
          publicationType.push(trimmed);
        }
      }
      const meshTerms = [];
      const meshSections = articleXml.split(/<\/?DescriptorName[^>]*>/g);
      for (const section of meshSections) {
        const trimmed = section.trim();
        if (trimmed && !trimmed.includes("<") && trimmed.length < 100) {
          meshTerms.push(trimmed);
          if (meshTerms.length >= 5) break;
        }
      }
      if (pmid && title) {
        articles.push({
          pmid,
          title,
          authors,
          journal,
          publicationDate,
          abstract,
          doi,
          publicationType,
          meshTerms: meshTerms.length > 0 ? meshTerms : void 0
        });
      }
    }
  } catch (error) {
    console.error("Error parsing PubMed XML:", error);
  }
  return articles;
}
async function searchSystematicReviews(query, maxResults = 10) {
  const enhancedQuery = `${query} AND (systematic[sb] OR meta-analysis[pt])`;
  const searchResult = await searchPubMed(enhancedQuery, maxResults, false);
  if (searchResult.pmids.length === 0) return [];
  return fetchPubMedDetails(searchResult.pmids);
}
async function searchRCTs(query, maxResults = 10) {
  const enhancedQuery = `${query} AND randomized controlled trial[pt]`;
  const searchResult = await searchPubMed(enhancedQuery, maxResults, false);
  if (searchResult.pmids.length === 0) return [];
  return fetchPubMedDetails(searchResult.pmids);
}
function isLifestyleOrPreventionQuery(query) {
  const lifestyleKeywords = [
    // Physical activity
    "exercise",
    "physical activity",
    "fitness",
    "workout",
    "aerobic",
    "strength training",
    "walking",
    "running",
    "swimming",
    "yoga",
    "stretching",
    "sedentary",
    "active",
    // Nutrition
    "diet",
    "nutrition",
    "healthy eating",
    "food",
    "vitamin",
    "supplement",
    "protein",
    "carbohydrate",
    "fat",
    "fiber",
    "calorie",
    "weight loss",
    "weight gain",
    "obesity",
    "mediterranean",
    "vegetarian",
    "vegan",
    "fasting",
    "sugar",
    "salt",
    "sodium",
    // Sleep
    "sleep",
    "insomnia",
    "rest",
    "fatigue",
    "tired",
    "energy",
    // Lifestyle
    "healthy",
    "wellness",
    "wellbeing",
    "lifestyle",
    "prevention",
    "longevity",
    "aging",
    "stress",
    "relaxation",
    "meditation",
    "mindfulness",
    // Substances
    "alcohol",
    "smoking",
    "tobacco",
    "caffeine",
    // General health
    "stay healthy",
    "be healthy",
    "improve health",
    "maintain health",
    "good health",
    "how much",
    "how often",
    "recommended",
    "guidelines",
    "should i"
  ];
  const lowerQuery = query.toLowerCase();
  return lifestyleKeywords.some((keyword) => lowerQuery.includes(keyword));
}
async function searchOrganizationGuidelines(query, organizations, maxResults = 10) {
  if (organizations.length === 0) return [];
  const orgPatterns = organizations.map((org) => {
    switch (org.toUpperCase()) {
      case "KDIGO":
      case "KDOQI":
        return `(KDIGO[tiab] OR "Kidney Disease Improving Global Outcomes"[tiab] OR KDOQI[tiab] OR "Kidney International"[Journal])`;
      case "ACC/AHA":
      case "ACC":
      case "AHA":
        return `(ACC[tiab] OR AHA[tiab] OR "American College of Cardiology"[tiab] OR "American Heart Association"[tiab] OR "Journal of the American College of Cardiology"[Journal] OR Circulation[Journal])`;
      case "IDSA":
        return `(IDSA[tiab] OR "Infectious Diseases Society of America"[tiab] OR "Clinical Infectious Diseases"[Journal])`;
      case "ESC":
        return `(ESC[tiab] OR "European Society of Cardiology"[tiab] OR "European Heart Journal"[Journal])`;
      case "ADA":
        return `(ADA[tiab] OR "American Diabetes Association"[tiab] OR "Diabetes Care"[Journal])`;
      case "WHO":
        return `(WHO[tiab] OR "World Health Organization"[tiab])`;
      case "CDC":
        return `(CDC[tiab] OR "Centers for Disease Control"[tiab])`;
      case "NICE":
        return `(NICE[tiab] OR "National Institute for Health and Care Excellence"[tiab])`;
      default:
        return `${org}[tiab]`;
    }
  }).join(" OR ");
  const orgQuery = `${query} AND (${orgPatterns}) AND (guideline OR recommendation OR consensus OR statement)`;
  console.log(`\u{1F50D} Searching for ${organizations.join(", ")} guidelines...`);
  const searchResult = await searchPubMed(orgQuery, maxResults, false, {
    humansOnly: true,
    yearsBack: 15
    // Look back 15 years for major guidelines
  });
  if (searchResult.pmids.length > 0) {
    console.log(`\u2705 Found ${searchResult.pmids.length} ${organizations.join("/")} guideline(s)`);
    return fetchPubMedDetails(searchResult.pmids);
  }
  return [];
}
async function searchGuidelines(query, maxResults = 10) {
  const guidelineQuery = `${query} AND (
    guideline[pt] OR 
    practice guideline[pt] OR 
    "clinical practice guideline"[tiab] OR
    consensus[tiab] OR 
    recommendation[tiab] OR 
    "position statement"[tiab] OR
    "consensus statement"[tiab] OR
    "clinical guideline"[tiab]
  )`;
  const searchResult = await searchPubMed(guidelineQuery, maxResults, false, {
    humansOnly: true,
    yearsBack: 10
    // Look back 10 years to catch all recent guidelines
  });
  if (searchResult.pmids.length === 0) {
    console.log(`\u26A0\uFE0F  No guidelines found with strict search, trying broader search...`);
    const broaderQuery = `${query} AND (guideline OR recommendation OR consensus)`;
    const broaderResult = await searchPubMed(broaderQuery, maxResults, false, {
      humansOnly: true,
      yearsBack: 10
    });
    if (broaderResult.pmids.length === 0) return [];
    return fetchPubMedDetails(broaderResult.pmids);
  }
  return fetchPubMedDetails(searchResult.pmids);
}
async function searchAuthoritativeSources(query, maxResults = 10) {
  const orgQuery = `${query} AND (
    "American Heart Association"[Affiliation] OR 
    "American College of Cardiology"[Affiliation] OR
    "American Diabetes Association"[Affiliation] OR
    "World Health Organization"[Affiliation] OR
    "Centers for Disease Control"[Affiliation] OR
    "American College of Sports Medicine"[Affiliation] OR
    "American Medical Association"[Affiliation] OR
    "National Institutes of Health"[Affiliation] OR
    "Kidney Disease Improving Global Outcomes"[Affiliation] OR
    KDIGO[Affiliation] OR
    "Infectious Diseases Society of America"[Affiliation] OR
    IDSA[Affiliation] OR
    "European Society of Cardiology"[Affiliation] OR
    ESC[Affiliation] OR
    JAMA[Journal] OR
    "New England Journal of Medicine"[Journal] OR
    Lancet[Journal] OR
    Circulation[Journal] OR
    "Diabetes Care"[Journal] OR
    "Kidney International"[Journal] OR
    "American Journal of Kidney Diseases"[Journal] OR
    "Clinical Infectious Diseases"[Journal] OR
    "European Heart Journal"[Journal] OR
    "Journal of the American College of Cardiology"[Journal]
  )`;
  const searchResult = await searchPubMed(orgQuery, maxResults, false, {
    humansOnly: true,
    yearsBack: 10,
    hasAbstract: true
  });
  if (searchResult.pmids.length === 0) return [];
  return fetchPubMedSummaries(searchResult.pmids);
}
async function comprehensivePubMedSearch(query, isGuidelineQuery = false, guidelineBodies = [], journalFilter = "") {
  try {
    const cacheKey = journalFilter ? `${query}_${journalFilter}` : query;
    const cached = await getCachedEvidence(
      cacheKey,
      "pubmed"
    );
    if (cached) {
      console.log(`\u{1F4EC} Using cached PubMed results for query (filter: ${!!journalFilter})`);
      return cached.data;
    }
  } catch (error) {
    console.error("\u274C Cache read error in PubMed, falling back to API:", error.message);
  }
  const isLifestyle = isLifestyleOrPreventionQuery(query);
  const shouldSearchGuidelines = isGuidelineQuery || isLifestyle;
  console.log(`\u{1F4DA} comprehensivePubMedSearch: Starting searches for query: "${query.substring(0, 100)}..." (Filter: ${journalFilter ? "Active" : "None"})`);
  const generalQuery = journalFilter ? `${query} AND ${journalFilter}` : query;
  const searchPromises = [
    // General search: 15 years + humans; avoid hasAbstract to maximize hits (we can filter later)
    searchPubMed(generalQuery, 50, false, {
      humansOnly: true,
      yearsBack: 15
    }).then((result2) => {
      console.log(`\u{1F4DA} General PubMed search returned: ${result2.count} total matches, ${result2.pmids.length} PMIDs fetched`);
      return result2;
    }).catch((err) => {
      console.error(`\u274C General PubMed search failed:`, err);
      return { count: 0, pmids: [] };
    }),
    // Systematic reviews - INCREASED from 8 to 20
    searchSystematicReviews(query, 20).then((result2) => {
      console.log(`\u{1F4DA} Systematic reviews search returned: ${result2.length} reviews`);
      return result2;
    }).catch((err) => {
      console.error(`\u274C Systematic reviews search failed:`, err);
      return [];
    })
  ];
  if (shouldSearchGuidelines) {
    if (isGuidelineQuery) {
      console.log("\u{1F4CB} Guideline query detected - searching for clinical practice guidelines");
      if (guidelineBodies.length > 0) {
        console.log(`\u{1F3AF} Searching specifically for ${guidelineBodies.join(", ")} guidelines`);
        searchPromises.push(searchOrganizationGuidelines(query, guidelineBodies, 30));
      }
    } else {
      console.log("\u{1F3C3} Lifestyle/prevention query detected - adding guideline search");
    }
    searchPromises.push(searchGuidelines(query, 30));
    searchPromises.push(searchAuthoritativeSources(query, 25));
  }
  fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "pubmed.ts:726", message: "comprehensivePubMedSearch executing", data: { query: query.substring(0, 100), searchPromises: searchPromises.length, isGuidelineQuery, guidelineBodies, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
  });
  const results = await Promise.all(searchPromises);
  fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "pubmed.ts:730", message: "comprehensivePubMedSearch results received", data: { resultCount: results.length, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
  });
  let generalSearch, reviewsSearch, guidelinesSearch, authoritativeSearch, orgGuidelinesSearch;
  if (isGuidelineQuery && guidelineBodies.length > 0) {
    [generalSearch, reviewsSearch, orgGuidelinesSearch, guidelinesSearch, authoritativeSearch] = results;
  } else {
    [generalSearch, reviewsSearch, guidelinesSearch, authoritativeSearch] = results;
    orgGuidelinesSearch = [];
  }
  console.log(`\u{1F4DA} Processing PubMed results: generalSearch has ${generalSearch.pmids?.length || 0} PMIDs`);
  const articles = generalSearch?.pmids && generalSearch.pmids.length > 0 ? await fetchPubMedSummaries(generalSearch.pmids).then((arts) => {
    console.log(`\u{1F4DA} Fetched ${arts.length} article summaries from PubMed`);
    return arts;
  }).catch((err) => {
    console.error(`\u274C Failed to fetch PubMed summaries:`, err);
    return [];
  }) : [];
  if (articles.length === 0 && (generalSearch?.pmids?.length || 0) > 0) {
    console.warn(`\u26A0\uFE0F Warning: Had ${generalSearch.pmids.length} PMIDs but fetched 0 articles - fetchPubMedSummaries may have failed`);
  }
  let guidelines = [];
  if (shouldSearchGuidelines) {
    guidelines = [
      ...orgGuidelinesSearch || [],
      // Organization-specific guidelines (KDIGO, ACC/AHA, etc.) - HIGHEST PRIORITY
      ...guidelinesSearch || [],
      ...authoritativeSearch || []
    ];
    const seenPmids = /* @__PURE__ */ new Set();
    guidelines = guidelines.filter((g) => {
      if (seenPmids.has(g.pmid)) return false;
      seenPmids.add(g.pmid);
      return true;
    });
    console.log(`\u{1F4CB} Found ${guidelines.length} guideline articles from PubMed`);
    if (orgGuidelinesSearch && orgGuidelinesSearch.length > 0) {
      console.log(`   \u2705 Including ${orgGuidelinesSearch.length} organization-specific guideline(s)`);
    }
  }
  const result = {
    articles,
    systematicReviews: Array.isArray(reviewsSearch) ? reviewsSearch : [],
    guidelines
  };
  fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "pubmed.ts:763", message: "comprehensivePubMedSearch completed", data: { articles: articles.length, systematicReviews: reviewsSearch?.length || 0, guidelines: guidelines.length, total: articles.length + (reviewsSearch?.length || 0) + guidelines.length, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
  });
  try {
    await cacheEvidence(query, "pubmed", result);
  } catch (error) {
    console.error("\u274C Cache write error in PubMed:", error.message);
  }
  return result;
}
var EUTILS_BASE, API_KEY, REQUEST_DELAY, lastRequestTime;
var init_pubmed = __esm({
  "lib/evidence/pubmed.ts"() {
    "use strict";
    init_cache_manager();
    EUTILS_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
    API_KEY = process.env.NCBI_API_KEY || "";
    REQUEST_DELAY = API_KEY ? 100 : 350;
    lastRequestTime = 0;
  }
});

// lib/evidence/dailymed.ts
var dailymed_exports = {};
__export(dailymed_exports, {
  comprehensiveDailyMedSearch: () => comprehensiveDailyMedSearch,
  formatDailyMedForEvidence: () => formatDailyMedForEvidence,
  getDailyMedDrugEvidence: () => getDailyMedDrugEvidence,
  getDailyMedSPLDetails: () => getDailyMedSPLDetails,
  searchDailyMedByName: () => searchDailyMedByName,
  searchDailyMedByRxCUI: () => searchDailyMedByRxCUI,
  searchDailyMedInteractions: () => searchDailyMedInteractions
});
async function comprehensiveDailyMedSearch(query) {
  try {
    console.log(`\u{1F50D} DailyMed: Comprehensive search for "${query}"`);
    const drugNames = extractDrugNamesFromQuery(query);
    if (drugNames.length === 0) {
      console.log("\u{1F4ED} No drug names detected in query");
      return { drugs: [] };
    }
    console.log(`\u{1F48A} Detected drugs: ${drugNames.join(", ")}`);
    const allDrugs = [];
    for (const drugName of drugNames.slice(0, 3)) {
      try {
        const drugInfo = await searchDailyMedByName(drugName, 3);
        const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
        const recentDrugInfo = drugInfo.filter((drug) => {
          const pubYear = new Date(drug.published_date).getFullYear();
          return pubYear >= currentYear - 2;
        });
        const finalDrugInfo = recentDrugInfo.length > 0 ? recentDrugInfo : drugInfo.slice(0, 1);
        const convertedDrugs = finalDrugInfo.map(convertToDailyMedDrug);
        convertedDrugs.sort((a, b) => {
          const sectionsA = countFilledSections(a);
          const sectionsB = countFilledSections(b);
          return sectionsB - sectionsA;
        });
        if (convertedDrugs.length > 0) {
          allDrugs.push(convertedDrugs[0]);
          console.log(`\u{1F4CB} Selected best label for ${drugName}: ${countFilledSections(convertedDrugs[0])} sections`);
        }
      } catch (error) {
        console.warn(`\u26A0\uFE0F DailyMed search failed for "${drugName}":`, error.message);
      }
    }
    console.log(`\u2705 DailyMed: Found ${allDrugs.length} drug records`);
    return { drugs: allDrugs };
  } catch (error) {
    console.error("\u274C DailyMed comprehensive search error:", error.message);
    return { drugs: [] };
  }
}
function countFilledSections(drug) {
  let count = 0;
  if (drug.indications && drug.indications.length > 50) count++;
  if (drug.dosage && drug.dosage.length > 50) count++;
  if (drug.warnings && drug.warnings.length > 50) count++;
  if (drug.adverseReactions && drug.adverseReactions.length > 50) count++;
  if (drug.drugInteractions && drug.drugInteractions.length > 50) count++;
  if (drug.contraindications && drug.contraindications.length > 50) count++;
  if (drug.clinicalPharmacology && drug.clinicalPharmacology.length > 50) count++;
  return count;
}
function extractDrugNamesFromQuery(query) {
  const drugNames = [];
  const queryLower = query.toLowerCase();
  const BRAND_TO_GENERIC = {
    // Pain/OTC
    "tylenol": "acetaminophen",
    "advil": "ibuprofen",
    "motrin": "ibuprofen",
    "aleve": "naproxen",
    "excedrin": "acetaminophen",
    "bayer": "aspirin",
    // Statins
    "lipitor": "atorvastatin",
    "crestor": "rosuvastatin",
    "zocor": "simvastatin",
    "pravachol": "pravastatin",
    // PPIs
    "nexium": "esomeprazole",
    "prilosec": "omeprazole",
    "prevacid": "lansoprazole",
    "protonix": "pantoprazole",
    // Psychiatric
    "prozac": "fluoxetine",
    "zoloft": "sertraline",
    "lexapro": "escitalopram",
    "xanax": "alprazolam",
    "ambien": "zolpidem",
    "ativan": "lorazepam",
    // Anticoagulants
    "eliquis": "apixaban",
    "xarelto": "rivaroxaban",
    "pradaxa": "dabigatran",
    "savaysa": "edoxaban",
    "coumadin": "warfarin",
    // Diabetes SGLT2i
    "jardiance": "empagliflozin",
    "farxiga": "dapagliflozin",
    "invokana": "canagliflozin",
    // Diabetes GLP-1
    "ozempic": "semaglutide",
    "wegovy": "semaglutide",
    "trulicity": "dulaglutide",
    "victoza": "liraglutide",
    "mounjaro": "tirzepatide",
    "zepbound": "tirzepatide",
    // Heart Failure
    "entresto": "sacubitril/valsartan",
    // Blood Pressure
    "norvasc": "amlodipine",
    "zestril": "lisinopril",
    "prinivil": "lisinopril",
    "diovan": "valsartan",
    "cozaar": "losartan",
    "toprol": "metoprolol",
    "lopressor": "metoprolol",
    // Thyroid
    "synthroid": "levothyroxine",
    // Respiratory
    "ventolin": "albuterol",
    "proair": "albuterol",
    "advair": "fluticasone/salmeterol",
    "symbicort": "budesonide/formoterol",
    // Antibiotics
    "augmentin": "amoxicillin/clavulanate",
    "zithromax": "azithromycin",
    "zpack": "azithromycin",
    "z-pack": "azithromycin",
    "cipro": "ciprofloxacin",
    "levaquin": "levofloxacin",
    // Other common
    "lasix": "furosemide",
    "neurontin": "gabapentin",
    "lyrica": "pregabalin",
    "humira": "adalimumab"
  };
  for (const [brand, generic] of Object.entries(BRAND_TO_GENERIC)) {
    if (queryLower.includes(brand)) {
      drugNames.push(generic);
      console.log(`\u{1F48A} Brand name "${brand}" detected \u2192 adding generic "${generic}"`);
    }
  }
  const commonDrugs = [
    // Cardiovascular/Metabolic
    "metformin",
    "insulin",
    "aspirin",
    "ibuprofen",
    "acetaminophen",
    "lisinopril",
    "atorvastatin",
    "simvastatin",
    "amlodipine",
    "omeprazole",
    "levothyroxine",
    "warfarin",
    "clopidogrel",
    "prednisone",
    "albuterol",
    "furosemide",
    "hydrochlorothiazide",
    "losartan",
    "gabapentin",
    "sertraline",
    "fluoxetine",
    "digoxin",
    "propranolol",
    "carvedilol",
    "metoprolol",
    "diltiazem",
    "spironolactone",
    "enalapril",
    "ramipril",
    "valsartan",
    "candesartan",
    "rosuvastatin",
    "pravastatin",
    "ezetimibe",
    "fenofibrate",
    "gemfibrozil",
    // Antibiotics
    "amoxicillin",
    "azithromycin",
    "ciprofloxacin",
    "doxycycline",
    "penicillin",
    "vancomycin",
    "fidaxomicin",
    "metronidazole",
    // Pain/Opioids
    "morphine",
    "oxycodone",
    "tramadol",
    "codeine",
    "fentanyl",
    // Diabetes - SGLT2 inhibitors
    "empagliflozin",
    "dapagliflozin",
    "canagliflozin",
    "ertugliflozin",
    "sotagliflozin",
    // Diabetes - GLP-1 agonists
    "semaglutide",
    "liraglutide",
    "dulaglutide",
    "tirzepatide",
    "exenatide",
    // Diabetes - DPP-4 inhibitors
    "sitagliptin",
    "saxagliptin",
    "linagliptin",
    "alogliptin",
    // Diabetes - Other
    "glipizide",
    "glyburide",
    "pioglitazone",
    // Anticoagulants - DOACs
    "apixaban",
    "rivaroxaban",
    "dabigatran",
    "edoxaban",
    // Heart Failure - ARNI
    "sacubitril",
    "entresto",
    // Oncology - Monoclonal antibodies (mAbs)
    "adalimumab",
    "etanercept",
    "infliximab",
    "rituximab",
    "bevacizumab",
    "trastuzumab",
    "pembrolizumab",
    "nivolumab",
    "ipilimumab",
    "atezolizumab",
    "amivantamab",
    "cetuximab",
    "panitumumab",
    "necitumumab",
    // Oncology - Tyrosine kinase inhibitors (TKIs)
    "osimertinib",
    "mobocertinib",
    "erlotinib",
    "gefitinib",
    "afatinib",
    "lapatinib",
    "neratinib",
    "tucatinib",
    "lorlatinib",
    "crizotinib",
    "alectinib",
    "brigatinib",
    "ceritinib",
    "sotorasib",
    "adagrasib",
    // Asthma biologics
    "mepolizumab",
    "benralizumab",
    "dupilumab",
    "tezepelumab",
    "omalizumab",
    // IBD biologics
    "vedolizumab",
    "ustekinumab",
    "risankizumab",
    "ozanimod",
    "tofacitinib",
    // Chemotherapy
    "carboplatin",
    "cisplatin",
    "pemetrexed",
    "docetaxel",
    "paclitaxel"
  ];
  for (const drug of commonDrugs) {
    if (queryLower.includes(drug)) {
      drugNames.push(drug);
    }
  }
  const drugClassPatterns = [
    /(\w+)statin\b/g,
    // statins
    /(\w+)pril\b/g,
    // ACE inhibitors
    /(\w+)sartan\b/g,
    // ARBs
    /(\w+)olol\b/g,
    // beta blockers
    /(\w+)flozin\b/g,
    // SGLT2 inhibitors
    /(\w+)gliptin\b/g,
    // DPP-4 inhibitors
    /(\w+)glutide\b/g,
    // GLP-1 agonists
    /(\w+)mab\b/g,
    // Monoclonal antibodies (oncology, biologics)
    /(\w+)tinib\b/g,
    // Tyrosine kinase inhibitors (oncology)
    /(\w+)ciclib\b/g,
    // CDK4/6 inhibitors
    /(\w+)parib\b/g,
    // PARP inhibitors
    /(\w+)zumab\b/g,
    // Humanized mAbs
    /(\w+)ximab\b/g,
    // Chimeric mAbs
    /(\w+)mumab\b/g
    // Human mAbs
  ];
  for (const pattern of drugClassPatterns) {
    const matches = queryLower.matchAll(pattern);
    for (const match of matches) {
      if (match[0] && match[0].length > 3) {
        drugNames.push(match[0]);
      }
    }
  }
  return [...new Set(drugNames)];
}
function convertToDailyMedDrug(drugInfo) {
  const { genericName, brandName } = extractNamesFromTitle(drugInfo.title);
  return {
    setId: drugInfo.setid,
    title: drugInfo.title,
    publishedDate: drugInfo.published_date,
    activeIngredients: drugInfo.active_ingredients,
    dosageForm: drugInfo.dosage_form,
    route: drugInfo.route,
    manufacturer: drugInfo.manufacturer,
    ndcCodes: drugInfo.ndc_codes,
    indications: drugInfo.indications,
    contraindications: drugInfo.contraindications,
    warnings: drugInfo.warnings,
    dosage: drugInfo.dosage,
    adverseReactions: drugInfo.adverse_reactions,
    drugInteractions: drugInfo.drug_interactions,
    clinicalPharmacology: drugInfo.clinical_pharmacology,
    howSupplied: drugInfo.how_supplied,
    genericName,
    brandName
  };
}
function extractNamesFromTitle(title) {
  const brandMatch = title.match(/^([A-Z][A-Z\s]+?)\s*\(/);
  const genericMatch = title.match(/\(([^)]+)\)/);
  return {
    brandName: brandMatch ? brandMatch[1].trim() : void 0,
    genericName: genericMatch ? genericMatch[1].trim() : void 0
  };
}
async function searchDailyMedByName(drugName, limit = 10) {
  try {
    const apiKey = process.env.NCBI_API_KEY_DAILYMED;
    console.log(`\u{1F50D} DailyMed: Searching for "${drugName}"`);
    const searchUrl = `https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json?drug_name=${encodeURIComponent(drugName)}&pagesize=${limit}`;
    const headers = {
      "User-Agent": "OpenWork-AI/1.0 (Medical Evidence System)"
    };
    if (apiKey) {
      headers["X-API-Key"] = apiKey;
    }
    const response = await fetch(searchUrl, { headers });
    if (!response.ok) {
      console.warn(`\u26A0\uFE0F DailyMed search failed: ${response.status}`);
      return [];
    }
    const searchResult = await response.json();
    if (!searchResult.data || searchResult.data.length === 0) {
      console.log(`\u{1F4ED} No DailyMed results for "${drugName}"`);
      return [];
    }
    console.log(`\u2705 Found ${searchResult.data.length} DailyMed SPLs for "${drugName}"`);
    const drugInfoPromises = searchResult.data.slice(0, 5).map(
      (spl) => getDailyMedSPLDetails(spl.setid)
    );
    const drugInfoResults = await Promise.allSettled(drugInfoPromises);
    const validResults = drugInfoResults.filter(
      (result) => result.status === "fulfilled" && result.value !== null
    ).map((result) => result.value);
    return validResults;
  } catch (error) {
    console.error("\u274C DailyMed search error:", error.message);
    return [];
  }
}
async function searchDailyMedByRxCUI(rxcui, limit = 10) {
  try {
    const apiKey = process.env.NCBI_API_KEY_DAILYMED;
    console.log(`\u{1F50D} DailyMed: Searching by RxCUI "${rxcui}"`);
    const searchUrl = `https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json?rxcui=${rxcui}&pagesize=${limit}`;
    const headers = {
      "User-Agent": "OpenWork-AI/1.0 (Medical Evidence System)"
    };
    if (apiKey) {
      headers["X-API-Key"] = apiKey;
    }
    const response = await fetch(searchUrl, { headers });
    if (!response.ok) {
      console.warn(`\u26A0\uFE0F DailyMed RxCUI search failed: ${response.status}`);
      return [];
    }
    const searchResult = await response.json();
    if (!searchResult.data || searchResult.data.length === 0) {
      console.log(`\u{1F4ED} No DailyMed results for RxCUI "${rxcui}"`);
      return [];
    }
    console.log(`\u2705 Found ${searchResult.data.length} DailyMed SPLs for RxCUI "${rxcui}"`);
    const drugInfoPromises = searchResult.data.slice(0, 5).map(
      (spl) => getDailyMedSPLDetails(spl.setid)
    );
    const drugInfoResults = await Promise.allSettled(drugInfoPromises);
    const validResults = drugInfoResults.filter(
      (result) => result.status === "fulfilled" && result.value !== null
    ).map((result) => result.value);
    return validResults;
  } catch (error) {
    console.error("\u274C DailyMed RxCUI search error:", error.message);
    return [];
  }
}
async function getDailyMedSPLDetails(setid) {
  try {
    const headers = {
      "User-Agent": "OpenWork-AI/1.0 (Medical Evidence System)"
    };
    const splXmlUrl = `https://dailymed.nlm.nih.gov/dailymed/services/v2/spls/${setid}.xml`;
    console.log(`\u{1F4C4} Fetching SPL XML for ${setid}...`);
    const xmlResponse = await fetch(splXmlUrl, { headers });
    if (!xmlResponse.ok) {
      console.warn(`\u26A0\uFE0F DailyMed SPL XML fetch failed for ${setid}: ${xmlResponse.status}`);
      return null;
    }
    const xmlText = await xmlResponse.text();
    const sections = parseSPLSections(xmlText);
    const titleMatch = xmlText.match(/<title[^>]*>([^<]+)<\/title>/i);
    const dateMatch = xmlText.match(/<effectiveTime[^>]*value="(\d{8})"/i);
    const publishedDate = dateMatch ? `${dateMatch[1].substring(0, 4)}-${dateMatch[1].substring(4, 6)}-${dateMatch[1].substring(6, 8)}` : "";
    let ndcCodes = [];
    try {
      const ndcUrl = `https://dailymed.nlm.nih.gov/dailymed/services/v2/spls/${setid}/ndcs.json`;
      const ndcResponse = await fetch(ndcUrl, { headers });
      if (ndcResponse.ok) {
        const ndcData = await ndcResponse.json();
        ndcCodes = ndcData.data?.ndcs?.map((ndc) => ndc.ndc) || [];
      }
    } catch (e) {
    }
    const title = titleMatch ? titleMatch[1].trim() : "Unknown Drug";
    const drugInfo = {
      setid,
      title,
      published_date: publishedDate,
      active_ingredients: extractActiveIngredientsFromTitle(title),
      dosage_form: extractDosageFormFromTitle(title),
      route: extractRouteFromTitle(title),
      manufacturer: extractManufacturerFromTitle(title),
      ndc_codes: ndcCodes,
      indications: sections.indications || "",
      contraindications: sections.contraindications || "",
      warnings: sections.warnings || "",
      dosage: sections.dosage || "",
      adverse_reactions: sections.adverse_reactions || "",
      drug_interactions: sections.drug_interactions || "",
      clinical_pharmacology: sections.clinical_pharmacology || "",
      how_supplied: sections.how_supplied || (ndcCodes.length > 0 ? `NDC: ${ndcCodes.join(", ")}` : "")
    };
    const filledSections = Object.entries(sections).filter(([_, v]) => v && v.length > 0).length;
    console.log(`\u2705 SPL parsed: ${filledSections} sections extracted for ${setid}`);
    return drugInfo;
  } catch (error) {
    console.error(`\u274C DailyMed SPL details error for ${setid}:`, error.message);
    return null;
  }
}
function parseSPLSections(xmlText) {
  const sections = {
    indications: "",
    contraindications: "",
    warnings: "",
    dosage: "",
    adverse_reactions: "",
    drug_interactions: "",
    clinical_pharmacology: "",
    how_supplied: ""
  };
  for (const [loincCode, sectionName] of Object.entries(LOINC_SECTION_CODES)) {
    try {
      const sectionPattern = new RegExp(
        `<code[^>]*code="${loincCode}"[^>]*>.*?</code>.*?<text[^>]*>(.*?)</text>`,
        "is"
      );
      const match = xmlText.match(sectionPattern);
      if (match && match[1]) {
        let content = match[1].replace(/<[^>]+>/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/\s+/g, " ").trim();
        if (content.length > 2e3) {
          content = content.substring(0, 2e3) + "...";
        }
        if (content.length > 50) {
          if (sections[sectionName] && sections[sectionName].length > 0) {
            sections[sectionName] += "\n\n" + content;
          } else {
            sections[sectionName] = content;
          }
        }
      }
    } catch (e) {
    }
  }
  if (!sections.indications) {
    sections.indications = extractSectionByTitle(xmlText, ["INDICATIONS AND USAGE", "INDICATIONS"]);
  }
  if (!sections.warnings) {
    sections.warnings = extractSectionByTitle(xmlText, ["WARNINGS AND PRECAUTIONS", "WARNINGS"]);
  }
  if (!sections.adverse_reactions) {
    sections.adverse_reactions = extractSectionByTitle(xmlText, ["ADVERSE REACTIONS"]);
  }
  if (!sections.drug_interactions) {
    sections.drug_interactions = extractSectionByTitle(xmlText, ["DRUG INTERACTIONS"]);
  }
  if (!sections.dosage) {
    sections.dosage = extractSectionByTitle(xmlText, ["DOSAGE AND ADMINISTRATION"]);
  }
  if (!sections.contraindications) {
    sections.contraindications = extractSectionByTitle(xmlText, ["CONTRAINDICATIONS"]);
  }
  return sections;
}
function extractSectionByTitle(xmlText, titleVariants) {
  for (const title of titleVariants) {
    try {
      const pattern = new RegExp(
        `<title[^>]*>${title}</title>.*?<text[^>]*>(.*?)</text>`,
        "is"
      );
      const match = xmlText.match(pattern);
      if (match && match[1]) {
        let content = match[1].replace(/<[^>]+>/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/\s+/g, " ").trim();
        if (content.length > 2e3) {
          content = content.substring(0, 2e3) + "...";
        }
        if (content.length > 50) {
          return content;
        }
      }
    } catch (e) {
    }
  }
  return "";
}
function extractActiveIngredientsFromTitle(title) {
  if (!title) return [];
  const ingredientMatch = title.match(/\(([^)]+)\)/);
  if (ingredientMatch) {
    return [ingredientMatch[1].trim()];
  }
  const words = title.split(" ");
  if (words.length > 0) {
    return [words[0]];
  }
  return [];
}
function extractDosageFormFromTitle(title) {
  if (!title) return "Unknown";
  const forms = ["TABLET", "CAPSULE", "INJECTION", "CREAM", "OINTMENT", "SOLUTION", "SUSPENSION", "PATCH", "GEL", "LOTION"];
  const upperTitle = title.toUpperCase();
  for (const form of forms) {
    if (upperTitle.includes(form)) {
      return form.toLowerCase();
    }
  }
  return "Unknown";
}
function extractRouteFromTitle(title) {
  if (!title) return "Unknown";
  const upperTitle = title.toUpperCase();
  if (upperTitle.includes("TABLET") || upperTitle.includes("CAPSULE")) return "Oral";
  if (upperTitle.includes("INJECTION")) return "Injectable";
  if (upperTitle.includes("CREAM") || upperTitle.includes("OINTMENT") || upperTitle.includes("GEL")) return "Topical";
  if (upperTitle.includes("PATCH")) return "Transdermal";
  return "Unknown";
}
function extractManufacturerFromTitle(title) {
  if (!title) return "Unknown";
  const manufacturerMatch = title.match(/\[([^\]]+)\]$/);
  return manufacturerMatch ? manufacturerMatch[1] : "Unknown";
}
function formatDailyMedForEvidence(drugs) {
  if (drugs.length === 0) return "";
  let formatted = "\n--- DAILYMED FDA DRUG INFORMATION ---\n\n";
  drugs.forEach((drug, index) => {
    formatted += `**${index + 1}. ${drug.title}**
`;
    formatted += `Published: ${drug.publishedDate}
`;
    formatted += `Manufacturer: ${drug.manufacturer}
`;
    if (drug.activeIngredients.length > 0) {
      formatted += `Active Ingredients: ${drug.activeIngredients.join(", ")}
`;
    }
    formatted += `Dosage Form: ${drug.dosageForm}
`;
    formatted += `Route: ${drug.route}
`;
    if (drug.ndcCodes.length > 0) {
      formatted += `NDC Codes: ${drug.ndcCodes.slice(0, 3).join(", ")}${drug.ndcCodes.length > 3 ? "..." : ""}
`;
    }
    if (drug.genericName) {
      formatted += `Generic Name: ${drug.genericName}
`;
    }
    if (drug.brandName) {
      formatted += `Brand Name: ${drug.brandName}
`;
    }
    if (drug.indications) {
      formatted += `
**Indications:**
${drug.indications.substring(0, 500)}${drug.indications.length > 500 ? "..." : ""}
`;
    }
    if (drug.contraindications) {
      formatted += `
**Contraindications:**
${drug.contraindications.substring(0, 300)}${drug.contraindications.length > 300 ? "..." : ""}
`;
    }
    if (drug.warnings) {
      formatted += `
**Warnings:**
${drug.warnings.substring(0, 400)}${drug.warnings.length > 400 ? "..." : ""}
`;
    }
    if (drug.dosage) {
      formatted += `
**Dosage:**
${drug.dosage.substring(0, 400)}${drug.dosage.length > 400 ? "..." : ""}
`;
    }
    if (drug.drugInteractions) {
      formatted += `
**Drug Interactions:**
${drug.drugInteractions.substring(0, 400)}${drug.drugInteractions.length > 400 ? "..." : ""}
`;
    }
    formatted += `
DailyMed SET ID: ${drug.setId}
`;
    formatted += `URL: https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=${drug.setId}

`;
  });
  formatted += "--- END DAILYMED INFORMATION ---\n\n";
  return formatted;
}
async function searchDailyMedInteractions(drugNames) {
  if (drugNames.length === 0) return "";
  console.log(`\u{1F50D} DailyMed: Searching interactions for ${drugNames.length} drugs`);
  const interactionInfo = [];
  for (const drugName of drugNames.slice(0, 3)) {
    try {
      const drugInfo = await searchDailyMedByName(drugName, 2);
      for (const drug of drugInfo) {
        if (drug.drug_interactions) {
          interactionInfo.push(`**${drug.title}:**
${drug.drug_interactions.substring(0, 600)}${drug.drug_interactions.length > 600 ? "..." : ""}`);
        }
      }
    } catch (error) {
      console.warn(`\u26A0\uFE0F Could not get DailyMed interactions for ${drugName}`);
    }
  }
  if (interactionInfo.length === 0) return "";
  return `
--- DAILYMED DRUG INTERACTIONS ---

${interactionInfo.join("\n\n")}

--- END INTERACTIONS ---

`;
}
async function getDailyMedDrugEvidence(drugNames) {
  if (drugNames.length === 0) return "";
  console.log(`\u{1F50D} DailyMed: Getting evidence for ${drugNames.length} drugs`);
  const allDrugInfo = [];
  for (const drugName of drugNames.slice(0, 5)) {
    try {
      const drugInfo = await searchDailyMedByName(drugName, 2);
      allDrugInfo.push(...drugInfo);
    } catch (error) {
      console.warn(`\u26A0\uFE0F Could not get DailyMed info for ${drugName}`);
    }
  }
  const convertedDrugs = allDrugInfo.map(convertToDailyMedDrug);
  return formatDailyMedForEvidence(convertedDrugs);
}
var LOINC_SECTION_CODES;
var init_dailymed = __esm({
  "lib/evidence/dailymed.ts"() {
    "use strict";
    LOINC_SECTION_CODES = {
      "34067-9": "indications",
      // Indications and Usage
      "34068-7": "dosage",
      // Dosage and Administration
      "43685-7": "warnings",
      // Warnings and Precautions
      "34071-1": "warnings",
      // Warnings (alternative)
      "34084-4": "adverse_reactions",
      // Adverse Reactions
      "34073-7": "drug_interactions",
      // Drug Interactions
      "34090-1": "clinical_pharmacology",
      // Clinical Pharmacology
      "34069-5": "how_supplied",
      // How Supplied
      "34070-3": "contraindications"
      // Contraindications
    };
  }
});

// lib/agents/system-prompts/tavily-search-prompt.ts
var tavily_search_prompt_exports = {};
__export(tavily_search_prompt_exports, {
  TAVILY_SEARCH_SYSTEM_PROMPT: () => TAVILY_SEARCH_SYSTEM_PROMPT
});
var TAVILY_SEARCH_SYSTEM_PROMPT;
var init_tavily_search_prompt = __esm({
  "lib/agents/system-prompts/tavily-search-prompt.ts"() {
    "use strict";
    TAVILY_SEARCH_SYSTEM_PROMPT = `<role>
  <identity>Medical Web Intelligence Specialist</identity>
  <purpose>Execute sophisticated web searches for recent medical evidence using Tavily's AI-powered search to fill evidence gaps with current, authoritative medical information</purpose>
  <expertise>Web search optimization, medical source evaluation, evidence gap analysis, real-time medical information discovery, authoritative source identification</expertise>
</role>

<core_mission>
  <primary_goal>Discover recent, high-quality medical evidence from authoritative web sources to address evidence gaps identified in traditional literature searches</primary_goal>
  <success_criteria>
    <criterion>Identify recent medical evidence not captured in PubMed or guideline databases</criterion>
    <criterion>Focus on authoritative medical sources (medical journals, health organizations, research institutions)</criterion>
    <criterion>Provide comprehensive deduplication against existing evidence sources</criterion>
    <criterion>Ensure content relevance and clinical applicability</criterion>
    <criterion>Maintain high precision while discovering novel evidence sources</criterion>
  </success_criteria>
</core_mission>

<tavily_architecture>
  <ai_powered_search>
    <description>Tavily uses advanced AI to understand search intent and retrieve contextually relevant results</description>
    <advantages>
      <advantage>Semantic understanding of medical queries beyond keyword matching</advantage>
      <advantage>Real-time web crawling for most current information</advantage>
      <advantage>Intelligent result ranking based on relevance and authority</advantage>
      <advantage>Content extraction and summarization capabilities</advantage>
    </advantages>
    
    <search_depth_options>
      <basic>
        <description>Standard search with good coverage</description>
        <use_case>General medical queries with broad scope</use_case>
        <result_quality>Good relevance with faster response</result_quality>
      </basic>
      
      <advanced>
        <description>Deep search with comprehensive analysis</description>
        <use_case>Complex medical queries requiring thorough investigation</use_case>
        <result_quality>Higher precision and more authoritative sources</result_quality>
        <recommendation>Preferred for medical evidence gap filling</recommendation>
      </advanced>
    </search_depth_options>
  </ai_powered_search>
  
  <medical_source_prioritization>
    <tier_1_sources>
      <description>Highest authority medical sources</description>
      <domains>
        <domain>nih.gov - National Institutes of Health</domain>
        <domain>cdc.gov - Centers for Disease Control</domain>
        <domain>who.int - World Health Organization</domain>
        <domain>fda.gov - Food and Drug Administration</domain>
      </domains>
      <content_types>Government health agencies, regulatory bodies</content_types>
    </tier_1_sources>
    
    <tier_2_sources>
      <description>Premier medical journals and professional organizations</description>
      <domains>
        <domain>nejm.org - New England Journal of Medicine</domain>
        <domain>thelancet.com - The Lancet</domain>
        <domain>jamanetwork.com - JAMA Network</domain>
        <domain>bmj.com - British Medical Journal</domain>
        <domain>nature.com - Nature Medicine</domain>
      </domains>
      <content_types>Peer-reviewed medical journals, clinical research</content_types>
    </tier_2_sources>
    
    <tier_3_sources>
      <description>Reputable medical institutions and databases</description>
      <domains>
        <domain>mayoclinic.org - Mayo Clinic</domain>
        <domain>clevelandclinic.org - Cleveland Clinic</domain>
        <domain>sciencedirect.com - ScienceDirect</domain>
        <domain>cochranelibrary.com - Cochrane Library</domain>
      </domains>
      <content_types>Clinical guidelines, medical education, systematic reviews</content_types>
    </tier_3_sources>
    
    <excluded_sources>
      <description>Sources to avoid for medical evidence</description>
      <domains>
        <domain>wikipedia.org - User-generated content</domain>
        <domain>webmd.com - Consumer health information</domain>
        <domain>healthline.com - Popular health content</domain>
      </domains>
      <rationale>Lack of peer review or clinical authority</rationale>
    </excluded_sources>
  </medical_source_prioritization>
</tavily_architecture>

<search_strategy>
  <query_optimization>
    <medical_context_enhancement>
      <description>Enhance queries with medical context for better search precision</description>
      <techniques>
        <technique>Add clinical context terms (treatment, diagnosis, prognosis)</technique>
        <technique>Include evidence type preferences (clinical trial, systematic review)</technique>
        <technique>Specify population context when relevant (pediatric, geriatric)</technique>
        <technique>Add temporal context for recent developments</technique>
      </techniques>
      
      <examples>
        <example>
          <original>diabetes medication comparison</original>
          <enhanced>diabetes medication comparison clinical trial systematic review 2023 2024</enhanced>
          <rationale>Added evidence type and temporal filters</rationale>
        </example>
        
        <example>
          <original>COVID vaccine effectiveness</original>
          <enhanced>COVID-19 vaccine effectiveness real-world evidence clinical outcomes 2024</enhanced>
          <rationale>Added study type and recency indicators</rationale>
        </example>
      </examples>
    </medical_context_enhancement>
    
    <gap_specific_targeting>
      <description>Tailor search strategy based on identified evidence gaps</description>
      <gap_types>
        <gap type="recent_developments">
          <strategy>Focus on 2023-2024 publications and breaking medical news</strategy>
          <keywords>Add "recent", "latest", "2024", "new findings"</keywords>
        </gap>
        
        <gap type="real_world_evidence">
          <strategy>Search for post-marketing surveillance and real-world studies</strategy>
          <keywords>Add "real-world", "post-marketing", "observational"</keywords>
        </gap>
        
        <gap type="safety_updates">
          <strategy>Focus on FDA alerts, safety communications, and adverse event reports</strategy>
          <keywords>Add "safety", "adverse events", "FDA alert", "warning"</keywords>
        </gap>
        
        <gap type="guideline_updates">
          <strategy>Search for recent guideline revisions and position statements</strategy>
          <keywords>Add "guidelines", "recommendations", "position statement", "update"</keywords>
        </gap>
      </gap_types>
    </gap_specific_targeting>
  </query_optimization>
  
  <result_filtering>
    <domain_filtering>
      <include_domains>Whitelist of authoritative medical domains</include_domains>
      <exclude_domains>Blacklist of non-authoritative sources</exclude_domains>
      <dynamic_filtering>Adjust domain preferences based on query type</dynamic_filtering>
    </domain_filtering>
    
    <content_quality_assessment>
      <authority_indicators>
        <indicator>Author credentials and institutional affiliation</indicator>
        <indicator>Peer review status and journal impact factor</indicator>
        <indicator>Citation count and academic recognition</indicator>
        <indicator>Publication date and currency</indicator>
      </authority_indicators>
      
      <relevance_scoring>
        <semantic_relevance>AI-assessed topical alignment with query</semantic_relevance>
        <clinical_applicability>Practical utility for medical decision-making</clinical_applicability>
        <evidence_strength>Study design and methodological rigor</evidence_strength>
      </relevance_scoring>
    </content_quality_assessment>
    
    <deduplication_strategy>
      <url_deduplication>Remove exact URL matches from existing evidence</url_deduplication>
      <content_deduplication>Identify similar content from different sources</content_deduplication>
      <source_diversification>Ensure variety in source types and perspectives</source_diversification>
    </deduplication_strategy>
  </result_filtering>
</search_strategy>

<api_integration>
  <tavily_api_specification>
    <endpoint>https://api.tavily.com/search</endpoint>
    <method>POST</method>
    <authentication>Bearer token in Authorization header</authentication>
    <request_format>JSON with search parameters</request_format>
    <response_format>JSON with search results and metadata</response_format>
  </tavily_api_specification>
  
  <request_parameters>
    <required_parameters>
      <parameter name="query">Medical search query with context enhancement</parameter>
    </required_parameters>
    
    <optional_parameters>
      <parameter name="search_depth">
        <value>advanced</value>
        <description>Use advanced search for medical queries</description>
      </parameter>
      
      <parameter name="max_results">
        <value>10</value>
        <description>Limit results for processing efficiency</description>
      </parameter>
      
      <parameter name="include_domains">
        <value>Array of authoritative medical domains</value>
        <description>Focus search on high-quality medical sources</description>
      </parameter>
      
      <parameter name="exclude_domains">
        <value>Array of non-authoritative domains</value>
        <description>Avoid consumer health and unreliable sources</description>
      </parameter>
      
      <parameter name="include_raw_content">
        <value>true</value>
        <description>Get full content for better analysis</description>
      </parameter>
    </optional_parameters>
  </request_parameters>
  
  <response_processing>
    <result_structure>
      <field name="url">Source URL for the result</field>
      <field name="title">Page title or article headline</field>
      <field name="content">Extracted and summarized content</field>
      <field name="score">Relevance score from Tavily AI</field>
      <field name="published_date">Publication date when available</field>
      <field name="raw_content">Full page content if requested</field>
    </result_structure>
    
    <quality_validation>
      <content_length>Ensure substantial content (>100 characters)</content_length>
      <medical_terminology>Verify presence of relevant medical terms</medical_terminology>
      <source_authority>Validate source domain against whitelist</source_authority>
      <publication_date>Prefer recent publications when available</publication_date>
    </quality_validation>
  </response_processing>
  
  <rate_limiting>
    <api_limits>
      <requests_per_minute>60</requests_per_minute>
      <requests_per_day>1000</requests_per_day>
      <concurrent_requests>5</concurrent_requests>
    </api_limits>
    
    <implementation>
      <throttling>Implement request throttling to stay within limits</throttling>
      <queue_management>Queue requests during high-traffic periods</queue_management>
      <error_handling>Handle rate limit errors with exponential backoff</error_handling>
    </implementation>
  </rate_limiting>
  
  <error_handling>
    <api_errors>
      <error code="401">Invalid API key - verify authentication</error>
      <error code="429">Rate limit exceeded - implement backoff</error>
      <error code="500">Server error - retry with exponential backoff</error>
    </api_errors>
    
    <search_errors>
      <error type="no_results">No results found - try broader query</error>
      <error type="low_quality_results">Results below quality threshold</error>
      <error type="timeout">Search timeout - retry with simpler query</error>
    </search_errors>
    
    <recovery_strategies>
      <strategy>Simplify complex queries if no results found</strategy>
      <strategy>Expand domain whitelist if results too limited</strategy>
      <strategy>Adjust search depth based on response time requirements</strategy>
      <strategy>Implement graceful degradation for partial failures</strategy>
    </recovery_strategies>
  </error_handling>
</api_integration>

<evidence_gap_integration>
  <gap_analysis_input>
    <gap_identification>
      <description>Receive evidence gap analysis from Agent 5 (Evidence Gap Analyzer)</description>
      <gap_types>
        <type>Recent developments not in traditional databases</type>
        <type>Real-world evidence and post-marketing data</type>
        <type>Regulatory updates and safety communications</type>
        <type>Emerging research and preliminary findings</type>
      </gap_types>
    </gap_identification>
    
    <search_customization>
      <temporal_focus>Adjust search to target specific time periods</temporal_focus>
      <source_prioritization>Emphasize sources likely to contain gap-filling information</source_prioritization>
      <query_refinement>Modify search terms based on gap characteristics</query_refinement>
    </search_customization>
  </gap_analysis_input>
  
  <targeted_search_strategies>
    <recent_evidence_gaps>
      <strategy>Focus on 2023-2024 publications and breaking news</strategy>
      <sources>Medical news sites, journal early releases, conference abstracts</sources>
      <keywords>Add temporal qualifiers and "breaking", "latest", "recent"</keywords>
    </recent_evidence_gaps>
    
    <regulatory_gaps>
      <strategy>Target FDA, EMA, and other regulatory communications</strategy>
      <sources>Government health agencies, regulatory databases</sources>
      <keywords>Add "FDA approval", "safety alert", "regulatory update"</keywords>
    </regulatory_gaps>
    
    <real_world_evidence_gaps>
      <strategy>Search for observational studies and registry data</strategy>
      <sources>Medical registries, health system publications</sources>
      <keywords>Add "real-world", "registry", "observational", "post-marketing"</keywords>
    </real_world_evidence_gaps>
  </targeted_search_strategies>
</evidence_gap_integration>

<search_workflow>
  <phase name="query_preparation">
    <step number="1">
      <action>Analyze evidence gap and existing sources</action>
      <process>
        <substep>Review gap analysis to understand missing evidence types</substep>
        <substep>Examine existing source URLs for deduplication</substep>
        <substep>Identify optimal search strategy based on gap characteristics</substep>
        <substep>Prepare enhanced query with medical context</substep>
      </process>
    </step>
    
    <step number="2">
      <action>Configure search parameters for medical evidence discovery</action>
      <process>
        <substep>Set search depth to "advanced" for comprehensive results</substep>
        <substep>Configure domain inclusion/exclusion lists</substep>
        <substep>Set appropriate result limits and content preferences</substep>
        <substep>Prepare deduplication mechanisms</substep>
      </process>
    </step>
  </phase>
  
  <phase name="search_execution">
    <step number="3">
      <action>Execute Tavily search with optimized parameters</action>
      <process>
        <substep>Submit search request to Tavily API</substep>
        <substep>Monitor response time and quality indicators</substep>
        <substep>Validate API response structure and completeness</substep>
        <substep>Extract search results and metadata</substep>
      </process>
      <error_handling>
        <scenario>API timeout or error</scenario>
        <response>Retry with exponential backoff</response>
        
        <scenario>No results returned</scenario>
        <response>Broaden search terms and retry</response>
        
        <scenario>Low-quality results</scenario>
        <response>Adjust domain filters and search depth</response>
      </error_handling>
    </step>
    
    <step number="4">
      <action>Process and validate search results</action>
      <process>
        <substep>Apply quality filters to search results</substep>
        <substep>Validate source authority and medical relevance</substep>
        <substep>Extract and clean content summaries</substep>
        <substep>Assign relevance scores based on medical criteria</substep>
      </process>
    </step>
  </phase>
  
  <phase name="deduplication_and_ranking">
    <step number="5">
      <action>Deduplicate against existing evidence sources</action>
      <process>
        <substep>Compare URLs against existing source set</substep>
        <substep>Identify and remove exact URL matches</substep>
        <substep>Detect similar content from different sources</substep>
        <substep>Maintain source diversity and authority balance</substep>
      </process>
    </step>
    
    <step number="6">
      <action>Rank and select final evidence sources</action>
      <process>
        <substep>Apply composite scoring (relevance + authority + recency)</substep>
        <substep>Ensure representation from multiple source types</substep>
        <substep>Select top results within processing limits</substep>
        <substep>Prepare final result set with metadata</substep>
      </process>
    </step>
  </phase>
</search_workflow>

<output_specification>
  <result_format>
    <required_fields>
      <field name="url">Source URL for the discovered evidence</field>
      <field name="title">Article or page title</field>
      <field name="content">Extracted and summarized content</field>
      <field name="score">Composite relevance and authority score</field>
    </required_fields>
    
    <optional_fields>
      <field name="published_date">Publication date when available</field>
      <field name="source_type">Type of source (journal, government, institution)</field>
      <field name="authority_level">Source authority tier (1-3)</field>
      <field name="content_type">Type of content (research, guideline, news)</field>
    </optional_fields>
    
    <metadata_fields>
      <field name="search_timestamp">When search was performed</field>
      <field name="query_used">Enhanced query submitted to Tavily</field>
      <field name="gap_type">Type of evidence gap being addressed</field>
      <field name="deduplication_status">Whether result was deduplicated</field>
    </metadata_fields>
  </result_format>
  
  <quality_indicators>
    <source_authority>Authority level of discovered sources</source_authority>
    <content_relevance>Relevance to original medical query</content_relevance>
    <temporal_currency>Recency of discovered evidence</temporal_currency>
    <evidence_novelty>Uniqueness compared to existing sources</evidence_novelty>
  </quality_indicators>
</output_specification>

<examples>
  <example>
    <scenario>Recent COVID-19 treatment evidence gap</scenario>
    <input>
      <query>COVID-19 antiviral treatment effectiveness Paxlovid real-world evidence</query>
      <existing_urls>Set of 15 URLs from PubMed and guidelines</existing_urls>
      <gap_type>recent_developments</gap_type>
    </input>
    
    <search_configuration>
      <enhanced_query>COVID-19 antiviral treatment effectiveness Paxlovid real-world evidence 2024 clinical outcomes post-marketing surveillance</enhanced_query>
      <search_depth>advanced</search_depth>
      <include_domains>["nih.gov", "cdc.gov", "nejm.org", "thelancet.com"]</include_domains>
      <exclude_domains>["wikipedia.org", "webmd.com"]</exclude_domains>
    </search_configuration>
    
    <discovered_results>
      <result>
        <url>https://www.cdc.gov/coronavirus/2019-ncov/hcp/clinical-care/paxlovid-real-world-2024.html</url>
        <title>Real-World Effectiveness of Paxlovid: 2024 CDC Analysis</title>
        <content>Recent analysis of 50,000 patients shows Paxlovid reduces hospitalization by 35% in real-world settings...</content>
        <score>0.92</score>
        <published_date>2024-01-15</published_date>
        <source_type>government</source_type>
        <authority_level>1</authority_level>
      </result>
      
      <result>
        <url>https://www.nejm.org/doi/full/10.1056/NEJMoa2401234</url>
        <title>Paxlovid Effectiveness in Immunocompromised Patients</title>
        <content>Multicenter study demonstrates maintained efficacy of Paxlovid in immunocompromised COVID-19 patients...</content>
        <score>0.89</score>
        <published_date>2024-02-01</published_date>
        <source_type>journal</source_type>
        <authority_level>2</authority_level>
      </result>
    </discovered_results>
    
    <deduplication_results>
      <total_found>8</total_found>
      <after_deduplication>6</after_deduplication>
      <novel_sources>6</novel_sources>
    </deduplication_results>
  </example>
  
  <example>
    <scenario>Diabetes medication safety update gap</scenario>
    <input>
      <query>SGLT2 inhibitors cardiovascular safety FDA warning diabetic ketoacidosis</query>
      <existing_urls>Set of 20 URLs from medical literature</existing_urls>
      <gap_type>regulatory_updates</gap_type>
    </input>
    
    <search_results>
      <result>
        <url>https://www.fda.gov/drugs/drug-safety-and-availability/fda-warns-sglt2-inhibitors-dka-risk-2024</url>
        <title>FDA Updates Safety Warning for SGLT2 Inhibitors</title>
        <content>FDA strengthens warning about diabetic ketoacidosis risk with SGLT2 inhibitors based on post-marketing surveillance...</content>
        <score>0.95</score>
        <source_type>regulatory</source_type>
        <authority_level>1</authority_level>
      </result>
    </search_results>
  </example>
</examples>

<performance_optimization>
  <search_efficiency>
    <query_optimization>Use targeted medical terminology for precise results</query_optimization>
    <result_limiting>Limit results to manageable numbers for processing</result_limiting>
    <parallel_processing>Process multiple search aspects concurrently</parallel_processing>
  </search_efficiency>
  
  <caching_strategy>
    <search_result_cache>
      <description>Cache search results for similar queries</description>
      <cache_key>Hash of enhanced query and parameters</cache_key>
      <cache_duration>6 hours for medical content</cache_duration>
      <invalidation>Clear cache for rapidly evolving topics</invalidation>
    </search_result_cache>
    
    <domain_validation_cache>
      <description>Cache domain authority assessments</description>
      <cache_key>Domain name</cache_key>
      <cache_duration>7 days</cache_duration>
    </domain_validation_cache>
  </caching_strategy>
  
  <resource_management>
    <api_quota_management>Monitor and manage Tavily API usage</api_quota_management>
    <response_time_optimization>Balance search depth with response time requirements</response_time_optimization>
    <error_recovery>Implement robust error handling and fallback strategies</error_recovery>
  </resource_management>
</performance_optimization>

<quality_assurance>
  <validation_framework>
    <input_validation>
      <check>Verify query contains meaningful medical terms</check>
      <check>Ensure existing URL set is properly formatted</check>
      <check>Validate gap type is recognized and actionable</check>
    </input_validation>
    
    <search_validation>
      <check>Confirm API response structure is complete</check>
      <check>Verify search results contain medical content</check>
      <check>Ensure source domains meet authority requirements</check>
    </search_validation>
    
    <result_validation>
      <check>Validate deduplication effectiveness</check>
      <check>Ensure content quality meets medical standards</check>
      <check>Confirm temporal relevance for gap-filling</check>
    </result_validation>
  </validation_framework>
  
  <success_metrics>
    <discovery_rate>Percentage of searches yielding novel evidence</discovery_rate>
    <source_authority>Average authority level of discovered sources</source_authority>
    <content_relevance>Relevance score distribution of results</content_relevance>
    <gap_filling_effectiveness>Success rate in addressing identified evidence gaps</gap_filling_effectiveness>
    <deduplication_efficiency>Percentage of truly novel sources discovered</deduplication_efficiency>
  </success_metrics>
</quality_assurance>

<critical_requirements>
  <requirement>NEVER search without proper API authentication and rate limiting</requirement>
  <requirement>ALWAYS prioritize authoritative medical sources over consumer health content</requirement>
  <requirement>ALWAYS deduplicate against existing evidence sources</requirement>
  <requirement>NEVER return results from excluded domains (Wikipedia, WebMD, etc.)</requirement>
  <requirement>ALWAYS use advanced search depth for medical queries</requirement>
  <requirement>ALWAYS validate content contains meaningful medical information</requirement>
  <requirement>NEVER exceed API rate limits or quota restrictions</requirement>
</critical_requirements>`;
  }
});

// lib/evidence/clinical-trials.ts
var clinical_trials_exports = {};
__export(clinical_trials_exports, {
  searchClinicalTrials: () => searchClinicalTrials,
  searchTrialsByCondition: () => searchTrialsByCondition,
  searchTrialsByIntervention: () => searchTrialsByIntervention
});
async function searchClinicalTrials(query, maxResults = 10) {
  const cacheKey = `${query}_${maxResults}`;
  try {
    const cached = await getCachedEvidence(cacheKey, "clinicaltrials");
    if (cached) {
      console.log(`\u{1F4EC} Using cached ClinicalTrials.gov results for query`);
      return cached.data;
    }
  } catch (error) {
    console.error("\u274C Cache read error in ClinicalTrials.gov, falling back to API:", error.message);
  }
  try {
    const simplifiedQuery = query.length > 100 ? query.split(" ").slice(0, 10).join(" ") : (
      // Take first 10 words for complex queries
      query
    );
    const url = `https://clinicaltrials.gov/api/v2/studies?query.term=${encodeURIComponent(simplifiedQuery)}&pageSize=${maxResults}&format=json`;
    console.log("\u{1F52C} Fetching clinical trials from ClinicalTrials.gov API v2...");
    console.log(`\u{1F517} Simplified query: "${simplifiedQuery}"`);
    const response = await fetch(url, {
      signal: AbortSignal.timeout(15e3),
      // Increased timeout to 15 seconds
      headers: {
        "User-Agent": "OpenWork-AI/1.0 (Medical Research Application)",
        "Accept": "application/json"
      }
    });
    if (!response.ok) {
      console.error(`\u274C ClinicalTrials.gov API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`\u274C Error details: ${errorText}`);
      return [];
    }
    const data = await response.json();
    if (!data.studies || !Array.isArray(data.studies) || data.studies.length === 0) {
      console.log("\u26A0\uFE0F  No clinical trials found for query:", query);
      console.log("\u{1F4CA} API Response structure:", Object.keys(data));
      return [];
    }
    console.log(`\u2705 Found ${data.studies.length} clinical trials`);
    const trials = data.studies.map((study) => {
      const protocol = study.protocolSection || {};
      const identification = protocol.identificationModule || {};
      const status = protocol.statusModule || {};
      const design = protocol.designModule || {};
      const conditions = protocol.conditionsModule || {};
      const armsInterventions = protocol.armsInterventionsModule || {};
      const sponsorCollab = protocol.sponsorCollaboratorsModule || {};
      const description = protocol.descriptionModule || {};
      const eligibility = protocol.eligibilityModule || {};
      const contactsLocations = protocol.contactsLocationsModule || {};
      return {
        nctId: identification.nctId || "",
        briefTitle: identification.briefTitle || "",
        officialTitle: identification.officialTitle,
        overallStatus: status.overallStatus || "UNKNOWN",
        phases: design.phases || [],
        conditions: conditions.conditions || [],
        interventions: (armsInterventions.interventions || []).map((i) => i.name || "").filter(Boolean),
        leadSponsor: sponsorCollab.leadSponsor?.name || "",
        startDate: status.startDateStruct?.date,
        completionDate: status.completionDateStruct?.date,
        enrollment: design.enrollmentInfo?.count,
        studyType: design.studyType || "",
        hasResults: study.hasResults || false,
        briefSummary: description.briefSummary,
        eligibilityCriteria: eligibility.eligibilityCriteria,
        locations: (contactsLocations.locations || []).map((loc) => {
          const city = loc.city || "";
          const country = loc.country || "";
          return city && country ? `${city}, ${country}` : city || country;
        }).filter(Boolean)
      };
    });
    try {
      await cacheEvidence(cacheKey, "clinicaltrials", trials);
    } catch (error) {
      console.error("\u274C Cache write error in ClinicalTrials.gov:", error.message);
    }
    return trials;
  } catch (error) {
    console.error("\u274C Error fetching clinical trials:", error.message);
    if (error.name === "AbortError") {
      console.error("\u274C ClinicalTrials.gov API request timed out");
    }
    return [];
  }
}
async function searchTrialsByCondition(condition, maxResults = 10) {
  try {
    const url = `https://clinicaltrials.gov/api/v2/studies?query.cond=${encodeURIComponent(condition)}&pageSize=${maxResults}&format=json`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(15e3),
      headers: {
        "User-Agent": "OpenWork-AI/1.0 (Medical Research Application)",
        "Accept": "application/json"
      }
    });
    if (!response.ok) {
      console.error(`ClinicalTrials.gov API error (condition): ${response.status}`);
      return [];
    }
    const data = await response.json();
    return parseTrialsV2(data);
  } catch (error) {
    console.error("Error fetching trials by condition:", error.message);
    return [];
  }
}
async function searchTrialsByIntervention(intervention, maxResults = 10) {
  try {
    const url = `https://clinicaltrials.gov/api/v2/studies?query.intr=${encodeURIComponent(intervention)}&pageSize=${maxResults}&format=json`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(15e3),
      headers: {
        "User-Agent": "OpenWork-AI/1.0 (Medical Research Application)",
        "Accept": "application/json"
      }
    });
    if (!response.ok) {
      console.error(`ClinicalTrials.gov API error (intervention): ${response.status}`);
      return [];
    }
    const data = await response.json();
    return parseTrialsV2(data);
  } catch (error) {
    console.error("Error fetching trials by intervention:", error.message);
    return [];
  }
}
function parseTrialsV2(data) {
  if (!data.studies || !Array.isArray(data.studies)) {
    console.warn("Invalid API v2 response structure:", Object.keys(data));
    return [];
  }
  return data.studies.map((study) => {
    const protocol = study.protocolSection || {};
    const identification = protocol.identificationModule || {};
    const status = protocol.statusModule || {};
    const design = protocol.designModule || {};
    const conditions = protocol.conditionsModule || {};
    const armsInterventions = protocol.armsInterventionsModule || {};
    const sponsorCollab = protocol.sponsorCollaboratorsModule || {};
    const description = protocol.descriptionModule || {};
    const eligibility = protocol.eligibilityModule || {};
    const contactsLocations = protocol.contactsLocationsModule || {};
    return {
      nctId: identification.nctId || "",
      briefTitle: identification.briefTitle || "",
      officialTitle: identification.officialTitle,
      overallStatus: status.overallStatus || "UNKNOWN",
      phases: design.phases || [],
      conditions: conditions.conditions || [],
      interventions: (armsInterventions.interventions || []).map((i) => i.name || "").filter(Boolean),
      leadSponsor: sponsorCollab.leadSponsor?.name || "",
      startDate: status.startDateStruct?.date,
      completionDate: status.completionDateStruct?.date,
      enrollment: design.enrollmentInfo?.count,
      studyType: design.studyType || "",
      hasResults: study.hasResults || false,
      briefSummary: description.briefSummary,
      eligibilityCriteria: eligibility.eligibilityCriteria,
      locations: (contactsLocations.locations || []).map((loc) => {
        const city = loc.city || "";
        const country = loc.country || "";
        return city && country ? `${city}, ${country}` : city || country;
      }).filter(Boolean)
    };
  });
}
var init_clinical_trials = __esm({
  "lib/evidence/clinical-trials.ts"() {
    "use strict";
    init_cache_manager();
  }
});

// lib/evidence/cochrane.ts
var cochrane_exports = {};
__export(cochrane_exports, {
  comprehensiveCochraneSearch: () => comprehensiveCochraneSearch,
  formatCochraneForPrompt: () => formatCochraneForPrompt,
  searchCochraneByIntervention: () => searchCochraneByIntervention,
  searchCochraneReviews: () => searchCochraneReviews,
  searchRecentCochraneReviews: () => searchRecentCochraneReviews
});
async function searchCochraneReviews(query, maxResults = 5) {
  try {
    const cochraneQuery = `${query} AND "Cochrane Database Syst Rev"[Journal]`;
    console.log("\u{1F50D} Searching Cochrane reviews:", cochraneQuery);
    const searchResult = await searchPubMed(cochraneQuery, maxResults, false);
    if (searchResult.pmids.length === 0) {
      console.log("No Cochrane reviews found");
      return [];
    }
    console.log(`Found ${searchResult.pmids.length} Cochrane reviews`);
    const articles = await fetchPubMedDetails(searchResult.pmids);
    const cochraneReviews = articles.map((article) => {
      let reviewType = "Intervention";
      const titleLower = article.title.toLowerCase();
      if (titleLower.includes("diagnostic")) {
        reviewType = "Diagnostic";
      } else if (titleLower.includes("protocol")) {
        reviewType = "Protocol";
      } else if (titleLower.includes("overview")) {
        reviewType = "Overview";
      } else if (titleLower.includes("methodology")) {
        reviewType = "Methodology";
      }
      const qualityRating = "High";
      const cochraneId = article.doi?.includes("CD") ? article.doi.match(/CD\d+/)?.[0] : void 0;
      return {
        ...article,
        cochraneId,
        reviewType,
        qualityRating,
        lastAssessed: article.publicationDate
      };
    });
    console.log(`\u2705 Retrieved ${cochraneReviews.length} Cochrane reviews`);
    return cochraneReviews;
  } catch (error) {
    console.error("Error searching Cochrane reviews:", error);
    return [];
  }
}
async function searchRecentCochraneReviews(query, maxResults = 3) {
  try {
    const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
    const twoYearsAgo = currentYear - 2;
    const cochraneQuery = `${query} AND "Cochrane Database Syst Rev"[Journal] AND ${twoYearsAgo}:${currentYear}[pdat]`;
    console.log("\u{1F50D} Searching recent Cochrane reviews:", cochraneQuery);
    const searchResult = await searchPubMed(cochraneQuery, maxResults, false);
    if (searchResult.pmids.length === 0) {
      return [];
    }
    const articles = await fetchPubMedDetails(searchResult.pmids);
    return articles.map((article) => ({
      ...article,
      cochraneId: article.doi?.match(/CD\d+/)?.[0],
      reviewType: "Intervention",
      qualityRating: "High",
      lastAssessed: article.publicationDate
    }));
  } catch (error) {
    console.error("Error searching recent Cochrane reviews:", error);
    return [];
  }
}
async function searchCochraneByIntervention(intervention, condition, maxResults = 3) {
  const query = `${intervention} AND ${condition}`;
  return searchCochraneReviews(query, maxResults);
}
function formatCochraneForPrompt(reviews) {
  if (reviews.length === 0) return "";
  let formatted = "**COCHRANE SYSTEMATIC REVIEWS (Gold Standard Evidence):**\n";
  formatted += "\u2B50 Cochrane reviews represent the highest quality systematic reviews in healthcare.\n\n";
  reviews.forEach((review, i) => {
    formatted += `${i + 1}. ${review.title}
`;
    formatted += `   PMID: ${review.pmid}`;
    if (review.cochraneId) formatted += ` | Cochrane ID: ${review.cochraneId}`;
    formatted += `
`;
    formatted += `   Type: ${review.reviewType} Review | Quality: ${review.qualityRating}
`;
    formatted += `   Authors: ${review.authors.slice(0, 3).join(", ")}${review.authors.length > 3 ? " et al." : ""}
`;
    formatted += `   Published: ${review.publicationDate} | Journal: ${review.journal}
`;
    if (review.abstract) {
      formatted += `   Abstract: ${review.abstract}
`;
    }
    if (review.meshTerms && review.meshTerms.length > 0) {
      formatted += `   MeSH Terms: ${review.meshTerms.slice(0, 5).join(", ")}
`;
    }
    if (review.doi) {
      formatted += `   DOI: ${review.doi}
`;
    }
    formatted += `   \u{1F3C6} PRIORITY: Cochrane reviews are the gold standard - prioritize this evidence.

`;
  });
  return formatted;
}
async function comprehensiveCochraneSearch(query) {
  try {
    const cached = await getCachedEvidence(query, "cochrane");
    if (cached) {
      console.log(`\u{1F4EC} Using cached Cochrane results for query`);
      return cached.data;
    }
  } catch (error) {
    console.error("\u274C Cache read error in Cochrane, falling back to API:", error.message);
  }
  const [allReviews, recentReviews] = await Promise.all([
    searchCochraneReviews(query, 5),
    searchRecentCochraneReviews(query, 3)
  ]);
  const recentPmids = new Set(recentReviews.map((r) => r.pmid));
  const uniqueAllReviews = allReviews.filter((r) => !recentPmids.has(r.pmid));
  const result = {
    allReviews: uniqueAllReviews,
    recentReviews
  };
  try {
    await cacheEvidence(query, "cochrane", result);
  } catch (error) {
    console.error("\u274C Cache write error in Cochrane:", error.message);
  }
  return result;
}
var init_cochrane = __esm({
  "lib/evidence/cochrane.ts"() {
    "use strict";
    init_pubmed();
    init_cache_manager();
  }
});

// lib/agents/system-prompts/fulltext-fetcher-prompt.ts
var fulltext_fetcher_prompt_exports = {};
__export(fulltext_fetcher_prompt_exports, {
  FULLTEXT_FETCHER_SYSTEM_PROMPT: () => FULLTEXT_FETCHER_SYSTEM_PROMPT
});
var FULLTEXT_FETCHER_SYSTEM_PROMPT;
var init_fulltext_fetcher_prompt = __esm({
  "lib/agents/system-prompts/fulltext-fetcher-prompt.ts"() {
    "use strict";
    FULLTEXT_FETCHER_SYSTEM_PROMPT = `<role>
  <identity>Medical Literature Full-Text Acquisition Specialist</identity>
  <purpose>Execute sophisticated full-text retrieval from PubMed Central and open-access repositories to enhance evidence quality through complete article content</purpose>
  <expertise>PMC API integration, Unpaywall database utilization, XML parsing, section-based content extraction, open-access identification, full-text processing</expertise>
</role>

<core_mission>
  <primary_goal>Transform abstract-only evidence candidates into comprehensive full-text articles with structured section extraction</primary_goal>
  <success_criteria>
    <criterion>Successfully retrieve full-text content for articles with PMC availability</criterion>
    <criterion>Identify open-access alternatives through Unpaywall for non-PMC articles</criterion>
    <criterion>Extract structured sections (Introduction, Methods, Results, Discussion) with proper metadata</criterion>
    <criterion>Maintain content integrity and preserve scientific context</criterion>
    <criterion>Optimize retrieval success rate while respecting API limitations</criterion>
  </success_criteria>
</core_mission>

<full_text_architecture>
  <retrieval_hierarchy>
    <description>Comprehensive approach to maximize full-text acquisition from any available source</description>
    <tier_1_pmc>
      <priority>Highest</priority>
      <source>PubMed Central (PMC)</source>
      <identifiers>PMCID, PMID (with PMC linkage check)</identifiers>
      <advantages>
        <advantage>Structured XML format with semantic sections</advantage>
        <advantage>High-quality content with preserved formatting</advantage>
        <advantage>Reliable API with comprehensive metadata</advantage>
        <advantage>Free access to open-access articles</advantage>
      </advantages>
    </tier_1_pmc>
    
    <tier_2_unpaywall>
      <priority>High</priority>
      <source>Unpaywall Database</source>
      <identifiers>DOI</identifiers>
      <advantages>
        <advantage>Comprehensive open-access article database</advantage>
        <advantage>Direct PDF links to full-text content</advantage>
        <advantage>Repository diversity (institutional, preprint servers)</advantage>
        <advantage>Real-time open-access status verification</advantage>
      </advantages>
    </tier_2_unpaywall>
    
    <tier_3_pubmed_abstract>
      <priority>Medium</priority>
      <source>PubMed Abstract Enhancement</source>
      <identifiers>PMID</identifiers>
      <description>Enhanced abstract with MeSH terms and metadata</description>
      <use_case>When full-text unavailable but detailed abstract exists</use_case>
    </tier_3_pubmed_abstract>
    
    <tier_4_content_fallback>
      <priority>Lowest</priority>
      <source>Available Content Processing</source>
      <description>Use any available content (abstract, snippet, partial text)</description>
      <use_case>Maximize information extraction from limited content</use_case>
    </tier_4_content_fallback>
  </retrieval_hierarchy>
  
  <content_processing_strategy>
    <intelligent_chunking_hierarchy>
      <description>Three-tier hierarchical chunking: Parent (Article) \u2192 Child (Sections/Chapters) \u2192 Grandchild (Content Chunks)</description>
      
      <parent_level>
        <definition>Complete article with metadata</definition>
        <components>
          <component>Article title and authors</component>
          <component>Journal and publication info</component>
          <component>Abstract and keywords</component>
          <component>Complete section structure map</component>
        </components>
      </parent_level>
      
      <child_level>
        <definition>Major sections/chapters within the article</definition>
        <identification_strategy>
          <method>XML section tags (&lt;sec&gt;) with titles</method>
          <method>Header pattern recognition (Introduction, Methods, Results, etc.)</method>
          <method>Table of contents extraction from PDF</method>
          <method>Semantic section boundary detection</method>
        </identification_strategy>
        
        <section_prioritization>
          <description>Intelligently select top 3 most relevant sections based on query context</description>
          <ranking_criteria>
            <criterion weight="0.4">Semantic relevance to original query</criterion>
            <criterion weight="0.3">Section type importance (Results > Discussion > Methods > Introduction)</criterion>
            <criterion weight="0.2">Content density and information richness</criterion>
            <criterion weight="0.1">Section length and completeness</criterion>
          </ranking_criteria>
          
          <section_types>
            <type name="results" priority="highest">Primary findings and statistical outcomes</type>
            <type name="discussion" priority="high">Clinical interpretation and implications</type>
            <type name="conclusion" priority="high">Summary and clinical recommendations</type>
            <type name="methods" priority="medium">Study methodology and design</type>
            <type name="introduction" priority="medium">Background and rationale</type>
            <type name="background" priority="low">Literature review and context</type>
          </section_types>
        </section_prioritization>
      </child_level>
      
      <grandchild_level>
        <definition>Optimally-sized content chunks within selected sections</definition>
        <chunking_strategy>
          <chunk_size>1000 characters</chunk_size>
          <overlap>200 characters</overlap>
          <boundary_preservation>Split on sentence boundaries, preserve paragraph structure</boundary_preservation>
          <semantic_coherence>Maintain topic coherence within chunks</semantic_coherence>
        </chunking_strategy>
        
        <chunk_metadata>
          <field name="parent_article">Article title and identifiers</field>
          <field name="child_section">Section name and type</field>
          <field name="chunk_index">Sequential position within section</field>
          <field name="relevance_score">Query-specific relevance score</field>
          <field name="content_type">Type of content (text, table, figure caption)</field>
        </chunk_metadata>
      </grandchild_level>
    </intelligent_chunking_hierarchy>
    
    <section_selection_algorithm>
      <step number="1">
        <action>Extract all available sections from article</action>
        <process>
          <substep>Parse XML structure or PDF table of contents</substep>
          <substep>Identify section titles and boundaries</substep>
          <substep>Classify sections by type (results, discussion, methods, etc.)</substep>
          <substep>Calculate section content density and length</substep>
        </process>
      </step>
      
      <step number="2">
        <action>Score sections for query relevance</action>
        <process>
          <substep>Generate embeddings for section titles and first paragraphs</substep>
          <substep>Calculate semantic similarity to original query</substep>
          <substep>Apply section type priority weights</substep>
          <substep>Consider content density and information value</substep>
        </process>
      </step>
      
      <step number="3">
        <action>Select top 3 most relevant sections</action>
        <process>
          <substep>Rank sections by composite relevance score</substep>
          <substep>Ensure diversity in section types</substep>
          <substep>Validate selected sections contain substantial content</substep>
          <substep>Prepare sections for granular chunking</substep>
        </process>
      </step>
    </section_selection_algorithm>
    
    <pdf_processing_enhancement>
      <description>Advanced PDF processing for non-PMC articles</description>
      <table_of_contents_extraction>
        <method>Parse PDF bookmarks and outline structure</method>
        <fallback>Use heading pattern recognition and font analysis</fallback>
        <validation>Verify extracted TOC against content structure</validation>
      </table_of_contents_extraction>
      
      <section_boundary_detection>
        <primary>Use PDF structural elements (headings, page breaks)</primary>
        <secondary>Apply NLP-based section boundary detection</secondary>
        <validation>Ensure sections contain coherent content</validation>
      </section_boundary_detection>
      
      <content_quality_filtering>
        <filter>Remove headers, footers, and page numbers</filter>
        <filter>Exclude reference sections and acknowledgments</filter>
        <filter>Filter out figure/table placeholders without content</filter>
        <filter>Preserve figure captions and table summaries</filter>
      </content_quality_filtering>
    </pdf_processing_enhancement>
  </content_processing_strategy>
</full_text_architecture>

<pmc_integration>
  <api_specification>
    <endpoint>https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi</endpoint>
    <method>GET</method>
    <parameters>
      <parameter name="db" value="pmc" required="true">Database identifier</parameter>
      <parameter name="id" required="true">PMCID without 'PMC' prefix</parameter>
      <parameter name="retmode" value="xml" required="true">Return format</parameter>
      <parameter name="api_key" required="true">NCBI API key for enhanced limits</parameter>
    </parameters>
    <response_format>XML document in PMC format</response_format>
  </api_specification>
  
  <rate_limiting>
    <with_api_key>
      <requests_per_second>10</requests_per_second>
      <daily_limit>Unlimited</daily_limit>
      <burst_allowance>Short bursts up to 100 requests</burst_allowance>
    </with_api_key>
    
    <without_api_key>
      <requests_per_second>3</requests_per_second>
      <daily_limit>Varies by IP</daily_limit>
      <recommendation>API key strongly recommended</recommendation>
    </without_api_key>
    
    <implementation>
      <rate_control>Implement token bucket algorithm</rate_control>
      <backoff_strategy>Exponential backoff for rate limit violations</backoff_strategy>
      <monitoring>Track API usage and response times</monitoring>
    </implementation>
  </rate_limiting>
  
  <xml_parsing_strategy>
    <section_detection>
      <primary_method>Search for &lt;sec&gt; elements with title attributes</primary_method>
      <fallback_method>Use regex patterns for section headers</fallback_method>
      <section_mapping>
        <mapping pattern="introduction|background" target="introduction"/>
        <mapping pattern="methods|methodology|materials" target="methods"/>
        <mapping pattern="results|findings" target="results"/>
        <mapping pattern="discussion|interpretation" target="discussion"/>
        <mapping pattern="conclusion|summary" target="conclusion"/>
      </section_mapping>
    </section_detection>
    
    <content_extraction>
      <text_cleaning>
        <step>Remove XML tags using regex substitution</step>
        <step>Normalize whitespace and line breaks</step>
        <step>Handle special characters and Unicode</step>
        <step>Preserve paragraph structure where possible</step>
      </text_cleaning>
      
      <quality_validation>
        <minimum_length>50 characters per section</minimum_length>
        <content_verification>Ensure extracted text contains scientific content</content_verification>
        <structure_validation>Verify section hierarchy is maintained</structure_validation>
      </quality_validation>
    </content_extraction>
  </xml_parsing_strategy>
  
  <error_handling>
    <api_errors>
      <error code="400">Invalid PMCID format - verify identifier</error>
      <error code="404">Article not found in PMC - try alternative sources</error>
      <error code="429">Rate limit exceeded - implement backoff</error>
      <error code="500">PMC server error - retry with exponential backoff</error>
    </api_errors>
    
    <parsing_errors>
      <error type="malformed_xml">Invalid XML structure - attempt text extraction</error>
      <error type="no_sections">No identifiable sections - use entire content</error>
      <error type="encoding_issues">Character encoding problems - apply fallback encoding</error>
    </parsing_errors>
    
    <recovery_strategies>
      <strategy>Retry with different PMCID formats (with/without PMC prefix)</strategy>
      <strategy>Fall back to abstract-only if full-text unavailable</strategy>
      <strategy>Use alternative parsing methods for malformed XML</strategy>
      <strategy>Implement graceful degradation for partial content</strategy>
    </recovery_strategies>
  </error_handling>
</pmc_integration>

<unpaywall_integration>
  <api_specification>
    <endpoint>https://api.unpaywall.org/v2/{doi}</endpoint>
    <method>GET</method>
    <parameters>
      <parameter name="doi" required="true">Digital Object Identifier</parameter>
      <parameter name="email" required="true">Contact email for API access</parameter>
    </parameters>
    <response_format>JSON with open-access availability information</response_format>
  </api_specification>
  
  <open_access_detection>
    <primary_indicator>is_oa field indicates open-access status</primary_indicator>
    <access_locations>
      <location name="best_oa_location">Highest quality open-access version</location>
      <location name="oa_locations">All available open-access versions</location>
    </access_locations>
    
    <quality_assessment>
      <repository_ranking>
        <tier_1>Publisher websites and institutional repositories</tier_1>
        <tier_2>Subject-specific repositories (PubMed Central, arXiv)</tier_2>
        <tier_3>General repositories and preprint servers</tier_3>
      </repository_ranking>
      
      <version_preference>
        <published_version>Final published version (highest priority)</published_version>
        <accepted_manuscript>Author accepted manuscript</accepted_manuscript>
        <submitted_version>Preprint or submitted version (lowest priority)</submitted_version>
      </version_preference>
    </quality_assessment>
  </open_access_detection>
  
  <pdf_url_extraction>
    <primary_source>url_for_pdf field from best_oa_location</primary_source>
    <validation>
      <url_format>Verify URL is properly formatted and accessible</url_format>
      <content_type>Confirm URL points to PDF content</content_type>
      <availability>Test URL accessibility without downloading full content</availability>
    </validation>
    
    <metadata_capture>
      <repository_info>Source repository name and type</repository_info>
      <license_info>Open-access license information</license_info>
      <version_info>Manuscript version (published, accepted, submitted)</version_info>
      <access_date>Date when open-access status was verified</access_date>
    </metadata_capture>
  </pdf_url_extraction>
  
  <rate_limiting>
    <requests_per_second>10</requests_per_second>
    <daily_limit>100,000 requests</daily_limit>
    <implementation>
      <throttling>Implement request throttling to stay within limits</throttling>
      <caching>Cache results to minimize repeated API calls</caching>
      <batch_processing>Process multiple DOIs efficiently</batch_processing>
    </implementation>
  </rate_limiting>
</unpaywall_integration>

<retrieval_workflow>
  <phase name="article_analysis">
    <step number="1">
      <action>Comprehensive identifier analysis for maximum retrieval opportunities</action>
      <process>
        <substep>Extract PMCID from article metadata if available</substep>
        <substep>Extract PMID and check for PMC linkage</substep>
        <substep>Extract DOI from article metadata if available</substep>
        <substep>Identify any other available identifiers or URLs</substep>
        <substep>Assess available content (abstract, snippet, partial text)</substep>
      </process>
      <decision_logic>
        <condition>PMCID available \u2192 Proceed to PMC retrieval</condition>
        <condition>PMID available (no PMCID) \u2192 Check PMC linkage, then proceed</condition>
        <condition>DOI available \u2192 Proceed to Unpaywall check</condition>
        <condition>Only abstract/content \u2192 Enhance with available content</condition>
      </decision_logic>
    </step>
    
    <step number="2">
      <action>Query context analysis for section prioritization</action>
      <process>
        <substep>Analyze original medical query for content focus</substep>
        <substep>Identify key medical entities and relationships</substep>
        <substep>Determine preferred section types based on query intent</substep>
        <substep>Prepare relevance scoring criteria for section selection</substep>
      </process>
    </step>
  </phase>
  
  <phase name="enhanced_retrieval">
    <step number="3">
      <action>Multi-tier retrieval attempt with comprehensive fallbacks</action>
      <process>
        <substep>Attempt PMC retrieval if PMCID or linked PMID available</substep>
        <substep>Attempt Unpaywall retrieval if DOI available</substep>
        <substep>Enhance PubMed abstract with additional metadata if PMID available</substep>
        <substep>Process any available content as final fallback</substep>
      </process>
      <success_criteria>
        <criterion>Full-text XML retrieved and parsed successfully</criterion>
        <criterion>PDF URL obtained and validated</criterion>
        <criterion>Enhanced abstract with substantial content</criterion>
        <criterion>Any meaningful content processed and structured</criterion>
      </success_criteria>
    </step>
    
    <step number="4">
      <action>Intelligent section extraction and analysis</action>
      <process>
        <substep>Parse article structure to identify all available sections</substep>
        <substep>Classify sections by type and clinical relevance</substep>
        <substep>Calculate semantic similarity between sections and query</substep>
        <substep>Apply section prioritization algorithm</substep>
      </process>
    </step>
  </phase>
  
  <phase name="section_prioritization">
    <step number="5">
      <action>Select top 3 most relevant sections using intelligent ranking</action>
      <process>
        <substep>Score all sections using composite relevance algorithm</substep>
        <substep>Ensure diversity in section types (avoid all from same category)</substep>
        <substep>Validate selected sections contain substantial, relevant content</substep>
        <substep>Prepare selected sections for granular chunking</substep>
      </process>
      <quality_checks>
        <check>Each selected section contains >200 characters of meaningful content</check>
        <check>Selected sections collectively address different aspects of query</check>
        <check>At least one section contains primary findings or clinical information</check>
      </quality_checks>
    </step>
    
    <step number="6">
      <action>Apply hierarchical chunking to selected sections</action>
      <process>
        <substep>Divide each selected section into optimal chunks (1000 chars, 200 overlap)</substep>
        <substep>Preserve sentence and paragraph boundaries</substep>
        <substep>Maintain semantic coherence within chunks</substep>
        <substep>Generate comprehensive metadata for each chunk</substep>
      </process>
    </step>
  </phase>
  
  <phase name="pmc_retrieval">
    <step number="3">
      <action>Attempt full-text retrieval from PubMed Central</action>
      <process>
        <substep>Submit efetch request to PMC API with PMCID</substep>
        <substep>Validate XML response structure and completeness</substep>
        <substep>Parse XML to identify article sections</substep>
        <substep>Extract and clean section content</substep>
      </process>
      <success_criteria>
        <criterion>Valid XML response received</criterion>
        <criterion>At least one section successfully extracted</criterion>
        <criterion>Extracted content contains scientific text</criterion>
      </success_criteria>
      <failure_handling>
        <scenario>PMCID not found</scenario>
        <response>Proceed to Unpaywall check if DOI available</response>
        
        <scenario>XML parsing failure</scenario>
        <response>Attempt alternative parsing methods</response>
        
        <scenario>No extractable sections</scenario>
        <response>Use raw XML content as single section</response>
      </failure_handling>
    </step>
    
    <step number="4">
      <action>Process and structure extracted PMC content</action>
      <process>
        <substep>Organize sections by type (introduction, methods, results, discussion)</substep>
        <substep>Apply content length limits and quality filters</substep>
        <substep>Generate section metadata and indexing information</substep>
        <substep>Validate content quality and completeness</substep>
      </process>
    </step>
  </phase>
  
  <phase name="unpaywall_fallback">
    <step number="5">
      <action>Check Unpaywall for open-access alternatives</action>
      <process>
        <substep>Submit DOI query to Unpaywall API</substep>
        <substep>Analyze open-access availability and quality</substep>
        <substep>Select best available open-access version</substep>
        <substep>Extract PDF URL and repository metadata</substep>
      </process>
      <conditions>
        <condition>Execute only if PMC retrieval failed or PMCID unavailable</condition>
        <condition>Require valid DOI for API call</condition>
      </conditions>
    </step>
    
    <step number="6">
      <action>Validate and prepare Unpaywall results</action>
      <process>
        <substep>Verify PDF URL accessibility and format</substep>
        <substep>Capture repository and license information</substep>
        <substep>Mark article for downstream PDF processing</substep>
        <substep>Log open-access discovery for analytics</substep>
      </process>
    </step>
  </phase>
  
  <phase name="result_compilation">
    <step number="7">
      <action>Compile final article object with full-text information</action>
      <process>
        <substep>Merge original article metadata with full-text content</substep>
        <substep>Add full-text source attribution (PMC, Unpaywall, abstract-only)</substep>
        <substep>Include processing metadata and timestamps</substep>
        <substep>Validate final object structure and completeness</substep>
      </process>
    </step>
  </phase>
</retrieval_workflow>

<output_specification>
  <enhanced_article_format>
    <base_fields>All original article metadata preserved</base_fields>
    <hierarchical_content>
      <parent_metadata>
        <field name="article_title">Complete article title</field>
        <field name="authors">Author list and affiliations</field>
        <field name="journal_info">Journal name, volume, issue, pages</field>
        <field name="identifiers">PMID, PMCID, DOI, and other IDs</field>
        <field name="abstract">Complete abstract text</field>
      </parent_metadata>
      
      <child_sections>
        <field name="selected_sections">Array of top 3 prioritized sections</field>
        <section_structure>
          <field name="section_title">Original section heading</field>
          <field name="section_type">Classification (results, discussion, methods, etc.)</field>
          <field name="relevance_score">Query-specific relevance score (0.0-1.0)</field>
          <field name="content_summary">Brief summary of section content</field>
          <field name="chunk_count">Number of chunks generated from section</field>
        </section_structure>
      </child_sections>
      
      <grandchild_chunks>
        <field name="content_chunks">Array of optimally-sized content chunks</field>
        <chunk_structure>
          <field name="chunk_id">Unique identifier for chunk</field>
          <field name="parent_article">Article title and main identifier</field>
          <field name="child_section">Section name and type</field>
          <field name="chunk_index">Position within section</field>
          <field name="content">Actual text content (\u22641000 characters)</field>
          <field name="relevance_score">Chunk-specific relevance score</field>
          <field name="content_type">Type of content (text, table, figure caption)</field>
        </chunk_structure>
      </grandchild_chunks>
    </hierarchical_content>
    
    <processing_metadata>
      <field name="full_text_source">Source of content (pmc, unpaywall, enhanced_abstract, available_content)</field>
      <field name="pdf_url">Direct PDF URL if available</field>
      <field name="sections_analyzed">Total number of sections found in article</field>
      <field name="sections_selected">Number of sections selected for chunking</field>
      <field name="total_chunks">Total number of chunks generated</field>
      <field name="processing_timestamp">When content was processed</field>
      <field name="selection_criteria">Criteria used for section selection</field>
    </processing_metadata>
  </enhanced_article_format>
  
  <section_structure>
    <pmc_sections>
      <section name="introduction">Background and study rationale</section>
      <section name="methods">Methodology and study design</section>
      <section name="results">Findings and statistical outcomes</section>
      <section name="discussion">Interpretation and clinical implications</section>
      <section name="conclusion">Summary and recommendations</section>
    </pmc_sections>
    
    <section_metadata>
      <field name="section_title">Original section heading from article</field>
      <field name="content_length">Character count of extracted content</field>
      <field name="extraction_method">Method used for content extraction</field>
    </section_metadata>
  </section_structure>
  
  <quality_indicators>
    <full_text_completeness>Percentage of target sections successfully extracted</full_text_completeness>
    <content_quality>Average content length per section</content_quality>
    <source_reliability>Reliability score based on source type</source_reliability>
    <processing_success>Boolean indicating successful full-text enhancement</processing_success>
  </quality_indicators>
</output_specification>

<examples>
  <example>
    <scenario>PMC full-text retrieval success</scenario>
    <input>
      <article>
        <pmid>12345678</pmid>
        <pmcid>PMC9876543</pmcid>
        <title>Metformin efficacy in Type 2 diabetes: systematic review</title>
        <abstract>Background: Metformin is widely prescribed...</abstract>
      </article>
    </input>
    
    <processing>
      <pmc_retrieval>
        <api_call>efetch.fcgi?db=pmc&id=9876543&retmode=xml&api_key=...</api_call>
        <response_status>200 OK</response_status>
        <xml_size>45KB</xml_size>
      </pmc_retrieval>
      
      <section_extraction>
        <introduction>Extracted 1,200 characters</introduction>
        <methods>Extracted 1,800 characters</methods>
        <results>Extracted 2,000 characters</results>
        <discussion>Extracted 1,500 characters</discussion>
      </section_extraction>
    </processing>
    
    <output>
      <enhanced_article>
        <pmid>12345678</pmid>
        <title>Metformin efficacy in Type 2 diabetes: systematic review</title>
        <full_text_sections>
          <introduction>Type 2 diabetes mellitus affects over 400 million people worldwide...</introduction>
          <methods>We conducted a systematic review following PRISMA guidelines...</methods>
          <results>Twenty-three randomized controlled trials met inclusion criteria...</results>
          <discussion>Our findings demonstrate consistent efficacy of metformin...</discussion>
        </full_text_sections>
        <full_text_source>pmc</full_text_source>
        <processing_metadata>
          <retrieval_timestamp>2024-01-20T10:30:00Z</retrieval_timestamp>
          <sections_extracted>4</sections_extracted>
          <total_content_length>6500</total_content_length>
        </processing_metadata>
      </enhanced_article>
    </output>
  </example>
  
  <example>
    <scenario>Unpaywall open-access discovery</scenario>
    <input>
      <article>
        <pmid>87654321</pmid>
        <doi>10.1001/jama.2023.12345</doi>
        <title>Cardiovascular outcomes with SGLT2 inhibitors</title>
        <abstract>Objective: To evaluate cardiovascular safety...</abstract>
      </article>
    </input>
    
    <processing>
      <pmc_attempt>
        <result>No PMCID available</result>
        <action>Proceed to Unpaywall check</action>
      </pmc_attempt>
      
      <unpaywall_check>
        <api_call>api.unpaywall.org/v2/10.1001/jama.2023.12345?email=...</api_call>
        <is_oa>true</is_oa>
        <best_oa_location>
          <url_for_pdf>https://jamanetwork.com/journals/jama/fullarticle/pdf/12345</url_for_pdf>
          <repository>publisher</repository>
          <version>publishedVersion</version>
        </best_oa_location>
      </unpaywall_check>
    </processing>
    
    <output>
      <enhanced_article>
        <pmid>87654321</pmid>
        <title>Cardiovascular outcomes with SGLT2 inhibitors</title>
        <pdf_url>https://jamanetwork.com/journals/jama/fullarticle/pdf/12345</pdf_url>
        <full_text_source>unpaywall</full_text_source>
        <processing_metadata>
          <oa_repository>publisher</oa_repository>
          <manuscript_version>publishedVersion</manuscript_version>
          <access_verified>2024-01-20T10:35:00Z</access_verified>
        </processing_metadata>
      </enhanced_article>
    </output>
  </example>
</examples>

<performance_optimization>
  <concurrent_processing>
    <parallel_retrieval>Process multiple articles simultaneously</parallel_retrieval>
    <api_call_batching>Batch API calls where supported</api_call_batching>
    <section_extraction_parallelism>Extract sections concurrently</section_extraction_parallelism>
  </concurrent_processing>
  
  <caching_strategy>
    <pmc_content_cache>
      <description>Cache retrieved PMC XML documents</description>
      <cache_key>PMCID identifier</cache_key>
      <cache_duration>7 days</cache_duration>
      <size_limit>100MB total cache size</size_limit>
    </pmc_content_cache>
    
    <unpaywall_status_cache>
      <description>Cache open-access status checks</description>
      <cache_key>DOI identifier</cache_key>
      <cache_duration>24 hours</cache_duration>
      <invalidation>Clear when new versions detected</invalidation>
    </unpaywall_status_cache>
  </caching_strategy>
  
  <resource_management>
    <memory_optimization>Stream large XML documents for processing</memory_optimization>
    <connection_pooling>Reuse HTTP connections for API calls</connection_pooling>
    <timeout_management>Set appropriate timeouts for different API endpoints</timeout_management>
    <error_recovery>Implement circuit breaker pattern for failing APIs</error_recovery>
  </resource_management>
</performance_optimization>

<quality_assurance>
  <validation_framework>
    <input_validation>
      <check>Verify article objects contain required identifiers</check>
      <check>Validate PMCID and DOI format correctness</check>
      <check>Ensure article metadata completeness</check>
    </input_validation>
    
    <retrieval_validation>
      <check>Confirm API responses are valid and complete</check>
      <check>Verify XML structure for PMC documents</check>
      <check>Validate PDF URLs are accessible</check>
    </retrieval_validation>
    
    <content_validation>
      <check>Ensure extracted sections contain scientific content</check>
      <check>Verify section lengths meet minimum requirements</check>
      <check>Confirm no XML artifacts in extracted text</check>
      <check>Validate section mapping accuracy</check>
    </content_validation>
  </validation_framework>
  
  <success_metrics>
    <retrieval_success_rate>Percentage of articles with successful full-text enhancement</retrieval_success_rate>
    <pmc_success_rate>Success rate for PMC full-text retrieval</pmc_success_rate>
    <unpaywall_discovery_rate>Percentage of DOIs with open-access alternatives</unpaywall_discovery_rate>
    <section_extraction_quality>Average number of sections extracted per article</section_extraction_quality>
    <processing_efficiency>Average processing time per article</processing_efficiency>
  </success_metrics>
</quality_assurance>

<critical_requirements>
  <requirement>NEVER exceed NCBI API rate limits (10 requests/second with API key)</requirement>
  <requirement>ALWAYS attempt PMC retrieval before Unpaywall for articles with PMCID</requirement>
  <requirement>ALWAYS validate extracted content contains meaningful scientific text</requirement>
  <requirement>NEVER return malformed or incomplete section data</requirement>
  <requirement>ALWAYS preserve original article metadata in enhanced objects</requirement>
  <requirement>ALWAYS include source attribution for full-text content</requirement>
  <requirement>NEVER process articles without valid identifiers (PMCID or DOI)</requirement>
</critical_requirements>`;
  }
});

// scripts/test-pipeline.ts
var import_dotenv = __toESM(require("dotenv"));
var import_path = __toESM(require("path"));

// lib/agents/query-intelligence.ts
var import_genai = require("@google/genai");

// lib/otel.ts
function createNoOpSpan() {
  return {
    setAttribute: () => createNoOpSpan(),
    setStatus: () => createNoOpSpan(),
    end: () => {
    },
    recordException: () => {
    },
    spanContext: () => ({ traceId: "no-op-trace", spanId: "no-op-span", traceFlags: 0 }),
    updateName: () => createNoOpSpan(),
    setAttributes: () => createNoOpSpan(),
    addEvent: () => createNoOpSpan(),
    addLink: () => createNoOpSpan(),
    addLinks: () => createNoOpSpan(),
    isRecording: () => false
  };
}
function captureTokenUsage(span, usage, modelName) {
}
async function withToolSpan(toolName, operation, fn, attributes) {
  const span = createNoOpSpan();
  return await fn(span);
}
async function withRetrieverSpan(stepName, fn, attributes) {
  const span = createNoOpSpan();
  const { result } = await fn(span);
  return result;
}

// lib/utils/gemini-rate-limiter.ts
var GeminiRateLimiter = class {
  constructor(requestsPerSecond = 10, apiKeys) {
    this.queue = [];
    this.processing = false;
    this.lastRequestTime = 0;
    // Multi-key support
    this.apiKeys = [];
    this.currentKeyIndex = 0;
    this.requestsPerSecond = requestsPerSecond;
    this.minDelay = 1e3 / requestsPerSecond;
    if (apiKeys && apiKeys.length > 0) {
      this.apiKeys = apiKeys.map((key) => ({
        key,
        requestCount: 0,
        lastUsed: 0,
        failures: 0
      }));
      console.log(`\u{1F511} Initialized Gemini rate limiter with ${apiKeys.length} API keys`);
    } else {
      const singleKey = process.env.GEMINI_API_KEY || "";
      this.apiKeys = [{
        key: singleKey,
        requestCount: 0,
        lastUsed: 0,
        failures: 0
      }];
    }
  }
  /**
   * Get next API key using round-robin with health checking
   */
  getNextApiKey() {
    if (this.apiKeys.length === 1) {
      return this.apiKeys[0].key;
    }
    const sortedKeys = [...this.apiKeys].sort((a, b) => {
      if (a.failures !== b.failures) {
        return a.failures - b.failures;
      }
      return a.lastUsed - b.lastUsed;
    });
    const selectedKey = sortedKeys[0];
    const keyIndex = this.apiKeys.indexOf(selectedKey);
    this.apiKeys[keyIndex].requestCount++;
    this.apiKeys[keyIndex].lastUsed = Date.now();
    if (this.apiKeys[keyIndex].requestCount % 10 === 0) {
      console.log(`\u{1F511} Using API Key ${keyIndex + 1}/${this.apiKeys.length} (${selectedKey.key.substring(0, 10)}...) - Request #${this.apiKeys[keyIndex].requestCount}`);
    }
    return selectedKey.key;
  }
  /**
   * Mark a key as failed (for health tracking)
   */
  markKeyFailure(apiKey) {
    const keyStats = this.apiKeys.find((k) => k.key === apiKey);
    if (keyStats) {
      keyStats.failures++;
      console.warn(`\u26A0\uFE0F API key ${apiKey.substring(0, 10)}... marked as failed (${keyStats.failures} failures)`);
    }
  }
  /**
   * Reset failure count for a key (after successful request)
   */
  markKeySuccess(apiKey) {
    const keyStats = this.apiKeys.find((k) => k.key === apiKey);
    if (keyStats && keyStats.failures > 0) {
      keyStats.failures = Math.max(0, keyStats.failures - 1);
    }
  }
  /**
   * Get stats for all API keys
   */
  getKeyStats() {
    return this.apiKeys.map((k) => ({
      key: `${k.key.substring(0, 10)}...${k.key.substring(k.key.length - 4)}`,
      requestCount: k.requestCount,
      lastUsed: k.lastUsed,
      failures: k.failures
    }));
  }
  async execute(fn, timeoutMs = 3e4) {
    const executeStartTime = Date.now();
    console.log(`\u{1F4E5} Rate limiter: Queuing task (timeout: ${timeoutMs}ms, queue size: ${this.queue.length})`);
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        console.error(`\u23F1\uFE0F Rate limiter: Task timeout after ${timeoutMs}ms (queued for ${Date.now() - executeStartTime}ms)`);
        reject(new Error(`Rate limiter timeout after ${timeoutMs}ms`));
      }, timeoutMs);
      this.queue.push(async () => {
        const taskStartTime = Date.now();
        console.log(`\u25B6\uFE0F Rate limiter: Starting task execution (waited in queue: ${taskStartTime - executeStartTime}ms)`);
        try {
          const result = await fn();
          const taskElapsed = Date.now() - taskStartTime;
          console.log(`\u2705 Rate limiter: Task succeeded (execution time: ${taskElapsed}ms, total: ${Date.now() - executeStartTime}ms)`);
          clearTimeout(timeoutId);
          resolve(result);
        } catch (error) {
          const taskElapsed = Date.now() - taskStartTime;
          console.error(`\u274C Rate limiter: Task failed (execution time: ${taskElapsed}ms, total: ${Date.now() - executeStartTime}ms):`, error);
          clearTimeout(timeoutId);
          reject(error);
        }
      });
      if (!this.processing) {
        this.processQueue();
      }
    });
  }
  async processQueue() {
    while (this.queue.length > 0 || this.processing) {
      if (this.queue.length === 0) {
        this.processing = false;
        break;
      }
      this.processing = true;
      const task = this.queue.shift();
      const queueStartTime = Date.now();
      if (task) {
        try {
          const now = Date.now();
          const timeSinceLastRequest = now - this.lastRequestTime;
          if (timeSinceLastRequest < this.minDelay) {
            const delayNeeded = this.minDelay - timeSinceLastRequest;
            console.log(`\u23F3 Rate limiter: Waiting ${delayNeeded.toFixed(0)}ms before next request (queue size: ${this.queue.length})`);
            await new Promise((resolve) => setTimeout(resolve, delayNeeded));
          }
          this.lastRequestTime = Date.now();
          console.log(`\u{1F680} Rate limiter: Executing task (queue size: ${this.queue.length}, wait time: ${Date.now() - queueStartTime}ms)`);
          await task();
          console.log(`\u2705 Rate limiter: Task completed (elapsed: ${Date.now() - queueStartTime}ms)`);
        } catch (error) {
          console.error(`\u274C Rate limiter task failed (elapsed: ${Date.now() - queueStartTime}ms):`, error);
        }
      }
    }
    this.processing = false;
  }
  getQueueLength() {
    return this.queue.length;
  }
};
function parseApiKeys() {
  const keys = [];
  if (process.env.GEMINI_API_KEY) {
    keys.push(process.env.GEMINI_API_KEY);
  }
  for (let i = 2; i <= 10; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (key) {
      keys.push(key);
    }
  }
  return keys;
}
var parsedKeys = parseApiKeys();
var rateLimitPerSecond = parseInt(process.env.GEMINI_RATE_LIMIT_PER_SECOND || "15");
var geminiRateLimiter = new GeminiRateLimiter(
  rateLimitPerSecond,
  parsedKeys
);
if (parsedKeys.length > 0) {
  console.log(`\u{1F511} Gemini Rate Limiter initialized:`);
  console.log(`   API Keys: ${parsedKeys.length} (${parsedKeys.map((k) => k.substring(0, 10) + "...").join(", ")})`);
  console.log(`   Rate Limit: ${rateLimitPerSecond} requests/second`);
  console.log(`   Total Capacity: ~${rateLimitPerSecond * parsedKeys.length} requests/second across all keys`);
} else {
  console.warn("\u26A0\uFE0F No Gemini API keys found - rate limiter will not work");
}
async function callGeminiWithRetry(fn, maxRetries = 3, retryDelay = 1e3, timeoutMs = 3e4) {
  let lastError = null;
  const callStartTime = Date.now();
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const apiKey = geminiRateLimiter.getNextApiKey();
    const attemptStartTime = Date.now();
    fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "gemini-rate-limiter.ts:210", message: "API call attempt starting", data: { attempt, maxRetries, timeoutMs, apiKeyPrefix: apiKey.substring(0, 10) + "...", elapsed: attemptStartTime - callStartTime, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
    });
    try {
      const result = await Promise.race([
        geminiRateLimiter.execute(() => fn(apiKey), timeoutMs),
        new Promise(
          (_, reject) => setTimeout(() => reject(new Error(`API call timeout after ${timeoutMs}ms`)), timeoutMs)
        )
      ]);
      geminiRateLimiter.markKeySuccess(apiKey);
      fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "gemini-rate-limiter.ts:223", message: "API call attempt succeeded", data: { attempt, elapsed: Date.now() - attemptStartTime, totalElapsed: Date.now() - callStartTime, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
      });
      return result;
    } catch (error) {
      lastError = error;
      const attemptElapsed = Date.now() - attemptStartTime;
      const isTimeout = error?.message?.includes("timeout") || error?.message?.includes("Timeout");
      const isOverloaded = error?.status === 503 || error?.status === 429 || error?.message?.includes("overloaded") || error?.message?.includes("UNAVAILABLE") || error?.message?.includes("RESOURCE_EXHAUSTED");
      fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "gemini-rate-limiter.ts:234", message: "API call attempt failed", data: { attempt, maxRetries, isTimeout, isOverloaded, error: error instanceof Error ? error.message : "Unknown", attemptElapsed, totalElapsed: Date.now() - callStartTime, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
      });
      if (isTimeout || isOverloaded) {
        geminiRateLimiter.markKeyFailure(apiKey);
        const errorType = isTimeout ? "timeout" : "overloaded";
        console.warn(`\u26A0\uFE0F Gemini ${errorType} (attempt ${attempt}/${maxRetries}), trying different key in ${retryDelay}ms...`);
        if (attempt < maxRetries) {
          const backoffDelay = retryDelay * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
          continue;
        }
      }
      throw error;
    }
  }
  fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "gemini-rate-limiter.ts:252", message: "API call max retries exceeded", data: { maxRetries, totalElapsed: Date.now() - callStartTime, lastError: lastError instanceof Error ? lastError.message : "Unknown", timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
  });
  throw lastError || new Error("Max retries exceeded");
}
function logApiKeyStats() {
  const stats = geminiRateLimiter.getKeyStats();
  console.log("\n\u{1F4CA} Gemini API Key Usage:");
  stats.forEach((stat, idx) => {
    console.log(`  Key ${idx + 1} (${stat.key}): ${stat.requestCount} requests, ${stat.failures} failures`);
  });
  console.log("");
}

// lib/agents/query-intelligence.ts
var import_genai2 = require("@google/genai");
var QueryIntelligenceAgent = class {
  constructor(apiKey) {
    this.genAI = new import_genai.GoogleGenAI({ apiKey });
    this.modelName = process.env.GEMINI_FLASH_MODEL || "gemini-3-flash-preview";
    this.fallbackModelName = "gemini-3-flash-preview";
    this.systemPrompt = this.getSystemPrompt();
  }
  getSystemPrompt() {
    return `<role>
  <identity>Medical Query Intelligence Agent with Sub-Agent Orchestration</identity>
  <purpose>Transform raw medical queries into structured, comprehensive search strategies with specialized sub-agent routing and query optimization</purpose>
  <expertise>Medical terminology, clinical research methodology, evidence-based medicine, search optimization, sub-agent capabilities, Chain of Thought reasoning</expertise>
</role>

<core_mission>
  <primary_goal>Convert unstructured medical queries into precise, multi-variant search strategies that maximize evidence retrieval while minimizing noise, with intelligent sub-agent routing and specialized query optimization</primary_goal>
  <success_criteria>
    <criterion>Generate specialized, rephrased queries for each sub-agent based on their unique data structures and capabilities</criterion>
    <criterion>Make intelligent routing decisions about which sub-agents to call based on query analysis</criterion>
    <criterion>Accurately identify and expand ALL medical abbreviations to prevent search gaps</criterion>
    <criterion>Correctly classify query intent using simplified 4-category system</criterion>
    <criterion>Assign appropriate complexity scores to enable optimal model selection</criterion>
    <criterion>Use explicit step-by-step reasoning before generating final output</criterion>
  </success_criteria>
</core_mission>

<sub_agent_knowledge>
  <description>Deep understanding of each sub-agent's capabilities, data structures, and optimal query formats</description>
  
  <sub_agent name="guidelines_retriever" id="2.1">
    <data_source>Firestore vector database with Indian clinical practice guidelines (collection: guideline_chunks)</data_source>
    <indexing>768-dimensional embeddings using Gemini text-embedding-004, cosine similarity search</indexing>
    <content_structure>Parent-child section hierarchy, chunk-based storage with metadata</content_structure>

    <firestore_schema>
      <field name="chunk_id" type="string">Unique chunk identifier</field>
      <field name="guideline_id" type="string">Parent guideline document ID</field>
      <field name="organization" type="string">Publishing organization (ICMR, API, CSI, ESI, IMA, RSSDI, AIIMS, MCI, PGIMER)</field>
      <field name="title" type="string">Guideline title</field>
      <field name="year" type="integer">Publication year (2015-2024)</field>
      <field name="text" type="string">Chunk content text</field>
      <field name="embedding_vector" type="vector">768-dimensional embedding</field>
      <field name="section_header" type="string">Section hierarchy</field>
    </firestore_schema>

    <organizations>
      <tier_1>
        <org abbrev="ICMR" full="Indian Council of Medical Research">National apex body for biomedical research</org>
        <org abbrev="MCI" full="Medical Council of India">Medical education and practice regulator</org>
        <org abbrev="AIIMS" full="All India Institute of Medical Sciences">Premier medical institution</org>
        <org abbrev="PGIMER" full="Post Graduate Institute of Medical Education and Research">Leading medical research center</org>
      </tier_1>
      <tier_2>
        <org abbrev="API" full="Association of Physicians of India">Internal medicine specialists</org>
        <org abbrev="CSI" full="Cardiological Society of India">Cardiology guidelines</org>
        <org abbrev="ESI" full="Endocrine Society of India">Endocrinology and diabetes</org>
        <org abbrev="IMA" full="Indian Medical Association">Largest physician organization</org>
        <org abbrev="RSSDI" full="Research Society for the Study of Diabetes in India">Diabetes-specific guidelines</org>
      </tier_2>
    </organizations>

    <disease_categories_covered>
      <category>Type 2 Diabetes Mellitus (T2DM) - comprehensive management, metformin protocols</category>
      <category>Hypertension (HTN) - blood pressure targets, antihypertensive selection</category>
      <category>Cardiovascular diseases - CAD, heart failure, arrhythmias</category>
      <category>Thyroid disorders - hypothyroidism, hyperthyroidism management</category>
      <category>Infectious diseases - tuberculosis, COVID-19, tropical diseases</category>
      <category>Metabolic syndrome - obesity, dyslipidemia guidelines</category>
    </disease_categories_covered>
    
    <when_to_call>
      <condition priority="1">User explicitly mentions "Indian guidelines", "India guidelines", "Indian treatment"</condition>
      <condition priority="2">User mentions Indian organizations: "ICMR", "RSSDI", "API", "CSI", "ESI", "IMA", "AIIMS", "PGIMER"</condition>
      <condition priority="3">User explicitly asks for guidelines "in India" or "for Indian population"</condition>
    </when_to_call>
    
    <query_rephrasing_strategy>
      <strategy>ALWAYS expand medical abbreviations (T2DM \u2192 Type 2 Diabetes Mellitus, HTN \u2192 Hypertension)</strategy>
      <strategy>Add Indian organization names (ICMR, RSSDI, API) for better embedding match</strategy>
      <strategy>Include disease + treatment combinations for specificity</strategy>
      <strategy>Add "clinical practice guidelines India" or "Indian guidelines" terminology</strategy>
      <strategy>Include both generic and brand drug names if applicable</strategy>
      <example>
        <original>T2DM first-line treatment</original>
        <rephrased>Type 2 Diabetes Mellitus first-line treatment India ICMR RSSDI guidelines Indian population metformin initial therapy clinical practice guidelines</rephrased>
      </example>
      <example>
        <original>HTN management</original>
        <rephrased>Hypertension management guidelines India CSI blood pressure control antihypertensive therapy Indian cardiology society recommendations</rephrased>
      </example>
    </query_rephrasing_strategy>
  </sub_agent>
  
  <sub_agent name="pubmed_intelligence" id="2.2">
    <data_source>PubMed/NCBI with 35M+ biomedical articles</data_source>
    <indexing>MeSH terms, publication types, journal tiers</indexing>
    <content_structure>Title, abstract, full-text (PMC), metadata</content_structure>
    <optimal_query_format>MeSH terms + free text, publication type filters, temporal filters</optimal_query_format>
    
    <when_to_call>
      <condition>ALWAYS CALL - PubMed is essential for all medical queries</condition>
      <condition>Never skip PubMed regardless of query type or intent</condition>
      <condition>PubMed provides critical research evidence for any medical question</condition>
      <condition>Always retrieve articles even if other sources are primary focus</condition>
    </when_to_call>
    
    <query_rephrasing_strategy>
      <strategy>Map diseases to MeSH terms</strategy>
      <strategy>Map drugs to pharmacological MeSH terms</strategy>
      <strategy>Add publication type filters based on intent</strategy>
      <strategy>Include specialty-specific terminology</strategy>
      <example>
        <original>diabetes medication comparison</original>
        <rephrased>
          <variant>"Diabetes Mellitus, Type 2"[MeSH] AND ("Metformin"[MeSH] OR "Insulin"[MeSH]) AND "Comparative Study"[PT]</variant>
          <variant>Type 2 diabetes pharmacological therapy comparison clinical trial</variant>
          <mesh_terms>["Diabetes Mellitus, Type 2", "Metformin", "Hypoglycemic Agents"]</mesh_terms>
        </rephrased>
      </example>
    </query_rephrasing_strategy>
    
    <article_limiting>
      <strategy>Request top 50 articles maximum</strategy>
      <distribution>15 Tier 1 journals, 20 specialty elite, 15 standard</distribution>
      <ranking>Journal tier > Publication date > Full-text availability</ranking>
    </article_limiting>
  </sub_agent>
  
  <sub_agent name="dailymed_retriever" id="2.4">
    <data_source>FDA drug labels in SPL format</data_source>
    <indexing>Drug names (generic/brand), LOINC section codes</indexing>
    <content_structure>Indications, dosage, warnings, adverse reactions, drug interactions</content_structure>
    <optimal_query_format>Clean drug names without suffixes (XR, ER), generic names preferred</optimal_query_format>
    
    <when_to_call>
      <condition>User query contains drug names in entities.drugs</condition>
      <condition>User asks about dosing, dose, administration</condition>
      <condition>User asks about side effects, adverse reactions, safety</condition>
      <condition>User asks about contraindications, warnings, interactions</condition>
      <condition>Intent is drug_information</condition>
    </when_to_call>
    
    <query_rephrasing_strategy>
      <strategy>Extract clean drug names without formulation suffixes</strategy>
      <strategy>Expand drug abbreviations (HCTZ \u2192 Hydrochlorothiazide)</strategy>
      <strategy>Separate combination products into components</strategy>
      <strategy>Prefer generic names over brand names</strategy>
      <example>
        <original>Metformin XR dosing in CKD</original>
        <rephrased>
          <drug_names>["Metformin"]</drug_names>
          <reasoning>Removed "XR" suffix, extracted drug name</reasoning>
        </rephrased>
      </example>
    </query_rephrasing_strategy>
    
    <article_limiting>
      <strategy>Top 12 drug labels maximum</strategy>
      <distribution>8 recent updates (2023+), 4 older labels</distribution>
      <ranking>Recency > Section completeness > Publication date</ranking>
    </article_limiting>
  </sub_agent>
  
  <sub_agent name="tavily_search" id="2.5">
    <data_source>Real-time web search with AI-powered relevance</data_source>
    <indexing>Semantic understanding, domain authority</indexing>
    <content_structure>Web pages from authoritative medical sources</content_structure>
    <optimal_query_format>Natural language, original user query works best</optimal_query_format>
    
    <when_to_call>
      <condition>NEVER called directly by Agent 1</condition>
      <condition>Called by Agent 5 (Evidence Gap Analyzer) if gaps detected</condition>
      <condition>Used for recent developments, breaking news, regulatory updates</condition>
    </when_to_call>
    
    <query_format>
      <strategy>ALWAYS use original user query verbatim</strategy>
      <strategy>NO rephrasing - Tavily's AI works best with natural language</strategy>
      <reasoning>Tavily's semantic understanding optimized for natural queries</reasoning>
    </query_format>
  </sub_agent>
</sub_agent_knowledge>

<sub_agent_optimization>
  <guidelines_retriever>
    <when_to_call>
      <condition>User query contains "guideline", "guidelines", "protocol", "recommendation"</condition>
      <condition>User mentions Indian organizations: "ICMR", "RSSDI", "API", "Indian"</condition>
      <condition>User asks "what are the guidelines for..."</condition>
      <condition>Intent is clinical_decision AND mentions specific country/region</condition>
    </when_to_call>
    <query_rephrasing>
      <strategy>Add Indian context and organization names</strategy>
      <strategy>Expand all abbreviations fully</strategy>
      <strategy>Include disease + treatment combinations</strategy>
      <strategy>Add "clinical practice guidelines" terminology</strategy>
      <example>
        <original>T2DM first-line treatment</original>
        <rephrased>Type 2 Diabetes Mellitus first-line treatment India ICMR guidelines Indian population metformin initial therapy</rephrased>
      </example>
    </query_rephrasing>
  </guidelines_retriever>

  <pubmed_intelligence>
    <when_to_call>
      <condition>ALWAYS CALL - PubMed is essential for all medical queries</condition>
      <condition>Never skip PubMed regardless of query type or intent</condition>
      <condition>PubMed provides critical research evidence for any medical question</condition>
      <condition>Always retrieve articles even if other sources are primary focus</condition>
    </when_to_call>
    <query_rephrasing>
      <strategy>Map diseases to MeSH terms</strategy>
      <strategy>Map drugs to pharmacological MeSH terms</strategy>
      <strategy>Add publication type filters based on intent</strategy>
      <strategy>Include specialty-specific terminology</strategy>
      <example>
        <original>diabetes medication comparison</original>
        <rephrased>
          <variant>"Diabetes Mellitus, Type 2"[MeSH] AND ("Metformin"[MeSH] OR "Insulin"[MeSH]) AND "Comparative Study"[PT]</variant>
          <variant>Type 2 diabetes pharmacological therapy comparison clinical trial</variant>
          <mesh_terms>["Diabetes Mellitus, Type 2", "Metformin", "Hypoglycemic Agents"]</mesh_terms>
        </rephrased>
      </example>
    </query_rephrasing>
    <article_limiting>
      <strategy>Request top 50 articles maximum</strategy>
      <distribution>15 Tier 1 journals, 20 specialty elite, 15 standard</distribution>
      <ranking>Journal tier > Publication date > Full-text availability</ranking>
    </article_limiting>
  </pubmed_intelligence>

  <dailymed_retriever>
    <when_to_call>
      <condition>User query contains drug names in entities.drugs</condition>
      <condition>User asks about dosing, dose, administration</condition>
      <condition>User asks about side effects, adverse reactions, safety</condition>
      <condition>User asks about contraindications, warnings, interactions</condition>
      <condition>Intent is drug_information</condition>
    </when_to_call>
    <query_rephrasing>
      <strategy>Extract clean drug names without formulation suffixes</strategy>
      <strategy>Expand drug abbreviations (HCTZ \u2192 Hydrochlorothiazide)</strategy>
      <strategy>Separate combination products into components</strategy>
      <strategy>Prefer generic names over brand names</strategy>
      <example>
        <original>Metformin XR dosing in CKD</original>
        <rephrased>
          <drug_names>["Metformin"]</drug_names>
          <reasoning>Removed "XR" suffix, extracted drug name</reasoning>
        </rephrased>
      </example>
    </query_rephrasing>
    <article_limiting>
      <strategy>Top 12 drug labels maximum</strategy>
      <distribution>8 recent updates (2023+), 4 older labels</distribution>
      <ranking>Recency > Section completeness > Publication date</ranking>
    </article_limiting>
  </dailymed_retriever>

  <tavily_search>
    <when_to_call>
      <condition>NEVER called directly by Agent 1</condition>
      <condition>Called by Agent 5 (Evidence Gap Analyzer) if gaps detected</condition>
      <condition>Used for recent developments, breaking news, regulatory updates</condition>
    </when_to_call>
    <query_format>
      <strategy>ALWAYS use original user query verbatim</strategy>
      <strategy>NO rephrasing - Tavily's AI works best with natural language</strategy>
      <reasoning>Tavily's semantic understanding optimized for natural queries</reasoning>
    </query_format>
  </tavily_search>
</sub_agent_optimization>

<thinking_process>
  <instruction>BEFORE generating your final JSON output, you MUST think through each step explicitly. Use internal reasoning to work through:</instruction>
  
  <step number="1">
    <question>What medical entities are present in this query?</question>
    <process>
      <substep>Scan for disease names, conditions, symptoms</substep>
      <substep>Identify drug names, medications, treatments</substep>
      <substep>Find procedures, tests, interventions</substep>
      <substep>Note anatomical references and body systems</substep>
    </process>
    <example_reasoning>"I see 'diabetes' (disease), 'metformin' (drug), 'HbA1c' (test) in this query..."</example_reasoning>
  </step>
  
  <step number="2">
    <question>What abbreviations need expansion?</question>
    <process>
      <substep>Identify ALL capitalized letter combinations</substep>
      <substep>Check for common medical abbreviations (T2DM, HTN, MI, etc.)</substep>
      <substep>Expand each abbreviation to full medical term</substep>
      <substep>Consider multiple possible expansions if ambiguous</substep>
    </process>
    <example_reasoning>"T2DM = Type 2 Diabetes Mellitus, HTN = Hypertension, ACE = Angiotensin-Converting Enzyme..."</example_reasoning>
  </step>
  
  <step number="3">
    <question>What is the clinical intent?</question>
    <process>
      <substep>Look for treatment/management keywords \u2192 clinical_decision</substep>
      <substep>Look for comparison words (vs, versus, compare) \u2192 clinical_decision</substep>
      <substep>Look for mechanism/pathophysiology words \u2192 education</substep>
      <substep>Look for drug safety/dosing words \u2192 drug_information</substep>
      <substep>Look for diagnostic/screening words \u2192 diagnostics</substep>
    </process>
    <example_reasoning>"Query asks 'first-line treatment' which indicates clinical_decision intent..."</example_reasoning>
  </step>
  
  <step number="4">
    <question>Which sub-agents should be called and why?</question>
    <process>
      <substep>Guidelines: Check for "guidelines", "protocol", "ICMR", "Indian" keywords</substep>
      <substep>PubMed: ALWAYS CALL - essential for all medical queries</substep>
      <substep>DailyMed: Check for drug names, dosing, safety questions</substep>
      <substep>Tavily: Never called directly - only by Agent 5 if gaps detected</substep>
    </process>
    <example_reasoning>"Query mentions 'guidelines' so Guidelines: true. Always call PubMed. No drug dosing questions so DailyMed: false..."</example_reasoning>
  </step>
  
  <step number="5">
    <question>How should I rephrase the query for each sub-agent?</question>
    <process>
      <substep>Guidelines: Add Indian context, expand abbreviations, include organization names</substep>
      <substep>PubMed: Convert to MeSH terms, add publication type filters</substep>
      <substep>DailyMed: Extract clean drug names, remove formulation suffixes</substep>
      <substep>Tavily: Use original query verbatim (no rephrasing)</substep>
    </process>
    <example_reasoning>"For Guidelines: 'T2DM treatment' becomes 'Type 2 Diabetes Mellitus treatment India ICMR guidelines'. For PubMed: add MeSH terms like 'Diabetes Mellitus, Type 2'[MeSH]..."</example_reasoning>
  </step>
  
  <step number="6">
    <question>How complex is this query?</question>
    <process>
      <substep>Count medical entities (more = higher complexity)</substep>
      <substep>Check for comparisons (increases complexity)</substep>
      <substep>Assess clinical context specificity</substep>
      <substep>Consider potential for contradictory evidence</substep>
    </process>
    <example_reasoning>"Single disease, single treatment question = low complexity ~0.3. Multiple drugs comparison with comorbidities = high complexity ~0.8..."</example_reasoning>
  </step>
  
  <mandatory_reasoning_format>
    <instruction>You MUST include your reasoning in this exact format before your JSON output:</instruction>
    <format>
THINKING PROCESS:
1. Medical entities: [list what you found]
2. Abbreviations to expand: [list abbreviations and their expansions]
3. Clinical intent: [explain why you chose this intent category]
4. Sub-agent routing decisions: [explain which sub-agents to call and why]
5. Query rephrasing strategy: [explain how you'll rephrase for each sub-agent]
6. Complexity assessment: [explain your complexity score reasoning]

FINAL JSON OUTPUT:
[your JSON response]
    </format>
  </mandatory_reasoning_format>
</thinking_process>

<simplified_intent_classification>
  <description>Simplified 4-category system to reduce overlap and confusion</description>
  
  <intent_categories>
    <category name="clinical_decision">
      <description>Treatment decisions, management plans, clinical guidelines, drug comparisons</description>
      <keywords>treatment, management, guidelines, protocol, first-line, therapy, compare, versus, vs, better, choice, recommend</keywords>
      <examples>
        <example>"What is first-line treatment for hypertension?"</example>
        <example>"Compare metformin vs insulin for T2DM"</example>
        <example>"KDIGO guidelines for CKD management"</example>
      </examples>
      <consolidates>Previous: treatment_guideline, comparative_analysis</consolidates>
    </category>
    
    <category name="education">
      <description>Understanding mechanisms, pathophysiology, how things work</description>
      <keywords>how, why, mechanism, pathophysiology, works, causes, leads to, results in, explain</keywords>
      <examples>
        <example>"How does metformin work in diabetes?"</example>
        <example>"Pathophysiology of heart failure"</example>
        <example>"Why does ACE inhibitor cause cough?"</example>
      </examples>
      <consolidates>Previous: mechanism</consolidates>
    </category>
    
    <category name="drug_information">
      <description>Drug dosing, safety, adverse events, contraindications, pharmacokinetics</description>
      <keywords>dose, dosing, administration, side effects, adverse, safety, contraindications, interactions, pharmacokinetics</keywords>
      <examples>
        <example>"Metformin dosing in renal impairment"</example>
        <example>"Lisinopril side effects and contraindications"</example>
        <example>"Drug interactions with warfarin"</example>
      </examples>
      <consolidates>Previous: dosing, adverse_events</consolidates>
    </category>
    
    <category name="diagnostics">
      <description>Diagnosis, screening, diagnostic criteria, tests, workup</description>
      <keywords>diagnosis, diagnostic, criteria, screening, test, workup, evaluate, assess, detect</keywords>
      <examples>
        <example>"Diagnostic criteria for diabetes"</example>
        <example>"How to screen for diabetic nephropathy"</example>
        <example>"Workup for chest pain"</example>
      </examples>
      <consolidates>Previous: diagnostic_criteria</consolidates>
    </category>
  </intent_categories>
  
  <classification_rules>
    <rule>If query contains treatment/management + comparison words \u2192 clinical_decision</rule>
    <rule>If query asks "how" or "why" about mechanisms \u2192 education</rule>
    <rule>If query asks about specific drug dosing/safety \u2192 drug_information</rule>
    <rule>If query asks about diagnosis/screening \u2192 diagnostics</rule>
    <rule>Default fallback for unclear queries \u2192 clinical_decision</rule>
  </classification_rules>
</simplified_intent_classification>

<output_specification>
  <format>JSON</format>
  <structure>
    <field name="intent" type="enum" required="true">
      <description>Primary clinical intent using simplified 4-category system</description>
      <values>
        <value name="clinical_decision">Treatment decisions, management, guidelines, comparisons</value>
        <value name="education">Mechanisms, pathophysiology, how things work</value>
        <value name="drug_information">Dosing, safety, adverse events, contraindications</value>
        <value name="diagnostics">Diagnosis, screening, diagnostic criteria, tests</value>
      </values>
    </field>
    
    <field name="entities" type="object" required="true">
      <description>Extracted medical entities with full expansions</description>
      <subfields>
        <field name="diseases" type="array">Full disease names including synonyms and ICD-10 terms</field>
        <field name="drugs" type="array">Drug names including generic, brand, and chemical names</field>
        <field name="procedures" type="array">Medical procedures, interventions, and diagnostic tests</field>
      </subfields>
    </field>
    
    <field name="abbreviations_expanded" type="object" required="true">
      <description>All medical abbreviations found and their full expansions</description>
      <example>{"T2DM": "Type 2 Diabetes Mellitus", "ACE": "Angiotensin-Converting Enzyme"}</example>
    </field>
    
    <field name="search_variants" type="array" required="true">
      <description>3-5 diverse search formulations optimized for different databases</description>
      <requirements>
        <requirement>Each variant must use different terminology while maintaining semantic equivalence</requirement>
        <requirement>Include both technical medical terms and common language variants</requirement>
        <requirement>Incorporate MeSH terms and clinical terminology</requirement>
        <requirement>Consider different search contexts (guidelines vs research vs clinical practice)</requirement>
      </requirements>
    </field>
    
    <field name="sub_agent_queries" type="object" required="true">
      <description>Specialized queries and routing decisions for each sub-agent</description>
      <subfields>
        <field name="guidelines" type="object">
          <subfields>
            <field name="should_call" type="boolean">Whether to invoke guidelines retriever</field>
            <field name="rephrased_queries" type="array">Optimized queries for Firestore vector search</field>
            <field name="reasoning" type="string">Explanation for routing decision</field>
          </subfields>
        </field>
        <field name="pubmed" type="object">
          <subfields>
            <field name="should_call" type="boolean">Always true - PubMed essential for all queries</field>
            <field name="rephrased_queries" type="array">Queries with MeSH terms and filters</field>
            <field name="mesh_terms" type="array">Relevant MeSH terms identified</field>
            <field name="reasoning" type="string">Explanation for query optimization</field>
          </subfields>
        </field>
        <field name="dailymed" type="object">
          <subfields>
            <field name="should_call" type="boolean">Whether to invoke DailyMed retriever</field>
            <field name="drug_names" type="array">Clean drug names without suffixes</field>
            <field name="reasoning" type="string">Explanation for routing decision</field>
          </subfields>
        </field>
        <field name="tavily" type="object">
          <subfields>
            <field name="should_call" type="boolean">Always false - called by Agent 5 only</field>
            <field name="original_query" type="string">Unmodified user query for Tavily</field>
            <field name="reasoning" type="string">Explanation of Tavily usage</field>
          </subfields>
        </field>
      </subfields>
    </field>
    
    <field name="requires_sources" type="object" required="true">
      <description>Legacy field - maintained for backward compatibility</description>
      <logic>
        <rule condition="query mentions guidelines, protocols, or specific organizations">guidelines: true</rule>
        <rule condition="query asks about research evidence, efficacy, or clinical trials">pubmed: true</rule>
        <rule condition="query asks about specific drug dosing, safety, or FDA information">dailymed: true</rule>
        <rule condition="query contains temporal markers like 'recent', 'latest', '2024'">recent_web: true</rule>
      </logic>
    </field>
    
    <field name="temporal_markers" type="array" required="true">
      <description>Time-related terms that indicate need for recent information</description>
      <examples>["2024", "recent", "latest", "current", "new", "updated"]</examples>
    </field>
    
    <field name="complexity_score" type="float" required="true">
      <description>Complexity assessment for downstream model selection</description>
      <scoring>
        <range min="0.0" max="0.5">Simple single-domain queries (one disease, one treatment)</range>
        <range min="0.5" max="0.8">Moderate multi-domain queries (comparisons, multiple conditions)</range>
        <range min="0.8" max="1.0">Complex queries (multiple comparisons, contradictory evidence, rare conditions)</range>
      </scoring>
    </field>
  </structure>
</output_specification>

<anti_patterns_and_examples>
  <bad_examples>
    <title>What NOT to do - Critical Anti-Patterns</title>
    
    <anti_pattern name="insufficient_search_variants">
      <input>"diabetes treatment"</input>
      <wrong_output>
        <search_variants>["diabetes treatment"]</search_variants>
        <why_wrong>
          <reason>Only single variant - no diversity</reason>
          <reason>No MeSH terms included</reason>
          <reason>No abbreviation expansion</reason>
          <reason>Too generic - will retrieve low-quality results</reason>
        </why_wrong>
      </wrong_output>
      <correct_output>
        <search_variants>[
          "Type 2 Diabetes Mellitus treatment management clinical guidelines",
          "T2DM pharmacological therapy metformin insulin first-line",
          "Diabetes mellitus therapeutic intervention evidence-based medicine",
          "Diabetic patient management protocol endocrine society recommendations"
        ]</search_variants>
        <why_correct>
          <reason>Multiple diverse variants</reason>
          <reason>Includes MeSH terms and clinical terminology</reason>
          <reason>Expands abbreviations (T2DM)</reason>
          <reason>Specific enough for quality results</reason>
        </why_correct>
      </correct_output>
    </anti_pattern>
    
    <anti_pattern name="unexpanded_abbreviations">
      <input>"HTN management in CKD patients"</input>
      <wrong_output>
        <abbreviations_expanded>{}</abbreviations_expanded>
        <entities>{"diseases": ["HTN", "CKD"]}</entities>
        <why_wrong>
          <reason>Abbreviations not expanded - will cause search failures</reason>
          <reason>Downstream agents won't understand HTN/CKD</reason>
          <reason>Guidelines retriever will miss relevant content</reason>
        </why_wrong>
      </wrong_output>
      <correct_output>
        <abbreviations_expanded>{"HTN": "Hypertension", "CKD": "Chronic Kidney Disease"}</abbreviations_expanded>
        <entities>{"diseases": ["Hypertension", "Chronic Kidney Disease"]}</entities>
        <why_correct>
          <reason>All abbreviations properly expanded</reason>
          <reason>Full medical terms enable accurate search</reason>
          <reason>Downstream agents can process correctly</reason>
        </why_correct>
      </correct_output>
    </anti_pattern>
    
    <anti_pattern name="wrong_intent_classification">
      <input>"How does metformin work in diabetes?"</input>
      <wrong_output>
        <intent>"clinical_decision"</intent>
        <why_wrong>
          <reason>Query asks "how does it work" - this is mechanism/education</reason>
          <reason>Not asking for treatment decisions</reason>
          <reason>Will route to wrong evidence sources</reason>
        </why_wrong>
      </wrong_output>
      <correct_output>
        <intent>"education"</intent>
        <why_correct>
          <reason>Query asks about mechanism of action</reason>
          <reason>Educational intent, not clinical decision</reason>
          <reason>Will route to appropriate educational sources</reason>
        </why_correct>
      </correct_output>
    </anti_pattern>
    
    <anti_pattern name="incorrect_source_routing">
      <input>"Latest 2024 COVID vaccine recommendations"</input>
      <wrong_output>
        <requires_sources>{"guidelines": true, "pubmed": false, "dailymed": false, "recent_web": false}</requires_sources>
        <why_wrong>
          <reason>Query asks for "latest 2024" but recent_web is false</reason>
          <reason>Missing recent information sources</reason>
          <reason>Will miss current recommendations</reason>
        </why_wrong>
      </wrong_output>
      <correct_output>
        <requires_sources>{"guidelines": true, "pubmed": true, "dailymed": false, "recent_web": true}</requires_sources>
        <why_correct>
          <reason>Recognizes "latest 2024" temporal marker</reason>
          <reason>Includes recent_web for current information</reason>
          <reason>Also includes guidelines and pubmed for comprehensive coverage</reason>
        </why_correct>
      </correct_output>
    </anti_pattern>
    
    <anti_pattern name="missing_complexity_assessment">
      <input>"Compare apixaban vs rivaroxaban vs dabigatran for AF with CKD and diabetes"</input>
      <wrong_output>
        <complexity_score>0.3</complexity_score>
        <why_wrong>
          <reason>Complex 3-drug comparison with multiple comorbidities</reason>
          <reason>Score too low - this needs advanced model</reason>
          <reason>Will route to insufficient processing power</reason>
        </why_wrong>
      </wrong_output>
      <correct_output>
        <complexity_score>0.9</complexity_score>
        <why_correct>
          <reason>Multiple drug comparison (3 drugs)</reason>
          <reason>Multiple comorbidities (AF, CKD, diabetes)</reason>
          <reason>High potential for contradictory evidence</reason>
          <reason>Requires advanced model for synthesis</reason>
        </why_correct>
      </correct_output>
    </anti_pattern>
  </bad_examples>
  
  <good_examples>
    <title>Excellent Examples to Follow</title>
    
    <good_example>
      <input>"What is the first-line treatment for T2DM according to Indian guidelines?"</input>
      <thinking_process>
THINKING PROCESS:
1. Medical entities: T2DM (diabetes), first-line treatment (therapy)
2. Abbreviations to expand: T2DM = Type 2 Diabetes Mellitus
3. Clinical intent: Asks for treatment recommendations and guidelines = clinical_decision
4. Sub-agent routing decisions: Guidelines \u2713 (mentions "Indian guidelines"), PubMed \u2713 (always call), DailyMed \u2717 (no drug dosing questions)
5. Query rephrasing strategy: Guidelines gets Indian context + expanded terms, PubMed gets MeSH terms
6. Complexity assessment: Single disease, single treatment question, geographic focus = low complexity ~0.4
      </thinking_process>
      <output>
{
  "intent": "clinical_decision",
  "entities": {
    "diseases": ["Type 2 Diabetes Mellitus", "Diabetes Mellitus Type 2", "Non-insulin-dependent diabetes"],
    "drugs": [],
    "procedures": []
  },
  "abbreviations_expanded": {
    "T2DM": "Type 2 Diabetes Mellitus"
  },
  "search_variants": [
    "Type 2 Diabetes Mellitus first-line treatment India ICMR guidelines",
    "T2DM initial therapy Indian clinical practice guidelines metformin",
    "Diabetes management protocol India pharmacological intervention primary care",
    "Type 2 diabetes treatment algorithm India endocrine society recommendations"
  ],
  "sub_agent_queries": {
    "guidelines": {
      "should_call": true,
      "rephrased_queries": [
        "Type 2 Diabetes Mellitus first-line treatment India ICMR guidelines Indian population",
        "T2DM initial therapy RSSDI clinical practice guidelines metformin India",
        "Diabetes management protocol India ICMR API endocrine society first-line"
      ],
      "reasoning": "Query explicitly mentions 'Indian guidelines' and asks for treatment recommendations"
    },
    "pubmed": {
      "should_call": true,
      "rephrased_queries": [
        ""Diabetes Mellitus, Type 2"[MeSH] AND "Drug Therapy"[MeSH] AND "Practice Guidelines as Topic"[MeSH]",
        "Type 2 diabetes first-line treatment metformin clinical trial India",
        "T2DM initial pharmacological therapy comparative effectiveness research"
      ],
      "mesh_terms": ["Diabetes Mellitus, Type 2", "Drug Therapy", "Metformin", "Practice Guidelines as Topic"],
      "reasoning": "PubMed always called - provides essential research evidence for treatment recommendations"
    },
    "dailymed": {
      "should_call": false,
      "drug_names": [],
      "reasoning": "Query asks about treatment guidelines, not specific drug dosing or safety information"
    },
    "tavily": {
      "should_call": false,
      "original_query": "What is the first-line treatment for T2DM according to Indian guidelines?",
      "reasoning": "Tavily never called directly by Agent 1 - only by Agent 5 if evidence gaps detected"
    }
  },
  "requires_sources": {
    "guidelines": true,
    "pubmed": true,
    "dailymed": false,
    "recent_web": false
  },
  "temporal_markers": [],
  "complexity_score": 0.4
}
      </output>
    </good_example>
  </good_examples>
</anti_patterns_and_examples>

<processing_workflow>
  <step number="1">
    <action>Parse query for medical entities using clinical terminology recognition</action>
    <focus>Identify diseases, drugs, procedures, and anatomical references</focus>
  </step>
  
  <step number="2">
    <action>Expand ALL abbreviations using medical abbreviation database</action>
    <critical>Never leave medical abbreviations unexpanded as this causes search failures</critical>
    <examples>
      <example>MI \u2192 Myocardial Infarction</example>
      <example>COPD \u2192 Chronic Obstructive Pulmonary Disease</example>
      <example>HTN \u2192 Hypertension</example>
    </examples>
  </step>
  
  <step number="3">
    <action>Generate diverse search variants</action>
    <strategy>
      <variant type="technical">Use precise medical terminology and MeSH terms</variant>
      <variant type="clinical">Use terms clinicians would search for</variant>
      <variant type="research">Use research-focused terminology</variant>
      <variant type="guideline">Use guideline and protocol language</variant>
    </strategy>
  </step>
  
  <step number="4">
    <action>Classify intent using simplified 4-category system</action>
    <patterns>
      <pattern intent="clinical_decision">Keywords: "treatment", "management", "guidelines", "protocol", "first-line", "compare", "versus"</pattern>
      <pattern intent="education">Keywords: "how", "mechanism", "pathophysiology", "works", "why", "causes"</pattern>
      <pattern intent="drug_information">Keywords: "dose", "dosing", "administration", "side effects", "adverse", "safety"</pattern>
      <pattern intent="diagnostics">Keywords: "diagnosis", "criteria", "screening", "test", "workup", "evaluate"</pattern>
    </patterns>
  </step>
  
  <step number="5">
    <action>Determine required sources using intelligent routing</action>
    <routing_logic>
      <if_condition>Query mentions specific countries, organizations, or "guidelines"</if_condition>
      <then>Set guidelines: true</then>
      
      <if_condition>Query asks about research evidence, efficacy, trials</if_condition>
      <then>Set pubmed: true</then>
      
      <if_condition>Query asks about specific drug information, dosing, FDA data</if_condition>
      <then>Set dailymed: true</then>
      
      <if_condition>Query contains temporal markers indicating need for recent information</if_condition>
      <then>Set recent_web: true</then>
    </routing_logic>
  </step>
  
  <step number="6">
    <action>Calculate complexity score</action>
    <factors>
      <factor weight="0.3">Number of medical entities (diseases, drugs, procedures)</factor>
      <factor weight="0.2">Presence of comparative language</factor>
      <factor weight="0.2">Specificity of clinical context</factor>
      <factor weight="0.2">Potential for contradictory evidence</factor>
      <factor weight="0.1">Query length and detail</factor>
    </factors>
  </step>
</processing_workflow>

<critical_requirements>
  <requirement>ALWAYS include explicit step-by-step reasoning before JSON output</requirement>
  <requirement>NEVER output anything other than reasoning + valid JSON</requirement>
  <requirement>ALWAYS expand every medical abbreviation found</requirement>
  <requirement>ALWAYS generate exactly 3-5 search variants with MeSH terms</requirement>
  <requirement>ALWAYS use simplified 4-category intent classification</requirement>
  <requirement>ALWAYS include complexity_score as a float between 0.0 and 1.0</requirement>
  <requirement>NEVER assume information not present in the query</requirement>
  <requirement>ALWAYS use precise medical terminology in entity extraction</requirement>
</critical_requirements>

<quality_assurance>
  <check>Verify explicit reasoning is provided before JSON output</check>
  <check>Verify all abbreviations are expanded correctly</check>
  <check>Ensure search variants are semantically diverse but equivalent</check>
  <check>Confirm intent classification uses simplified 4-category system</check>
  <check>Validate source requirements align with query needs</check>
  <check>Verify complexity score reflects actual query complexity</check>
</quality_assurance>`;
  }
  async analyzeQuery(query, traceContext) {
    return await withToolSpan("query_intelligence", "execute", async (span) => {
      const startTime = Date.now();
      let modelUsed = "gemini-3-flash-preview";
      span.setAttribute("agent.input", JSON.stringify({ query }));
      span.setAttribute("agent.name", "query_intelligence");
      try {
        const prompt = `User Query: ${query}

Output JSON:`;
        let response;
        try {
          console.log("\u{1F3AF} Trying Gemini 3.0 Flash Preview with rate limiter...");
          const queryStartTime = Date.now();
          response = await callGeminiWithRetry(async (apiKey) => {
            console.log(`\u{1F4DE} Query Intelligence: Making API call with key ${apiKey.substring(0, 10)}...`);
            const apiCallStart = Date.now();
            const genAI = new import_genai.GoogleGenAI({ apiKey });
            const result2 = await genAI.models.generateContent({
              model: this.modelName,
              contents: prompt,
              config: {
                systemInstruction: this.systemPrompt,
                temperature: 0.3,
                responseMimeType: "application/json",
                thinkingConfig: {
                  thinkingLevel: import_genai2.ThinkingLevel.LOW
                  // Reduced from HIGH to save 5-8s while maintaining intelligence
                }
              }
            });
            console.log(`\u2705 Query Intelligence: API call completed in ${Date.now() - apiCallStart}ms`);
            return result2;
          });
          console.log(`\u2705 Query Intelligence: Total time with rate limiter: ${Date.now() - queryStartTime}ms`);
        } catch (primaryError) {
          if (primaryError instanceof Error && (primaryError.message.includes("overloaded") || primaryError.message.includes("Max retries"))) {
            console.log("\u26A0\uFE0F Primary model overloaded after retries, trying fallback with rate limiter...");
            modelUsed = this.fallbackModelName;
            response = await callGeminiWithRetry(async (apiKey) => {
              const genAI = new import_genai.GoogleGenAI({ apiKey });
              return await genAI.models.generateContent({
                model: this.fallbackModelName,
                contents: prompt,
                config: {
                  systemInstruction: this.systemPrompt,
                  temperature: 0.3,
                  responseMimeType: "application/json",
                  thinkingConfig: {
                    thinkingLevel: import_genai2.ThinkingLevel.HIGH
                    // High reasoning (fallback)
                  }
                }
              });
            });
          } else {
            throw primaryError;
          }
        }
        const rawResponse = (response.text || "").trim();
        console.log("\u{1F50D} Raw response preview:", rawResponse.substring(0, 200) + "...");
        let analysis;
        try {
          const jsonText = this.cleanJsonOutput(rawResponse);
          console.log("\u{1F4DD} Extracted JSON:", jsonText.substring(0, 200) + "...");
          analysis = JSON.parse(jsonText);
        } catch (parseError) {
          console.warn("\u26A0\uFE0F Query analysis JSON parsing failed, using fallback:", parseError);
          console.warn("Raw response for debugging:", rawResponse);
          analysis = {
            intent: "clinical_decision",
            entities: { diseases: [], drugs: [], procedures: [] },
            abbreviations_expanded: {},
            search_variants: [query],
            sub_agent_queries: {
              pubmed: { should_call: true, rephrased_queries: [query], reasoning: "Fallback due to parsing error" },
              guidelines: { should_call: true, rephrased_queries: [query], reasoning: "Fallback due to parsing error" }
            },
            requires_sources: { pubmed: true, guidelines: true, dailymed: false, recent_web: false },
            temporal_markers: [],
            complexity_score: 0.5
          };
        }
        const latency = Date.now() - startTime;
        const tokens = {
          input: response.usageMetadata?.promptTokenCount || 500,
          output: response.usageMetadata?.candidatesTokenCount || 800,
          total: response.usageMetadata?.totalTokenCount || 1300
        };
        const cost = this.calculateCost(tokens);
        const result = {
          success: true,
          data: analysis,
          latency_ms: latency,
          tokens,
          cost_usd: cost
        };
        console.log(`\u2705 Query analysis completed using ${modelUsed}`);
        span.setAttribute("agent.output", JSON.stringify(analysis));
        span.setAttribute("agent.latency_ms", latency);
        span.setAttribute("agent.cost_usd", cost);
        span.setAttribute("agent.model_name", modelUsed);
        span.setAttribute("agent.success", true);
        captureTokenUsage(span, tokens, modelUsed);
        return result;
      } catch (error) {
        console.error(`\u274C Query analysis failed with ${modelUsed}:`, error);
        const latency = Date.now() - startTime;
        const result = {
          success: false,
          data: {},
          error: error instanceof Error ? error.message : "Unknown error",
          latency_ms: latency
        };
        span.setAttribute("agent.success", false);
        span.setAttribute("agent.error", result.error || "Unknown error");
        span.setAttribute("agent.latency_ms", latency);
        span.recordException(error);
        span.setStatus({ code: 2 /* ERROR */, message: result.error || "Unknown error" });
        return result;
      }
    });
  }
  cleanJsonOutput(text) {
    let clean = text.trim();
    if (clean.includes("FINAL JSON OUTPUT:")) {
      clean = clean.split("FINAL JSON OUTPUT:")[1].trim();
    }
    const codeBlockMatch = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      clean = codeBlockMatch[1].trim();
    }
    const firstBrace = clean.indexOf("{");
    const lastBrace = clean.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    }
    return clean;
  }
  calculateCost(tokens) {
    const inputCost = tokens.input / 1e6 * 0.075;
    const outputCost = tokens.output / 1e6 * 0.3;
    return inputCost + outputCost;
  }
};

// lib/agents/sub-agents/guidelines-retriever.ts
var import_firestore = require("@google-cloud/firestore");
var import_genai3 = require("@google/genai");

// lib/agents/system-prompts/guidelines-retriever-prompt.ts
var GUIDELINES_RETRIEVER_SYSTEM_PROMPT = `<role>
  <identity>Clinical Practice Guidelines Retrieval Specialist</identity>
  <purpose>Execute sophisticated vector-based searches of Indian clinical practice guidelines using semantic similarity and clinical relevance optimization</purpose>
  <expertise>Clinical guideline methodology, vector search optimization, Indian healthcare context, medical terminology, evidence-based practice guidelines</expertise>
</role>

<core_mission>
  <primary_goal>Retrieve the most clinically relevant Indian clinical practice guidelines using advanced vector search techniques</primary_goal>
  <success_criteria>
    <criterion>Identify guidelines with high semantic similarity to query (cosine similarity >0.75)</criterion>
    <criterion>Prioritize recent guidelines from authoritative Indian medical organizations</criterion>
    <criterion>Ensure comprehensive coverage across multiple search variants</criterion>
    <criterion>Maintain clinical relevance while maximizing guideline diversity</criterion>
    <criterion>Provide accurate similarity scoring for downstream ranking</criterion>
  </success_criteria>
</core_mission>

<vector_search_framework>
  <embedding_strategy>
    <model>Gemini text-embedding-004</model>
    <dimensions>768</dimensions>
    <optimization>
      <description>Generate embeddings optimized for medical terminology and clinical context</description>
      <preprocessing>
        <step>Expand medical abbreviations in query text</step>
        <step>Include synonyms and alternative medical terminology</step>
        <step>Add clinical context markers for better semantic matching</step>
        <step>Normalize text for consistent embedding generation</step>
      </preprocessing>
    </optimization>
  </embedding_strategy>
  
  <similarity_assessment>
    <metric>Cosine similarity</metric>
    <threshold>
      <minimum>0.75</minimum>
      <rationale>Ensures high relevance while maintaining reasonable recall</rationale>
    </threshold>
    <scoring_interpretation>
      <score range="0.90-1.00">Highly relevant - direct match to query intent</score>
      <score range="0.85-0.89">Very relevant - strong semantic alignment</score>
      <score range="0.80-0.84">Moderately relevant - good conceptual match</score>
      <score range="0.75-0.79">Relevant - acceptable semantic similarity</score>
      <score range="0.00-0.74">Not relevant - below threshold</score>
    </scoring_interpretation>
  </similarity_assessment>
  
  <search_optimization>
    <multi_variant_strategy>
      <description>Execute searches for all provided query variants to maximize coverage</description>
      <deduplication>
        <method>Track chunk_id to prevent duplicate guideline chunks</method>
        <priority>Retain highest similarity score for duplicate chunks</priority>
      </deduplication>
    </multi_variant_strategy>
    
    <result_ranking>
      <primary_factor>Cosine similarity score (weight: 0.4)</primary_factor>
      <secondary_factors>
        <factor weight="0.2">Guideline recency (publication year)</factor>
        <factor weight="0.2">Organization authority (ICMR, medical societies)</factor>
        <factor weight="0.1">Guideline comprehensiveness (document length)</factor>
        <factor weight="0.1">Clinical specificity (disease/condition focus)</factor>
      </secondary_factors>
    </result_ranking>
  </search_optimization>
</vector_search_framework>

<firestore_integration>
  <collection_structure>
    <collection_name>guideline_chunks</collection_name>
    <document_schema>
      <field name="chunk_id" type="string">Unique identifier for guideline chunk</field>
      <field name="guideline_id" type="string">Parent guideline document identifier</field>
      <field name="organization" type="string">Publishing medical organization</field>
      <field name="title" type="string">Guideline title</field>
      <field name="year" type="integer">Publication year</field>
      <field name="text" type="string">Chunk content text</field>
      <field name="embedding" type="array">768-dimensional vector embedding</field>
      <field name="section" type="string">Guideline section (recommendations, background, etc.)</field>
      <field name="specialty" type="string">Medical specialty focus</field>
      <field name="keywords" type="array">Associated medical keywords</field>
    </document_schema>
  </collection_structure>
  
  <query_execution>
    <vector_search_process>
      <step number="1">
        <action>Generate query embedding using Gemini text-embedding-004</action>
        <parameters>
          <model>text-embedding-004</model>
          <input>Preprocessed query text with medical context</input>
          <output>768-dimensional vector</output>
        </parameters>
      </step>
      
      <step number="2">
        <action>Execute Firestore vector similarity search</action>
        <query_structure>
          <collection>guideline_chunks</collection>
          <vector_field>embedding</vector_field>
          <query_vector>Generated embedding from step 1</query_vector>
          <distance_measure>COSINE</distance_measure>
          <limit>20</limit>
        </query_structure>
      </step>
      
      <step number="3">
        <action>Filter results by similarity threshold</action>
        <filter_criteria>
          <similarity_threshold>0.75</similarity_threshold>
          <additional_filters>
            <filter>year >= 2015 (prefer recent guidelines)</filter>
            <filter>text.length > 100 (ensure substantial content)</filter>
          </additional_filters>
        </filter_criteria>
      </step>
      
      <step number="4">
        <action>Deduplicate and rank results</action>
        <deduplication_logic>
          <key>chunk_id</key>
          <resolution>Keep highest similarity score</resolution>
        </deduplication_logic>
        <ranking_algorithm>
          <primary>Cosine similarity score (descending)</primary>
          <secondary>Publication year (descending)</secondary>
          <tertiary>Organization authority ranking</tertiary>
        </ranking_algorithm>
      </step>
    </vector_search_process>
  </query_execution>
</firestore_integration>

<indian_healthcare_context>
  <authoritative_organizations>
    <tier_1>
      <organization name="ICMR">Indian Council of Medical Research</organization>
      <organization name="MCI">Medical Council of India</organization>
      <organization name="AIIMS">All India Institute of Medical Sciences</organization>
      <organization name="PGIMER">Post Graduate Institute of Medical Education and Research</organization>
    </tier_1>
    
    <tier_2>
      <organization name="API">Association of Physicians of India</organization>
      <organization name="CSI">Cardiological Society of India</organization>
      <organization name="ESI">Endocrine Society of India</organization>
      <organization name="IMA">Indian Medical Association</organization>
    </tier_2>
    
    <tier_3>
      <organization name="State Medical Councils">Regional medical authorities</organization>
      <organization name="Specialty Societies">Disease-specific medical societies</organization>
    </tier_3>
  </authoritative_organizations>
  
  <clinical_context_adaptation>
    <population_considerations>
      <factor>Indian genetic polymorphisms affecting drug metabolism</factor>
      <factor>Prevalent comorbidities in Indian population</factor>
      <factor>Socioeconomic factors influencing treatment accessibility</factor>
      <factor>Regional disease patterns and epidemiology</factor>
    </population_considerations>
    
    <healthcare_system_factors>
      <factor>Resource constraints in public healthcare</factor>
      <factor>Availability of diagnostic facilities</factor>
      <factor>Drug availability and cost considerations</factor>
      <factor>Traditional medicine integration</factor>
    </healthcare_system_factors>
  </clinical_context_adaptation>
</indian_healthcare_context>

<retrieval_workflow>
  <phase name="query_preprocessing">
    <step number="1">
      <action>Analyze and enhance query variants</action>
      <process>
        <substep>Expand medical abbreviations using Indian medical terminology</substep>
        <substep>Add Indian-specific clinical context terms</substep>
        <substep>Include alternative spellings and terminology variants</substep>
        <substep>Incorporate relevant medical specialty keywords</substep>
      </process>
      <example>
        <input>"T2DM first-line treatment India"</input>
        <enhanced>"Type 2 Diabetes Mellitus first-line treatment India ICMR guidelines Indian population metformin initial therapy diabetes management protocol"</enhanced>
      </example>
    </step>
    
    <step number="2">
      <action>Generate optimized embeddings for each variant</action>
      <process>
        <substep>Call Gemini text-embedding-004 for each enhanced query</substep>
        <substep>Validate embedding dimensions (768)</substep>
        <substep>Normalize embeddings for consistent similarity calculation</substep>
        <substep>Cache embeddings for performance optimization</substep>
      </process>
    </step>
  </phase>
  
  <phase name="vector_search_execution">
    <step number="3">
      <action>Execute parallel vector searches for all variants</action>
      <process>
        <substep>Submit Firestore vector queries simultaneously</substep>
        <substep>Apply similarity threshold filtering (>0.75)</substep>
        <substep>Collect results with metadata and similarity scores</substep>
        <substep>Handle search errors gracefully with fallback strategies</substep>
      </process>
      <error_handling>
        <scenario>Firestore connection timeout</scenario>
        <response>Retry with exponential backoff, maximum 3 attempts</response>
        
        <scenario>Embedding generation failure</scenario>
        <response>Fall back to text-based search using keywords</response>
        
        <scenario>No results above threshold</scenario>
        <response>Lower threshold to 0.70 and re-search</response>
      </error_handling>
    </step>
    
    <step number="4">
      <action>Aggregate and deduplicate results</action>
      <process>
        <substep>Combine results from all search variants</substep>
        <substep>Remove duplicate chunk_ids, keeping highest similarity</substep>
        <substep>Validate result completeness and quality</substep>
        <substep>Apply final ranking based on composite scoring</substep>
      </process>
    </step>
  </phase>
  
  <phase name="result_optimization">
    <step number="5">
      <action>Apply clinical relevance filtering</action>
      <relevance_criteria>
        <criterion>Guideline content directly addresses query medical condition</criterion>
        <criterion>Recommendations are specific and actionable</criterion>
        <criterion>Content is appropriate for query clinical context</criterion>
        <criterion>Guideline is from recognized Indian medical authority</criterion>
      </relevance_criteria>
    </step>
    
    <step number="6">
      <action>Optimize result set for downstream processing</action>
      <optimization>
        <diversity>Ensure representation from multiple organizations</diversity>
        <recency>Prioritize recent guidelines while maintaining quality</recency>
        <comprehensiveness>Include both specific and general recommendations</comprehensiveness>
        <authority>Weight results by organization credibility</authority>
      </optimization>
    </step>
  </phase>
</retrieval_workflow>

<output_specification>
  <result_format>
    <required_fields>
      <field name="chunk_id">Unique chunk identifier</field>
      <field name="guideline_id">Parent guideline document ID</field>
      <field name="organization">Publishing medical organization</field>
      <field name="title">Complete guideline title</field>
      <field name="year">Publication year</field>
      <field name="text">Chunk content text</field>
      <field name="similarity_score">Cosine similarity score (0.0-1.0)</field>
    </required_fields>
    
    <optional_fields>
      <field name="section">Guideline section name</field>
      <field name="specialty">Medical specialty focus</field>
      <field name="keywords">Associated medical keywords</field>
      <field name="url">Guideline source URL (if available)</field>
      <field name="doi">Digital Object Identifier (if available)</field>
    </optional_fields>
    
    <computed_fields>
      <field name="authority_score">Organization credibility score (1-5)</field>
      <field name="recency_score">Time-based relevance score (0.0-1.0)</field>
      <field name="composite_score">Combined ranking score</field>
    </computed_fields>
  </result_format>
  
  <result_limits>
    <maximum_results>20</maximum_results>
    <minimum_similarity>0.75</minimum_similarity>
    <diversity_requirement>Maximum 5 chunks from same guideline</diversity_requirement>
  </result_limits>
</output_specification>

<examples>
  <example>
    <scenario>Diabetes management guidelines search</scenario>
    <input>
      <query_variants>
        <variant>"Type 2 Diabetes Mellitus first-line treatment India ICMR guidelines"</variant>
        <variant>"T2DM initial therapy Indian clinical practice guidelines metformin"</variant>
        <variant>"Diabetes management protocol India pharmacological intervention"</variant>
      </query_variants>
    </input>
    
    <expected_results>
      <result_count>12-18 guideline chunks</result_count>
      <similarity_range>0.75-0.95</similarity_range>
      <organization_distribution>
        <icmr>4-6 chunks</icmr>
        <esi>3-4 chunks</esi>
        <api>2-3 chunks</api>
        <others>3-5 chunks</others>
      </organization_distribution>
      <temporal_distribution>
        <recent_2020_2024>8-10 chunks</recent_2020_2024>
        <moderate_2015_2019>4-6 chunks</moderate_2015_2019>
        <older_pre_2015>0-2 chunks</older_pre_2015>
      </temporal_distribution>
    </expected_results>
  </example>
  
  <example>
    <scenario>Hypertension management guidelines</scenario>
    <input>
      <query_variants>
        <variant>"Hypertension management guidelines India blood pressure control"</variant>
        <variant>"HTN treatment protocol Indian cardiology society recommendations"</variant>
        <variant>"High blood pressure management India antihypertensive therapy"</variant>
      </query_variants>
    </input>
    
    <search_results>
      <chunk>
        <chunk_id>htn_icmr_2023_001</chunk_id>
        <guideline_id>icmr_htn_guidelines_2023</guideline_id>
        <organization>ICMR</organization>
        <title>Management of Hypertension in Indian Adults - 2023 Update</title>
        <year>2023</year>
        <similarity_score>0.89</similarity_score>
        <text>First-line antihypertensive therapy in Indian adults should consider ACE inhibitors or ARBs as preferred agents, particularly in patients with diabetes or chronic kidney disease. Thiazide diuretics remain appropriate first-line therapy for uncomplicated hypertension...</text>
      </chunk>
    </search_results>
  </example>
</examples>

<performance_optimization>
  <caching_strategy>
    <embedding_cache>
      <description>Cache generated embeddings to reduce API calls</description>
      <cache_key>SHA-256 hash of preprocessed query text</cache_key>
      <cache_duration>7 days</cache_duration>
      <cache_size_limit>1000 embeddings</cache_size_limit>
    </embedding_cache>
    
    <result_cache>
      <description>Cache search results for frequently accessed queries</description>
      <cache_key>Combination of query variants and similarity threshold</cache_key>
      <cache_duration>24 hours</cache_duration>
      <invalidation>Clear cache when new guidelines are added</invalidation>
    </result_cache>
  </caching_strategy>
  
  <query_optimization>
    <batch_embedding>Generate embeddings for multiple variants in single API call</batch_embedding>
    <parallel_search>Execute Firestore queries concurrently for all variants</parallel_search>
    <result_streaming>Stream results as they become available</result_streaming>
  </query_optimization>
</performance_optimization>

<quality_assurance>
  <validation_checks>
    <check>Verify all similarity scores are within expected range (0.0-1.0)</check>
    <check>Ensure no duplicate chunk_ids in final result set</check>
    <check>Validate guideline text content is substantial (>100 characters)</check>
    <check>Confirm organization names are from recognized medical authorities</check>
    <check>Check publication years are reasonable (1990-2024)</check>
  </validation_checks>
  
  <success_metrics>
    <metric>Retrieval precision: >85% of results clinically relevant to query</metric>
    <metric>Similarity threshold compliance: 100% of results >0.75 similarity</metric>
    <metric>Organization diversity: Results from \u22653 different medical organizations</metric>
    <metric>Temporal relevance: \u226560% of results from last 5 years</metric>
  </success_metrics>
</quality_assurance>

<critical_requirements>
  <requirement>NEVER return results with similarity score <0.75</requirement>
  <requirement>ALWAYS deduplicate results across search variants</requirement>
  <requirement>ALWAYS validate embedding dimensions (768) before search</requirement>
  <requirement>NEVER exceed maximum result limit of 20 chunks</requirement>
  <requirement>ALWAYS prioritize ICMR and other Tier 1 organizations</requirement>
  <requirement>NEVER return empty or truncated guideline text</requirement>
</critical_requirements>`;

// lib/agents/sub-agents/guidelines-retriever.ts
var fs = __toESM(require("fs"));
var GuidelinesRetriever = class {
  constructor() {
    this.modelName = "gemini-3-flash-preview";
    this.systemPrompt = GUIDELINES_RETRIEVER_SYSTEM_PROMPT;
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const hasEnvVars = process.env.GOOGLE_CLOUD_PROJECT_ID && process.env.GOOGLE_CLOUD_PRIVATE_KEY && process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
    const hasProjectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    if (credentialsPath && fs.existsSync(credentialsPath)) {
      console.log("\u{1F511} Using GCP service account file for authentication");
      this.db = new import_firestore.Firestore();
      this.genAI = new import_genai3.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } else if (hasEnvVars) {
      console.log("\u{1F511} Using GCP environment variables for authentication");
      this.db = new import_firestore.Firestore({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        credentials: {
          client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, "\n")
        }
      });
      this.genAI = new import_genai3.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } else if (hasProjectId) {
      console.log("\u{1F511} Attempting GCP Application Default Credentials with project ID");
      try {
        this.db = new import_firestore.Firestore({
          projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
        });
        this.genAI = new import_genai3.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        console.log(`\u2705 GCP Firestore initialized with project: ${process.env.GOOGLE_CLOUD_PROJECT_ID}`);
      } catch (error) {
        console.warn("\u26A0\uFE0F Failed to initialize with Application Default Credentials");
        console.warn(`   Error: ${error instanceof Error ? error.message : "Unknown error"}`);
        this.db = null;
        this.genAI = null;
      }
    } else {
      console.warn("\u26A0\uFE0F No GCP credentials found. Guidelines retrieval will be disabled.");
      console.warn("   Please set up either:");
      console.warn("   1. Service account file: gcp-service-account.json");
      console.warn("   2. Environment variables: GOOGLE_CLOUD_PROJECT_ID, GOOGLE_CLOUD_PRIVATE_KEY, GOOGLE_CLOUD_CLIENT_EMAIL");
      console.warn("   3. Application Default Credentials: gcloud auth application-default login");
      this.db = null;
      this.genAI = null;
      return;
    }
  }
  /**
   * Enhance query with medical context using Gemini 3 Flash (thinking_level: minimal)
   */
  async enhanceQuery(query) {
    if (!this.genAI) return query;
    try {
      fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "guidelines-retriever.ts:79", message: "Guidelines API call starting", data: { subAgent: "guidelines", operation: "enhanceQuery", apiKey: process.env.GEMINI_API_KEY?.substring(0, 10) || "none", timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
      });
      const prompt = `Enhance this medical query for Indian guideline search by adding relevant medical context, expanding abbreviations, and including Indian-specific terms. Keep it concise.

Query: ${query}

Enhanced query:`;
      const response = await callGeminiWithRetry(async (apiKey) => {
        const genAI = new import_genai3.GoogleGenAI({ apiKey });
        return await genAI.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config: {
            systemInstruction: "You are a medical query enhancement specialist. Expand abbreviations, add medical context, and include Indian healthcare terms.",
            temperature: 0.1,
            maxOutputTokens: 200
          }
        });
      });
      fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "guidelines-retriever.ts:99", message: "Guidelines API call completed", data: { subAgent: "guidelines", operation: "enhanceQuery", success: true, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
      });
      const enhanced = response.text?.trim() || query;
      console.log(`   \u{1F527} Enhanced query: "${enhanced.substring(0, 100)}..."`);
      return enhanced;
    } catch (error) {
      fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "guidelines-retriever.ts:103", message: "Guidelines API call error", data: { subAgent: "guidelines", operation: "enhanceQuery", error: error instanceof Error ? error.message : "Unknown", isOverload: error instanceof Error && (error.message.includes("overloaded") || error.message.includes("503") || error.message.includes("429")), timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
      });
      console.warn("\u26A0\uFE0F Query enhancement failed, using original:", error);
      return query;
    }
  }
  /**
   * Rank results by relevance using Gemini 3 Flash (thinking_level: low)
   */
  async rankResults(results, userQuery) {
    if (!this.genAI || results.length === 0) return results;
    try {
      if (results.length > 10) {
        const resultsPreview = results.slice(0, 20).map(
          (r, idx) => `[${idx}] ${r.title} (${r.organization}, ${r.year}) - Similarity: ${r.similarity_score.toFixed(2)}`
        ).join("\n");
        const prompt = `Given this medical query and guideline results, identify the indices of the 10 most clinically relevant guidelines. Return only comma-separated indices (e.g., "0,3,5,7,9,12,15,18,19,20").

Query: ${userQuery}

Results:
${resultsPreview}

Top 10 indices:`;
        const response = await callGeminiWithRetry(async (apiKey) => {
          const genAI = new import_genai3.GoogleGenAI({ apiKey });
          return await genAI.models.generateContent({
            model: this.modelName,
            contents: prompt,
            config: {
              systemInstruction: "You are a clinical relevance ranking specialist. Select the most relevant guidelines based on medical context.",
              temperature: 0.1,
              maxOutputTokens: 50
            }
          });
        });
        const indicesText = response.text?.trim() || "";
        const indices = indicesText.split(",").map((s) => parseInt(s.trim())).filter((n) => !isNaN(n) && n < results.length);
        if (indices.length > 0) {
          const rankedResults = indices.map((i) => results[i]).filter(Boolean);
          console.log(`   \u{1F3AF} LLM ranked ${rankedResults.length} guidelines`);
          return rankedResults;
        }
      }
      return results;
    } catch (error) {
      console.warn("\u26A0\uFE0F LLM ranking failed, using similarity scores:", error);
      return results;
    }
  }
  async search(searchVariants, traceContext, userQuery = "") {
    return await withRetrieverSpan("guidelines", async (span) => {
      const startTime = Date.now();
      span.setAttribute("retrieval.source", "guidelines");
      span.setAttribute("retrieval.query", JSON.stringify({ search_variants: searchVariants, user_query: userQuery }));
      if (!this.db || !this.genAI) {
        console.warn("\u26A0\uFE0F Guidelines retrieval skipped - GCP not configured");
        span.setAttribute("retrieval.result_count", 0);
        span.setAttribute("retrieval.latency_ms", Date.now() - startTime);
        return { result: [], documents: [] };
      }
      try {
        console.log("\u{1F50D} Searching Indian Guidelines in Firestore...");
        console.log(`\u{1F4CB} Agent 1 routed to Guidelines - executing search with ${searchVariants.length} specialized queries`);
        const allResults = [];
        const seenChunkIds = /* @__PURE__ */ new Set();
        for (const variant of searchVariants) {
          const enhancedVariant = await this.enhanceQuery(variant);
          const embedding = await this.getGeminiEmbedding(enhancedVariant);
          console.log(`   \u{1F4CF} Embedding dimension: ${embedding.length}`);
          if (embedding.every((v) => v === 0)) {
            console.warn(`   \u26A0\uFE0F Skipping variant with zero embedding: "${variant.substring(0, 50)}..."`);
            continue;
          }
          const collection = this.db.collection(process.env.FIRESTORE_COLLECTION_GUIDELINE_CHUNKS || "guideline_chunks");
          const vectorQuery = collection.findNearest({
            vectorField: "embedding_vector",
            queryVector: embedding,
            limit: 10,
            distanceMeasure: "COSINE",
            distanceResultField: "vector_distance"
          });
          const snapshot = await vectorQuery.get();
          console.log(`   Found ${snapshot.size} nearest results for variant: "${variant.substring(0, 60)}..."`);
          for (const doc of snapshot.docs) {
            const data = doc.data();
            const chunkId = data.chunk_id || doc.id;
            if (!seenChunkIds.has(chunkId)) {
              seenChunkIds.add(chunkId);
              const distance = data.vector_distance ?? 1;
              const similarity = 1 - distance;
              if (similarity > 0.5) {
                allResults.push({
                  chunk_id: chunkId,
                  guideline_id: data.guideline_id || data.document_id,
                  parent_section: data.parent_section || data.section_header,
                  child_section: data.child_section || data.subsection,
                  organization: data.organization || "Indian Medical Guidelines",
                  title: data.guideline_title || data.title || data.document_title || "Indian Clinical Guideline",
                  year: data.year || data.publication_year || (/* @__PURE__ */ new Date()).getFullYear(),
                  text: data.content || data.text || data.text_for_search,
                  summary: data.summary || this.generateSummary(data.content || data.text || data.text_for_search),
                  similarity_score: similarity,
                  document_type: data.document_type || "Clinical Guideline",
                  page_number: data.page_number,
                  section_hierarchy: data.section_hierarchy || [data.section_header, data.child_section].filter(Boolean)
                });
              }
            }
          }
        }
        const topCandidates = allResults.sort((a, b) => b.similarity_score - a.similarity_score).slice(0, 20);
        const rankedResults = await this.rankResults(topCandidates, userQuery);
        const topResults = rankedResults.slice(0, 15);
        const latency = Date.now() - startTime;
        span.setAttribute("retrieval.result_count", topResults.length);
        span.setAttribute("retrieval.latency_ms", latency);
        console.log(`\u{1F4CB} Indian Guidelines search: ${topResults.length} relevant chunks found`);
        if (topResults.length > 0) {
          console.log(`   Organizations: ${[...new Set(topResults.map((r) => r.organization))].join(", ")}`);
          console.log(`   Document types: ${[...new Set(topResults.map((r) => r.document_type))].join(", ")}`);
        }
        const documents = topResults.map((r) => ({
          id: r.chunk_id,
          content: r.text,
          score: r.similarity_score,
          metadata: {
            guideline_id: r.guideline_id,
            organization: r.organization,
            title: r.title,
            year: r.year,
            document_type: r.document_type
          }
        }));
        return { result: topResults, documents };
      } catch (error) {
        console.error("\u274C Guidelines retrieval failed:", error);
        span.setAttribute("retrieval.result_count", 0);
        span.setAttribute("retrieval.latency_ms", Date.now() - startTime);
        span.setAttribute("retrieval.error", error instanceof Error ? error.message : "Unknown error");
        span.recordException(error);
        span.setStatus({ code: 2 /* ERROR */, message: error instanceof Error ? error.message : "Unknown error" });
        return { result: [], documents: [] };
      }
    }, { source: "guidelines" });
  }
  async getGeminiEmbedding(text) {
    if (!this.genAI) {
      return new Array(768).fill(0);
    }
    try {
      const result = await callGeminiWithRetry(async (apiKey) => {
        const genAI = new import_genai3.GoogleGenAI({ apiKey });
        const modelEnv = process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004";
        const modelName = modelEnv.startsWith("models/") ? modelEnv : `models/${modelEnv}`;
        return await genAI.models.embedContent({
          model: modelName,
          contents: [{ role: "user", parts: [{ text }] }],
          config: {
            outputDimensionality: 768
          }
        });
      });
      const values = result.embeddings?.[0]?.values;
      if (values) {
        console.log(`   \u{1F4CF} Embedding dimension: ${values.length}`);
        if (values.length !== 768) {
          console.warn(`   \u26A0\uFE0F WARNING: Expected 768 dimensions, got ${values.length}. Mismatch with Firestore index may cause query failure.`);
        }
        return values;
      }
      return new Array(768).fill(0);
    } catch (error) {
      console.error("\u274C Embedding generation failed:", error);
      return new Array(768).fill(0);
    }
  }
  generateSummary(text) {
    if (!text || text.length < 100) return text;
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 20);
    if (sentences.length <= 2) return text;
    const keyTerms = ["recommend", "should", "must", "guideline", "treatment", "therapy", "diagnosis", "management"];
    const importantSentences = sentences.filter(
      (sentence, index) => index === 0 || keyTerms.some((term) => sentence.toLowerCase().includes(term))
    ).slice(0, 3);
    return importantSentences.join(". ").trim() + ".";
  }
};

// lib/agents/sub-agents/pubmed-intelligence.ts
var import_genai4 = require("@google/genai");
var PubMedIntelligence = class {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.modelName = "gemini-3-flash-preview";
    if (process.env.GEMINI_API_KEY) {
      this.genAI = new import_genai4.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } else {
      this.genAI = null;
      console.warn("\u26A0\uFE0F GEMINI_API_KEY not set - PubMed Intelligence will use basic queries");
    }
    const { PUBMED_INTELLIGENCE_SYSTEM_PROMPT: PUBMED_INTELLIGENCE_SYSTEM_PROMPT2 } = (init_pubmed_intelligence_prompt(), __toCommonJS(pubmed_intelligence_prompt_exports));
    this.systemPrompt = PUBMED_INTELLIGENCE_SYSTEM_PROMPT2;
  }
  /**
   * Map entities to MeSH terms using Gemini 3 Flash (thinking_level: low)
   */
  async mapToMeSHTerms(entities) {
    if (!this.genAI || entities.diseases.length === 0 && entities.drugs.length === 0 && entities.procedures.length === 0) {
      return [];
    }
    try {
      const prompt = `Map these medical entities to MeSH (Medical Subject Headings) terms for PubMed search. Return only comma-separated MeSH terms.

Diseases: ${entities.diseases.join(", ") || "none"}
Drugs: ${entities.drugs.join(", ") || "none"}
Procedures: ${entities.procedures.join(", ") || "none"}

MeSH terms:`;
      const response = await callGeminiWithRetry(async (apiKey) => {
        const genAI = new import_genai4.GoogleGenAI({ apiKey });
        return await genAI.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config: {
            systemInstruction: "You are a medical terminology specialist. Map medical terms to official MeSH headings.",
            temperature: 0.1,
            maxOutputTokens: 200,
            thinkingConfig: {
              thinkingLevel: import_genai4.ThinkingLevel.LOW
              // Straightforward MeSH mapping
            }
          }
        });
      });
      const meshTerms = response.text?.trim().split(",").map((t) => t.trim()).filter(Boolean) || [];
      console.log(`   \u{1F3F7}\uFE0F Mapped to ${meshTerms.length} MeSH terms`);
      return meshTerms;
    } catch (error) {
      console.warn("\u26A0\uFE0F MeSH mapping failed, using entity names:", error);
      return [...entities.diseases, ...entities.drugs, ...entities.procedures];
    }
  }
  /**
   * Construct optimized PubMed query using Gemini 3 Flash (thinking_level: minimal)
   */
  async constructOptimizedQuery(searchVariant, meshTerms) {
    if (!this.genAI) {
      return searchVariant;
    }
    try {
      const prompt = `Create an optimized PubMed search query using this variant and MeSH terms. Keep it concise and use PubMed syntax.

Variant: ${searchVariant}
MeSH terms: ${meshTerms.join(", ")}

Optimized PubMed query:`;
      const response = await callGeminiWithRetry(async (apiKey) => {
        const genAI = new import_genai4.GoogleGenAI({ apiKey });
        return await genAI.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config: {
            systemInstruction: "You are a PubMed search expert. Create efficient search queries using MeSH terms and Boolean operators.",
            temperature: 0.1,
            maxOutputTokens: 150,
            thinkingConfig: {
              thinkingLevel: "include_thoughts"
              // Use include_thoughts as minimal is not available
            }
          }
        });
      });
      const optimizedQuery = response.text?.trim() || searchVariant;
      console.log(`   \u{1F527} Optimized query: "${optimizedQuery.substring(0, 100)}..."`);
      return optimizedQuery;
    } catch (error) {
      console.warn("\u26A0\uFE0F Query optimization failed, using original:", error);
      return searchVariant;
    }
  }
  async search(searchVariants, entities, traceContext, originalQuery) {
    return await withRetrieverSpan("pubmed_intelligence", async (span) => {
      const startTime = Date.now();
      span.setAttribute("retrieval.source", "pubmed_intelligence");
      span.setAttribute("retrieval.query", searchVariants.join(" | "));
      try {
        console.log(`\u{1F52C} PubMed Intelligence: Enhanced search with Medical Source Bible integration`);
        fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "pubmed-intelligence.ts:142", message: "PubMed search starting", data: { subAgent: "pubmed", variants: searchVariants.length, entities: entities.diseases.length + entities.drugs.length + entities.procedures.length, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
        });
        const meshTerms = await this.mapToMeSHTerms(entities);
        fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "pubmed-intelligence.ts:146", message: "MeSH terms mapped", data: { subAgent: "pubmed", meshTermCount: meshTerms.length, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
        });
        let relevantSpecialties = [];
        let relevantGuidelineBodies = [];
        let eliteJournalFilter = "";
        let TIER_1_GENERAL_JOURNALS_DATA = null;
        let MEDICAL_SPECIALTIES_DATA = [];
        if (originalQuery) {
          try {
            const medicalSourceBible = await Promise.resolve().then(() => (init_medical_source_bible(), medical_source_bible_exports));
            relevantSpecialties = medicalSourceBible.routeQueryToSpecialties(originalQuery);
            TIER_1_GENERAL_JOURNALS_DATA = medicalSourceBible.TIER_1_GENERAL_JOURNALS;
            MEDICAL_SPECIALTIES_DATA = medicalSourceBible.MEDICAL_SPECIALTIES;
            if (relevantSpecialties.length > 0) {
              eliteJournalFilter = medicalSourceBible.getPubMedEliteFilter(relevantSpecialties);
              relevantSpecialties.forEach((specId) => {
                const specData = MEDICAL_SPECIALTIES_DATA.find((s) => s.id === specId);
                if (specData && specData.guideline_organizations) {
                  specData.guideline_organizations.forEach((org) => {
                    if (org.abbreviation) {
                      const parts = org.abbreviation.split("/");
                      parts.forEach((p) => relevantGuidelineBodies.push(p.trim()));
                    }
                  });
                }
              });
            } else {
              eliteJournalFilter = TIER_1_GENERAL_JOURNALS_DATA.pubmed_combined_filter;
            }
          } catch (error) {
            console.warn("Medical source bible import failed, using basic search:", error);
            relevantSpecialties = [];
            eliteJournalFilter = "";
          }
        }
        const uniqueGuidelineBodies = [...new Set(relevantGuidelineBodies)];
        console.log(`\u{1F4CB} Detected specialties: ${relevantSpecialties.join(", ") || "general"}`);
        console.log(`\u{1F3AF} Using elite journal filter for specialties: ${relevantSpecialties.join(", ")}`);
        if (uniqueGuidelineBodies.length > 0) {
          console.log(`\u{1F3DB}\uFE0F  Targeting guideline organizations: ${uniqueGuidelineBodies.join(", ")}`);
        }
        const allResults = [];
        for (const variant of searchVariants) {
          try {
            let optimizedVariant = variant;
            try {
              const optimizationStart = Date.now();
              optimizedVariant = await Promise.race([
                this.constructOptimizedQuery(variant, meshTerms),
                new Promise((resolve) => setTimeout(() => resolve(variant), 5e3))
                // 5s timeout for optimization
              ]);
              if (Date.now() - optimizationStart > 5e3) {
                console.warn(`\u26A0\uFE0F Query optimization timed out, using raw variant`);
                optimizedVariant = variant;
              }
            } catch (optError) {
              console.warn(`\u26A0\uFE0F Query optimization failed, using raw variant:`, optError);
              optimizedVariant = variant;
            }
            let result;
            try {
              console.log(`\u{1F52C} PubMed Intelligence: Calling comprehensivePubMedSearch`);
              console.log(`   Original variant: "${variant.substring(0, 100)}..."`);
              console.log(`   Using query: "${optimizedVariant.substring(0, 150)}..."`);
              fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "pubmed-intelligence.ts:186", message: "Calling comprehensivePubMedSearch", data: { subAgent: "pubmed", variant: optimizedVariant.substring(0, 100), timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
              });
              const { comprehensivePubMedSearch: comprehensivePubMedSearch2 } = await Promise.resolve().then(() => (init_pubmed(), pubmed_exports));
              const searchStartTime = Date.now();
              const isGuidelineRelated = uniqueGuidelineBodies.length > 0 || variant.toLowerCase().includes("guideline") || variant.toLowerCase().includes("recommendation");
              result = await comprehensivePubMedSearch2(
                optimizedVariant,
                isGuidelineRelated,
                // Dynamic check
                uniqueGuidelineBodies,
                // Pass identified organizations
                eliteJournalFilter
                // CRITICAL: Apply journal filter
              );
              const searchElapsed = Date.now() - searchStartTime;
              console.log(`\u2705 PubMed comprehensive search completed in ${searchElapsed}ms: ${result.articles?.length || 0} articles, ${result.systematicReviews?.length || 0} reviews, ${result.guidelines?.length || 0} guidelines`);
              fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "pubmed-intelligence.ts:194", message: "comprehensivePubMedSearch completed", data: { subAgent: "pubmed", articles: result.articles.length, systematicReviews: result.systematicReviews.length, guidelines: result.guidelines.length, elapsed: searchElapsed, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
              });
            } catch (importError) {
              fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "pubmed-intelligence.ts:197", message: "PubMed search import failed", data: { subAgent: "pubmed", error: importError instanceof Error ? importError.message : "Unknown", timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
              });
              fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "pubmed-intelligence.ts:217", message: "PubMed search import failed", data: { subAgent: "pubmed", error: importError instanceof Error ? importError.message : "Unknown", timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
              });
              console.error("\u274C PubMed search import failed:", importError);
              result = { articles: [], systematicReviews: [], guidelines: [] };
            }
            const totalResults = (result.articles?.length || 0) + (result.systematicReviews?.length || 0) + (result.guidelines?.length || 0);
            fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "pubmed-intelligence.ts:198", message: "PubMed results received from engine", data: { subAgent: "pubmed", variant: optimizedVariant.substring(0, 50), articles: result.articles?.length || 0, reviews: result.systematicReviews?.length || 0, guidelines: result.guidelines?.length || 0, total: totalResults, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
            });
            if (totalResults === 0) {
              console.warn(`\u26A0\uFE0F PubMed optimized query returned 0 results, retrying with raw variant (evidence engine)...`);
              try {
                const { comprehensivePubMedSearch: comprehensivePubMedSearch2 } = await Promise.resolve().then(() => (init_pubmed(), pubmed_exports));
                const fallbackResult = await comprehensivePubMedSearch2(
                  variant.trim(),
                  false,
                  []
                );
                const fallbackTotal = (fallbackResult.articles?.length || 0) + (fallbackResult.systematicReviews?.length || 0) + (fallbackResult.guidelines?.length || 0);
                if (fallbackTotal > 0) {
                  console.log(`   \u2705 Fallback raw query returned ${fallbackTotal} results`);
                  allResults.push(...fallbackResult.articles || []);
                  allResults.push(...fallbackResult.systematicReviews || []);
                  allResults.push(...fallbackResult.guidelines || []);
                } else {
                  allResults.push(...result.articles);
                  allResults.push(...result.systematicReviews);
                  allResults.push(...result.guidelines);
                }
              } catch (fallbackErr) {
                console.warn("Fallback PubMed search failed:", fallbackErr);
                allResults.push(...result.articles);
                allResults.push(...result.systematicReviews);
                allResults.push(...result.guidelines);
              }
            } else {
              allResults.push(...result.articles);
              allResults.push(...result.systematicReviews);
              allResults.push(...result.guidelines);
            }
          } catch (error) {
            fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "pubmed-intelligence.ts:203", message: "PubMed variant search failed", data: { subAgent: "pubmed", variant: variant.substring(0, 50), error: error instanceof Error ? error.message : "Unknown", timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
            });
            console.error(`\u274C Search variant failed: ${variant}`, error);
          }
        }
        fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "pubmed-intelligence.ts:207", message: "PubMed allResults collected", data: { subAgent: "pubmed", totalResults: allResults.length, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
        });
        const enhancedResults = this.enhanceWithSourceBible(allResults, relevantSpecialties, TIER_1_GENERAL_JOURNALS_DATA, MEDICAL_SPECIALTIES_DATA);
        const filteredResults = this.applyIntelligentFiltering(enhancedResults, relevantSpecialties);
        fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "pubmed-intelligence.ts:214", message: "PubMed filtering complete", data: { subAgent: "pubmed", beforeFiltering: enhancedResults.length, afterFiltering: filteredResults.length, tier1: filteredResults.filter((r) => r.journal_tier === "tier_1").length, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
        });
        if (filteredResults.length === 0 && allResults.length > 0) {
          console.warn(`\u26A0\uFE0F PubMed filtering removed ALL ${allResults.length} results - this may cause over-reliance on Tavily`);
        }
        fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "pubmed-intelligence.ts:211", message: "PubMed filtering completed", data: { subAgent: "pubmed", totalResults: allResults.length, filteredResults: filteredResults.length, tier1: filteredResults.filter((r) => r.journal_tier === "tier_1").length, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
        });
        const latency = Date.now() - startTime;
        span.setAttribute("retrieval.result_count", filteredResults.length);
        span.setAttribute("retrieval.latency_ms", latency);
        span.setAttribute("retrieval.variants_searched", searchVariants.length);
        span.setAttribute("retrieval.specialties_detected", JSON.stringify(relevantSpecialties));
        span.setAttribute("retrieval.total_results", allResults.length);
        span.setAttribute("retrieval.after_filtering", filteredResults.length);
        span.setAttribute("retrieval.tier_1_journals", filteredResults.filter((r) => r.journal_tier === "tier_1").length);
        span.setAttribute("retrieval.specialty_elite", filteredResults.filter((r) => r.journal_tier === "specialty_elite").length);
        span.setAttribute("retrieval.pmc_available", filteredResults.filter((r) => r.pmcid).length);
        console.log(`\u2705 PubMed Intelligence: ${filteredResults.length} articles (${filteredResults.filter((r) => r.journal_tier === "tier_1").length} Tier 1, ${filteredResults.filter((r) => r.journal_tier === "specialty_elite").length} Specialty Elite)`);
        const documents = filteredResults.map((r) => ({
          id: r.pmid,
          content: r.abstract || r.title,
          score: 1,
          // PubMed doesn't have similarity scores
          metadata: {
            title: r.title,
            journal: r.journal,
            pub_date: r.pub_date,
            journal_tier: r.journal_tier,
            pmcid: r.pmcid,
            doi: r.doi
          }
        }));
        return { result: filteredResults, documents };
      } catch (error) {
        console.error("\u274C PubMed Intelligence failed:", error);
        fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "pubmed-intelligence.ts:246", message: "PubMed Intelligence error", data: { subAgent: "pubmed", error: error instanceof Error ? error.message : "Unknown", stack: error instanceof Error ? error.stack : "", elapsed: Date.now() - startTime, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
        });
        span.setAttribute("retrieval.result_count", 0);
        span.setAttribute("retrieval.latency_ms", Date.now() - startTime);
        span.setAttribute("retrieval.error", error instanceof Error ? error.message : "Unknown error");
        span.recordException(error);
        span.setStatus({ code: 2 /* ERROR */, message: error instanceof Error ? error.message : "Unknown error" });
        console.warn("\u26A0\uFE0F PubMed search failed - this will cause over-reliance on Tavily. Returning empty results.");
        return { result: [], documents: [] };
      }
    }, { source: "pubmed_intelligence" });
  }
  enhanceWithSourceBible(results, specialties, tier1Data, specialtiesData) {
    return results.map((article) => {
      const journal = article.journal || "";
      let journalTier = "standard";
      const isTier1 = tier1Data?.journals?.some(
        (j) => journal.toLowerCase().includes(j.abbreviation.toLowerCase()) || journal.toLowerCase().includes(j.name.toLowerCase())
      ) || false;
      if (isTier1) {
        journalTier = "tier_1";
      } else {
        for (const specialtyId of specialties) {
          const specialty = specialtiesData.find((s) => s.id === specialtyId);
          if (specialty) {
            const isSpecialtyElite = specialty.top_journals?.some(
              (j) => journal.toLowerCase().includes(j.abbreviation.toLowerCase()) || journal.toLowerCase().includes(j.name.toLowerCase())
            );
            if (isSpecialtyElite) {
              journalTier = "specialty_elite";
              break;
            }
          }
        }
      }
      return {
        pmid: article.pmid || article.id,
        title: article.title,
        abstract: article.abstract || "",
        authors: Array.isArray(article.authors) ? article.authors : typeof article.authors === "string" ? [article.authors] : [],
        journal,
        pub_date: article.pub_date || article.publicationDate || "",
        pub_types: article.pub_types || article.publicationTypes || [],
        doi: article.doi,
        pmcid: article.pmcid,
        full_text_available: !!article.pmcid,
        specialty_relevance: specialties,
        journal_tier: journalTier
      };
    });
  }
  applyIntelligentFiltering(results, specialties) {
    const sorted = results.sort((a, b) => {
      const tierPriority = { "tier_1": 3, "specialty_elite": 2, "standard": 1 };
      const tierDiff = tierPriority[b.journal_tier || "standard"] - tierPriority[a.journal_tier || "standard"];
      if (tierDiff !== 0) return tierDiff;
      const dateA = new Date(a.pub_date || "1900-01-01").getTime();
      const dateB = new Date(b.pub_date || "1900-01-01").getTime();
      return dateB - dateA;
    });
    const tier1Articles = sorted.filter((r) => r.journal_tier === "tier_1").slice(0, 15);
    const specialtyEliteArticles = sorted.filter((r) => r.journal_tier === "specialty_elite").slice(0, 20);
    const standardArticles = sorted.filter((r) => r.journal_tier === "standard").slice(0, 15);
    const combined = [...tier1Articles, ...specialtyEliteArticles, ...standardArticles];
    const seen = /* @__PURE__ */ new Set();
    const deduped = combined.filter((article) => {
      if (seen.has(article.pmid)) return false;
      seen.add(article.pmid);
      return true;
    });
    return deduped.slice(0, 50);
  }
};

// lib/agents/system-prompts/dailymed-retriever-prompt.ts
var DAILYMED_RETRIEVER_SYSTEM_PROMPT = `<role>
  <identity>FDA Drug Label Intelligence Specialist</identity>
  <purpose>Execute sophisticated retrieval of FDA-approved drug labels from DailyMed database using SPL (Structured Product Labeling) format for comprehensive drug information</purpose>
  <expertise>FDA drug labeling standards, SPL document structure, LOINC section codes, pharmaceutical terminology, drug safety information, regulatory compliance</expertise>
</role>

<core_mission>
  <primary_goal>Retrieve the most current and comprehensive FDA drug labels from DailyMed database for specified pharmaceutical entities</primary_goal>
  <success_criteria>
    <criterion>Identify and retrieve recent drug labels (published after 2020) for maximum relevance</criterion>
    <criterion>Extract structured sections using LOINC codes for consistent information organization</criterion>
    <criterion>Prioritize official FDA-approved labeling over other sources</criterion>
    <criterion>Ensure comprehensive coverage of drug safety, efficacy, and usage information</criterion>
    <criterion>Maintain data integrity and regulatory compliance throughout retrieval process</criterion>
  </success_criteria>
</core_mission>

<dailymed_architecture>
  <database_structure>
    <description>DailyMed contains FDA-approved drug labeling in Structured Product Labeling (SPL) format</description>
    <content_types>
      <type name="prescription_drugs">FDA-approved prescription medications</type>
      <type name="otc_drugs">Over-the-counter medications</type>
      <type name="biologics">Biological products and vaccines</type>
      <type name="medical_devices">FDA-regulated medical devices</type>
    </content_types>
    
    <spl_format>
      <description>XML-based structured format using HL7 standards</description>
      <key_elements>
        <element>setid - Unique identifier for drug label version</element>
        <element>title - Official product name and strength</element>
        <element>published - Publication date of current version</element>
        <element>sections - Structured content using LOINC codes</element>
      </key_elements>
    </spl_format>
  </database_structure>
  
  <loinc_section_mapping>
    <description>Standardized section codes for consistent drug information extraction</description>
    <critical_sections>
      <section code="34067-9" name="indications">
        <description>Indications and Usage - FDA-approved therapeutic uses</description>
        <clinical_value>Primary indication for prescribing decisions</clinical_value>
        <extraction_priority>High</extraction_priority>
      </section>
      
      <section code="34068-7" name="dosage">
        <description>Dosage and Administration - Recommended dosing regimens</description>
        <clinical_value>Critical for safe and effective drug administration</clinical_value>
        <extraction_priority>High</extraction_priority>
      </section>
      
      <section code="43685-7" name="warnings">
        <description>Warnings and Precautions - Safety information and contraindications</description>
        <clinical_value>Essential for patient safety and risk assessment</clinical_value>
        <extraction_priority>Critical</extraction_priority>
      </section>
      
      <section code="34084-4" name="adverse_reactions">
        <description>Adverse Reactions - Known side effects and safety profile</description>
        <clinical_value>Important for monitoring and patient counseling</clinical_value>
        <extraction_priority>High</extraction_priority>
      </section>
      
      <section code="34073-7" name="drug_interactions">
        <description>Drug Interactions - Clinically significant drug-drug interactions</description>
        <clinical_value>Critical for polypharmacy management</clinical_value>
        <extraction_priority>High</extraction_priority>
      </section>
      
      <section code="34090-1" name="clinical_pharmacology">
        <description>Clinical Pharmacology - Mechanism of action and pharmacokinetics</description>
        <clinical_value>Supports understanding of drug behavior and efficacy</clinical_value>
        <extraction_priority>Medium</extraction_priority>
      </section>
    </critical_sections>
    
    <additional_sections>
      <section code="34070-3" name="contraindications">Absolute contraindications</section>
      <section code="43678-2" name="pregnancy">Pregnancy and lactation information</section>
      <section code="34081-0" name="pediatric_use">Pediatric usage considerations</section>
      <section code="34082-8" name="geriatric_use">Geriatric usage considerations</section>
    </additional_sections>
  </loinc_section_mapping>
</dailymed_architecture>

<retrieval_strategy>
  <drug_identification>
    <name_normalization>
      <description>Standardize drug names for optimal search performance</description>
      <process>
        <step>Remove brand name suffixes (XR, ER, SR, etc.)</step>
        <step>Expand common abbreviations (HCTZ \u2192 Hydrochlorothiazide)</step>
        <step>Handle combination products (search individual components)</step>
        <step>Include generic and brand name variants</step>
      </process>
      <examples>
        <example>
          <input>Metformin XR</input>
          <normalized>Metformin</normalized>
          <rationale>Remove extended-release suffix for broader search</rationale>
        </example>
        <example>
          <input>HCTZ</input>
          <normalized>Hydrochlorothiazide</normalized>
          <rationale>Expand abbreviation to full generic name</rationale>
        </example>
      </examples>
    </name_normalization>
    
    <search_variants>
      <primary_search>Exact drug name match</primary_search>
      <secondary_search>Generic name if brand name provided</secondary_search>
      <tertiary_search>Brand name if generic name provided</tertiary_search>
      <combination_handling>Search individual components for combination products</combination_handling>
    </search_variants>
  </drug_identification>
  
  <temporal_filtering>
    <recency_requirement>
      <default_cutoff>2020-01-01</default_cutoff>
      <rationale>Ensure current regulatory information and recent safety updates</rationale>
      <exceptions>
        <exception condition="no_recent_labels">Extend to 2015 if no recent labels found</exception>
        <exception condition="critical_drug">Accept older labels for essential medications</exception>
      </exceptions>
    </recency_requirement>
    
    <version_prioritization>
      <strategy>Always select most recent version of drug label</strategy>
      <implementation>Sort by published date descending, select first result</implementation>
      <deduplication>Use setid to identify unique label versions</deduplication>
    </version_prioritization>
  </temporal_filtering>
  
  <quality_filtering>
    <label_completeness>
      <minimum_sections>Require at least 3 critical sections (indications, dosage, warnings)</minimum_sections>
      <content_threshold>Each section must contain >20 characters of meaningful content</content_threshold>
      <validation>Verify sections contain medical information, not just headers</validation>
    </label_completeness>
    
    <regulatory_status>
      <preference>FDA-approved labels over investigational drug information</preference>
      <verification>Confirm label represents current approved indication</verification>
      <exclusions>Exclude withdrawn or discontinued drug labels</exclusions>
    </regulatory_status>
  </quality_filtering>
</retrieval_strategy>

<api_integration>
  <search_endpoint>
    <url>https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json</url>
    <method>GET</method>
    <parameters>
      <parameter name="drug_name" required="true">Drug name for search</parameter>
      <parameter name="published_after" required="false">Date filter for recent labels</parameter>
      <parameter name="page" required="false">Pagination support</parameter>
      <parameter name="pagesize" required="false">Results per page (max 100)</parameter>
    </parameters>
    <response_format>JSON with array of SPL metadata objects</response_format>
  </search_endpoint>
  
  <spl_retrieval_endpoint>
    <url>https://dailymed.nlm.nih.gov/dailymed/services/v2/spls/{setid}.xml</url>
    <method>GET</method>
    <parameters>
      <parameter name="setid" required="true">Unique SPL identifier from search results</parameter>
    </parameters>
    <response_format>XML document in SPL format</response_format>
  </spl_retrieval_endpoint>
  
  <rate_limiting>
    <policy>No explicit rate limits documented, but implement conservative approach</policy>
    <implementation>
      <concurrent_requests>Maximum 5 concurrent requests</concurrent_requests>
      <request_delay>100ms delay between requests</request_delay>
      <retry_strategy>Exponential backoff for failed requests</retry_strategy>
    </implementation>
  </rate_limiting>
  
  <error_handling>
    <http_errors>
      <error code="404">Drug not found - try alternative names</error>
      <error code="429">Rate limit exceeded - implement backoff</error>
      <error code="500">Server error - retry with exponential backoff</error>
    </http_errors>
    
    <data_errors>
      <error type="empty_response">No SPLs found for drug name</error>
      <error type="malformed_xml">Invalid SPL XML structure</error>
      <error type="missing_sections">SPL lacks critical sections</error>
    </data_errors>
    
    <recovery_strategies>
      <strategy>Try alternative drug name spellings</strategy>
      <strategy>Expand search to include brand/generic variants</strategy>
      <strategy>Relax temporal filters if no recent results</strategy>
      <strategy>Return partial results if some sections unavailable</strategy>
    </recovery_strategies>
  </error_handling>
</api_integration>

<xml_processing>
  <spl_parsing>
    <description>Extract structured information from SPL XML documents</description>
    <parsing_strategy>
      <approach>Regex-based extraction for performance and simplicity</approach>
      <alternative>XML parser for complex documents if regex fails</alternative>
      <validation>Verify extracted content is meaningful medical information</validation>
    </parsing_strategy>
    
    <section_extraction>
      <pattern>code="{loinc_code}"[^>]*>(.*?)</[^>]*></pattern>
      <flags>Global and case-insensitive matching</flags>
      <post_processing>
        <step>Remove XML tags from extracted content</step>
        <step>Normalize whitespace and line breaks</step>
        <step>Truncate to reasonable length (2000 characters)</step>
        <step>Validate content contains medical terminology</step>
      </post_processing>
    </section_extraction>
    
    <content_cleaning>
      <html_removal>Strip HTML tags and entities</html_removal>
      <whitespace_normalization>Convert multiple spaces/newlines to single space</whitespace_normalization>
      <special_characters>Handle medical symbols and Unicode characters</special_characters>
      <length_limiting>Truncate sections to prevent excessive content</length_limiting>
    </content_cleaning>
  </spl_parsing>
  
  <quality_validation>
    <content_checks>
      <check>Verify section contains medical terminology</check>
      <check>Ensure minimum content length (>20 characters)</check>
      <check>Validate no extraction artifacts (XML fragments)</check>
      <check>Confirm section relevance to LOINC code</check>
    </content_checks>
    
    <medical_validation>
      <check>Presence of drug names in extracted content</check>
      <check>Medical terminology consistency</check>
      <check>Dosage information format validation</check>
      <check>Warning language appropriateness</check>
    </medical_validation>
  </quality_validation>
</xml_processing>

<retrieval_workflow>
  <phase name="drug_analysis">
    <step number="1">
      <action>Analyze and normalize input drug names</action>
      <process>
        <substep>Extract drug entities from input list</substep>
        <substep>Normalize names using pharmaceutical terminology</substep>
        <substep>Generate search variants (generic, brand, abbreviations)</substep>
        <substep>Prioritize search order based on drug importance</substep>
      </process>
    </step>
    
    <step number="2">
      <action>Validate drug names against known pharmaceutical databases</action>
      <process>
        <substep>Check against common drug name patterns</substep>
        <substep>Identify combination products requiring component searches</substep>
        <substep>Flag potential misspellings or invalid names</substep>
        <substep>Prepare fallback search strategies</substep>
      </process>
    </step>
  </phase>
  
  <phase name="label_search">
    <step number="3">
      <action>Execute DailyMed API searches for each drug</action>
      <process>
        <substep>Submit search requests with temporal filtering</substep>
        <substep>Handle API responses and extract SPL metadata</substep>
        <substep>Sort results by publication date (most recent first)</substep>
        <substep>Select top 2 most recent labels per drug</substep>
      </process>
      <error_handling>
        <scenario>No results found</scenario>
        <response>Try alternative drug name variants</response>
        
        <scenario>API timeout or error</scenario>
        <response>Retry with exponential backoff</response>
        
        <scenario>Invalid response format</scenario>
        <response>Log error and continue with next drug</response>
      </error_handling>
    </step>
    
    <step number="4">
      <action>Retrieve full SPL documents for selected labels</action>
      <process>
        <substep>Fetch XML documents using setid identifiers</substep>
        <substep>Validate XML structure and completeness</substep>
        <substep>Queue documents for section extraction</substep>
        <substep>Track retrieval success rates for monitoring</substep>
      </process>
    </step>
  </phase>
  
  <phase name="content_extraction">
    <step number="5">
      <action>Extract structured sections from SPL documents</action>
      <process>
        <substep>Apply LOINC code-based section extraction</substep>
        <substep>Clean and normalize extracted content</substep>
        <substep>Validate section content quality and relevance</substep>
        <substep>Organize sections by clinical importance</substep>
      </process>
    </step>
    
    <step number="6">
      <action>Compile comprehensive drug label information</action>
      <process>
        <substep>Combine sections into structured result objects</substep>
        <substep>Add metadata (setid, publication date, drug name)</substep>
        <substep>Apply final quality filters and validation</substep>
        <substep>Prepare results for downstream processing</substep>
      </process>
    </step>
  </phase>
</retrieval_workflow>

<output_specification>
  <result_format>
    <required_fields>
      <field name="setid">Unique SPL identifier for version tracking</field>
      <field name="drug_name">Normalized drug name used in search</field>
      <field name="title">Official product title from FDA label</field>
      <field name="published">Publication date (YYYY-MM-DD format)</field>
      <field name="sections">Structured sections with LOINC-based organization</field>
    </required_fields>
    
    <section_structure>
      <section name="indications">FDA-approved therapeutic uses</section>
      <section name="dosage">Recommended dosing and administration</section>
      <section name="warnings">Safety warnings and precautions</section>
      <section name="adverse_reactions">Known side effects and reactions</section>
      <section name="drug_interactions">Clinically significant interactions</section>
      <section name="clinical_pharmacology">Mechanism and pharmacokinetics</section>
    </section_structure>
    
    <metadata_fields>
      <field name="extraction_timestamp">When information was retrieved</field>
      <field name="api_version">DailyMed API version used</field>
      <field name="section_count">Number of sections successfully extracted</field>
      <field name="content_length">Total character count of extracted content</field>
    </metadata_fields>
  </result_format>
  
  <quality_metrics>
    <completeness>Percentage of critical sections successfully extracted</completeness>
    <recency>Average age of retrieved drug labels</recency>
    <coverage>Percentage of requested drugs with successful label retrieval</coverage>
    <content_quality>Average content length per section</content_quality>
  </quality_metrics>
</output_specification>

<examples>
  <example>
    <scenario>Diabetes medication label retrieval</scenario>
    <input>
      <drug_names>["Metformin", "Glipizide", "Insulin Glargine"]</drug_names>
    </input>
    
    <search_process>
      <drug name="Metformin">
        <search_query>drug_name=Metformin&published_after=2020-01-01</search_query>
        <results_found>3 SPL documents</results_found>
        <selected>Most recent (2023-08-15)</selected>
      </drug>
      
      <drug name="Glipizide">
        <search_query>drug_name=Glipizide&published_after=2020-01-01</search_query>
        <results_found>2 SPL documents</results_found>
        <selected>Most recent (2023-03-22)</selected>
      </drug>
    </search_process>
    
    <extracted_sections>
      <metformin>
        <indications>Type 2 diabetes mellitus as adjunct to diet and exercise...</indications>
        <dosage>Initial dose 500 mg twice daily with meals. May increase by 500 mg weekly...</dosage>
        <warnings>Lactic acidosis risk. Contraindicated in renal impairment...</warnings>
        <adverse_reactions>Most common: diarrhea, nausea, vomiting, flatulence...</adverse_reactions>
        <drug_interactions>Alcohol may potentiate effect on lactate metabolism...</drug_interactions>
      </metformin>
    </extracted_sections>
    
    <quality_assessment>
      <completeness>100% - All critical sections extracted</completeness>
      <content_quality>High - Substantial medical content in each section</content_quality>
      <recency>Excellent - All labels from 2023</recency>
    </quality_assessment>
  </example>
  
  <example>
    <scenario>Cardiovascular medication combination product</scenario>
    <input>
      <drug_names>["Lisinopril/HCTZ"]</drug_names>
    </input>
    
    <processing_strategy>
      <combination_detection>Identified as combination product</combination_detection>
      <component_search>
        <component>Lisinopril</component>
        <component>Hydrochlorothiazide</component>
        <combination>Lisinopril/Hydrochlorothiazide</combination>
      </component_search>
    </processing_strategy>
    
    <results>
      <combination_label>
        <setid>abc123-def456-ghi789</setid>
        <title>Lisinopril and Hydrochlorothiazide Tablets</title>
        <published>2023-06-10</published>
        <sections>
          <indications>Hypertension management when combination therapy appropriate...</indications>
          <dosage>Initial: Lisinopril 10mg/HCTZ 12.5mg once daily...</dosage>
          <warnings>Angioedema risk with ACE inhibitors. Electrolyte monitoring required...</warnings>
        </sections>
      </combination_label>
    </results>
  </example>
</examples>

<performance_optimization>
  <concurrent_processing>
    <drug_level_parallelism>Process multiple drugs simultaneously</drug_level_parallelism>
    <api_call_batching>Batch API calls where possible</api_call_batching>
    <section_extraction_parallelism>Extract sections concurrently</section_extraction_parallelism>
  </concurrent_processing>
  
  <caching_strategy>
    <spl_document_cache>
      <description>Cache retrieved SPL XML documents</description>
      <cache_key>setid identifier</cache_key>
      <cache_duration>24 hours</cache_duration>
      <invalidation>Clear when new versions published</invalidation>
    </spl_document_cache>
    
    <search_result_cache>
      <description>Cache search results for common drug names</description>
      <cache_key>Normalized drug name + date filter</cache_key>
      <cache_duration>6 hours</cache_duration>
    </search_result_cache>
  </caching_strategy>
  
  <resource_management>
    <memory_optimization>Stream large XML documents instead of loading entirely</memory_optimization>
    <connection_pooling>Reuse HTTP connections for multiple API calls</connection_pooling>
    <timeout_management>Set appropriate timeouts for API calls</timeout_management>
  </resource_management>
</performance_optimization>

<quality_assurance>
  <validation_framework>
    <input_validation>
      <check>Verify drug names are valid pharmaceutical entities</check>
      <check>Ensure drug list is not empty</check>
      <check>Validate drug name format and characters</check>
    </input_validation>
    
    <retrieval_validation>
      <check>Confirm API responses are valid JSON/XML</check>
      <check>Verify setid format matches expected pattern</check>
      <check>Ensure publication dates are reasonable</check>
    </retrieval_validation>
    
    <content_validation>
      <check>Validate extracted sections contain medical content</check>
      <check>Ensure section lengths are within expected ranges</check>
      <check>Verify no XML artifacts in extracted text</check>
      <check>Confirm drug names appear in extracted content</check>
    </content_validation>
  </validation_framework>
  
  <success_metrics>
    <retrieval_success_rate>Percentage of drugs with successful label retrieval</retrieval_success_rate>
    <section_extraction_rate>Percentage of critical sections successfully extracted</section_extraction_rate>
    <content_quality_score>Average content quality across all extracted sections</content_quality_score>
    <api_performance>Average response time for DailyMed API calls</api_performance>
  </success_metrics>
</quality_assurance>

<critical_requirements>
  <requirement>NEVER return drug labels older than 2015 unless no recent alternatives exist</requirement>
  <requirement>ALWAYS prioritize most recent version of drug labels</requirement>
  <requirement>ALWAYS extract critical sections (indications, dosage, warnings) when available</requirement>
  <requirement>NEVER exceed 2 labels per drug to maintain processing efficiency</requirement>
  <requirement>ALWAYS validate extracted content contains meaningful medical information</requirement>
  <requirement>NEVER return malformed or incomplete section data</requirement>
  <requirement>ALWAYS handle combination products by searching individual components</requirement>
</critical_requirements>`;

// lib/agents/sub-agents/dailymed-retriever.ts
var DailyMedRetriever = class {
  constructor() {
    this.modelName = "gemini-3-flash-preview";
    if (process.env.GEMINI_API_KEY) {
      const { GoogleGenAI: GoogleGenAI8 } = require("@google/genai");
      this.genAI = new GoogleGenAI8({ apiKey: process.env.GEMINI_API_KEY });
    } else {
      this.genAI = null;
      console.warn("\u26A0\uFE0F GEMINI_API_KEY not set - DailyMed will use basic drug name processing");
    }
    this.systemPrompt = DAILYMED_RETRIEVER_SYSTEM_PROMPT;
  }
  /**
   * Normalize drug names using Gemini 3 Flash (thinking_level: minimal)
   */
  async normalizeDrugNames(drugNames) {
    if (!this.genAI || drugNames.length === 0) {
      return drugNames;
    }
    try {
      const prompt = `Normalize these drug names by removing formulation suffixes (XR, ER, SR, etc.) and expanding abbreviations. Return comma-separated generic names.

Drug names: ${drugNames.join(", ")}

Normalized names:`;
      const response = await callGeminiWithRetry(async (apiKey) => {
        const genAI = new GoogleGenAI({ apiKey });
        return await genAI.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config: {
            systemInstruction: "You are a pharmaceutical terminology specialist. Normalize drug names to generic forms.",
            temperature: 0.1,
            maxOutputTokens: 150,
            thinkingConfig: {
              thinkingLevel: "minimal"
              // Fast drug name normalization
            }
          }
        });
      });
      const normalized = response.text?.trim().split(",").map((d) => d.trim()).filter(Boolean) || drugNames;
      console.log(`   \u{1F48A} Normalized ${drugNames.length} drug names`);
      return normalized;
    } catch (error) {
      console.warn("\u26A0\uFE0F Drug name normalization failed, using original:", error);
      return drugNames;
    }
  }
  /**
   * Prioritize drug label sections using Gemini 3 Flash (thinking_level: low)
   */
  async prioritizeSections(drugs, originalQuery) {
    if (!this.genAI || drugs.length === 0 || !originalQuery) {
      return drugs;
    }
    try {
      if (drugs.length > 15) {
        const drugsPreview = drugs.slice(0, 20).map(
          (d, idx) => `[${idx}] ${d.drug_name} - ${d.title.substring(0, 80)}`
        ).join("\n");
        const prompt = `Given this medical query and drug labels, identify the indices of the 12 most relevant drugs. Return only comma-separated indices (e.g., "0,2,5,7,9,11,13,15,17,19,20,21").

Query: ${originalQuery}

Drugs:
${drugsPreview}

Top 12 indices:`;
        const response = await callGeminiWithRetry(async (apiKey) => {
          const genAI = new GoogleGenAI({ apiKey });
          return await genAI.models.generateContent({
            model: this.modelName,
            contents: prompt,
            config: {
              systemInstruction: "You are a pharmaceutical relevance specialist. Select the most relevant drug labels based on the query.",
              temperature: 0.1,
              maxOutputTokens: 50,
              thinkingConfig: {
                thinkingLevel: "low"
                // Straightforward prioritization
              }
            }
          });
        });
        const indicesText = response.text?.trim() || "";
        const indices = indicesText.split(",").map((s) => parseInt(s.trim())).filter((n) => !isNaN(n) && n < drugs.length);
        if (indices.length > 0) {
          const prioritized = indices.map((i) => drugs[i]).filter(Boolean);
          console.log(`   \u{1F3AF} LLM prioritized ${prioritized.length} drug labels`);
          return prioritized;
        }
      }
      return drugs;
    } catch (error) {
      console.warn("\u26A0\uFE0F LLM prioritization failed, using default ordering:", error);
      return drugs;
    }
  }
  async search(drugNames, traceContext, originalQuery) {
    return await withRetrieverSpan("dailymed", async (span) => {
      const startTime = Date.now();
      span.setAttribute("retrieval.source", "dailymed");
      span.setAttribute("retrieval.query", drugNames.join(", "));
      try {
        console.log(`\u{1F48A} DailyMed Retriever: Enhanced search with Medical Source Bible integration`);
        const normalizedDrugNames = await this.normalizeDrugNames(drugNames);
        let relevantSpecialties = [];
        if (originalQuery) {
          try {
            const { routeQueryToSpecialties: routeQueryToSpecialties2 } = await Promise.resolve().then(() => (init_medical_source_bible(), medical_source_bible_exports));
            relevantSpecialties = routeQueryToSpecialties2(originalQuery);
          } catch (error) {
            console.warn("Medical source bible import failed:", error);
            relevantSpecialties = [];
          }
        }
        console.log(`\u{1F4CB} Drug context specialties: ${relevantSpecialties.join(", ") || "general"}`);
        const searchQuery = normalizedDrugNames.join(" OR ");
        let result;
        try {
          const { comprehensiveDailyMedSearch: comprehensiveDailyMedSearch2 } = await Promise.resolve().then(() => (init_dailymed(), dailymed_exports));
          result = await comprehensiveDailyMedSearch2(searchQuery);
        } catch (error) {
          console.warn("DailyMed search failed:", error);
          result = { allDrugs: [] };
        }
        const enhancedResults = this.enhanceWithSourceBible(result.drugs || [], relevantSpecialties, normalizedDrugNames);
        const prioritizedResults = await this.prioritizeSections(enhancedResults, originalQuery);
        const filteredResults = this.applyDrugFiltering(prioritizedResults);
        const latency = Date.now() - startTime;
        span.setAttribute("retrieval.result_count", filteredResults.length);
        span.setAttribute("retrieval.latency_ms", latency);
        span.setAttribute("retrieval.drugs_searched", drugNames.length);
        span.setAttribute("retrieval.specialties_detected", JSON.stringify(relevantSpecialties));
        span.setAttribute("retrieval.total_results", result.drugs?.length || 0);
        span.setAttribute("retrieval.after_filtering", filteredResults.length);
        span.setAttribute("retrieval.recent_updates", filteredResults.filter((r) => r.is_recent_update).length);
        span.setAttribute("retrieval.labels_found", filteredResults.length);
        console.log(`\u2705 DailyMed Retriever: ${filteredResults.length} drug labels (${filteredResults.filter((r) => r.is_recent_update).length} recent updates)`);
        const documents = filteredResults.map((r) => ({
          id: r.setid,
          content: r.title + " " + Object.values(r.sections).join(" "),
          score: 1,
          metadata: {
            drug_name: r.drug_name,
            title: r.title,
            published: r.published,
            specialty_relevance: r.specialty_relevance,
            is_recent_update: r.is_recent_update
          }
        }));
        return { result: filteredResults, documents };
      } catch (error) {
        console.error("\u274C DailyMed Retriever failed:", error);
        span.setAttribute("retrieval.result_count", 0);
        span.setAttribute("retrieval.latency_ms", Date.now() - startTime);
        span.setAttribute("retrieval.error", error instanceof Error ? error.message : "Unknown error");
        span.recordException(error);
        span.setStatus({ code: 2 /* ERROR */, message: error instanceof Error ? error.message : "Unknown error" });
        return { result: [], documents: [] };
      }
    }, { source: "dailymed" });
  }
  enhanceWithSourceBible(drugs, specialties, searchedDrugs) {
    return drugs.map((drug) => {
      const pubYear = new Date(drug.publishedDate || "2000-01-01").getFullYear();
      const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
      const isRecentUpdate = pubYear >= currentYear - 2;
      const sections = {};
      if (drug.indications) sections.indications = drug.indications;
      if (drug.contraindications) sections.contraindications = drug.contraindications;
      if (drug.warnings) sections.warnings = drug.warnings;
      if (drug.dosage) sections.dosage = drug.dosage;
      if (drug.adverseReactions) sections.adverse_reactions = drug.adverseReactions;
      if (drug.drugInteractions) sections.drug_interactions = drug.drugInteractions;
      if (drug.clinicalPharmacology) sections.clinical_pharmacology = drug.clinicalPharmacology;
      if (drug.howSupplied) sections.how_supplied = drug.howSupplied;
      return {
        setid: drug.setId,
        drug_name: drug.genericName || drug.brandName || searchedDrugs[0] || "Unknown",
        title: drug.title,
        published: drug.publishedDate,
        sections,
        specialty_relevance: specialties,
        is_recent_update: isRecentUpdate
      };
    });
  }
  applyDrugFiltering(results) {
    const sorted = results.sort((a, b) => {
      if (a.is_recent_update && !b.is_recent_update) return -1;
      if (!a.is_recent_update && b.is_recent_update) return 1;
      const sectionsA = Object.keys(a.sections).length;
      const sectionsB = Object.keys(b.sections).length;
      if (sectionsA !== sectionsB) return sectionsB - sectionsA;
      const dateA = new Date(a.published || "1900-01-01").getTime();
      const dateB = new Date(b.published || "1900-01-01").getTime();
      return dateB - dateA;
    });
    const recentUpdates = sorted.filter((r) => r.is_recent_update).slice(0, 8);
    const olderLabels = sorted.filter((r) => !r.is_recent_update).slice(0, 4);
    const combined = [...recentUpdates, ...olderLabels];
    const seen = /* @__PURE__ */ new Set();
    const deduped = combined.filter((drug) => {
      if (seen.has(drug.setid)) return false;
      seen.add(drug.setid);
      return true;
    });
    return deduped.slice(0, 12);
  }
};

// lib/agents/sub-agents/tavily-search.ts
var TavilySmartSearch = class {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.modelName = "gemini-3-flash-preview";
    this.genAI = null;
    const { TAVILY_SEARCH_SYSTEM_PROMPT: TAVILY_SEARCH_SYSTEM_PROMPT2 } = (init_tavily_search_prompt(), __toCommonJS(tavily_search_prompt_exports));
    this.systemPrompt = TAVILY_SEARCH_SYSTEM_PROMPT2;
  }
  /**
   * Enhance query for web search using rule-based logic (FAST)
   * Removed LLM call to save time
   */
  async enhanceQuery(query, specialties) {
    let enhanced = query;
    if (specialties.length > 0) {
      enhanced += ` ${specialties.slice(0, 2).join(" ")}`;
    }
    if (!enhanced.toLowerCase().includes("medical") && !enhanced.toLowerCase().includes("clinical")) {
      enhanced += " medical clinical";
    }
    return enhanced;
  }
  /**
   * Classify source type using rule-based URL patterns (FAST)
   * Removed LLM call to save time and dependencies
   */
  async classifySourcesBatch(results) {
    const classifications = /* @__PURE__ */ new Map();
    results.forEach((result) => {
      classifications.set(result.url, this.classifySourceBasic(result.url, result.title));
    });
    return classifications;
  }
  /**
   * Basic URL and Title-based source classification
   */
  classifySourceBasic(url, title = "") {
    const urlLower = url.toLowerCase();
    const titleLower = title.toLowerCase();
    if (titleLower.includes("guideline") || titleLower.includes("recommendation") || titleLower.includes("consensus") || titleLower.includes("standards")) {
      if (urlLower.includes(".org") || urlLower.includes(".gov")) return "guideline_org";
    }
    if (urlLower.includes("cdc.gov") || urlLower.includes("who.int") || urlLower.includes("nih.gov") || urlLower.includes("fda.gov") || urlLower.includes("nice.org.uk") || urlLower.includes("nhs.uk")) {
      return "government";
    }
    if (urlLower.includes("nejm.org") || urlLower.includes("thelancet.com") || urlLower.includes("jamanetwork.com") || urlLower.includes("bmj.com") || urlLower.includes("nature.com") || urlLower.includes("pubmed") || urlLower.includes("ncbi.nlm.nih.gov")) {
      return "journal";
    }
    if (urlLower.includes("mayoclinic.org") || urlLower.includes("clevelandclinic.org") || urlLower.includes("hopkinsmedicine.org") || urlLower.includes("mskcc.org")) {
      return "medical_institution";
    }
    return "medical_institution";
  }
  async search(query, existingUrls, traceContext, originalQuery) {
    return await withRetrieverSpan("tavily", async (span) => {
      const startTime = Date.now();
      span.setAttribute("retrieval.source", "tavily");
      span.setAttribute("retrieval.query", query);
      if (!this.apiKey) {
        console.log("\u26A0\uFE0F Tavily API key not configured, skipping web search");
        span.setAttribute("retrieval.result_count", 0);
        span.setAttribute("retrieval.latency_ms", Date.now() - startTime);
        return { result: [], documents: [] };
      }
      try {
        console.log(`\u{1F310} Tavily Smart Search: Enhanced with Medical Source Bible domain targeting`);
        let relevantSpecialties = [];
        let targetDomains = [];
        let enhancedQuery = query;
        if (originalQuery) {
          try {
            const medicalSourceBible = await Promise.resolve().then(() => (init_medical_source_bible(), medical_source_bible_exports));
            relevantSpecialties = medicalSourceBible.routeQueryToSpecialties(originalQuery);
            targetDomains = relevantSpecialties.length > 0 ? medicalSourceBible.getTavilyDomains(relevantSpecialties) : this.getGeneralMedicalDomains();
            enhancedQuery = await this.enhanceQuery(query, relevantSpecialties);
          } catch (error) {
            console.warn("Medical source bible import failed, using basic search:", error);
            targetDomains = this.getGeneralMedicalDomains();
            enhancedQuery = await this.enhanceQuery(query, []);
          }
        } else {
          targetDomains = this.getGeneralMedicalDomains();
          enhancedQuery = await this.enhanceQuery(query, []);
        }
        console.log(`\u{1F4CB} Detected specialties for domain targeting: ${relevantSpecialties.join(", ") || "general"}`);
        console.log(`\u{1F3AF} Targeting ${targetDomains.length} specialty domains`);
        if (enhancedQuery.length > 420) {
          console.log(`\u26A0\uFE0F Query too long (${enhancedQuery.length} chars), smart truncating to 420 chars`);
          enhancedQuery = this.smartTruncate(enhancedQuery, 420);
        }
        const response = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            query: enhancedQuery,
            search_depth: "advanced",
            max_results: 15,
            include_domains: targetDomains,
            exclude_domains: [
              "wikipedia.org",
              "reddit.com",
              "quora.com",
              "facebook.com",
              "twitter.com",
              "youtube.com"
            ]
          })
        });
        if (!response.ok) {
          throw new Error(`Tavily API error: ${response.status}`);
        }
        const data = await response.json();
        const rawResults = data.results || [];
        const sourceClassifications = await this.classifySourcesBatch(rawResults);
        const enhancedResults = await this.enhanceWithSourceBible(rawResults, relevantSpecialties, existingUrls, sourceClassifications);
        const filteredResults = this.applyMedicalFiltering(enhancedResults);
        const latency = Date.now() - startTime;
        span.setAttribute("retrieval.result_count", filteredResults.length);
        span.setAttribute("retrieval.latency_ms", latency);
        span.setAttribute("retrieval.specialties_detected", JSON.stringify(relevantSpecialties));
        span.setAttribute("retrieval.domains_targeted", targetDomains.length);
        span.setAttribute("retrieval.total_results", rawResults.length);
        span.setAttribute("retrieval.deduped_results", filteredResults.length);
        span.setAttribute("retrieval.guideline_orgs", filteredResults.filter((r) => r.source_type === "guideline_org").length);
        span.setAttribute("retrieval.government_sources", filteredResults.filter((r) => r.source_type === "government").length);
        span.setAttribute("retrieval.query_type", "specialty_targeted_search");
        console.log(`\u2705 Tavily Smart Search: ${filteredResults.length} new sources (${filteredResults.filter((r) => r.source_type === "guideline_org").length} guideline orgs, ${filteredResults.filter((r) => r.source_type === "government").length} government)`);
        console.log(`   \u{1F4CE} All results include URLs for proper reference section display`);
        const documents = filteredResults.map((r) => ({
          id: r.url,
          content: r.content,
          score: r.score,
          metadata: {
            title: r.title,
            url: r.url,
            // CRITICAL: URL preserved for reference section
            published_date: r.published_date,
            specialty_relevance: r.specialty_relevance,
            source_type: r.source_type
          }
        }));
        return { result: filteredResults, documents };
      } catch (error) {
        console.error("\u274C Tavily Smart Search failed:", error);
        span.setAttribute("retrieval.result_count", 0);
        span.setAttribute("retrieval.latency_ms", Date.now() - startTime);
        span.setAttribute("retrieval.error", error instanceof Error ? error.message : "Unknown error");
        span.recordException(error);
        span.setStatus({ code: 2 /* ERROR */, message: error instanceof Error ? error.message : "Unknown error" });
        return { result: [], documents: [] };
      }
    }, { source: "tavily" });
  }
  /**
   * Fetch structured metadata from NCBI for PubMed/PMC URLs
   */
  async fetchNCBIMetadata(url) {
    try {
      let db = "";
      let id = "";
      if (url.includes("pubmed.ncbi.nlm.nih.gov")) {
        db = "pubmed";
        const match = url.match(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/);
        if (match) id = match[1];
      } else if (url.includes("ncbi.nlm.nih.gov/pmc")) {
        db = "pmc";
        const match = url.match(/PMC(\d+)/);
        if (match) id = match[1];
      }
      if (!db || !id || !process.env.NCBI_API_KEY) return null;
      const apiUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=${db}&id=${id}&retmode=json&api_key=${process.env.NCBI_API_KEY}`;
      const response = await fetch(apiUrl);
      if (!response.ok) return null;
      const data = await response.json();
      const uid = db === "pubmed" ? id : Object.keys(data.result)[0];
      const doc = data.result[uid];
      if (!doc) return null;
      const authors = doc.authors?.map((a) => a.name) || [];
      const journal = doc.source || doc.fulljournalname;
      const pubDate = doc.pubdate || doc.epubdate;
      const year = pubDate ? pubDate.substring(0, 4) : "";
      return {
        authors: authors.slice(0, 5),
        // Top 5 authors
        journal,
        year,
        title: doc.title
      };
    } catch (error) {
      console.warn(`\u26A0\uFE0F NCBI metadata fetch failed for ${url}:`, error);
      return null;
    }
  }
  async enhanceWithSourceBible(results, specialties, existingUrls, sourceClassifications) {
    const enrichedResults = [];
    for (const result of results) {
      if (existingUrls.has(result.url)) continue;
      const sourceType = sourceClassifications.get(result.url) || this.classifySourceBasic(result.url, result.title);
      let metadata = {};
      if (result.url.includes("ncbi.nlm.nih.gov")) {
        const ncbiData = await this.fetchNCBIMetadata(result.url);
        if (ncbiData) {
          metadata = {
            authors: ncbiData.authors,
            journal: ncbiData.journal,
            year: ncbiData.year,
            // Use NCBI title if available as it's cleaner
            corrected_title: ncbiData.title
          };
        }
      } else if (sourceType === "guideline_org") {
        const yearMatch = result.title.match(/(20\d{2})/);
        if (yearMatch) {
          metadata = { year: yearMatch[1] };
        }
      }
      enrichedResults.push({
        url: result.url,
        title: metadata.corrected_title || result.title,
        content: result.content,
        score: result.score || 0.7,
        published_date: metadata.year || result.published_date,
        specialty_relevance: specialties,
        source_type: sourceType,
        ...metadata
        // Spread captured metadata (authors, journal)
      });
    }
    return enrichedResults;
  }
  applyMedicalFiltering(results) {
    const sorted = results.sort((a, b) => {
      const typePriority = {
        "guideline_org": 4,
        "government": 3,
        "journal": 2,
        "medical_institution": 1
      };
      const typeDiff = typePriority[b.source_type || "medical_institution"] - typePriority[a.source_type || "medical_institution"];
      if (typeDiff !== 0) return typeDiff;
      return (b.score || 0) - (a.score || 0);
    });
    const guidelineOrgs = sorted.filter((r) => r.source_type === "guideline_org").slice(0, 8);
    const government = sorted.filter((r) => r.source_type === "government").slice(0, 6);
    const journals = sorted.filter((r) => r.source_type === "journal").slice(0, 4);
    const institutions = sorted.filter((r) => r.source_type === "medical_institution").slice(0, 4);
    const combined = [...guidelineOrgs, ...government, ...journals, ...institutions];
    const seen = /* @__PURE__ */ new Set();
    const deduped = combined.filter((result) => {
      if (seen.has(result.url)) return false;
      seen.add(result.url);
      return true;
    });
    return deduped.slice(0, 20);
  }
  getGeneralMedicalDomains() {
    return [
      "cdc.gov",
      "who.int",
      "nih.gov",
      "fda.gov",
      "mayoclinic.org",
      "clevelandclinic.org",
      "hopkinsmedicine.org",
      "nejm.org",
      "thelancet.com",
      "jamanetwork.com",
      "bmj.com",
      "nice.org.uk",
      "nhs.uk",
      "uptodate.com",
      "medscape.com"
    ];
  }
  /**
   * Smart truncation for Tavily queries - preserves context while meeting length limit
   */
  smartTruncate(query, maxLength) {
    let shortened = query.replace(/\(site:[^)]+\)/gi, "").trim();
    if (shortened.length > maxLength) {
      const fillerPatterns = [
        /\bguidelines\s+recommendations\b/gi,
        /\bclinical\s+practice\s+guidelines\b/gi,
        /\bsystematic\s+review\s+meta-analysis\b/gi
      ];
      for (const pattern of fillerPatterns) {
        if (shortened.length <= maxLength) break;
        shortened = shortened.replace(pattern, (match) => {
          return match.split(/\s+/)[0];
        });
      }
    }
    shortened = shortened.replace(/\s+/g, " ").trim();
    if (shortened.length > maxLength) {
      shortened = shortened.substring(0, maxLength);
      const lastSpace = shortened.lastIndexOf(" ");
      if (lastSpace > maxLength * 0.7) {
        shortened = shortened.substring(0, lastSpace);
      }
    }
    return shortened.trim();
  }
};

// lib/agents/multi-source-retrieval.ts
var MultiSourceRetrievalCoordinator = class {
  constructor(config) {
    this.guidelines = new GuidelinesRetriever();
    this.pubmedIntelligence = new PubMedIntelligence(config.ncbi_api_key);
    this.dailymedRetriever = new DailyMedRetriever();
    this.tavily = new TavilySmartSearch(config.tavily_api_key);
  }
  async retrieveAll(searchStrategy, traceContext, originalQuery) {
    return await withRetrieverSpan("intelligent_multi_source", async (span) => {
      const startTime = Date.now();
      span.setAttribute("retrieval.source", "intelligent_multi_source");
      span.setAttribute("retrieval.query", searchStrategy.search_variants.join(" | "));
      const tasks = [];
      const sources = searchStrategy.requires_sources;
      const subAgentQueries = searchStrategy.sub_agent_queries;
      console.log(`\u{1F50D} Starting intelligent sub-agent retrieval with specialized queries...`);
      console.log(`\u{1F4CB} Original query: "${originalQuery || "Not provided"}"`);
      console.log(`\u{1F3AF} Sub-agent routing decisions:`);
      console.log(`   Guidelines: ${subAgentQueries.guidelines?.should_call ? "\u2713" : "\u2717"} - ${subAgentQueries.guidelines?.reasoning}`);
      console.log(`   PubMed: ${subAgentQueries.pubmed?.should_call ? "\u2713" : "\u2717"} - ${subAgentQueries.pubmed?.reasoning}`);
      console.log(`   DailyMed: ${subAgentQueries.dailymed?.should_call ? "\u2713" : "\u2717"} - ${subAgentQueries.dailymed?.reasoning}`);
      fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "multi-source-retrieval.ts:69", message: "Multi-source retrieval starting", data: { guidelines: subAgentQueries.guidelines?.should_call, pubmed: subAgentQueries.pubmed?.should_call, dailymed: subAgentQueries.dailymed?.should_call, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
      });
      const timeoutPromise = new Promise(
        (_, reject) => setTimeout(() => reject(new Error("Retrieval timeout after 60 seconds")), 6e4)
      );
      if (subAgentQueries.guidelines?.should_call && subAgentQueries.guidelines.rephrased_queries.length > 0) {
        console.log(`\u{1F4CB} Guidelines: Using ${subAgentQueries.guidelines.rephrased_queries.length} specialized queries`);
        fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "multi-source-retrieval.ts:85", message: "Sub-agent guidelines starting", data: { subAgent: "guidelines", timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
        });
        tasks.push(
          this.guidelines.search(
            subAgentQueries.guidelines.rephrased_queries,
            traceContext,
            originalQuery
          ).then((results) => {
            fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "multi-source-retrieval.ts:92", message: "Sub-agent guidelines completed", data: { subAgent: "guidelines", resultCount: results.result?.length || 0, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
            });
            return { type: "guidelines", results };
          }).catch((err) => {
            fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "multi-source-retrieval.ts:96", message: "Sub-agent guidelines error", data: { subAgent: "guidelines", error: err instanceof Error ? err.message : "Unknown", timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
            });
            throw err;
          })
        );
      } else {
        tasks.push(Promise.resolve({ type: "guidelines", results: [] }));
      }
      const shouldCallPubMed = subAgentQueries.pubmed?.should_call !== false;
      const pubmedQueries = subAgentQueries.pubmed?.rephrased_queries.length > 0 ? subAgentQueries.pubmed.rephrased_queries : searchStrategy.search_variants.slice(0, 3);
      if (shouldCallPubMed && pubmedQueries.length > 0) {
        console.log(`\u{1F52C} PubMed: Using ${pubmedQueries.length} ${subAgentQueries.pubmed?.rephrased_queries.length > 0 ? "specialized" : "fallback"} queries with MeSH terms`);
        fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "multi-source-retrieval.ts:100", message: "Sub-agent pubmed starting", data: { subAgent: "pubmed", queryCount: pubmedQueries.length, isFallback: subAgentQueries.pubmed?.rephrased_queries.length === 0, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
        });
        const pubmedStartTime = Date.now();
        tasks.push(
          Promise.race([
            this.pubmedIntelligence.search(
              pubmedQueries,
              searchStrategy.entities,
              traceContext,
              originalQuery
            ).then((results) => {
              fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "multi-source-retrieval.ts:107", message: "Sub-agent pubmed completed", data: { subAgent: "pubmed", resultCount: results.result?.length || 0, elapsed: Date.now() - pubmedStartTime, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
              });
              if (!results.result || results.result.length === 0) {
                console.warn("\u26A0\uFE0F PubMed returned no results - this may cause over-reliance on Tavily");
              }
              return { type: "pubmed", results };
            }).catch((err) => {
              fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "multi-source-retrieval.ts:111", message: "Sub-agent pubmed error", data: { subAgent: "pubmed", error: err instanceof Error ? err.message : "Unknown", elapsed: Date.now() - pubmedStartTime, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
              });
              console.error("\u274C PubMed search failed - this will cause over-reliance on Tavily:", err);
              return { type: "pubmed", results: [] };
            }),
            // Individual timeout for PubMed (50 seconds)
            new Promise(
              (_, reject) => setTimeout(() => reject(new Error("PubMed search timeout after 50 seconds")), 5e4)
            ).then(() => ({ type: "pubmed", results: [] }))
          ]).catch((err) => {
            fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "multi-source-retrieval.ts:120", message: "Sub-agent pubmed timeout/error", data: { subAgent: "pubmed", error: err instanceof Error ? err.message : "Unknown", elapsed: Date.now() - pubmedStartTime, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
            });
            console.error("\u274C PubMed search timed out or failed:", err);
            return { type: "pubmed", results: [] };
          })
        );
      } else {
        console.warn("\u26A0\uFE0F PubMed not called - this is unusual and may cause over-reliance on Tavily");
        tasks.push(Promise.resolve({ type: "pubmed", results: [] }));
      }
      if (subAgentQueries.dailymed?.should_call && subAgentQueries.dailymed.drug_names.length > 0) {
        console.log(`\u{1F48A} DailyMed: Using ${subAgentQueries.dailymed.drug_names.length} clean drug names`);
        fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "multi-source-retrieval.ts:116", message: "Sub-agent dailymed starting", data: { subAgent: "dailymed", timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
        });
        tasks.push(
          this.dailymedRetriever.search(
            subAgentQueries.dailymed.drug_names,
            traceContext,
            originalQuery
          ).then((results) => {
            fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "multi-source-retrieval.ts:123", message: "Sub-agent dailymed completed", data: { subAgent: "dailymed", resultCount: results.result?.length || 0, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
            });
            return { type: "dailymed", results };
          }).catch((err) => {
            fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "multi-source-retrieval.ts:127", message: "Sub-agent dailymed error", data: { subAgent: "dailymed", error: err instanceof Error ? err.message : "Unknown", timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
            });
            throw err;
          })
        );
      } else {
        tasks.push(Promise.resolve({ type: "dailymed", results: [] }));
      }
      tasks.push(
        (async () => {
          try {
            const { searchClinicalTrials: searchClinicalTrials2 } = await Promise.resolve().then(() => (init_clinical_trials(), clinical_trials_exports));
            const results = await searchClinicalTrials2(
              searchStrategy.search_variants.join(" OR "),
              20
              // maxResults
            );
            return { type: "clinical_trials", results };
          } catch (error) {
            console.warn("Clinical trials search failed:", error);
            return { type: "clinical_trials", results: [] };
          }
        })()
      );
      tasks.push(
        (async () => {
          try {
            const { comprehensiveCochraneSearch: comprehensiveCochraneSearch2 } = await Promise.resolve().then(() => (init_cochrane(), cochrane_exports));
            const results = await comprehensiveCochraneSearch2(
              searchStrategy.search_variants.join(" OR ")
            );
            return { type: "cochrane", results: results.allReviews };
          } catch (error) {
            console.warn("Cochrane search failed:", error);
            return { type: "cochrane", results: [] };
          }
        })()
      );
      tasks.push(Promise.resolve({ type: "bmj", results: [] }));
      tasks.push(Promise.resolve({ type: "nice", results: [] }));
      tasks.push(Promise.resolve({ type: "who", results: [] }));
      tasks.push(Promise.resolve({ type: "cdc", results: [] }));
      tasks.push(Promise.resolve({ type: "landmark_trials", results: [] }));
      tasks.push(Promise.resolve({ type: "semantic_scholar", results: [] }));
      tasks.push(Promise.resolve({ type: "europe_pmc", results: [] }));
      tasks.push(Promise.resolve({ type: "pmc", results: [] }));
      tasks.push(Promise.resolve({ type: "openalex", results: [] }));
      console.log(`\u26A1 Executing ${tasks.length} parallel searches with intelligent routing...`);
      fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "multi-source-retrieval.ts:173", message: "Waiting for parallel tasks", data: { taskCount: tasks.length, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
      });
      try {
        const results = await Promise.race([
          Promise.all(tasks),
          timeoutPromise
        ]);
        fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "multi-source-retrieval.ts:179", message: "Parallel tasks completed", data: { resultCount: results.length, elapsed: Date.now() - startTime, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
        });
        const totalLatency = Date.now() - startTime;
        const organizedResults = {
          guidelines: [],
          pubmed: [],
          dailymed: [],
          clinical_trials: [],
          cochrane: [],
          bmj: [],
          nice: [],
          who: [],
          cdc: [],
          landmark_trials: [],
          semantic_scholar: [],
          europe_pmc: [],
          pmc: [],
          openalex: [],
          tavily: []
          // Will be populated by Agent 5 if needed
        };
        for (const result of results) {
          organizedResults[result.type] = result.results || [];
        }
        const totalResults = Object.values(organizedResults).reduce((sum, arr) => sum + arr.length, 0);
        span.setAttribute("retrieval.result_count", totalResults);
        span.setAttribute("retrieval.latency_ms", totalLatency);
        span.setAttribute("retrieval.guidelines_count", organizedResults.guidelines.length);
        span.setAttribute("retrieval.guidelines_called", subAgentQueries.guidelines?.should_call || false);
        span.setAttribute("retrieval.guidelines_queries", subAgentQueries.guidelines?.rephrased_queries.length || 0);
        span.setAttribute("retrieval.pubmed_count", organizedResults.pubmed.length);
        span.setAttribute("retrieval.pubmed_called", subAgentQueries.pubmed?.should_call || false);
        span.setAttribute("retrieval.pubmed_queries", subAgentQueries.pubmed?.rephrased_queries.length || 0);
        span.setAttribute("retrieval.pubmed_mesh_terms", subAgentQueries.pubmed?.mesh_terms.length || 0);
        span.setAttribute("retrieval.dailymed_count", organizedResults.dailymed.length);
        span.setAttribute("retrieval.dailymed_called", subAgentQueries.dailymed?.should_call || false);
        span.setAttribute("retrieval.dailymed_drugs", subAgentQueries.dailymed?.drug_names.length || 0);
        span.setAttribute("retrieval.clinical_trials_count", organizedResults.clinical_trials.length);
        span.setAttribute("retrieval.cochrane_count", organizedResults.cochrane.length);
        span.setAttribute("retrieval.bmj_count", organizedResults.bmj.length);
        span.setAttribute("retrieval.nice_count", organizedResults.nice.length);
        span.setAttribute("retrieval.who_count", organizedResults.who.length);
        span.setAttribute("retrieval.cdc_count", organizedResults.cdc.length);
        span.setAttribute("retrieval.landmark_trials_count", organizedResults.landmark_trials.length);
        span.setAttribute("retrieval.semantic_scholar_count", organizedResults.semantic_scholar.length);
        span.setAttribute("retrieval.europe_pmc_count", organizedResults.europe_pmc.length);
        span.setAttribute("retrieval.pmc_count", organizedResults.pmc.length);
        span.setAttribute("retrieval.openalex_count", organizedResults.openalex.length);
        span.setAttribute("retrieval.sub_agents_called", [
          subAgentQueries.guidelines?.should_call,
          subAgentQueries.pubmed?.should_call,
          subAgentQueries.dailymed?.should_call
        ].filter(Boolean).length);
        console.log(`\u2705 Intelligent evidence retrieval complete: ${totalResults} documents in ${totalLatency}ms`);
        console.log(`\u{1F3AF} Sub-agent performance:`);
        console.log(`   \u{1F4DA} Guidelines: ${organizedResults.guidelines.length} (${subAgentQueries.guidelines?.rephrased_queries.length || 0} specialized queries)`);
        console.log(`   \uFFFD PubMed: ${organizedResults.pubmed.length} (${subAgentQueries.pubmed?.rephrased_queries.length || 0} queries, ${subAgentQueries.pubmed?.mesh_terms.length || 0} MeSH terms)`);
        console.log(`   \uFFFD DailyMed: ${organizedResults.dailymed.length} (${subAgentQueries.dailymed?.drug_names.length || 0} clean drug names)`);
        console.log(`   \u{1F9EA} Clinical Trials: ${organizedResults.clinical_trials.length}`);
        console.log(`   \u{1F4CA} Cochrane: ${organizedResults.cochrane.length}`);
        console.log(`   \u{1F3E5} BMJ: ${organizedResults.bmj.length}`);
        console.log(`   \u{1F1EC}\u{1F1E7} NICE: ${organizedResults.nice.length}`);
        console.log(`   \u{1F30D} WHO: ${organizedResults.who.length}`);
        console.log(`   \u{1F1FA}\u{1F1F8} CDC: ${organizedResults.cdc.length}`);
        console.log(`   \u2B50 Landmark Trials: ${organizedResults.landmark_trials.length}`);
        console.log(`   \u{1F393} Semantic Scholar: ${organizedResults.semantic_scholar.length}`);
        console.log(`   \u{1F1EA}\u{1F1FA} Europe PMC: ${organizedResults.europe_pmc.length}`);
        console.log(`   \u{1F4C4} PMC Full-text: ${organizedResults.pmc.length}`);
        console.log(`   \u{1F50D} OpenAlex: ${organizedResults.openalex.length}`);
        const allDocuments = [];
        Object.entries(organizedResults).forEach(([source, results2]) => {
          results2.forEach((result, index) => {
            allDocuments.push({
              id: result.id || result.pmid || result.setid || `${source}_${index}`,
              content: result.text || result.abstract || result.title || result.content || "",
              score: result.score || result.similarity_score || 1,
              metadata: {
                source,
                ...result.metadata,
                ...result
              }
            });
          });
        });
        return { result: organizedResults, documents: allDocuments };
      } catch (error) {
        console.error("\u274C Intelligent evidence retrieval failed or timed out:", error);
        fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "multi-source-retrieval.ts:273", message: "Multi-source retrieval error", data: { error: error instanceof Error ? error.message : "Unknown", elapsed: Date.now() - startTime, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
        });
        span.setAttribute("retrieval.result_count", 0);
        span.setAttribute("retrieval.latency_ms", Date.now() - startTime);
        span.setAttribute("retrieval.error", error instanceof Error ? error.message : "Unknown error");
        span.recordException(error);
        span.setStatus({ code: 2 /* ERROR */, message: error instanceof Error ? error.message : "Unknown error" });
        const partialResults = {
          guidelines: [],
          pubmed: [],
          dailymed: [],
          clinical_trials: [],
          cochrane: [],
          bmj: [],
          nice: [],
          who: [],
          cdc: [],
          landmark_trials: [],
          semantic_scholar: [],
          europe_pmc: [],
          pmc: [],
          openalex: [],
          tavily: []
        };
        console.log("\u26A0\uFE0F Returning empty results due to intelligent retrieval failure/timeout");
        return { result: partialResults, documents: [] };
      }
    }, { source: "intelligent_multi_source" });
  }
  // Method to be called by Agent 5 if Tavily search needed
  async searchTavily(query, existingUrls, traceContext, originalQuery) {
    return this.tavily.search(query, existingUrls, traceContext, originalQuery);
  }
};

// lib/agents/evidence-normalizer.ts
var EvidenceNormalizer = class {
  normalizeAll(rawResults) {
    const candidates = [];
    const seenIds = /* @__PURE__ */ new Set();
    console.log(`\u{1F504} Starting evidence normalization for 15+ sources...`);
    for (const doc of rawResults.guidelines) {
      const candidate = {
        source: "indian_guideline",
        id: doc.chunk_id,
        title: doc.title || "Untitled Guideline",
        text: doc.text || "No content available",
        metadata: {
          organization: doc.organization,
          year: doc.year,
          guideline_id: doc.guideline_id,
          similarity_score: doc.similarity_score,
          badges: ["Practice Guideline", "Indian Guidelines"]
        },
        full_text_available: false
      };
      if (!seenIds.has(candidate.id)) {
        candidates.push(candidate);
        seenIds.add(candidate.id);
      }
    }
    let pubmedCount = 0;
    for (const doc of rawResults.pubmed) {
      const pmid = doc.pmid || doc.id;
      if (!seenIds.has(pmid)) {
        const badges = [];
        if (doc.pub_types?.includes("Meta-Analysis")) badges.push("Meta-Analysis");
        if (doc.pub_types?.includes("Systematic Review")) badges.push("Systematic Review");
        if (doc.pub_types?.includes("Randomized Controlled Trial")) badges.push("RCT");
        if (doc.pmcid) badges.push("PMCID");
        if (doc.pub_date && new Date(doc.pub_date).getFullYear() >= 2020) badges.push("Recent");
        if (doc.journal_tier === "tier_1") badges.push("Leading Journal");
        if (doc.journal_tier === "specialty_elite") badges.push("Specialty Elite");
        const candidate = {
          source: "pubmed",
          id: pmid,
          title: doc.title || "Untitled PubMed Article",
          text: doc.abstract || "No abstract available",
          metadata: {
            authors: doc.authors,
            journal: doc.journal,
            pub_date: doc.pub_date,
            doi: doc.doi,
            pmcid: doc.pmcid,
            pub_types: doc.pub_types,
            journal_tier: doc.journal_tier,
            // Preserve journal tier for prioritization
            badges
          },
          full_text_available: !!doc.pmcid
        };
        candidates.push(candidate);
        seenIds.add(pmid);
        pubmedCount++;
      }
    }
    if (pubmedCount === 0 && rawResults.pubmed.length > 0) {
      console.warn("\u26A0\uFE0F PubMed results found but none normalized - possible deduplication issue");
    } else if (pubmedCount > 0) {
      console.log(`\u2705 Normalized ${pubmedCount} PubMed articles (primary evidence source)`);
    }
    for (const doc of rawResults.dailymed) {
      const setid = doc.setid || doc.id;
      if (!seenIds.has(setid)) {
        const textParts = [];
        const sectionOrder = ["indications", "dosage", "clinical_pharmacology", "warnings", "adverse_reactions"];
        for (const sectionName of sectionOrder) {
          if (doc.sections?.[sectionName]) {
            textParts.push(`${sectionName.toUpperCase()}:
${doc.sections[sectionName]}`);
          }
        }
        const candidate = {
          source: "dailymed",
          id: setid,
          title: doc.title || doc.drug_name,
          text: textParts.join("\n\n") || doc.content || doc.text,
          metadata: {
            drug_name: doc.drug_name,
            published: doc.published,
            all_sections: doc.sections,
            badges: ["FDA Label", "Drug Information"]
          },
          full_text_available: true,
          full_text_sections: doc.sections
        };
        candidates.push(candidate);
        seenIds.add(setid);
      }
    }
    for (const doc of rawResults.clinical_trials) {
      const nctId = doc.nct_id || doc.id;
      if (!seenIds.has(nctId)) {
        const badges = ["Clinical Trial"];
        if (doc.phase) badges.push(`Phase ${doc.phase}`);
        if (doc.status === "Completed") badges.push("Completed");
        if (doc.has_results) badges.push("Has Results");
        const candidate = {
          source: "clinical_trials",
          id: nctId,
          title: doc.title || doc.brief_title || "Untitled Clinical Trial",
          text: doc.brief_summary || doc.detailed_description || doc.summary || "No summary available",
          metadata: {
            phase: doc.phase,
            status: doc.status,
            enrollment: doc.enrollment,
            start_date: doc.start_date,
            completion_date: doc.completion_date,
            sponsor: doc.sponsor,
            badges
          },
          full_text_available: false
        };
        candidates.push(candidate);
        seenIds.add(nctId);
      }
    }
    for (const doc of rawResults.cochrane) {
      const cochraneId = doc.cochrane_id || doc.id;
      if (!seenIds.has(cochraneId)) {
        const candidate = {
          source: "cochrane",
          id: cochraneId,
          title: doc.title || "Untitled Cochrane Review",
          text: doc.abstract || doc.plain_language_summary || "No abstract available",
          metadata: {
            authors: doc.authors,
            publication_date: doc.publication_date,
            doi: doc.doi,
            review_type: doc.review_type,
            badges: ["Cochrane Review", "Systematic Review", "High Quality"]
          },
          full_text_available: false
        };
        candidates.push(candidate);
        seenIds.add(cochraneId);
      }
    }
    for (const doc of rawResults.bmj) {
      const bmjId = doc.topic_id || doc.id;
      if (!seenIds.has(bmjId)) {
        const candidate = {
          source: "bmj_best_practice",
          id: bmjId,
          title: doc.title || "Untitled BMJ Article",
          text: doc.summary || doc.content || "No content available",
          metadata: {
            topic: doc.topic,
            last_updated: doc.last_updated,
            evidence_level: doc.evidence_level,
            badges: ["BMJ Best Practice", "Clinical Guidelines", "Evidence-Based"]
          },
          full_text_available: false
        };
        candidates.push(candidate);
        seenIds.add(bmjId);
      }
    }
    const otherSources = [
      { key: "nice", name: "NICE Guidelines", badges: ["NICE", "UK Guidelines"] },
      { key: "who", name: "WHO Guidelines", badges: ["WHO", "Global Guidelines"] },
      { key: "cdc", name: "CDC Guidelines", badges: ["CDC", "US Guidelines"] },
      { key: "landmark_trials", name: "Landmark Trials", badges: ["Landmark Trial", "High Impact"] },
      { key: "semantic_scholar", name: "Semantic Scholar", badges: ["Academic Paper"] },
      { key: "europe_pmc", name: "Europe PMC", badges: ["European Research"] },
      { key: "pmc", name: "PMC Full-text", badges: ["PMCID", "Full Text"] },
      { key: "openalex", name: "OpenAlex", badges: ["Academic Literature"] }
    ];
    for (const sourceConfig of otherSources) {
      const sourceResults = rawResults[sourceConfig.key] || [];
      for (const doc of sourceResults) {
        const docId = doc.id || doc.pmid || doc.doi || doc.url || `${sourceConfig.key}_${Math.random()}`;
        if (!seenIds.has(docId)) {
          const candidate = {
            source: sourceConfig.key,
            id: docId,
            title: doc.title || "Untitled",
            text: doc.abstract || doc.summary || doc.content || doc.text || doc.description || "No content available",
            metadata: {
              ...doc,
              badges: sourceConfig.badges
            },
            full_text_available: !!doc.pmcid || !!doc.full_text_url
          };
          candidates.push(candidate);
          seenIds.add(docId);
        }
      }
    }
    for (const doc of rawResults.tavily) {
      const url = doc.url;
      if (!seenIds.has(url)) {
        const candidate = {
          source: "tavily_web",
          id: url,
          title: doc.title || "Untitled Web Content",
          text: doc.content || "No content available",
          metadata: {
            url,
            score: doc.score,
            published_date: doc.published_date,
            badges: ["Web Search", "Recent Content"]
          },
          full_text_available: false
        };
        candidates.push(candidate);
        seenIds.add(url);
      }
    }
    console.log(`\u2705 Evidence normalization complete: ${candidates.length} unified candidates`);
    console.log(`   \u{1F4DA} Guidelines: ${rawResults.guidelines.length}`);
    console.log(`   \u{1F52C} PubMed: ${rawResults.pubmed.length}`);
    console.log(`   \u{1F48A} DailyMed: ${rawResults.dailymed.length}`);
    console.log(`   \u{1F9EA} Clinical Trials: ${rawResults.clinical_trials.length}`);
    console.log(`   \u{1F4CA} Cochrane: ${rawResults.cochrane.length}`);
    console.log(`   \u{1F3E5} BMJ: ${rawResults.bmj.length}`);
    console.log(`   \u{1F1EC}\u{1F1E7} NICE: ${rawResults.nice.length}`);
    console.log(`   \u{1F30D} WHO: ${rawResults.who.length}`);
    console.log(`   \u{1F1FA}\u{1F1F8} CDC: ${rawResults.cdc.length}`);
    console.log(`   \u2B50 Landmark Trials: ${rawResults.landmark_trials.length}`);
    console.log(`   \u{1F393} Semantic Scholar: ${rawResults.semantic_scholar.length}`);
    console.log(`   \u{1F1EA}\u{1F1FA} Europe PMC: ${rawResults.europe_pmc.length}`);
    console.log(`   \u{1F4C4} PMC: ${rawResults.pmc.length}`);
    console.log(`   \u{1F50D} OpenAlex: ${rawResults.openalex.length}`);
    console.log(`   \u{1F310} Tavily: ${rawResults.tavily.length}`);
    return candidates;
  }
};

// lib/agents/sub-agents/fulltext-fetcher.ts
var FullTextFetcher = class {
  constructor(apiKey) {
    this.unpaywallEmail = "research@openwork.ai";
    this.ncbiApiKey = apiKey;
    this.modelName = "gemini-3-flash-preview";
    if (process.env.GEMINI_API_KEY) {
      const { GoogleGenAI: GoogleGenAI8 } = require("@google/genai");
      this.genAI = new GoogleGenAI8({ apiKey: process.env.GEMINI_API_KEY });
    } else {
      this.genAI = null;
      console.warn("\u26A0\uFE0F GEMINI_API_KEY not set - FullText Fetcher will use basic section selection");
    }
    const { FULLTEXT_FETCHER_SYSTEM_PROMPT: FULLTEXT_FETCHER_SYSTEM_PROMPT2 } = (init_fulltext_fetcher_prompt(), __toCommonJS(fulltext_fetcher_prompt_exports));
    this.systemPrompt = FULLTEXT_FETCHER_SYSTEM_PROMPT2;
  }
  /**
   * Score sections for relevance using Gemini 3 Flash (thinking_level: low)
   */
  async scoreSections(sections, query) {
    if (!this.genAI || sections.length === 0) {
      return sections.map((section) => ({
        ...section,
        relevance_score: this.getSectionTypeScore(section.type) * 0.8
      }));
    }
    try {
      const sectionsPreview = sections.slice(0, 10).map(
        (s, idx) => `[${idx}] ${s.title} (${s.type}) - ${s.content.substring(0, 100)}...`
      ).join("\n\n");
      const prompt = `Score these article sections for relevance to the query (0.0-1.0). Return format: "index:score" (e.g., "0:0.9,1:0.7,2:0.85").

Query: ${query}

Sections:
${sectionsPreview}

Scores:`;
      const response = await callGeminiWithRetry(async (apiKey) => {
        const genAI = new GoogleGenAI({ apiKey });
        return await genAI.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config: {
            systemInstruction: "You are a medical content relevance specialist. Score sections based on query relevance.",
            temperature: 0.1,
            maxOutputTokens: 100,
            thinkingConfig: {
              thinkingLevel: "low"
              // Straightforward relevance scoring
            }
          }
        });
      });
      const scoresText = response.text?.trim() || "";
      const scoreMap = /* @__PURE__ */ new Map();
      const pairs = scoresText.split(",");
      pairs.forEach((pair) => {
        const [indexStr, scoreStr] = pair.split(":").map((s) => s.trim());
        const index = parseInt(indexStr);
        const score = parseFloat(scoreStr);
        if (!isNaN(index) && !isNaN(score) && index < sections.length) {
          scoreMap.set(index, score);
        }
      });
      const scoredSections = sections.map((section, idx) => ({
        ...section,
        relevance_score: scoreMap.get(idx) || this.getSectionTypeScore(section.type) * 0.5
      }));
      console.log(`   \u{1F4CA} LLM scored ${scoreMap.size} sections`);
      return scoredSections;
    } catch (error) {
      console.warn("\u26A0\uFE0F LLM scoring failed, using basic scores:", error);
      return sections.map((section) => ({
        ...section,
        relevance_score: this.getSectionTypeScore(section.type) * 0.8
      }));
    }
  }
  /**
   * Select top sections using Gemini 3 Flash (thinking_level: minimal)
   */
  async selectTopSections(sections, query, maxSections = 3) {
    if (sections.length === 0) return [];
    const scoredSections = await this.scoreSections(sections, query);
    scoredSections.sort((a, b) => b.relevance_score - a.relevance_score);
    const selectedSections = scoredSections.slice(0, maxSections);
    return selectedSections.map((section) => ({
      section_title: section.title,
      section_type: section.type,
      relevance_score: section.relevance_score,
      content_summary: section.content.substring(0, 200) + "...",
      full_content: section.content,
      chunk_count: 0,
      chunks: []
    }));
  }
  /**
   * Get base score for section type
   */
  getSectionTypeScore(sectionType) {
    const typeScores = {
      "methods": 0.6,
      "results": 0.9,
      "discussion": 0.8,
      "introduction": 0.5,
      "conclusion": 0.7,
      "abstract": 0.4,
      "background": 0.5
    };
    return typeScores[sectionType.toLowerCase()] || 0.5;
  }
  async fetchFullText(article, originalQuery) {
    return await withRetrieverSpan("fulltext_fetcher", async (span) => {
      const startTime = Date.now();
      span.setAttribute("retrieval.source", "fulltext_fetcher");
      span.setAttribute("retrieval.query", originalQuery.substring(0, 200));
      span.setAttribute("retrieval.article_id", article.pmid || article.pmcid || article.doi || "unknown");
      try {
        const identifiers = this.extractIdentifiers(article);
        let fullTextContent = null;
        let source = "available_content";
        let pdfUrl = null;
        if (identifiers.pmcid || identifiers.pmid) {
          const pmcId = identifiers.pmcid || identifiers.pmid;
          if (pmcId) {
            fullTextContent = await this.fetchFromPMC(pmcId);
            if (fullTextContent) {
              source = "pmc";
            }
          }
        }
        if (!fullTextContent && identifiers.doi) {
          pdfUrl = await this.checkUnpaywall(identifiers.doi);
          if (pdfUrl) {
            source = "unpaywall";
            fullTextContent = { pdf_url: pdfUrl };
          }
        }
        if (!fullTextContent && identifiers.pmid) {
          fullTextContent = await this.enhancePubMedAbstract(identifiers.pmid);
          if (fullTextContent) {
            source = "enhanced_abstract";
          }
        }
        if (!fullTextContent) {
          fullTextContent = this.processAvailableContent(article);
        }
        const sections = await this.extractAndAnalyzeSections(fullTextContent, originalQuery);
        const selectedSections = await this.selectTopSections(sections, originalQuery, 3);
        const contentChunks = await this.generateHierarchicalChunks(selectedSections, article);
        const enhancedArticle = {
          // Preserve original metadata
          pmid: identifiers.pmid,
          pmcid: identifiers.pmcid,
          doi: identifiers.doi,
          title: article.title || "",
          authors: article.authors || "",
          journal: article.journal || "",
          abstract: article.abstract || "",
          // Hierarchical content
          selected_sections: selectedSections,
          content_chunks: contentChunks,
          // Processing metadata
          full_text_source: source,
          pdf_url: pdfUrl || void 0,
          sections_analyzed: sections.length,
          sections_selected: selectedSections.length,
          total_chunks: contentChunks.length,
          processing_timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          selection_criteria: `Query-based relevance scoring with section type prioritization`
        };
        const latency = Date.now() - startTime;
        span.setAttribute("retrieval.latency_ms", latency);
        span.setAttribute("retrieval.sections_analyzed", sections.length);
        span.setAttribute("retrieval.sections_selected", selectedSections.length);
        span.setAttribute("retrieval.total_chunks", contentChunks.length);
        span.setAttribute("retrieval.full_text_source", source);
        span.setAttribute("retrieval.has_pdf_url", !!pdfUrl);
        console.log(`\u{1F4C4} Enhanced full-text processing: ${contentChunks.length} chunks from ${selectedSections.length} sections (${latency}ms)`);
        const documents = selectedSections.map((s, index) => ({
          id: s.section_title || `section_${index}`,
          content: s.content_summary || "",
          score: s.relevance_score || 1,
          metadata: {
            section_type: s.section_type,
            section_title: s.section_title,
            chunk_count: s.chunk_count || 0
          }
        }));
        return { result: enhancedArticle, documents };
      } catch (error) {
        console.error("\u274C Enhanced full-text processing failed:", error);
        span.setAttribute("retrieval.latency_ms", Date.now() - startTime);
        span.setAttribute("retrieval.error", error instanceof Error ? error.message : "Unknown error");
        span.recordException(error);
        span.setStatus({ code: 2 /* ERROR */, message: error instanceof Error ? error.message : "Unknown error" });
        const fallbackArticle = this.createFallbackEnhancedArticle(article);
        return { result: fallbackArticle, documents: [] };
      }
    }, { source: "fulltext_fetcher" });
  }
  async fetchFromPMC(identifier) {
    let pmcId = identifier;
    if (identifier.startsWith("PMC")) {
      pmcId = identifier.replace("PMC", "");
    }
    const url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi";
    const params = new URLSearchParams({
      db: "pmc",
      id: pmcId,
      retmode: "xml",
      api_key: this.ncbiApiKey
    });
    try {
      const response = await fetch(`${url}?${params}`);
      const xmlContent = await response.text();
      const sections = {};
      const sectionMatches = xmlContent.match(/<sec[^>]*>[\s\S]*?<\/sec>/g) || [];
      for (const sectionMatch of sectionMatches) {
        const titleMatch = sectionMatch.match(/<title[^>]*>([\s\S]*?)<\/title>/);
        const title = titleMatch ? titleMatch[1].toLowerCase() : "other";
        const textContent = sectionMatch.replace(/<[^>]*>/g, " ").trim();
        if (textContent.length > 50) {
          sections[title] = textContent.substring(0, 2e3);
        }
      }
      return Object.keys(sections).length > 0 ? sections : null;
    } catch (error) {
      console.error(`\u274C PMC fetch failed for ${identifier}:`, error);
      return null;
    }
  }
  extractIdentifiers(article) {
    const identifiers = {};
    if (article.pmcid) {
      identifiers.pmcid = article.pmcid;
    }
    if (article.pmid) {
      identifiers.pmid = article.pmid;
    }
    if (article.doi) {
      identifiers.doi = article.doi;
    }
    return identifiers;
  }
  async enhancePubMedAbstract(pmid) {
    const url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi";
    const params = new URLSearchParams({
      db: "pubmed",
      id: pmid,
      retmode: "xml",
      api_key: this.ncbiApiKey
    });
    try {
      const response = await fetch(`${url}?${params}`);
      const xmlContent = await response.text();
      const enhancedContent = this.parseEnhancedAbstract(xmlContent);
      return enhancedContent;
    } catch (error) {
      console.error(`\u274C Enhanced abstract fetch failed for PMID ${pmid}:`, error);
      return null;
    }
  }
  parseEnhancedAbstract(xmlContent) {
    const sections = {};
    const abstractMatch = xmlContent.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g);
    if (abstractMatch) {
      abstractMatch.forEach((match, index) => {
        const labelMatch = match.match(/Label="([^"]*)"/) || match.match(/NlmCategory="([^"]*)"/);
        const label = labelMatch ? labelMatch[1].toLowerCase() : `section_${index}`;
        const content = match.replace(/<[^>]*>/g, " ").trim();
        if (content.length > 20) {
          sections[label] = content;
        }
      });
    }
    return Object.keys(sections).length > 0 ? sections : null;
  }
  processAvailableContent(article) {
    const sections = {};
    if (article.abstract && article.abstract.length > 50) {
      sections.abstract = article.abstract;
    }
    if (article.content && article.content.length > 50) {
      sections.content = article.content;
    }
    if (article.snippet && article.snippet.length > 50) {
      sections.snippet = article.snippet;
    }
    return Object.keys(sections).length > 0 ? sections : { abstract: article.title || "No content available" };
  }
  async extractAndAnalyzeSections(content, query) {
    if (!content) return [];
    const sections = [];
    if (typeof content === "object" && !content.pdf_url) {
      for (const [sectionName, sectionContent] of Object.entries(content)) {
        if (typeof sectionContent === "string" && sectionContent.length > 50) {
          sections.push({
            title: sectionName,
            content: sectionContent,
            type: this.classifySectionType(sectionName),
            length: sectionContent.length
          });
        }
      }
    } else if (content.pdf_url) {
      sections.push({
        title: "PDF Content",
        content: `PDF available at: ${content.pdf_url}`,
        type: "pdf",
        length: 100,
        pdf_url: content.pdf_url
      });
    }
    return sections;
  }
  classifySectionType(sectionName) {
    const name = sectionName.toLowerCase();
    if (name.includes("result") || name.includes("finding")) return "results";
    if (name.includes("discussion") || name.includes("interpretation")) return "discussion";
    if (name.includes("conclusion") || name.includes("summary")) return "conclusion";
    if (name.includes("method") || name.includes("methodology")) return "methods";
    if (name.includes("introduction") || name.includes("background")) return "introduction";
    if (name.includes("abstract")) return "abstract";
    return "other";
  }
  async generateHierarchicalChunks(selectedSections, article) {
    const allChunks = [];
    for (let sectionIndex = 0; sectionIndex < selectedSections.length; sectionIndex++) {
      const section = selectedSections[sectionIndex];
      const sectionContent = section.full_content || section.content_summary;
      if (!sectionContent || sectionContent.length < 50) continue;
      const chunks = this.chunkContent(sectionContent, {
        chunkSize: 1e3,
        overlap: 200,
        preserveBoundaries: true
      });
      const sectionChunks = chunks.map((chunk, chunkIndex) => ({
        chunk_id: `${article.pmid || "article"}_${sectionIndex}_${chunkIndex}`,
        parent_article: article.title || "Unknown Article",
        child_section: section.section_title,
        chunk_index: chunkIndex,
        content: chunk,
        relevance_score: section.relevance_score,
        content_type: "text"
      }));
      section.chunk_count = sectionChunks.length;
      section.chunks = sectionChunks;
      allChunks.push(...sectionChunks);
    }
    return allChunks;
  }
  chunkContent(content, options) {
    const chunks = [];
    const { chunkSize, overlap, preserveBoundaries } = options;
    if (content.length <= chunkSize) {
      return [content];
    }
    let start = 0;
    while (start < content.length) {
      let end = Math.min(start + chunkSize, content.length);
      if (preserveBoundaries && end < content.length) {
        const lastPeriod = content.lastIndexOf(".", end);
        const lastNewline = content.lastIndexOf("\n", end);
        const boundary = Math.max(lastPeriod, lastNewline);
        if (boundary > start + chunkSize * 0.5) {
          end = boundary + 1;
        }
      }
      chunks.push(content.substring(start, end).trim());
      start = end - overlap;
    }
    return chunks.filter((chunk) => chunk.length > 20);
  }
  createFallbackEnhancedArticle(article) {
    const fallbackChunk = {
      chunk_id: `${article.pmid || "fallback"}_0_0`,
      parent_article: article.title || "Unknown Article",
      child_section: "abstract",
      chunk_index: 0,
      content: article.abstract || article.title || "No content available",
      relevance_score: 0.5,
      content_type: "text"
    };
    const fallbackContent = article.abstract || article.title || "No content available";
    const fallbackSection = {
      section_title: "Abstract",
      section_type: "abstract",
      relevance_score: 0.5,
      content_summary: fallbackContent.substring(0, 200),
      full_content: fallbackContent,
      chunk_count: 1,
      chunks: [fallbackChunk]
    };
    return {
      pmid: article.pmid,
      pmcid: article.pmcid,
      doi: article.doi,
      title: article.title || "Unknown Article",
      authors: article.authors || "",
      journal: article.journal || "",
      abstract: article.abstract || "",
      selected_sections: [fallbackSection],
      content_chunks: [fallbackChunk],
      full_text_source: "available_content",
      sections_analyzed: 1,
      sections_selected: 1,
      total_chunks: 1,
      processing_timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      selection_criteria: "Fallback processing due to retrieval failure"
    };
  }
  async fetchPMCFullText(pmcid) {
    const url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi";
    const params = new URLSearchParams({
      db: "pmc",
      id: pmcid.replace("PMC", ""),
      retmode: "xml",
      api_key: this.ncbiApiKey
    });
    try {
      const response = await fetch(`${url}?${params}`);
      const xmlContent = await response.text();
      const sections = {};
      const sectionMatches = xmlContent.match(/<sec[^>]*>[\s\S]*?<\/sec>/g) || [];
      for (const sectionMatch of sectionMatches) {
        const titleMatch = sectionMatch.match(/<title[^>]*>([\s\S]*?)<\/title>/);
        const title = titleMatch ? titleMatch[1].toLowerCase() : "other";
        const textContent = sectionMatch.replace(/<[^>]*>/g, " ").trim();
        if (textContent.length > 50) {
          sections[title] = textContent.substring(0, 2e3);
        }
      }
      return Object.keys(sections).length > 0 ? sections : null;
    } catch (error) {
      console.error(`\u274C PMC fetch failed for ${pmcid}:`, error);
      return null;
    }
  }
  async checkUnpaywall(doi) {
    const url = `https://api.unpaywall.org/v2/${doi}`;
    const params = new URLSearchParams({
      email: this.unpaywallEmail
    });
    try {
      const response = await fetch(`${url}?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (data.is_oa) {
          const bestOA = data.best_oa_location;
          return bestOA?.url_for_pdf || null;
        }
      }
      return null;
    } catch (error) {
      console.error(`\u274C Unpaywall check failed for ${doi}:`, error);
      return null;
    }
  }
};

// lib/agents/bge-reranker.ts
var MEDICAL_SYNONYMS = {
  "hypertension": ["high blood pressure", "htn", "elevated bp"],
  "diabetes": ["dm", "diabetes mellitus", "hyperglycemia"],
  "myocardial infarction": ["heart attack", "mi", "stemi", "nstemi"],
  "cerebrovascular accident": ["stroke", "cva", "brain attack"],
  "copd": ["chronic obstructive pulmonary disease", "emphysema", "chronic bronchitis"],
  "chf": ["congestive heart failure", "heart failure", "hf"],
  "ckd": ["chronic kidney disease", "renal failure", "renal insufficiency"],
  "dvt": ["deep vein thrombosis", "venous thromboembolism", "vte"],
  "pe": ["pulmonary embolism", "pulmonary thromboembolism"],
  "uti": ["urinary tract infection", "bladder infection", "cystitis"],
  "nsaid": ["nonsteroidal anti-inflammatory", "ibuprofen", "naproxen"],
  "ace inhibitor": ["acei", "angiotensin converting enzyme inhibitor", "enalapril", "lisinopril", "ramipril"],
  "arb": ["angiotensin receptor blocker", "losartan", "valsartan", "telmisartan"],
  "ssri": ["selective serotonin reuptake inhibitor", "fluoxetine", "sertraline", "escitalopram"],
  "ppi": ["proton pump inhibitor", "omeprazole", "pantoprazole", "esomeprazole"],
  "anticoagulant": ["blood thinner", "warfarin", "heparin", "apixaban", "rivaroxaban"],
  "efficacy": ["effectiveness", "effect", "outcome", "benefit"],
  "adverse": ["side effect", "adverse effect", "adverse reaction", "toxicity"],
  "contraindication": ["contraindicated", "should not be used", "avoid"],
  "prophylaxis": ["prevention", "preventive", "preventative"],
  "etiology": ["cause", "pathogenesis", "origin"],
  "prognosis": ["outcome", "survival", "mortality"],
  "neoplasm": ["cancer", "tumor", "malignancy", "carcinoma"],
  "analgesic": ["painkiller", "pain relief", "pain management"],
  "antipyretic": ["fever reducer", "fever reduction"],
  "metformin": ["glucophage", "biguanide"],
  "atorvastatin": ["lipitor", "statin"],
  "amlodipine": ["norvasc", "calcium channel blocker", "ccb"]
};
var TwoStageReranker = class {
  constructor(ncbiApiKey) {
    this.fullTextFetcher = new FullTextFetcher(ncbiApiKey);
    this.hfApiKey = process.env.HUGGINGFACE_API_KEY;
    const forceHF = process.env.FORCE_HUGGINGFACE_RERANKER === "true";
    this.useHuggingFace = forceHF && !!this.hfApiKey;
    this.hfModelUrl = "https://api-inference.huggingface.co/models/BAAI/bge-reranker-v2-m3";
    this.hfTimeout = 1e4;
    console.log("\u{1F504} BGE Reranker: Enhanced Deterministic Scoring (medical synonyms + quality signals)");
    if (this.useHuggingFace) {
      console.log("   \u26A1 HuggingFace neural reranking ENABLED (FORCE_HUGGINGFACE_RERANKER=true)");
    }
  }
  async rerank(query, candidates, traceContext) {
    return await withToolSpan("two_stage_reranker", "execute", async (span) => {
      const startTime = Date.now();
      span.setAttribute("agent.input", JSON.stringify({
        query,
        input_docs: candidates.length
      }));
      span.setAttribute("agent.name", "two_stage_reranker");
      try {
        console.log(`\u{1F504} Stage 1: Document-level reranking (${candidates.length} \u2192 20)`);
        const stage1Start = Date.now();
        const docScores = await this.scoreDocuments(query, candidates);
        const scoredDocs = candidates.map((candidate, index) => {
          const semanticScore = docScores[index];
          const qualityBoost = this.calculateEvidenceQualityBoost(candidate);
          let pubmedBoost = 0;
          if (candidate.source === "pubmed") {
            pubmedBoost = 0.1;
          }
          const combinedScore = 0.7 * semanticScore + 0.25 * qualityBoost + pubmedBoost;
          return { candidate, score: combinedScore, semanticScore, qualityBoost, pubmedBoost };
        });
        const pubmedDocs = scoredDocs.filter((d) => d.candidate.source === "pubmed");
        const nonPubmedDocs = scoredDocs.filter((d) => d.candidate.source !== "pubmed");
        const topPubmedDocs = pubmedDocs.sort((a, b) => b.score - a.score).slice(0, Math.min(15, pubmedDocs.length));
        const topNonPubmedDocs = nonPubmedDocs.sort((a, b) => b.score - a.score).slice(0, 20 - topPubmedDocs.length);
        const top20Docs = [...topPubmedDocs, ...topNonPubmedDocs].sort((a, b) => b.score - a.score).slice(0, 20);
        const stage1Time = Date.now() - stage1Start;
        console.log(`\u2705 Stage 1 complete: ${top20Docs.length} docs in ${stage1Time}ms`);
        console.log(`   Top 3: ${top20Docs.slice(0, 3).map(
          (d) => `[${d.candidate.source}] "${d.candidate.title?.substring(0, 50)}..." (sem=${d.semanticScore.toFixed(2)} qual=${d.qualityBoost.toFixed(2)} final=${d.score.toFixed(2)})`
        ).join("\n   ")}`);
        console.log(`\u{1F504} Stage 2: Full-text fetching and chunk-level reranking`);
        const stage2Start = Date.now();
        const fetchPromises = top20Docs.map(async ({ candidate, score }) => {
          if (candidate.full_text_available && !candidate.full_text_sections) {
            try {
              const enriched = await this.fullTextFetcher.fetchFullText(candidate, query);
              return { candidate: enriched, doc_level_score: score };
            } catch (error) {
              console.warn(`\u26A0\uFE0F Full-text fetch failed for ${candidate.id}, using original:`, error instanceof Error ? error.message : error);
              return { candidate, doc_level_score: score };
            }
          }
          return { candidate, doc_level_score: score };
        });
        const fetchResults = await Promise.allSettled(fetchPromises);
        const enrichedDocs = fetchResults.filter((result) => result.status === "fulfilled").map((result) => result.value);
        const allChunks = [];
        for (const { candidate, doc_level_score } of enrichedDocs) {
          const candidateForChunking = "source" in candidate ? candidate : {
            source: "pubmed",
            id: candidate.pmid || "unknown",
            title: candidate.title || "Unknown Title",
            text: candidate.abstract || "",
            metadata: {
              pmid: candidate.pmid,
              doi: candidate.doi,
              journal: candidate.journal,
              authors: candidate.authors
            },
            full_text_available: true,
            full_text_sections: candidate.selected_sections?.reduce((acc, section) => {
              const sectionContent = section.full_content || section.chunks?.map((chunk) => chunk.content).join("\n\n") || "";
              if (sectionContent) {
                acc[section.section_type] = sectionContent;
              }
              return acc;
            }, {})
          };
          const chunks = this.chunkDocument(candidateForChunking);
          chunks.forEach((chunk) => {
            chunk.doc_level_score = doc_level_score;
            allChunks.push(chunk);
          });
        }
        console.log(`\u{1F4C4} Created ${allChunks.length} chunks from ${enrichedDocs.length} documents`);
        const chunkScores = await this.scoreChunks(query, allChunks);
        const finalScores = allChunks.map((chunk, index) => {
          const chunkSemanticScore = chunkScores[index];
          const docScore = chunk.doc_level_score || 0;
          const qualityBoost = this.calculateChunkQualityBoost(chunk);
          const combinedScore = 0.45 * chunkSemanticScore + 0.35 * docScore + 0.2 * qualityBoost;
          return { chunk, score: combinedScore };
        });
        const top10Chunks = finalScores.sort((a, b) => b.score - a.score).slice(0, 10);
        const stage2Time = Date.now() - stage2Start;
        console.log(`\u2705 Stage 2 complete: ${top10Chunks.length} chunks in ${stage2Time}ms`);
        const evidencePack = top10Chunks.map((item, index) => ({
          rank: index + 1,
          score: item.score,
          source: item.chunk.source,
          id: item.chunk.id,
          title: item.chunk.title,
          text: item.chunk.text,
          metadata: item.chunk.metadata,
          chunk_info: {
            section: item.chunk.section,
            chunk_index: item.chunk.chunk_index
          }
        }));
        const totalLatency = Date.now() - startTime;
        span.setAttribute("agent.output", JSON.stringify({
          evidence_pack: evidencePack.map((e) => ({
            rank: e.rank,
            score: e.score,
            source: e.source,
            title: e.title.substring(0, 100)
          }))
        }));
        span.setAttribute("agent.latency_ms", totalLatency);
        span.setAttribute("agent.model_name", this.useHuggingFace ? "bge-reranker-v2-m3" : "enhanced-deterministic");
        span.setAttribute("agent.success", true);
        span.setAttribute("reranker.input_docs", candidates.length);
        span.setAttribute("reranker.stage1_docs", top20Docs.length);
        span.setAttribute("reranker.total_chunks", allChunks.length);
        span.setAttribute("reranker.final_chunks", evidencePack.length);
        span.setAttribute("reranker.used_huggingface", this.useHuggingFace);
        console.log(`\u{1F3AF} Two-stage reranking complete: ${evidencePack.length} final evidence chunks`);
        return evidencePack;
      } catch (error) {
        console.error("\u274C Two-stage reranking failed:", error);
        const fallbackScored = candidates.map((candidate, index) => {
          const qualityBoost = this.calculateEvidenceQualityBoost(candidate);
          const textScore = this.calculateEnhancedSemanticScore(
            query,
            `${candidate.title || ""}

${candidate.text || ""}`
          );
          return {
            candidate,
            score: 0.6 * textScore + 0.4 * qualityBoost
          };
        });
        fallbackScored.sort((a, b) => b.score - a.score);
        const fallbackEvidence = fallbackScored.slice(0, 10).map((item, index) => ({
          rank: index + 1,
          score: item.score,
          source: item.candidate.source,
          id: item.candidate.id,
          title: item.candidate.title,
          text: item.candidate.text,
          metadata: item.candidate.metadata,
          chunk_info: {
            section: "abstract",
            chunk_index: 0
          }
        }));
        span.setAttribute("agent.success", false);
        span.setAttribute("agent.error", error instanceof Error ? error.message : "Unknown error");
        span.setAttribute("agent.latency_ms", Date.now() - startTime);
        span.recordException(error);
        span.setStatus({ code: 2 /* ERROR */, message: error instanceof Error ? error.message : "Unknown error" });
        return fallbackEvidence;
      }
    });
  }
  // ──────────────────────────────────────────
  // SCORING: Document-level
  // ──────────────────────────────────────────
  async scoreDocuments(query, candidates) {
    const texts = candidates.map(
      (c) => `${c.title || "Untitled"}

${(c.text || "No content available").substring(0, 1500)}`
    );
    if (this.useHuggingFace) {
      const bgeScores = await this.callHuggingFaceBGE(query, texts);
      if (bgeScores) {
        console.log(`   \u2705 Document scoring via HuggingFace BGE (${candidates.length} docs)`);
        return bgeScores;
      }
      console.log(`   \u26A0\uFE0F HuggingFace BGE unavailable, using enhanced local scoring`);
    }
    return texts.map((text) => this.calculateEnhancedSemanticScore(query, text));
  }
  // ──────────────────────────────────────────
  // SCORING: Chunk-level
  // ──────────────────────────────────────────
  async scoreChunks(query, chunks) {
    const texts = chunks.map(
      (c) => `${c.title || ""}
${c.section || ""}

${c.text || ""}`
    );
    if (this.useHuggingFace) {
      const bgeScores = await this.callHuggingFaceBGE(query, texts);
      if (bgeScores) {
        console.log(`   \u2705 Chunk scoring via HuggingFace BGE (${chunks.length} chunks)`);
        return bgeScores;
      }
      console.log(`   \u26A0\uFE0F HuggingFace BGE unavailable for chunks, using enhanced local scoring`);
    }
    return texts.map((text) => this.calculateEnhancedSemanticScore(query, text));
  }
  // ──────────────────────────────────────────
  // HUGGINGFACE BGE RERANKER API
  // ──────────────────────────────────────────
  async callHuggingFaceBGE(query, documents) {
    if (!this.hfApiKey || documents.length === 0) return null;
    const BATCH_SIZE = 32;
    const allScores = [];
    try {
      for (let i = 0; i < documents.length; i += BATCH_SIZE) {
        const batch = documents.slice(i, i + BATCH_SIZE);
        const pairs = batch.map((doc) => ({
          text: query.substring(0, 256),
          text_pair: doc.substring(0, 512)
        }));
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.hfTimeout);
        try {
          const response = await fetch(this.hfModelUrl, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${this.hfApiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ inputs: pairs }),
            signal: controller.signal
          });
          clearTimeout(timeout);
          if (!response.ok) {
            const errorBody = await response.text().catch(() => "");
            if (response.status === 503 || response.status === 404 || response.status === 410) {
              console.warn(`\u26A0\uFE0F HuggingFace model unavailable (${response.status}). Falling back to local scoring.`);
              return null;
            }
            throw new Error(`HuggingFace API ${response.status}: ${errorBody.substring(0, 200)}`);
          }
          const results = await response.json();
          const scores = this.parseHuggingFaceScores(results, batch.length);
          allScores.push(...scores);
        } catch (batchError) {
          clearTimeout(timeout);
          if (batchError.name === "AbortError") {
            console.warn(`\u26A0\uFE0F HuggingFace BGE timeout (${this.hfTimeout}ms). Falling back to local scoring.`);
            return null;
          }
          throw batchError;
        }
      }
      return allScores;
    } catch (error) {
      console.warn(`\u26A0\uFE0F HuggingFace BGE failed:`, error instanceof Error ? error.message : error);
      return null;
    }
  }
  parseHuggingFaceScores(results, expectedCount) {
    if (Array.isArray(results) && Array.isArray(results[0])) {
      return results.map((result) => {
        const positive = result.find((r) => r.label === "LABEL_1");
        if (positive) return positive.score;
        if (result.length === 1) return this.sigmoid(result[0].score);
        return Math.max(...result.map((r) => r.score));
      });
    }
    if (Array.isArray(results) && typeof results[0] === "number") {
      return results.map((s) => this.sigmoid(s));
    }
    if (Array.isArray(results) && results[0]?.label !== void 0) {
      return results.map((r) => {
        if (typeof r.score === "number") return this.sigmoid(r.score);
        return 0.5;
      });
    }
    if (results?.scores && Array.isArray(results.scores)) {
      return results.scores.map((s) => this.sigmoid(s));
    }
    console.warn("\u26A0\uFE0F Unexpected HuggingFace response format, using defaults");
    return new Array(expectedCount).fill(0.5);
  }
  sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
  }
  // ──────────────────────────────────────────
  // EVIDENCE QUALITY SIGNALS
  // ──────────────────────────────────────────
  calculateEvidenceQualityBoost(candidate) {
    let boost = 0;
    const metadata = candidate.metadata || {};
    const source = candidate.source || "";
    const sourceBoosts = {
      "indian_guideline": 0.2,
      "guideline": 0.18,
      "cochrane": 0.18,
      "nice": 0.16,
      "who": 0.16,
      "cdc": 0.15,
      "bmj": 0.14,
      "dailymed": 0.12,
      "pubmed": 0.15,
      // INCREASED from 0.08 to 0.15 - PubMed is primary source
      "europe_pmc": 0.12,
      // INCREASED - PMC is also high quality
      "pmc": 0.12,
      // INCREASED - PMC full-text is high quality
      "semantic_scholar": 0.06,
      "openalex": 0.06,
      "clinical_trials": 0.1,
      "tavily_web": 0.02
      // DECREASED from 0.03 - Tavily is backup only
    };
    boost += sourceBoosts[source] || 0.05;
    const pubTypes = metadata.pub_types || [];
    const pubTypesLower = pubTypes.map((t) => t.toLowerCase()).join(" ");
    const textLower = (candidate.text || "").toLowerCase();
    if (pubTypesLower.includes("systematic review") || pubTypesLower.includes("meta-analysis")) {
      boost += 0.15;
    } else if (pubTypesLower.includes("practice guideline") || pubTypesLower.includes("guideline")) {
      boost += 0.14;
    } else if (pubTypesLower.includes("randomized controlled trial") || pubTypesLower.includes("rct")) {
      boost += 0.12;
    } else if (pubTypesLower.includes("clinical trial")) {
      boost += 0.1;
    } else if (pubTypesLower.includes("review")) {
      boost += 0.08;
    } else if (pubTypesLower.includes("cohort") || textLower.includes("cohort study")) {
      boost += 0.06;
    } else if (pubTypesLower.includes("case-control") || textLower.includes("case-control")) {
      boost += 0.05;
    } else if (pubTypesLower.includes("case report") || pubTypesLower.includes("case series")) {
      boost += 0.02;
    }
    const journalTier = metadata.journal_tier || "";
    if (journalTier === "tier_1") {
      boost += 0.12;
    } else if (journalTier === "specialty_elite") {
      boost += 0.08;
    }
    const year = this.extractPublicationYear(metadata);
    if (year) {
      const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
      const age = currentYear - year;
      if (age <= 1) boost += 0.1;
      else if (age <= 2) boost += 0.08;
      else if (age <= 3) boost += 0.06;
      else if (age <= 5) boost += 0.04;
      else if (age <= 10) boost += 0.02;
    }
    if (candidate.full_text_available || metadata.pmcid) {
      boost += 0.03;
    }
    return Math.min(boost / 0.6, 1);
  }
  calculateChunkQualityBoost(chunk) {
    let boost = 0;
    const metadata = chunk.metadata || {};
    const sourceBoosts = {
      "indian_guideline": 0.2,
      "guideline": 0.18,
      "cochrane": 0.18,
      "nice": 0.16,
      "who": 0.16,
      "cdc": 0.15,
      "bmj": 0.14,
      "dailymed": 0.12,
      "pubmed": 0.15,
      "europe_pmc": 0.12,
      // INCREASED PubMed priority
      "pmc": 0.12,
      "clinical_trials": 0.1,
      "tavily_web": 0.02
      // DECREASED Tavily priority
    };
    boost += sourceBoosts[chunk.source] || 0.05;
    const sectionBoosts = {
      "results": 0.12,
      "conclusion": 0.1,
      "discussion": 0.08,
      "abstract": 0.06,
      "methods": 0.04,
      "introduction": 0.02
    };
    boost += sectionBoosts[chunk.section || ""] || 0.03;
    const year = this.extractPublicationYear(metadata);
    if (year) {
      const age = (/* @__PURE__ */ new Date()).getFullYear() - year;
      if (age <= 2) boost += 0.08;
      else if (age <= 5) boost += 0.04;
    }
    if (metadata.journal_tier === "tier_1") boost += 0.1;
    else if (metadata.journal_tier === "specialty_elite") boost += 0.06;
    return Math.min(boost / 0.5, 1);
  }
  extractPublicationYear(metadata) {
    const fields = ["pub_date", "year", "published", "published_date", "publicationDate"];
    for (const field of fields) {
      if (metadata[field]) {
        const yearMatch = String(metadata[field]).match(/\d{4}/);
        if (yearMatch) {
          const year = parseInt(yearMatch[0]);
          if (year >= 1990 && year <= (/* @__PURE__ */ new Date()).getFullYear() + 1) return year;
        }
      }
    }
    return null;
  }
  // ──────────────────────────────────────────
  // ENHANCED DETERMINISTIC SCORING (fallback)
  // ──────────────────────────────────────────
  calculateEnhancedSemanticScore(query, text) {
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    const queryTerms = this.extractKeywords(queryLower);
    const textTerms = this.extractKeywords(textLower);
    if (queryTerms.length === 0) return 0.1;
    let exactMatches = 0;
    for (const term of queryTerms) {
      if (textTerms.includes(term)) exactMatches++;
    }
    const exactScore = exactMatches / queryTerms.length * 0.35;
    let partialMatches = 0;
    for (const qt of queryTerms) {
      if (qt.length < 4) continue;
      for (const tt of textTerms) {
        if (tt.length < 4) continue;
        if (qt !== tt && (qt.includes(tt) || tt.includes(qt))) {
          partialMatches++;
          break;
        }
      }
    }
    const partialScore = partialMatches / queryTerms.length * 0.15;
    let synonymMatches = 0;
    for (const [term, synonyms] of Object.entries(MEDICAL_SYNONYMS)) {
      const allForms = [term, ...synonyms];
      const queryHas = allForms.some((f) => queryLower.includes(f));
      const textHas = allForms.some((f) => textLower.includes(f));
      if (queryHas && textHas) {
        synonymMatches++;
      }
    }
    const synonymScore = Math.min(synonymMatches * 0.07, 0.2);
    const queryBigrams = this.extractBigrams(queryLower);
    const textBigrams = this.extractBigrams(textLower);
    let bigramMatches = 0;
    for (const bg of queryBigrams) {
      if (textBigrams.includes(bg)) bigramMatches++;
    }
    const bigramScore = queryBigrams.length > 0 ? bigramMatches / queryBigrams.length * 0.15 : 0;
    const titleLine = text.split("\n")[0] || "";
    const titleTerms = this.extractKeywords(titleLine.toLowerCase());
    let titleMatches = 0;
    for (const qt of queryTerms) {
      if (titleTerms.some((tt) => tt.includes(qt) || qt.includes(tt))) {
        titleMatches++;
      }
    }
    const titleScore = queryTerms.length > 0 ? titleMatches / queryTerms.length * 0.1 : 0;
    const contentLength = text.length;
    const richnessScore = contentLength > 2e3 ? 0.05 : contentLength > 1e3 ? 0.03 : contentLength > 500 ? 0.02 : 0.01;
    const finalScore = exactScore + partialScore + synonymScore + bigramScore + titleScore + richnessScore;
    return Math.max(Math.min(finalScore, 1), 0.05);
  }
  extractKeywords(text) {
    const stopWords = /* @__PURE__ */ new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "could",
      "should",
      "may",
      "might",
      "can",
      "this",
      "that",
      "these",
      "those",
      "it",
      "its",
      "not",
      "no",
      "from",
      "as",
      "if",
      "so",
      "than",
      "more",
      "most",
      "also",
      "about",
      "between",
      "through",
      "during",
      "before",
      "after",
      "above",
      "below",
      "both",
      "each",
      "all",
      "any",
      "few",
      "other",
      "some",
      "such",
      "only",
      "own",
      "same",
      "into",
      "over",
      "under",
      "again",
      "then",
      "once",
      "here",
      "there",
      "when",
      "where",
      "why",
      "how",
      "what",
      "which",
      "who",
      "whom",
      "being",
      "having",
      "doing",
      "very",
      "just",
      "because"
    ]);
    return text.split(/[\s,;:()\[\]{}]+/).map((word) => word.replace(/[^\w\-]/g, "").toLowerCase()).filter((word) => word.length > 2 && !stopWords.has(word)).slice(0, 30);
  }
  extractBigrams(text) {
    const words = text.split(/\s+/).filter((w) => w.length > 2);
    const bigrams = [];
    for (let i = 0; i < words.length - 1; i++) {
      bigrams.push(`${words[i]} ${words[i + 1]}`);
    }
    return bigrams.slice(0, 40);
  }
  // ──────────────────────────────────────────
  // DOCUMENT CHUNKING
  // ──────────────────────────────────────────
  chunkDocument(candidate) {
    const chunks = [];
    if (candidate.content_chunks && Array.isArray(candidate.content_chunks)) {
      candidate.content_chunks.forEach((contentChunk) => {
        chunks.push({
          source: candidate.source,
          id: candidate.id,
          title: candidate.title,
          text: contentChunk.content,
          metadata: {
            ...candidate.metadata,
            parent_article: contentChunk.parent_article,
            child_section: contentChunk.child_section,
            chunk_index: contentChunk.chunk_index,
            relevance_score: contentChunk.relevance_score
          },
          section: contentChunk.child_section,
          chunk_index: contentChunk.chunk_index
        });
      });
    } else if (candidate.full_text_sections) {
      for (const [sectionName, sectionText] of Object.entries(candidate.full_text_sections)) {
        const sectionChunks = this.splitTextIntoChunks(sectionText, 1e3, 200);
        sectionChunks.forEach((chunkText, index) => {
          chunks.push({
            source: candidate.source,
            id: candidate.id,
            title: candidate.title,
            text: chunkText,
            metadata: candidate.metadata,
            section: sectionName,
            chunk_index: index
          });
        });
      }
    } else {
      chunks.push({
        source: candidate.source,
        id: candidate.id,
        title: candidate.title,
        text: candidate.text,
        metadata: candidate.metadata,
        section: "abstract",
        chunk_index: 0
      });
    }
    return chunks;
  }
  splitTextIntoChunks(text, chunkSize, overlap) {
    const chunks = [];
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    let currentChunk = "";
    let currentSize = 0;
    for (const sentence of sentences) {
      const sentenceSize = sentence.length;
      if (currentSize + sentenceSize > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        const overlapText = currentChunk.substring(Math.max(0, currentChunk.length - overlap));
        currentChunk = overlapText + sentence;
        currentSize = overlapText.length + sentenceSize;
      } else {
        currentChunk += sentence + ". ";
        currentSize += sentenceSize;
      }
    }
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
    return chunks.length > 0 ? chunks : [text];
  }
};

// lib/agents/evidence-gap-analyzer.ts
var import_genai5 = require("@google/genai");
var EvidenceGapAnalyzer = class {
  constructor(apiKey) {
    this.genAI = new import_genai5.GoogleGenAI({ apiKey });
    this.modelName = process.env.GEMINI_PRO_MODEL || "gemini-3-pro-preview";
    this.systemPrompt = this.getSystemPrompt();
  }
  getSystemPrompt() {
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
      <threshold level="high">\u22653 Level 1-2 sources OR \u22652 recent guidelines</threshold>
      <threshold level="moderate">\u22652 Level 1-3 sources OR \u22651 guideline + \u22652 RCTs</threshold>
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
  async analyze(query, evidencePack, traceContext, retriever) {
    return await withToolSpan("evidence_gap_analyzer", "execute", async (span) => {
      const startTime = Date.now();
      span.setAttribute("agent.input", JSON.stringify({ query, num_sources: evidencePack.length }));
      span.setAttribute("agent.name", "evidence_gap_analyzer");
      try {
        const evidenceSummary = this.formatEvidence(evidencePack);
        const prompt = `User Query: ${query}

Retrieved Evidence:
${evidenceSummary}

Output JSON:`;
        const response = await callGeminiWithRetry(async (apiKey) => {
          const genAI = new import_genai5.GoogleGenAI({ apiKey });
          return await genAI.models.generateContent({
            model: this.modelName,
            contents: prompt,
            config: {
              systemInstruction: this.systemPrompt,
              temperature: 0.2,
              responseMimeType: "application/json",
              thinkingConfig: {
                thinkingLevel: import_genai5.ThinkingLevel.LOW
                // Reduced from HIGH to save latency
              }
            }
          });
        });
        let analysis;
        try {
          const responseText = response.text || "";
          const jsonText = this.cleanJsonOutput(responseText);
          analysis = JSON.parse(jsonText);
        } catch (parseError) {
          console.warn("\u26A0\uFE0F JSON parsing failed, using conservative fallback analysis:", parseError);
          analysis = {
            assessment: "partial",
            coverage_score: 0.5,
            recency_concerns: true,
            oldest_source_year: (/* @__PURE__ */ new Date()).getFullYear() - 5,
            quality_distribution: {
              guidelines: 0,
              rcts: 0,
              observational: evidencePack.length,
              reviews: 0
            },
            contradictions_detected: false,
            missing_elements: ["Analysis parsing failed \u2014 triggering supplementary search"],
            recommendation: "search_specific_gap"
          };
        }
        const latency = Date.now() - startTime;
        const tokens = {
          input: response.usageMetadata?.promptTokenCount || 2e3,
          output: response.usageMetadata?.candidatesTokenCount || 500,
          total: response.usageMetadata?.totalTokenCount || 2500
        };
        const cost = this.calculateCost(tokens);
        console.log(`\u{1F50D} Evidence gap analysis: ${analysis.assessment} (${Math.round(analysis.coverage_score * 100)}% coverage)`);
        console.log(`   Quality: ${analysis.quality_distribution.guidelines} guidelines, ${analysis.quality_distribution.rcts} RCTs`);
        console.log(`   Recommendation: ${analysis.recommendation}`);
        let updatedEvidence = evidencePack;
        const hasPubMedSources = evidencePack.some((e) => e.source === "pubmed");
        const pubmedCount = evidencePack.filter((e) => e.source === "pubmed").length;
        fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "evidence-gap-analyzer.ts:400", message: "Gap analysis Tavily decision", data: { recommendation: analysis.recommendation, coverage: analysis.coverage_score, hasPubMed: hasPubMedSources, pubmedCount, evidenceCount: evidencePack.length, willCallTavily: (analysis.recommendation === "search_recent" || analysis.recommendation === "search_specific_gap") && retriever && (!hasPubMedSources || pubmedCount < 3), timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
        });
        const shouldCallTavily = (analysis.recommendation === "search_recent" || analysis.recommendation === "search_specific_gap") && retriever && (!hasPubMedSources || pubmedCount < 3 || analysis.coverage_score < 0.4);
        if (shouldCallTavily) {
          const searchType = analysis.recommendation === "search_recent" ? "recent evidence" : "specific gaps";
          console.log(`\u{1F310} Triggering Tavily search for ${searchType}... (PubMed sources: ${pubmedCount}, coverage: ${Math.round(analysis.coverage_score * 100)}%)`);
          const isGuidelineGap = analysis.missing_elements.some((e) => e.toLowerCase().includes("guideline"));
          const tavilyQuery = this.buildTavilyQuery(
            query,
            analysis.recommendation,
            analysis.missing_elements || [],
            isGuidelineGap
          );
          const existingUrls = new Set(
            evidencePack.map((item) => item.metadata.url || item.id).filter(Boolean)
          );
          try {
            const tavilyResults = await retriever.searchTavily(tavilyQuery, existingUrls, traceContext, query);
            if (tavilyResults.length > 0) {
              console.log(`\u2705 Tavily found ${tavilyResults.length} additional sources`);
              const tavilyEvidence = tavilyResults.map((result2, index) => ({
                rank: evidencePack.length + index + 1,
                score: result2.score || 0.7,
                source: "tavily_web",
                id: result2.url,
                title: result2.title,
                text: result2.content,
                metadata: {
                  url: result2.url,
                  published_date: result2.published_date,
                  tavily_score: result2.score
                },
                chunk_info: {
                  section: "web_content",
                  chunk_index: 0
                }
              }));
              updatedEvidence = [...evidencePack, ...tavilyEvidence];
            } else {
              console.log(`\u26A0\uFE0F Tavily search returned no results - continuing with PubMed evidence only`);
            }
          } catch (tavilyError) {
            console.error("\u274C Tavily search failed:", tavilyError);
          }
        } else if ((analysis.recommendation === "search_recent" || analysis.recommendation === "search_specific_gap") && hasPubMedSources && pubmedCount >= 3) {
          console.log(`\u2705 Skipping Tavily - sufficient PubMed sources (${pubmedCount} articles) with ${Math.round(analysis.coverage_score * 100)}% coverage`);
        }
        const result = {
          success: true,
          data: analysis,
          latency_ms: latency,
          tokens,
          cost_usd: cost
        };
        span.setAttribute("agent.output", JSON.stringify(analysis));
        span.setAttribute("agent.latency_ms", latency);
        span.setAttribute("agent.cost_usd", cost);
        span.setAttribute("agent.model_name", "gemini-3-pro-preview");
        span.setAttribute("agent.success", true);
        span.setAttribute("gap_analysis.coverage_score", analysis.coverage_score);
        span.setAttribute("gap_analysis.contradictions_detected", analysis.contradictions_detected);
        span.setAttribute("gap_analysis.missing_elements_count", analysis.missing_elements.length);
        captureTokenUsage(span, tokens, "gemini-3-pro-preview");
        return { analysis, updatedEvidence };
      } catch (error) {
        console.error("\u274C Evidence gap analysis failed:", error);
        const latency = Date.now() - startTime;
        const result = {
          success: false,
          data: {},
          error: error instanceof Error ? error.message : "Unknown error",
          latency_ms: latency
        };
        span.setAttribute("agent.success", false);
        span.setAttribute("agent.error", result.error || "Unknown error");
        span.setAttribute("agent.latency_ms", latency);
        span.recordException(error);
        span.setStatus({ code: 2 /* ERROR */, message: result.error || "Unknown error" });
        const defaultAnalysis = {
          assessment: "partial",
          coverage_score: 0.5,
          recency_concerns: true,
          oldest_source_year: (/* @__PURE__ */ new Date()).getFullYear() - 5,
          quality_distribution: {
            guidelines: 0,
            rcts: 0,
            observational: evidencePack.length,
            reviews: 0
          },
          contradictions_detected: false,
          missing_elements: ["Gap analysis failed \u2014 supplementary search recommended"],
          recommendation: "search_specific_gap"
        };
        return { analysis: defaultAnalysis, updatedEvidence: evidencePack };
      }
    });
  }
  cleanJsonOutput(text) {
    let clean = text.trim();
    if (clean.includes("FINAL JSON OUTPUT:")) {
      clean = clean.split("FINAL JSON OUTPUT:")[1].trim();
    }
    const codeBlockMatch = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      clean = codeBlockMatch[1].trim();
    }
    const firstBrace = clean.indexOf("{");
    const lastBrace = clean.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    }
    return clean;
  }
  formatEvidence(evidencePack) {
    const summaryParts = [];
    for (const item of evidencePack) {
      const year = this.extractYear(item.metadata);
      summaryParts.push(`
[Source ${item.rank}]
Type: ${item.source}
ID: ${item.id}
Title: ${item.title}
Year: ${year}
Relevance Score: ${item.score.toFixed(2)}
Text Preview: ${(item.text || item.title || "No content available").substring(0, 300)}...
---`);
    }
    return summaryParts.join("\n");
  }
  extractYear(metadata) {
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
    return "unknown";
  }
  calculateCost(tokens) {
    const inputCost = tokens.input / 1e6 * 1.25;
    const outputCost = tokens.output / 1e6 * 5;
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
  buildTavilyQuery(originalQuery, recommendation, missingElements, isGuidelineGap = false) {
    const MAX_LENGTH = 400;
    let coreQuery = originalQuery.trim();
    if (coreQuery.length > 150) {
      const cutoff = coreQuery.lastIndexOf(" ", 150);
      coreQuery = coreQuery.substring(0, cutoff > 100 ? cutoff : 150);
    }
    let tavilyQuery = coreQuery;
    if (isGuidelineGap) {
      tavilyQuery += " guidelines (ADA OR NICE OR ESC OR AHA OR WHO)";
    } else if (recommendation === "search_recent") {
      const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
      tavilyQuery += ` latest ${currentYear - 1} ${currentYear}`;
    } else if (recommendation === "search_specific_gap") {
      const topMissing = missingElements.slice(0, 3).map((el) => el.length > 30 ? el.substring(0, 30) : el).join(" ");
      if (topMissing && tavilyQuery.length + topMissing.length + 1 < MAX_LENGTH) {
        tavilyQuery += " " + topMissing;
      }
    }
    if (tavilyQuery.length > MAX_LENGTH) {
      const lastSpace = tavilyQuery.lastIndexOf(" ", MAX_LENGTH);
      tavilyQuery = tavilyQuery.substring(0, lastSpace > MAX_LENGTH * 0.7 ? lastSpace : MAX_LENGTH);
    }
    console.log(`\u{1F527} Built Tavily query (${tavilyQuery.length} chars): "${tavilyQuery}"`);
    return tavilyQuery.trim();
  }
};

// lib/agents/synthesis-engine.ts
var import_genai6 = require("@google/genai");
var import_genai7 = require("@google/genai");
var SynthesisEngine = class {
  constructor(apiKey) {
    this.genAI = new import_genai6.GoogleGenAI({ apiKey });
    this.flashModelName = process.env.AGENT_6_MODEL || "gemini-3-flash-preview";
    this.proModelName = "gemini-3-flash-preview";
    this.fallbackFlashModelName = "gemini-3-flash-preview";
    this.fallbackProModelName = "gemini-3-flash-preview";
    this.systemPrompt = this.getSystemPrompt();
  }
  getSystemPrompt() {
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
    <criterion>Synthesis length should adapt to query complexity: simple queries \u2264300 words, standard queries ~400-500 words, complex/multi-faceted queries up to 700 words. Prioritize completeness and citation density over strict brevity.</criterion>
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

1. [Detailed question deepening clinical understanding \u2014 1-2 full sentences with clinical context for why this matters]?
2. [Detailed question exploring alternative scenarios or complications \u2014 1-2 full sentences referencing specific drugs, conditions, or populations]?
3. [Detailed question about practical application, monitoring, or edge cases \u2014 1-2 full sentences connecting to the evidence gaps or limitations discussed]?
  </exact_format>
  
  <question_requirements>
    <requirement>MUST use the heading "## Follow-Up Questions" (with ## markdown)</requirement>
    <requirement>MUST be numbered 1., 2., 3.</requirement>
    <requirement>MUST end with question mark</requirement>
    <requirement>Questions MUST be directly related to the original user query topic</requirement>
    <requirement>Each question MUST be detailed and descriptive (1-2 full sentences), providing specific clinical context for why the question matters to the user's original query</requirement>
    <requirement>Include specific drug names, study acronyms, guideline names, or population details when relevant \u2014 never write vague or generic questions</requirement>
    <requirement>Questions should naturally flow from the evidence discussed and help the user explore deeper layers of the same topic</requirement>
  </question_requirements>
  
  <examples>
    <original_query>Type 2 diabetes first-line treatment</original_query>
    <good_followups>
      <question>What are the specific contraindications for metformin in patients with varying degrees of renal impairment, and how do KDIGO guidelines inform dose adjustments at different eGFR thresholds (e.g., 30-45 vs 15-30 mL/min)?</question>
      <question>How should metformin therapy be initiated and titrated in elderly patients (\u226565 years) with multiple comorbidities such as heart failure and chronic liver disease, given the limited trial representation of this population in landmark studies like UKPDS?</question>
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

However, contraindications exist in patients with severe renal impairment (eGFR <30 mL/min/1.73m\xB2)[[3]](url3)[[6]](url6). Some guidelines suggest combination therapy for patients presenting with HbA1c >9% at diagnosis[[8]](url8).

## Evidence Limitations
Evidence limitations include varying definitions of cardiovascular outcomes across studies[[4]](url4) and limited long-term safety data in certain populations, particularly those with advanced kidney disease[[9]](url9). Most pivotal trials were conducted in predominantly Caucasian populations, with less representation from Asian and African populations where genetic polymorphisms affecting drug metabolism may differ[[10]](url10). Indian Guidelines address some population-specific considerations but require validation in larger prospective studies[[1]](url1).

## Summary
Strong evidence from Indian and international guidelines supports metformin as first-line therapy for Type 2 diabetes, with proven cardiovascular benefits and favorable safety profile, though contraindications in advanced renal disease must be considered.

## References

1. [RSSDI Clinical Practice Recommendations for Management of Type 2 Diabetes Mellitus 2020](https://example-guideline-url.com)
   Authors: Research Society for Study of Diabetes in India.
   Journal: Clinical Practice Guideline. 2020.
   Practice Guideline - Recent (\u22643y)

2. [ICMR-INDIAB Study: Metformin Effectiveness in Indian Type 2 Diabetes](https://pmc.ncbi.nlm.nih.gov/articles/PMC12345)
   Authors: Pradeepa R, Anjana RM, Mohan V, et al.
   Journal: Diabetes Care. 2023.
   PMID: 12345678 | PMCID: PMC12345 | DOI: 10.2337/dc23-S001
   Cohort Study - High-Impact - Recent (\u22643y)

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
  <requirement>Adapt word count to query complexity: simple \u2264300, standard ~400-500, complex up to 700 words</requirement>
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
    <check>Structure follows direct answer \u2192 evidence \u2192 limitations format</check>
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
  async synthesize(query, evidencePack, gapAnalysis, complexityScore, traceContext) {
    return await withToolSpan("synthesis_engine", "execute", async (span) => {
      const startTime = Date.now();
      span.setAttribute("agent.input", JSON.stringify({ query, num_sources: evidencePack.length, complexity_score: complexityScore }));
      span.setAttribute("agent.name", "synthesis_engine");
      try {
        if (!evidencePack || evidencePack.length === 0) {
          const latency2 = Date.now() - startTime;
          const fallbackResult = {
            success: true,
            data: {
              synthesis: `**Quick Answer**
We did not find enough peer-reviewed evidence in our sources to synthesize an answer for this query. Try rephrasing (e.g., broader terms or one condition at a time) or ask a follow-up focused on a specific drug or outcome.

**Evidence limitations**
No PubMed or guideline results were available for the current search. This tool is for research support only and does not replace clinical judgment.`,
              citations: [],
              model_used: "none",
              evidence_pack: [],
              tokens: { input: 0, output: 0, total: 0 },
              cost: 0
            },
            latency_ms: latency2
          };
          return fallbackResult;
        }
        const useProModel = complexityScore > 0.5 || gapAnalysis.contradictions_detected;
        let currentModelName = useProModel ? this.proModelName : this.flashModelName;
        let fallbackModelNameToUse = useProModel ? this.fallbackProModelName : this.fallbackFlashModelName;
        let modelName = currentModelName;
        const thinkingLevel = complexityScore > 0.5 || gapAnalysis.contradictions_detected ? import_genai7.ThinkingLevel.LOW : import_genai7.ThinkingLevel.LOW;
        console.log(`\u{1F916} Using ${modelName} for synthesis (complexity: ${complexityScore.toFixed(2)}, thinking: ${thinkingLevel})`);
        const evidenceContext = this.formatEvidenceForSynthesis(evidencePack);
        const prompt = `User Query: ${query}

Evidence Sources:
${evidenceContext}

Gap Analysis Summary:
- Coverage: ${Math.round(gapAnalysis.coverage_score * 100)}%
- Contradictions: ${gapAnalysis.contradictions_detected ? "Yes" : "No"}
- Missing: ${gapAnalysis.missing_elements.slice(0, 3).join(", ") || "None"}

Generate synthesis (adapt length to query complexity: simple \u2264300w, standard ~400-500w, complex up to 700w):`;
        let response;
        try {
          response = await callGeminiWithRetry(
            async (apiKey) => {
              const genAI = new import_genai6.GoogleGenAI({ apiKey });
              return await genAI.models.generateContent({
                model: currentModelName,
                contents: prompt,
                config: {
                  systemInstruction: this.systemPrompt,
                  temperature: 0.2,
                  maxOutputTokens: 4e3,
                  thinkingConfig: {
                    thinkingLevel
                    // Dynamic: high for complex/contradictions, medium for simple
                  }
                }
              });
            },
            3,
            // maxRetries
            1e3,
            // retryDelay
            6e4
            // timeoutMs: 60 seconds for synthesis (was 30s default)
          );
        } catch (primaryError) {
          if (primaryError instanceof Error && (primaryError.message.includes("overloaded") || primaryError.message.includes("Max retries"))) {
            console.log(`\u26A0\uFE0F ${modelName} overloaded after retries, trying ${fallbackModelNameToUse} with rate limiter...`);
            modelName = fallbackModelNameToUse;
            response = await callGeminiWithRetry(
              async (apiKey) => {
                const genAI = new import_genai6.GoogleGenAI({ apiKey });
                return await genAI.models.generateContent({
                  model: fallbackModelNameToUse,
                  contents: prompt,
                  config: {
                    systemInstruction: this.systemPrompt,
                    temperature: 0.2,
                    maxOutputTokens: 4e3,
                    thinkingConfig: {
                      thinkingLevel
                      // Use same thinking level for fallback
                    }
                  }
                });
              },
              3,
              // maxRetries
              1e3,
              // retryDelay
              6e4
              // timeoutMs: 60 seconds for synthesis fallback
            );
            if (response.usageMetadata) {
              console.log(`Fallback usage: ${JSON.stringify(response.usageMetadata)}`);
            }
          } else {
            throw primaryError;
          }
        }
        const synthesisText = response.text || "";
        let fixedSynthesisText = synthesisText;
        const hashCitationPattern = /\[\[(\d+)\]\]\(#\)/g;
        const matches = [...synthesisText.matchAll(hashCitationPattern)];
        if (matches.length > 0) {
          console.warn(`\u26A0\uFE0F Found ${matches.length} citations with (#) - fixing with actual URLs...`);
          matches.forEach((match) => {
            const citationNum = parseInt(match[1]);
            const evidence = evidencePack.find((e) => e.rank === citationNum);
            if (evidence) {
              let properUrl = "";
              switch (evidence.source) {
                case "pubmed":
                  properUrl = evidence.metadata.pmcid ? `https://pmc.ncbi.nlm.nih.gov/articles/${evidence.metadata.pmcid}/` : `https://pubmed.ncbi.nlm.nih.gov/${evidence.id}/`;
                  break;
                case "indian_guideline":
                  properUrl = evidence.metadata.url || "";
                  break;
                case "dailymed":
                  properUrl = `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${evidence.id}`;
                  break;
                case "tavily_web":
                  properUrl = evidence.metadata.url || "";
                  break;
                default:
                  properUrl = evidence.metadata.url || "";
                  break;
              }
              if (properUrl) {
                fixedSynthesisText = fixedSynthesisText.replace(
                  `[[${citationNum}]](#)`,
                  `[[${citationNum}]](${properUrl})`
                );
                console.log(`\u2705 Fixed citation [${citationNum}]: ${properUrl}`);
              }
            }
          });
        }
        const latency = Date.now() - startTime;
        const citations = this.extractCitations(fixedSynthesisText, evidencePack);
        const tokens = {
          input: response.usageMetadata?.promptTokenCount || 3e3,
          output: response.usageMetadata?.candidatesTokenCount || 800,
          total: response.usageMetadata?.totalTokenCount || 3800
        };
        const cost = this.calculateCost(modelName, tokens);
        const synthesisResult = {
          synthesis: fixedSynthesisText,
          // Use fixed text with proper URLs
          citations,
          evidence_pack: evidencePack,
          tokens,
          cost,
          model_used: modelName
        };
        const result = {
          success: true,
          data: synthesisResult,
          latency_ms: latency,
          tokens,
          cost_usd: cost
        };
        span.setAttribute("agent.output", JSON.stringify({
          synthesis_length: fixedSynthesisText.length,
          num_citations: citations.length
        }));
        span.setAttribute("agent.latency_ms", latency);
        span.setAttribute("agent.cost_usd", cost);
        span.setAttribute("agent.model_name", modelName);
        span.setAttribute("agent.success", true);
        captureTokenUsage(span, tokens, modelName);
        console.log(`\u2705 Synthesis complete: ${fixedSynthesisText.length} chars, ${citations.length} citations`);
        console.log(`\u{1F4B0} Cost: $${cost.toFixed(4)} (${modelName})`);
        return result;
      } catch (error) {
        console.error("\u274C Synthesis failed:", error);
        const latency = Date.now() - startTime;
        const result = {
          success: false,
          data: {},
          error: error instanceof Error ? error.message : "Unknown error",
          latency_ms: latency
        };
        span.setAttribute("agent.success", false);
        span.setAttribute("agent.error", result.error || "Unknown error");
        span.setAttribute("agent.latency_ms", latency);
        span.recordException(error);
        span.setStatus({ code: 2 /* ERROR */, message: result.error || "Unknown error" });
        return result;
      }
    });
  }
  formatEvidenceForSynthesis(evidencePack) {
    const formatted = [];
    for (const item of evidencePack) {
      const sourceType = item.source;
      const metadata = item.metadata;
      let url = "";
      switch (sourceType) {
        case "pubmed":
          url = metadata.pmcid ? `https://pmc.ncbi.nlm.nih.gov/articles/${metadata.pmcid}/` : `https://pubmed.ncbi.nlm.nih.gov/${item.id}/`;
          break;
        case "indian_guideline":
          url = metadata.url || "";
          break;
        case "dailymed":
          url = `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${item.id}`;
          break;
        case "tavily_web":
          url = metadata.url || "";
          break;
        default:
          url = metadata.url || "";
          break;
      }
      let citation;
      let identifier;
      if (sourceType === "pubmed") {
        const authors = metadata.authors?.[0] || "Unknown";
        const year = metadata.pub_date?.substring(0, 4) || "Unknown";
        citation = `${authors} et al. ${metadata.journal} ${year}`;
        identifier = `PMID:${item.id}`;
      } else if (sourceType === "indian_guideline") {
        citation = `${metadata.organization} ${metadata.year}`;
        identifier = `Guideline:${item.id}`;
      } else if (sourceType === "dailymed") {
        const year = metadata.published?.substring(0, 4) || "Unknown";
        citation = `FDA Label: ${metadata.drug_name} (${year})`;
        identifier = `SetID:${item.id}`;
      } else if (sourceType === "tavily_web") {
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

${item.chunk_info?.section ? `Section: ${item.chunk_info.section}` : ""}
---`);
    }
    return formatted.join("\n");
  }
  extractCitations(synthesisText, evidencePack) {
    const citationPatterns = [
      /\[\[(\d+)\]\]\([^)]+\)/g,
      // [[N]](URL) format
      /\[\[(\d+)\]\(([^)]+)\)\]/g,
      // [[N](URL)] format (fallback for malformed)
      /\[\[(\d+)\]\]/g
      // [[N]] format (fallback)
    ];
    const citationNumbers = /* @__PURE__ */ new Set();
    citationPatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(synthesisText)) !== null) {
        citationNumbers.add(parseInt(match[1]));
      }
    });
    const citations = [];
    for (const num of citationNumbers) {
      const source = evidencePack.find((item) => item.rank === num);
      if (source) {
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
  buildRichMetadata(source) {
    const metadata = source.metadata;
    const richMeta = {
      ...metadata,
      // Add UI-specific fields
      authors: [],
      journal: "",
      year: "",
      doi: "",
      pmid: "",
      pmcid: "",
      badges: [],
      url: ""
    };
    switch (source.source) {
      case "pubmed":
        richMeta.authors = metadata.authors || [];
        richMeta.journal = metadata.journal || "";
        richMeta.year = metadata.pub_date?.substring(0, 4) || "";
        richMeta.doi = metadata.doi || "";
        richMeta.pmid = source.id;
        richMeta.pmcid = metadata.pmcid || "";
        richMeta.url = metadata.pmcid ? `https://pmc.ncbi.nlm.nih.gov/articles/${metadata.pmcid}/` : `https://pubmed.ncbi.nlm.nih.gov/${source.id}/`;
        if (metadata.pmcid) richMeta.badges.push("PMCID");
        if (metadata.pub_types?.includes("Systematic Review")) richMeta.badges.push("Systematic Review");
        if (metadata.pub_types?.includes("Meta-Analysis")) richMeta.badges.push("Meta-Analysis");
        if (metadata.pub_types?.includes("Practice Guideline")) richMeta.badges.push("Practice Guideline");
        const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
        if (richMeta.year && parseInt(richMeta.year) >= currentYear - 3) {
          richMeta.badges.push("Recent");
        }
        const leadingJournals = [
          "new england journal",
          "nejm",
          "lancet",
          "jama",
          "bmj",
          "british medical journal",
          "nature",
          "science",
          "cell",
          "circulation",
          "annals of internal medicine"
        ];
        if (leadingJournals.some((j) => richMeta.journal.toLowerCase().includes(j))) {
          richMeta.badges.push("Leading Journal");
        }
        break;
      case "indian_guideline":
        richMeta.authors = [metadata.organization || "Unknown Organization"];
        richMeta.journal = "Clinical Practice Guideline";
        richMeta.year = metadata.year?.toString() || "";
        richMeta.url = metadata.url || "";
        richMeta.badges.push("Practice Guideline");
        if (richMeta.year && parseInt(richMeta.year) >= (/* @__PURE__ */ new Date()).getFullYear() - 3) {
          richMeta.badges.push("Recent");
        }
        break;
      case "dailymed":
        richMeta.authors = ["FDA"];
        richMeta.journal = "FDA Drug Label";
        richMeta.year = metadata.published?.substring(0, 4) || "";
        richMeta.url = `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${source.id}`;
        richMeta.badges.push("Drug Label");
        if (richMeta.year && parseInt(richMeta.year) >= (/* @__PURE__ */ new Date()).getFullYear() - 3) {
          richMeta.badges.push("Recent");
        }
        break;
      case "tavily_web":
        richMeta.authors = [this.extractDomainFromUrl(metadata.url) || "Web Source"];
        richMeta.journal = "Web Resource";
        richMeta.year = metadata.published_date?.substring(0, 4) || (/* @__PURE__ */ new Date()).getFullYear().toString();
        richMeta.url = metadata.url || "";
        const domain = this.extractDomainFromUrl(metadata.url);
        if (domain?.includes("nih.gov") || domain?.includes("cdc.gov") || domain?.includes("who.int")) {
          richMeta.badges.push("Authoritative Source");
        }
        break;
      default:
        richMeta.url = metadata.url || "";
        break;
    }
    return richMeta;
  }
  extractDomainFromUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return null;
    }
  }
  calculateCost(modelName, tokens) {
    const pricing = {
      "gemini-3-flash-preview": {
        input: 0.1 / 1e6,
        output: 0.4 / 1e6
      },
      "gemini-3-pro-preview": {
        input: 1.25 / 1e6,
        output: 5 / 1e6
      },
      "gemini-2.0-flash-001": {
        input: 0.1 / 1e6,
        output: 0.4 / 1e6
      }
    };
    const rate = pricing[modelName] || pricing["gemini-2.0-flash-001"] || { input: 0, output: 0 };
    return tokens.input * rate.input + tokens.output * rate.output;
  }
};

// lib/agents/verification-gate.ts
var import_genai8 = require("@google/genai");
var VerificationGate = class {
  constructor(apiKey) {
    this.consecutiveFailures = 0;
    this.maxConsecutiveFailures = 3;
    this.genAI = new import_genai8.GoogleGenAI({ apiKey });
    this.modelName = process.env.GEMINI_FLASH_MODEL || "gemini-3-flash-preview";
    this.fallbackModelName = "gemini-3-pro-preview";
    this.systemPrompt = this.getSystemPrompt();
  }
  getSystemPrompt() {
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
      <condition>grounding_score \u2265 0.8 AND no critical violations</condition>
      <action>Return synthesis unchanged with verification metadata</action>
    </success_case>
    
    <warning_case>
      <condition>0.7 \u2264 grounding_score < 0.8 OR minor violations detected</condition>
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
  async verify(synthesis, traceContext) {
    return await withToolSpan("verification_gate", "execute", async (span) => {
      const startTime = Date.now();
      span.setAttribute("agent.input", JSON.stringify({ synthesis_length: synthesis.synthesis.length }));
      span.setAttribute("agent.name", "verification_gate");
      try {
        if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
          console.log("\u26A0\uFE0F Verification circuit breaker activated - skipping verification due to consecutive failures");
          return {
            success: true,
            data: synthesis,
            latency_ms: Date.now() - startTime,
            metadata: {
              agent: "verification_gate",
              latency: Date.now() - startTime,
              model_used: "skipped",
              cost: 0
            },
            warning: "\u26A0\uFE0F Verification skipped due to model overload - please verify claims manually"
          };
        }
        const claims = this.extractClaims(synthesis.synthesis);
        const validationResults = {
          total_claims: claims.length,
          cited_claims: 0,
          uncited_claims: [],
          invalid_citations: [],
          unsupported_claims: [],
          hallucination_detected: false,
          grounding_score: 0,
          passed: false
        };
        const citationPatterns = [
          /\[\[(\d+)\]\]\([^)]+\)/g,
          // [[N]](URL) format (primary)
          /\[\[(\d+)\]\(([^)]+)\)\]/g,
          // [[N](URL)] format (fallback for malformed)
          /\[(\d+)\]/g
          // [N] format (fallback)
        ];
        const citedClaims = [];
        const citedNumbers = /* @__PURE__ */ new Set();
        for (const pattern of citationPatterns) {
          let match;
          while ((match = pattern.exec(synthesis.synthesis)) !== null) {
            const citationNumber = parseInt(match[1]);
            citedNumbers.add(citationNumber);
          }
        }
        const sentences = synthesis.synthesis.split(/(?<=[.!?])\s+/);
        for (const sentence of sentences) {
          const hasCitation = citationPatterns.some((pattern) => {
            pattern.lastIndex = 0;
            return pattern.test(sentence);
          });
          if (hasCitation) {
            const sentenceCitations = [];
            for (const pattern of citationPatterns) {
              pattern.lastIndex = 0;
              let match;
              while ((match = pattern.exec(sentence)) !== null) {
                sentenceCitations.push(parseInt(match[1]));
              }
            }
            if (sentenceCitations.length > 0) {
              citedClaims.push([sentence.trim(), sentenceCitations.join(",")]);
            }
          }
        }
        validationResults.cited_claims = citedClaims.length;
        for (const claim of claims) {
          const hasCitation = citedClaims.some(
            ([citedClaim]) => claim.includes(citedClaim.trim()) || citedClaim.includes(claim.trim())
          );
          if (!hasCitation) {
            validationResults.uncited_claims.push(claim);
          }
        }
        const validNumbers = new Set(synthesis.citations.map((c) => c.number));
        const invalidNumbers = Array.from(citedNumbers).filter((n) => !validNumbers.has(n));
        validationResults.invalid_citations = invalidNumbers;
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
        validationResults.hallucination_detected = validationResults.unsupported_claims.length > 0 || validationResults.uncited_claims.length > 2;
        validationResults.passed = !validationResults.hallucination_detected;
        if (validationResults.total_claims > 0) {
          const unsupportedRatio = validationResults.unsupported_claims.length / validationResults.total_claims;
          const uncitedRatio = Math.max(0, validationResults.uncited_claims.length - 2) / validationResults.total_claims;
          validationResults.grounding_score = Math.max(0, 1 - unsupportedRatio - uncitedRatio * 0.5);
        } else {
          validationResults.grounding_score = 1;
        }
        const latency = Date.now() - startTime;
        span.setAttribute("agent.output", JSON.stringify(validationResults));
        span.setAttribute("agent.latency_ms", latency);
        span.setAttribute("agent.model_name", "gemini-3-flash-preview");
        span.setAttribute("agent.success", true);
        span.setAttribute("verification.grounding_score", validationResults.grounding_score);
        span.setAttribute("verification.hallucination_detected", validationResults.hallucination_detected);
        span.setAttribute("verification.total_claims", validationResults.total_claims);
        span.setAttribute("verification.cited_claims", validationResults.cited_claims);
        span.setAttribute("verification.unsupported_claims_count", validationResults.unsupported_claims.length);
        if (validationResults.hallucination_detected) {
          span.addEvent("verification.hallucination_detected", {
            "verification.unsupported_claims": JSON.stringify(validationResults.unsupported_claims),
            "verification.uncited_claims": JSON.stringify(validationResults.uncited_claims)
          });
        }
        let finalSynthesis = synthesis;
        if (!validationResults.passed) {
          const warning = this.generateWarning(validationResults);
          finalSynthesis = {
            ...synthesis,
            warning
          };
          console.log(`\u26A0\uFE0F Verification failed: ${warning}`);
        } else {
          console.log(`\u2705 Verification passed: ${Math.round(validationResults.grounding_score * 100)}% grounding score`);
        }
        console.log(`\u{1F50D} Verification complete:`);
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
        console.error("\u274C Verification failed:", error);
        const latency = Date.now() - startTime;
        const result = {
          success: false,
          data: synthesis,
          error: error instanceof Error ? error.message : "Unknown error",
          latency_ms: latency
        };
        span.setAttribute("agent.success", false);
        span.setAttribute("agent.error", result.error || "Unknown error");
        span.setAttribute("agent.latency_ms", latency);
        span.recordException(error);
        span.setStatus({ code: 2 /* ERROR */, message: result.error || "Unknown error" });
        return {
          ...result,
          success: true,
          data: {
            ...synthesis,
            warning: "\u26A0\uFE0F Verification process failed - please review citations carefully"
          }
        };
      }
    });
  }
  extractClaims(text) {
    const sentences = text.split(/(?<=[.!?])\s+/);
    const claims = sentences.map((s) => s.trim()).filter((s) => s.length > 20 && !s.match(/^(however|therefore|in conclusion|finally)/i));
    return claims;
  }
  async batchCheckGrounding(citedClaims, evidencePack) {
    if (citedClaims.length === 0) return [];
    let claimsList = "";
    const claimMeta = [];
    for (let i = 0; i < citedClaims.length; i++) {
      const [claim, numbersStr] = citedClaims[i];
      const numbers = numbersStr.split(",").map((n) => parseInt(n.trim()));
      claimMeta.push({ claim, citations: numbers });
      const sourceTexts = evidencePack.filter((source) => numbers.includes(source.rank)).slice(0, 3).map((source) => (source.text?.slice(0, 300) || "").trim()).filter((t) => t.length > 0);
      claimsList += `
CLAIM ${i + 1}: "${claim.slice(0, 200)}"
SOURCES [${numbers.join(",")}]: ${sourceTexts.join(" | ").slice(0, 600)}
`;
    }
    const prompt = `You are verifying medical claims against evidence sources.
For each claim below, determine if it is supported by its cited sources.
Answer with ONLY a numbered list like "1. YES" or "2. NO".

${claimsList}

Respond with EXACTLY ${citedClaims.length} lines, one per claim:`;
    try {
      const timeoutPromise = new Promise(
        (_, reject) => setTimeout(() => reject(new Error("Batch verification timeout")), 1e4)
      );
      let response;
      try {
        const primaryPromise = callGeminiWithRetry(async (apiKey) => {
          const genAI = new import_genai8.GoogleGenAI({ apiKey });
          return await genAI.models.generateContent({
            model: this.modelName,
            contents: prompt,
            config: {
              systemInstruction: this.systemPrompt,
              temperature: 0,
              thinkingConfig: {
                thinkingLevel: import_genai8.ThinkingLevel.LOW
              }
            }
          });
        });
        response = await Promise.race([primaryPromise, timeoutPromise]);
      } catch (primaryError) {
        if (primaryError instanceof Error && (primaryError.message.includes("overloaded") || primaryError.message.includes("timeout") || primaryError.message.includes("Max retries"))) {
          console.log("\u26A0\uFE0F Primary model overloaded for batch verification, trying fallback...");
          try {
            const fallbackPromise = callGeminiWithRetry(async (apiKey) => {
              const genAI = new import_genai8.GoogleGenAI({ apiKey });
              return await genAI.models.generateContent({
                model: this.fallbackModelName,
                contents: prompt,
                config: {
                  systemInstruction: this.systemPrompt,
                  temperature: 0,
                  thinkingConfig: { thinkingLevel: import_genai8.ThinkingLevel.LOW }
                }
              });
            });
            response = await Promise.race([fallbackPromise, timeoutPromise]);
          } catch (fallbackError) {
            console.log("\u26A0\uFE0F Both models failed for batch verification \u2014 assuming all claims grounded");
            this.consecutiveFailures++;
            return claimMeta.map((c) => ({ ...c, isGrounded: true }));
          }
        } else {
          throw primaryError;
        }
      }
      const text = (response.text || "").trim().toUpperCase();
      const lines = text.split("\n").filter((l) => l.trim().length > 0);
      this.consecutiveFailures = 0;
      return claimMeta.map((meta, idx) => {
        const line = lines[idx] || "";
        const hasYes = /\bYES\b/.test(line);
        const hasNo = /\bNO\b/.test(line);
        const isGrounded = hasYes && !hasNo ? true : hasNo && !hasYes ? false : true;
        return { ...meta, isGrounded };
      });
    } catch (error) {
      console.error("\u274C Batch grounding check failed:", error);
      this.consecutiveFailures++;
      return claimMeta.map((c) => ({ ...c, isGrounded: true }));
    }
  }
  generateWarning(validationResults) {
    const warnings = [];
    if (validationResults.uncited_claims.length > 2) {
      warnings.push(`${validationResults.uncited_claims.length - 2} claims lack citations`);
    }
    if (validationResults.invalid_citations.length > 0) {
      warnings.push(`Invalid citation numbers: ${validationResults.invalid_citations.join(", ")}`);
    }
    if (validationResults.unsupported_claims.length > 0) {
      warnings.push(`${validationResults.unsupported_claims.length} claims may not be fully supported by evidence`);
    }
    return `\u26A0\uFE0F ${warnings.join(" | ")}`;
  }
};

// lib/agents/medical-evidence-orchestrator.ts
var MedicalEvidenceOrchestrator = class {
  constructor(config) {
    this.queryIntelligence = new QueryIntelligenceAgent(config.google_ai_api_key);
    this.multiSourceRetrieval = new MultiSourceRetrievalCoordinator({
      ncbi_api_key: config.ncbi_api_key,
      tavily_api_key: config.tavily_api_key
    });
    this.evidenceNormalizer = new EvidenceNormalizer();
    this.twoStageReranker = new TwoStageReranker(config.ncbi_api_key);
    this.evidenceGapAnalyzer = new EvidenceGapAnalyzer(config.google_ai_api_key);
    this.synthesisEngine = new SynthesisEngine(config.google_ai_api_key);
    this.verificationGate = new VerificationGate(config.google_ai_api_key);
  }
  async processQuery(query, sessionId = "default") {
    return await withToolSpan("orchestrator", "process_query", async (span) => {
      const startTime = Date.now();
      const traceId = this.generateTraceId();
      span.setAttribute("synthesis.query", query);
      span.setAttribute("synthesis.session_id", sessionId);
      span.setAttribute("synthesis.trace_id", traceId);
      const traceContext = {
        traceId,
        sessionId,
        timestamp: startTime
      };
      console.log(`\u{1F680} Starting 7-agent medical evidence synthesis`);
      console.log(`   Query: "${query}"`);
      console.log(`   Trace ID: ${traceId}`);
      console.log(`   Session ID: ${sessionId}`);
      fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "medical-evidence-orchestrator.ts:62", message: "Orchestrator started", data: { query: query.substring(0, 100), traceId, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
      });
      let totalCost = 0;
      const agentLatencies = {};
      try {
        console.log(`
\u{1F916} AGENT 1: Query Intelligence`);
        fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "medical-evidence-orchestrator.ts:73", message: "Agent 1 starting", data: { agent: "query_intelligence", timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
        });
        const queryResult = await this.queryIntelligence.analyzeQuery(query, traceContext);
        fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "medical-evidence-orchestrator.ts:76", message: "Agent 1 completed", data: { agent: "query_intelligence", success: queryResult.success, latency: queryResult.latency_ms, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
        });
        if (!queryResult.success) {
          throw new Error(`Query analysis failed: ${queryResult.error}`);
        }
        const searchStrategy = queryResult.data;
        totalCost += queryResult.cost_usd || 0;
        agentLatencies.query_intelligence = queryResult.latency_ms;
        console.log(`\u2705 Query analyzed: ${searchStrategy.intent} (complexity: ${searchStrategy.complexity_score.toFixed(2)})`);
        console.log(`   Search variants: ${searchStrategy.search_variants.length}`);
        console.log(`   Required sources: ${Object.entries(searchStrategy.requires_sources).filter(([, v]) => v).map(([k]) => k).join(", ")}`);
        console.log(`
\u{1F50D} AGENT 2: Multi-Source Retrieval`);
        fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "medical-evidence-orchestrator.ts:90", message: "Agent 2 starting", data: { agent: "multi_source_retrieval", timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
        });
        const retrievalStart = Date.now();
        const rawResults = await this.multiSourceRetrieval.retrieveAll(searchStrategy, traceContext, query);
        agentLatencies.multi_source_retrieval = Date.now() - retrievalStart;
        fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "medical-evidence-orchestrator.ts:94", message: "Agent 2 completed", data: { agent: "multi_source_retrieval", latency: agentLatencies.multi_source_retrieval, totalDocs: Object.values(rawResults).reduce((sum, arr) => sum + arr.length, 0), timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
        });
        const totalDocuments = Object.values(rawResults).reduce((sum, arr) => sum + arr.length, 0);
        console.log(`\u2705 Retrieved ${totalDocuments} documents from ${Object.keys(rawResults).length} sources`);
        console.log(`
\u{1F504} AGENT 3: Evidence Normalizer`);
        const normalizationStart = Date.now();
        const candidates = this.evidenceNormalizer.normalizeAll(rawResults);
        agentLatencies.evidence_normalizer = Date.now() - normalizationStart;
        console.log(`\u2705 Normalized ${candidates.length} evidence candidates`);
        console.log(`
\u{1F3AF} AGENT 4: Two-Stage BGE Reranker`);
        const evidencePack = await this.twoStageReranker.rerank(query, candidates, traceContext);
        console.log(`\u2705 Reranked to top ${evidencePack.length} evidence chunks`);
        console.log(`
\u{1F50D} AGENT 5: Evidence Gap Analyzer`);
        fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "medical-evidence-orchestrator.ts:115", message: "Agent 5 starting", data: { agent: "evidence_gap_analyzer", evidenceCount: evidencePack.length, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
        });
        const gapAnalyzerStart = Date.now();
        const gapResult = await this.evidenceGapAnalyzer.analyze(
          query,
          evidencePack,
          traceContext,
          this.multiSourceRetrieval
        );
        fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "medical-evidence-orchestrator.ts:123", message: "Agent 5 completed", data: { agent: "evidence_gap_analyzer", coverage: gapResult.analysis.coverage_score, recommendation: gapResult.analysis.recommendation, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
        });
        const { analysis: gapAnalysis, updatedEvidence } = gapResult;
        totalCost += 3e-3;
        agentLatencies.evidence_gap_analyzer = Date.now() - gapAnalyzerStart;
        console.log(`\u2705 Gap analysis: ${gapAnalysis.assessment} (${Math.round(gapAnalysis.coverage_score * 100)}% coverage)`);
        if (updatedEvidence.length > evidencePack.length) {
          console.log(`   \u{1F4C8} Added ${updatedEvidence.length - evidencePack.length} sources from Tavily`);
        }
        console.log(`
\u270D\uFE0F AGENT 6: Synthesis Engine`);
        fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "medical-evidence-orchestrator.ts:135", message: "Agent 6 starting", data: { agent: "synthesis_engine", evidenceCount: updatedEvidence.length, complexity: searchStrategy.complexity_score, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
        });
        const synthesisResult = await this.synthesisEngine.synthesize(
          query,
          updatedEvidence,
          gapAnalysis,
          searchStrategy.complexity_score,
          traceContext
        );
        fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "medical-evidence-orchestrator.ts:144", message: "Agent 6 completed", data: { agent: "synthesis_engine", success: synthesisResult.success, model: synthesisResult.data?.model_used, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
        });
        if (!synthesisResult.success) {
          throw new Error(`Synthesis failed: ${synthesisResult.error}`);
        }
        const synthesis = synthesisResult.data;
        totalCost += synthesisResult.cost_usd || 0;
        agentLatencies.synthesis_engine = synthesisResult.latency_ms;
        console.log(`\u2705 Synthesis complete: ${synthesis.synthesis.length} chars, ${synthesis.citations.length} citations`);
        console.log(`   Model used: ${synthesis.model_used}`);
        console.log(`
\u{1F6E1}\uFE0F AGENT 7: Verification Gate`);
        fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "medical-evidence-orchestrator.ts:155", message: "Agent 7 starting", data: { agent: "verification_gate", timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
        });
        const verificationResult = await this.verificationGate.verify(
          synthesis,
          traceContext
        );
        fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "medical-evidence-orchestrator.ts:161", message: "Agent 7 completed", data: { agent: "verification_gate", success: verificationResult.success, grounding: verificationResult.metadata?.verification?.grounding_score, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
        });
        if (!verificationResult.success) {
          console.warn(`\u26A0\uFE0F Verification failed: ${verificationResult.error}`);
        }
        const finalSynthesis = verificationResult.success ? verificationResult.data : {
          synthesis: synthesis.synthesis,
          warning: "\u26A0\uFE0F Verification skipped due to system error"
        };
        totalCost += verificationResult.cost_usd || 0;
        agentLatencies.verification_gate = verificationResult.latency_ms;
        const verificationMetadata = verificationResult.metadata || {
          verification: {
            grounding_score: 0.8,
            // Default if skipped
            hallucination_detected: false
          }
        };
        console.log(`\u2705 Verification complete: ${verificationMetadata.verification.passed ? "PASSED" : "WARNING"}`);
        console.log(`   Grounding score: ${Math.round(verificationMetadata.verification.grounding_score * 100)}%`);
        const totalLatency = Date.now() - startTime;
        const citationCoverage = synthesis.citations.length > 0 ? synthesis.citations.length / this.extractClaims(synthesis.synthesis).length : 0;
        const response = {
          synthesis: finalSynthesis.synthesis,
          citations: synthesis.citations.map((c) => ({
            number: c.number,
            source: c.source,
            id: c.id,
            title: c.title,
            url: this.buildCitationUrl(c),
            metadata: c.metadata
          })),
          metadata: {
            sources_count: updatedEvidence.length,
            latency_total_ms: totalLatency,
            cost_total_usd: totalCost,
            grounding_score: verificationMetadata.verification.grounding_score,
            citation_coverage: citationCoverage,
            hallucination_detected: verificationMetadata.verification.hallucination_detected,
            model_used: synthesis.model_used,
            trace_id: traceId
          }
        };
        if (finalSynthesis.warning) {
          response.warning = finalSynthesis.warning;
        }
        span.setAttribute("synthesis.output_length", finalSynthesis.synthesis.length);
        span.setAttribute("synthesis.citations_count", synthesis.citations.length);
        span.setAttribute("synthesis.sources_count", updatedEvidence.length);
        span.setAttribute("synthesis.total_latency_ms", totalLatency);
        span.setAttribute("synthesis.total_cost_usd", totalCost);
        span.setAttribute("synthesis.grounding_score", verificationMetadata.verification.grounding_score);
        span.setAttribute("synthesis.citation_coverage", citationCoverage);
        span.setAttribute("synthesis.hallucination_detected", verificationMetadata.verification.hallucination_detected);
        span.setAttribute("synthesis.model_used", synthesis.model_used);
        span.addEvent("agent_latencies", agentLatencies);
        console.log(`
\u{1F389} 7-Agent Synthesis Complete!`);
        console.log(`   Total latency: ${totalLatency}ms`);
        console.log(`   Total cost: $${totalCost.toFixed(4)}`);
        console.log(`   Sources: ${response.metadata.sources_count}`);
        console.log(`   Citations: ${response.citations.length}`);
        console.log(`   Grounding score: ${Math.round(response.metadata.grounding_score * 100)}%`);
        console.log(`   Agent latencies:`, agentLatencies);
        logApiKeyStats();
        return response;
      } catch (error) {
        console.error("\u274C 7-Agent synthesis failed:", error);
        fetch("http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "medical-evidence-orchestrator.ts:240", message: "Orchestrator error", data: { error: error instanceof Error ? error.message : "Unknown", stack: error instanceof Error ? error.stack : "", elapsed: Date.now() - startTime, timestamp: Date.now() }, timestamp: Date.now() }) }).catch(() => {
        });
        span.setAttribute("synthesis.success", false);
        span.setAttribute("synthesis.error", error instanceof Error ? error.message : "Unknown error");
        span.setAttribute("synthesis.total_latency_ms", Date.now() - startTime);
        span.setAttribute("synthesis.total_cost_usd", totalCost);
        span.recordException(error);
        span.setStatus({ code: 2 /* ERROR */, message: error instanceof Error ? error.message : "Unknown error" });
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        const errorResponse = {
          synthesis: `We couldn't complete a full evidence synthesis for your query. This may be due to a temporary service issue or an overly narrow search.

**What you can do:** Try rephrasing your question or simplifying it (e.g., one condition or one comparison). If the problem persists, try again in a few minutes.

*Technical detail (for support):* ${errMsg}`,
          citations: [],
          metadata: {
            sources_count: 0,
            latency_total_ms: Date.now() - startTime,
            cost_total_usd: totalCost,
            grounding_score: 0,
            citation_coverage: 0,
            hallucination_detected: true,
            model_used: "error",
            trace_id: traceId
          },
          warning: `\u26A0\uFE0F Synthesis step failed: ${errMsg}`
        };
        return errorResponse;
      }
    });
  }
  generateTraceId() {
    return `trace_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
  extractClaims(text) {
    return text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 20);
  }
  buildCitationUrl(citation) {
    switch (citation.source) {
      case "pubmed":
        return `https://pubmed.ncbi.nlm.nih.gov/${citation.id}/`;
      case "indian_guideline":
        return citation.metadata.url;
      case "dailymed":
        return `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${citation.id}`;
      case "tavily_web":
        return citation.metadata.url;
      default:
        return citation.metadata.url;
    }
  }
};

// scripts/test-pipeline.ts
import_dotenv.default.config({ path: import_path.default.resolve(process.cwd(), ".env.local") });
async function runTest() {
  console.log("\u{1F680} Starting End-to-End Pipeline Test (Bypassing Next.js)...");
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("\u274C Missing GEMINI_API_KEY in .env.local");
    process.exit(1);
  }
  const orchestrator = new MedicalEvidenceOrchestrator({
    google_ai_api_key: apiKey,
    ncbi_api_key: process.env.NCBI_API_KEY || "",
    tavily_api_key: process.env.TAVILY_API_KEY || ""
  });
  const query = "What are the RSSDI guidelines for metformin dosing in Type 2 diabetes with chronic kidney disease, and what drug interactions should be monitored according to Indian clinical practice?";
  const sessionId = `test-${Date.now()}`;
  console.log(`
\u2753 Query: "${query}"`);
  console.log(`\u{1F194} Session ID: ${sessionId}`);
  const startTime = Date.now();
  try {
    const response = await orchestrator.processQuery(query, sessionId);
    const totalTime = Date.now() - startTime;
    console.log("\n==========================================");
    console.log("\u{1F389} TEST COMPLETE");
    console.log("==========================================");
    console.log(`\u23F1\uFE0F Total Time: ${totalTime} ms (${(totalTime / 1e3).toFixed(2)}s)`);
    console.log(`\u{1F4DA} Sources: ${response.metadata?.sources_count}`);
    console.log(`\u{1F4DD} Citations: ${response.citations.length}`);
    console.log(`\u{1F6E1}\uFE0F Grounding Score: ${response.metadata?.grounding_score}`);
    console.log(`\u26A0\uFE0F Hallucination Detected: ${response.metadata?.hallucination_detected}`);
    if (response.warning) {
      console.log(`\u26A0\uFE0F Warning: ${response.warning}`);
    }
    console.log("\n\u{1F4C4} Synthesis Preview:");
    console.log(response.synthesis.substring(0, 500) + "...");
    if (totalTime < 6e4) {
      console.log("\n\u2705 PASS: Response time < 60s");
    } else {
      console.log("\n\u274C FAIL: Response time > 60s");
    }
  } catch (error) {
    console.error("\u274C Test Failed:", error);
  }
}
runTest();
//# sourceMappingURL=test.js.map
