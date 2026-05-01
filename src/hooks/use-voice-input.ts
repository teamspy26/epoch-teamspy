/**
 * useVoiceInput Hook
 * Handles audio recording, transcription, intent detection, and TTS response
 * Uses the existing /api/voice endpoint for full pipeline
 */

"use client";

import { useState, useRef, useCallback } from "react";

interface VoiceIntentResult {
  intent: string;
  confidence: number;
  parameters: Record<string, unknown>;
  rawTranscript: string;
  response?: string;
  audioBase64?: string;
}

interface UseVoiceInputOptions {
  role: "ngo" | "restaurant" | "volunteer" | "admin" | "donor" | "supplier";
  language?: string;
  onSuccess?: (result: VoiceIntentResult) => void;
  onError?: (error: string) => void;
}

export interface UseVoiceInputReturn {
  isRecording: boolean;
  isProcessing: boolean;
  lastResult: VoiceIntentResult | null;
  lastError: string | null;
  startRecording: () => void;
  stopRecording: () => void;
  toggleRecording: () => void;
  clearResult: () => void;
}

export function useVoiceInput(options: UseVoiceInputOptions): UseVoiceInputReturn {
  const { role, language = "en-IN", onSuccess, onError } = options;
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<VoiceIntentResult | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        try {
          // Create audio blob
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

          // Send to /api/voice endpoint (existing full pipeline)
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.webm");
          formData.append("role", role);
          formData.append("language_code", language);

          const response = await fetch("/api/voice", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const data = (await response.json().catch(() => ({ error: "Unknown error" }))) as {
              error?: string;
              detail?: string;
            };
            throw new Error(data.error || data.detail || "Voice processing failed");
          }

          const data = (await response.json()) as {
            transcript?: string;
            intent?: string;
            confidence?: number;
            parameters?: Record<string, unknown>;
            answerText?: string;
            audioBase64?: string;
          };

          const result: VoiceIntentResult = {
            intent: data.intent || "unknown",
            confidence: data.confidence || 0,
            parameters: data.parameters || {},
            rawTranscript: data.transcript || "",
            response: data.answerText,
          };

          setLastResult(result);
          setLastError(null);
          onSuccess?.(result);

          // Play audio response if available
          if (data.audioBase64) {
            playAudioResponse(data.audioBase64);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Processing failed";
          setLastError(errorMsg);
          onError?.(errorMsg);
        } finally {
          setIsProcessing(false);

          // Stop all tracks
          streamRef.current?.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setLastError(null);
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Microphone access denied or not available";
      setLastError(errorMsg);
      onError?.(errorMsg);
    }
  }, [role, language, onSuccess, onError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const clearResult = useCallback(() => {
    setLastResult(null);
    setLastError(null);
  }, []);

  return {
    isRecording,
    isProcessing,
    lastResult,
    lastError,
    startRecording,
    stopRecording,
    toggleRecording,
    clearResult,
  };
}

/**
 * Play audio response using Web Audio API
 */
function playAudioResponse(base64Audio: string) {
  try {
    // Decode base64 to binary
    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Create blob and play
    const blob = new Blob([bytes], { type: "audio/wav" });
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    audio.play().catch((err) => console.warn("[Audio playback]", err));

    // Clean up URL after playback
    audio.onended = () => URL.revokeObjectURL(audioUrl);
  } catch (err) {
    console.warn("[Audio response playback error]", err);
  }
}
