/**
 * BMJ Best Practice Evidence Source
 * Clinical decision support based on latest evidence
 */

export interface BMJBestPractice {
  title: string;
  category: string;
  lastUpdated: string;
  url: string;
  summary: string;
  keyPoints: string[];
  differentialDiagnosis?: string[];
  source: "BMJ";
}

/**
 * BMJ Best Practice Database (curated key topics)
 */
const BMJ_BEST_PRACTICE_DATABASE: BMJBestPractice[] = [
  // Cardiovascular
  {
    title: "Acute Coronary Syndrome",
    category: "Cardiovascular",
    lastUpdated: "2026",
    url: "https://bestpractice.bmj.com/topics/en-us/149",
    summary: "Comprehensive guidance on diagnosis and management of ACS including STEMI and NSTEMI.",
    keyPoints: [
      "ECG within 10 minutes of presentation",
      "Troponin testing at presentation and 3-6 hours",
      "Dual antiplatelet therapy (aspirin + P2Y12 inhibitor)",
      "Primary PCI for STEMI within 120 minutes",
      "Risk stratification using GRACE or TIMI scores",
    ],
    differentialDiagnosis: [
      "Pulmonary embolism",
      "Aortic dissection",
      "Pericarditis",
      "Musculoskeletal pain",
    ],
    source: "BMJ",
  },
  {
    title: "Heart Failure",
    category: "Cardiovascular",
    lastUpdated: "2026",
    url: "https://bestpractice.bmj.com/topics/en-us/62",
    summary: "Evidence-based approach to heart failure diagnosis and management.",
    keyPoints: [
      "BNP/NT-proBNP for initial assessment",
      "Echocardiography to determine ejection fraction",
      "Quadruple therapy for HFrEF: ACEi/ARNi + BB + MRA + SGLT2i",
      "Diuretics for congestion management",
      "Device therapy (ICD/CRT) for selected patients",
    ],
    differentialDiagnosis: [
      "COPD exacerbation",
      "Pneumonia",
      "Pulmonary embolism",
      "Renal failure",
    ],
    source: "BMJ",
  },
  // Respiratory
  {
    title: "Community-Acquired Pneumonia",
    category: "Respiratory",
    lastUpdated: "2026",
    url: "https://bestpractice.bmj.com/topics/en-us/67",
    summary: "Diagnosis and treatment of community-acquired pneumonia in adults.",
    keyPoints: [
      "CURB-65 score for severity assessment",
      "Chest X-ray for diagnosis confirmation",
      "Amoxicillin first-line for low-severity CAP",
      "Add macrolide or use respiratory fluoroquinolone for moderate-severe",
      "Consider atypical pathogens in younger patients",
    ],
    differentialDiagnosis: [
      "Acute bronchitis",
      "Heart failure",
      "Pulmonary embolism",
      "Lung cancer",
    ],
    source: "BMJ",
  },
  {
    title: "Asthma in Adults",
    category: "Respiratory",
    lastUpdated: "2026",
    url: "https://bestpractice.bmj.com/topics/en-us/38",
    summary: "Comprehensive asthma management in adults.",
    keyPoints: [
      "Spirometry with reversibility testing for diagnosis",
      "ICS cornerstone of maintenance therapy",
      "SABA for symptom relief",
      "Step-up therapy based on control assessment",
      "Written asthma action plan for all patients",
    ],
    source: "BMJ",
  },
  // Endocrinology
  {
    title: "Type 2 Diabetes Mellitus",
    category: "Endocrinology",
    lastUpdated: "2026",
    url: "https://bestpractice.bmj.com/topics/en-us/24",
    summary: "Evidence-based management of type 2 diabetes.",
    keyPoints: [
      "Metformin first-line pharmacotherapy",
      "Individualized HbA1c targets (typically <7%)",
      "SGLT2 inhibitors for CV/renal protection",
      "GLP-1 RAs for weight management and CV benefit",
      "Comprehensive cardiovascular risk management",
    ],
    source: "BMJ",
  },
  {
    title: "Diabetic Ketoacidosis",
    category: "Endocrinology",
    lastUpdated: "2026",
    url: "https://bestpractice.bmj.com/topics/en-us/164",
    summary: "Emergency management of diabetic ketoacidosis.",
    keyPoints: [
      "IV fluid resuscitation (0.9% saline initially)",
      "IV insulin infusion (0.1 units/kg/hour)",
      "Potassium replacement when K+ <5.5 mEq/L",
      "Monitor glucose hourly, electrolytes every 2-4 hours",
      "Identify and treat precipitating cause",
    ],
    source: "BMJ",
  },
  // Infectious Diseases
  {
    title: "Sepsis in Adults",
    category: "Infectious Diseases",
    lastUpdated: "2026",
    url: "https://bestpractice.bmj.com/topics/en-us/245",
    summary: "Recognition and management of sepsis and septic shock.",
    keyPoints: [
      "qSOFA for rapid bedside assessment",
      "Blood cultures before antibiotics (don't delay treatment)",
      "Broad-spectrum antibiotics within 1 hour",
      "30 mL/kg crystalloid for hypotension",
      "Vasopressors if fluid-refractory (norepinephrine first-line)",
    ],
    source: "BMJ",
  },
  {
    title: "Urinary Tract Infection in Adults",
    category: "Infectious Diseases",
    lastUpdated: "2026",
    url: "https://bestpractice.bmj.com/topics/en-us/77",
    summary: "Diagnosis and treatment of UTI in adults.",
    keyPoints: [
      "Dipstick testing for uncomplicated cystitis",
      "Urine culture for complicated UTI or treatment failure",
      "Nitrofurantoin or TMP-SMX for uncomplicated cystitis",
      "Fluoroquinolones reserved for complicated cases",
      "7-14 days treatment for pyelonephritis",
    ],
    source: "BMJ",
  },
  // Neurology
  {
    title: "Acute Ischemic Stroke",
    category: "Neurology",
    lastUpdated: "2026",
    url: "https://bestpractice.bmj.com/topics/en-us/1078",
    summary: "Emergency management of acute ischemic stroke.",
    keyPoints: [
      "CT head to exclude hemorrhage",
      "IV alteplase within 4.5 hours of symptom onset",
      "Mechanical thrombectomy for large vessel occlusion",
      "Aspirin within 24-48 hours (after thrombolysis)",
      "Admit to stroke unit for monitoring",
    ],
    source: "BMJ",
  },
  {
    title: "Migraine",
    category: "Neurology",
    lastUpdated: "2026",
    url: "https://bestpractice.bmj.com/topics/en-us/10",
    summary: "Diagnosis and management of migraine.",
    keyPoints: [
      "Clinical diagnosis based on ICHD-3 criteria",
      "NSAIDs or triptans for acute treatment",
      "Prophylaxis if ≥4 headache days/month",
      "Beta-blockers, topiramate, or amitriptyline for prevention",
      "CGRP inhibitors for refractory cases",
    ],
    source: "BMJ",
  },
  // Gastroenterology
  {
    title: "Gastroesophageal Reflux Disease",
    category: "Gastroenterology",
    lastUpdated: "2026",
    url: "https://bestpractice.bmj.com/topics/en-us/82",
    summary: "Management of GERD in adults.",
    keyPoints: [
      "Lifestyle modifications (weight loss, avoid triggers)",
      "PPI therapy for 4-8 weeks",
      "Step-down to lowest effective dose",
      "Endoscopy for alarm symptoms or refractory cases",
      "Consider H. pylori testing",
    ],
    source: "BMJ",
  },
  // Mental Health
  {
    title: "Major Depressive Disorder",
    category: "Mental Health",
    lastUpdated: "2026",
    url: "https://bestpractice.bmj.com/topics/en-us/55",
    summary: "Evidence-based treatment of major depression.",
    keyPoints: [
      "PHQ-9 for screening and monitoring",
      "SSRIs first-line pharmacotherapy",
      "CBT effective for mild-moderate depression",
      "Combination therapy for severe depression",
      "Assess suicide risk at every visit",
    ],
    source: "BMJ",
  },
];

/**
 * Search BMJ Best Practice by query
 */
export function searchBMJBestPractice(query: string, limit: number = 5): BMJBestPractice[] {
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/).filter((t) => t.length > 2);

  const scored = BMJ_BEST_PRACTICE_DATABASE.map((topic) => {
    let score = 0;
    const searchText = `${topic.title} ${topic.category} ${topic.summary} ${topic.keyPoints.join(" ")}`.toLowerCase();

    if (searchText.includes(queryLower)) {
      score += 100;
    }

    for (const term of queryTerms) {
      if (searchText.includes(term)) {
        score += 10;
      }
      if (topic.title.toLowerCase().includes(term)) {
        score += 25;
      }
      if (topic.category.toLowerCase().includes(term)) {
        score += 15;
      }
    }

    return { topic, score };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.topic);
}

/**
 * Format BMJ Best Practice for prompt
 */
export function formatBMJBestPracticeForPrompt(topics: BMJBestPractice[]): string {
  if (topics.length === 0) return "";

  let formatted = "## ZONE 24: BMJ BEST PRACTICE (Clinical Decision Support)\n";
  formatted += "**Evidence-based clinical guidance**\n\n";

  topics.forEach((topic, i) => {
    formatted += `${i + 1}. **${topic.title}** (Updated: ${topic.lastUpdated})\n`;
    formatted += `   SOURCE: BMJ Best Practice | Category: ${topic.category}\n`;
    formatted += `   Summary: ${topic.summary}\n`;
    formatted += `   Key Points:\n`;
    topic.keyPoints.forEach((point) => {
      formatted += `   - ${point}\n`;
    });
    if (topic.differentialDiagnosis && topic.differentialDiagnosis.length > 0) {
      formatted += `   Differential Diagnosis: ${topic.differentialDiagnosis.join(", ")}\n`;
    }
    formatted += `   URL: ${topic.url}\n\n`;
  });

  return formatted;
}
