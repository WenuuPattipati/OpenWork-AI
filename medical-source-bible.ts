/**
 * ============================================================================
 * OPENWORK MEDICAL SOURCE BIBLE
 * ============================================================================
 * 
 * The "Ivy League" of Medical Literature
 * 
 * Just as Stanford, Harvard, Oxford, Cambridge are to universities,
 * these sources are to medical literature — the gold standards that
 * doctors actually read and trust.
 * 
 * This file provides:
 * 1. Authoritative organizations by medical specialty
 * 2. Top journals with PubMed abbreviations for filtering
 * 3. Guideline sources with trigger keywords
 * 4. Tavily search domains for web retrieval
 * 
 * USAGE: Import into Query Intelligence, PubMed Agent, and Tavily Agent
 * ============================================================================
 */

// ============================================================================
// PART 1: THE "BIG 4" GENERAL MEDICAL JOURNALS
// ============================================================================
// These are the absolute top-tier, cover ALL specialties
// If a study appears here, it's practice-changing

export const TIER_1_GENERAL_JOURNALS = {
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


// ============================================================================
// PART 2: SPECIALTY-SPECIFIC SOURCES BY BODY SYSTEM
// ============================================================================

export interface MedicalSpecialtySource {
  id: string;
  specialty: string;
  body_systems: string[];
  trigger_keywords: string[];  // Keywords that should route queries here
  
  // Guideline Organizations (THE authority)
  guideline_organizations: {
    name: string;
    abbreviation: string;
    website: string;
    tavily_domain: string;
    description: string;
    guideline_types: string[];
  }[];
  
  // Top Journals (what doctors actually read)
  top_journals: {
    name: string;
    abbreviation: string;
    pubmed_filter: string;
    impact_factor: number;
    why_important: string;
  }[];
  
  // PubMed filter to get articles from top journals only
  pubmed_elite_filter: string;
  
  // Tavily domains to search for guidelines/updates
  tavily_search_domains: string[];
}

export const MEDICAL_SPECIALTIES: MedicalSpecialtySource[] = [
  
  // =========================================================================
  // CARDIOVASCULAR SYSTEM (Heart, Blood Vessels)
  // =========================================================================
  {
    id: "cardiovascular",
    specialty: "Cardiology",
    body_systems: ["heart", "blood vessels", "circulatory system"],
    trigger_keywords: [
      "heart", "cardiac", "cardiovascular", "coronary", "myocardial",
      "arrhythmia", "atrial fibrillation", "AF", "AFib", "heart failure", "HF",
      "hypertension", "blood pressure", "HTN", "lipid", "cholesterol", "LDL", "HDL",
      "statin", "ASCVD", "angina", "MI", "myocardial infarction", "heart attack",
      "valve", "aortic", "mitral", "pacemaker", "ICD", "ablation",
      "cardiomyopathy", "endocarditis", "pericarditis", "CHF"
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
      "asthma", "COPD", "chronic obstructive", "emphysema", "bronchitis",
      "pneumonia", "lung", "pulmonary", "respiratory", "breathing", "dyspnea",
      "inhaler", "bronchodilator", "ICS", "LABA", "LAMA", "spirometry",
      "FEV1", "peak flow", "oxygen", "hypoxia", "sleep apnea", "OSA",
      "pulmonary fibrosis", "IPF", "interstitial lung disease", "ILD",
      "tuberculosis", "TB", "pleural", "pneumothorax", "PE", "pulmonary embolism"
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
        description: "THE global authority on COPD. Defines GOLD stages (A/B/C/D → now ABE). Updated annually.",
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
        impact_factor: 9.0,
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
      "diabetes", "T1DM", "T2DM", "type 1", "type 2", "HbA1c", "A1c",
      "glucose", "insulin", "metformin", "GLP-1", "SGLT2", "sulfonylurea",
      "hypoglycemia", "hyperglycemia", "DKA", "diabetic ketoacidosis",
      "thyroid", "hypothyroid", "hyperthyroid", "TSH", "T4", "T3", "Graves",
      "Hashimoto", "thyroiditis", "goiter", "thyroid nodule",
      "obesity", "weight loss", "BMI", "metabolic syndrome",
      "adrenal", "Cushing", "Addison", "cortisol", "aldosterone",
      "pituitary", "prolactin", "growth hormone", "acromegaly",
      "osteoporosis", "bone density", "DEXA", "calcium", "vitamin D"
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
        impact_factor: 44.0,
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
      "kidney", "renal", "nephro", "CKD", "chronic kidney disease",
      "GFR", "eGFR", "creatinine", "BUN", "proteinuria", "albuminuria",
      "dialysis", "hemodialysis", "peritoneal dialysis", "ESRD", "end-stage",
      "AKI", "acute kidney injury", "nephritis", "glomerulonephritis",
      "nephrotic", "nephritic", "IgA nephropathy", "FSGS", "membranous",
      "polycystic kidney", "PKD", "transplant", "kidney transplant",
      "electrolyte", "hyperkalemia", "hyponatremia", "acidosis"
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
        impact_factor: 9.0,
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
      "GI", "gastrointestinal", "stomach", "gastric", "intestine", "bowel",
      "GERD", "reflux", "heartburn", "PPI", "H2 blocker", "esophagus",
      "IBD", "Crohn", "ulcerative colitis", "UC", "inflammatory bowel",
      "IBS", "irritable bowel", "constipation", "diarrhea",
      "liver", "hepatic", "hepatitis", "cirrhosis", "fatty liver", "NAFLD", "NASH",
      "ALT", "AST", "bilirubin", "jaundice", "ascites", "variceal",
      "colon", "colonoscopy", "polyp", "colorectal", "GI bleeding",
      "celiac", "gluten", "pancreatitis", "ERCP", "gallbladder", "cholecystitis"
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
        impact_factor: 23.0,
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
      "neuro", "brain", "stroke", "CVA", "TIA", "cerebrovascular",
      "seizure", "epilepsy", "anticonvulsant", "antiepileptic",
      "headache", "migraine", "cluster headache", "tension headache",
      "Parkinson", "tremor", "movement disorder", "dystonia",
      "Alzheimer", "dementia", "cognitive", "memory loss",
      "multiple sclerosis", "MS", "neuropathy", "peripheral neuropathy",
      "myasthenia gravis", "ALS", "motor neuron", "Guillain-Barre",
      "meningitis", "encephalitis", "brain tumor", "glioma"
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
      "cancer", "tumor", "malignant", "oncology", "carcinoma", "sarcoma",
      "lymphoma", "leukemia", "myeloma", "melanoma",
      "breast cancer", "lung cancer", "colon cancer", "prostate cancer",
      "chemotherapy", "immunotherapy", "targeted therapy", "radiation",
      "PD-1", "PD-L1", "checkpoint inhibitor", "CAR-T",
      "staging", "TNM", "metastatic", "metastasis",
      "HER2", "EGFR", "ALK", "BRCA", "MSI", "TMB",
      "survival", "PFS", "OS", "response rate"
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
      "infection", "infectious", "bacteria", "bacterial", "virus", "viral",
      "antibiotic", "antimicrobial", "antiviral", "antifungal",
      "sepsis", "septic", "fever", "febrile",
      "HIV", "AIDS", "hepatitis", "HBV", "HCV",
      "COVID", "coronavirus", "influenza", "flu", "RSV",
      "pneumonia", "UTI", "urinary tract infection", "cellulitis",
      "meningitis", "endocarditis", "osteomyelitis",
      "MRSA", "C. diff", "Clostridioides", "resistant", "MDR",
      "tuberculosis", "TB", "malaria", "dengue"
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
        impact_factor: 5.0,
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
      "arthritis", "rheumatoid", "RA", "osteoarthritis", "OA",
      "lupus", "SLE", "systemic lupus", "autoimmune",
      "gout", "uric acid", "hyperuricemia",
      "psoriatic arthritis", "PsA", "ankylosing spondylitis", "AS",
      "spondyloarthritis", "SpA", "axSpA",
      "fibromyalgia", "polymyalgia", "PMR", "vasculitis",
      "scleroderma", "dermatomyositis", "Sjogren",
      "biologic", "DMARD", "methotrexate", "TNF inhibitor",
      "joint pain", "synovitis", "inflammatory"
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
        impact_factor: 15.0,
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
      "skin", "dermatol", "rash", "eczema", "atopic dermatitis",
      "psoriasis", "acne", "rosacea",
      "melanoma", "skin cancer", "basal cell", "squamous cell",
      "urticaria", "hives", "angioedema",
      "alopecia", "hair loss", "nail", "fungal", "tinea",
      "wound", "ulcer", "pressure injury",
      "biologic", "dupilumab", "IL-17", "IL-23"
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
        impact_factor: 9.0,
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
      "depression", "anxiety", "bipolar", "schizophrenia", "psychosis",
      "PTSD", "OCD", "panic", "phobia",
      "antidepressant", "SSRI", "SNRI", "antipsychotic",
      "mood", "suicide", "self-harm",
      "ADHD", "attention deficit", "autism", "ASD",
      "eating disorder", "anorexia", "bulimia",
      "substance abuse", "addiction", "alcohol use disorder",
      "insomnia", "sleep disorder"
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
      "pediatric", "child", "children", "infant", "baby", "newborn",
      "neonatal", "adolescent", "teen",
      "vaccination", "immunization", "growth", "development",
      "NICU", "premature", "preterm",
      "congenital", "birth defect",
      "pediatric dosing", "weight-based"
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
      "pregnancy", "pregnant", "obstetric", "prenatal", "antenatal",
      "gynecology", "menstrual", "menopause", "fertility",
      "contraception", "birth control", "IUD",
      "preeclampsia", "gestational diabetes", "GDM",
      "cesarean", "C-section", "labor", "delivery",
      "PCOS", "polycystic ovary", "endometriosis",
      "cervical cancer", "ovarian cancer", "HPV",
      "miscarriage", "ectopic pregnancy"
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
      "eye", "vision", "ophthalm", "retina", "glaucoma",
      "cataract", "macular degeneration", "AMD",
      "diabetic retinopathy", "uveitis",
      "cornea", "conjunctivitis", "dry eye",
      "visual acuity", "intraocular pressure", "IOP"
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
      "orthopedic", "bone", "fracture", "joint replacement",
      "hip replacement", "knee replacement", "TKA", "THA",
      "spine", "back pain", "lumbar", "cervical",
      "ACL", "meniscus", "rotator cuff",
      "osteoarthritis", "osteoporosis"
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
      "blood", "hematol", "anemia", "hemoglobin",
      "platelet", "thrombocytopenia", "bleeding", "coagulation",
      "DVT", "PE", "VTE", "anticoagulation", "warfarin", "DOAC",
      "leukemia", "lymphoma", "myeloma",
      "sickle cell", "thalassemia", "hemophilia"
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
        impact_factor: 21.0,
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
      "urolog", "bladder", "prostate", "BPH", "PSA",
      "urinary", "incontinence", "UTI", "kidney stone",
      "nephrolithiasis", "erectile dysfunction", "ED",
      "prostate cancer", "bladder cancer", "testicular"
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
      "emergency", "ED", "ER", "trauma", "acute",
      "resuscitation", "CPR", "ACLS", "ATLS",
      "chest pain rule out", "syncope workup"
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
      "ICU", "critical care", "intensive care", "ventilator",
      "sepsis", "septic shock", "ARDS", "respiratory failure",
      "vasopressor", "norepinephrine", "mechanical ventilation"
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


// ============================================================================
// PART 3: SYSTEMATIC REVIEW DATABASES (Meta-Evidence)
// ============================================================================

export const SYSTEMATIC_REVIEW_SOURCES = {
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


// ============================================================================
// PART 4: DRUG INFORMATION SOURCES
// ============================================================================

export const DRUG_INFORMATION_SOURCES = {
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


// ============================================================================
// PART 5: UTILITY FUNCTIONS FOR QUERY ROUTING
// ============================================================================

/**
 * Determine which specialties are relevant for a given query
 * Returns array of specialty IDs sorted by relevance
 */
export function routeQueryToSpecialties(query: string): string[] {
  const queryLower = query.toLowerCase();
  const matches: { id: string; score: number }[] = [];
  
  for (const specialty of MEDICAL_SPECIALTIES) {
    let score = 0;
    
    // Check trigger keywords
    for (const keyword of specialty.trigger_keywords) {
      if (queryLower.includes(keyword.toLowerCase())) {
        score += keyword.length; // Longer keywords = more specific = higher score
      }
    }
    
    // Check body systems
    for (const system of specialty.body_systems) {
      if (queryLower.includes(system.toLowerCase())) {
        score += 5;
      }
    }
    
    if (score > 0) {
      matches.push({ id: specialty.id, score });
    }
  }
  
  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);
  
  // Return top 3 specialties (or all if fewer)
  return matches.slice(0, 3).map(m => m.id);
}


/**
 * Get PubMed filter for elite journals in given specialties
 */
export function getPubMedEliteFilter(specialtyIds: string[]): string {
  const filters: string[] = [];
  
  // Always include general medicine top journals
  filters.push(TIER_1_GENERAL_JOURNALS.pubmed_combined_filter);
  
  // Add specialty-specific filters
  for (const id of specialtyIds) {
    const specialty = MEDICAL_SPECIALTIES.find(s => s.id === id);
    if (specialty) {
      filters.push(specialty.pubmed_elite_filter);
    }
  }
  
  return `(${filters.join(' OR ')})`;
}


/**
 * Get Tavily search domains for given specialties
 */
export function getTavilyDomains(specialtyIds: string[]): string[] {
  const domains: Set<string> = new Set();
  
  for (const id of specialtyIds) {
    const specialty = MEDICAL_SPECIALTIES.find(s => s.id === id);
    if (specialty) {
      specialty.tavily_search_domains.forEach(d => domains.add(d));
    }
  }
  
  return Array.from(domains);
}


/**
 * Get guideline organizations for given specialties
 */
export function getGuidelineOrganizations(specialtyIds: string[]) {
  const orgs: any[] = [];
  
  for (const id of specialtyIds) {
    const specialty = MEDICAL_SPECIALTIES.find(s => s.id === id);
    if (specialty) {
      orgs.push(...specialty.guideline_organizations);
    }
  }
  
  return orgs;
}


/**
 * Build Tavily search query for guidelines
 */
export function buildGuidelineSearchQuery(query: string, specialtyIds: string[]): string {
  const orgs = getGuidelineOrganizations(specialtyIds);
  const domains = orgs.map(o => o.tavily_domain).join(' OR ');
  
  // Extract key terms from query
  const terms = query.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  
  return `${terms} guidelines (${domains})`;
}


// ============================================================================
// PART 6: WHAT YOU HAVE VS WHAT YOU'RE MISSING (Analysis)
// ============================================================================

export const OPENWORK_GAP_ANALYSIS = {
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


// ============================================================================
// EXPORT SUMMARY
// ============================================================================

export default {
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
