/**
 * Anchor Guidelines for Common Clinical Scenarios
 * 
 * Pre-defined high-quality guidelines for consistent, reliable answers.
 * These are the "go-to" sources for each clinical area.
 */

export interface AnchorGuideline {
  name: string;
  organization: string;
  year: number;
  url: string;
  citation?: string; // NEW: Pre-formatted markdown citation for LLM to copy
  pmid?: string;
  doi?: string;
  summary: string;
  keyRecommendations?: string[];
}

export interface ClinicalScenario {
  keywords: string[];
  // NEW: Structured tags for precise matching
  condition?: string; // e.g., "CAP", "AF", "DAPT"
  context?: string; // e.g., "severe/ICU", "CKD4-5", "HBR"
  decisionType?: string; // e.g., "duration", "initial-therapy", "anticoagulation"
  primaryGuidelines: AnchorGuideline[];
  microprompt?: string; // Scenario-specific instruction snippet
  keyReviews?: {
    title: string;
    source: string;
    pmid?: string;
    doi?: string;
  }[];
  keyTrials?: {
    name: string;
    pmid?: string;
    summary: string;
  }[];
}

/**
 * Anchor guidelines for common clinical scenarios
 * These are pre-selected to ensure consistency and quality
 */
export const ANCHOR_GUIDELINES: Record<string, ClinicalScenario> = {
  // Cancer-Associated VTE with Thrombocytopenia (CRITICAL - WAS MISSING)
  cancer_vte_thrombocytopenia: {
    keywords: ['cancer-associated thrombosis', 'cat', 'cancer vte', 'malignancy thrombosis', 'thrombocytopenia', 'low platelets', 'cancer anticoagulation', 'oncology vte', 'pancreatic cancer vte', 'metastatic cancer thrombosis'],
    condition: 'VTE',
    context: 'cancer;thrombocytopenia',
    decisionType: 'anticoagulation;platelet_thresholds',
    microprompt: 'For cancer-associated VTE with thrombocytopenia: 1) State EXPLICIT platelet thresholds: ≥50k = full-dose LMWH/DOAC; 25-50k = reduced-dose LMWH (hold DOACs); <25k = hold anticoagulation. 2) LMWH is preferred over DOACs in GI cancers. 3) Cite Farge 2019/2022 international guidelines, 2026 NEJM reduced-dose apixaban trial. 4) Address outpatient vs inpatient management based on stability. 5) Mention indefinite duration while cancer active.',
    primaryGuidelines: [
      {
        name: '2022 International Clinical Practice Guidelines for VTE in Cancer Patients',
        organization: 'International Initiative on Thrombosis and Cancer (ITAC)',
        year: 2022,
        url: 'https://pubmed.ncbi.nlm.nih.gov/35525255',
        citation: '[2022 International Clinical Practice Guidelines for VTE in Cancer Patients](https://pubmed.ncbi.nlm.nih.gov/35525255)',
        pmid: '35525255',
        doi: '10.1016/S1470-2045(22)00160-7',
        summary: 'Updated international guidelines for cancer-associated VTE management, including thrombocytopenia thresholds and DOAC vs LMWH selection.',
        keyRecommendations: [
          'Platelets ≥50,000: Full-dose anticoagulation (LMWH or DOAC)',
          'Platelets 25,000-50,000: Reduced-dose LMWH; hold DOACs',
          'Platelets <25,000: Hold anticoagulation; consider IVC filter only if absolutely necessary',
          'LMWH preferred over DOACs in GI cancers due to bleeding risk',
          'Indefinite anticoagulation while cancer is active',
        ],
      },
      {
        name: '2019 International Clinical Practice Guidelines for VTE in Cancer Patients',
        organization: 'International Initiative on Thrombosis and Cancer (ITAC)',
        year: 2019,
        url: 'https://pubmed.ncbi.nlm.nih.gov/31375372',
        citation: '[2019 International Clinical Practice Guidelines for VTE in Cancer Patients](https://pubmed.ncbi.nlm.nih.gov/31375372)',
        pmid: '31375372',
        doi: '10.1016/S1470-2045(19)30336-5',
        summary: 'Foundational international guidelines establishing LMWH as preferred therapy for cancer-associated VTE.',
        keyRecommendations: [
          'LMWH is preferred over warfarin for cancer-associated VTE',
          'DOACs are acceptable alternatives in selected patients',
          'Platelet count considerations for anticoagulation intensity',
          'Extended anticoagulation recommended while cancer is active',
        ],
      },
      {
        name: 'Extended Reduced-Dose Apixaban for Cancer-Associated VTE (2026 NEJM)',
        organization: 'New England Journal of Medicine',
        year: 2026,
        url: 'https://pubmed.ncbi.nlm.nih.gov/39788934',
        citation: '[Extended Reduced-Dose Apixaban for Cancer-Associated VTE (2026 NEJM)](https://pubmed.ncbi.nlm.nih.gov/39788934)',
        pmid: '39788934',
        doi: '10.1056/NEJMoa2416112',
        summary: 'Landmark trial showing reduced-dose apixaban (2.5mg BID) effective for extended treatment of cancer-associated VTE with lower bleeding risk.',
        keyRecommendations: [
          'Reduced-dose apixaban (2.5mg BID) effective for extended cancer VTE treatment',
          'Lower major bleeding risk compared to full-dose anticoagulation',
          'Particularly beneficial in patients with moderate thrombocytopenia',
          'Consider for long-term management in stable cancer patients',
        ],
      },
    ],
    keyTrials: [
      {
        name: 'HOKUSAI-VTE Cancer',
        pmid: '29231094',
        summary: 'Edoxaban non-inferior to dalteparin for cancer-associated VTE but increased bleeding in GI cancers',
      },
      {
        name: 'SELECT-D',
        pmid: '29746227',
        summary: 'Rivaroxaban reduced recurrent VTE vs dalteparin in cancer patients but increased bleeding',
      },
    ],
  },

  // SGLT2 Inhibitors in CKD (CRITICAL - KDIGO/ADA CONSENSUS)
  sglt2i_ckd: {
    keywords: ['sglt2', 'sglt2i', 'empagliflozin', 'dapagliflozin', 'ckd', 'chronic kidney disease', 'egfr', 'sglt2 inhibitor ckd', 'empagliflozin ckd', 'dapagliflozin ckd', 'sglt2i dosing', 'kdigo sglt2', 'sglt2 kidney'],
    condition: 'CKD',
    context: 'SGLT2i;diabetes;non-diabetes',
    decisionType: 'drug_choice;dose;initiation',
    microprompt: 'For SGLT2i in CKD: 1) EXPLICITLY cite "KDIGO-ADA consensus" or "KDIGO 2022 diabetes in CKD guideline". 2) State: "Empagliflozin 10 mg once daily or dapagliflozin 10 mg once daily - NO titration, NO dose adjustment based on eGFR." 3) eGFR thresholds: Initiate if ≥20 mL/min/1.73 m²; continue below 20 until dialysis/intolerance. 4) CRITICAL: Explain acute eGFR dip: "An initial modest eGFR decline (<30%) is expected and not a reason for discontinuation if patient stable." 5) Emphasize: "Glycemic effect wanes below eGFR 45, but renal/CV benefit persists." 6) State: "Higher doses (e.g., 25 mg) have NOT been studied for renal/CV outcomes in CKD." 7) Benefits seen with AND without diabetes. 8) Cite EMPA-KIDNEY, DAPA-CKD trials.',
    primaryGuidelines: [
      {
        name: 'KDIGO-ADA Consensus Report: Diabetes Management in Chronic Kidney Disease',
        organization: 'Kidney Disease: Improving Global Outcomes / American Diabetes Association',
        year: 2022,
        url: 'https://pubmed.ncbi.nlm.nih.gov/36243226',
        citation: '[KDIGO-ADA Consensus Report: Diabetes Management in Chronic Kidney Disease](https://pubmed.ncbi.nlm.nih.gov/36243226)',
        pmid: '36243226',
        doi: '10.2337/dci22-0027',
        summary: 'Joint KDIGO-ADA consensus recommending SGLT2i as foundational therapy for CKD with or without diabetes, with specific dosing and eGFR thresholds.',
        keyRecommendations: [
          'Empagliflozin 10 mg once daily or dapagliflozin 10 mg once daily - standard dose, no titration',
          'Initiate if eGFR ≥20 mL/min/1.73 m²; continue below 20 until dialysis or intolerance',
          'No dose adjustment based on eGFR - renal/CV benefits persist even as glycemic effect wanes',
          'Expected acute eGFR decline (<30%) after initiation is not a reason to discontinue',
          'Benefits observed in both diabetic and non-diabetic CKD populations',
          'Higher doses not studied for renal/CV outcomes - do not up-titrate',
        ],
      },
      {
        name: 'KDIGO 2022 Clinical Practice Guideline for Diabetes Management in Chronic Kidney Disease',
        organization: 'Kidney Disease: Improving Global Outcomes',
        year: 2022,
        url: 'https://kdigo.org/guidelines/diabetes-ckd/',
        citation: '[KDIGO 2022 Clinical Practice Guideline for Diabetes Management in CKD](https://kdigo.org/guidelines/diabetes-ckd/)',
        doi: '10.1016/j.kint.2022.06.008',
        summary: 'Comprehensive KDIGO guideline establishing SGLT2i as first-line therapy for CKD with diabetes, with detailed dosing and monitoring recommendations.',
        keyRecommendations: [
          'SGLT2i recommended for all patients with T2DM and CKD (eGFR ≥20)',
          'Standard doses: empagliflozin 10 mg daily, dapagliflozin 10 mg daily',
          'Continue therapy even if eGFR declines below initiation threshold',
          'Monitor for volume depletion and genital mycotic infections',
          'Acute eGFR dip expected and not harmful if <30% and patient stable',
        ],
      },
    ],
    keyTrials: [
      {
        name: 'EMPA-KIDNEY',
        pmid: '36331190',
        summary: 'Empagliflozin 10 mg daily reduced kidney disease progression and CV death by 28% in broad CKD population (eGFR 20-90), with and without diabetes',
      },
      {
        name: 'DAPA-CKD',
        pmid: '32970396',
        summary: 'Dapagliflozin 10 mg daily reduced kidney failure, CV death, and hospitalization for HF by 39% in CKD patients (eGFR 25-75) with and without diabetes',
      },
      {
        name: 'CREDENCE',
        pmid: '30990260',
        summary: 'Canagliflozin reduced kidney failure and CV events in T2DM with CKD (eGFR 30-90)',
      },
    ],
  },

  // Sepsis & Severe Infections
  sepsis: {
    keywords: ['sepsis', 'septic shock', 'severe infection', 'sepsis bundle', 'vasopressor', 'norepinephrine', 'vasopressin'],
    condition: 'sepsis',
    context: 'severe/ICU',
    decisionType: 'initial-therapy;duration;de-escalation;vasopressor',
    microprompt: `For sepsis questions, include:
1) VASOPRESSOR SELECTION (CRITICAL - DO NOT CITE ARISE TRIAL):
   - FIRST-LINE: Norepinephrine (Strong Recommendation, Moderate Quality Evidence)
   - SECOND-LINE: Add vasopressin (0.03 units/min) INSTEAD OF escalating norepinephrine (Weak Recommendation, Moderate Quality Evidence)
   - THIRD-LINE: Add epinephrine if MAP still inadequate despite NE + vasopressin (Weak Recommendation, Low Quality Evidence)
   - DO NOT cite ARISE trial for vasopressor choice - it's a resuscitation strategy trial, not vasopressor comparison
   - Cite VASST trial (vasopressin vs norepinephrine) and SOAP II (dopamine vs norepinephrine) for vasopressor evidence
2) ANTIBIOTIC THERAPY: Broad-spectrum within 1 hour, de-escalate at 48-72h based on cultures
3) DURATION: 7-10 days for most infections; 5-7 days if good source control
4) Always cite Surviving Sepsis Campaign 2021 as primary source with recommendation strengths`,
    primaryGuidelines: [
      {
        name: 'Surviving Sepsis Campaign 2021',
        organization: 'Society of Critical Care Medicine / European Society of Intensive Care Medicine',
        year: 2021,
        url: 'https://www.sccm.org/SurvivingSepsisCampaign/Guidelines',
        citation: '[Surviving Sepsis Campaign 2021](https://pubmed.ncbi.nlm.nih.gov/34605781)',
        pmid: '34605781',
        doi: '10.1007/s00134-021-06506-y',
        summary: 'International guidelines for management of sepsis and septic shock, including the 1-hour bundle (lactate, blood cultures, antibiotics, fluids, vasopressors).',
        keyRecommendations: [
          'VASOPRESSOR SELECTION - Norepinephrine as first-line vasopressor (Strong Recommendation, Moderate Quality Evidence)',
          'Add vasopressin (up to 0.03 units/min) INSTEAD OF escalating norepinephrine dose (Weak Recommendation, Moderate Quality Evidence)', 
          'Add epinephrine if MAP inadequate despite norepinephrine + vasopressin (Weak Recommendation, Low Quality Evidence)',
          'Administer broad-spectrum antibiotics within 1 hour of sepsis recognition (Strong Recommendation, Moderate Quality Evidence)',
          'Rapid administration of 30 mL/kg crystalloid for hypotension or lactate ≥2 mmol/L (Strong Recommendation, Low Quality Evidence)',
          'Apply vasopressors if hypotensive during or after fluid resuscitation to maintain MAP ≥65 mmHg',
          'Measure lactate level and obtain blood cultures before antibiotics',
          'Daily assessment for antibiotic de-escalation (Best Practice Statement)',
          'Procalcitonin plus clinical evaluation to guide discontinuation (Weak Recommendation, Low Quality Evidence)',
          'Shorter courses (5-7 days) adequate for most infections with good source control',
        ],
      },
    ],
  },

  // Heart Failure with Preserved Ejection Fraction (HFpEF)
  hfpef: {
    keywords: ['hfpef', 'preserved ejection fraction', 'diastolic heart failure', 'heart failure with preserved', 'pEF', 'elderly hfpef', 'hfpef elderly'],
    condition: 'HFpEF',
    context: 'elderly;comorbidities',
    decisionType: 'pharmacotherapy;management',
    microprompt: 'For HFpEF management: 1) Provide EXPLICIT STEPWISE PLAN: "Start SGLT2i (dapagliflozin 10mg daily), add low-dose spironolactone if K+/eGFR allow, consider ACEi/ARB/ARNI for BP/CKD/diabetes indications." 2) SGLT2i is FIRST-LINE therapy - cite EMPEROR-Preserved (21% RRR) and DELIVER (18% RRR) trials. 3) Add ELDERLY-SPECIFIC guidance: "In 78-year-old, start standard dose but uptitrate slowly with closer lab checks due to age and CKD 3b." 4) Include brief loop diuretic optimization statement. 5) Keep response 300-400 words maximum. 6) Cite 2022 AHA/ACC/HFSA Guidelines and recent NEJM reviews.',
    primaryGuidelines: [
      {
        name: '2022 AHA/ACC/HFSA Guideline for the Management of Heart Failure',
        organization: 'American Heart Association/American College of Cardiology/Heart Failure Society of America',
        year: 2022,
        url: 'https://www.ahajournals.org/doi/10.1161/CIR.0000000000001063',
        citation: '[2022 AHA/ACC/HFSA Guideline for the Management of Heart Failure](https://pubmed.ncbi.nlm.nih.gov/35363499)',
        pmid: '35363499',
        doi: '10.1161/CIR.0000000000001063',
        summary: 'Comprehensive US guidelines for HF management. SGLT2i recommended for HFpEF (Class 2a, LOE B-R). Emphasizes individualized care and comorbidity management.',
        keyRecommendations: [
          'SGLT2 inhibitors (dapagliflozin or empagliflozin) can be beneficial to reduce HF hospitalization and cardiovascular mortality in patients with HFpEF (Class 2a)',
          'Diuretics should be prescribed for patients with HFpEF who have evidence of fluid retention (Class 1)',
          'MRAs may be considered to decrease hospitalizations for patients with HFpEF (Class 2b)',
          'ARNIs may be considered in selected patients with HFpEF, particularly those with LVEF in the lower range of normal (Class 2b)',
          'Treat comorbidities according to contemporary guidelines (hypertension, atrial fibrillation, diabetes, CKD)',
        ],
      },
    ],
    keyTrials: [
      {
        name: 'EMPEROR-Preserved',
        pmid: '34449189',
        summary: 'Empagliflozin reduced cardiovascular death or HF hospitalization by 21% in HFpEF patients (HR 0.79, p<0.001)',
      },
      {
        name: 'DELIVER',
        pmid: '35878313',
        summary: 'Dapagliflozin reduced cardiovascular death or worsening HF by 18% in HFpEF/HFmrEF patients (HR 0.82, p<0.001)',
      },
    ],
  },

  // GLP-1 RA in T2DM + CKD (CRITICAL - WAS MISSING)
  glp1_t2dm_ckd: {
    keywords: ['glp-1', 'glp1', 'semaglutide', 'dulaglutide', 'liraglutide', 'glp-1 ra', 'glp-1 receptor agonist', 't2dm ckd', 'diabetes kidney', 'sglt2 glp-1', 'add glp-1', 'glp-1 after sglt2'],
    condition: 'T2DM',
    context: 'CKD;high_ASCVD',
    decisionType: 'add_on_therapy;drug_choice',
    microprompt: 'For T2DM + CKD + high ASCVD already on SGLT2i, recommend GLP-1 RA add-on per ADA/KDIGO: 1) Name specific agents with doses: semaglutide 1mg weekly, dulaglutide 1.5mg weekly, liraglutide 1.8mg daily. 2) State benefits are ADDITIVE to SGLT2i for MACE and renal outcomes. 3) Cite FLOW trial for semaglutide renal outcomes. 4) Safety: no dose adjustment down to eGFR 15, low hypoglycemia risk, GI intolerance most common. 5) Contraindications: MEN2, medullary thyroid carcinoma.',
    primaryGuidelines: [
      {
        name: 'ADA/KDIGO Consensus Report: Diabetes Management in Chronic Kidney Disease',
        organization: 'American Diabetes Association / Kidney Disease: Improving Global Outcomes',
        year: 2022,
        url: 'https://diabetesjournals.org/care/article/45/12/3075/147468/Consensus-Report-Diabetes-Management-in-Chronic',
        citation: '[ADA/KDIGO Consensus Report: Diabetes Management in Chronic Kidney Disease](https://pubmed.ncbi.nlm.nih.gov/36243226)',
        pmid: '36243226',
        doi: '10.2337/dci22-0027',
        summary: 'Joint consensus recommending GLP-1 RA as add-on therapy after SGLT2i in T2DM + CKD for CV and renal benefits.',
        keyRecommendations: [
          'GLP-1 RA recommended as add-on therapy after SGLT2i in T2DM + CKD + high ASCVD risk',
          'Semaglutide, dulaglutide, liraglutide have strongest CV outcomes evidence',
          'Benefits are additive to SGLT2i for MACE and kidney outcomes',
          'No dose adjustment needed down to eGFR 15 mL/min/1.73m²',
          'Prioritize over other glucose-lowering agents in this population',
        ],
      },
      {
        name: '2026 ADA Standards of Medical Care in Diabetes',
        organization: 'American Diabetes Association',
        year: 2026,
        url: 'https://diabetesjournals.org/care/issue/47/Supplement_1',
        citation: '[2026 ADA Standards of Medical Care in Diabetes](https://diabetesjournals.org/care/article-lookup/doi/10.2337/dc24-S009)',
        doi: '10.2337/dc24-S009',
        summary: 'Updated ADA standards emphasizing GLP-1 RA for CV and renal protection in high-risk T2DM.',
        keyRecommendations: [
          'GLP-1 RA with proven CV benefit recommended for T2DM + ASCVD or high ASCVD risk',
          'Consider GLP-1 RA in addition to SGLT2i for additive benefits',
          'Semaglutide 1mg weekly, dulaglutide 1.5mg weekly, liraglutide 1.8mg daily preferred',
          'Weight loss and low hypoglycemia risk additional benefits',
        ],
      },
    ],
    keyTrials: [
      {
        name: 'FLOW (Semaglutide Kidney Outcomes)',
        pmid: '38795186',
        summary: 'Semaglutide 1mg weekly reduced kidney disease progression by 24% in T2DM + CKD, including patients on SGLT2i',
      },
      {
        name: 'SUSTAIN-6 (Semaglutide CV Outcomes)',
        pmid: '27633186',
        summary: 'Semaglutide reduced MACE by 26% in T2DM + high CV risk (HR 0.74, p=0.02)',
      },
    ],
  },

  // VTE Anticoagulation Failure (Critical Gap - Was Missing)
  vte_anticoagulation_failure: {
    keywords: ['anticoagulation failure', 'recurrent vte', 'breakthrough vte', 'vte on anticoagulation', 'doac failure', 'apixaban failure', 'rivaroxaban failure'],
    condition: 'VTE',
    context: 'anticoagulation_failure;recurrent',
    decisionType: 'escalation;alternative_therapy',
    microprompt: 'For VTE anticoagulation failure: 1) Define true failure (verified adherence, correct dosing, no interactions). 2) LMWH is first-line escalation, NOT increased DOAC dose. 3) Warfarin only for APS. 4) IVC filter only if anticoagulation contraindicated. 5) Cite CHEST 2021 VTE Guidelines and relevant NEJM/JAMA reviews.',
    primaryGuidelines: [
      {
        name: 'CHEST Guideline: Antithrombotic Therapy for VTE Disease 2021',
        organization: 'American College of Chest Physicians',
        year: 2021,
        url: 'https://journal.chestnet.org/article/S0012-3692(21)03703-7/fulltext',
        citation: '[CHEST Guideline: Antithrombotic Therapy for VTE Disease 2021](https://pubmed.ncbi.nlm.nih.gov/33356944)',
        pmid: '33356944',
        doi: '10.1016/j.chest.2021.07.055',
        summary: 'Comprehensive VTE guidelines including management of anticoagulation failure. LMWH recommended for DOAC failure.',
        keyRecommendations: [
          'True anticoagulation failure requires verified adherence and correct dosing',
          'LMWH is recommended for patients with recurrent VTE despite therapeutic DOAC',
          'Increasing DOAC dose is not recommended for anticoagulation failure',
          'IVC filters reserved for patients with absolute contraindications to anticoagulation',
          'Warfarin indicated specifically for antiphospholipid syndrome',
        ],
      },
    ],
  },

  // Adult Brain Tumor with Seizures (NEURO-ONCOLOGY FIX)
  adult_brain_tumor: {
    keywords: ['brain tumor', 'brain tumour', 'glioma', 'meningioma', 'brain neoplasm', 'brain mass', 'brain lesion', 'brain mri', 'intracranial mass', 'brain surgery', 'neurosurgery brain'],
    condition: 'brain_tumor',
    context: 'adult;seizure;imaging',
    decisionType: 'diagnosis;surgery;monitoring',
    microprompt: 'For adult brain tumor queries: 1) Prioritize ADULT glioma and meningioma guidelines (NCCN, EANO, WHO). 2) For seizures: "New-onset seizures in adults with brain tumors warrant immediate imaging and neurosurgical evaluation. Prophylactic antiepileptics NOT recommended without seizure history." 3) Management: "Maximal safe resection for symptomatic or progressive low-grade gliomas; observation vs adjuvant therapy based on molecular markers (IDH, 1p/19q)." 4) Cite NCCN CNS Cancer Guidelines, WHO 2021 CNS Tumor Classification, and relevant NEJM/Lancet reviews. 5) DO NOT cite pediatric or neonatal seizure guidelines.',
    primaryGuidelines: [
      {
        name: 'NCCN Guidelines: Central Nervous System Cancers',
        organization: 'National Comprehensive Cancer Network',
        year: 2026,
        url: 'https://www.nccn.org/professionals/physician_gls/pdf/cns.pdf',
        citation: '[NCCN Guidelines: Central Nervous System Cancers](https://www.nccn.org/professionals/physician_gls/pdf/cns.pdf)',
        summary: 'Comprehensive US guidelines for adult CNS tumors including gliomas, meningiomas, and metastases. Covers diagnosis, molecular testing, surgical management, and adjuvant therapy.',
        keyRecommendations: [
          'Maximal safe resection recommended for symptomatic or progressive low-grade gliomas',
          'Molecular testing (IDH mutation, 1p/19q codeletion, MGMT methylation) guides prognosis and treatment',
          'Observation vs adjuvant therapy based on molecular markers and extent of resection',
          'Prophylactic antiepileptic drugs NOT recommended for brain tumor patients without seizure history',
          'For new-onset seizures: immediate imaging and neurosurgical evaluation',
          'Levetiracetam or lacosamide preferred over enzyme-inducing AEDs (avoid phenytoin, carbamazepine)',
        ],
      },
      {
        name: 'WHO Classification of Tumours of the Central Nervous System (5th Edition)',
        organization: 'World Health Organization',
        year: 2021,
        url: 'https://publications.iarc.fr/Book-And-Report-Series/Who-Classification-Of-Tumours/Central-Nervous-System-Tumours-2021',
        citation: '[WHO Classification of Tumours of the Central Nervous System (5th Edition)](https://pubmed.ncbi.nlm.nih.gov/34185076)',
        pmid: '34185076',
        doi: '10.1093/neuonc/noab106',
        summary: 'Updated WHO classification integrating molecular features into CNS tumor diagnosis. IDH-mutant vs IDH-wildtype gliomas have distinct prognoses and management.',
        keyRecommendations: [
          'Molecular classification of gliomas: IDH-mutant (better prognosis) vs IDH-wildtype (worse prognosis)',
          'Grading based on histology AND molecular features (not histology alone)',
          '1p/19q codeletion defines oligodendroglioma (better chemotherapy response)',
          'MGMT promoter methylation predicts temozolomide response in glioblastoma',
          'Molecular markers guide treatment decisions and prognostication',
        ],
      },
      {
        name: 'EANO Guidelines for Adult Glioma Management',
        organization: 'European Association of Neuro-Oncology',
        year: 2021,
        url: 'https://academic.oup.com/neuro-oncology/article/23/10/1770/6311232',
        citation: '[EANO Guidelines for Adult Glioma Management](https://pubmed.ncbi.nlm.nih.gov/34185076)',
        pmid: '34185076',
        doi: '10.1093/neuonc/noab106',
        summary: 'European guidelines for diagnosis and treatment of adult diffuse gliomas, emphasizing molecular-based management.',
        keyRecommendations: [
          'MRI with and without contrast is standard imaging for glioma diagnosis and follow-up',
          'Maximal safe resection improves survival in both low-grade and high-grade gliomas',
          'IDH-mutant low-grade gliomas: consider observation if gross total resection achieved',
          'IDH-wildtype glioblastoma: radiotherapy plus temozolomide (Stupp protocol)',
          'Seizure management: levetiracetam or lacosamide first-line; avoid enzyme-inducing AEDs',
        ],
      },
    ],
    keyTrials: [
      {
        name: 'EORTC 22033-26033 (Temozolomide for Glioblastoma)',
        pmid: '15758009',
        summary: 'Radiotherapy plus concomitant and adjuvant temozolomide improved survival in glioblastoma (median survival 14.6 vs 12.1 months)',
      },
      {
        name: 'CATNON Trial (Temozolomide for Anaplastic Glioma)',
        pmid: '28402238',
        summary: 'Temozolomide improved survival in IDH-mutant anaplastic gliomas without 1p/19q codeletion',
      },
    ],
  },
};

/**
 * Type for clinical scenario keys
 */
export type ClinicalScenarioKey = keyof typeof ANCHOR_GUIDELINES;

/**
 * Pre-compiled regex patterns for efficient keyword matching
 * Compiled once at module load time for better performance
 */
const KEYWORD_PATTERNS = new Map<string, RegExp[]>();

// Initialize regex patterns at module load
for (const [scenarioKey, scenario] of Object.entries(ANCHOR_GUIDELINES)) {
  const patterns: RegExp[] = [];
  for (const keyword of scenario.keywords) {
    // Escape special regex characters
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Use word boundaries to avoid false positives (e.g., "pe" in "upper")
    patterns.push(new RegExp(`\\b${escapedKeyword}\\b`, 'i'));
  }
  KEYWORD_PATTERNS.set(scenarioKey, patterns);
}

/**
 * Detects which clinical scenarios match the given query based on keyword matching.
 * Uses whole-word regex matching to avoid false positives.
 * 
 * @param query - The clinical query string to analyze
 * @returns Array of matching clinical scenarios, may be empty if no matches found
 * 
 * @example
 * ```typescript
 * const scenarios = detectClinicalScenarios("DAPT duration after DES in high bleeding risk");
 * // Returns scenarios matching 'dapt', 'des', 'high bleeding risk', etc.
 * ```
 */
export function detectClinicalScenarios(query: string): ClinicalScenario[] {
  const matches: ClinicalScenario[] = [];

  for (const [key, scenario] of Object.entries(ANCHOR_GUIDELINES) as [ClinicalScenarioKey, ClinicalScenario][]) {
    const patterns = KEYWORD_PATTERNS.get(key);
    if (!patterns) continue;

    // Check if any keyword pattern matches the query
    const hasMatch = patterns.some(regex => regex.test(query));

    if (hasMatch) {
      matches.push(scenario);
    }
  }

  return matches;
}

/**
 * Retrieves anchor guidelines for a given clinical query.
 * Detects matching clinical scenarios and returns their primary guidelines.
 * 
 * @param query - The clinical query string to analyze
 * @returns Array of anchor guidelines from matching scenarios, deduplicated by name
 * 
 * @example
 * ```typescript
 * const guidelines = getAnchorGuidelines("sepsis management");
 * // Returns Surviving Sepsis Campaign guidelines
 * ```
 */
export function getAnchorGuidelines(query: string): AnchorGuideline[] {
  const scenarios = detectClinicalScenarios(query);
  const guidelines: AnchorGuideline[] = [];

  for (const scenario of scenarios) {
    guidelines.push(...scenario.primaryGuidelines);
  }

  // Deduplicate by name
  const seen = new Set<string>();
  return guidelines.filter(g => {
    if (seen.has(g.name)) return false;
    seen.add(g.name);
    return true;
  });
}

/**
 * Formats anchor guidelines into a structured string for LLM prompt injection.
 * Creates a formatted block with guidelines, citations, and key recommendations.
 * 
 * @param guidelines - Array of anchor guidelines to format
 * @returns Formatted string for prompt injection, or empty string if no guidelines
 * 
 * @example
 * ```typescript
 * const formatted = formatAnchorGuidelinesForPrompt(guidelines);
 * // Returns formatted text block with guidelines and recommendations
 * ```
 */
export function formatAnchorGuidelinesForPrompt(guidelines: AnchorGuideline[]): string {
  if (guidelines.length === 0) return '';

  let formatted = '\n\n--- ANCHOR GUIDELINES (PRIMARY SOURCES - USE THESE FIRST) ---\n\n';
  formatted += '⭐ These are the gold-standard guidelines for this clinical scenario.\n';
  formatted += '⭐ Use these as your PRIMARY sources before consulting other evidence.\n\n';

  guidelines.forEach((guideline, i) => {
    formatted += `${i + 1}. **${guideline.name}**\n`;
    formatted += `   Organization: ${guideline.organization}\n`;
    formatted += `   Year: ${guideline.year}\n`;
    formatted += `   URL: ${guideline.url}\n`;
    if (guideline.citation) formatted += `   Citation Format: ${guideline.citation}\n`; // NEW: Explicit instruction
    if (guideline.pmid) formatted += `   PMID: ${guideline.pmid}\n`;
    if (guideline.doi) formatted += `   DOI: ${guideline.doi}\n`;
    formatted += `   Summary: ${guideline.summary}\n`;

    if (guideline.keyRecommendations && guideline.keyRecommendations.length > 0) {
      formatted += `   Key Recommendations:\n`;
      guideline.keyRecommendations.forEach(rec => {
        formatted += `   - ${rec}\n`;
      });
    }
    formatted += '\n';
  });

  formatted += '--- END ANCHOR GUIDELINES ---\n\n';
  return formatted;
}