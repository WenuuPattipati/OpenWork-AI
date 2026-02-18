/**
 * useReferenceMetadata Hook
 * 
 * Provides metadata enrichment for medical references and citations
 */

import { useState, useEffect, useMemo } from 'react';

export interface ReferenceMetadata {
  pmid?: string;
  doi?: string;
  journal?: string;
  year?: string;
  authors?: string;
  title?: string;
  source?: string;
  quality?: 'high' | 'medium' | 'low';
  type?: 'guideline' | 'systematic_review' | 'rct' | 'observational' | 'case_report' | 'review';
  openAccess?: boolean;
}

export interface UseReferenceMetadataOptions {
  references: string[];
  autoEnrich?: boolean;
}

export interface UseReferenceMetadataReturn {
  metadata: Map<string, ReferenceMetadata>;
  isLoading: boolean;
  error: string | null;
  enrichReference: (reference: string) => Promise<ReferenceMetadata | null>;
  getMetadata: (reference: string) => ReferenceMetadata | null;
}

export function useReferenceMetadata(options: UseReferenceMetadataOptions): UseReferenceMetadataReturn {
  const { references, autoEnrich = false } = options;
  
  const [metadata, setMetadata] = useState<Map<string, ReferenceMetadata>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract metadata from reference strings
  const extractMetadata = useMemo(() => {
    return (reference: string): ReferenceMetadata => {
      const metadata: ReferenceMetadata = {};

      // Extract PMID
      const pmidMatch = reference.match(/PMID:\s*(\d+)/i);
      if (pmidMatch) {
        metadata.pmid = pmidMatch[1];
      }

      // Extract DOI
      const doiMatch = reference.match(/DOI:\s*(10\.\d+\/[^\s]+)/i);
      if (doiMatch) {
        metadata.doi = doiMatch[1];
      }

      // Extract year
      const yearMatch = reference.match(/\b(19|20)\d{2}\b/);
      if (yearMatch) {
        metadata.year = yearMatch[0];
      }

      // Extract journal (common patterns)
      const journalPatterns = [
        /\b(N Engl J Med|NEJM)\b/i,
        /\b(Lancet)\b/i,
        /\b(JAMA)\b/i,
        /\b(BMJ)\b/i,
        /\b(Cochrane Database Syst Rev)\b/i,
        /\b(Circulation)\b/i,
        /\b(J Am Coll Cardiol)\b/i,
      ];

      for (const pattern of journalPatterns) {
        const match = reference.match(pattern);
        if (match) {
          metadata.journal = match[1];
          break;
        }
      }

      // Determine reference type
      if (reference.toLowerCase().includes('guideline')) {
        metadata.type = 'guideline';
        metadata.quality = 'high';
      } else if (reference.toLowerCase().includes('systematic review') || 
                 reference.toLowerCase().includes('meta-analysis')) {
        metadata.type = 'systematic_review';
        metadata.quality = 'high';
      } else if (reference.toLowerCase().includes('randomized') || 
                 reference.toLowerCase().includes('rct')) {
        metadata.type = 'rct';
        metadata.quality = 'high';
      } else if (reference.toLowerCase().includes('cochrane')) {
        metadata.type = 'systematic_review';
        metadata.quality = 'high';
      } else {
        metadata.type = 'review';
        metadata.quality = 'medium';
      }

      // Check for open access indicators
      if (reference.toLowerCase().includes('pmc') || 
          reference.toLowerCase().includes('pubmed central') ||
          reference.toLowerCase().includes('open access')) {
        metadata.openAccess = true;
      }

      return metadata;
    };
  }, []);

  // Enrich a single reference
  const enrichReference = async (reference: string): Promise<ReferenceMetadata | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // First, extract what we can from the reference string
      const extractedMetadata = extractMetadata(reference);

      // Store the metadata
      setMetadata(prev => new Map(prev).set(reference, extractedMetadata));

      return extractedMetadata;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to enrich reference metadata';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Get metadata for a reference
  const getMetadata = (reference: string): ReferenceMetadata | null => {
    return metadata.get(reference) || null;
  };

  // Auto-enrich references when they change
  useEffect(() => {
    if (autoEnrich && references.length > 0) {
      const enrichAll = async () => {
        setIsLoading(true);
        try {
          const newMetadata = new Map<string, ReferenceMetadata>();
          
          for (const reference of references) {
            if (!metadata.has(reference)) {
              const enriched = extractMetadata(reference);
              newMetadata.set(reference, enriched);
            }
          }

          if (newMetadata.size > 0) {
            setMetadata(prev => new Map([...prev, ...newMetadata]));
          }
        } catch (err: any) {
          setError(err.message || 'Failed to auto-enrich references');
        } finally {
          setIsLoading(false);
        }
      };

      enrichAll();
    }
  }, [references, autoEnrich, extractMetadata, metadata]);

  return {
    metadata,
    isLoading,
    error,
    enrichReference,
    getMetadata,
  };
}