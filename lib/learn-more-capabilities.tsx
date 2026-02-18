/**
 * Learn More Capabilities
 * 
 * Comprehensive question sets for Doctor Mode and General Mode
 * Designed to showcase system capabilities and provide high-quality responses
 */

export interface CapabilityCategory {
  title: string;
  icon: React.ReactNode;
  questions: string[];
}


// ============================================================================
// DOCTOR MODE - Professional Clinical Questions
// ============================================================================

export const DOCTOR_MODE_CAPABILITIES = [
  {
    title: "Evidence Synthesis & Meta-Analysis",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
    ),
    questions: [
      "What is the evidence comparing SGLT2 inhibitors versus GLP-1 agonists for cardiovascular outcomes in type 2 diabetes patients with established cardiovascular disease?",
      "What are the current ACC/AHA and ESC guideline recommendations for dual antiplatelet therapy duration after percutaneous coronary intervention in high bleeding risk patients?",
      "Compare the efficacy and safety of direct oral anticoagulants versus warfarin in atrial fibrillation patients with chronic kidney disease (eGFR 15-30 mL/min)."
    ]
  },

  {
    title: "Complex Clinical Cases & DDx",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    questions: [
      "What is the diagnostic approach and treatment for heart failure with preserved ejection fraction (HFpEF) in a patient with dyspnea, edema, and elevated BNP?",
      "How do you differentiate septic arthritis from crystal-induced arthropathy in acute monoarticular knee pain with synovial fluid showing 60,000 WBCs and 85% neutrophils?",
      "What is the workup for recurrent unprovoked deep vein thrombosis in a young patient? Include thrombophilia testing, antiphospholipid syndrome evaluation, and malignancy screening."
    ]
  },
  {
    title: "Advanced Pharmacotherapy & Drug Interactions",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    questions: [
      "What is the management strategy for warfarin-fluconazole drug interaction including INR monitoring and dose adjustments?",
      "Compare apixaban versus rivaroxaban dosing and drug interactions in atrial fibrillation patients with moderate renal impairment (CrCl 30-50 mL/min) taking amiodarone.",
      "What are the treatment options for immune checkpoint inhibitor-induced colitis? Compare corticosteroids versus infliximab and discuss when to discontinue immunotherapy."
    ]
  },
  {
    title: "Guideline-Based Treatment Algorithms",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    questions: [
      "What are the KDIGO guideline recommendations for managing hyperkalemia in chronic kidney disease patients on RAAS inhibitors? Compare patiromer versus sodium zirconium cyclosilicate.",
      "What are the ACC/AHA and ESC guideline differences for managing non-ST elevation acute coronary syndrome including risk stratification and timing of invasive strategy?",
      "What are the ADA guideline recommendations for initiating and intensifying insulin therapy in type 2 diabetes including basal insulin selection and titration?"
    ]
  },
  {
    title: "Oncology & Precision Medicine",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    questions: [
      "What are the treatment options for EGFR-mutant non-small cell lung cancer after osimertinib progression including chemotherapy and immunotherapy?",
      "Compare pembrolizumab monotherapy versus nivolumab plus ipilimumab for first-line treatment of metastatic melanoma including efficacy, toxicity, and PD-L1 considerations.",
      "What are the NCCN guidelines for BRCA1/2 testing in breast cancer and how do results guide treatment with PARP inhibitors and platinum chemotherapy?"
    ]
  },
  {
    title: "Critical Care & Emergency Medicine",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    questions: [
      "What are the Surviving Sepsis Campaign guideline recommendations for vasopressor selection in septic shock? Compare norepinephrine versus vasopressin and when to add additional agents.",
      "What is the evidence-based management of acute respiratory distress syndrome (ARDS) including lung-protective ventilation, prone positioning, and ECMO indications?",
      "What are the current guidelines for targeted temperature management after cardiac arrest including temperature targets, duration, and neuroprognostication?"
    ]
  },
  {
    title: "Exam Preparation & Board Review",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    questions: [
      "What is the management approach for non-ST elevation myocardial infarction with elevated troponin and ST depressions in lateral leads?",
      "What is the pathophysiology, clinical presentation, diagnostic criteria, and acute management of thyroid storm?",
      "Compare ACE inhibitors, ARBs, and ARNIs (sacubitril/valsartan) for heart failure including mechanisms of action, indications, and adverse effects."
    ]
  },
  {
    title: "Infectious Disease & Antimicrobial Stewardship",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    questions: [
      "What is the empiric antibiotic treatment for hospital-acquired pneumonia with MRSA and Pseudomonas risk factors? Compare vancomycin plus piperacillin-tazobactam versus cefepime.",
      "What are the IDSA guideline recommendations for Clostridioides difficile infection treatment? Compare fidaxomicin versus vancomycin and discuss fecal microbiota transplantation indications.",
      "What is the treatment approach for candidemia in non-neutropenic patients? Compare echinocandins versus fluconazole including source control and treatment duration."
    ]
  },
  {
    title: "Neurology & Stroke Management",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    questions: [
      "What is the treatment approach for acute ischemic stroke within 4.5 hours of onset? Compare IV alteplase, mechanical thrombectomy, and combination therapy including imaging requirements.",
      "Compare levetiracetam, lamotrigine, and carbamazepine as first-line monotherapy for newly diagnosed focal epilepsy including efficacy, tolerability, and drug interactions.",
      "What are the diagnostic criteria and treatment algorithm for myasthenia gravis including antibody testing, electrophysiology, and immunotherapy options?"
    ]
  },
  {
    title: "Medical Imaging Interpretation",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    questions: [
      "What are the classic chest X-ray findings of congestive heart failure including Kerley B lines, cephalization, pleural effusions, and cardiomegaly?",
      "What are the CT findings that differentiate ischemic stroke from hemorrhagic stroke in the acute setting including hyperdense MCA sign and loss of gray-white differentiation?",
      "What is the differential diagnosis for ground-glass opacities with crazy-paving pattern on chest CT including COVID-19, Pneumocystis jirovecii, and organizing pneumonia?"
    ]
  }
];
