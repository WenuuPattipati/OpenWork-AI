"use client";

import React from "react";

interface FormattedQuestionProps {
  content: string;
  className?: string;
}

/**
 * Formats clinical questions with proper structure and line breaks.
 * Detects common clinical patterns like Vitals, Labs, Medications, etc.
 * and displays them on separate lines for better readability.
 */
export function FormattedQuestion({ content, className = "" }: FormattedQuestionProps) {
  // Format the question content with intelligent line breaks
  const formattedContent = formatClinicalQuestion(content);
  
  return (
    <div className={`p-6 md:p-8 bg-white border border-gray-200 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] mb-4 ${className}`}>
      {formattedContent.map((segment, index) => (
        <React.Fragment key={index}>
          {segment.type === "main" && (
            <p className="text-lg text-gray-900 font-medium leading-relaxed">{segment.text}</p>
          )}
          {segment.type === "section" && (
            <p className="mt-4 text-[15px] text-gray-700 leading-relaxed">
              <span className="font-bold text-gray-900">{segment.label}:</span>{" "}
              {segment.text}
            </p>
          )}
          {segment.type === "question" && (
            <p className="mt-4 text-lg text-blue-700 font-semibold italic leading-relaxed">{segment.text}</p>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

interface QuestionSegment {
  type: "main" | "section" | "question";
  text: string;
  label?: string;
}

/**
 * Parses clinical question text and breaks it into structured segments.
 */
function formatClinicalQuestion(content: string): QuestionSegment[] {
  const segments: QuestionSegment[] = [];
  
  // Common clinical section patterns (case-insensitive)
  const sectionPatterns = [
    /\b(Vitals?):\s*/gi,
    /\b(Labs?):\s*/gi,
    /\b(Laboratory):\s*/gi,
    /\b(Medications?):\s*/gi,
    /\b(Meds?):\s*/gi,
    /\b(Current medications?):\s*/gi,
    /\b(CXR):\s*/gi,
    /\b(Chest X-?ray):\s*/gi,
    /\b(X-?ray):\s*/gi,
    /\b(CT):\s*/gi,
    /\b(MRI):\s*/gi,
    /\b(Imaging):\s*/gi,
    /\b(ECG|EKG):\s*/gi,
    /\b(Echo):\s*/gi,
    /\b(Physical exam):\s*/gi,
    /\b(PE):\s*/gi,
    /\b(History):\s*/gi,
    /\b(PMH|Past medical history):\s*/gi,
    /\b(HPI|History of present illness):\s*/gi,
    /\b(Assessment):\s*/gi,
    /\b(Diagnosis):\s*/gi,
    /\b(Allergies?):\s*/gi,
    /\b(Social history):\s*/gi,
    /\b(Family history):\s*/gi,
  ];
  
  // Question prompt patterns (usually at the end)
  const questionPatterns = [
    /How would you[:\s]/gi,
    /What would you[:\s]/gi,
    /What is your[:\s]/gi,
    /What are the[:\s]/gi,
    /Would you recommend[:\s]/gi,
    /Please discuss[:\s]/gi,
    /Can you explain[:\s]/gi,
    /What should[:\s]/gi,
    /How should[:\s]/gi,
  ];
  
  // Check if content has clinical structure
  const hasClinicalStructure = sectionPatterns.some(pattern => pattern.test(content));
  
  if (!hasClinicalStructure) {
    // Simple question - just return as main text
    // But still check for question prompts at the end
    const questionMatch = questionPatterns.find(pattern => pattern.test(content));
    if (questionMatch) {
      const match = content.match(questionMatch);
      if (match && match.index !== undefined) {
        const mainPart = content.substring(0, match.index).trim();
        const questionPart = content.substring(match.index).trim();
        if (mainPart) {
          segments.push({ type: "main", text: mainPart });
        }
        segments.push({ type: "question", text: questionPart });
        return segments;
      }
    }
    segments.push({ type: "main", text: content });
    return segments;
  }
  
  // Complex clinical question - parse into sections
  let remainingText = content;
  let mainTextEnd = content.length;
  
  // Find the first section marker to determine where main text ends
  for (const pattern of sectionPatterns) {
    pattern.lastIndex = 0; // Reset regex
    const match = pattern.exec(content);
    if (match && match.index < mainTextEnd) {
      mainTextEnd = match.index;
    }
  }
  
  // Extract main presentation text (before first section)
  if (mainTextEnd > 0) {
    const mainText = content.substring(0, mainTextEnd).trim();
    if (mainText) {
      segments.push({ type: "main", text: mainText });
    }
    remainingText = content.substring(mainTextEnd);
  }
  
  // Parse sections
  // Create a combined pattern to find all sections
  const combinedSectionPattern = /\b(Vitals?|Labs?|Laboratory|Medications?|Meds?|Current medications?|CXR|Chest X-?ray|X-?ray|CT|MRI|Imaging|ECG|EKG|Echo|Physical exam|PE|History|PMH|Past medical history|HPI|History of present illness|Assessment|Diagnosis|Allergies?|Social history|Family history):\s*/gi;
  
  const sectionMatches: Array<{ label: string; start: number; end: number }> = [];
  let match;
  
  while ((match = combinedSectionPattern.exec(remainingText)) !== null) {
    sectionMatches.push({
      label: match[1],
      start: match.index,
      end: match.index + match[0].length
    });
  }
  
  // Extract section contents
  for (let i = 0; i < sectionMatches.length; i++) {
    const section = sectionMatches[i];
    const nextSection = sectionMatches[i + 1];
    const contentStart = section.end;
    const contentEnd = nextSection ? nextSection.start : remainingText.length;
    
    let sectionContent = remainingText.substring(contentStart, contentEnd).trim();
    
    // Check if this section contains a question prompt
    let questionPart = "";
    for (const qPattern of questionPatterns) {
      qPattern.lastIndex = 0;
      const qMatch = qPattern.exec(sectionContent);
      if (qMatch) {
        questionPart = sectionContent.substring(qMatch.index).trim();
        sectionContent = sectionContent.substring(0, qMatch.index).trim();
        break;
      }
    }
    
    // Remove trailing periods or commas for cleaner display
    sectionContent = sectionContent.replace(/[.,;]+$/, "").trim();
    
    if (sectionContent) {
      segments.push({
        type: "section",
        label: normalizeLabel(section.label),
        text: sectionContent
      });
    }
    
    if (questionPart) {
      segments.push({ type: "question", text: questionPart });
    }
  }
  
  // Check for trailing question that wasn't captured
  if (sectionMatches.length > 0) {
    const lastSection = sectionMatches[sectionMatches.length - 1];
    const afterSections = remainingText.substring(lastSection.end);
    
    for (const qPattern of questionPatterns) {
      qPattern.lastIndex = 0;
      const qMatch = qPattern.exec(afterSections);
      if (qMatch && !segments.some(s => s.type === "question")) {
        const questionText = afterSections.substring(qMatch.index).trim();
        if (questionText) {
          segments.push({ type: "question", text: questionText });
        }
        break;
      }
    }
  }
  
  return segments;
}

/**
 * Normalizes section labels for consistent display
 */
function normalizeLabel(label: string): string {
  const labelMap: Record<string, string> = {
    "vital": "Vitals",
    "vitals": "Vitals",
    "lab": "Labs",
    "labs": "Labs",
    "laboratory": "Labs",
    "medication": "Medications",
    "medications": "Medications",
    "med": "Medications",
    "meds": "Medications",
    "current medications": "Medications",
    "cxr": "CXR",
    "chest x-ray": "Chest X-ray",
    "chest xray": "Chest X-ray",
    "x-ray": "X-ray",
    "xray": "X-ray",
    "ct": "CT",
    "mri": "MRI",
    "imaging": "Imaging",
    "ecg": "ECG",
    "ekg": "ECG",
    "echo": "Echo",
    "physical exam": "Physical Exam",
    "pe": "Physical Exam",
    "history": "History",
    "pmh": "Past Medical History",
    "past medical history": "Past Medical History",
    "hpi": "HPI",
    "history of present illness": "HPI",
    "assessment": "Assessment",
    "diagnosis": "Diagnosis",
    "allergy": "Allergies",
    "allergies": "Allergies",
    "social history": "Social History",
    "family history": "Family History",
  };
  
  return labelMap[label.toLowerCase()] || label;
}

export default FormattedQuestion;
