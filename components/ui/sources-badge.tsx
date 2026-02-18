"use client"

/**
 * SourcesBadge component
 * Displays inline "Sources" badge with hover interaction
 */

import { useState, useRef, useEffect } from 'react';
import type { SourcesBadgeData, ParsedReference } from '@/lib/types/citation';
import { HoverCard } from './hover-card';

interface SourcesBadgeProps {
  badge: SourcesBadgeData;
  references: ParsedReference[];
  onViewReferences?: () => void;
}

export function SourcesBadge({ badge, references, onViewReferences }: SourcesBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const badgeRef = useRef<HTMLButtonElement>(null);

  // Get references for this badge
  const badgeRefs = badge.refNumbers
    .map(num => references.find(r => r.number === num))
    .filter((ref): ref is ParsedReference => ref !== undefined);

  // Cleanup timeout on unmount - MUST be before any conditional returns
  useEffect(() => {
    return () => {
      if (hoverTimeout) clearTimeout(hoverTimeout);
    };
  }, [hoverTimeout]);

  // Don't render badge if there are no references
  if (badgeRefs.length === 0) {
    return null;
  }

  // Color scheme based on mode
  const colors = badge.mode === 'doctor'
    ? { bg: '#3B82F6', border: '#3B82F6', link: '#2563EB' }
    : { bg: '#6366F1', border: '#6366F1', link: '#4F46E5' };

  // Hover handlers with delay
  const handleMouseEnter = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    const timeout = setTimeout(() => setIsOpen(true), 200);
    setHoverTimeout(timeout);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    const timeout = setTimeout(() => setIsOpen(false), 300);
    setHoverTimeout(timeout);
  };

  // Click handler
  const handleClick = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    setIsOpen(!isOpen);
  };

  // Keyboard handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <span className="relative inline-block ml-1.5">
      <button
        ref={badgeRef}
        className="sources-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-1 group"
        style={{
          backgroundColor: 'white',
          color: colors.link,
          border: `1.5px solid ${colors.border}`,
          boxShadow: `0 1px 3px ${colors.border}15`
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={`Sources badge with ${badgeRefs.length} reference${badgeRefs.length !== 1 ? 's' : ''}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        data-citation-numbers={badge.refNumbers.join(',')}
      >
        <svg
          className="w-3 h-3 transition-transform group-hover:scale-110"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <span className="text-xs">{badge.label}</span>
        <span
          className="inline-flex items-center justify-center w-4 h-4 rounded-full text-xs font-semibold transition-colors"
          style={{
            backgroundColor: colors.bg,
            color: 'white'
          }}
        >
          {badgeRefs.length}
        </span>
      </button>

      {isOpen && badgeRefs.length > 0 && (
        <HoverCard
          references={badgeRefs}
          colors={colors}
          onViewReferences={onViewReferences}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      )}
    </span>
  );
}
