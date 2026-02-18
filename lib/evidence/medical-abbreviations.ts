/**
 * Medical Abbreviations Dictionary
 * 
 * Comprehensive mapping of medical abbreviations to full terms.
 * Used for query expansion, evidence matching, and image retrieval.
 */

export const MED_ABBREVS: Record<string, string> = {
  // ================== THROMBOSIS & ANTICOAGULATION ==================
  VTE: "venous thromboembolism",
  DVT: "deep vein thrombosis",
  PE: "pulmonary embolism",
  LMWH: "low-molecular-weight heparin",
  DOAC: "direct oral anticoagulant",
  UFH: "unfractionated heparin",
  VKA: "vitamin K antagonist",
  NOAC: "non-vitamin K oral anticoagulant",
  CAT: "cancer-associated thrombosis",
  
  // Cardiovascular
  HF: "heart failure",
  HFpEF: "heart failure with preserved ejection fraction",
  HFrEF: "heart failure with reduced ejection fraction",
  AF: "atrial fibrillation",
  AFL: "atrial flutter",
  ACS: "acute coronary syndrome",
  CAD: "coronary artery disease",
  PAD: "peripheral artery disease",
  MI: "myocardial infarction",
  STEMI: "ST-elevation myocardial infarction",
  NSTEMI: "non–ST-elevation myocardial infarction",
  "NSTE-ACS": "non-ST elevation acute coronary syndrome",
  NSTEACS: "non-ST elevation acute coronary syndrome",
  PCI: "percutaneous coronary intervention",
  CABG: "coronary artery bypass grafting",
  BP: "blood pressure",
  ACC: "American College of Cardiology",
  AHA: "American Heart Association",
  ESC: "European Society of Cardiology",
  DAPT: "dual antiplatelet therapy",
  CrCl: "creatinine clearance",
  
  // ================== RENAL & NEPHROLOGY ==================
  CKD: "chronic kidney disease",
  AKI: "acute kidney injury",
  ESRD: "end-stage renal disease",
  RRT: "renal replacement therapy",
  eGFR: "estimated glomerular filtration rate",
  KDIGO: "Kidney Disease Improving Global Outcomes",
  KDOQI: "Kidney Disease Outcomes Quality Initiative",
  RAAS: "renin-angiotensin-aldosterone system",
  RASi: "renin-angiotensin system inhibitor",
  MRA: "mineralocorticoid receptor antagonist",
  SGLT2i: "sodium-glucose cotransporter-2 inhibitor",
  SGLT2: "sodium-glucose cotransporter-2",
  
  // Endocrine
  DM: "diabetes mellitus",
  T1DM: "type 1 diabetes mellitus",
  T2DM: "type 2 diabetes mellitus",
  HbA1c: "glycated hemoglobin",
  GLP1: "glucagon-like peptide-1",
  "GLP-1": "glucagon-like peptide-1",
  ADA: "American Diabetes Association",
  
  // Pulmonary
  COPD: "chronic obstructive pulmonary disease",
  CAP: "community-acquired pneumonia",
  HAP: "hospital-acquired pneumonia",
  ARDS: "acute respiratory distress syndrome",
  OSA: "obstructive sleep apnea",
  
  // Medications
  HTN: "hypertension",
  ACEi: "angiotensin-converting enzyme inhibitor",
  ARB: "angiotensin receptor blocker",
  ARNI: "angiotensin receptor–neprilysin inhibitor",
  BB: "beta-blocker",
  CCB: "calcium channel blocker",
  
  // ================== NEUROLOGY & NEURO-ONCOLOGY ==================
  
  // Stroke & Cerebrovascular
  TIA: "transient ischemic attack",
  CVA: "cerebrovascular accident",
  ICH: "intracerebral hemorrhage",
  SAH: "subarachnoid hemorrhage",
  NIHSS: "National Institutes of Health Stroke Scale",
  mRS: "modified Rankin Scale",
  ASPECTS: "Alberta Stroke Program Early CT Score",
  tPA: "tissue plasminogen activator",
  MCA: "middle cerebral artery",
  ACA: "anterior cerebral artery",
  PCA: "posterior cerebral artery",
  VA: "vertebral artery",
  BA: "basilar artery",
  PFO: "patent foramen ovale",
  
  // Neuro-Oncology & Brain Tumors
  WHO_grade: "World Health Organization grade",
  IDH: "isocitrate dehydrogenase",
  MGMT: "O6-methylguanine-DNA methyltransferase",
  TP53: "tumor protein 53",
  EGFR: "epidermal growth factor receptor",
  NF2: "neurofibromin 2",
  TERT: "telomerase reverse transcriptase",
  PTEN: "phosphatase and tensin homolog",
  TMZ: "temozolomide",
  BCNU: "carmustine",
  CCNU: "lomustine",
  PFS: "progression-free survival",
  OS: "overall survival",
  KPS: "Karnofsky Performance Status",
  ECOG: "Eastern Cooperative Oncology Group",
  CSF: "cerebrospinal fluid",
  SFT_HPC: "solitary fibrous tumor hemangiopericytoma",
  GBM: "glioblastoma multiforme",
  CNS: "central nervous system",
  BBB: "blood-brain barrier",
  ICP: "intracranial pressure",
  
  // Neurosurgery & Procedures
  GTR: "gross total resection",
  STR: "subtotal resection",
  EVD: "external ventricular drain",
  SRS: "stereotactic radiosurgery",
  FSRS: "fractionated stereotactic radiotherapy",
  EBRT: "external beam radiation therapy",
  IMRT: "intensity-modulated radiation therapy",
  MEP: "motor evoked potentials",
  SSEP: "somatosensory evoked potentials",
  EMG: "electromyography",
  
  // Seizures & Epilepsy
  AED: "antiepileptic drug",
  GTCS: "generalized tonic-clonic seizure",
  LEV: "levetiracetam",
  VPA: "valproic acid",
  PHT: "phenytoin",
  CBZ: "carbamazepine",
  LTG: "lamotrigine",
  
  // Dementia & Neurodegenerative
  AD: "Alzheimer disease",
  PD: "Parkinson disease",
  FTD: "frontotemporal dementia",
  LBD: "Lewy body dementia",
  MMSE: "Mini-Mental State Examination",
  MoCA: "Montreal Cognitive Assessment",
  
  // ================== LABORATORY MEDICINE ==================
  
  // Hematology
  CBC: "complete blood count",
  WBC: "white blood cell count",
  RBC: "red blood cell count",
  Hgb: "hemoglobin",
  Hct: "hematocrit",
  Plt: "platelet count",
  MCV: "mean corpuscular volume",
  MCH: "mean corpuscular hemoglobin",
  MCHC: "mean corpuscular hemoglobin concentration",
  RDW: "red cell distribution width",
  MPV: "mean platelet volume",
  
  // Coagulation
  PT: "prothrombin time",
  PTT: "partial thromboplastin time",
  aPTT: "activated partial thromboplastin time",
  INR: "international normalized ratio",
  D_dimer: "D-dimer",
  
  // Chemistry
  BMP: "basic metabolic panel",
  CMP: "comprehensive metabolic panel",
  BUN: "blood urea nitrogen",
  Cr: "creatinine",
  Na: "sodium",
  K: "potassium",
  Cl: "chloride",
  CO2: "carbon dioxide",
  Ca: "calcium",
  Mg: "magnesium",
  P: "phosphate",
  Gluc: "glucose",
  
  // Liver Function
  ALT: "alanine aminotransferase",
  AST: "aspartate aminotransferase",
  ALP: "alkaline phosphatase",
  Bili: "bilirubin",
  Alb: "albumin",
  
  // Cardiac Markers
  BNP: "B-type natriuretic peptide",
  proBNP: "pro-B-type natriuretic peptide",
  Trop: "troponin",
  CK_MB: "creatine kinase MB",
  
  // Inflammatory Markers
  ESR: "erythrocyte sedimentation rate",
  CRP: "C-reactive protein",
  PCT: "procalcitonin",
  
  // Blood Gas
  ABG: "arterial blood gas",
  VBG: "venous blood gas",
  pCO2: "partial pressure of CO2",
  pO2: "partial pressure of O2",
  HCO3: "bicarbonate",
  Lac: "lactate",
  
  // Urinalysis
  UA: "urinalysis",
  
  // ================== ONCOLOGY ==================
  NSCLC: "non-small cell lung cancer",
  SCLC: "small cell lung cancer",
  CRC: "colorectal cancer",
  HCC: "hepatocellular carcinoma",
  RCC: "renal cell carcinoma",
  "PD-L1": "programmed death-ligand 1",
  PDL1: "programmed death-ligand 1",
  BRCA1: "breast cancer gene 1",
  BRCA2: "breast cancer gene 2",
  "BRCA1/2": "breast cancer genes 1 and 2",
  PARP: "poly (ADP-ribose) polymerase",
  NCCN: "National Comprehensive Cancer Network",
  
  // Staging & Response
  TNM: "tumor node metastasis staging",
  AJCC: "American Joint Committee on Cancer",
  RECIST: "Response Evaluation Criteria in Solid Tumors",
  CR: "complete response",
  PR: "partial response",
  SD: "stable disease",
  PD_disease: "progressive disease",
  ORR: "objective response rate",
  
  // Pathology
  IHC: "immunohistochemistry",
  FISH: "fluorescence in situ hybridization",
  PCR: "polymerase chain reaction",
  NGS: "next-generation sequencing",
  
  // Research Methodology
  RCT: "randomized controlled trial",
  OR: "odds ratio",
  RR_risk: "relative risk",
  HR_hazard: "hazard ratio",
  CI: "confidence interval",
  NNT: "number needed to treat",
  PPV: "positive predictive value",
  NPV: "negative predictive value",
  DDx: "differential diagnosis",
  
  // ================== INFECTIOUS DISEASE ==================
  UTI: "urinary tract infection",
  URI: "upper respiratory infection",
  SSTI: "skin and soft tissue infection",
  CDI: "Clostridioides difficile infection",
  MRSA: "methicillin-resistant Staphylococcus aureus",
  MSSA: "methicillin-susceptible Staphylococcus aureus",
  VRE: "vancomycin-resistant Enterococcus",
  ESBL: "extended-spectrum beta-lactamase",
  MDRO: "multidrug-resistant organism",
  
  // Systemic Infections
  SIRS: "systemic inflammatory response syndrome",
  Sepsis: "sepsis",
  IDSA: "Infectious Diseases Society of America",
  
  // Viral Infections
  HIV: "human immunodeficiency virus",
  AIDS: "acquired immunodeficiency syndrome",
  HBV: "hepatitis B virus",
  HCV: "hepatitis C virus",
  HBsAg: "hepatitis B surface antigen",
  Anti_HBs: "anti-hepatitis B surface antibody",
  HCV_RNA: "hepatitis C viral RNA",
  CMV: "cytomegalovirus",
  EBV: "Epstein-Barr virus",
  HSV: "herpes simplex virus",
  VZV: "varicella-zoster virus",
  
  // Bacterial Infections
  TB: "tuberculosis",
  C_diff: "Clostridioides difficile",
  MAC: "Mycobacterium avium complex",
  
  // Fungal Infections
  PCP: "Pneumocystis pneumonia",
  
  // ================== GASTROINTESTINAL & HEPATIC ==================
  GERD: "gastroesophageal reflux disease",
  PUD: "peptic ulcer disease",
  IBD: "inflammatory bowel disease",
  IBS: "irritable bowel syndrome",
  SBO: "small bowel obstruction",
  LBO: "large bowel obstruction",
  ERCP: "endoscopic retrograde cholangiopancreatography",
  EGD: "esophagogastroduodenoscopy",
  
  // Liver Disease
  NAFLD: "non-alcoholic fatty liver disease",
  NASH: "non-alcoholic steatohepatitis",
  HE: "hepatic encephalopathy",
  SBP_peritonitis: "spontaneous bacterial peritonitis",
  SAAG: "serum-ascites albumin gradient",
  MELD: "Model for End-Stage Liver Disease",
  Child_Pugh: "Child-Pugh score",
  APRI: "AST-to-platelet ratio index",
  FIB4: "fibrosis-4 index",
  
  // ================== NEUROLOGY ADDITIONAL ==================
  MS: "multiple sclerosis",
  ALS: "amyotrophic lateral sclerosis",
  GCS: "Glasgow Coma Scale",
  LOC: "loss of consciousness",
  LP: "lumbar puncture",
  EEG: "electroencephalogram",
  AMS: "altered mental status",
  
  // Multiple Sclerosis
  RRMS: "relapsing-remitting multiple sclerosis",
  SPMS: "secondary progressive multiple sclerosis",
  PPMS: "primary progressive multiple sclerosis",
  
  // Movement Disorders
  ET: "essential tremor",
  
  // Spine & Spinal Cord
  SCI: "spinal cord injury",
  LSS: "lumbar spinal stenosis",
  CSS: "cervical spinal stenosis",
  
  // ================== PSYCHIATRY ==================
  MDD: "major depressive disorder",
  GAD: "generalized anxiety disorder",
  PTSD: "post-traumatic stress disorder",
  
  // Cardiology (Additional)
  SVT: "supraventricular tachycardia",
  VT: "ventricular tachycardia",
  VF: "ventricular fibrillation",
  LVEF: "left ventricular ejection fraction",
  AAA: "abdominal aortic aneurysm",
  MVP: "mitral valve prolapse",
  JVD: "jugular venous distention",
  
  // Respiratory (Additional)
  PEF: "peak expiratory flow",
  FEV1: "forced expiratory volume in 1 second",
  FVC: "forced vital capacity",
  PFT: "pulmonary function test",
  BiPAP: "bilevel positive airway pressure",
  CPAP: "continuous positive airway pressure",
  ECMO: "extracorporeal membrane oxygenation",
  
  // Endocrinology (Additional)
  DKA: "diabetic ketoacidosis",
  HHS: "hyperosmolar hyperglycemic state",
  TSH: "thyroid-stimulating hormone",
  T3: "triiodothyronine",
  T4: "thyroxine",
  SIADH: "syndrome of inappropriate antidiuretic hormone secretion",
  PTH: "parathyroid hormone",
  

  
  // ================== GENERAL MEDICINE & EMERGENCY ==================
  ED: "emergency department",
  ICU: "intensive care unit",
  CCU: "cardiac care unit",
  MICU: "medical intensive care unit",
  SICU: "surgical intensive care unit",
  
  // Vital Signs & Measurements
  BMI: "body mass index",
  BSA: "body surface area",
  HR: "heart rate",
  RR: "respiratory rate",
  SpO2: "oxygen saturation",
  MAP: "mean arterial pressure",
  SBP: "systolic blood pressure",
  DBP: "diastolic blood pressure",
  
  // Code Status
  DNR: "do not resuscitate",
  DNI: "do not intubate",
  
  // Symptoms
  SOB: "shortness of breath",
  CP: "chest pain",
  NV: "nausea and vomiting",
  
  // Documentation
  Dx: "diagnosis",
  Hx: "history",
  Sx: "symptoms",
  Tx: "treatment",
  Rx: "prescription",
  PMH: "past medical history",
  PSH: "past surgical history",
  FH: "family history",
  SH: "social history",
  
  // ================== RADIOLOGY & IMAGING ==================
  
  // Basic Imaging Modalities
  CXR: "chest X-ray",
  CT: "computed tomography",
  CTA: "computed tomography angiography",
  MRI: "magnetic resonance imaging",
  MRA_img: "magnetic resonance angiography",
  US: "ultrasound",
  FAST: "focused assessment with sonography for trauma",
  PET: "positron emission tomography",
  SPECT: "single photon emission computed tomography",
  
  // MRI Sequences
  FLAIR: "fluid-attenuated inversion recovery",
  T1: "T1-weighted imaging",
  T2: "T2-weighted imaging",
  DWI: "diffusion-weighted imaging",
  ADC: "apparent diffusion coefficient",
  STIR: "short-tau inversion recovery",
  PWI: "perfusion-weighted imaging",
  DSC: "dynamic susceptibility contrast",
  DCE: "dynamic contrast-enhanced",
  ASL: "arterial spin labeling",
  DTI: "diffusion tensor imaging",
  
  // MRI Parameters
  TR: "repetition time",
  TE: "echo time",
  TI: "inversion time",
  FA: "flip angle",
  FOV: "field of view",
  SNR: "signal-to-noise ratio",
  
  // CT Parameters
  NCCT: "non-contrast CT",
  HU: "Hounsfield units",
  
  // Advanced Imaging
  MRS: "magnetic resonance spectroscopy",
  fMRI: "functional magnetic resonance imaging",
  BOLD: "blood oxygen level-dependent contrast",
  CBF: "cerebral blood flow",
  CBV: "cerebral blood volume",
  MTT: "mean transit time",
  
  // PET Tracers
  FDG: "fluorodeoxyglucose",
  
  // ================== RHEUMATOLOGY & IMMUNOLOGY ==================
  RA: "rheumatoid arthritis",
  OA: "osteoarthritis",
  SLE: "systemic lupus erythematosus",
  SS: "Sjögren syndrome",
  GCA: "giant cell arteritis",
  PAN: "polyarteritis nodosa",
  GPA: "granulomatosis with polyangiitis",
  
  // Autoantibodies
  ANA: "antinuclear antibody",
  RF: "rheumatoid factor",
  Anti_CCP: "anti-cyclic citrullinated peptide antibody",
  ANCA: "anti-neutrophil cytoplasmic antibody",
  dsDNA: "double-stranded DNA antibody",
  
  // Disease Activity
  DAS28: "Disease Activity Score 28",
  SDAI: "Simplified Disease Activity Index",
  
  // ================== PHARMACOLOGY ==================
  // Routes & Frequency
  IV: "intravenous",
  IM: "intramuscular",
  SC: "subcutaneous",
  PO: "per os (by mouth)",
  NPO: "nil per os (nothing by mouth)",
  PRN: "pro re nata (as needed)",
  BID: "bis in die (twice a day)",
  TID: "ter in die (three times a day)",
  QID: "quater in die (four times a day)",
  QD: "quaque die (every day)",
  QHS: "quaque hora somni (every night at bedtime)",
  AC: "ante cibum (before meals)",
  PC: "post cibum (after meals)",
  
  // ================== QUALITY & SAFETY ==================
  QI: "quality improvement",
  RCA: "root cause analysis",
  HAI: "healthcare-associated infection",
  VAP: "ventilator-associated pneumonia",
  CAUTI: "catheter-associated urinary tract infection",
  CLABSI: "central line-associated bloodstream infection",
  LOS: "length of stay",
  SBAR: "Situation-Background-Assessment-Recommendation",
};

/**
 * Expand abbreviations in a query or text
 */
export function expandMedicalAbbreviations(text: string): string {
  let expanded = text;
  
  // Sort by length (longest first) to avoid partial matches
  const sortedAbbrevs = Object.entries(MED_ABBREVS)
    .sort(([a], [b]) => b.length - a.length);
  
  for (const [abbr, full] of sortedAbbrevs) {
    // Use word boundaries to match whole abbreviations only
    const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
    expanded = expanded.replace(regex, `${abbr} (${full})`);
  }
  
  return expanded;
}

/**
 * Get expanded terms for query enhancement
 */
export function getExpandedTerms(text: string): string[] {
  const terms: string[] = [];
  
  for (const [abbr, full] of Object.entries(MED_ABBREVS)) {
    const regex = new RegExp(`\\b${abbr}\\b`, 'i');
    if (regex.test(text)) {
      terms.push(full);
    }
  }
  
  return terms;
}

/**
 * Detect unknown abbreviations in query that are NOT in our dictionary
 * Returns array of potential abbreviations that need LLM interpretation
 */
export function detectUnknownAbbreviations(query: string): string[] {
  const unknownAbbrevs: string[] = [];
  
  // Pattern: 2-6 uppercase letters that could be abbreviations
  const potentialAbbrevs = query.match(/\b[A-Z]{2,6}\b/g) || [];
  
  for (const abbr of potentialAbbrevs) {
    // Check if it's in our dictionary
    if (!MED_ABBREVS[abbr]) {
      // Not in dictionary - might need LLM interpretation
      unknownAbbrevs.push(abbr);
    }
  }
  
  return [...new Set(unknownAbbrevs)]; // Remove duplicates
}

/**
 * Check if query has sufficient known abbreviations
 * Returns confidence score (0-1) based on abbreviation coverage
 */
export function getAbbreviationCoverage(query: string): {
  coverage: number;
  knownAbbrevs: string[];
  unknownAbbrevs: string[];
  needsExpansion: boolean;
} {
  const potentialAbbrevs = query.match(/\b[A-Z]{2,6}\b/g) || [];
  
  if (potentialAbbrevs.length === 0) {
    return {
      coverage: 1.0,
      knownAbbrevs: [],
      unknownAbbrevs: [],
      needsExpansion: false
    };
  }
  
  const knownAbbrevs: string[] = [];
  const unknownAbbrevs: string[] = [];
  
  for (const abbr of potentialAbbrevs) {
    if (MED_ABBREVS[abbr]) {
      knownAbbrevs.push(abbr);
    } else {
      unknownAbbrevs.push(abbr);
    }
  }
  
  const coverage = knownAbbrevs.length / potentialAbbrevs.length;
  const needsExpansion = unknownAbbrevs.length > 0 || coverage < 1.0;
  
  return {
    coverage,
    knownAbbrevs: [...new Set(knownAbbrevs)],
    unknownAbbrevs: [...new Set(unknownAbbrevs)],
    needsExpansion
  };
}

/**
 * Generate multiple search query variants for better evidence retrieval
 * Expands abbreviations and creates alternative phrasings
 * 
 * STRATEGY:
 * 1. Always include original query (for exact matches)
 * 2. Add query with known abbreviations expanded inline
 * 3. Add query with ONLY full terms (no abbreviations)
 * 4. Add scenario-specific variants
 * 5. Flag unknown abbreviations for LLM interpretation
 */
export function generateSearchVariants(query: string): string[] {
  const variants: string[] = [query]; // Always include original
  
  // Check abbreviation coverage
  const coverage = getAbbreviationCoverage(query);
  
  // Expand abbreviations for a more comprehensive search
  const expandedQuery = expandMedicalAbbreviations(query);
  if (expandedQuery !== query) {
    variants.push(expandedQuery);
  }
  
  // Extract just the expanded terms without abbreviations
  const expandedTerms = getExpandedTerms(query);
  if (expandedTerms.length > 0) {
    // Create a query with just the full terms
    let termsOnlyQuery = query;
    for (const [abbr, full] of Object.entries(MED_ABBREVS)) {
      const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
      termsOnlyQuery = termsOnlyQuery.replace(regex, full);
    }
    if (termsOnlyQuery !== query) {
      variants.push(termsOnlyQuery);
    }
  }
  
  // Log unknown abbreviations for monitoring
  if (coverage.unknownAbbrevs.length > 0) {
    console.log(`⚠️  Unknown abbreviations detected: ${coverage.unknownAbbrevs.join(', ')}`);
    console.log(`   Coverage: ${Math.round(coverage.coverage * 100)}% (${coverage.knownAbbrevs.length}/${coverage.knownAbbrevs.length + coverage.unknownAbbrevs.length})`);
    console.log(`   Recommendation: LLM should interpret these abbreviations in context`);
  }
  
  // Specific patterns for common clinical scenarios
  
  // Meningioma growth/surveillance queries
  if (/meningioma/i.test(query) && (/growth|stable|stability|surveillance|serial|follow.?up/i.test(query))) {
    variants.push("meningioma growth rate surveillance imaging");
    variants.push("meningioma observation versus surgery indications");
    variants.push("meningioma serial MRI monitoring guidelines");
    variants.push("convexity meningioma natural history");
    variants.push("WHO grade 1 meningioma management");
  }
  
  // Brain tumor location-specific queries
  if (/frontal|parietal|temporal|occipital|convexity/i.test(query) && /meningioma|tumor|mass|lesion/i.test(query)) {
    const location = query.match(/\b(frontal|parietal|temporal|occipital|convexity)\b/i)?.[0] || '';
    if (location) {
      variants.push(`${location} meningioma imaging features`);
      variants.push(`${location} extra-axial mass differential diagnosis`);
    }
  }
  
  // Fracture queries
  if (/fracture/i.test(query) && /tibial|femur|humerus|radius|ulna|ankle|wrist/i.test(query)) {
    const bone = query.match(/\b(tibial|femur|humerus|radius|ulna|ankle|wrist)\b/i)?.[0] || '';
    if (bone) {
      variants.push(`${bone} fracture classification management`);
      variants.push(`${bone} fracture surgical indications`);
    }
  }
  
  // Heart failure queries
  if (/(HFpEF|HFrEF|heart failure)/i.test(query)) {
    variants.push(query.replace(/HFpEF/gi, "heart failure preserved ejection fraction"));
    variants.push(query.replace(/HFrEF/gi, "heart failure reduced ejection fraction"));
  }
  
  // CKD + medication queries
  if (/CKD/i.test(query) && /(SGLT2i|empagliflozin|dapagliflozin|MRA|spironolactone)/i.test(query)) {
    variants.push(query.replace(/CKD/gi, "chronic kidney disease"));
    variants.push(query.replace(/SGLT2i/gi, "SGLT2 inhibitor"));
    variants.push(query.replace(/MRA/gi, "mineralocorticoid receptor antagonist"));
  }
  
  // Remove duplicates while preserving order
  return [...new Set(variants)];
}

/**
 * Generate dual search queries for evidence retrieval
 * Returns both abbreviated and expanded versions for comprehensive searching
 * 
 * USE CASE: PubMed, Cochrane, and other databases should search BOTH versions
 * to maximize evidence retrieval
 */
export function generateDualSearchQueries(query: string): {
  abbreviated: string;
  expanded: string;
  shouldSearchBoth: boolean;
  unknownAbbrevs: string[];
} {
  const coverage = getAbbreviationCoverage(query);
  
  // Abbreviated version (original)
  const abbreviated = query;
  
  // Expanded version (full terms only)
  let expanded = query;
  for (const [abbr, full] of Object.entries(MED_ABBREVS)) {
    const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
    expanded = expanded.replace(regex, full);
  }
  
  // Should search both if:
  // 1. Query has abbreviations
  // 2. Expanded version is different from original
  const shouldSearchBoth = expanded !== abbreviated;
  
  return {
    abbreviated,
    expanded,
    shouldSearchBoth,
    unknownAbbrevs: coverage.unknownAbbrevs
  };
}

/**
 * Create evidence search strategy based on abbreviation analysis
 * Returns recommended search approach for evidence engine
 */
export function createEvidenceSearchStrategy(query: string): {
  primaryQuery: string;
  secondaryQuery: string | null;
  searchBothRequired: boolean;
  unknownAbbrevs: string[];
  strategy: 'abbreviation-first' | 'expanded-first' | 'both-parallel';
  reasoning: string;
} {
  const coverage = getAbbreviationCoverage(query);
  const dual = generateDualSearchQueries(query);
  
  // Determine strategy based on abbreviation coverage
  let strategy: 'abbreviation-first' | 'expanded-first' | 'both-parallel';
  let reasoning: string;
  let primaryQuery: string;
  let secondaryQuery: string | null;
  
  if (coverage.coverage === 1.0 && coverage.knownAbbrevs.length > 0) {
    // All abbreviations known - search both in parallel for maximum coverage
    strategy = 'both-parallel';
    primaryQuery = dual.abbreviated;
    secondaryQuery = dual.expanded;
    reasoning = `All ${coverage.knownAbbrevs.length} abbreviations recognized. Searching both versions in parallel for comprehensive evidence.`;
  } else if (coverage.unknownAbbrevs.length > 0) {
    // Unknown abbreviations present - prioritize expanded search
    strategy = 'expanded-first';
    primaryQuery = dual.expanded;
    secondaryQuery = dual.abbreviated;
    reasoning = `Unknown abbreviations detected (${coverage.unknownAbbrevs.join(', ')}). Prioritizing expanded terms, with abbreviated fallback.`;
  } else {
    // No abbreviations or mixed - use expanded as primary
    strategy = 'expanded-first';
    primaryQuery = dual.expanded;
    secondaryQuery = dual.abbreviated !== dual.expanded ? dual.abbreviated : null;
    reasoning = 'Using expanded terms as primary search for better evidence retrieval.';
  }
  
  return {
    primaryQuery,
    secondaryQuery,
    searchBothRequired: dual.shouldSearchBoth,
    unknownAbbrevs: coverage.unknownAbbrevs,
    strategy,
    reasoning
  };
}