/**
 * Type definitions for the inline citation system
 * Used for Sources badges, hover cards, and reference lists
 */

/**
 * Quality badge types for references
 */
export type QualityBadge = 
  | 'Practice Guideline'
  | 'Leading Journal'
  | 'Recent'
  | 'Systematic Review'
  | 'Meta-Analysis'
  | 'Highly Cited'
  | 'PMCID';

/**
 * Mode type for styling (Doctor Mode vs General Mode)
 */
export type CitationMode = 'doctor' | 'general';

/**
 * Parsed reference with all metadata for inline citation system
 */
export interface ParsedReference {
  id: string;                    // Unique identifier (e.g., "ref-1")
  number: number;                // Reference number (1, 2, 3, etc.)
  title: string;                 // Full article title
  authors: string[];             // Array of author names
  journal: string;               // Journal/source name
  year: string;                  // Publication year
  volume?: string;               // Volume number (optional)
  issue?: string;                // Issue number (optional)
  pages?: string;                // Page range (optional)
  doi?: string;                  // DOI identifier (optional)
  pmid?: string;                 // PubMed ID (optional)
  pmcid?: string;                // PMC ID (optional)
  url: string;                   // Direct article URL
  badges: QualityBadge[];        // Array of quality badges
  isValid: boolean;              // Whether reference has valid data
  imageSource?: 'Open-i' | 'InjuryMap'; // Image source if this is an image reference
  imageUrl?: string;             // Direct image URL if this is an image reference
}

/**
 * Data for a Sources badge component
 */
export interface SourcesBadgeData {
  id: string;                    // Unique badge identifier (e.g., "p1-s1")
  label: string;                 // Badge label ("Sources")
  refNumbers: number[];          // Array of reference numbers (e.g., [1, 2, 3])
  mode: CitationMode;            // Mode for styling
}

/**
 * Text segment with citation information
 */
export interface TextSegment {
  id: string;                    // Unique segment identifier
  text: string;                  // Text content without citation markers
  citationNumbers: number[];     // Citation numbers in this segment
  originalText: string;          // Original text with [[N]] markers (for copy)
}

/**
 * Result of parsing a response with citations
 */
export interface ParsedResponse {
  segments: TextSegment[];       // Text segments with citations
  references: ParsedReference[]; // Parsed references
  mainContent: string;           // Main content without references section
}

/**
 * Citation validation result
 */
export interface ValidationResult {
  errors: string[];              // Critical errors
  warnings: string[];            // Non-critical warnings
  isValid: boolean;              // Whether validation passed
}

/**
 * Color scheme for citation components
 */
export interface CitationColors {
  bg: string;                    // Background color for badges
  border: string;                // Border color for hover cards
  link: string;                  // Link color for references
}
