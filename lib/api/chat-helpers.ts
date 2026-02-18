/**
 * Helper functions for chat API route
 */

/**
 * Extract potential drug names from query
 * Simple keyword-based extraction (can be enhanced with NLP)
 */
export function extractDrugNames(query: string): string[] {
  const commonDrugs = [
    "aspirin", "metformin", "lisinopril", "atorvastatin", "metoprolol",
    "amlodipine", "omeprazole", "losartan", "gabapentin", "hydrochlorothiazide",
    "levothyroxine", "albuterol", "warfarin", "apixaban", "rivaroxaban",
    "insulin", "prednisone", "amoxicillin", "azithromycin", "ciprofloxacin",
    "ibuprofen", "acetaminophen", "morphine", "fentanyl", "naloxone"
  ];
  
  const queryLower = query.toLowerCase();
  return commonDrugs.filter(drug => queryLower.includes(drug));
}

/**
 * Process uploaded files (images and PDFs)
 */
export async function processUploadedFiles(files: string[]): Promise<{
  parts: any[];
  textContent: string;
}> {
  const parts: any[] = [];
  let textContent = "\n\n--- UPLOADED FILES ---\n\n";

  for (let i = 0; i < files.length; i++) {
    const fileData = files[i];
    
    // Extract mime type and base64 data
    const matches = fileData.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) continue;
    
    const mimeType = matches[1];
    const base64Data = matches[2];
    
    if (mimeType.startsWith("image/")) {
      // Add image for vision analysis
      parts.push({
        inlineData: {
          mimeType,
          data: base64Data,
        },
      });
      textContent += `**Image ${i + 1}**: [Medical image attached for analysis]\n\n`;
    } else if (mimeType === "application/pdf") {
      // PDF support is disabled for now due to dependency issues
      // TODO: Re-enable when canvas dependencies are properly configured
      textContent += `**PDF Document ${i + 1}**: [PDF text extraction is currently unavailable. Please convert to images or text.]\n\n`;
      console.warn("PDF upload detected but pdf-parse is not available");
    }
  }
  
  textContent += "--- END FILES ---\n\n";
  
  return { parts, textContent };
}

/**
 * Check for self-harm intent in message (for general mode safety)
 */
export function hasSelfHarmIntent(message: string): boolean {
  const messageLower = message.toLowerCase();
  
  // Level 1: Explicit self-harm phrases (immediate crisis response)
  const explicitSelfHarmPhrases = [
    "kill myself", "end my life", "commit suicide", "want to die",
    "how to die", "ways to die", "painless way to die", "how can i die",
    "going to kill", "planning to kill", "end it all",
    "cut myself", "hurt myself", "harm myself",
    "overdose", "pills to die", "hang myself",
    "better off dead", "world without me", "goodbye forever",
    "suicide method", "how to commit", "easiest way to die"
  ];
  
  return explicitSelfHarmPhrases.some(phrase => messageLower.includes(phrase));
}

/**
 * Get crisis response for self-harm detection
 */
export function getCrisisResponse(): string {
  return `**This sounds very serious. Your safety is the most important thing right now.**

**Please stop reading this and take these steps immediately:**

1. **Call emergency services** or a crisis line in your country right away:
   - **US**: National Suicide Prevention Lifeline: 988 or 1-800-273-8255
   - **UK**: Samaritans: 116 123
   - **International**: Find your local crisis line at findahelpline.com

2. **Don't stay alone**: Sit with or call someone you trust right now - a parent, partner, friend, family member, or roommate. Tell them exactly how you're feeling.

3. **Go to your nearest emergency room** if you feel you might act on these thoughts.

**You deserve help and you are not alone.** These feelings can get better with support, and there are people who want to help you through this.

If you are in immediate danger, please call emergency services (911 in US, 999 in UK, 112 in EU) right now.`;
}
