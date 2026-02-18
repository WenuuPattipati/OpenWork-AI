"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ZoomOut, Download, Info } from "lucide-react";
import { useState } from "react";

interface ImageLightboxProps {
  imageUrl: string;
  title: string;
  source?: string;
  license?: string;
  onClose: () => void;
}

export function ImageLightbox({ imageUrl, title, source, license, onClose }: ImageLightboxProps) {
  const [zoom, setZoom] = useState(1);
  const [showCredits, setShowCredits] = useState(true); // Auto-show credits when lightbox opens

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = title || 'medical-image';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get credit information based on source
  const getCreditInfo = () => {
    if (!source) return null;
    
    const sourceLower = source.toLowerCase();
    
    if (sourceLower.includes('open-i') || sourceLower.includes('nlm') || sourceLower.includes('openi')) {
      return {
        name: 'Open-i (NLM)',
        fullName: 'Open-i, National Library of Medicine',
        description: 'Image from Open-i, a service of the U.S. National Library of Medicine. Open-i provides access to biomedical images from PubMed Central and other open-access sources.',
        link: 'https://openi.nlm.nih.gov/',
        license: license || 'Free for reuse with attribution',
        required: true // Attribution required
      };
    } else if (sourceLower.includes('injurymap')) {
      return {
        name: 'InjuryMap',
        fullName: 'InjuryMap Free Human Anatomy Illustrations',
        description: 'Image from InjuryMap. Free human anatomy illustrations for medical education and communication.',
        link: 'https://www.injurymap.com/free-human-anatomy-illustrations',
        license: license || 'CC BY 4.0',
        required: true // Attribution required by CC BY 4.0
      };
    } else if (sourceLower.includes('web search')) {
      return {
        name: 'Web Search',
        fullName: 'Web Search Result',
        description: 'Image obtained from web search. Please verify licensing and attribution requirements.',
        link: null,
        license: license || 'Unknown - verify before reuse',
        required: false
      };
    }
    
    return {
      name: source,
      fullName: source,
      description: license || 'Medical educational image',
      link: null,
      license: license || 'Unknown',
      required: false
    };
  };

  const creditInfo = getCreditInfo();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      {/* Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        {creditInfo && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowCredits(!showCredits);
            }}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors backdrop-blur-sm"
            title={showCredits ? "Hide credits" : "Show credits"}
          >
            <Info className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleZoomOut();
          }}
          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors backdrop-blur-sm"
          title="Zoom out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleZoomIn();
          }}
          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors backdrop-blur-sm"
          title="Zoom in"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDownload();
          }}
          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors backdrop-blur-sm"
          title="Download"
        >
          <Download className="w-5 h-5" />
        </button>
        <button
          onClick={onClose}
          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors backdrop-blur-sm"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Credits Panel */}
      {showCredits && creditInfo && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="absolute top-20 right-4 max-w-md p-5 bg-white rounded-lg shadow-2xl z-20 border border-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-base font-bold text-gray-900">Image Credits</h3>
            {creditInfo.required && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                Attribution Required
              </span>
            )}
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Source</p>
              <p className="text-sm text-gray-900 font-medium">{creditInfo.fullName}</p>
            </div>
            
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">License</p>
              <p className="text-sm text-gray-900">{creditInfo.license}</p>
            </div>
            
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</p>
              <p className="text-xs text-gray-700 leading-relaxed">{creditInfo.description}</p>
            </div>
            
            {creditInfo.link && (
              <div className="pt-2 border-t border-gray-200">
                <a
                  href={creditInfo.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Visit {creditInfo.name} →
                </a>
              </div>
            )}
            
            {creditInfo.required && (
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-600 italic">
                  When using this image, please include attribution to {creditInfo.name}.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Image */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-7xl max-h-[90vh] overflow-auto"
        style={{
          transform: `scale(${zoom})`,
          transition: 'transform 0.2s ease-out'
        }}
      >
        <img
          src={imageUrl}
          alt={title}
          className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
        />
      </motion.div>

      {/* Title with better visibility - white background with shadow */}
      {title && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-2xl px-6 py-3 bg-white rounded-lg shadow-xl">
          <p className="text-sm text-center text-gray-900 font-medium">{title}</p>
        </div>
      )}
    </motion.div>
  );
}
