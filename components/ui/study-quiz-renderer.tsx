'use client';

/**
 * Study Quiz Renderer
 * 
 * Renders evidence-based medical quizzes in Study Mode.
 * Features progressive question reveal, immediate feedback, and source citations.
 */

import React, { useState } from 'react';
import { StudyModeQuiz, StudyModeQuestion, parseStudyModeQuiz } from '@/lib/prompts/study-mode-prompt';
import { UnifiedCitationRenderer } from './unified-citation-renderer';
import { UnifiedReferenceSection } from './unified-reference-section';
import { ParsedReference, QualityBadge } from '@/lib/types/citation';

interface StudyQuizRendererProps {
  quizResponse: string;
  isComplete: boolean;
}

interface QuestionState {
  selectedAnswer: 'A' | 'B' | 'C' | 'D' | null;
  revealed: boolean;
}

export function StudyQuizRenderer({ quizResponse, isComplete }: StudyQuizRendererProps) {
  const [questionStates, setQuestionStates] = useState<Record<number, QuestionState>>({});
  const [showSummary, setShowSummary] = useState(false);

  // Parse quiz from response
  const quiz = parseStudyModeQuiz(quizResponse);

  if (!quiz) {
    // If parsing fails, show raw response or loading state
    if (!isComplete) {
      return (
        <div className="flex items-center gap-3 p-4">
          <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
          <span className="text-gray-600">Generating quiz...</span>
        </div>
      );
    }
    return (
      <div className="p-4 text-gray-700">
        <p className="text-sm text-gray-500">Unable to parse quiz format. Displaying raw response:</p>
        <pre className="mt-2 p-3 bg-gray-50 rounded-lg text-sm overflow-x-auto">{quizResponse}</pre>
      </div>
    );
  }

  const handleSelectAnswer = (questionId: number, answer: 'A' | 'B' | 'C' | 'D') => {
    setQuestionStates(prev => ({
      ...prev,
      [questionId]: {
        selectedAnswer: answer,
        revealed: true,
      }
    }));
  };

  const allQuestionsAnswered = quiz.questions.every(q => questionStates[q.id]?.revealed);

  // Show summary automatically when all questions are answered
  if (allQuestionsAnswered && !showSummary) {
    setShowSummary(true);
  }

  const getDifficultyBadge = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: 'bg-green-100 text-green-700 border-green-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      hard: 'bg-red-100 text-red-700 border-red-200',
    };
    return colors[difficulty] || colors.medium;
  };

  return (
    <div className="space-y-6">
      {/* Quiz Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
        <div className="p-2 bg-blue-100 rounded-lg">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Study Quiz: {quiz.topic}</h2>
          <p className="text-sm text-gray-500">5 questions • Evidence-based feedback</p>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {quiz.questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            questionNumber={index + 1}
            state={questionStates[question.id] || { selectedAnswer: null, revealed: false }}
            onSelectAnswer={(answer) => handleSelectAnswer(question.id, answer)}
            getDifficultyBadge={getDifficultyBadge}
          />
        ))}
      </div>

      {/* Consolidated Summary (shown after all questions answered) */}
      {showSummary && (
        <div className="mt-8 space-y-8">
          <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2 font-ui">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Topic Summary
            </h3>

            <UnifiedCitationRenderer
              content={quiz.consolidatedSummary}
              mode="doctor"
            />

            {/* Disclaimer */}
            <div className="mt-8 p-4 bg-gray-50 border border-gray-300 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all duration-300 group">
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-sm text-gray-600 font-ui">
                  <p className="font-semibold mb-1 text-gray-700">
                    AI-Generated Educational Material
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    This educational material and quiz are generated for study purposes using clinical guidelines and medical literature. While we prioritize evidence from peer-reviewed sources, AI can make mistakes. Please verify critical information with primary sources.
                  </p>
                </div>
              </div>
            </div>

            {/* References Section */}
            {quiz.references && quiz.references.length > 0 && (
              <div className="mt-8">
                <UnifiedReferenceSection
                  references={quiz.references.map(ref => ({
                    id: `ref-${ref.number}`,
                    number: ref.number,
                    title: ref.title,
                    authors: ref.authors ? [ref.authors] : [],
                    journal: ref.journal || '',
                    year: ref.year || '',
                    url: ref.url,
                    pmid: ref.pmid,
                    badges: (ref.type ? [ref.type] : []) as QualityBadge[],
                    isValid: true
                  }))}
                  mode="doctor"
                />
              </div>
            )}
          </div>

          {/* Follow-up Questions */}
          {quiz.followUpQuestions && quiz.followUpQuestions.length > 0 && (
            <div className="mt-8">
              <h4 className="text-xl font-semibold text-gray-900 mb-4 font-ui flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Deeper Dive: Challenging Concepts
              </h4>
              <div className="space-y-3">
                {quiz.followUpQuestions.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const inputElement = document.querySelector('textarea[placeholder*="Ask"]') as HTMLTextAreaElement;
                      if (inputElement) {
                        inputElement.value = question;
                        inputElement.focus();
                        const event = new Event('input', { bubbles: true });
                        inputElement.dispatchEvent(event);
                        // Optional: Scroll to input
                        inputElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }}
                    className="w-full text-left p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group cursor-pointer shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-gray-400 group-hover:text-blue-600 mt-0.5 transition-colors">•</span>
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
      )}
    </div>
  );
}

interface QuestionCardProps {
  question: StudyModeQuestion;
  questionNumber: number;
  state: QuestionState;
  onSelectAnswer: (answer: 'A' | 'B' | 'C' | 'D') => void;
  getDifficultyBadge: (difficulty: string) => string;
}

function QuestionCard({ question, questionNumber, state, onSelectAnswer, getDifficultyBadge }: QuestionCardProps) {
  const { selectedAnswer, revealed } = state;
  const isCorrect = selectedAnswer === question.correctAnswer;

  return (
    <div className={`p-5 rounded-xl border-2 transition-all ${revealed
        ? isCorrect
          ? 'border-green-300 bg-green-50/50'
          : 'border-red-300 bg-red-50/50'
        : 'border-gray-200 bg-white hover:border-gray-300'
      }`}>
      {/* Question Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 bg-blue-600 text-white rounded-lg text-sm font-bold">
            {questionNumber}
          </span>
          <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getDifficultyBadge(question.difficulty)}`}>
            {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
          </span>
        </div>
        {revealed && (
          <span className={`text-sm font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
            {isCorrect ? '✓ Correct' : '✗ Incorrect'}
          </span>
        )}
      </div>

      {/* Question Text */}
      <p className="text-gray-800 font-medium mb-4">{question.question}</p>

      {/* Options */}
      <div className="space-y-2">
        {(['A', 'B', 'C', 'D'] as const).map((option) => {
          const optionText = question.options[option];
          const isSelected = selectedAnswer === option;
          const isCorrectOption = question.correctAnswer === option;

          let optionStyle = 'border-gray-200 hover:border-blue-300 hover:bg-blue-50';

          if (revealed) {
            if (isCorrectOption) {
              optionStyle = 'border-green-400 bg-green-100 text-green-800';
            } else if (isSelected && !isCorrectOption) {
              optionStyle = 'border-red-400 bg-red-100 text-red-800';
            } else {
              optionStyle = 'border-gray-200 bg-gray-50 text-gray-500';
            }
          } else if (isSelected) {
            optionStyle = 'border-blue-400 bg-blue-100 text-blue-800';
          }

          return (
            <button
              key={option}
              onClick={() => !revealed && onSelectAnswer(option)}
              disabled={revealed}
              className={`w-full p-3 text-left rounded-lg border-2 transition-all flex items-start gap-3 ${optionStyle} ${revealed ? 'cursor-default' : 'cursor-pointer'
                }`}
            >
              <span className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${revealed && isCorrectOption
                  ? 'border-green-500 bg-green-500 text-white'
                  : revealed && isSelected && !isCorrectOption
                    ? 'border-red-500 bg-red-500 text-white'
                    : isSelected
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-gray-300'
                }`}>
                {option}
              </span>
              <span className="flex-1">{optionText}</span>
            </button>
          );
        })}
      </div>

      {/* Explanation (shown after revealing) */}
      {revealed && (
        <div className={`mt-4 p-4 rounded-lg ${isCorrect ? 'bg-green-100' : 'bg-amber-50'} border ${isCorrect ? 'border-green-300' : 'border-amber-200'}`}>
          <div className="mb-2">
            <span className="text-sm font-semibold text-gray-700">Explanation:</span>
          </div>
          <p className="text-sm text-gray-700 mb-2">
            <strong className="text-green-700">Why {question.correctAnswer} is correct:</strong> {question.explanation.correct}
          </p>
          {!isCorrect && (
            <p className="text-sm text-gray-600">
              <strong className="text-amber-700">Common misconception:</strong> {question.explanation.incorrect}
            </p>
          )}

          {/* Source Citation */}
          <div className="mt-3 pt-2 border-t border-gray-200">
            <a
              href={question.explanation.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span className="font-medium">{question.explanation.source.title}</span>
              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                {question.explanation.source.type}
              </span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudyQuizRenderer;
