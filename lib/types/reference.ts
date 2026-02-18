/**
 * Reference metadata types
 */

export interface ReferenceMetadata {
  title: string;
  authors: string;
  journal: string;
  publishedDate: string;
  year: string;
  source: string;
  isLeadingJournal: boolean;
}

export interface ReferenceMetadataState {
  metadata: ReferenceMetadata;
  isLoading: boolean;
  error: boolean;
}