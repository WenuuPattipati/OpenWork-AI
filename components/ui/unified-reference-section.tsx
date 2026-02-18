/**
 * Unified Reference Section
 * Displays all references with quality badges and proper formatting
 * Works with unified citation parser
 */

"use client";

import type { ParsedReference, CitationMode } from '@/lib/types/citation';

interface UnifiedReferenceSectionProps {
  references: ParsedReference[];
  mode: CitationMode;
}

export function UnifiedReferenceSection({ references, mode }: UnifiedReferenceSectionProps) {
  if (references.length === 0) return null;
  
  // Filter out invalid references
  const validRefs = references.filter(ref => ref.isValid);
  
  if (validRefs.length === 0) return null;
  
  // Color scheme based on mode - both modes use blue for better readability
  const linkColor = 'text-blue-600 hover:text-blue-800';
  
  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-6 font-ui flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        References
      </h3>
      
      <div className="space-y-4 font-ui">
        {validRefs.map((ref) => (
          <div
            key={ref.id}
            id={`ref-${ref.number}`}
            className="scroll-mt-20 p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
          >
            {/* Reference Number */}
            <div className="flex gap-3">
              <div className="shrink-0 w-7 h-7 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-sm font-semibold">
                {ref.number}
              </div>
              
              <div className="flex-1 min-w-0">
                {/* Title */}
                {ref.url ? (
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-base font-medium ${linkColor} hover:underline block mb-1`}
                  >
                    {ref.title}
                  </a>
                ) : (
                  <p className="text-base font-medium text-gray-900 mb-1">
                    {ref.title}
                  </p>
                )}
                
                {/* Metadata */}
                <div className="text-sm text-gray-600 space-y-1">
                  {/* Image Attribution - Special handling for image references */}
                  {ref.imageSource && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-900">
                        {ref.imageSource === 'Open-i' && (
                          <>
                            <span className="font-medium">Source:</span> Open-i, National Library of Medicine
                          </>
                        )}
                        {ref.imageSource === 'InjuryMap' && (
                          <>
                            <span className="font-medium">Source:</span> InjuryMap Free Human Anatomy Illustrations
                          </>
                        )}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">License:</span>{' '}
                        {ref.imageSource === 'Open-i' && 'Free for reuse with attribution'}
                        {ref.imageSource === 'InjuryMap' && 'CC BY 4.0 (Creative Commons Attribution 4.0 International)'}
                      </p>
                      <p className="text-xs text-gray-600 italic">
                        {ref.imageSource === 'Open-i' && 'Image from Open-i, a service of the U.S. National Library of Medicine. Free for reuse with attribution.'}
                        {ref.imageSource === 'InjuryMap' && 'Image from InjuryMap. Licensed under CC BY 4.0. Attribution required when reusing.'}
                      </p>
                    </div>
                  )}
                  
                  {/* Regular Reference Metadata - Only show for non-image references */}
                  {!ref.imageSource && (
                    <>
                      {/* Authors */}
                      {ref.authors.length > 0 && (
                        <p>
                          {ref.authors.join(', ')}
                          {ref.authors.length >= 3 && ', et al.'}
                        </p>
                      )}
                      
                      {/* Journal and Year */}
                      {(ref.journal || ref.year) && (
                        <p>
                          {ref.journal && <span className="font-medium">{ref.journal}</span>}
                          {ref.journal && ref.year && '. '}
                          {ref.year}
                          {ref.year && '.'}
                        </p>
                      )}
                      
                      {/* Identifiers - Clickable Links */}
                      {(ref.pmid || ref.pmcid || ref.doi) && (
                        <p className="text-xs text-gray-500">
                          {ref.pmid && <a href={`https://pubmed.ncbi.nlm.nih.gov/${ref.pmid}/`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline transition-colors">PMID: {ref.pmid}</a>}
                          {ref.pmid && (ref.pmcid || ref.doi) && ' • '}
                          {ref.pmcid && <a href={`https://www.ncbi.nlm.nih.gov/pmc/articles/${ref.pmcid}/`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline transition-colors">PMCID: {ref.pmcid}</a>}
                          {ref.pmcid && ref.doi && ' • '}
                          {ref.doi && <a href={`https://doi.org/${ref.doi}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline transition-colors">DOI: {ref.doi}</a>}
                        </p>
                      )}
                    </>
                  )}
                </div>
                
                {/* Quality Badges and Image Badge */}
                {(ref.badges.length > 0 || ref.imageSource) && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {/* Image Badge - Always first if present */}
                    {ref.imageSource && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Image
                        {ref.imageSource === 'Open-i' && ' (Open-i)'}
                        {ref.imageSource === 'InjuryMap' && ' (InjuryMap)'}
                      </span>
                    )}
                    
                    {/* Quality Badges */}
                    {ref.badges.map((badge, idx) => {
                      // Badge color based on type
                      let badgeClass = 'bg-gray-100 text-gray-700';
                      
                      if (badge === 'PMCID') {
                        badgeClass = 'bg-indigo-100 text-indigo-700 border border-indigo-200';
                      } else if (badge === 'Practice Guideline') {
                        badgeClass = 'bg-blue-100 text-blue-700';
                      } else if (badge === 'Systematic Review') {
                        badgeClass = 'bg-amber-100 text-amber-700';
                      } else if (badge === 'Recent') {
                        badgeClass = 'bg-green-100 text-green-700';
                      } else if (badge === 'Leading Journal') {
                        badgeClass = 'bg-purple-100 text-purple-700';
                      }
                      
                      return (
                        <span
                          key={idx}
                          className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${badgeClass}`}
                        >
                          {badge}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
