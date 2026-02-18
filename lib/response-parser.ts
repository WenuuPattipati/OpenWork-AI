/**
 * Response Parser - Improved content extraction for AI responses
 * Properly separates content into Clinical Analysis, Diagnosis, Treatment, and Evidence tabs
 */

export interface ParsedMedicalResponse {
  clinical: string;
  diagnosis: string;
  treatment: string;
  evidence: string;
  fullResponse: string;
}

/**
 * Section markers for each tab
 */
const SECTION_MARKERS = {
  clinical: [
    "## Clinical Analysis",
    "**Clinical Analysis**",
    "## TL;DR",
    "**TL;DR**",
    "## Clinical Context",
    "**Clinical Context**",
    "## Key Points",
    "**Key Points**",
    "## Summary",
    "## Overview",
    "**Overview**",
  ],
  diagnosis: [
    "## Diagnosis & Logic",
    "**Diagnosis & Logic**",
    "## Diagnosis and Logic",
    "**Diagnosis and Logic**",
    "## Differential Diagnosis",
    "**Differential Diagnosis**",
    "## Diagnosis",
    "**Diagnosis**",
    "## Clinical Reasoning",
    "**Clinical Reasoning**",
    "## Diagnostic Approach",
    "**Diagnostic Approach**",
    "## Assessment",
    "**Assessment**",
  ],
  treatment: [
    "## Treatment & Safety",
    "**Treatment & Safety**",
    "## Treatment and Safety",
    "**Treatment and Safety**",
    "## Recommended Approach",
    "**Recommended Approach**",
    "## Drug & Safety",
    "**Drug & Safety**",
    "## Treatment",
    "**Treatment**",
    "## Management",
    "**Management**",
    "## Therapeutic Options",
    "**Therapeutic Options**",
    "## Medications",
    "**Medications**",
    "## Common Medications",
    "**Common Medications**",
    "## Safety Considerations",
    "**Safety Considerations**",
  ],
  evidence: [
    "## Evidence Database",
    "**Evidence Database**",
    "## Evidence Snapshot",
    "**Evidence Snapshot**",
    "## Citations",
    "**Citations**",
    "## References",
    "**References**",
    "## Clinical Evidence",
    "**Clinical Evidence**",
    "## Supporting Evidence",
    "**Supporting Evidence**",
    "## Literature Review",
    "**Literature Review**",
  ],
};

/**
 * Sections that should be EXCLUDED from specific tabs
 */
const SECTION_EXCLUSIONS = {
  clinical: [
    "Differential Diagnosis",
    "Recommended Approach",
    "Drug & Safety",
    "Treatment",
    "Evidence Snapshot",
    "Citations",
    "References",
    "Follow-Up Questions",
  ],
  diagnosis: [
    "TL;DR",
    "Clinical Context",
    "Recommended Approach",
    "Drug & Safety",
    "Treatment",
    "Evidence Snapshot",
    "Citations",
    "References",
    "Follow-Up Questions",
  ],
  treatment: [
    "TL;DR",
    "Clinical Context",
    "Differential Diagnosis",
    "Evidence Snapshot",
    "Citations",
    "References",
    "Follow-Up Questions",
  ],
  evidence: [
    "TL;DR",
    "Clinical Context",
    "Differential Diagnosis",
    "Recommended Approach",
    "Drug & Safety",
    "Treatment",
    "Follow-Up Questions",
  ],
};

/**
 * Parse the full AI response into structured sections for tabs
 */
export function parseResponseIntoSections(response: string): ParsedMedicalResponse {
  const lines = response.split("\n");
  
  // Track which section we're currently in
  type SectionType = "clinical" | "diagnosis" | "treatment" | "evidence" | "other";
  let currentSection: SectionType = "clinical"; // Default to clinical
  
  const sections: Record<SectionType, string[]> = {
    clinical: [],
    diagnosis: [],
    treatment: [],
    evidence: [],
    other: [],
  };
  
  // Track if we've found any explicit section markers
  let foundExplicitSections = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Skip empty lines at the start
    if (trimmedLine === "" && sections[currentSection].length === 0) {
      continue;
    }
    
    // Check if this line is a section header
    const newSection = detectSectionType(trimmedLine);
    if (newSection && newSection !== "other") {
      currentSection = newSection;
      foundExplicitSections = true;
      sections[currentSection].push(line);
      continue;
    }
    
    // Check if we should stop capturing (hit Follow-Up Questions or References at the end)
    if (
      trimmedLine.match(/^#{1,3}\s*(Follow[-\s]?Up Questions?|You Might Also Want to Know)/i) ||
      (currentSection === "evidence" && trimmedLine.match(/^#{1,3}\s*References?$/i))
    ) {
      // Add to evidence section if it's references
      if (trimmedLine.match(/^#{1,3}\s*References?$/i)) {
        sections.evidence.push(line);
        currentSection = "evidence";
      }
      continue;
    }
    
    // Add line to current section
    sections[currentSection].push(line);
  }
  
  // If no explicit sections found, try to intelligently split the response
  if (!foundExplicitSections) {
    return intelligentSplit(response);
  }
  
  // Clean up and format each section
  const result: ParsedMedicalResponse = {
    clinical: cleanSection(sections.clinical.join("\n")),
    diagnosis: cleanSection(sections.diagnosis.join("\n")),
    treatment: cleanSection(sections.treatment.join("\n")),
    evidence: cleanSection(sections.evidence.join("\n")),
    fullResponse: response,
  };
  
  // If any section is empty, provide a helpful message
  if (!result.clinical.trim()) {
    result.clinical = "No specific clinical analysis available for this query.";
  }
  if (!result.diagnosis.trim()) {
    result.diagnosis = "No specific diagnostic information available for this query.";
  }
  if (!result.treatment.trim()) {
    result.treatment = "No specific treatment recommendations available for this query.";
  }
  if (!result.evidence.trim()) {
    result.evidence = "Evidence is being gathered from medical databases. Please check the References section below.";
  }
  
  return result;
}

/**
 * Detect which section type a line belongs to based on its content
 */
function detectSectionType(line: string): "clinical" | "diagnosis" | "treatment" | "evidence" | "other" | null {
  const lowerLine = line.toLowerCase();
  
  // Check clinical markers
  for (const marker of SECTION_MARKERS.clinical) {
    if (line.includes(marker) || lowerLine.includes(marker.toLowerCase())) {
      return "clinical";
    }
  }
  
  // Check diagnosis markers
  for (const marker of SECTION_MARKERS.diagnosis) {
    if (line.includes(marker) || lowerLine.includes(marker.toLowerCase())) {
      return "diagnosis";
    }
  }
  
  // Check treatment markers
  for (const marker of SECTION_MARKERS.treatment) {
    if (line.includes(marker) || lowerLine.includes(marker.toLowerCase())) {
      return "treatment";
    }
  }
  
  // Check evidence markers
  for (const marker of SECTION_MARKERS.evidence) {
    if (line.includes(marker) || lowerLine.includes(marker.toLowerCase())) {
      return "evidence";
    }
  }
  
  return null;
}

/**
 * Intelligent split for responses without explicit section markers
 */
function intelligentSplit(response: string): ParsedMedicalResponse {
  const paragraphs = response.split(/\n\n+/);
  
  const clinical: string[] = [];
  const diagnosis: string[] = [];
  const treatment: string[] = [];
  const evidence: string[] = [];
  
  for (const para of paragraphs) {
    const lowerPara = para.toLowerCase();
    
    // Classify based on content keywords
    if (
      lowerPara.includes("diagnosis") ||
      lowerPara.includes("differential") ||
      lowerPara.includes("assessment") ||
      lowerPara.includes("findings")
    ) {
      diagnosis.push(para);
    } else if (
      lowerPara.includes("treatment") ||
      lowerPara.includes("medication") ||
      lowerPara.includes("drug") ||
      lowerPara.includes("therapy") ||
      lowerPara.includes("dosing") ||
      lowerPara.includes("management")
    ) {
      treatment.push(para);
    } else if (
      lowerPara.includes("evidence") ||
      lowerPara.includes("study") ||
      lowerPara.includes("trial") ||
      lowerPara.includes("research") ||
      lowerPara.includes("reference") ||
      lowerPara.includes("citation") ||
      lowerPara.includes("pmid") ||
      lowerPara.includes("doi:")
    ) {
      evidence.push(para);
    } else {
      // Default to clinical
      clinical.push(para);
    }
  }
  
  return {
    clinical: clinical.join("\n\n") || response,
    diagnosis: diagnosis.join("\n\n") || "See Clinical Analysis tab for diagnostic information.",
    treatment: treatment.join("\n\n") || "See Clinical Analysis tab for treatment information.",
    evidence: evidence.join("\n\n") || "Evidence is integrated throughout the response.",
    fullResponse: response,
  };
}

/**
 * Heading transformations - replace technical headings with professional ones
 */
const HEADING_TRANSFORMATIONS: Record<string, string> = {
  // Clinical Analysis tab
  "TL;DR": "Key Findings",
  "TL:DR": "Key Findings",
  "TLDR": "Key Findings",
  "tl;dr": "Key Findings",
  "Summary": "Key Findings",
  "Clinical Context & Key Points": "Clinical Context",
  
  // Diagnosis tab
  "Differential Diagnosis & Reasoning": "Differential Diagnosis",
  
  // Treatment tab
  "Recommended Approach (Evidence-Informed)": "Recommended Approach",
  "Drug & Safety Considerations": "Medication Safety",
  
  // Evidence tab
  "Evidence Snapshot": "Supporting Evidence",
};

/**
 * Transform headings to more professional versions
 */
function transformHeadings(content: string): string {
  let transformed = content;
  
  // Replace each heading pattern
  for (const [original, replacement] of Object.entries(HEADING_TRANSFORMATIONS)) {
    // Match ## Heading or **Heading** formats
    const patterns = [
      new RegExp(`^##\\s*${escapeRegex(original)}\\s*$`, "gim"),
      new RegExp(`^\\*\\*${escapeRegex(original)}\\*\\*:?\\s*$`, "gim"),
      new RegExp(`^###\\s*${escapeRegex(original)}\\s*$`, "gim"),
    ];
    
    for (const pattern of patterns) {
      transformed = transformed.replace(pattern, `## ${replacement}`);
    }
  }
  
  return transformed;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Clean up a section by removing extra whitespace and formatting
 */
function cleanSection(content: string): string {
  let cleaned = content
    .replace(/^\n+/, "") // Remove leading newlines
    .replace(/\n+$/, "") // Remove trailing newlines
    .replace(/\n{3,}/g, "\n\n") // Collapse multiple newlines
    .trim();
  
  // Remove AI disclaimer from tab content (it appears separately below tabs)
  // Match various disclaimer formats
  cleaned = cleaned.replace(
    /⚠️\s*\*\*AI-Generated Evidence-Based Response\*\*[\s\S]*?(?=\n\n##|$)/gi,
    ''
  );
  
  // Also remove standalone disclaimer paragraphs
  cleaned = cleaned.replace(
    /This response is generated using evidence from peer-reviewed literature[\s\S]*?professional medical expertise\./gi,
    ''
  );
  
  // Clean up any extra whitespace left after removal
  cleaned = cleaned
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  
  // Transform headings to professional versions
  cleaned = transformHeadings(cleaned);
  
  return cleaned;
}

/**
 * Check if response contains image analysis content
 */
export function hasImageAnalysis(response: string): boolean {
  const imageKeywords = [
    "ultrasound",
    "imaging",
    "diagram",
  ];
  
  const lowerResponse = response.toLowerCase();
  return imageKeywords.some((keyword) =>
    lowerResponse.includes(keyword.toLowerCase())
  );
}

/**
 * Improved extractSection function for backward compatibility
 */
export function extractSection(response: string, keywords: string[]): string {
  const parsed = parseResponseIntoSections(response);
  
  // Determine which section based on keywords
  const keywordsLower = keywords.map((k) => k.toLowerCase());
  
  if (
    keywordsLower.some((k) =>
      ["tl;dr", "clinical context", "medical image analysis", "key points"].includes(k)
    )
  ) {
    return parsed.clinical;
  }
  
  if (
    keywordsLower.some((k) =>
      ["differential diagnosis", "visual findings", "diagnosis", "assessment"].includes(k)
    )
  ) {
    return parsed.diagnosis;
  }
  
  if (
    keywordsLower.some((k) =>
      ["recommended approach", "drug & safety", "treatment", "management"].includes(k)
    )
  ) {
    return parsed.treatment;
  }
  
  if (
    keywordsLower.some((k) =>
      ["evidence snapshot", "citations", "evidence database", "references"].includes(k)
    )
  ) {
    return parsed.evidence;
  }
  
  // Fallback to full response
  return response;
}
