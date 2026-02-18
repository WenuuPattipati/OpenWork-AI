"use client";

import { useState } from "react";
import { FileText, User, BookOpen, Share2, Check } from "lucide-react";

interface QuickActionsProps {
  mode: "doctor" | "general";
  responseContent: string;
  onAction: (action: string) => void;
}

export function QuickActions({ mode, responseContent, onAction }: QuickActionsProps) {
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState(false);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "OpenWork AI Response",
          text: responseContent.substring(0, 200) + "...",
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(responseContent);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      }
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const actions = mode === "doctor" 
    ? [
        {
          id: "summarize",
          label: "Summarize in 2+ bullets",
          icon: FileText,
          action: () => onAction("summarize-doctor"),
        },
        {
          id: "explain",
          label: "Explain like I'm a doctor",
          icon: User,
          action: () => onAction("explain-doctor"),
        },
        {
          id: "guidelines",
          label: "Show only guidelines",
          icon: BookOpen,
          action: () => onAction("guidelines-only"),
        },
        {
          id: "share",
          label: shareSuccess ? "Copied!" : "Share",
          icon: shareSuccess ? Check : Share2,
          action: handleShare,
        },
      ]
    : [
        {
          id: "summarize",
          label: "Summarize in 1-2 bullets",
          icon: FileText,
          action: () => onAction("summarize-patient"),
        },
        {
          id: "explain",
          label: "Explain like I'm a patient",
          icon: User,
          action: () => onAction("explain-patient"),
        },
        {
          id: "guidelines",
          label: "Show only guidelines",
          icon: BookOpen,
          action: () => onAction("guidelines-only"),
        },
        {
          id: "share",
          label: shareSuccess ? "Copied!" : "Share",
          icon: shareSuccess ? Check : Share2,
          action: handleShare,
        },
      ];

  return (
    <div className="flex flex-wrap gap-2 py-4">
      {actions.map((action) => {
        const Icon = action.icon;
        const isActive = activeAction === action.id;
        const isShare = action.id === "share";
        
        return (
          <button
            key={action.id}
            onClick={() => {
              setActiveAction(action.id);
              action.action();
              if (!isShare) {
                setTimeout(() => setActiveAction(null), 2000);
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all text-sm font-medium ${
              isActive
                ? "bg-blue-50 border-blue-300 text-blue-700"
                : shareSuccess && isShare
                ? "bg-green-50 border-green-300 text-green-700"
                : "bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
