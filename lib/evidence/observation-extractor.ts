/**
 * Medical Observation Extractor - Clinical Context Awareness for Evidence Brain
 * 
 * This module extracts structured medical observations (vitals, labs, imaging, exam findings)
 * from clinical queries to add urgency awareness and improve evidence relevance.
 * 
 * WHY THIS EXISTS:
 * - System treats "hyperkalemia" (concept) same as "K+ 6.2 mmol/L" (urgent observation)
 * - No red-flag detection means severe cases get same treatment as mild queries
 * - Relevance scoring doesn't boost papers mentioning specific thresholds
 * - No urgency-based sufficiency threshold adjustment
 * 
 * WHAT IT DOES:
 * - Extracts vitals (BP, HR, RR, Temp, SpO2)
 * - Extracts labs (electrolytes, renal function, cardiac markers, etc.)
 * - Extracts imaging findings (CXR, CT, MRI descriptions)
 * - Extracts exam findings (physical exam, ECG changes)
 * - Detects red flags and assigns urgency level
 * - Validates values against normal ranges
 * 
 * INTEGRATION POINT:
 * - Called after abbreviation expansion (Step 2)
 * - Before query clarification (Step 2.5)
 * - Output attached to ClarifiedQuery
 */

// ============================================================================
// INTERFACES
// ============================================================================

export interface VitalSign {
  type: 'BP' | 'HR' | 'RR' | 'Temp' | 'SpO2' | 'Weight' | 'Height' | 'BMI';
  value: string;                      // e.g., "90/50", "120", "38.5"
  unit: string;                       // e.g., "mmHg", "bpm", "°C", "%"
  severity: 'normal' | 'abnormal' | 'critical';
  raw_text: string;                   // Original text from query
}

export interface LabResult {
  test: string;                       // e.g., "K+", "Cr", "BNP", "Troponin"
  value: string;                      // e.g., "6.2", "2.1", "450"
  unit: string;                       // e.g., "mmol/L", "mg/dL", "pg/mL"
  severity: 'normal' | 'abnormal' | 'critical';
  raw_text: string;                   // Original text from query
}

export interface ImagingFinding {
  modality: 'CXR' | 'CT' | 'MRI' | 'US' | 'Echo' | 'Other';
  finding: string;                    // e.g., "bilateral infiltrates", "no acute findings"
  severity: 'normal' | 'abnormal' | 'critical';
  raw_text: string;                   // Original text from query
}

export interface ExamFinding {
  category: 'general' | 'cardiovascular' | 'respiratory' | 'neurological' | 'other';
  finding: string;                    // e.g., "confusion", "Kussmaul breathing", "peaked T waves"
  severity: 'normal' | 'abnormal' | 'critical';
  raw_text: string;                   // Original text from query
}

export interface MedicalObservationSummary {
  has_observations: boolean;
  vitals: VitalSign[];
  labs: LabResult[];
  imaging: ImagingFinding[];
  exam_findings: ExamFinding[];
  red_flags: string[];                // Derived critical findings
  urgency_level: 'routine' | 'urgent' | 'emergent';
  confidence: number;                 // 0-1: extraction confidence
}

// ============================================================================
// NORMAL RANGES & THRESHOLDS
// ============================================================================

/**
 * Normal ranges for common lab tests
 * Used to determine severity (normal/abnormal/critical)
 */
const LAB_NORMAL_RANGES: Record<string, { min: number; max: number; critical_low?: number; critical_high?: number; unit: string }> = {
  // Electrolytes
  'K+': { min: 3.5, max: 5.0, critical_low: 2.5, critical_high: 6.0, unit: 'mmol/L' },
  'potassium': { min: 3.5, max: 5.0, critical_low: 2.5, critical_high: 6.0, unit: 'mmol/L' },
  'Na+': { min: 135, max: 145, critical_low: 120, critical_high: 160, unit: 'mmol/L' },
  'sodium': { min: 135, max: 145, critical_low: 120, critical_high: 160, unit: 'mmol/L' },
  'Ca2+': { min: 8.5, max: 10.5, critical_low: 7.0, critical_high: 12.0, unit: 'mg/dL' },
  'calcium': { min: 8.5, max: 10.5, critical_low: 7.0, critical_high: 12.0, unit: 'mg/dL' },
  
  // Renal Function
  'Cr': { min: 0.6, max: 1.2, critical_high: 3.0, unit: 'mg/dL' },
  'creatinine': { min: 0.6, max: 1.2, critical_high: 3.0, unit: 'mg/dL' },
  'BUN': { min: 7, max: 20, critical_high: 50, unit: 'mg/dL' },
  'eGFR': { min: 60, max: 120, critical_low: 15, unit: 'mL/min/1.73m²' },
  
  // Cardiac Markers
  'BNP': { min: 0, max: 100, critical_high: 400, unit: 'pg/mL' },
  'NT-proBNP': { min: 0, max: 125, critical_high: 450, unit: 'pg/mL' },
  'troponin': { min: 0, max: 0.04, critical_high: 0.4, unit: 'ng/mL' },
  
  // Hematology
  'Hgb': { min: 12, max: 16, critical_low: 7, unit: 'g/dL' },
  'hemoglobin': { min: 12, max: 16, critical_low: 7, unit: 'g/dL' },
  'WBC': { min: 4, max: 11, critical_low: 1, critical_high: 30, unit: 'K/μL' },
  'platelets': { min: 150, max: 400, critical_low: 20, unit: 'K/μL' },
  
  // Glucose
  'glucose': { min: 70, max: 100, critical_low: 40, critical_high: 400, unit: 'mg/dL' },
  'HbA1c': { min: 4, max: 5.6, critical_high: 9, unit: '%' },
};

/**
 * Normal ranges for vital signs
 */
const VITAL_NORMAL_RANGES: Record<string, { min: number; max: number; critical_low?: number; critical_high?: number; unit: string }> = {
  'HR': { min: 60, max: 100, critical_low: 40, critical_high: 150, unit: 'bpm' },
  'RR': { min: 12, max: 20, critical_low: 8, critical_high: 30, unit: '/min' },
  'Temp': { min: 36.5, max: 37.5, critical_low: 35, critical_high: 40, unit: '°C' },
  'SpO2': { min: 95, max: 100, critical_low: 88, unit: '%' },
  'SBP': { min: 90, max: 140, critical_low: 70, critical_high: 180, unit: 'mmHg' },
  'DBP': { min: 60, max: 90, critical_low: 40, critical_high: 110, unit: 'mmHg' },
};

/**
 * Red flag keywords that indicate emergent situations
 */
const RED_FLAG_KEYWORDS = [
  // Cardiovascular
  'chest pain', 'crushing chest pain', 'stemi', 'cardiac arrest', 'vfib', 'ventricular fibrillation',
  'cardiogenic shock', 'hemodynamic instability', 'hypotension', 'syncope',
  
  // Respiratory
  'respiratory distress', 'respiratory failure', 'unable to speak', 'cyanosis', 'stridor',
  'severe dyspnea', 'acute respiratory distress',
  
  // Neurological
  'altered mental status', 'confusion', 'unresponsive', 'seizure', 'stroke symptoms',
  'focal neurological deficit', 'sudden weakness', 'sudden vision loss',
  
  // Metabolic
  'severe hyperkalemia', 'k+ >6', 'k+ > 6', 'potassium >6', 'potassium > 6',
  'severe hypoglycemia', 'glucose <40', 'glucose < 40',
  'dka', 'diabetic ketoacidosis', 'hhs', 'hyperosmolar',
  
  // Infectious
  'septic shock', 'severe sepsis', 'sepsis', 'febrile neutropenia',
  
  // ECG Changes
  'peaked t waves', 'widened qrs', 'sine wave', 'st elevation', 'stemi',
  'complete heart block', 'third degree block',
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Deduplicate vitals based on type and value
 */
function deduplicateVitals(vitals: VitalSign[]): VitalSign[] {
  const seen = new Set<string>();
  const deduplicated: VitalSign[] = [];
  
  for (const vital of vitals) {
    const key = `${vital.type}-${vital.value}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(vital);
    }
  }
  
  return deduplicated;
}

/**
 * Deduplicate labs based on test and value
 */
function deduplicateLabs(labs: LabResult[]): LabResult[] {
  const seen = new Set<string>();
  const deduplicated: LabResult[] = [];
  
  for (const lab of labs) {
    const key = `${lab.test}-${lab.value}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(lab);
    }
  }
  
  return deduplicated;
}

/**
 * Deduplicate imaging based on modality and finding
 */
function deduplicateImaging(imaging: ImagingFinding[]): ImagingFinding[] {
  const seen = new Set<string>();
  const deduplicated: ImagingFinding[] = [];
  
  for (const img of imaging) {
    const key = `${img.modality}-${img.finding}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(img);
    }
  }
  
  return deduplicated;
}

/**
 * Deduplicate exam findings based on category and finding
 */
function deduplicateExamFindings(findings: ExamFinding[]): ExamFinding[] {
  const seen = new Set<string>();
  const deduplicated: ExamFinding[] = [];
  
  for (const finding of findings) {
    const key = `${finding.category}-${finding.finding}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(finding);
    }
  }
  
  return deduplicated;
}

// ============================================================================
// EXTRACTION FUNCTIONS
// ============================================================================

/**
 * Extract medical observations from a clinical query
 * 
 * @param query - Raw user query
 * @param expandedQuery - Query with abbreviations expanded
 * @returns Medical observation summary
 */
export function extractMedicalObservations(
  query: string,
  expandedQuery: string
): MedicalObservationSummary {
  console.log('🔬 Medical Observation Extraction: Starting...');
  
  // Extract from both queries but deduplicate
  const vitals = deduplicateVitals(extractVitals(query, expandedQuery));
  const labs = deduplicateLabs(extractLabs(query, expandedQuery));
  const imaging = deduplicateImaging(extractImaging(query, expandedQuery));
  const exam_findings = deduplicateExamFindings(extractExamFindings(query, expandedQuery));
  
  const has_observations = 
    vitals.length > 0 || 
    labs.length > 0 || 
    imaging.length > 0 || 
    exam_findings.length > 0;
  
  // Detect red flags
  const red_flags = detectRedFlags(query, expandedQuery, vitals, labs, exam_findings);
  
  // Determine urgency level
  const urgency_level = determineUrgency(vitals, labs, exam_findings, red_flags);
  
  // Calculate confidence (higher if specific values found)
  const confidence = has_observations ? 0.8 : 0.5;
  
  const summary: MedicalObservationSummary = {
    has_observations,
    vitals,
    labs,
    imaging,
    exam_findings,
    red_flags,
    urgency_level,
    confidence,
  };
  
  if (has_observations) {
    console.log('✅ Medical Observations Extracted:');
    console.log(`   Vitals: ${vitals.length}`);
    console.log(`   Labs: ${labs.length}`);
    console.log(`   Imaging: ${imaging.length}`);
    console.log(`   Exam findings: ${exam_findings.length}`);
    console.log(`   Red flags: ${red_flags.length}`);
    console.log(`   Urgency: ${urgency_level}`);
    
    if (red_flags.length > 0) {
      console.log(`   ⚠️  RED FLAGS: ${red_flags.join('; ')}`);
    }
  } else {
    console.log('ℹ️  No specific medical observations found in query');
  }
  
  return summary;
}

/**
 * Extract vital signs from query
 */
function extractVitals(query: string, expandedQuery: string): VitalSign[] {
  const vitals: VitalSign[] = [];
  const text = `${query} ${expandedQuery}`.toLowerCase();
  
  // Blood Pressure: "BP 90/50", "blood pressure 120/80"
  const bpPattern = /(?:bp|blood pressure)[:\s]+(\d{2,3})\/(\d{2,3})/gi;
  let match;
  while ((match = bpPattern.exec(text)) !== null) {
    const sbp = parseInt(match[1]);
    const dbp = parseInt(match[2]);
    const value = `${sbp}/${dbp}`;
    
    let severity: 'normal' | 'abnormal' | 'critical' = 'normal';
    if (sbp < VITAL_NORMAL_RANGES.SBP.critical_low! || sbp > VITAL_NORMAL_RANGES.SBP.critical_high! ||
        dbp < VITAL_NORMAL_RANGES.DBP.critical_low! || dbp > VITAL_NORMAL_RANGES.DBP.critical_high!) {
      severity = 'critical';
    } else if (sbp < VITAL_NORMAL_RANGES.SBP.min || sbp > VITAL_NORMAL_RANGES.SBP.max ||
               dbp < VITAL_NORMAL_RANGES.DBP.min || dbp > VITAL_NORMAL_RANGES.DBP.max) {
      severity = 'abnormal';
    }
    
    vitals.push({
      type: 'BP',
      value,
      unit: 'mmHg',
      severity,
      raw_text: match[0],
    });
  }
  
  // Heart Rate: "HR 120", "heart rate 65 bpm"
  const hrPattern = /(?:hr|heart rate)[:\s]+(\d{2,3})(?:\s*bpm)?/gi;
  while ((match = hrPattern.exec(text)) !== null) {
    const hr = parseInt(match[1]);
    let severity: 'normal' | 'abnormal' | 'critical' = 'normal';
    
    if (hr < VITAL_NORMAL_RANGES.HR.critical_low! || hr > VITAL_NORMAL_RANGES.HR.critical_high!) {
      severity = 'critical';
    } else if (hr < VITAL_NORMAL_RANGES.HR.min || hr > VITAL_NORMAL_RANGES.HR.max) {
      severity = 'abnormal';
    }
    
    vitals.push({
      type: 'HR',
      value: hr.toString(),
      unit: 'bpm',
      severity,
      raw_text: match[0],
    });
  }
  
  // Temperature: "Temp 38.5", "temperature 39°C"
  const tempPattern = /(?:temp|temperature)[:\s]+(\d{2,3}(?:\.\d)?)\s*(?:°?c|celsius)?/gi;
  while ((match = tempPattern.exec(text)) !== null) {
    const temp = parseFloat(match[1]);
    let severity: 'normal' | 'abnormal' | 'critical' = 'normal';
    
    if (temp < VITAL_NORMAL_RANGES.Temp.critical_low! || temp > VITAL_NORMAL_RANGES.Temp.critical_high!) {
      severity = 'critical';
    } else if (temp < VITAL_NORMAL_RANGES.Temp.min || temp > VITAL_NORMAL_RANGES.Temp.max) {
      severity = 'abnormal';
    }
    
    vitals.push({
      type: 'Temp',
      value: temp.toString(),
      unit: '°C',
      severity,
      raw_text: match[0],
    });
  }
  
  // SpO2: "SpO2 88%", "oxygen saturation 92"
  const spo2Pattern = /(?:spo2|oxygen saturation|o2 sat)[:\s]+(\d{2,3})\s*%?/gi;
  while ((match = spo2Pattern.exec(text)) !== null) {
    const spo2 = parseInt(match[1]);
    let severity: 'normal' | 'abnormal' | 'critical' = 'normal';
    
    if (spo2 < VITAL_NORMAL_RANGES.SpO2.critical_low!) {
      severity = 'critical';
    } else if (spo2 < VITAL_NORMAL_RANGES.SpO2.min) {
      severity = 'abnormal';
    }
    
    vitals.push({
      type: 'SpO2',
      value: spo2.toString(),
      unit: '%',
      severity,
      raw_text: match[0],
    });
  }
  
  return vitals;
}

/**
 * Extract lab results from query
 */
function extractLabs(query: string, expandedQuery: string): LabResult[] {
  const labs: LabResult[] = [];
  const text = `${query} ${expandedQuery}`.toLowerCase();
  
  // Potassium: "K+ 6.2", "potassium 5.8 mmol/L"
  const kPattern = /(?:k\+|potassium)[:\s]+(\d+\.?\d*)\s*(?:mmol\/l)?/gi;
  let match;
  while ((match = kPattern.exec(text)) !== null) {
    const value = parseFloat(match[1]);
    const range = LAB_NORMAL_RANGES['K+'];
    let severity: 'normal' | 'abnormal' | 'critical' = 'normal';
    
    if (value < range.critical_low! || value > range.critical_high!) {
      severity = 'critical';
    } else if (value < range.min || value > range.max) {
      severity = 'abnormal';
    }
    
    labs.push({
      test: 'K+',
      value: value.toString(),
      unit: 'mmol/L',
      severity,
      raw_text: match[0],
    });
  }
  
  // Creatinine: "Cr 2.1", "creatinine 1.8 mg/dL"
  const crPattern = /(?:cr|creatinine)[:\s]+(\d+\.?\d*)\s*(?:mg\/dl)?/gi;
  while ((match = crPattern.exec(text)) !== null) {
    const value = parseFloat(match[1]);
    const range = LAB_NORMAL_RANGES['Cr'];
    let severity: 'normal' | 'abnormal' | 'critical' = 'normal';
    
    if (range.critical_high && value > range.critical_high) {
      severity = 'critical';
    } else if (value < range.min || value > range.max) {
      severity = 'abnormal';
    }
    
    labs.push({
      test: 'Cr',
      value: value.toString(),
      unit: 'mg/dL',
      severity,
      raw_text: match[0],
    });
  }
  
  // eGFR: "eGFR 25", "egfr 15 mL/min"
  const egfrPattern = /(?:egfr)[:\s]+(\d+)\s*(?:ml\/min)?/gi;
  while ((match = egfrPattern.exec(text)) !== null) {
    const value = parseInt(match[1]);
    const range = LAB_NORMAL_RANGES['eGFR'];
    let severity: 'normal' | 'abnormal' | 'critical' = 'normal';
    
    if (value < range.critical_low!) {
      severity = 'critical';
    } else if (value < range.min) {
      severity = 'abnormal';
    }
    
    labs.push({
      test: 'eGFR',
      value: value.toString(),
      unit: 'mL/min/1.73m²',
      severity,
      raw_text: match[0],
    });
  }
  
  // BNP: "BNP 450", "bnp 850 pg/mL"
  const bnpPattern = /(?:bnp)[:\s]+(\d+)\s*(?:pg\/ml)?/gi;
  while ((match = bnpPattern.exec(text)) !== null) {
    const value = parseInt(match[1]);
    const range = LAB_NORMAL_RANGES['BNP'];
    let severity: 'normal' | 'abnormal' | 'critical' = 'normal';
    
    if (value > range.critical_high!) {
      severity = 'critical';
    } else if (value > range.max) {
      severity = 'abnormal';
    }
    
    labs.push({
      test: 'BNP',
      value: value.toString(),
      unit: 'pg/mL',
      severity,
      raw_text: match[0],
    });
  }
  
  // Troponin: "troponin 0.5", "trop 1.2 ng/mL"
  const tropPattern = /(?:troponin|trop)[:\s]+(\d+\.?\d*)\s*(?:ng\/ml)?/gi;
  while ((match = tropPattern.exec(text)) !== null) {
    const value = parseFloat(match[1]);
    const range = LAB_NORMAL_RANGES['troponin'];
    let severity: 'normal' | 'abnormal' | 'critical' = 'normal';
    
    if (value > range.critical_high!) {
      severity = 'critical';
    } else if (value > range.max) {
      severity = 'abnormal';
    }
    
    labs.push({
      test: 'troponin',
      value: value.toString(),
      unit: 'ng/mL',
      severity,
      raw_text: match[0],
    });
  }
  
  return labs;
}

/**
 * Extract imaging findings from query
 */
function extractImaging(query: string, expandedQuery: string): ImagingFinding[] {
  const findings: ImagingFinding[] = [];
  const text = `${query} ${expandedQuery}`.toLowerCase();
  
  // CXR findings
  const cxrPattern = /(?:cxr|chest x-?ray)[:\s]+([^.;]+)/gi;
  let match;
  while ((match = cxrPattern.exec(text)) !== null) {
    const finding = match[1].trim();
    const severity = finding.includes('no acute') || finding.includes('normal') ? 'normal' : 'abnormal';
    
    findings.push({
      modality: 'CXR',
      finding,
      severity,
      raw_text: match[0],
    });
  }
  
  // CT findings
  const ctPattern = /(?:ct|computed tomography)[:\s]+([^.;]+)/gi;
  while ((match = ctPattern.exec(text)) !== null) {
    const finding = match[1].trim();
    const severity = finding.includes('no acute') || finding.includes('normal') ? 'normal' : 'abnormal';
    
    findings.push({
      modality: 'CT',
      finding,
      severity,
      raw_text: match[0],
    });
  }
  
  // Echo findings
  const echoPattern = /(?:echo|echocardiogram)[:\s]+([^.;]+)/gi;
  while ((match = echoPattern.exec(text)) !== null) {
    const finding = match[1].trim();
    const severity = finding.includes('normal') ? 'normal' : 'abnormal';
    
    findings.push({
      modality: 'Echo',
      finding,
      severity,
      raw_text: match[0],
    });
  }
  
  return findings;
}

/**
 * Extract exam findings from query
 */
function extractExamFindings(query: string, expandedQuery: string): ExamFinding[] {
  const findings: ExamFinding[] = [];
  const text = `${query} ${expandedQuery}`.toLowerCase();
  
  // Neurological findings
  const neuroKeywords = ['confusion', 'altered mental status', 'unresponsive', 'seizure', 'focal deficit', 'weakness'];
  for (const keyword of neuroKeywords) {
    if (text.includes(keyword)) {
      findings.push({
        category: 'neurological',
        finding: keyword,
        severity: 'critical',
        raw_text: keyword,
      });
    }
  }
  
  // Respiratory findings
  const respKeywords = ['dyspnea', 'respiratory distress', 'kussmaul breathing', 'stridor', 'wheezing'];
  for (const keyword of respKeywords) {
    if (text.includes(keyword)) {
      findings.push({
        category: 'respiratory',
        finding: keyword,
        severity: keyword.includes('distress') ? 'critical' : 'abnormal',
        raw_text: keyword,
      });
    }
  }
  
  // Cardiovascular findings
  const cvKeywords = ['chest pain', 'palpitations', 'syncope', 'edema'];
  for (const keyword of cvKeywords) {
    if (text.includes(keyword)) {
      findings.push({
        category: 'cardiovascular',
        finding: keyword,
        severity: keyword.includes('chest pain') || keyword.includes('syncope') ? 'critical' : 'abnormal',
        raw_text: keyword,
      });
    }
  }
  
  // ECG findings
  const ecgKeywords = ['peaked t waves', 'widened qrs', 'st elevation', 'stemi', 'complete heart block'];
  for (const keyword of ecgKeywords) {
    if (text.includes(keyword)) {
      findings.push({
        category: 'cardiovascular',
        finding: keyword,
        severity: 'critical',
        raw_text: keyword,
      });
    }
  }
  
  return findings;
}

/**
 * Detect red flags from observations
 */
function detectRedFlags(
  query: string,
  expandedQuery: string,
  vitals: VitalSign[],
  labs: LabResult[],
  exam_findings: ExamFinding[]
): string[] {
  const red_flags: string[] = [];
  const text = `${query} ${expandedQuery}`.toLowerCase();
  
  // Check for red flag keywords
  for (const keyword of RED_FLAG_KEYWORDS) {
    if (text.includes(keyword.toLowerCase())) {
      red_flags.push(keyword);
    }
  }
  
  // Check critical vitals
  for (const vital of vitals) {
    if (vital.severity === 'critical') {
      red_flags.push(`Critical ${vital.type}: ${vital.value} ${vital.unit}`);
    }
  }
  
  // Check critical labs
  for (const lab of labs) {
    if (lab.severity === 'critical') {
      red_flags.push(`Critical ${lab.test}: ${lab.value} ${lab.unit}`);
    }
  }
  
  // Check critical exam findings
  for (const finding of exam_findings) {
    if (finding.severity === 'critical') {
      red_flags.push(`Critical finding: ${finding.finding}`);
    }
  }
  
  return [...new Set(red_flags)]; // Remove duplicates
}

/**
 * Determine urgency level based on observations
 */
function determineUrgency(
  vitals: VitalSign[],
  labs: LabResult[],
  exam_findings: ExamFinding[],
  red_flags: string[]
): 'routine' | 'urgent' | 'emergent' {
  // Emergent: Any critical findings or red flags
  if (red_flags.length > 0) {
    return 'emergent';
  }
  
  const hasCritical = 
    vitals.some(v => v.severity === 'critical') ||
    labs.some(l => l.severity === 'critical') ||
    exam_findings.some(e => e.severity === 'critical');
  
  if (hasCritical) {
    return 'emergent';
  }
  
  // Urgent: Multiple abnormal findings
  const abnormalCount = 
    vitals.filter(v => v.severity === 'abnormal').length +
    labs.filter(l => l.severity === 'abnormal').length +
    exam_findings.filter(e => e.severity === 'abnormal').length;
  
  if (abnormalCount >= 2) {
    return 'urgent';
  }
  
  // Routine: No or single abnormal finding
  return 'routine';
}

/**
 * Quick check if query contains medical observations
 * Used for fast path optimization
 */
export function hasObservations(query: string): boolean {
  const text = query.toLowerCase();
  
  // Check for vital sign patterns
  if (/(?:bp|blood pressure)[:\s]+\d{2,3}\/\d{2,3}/.test(text)) return true;
  if (/(?:hr|heart rate)[:\s]+\d{2,3}/.test(text)) return true;
  if (/(?:temp|temperature)[:\s]+\d{2,3}/.test(text)) return true;
  
  // Check for lab patterns
  if (/(?:k\+|potassium)[:\s]+\d+\.?\d*/.test(text)) return true;
  if (/(?:cr|creatinine)[:\s]+\d+\.?\d*/.test(text)) return true;
  if (/(?:egfr)[:\s]+\d+/.test(text)) return true;
  if (/(?:bnp)[:\s]+\d+/.test(text)) return true;
  
  return false;
}
