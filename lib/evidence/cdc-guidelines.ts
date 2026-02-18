/**
 * CDC Guidelines Evidence Source
 * Centers for Disease Control and Prevention clinical guidelines
 */

export interface CDCGuideline {
  title: string;
  category: string;
  year: string;
  url: string;
  summary: string;
  recommendations: string[];
  source: "CDC";
}

/**
 * CDC Guidelines Database (curated key guidelines)
 */
const CDC_GUIDELINES_DATABASE: CDCGuideline[] = [
  // ============================================
  // PHYSICAL ACTIVITY GUIDELINES
  // ============================================
  {
    title: "Physical Activity Guidelines for Americans",
    category: "Physical Activity",
    year: "2018",
    url: "https://www.cdc.gov/physicalactivity/basics/adults/index.htm",
    summary: "Federal guidelines on physical activity for health benefits. Based on the Physical Activity Guidelines for Americans, 2nd edition.",
    recommendations: [
      "Adults: 150 minutes/week moderate-intensity OR 75 minutes/week vigorous-intensity aerobic activity",
      "Additional health benefits with 300+ minutes/week moderate-intensity activity",
      "Muscle-strengthening activities 2+ days/week involving all major muscle groups",
      "Avoid inactivity - some physical activity is better than none",
      "Spread activity throughout the week; bouts of any length count",
      "Move more, sit less throughout the day",
    ],
    source: "CDC",
  },
  {
    title: "Physical Activity Guidelines for Children and Adolescents",
    category: "Physical Activity",
    year: "2018",
    url: "https://www.cdc.gov/physicalactivity/basics/children/index.htm",
    summary: "Physical activity recommendations for youth aged 6-17 years.",
    recommendations: [
      "60 minutes or more of moderate-to-vigorous physical activity daily",
      "Aerobic activity should make up most of the 60 minutes",
      "Muscle-strengthening activities at least 3 days/week",
      "Bone-strengthening activities at least 3 days/week",
      "Encourage activities that are age-appropriate and enjoyable",
    ],
    source: "CDC",
  },
  {
    title: "Physical Activity for Older Adults",
    category: "Physical Activity",
    year: "2023",
    url: "https://www.cdc.gov/physicalactivity/basics/older_adults/index.htm",
    summary: "Physical activity guidelines specifically for adults 65 years and older.",
    recommendations: [
      "150 minutes/week moderate-intensity aerobic activity",
      "Muscle-strengthening activities 2+ days/week",
      "Balance training activities 3+ days/week for fall prevention",
      "Multicomponent physical activity including aerobic, muscle strengthening, and balance",
      "If chronic conditions limit activity, be as active as abilities allow",
    ],
    source: "CDC",
  },
  // ============================================
  // NUTRITION GUIDELINES
  // ============================================
  {
    title: "Dietary Guidelines for Americans 2020-2026",
    category: "Nutrition",
    year: "2020",
    url: "https://www.cdc.gov/nutrition/resources-publications/dietary-guidelines.html",
    summary: "Federal dietary guidance for healthy eating patterns across the lifespan.",
    recommendations: [
      "Follow a healthy dietary pattern at every life stage",
      "Customize nutrient-dense food choices to reflect preferences and culture",
      "Focus on meeting food group needs with nutrient-dense foods within calorie limits",
      "Limit foods and beverages higher in added sugars, saturated fat, and sodium",
      "Limit alcoholic beverages - up to 1 drink/day women, 2 drinks/day men",
    ],
    source: "CDC",
  },
  {
    title: "CDC Nutrition Guidelines - Fruits and Vegetables",
    category: "Nutrition",
    year: "2023",
    url: "https://www.cdc.gov/nutrition/data-statistics/fruit-vegetable-intake.html",
    summary: "Recommendations for fruit and vegetable consumption for disease prevention.",
    recommendations: [
      "Adults: 1.5-2 cups of fruit daily",
      "Adults: 2-3 cups of vegetables daily",
      "Vary vegetable choices - dark green, red/orange, beans, starchy, other",
      "Choose whole fruits over fruit juices",
      "Only 1 in 10 adults meet recommendations - increase intake",
    ],
    source: "CDC",
  },
  {
    title: "CDC Guidelines on Added Sugars",
    category: "Nutrition",
    year: "2023",
    url: "https://www.cdc.gov/nutrition/data-statistics/added-sugars.html",
    summary: "Recommendations for limiting added sugar intake.",
    recommendations: [
      "Limit added sugars to <10% of daily calories",
      "For 2000 calorie diet: <200 calories (50g) from added sugars",
      "Major sources: sugar-sweetened beverages, desserts, sweet snacks",
      "Read nutrition labels - added sugars now listed separately",
      "Choose water, unsweetened beverages over sugary drinks",
    ],
    source: "CDC",
  },
  {
    title: "FDA Information on High-Intensity Sweeteners",
    category: "Food Safety",
    year: "2023",
    url: "https://www.fda.gov/food/food-additives-petitions/high-intensity-sweeteners",
    summary: "FDA-approved high-intensity sweeteners and their safety status. Six sweeteners are FDA-approved: saccharin, aspartame, acesulfame potassium, sucralose, neotame, and advantame.",
    recommendations: [
      "Six high-intensity sweeteners are FDA-approved as safe",
      "Aspartame: ADI of 50 mg/kg body weight/day - safe except for phenylketonuria",
      "Sucralose: ADI of 5 mg/kg body weight/day",
      "Saccharin: No longer listed as potential carcinogen (delisted 2000)",
      "Stevia (steviol glycosides): Generally Recognized as Safe (GRAS)",
      "People with phenylketonuria (PKU) should avoid aspartame",
      "Acceptable Daily Intake (ADI) represents safe lifetime consumption level",
    ],
    source: "CDC",
  },
  {
    title: "CDC Food Safety and Additives",
    category: "Food Safety",
    year: "2023",
    url: "https://www.cdc.gov/foodsafety/index.html",
    summary: "Information on food safety, additives, and potential health effects.",
    recommendations: [
      "Food additives undergo safety evaluation before approval",
      "Report adverse reactions to FDA MedWatch",
      "Follow recommended serving sizes for foods with additives",
      "Read ingredient labels to identify additives",
      "Consult healthcare provider if concerned about specific additives",
    ],
    source: "CDC",
  },
  {
    title: "CDC Guidelines on Sodium Intake",
    category: "Nutrition",
    year: "2023",
    url: "https://www.cdc.gov/salt/index.htm",
    summary: "Recommendations for reducing sodium intake to prevent hypertension.",
    recommendations: [
      "Adults: <2,300 mg sodium per day",
      "Ideal: <1,500 mg/day for most adults",
      "Most sodium comes from processed and restaurant foods",
      "Read labels and choose lower sodium options",
      "Cook at home more often to control sodium",
    ],
    source: "CDC",
  },
  // ============================================
  // SLEEP GUIDELINES
  // ============================================
  {
    title: "CDC Sleep Guidelines",
    category: "Sleep",
    year: "2023",
    url: "https://www.cdc.gov/sleep/about_sleep/how_much_sleep.html",
    summary: "Recommended sleep duration by age group for optimal health.",
    recommendations: [
      "Adults 18-60: 7+ hours per night",
      "Adults 61-64: 7-9 hours per night",
      "Adults 65+: 7-8 hours per night",
      "Teenagers 13-18: 8-10 hours per night",
      "Children 6-12: 9-12 hours per night",
      "Consistent sleep schedule improves sleep quality",
    ],
    source: "CDC",
  },
  {
    title: "CDC Tips for Better Sleep",
    category: "Sleep",
    year: "2023",
    url: "https://www.cdc.gov/sleep/about_sleep/sleep_hygiene.html",
    summary: "Evidence-based sleep hygiene recommendations.",
    recommendations: [
      "Go to bed and wake up at the same time every day",
      "Keep bedroom quiet, dark, relaxing, and comfortable temperature",
      "Remove electronic devices from bedroom",
      "Avoid large meals, caffeine, and alcohol before bed",
      "Get regular physical activity during the day",
    ],
    source: "CDC",
  },
  // ============================================
  // WEIGHT MANAGEMENT
  // ============================================
  {
    title: "CDC Healthy Weight Guidelines",
    category: "Weight Management",
    year: "2023",
    url: "https://www.cdc.gov/healthyweight/index.html",
    summary: "Guidelines for achieving and maintaining a healthy weight.",
    recommendations: [
      "Balance calories consumed with calories expended",
      "BMI 18.5-24.9 is considered healthy weight for most adults",
      "Losing 5-10% of body weight provides health benefits",
      "Combine healthy eating with regular physical activity",
      "Make sustainable lifestyle changes rather than quick fixes",
    ],
    source: "CDC",
  },
  // ============================================
  // PREVENTIVE HEALTH
  // ============================================
  {
    title: "CDC Preventive Health Screenings",
    category: "Prevention",
    year: "2023",
    url: "https://www.cdc.gov/prevention/index.html",
    summary: "Recommended preventive health screenings by age and risk factors.",
    recommendations: [
      "Blood pressure screening: at least every 2 years if normal",
      "Cholesterol screening: every 4-6 years for adults 20+",
      "Diabetes screening: every 3 years for adults 45+ or with risk factors",
      "Colorectal cancer screening: starting at age 45",
      "Breast cancer screening: mammogram every 2 years for women 50-74",
    ],
    source: "CDC",
  },
  {
    title: "CDC Heart Disease Prevention",
    category: "Cardiovascular",
    year: "2023",
    url: "https://www.cdc.gov/heartdisease/prevention.htm",
    summary: "Lifestyle modifications to prevent heart disease.",
    recommendations: [
      "Eat a healthy diet low in saturated fat, trans fat, and sodium",
      "Maintain healthy weight (BMI 18.5-24.9)",
      "Get regular physical activity (150 min/week moderate intensity)",
      "Don't smoke and avoid secondhand smoke",
      "Limit alcohol consumption",
      "Manage stress effectively",
      "Get adequate sleep (7-9 hours for adults)",
    ],
    source: "CDC",
  },
  // ============================================
  // IMMUNIZATIONS
  // ============================================
  {
    title: "CDC Recommended Immunization Schedule for Adults",
    category: "Immunizations",
    year: "2026",
    url: "https://www.cdc.gov/vaccines/schedules/hcp/imz/adult.html",
    summary: "Annual immunization schedule for adults aged 19 years and older.",
    recommendations: [
      "Annual influenza vaccination for all adults",
      "COVID-19 vaccination per current recommendations",
      "Tdap/Td every 10 years",
      "Shingrix for adults 50+ years",
    ],
    source: "CDC",
  },
  {
    title: "CDC Recommended Immunization Schedule for Children and Adolescents",
    category: "Immunizations",
    year: "2026",
    url: "https://www.cdc.gov/vaccines/schedules/hcp/imz/child-adolescent.html",
    summary: "Immunization schedule for children and adolescents aged 18 years or younger.",
    recommendations: [
      "Hepatitis B at birth",
      "DTaP series at 2, 4, 6, 15-18 months, 4-6 years",
      "MMR at 12-15 months and 4-6 years",
      "HPV vaccination starting at age 11-12",
    ],
    source: "CDC",
  },
  // STI Treatment
  {
    title: "CDC STI Treatment Guidelines",
    category: "Infectious Diseases",
    year: "2021",
    url: "https://www.cdc.gov/std/treatment-guidelines/default.htm",
    summary: "Evidence-based guidelines for treatment of sexually transmitted infections.",
    recommendations: [
      "Ceftriaxone 500mg IM single dose for gonorrhea",
      "Doxycycline 100mg BID x 7 days for chlamydia",
      "Benzathine penicillin G 2.4 million units IM for primary syphilis",
      "Partner notification and treatment",
    ],
    source: "CDC",
  },
  // Antibiotic Prescribing
  {
    title: "CDC Antibiotic Prescribing Guidelines for Outpatient Settings",
    category: "Infectious Diseases",
    year: "2023",
    url: "https://www.cdc.gov/antibiotic-use/clinicians/adult-treatment-rec.html",
    summary: "Guidelines for appropriate antibiotic use in outpatient settings.",
    recommendations: [
      "No antibiotics for viral upper respiratory infections",
      "Amoxicillin first-line for acute bacterial sinusitis",
      "Watchful waiting for acute otitis media in children >2 years",
      "Nitrofurantoin or TMP-SMX for uncomplicated UTI",
    ],
    source: "CDC",
  },
  // Diabetes Prevention
  {
    title: "CDC National Diabetes Prevention Program",
    category: "Endocrinology",
    year: "2023",
    url: "https://www.cdc.gov/diabetes/prevention/index.html",
    summary: "Evidence-based lifestyle change program for diabetes prevention.",
    recommendations: [
      "5-7% weight loss goal",
      "150 minutes/week moderate physical activity",
      "Structured lifestyle intervention program",
      "Screen adults 35-70 with BMI ≥25",
    ],
    source: "CDC",
  },
  // Opioid Prescribing
  {
    title: "CDC Clinical Practice Guideline for Prescribing Opioids",
    category: "Pain Management",
    year: "2022",
    url: "https://www.cdc.gov/mmwr/volumes/71/rr/rr7103a1.htm",
    summary: "Updated guidelines for prescribing opioids for pain management.",
    recommendations: [
      "Non-opioid therapies preferred for chronic pain",
      "Lowest effective dose when opioids needed",
      "Avoid concurrent benzodiazepines",
      "Offer naloxone to patients at risk",
    ],
    source: "CDC",
  },
  // Infection Control
  {
    title: "CDC Guidelines for Infection Control in Healthcare Settings",
    category: "Infection Control",
    year: "2023",
    url: "https://www.cdc.gov/infectioncontrol/guidelines/index.html",
    summary: "Comprehensive infection prevention and control guidelines.",
    recommendations: [
      "Standard precautions for all patient care",
      "Hand hygiene before and after patient contact",
      "Appropriate PPE based on transmission risk",
      "Environmental cleaning and disinfection",
    ],
    source: "CDC",
  },
  // Travel Health
  {
    title: "CDC Yellow Book - Health Information for International Travel",
    category: "Travel Medicine",
    year: "2026",
    url: "https://wwwnc.cdc.gov/travel/yellowbook/2026/table-of-contents",
    summary: "Comprehensive reference for travel health recommendations.",
    recommendations: [
      "Pre-travel consultation 4-6 weeks before departure",
      "Destination-specific vaccinations",
      "Malaria prophylaxis for endemic areas",
      "Food and water precautions",
    ],
    source: "CDC",
  },
  // HIV Prevention
  {
    title: "CDC PrEP Clinical Practice Guidelines",
    category: "Infectious Diseases",
    year: "2021",
    url: "https://www.cdc.gov/hiv/clinicians/prevention/prep.html",
    summary: "Guidelines for HIV pre-exposure prophylaxis.",
    recommendations: [
      "Daily oral TDF/FTC or TAF/FTC for PrEP",
      "Injectable cabotegravir as alternative",
      "HIV testing before initiation and every 3 months",
      "Renal function monitoring",
    ],
    source: "CDC",
  },
  // Tuberculosis
  {
    title: "CDC Guidelines for Treatment of Latent TB Infection",
    category: "Infectious Diseases",
    year: "2020",
    url: "https://www.cdc.gov/tb/topic/treatment/ltbi.htm",
    summary: "Treatment options for latent tuberculosis infection.",
    recommendations: [
      "3HP (isoniazid + rifapentine weekly x 12 weeks) preferred",
      "4R (rifampin daily x 4 months) alternative",
      "9H (isoniazid daily x 9 months) if rifamycins contraindicated",
      "Monitor for hepatotoxicity",
    ],
    source: "CDC",
  },
];

/**
 * Search CDC guidelines by query
 */
export function searchCDCGuidelines(query: string, limit: number = 5): CDCGuideline[] {
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/).filter((t) => t.length > 2);

  const scored = CDC_GUIDELINES_DATABASE.map((guideline) => {
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
 * Format CDC guidelines for prompt
 */
export function formatCDCGuidelinesForPrompt(guidelines: CDCGuideline[]): string {
  if (guidelines.length === 0) return "";

  let formatted = "## ZONE 22: CDC GUIDELINES (Centers for Disease Control)\n";
  formatted += "**US public health authority recommendations**\n\n";

  guidelines.forEach((guideline, i) => {
    formatted += `${i + 1}. **${guideline.title}** (${guideline.year})\n`;
    formatted += `   SOURCE: CDC | Category: ${guideline.category}\n`;
    formatted += `   Summary: ${guideline.summary}\n`;
    formatted += `   Key Recommendations:\n`;
    guideline.recommendations.forEach((rec) => {
      formatted += `   - ${rec}\n`;
    });
    formatted += `   URL: ${guideline.url}\n\n`;
  });

  return formatted;
}
