"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RotatingTextProps {
  words: string[];
  interval?: number; // milliseconds between word changes
  className?: string;
}

export function RotatingText({ words, interval = 2500, className = "" }: RotatingTextProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (words.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, interval);

    return () => clearInterval(timer);
  }, [words.length, interval]);

  if (words.length === 0) return null;

  return (
    <span className={`inline-block ${className}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={currentIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ 
            duration: 0.3,
            ease: "easeInOut"
          }}
          className="inline-block"
        >
          {words[currentIndex]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}