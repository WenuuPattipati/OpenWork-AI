/**
 * Query-Evidence Matcher
 * Routes queries to the most relevant evidence sources
 */

export interface QueryType {
  disease: string[];
  decisions: string[];
  complexity: 'simple' | 'complex' | 'failure';
}

export interface EvidenceStrategy {
  primarySources: string[];
  secondarySources: string[];
  avoidSources: string[];
  requiredGuidelines: string[];
  preferredJournals: string[];
}

/**
 * Map query types to optimal evidence strategies
 */
export const EVIDENCE_STRATEGIES: Record<string, EvidenceStrategy> = {
  // VTE Queries
  'vte_anticoagulation': {
    primarySources: ['CHEST_VTE_2021', 'ESC_PE_2019', 'NEJM_VTE_Reviews', 'JAMA_VTE_Reviews'],
    secondarySources: ['Cochrane_VTE', 'Lancet_VTE'],
    avoidSources: ['AF_Guidelines', 'Cardiology_Non_VTE'],
    requiredGuidelines: ['CHEST 2021 VTE', 'ESC PE 2019'],
    preferredJournals: ['NEJM', 'JAMA', 'Lancet', 'Circulation']
  },
  
  'vte_failure': {
    primarySources: ['CHEST_VTE_2021', 'NEJM_PE_2022', 'JAMA_VTE_2020'],
    secondarySources: ['Cochrane_Anticoagulation', 'Thrombosis_Research'],
    avoidSources: ['AF_Guidelines', 'General_Cardiology'],
    requiredGuidelines: ['CHEST 2021 VTE'],
    preferredJournals: ['NEJM', 'JAMA', 'Blood', 'Thrombosis and Haemostasis']
  },
  
  // AF Queries  
  'af_anticoagulation': {
    primarySources: ['ACC_AHA_AF_2023', 'ESC_AF_2026', 'NEJM_AF_Reviews'],
    secondarySources: ['Cochrane_AF', 'Circulation_AF'],
    avoidSources: ['VTE_Specific', 'Non_AF_Cardiology'],
    requiredGuidelines: ['ACC/AHA/ACCP/HRS AF 2023', 'ESC AF 2026'],
    preferredJournals: ['NEJM', 'Circulation', 'JACC', 'European Heart Journal']
  },
  
  // CAP Queries
  'cap_antibiotics': {
    primarySources: ['IDSA_ATS_CAP_2019', 'Cochrane_CAP', 'NEJM_CAP_Reviews'],
    secondarySources: ['CID_CAP', 'JAMA_Antibiotics'],
    avoidSources: ['Cardiology', 'Non_Infectious'],
    requiredGuidelines: ['IDSA/ATS CAP 2019'],
    preferredJournals: ['NEJM', 'JAMA', 'Clinical Infectious Diseases', 'Lancet Infectious Diseases']
  },
  
  // HF Queries
  'hf_management': {
    primarySources: ['ACC_AHA_HF_2022', 'ESC_HF_2023', 'NEJM_HF_Reviews'],
    secondarySources: ['Cochrane_HF', 'Circulation_HF'],
    avoidSources: ['Non_Cardiology', 'AF_Specific'],
    requiredGuidelines: ['ACC/AHA/HFSA HF 2022', 'ESC HF 2023'],
    preferredJournals: ['NEJM', 'Circulation', 'JACC', 'European Heart Journal']
  }
};

/**
 * Classify query and return optimal evidence strategy
 */
export function getEvidenceStrategy(queryAnalysis: any): EvidenceStrategy {
  // VTE-specific queries
  if (queryAnalysis.isVTE && queryAnalysis.hasFailure) {
    return EVIDENCE_STRATEGIES.vte_failure;
  }
  if (queryAnalysis.isVTE) {
    return EVIDENCE_STRATEGIES.vte_anticoagulation;
  }
  
  // AF-specific queries
  if (queryAnalysis.isAF) {
    return EVIDENCE_STRATEGIES.af_anticoagulation;
  }
  
  // CAP-specific queries
  if (queryAnalysis.isCAP) {
    return EVIDENCE_STRATEGIES.cap_antibiotics;
  }
  
  // HF-specific queries
  if (queryAnalysis.isHF) {
    return EVIDENCE_STRATEGIES.hf_management;
  }
  
  // Default strategy for unclassified queries
  return {
    primarySources: ['Guidelines', 'Cochrane', 'NEJM_Reviews'],
    secondarySources: ['PubMed_Reviews', 'PMC_Articles'],
    avoidSources: [],
    requiredGuidelines: [],
    preferredJournals: ['NEJM', 'JAMA', 'Lancet', 'BMJ']
  };
}

/**
 * Filter evidence based on strategy
 */
export function filterEvidenceByStrategy(evidence: any, strategy: EvidenceStrategy): any {
  // This would filter the evidence package to prioritize sources
  // matching the strategy and de-prioritize avoided sources
  
  console.log(`🎯 Applying evidence strategy:`);
  console.log(`   Primary sources: ${strategy.primarySources.join(', ')}`);
  console.log(`   Required guidelines: ${strategy.requiredGuidelines.join(', ')}`);
  console.log(`   Preferred journals: ${strategy.preferredJournals.join(', ')}`);
  
  return evidence; // Implementation would filter/rerank evidence
}