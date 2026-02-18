"use client"

/**
 * ReferenceItem component
 * Displays single reference in 4-line format
 */

import type { ParsedReference } from '@/lib/types/citation';

interface ReferenceItemProps {
  reference: ParsedReference;
  linkColor: string;
}

/**
 * Format authors for display (first 3 + "et al.")
 */
function formatAuthors(authors: string[]): string {
  if (authors.length === 0) return 'Unknown Authors';
  if (authors.length <= 3) return authors.join(', ');
  return `${authors.slice(0, 3).join(', ')}, et al.`;
}

/**
 * Get journal abbreviation for badge
 */
function getJournalAbbreviation(journal: string): string {
  const abbrevMap: Record<string, string> = {
    'journal of the american college of cardiology': 'JACC',
    'journal of the american medical association': 'JAMA',
    'new england journal of medicine': 'NEJM',
    'british medical journal': 'BMJ',
    'the lancet': 'Lancet',
  };
  
  const journalLower = journal.toLowerCase();
  for (const [full, abbrev] of Object.entries(abbrevMap)) {
    if (journalLower.includes(full)) {
      return abbrev;
    }
  }
  
  // Return first 20 characters if no abbreviation found
  return journal.length > 20 ? journal.substring(0, 20) + '...' : journal;
}

import { memo } from 'react';

export const ReferenceItem = memo(function ReferenceItem({ reference, linkColor }: ReferenceItemProps) {
  return (
    <div 
      id={`ref-${reference.number}`} 
      className="reference-item scroll-mt-20 target:bg-yellow-50 transition-colors duration-300"
      role="article"
      aria-label={`Reference ${reference.number}: ${reference.title}`}
    >
      {/* Line 1: Number + Title (clickable) */}
      <div className="reference-title-line mb-1">
        <span className="reference-number font-semibold text-gray-700">
          {reference.number}.{' '}
        </span>
        {reference.url ? (
          <a
            href={reference.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: linkColor }}
            className="reference-title-link font-medium hover:underline"
          >
            {reference.title}
          </a>
        ) : (
          <span className="reference-title-text font-medium text-gray-900">
            {reference.title}
          </span>
        )}
      </div>
      
      {/* Line 2: Authors */}
      <div className="reference-authors text-gray-600 mb-1">
        {formatAuthors(reference.authors)}
      </div>
      
      {/* Line 3: Journal badge + Year + Volume/Issue/Pages + DOI */}
      <div className="reference-meta-line text-sm text-gray-600 mb-2 flex flex-wrap items-center gap-2">
        <span className="journal-badge inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
          {getJournalAbbreviation(reference.journal)}
        </span>
        <span className="reference-year">{reference.year}</span>
        {reference.volume && (
          <span className="reference-volume">
            ;{reference.volume}
            {reference.issue && `(${reference.issue})`}
            {reference.pages && `:${reference.pages}`}
          </span>
        )}
        {reference.doi && (
          <>
            <span>.</span>
            <a
              href={`https://doi.org/${reference.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: linkColor }}
              className="hover:underline"
            >
              doi:{reference.doi}
            </a>
          </>
        )}
      </div>
      
      {/* Line 4: Quality badges */}
      {reference.badges.length > 0 && (
        <div className="reference-quality-badges flex flex-wrap gap-1.5">
          {reference.badges.map(badge => (
            <span 
              key={badge} 
              className="quality-badge inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-white text-gray-700 border border-gray-200 shadow-sm"
            >
              {badge === 'Practice Guideline' && '📋 '}
              {badge === 'Leading Journal' && '⭐ '}
              {badge === 'Recent' && '🆕 '}
              {badge === 'Systematic Review' && '📊 '}
              {badge === 'Meta-Analysis' && '📈 '}
              {badge === 'Highly Cited' && '🔥 '}
              {badge}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});
