/**
 * Clinical Vignette Decomposition for Image Retrieval
 * 
 * Breaks down complex clinical vignettes into teaching panels
 * Each panel targets a specific organ system or therapeutic concept
 */

import { expandMedicalAbbreviations } from './evidence/medical-abbreviations';

export interface TeachingPanel {
    id: string;
    title: string;
    concepts: string[];
    searchQuery: string;
    specialty?: 'cardiology' | 'nephrology' | 'endocrinology' | 'ophthalmology' | 'pharmacology';
    imageType?: 'graphic' | 'photo' | 'diagram';
    priority: number; // 1-5, higher = more important
}

export interface VignetteDecomposition {
    panels: TeachingPanel[];
    primaryConcepts: string[];
    secondaryConcepts: string[];
}

/**
 * Extract medical entities from clinical vignette (Doctor Mode)
 */
function extractMedicalEntities(vignette: string): {
    conditions: string[];
    medications: string[];
    organs: string[];
    measurements: string[];
} {
    const text = vignette.toLowerCase();

    const conditions: string[] = [];
    const medications: string[] = [];
    const organs: string[] = [];
    const measurements: string[] = [];

    // Common conditions
    const conditionPatterns = [
        { pattern: /type 2 diabetes|t2dm/i, name: 'type 2 diabetes' },
        { pattern: /diabetic retinopathy/i, name: 'diabetic retinopathy' },
        { pattern: /chronic kidney disease|ckd/i, name: 'chronic kidney disease' },
        { pattern: /heart failure.*preserved ejection fraction|hfpef/i, name: 'HFpEF' },
        { pattern: /hypertension|high blood pressure/i, name: 'hypertension' },
        { pattern: /obesity/i, name: 'obesity' },
        { pattern: /coronary artery disease|cad/i, name: 'coronary artery disease' },
        { pattern: /albuminuria/i, name: 'albuminuria' },
    ];

    conditionPatterns.forEach(({ pattern, name }) => {
        if (pattern.test(text)) conditions.push(name);
    });

    // Medications
    const medicationPatterns = [
        { pattern: /glp-?1.*(?:receptor agonist|ra)/i, name: 'GLP-1 receptor agonist' },
        { pattern: /sglt2.*inhibitor/i, name: 'SGLT2 inhibitor' },
        { pattern: /ace.*inhibitor|acei/i, name: 'ACE inhibitor' },
        { pattern: /thiazide/i, name: 'thiazide diuretic' },
        { pattern: /metformin/i, name: 'metformin' },
        { pattern: /insulin/i, name: 'insulin' },
    ];

    medicationPatterns.forEach(({ pattern, name }) => {
        if (pattern.test(text)) medications.push(name);
    });

    // Organ systems
    const organPatterns = [
        { pattern: /\b(?:kidney|renal|nephron|glomerulus)\b/i, name: 'kidney' },
        { pattern: /\b(?:heart|cardiac|myocardium)\b/i, name: 'heart' },
        { pattern: /\b(?:eye|retina|fundus|vision)\b/i, name: 'eye' },
        { pattern: /\b(?:pancreas|beta cell)\b/i, name: 'pancreas' },
        { pattern: /\b(?:vascular|blood vessel|artery)\b/i, name: 'vasculature' },
    ];

    organPatterns.forEach(({ pattern, name }) => {
        if (pattern.test(text)) organs.push(name);
    });

    // Measurements
    const measurementPatterns = [
        { pattern: /egfr|glomerular filtration rate/i, name: 'eGFR' },
        { pattern: /hba1c|glycated hemoglobin/i, name: 'HbA1c' },
        { pattern: /bmi|body mass index/i, name: 'BMI' },
        { pattern: /lvef|ejection fraction/i, name: 'LVEF' },
        { pattern: /ascvd.*risk/i, name: 'ASCVD risk' },
    ];

    measurementPatterns.forEach(({ pattern, name }) => {
        if (pattern.test(text)) measurements.push(name);
    });

    return { conditions, medications, organs, measurements };
}

/**
 * Extract body parts and symptoms for General Mode queries
 * SIMPLE: Just anatomical location extraction from one-line queries
 */
function extractBodyPartsAndSymptoms(query: string): {
    bodyParts: string[];
    symptoms: string[];
    anatomyQueries: string[];
} {
    const text = query.toLowerCase();
    const bodyParts: string[] = [];
    const symptoms: string[] = [];
    const anatomyQueries: string[] = [];

    // Body parts mapping with anatomy search queries
    const bodyPartPatterns = [
        { pattern: /\b(?:hair|scalp)\b/i, part: 'hair', anatomy: 'hair follicle scalp anatomy' },
        { pattern: /\b(?:neck|cervical)\b/i, part: 'neck', anatomy: 'neck muscles anatomy' },
        { pattern: /\b(?:shoulder)\b/i, part: 'shoulder', anatomy: 'shoulder muscles anatomy' },
        { pattern: /\b(?:back|spine)\b/i, part: 'back', anatomy: 'spine anatomy' },
        { pattern: /\b(?:knee)\b/i, part: 'knee', anatomy: 'knee joint anatomy' },
        { pattern: /\b(?:hand|wrist)\b/i, part: 'hand', anatomy: 'hand bones anatomy' },
    ];

    bodyPartPatterns.forEach(({ pattern, part, anatomy }) => {
        if (pattern.test(text)) {
            bodyParts.push(part);
            anatomyQueries.push(anatomy);
        }
    });

    // Spatial parsing: "between neck and shoulder"
    const betweenMatch = text.match(/between\s+(?:the\s+)?(\w+)\s+and\s+(?:the\s+)?(\w+)/i);
    if (betweenMatch) {
        const part1 = betweenMatch[1];
        const part2 = betweenMatch[2];

        if ((part1.includes('neck') && part2.includes('shoulder')) ||
            (part1.includes('shoulder') && part2.includes('neck'))) {
            anatomyQueries.push('trapezius muscle neck shoulder anatomy');
            bodyParts.push('neck-shoulder');
        }
    }

    // Symptoms
    if (/\b(?:pain|ache|hurt)\b/i.test(text)) symptoms.push('pain');
    if (/\b(?:loss|losing)\b/i.test(text)) symptoms.push('loss');
    if (/\b(?:swell|swelling)\b/i.test(text)) symptoms.push('swelling');

    return { bodyParts, symptoms, anatomyQueries };
}

/**
 * Decompose vignette into teaching panels
 * Mode: 'doctor' for detailed clinical vignettes, 'general' for simple consumer queries
 */
export function decomposeVignette(vignette: string, mode: 'doctor' | 'general' = 'doctor'): VignetteDecomposition {
    const panels: TeachingPanel[] = [];

    if (mode === 'general') {
        // GENERAL MODE: Simple anatomy-focused extraction
        const { bodyParts, symptoms, anatomyQueries } = extractBodyPartsAndSymptoms(vignette);

        // Create one panel per body part mentioned
        anatomyQueries.forEach((query, index) => {
            panels.push({
                id: `panel-anatomy-${index}`,
                title: `${bodyParts[index]} Anatomy`,
                concepts: [bodyParts[index], ...symptoms],
                searchQuery: query,
                imageType: 'graphic',
                priority: 5
            });
        });

        return {
            panels,
            primaryConcepts: bodyParts,
            secondaryConcepts: symptoms
        };
    }

    // DOCTOR MODE: Detailed clinical vignette decomposition
    const entities = extractMedicalEntities(vignette);

    // Panel 1: Type 2 Diabetes + Obesity (if present)
    if (entities.conditions.includes('type 2 diabetes')) {
        const concepts = ['type 2 diabetes', 'insulin resistance'];
        if (entities.conditions.includes('obesity')) concepts.push('obesity');

        panels.push({
            id: 'panel-diabetes',
            title: 'Type 2 Diabetes and Metabolic Risk',
            concepts,
            searchQuery: entities.conditions.includes('obesity')
                ? 'type 2 diabetes insulin resistance obesity pathophysiology'
                : 'type 2 diabetes insulin resistance pathophysiology',
            specialty: 'endocrinology',
            imageType: 'graphic',
            priority: 5
        });
    }

    // Panel 2: Diabetic Retinopathy (if present)
    if (entities.conditions.includes('diabetic retinopathy')) {
        panels.push({
            id: 'panel-retinopathy',
            title: 'Diabetic Retinopathy',
            concepts: ['diabetic retinopathy', 'fundus'],
            searchQuery: 'diabetic retinopathy fundus',
            specialty: 'ophthalmology',
            imageType: 'photo',
            priority: 4
        });
    }

    // Panel 3: Chronic Kidney Disease (if present)
    // CRITICAL FIX: Make CKD panel context-aware - don't always show generic histology
    if (entities.conditions.includes('chronic kidney disease') || entities.conditions.includes('albuminuria')) {
        // Check if query is about SGLT2i/drug therapy (not anatomy)
        const isDrugQuery = /sglt2|empagliflozin|dapagliflozin|canagliflozin|dosing|dose|therapy|treatment|medication|drug/i.test(vignette);
        const isGuidelineQuery = /kdigo|guideline|recommendation|management|protocol/i.test(vignette);
        
        if (isDrugQuery || isGuidelineQuery) {
            // For drug/guideline queries, search for SGLT2i-specific diagrams
            panels.push({
                id: 'panel-kidney-therapy',
                title: 'SGLT2 Inhibitor Therapy in CKD',
                concepts: ['SGLT2 inhibitor', 'CKD management', 'KDIGO guidelines'],
                searchQuery: 'SGLT2 inhibitor CKD mechanism flowchart KDIGO',
                specialty: 'nephrology',
                imageType: 'diagram',
                priority: 5
            });
        } else {
            // For general CKD questions, use generic kidney disease query
            panels.push({
                id: 'panel-kidney',
                title: 'Diabetic Kidney Disease',
                concepts: ['chronic kidney disease', 'diabetic nephropathy'],
                searchQuery: 'diabetic kidney disease glomerulus nephropathy',
                specialty: 'nephrology',
                imageType: 'graphic',
                priority: 5
            });
        }
    }

    // Panel 4: Heart Failure (if present)
    if (entities.conditions.includes('HFpEF')) {
        panels.push({
            id: 'panel-heart-failure',
            title: 'Heart Failure with Preserved Ejection Fraction',
            concepts: ['HFpEF', 'diastolic dysfunction'],
            searchQuery: 'heart failure preserved ejection fraction HFpEF',
            specialty: 'cardiology',
            imageType: 'graphic',
            priority: 5
        });
    }

    // Panel 5: GLP-1 RA + SGLT2i (if mentioned)
    if (entities.medications.includes('GLP-1 receptor agonist') || entities.medications.includes('SGLT2 inhibitor')) {
        const hasBoth = entities.medications.includes('GLP-1 receptor agonist') && entities.medications.includes('SGLT2 inhibitor');

        panels.push({
            id: 'panel-medications',
            title: 'Pharmacologic Mechanisms',
            concepts: hasBoth ? ['GLP-1 RA', 'SGLT2i'] : entities.medications,
            searchQuery: hasBoth
                ? 'GLP-1 receptor agonist SGLT2 inhibitor cardiovascular mechanism'
                : entities.medications[0] + ' mechanism',
            specialty: 'pharmacology',
            imageType: 'diagram',
            priority: 4
        });
    }

    // Determine primary vs secondary concepts
    const primaryConcepts = panels
        .filter(p => p.priority >= 5)
        .flatMap(p => p.concepts);

    const secondaryConcepts = panels
        .filter(p => p.priority < 5)
        .flatMap(p => p.concepts);

    return {
        panels: panels.sort((a, b) => b.priority - a.priority),
        primaryConcepts: [...new Set(primaryConcepts)],
        secondaryConcepts: [...new Set(secondaryConcepts)]
    };
}
