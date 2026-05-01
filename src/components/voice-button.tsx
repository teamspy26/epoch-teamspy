/**
 * Voice Input Button Component
 * Displays recording UI with visual feedback
 */

"use client";

import { useState, useEffect } from "react";
import { Mic, Loader, AlertCircle, CheckCircle } from "lucide-react";
import { useVoiceInput } from "@/hooks/use-voice-input";

interface VoiceResult {
  intent: string;
  confidence: number;
  parameters: Record<string, unknown>;
  rawTranscript: string;
  response?: string;
  [key: string]: any; // Allow additional properties
}

interface VoiceButtonProps {
  role: "ngo" | "restaurant" | "volunteer" | "admin" | "donor" | "supplier";
  language?: string;
  onIntentDetected?: (result: any) => void;
  onError?: (error: string) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function VoiceButton({
  role,
  language = "en-IN",
  onIntentDetected,
  onError,
  className = "",
  size = "md",
}: VoiceButtonProps) {
  const [expanded, setExpanded] = useState(false);
  const [dismissError, setDismissError] = useState(false);

  const { isRecording, isProcessing, lastResult, lastError, toggleRecording, clearResult } =
    useVoiceInput({
      role,
      language,
      onSuccess: (result) => {
        if (result.confidence > 0.5) {
          onIntentDetected?.(result);
        }
      },
      onError: (error) => {
        onError?.(error);
        setDismissError(false);
      },
    });

  // Auto-collapse after successful intent detection
  useEffect(() => {
    if (lastResult && lastResult.intent !== "unknown" && lastResult.confidence > 0.5) {
      const timer = setTimeout(() => {
        setExpanded(false);
        clearResult();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [lastResult, clearResult]);

  const sizeClasses = {
    sm: "h-9 w-9 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };

  const expandedWidth = {
    sm: "w-48",
    md: "w-64",
    lg: "w-80",
  };

  const handleMicClick = () => {
    if (!isRecording && !isProcessing) {
      setDismissError(false);
    }
    toggleRecording();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Expanded Voice Panel */}
      {expanded && (
        <div
          className={`absolute bottom-full right-0 mb-2 ${expandedWidth[size]} bg-white rounded-2xl shadow-lg border border-slate-200 p-4 z-50`}
        >
          <div className="space-y-3">
            {/* Recording Status */}
            <div>
              <p className="text-xs font-semibold text-slate-900 mb-2">Voice Input</p>
              <p className="text-xs text-slate-600 mb-3">
                {isRecording
                  ? "🎤 Listening... Speak now"
                  : isProcessing
                    ? "Processing..."
                    : lastResult
                      ? lastResult.intent === "unknown"
                        ? "Try saying something specific"
                        : `Intent: ${lastResult.intent.replace(/_/g, " ")}`
                      : "Click microphone to start"}
              </p>

              {/* Transcript Display */}
              {lastResult?.rawTranscript && (
                <div className="bg-slate-50 rounded-lg p-2 mb-3">
                  <p className="text-xs text-slate-700">
                    <span className="font-medium">You said:</span> "{lastResult.rawTranscript}"
                  </p>
                </div>
              )}

              {/* Error Display */}
              {lastError && !dismissError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg p-2 mb-3">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-red-700">{lastError}</p>
                  </div>
                  <button
                    onClick={() => setDismissError(true)}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Success Status */}
              {lastResult && lastResult.intent !== "unknown" && lastResult.confidence > 0.5 && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-lg p-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <p className="text-xs font-medium text-emerald-700">Command recognized</p>
                </div>
              )}
            </div>

            {/* Language Selector */}
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-1">Language: {language}</p>
              <div className="flex gap-1 flex-wrap">
                {["en-IN", "hi", "ta", "te"].map((lang) => (
                  <button
                    key={lang}
                    disabled={true}
                    className="text-xs px-2 py-1 rounded border border-slate-200 bg-white text-slate-600 opacity-50"
                  >
                    {lang === "en-IN" ? "English" : lang === "hi" ? "हिंदी" : lang === "ta" ? "தமிழ்" : "తెలుగు"}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-1">Language switching coming soon</p>
            </div>
          </div>
        </div>
      )}

      {/* Microphone Button */}
      <button
        onClick={() => {
          handleMicClick();
          if (!isRecording && !isProcessing) setExpanded(!expanded);
        }}
        disabled={isProcessing}
        className={`
          relative flex items-center justify-center rounded-full transition-all
          ${sizeClasses[size]}
          ${
            isRecording
              ? "bg-red-500 text-white shadow-lg shadow-red-500/50 animate-pulse"
              : isProcessing
                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/50"
                : lastResult && lastResult.confidence > 0.5
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/50"
                  : "bg-[#1D9E75] text-white hover:bg-[#156b5a] shadow-md"
          }
          ${isProcessing ? "opacity-75 cursor-not-allowed" : "cursor-pointer"}
        `}
        title={isRecording ? "Stop recording" : "Start voice input"}
      >
        {isProcessing ? (
          <Loader className="h-5 w-5 animate-spin" />
        ) : (
          <Mic className={`${size === "sm" ? "h-4 w-4" : size === "md" ? "h-5 w-5" : "h-6 w-6"}`} />
        )}

        {/* Recording indicator pulse */}
        {isRecording && (
          <>
            <span className="absolute inset-0 rounded-full bg-red-500 animate-ping" />
          </>
        )}
      </button>

      {/* Tooltip on hover */}
      {!expanded && (
        <div className="absolute bottom-full right-0 mb-2 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            Voice input
          </div>
        </div>
      )}
    </div>
  );
}
