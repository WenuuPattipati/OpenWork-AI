"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, FileText, Image as ImageIcon, Send, Loader2 } from "lucide-react";
import { useGemini } from "@/hooks/useGemini";
import MarkdownTypewriter from "@/components/ui/markdown-typewriter";
import { parseResponseIntoSections } from "@/lib/response-parser";
import { EvidenceLogosScroll } from "@/components/ui/evidence-logos-scroll";
import { ResponseActions } from "@/components/ui/response-actions";
import { Sidebar } from "@/components/ui/sidebar";
import { RotatingSuggestions } from "@/components/ui/rotating-suggestions";
import { EvidenceLoadingCard } from "@/components/ui/evidence-loading-card";
import { AddToCollectionModal } from "@/components/ui/add-to-collection-modal";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { FormattedQuestion } from "@/components/ui/formatted-question";
import { UnifiedResponseRenderer } from "@/components/ui/unified-response-renderer";
import { UnifiedCitationRenderer } from "@/components/ui/unified-citation-renderer";
import { RotatingText } from "@/components/ui/rotating-text";
import { UnifiedReferenceSection } from "@/components/ui/unified-reference-section";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

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
  visualFindings?: any[]; // Keep for compatibility but unused
  fileIndex?: number;
  label?: string;
  coordinates?: any;
  medicalImages?: MedicalImage[]; // fetched educational images
}

// Response Tabs Component - 3-Tab Structure for Image Analysis with Unified Citations
function ResponseTabs({
  response,
  modelUsed,
  onComplete
}: {
  response: string;
    modelUsed: string;
  onComplete?: () => void;
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
    const { parseResponse } = require('@/lib/citation/unified-parser');
    return parseResponse(response, 'doctor');
  }, [response]);
  
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
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                activeTab === tab.id
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
                mode="doctor"
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
      />
      
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
              This response synthesizes evidence from peer-reviewed literature, clinical guidelines, and medical databases. While we strive for accuracy, AI can make mistakes. Please verify critical information with primary sources and apply your clinical judgment. This is a research tool that helps find and summarize relevant medical literature, not a substitute for professional medical expertise.
            </p>
          </div>
        </div>
      </div>
      
      {/* References Section - rendered at the bottom */}
      <div id="references-section">
        <UnifiedReferenceSection
          references={references}
          mode="doctor"
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
  conversationId
}: {
  response: string;
  modelUsed: string;
  onComplete?: () => void;
  showFollowUpQuestions?: boolean;
  medicalImages?: MedicalImage[];
  conversationId?: string;
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
                  className="w-64 shrink-0 bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group relative"
                >
                  <div className="h-48 bg-gray-100 overflow-hidden relative">
                    <img
                      src={img.thumbnail || img.url}
                      alt={img.title}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
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
        mode="doctor"
        onComplete={onComplete}
        showFollowUpQuestions={showFollowUpQuestions}
        conversationId={conversationId}
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
  onQuestionClick,
  loading
}: {
    onQuestionClick: (question: string) => void;
  loading: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredQuestion, setHoveredQuestion] = useState<string | null>(null);

  // Import capabilities from centralized file
  const { DOCTOR_MODE_CAPABILITIES } = require('@/lib/learn-more-capabilities');
  const capabilities: Array<{
    title: string;
    icon: React.ReactNode;
    questions: (string | { text: string; imageUrls?: string[] })[];
  }> = DOCTOR_MODE_CAPABILITIES;

  // Helper to get question text
  const getQuestionText = (question: string | { text: string; imageUrls?: string[] }): string => {
    return typeof question === 'string' ? question : question.text;
  };

  // Helper to get image URLs (removed for radiology cleanup)
  const getImageUrls = (_question: any): undefined => {
    return undefined;
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
                        onClick={() => onQuestionClick(questionText)}
                        disabled={loading}
                        className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all text-sm text-gray-700 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between group"
                      >
                        <span className="flex-1 pr-4">{questionText}</span>
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>

                      {/* Image Preview removed for radiology cleanup */}
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

export default function DoctorMode() {
  const [query, setQuery] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [currentResponse, setCurrentResponse] = useState("");
  const [modelUsed, setModelUsed] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [hasSubmittedQuery, setHasSubmittedQuery] = useState(false);
  const [followUpQuery, setFollowUpQuery] = useState("");
  const [isResponseComplete, setIsResponseComplete] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [showThinkingDetails, setShowThinkingDetails] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string>(`conv_${Date.now()}`);
  const historyRef = useRef<HTMLDivElement>(null);

  const { sendMessage, loading, error } = useGemini({ mode: "doctor" });

  // Save conversation to localStorage whenever chatHistory changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      const { saveConversation } = require('@/lib/storage');
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
  };

  // Handle conversation selection - load from localStorage
  const handleSelectConversation = (id: string) => {
    const { getConversationById } = require('@/lib/storage');
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

      // Directly handle the follow-up question
      setCurrentQuestion(question);
      setIsResponseComplete(false);
      setShowThinkingDetails(false);

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
      const result = await sendMessage(question, [], chatHistory);

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
  }, [chatHistory]);

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
    setCurrentQuestion(questionToSubmit); // Store the question to display
    setIsResponseComplete(false); // Reset completion state
    setShowThinkingDetails(false); // Reset thinking details

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
    const result = await sendMessage(questionToSubmit, filesToSubmit, chatHistory);

    if (result) {
      // Add assistant response to history
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

  const handleFollowUpSubmit = async () => {
    if (!followUpQuery.trim()) return;

    setCurrentQuestion(followUpQuery); // Update current question
    setIsResponseComplete(false); // Reset completion state

    // Add user message to history
    const userMessage: Message = {
      role: "user",
      content: followUpQuery,
      timestamp: new Date(),
    };

    setChatHistory(prev => [...prev, userMessage]);
    setCurrentResponse(""); // Clear previous response

    // Clear follow-up input immediately
    setFollowUpQuery("");

    // Scroll to show the new question
    setTimeout(() => {
      const conversationElements = document.querySelectorAll('[data-qa-pair]');
      if (conversationElements.length > 0) {
        const lastQuestion = conversationElements[conversationElements.length - 1];
        lastQuestion.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);

    // Send message with conversation history
    const result = await sendMessage(followUpQuery, [], chatHistory);

    if (result) {
      // Add assistant response to history
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

  const clearHistory = () => {
    setChatHistory([]);
    setCurrentResponse("");
    setModelUsed("");
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
                <div className="w-10 h-10 bg-linear-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">OpenWork</h1>
                  <p className="text-xs text-gray-500">Doctor Mode</p>
                </div>
              </button>
            </motion.div>

            <div className="flex items-center gap-3">
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                onClick={() => window.location.href = "/"}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-400 rounded-lg cursor-pointer transition-all hover:bg-gray-50"
              >
                Exit
              </motion.button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className={`flex-1 px-6 ${hasSubmittedQuery ? 'py-6' : 'flex items-center justify-center py-12'}`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-4xl mx-auto"
          >
            {/* Hero Section - Hide after first query */}
            {!hasSubmittedQuery && (
              <div className="text-center mb-16">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-6xl font-normal text-gray-900 mb-8 tracking-tight"
                  style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                >
                  Hi there
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-lg text-gray-600 mb-12 font-normal"
                  style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                >
                  Get Evidence-based answers for{" "}
                  <RotatingText 
                    words={[
                      "drugs",
                      "guidelines & protocols",
                      "side effects",
                      "contraindications",
                      "drug interactions",
                      "lab interpretations",
                      "diagnostic criteria",
                      "treatment protocols",
                      "dosing guidelines",
                      "clinical evidence",
                      "safety profiles",
                      "therapeutic options"
                    ]}
                    interval={2500}
                    className="text-blue-600 font-normal"
                  />{" "}
                  in seconds.
                </motion.p>
              </div>
            )}

            {/* Initial Search Container - Hide after first query */}
            {!hasSubmittedQuery && (
              <div className="relative">
                {/* Uploaded Files Display - Above input as "hanging" thumbnails */}
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
                            // Compact image thumbnail with filename
                            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 py-1.5 shadow-sm hover:border-blue-400 hover:shadow-md transition-all">
                              <div className="relative w-8 h-8 rounded overflow-hidden shrink-0 bg-gray-100">
                                <img
                                  src={imageUrl!}
                                  alt={file.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-medium text-gray-700 truncate max-w-[120px]">
                                  {file.name}
                                </span>
                                <span className="text-[10px] text-gray-500">{fileSizeKB} KB</span>
                              </div>
                              <button
                                onClick={() => removeFile(index)}
                                className="ml-1 hover:bg-gray-100 rounded-full p-0.5 transition-colors shrink-0"
                              >
                                <X className="w-3.5 h-3.5 text-gray-500 hover:text-red-600" />
                              </button>
                            </div>
                          ) : (
                            // Document chip
                            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 py-1.5 shadow-sm hover:border-blue-400 hover:shadow-md transition-all">
                              <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center shrink-0">
                                {getFileIcon(file)}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-medium text-gray-700 truncate max-w-[120px]">
                                  {file.name}
                                </span>
                                <span className="text-[10px] text-gray-500">{fileSizeKB} KB</span>
                              </div>
                              <button
                                onClick={() => removeFile(index)}
                                className="ml-1 hover:bg-gray-100 rounded-full p-0.5 transition-colors shrink-0"
                              >
                                <X className="w-3.5 h-3.5 text-gray-500 hover:text-red-600" />
                              </button>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}

                {/* Main Search Bar - Larger design matching the image */}
                <div
                  className={`relative bg-cream border border-gray-300 rounded-2xl shadow-sm transition-all duration-300 focus-within:border-blue-400 focus-within:shadow-md ${isDragging ? "border-blue-400 shadow-blue-100" : "hover:border-gray-400"
                    }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {/* Main text input area */}
                  <div className="px-6 pt-6 pb-4">
                    <textarea
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about clinical guidelines, drug information, differential diagnosis..."
                      className="w-full text-gray-900 placeholder-gray-400 outline-none text-base resize-none overflow-y-auto leading-relaxed border-none"
                      style={{ 
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        minHeight: '120px', 
                        maxHeight: '200px',
                        fontSize: '16px'
                      }}
                      disabled={loading}
                      rows={5}
                    />
                  </div>

                  {/* Bottom toolbar with icons */}
                  <div className="flex items-center justify-between px-6 pb-4 pt-2 border-t border-gray-100">
                    {/* Left side - Upload button */}
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer group">
                        <input
                          type="file"
                          multiple
                          accept="image/*,.pdf,.doc,.docx"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e.target.files)}
                        />
                        <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          <span>Add tabs or files</span>
                        </div>
                      </label>
                    </div>

                    {/* Right side - Microphone and Submit */}
                    <div className="flex items-center gap-2">
                      {/* Microphone Button */}
                      <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      </button>

                      {/* Submit Button */}
                      <button
                        onClick={() => handleSubmit()}
                        disabled={(!query.trim() && uploadedFiles.length === 0) || loading}
                        className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 flex items-center justify-center transition-all duration-300 hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 text-white animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 text-white" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Drag & Drop Overlay */}
                {isDragging && (
                  <div className="absolute inset-0 bg-blue-50/90 border-2 border-dashed border-blue-400 rounded-2xl flex items-center justify-center pointer-events-none">
                    <p className="text-blue-600 font-medium">Drop files here</p>
                  </div>
                )}
              </div>
            )}

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
                onQuestionClick={async (question) => {
                  await handleSubmit(question);
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
              for (let i = 0; i < chatHistory.length; i += 2) {
                if (chatHistory[i]?.role === "user") {
                  qaPairs.push({
                    question: chatHistory[i],
                    answer: chatHistory[i + 1] || null
                  });
                }
              }

              const lastUserMessage = chatHistory[chatHistory.length - 2];
              const hasAttachments = lastUserMessage?.files && lastUserMessage.files.length > 0;

              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-8 space-y-8"
                >
                  {/* Display all Q&A pairs */}
                  {qaPairs.map((pair, pairIndex) => {
                    const isLastPair = pairIndex === qaPairs.length - 1;
                    const hasAttachmentsInPair = pair.question.files && pair.question.files.length > 0;

                    return (
                      <React.Fragment key={pairIndex}>
                        <div className="space-y-6" data-qa-pair={pairIndex}>
                          {/* Question Display - Formatted for clinical questions */}
                          {!hasAttachmentsInPair && (
                            <FormattedQuestion content={pair.question.content} />
                          )}

                        {/* User Query Section - Only show if there are attachments */}
                        {hasAttachmentsInPair && (
                          <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl shadow-lg overflow-hidden">
                            <div className="bg-gray-100 px-6 py-3 border-b border-gray-200">
                              <h3 className="text-sm font-semibold text-gray-900">Your Question</h3>
                            </div>
                            <div className="px-6 py-4">
                              <p className="text-gray-900 mb-4">{pair.question.content}</p>

                              {/* Show uploaded images */}
                              {pair.question.imageUrls && pair.question.imageUrls.length > 0 && (
                                <div className="grid grid-cols-2 gap-3 mt-4 max-w-2xl">
                                  {pair.question.imageUrls.map((imageUrl, idx) => (
                                    <div key={idx} className="relative rounded-lg overflow-hidden border border-gray-200 max-h-[200px]">
                                      <img
                                        src={`data:image/jpeg;base64,${imageUrl}`}
                                        alt={`Uploaded image ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Thinking Indicator - Show right under question, before card */}
                        {isLastPair && loading && (
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm text-gray-600">
                              {thinkingSteps.length > 0 ? thinkingSteps[thinkingSteps.length - 1] : "Analyzing query..."}
                            </span>
                          </div>
                        )}

                        {/* Evidence Loading Card - Show while gathering evidence */}
                        {isLastPair && loading && (
                          <EvidenceLoadingCard
                            isLoading={loading}
                            mode="doctor"
                          />
                        )}

                        {/* AI Response */}
                        {pair.answer && (
                            hasAttachmentsInPair ? (
                              <ResponseTabs
                                response={pair.answer.content}
                                modelUsed={modelUsed}
                                onComplete={() => isLastPair && setIsResponseComplete(true)}
                              />
                          ) : (
                            <SimpleResponse
                              response={pair.answer.content}
                              modelUsed={modelUsed}
                              onComplete={() => isLastPair && setIsResponseComplete(true)}
                              showFollowUpQuestions={isLastPair}
                              medicalImages={pair.answer.medicalImages}
                              conversationId={conversationId}
                            />
                          )
                        )}
                      </div>
                      
                      {/* Separator between Q&A pairs - not shown after last pair */}
                      {!isLastPair && (
                        <div className="my-8 border-t border-gray-200"></div>
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

        {/* Sticky Bottom Input Bar - Show after response is complete for ALL modes (Q&A and Image Analysis) */}
        {hasSubmittedQuery && isResponseComplete && chatHistory.length > 0 && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 shadow-lg z-40">
            <div className="max-w-4xl mx-auto px-6 py-4">
              <div className="flex items-center gap-3 bg-gray-50 border-2 border-gray-200 rounded-full px-6 py-3 focus-within:border-blue-400 transition-colors">
                <textarea
                  value={followUpQuery}
                  onChange={(e) => setFollowUpQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleFollowUpSubmit();
                    }
                  }}
                  placeholder={chatHistory[chatHistory.length - 2]?.files ? "Ask a follow-up question about this scan..." : "Ask a follow-up question..."}
                  className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-base resize-none overflow-y-auto"
                  disabled={loading}
                  rows={1}
                  style={{ minHeight: '24px', maxHeight: '180px' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = '24px';
                    target.style.height = Math.min(target.scrollHeight, 180) + 'px';
                  }}
                />
                <button
                  onClick={handleFollowUpSubmit}
                  disabled={!followUpQuery.trim() || loading}
                  className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 flex items-center justify-center transition-all duration-300 hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
