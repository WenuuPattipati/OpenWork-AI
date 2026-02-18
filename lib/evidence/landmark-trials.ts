/**
 * Landmark Clinical Trials Database
 * 
 * Curated database of landmark trials for quick reference and citation.
 * These are high-impact trials that frequently inform clinical practice.
 */

export interface LandmarkTrial {
  acronym: string;
  fullName: string;
  pmid: string;
  doi: string;
  journal: string;
  year: number;
  url: string;
  primaryOutcome: string;
  population: string;
  intervention: string;
  comparator: string;
  keyFinding: string;
  keywords: string[]; // For matching queries
  specialty: 'Cardiology' | 'Endocrinology' | 'Nephrology' | 'Neurology' | 'Oncology' | 'Infectious Disease' | 'Other';
}

/**
 * Curated list of landmark trials
 * Priority: Cardiology (DAPT, HF, AF), Diabetes, CKD
 */
export const LANDMARK_TRIALS: LandmarkTrial[] = [
  // ========== DAPT / PCI Trials ==========
  {
    acronym: "MASTER-DAPT",
    fullName: "Management of High Bleeding Risk Patients Post Bioresorbable Polymer Coated Stent Implantation With an Abbreviated Versus Prolonged DAPT Regimen",
    pmid: "34449185",
    doi: "10.1056/NEJMoa2108749",
    journal: "New England Journal of Medicine",
    year: 2021,
    url: "https://pubmed.ncbi.nlm.nih.gov/34449185",
    primaryOutcome: "Net adverse clinical events (death, MI, stroke, major bleeding)",
    population: "High bleeding risk patients after DES implantation (n=4,579)",
    intervention: "1-month DAPT followed by clopidogrel monotherapy",
    comparator: "Standard DAPT (≥3 months)",
    keyFinding: "1-month DAPT was non-inferior for net adverse clinical events and reduced bleeding (6.5% vs 9.4%, p<0.001)",
    keywords: ["dapt", "dual antiplatelet", "high bleeding risk", "hbr", "stent", "des", "abbreviated", "master"],
    specialty: "Cardiology"
  },
  {
    acronym: "TWILIGHT",
    fullName: "Ticagrelor with or without Aspirin in High-Risk Patients after PCI",
    pmid: "31556978",
    doi: "10.1056/NEJMoa1908419",
    journal: "New England Journal of Medicine",
    year: 2019,
    url: "https://pubmed.ncbi.nlm.nih.gov/31556978",
    primaryOutcome: "Clinically relevant bleeding (BARC 2, 3, or 5)",
    population: "High-risk patients after PCI (n=7,119)",
    intervention: "Ticagrelor monotherapy after 3 months DAPT",
    comparator: "Ticagrelor + aspirin",
    keyFinding: "Ticagrelor monotherapy reduced bleeding (4.0% vs 7.1%, p<0.001) without increasing ischemic events",
    keywords: ["dapt", "ticagrelor", "aspirin", "monotherapy", "pci", "twilight"],
    specialty: "Cardiology"
  },
  {
    acronym: "STOPDAPT-2",
    fullName: "Short vs. Prolonged DAPT After Drug-Eluting Stent Implantation",
    pmid: "31196997",
    doi: "10.1001/jama.2019.8145",
    journal: "JAMA",
    year: 2019,
    url: "https://pubmed.ncbi.nlm.nih.gov/31196997",
    primaryOutcome: "Cardiovascular death, MI, stroke, stent thrombosis, or major/minor bleeding",
    population: "Patients after DES implantation (n=3,045)",
    intervention: "1-month DAPT followed by clopidogrel monotherapy",
    comparator: "12-month DAPT",
    keyFinding: "1-month DAPT was non-inferior for composite outcome (2.36% vs 3.70%, p<0.001 for non-inferiority)",
    keywords: ["dapt", "clopidogrel", "monotherapy", "des", "stopdapt"],
    specialty: "Cardiology"
  },

  // ========== Heart Failure Trials ==========
  {
    acronym: "DAPA-HF",
    fullName: "Dapagliflozin in Patients with Heart Failure and Reduced Ejection Fraction",
    pmid: "31535829",
    doi: "10.1056/NEJMoa1911303",
    journal: "New England Journal of Medicine",
    year: 2019,
    url: "https://pubmed.ncbi.nlm.nih.gov/31535829",
    primaryOutcome: "Cardiovascular death or worsening heart failure",
    population: "HFrEF patients (EF ≤40%) with or without diabetes (n=4,744)",
    intervention: "Dapagliflozin 10mg daily",
    comparator: "Placebo",
    keyFinding: "Dapagliflozin reduced primary outcome (16.3% vs 21.2%, HR 0.74, p<0.001)",
    keywords: ["heart failure", "hfref", "dapagliflozin", "sglt2", "sglt2i"],
    specialty: "Cardiology"
  },
  {
    acronym: "EMPEROR-Reduced",
    fullName: "Empagliflozin in Heart Failure with a Reduced Ejection Fraction",
    pmid: "32865377",
    doi: "10.1056/NEJMoa2022190",
    journal: "New England Journal of Medicine",
    year: 2020,
    url: "https://pubmed.ncbi.nlm.nih.gov/32865377",
    primaryOutcome: "Cardiovascular death or hospitalization for heart failure",
    population: "HFrEF patients (EF ≤40%) with or without diabetes (n=3,730)",
    intervention: "Empagliflozin 10mg daily",
    comparator: "Placebo",
    keyFinding: "Empagliflozin reduced primary outcome (19.4% vs 24.7%, HR 0.75, p<0.001)",
    keywords: ["heart failure", "hfref", "empagliflozin", "sglt2", "sglt2i"],
    specialty: "Cardiology"
  },
  {
    acronym: "EMPEROR-Preserved",
    fullName: "Empagliflozin in Heart Failure with a Preserved Ejection Fraction",
    pmid: "34449189",
    doi: "10.1056/NEJMoa2107038",
    journal: "New England Journal of Medicine",
    year: 2021,
    url: "https://pubmed.ncbi.nlm.nih.gov/34449189",
    primaryOutcome: "Cardiovascular death or hospitalization for heart failure",
    population: "HFpEF patients (EF >40%) (n=5,988)",
    intervention: "Empagliflozin 10mg daily",
    comparator: "Placebo",
    keyFinding: "Empagliflozin reduced primary outcome (13.8% vs 17.1%, HR 0.79, p<0.001)",
    keywords: ["heart failure", "hfpef", "preserved ejection fraction", "empagliflozin", "sglt2"],
    specialty: "Cardiology"
  },
  {
    acronym: "DELIVER",
    fullName: "Dapagliflozin in Heart Failure with Mildly Reduced or Preserved Ejection Fraction",
    pmid: "35878313",
    doi: "10.1056/NEJMoa2206286",
    journal: "New England Journal of Medicine",
    year: 2022,
    url: "https://pubmed.ncbi.nlm.nih.gov/35878313",
    primaryOutcome: "Cardiovascular death or worsening heart failure",
    population: "HFpEF/HFmrEF patients (EF >40%) (n=6,263)",
    intervention: "Dapagliflozin 10mg daily",
    comparator: "Placebo",
    keyFinding: "Dapagliflozin reduced primary outcome (16.4% vs 19.5%, HR 0.82, p<0.001)",
    keywords: ["heart failure", "hfpef", "hfmref", "preserved ejection fraction", "dapagliflozin", "sglt2"],
    specialty: "Cardiology"
  },

  // ========== CKD / Diabetes Trials ==========
  {
    acronym: "DAPA-CKD",
    fullName: "Dapagliflozin in Patients with Chronic Kidney Disease",
    pmid: "32970396",
    doi: "10.1056/NEJMoa2025816",
    journal: "New England Journal of Medicine",
    year: 2020,
    url: "https://pubmed.ncbi.nlm.nih.gov/32970396",
    primaryOutcome: "Sustained decline in eGFR ≥50%, ESRD, or death from renal or cardiovascular causes",
    population: "CKD patients (eGFR 25-75, UACR 200-5000) with or without diabetes (n=4,304)",
    intervention: "Dapagliflozin 10mg daily",
    comparator: "Placebo",
    keyFinding: "Dapagliflozin reduced primary outcome (9.2% vs 14.5%, HR 0.61, p<0.001)",
    keywords: ["ckd", "chronic kidney disease", "dapagliflozin", "sglt2", "renal"],
    specialty: "Nephrology"
  },
  {
    acronym: "EMPA-KIDNEY",
    fullName: "Empagliflozin in Patients with Chronic Kidney Disease",
    pmid: "36331190",
    doi: "10.1056/NEJMoa2204233",
    journal: "New England Journal of Medicine",
    year: 2023,
    url: "https://pubmed.ncbi.nlm.nih.gov/36331190",
    primaryOutcome: "Progression of kidney disease or death from cardiovascular causes",
    population: "CKD patients (eGFR 20-45 or eGFR 45-90 with UACR ≥200) (n=6,609)",
    intervention: "Empagliflozin 10mg daily",
    comparator: "Placebo",
    keyFinding: "Empagliflozin reduced primary outcome (13.1% vs 16.9%, HR 0.72, p<0.001)",
    keywords: ["ckd", "chronic kidney disease", "empagliflozin", "sglt2", "renal"],
    specialty: "Nephrology"
  },
  {
    acronym: "CREDENCE",
    fullName: "Canagliflozin and Renal Events in Diabetes with Established Nephropathy Clinical Evaluation",
    pmid: "30990260",
    doi: "10.1056/NEJMoa1811744",
    journal: "New England Journal of Medicine",
    year: 2019,
    url: "https://pubmed.ncbi.nlm.nih.gov/30990260",
    primaryOutcome: "ESRD, doubling of serum creatinine, or death from renal or cardiovascular causes",
    population: "Type 2 diabetes with albuminuric CKD (n=4,401)",
    intervention: "Canagliflozin 100mg daily",
    comparator: "Placebo",
    keyFinding: "Canagliflozin reduced primary outcome (11.1 vs 15.5 events per 1000 patient-years, HR 0.70, p<0.001)",
    keywords: ["diabetes", "ckd", "canagliflozin", "sglt2", "nephropathy"],
    specialty: "Nephrology"
  },

  // ========== Atrial Fibrillation Trials ==========
  {
    acronym: "NOAH-AFNET 6",
    fullName: "Edoxaban for Subclinical Atrial Fibrillation",
    pmid: "37634143",
    doi: "10.1056/NEJMoa2303062",
    journal: "New England Journal of Medicine",
    year: 2023,
    url: "https://pubmed.ncbi.nlm.nih.gov/37634143",
    primaryOutcome: "Cardiovascular death, stroke, or systemic embolism",
    population: "Patients with subclinical AF (AHRE) and cardiovascular risk factors (n=2,536)",
    intervention: "Edoxaban 60mg (or 30mg) daily",
    comparator: "Placebo (or aspirin)",
    keyFinding: "Edoxaban did not significantly reduce primary outcome (3.8% vs 4.0%, HR 0.81, p=0.15) but increased major bleeding",
    keywords: ["atrial fibrillation", "subclinical af", "ahre", "edoxaban", "anticoagulation"],
    specialty: "Cardiology"
  },
  {
    acronym: "ARTESIA",
    fullName: "Apixaban for the Reduction of Thrombo-Embolism in Patients With Device-Detected Sub-Clinical Atrial Fibrillation",
    pmid: "37952133",
    doi: "10.1056/NEJMoa2310234",
    journal: "New England Journal of Medicine",
    year: 2023,
    url: "https://pubmed.ncbi.nlm.nih.gov/37952133",
    primaryOutcome: "Stroke or systemic embolism",
    population: "Patients with subclinical AF detected by cardiac implantable electronic devices (n=4,012)",
    intervention: "Apixaban 5mg (or 2.5mg) twice daily",
    comparator: "Aspirin 81mg daily",
    keyFinding: "Apixaban reduced stroke/embolism (0.78% vs 1.24% per year, HR 0.63, p=0.004) but increased major bleeding (1.71% vs 0.94% per year, HR 1.80, p=0.002)",
    keywords: ["atrial fibrillation", "subclinical af", "ahre", "apixaban", "anticoagulation"],
    specialty: "Cardiology"
  },

  // ========== Stroke Trials ==========
  {
    acronym: "NINDS rt-PA",
    fullName: "Tissue Plasminogen Activator for Acute Ischemic Stroke",
    pmid: "7477192",
    doi: "10.1056/NEJM199512143332401",
    journal: "New England Journal of Medicine",
    year: 1995,
    url: "https://pubmed.ncbi.nlm.nih.gov/7477192",
    primaryOutcome: "Minimal or no disability at 3 months",
    population: "Acute ischemic stroke within 3 hours (n=624)",
    intervention: "IV alteplase 0.9 mg/kg",
    comparator: "Placebo",
    keyFinding: "Alteplase increased favorable outcome at 3 months (31-50% vs 20-38%, p<0.05)",
    keywords: ["stroke", "ischemic stroke", "tpa", "alteplase", "thrombolysis"],
    specialty: "Neurology"
  },

  // ========== Sepsis Trials ==========
  {
    acronym: "ARISE",
    fullName: "Goal-Directed Resuscitation for Patients with Early Septic Shock",
    pmid: "25272316",
    doi: "10.1056/NEJMoa1404380",
    journal: "New England Journal of Medicine",
    year: 2014,
    url: "https://pubmed.ncbi.nlm.nih.gov/25272316",
    primaryOutcome: "All-cause mortality at 90 days",
    population: "Early septic shock (n=1,600)",
    intervention: "Early goal-directed therapy (EGDT)",
    comparator: "Usual care",
    keyFinding: "EGDT did not reduce mortality (18.6% vs 18.8%, p=0.90)",
    keywords: ["sepsis", "septic shock", "egdt", "resuscitation"],
    specialty: "Infectious Disease"
  },
];

/**
 * Search landmark trials by query
 * Uses keyword matching to find relevant trials
 */
export function searchLandmarkTrials(
  query: string,
  maxResults: number = 5
): LandmarkTrial[] {
  const queryLower = query.toLowerCase();
  const matches: { trial: LandmarkTrial; score: number }[] = [];

  for (const trial of LANDMARK_TRIALS) {
    let score = 0;

    // Check acronym match (high weight)
    if (queryLower.includes(trial.acronym.toLowerCase())) {
      score += 100;
    }

    // Check keyword matches
    for (const keyword of trial.keywords) {
      if (queryLower.includes(keyword.toLowerCase())) {
        score += 10;
      }
    }

    // Check full name match (medium weight)
    const fullNameWords = trial.fullName.toLowerCase().split(' ');
    for (const word of fullNameWords) {
      if (word.length > 4 && queryLower.includes(word)) {
        score += 5;
      }
    }

    if (score > 0) {
      matches.push({ trial, score });
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);

  return matches.slice(0, maxResults).map(m => m.trial);
}

/**
 * Get trial by acronym (exact match)
 */
export function getTrialByAcronym(acronym: string): LandmarkTrial | undefined {
  return LANDMARK_TRIALS.find(
    t => t.acronym.toLowerCase() === acronym.toLowerCase()
  );
}

/**
 * Get all trials for a specialty
 */
export function getTrialsBySpecialty(
  specialty: LandmarkTrial['specialty']
): LandmarkTrial[] {
  return LANDMARK_TRIALS.filter(t => t.specialty === specialty);
}

/**
 * Format landmark trial for prompt injection
 */
export function formatLandmarkTrialForPrompt(trial: LandmarkTrial): string {
  return `
**${trial.acronym}** (${trial.year})
- Full Name: ${trial.fullName}
- Journal: ${trial.journal}
- PMID: ${trial.pmid}
- DOI: ${trial.doi}
- URL: ${trial.url}
- Population: ${trial.population}
- Intervention: ${trial.intervention} vs ${trial.comparator}
- Primary Outcome: ${trial.primaryOutcome}
- Key Finding: ${trial.keyFinding}
`.trim();
}

/**
 * Format multiple trials for prompt
 */
export function formatLandmarkTrialsForPrompt(trials: LandmarkTrial[]): string {
  if (trials.length === 0) return '';

  let formatted = '\n\n--- LANDMARK CLINICAL TRIALS ---\n\n';
  formatted += '⭐ These are high-impact trials that inform current clinical practice.\n';
  formatted += '⭐ Cite these trials when making evidence-based recommendations.\n\n';

  trials.forEach((trial, i) => {
    formatted += `${i + 1}. ${formatLandmarkTrialForPrompt(trial)}\n\n`;
  });

  formatted += '--- END LANDMARK TRIALS ---\n\n';
  return formatted;
}
