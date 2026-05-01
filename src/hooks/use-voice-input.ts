/**
 * useVoiceInput Hook
 * Handles audio recording, transcription, and intent detection
 */

"use client";

import { useState, useRef, useCallback } from "react";
import { processVoiceCommand, VoiceIntentResult } from "@/lib/services/sarvam-ai";

export interface UseVoiceInputOptions {
  role: "ngo" | "restaurant" | "volunteer" | "admin";
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

          // Process voice command
          const result = await processVoiceCommand(audioBlob, role, language);

          if (result.error) {
            const errorMsg = result.error || "Failed to process voice command";
            setLastError(errorMsg);
            onError?.(errorMsg);
          } else {
            setLastResult(result);
            setLastError(null);
            onSuccess?.(result);
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
