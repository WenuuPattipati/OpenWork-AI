/**
 * Unified Response Renderer
 * Complete response rendering with PECS citation system
 * Works for both Doctor and General modes
 */

"use client";

import { useState, useMemo } from 'react';
import type { CitationMode } from '@/lib/types/citation';
import { parseResponse } from '@/lib/citation/unified-parser';
import { UnifiedCitationRenderer } from './unified-citation-renderer';
import { UnifiedReferenceSection } from './unified-reference-section';

interface UnifiedResponseRendererProps {
  response: string;
  mode: CitationMode;
  onComplete?: () => void;
  showFollowUpQuestions?: boolean;
  conversationId?: string;
  onQuestionSelect?: (question: string) => void;
}

export function UnifiedResponseRenderer({
  response,
  mode,
  onComplete,
  showFollowUpQuestions = true,
  conversationId,
  onQuestionSelect
}: UnifiedResponseRendererProps) {
  const [copied, setCopied] = useState(false);
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [showReferences, setShowReferences] = useState(false);
  
  // Parse response
  const { mainContent, references, followUpQuestions } = useMemo(() => {
    return parseResponse(response, mode);
  }, [response, mode]);
  
  // Scroll to references
  const handleViewReferences = () => {
    setShowReferences(true);
    setTimeout(() => {
      const refsElement = document.getElementById('references-section');
      if (refsElement) {
        refsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };
  
  // Copy to clipboard - Only copy main content and references, exclude follow-up questions
  const handleCopy = () => {
    // Build the text to copy: main content + references (no follow-up questions)
    let textToCopy = mainContent;
    
    // Add references section if we have references
    if (references.length > 0) {
      textToCopy += '\n\n## References\n\n';
      
      references.forEach((ref) => {
        if (!ref.isValid) return;
        
        // Format reference based on type
        if (ref.imageSource) {
          // Image reference format
          textToCopy += `${ref.number}. ${ref.title}. Image from ${ref.imageSource}`;
          if (ref.imageSource === 'Open-i') {
            textToCopy += ', National Library of Medicine';
          }
          if (ref.url) {
            textToCopy += `. ${ref.url}`;
          }
          textToCopy += '\n\n';
        } else {
          // Regular reference format
          textToCopy += `${ref.number}. ${ref.title}\n`;
          
          if (ref.authors.length > 0) {
            textToCopy += `   ${ref.authors.join(', ')}`;
            if (ref.authors.length >= 3) textToCopy += ', et al.';
            textToCopy += '\n';
          }
          
          if (ref.journal || ref.year) {
            textToCopy += '   ';
            if (ref.journal) textToCopy += ref.journal;
            if (ref.journal && ref.year) textToCopy += '. ';
            if (ref.year) textToCopy += ref.year + '.';
            textToCopy += '\n';
          }
          
          if (ref.pmid || ref.pmcid || ref.doi) {
            textToCopy += '   ';
            if (ref.pmid) textToCopy += `PMID: ${ref.pmid}`;
            if (ref.pmid && (ref.pmcid || ref.doi)) textToCopy += ' • ';
            if (ref.pmcid) textToCopy += `PMCID: ${ref.pmcid}`;
            if (ref.pmcid && ref.doi) textToCopy += ' • ';
            if (ref.doi) textToCopy += `DOI: ${ref.doi}`;
            textToCopy += '\n';
          }
          
          textToCopy += '\n';
        }
      });
    }
    
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Handle helpful feedback
  const handleHelpful = (isHelpful: boolean) => {
    setHelpful(isHelpful);
    
    if (isHelpful && conversationId) {
      // Save to favorites
      const { saveFavorite } = require('@/lib/storage');
      saveFavorite({
        id: `fav_${Date.now()}`,
        conversationId,
        title: mainContent.substring(0, 50) + '...',
        preview: mainContent.substring(0, 150) + '...',
        timestamp: new Date()
      });
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Main Response with Citations */}
      <UnifiedCitationRenderer
        content={response}
        mode={mode}
        onViewReferences={handleViewReferences}
        onComplete={onComplete}
      />
      
      {/* Action Buttons */}
      <div className="flex items-center justify-between font-ui py-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Was this helpful?</span>
          <button
            onClick={() => handleHelpful(true)}
            className={`p-2 rounded transition-colors ${
              helpful === true
                ? 'bg-green-100 text-green-700'
                : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
            }`}
            title="Helpful"
          >
            <svg className="w-5 h-5" fill={helpful === true ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
          </button>
          <button
            onClick={() => handleHelpful(false)}
            className={`p-2 rounded transition-colors ${
              helpful === false
                ? 'bg-red-100 text-red-700'
                : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
            }`}
            title="Not helpful"
          >
            <svg className="w-5 h-5" fill={helpful === false ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
            </svg>
          </button>
        </div>
        
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-600">Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      
      {/* Disclaimer */}
      <div className="p-4 bg-gray-50 border border-gray-300 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all duration-300 group">
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-sm text-gray-600 font-ui">
            <p className="font-semibold mb-1 text-gray-700">
              {mode === 'doctor' ? 'AI-Generated Evidence-Based Response' : 'Important Health Information Notice'}
            </p>
            <p className="text-gray-600 leading-relaxed">
              {mode === 'doctor' 
                ? 'This response is generated using evidence from peer-reviewed literature, clinical guidelines, and medical databases. While we strive for accuracy, AI can make mistakes. Please verify critical information with primary sources and apply your clinical judgment. This tool is designed to assist research and evidence synthesis, not replace professional medical decision-making.'
                : 'This is an AI-generated research synthesis for educational purposes only. It summarizes and analyzes research papers and medical literature. This tool helps save time by finding and synthesizing relevant research articles. It is not a substitute for professional medical consultation. For health concerns, please consult with a qualified healthcare provider.'
              }
            </p>
          </div>
        </div>
      </div>
      
      {/* References Section */}
      <div id="references-section">
        <UnifiedReferenceSection references={references} mode={mode} />
      </div>
      
      {/* Follow-up Questions */}
      {showFollowUpQuestions && followUpQuestions.length > 0 && (
        <div className="mt-8">
          <h4 className="text-xl font-semibold text-gray-900 mb-4 font-ui flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            You Might Also Want to Know
          </h4>
          <div className="space-y-3">
            {followUpQuestions.map((question, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (onQuestionSelect) {
                    onQuestionSelect(question);
                    // Scroll to top of input or page if needed
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } else {
                    // Fallback for when callback is not provided
                    const inputElement = document.querySelector('textarea[placeholder*="Ask"]') as HTMLTextAreaElement;
                    if (inputElement) {
                      inputElement.value = question;
                      inputElement.focus();
                      // Trigger input event to update React state
                      const event = new Event('input', { bubbles: true });
                      inputElement.dispatchEvent(event);
                    }
                  }
                }}
                className="w-full text-left p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold shrink-0 group-hover:bg-blue-200 transition-colors">{idx + 1}</span>
                  <span className="text-gray-700 group-hover:text-gray-900 font-ui text-[15px] leading-relaxed transition-colors">
                    {question}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
