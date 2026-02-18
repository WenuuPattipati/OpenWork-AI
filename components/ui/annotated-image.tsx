import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface VisualFinding {
  finding: string;
  severity: 'critical' | 'moderate' | 'mild';
  coordinates: [number, number, number, number]; // ymin, xmin, ymax, xmax
  label: string;
  fileIndex?: number;
}

interface AnnotatedImageProps {
  imageUrl: string;
  findings: VisualFinding[];
  fileIndex: number;
}

export function AnnotatedImage({ imageUrl, findings, fileIndex }: AnnotatedImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Filter findings for this specific image
  const imageFindings = findings.filter(f => f.fileIndex === undefined || f.fileIndex === fileIndex);

  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-100 mb-4">
      <div className="relative aspect-video md:aspect-auto md:max-h-[500px] flex items-center justify-center">
        <img
          src={`data:image/jpeg;base64,${imageUrl}`}
          alt="Analyzed medical scan"
          className={`max-w-full max-h-[500px] object-contain transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
        />
        
        {/* Overlay Bounding Boxes */}
        {imageLoaded && imageFindings.map((finding, idx) => {
          const [ymin, xmin, ymax, xmax] = finding.coordinates;
          // Valid coordinates check (0-1000 range usually from some models, or 0-1)
          // If all 0, skip
          if (ymin === 0 && xmin === 0 && ymax === 0 && xmax === 0) return null;

          const top = `${ymin / 10}%`;
          const left = `${xmin / 10}%`;
          const width = `${(xmax - xmin) / 10}%`;
          const height = `${(ymax - ymin) / 10}%`;

          const color = finding.severity === 'critical' ? 'border-red-500' : 
                        finding.severity === 'moderate' ? 'border-yellow-500' : 'border-blue-500';

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + (idx * 0.1) }}
              className={`absolute ${color} border-2 bg-transparent z-10`}
              style={{ top, left, width, height }}
            >
              <div className="absolute -top-6 left-0 bg-black/75 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {finding.label}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
