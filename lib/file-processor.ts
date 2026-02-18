/**
 * File Processing Utilities
 * Handles image and PDF processing for medical AI
 */

// PDF processing disabled due to dependency issues
// import * as pdf from "pdf-parse";

export interface ProcessedFile {
  name: string;
  type: string;
  size: number;
  content?: string; // For PDFs
  base64?: string; // For images
  mimeType?: string;
}

/**
 * Convert File to base64 string
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Extract text from PDF file
 * Currently disabled due to dependency issues
 */
export async function extractPDFText(file: File): Promise<string> {
  // PDF processing disabled - requires canvas dependencies
  return `[PDF text extraction is currently unavailable. Please convert to images or text. File: ${file.name}]`;
}

/**
 * Process uploaded files for AI consumption
 */
export async function processFiles(files: File[]): Promise<ProcessedFile[]> {
  const processed: ProcessedFile[] = [];

  for (const file of files) {
    const processedFile: ProcessedFile = {
      name: file.name,
      type: file.type,
      size: file.size,
    };

    if (file.type.startsWith("image/")) {
      // Process image - convert to base64
      processedFile.base64 = await fileToBase64(file);
      processedFile.mimeType = file.type;
    } else if (file.type === "application/pdf") {
      // Process PDF - extract text
      processedFile.content = await extractPDFText(file);
    } else if (
      file.type === "application/msword" ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      // For Word docs, we'll just note them for now
      processedFile.content = `[Document: ${file.name} - Text extraction not yet implemented]`;
    }

    processed.push(processedFile);
  }

  return processed;
}

/**
 * Format processed files for prompt (Generic)
 */
export function formatFilesForPrompt(files: ProcessedFile[]): string {
  let formatted = "\n\n--- UPLOADED FILES ---\n\n";

  for (const file of files) {
    formatted += `**File: ${file.name}** (${(file.size / 1024).toFixed(1)} KB)\n`;

    if (file.content) {
      formatted += `Content:\n${file.content.substring(0, 2000)}${file.content.length > 2000 ? "..." : ""}\n\n`;
    } else if (file.base64) {
      formatted += `[Image attached for analysis]\n\n`;
    }
  }

  formatted += "--- END FILES ---\n\n";
  return formatted;
}


