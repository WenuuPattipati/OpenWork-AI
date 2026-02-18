"use client"

/**
 * Response Actions Component
 * Displays action buttons for user interaction with AI responses
 * - Helpful/Not Helpful feedback
 * - Save to Collection
 * - Copy Answer to clipboard
 */

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, FolderPlus, Copy, Check } from 'lucide-react';

interface ResponseActionsProps {
  responseContent: {
    clinical: string;
    diagnosis: string;
    treatment: string;
    references: string;
  };
  onSaveToCollection?: () => void;
  onFeedback?: (helpful: boolean) => void;
}

export function ResponseActions({ 
  responseContent, 
  onSaveToCollection,
  onFeedback 
}: ResponseActionsProps) {
  const [feedback, setFeedback] = useState<'helpful' | 'not-helpful' | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFeedback = (helpful: boolean) => {
    const newFeedback = helpful ? 'helpful' : 'not-helpful';
    setFeedback(newFeedback);
    onFeedback?.(helpful);
  };

  const handleCopy = async () => {
    try {
      // Format the content for copying (all tabs + references, no images)
      const textToCopy = `
# Clinical Analysis

${responseContent.clinical}

# Diagnosis & Logic

${responseContent.diagnosis}

# Treatment & Safety

${responseContent.treatment}

# References

${responseContent.references}
`.trim();

      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="flex items-center justify-center gap-3 py-4 border-t border-gray-200">
      {/* Feedback Buttons */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 mr-2">Was this helpful?</span>
        <button
          onClick={() => handleFeedback(true)}
          className={`p-2 rounded-lg transition-all ${
            feedback === 'helpful'
              ? 'bg-green-100 text-green-700 border-2 border-green-500'
              : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600 border border-gray-300'
          }`}
          aria-label="Mark as helpful"
          title="Helpful"
        >
          <ThumbsUp className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleFeedback(false)}
          className={`p-2 rounded-lg transition-all ${
            feedback === 'not-helpful'
              ? 'bg-red-100 text-red-700 border-2 border-red-500'
              : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 border border-gray-300'
          }`}
          aria-label="Mark as not helpful"
          title="Not Helpful"
        >
          <ThumbsDown className="w-4 h-4" />
        </button>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-gray-300" />

      {/* Save to Collection */}
      {onSaveToCollection && (
        <button
          onClick={onSaveToCollection}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all border border-blue-200"
          aria-label="Save to collection"
        >
          <FolderPlus className="w-4 h-4" />
          <span className="text-sm font-medium">Save</span>
        </button>
      )}

      {/* Copy Answer */}
      <button
        onClick={handleCopy}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all border ${
          copied
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200'
        }`}
        aria-label="Copy answer to clipboard"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            <span className="text-sm font-medium">Copy</span>
          </>
        )}
      </button>
    </div>
  );
}
