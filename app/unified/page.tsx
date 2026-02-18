"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, ImageIcon, Loader2, Search, Send, X, ChevronDown, FileIcon } from 'lucide-react';
import { useGemini } from "@/hooks/useGemini";
import { parseResponseIntoSections } from "@/lib/response-parser";
import { RotatingText } from "@/components/ui/rotating-text";
import { parseResponse } from "@/lib/citation/unified-parser";
import { DOCTOR_MODE_CAPABILITIES } from "@/lib/learn-more-capabilities";
import { saveConversation, getConversationById } from "@/lib/storage";

// Lazy load heavy components - only loaded after first interaction
const EvidenceLogosScroll = dynamic(() => import("@/components/ui/evidence-logos-scroll").then(m => ({ default: m.EvidenceLogosScroll })), { ssr: false });
const ResponseActions = dynamic(() => import("@/components/ui/response-actions").then(m => ({ default: m.ResponseActions })), { ssr: false });
const Sidebar = dynamic(() => import("@/components/ui/sidebar").then(m => ({ default: m.Sidebar })), { ssr: false });
const RotatingSuggestions = dynamic(() => import("@/components/ui/rotating-suggestions").then(m => ({ default: m.RotatingSuggestions })), { ssr: false });
const EvidenceLoadingCard = dynamic(() => import("@/components/ui/evidence-loading-card").then(m => ({ default: m.EvidenceLoadingCard })), { ssr: false });
const ImageLightbox = dynamic(() => import("@/components/ui/image-lightbox").then(m => ({ default: m.ImageLightbox })), { ssr: false });
const FormattedQuestion = dynamic(() => import("@/components/ui/formatted-question").then(m => ({ default: m.FormattedQuestion })), { ssr: false });
const UnifiedResponseRenderer = dynamic(() => import("@/components/ui/unified-response-renderer").then(m => ({ default: m.UnifiedResponseRenderer })), { ssr: false });
const UnifiedCitationRenderer = dynamic(() => import("@/components/ui/unified-citation-renderer").then(m => ({ default: m.UnifiedCitationRenderer })), { ssr: false });
const UnifiedReferenceSection = dynamic(() => import("@/components/ui/unified-reference-section").then(m => ({ default: m.UnifiedReferenceSection })), { ssr: false });
const StudyQuizRenderer = dynamic(() => import("@/components/ui/study-quiz-renderer"), { ssr: false });

interface MedicalImage {
  url: string;
  title: string;
  source: string;
  license: string;
  thumbnail?: string;
  description?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  files?: File[];
  imageUrls?: string[]; // base64 image data (uploaded by user)
  visualFindings?: Array<{
    finding: string;
    severity: 'critical' | 'moderate' | 'mild';
    coordinates: [number, number, number, number];
    label: string;
    fileIndex?: number;
  }>;
  medicalImages?: MedicalImage[]; // fetched educational images
}

// Response Tabs Component - 3-Tab Structure for Image Analysis with Unified Citations
function ResponseTabs({
  response,
  modelUsed,
  imageUrls,
  visualFindings,
  onComplete,
  mode
}: {
  response: string;
  modelUsed: string;
  imageUrls?: string[];
  visualFindings?: Array<{
    finding: string;
    severity: 'critical' | 'moderate' | 'mild';
    coordinates: [number, number, number, number];
    label: string;
    fileIndex?: number;
  }>;
  onComplete?: () => void;
  mode: 'doctor' | 'general';
}) {
  const [activeTab, setActiveTab] = useState<'clinical' | 'diagnosis' | 'treatment'>('clinical');
  const [showReferences, setShowReferences] = useState(false);

  // Parse response into 3 sections (no Evidence Database tab)
  const sections = useMemo(() => {
    const parsed = parseResponseIntoSections(response);
    return {
      clinical: parsed.clinical,
      diagnosis: parsed.diagnosis,
      treatment: parsed.treatment
    };
  }, [response]);

  // Parse references from full response
  const { references } = useMemo(() => {
    return parseResponse(response, mode);
  }, [response, mode]);

  // Tab configuration - 3 tabs only
  const tabs = [
    { id: 'clinical' as const, label: 'Clinical Analysis', icon: '📋' },
    { id: 'diagnosis' as const, label: 'Diagnosis & Logic', icon: '🔍' },
    { id: 'treatment' as const, label: 'Treatment & Safety', icon: '💊' }
  ];

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

  useEffect(() => {
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  return (
    <div className="space-y-6">
      {/* 3-Tab Interface */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${activeTab === tab.id
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >


              {/* Use UnifiedCitationRenderer for each tab to get Sources badges */}
              <UnifiedCitationRenderer
                content={sections[activeTab]}
                mode={mode}
                onViewReferences={handleViewReferences}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>



      {/* Response Actions - Helpful/Save/Copy */}
      <ResponseActions
        responseContent={{
          clinical: sections.clinical,
          diagnosis: sections.diagnosis,
          treatment: sections.treatment,
          references: references.map((ref: any) =>
            `${ref.number}. ${ref.title}\n   ${ref.authors}. ${ref.journal}. ${ref.year}. ${ref.pmid ? `PMID:${ref.pmid}` : ''}${ref.doi ? ` doi:${ref.doi}` : ''}`
          ).join('\n\n')
        }}
        onSaveToCollection={() => {
          // TODO: Implement save to collection
          console.log('Save to collection clicked');
        }}
        onFeedback={(helpful) => {
          // TODO: Implement feedback tracking
          console.log('User feedback:', helpful ? 'helpful' : 'not helpful');
        }}
        // Injecting a custom action slot or modifying ResponseActions would be cleaner,
        // but for now let's see if we can hack it or if I should modify ResponseActions.
        // I will assume I can modify ResponseActions in a separate step or just add the button alongside.
        // Let's modify ResponseActions to accept "onReadAloud".
      />
      {/* Read Aloud Button - REMOVED */}

      {/* Disclaimer - placed BEFORE References */}
      <div className="p-4 bg-gray-50 border border-gray-300 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all duration-300 group">
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-sm text-gray-600 font-ui">
            <p className="font-semibold mb-1 text-gray-700">⚠️ AI-Generated Research Synthesis</p>
            <p className="text-gray-600 leading-relaxed">
              This response synthesizes evidence from peer-reviewed literature, clinical guidelines, and medical databases. While we strive for accuracy, AI can make mistakes. Please verify critical information with primary sources. This is a research tool that helps find and summarize relevant medical literature, not a substitute for professional medical expertise.
            </p>
          </div>
        </div>
      </div>

      {/* References Section - rendered at the bottom */}
      <div id="references-section">
        <UnifiedReferenceSection
          references={references}
          mode={mode}
        />
      </div>
    </div>
  );
}
// Simple Response Component - Unified System
function SimpleResponse({
  response,
  modelUsed,
  onComplete,
  showFollowUpQuestions = true,
  medicalImages,
  conversationId,
  mode,
  onQuestionSelect
}: {
  response: string;
  modelUsed: string;
  onComplete?: () => void;
  showFollowUpQuestions?: boolean;
  medicalImages?: MedicalImage[];
  conversationId?: string;
    mode: 'doctor';
    onQuestionSelect?: (question: string) => void;
}) {
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string; source?: string; license?: string } | null>(null);

  return (
    <div className="space-y-8">
      {/* Medical Images */}
      {medicalImages && medicalImages.length > 0 && (
        <div className="mb-6">
          <div className="overflow-x-auto pb-2 -mx-2 px-2">
            <div className="flex gap-4 min-w-max">
              {medicalImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setLightboxImage({ url: img.url, title: img.title, source: img.source, license: img.license })}
                  className="w-64 shrink-0 bg-cream rounded-lg overflow-hidden shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group relative"
                >
                  <div className="h-48 bg-gray-100 overflow-hidden relative">
                    <img
                      src={img.thumbnail || img.url}
                      alt={img.title}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      style={{ imageRendering: '-webkit-optimize-contrast' }}
                      loading="lazy"
                    />
                    {/* Zoom icon on hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                      <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                      </svg>
                    </div>
                    {/* Source badge */}
                    {img.source && (
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-white rounded text-xs font-medium text-gray-700 shadow-sm border border-gray-200">
                        {img.source.includes('NCI') ? '🏛️ NCI' : img.source.includes('InjuryMap') ? '📚 InjuryMap' : img.source.includes('Open-i') ? '🔬 NLM' : '📖 ' + img.source}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Response - Use unified renderer */}
      <UnifiedResponseRenderer
        response={response}
        mode={mode}
        onComplete={onComplete}
        showFollowUpQuestions={showFollowUpQuestions}
        conversationId={conversationId}
        onQuestionSelect={onQuestionSelect}
      />

      {/* Image Lightbox */}
      {lightboxImage && (
        <ImageLightbox
          imageUrl={lightboxImage.url}
          title={lightboxImage.title}
          source={lightboxImage.source}
          license={lightboxImage.license}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );
}

function LearnMoreCapabilities({
  mode,
  onQuestionClick,
  loading
}: {
    mode: 'doctor';
  onQuestionClick: (question: string, imageUrls?: string[]) => void;
  loading: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredQuestion, setHoveredQuestion] = useState<string | null>(null);


  // Select capabilities based on mode
  const capabilities = DOCTOR_MODE_CAPABILITIES;

  // Helper to get question text
  const getQuestionText = (question: string | { text: string; imageUrls?: string[] }): string => {
    return typeof question === 'string' ? question : question.text;
  };

  // Helper to get image URLs
  const getImageUrls = (question: string | { text: string; imageUrls?: string[] }): string[] | undefined => {
    return typeof question === 'string' ? undefined : question.imageUrls;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="mt-6"
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mx-auto flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors font-ui"
      >
        <span>Learn More Capabilities</span>
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-6 max-w-4xl mx-auto space-y-6"
        >
          {capabilities.map((capability, idx) => (
            <div key={idx} className="space-y-3">
              <div className="flex items-center gap-2 text-gray-900 font-ui font-semibold">
                <span className="text-blue-600">{capability.icon}</span>
                <span>{capability.title}</span>
              </div>
              <div className="space-y-2 ml-7">
                {capability.questions.map((question, qIdx) => {
                  const questionText = getQuestionText(question);
                  const imageUrls = getImageUrls(question);
                  const questionKey = `${idx}-${qIdx}`;
                  const isHovered = hoveredQuestion === questionKey;

                  return (
                    <div
                      key={qIdx}
                      className="relative"
                      onMouseEnter={() => setHoveredQuestion(questionKey)}
                      onMouseLeave={() => setHoveredQuestion(null)}
                    >
                      <button
                        onClick={() => onQuestionClick(questionText, imageUrls)}
                        disabled={loading}
                        className={`w-full text-left px-4 py-3 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all text-sm text-gray-700 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between group ${mode === 'doctor' ? 'hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700' : 'hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700'
                          }`}
                      >
                        <span className="flex-1 pr-4">{questionText}</span>
                        <svg className={`w-4 h-4 text-gray-400 transition-colors shrink-0 ${mode === 'doctor' ? 'group-hover:text-blue-600' : 'group-hover:text-purple-600'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>

                      {/* Image Preview on Hover - Side by Side */}
                      {imageUrls && imageUrls.length > 0 && isHovered && (
                        <>
                          {/* Left Image Preview - Only show if 2+ images */}
                          {imageUrls.length >= 2 && (
                            <div
                              className="absolute right-full mr-3 top-0 z-50 pointer-events-none bg-white rounded-lg shadow-lg p-1.5"
                              style={{ width: '140px', height: '140px' }}
                            >
                              <img
                                src={imageUrls[0]}
                                alt="Preview 1"
                                className="w-full h-full object-contain"
                              />
                            </div>
                          )}

                          {/* Right Image Preview - Always show */}
                          <div
                            className="absolute left-full ml-3 top-0 z-50 pointer-events-none bg-white rounded-lg shadow-lg p-1.5"
                            style={{ width: '140px', height: '140px' }}
                          >
                            <img
                              src={imageUrls.length >= 2 ? imageUrls[1] : imageUrls[0]}
                              alt={`Preview ${imageUrls.length >= 2 ? '2' : '1'}`}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

export default function UnifiedDashboard() {
  const mode = 'doctor';
  const [query, setQuery] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [currentResponse, setCurrentResponse] = useState("");
  const [modelUsed, setModelUsed] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [hasSubmittedQuery, setHasSubmittedQuery] = useState(false);
  const [isResponseComplete, setIsResponseComplete] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [showStudyDropdown, setShowStudyDropdown] = useState(false);
  const [conversationId, setConversationId] = useState<string>(() => `conv_${Date.now()}`);
  const historyRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Voice Features State - REMOVED (no longer needed)

  // Gemini Live is initialized later for Dictation - REMOVED

  // Voice Chat Modal function - REMOVED (no longer needed)


  const { sendMessage, loading, error, clearMessages } = useGemini({
    mode,
    onMessage: (message) => {
      console.log("🔍 DEBUG: useGemini onMessage callback:", message);
    },
    onError: (error) => {
      console.log("🔍 DEBUG: useGemini onError callback:", error);
    }
  });

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      // Use scrollHeight to set new height, but cap it at 200px
      const newHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(newHeight, 200)}px`;
    }
  }, [query, hasSubmittedQuery]);

  // Save conversation to localStorage whenever chatHistory changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      const firstUserMessage = chatHistory.find(m => m.role === 'user');
      saveConversation({
        id: conversationId,
        title: firstUserMessage?.content.substring(0, 50) + '...' || 'New Conversation',
        timestamp: new Date(),
        preview: firstUserMessage?.content.substring(0, 100) || '',
        messages: chatHistory.map(m => ({
          role: m.role,
          content: m.content,
          imageUrls: m.imageUrls,
          medicalImages: m.medicalImages
        })),
        mode: 'doctor'
      });
    }
  }, [chatHistory, conversationId]);

  // Handle new conversation
  const handleNewConversation = () => {
    setChatHistory([]);
    setQuery("");
    setUploadedFiles([]);
    setHasSubmittedQuery(false);
    setCurrentResponse("");
    setIsResponseComplete(false);
    setConversationId(`conv_${Date.now()}`); // Generate new conversation ID

    // Clear any error state
    // Clear any error state
    clearMessages();

    console.log("🔍 DEBUG: New conversation started - all state cleared");
  };

  // Handle conversation selection - load from localStorage
  const handleSelectConversation = (id: string) => {
    const conversation = getConversationById(id);
    if (conversation) {
      setConversationId(id);
      setChatHistory(conversation.messages.map((m: {
        role: 'user' | 'assistant';
        content: string;
        imageUrls?: string[];
        visualFindings?: Array<{
          finding: string;
          severity: 'critical' | 'moderate' | 'mild';
          coordinates: [number, number, number, number];
          label: string;
          fileIndex?: number;
        }>;
        medicalImages?: Array<{
          url: string;
          title: string;
          source: string;
          license: string;
          thumbnail?: string;
          description?: string;
        }>;
      }, idx: number) => ({
        role: m.role,
        content: m.content,
        timestamp: new Date(conversation.timestamp),
        imageUrls: m.imageUrls,
        visualFindings: m.visualFindings, // Preserve visual findings for image analysis
        medicalImages: m.medicalImages
      })));
      setHasSubmittedQuery(true);
      setIsResponseComplete(true);
      if (conversation.messages.length > 0) {
        const lastAssistant = conversation.messages.filter((m: { role: string }) => m.role === 'assistant').pop();
        if (lastAssistant) {
          setCurrentResponse(lastAssistant.content);
        }
      }
    }
  };

  // Close history dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    };

    if (showHistory) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showHistory]);

  // Listen for follow-up question clicks
  useEffect(() => {
    const handleFollowUpQuestion = async (event: any) => {
      const question = event.detail as string;

      // Show evidence gathering progress with detailed steps
      setThinkingSteps([]);
      setTimeout(() => setThinkingSteps(prev => [...prev, "✓ Analyzing query..."]), 50);
      setTimeout(() => setThinkingSteps(prev => [...prev, "✓ Searching PubMed, Cochrane, FDA, ClinicalTrials.gov, Europe PMC, and 15+ more databases..."]), 400);
      setTimeout(() => setThinkingSteps(prev => [...prev, "→ Gathering evidence (articles, systematic reviews, clinical guidelines, trials)..."]), 1000);
      setTimeout(() => setThinkingSteps(prev => [...prev, "→ Synthesizing evidence-based response..."]), 1800);

      // Add user message to history
      const userMessage: Message = {
        role: "user",
        content: question,
        timestamp: new Date(),
      };

      setChatHistory(prev => [...prev, userMessage]);
      setCurrentResponse("");

      // Scroll to show the new question
      setTimeout(() => {
        const conversationElements = document.querySelectorAll('[data-qa-pair]');
        if (conversationElements.length > 0) {
          const lastQuestion = conversationElements[conversationElements.length - 1];
          lastQuestion.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);

      // Send message
      const result = await sendMessage(question, [], chatHistory, 0, isStudyMode);

      if (result) {
        const assistantMessage: Message = {
          role: "assistant",
          content: result.response,
          timestamp: new Date(),
          medicalImages: result.medicalImages, // Include fetched medical images
        };

        setChatHistory(prev => [...prev, assistantMessage]);
        setCurrentResponse(result.response);
        setModelUsed(result.model);
      }
    };

    window.addEventListener('followUpQuestion', handleFollowUpQuestion);

    return () => {
      window.removeEventListener('followUpQuestion', handleFollowUpQuestion);
    };
  }, [chatHistory, sendMessage]);

  // Gemini Live for Dictation - REMOVED (no longer needed)

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <ImageIcon className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const handleSubmit = async (questionOverride?: string, filesOverride?: File[]) => {
    const questionToSubmit = questionOverride || query;
    const filesToSubmit = filesOverride || uploadedFiles;
    if (!questionToSubmit.trim() && filesToSubmit.length === 0) return;

    setHasSubmittedQuery(true); // Mark that first query has been submitted
    setIsResponseComplete(false); // Reset completion state

    // Show evidence gathering progress with detailed steps
    setThinkingSteps([]);
    setTimeout(() => setThinkingSteps(prev => [...prev, "✓ Analyzing query..."]), 50);
    setTimeout(() => setThinkingSteps(prev => [...prev, "✓ Searching PubMed, Cochrane, FDA, ClinicalTrials.gov, Europe PMC, and 15+ more databases..."]), 400);
    setTimeout(() => setThinkingSteps(prev => [...prev, "→ Gathering evidence (articles, systematic reviews, clinical guidelines, trials)..."]), 1000);
    setTimeout(() => setThinkingSteps(prev => [...prev, "→ Synthesizing evidence-based response..."]), 1800);

    // Convert images to base64 for display
    const imageUrls: string[] = [];
    for (const file of filesToSubmit) {
      if (file.type.startsWith("image/")) {
        const base64 = await fileToBase64(file);
        imageUrls.push(base64);
      }
    }

    // Add user message to history
    const userMessage: Message = {
      role: "user",
      content: questionToSubmit,
      timestamp: new Date(),
      files: filesToSubmit.length > 0 ? [...filesToSubmit] : undefined,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    };

    setChatHistory(prev => [...prev, userMessage]);
    setCurrentResponse(""); // Clear previous response

    // Clear input and files immediately (only if not using override)
    setQuery("");
    if (!filesOverride) {
      setUploadedFiles([]);
    }

    // Scroll to show the new question (not to top, but to where question appears)
    // Wait for DOM to update, then scroll to the last question
    setTimeout(() => {
      const conversationElements = document.querySelectorAll('[data-qa-pair]');
      if (conversationElements.length > 0) {
        const lastQuestion = conversationElements[conversationElements.length - 1];
        lastQuestion.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);

    // Send message with conversation history
    console.log("🔍 DEBUG: About to call sendMessage with:", {
      questionToSubmit,
      filesCount: filesToSubmit.length,
      historyLength: chatHistory.length
    });

    try {
      const result = await sendMessage(questionToSubmit, filesToSubmit, chatHistory, 0, isStudyMode);

      console.log("🔍 DEBUG: sendMessage returned:", {
        hasResult: !!result,
        resultType: typeof result,
        resultKeys: result ? Object.keys(result) : 'N/A',
        responseLength: result?.response?.length || 0,
        responsePreview: result?.response?.substring(0, 100) + "...",
        medicalImagesCount: result?.medicalImages?.length || 0,
        model: result?.model
      });

      if (result) {
        console.log("🔍 DEBUG: Processing result:", {
          responseLength: result.response?.length || 0,
          responsePreview: result.response?.substring(0, 100) + "...",
          medicalImagesCount: result.medicalImages?.length || 0
        });

        // Add assistant response to history
        const assistantMessage: Message = {
          role: "assistant",
          content: result.response,
          timestamp: new Date(),
          medicalImages: result.medicalImages, // Include fetched medical images
        };

        console.log("🔍 DEBUG: Created assistant message:", {
          role: assistantMessage.role,
          contentLength: assistantMessage.content?.length || 0,
          contentPreview: assistantMessage.content?.substring(0, 100) + "...",
          medicalImagesCount: assistantMessage.medicalImages?.length || 0
        });

        setChatHistory(prev => {
          const newHistory = [...prev, assistantMessage];
          console.log("🔍 DEBUG: Updated chat history:", {
            previousLength: prev.length,
            newLength: newHistory.length,
            lastMessage: {
              role: newHistory[newHistory.length - 1]?.role,
              contentLength: newHistory[newHistory.length - 1]?.content?.length || 0
            }
          });
          return newHistory;
        });

        console.log("🔍 DEBUG: About to set current response:", {
          responseExists: !!result.response,
          responseLength: result.response?.length || 0,
          responseType: typeof result.response
        });

        setCurrentResponse(result.response);
        setModelUsed(result.model);

        console.log("🔍 DEBUG: Set current response completed:", {
          responseLength: result.response?.length || 0,
          model: result.model
        });
      } else {
        console.log("🔍 DEBUG: No result returned from sendMessage");
      }
    } catch (error: any) {
      console.error("🔍 DEBUG: Error in sendMessage:", error);
      console.error("🔍 DEBUG: Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });

      // We don't have a local error setter, rely on console logs and useGemini error state
    }
  };


  // Helper function to convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Sidebar */}
      <Sidebar
        mode="doctor"
        onNewConversation={handleNewConversation}
        onSelectConversation={handleSelectConversation}
        isOpen={sidebarOpen}
        onToggle={setSidebarOpen}
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${sidebarOpen ? 'ml-[280px]' : 'ml-0'}`}>
        {/* Header - Sticky */}
        <header className="sticky top-0 z-50 bg-cream border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3"
            >
              {/* Menu Button - Only show when sidebar is closed */}
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  title="Open sidebar"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}

              <button
                onClick={handleNewConversation}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
                title="Start new conversation"
              >
                <div className="flex items-center gap-3">
                  {/* Logo */}
                  <img
                    src="/logos/openwork-logo.png"
                    alt="OpenWork Logo"
                    className="h-12 w-auto"
                  />
                  {/* Title */}
                  <h1 className="text-xl font-semibold text-gray-900">OpenWork</h1>
                </div>
              </button>
            </motion.div>

            <div className="flex items-center gap-4">
              {/* Mode Selection Buttons in Navigation */}

            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className={`flex-1 px-6 ${hasSubmittedQuery ? 'py-6' : 'flex items-center justify-center py-12'}`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-5xl mx-auto"
          >
            {/* Hero Section - Hide after first query */}
            {!hasSubmittedQuery && (
              <div className="text-left mb-8 ml-4">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-5xl font-bold text-gray-900 mb-3 tracking-tight"
                >
                  Research with OpenWork
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-lg text-gray-600 mb-6 font-normal"
                >
                  Research medical literature from{" "}
                  <RotatingText
                    words={[
                      "Systematic Reviews",
                      "Clinical Practice Guidelines",
                      "Global Clinical Trials",
                      "Pharmacological Databases",
                      "Peer-Reviewed Journals"
                    ]}
                    interval={3000}
                    className="text-blue-600 font-normal"
                  />
                  {" "}— every claim cited, every source verified.
                </motion.p>
              </div>
            )}


            {/* Persistent Search Container */}
            <div className={`
              ${hasSubmittedQuery
                ? "fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-t border-gray-100 p-4"
                : "relative mt-6"}
              transition-all duration-500
            `}>
              <div className={hasSubmittedQuery ? "max-w-4xl mx-auto" : ""}>
                {/* Uploaded Files Display */}
                {uploadedFiles.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-3 flex flex-wrap gap-2 px-2"
                  >
                    {uploadedFiles.map((file, index) => {
                      const isImage = file.type.startsWith("image/");
                      const imageUrl = isImage ? URL.createObjectURL(file) : null;
                      const fileSizeKB = (file.size / 1024).toFixed(1);

                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative group"
                        >
                          {isImage ? (
                            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 py-1.5 shadow-sm hover:border-blue-400">
                              <div className="relative w-8 h-8 rounded overflow-hidden bg-gray-100">
                                <img src={imageUrl!} alt={file.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-medium text-gray-700 truncate max-w-[120px]">{file.name}</span>
                              </div>
                              <button onClick={() => removeFile(index)} className="ml-1 p-0.5 hover:bg-gray-100 rounded-full">
                                <X className="w-3.5 h-3.5 text-gray-400" />
                              </button>
                            </div>
                          ) : (
                              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 py-1.5 shadow-sm hover:border-blue-400">
                                <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                                {getFileIcon(file)}
                              </div>
                              <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-medium text-gray-700 truncate max-w-[120px]">{file.name}</span>
                              </div>
                                <button onClick={() => removeFile(index)} className="ml-1 p-0.5 hover:bg-gray-100 rounded-full">
                                  <X className="w-3.5 h-3.5 text-gray-400" />
                              </button>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}

                {/* Search Box */}
                <div
                  className={`
                    relative bg-cream rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] 
                    border transition-all duration-300 z-20 
                    ${hasSubmittedQuery ? 'min-h-[60px]' : 'min-h-[200px]'} flex flex-col
                    ${mode === 'doctor' ? 'border-blue-500' : 'border-purple-500'}
                  `}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className={`px-6 ${hasSubmittedQuery ? 'py-2' : 'pt-6 pb-2'}`}>
                    <textarea
                      ref={textareaRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={
                        hasSubmittedQuery
                          ? "Ask a follow-up question..."
                          : mode === 'doctor'
                            ? "Ask about research literature, drug information, clinical guidelines, systematic reviews..."
                            : "Ask about symptoms, healthy habits, when to see a doctor..."
                      }
                      className="w-full text-gray-900 placeholder-gray-400 outline-none text-base resize-none overflow-y-auto leading-relaxed border-none focus:ring-0"
                      style={{
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        minHeight: hasSubmittedQuery ? '40px' : '100px',
                        maxHeight: '200px',
                        fontSize: '16px'
                      }}
                      disabled={loading}
                      rows={hasSubmittedQuery ? 1 : 4}
                    />
                  </div>

                  <div className={`flex items-center justify-between px-6 pb-3 pt-2 ${!hasSubmittedQuery ? 'border-t border-gray-100' : ''}`}>
                    <div className="flex items-center gap-2">
                      {mode === 'doctor' ? (
                        <div className="relative flex items-center gap-2">
                          {isStudyMode && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-sm font-medium text-blue-700">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                              <span className={hasSubmittedQuery ? 'hidden sm:inline' : ''}>Study</span>
                              <button onClick={() => setIsStudyMode(false)} className="p-0.5 hover:bg-blue-100 rounded">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          {!hasSubmittedQuery && (
                            <button
                              onClick={() => setShowStudyDropdown(!showStudyDropdown)}
                              className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          )}
                          {showStudyDropdown && (
                            <div className="absolute left-0 bottom-full mb-2 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50 min-w-[180px]">
                              <button
                                onClick={() => { setIsStudyMode(true); setShowStudyDropdown(false); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                              >
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                <span className="font-medium">Study and Learn</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <label className="cursor-pointer group">
                            <input type="file" multiple accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={(e) => handleFileUpload(e.target.files)} />
                            <div className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg text-gray-600 hover:text-purple-600 hover:bg-purple-50">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              <span className={hasSubmittedQuery ? 'hidden md:inline' : ''}>Add files</span>
                            </div>
                          </label>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Voice Features - REMOVED */}

                      <button
                        onClick={() => handleSubmit()}
                        disabled={(!query.trim() && uploadedFiles.length === 0) || loading}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${mode === 'doctor' ? "bg-blue-600" : "bg-purple-600"}`}
                      >
                        {loading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rotating Quick Action Buttons */}
            {!hasSubmittedQuery && (
              <RotatingSuggestions
                mode="doctor"
                onSelect={(prompt) => setQuery(prompt)}
                disabled={loading}
              />
            )}

            {/* Learn More Capabilities - Collapsible Section */}
            {!hasSubmittedQuery && (
              <LearnMoreCapabilities
                mode={mode}
                onQuestionClick={async (question, imageUrls) => {
                  // If there are image URLs, fetch and convert them to File objects
                  if (imageUrls && imageUrls.length > 0) {
                    try {
                      const imageFiles: File[] = [];

                      // Fetch each image and convert to File object
                      for (const imageUrl of imageUrls) {
                        const response = await fetch(imageUrl);
                        const blob = await response.blob();
                        const filename = imageUrl.split('/').pop() || 'image.jpg';
                        const file = new File([blob], filename, { type: blob.type });
                        imageFiles.push(file);
                      }

                      // Pass files directly to handleSubmit (don't use state)
                      await handleSubmit(question, imageFiles);
                    } catch (error) {
                      console.error('Error loading radiology images:', error);
                      // Submit without images if loading fails
                      await handleSubmit(question);
                    }
                  } else {
                    // No images, just submit the question
                    await handleSubmit(question);
                  }
                }}
                loading={loading}
              />
            )}

            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <p className="text-red-800 font-medium text-sm">Error:</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </motion.div>
            )}

            {/* Conversation History Display */}
            {hasSubmittedQuery && (() => {
              // Group chat history into Q&A pairs
              const qaPairs: Array<{ question: Message, answer: Message | null }> = [];

              for (let i = 0; i < chatHistory.length; i++) {
                const message = chatHistory[i];

                if (message.role === "user") {
                  let assistantMessage: Message | null = null;
                  for (let j = i + 1; j < chatHistory.length; j++) {
                    if (chatHistory[j].role === "assistant") {
                      assistantMessage = chatHistory[j];
                      break;
                    }
                  }

                  qaPairs.push({
                    question: message,
                    answer: assistantMessage
                  });
                }
              }

              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-12 mb-32 px-4"
                >
                  {/* Display all Q&A pairs */}
                  {qaPairs.map((pair, pairIndex) => {
                    const isLastPair = pairIndex === qaPairs.length - 1;
                    const hasAttachmentsInPair = pair.question.files && pair.question.files.length > 0;

                    return (
                      <React.Fragment key={pairIndex}>
                        <div className="space-y-6" data-qa-pair={pairIndex}>
                          {/* Question Display */}
                          <FormattedQuestion content={pair.question.content} />

                          {/* Thinking Indicator */}
                          {isLastPair && loading && (
                            <div className="flex flex-col gap-4">
                              <div className="flex items-center gap-3">
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm text-gray-600">
                                  {thinkingSteps.length > 0 ? thinkingSteps[thinkingSteps.length - 1] : "Analyzing query..."}
                                </span>
                              </div>
                              <EvidenceLoadingCard isLoading={true} mode="doctor" />
                            </div>
                          )}

                          {/* AI Response */}
                          {(pair.answer || (isLastPair && currentResponse && !loading)) && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                              {isStudyMode && mode === 'doctor' ? (
                                <StudyQuizRenderer
                                  quizResponse={pair.answer?.content || currentResponse}
                                  isComplete={!loading || !!pair.answer}
                                />
                              ) : hasAttachmentsInPair ? (
                                <ResponseTabs
                                    response={pair.answer?.content || currentResponse}
                                  modelUsed={modelUsed}
                                  imageUrls={pair.question.imageUrls}
                                  visualFindings={pair.answer?.visualFindings}
                                  onComplete={() => isLastPair && setIsResponseComplete(true)}
                                  mode={mode}
                                />
                              ) : (
                                <SimpleResponse
                                      response={pair.answer?.content || currentResponse}
                                  modelUsed={modelUsed}
                                  onComplete={() => isLastPair && setIsResponseComplete(true)}
                                  showFollowUpQuestions={isLastPair}
                                  medicalImages={pair.answer?.medicalImages}
                                  conversationId={conversationId}
                                  mode={mode}
                                      onQuestionSelect={(q) => setQuery(q)}
                                />
                              )}

                              {/* Read Aloud button - REMOVED */}
                            </div>
                          )}
                        </div>

                        {!isLastPair && (
                          <div className="my-12 border-b border-gray-100"></div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </motion.div>
              );
            })()}


            {/* Info Text and Evidence Logos - Hide after first query */}
            {!hasSubmittedQuery && (
              <>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="mt-12 text-center text-xs text-gray-400"
                >
                  All responses are generated using evidence-based medical literature and clinical guidelines
                </motion.p>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="mt-6"
                >
                  <EvidenceLogosScroll />
                </motion.div>
              </>
            )}
          </motion.div>
        </main>




        {/* RENDER MODAL - REMOVED */}

      </div>
    </div >
  );
}
