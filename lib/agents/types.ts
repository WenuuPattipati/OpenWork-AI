/**
 * Core Types for 7-Agent Medical Evidence Synthesis System
 * Based on project.md workflow diagram
 */

export interface TraceContext {
  traceId: string;
  sessionId: string;
  timestamp: number;
}

export interface AgentResult<T = any> {
  success: boolean;
  data: T;
  error?: string;
  latency_ms: number;
  metadata?: Record<string, any>;
  cost_usd?: number;
  tokens?: {
    input: number;
    output: number;
    total: number;
  };
}

// Agent 1: Query Intelligence Output
export interface QueryAnalysis {
  intent: 'clinical_decision' | 'education' | 'drug_information' | 'diagnostics';
  // Optional human-readable query type label (for logging / analytics)
  query_type?: string;
  entities: {
    diseases: string[];
    drugs: string[];
    procedures: string[];
  };
  abbreviations_expanded: Record<string, string>;
  search_variants: string[];
  // NEW: Sub-agent specific queries and routing decisions
  sub_agent_queries: {
    guidelines?: {
      should_call: boolean;
      rephrased_queries: string[];
      reasoning: string;
    };
    pubmed?: {
      should_call: boolean;
      rephrased_queries: string[];
      mesh_terms: string[];
      reasoning: string;
    };
    dailymed?: {
      should_call: boolean;
      drug_names: string[];
      reasoning: string;
    };
    tavily?: {
      should_call: boolean;
      original_query: string;
      reasoning: string;
    };
  };
  requires_sources: {
    guidelines: boolean;
    pubmed: boolean;
    dailymed: boolean;
    recent_web: boolean;
  };
  // Optional list of medical specialties/domains inferred from the query
  medical_domains?: string[];
  temporal_markers: string[];
  complexity_score: number; // 0-1, determines if Pro model needed
}

// Agent 2: Multi-Source Retrieval Output
export interface EvidenceCandidate {
  source: 'pubmed' | 'indian_guideline' | 'dailymed' | 'tavily_web' | 'clinical_trials' | 'cochrane' | 'bmj_best_practice' | 'nice' | 'who' | 'cdc' | 'landmark_trials' | 'semantic_scholar' | 'europe_pmc' | 'pmc' | 'openalex';
  id: string;
  title: string;
  text: string;
  metadata: Record<string, any>;
  full_text_available: boolean;
  full_text_sections?: Record<string, string>;
  
  // Enhanced full-text processing support
  selected_sections?: Array<{
    section_title: string;
    section_type: string;
    relevance_score: number;
    content_summary: string;
    chunk_count: number;
  }>;
  content_chunks?: Array<{
    chunk_id: string;
    parent_article: string;
    child_section: string;
    chunk_index: number;
    content: string;
    relevance_score: number;
    content_type: 'text' | 'table' | 'figure_caption';
  }>;
  full_text_source?: 'pmc' | 'unpaywall' | 'enhanced_abstract' | 'available_content';
  pdf_url?: string;
  sections_analyzed?: number;
  sections_selected?: number;
  total_chunks?: number;
}

// Agent 4: BGE Re-ranker Output
export interface RankedEvidence {
  rank: number;
  score: number;
  source: string;
  id: string;
  title: string;
  text: string;
  metadata: Record<string, any>;
  chunk_info?: {
    section?: string;
    chunk_index?: number;
  };
}

// Agent 5: Evidence Gap Analysis Output
export interface EvidenceGapAnalysis {
  assessment: 'sufficient' | 'partial' | 'insufficient';
  coverage_score: number; // 0-1
  recency_concerns: boolean;
  oldest_source_year: number;
  quality_distribution: {
    guidelines: number;
    rcts: number;
    observational: number;
    reviews: number;
  };
  contradictions_detected: boolean;
  contradiction_summary?: string;
  missing_elements: string[];
  recommendation: 'proceed' | 'search_recent' | 'search_specific_gap';
}

// Agent 6: Synthesis Output
export interface SynthesisResult {
  synthesis: string;
  citations: Array<{
    number: number;
    source: string;
    id: string;
    title: string;
    metadata: Record<string, any>;
  }>;
  evidence_pack: RankedEvidence[];
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
  model_used: string;
  warning?: string;
}

// Agent 7: Verification Output
export interface VerificationResult {
  total_claims: number;
  cited_claims: number;
  uncited_claims: string[];
  invalid_citations: number[];
  unsupported_claims: Array<{
    claim: string;
    citations: number[];
  }>;
  hallucination_detected: boolean;
  grounding_score: number; // 0-1
  passed: boolean;
  warning?: string;
}

// Sub-Agent Results
export interface GuidelineSearchResult {
  chunk_id: string;
  guideline_id: string;
  organization: string;
  title: string;
  year: number;
  text: string;
  similarity_score: number;
}

export interface PubMedSearchResult {
  pmid: string;
  title: string;
  abstract: string;
  authors: string[];
  journal: string;
  pub_date: string;
  pub_types: string[];
  doi?: string;
  pmcid?: string;
  full_text_available: boolean;
}

export interface DailyMedSearchResult {
  setid: string;
  drug_name: string;
  title: string;
  published: string;
  sections: Record<string, string>;
}

export interface TavilySearchResult {
  url: string;
  title: string;
  content: string;
  score: number;
  published_date?: string;
}

// Final Response Structure
export interface MedicalEvidenceResponse {
  synthesis: string;
  citations: Array<{
    number: number;
    source: string;
    id: string;
    title: string;
    url?: string;
    metadata: Record<string, any>;
  }>;
  metadata: {
    sources_count: number;
    latency_total_ms: number;
    cost_total_usd: number;
    grounding_score: number;
    citation_coverage: number;
    hallucination_detected: boolean;
    model_used: string;
    trace_id: string;
  };
  warning?: string;
}