"use client"

/**
 * ReferencePreview component
 * Displays compact reference info in hover card
 */

import type { ParsedReference } from '@/lib/types/citation';

interface ReferencePreviewProps {
  reference: ParsedReference;
  linkColor: string;
  showDivider: boolean;
}

export function ReferencePreview({ reference, linkColor, showDivider }: ReferencePreviewProps) {
  const formatAuthors = (authors: string[]): string => {
    if (authors.length === 0) return 'Unknown Authors';
    if (authors.length <= 3) return authors.join(', ');
    return `${authors.slice(0, 3).join(', ')}, et al.`;
  };

  return (
    <div className="px-4 py-3">
      <div className="flex gap-3">
        {/* Reference Number */}
        <div className="shrink-0 w-6 h-6 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-xs font-semibold">
          {reference.number}
        </div>

        {/* Reference Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          {reference.url ? (
            <a
              href={reference.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: linkColor }}
              className="text-sm font-medium hover:underline line-clamp-2 block"
            >
              {reference.title}
            </a>
          ) : (
            <p className="text-sm font-medium text-gray-900 line-clamp-2">
              {reference.title}
            </p>
          )}

          {/* Authors and Journal */}
          {(reference.authors.length > 0 || reference.journal || reference.year) && (
            <p className="text-xs text-gray-600 mt-1">
              {reference.authors.length > 0 && (
                <span>{formatAuthors(reference.authors)}. </span>
              )}
              {reference.journal && <span>{reference.journal}. </span>}
              {reference.year && <span>{reference.year}.</span>}
            </p>
          )}

          {/* Quality Badges */}
          {reference.badges.length > 0 && (
            <div className="flex gap-1 mt-2">
              {reference.badges.map(badge => (
                <span
                  key={badge}
                  className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      {showDivider && (
        <div className="mt-3 border-b border-gray-200"></div>
      )}
    </div>
  );
}