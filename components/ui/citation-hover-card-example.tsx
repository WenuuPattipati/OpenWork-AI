/**
 * Citation Hover Card Component Example
 * 
 * Shows how the same citation system works in both Doctor Mode and General Mode
 * This component would handle hover cards for source badges and reference links
 */

import React from 'react';

interface CitationData {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: string;
  url: string;
  pmid?: string;
  doi?: string;
  source: string;
  badges: string[];
  summary: string;
  type: 'guideline' | 'article' | 'review' | 'consumer-info';
}

interface CitationHoverCardProps {
  citation: CitationData;
  mode: 'doctor' | 'general';
  children: React.ReactNode;
}

export function CitationHoverCard({ citation, mode, children }: CitationHoverCardProps) {
  return (
    <div className="relative group">
      {/* Trigger element (source badge or reference link) */}
      <div className="cursor-pointer">
        {children}
      </div>
      
      {/* Hover card - same structure for both modes */}
      <div className="absolute z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 bottom-full left-1/2 transform -translate-x-1/2 mb-2">
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
          {/* Article title - clickable link */}
          <h3 className="font-semibold text-sm mb-2">
            <a 
              href={citation.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              {citation.title}
            </a>
          </h3>
          
          {/* Authors */}
          <p className="text-xs text-gray-600 mb-1">
            {citation.authors.slice(0, 3).join(', ')}
            {citation.authors.length > 3 && ' et al.'}
          </p>
          
          {/* Journal and year */}
          <p className="text-xs text-gray-600 mb-2">
            {citation.journal} ({citation.year})
          </p>
          
          {/* Identifiers */}
          <div className="text-xs text-gray-500 mb-2">
            {citation.pmid && (
              <span className="mr-3">PMID: {citation.pmid}</span>
            )}
            {citation.doi && (
              <span>DOI: {citation.doi}</span>
            )}
          </div>
          
          {/* Source badges - same system for both modes */}
          <div className="flex flex-wrap gap-1 mb-2">
            {citation.badges.map((badge, index) => (
              <span
                key={index}
                className={`px-2 py-1 text-xs rounded-full ${getBadgeStyle(badge, mode)}`}
              >
                {badge}
              </span>
            ))}
          </div>
          
          {/* Summary - adapted for mode */}
          <p className="text-xs text-gray-700">
            {mode === 'general' 
              ? simplifyForConsumers(citation.summary)
              : citation.summary
            }
          </p>
        </div>
        
        {/* Arrow pointing down */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2">
          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-200"></div>
        </div>
      </div>
    </div>
  );
}

/**
 * Get badge styling based on badge type and mode
 */
function getBadgeStyle(badge: string, mode: 'doctor' | 'general'): string {
  const baseStyle = 'font-medium';
  
  switch (badge) {
    case 'Trusted Source':
      return `${baseStyle} bg-green-100 text-green-800`;
    case 'Medical Guideline':
      return `${baseStyle} bg-blue-100 text-blue-800`;
    case 'Research Study':
      return `${baseStyle} bg-purple-100 text-purple-800`;
    case 'Systematic Review':
      return `${baseStyle} bg-indigo-100 text-indigo-800`;
    case 'Recent (≤3y)':
      return `${baseStyle} bg-orange-100 text-orange-800`;
    case 'High-Quality Evidence':
      return `${baseStyle} bg-emerald-100 text-emerald-800`;
    case 'Cochrane':
      return `${baseStyle} bg-yellow-100 text-yellow-800`;
    default:
      return `${baseStyle} bg-gray-100 text-gray-800`;
  }
}

/**
 * Simplify technical summaries for general mode users
 */
function simplifyForConsumers(summary: string): string {
  // Simple text transformations for consumer readability
  return summary
    .replace(/\b(systematic review|meta-analysis)\b/gi, 'research study')
    .replace(/\b(randomized controlled trial|RCT)\b/gi, 'clinical study')
    .replace(/\b(participants|subjects)\b/gi, 'people')
    .replace(/\b(efficacy)\b/gi, 'effectiveness')
    .replace(/\b(adverse events)\b/gi, 'side effects')
    .substring(0, 150) + (summary.length > 150 ? '...' : '');
}

/**
 * Example usage in both modes
 */
export function ExampleUsage() {
  // Example citation data (same structure for both modes)
  const exampleCitation: CitationData = {
    id: 'who-1',
    title: 'WHO Guidelines on Physical Activity and Sedentary Behaviour',
    authors: ['World Health Organization'],
    journal: 'WHO Guidelines',
    year: '2020',
    url: 'https://www.who.int/publications/i/item/9789240015128',
    source: 'WHO',
    badges: ['Trusted Source', 'Medical Guideline', 'Recent (≤3y)'],
    summary: 'These guidelines provide evidence-based public health recommendations for children, adolescents, adults and older adults on the amount of physical activity required for health benefits.',
    type: 'guideline'
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Citation System Examples</h2>
      
      {/* Doctor Mode Example */}
      <div className="p-4 border rounded-lg">
        <h3 className="font-medium mb-2">Doctor Mode</h3>
        <p className="text-sm">
          Regular physical activity reduces cardiovascular mortality by 30-35%{' '}
          <CitationHoverCard citation={exampleCitation} mode="doctor">
            <span className="text-blue-600 hover:underline cursor-pointer">[[1]]</span>
          </CitationHoverCard>
          . The WHO recommends 150-300 minutes of moderate-intensity aerobic activity weekly.
        </p>
      </div>
      
      {/* General Mode Example */}
      <div className="p-4 border rounded-lg">
        <h3 className="font-medium mb-2">General Mode</h3>
        <p className="text-sm">
          Moving your body regularly can cut your risk of heart problems by about a third{' '}
          <CitationHoverCard citation={exampleCitation} mode="general">
            <span className="text-blue-600 hover:underline cursor-pointer">[[1]]</span>
          </CitationHoverCard>
          . Health experts recommend walking or similar exercise for 20-40 minutes most days.
        </p>
      </div>
      
      {/* Source Badge Example */}
      <div className="p-4 border rounded-lg">
        <h3 className="font-medium mb-2">Source Badge Hover</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm">Source:</span>
          <CitationHoverCard citation={exampleCitation} mode="general">
            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full cursor-pointer hover:bg-green-200">
              WHO Guidelines
            </span>
          </CitationHoverCard>
        </div>
      </div>
    </div>
  );
}

export default CitationHoverCard;