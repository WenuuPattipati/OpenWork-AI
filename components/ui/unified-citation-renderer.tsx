/**
 * Unified Citation Renderer
 * Implements PECS (Parse, Extract, Convert, Show) architecture
 * Renders content with inline Sources badges instead of superscript citations
 */

"use client";

import { useMemo, useEffect } from 'react';
import type { ParsedReference, CitationMode } from '@/lib/types/citation';
import { parseResponse, cleanCitationMarkers, extractCitationNumbers } from '@/lib/citation/unified-parser';
import { SourcesBadge } from './sources-badge';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

interface UnifiedCitationRendererProps {
  content: string;
  mode: CitationMode;
  onViewReferences?: () => void;
  onComplete?: () => void;
}

interface ParagraphWithCitations {
  text: string;
  citationNumbers: number[];
}

export function UnifiedCitationRenderer({
  content,
  mode,
  onViewReferences,
  onComplete
}: UnifiedCitationRendererProps) {
  // Parse response using unified parser
  const { mainContent, references } = useMemo(() => {
    return parseResponse(content, mode);
  }, [content, mode]);
  
  // Process content into paragraphs with citation tracking
  const paragraphs = useMemo(() => {
    const paras: ParagraphWithCitations[] = [];
    
    // Split by double newlines (paragraphs)
    const rawParagraphs = mainContent.split(/\n\n+/);
    
    rawParagraphs.forEach(para => {
      const trimmed = para.trim();
      if (!trimmed) return;
      
      // Extract citation numbers from this paragraph
      const citationNumbers = extractCitationNumbers(trimmed);
      
      // Clean citation markers for display
      const cleanText = cleanCitationMarkers(trimmed);
      
      if (cleanText) {
        paras.push({
          text: cleanText,
          citationNumbers
        });
      }
    });
    
    return paras;
  }, [mainContent]);
  
  // Get references for a paragraph
  const getReferencesForParagraph = (citationNumbers: number[]): ParsedReference[] => {
    return citationNumbers
      .map(num => references.find(r => r.number === num))
      .filter((ref): ref is ParsedReference => ref !== undefined);
  };
  
  // Call onComplete after rendering
  useEffect(() => {
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);
  
  return (
    <div className="unified-citation-content">
      {/* Render paragraphs with Sources badges */}
      <div className="prose prose-sm max-w-none">
        {paragraphs.map((para, index) => (
          <div key={index} className="mb-5">
            {/* Paragraph text */}
            <ReactMarkdown
              rehypePlugins={[rehypeRaw as any]}
              components={{
                // Inline elements - no wrapping
                p: ({ children }) => <span className="inline">{children}</span>,
                strong: ({ children }) => (
                  <strong className="font-semibold text-gray-900">{children}</strong>
                ),
                em: ({ children }) => <em>{children}</em>,
                code: ({ children }) => (
                  <code className="bg-blue-50 px-2 py-0.5 rounded text-sm font-mono text-blue-700 border border-blue-200">
                    {children}
                  </code>
                ),
                
                // Block elements
                h1: ({ children }) => (
                  <h1 className="text-2xl font-bold mt-8 mb-4 text-gray-900 font-serif">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-bold mt-6 mb-3 text-gray-900 font-serif">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-900 font-serif">
                    {children}
                  </h3>
                ),
                
                // Lists
                ul: ({ children }) => (
                  <ul className="list-disc pl-6 my-3 space-y-1">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-6 my-3 space-y-1">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-gray-700">{children}</li>
                ),
                
                // Links
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${mode === 'doctor' ? 'text-blue-600 hover:text-blue-800' : 'text-purple-600 hover:text-purple-800'} underline`}
                  >
                    {children}
                  </a>
                ),
                
                // Blockquote
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 italic bg-blue-50 rounded-r">
                    {children}
                  </blockquote>
                )
              }}
            >
              {para.text}
            </ReactMarkdown>
            
            {/* Sources badge at end of paragraph */}
            {para.citationNumbers.length > 0 && (
              <SourcesBadge
                badge={{
                  id: `para-${index}`,
                  label: 'Sources',
                  refNumbers: para.citationNumbers,
                  mode
                }}
                references={getReferencesForParagraph(para.citationNumbers)}
                onViewReferences={onViewReferences}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
