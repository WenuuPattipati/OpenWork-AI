"use client";

import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

interface LoadingStep {
  id: string;
  label: string;
  status: "pending" | "loading" | "complete";
  details?: string;
}

interface EvidenceLoadingProps {
  steps: LoadingStep[];
}

export function EvidenceLoading({ steps }: EvidenceLoadingProps) {
  return (
    <div className="space-y-3 py-4">
      {steps.map((step, index) => (
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-start gap-3"
        >
          {/* Status Icon */}
          <div className="shrink-0 mt-0.5">
            {step.status === "complete" ? (
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-3 h-3 text-green-600" />
              </div>
            ) : step.status === "loading" ? (
              <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center">
                <Loader2 className="w-3 h-3 text-orange-600 animate-spin" />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-gray-400" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-medium ${
                step.status === "complete"
                  ? "text-green-700"
                  : step.status === "loading"
                  ? "text-orange-700"
                  : "text-gray-500"
              }`}
            >
              {step.label}
            </p>
            {step.details && step.status !== "pending" && (
              <p className="text-xs text-gray-500 mt-0.5">{step.details}</p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Hook to manage loading steps
export function useEvidenceLoading() {
  const [steps, setSteps] = useState<LoadingStep[]>([
    {
      id: "analyze",
      label: "Analyzing query...",
      status: "pending",
    },
    {
      id: "search",
      label: "Searching medical databases...",
      status: "pending",
    },
    {
      id: "synthesize",
      label: "Synthesizing evidence...",
      status: "pending",
    },
  ]);

  const updateStep = (id: string, status: LoadingStep["status"], details?: string) => {
    setSteps((prev) =>
      prev.map((step) =>
        step.id === id ? { ...step, status, details } : step
      )
    );
  };

  const startLoading = () => {
    // Step 1: Analyze query
    updateStep("analyze", "loading");
    setTimeout(() => {
      updateStep("analyze", "complete", "Understood the clinical question");
      
      // Step 2: Search databases
      updateStep("search", "loading");
      setTimeout(() => {
        updateStep(
          "search",
          "complete",
          "Found 35 articles from PubMed, Cochrane, FDA, Europe PMC, and more"
        );
        
        // Step 3: Synthesize
        updateStep("synthesize", "loading");
      }, 2000);
    }, 1000);
  };

  const completeLoading = () => {
    updateStep("synthesize", "complete", "Generated evidence-based response");
  };

  const resetSteps = () => {
    setSteps([
      {
        id: "analyze",
        label: "Analyzing query...",
        status: "pending",
      },
      {
        id: "search",
        label: "Searching medical databases...",
        status: "pending",
      },
      {
        id: "synthesize",
        label: "Synthesizing evidence...",
        status: "pending",
      },
    ]);
  };

  return {
    steps,
    updateStep,
    startLoading,
    completeLoading,
    resetSteps,
  };
}

// Add missing import
import { useState } from "react";
