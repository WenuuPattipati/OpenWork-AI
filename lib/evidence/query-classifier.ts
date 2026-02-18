/**
 * Query Classifier - Tag-Based Query Classification for Evidence Brain
 * 
 * This module classifies clinical queries based on extracted disease_tags and
 * decision_tags, determining:
 * - Query classification type (e.g., cardiology/anticoagulation, infectious/pneumonia)
 * - Allowed MeSH terms for search expansion
 * - Excluded MeSH terms to prevent off-topic results
 * 
 * The classifier uses tag-based rules instead of raw text pattern matching
 * for more accurate and consistent classification.
 */

// ============================================================================
// TYPES
// ============================================================================

export type QueryClassification =
  | 'cardiology/anticoagulation'
  | 'cardiology/afib_anticoagulation'
  | 'cardiology/heart_failure'
  | 'cardiology/dapt'
  | 'cardiology/lipids'
  | 'infectious/pneumonia'
  | 'infectious/sepsis'
  | 'infectious/pediatric'
  | 'infectious/cdi'
  | 'nephrology/ckd'
  | 'oncology/treatment'
  | 'gastroenterology/ibd'
  | 'pulmonary/asthma'
  | 'endocrinology/diabetes_ckd'
  | 'lifestyle/prevention'
  | 'general';

export interface ClassificationResult {
  classification: QueryClassification;
  allowed_mesh_terms: string[];
  excluded_mesh_terms: string[];
  confidence: number; // 0-1
  matched_rule: string | null;
}

export interface ClassificationRule {
  id: string;
  disease_tags: string[];      // Required disease tags (any match)
  decision_tags: string[];     // Required decision tags (any match)
  classification: QueryClassification;
  allowed_mesh: string[];
  excluded_mesh: string[];
  priority: number;            // Higher priority rules are checked first
}

// ============================================================================
// CLASSIFICATION RULES
// ============================================================================

/**
 * Classification rules ordered by priority (highest first)
 * Rules are matched based on tag overlap
 */
export const CLASSIFICATION_RULES: ClassificationRule[] = [
  // Cardiology - Anticoagulation (highest priority for AF queries)
  {
    id: 'af_anticoagulation',
    disease_tags: ['AF', 'AHRE'],
    decision_tags: ['anticoagulation', 'drug_choice', 'dose', 'restart', 'LAAO'],
    classification: 'cardiology/anticoagulation',
    allowed_mesh: [
      'Atrial Fibrillation',
      'Anticoagulants',
      'Stroke',
      'Hemorrhage',
      'Kidney Failure, Chronic',
      'Renal Insufficiency, Chronic',
      'Warfarin',
      'Factor Xa Inhibitors',
      'Gastrointestinal Hemorrhage',
    ],
    excluded_mesh: [
      'Primary Prevention',
      'Diabetes Mellitus',
      'Exercise',
      'Diet',
      'Obesity',
      'Weight Loss',
      'Smoking Cessation',
      'Hypertension', // Unless specifically about HTN
    ],
    priority: 100,
  },

  // Oncology - NSCLC Targeted Therapy (EGFR, ALK, ROS1)
  {
    id: 'nsclc_targeted_therapy',
    disease_tags: ['LUNG_CANCER', 'EGFR_MUTATION', 'ALK_FUSION', 'ROS1_FUSION', 'CANCER'],
    decision_tags: ['targeted_therapy', 'first_line', 'second_line', 'nsclc_targeted', 'chemotherapy', 'drug_choice', 'immunotherapy'],
    classification: 'oncology/treatment',
    allowed_mesh: [
      'Carcinoma, Non-Small-Cell Lung',
      'Lung Neoplasms',
      'ErbB Receptors',
      'Receptor, ErbB-2',
      'Protein Kinase Inhibitors',
      'Antibodies, Bispecific',
      'Molecular Targeted Therapy',
      'Antineoplastic Combined Chemotherapy Protocols',
      'Drug Resistance, Neoplasm',
      'Mutation',
    ],
    excluded_mesh: [
      'Cardiovascular Diseases',
      'Diabetes Mellitus',
      'Atrial Fibrillation',
      'Heart Failure',
      'Hypertension',
      'Kidney Failure, Chronic',
      'Primary Prevention',
      'Exercise',
      'Diet',
      'Stress, Psychological',
    ],
    priority: 96, // High priority for NSCLC targeted therapy
  },

  // Cardiology - DAPT (Dual Antiplatelet Therapy)
  {
    id: 'dapt_management',
    disease_tags: ['PCI', 'CAD', 'HBR'],
    decision_tags: ['antiplatelet', 'duration', 'de-escalation'],
    classification: 'cardiology/dapt',
    allowed_mesh: [
      'Platelet Aggregation Inhibitors',
      'Coronary Artery Disease',
      'Percutaneous Coronary Intervention',
      'Hemorrhage',
      'Stents',
      'Aspirin',
      'Clopidogrel',
      'Ticagrelor',
    ],
    excluded_mesh: [
      'Primary Prevention',
      'Diabetes Mellitus',
      'Exercise',
      'Diet',
      'Atrial Fibrillation', // Unless overlap
    ],
    priority: 95,
  },

  // Cardiology - Heart Failure
  {
    id: 'heart_failure_management',
    disease_tags: ['HF'],
    decision_tags: ['drug_choice', 'therapy', 'dose'],
    classification: 'cardiology/heart_failure',
    allowed_mesh: [
      'Heart Failure',
      'Ventricular Dysfunction, Left',
      'Sodium-Glucose Transporter 2 Inhibitors',
      'Angiotensin Receptor-Neprilysin Inhibitors',
      'Diuretics',
      'Adrenergic beta-Antagonists',
      'Mineralocorticoid Receptor Antagonists',
    ],
    excluded_mesh: [
      'Primary Prevention',
      'Atrial Fibrillation', // Unless overlap
    ],
    priority: 90,
  },

  // Infectious - Pneumonia/CAP
  {
    id: 'cap_treatment',
    disease_tags: ['CAP'],
    decision_tags: ['drug_choice', 'duration', 'de-escalation', 'therapy'],
    classification: 'infectious/pneumonia',
    allowed_mesh: [
      'Pneumonia',
      'Community-Acquired Infections',
      'Anti-Bacterial Agents',
      'Respiratory Tract Infections',
      'Sepsis',
    ],
    excluded_mesh: [
      'Cardiovascular Diseases',
      'Diabetes Mellitus',
      'Atrial Fibrillation',
      'Heart Failure',
      'Primary Prevention',
    ],
    priority: 85,
  },

  // Infectious - Sepsis
  {
    id: 'sepsis_treatment',
    disease_tags: ['SEPSIS'],
    decision_tags: ['drug_choice', 'duration', 'therapy', 'de-escalation'],
    classification: 'infectious/sepsis',
    allowed_mesh: [
      'Sepsis',
      'Shock, Septic',
      'Anti-Bacterial Agents',
      'Critical Care',
      'Bacteremia',
    ],
    excluded_mesh: [
      'Cardiovascular Diseases',
      'Diabetes Mellitus',
      'Atrial Fibrillation',
      'Primary Prevention',
    ],
    priority: 85,
  },

  // Infectious - C. diff / CDI
  {
    id: 'cdi_treatment',
    disease_tags: ['CDI'],
    decision_tags: ['drug_choice', 'therapy', 'duration', 'first_line'],
    classification: 'infectious/cdi',
    allowed_mesh: [
      'Clostridium Infections',
      'Clostridioides difficile',
      'Anti-Bacterial Agents',
      'Fecal Microbiota Transplantation',
      'Vancomycin',
      'Fidaxomicin',
    ],
    excluded_mesh: [
      'Cardiovascular Diseases',
      'Diabetes Mellitus',
      'Primary Prevention',
    ],
    priority: 88,
  },

  // Cardiology - AFib Anticoagulation (DOACs)
  {
    id: 'afib_anticoagulation',
    disease_tags: ['AF', 'CKD'],
    decision_tags: ['anticoagulation', 'drug_choice', 'dose'],
    classification: 'cardiology/afib_anticoagulation',
    allowed_mesh: [
      'Atrial Fibrillation',
      'Anticoagulants',
      'Factor Xa Inhibitors',
      'Stroke',
      'Kidney Failure, Chronic',
      'Hemorrhage',
      'Rivaroxaban',
      'Apixaban',
    ],
    excluded_mesh: [
      'Primary Prevention',
      'Exercise',
      'Diet',
    ],
    priority: 92,
  },

  // Gastroenterology - IBD Biologics
  {
    id: 'ibd_biologics',
    disease_tags: ['IBD', 'ULCERATIVE_COLITIS', 'CROHNS'],
    decision_tags: ['biologic_therapy', 'ibd_biologics', 'drug_choice', 'therapy'],
    classification: 'gastroenterology/ibd',
    allowed_mesh: [
      'Inflammatory Bowel Diseases',
      'Colitis, Ulcerative',
      'Crohn Disease',
      'Biological Products',
      'Ustekinumab',
      'Vedolizumab',
      'Infliximab',
      'Adalimumab',
    ],
    excluded_mesh: [
      'Cardiovascular Diseases',
      'Primary Prevention',
    ],
    priority: 88,
  },

  // Pulmonary - Severe Asthma Biologics
  {
    id: 'asthma_biologics',
    disease_tags: ['ASTHMA', 'EOSINOPHILIC'],
    decision_tags: ['asthma_biologics', 'biologic_therapy', 'drug_choice'],
    classification: 'pulmonary/asthma',
    allowed_mesh: [
      'Asthma',
      'Eosinophilia',
      'Antibodies, Monoclonal',
      'Biological Products',
      'Interleukin-5',
      'Receptors, Interleukin-4',
      'Thymic Stromal Lymphopoietin',
    ],
    excluded_mesh: [
      'Cardiovascular Diseases',
      'Primary Prevention',
    ],
    priority: 88,
  },

  // Endocrinology - Diabetes with ASCVD/CKD (SGLT2i/GLP-1)
  {
    id: 'diabetes_cardiorenal',
    disease_tags: ['DIABETES', 'CKD', 'CAD', 'HF'],
    decision_tags: ['sglt2_glp1', 'ascvd_ckd', 'drug_choice', 'therapy'],
    classification: 'endocrinology/diabetes_ckd',
    allowed_mesh: [
      'Diabetes Mellitus, Type 2',
      'Sodium-Glucose Transporter 2 Inhibitors',
      'Glucagon-Like Peptide-1 Receptor Agonists',
      'Diabetic Nephropathies',
      'Kidney Failure, Chronic',
      'Cardiovascular Diseases',
      'Heart Failure',
    ],
    excluded_mesh: [
      'Primary Prevention',
      'Exercise',
    ],
    priority: 90,
  },

  // Infectious - Pediatric (Varicella, Measles, etc.)
  {
    id: 'pediatric_infectious',
    disease_tags: ['VARICELLA', 'CHICKENPOX', 'MEASLES', 'MUMPS', 'RUBELLA', 'PERTUSSIS', 'RSV', 'CROUP', 'HAND_FOOT_MOUTH', 'SCARLET_FEVER', 'FIFTH_DISEASE', 'ROSEOLA'],
    decision_tags: ['antiviral', 'symptom_control', 'isolation', 'return_to_school', 'therapy', 'drug_choice'],
    classification: 'infectious/pediatric',
    allowed_mesh: [
      'Chickenpox',
      'Herpesvirus 3, Human',
      'Varicella Zoster Virus Infection',
      'Antiviral Agents',
      'Acyclovir',
      'Measles',
      'Mumps',
      'Rubella',
      'Whooping Cough',
      'Respiratory Syncytial Virus Infections',
      'Croup',
      'Hand, Foot and Mouth Disease',
      'Scarlet Fever',
      'Erythema Infectiosum',
      'Exanthema Subitum',
      'Pediatrics',
      'Child',
      'Communicable Disease Control',
      'Quarantine',
      'Schools',
    ],
    excluded_mesh: [
      'Cardiovascular Diseases',
      'Diabetes Mellitus',
      'Atrial Fibrillation',
      'Heart Failure',
      'Coronary Artery Disease',
      'Hypertension',
      'Kidney Failure, Chronic',
      'Neoplasms',
      'Primary Prevention',
    ],
    priority: 95, // High priority for pediatric infectious
  },

  // Neuro-Oncology - Brain Tumor with Seizures
  {
    id: 'neuro_oncology_seizure',
    disease_tags: ['BRAIN_TUMOR', 'GLIOMA', 'MENINGIOMA', 'SEIZURE', 'BRAIN_LESION'],
    decision_tags: ['diagnosis', 'surgery', 'monitoring', 'therapy', 'drug_choice'],
    classification: 'oncology/treatment',
    allowed_mesh: [
      'Brain Neoplasms',
      'Glioma',
      'Meningioma',
      'Seizures',
      'Epilepsy',
      'Magnetic Resonance Imaging',
      'Neurosurgical Procedures',
      'Anticonvulsants',
      'Adult',
    ],
    excluded_mesh: [
      'Infant, Newborn',
      'Child',
      'Adolescent',
      'Pediatrics',
      'Neonatal',
      'Cardiovascular Diseases',
      'Diabetes Mellitus',
      'Primary Prevention',
    ],
    priority: 90, // High priority for neuro-oncology
  },

  // Nephrology - Hyperkalemia Management (KDIGO/RAAS)
  {
    id: 'hyperkalemia_management',
    disease_tags: ['CKD', 'HYPERKALEMIA'],
    decision_tags: ['drug_choice', 'therapy', 'monitoring', 'dose'],
    classification: 'nephrology/ckd',
    allowed_mesh: [
      'Hyperkalemia',
      'Potassium',
      'Renal Insufficiency, Chronic',
      'Kidney Failure, Chronic',
      'Angiotensin-Converting Enzyme Inhibitors',
      'Angiotensin Receptor Antagonists',
      'Renin-Angiotensin System',
      'Sodium-Glucose Transporter 2 Inhibitors',
      'Mineralocorticoid Receptor Antagonists',
      'Potassium Binders',
      'Practice Guidelines',
      'KDIGO',
    ],
    excluded_mesh: [
      'Primary Prevention',
      'Exercise',
      'Diet',
      'Cardiovascular Diseases', // Unless specifically about CV
      'Atrial Fibrillation',
      'Diabetes Mellitus', // Unless specifically about diabetes
    ],
    priority: 95, // High priority for hyperkalemia
  },

  // Nephrology - CKD Management (General)
  {
    id: 'ckd_management',
    disease_tags: ['CKD'],
    decision_tags: ['drug_choice', 'therapy', 'monitoring'],
    classification: 'nephrology/ckd',
    allowed_mesh: [
      'Renal Insufficiency, Chronic',
      'Kidney Failure, Chronic',
      'Glomerular Filtration Rate',
      'Proteinuria',
      'Sodium-Glucose Transporter 2 Inhibitors',
      'Angiotensin-Converting Enzyme Inhibitors',
      'Angiotensin Receptor Antagonists',
      'Renin-Angiotensin System',
    ],
    excluded_mesh: [
      'Primary Prevention',
      'Exercise',
      'Diet',
    ],
    priority: 80,
  },

  // Cardiology - Lipids
  {
    id: 'lipid_management',
    disease_tags: ['CAD'],
    decision_tags: ['drug_choice', 'therapy'],
    classification: 'cardiology/lipids',
    allowed_mesh: [
      'Hydroxymethylglutaryl-CoA Reductase Inhibitors',
      'Cholesterol, LDL',
      'Dyslipidemias',
      'Cardiovascular Diseases',
      'PCSK9 Inhibitors',
      'Ezetimibe',
    ],
    excluded_mesh: [
      'Primary Prevention', // Unless specifically about primary prevention
    ],
    priority: 75,
  },

  // Lifestyle/Prevention (lowest priority - only if no other match)
  {
    id: 'lifestyle_prevention',
    disease_tags: ['DIABETES', 'HTN'],
    decision_tags: ['therapy', 'monitoring'],
    classification: 'lifestyle/prevention',
    allowed_mesh: [
      'Primary Prevention',
      'Exercise',
      'Diet',
      'Weight Loss',
      'Smoking Cessation',
      'Life Style',
      'Health Behavior',
    ],
    excluded_mesh: [],
    priority: 10,
  },
];

// ============================================================================
// CLASSIFICATION FUNCTIONS
// ============================================================================

/**
 * Check if two arrays have any overlap
 */
function hasOverlap(arr1: string[], arr2: string[]): boolean {
  return arr1.some(item => arr2.includes(item));
}

/**
 * Count the number of overlapping items between two arrays
 */
function countOverlap(arr1: string[], arr2: string[]): number {
  return arr1.filter(item => arr2.includes(item)).length;
}

/**
 * Classify a query based on extracted disease_tags and decision_tags
 * 
 * @param disease_tags - Extracted disease tags from the query
 * @param decision_tags - Extracted decision tags from the query
 * @returns Classification result with allowed/excluded MeSH terms
 */
export function classifyQuery(
  disease_tags: string[],
  decision_tags: string[]
): ClassificationResult {
  // Sort rules by priority (highest first)
  const sortedRules = [...CLASSIFICATION_RULES].sort((a, b) => b.priority - a.priority);

  let bestMatch: ClassificationRule | null = null;
  let bestScore = 0;

  for (const rule of sortedRules) {
    // Check if disease tags match
    const diseaseMatch = hasOverlap(disease_tags, rule.disease_tags);

    // Check if decision tags match
    const decisionMatch = hasOverlap(decision_tags, rule.decision_tags);

    // Both must match for a valid classification
    if (diseaseMatch && decisionMatch) {
      // Calculate match score based on overlap count
      const diseaseOverlap = countOverlap(disease_tags, rule.disease_tags);
      const decisionOverlap = countOverlap(decision_tags, rule.decision_tags);
      const score = (diseaseOverlap + decisionOverlap) * rule.priority;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = rule;
      }
    }
  }

  // If no match found, return general classification
  if (!bestMatch) {
    return {
      classification: 'general',
      allowed_mesh_terms: [],
      excluded_mesh_terms: [],
      confidence: 0,
      matched_rule: null,
    };
  }

  // Calculate confidence based on match quality
  const maxPossibleScore = (bestMatch.disease_tags.length + bestMatch.decision_tags.length) * bestMatch.priority;
  const confidence = Math.min(bestScore / maxPossibleScore, 1);

  return {
    classification: bestMatch.classification,
    allowed_mesh_terms: bestMatch.allowed_mesh,
    excluded_mesh_terms: bestMatch.excluded_mesh,
    confidence,
    matched_rule: bestMatch.id,
  };
}

/**
 * Check if a classification is a cardiology/anticoagulation type
 * Used to determine if lifestyle MeSH terms should be excluded
 */
export function isAnticoagulationQuery(classification: QueryClassification): boolean {
  return classification === 'cardiology/anticoagulation';
}

/**
 * Check if a classification is a treatment/management type (not lifestyle)
 * Used to determine image selection rules
 */
export function isTreatmentQuery(classification: QueryClassification): boolean {
  return classification !== 'lifestyle/prevention' && classification !== 'general';
}

/**
 * Get MeSH terms to add based on disease tags
 * Adds specific MeSH terms for comorbidities like CKD
 */
export function getAdditionalMeSHForTags(disease_tags: string[]): string[] {
  const additionalMeSH: string[] = [];

  if (disease_tags.includes('CKD')) {
    additionalMeSH.push('Renal Insufficiency, Chronic');
    additionalMeSH.push('Kidney Failure, Chronic');
  }

  if (disease_tags.includes('GI_BLEED')) {
    additionalMeSH.push('Gastrointestinal Hemorrhage');
  }

  if (disease_tags.includes('HBR')) {
    additionalMeSH.push('Hemorrhage');
  }

  return additionalMeSH;
}

/**
 * Filter MeSH terms based on classification
 * Removes excluded terms and adds allowed terms
 */
export function filterMeSHTerms(
  originalTerms: string[],
  classification: ClassificationResult
): string[] {
  // Remove excluded terms
  const filtered = originalTerms.filter(
    term => !classification.excluded_mesh_terms.includes(term)
  );

  // Add allowed terms that aren't already present
  const toAdd = classification.allowed_mesh_terms.filter(
    term => !filtered.includes(term)
  );

  return [...filtered, ...toAdd];
}
