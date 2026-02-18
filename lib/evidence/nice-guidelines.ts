/**
 * NICE Guidelines Evidence Source
 * National Institute for Health and Care Excellence (UK) clinical guidelines
 */

export interface NICEGuideline {
  id: string;
  title: string;
  category: string;
  year: string;
  url: string;
  summary: string;
  recommendations: string[];
  source: "NICE";
}

/**
 * NICE Guidelines Database (curated key guidelines)
 */
const NICE_GUIDELINES_DATABASE: NICEGuideline[] = [
  // ============================================
  // PHYSICAL ACTIVITY & LIFESTYLE
  // ============================================
  {
    id: "PH44",
    title: "Physical Activity: Brief Advice for Adults in Primary Care",
    category: "Physical Activity",
    year: "2013",
    url: "https://www.nice.org.uk/guidance/ph44",
    summary: "Recommendations for healthcare professionals to promote physical activity through brief interventions.",
    recommendations: [
      "Identify inactive adults using validated tools or direct questions",
      "Provide brief advice (verbal) on benefits of physical activity",
      "Adults: 150 minutes/week moderate OR 75 minutes/week vigorous activity",
      "Include muscle-strengthening activities on 2+ days/week",
      "Follow up to assess progress and provide ongoing support",
    ],
    source: "NICE",
  },
  {
    id: "NG90",
    title: "Physical Activity and the Environment",
    category: "Physical Activity",
    year: "2018",
    url: "https://www.nice.org.uk/guidance/ng90",
    summary: "How the built and natural environment can encourage physical activity.",
    recommendations: [
      "Design environments that encourage walking and cycling",
      "Ensure access to open spaces and recreational facilities",
      "Create safe, well-lit routes for active travel",
      "Consider physical activity in all planning decisions",
    ],
    source: "NICE",
  },
  {
    id: "CG189",
    title: "Obesity: Identification, Assessment and Management",
    category: "Weight Management",
    year: "2023",
    url: "https://www.nice.org.uk/guidance/cg189",
    summary: "Clinical management of overweight and obesity in adults and children.",
    recommendations: [
      "Use BMI and waist circumference for assessment",
      "Multicomponent interventions: diet, physical activity, behavior change",
      "Consider pharmacotherapy if BMI ≥30 or ≥27.5 with comorbidities",
      "Bariatric surgery for BMI ≥40 or ≥35 with comorbidities",
      "Aim for 5-10% weight loss for health benefits",
    ],
    source: "NICE",
  },
  {
    id: "PH53",
    title: "Weight Management: Lifestyle Services for Overweight or Obese Adults",
    category: "Weight Management",
    year: "2014",
    url: "https://www.nice.org.uk/guidance/ph53",
    summary: "Lifestyle weight management services for adults who are overweight or obese.",
    recommendations: [
      "Multicomponent programs lasting at least 3 months",
      "Include dietary advice, physical activity, and behavior change",
      "Group-based programs are effective and cost-effective",
      "Aim for 3% weight loss at 12 months minimum",
    ],
    source: "NICE",
  },
  {
    id: "NG7",
    title: "Preventing Excess Weight Gain",
    category: "Prevention",
    year: "2015",
    url: "https://www.nice.org.uk/guidance/ng7",
    summary: "Preventing excess weight gain in adults and children.",
    recommendations: [
      "Encourage healthy eating patterns from early life",
      "Promote regular physical activity",
      "Reduce sedentary behavior, especially screen time",
      "Support behavior change through brief interventions",
    ],
    source: "NICE",
  },
  // ============================================
  // NUTRITION & DIET
  // ============================================
  {
    id: "PH25",
    title: "Prevention of Cardiovascular Disease",
    category: "Cardiovascular",
    year: "2010",
    url: "https://www.nice.org.uk/guidance/ph25",
    summary: "Population and individual approaches to preventing cardiovascular disease.",
    recommendations: [
      "Eat at least 5 portions of fruit and vegetables daily",
      "Replace saturated fats with unsaturated fats",
      "Reduce salt intake to <6g/day",
      "Eat oily fish at least twice a week",
      "Maintain healthy weight through diet and exercise",
    ],
    source: "NICE",
  },
  {
    id: "NG195",
    title: "Vitamin D Supplementation",
    category: "Nutrition",
    year: "2020",
    url: "https://www.nice.org.uk/guidance/ng195",
    summary: "Vitamin D supplementation for specific population groups.",
    recommendations: [
      "All adults should consider 10 micrograms vitamin D daily in autumn/winter",
      "At-risk groups should take vitamin D year-round",
      "Pregnant and breastfeeding women should take vitamin D",
      "Children aged 1-4 should take 10 micrograms daily",
    ],
    source: "NICE",
  },
  // ============================================
  // MENTAL HEALTH & WELLBEING
  // ============================================
  {
    id: "CG90",
    title: "Depression in Adults: Recognition and Management",
    category: "Mental Health",
    year: "2022",
    url: "https://www.nice.org.uk/guidance/cg90",
    summary: "Recognition and management of depression in adults.",
    recommendations: [
      "Use validated tools for assessment (PHQ-9, GAD-7)",
      "Low-intensity interventions for mild depression",
      "Consider exercise as treatment option",
      "SSRIs first-line if medication indicated",
      "Combination therapy for moderate-severe depression",
    ],
    source: "NICE",
  },
  {
    id: "PH16",
    title: "Mental Wellbeing at Work",
    category: "Mental Health",
    year: "2009",
    url: "https://www.nice.org.uk/guidance/ph16",
    summary: "Promoting mental wellbeing through productive and healthy working conditions.",
    recommendations: [
      "Adopt organization-wide approach to mental wellbeing",
      "Provide flexible working arrangements where possible",
      "Train managers to support employee mental health",
      "Promote physical activity during work day",
    ],
    source: "NICE",
  },
  {
    id: "NG215",
    title: "Tobacco: Preventing Uptake, Promoting Quitting and Treating Dependence",
    category: "Lifestyle",
    year: "2023",
    url: "https://www.nice.org.uk/guidance/ng215",
    summary: "Comprehensive guidance on tobacco control and smoking cessation.",
    recommendations: [
      "Very brief advice on smoking at every opportunity",
      "Offer behavioral support plus pharmacotherapy",
      "Varenicline or combination NRT as first-line",
      "E-cigarettes can be offered as quit aid",
      "Follow up within 2 weeks of quit date",
    ],
    source: "NICE",
  },
  {
    id: "PH24",
    title: "Alcohol-Use Disorders: Prevention",
    category: "Lifestyle",
    year: "2010",
    url: "https://www.nice.org.uk/guidance/ph24",
    summary: "Preventing harmful alcohol use in the population.",
    recommendations: [
      "Screen for alcohol use using validated tools (AUDIT)",
      "Provide brief interventions for hazardous drinking",
      "Refer to specialist services for dependent drinkers",
      "Low-risk drinking: ≤14 units/week spread over 3+ days",
    ],
    source: "NICE",
  },
  // ============================================
  // CARDIOVASCULAR
  // ============================================
  {
    id: "NG136",
    title: "Hypertension in Adults: Diagnosis and Management",
    category: "Cardiovascular",
    year: "2023",
    url: "https://www.nice.org.uk/guidance/ng136",
    summary: "NICE guideline on diagnosing and managing high blood pressure in adults.",
    recommendations: [
      "Confirm diagnosis with ABPM or HBPM",
      "Target clinic BP <140/90 mmHg (<80 years) or <150/90 mmHg (≥80 years)",
      "ACE inhibitor or ARB first-line (CCB if Afro-Caribbean)",
      "Consider statin therapy based on QRISK assessment",
    ],
    source: "NICE",
  },
  {
    id: "NG185",
    title: "Chronic Heart Failure in Adults",
    category: "Cardiovascular",
    year: "2023",
    url: "https://www.nice.org.uk/guidance/ng185",
    summary: "Diagnosis and management of chronic heart failure in adults.",
    recommendations: [
      "NT-proBNP for diagnosis; echocardiography if elevated",
      "ACE inhibitor + beta-blocker for HFrEF",
      "Add MRA if symptoms persist",
      "Consider SGLT2 inhibitor for HFrEF",
    ],
    source: "NICE",
  },
  // Diabetes
  {
    id: "NG28",
    title: "Type 2 Diabetes in Adults: Management",
    category: "Endocrinology",
    year: "2022",
    url: "https://www.nice.org.uk/guidance/ng28",
    summary: "Managing type 2 diabetes in adults, including lifestyle and drug treatment.",
    recommendations: [
      "Metformin first-line after lifestyle interventions",
      "Individualized HbA1c targets (usually 48-58 mmol/mol)",
      "SGLT2 inhibitor if high CV risk or heart failure",
      "GLP-1 RA if BMI ≥35 and specific conditions",
    ],
    source: "NICE",
  },
  {
    id: "NG17",
    title: "Type 1 Diabetes in Adults: Diagnosis and Management",
    category: "Endocrinology",
    year: "2022",
    url: "https://www.nice.org.uk/guidance/ng17",
    summary: "Diagnosis and management of type 1 diabetes in adults.",
    recommendations: [
      "Multiple daily injection basal-bolus regimen or insulin pump",
      "Target HbA1c 48 mmol/mol (6.5%) or lower",
      "Structured education (e.g., DAFNE)",
      "CGM for those meeting criteria",
    ],
    source: "NICE",
  },
  // Mental Health
  {
    id: "NG222",
    title: "Depression in Adults: Treatment and Management",
    category: "Mental Health",
    year: "2022",
    url: "https://www.nice.org.uk/guidance/ng222",
    summary: "Treatment and management of depression in adults.",
    recommendations: [
      "Discuss treatment options including psychological and pharmacological",
      "SSRIs first-line if medication indicated",
      "CBT or behavioral activation for mild-moderate depression",
      "Combination therapy for severe depression",
    ],
    source: "NICE",
  },
  {
    id: "NG116",
    title: "Generalised Anxiety Disorder and Panic Disorder",
    category: "Mental Health",
    year: "2020",
    url: "https://www.nice.org.uk/guidance/ng116",
    summary: "Management of generalised anxiety disorder and panic disorder in adults.",
    recommendations: [
      "Low-intensity psychological interventions first",
      "CBT or applied relaxation for GAD",
      "SSRI (sertraline) if medication needed",
      "Consider pregabalin if SSRIs ineffective",
    ],
    source: "NICE",
  },
  // Respiratory
  {
    id: "NG80",
    title: "Asthma: Diagnosis, Monitoring and Chronic Asthma Management",
    category: "Respiratory",
    year: "2021",
    url: "https://www.nice.org.uk/guidance/ng80",
    summary: "Diagnosing, monitoring and managing asthma in adults and children.",
    recommendations: [
      "Objective tests for diagnosis (spirometry, FeNO, peak flow)",
      "SABA reliever + low-dose ICS maintenance",
      "Step up to LABA + ICS if uncontrolled",
      "Consider MART regimen",
    ],
    source: "NICE",
  },
  {
    id: "NG115",
    title: "Chronic Obstructive Pulmonary Disease",
    category: "Respiratory",
    year: "2019",
    url: "https://www.nice.org.uk/guidance/ng115",
    summary: "Diagnosis and management of COPD in adults.",
    recommendations: [
      "Post-bronchodilator FEV1/FVC <0.7 for diagnosis",
      "SABA or SAMA for initial relief",
      "LABA + LAMA for persistent symptoms",
      "Add ICS if asthmatic features or frequent exacerbations",
    ],
    source: "NICE",
  },
  // Pain
  {
    id: "NG193",
    title: "Chronic Pain: Assessment and Management",
    category: "Pain Management",
    year: "2021",
    url: "https://www.nice.org.uk/guidance/ng193",
    summary: "Assessment and management of chronic primary pain.",
    recommendations: [
      "Do not offer opioids for chronic primary pain",
      "Consider supervised group exercise programmes",
      "Psychological therapies (ACT, CBT)",
      "Consider antidepressants (amitriptyline, duloxetine)",
    ],
    source: "NICE",
  },
  // Cancer
  {
    id: "NG12",
    title: "Suspected Cancer: Recognition and Referral",
    category: "Oncology",
    year: "2023",
    url: "https://www.nice.org.uk/guidance/ng12",
    summary: "Recognising symptoms of suspected cancer and referring appropriately.",
    recommendations: [
      "2-week wait referral for suspected cancer",
      "Safety netting for patients with unexplained symptoms",
      "Lower threshold for investigation in high-risk groups",
      "Direct access to diagnostic tests where appropriate",
    ],
    source: "NICE",
  },
  // Antimicrobial
  {
    id: "NG120",
    title: "Urinary Tract Infection (Lower): Antimicrobial Prescribing",
    category: "Infectious Diseases",
    year: "2023",
    url: "https://www.nice.org.uk/guidance/ng120",
    summary: "Antimicrobial prescribing for lower urinary tract infections.",
    recommendations: [
      "Nitrofurantoin first-line for uncomplicated UTI",
      "Trimethoprim if low resistance risk",
      "3-day course for women, 7 days for men",
      "Back-up antibiotic prescription option",
    ],
    source: "NICE",
  },
];

/**
 * Search NICE guidelines by query
 */
export function searchNICEGuidelines(query: string, limit: number = 5): NICEGuideline[] {
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/).filter((t) => t.length > 2);

  const scored = NICE_GUIDELINES_DATABASE.map((guideline) => {
    let score = 0;
    const searchText = `${guideline.title} ${guideline.category} ${guideline.summary} ${guideline.recommendations.join(" ")}`.toLowerCase();

    if (searchText.includes(queryLower)) {
      score += 100;
    }

    for (const term of queryTerms) {
      if (searchText.includes(term)) {
        score += 10;
      }
      if (guideline.title.toLowerCase().includes(term)) {
        score += 20;
      }
      if (guideline.category.toLowerCase().includes(term)) {
        score += 15;
      }
    }

    return { guideline, score };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.guideline);
}

/**
 * Format NICE guidelines for prompt
 */
export function formatNICEGuidelinesForPrompt(guidelines: NICEGuideline[]): string {
  if (guidelines.length === 0) return "";

  let formatted = "## ZONE 23: NICE GUIDELINES (UK National Institute for Health and Care Excellence)\n";
  formatted += "**UK clinical excellence recommendations**\n\n";

  guidelines.forEach((guideline, i) => {
    formatted += `${i + 1}. **${guideline.title}** [${guideline.id}] (${guideline.year})\n`;
    formatted += `   SOURCE: NICE | Category: ${guideline.category}\n`;
    formatted += `   Summary: ${guideline.summary}\n`;
    formatted += `   Key Recommendations:\n`;
    guideline.recommendations.forEach((rec) => {
      formatted += `   - ${rec}\n`;
    });
    formatted += `   URL: ${guideline.url}\n\n`;
  });

  return formatted;
}
