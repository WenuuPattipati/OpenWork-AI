/**
 * WHO Guidelines Evidence Source
 * World Health Organization clinical guidelines and recommendations
 */

export interface WHOGuideline {
  title: string;
  category: string;
  year: string;
  url: string;
  summary: string;
  recommendations: string[];
  source: "WHO";
}

/**
 * WHO Guidelines Database (curated key guidelines)
 * These are commonly referenced WHO guidelines for clinical practice
 */
const WHO_GUIDELINES_DATABASE: WHOGuideline[] = [
  // ============================================
  // PHYSICAL ACTIVITY & LIFESTYLE GUIDELINES
  // ============================================
  {
    title: "WHO Guidelines on Physical Activity and Sedentary Behaviour",
    category: "Physical Activity",
    year: "2020",
    url: "https://www.who.int/publications/i/item/9789240015128",
    summary: "Global recommendations on physical activity for health across all age groups. Evidence-based guidelines for optimal health benefits.",
    recommendations: [
      "Adults (18-64): 150-300 minutes/week moderate-intensity OR 75-150 minutes/week vigorous-intensity aerobic activity",
      "Muscle-strengthening activities involving all major muscle groups on 2+ days/week",
      "Children/adolescents (5-17): At least 60 minutes/day moderate-to-vigorous physical activity",
      "Older adults (65+): Same as adults plus multicomponent physical activity emphasizing balance and strength 3+ days/week",
      "Limit sedentary time; replace with physical activity of any intensity",
      "Some physical activity is better than none; start gradually and increase over time",
    ],
    source: "WHO",
  },
  {
    title: "WHO Global Action Plan on Physical Activity 2018-2030",
    category: "Physical Activity",
    year: "2018",
    url: "https://www.who.int/publications/i/item/9789241514187",
    summary: "More Active People for a Healthier World - strategic framework for increasing physical activity globally.",
    recommendations: [
      "Create active societies through social norms and attitudes",
      "Create active environments through urban planning and transport",
      "Create active people through programs across the life course",
      "Create active systems through governance and policy frameworks",
    ],
    source: "WHO",
  },
  {
    title: "WHO Guidelines on Healthy Diet",
    category: "Nutrition",
    year: "2020",
    url: "https://www.who.int/news-room/fact-sheets/detail/healthy-diet",
    summary: "Evidence-based dietary recommendations for preventing chronic diseases and maintaining health.",
    recommendations: [
      "Eat at least 400g (5 portions) of fruits and vegetables daily",
      "Less than 10% of total energy from free sugars (ideally <5%)",
      "Less than 30% of total energy from fats; prefer unsaturated fats",
      "Less than 5g salt per day (less than 2g sodium)",
      "Limit intake of processed foods, red meat, and sugary drinks",
      "Choose whole grains over refined grains",
    ],
    source: "WHO",
  },
  {
    title: "WHO Guideline on Sodium Intake for Adults and Children",
    category: "Nutrition",
    year: "2023",
    url: "https://www.who.int/publications/i/item/9789240073791",
    summary: "Updated recommendations on sodium intake to reduce cardiovascular disease risk.",
    recommendations: [
      "Adults: Reduce sodium intake to <2g/day (equivalent to <5g salt/day)",
      "Children: Adjust adult recommendation downward based on energy requirements",
      "Reduce sodium in processed foods through reformulation",
      "Use potassium-enriched salt substitutes where appropriate",
    ],
    source: "WHO",
  },
  {
    title: "WHO Guidelines on Saturated Fatty Acid and Trans-Fatty Acid Intake",
    category: "Nutrition",
    year: "2023",
    url: "https://www.who.int/publications/i/item/9789240073630",
    summary: "Recommendations on fat intake for cardiovascular health.",
    recommendations: [
      "Limit saturated fatty acid intake to <10% of total energy",
      "Replace saturated fats with polyunsaturated fatty acids",
      "Eliminate industrially-produced trans-fatty acids from food supply",
      "Limit trans-fat intake to <1% of total energy",
    ],
    source: "WHO",
  },
  {
    title: "WHO Guidelines on Sugar Intake for Adults and Children",
    category: "Nutrition",
    year: "2015",
    url: "https://www.who.int/publications/i/item/9789241549028",
    summary: "Recommendations on free sugars intake to reduce risk of NCDs and dental caries.",
    recommendations: [
      "Reduce free sugars to <10% of total energy intake",
      "Further reduction to <5% provides additional health benefits",
      "Free sugars include added sugars and sugars in honey, syrups, fruit juices",
      "Applies to both adults and children",
    ],
    source: "WHO",
  },
  {
    title: "WHO Guideline on Use of Non-Sugar Sweeteners",
    category: "Nutrition",
    year: "2023",
    url: "https://www.who.int/publications/i/item/9789240073616",
    summary: "WHO recommends against the use of non-sugar sweeteners (NSS) for weight control or reducing risk of noncommunicable diseases.",
    recommendations: [
      "Do NOT use non-sugar sweeteners as a means of achieving weight control",
      "Do NOT use NSS to reduce risk of noncommunicable diseases",
      "NSS include acesulfame K, aspartame, advantame, cyclamates, neotame, saccharin, sucralose, stevia",
      "Long-term use may increase risk of type 2 diabetes, cardiovascular disease, and mortality",
      "Replace both sugars and NSS with naturally sweet foods like fruit",
      "Recommendation applies to all individuals except those with pre-existing diabetes",
    ],
    source: "WHO",
  },
  {
    title: "WHO Food Safety Guidelines",
    category: "Food Safety",
    year: "2023",
    url: "https://www.who.int/health-topics/food-safety",
    summary: "Guidelines on food additives, contaminants, and safe food practices.",
    recommendations: [
      "Food additives must be evaluated for safety before use",
      "Acceptable Daily Intake (ADI) established for approved additives",
      "JECFA (Joint FAO/WHO Expert Committee) evaluates food additive safety",
      "Consumers should follow recommended intake levels",
      "Report adverse reactions to food additives to health authorities",
    ],
    source: "WHO",
  },
  {
    title: "WHO Guidelines on Alcohol Consumption",
    category: "Lifestyle",
    year: "2023",
    url: "https://www.who.int/publications/i/item/9789240084759",
    summary: "Evidence on alcohol and health - no safe level of alcohol consumption.",
    recommendations: [
      "No safe level of alcohol consumption for health",
      "Risk of health harm increases with amount consumed",
      "Pregnant women and breastfeeding mothers should not drink alcohol",
      "People with certain health conditions should avoid alcohol entirely",
      "Reducing alcohol consumption provides health benefits at any level",
    ],
    source: "WHO",
  },
  {
    title: "WHO Guidelines on Tobacco Cessation",
    category: "Lifestyle",
    year: "2021",
    url: "https://www.who.int/publications/i/item/9789240032507",
    summary: "Clinical treatments for tobacco dependence in adults.",
    recommendations: [
      "Brief advice from healthcare providers increases quit rates",
      "Behavioral support (individual, group, or telephone) is effective",
      "Nicotine replacement therapy (NRT) is safe and effective",
      "Varenicline and bupropion are effective pharmacotherapies",
      "Combination of behavioral support and pharmacotherapy is most effective",
    ],
    source: "WHO",
  },
  {
    title: "WHO Guidelines on Sleep Health",
    category: "Lifestyle",
    year: "2022",
    url: "https://www.who.int/news-room/fact-sheets/detail/physical-activity",
    summary: "Recommendations on sleep duration and quality for health.",
    recommendations: [
      "Adults: 7-9 hours of quality sleep per night",
      "Children 6-12 years: 9-12 hours per night",
      "Teenagers 13-18 years: 8-10 hours per night",
      "Maintain consistent sleep schedule",
      "Limit screen time before bed",
      "Create conducive sleep environment (dark, quiet, cool)",
    ],
    source: "WHO",
  },
  // ============================================
  // CHRONIC DISEASE PREVENTION
  // ============================================
  {
    title: "WHO Global NCD Action Plan 2013-2030",
    category: "Prevention",
    year: "2023",
    url: "https://www.who.int/publications/i/item/9789241506236",
    summary: "Global action plan for prevention and control of noncommunicable diseases.",
    recommendations: [
      "26% relative reduction in premature mortality from NCDs by 2026",
      "10% relative reduction in harmful use of alcohol",
      "10% relative reduction in physical inactivity",
      "30% relative reduction in mean population salt intake",
      "30% relative reduction in tobacco use",
      "25% relative reduction in raised blood pressure",
      "Halt rise in diabetes and obesity",
    ],
    source: "WHO",
  },
  {
    title: "WHO Package of Essential NCD Interventions (WHO PEN)",
    category: "Prevention",
    year: "2020",
    url: "https://www.who.int/publications/i/item/who-package-of-essential-noncommunicable-(pen)-disease-interventions-for-primary-health-care",
    summary: "Essential interventions for cardiovascular disease, diabetes, chronic respiratory disease, and cancer in primary care.",
    recommendations: [
      "Cardiovascular risk assessment using WHO/ISH risk charts",
      "Lifestyle counseling for all patients at risk",
      "Drug therapy for high-risk individuals",
      "Referral criteria for specialist care",
    ],
    source: "WHO",
  },
  // ============================================
  // MENTAL HEALTH
  // ============================================
  {
    title: "WHO Guidelines on Mental Health at Work",
    category: "Mental Health",
    year: "2022",
    url: "https://www.who.int/publications/i/item/9789240053052",
    summary: "Recommendations for protecting and promoting mental health at work.",
    recommendations: [
      "Organizational interventions to modify psychosocial work environment",
      "Manager training on mental health",
      "Worker training on mental health awareness",
      "Individual interventions for workers with mental health conditions",
      "Return to work programs after mental health-related absence",
    ],
    source: "WHO",
  },
  {
    title: "WHO Guidelines on Self-Care Interventions for Health",
    category: "Self-Care",
    year: "2022",
    url: "https://www.who.int/publications/i/item/9789240052192",
    summary: "Evidence-based recommendations on self-care interventions for health and well-being.",
    recommendations: [
      "Self-monitoring of blood pressure for hypertension management",
      "Self-testing for various health conditions",
      "Digital health interventions for self-management",
      "Community support for self-care practices",
    ],
    source: "WHO",
  },
  // ============================================
  // INFECTIOUS DISEASES
  // ============================================
  {
    title: "WHO Guidelines on Tuberculosis Treatment",
    category: "Infectious Diseases",
    year: "2022",
    url: "https://www.who.int/publications/i/item/9789240048126",
    summary: "Consolidated guidelines on tuberculosis treatment, including drug-resistant TB management.",
    recommendations: [
      "First-line treatment: 2HRZE/4HR regimen for drug-susceptible TB",
      "Shorter regimens for MDR-TB when appropriate",
      "Bedaquiline-based regimens for MDR-TB",
    ],
    source: "WHO",
  },
  {
    title: "WHO Guidelines on HIV Treatment and Prevention",
    category: "Infectious Diseases",
    year: "2023",
    url: "https://www.who.int/publications/i/item/9789240055179",
    summary: "Consolidated guidelines on HIV prevention, testing, treatment, service delivery and monitoring.",
    recommendations: [
      "Dolutegravir-based regimens as preferred first-line ART",
      "PrEP for populations at substantial risk",
      "Same-day ART initiation when ready",
    ],
    source: "WHO",
  },
  {
    title: "WHO Guidelines on Malaria",
    category: "Infectious Diseases",
    year: "2023",
    url: "https://www.who.int/publications/i/item/9789240086173",
    summary: "Guidelines for malaria prevention, diagnosis, and treatment.",
    recommendations: [
      "Artemisinin-based combination therapy (ACT) for uncomplicated P. falciparum",
      "Rapid diagnostic tests for malaria diagnosis",
      "Seasonal malaria chemoprevention in high-burden areas",
    ],
    source: "WHO",
  },
  // Cardiovascular
  {
    title: "WHO HEARTS Technical Package for Cardiovascular Disease Management",
    category: "Cardiovascular",
    year: "2021",
    url: "https://www.who.int/publications/i/item/9789240001367",
    summary: "Evidence-based protocols for hypertension and cardiovascular disease management in primary care.",
    recommendations: [
      "Target BP <140/90 mmHg for most adults",
      "ACE inhibitors or ARBs as first-line for hypertension",
      "Statin therapy for high cardiovascular risk",
    ],
    source: "WHO",
  },
  // Diabetes
  {
    title: "WHO Guidelines on Diabetes Management",
    category: "Endocrinology",
    year: "2023",
    url: "https://www.who.int/publications/i/item/who-ucn-ncd-20.1",
    summary: "Guidelines for type 2 diabetes screening, diagnosis, and management.",
    recommendations: [
      "Metformin as first-line therapy for type 2 diabetes",
      "HbA1c target <7% for most adults",
      "SGLT2 inhibitors for patients with cardiovascular or renal disease",
    ],
    source: "WHO",
  },
  // Mental Health
  {
    title: "WHO mhGAP Intervention Guide",
    category: "Mental Health",
    year: "2023",
    url: "https://www.who.int/publications/i/item/9789240045125",
    summary: "Mental Health Gap Action Programme for mental, neurological and substance use disorders.",
    recommendations: [
      "Stepped care approach for depression",
      "Psychosocial interventions as first-line for mild-moderate depression",
      "SSRIs as first-line pharmacotherapy when indicated",
    ],
    source: "WHO",
  },
  // Maternal Health
  {
    title: "WHO Recommendations on Antenatal Care",
    category: "Maternal Health",
    year: "2022",
    url: "https://www.who.int/publications/i/item/9789241549912",
    summary: "Recommendations for a positive pregnancy experience.",
    recommendations: [
      "Minimum 8 antenatal care contacts",
      "Iron and folic acid supplementation",
      "Ultrasound before 24 weeks gestation",
    ],
    source: "WHO",
  },
  // Child Health
  {
    title: "WHO Pocket Book of Hospital Care for Children",
    category: "Pediatrics",
    year: "2023",
    url: "https://www.who.int/publications/i/item/978-92-4-154837-3",
    summary: "Guidelines for management of common childhood illnesses.",
    recommendations: [
      "IMCI approach for integrated management",
      "ORS and zinc for diarrhea management",
      "Amoxicillin for community-acquired pneumonia",
    ],
    source: "WHO",
  },
  // Cancer
  {
    title: "WHO Essential Medicines for Cancer",
    category: "Oncology",
    year: "2023",
    url: "https://www.who.int/publications/i/item/9789240055315",
    summary: "WHO list of essential medicines for cancer treatment.",
    recommendations: [
      "Prioritize high-impact, cost-effective cancer treatments",
      "Include targeted therapies where evidence supports",
      "Ensure access to supportive care medications",
    ],
    source: "WHO",
  },
  // Respiratory
  {
    title: "WHO Guidelines on COVID-19 Therapeutics",
    category: "Respiratory",
    year: "2026",
    url: "https://www.who.int/publications/i/item/WHO-2019-nCoV-therapeutics-2026.1",
    summary: "Living guidelines on drugs for COVID-19 treatment.",
    recommendations: [
      "Nirmatrelvir-ritonavir for high-risk patients",
      "Corticosteroids for severe/critical COVID-19",
      "IL-6 receptor blockers for severe disease",
    ],
    source: "WHO",
  },
];

/**
 * Search WHO guidelines by query
 */
export function searchWHOGuidelines(query: string, limit: number = 5): WHOGuideline[] {
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/).filter((t) => t.length > 2);

  // Score each guideline based on relevance
  const scored = WHO_GUIDELINES_DATABASE.map((guideline) => {
    let score = 0;
    const searchText = `${guideline.title} ${guideline.category} ${guideline.summary} ${guideline.recommendations.join(" ")}`.toLowerCase();

    // Exact phrase match (highest score)
    if (searchText.includes(queryLower)) {
      score += 100;
    }

    // Individual term matches
    for (const term of queryTerms) {
      if (searchText.includes(term)) {
        score += 10;
      }
      // Title match is more important
      if (guideline.title.toLowerCase().includes(term)) {
        score += 20;
      }
      // Category match
      if (guideline.category.toLowerCase().includes(term)) {
        score += 15;
      }
    }

    return { guideline, score };
  });

  // Filter and sort by score
  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.guideline);
}

/**
 * Format WHO guidelines for prompt
 */
export function formatWHOGuidelinesForPrompt(guidelines: WHOGuideline[]): string {
  if (guidelines.length === 0) return "";

  let formatted = "## ZONE 21: WHO GUIDELINES (World Health Organization)\n";
  formatted += "**Global health authority recommendations**\n\n";

  guidelines.forEach((guideline, i) => {
    formatted += `${i + 1}. **${guideline.title}** (${guideline.year})\n`;
    formatted += `   SOURCE: WHO | Category: ${guideline.category}\n`;
    formatted += `   Summary: ${guideline.summary}\n`;
    formatted += `   Key Recommendations:\n`;
    guideline.recommendations.forEach((rec) => {
      formatted += `   - ${rec}\n`;
    });
    formatted += `   URL: ${guideline.url}\n\n`;
  });

  return formatted;
}
