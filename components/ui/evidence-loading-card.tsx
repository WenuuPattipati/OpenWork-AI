"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Image from "next/image";

// Testimonials from medical institutions and partners
const TESTIMONIALS = [
  {
    quote: "OpenWork AI synthesizes medical literature from PubMed, DailyMed, Cochrane Library, Europe PMC, etc. into comprehensive research summaries. A powerful tool for evidence-based literature review and analysis.",
    author: "Clinical Research Team",
    organization: "National Library of Medicine",
  },
  {
    quote: "Synthesizing research from PubMed Central, FDA databases, clinical guidelines, systematic reviews, etc., OpenWork AI delivers comprehensive literature analysis and evidence summaries in seconds.",
    author: "Evidence-Based Medicine Initiative",
    organization: "PubMed & Cochrane Partnership",
  },
  {
    quote: "From systematic reviews to FDA drug labels, OpenWork AI brings the world's medical research literature to your fingertips for analysis.",
    author: "Digital Health Innovation",
    organization: "Medical Database Consortium",
  },
  {
    quote: "OpenWork AI accelerates literature review by synthesizing peer-reviewed research from PubMed, clinical guidelines, DailyMed, Europe PMC, etc. into cited, evidence-based summaries.",
    author: "Healthcare Technology",
    organization: "Research Synthesis Alliance",
  },
];

// Evidence source logos with their details
const EVIDENCE_SOURCES = [
  {
    name: "PubMed",
    logo: "/logos/pubmed.png",
    description: "30M+ biomedical articles",
  },
  {
    name: "Cochrane Library",
    logo: "/logos/cochrane library.jpg",
    description: "Gold standard systematic reviews",
  },
  {
    name: "National Library of Medicine",
    logo: "/logos/national library of medicine.png",
    description: "Official NLM resources",
  },
  {
    name: "Europe PMC",
    logo: "/logos/europe pmc.png",
    description: "European research database",
  },
  {
    name: "OpenFDA",
    logo: "/logos/open fda.png",
    description: "FDA drug & safety data",
  },
  {
    name: "DailyMed",
    logo: "/logos/DailyMedLogo.png",
    description: "FDA drug labels & prescribing info",
  },
  {
    name: "MedlinePlus",
    logo: "/logos/MedlinePlus.png",
    description: "Consumer health information",
  },
  {
    name: "AAP Guidelines",
    logo: "/logos/AAP.jpg",
    description: "Pediatric clinical guidelines",
  },
  {
    name: "Semantic Scholar",
    logo: "/logos/Semantic Scholar.png",
    description: "AI-powered research",
  },
  {
    name: "OpenAlex",
    logo: "/logos/OpenAlex.webp",
    description: "Open scholarly metadata",
  },
];

interface EvidenceLoadingCardProps {
  isLoading: boolean;
  currentStep?: string;
  mode?: 'doctor' | 'general';
}

export function EvidenceLoadingCard({ isLoading, currentStep, mode = 'doctor' }: EvidenceLoadingCardProps) {
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [currentLogoIndex, setCurrentLogoIndex] = useState(0);

  // Rotate testimonials every 5 seconds
  useEffect(() => {
    if (!isLoading) return;
    
    const testimonialInterval = setInterval(() => {
      setCurrentTestimonialIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);

    return () => clearInterval(testimonialInterval);
  }, [isLoading]);

  // Rotate logos every 2 seconds
  useEffect(() => {
    if (!isLoading) return;
    
    const logoInterval = setInterval(() => {
      setCurrentLogoIndex((prev) => (prev + 1) % EVIDENCE_SOURCES.length);
    }, 2000);

    return () => clearInterval(logoInterval);
  }, [isLoading]);

  if (!isLoading) return null;

  const currentTestimonial = TESTIMONIALS[currentTestimonialIndex];
  const currentSource = EVIDENCE_SOURCES[currentLogoIndex];
  // Show 3 logos at a time
  const visibleLogos = [
    EVIDENCE_SOURCES[currentLogoIndex],
    EVIDENCE_SOURCES[(currentLogoIndex + 1) % EVIDENCE_SOURCES.length],
    EVIDENCE_SOURCES[(currentLogoIndex + 2) % EVIDENCE_SOURCES.length],
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-2xl mx-auto my-8"
    >
      {/* Main Card */}
      <div className="rounded-2xl overflow-hidden shadow-xl">
        {/* Testimonial Section - Gradient Background (different colors for doctor vs general) */}
        <div className={`p-8 md:p-10 text-white relative overflow-hidden ${
          mode === 'doctor' 
            ? 'bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900' 
            : 'bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-800'
        }`}>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          {/* Quote */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTestimonialIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="relative z-10"
            >
              <p className="text-xl md:text-2xl font-serif italic leading-relaxed text-center mb-6">
                "{currentTestimonial.quote}"
              </p>
              
              {/* Divider */}
              <div className="w-16 h-0.5 bg-white/30 mx-auto mb-4" />
              
              {/* Attribution */}
              <p className="text-center text-white/90 text-sm">
                <span className="font-medium">{currentTestimonial.author}</span>
                <span className="text-white/70">, </span>
                <span className="italic text-white/80">{currentTestimonial.organization}</span>
              </p>
            </motion.div>
          </AnimatePresence>
          
          {/* Testimonial dots indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {TESTIMONIALS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentTestimonialIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentTestimonialIndex 
                    ? 'bg-white w-6' 
                    : 'bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Evidence Sources Section - Light Background */}
        <div className="bg-white p-6 border-t border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-4 text-center font-medium">
            Featuring evidence and clinical findings from
          </p>
          
          {/* Rotating Logos */}
          <div className="flex items-center justify-center gap-8">
            <AnimatePresence mode="wait">
              {visibleLogos.map((source, idx) => (
                <motion.div
                  key={`${source.name}-${currentLogoIndex}-${idx}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="h-12 w-24 relative flex items-center justify-center grayscale hover:grayscale-0 transition-all">
                    <Image
                      src={source.logo}
                      alt={source.name}
                      width={96}
                      height={48}
                      className="object-contain max-h-12"
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* OpenWork AI Logo/Text - Styled to match welcome banner */}
            <div className="flex items-center gap-2 pl-6 border-l-2 border-gray-300">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-gray-900 tracking-tight">OpenWork</span>
                <span className="text-base font-bold text-amber-600">AI</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Compact version for inline use
export function EvidenceLoadingCompact({ isLoading }: { isLoading: boolean }) {
  const [currentLogoIndex, setCurrentLogoIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) return;
    
    const interval = setInterval(() => {
      setCurrentLogoIndex((prev) => (prev + 1) % EVIDENCE_SOURCES.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isLoading) return null;

  const currentSource = EVIDENCE_SOURCES[currentLogoIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200"
    >
      <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
      <div className="flex items-center gap-2">
        <span className="text-sm text-amber-800">Searching</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={currentLogoIndex}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-sm font-medium text-amber-900"
          >
            {currentSource.name}
          </motion.span>
        </AnimatePresence>
        <span className="text-sm text-amber-800">and 45+ medical databases...</span>
      </div>
    </motion.div>
  );
}
