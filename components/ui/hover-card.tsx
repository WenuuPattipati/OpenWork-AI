"use client"

/**
 * Enhanced HoverCard component
 * Displays reference details with direct clickable links
 * Redesigned for better UX - no need to scroll to reference section
 */

import { useRef, useEffect } from 'react';
import type { ParsedReference } from '@/lib/types/citation';

interface HoverCardProps {
  references: ParsedReference[];
  colors: { bg: string; border: string; link: string };
  onViewReferences?: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function HoverCard({ 
  references, 
  colors, 
  onViewReferences, 
  onMouseEnter, 
  onMouseLeave 
}: HoverCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Adjust position if extends beyond viewport
  useEffect(() => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        cardRef.current.style.right = '0';
        cardRef.current.style.left = 'auto';
      }
    }
  }, []);
  
  return (
    <div
      ref={cardRef}
      className="absolute top-full left-0 mt-2 w-[480px] max-w-screen-sm bg-white rounded-xl shadow-2xl border-2 z-50 overflow-hidden"
      style={{ 
        borderColor: colors.border,
        boxShadow: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px ${colors.border}20`
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Header with gradient */}
      <div 
        className="px-5 py-4 border-b border-gray-200"
        style={{
          background: `linear-gradient(135deg, ${colors.bg}10 0%, ${colors.bg}05 100%)`
        }}
      >
        <div className="flex items-center justify-between">
          <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5" style={{ color: colors.link }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            {references.length} {references.length === 1 ? 'Source' : 'Sources'}
          </h4>
          <span className="text-xs text-gray-500 font-medium">Click to open</span>
        </div>
      </div>
      
      {/* Content - Enhanced reference cards */}
      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {references.map((ref, idx) => (
          <div
            key={ref.id}
            className="px-5 py-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
          >
            <div className="flex gap-3">
              {/* Reference Number Badge */}
              <div 
                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm"
                style={{ 
                  backgroundColor: `${colors.bg}15`,
                  color: colors.link,
                  border: `2px solid ${colors.border}30`
                }}
              >
                {ref.number}
              </div>
              
              {/* Reference Content */}
              <div className="flex-1 min-w-0">
                {/* Title - Clickable */}
                {ref.url ? (
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm font-semibold hover:underline line-clamp-2 mb-1.5 group"
                    style={{ color: colors.link }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {ref.title}
                    <svg className="inline-block w-3.5 h-3.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ) : (
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1.5">
                    {ref.title}
                  </p>
                )}
                
                {/* Metadata */}
                {(ref.authors.length > 0 || ref.journal || ref.year) && (
                  <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                    {ref.authors.length > 0 && (
                      <span className="font-medium">
                        {ref.authors.slice(0, 2).join(', ')}
                        {ref.authors.length > 2 && ', et al.'}
                      </span>
                    )}
                    {ref.authors.length > 0 && (ref.journal || ref.year) && ' • '}
                    {ref.journal && <span>{ref.journal}</span>}
                    {ref.journal && ref.year && ' • '}
                    {ref.year && <span>{ref.year}</span>}
                  </p>
                )}
                
                {/* Quality Badges */}
                {ref.badges.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {ref.badges.slice(0, 3).map((badge, badgeIdx) => {
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
                          key={badgeIdx}
                          className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${badgeClass}`}
                        >
                          {badge}
                        </span>
                      );
                    })}
                  </div>
                )}
                
                {/* Identifiers - Clickable */}
                {(ref.pmid || ref.doi) && (
                  <div className="flex gap-2 mt-2 text-xs">
                    {ref.pmid && (
                      <a
                        href={`https://pubmed.ncbi.nlm.nih.gov/${ref.pmid}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 transition-colors font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        PMID: {ref.pmid}
                      </a>
                    )}
                    {ref.doi && (
                      <a
                        href={`https://doi.org/${ref.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100 transition-colors font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        DOI
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Footer - Optional full reference view */}
      {onViewReferences && (
        <div 
          className="px-5 py-3 border-t border-gray-200 bg-gray-50"
          style={{
            background: `linear-gradient(135deg, ${colors.bg}05 0%, transparent 100%)`
          }}
        >
          <button
            onClick={onViewReferences}
            className="w-full text-sm font-semibold hover:underline flex items-center justify-center gap-2 py-1 rounded transition-colors"
            style={{ color: colors.link }}
          >
            View complete reference list
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }
      `}</style>
    </div>
  );
}