export interface VisualFinding {
  description: string;
  severity: string;
  boundingBoxes: { ymin: number; xmin: number; ymax: number; xmax: number }[];
  fileIndex?: number;
}

/**
 * Parses visual findings from structured XML or JSON output in the LLM response.
 */
export function parseVisualFindings(response: string): VisualFinding[] {
  try {
    // Look for <visual_findings> block using regex
    const match = response.match(/<visual_findings>([\s\S]*?)<\/visual_findings>/);
    if (!match) return [];

    const content = match[1];
    // Attempt to parse JSON content within the tags
    // This assumes the findings are formatted as a JSON array inside the tags
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed.map(item => ({
          description: item.description || item.label || "Unknown finding",
          severity: item.severity || "mild",
          boundingBoxes: item.box_2d ? [{
             ymin: item.box_2d[0],
             xmin: item.box_2d[1],
             ymax: item.box_2d[2],
             xmax: item.box_2d[3]
          }] : [],
          fileIndex: item.file_index
        }));
      }
    } catch (e) {
      // JSON parse failed, try other formats if needed
    }
    return [];
  } catch (error) {
    console.error("Error parsing visual findings:", error);
    return [];
  }
}

/**
 * Flexible parser that looks for Markdown JSON blocks if XML tags are missing.
 */
export function parseVisualFindingsFlexible(response: string): VisualFinding[] {
  try {
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
       try {
         const parsed = JSON.parse(jsonMatch[1]);
         if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].box_2d) {
            // Check if it looks like a finding object
            return parsed.map(item => ({
              description: item.keypoint || item.label || "Finding",
              severity: "moderate",
              boundingBoxes: item.box_2d ? [{
                 ymin: item.box_2d[0],
                 xmin: item.box_2d[1],
                 ymax: item.box_2d[2],
                 xmax: item.box_2d[3]
              }] : [],
            }));
         }
       } catch (e) {}
    }
    return [];
  } catch (error) {
    return [];
  }
}

/**
 * Deduplicates and cleans visual findings.
 */
export function cleanVisualFindings(findings: VisualFinding[]): VisualFinding[] {
  // Simple pass-through for now, or dedupe by description
  const unique = new Map();
  findings.forEach(f => {
    if (!unique.has(f.description)) {
      unique.set(f.description, f);
    }
  });
  return Array.from(unique.values());
}
