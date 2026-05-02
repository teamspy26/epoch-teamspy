"use client";
import { useState, useCallback, useRef } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useTranslation } from "@/context/language-context";
import type { VoiceIntentResult } from "@/lib/services/sarvam-ai";

const langMap: Record<string, string> = {
  english: "en-IN",
  kannada: "kn-IN",
  hindi: "hi-IN",
};

function playBase64Audio(base64: string): void {
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => URL.revokeObjectURL(url);
    audio.onerror = () => URL.revokeObjectURL(url);
    audio.play().catch(() => URL.revokeObjectURL(url));
  } catch {
    // ignore playback errors silently
  }
}

function browserSpeak(text: string, lang: string): void {
  if (!("speechSynthesis" in window)) return;
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = lang;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utt);
}

interface VoiceButtonProps {
  role: string;
  onIntentDetected: (result: VoiceIntentResult) => void;
  onError: (error: string) => void;
}

export function VoiceButton({ role, onIntentDetected, onError }: VoiceButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { language } = useTranslation();
  const langCode = langMap[language] ?? "en-IN";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const processTranscript = useCallback(
    async (transcript: string) => {
      setIsProcessing(true);
      try {
        const res = await fetch("/api/voice-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: transcript, role, language_code: langCode }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Processing failed");

        const result: VoiceIntentResult = {
          intent: data.intent ?? "unknown",
          confidence: data.confidence ?? 1,
          parameters: data.parameters ?? {},
          answerText: data.answerText ?? "",
          audioBase64: data.audioBase64 ?? null,
        };

        if (data.audioBase64) {
          playBase64Audio(data.audioBase64);
        } else if (data.answerText) {
          browserSpeak(data.answerText, langCode);
        }

        onIntentDetected(result);
      } catch (err) {
        onError(err instanceof Error ? err.message : "Voice processing failed");
      } finally {
        setIsProcessing(false);
      }
    },
    [role, langCode, onIntentDetected, onError]
  );

  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) {
      onError("Speech recognition not supported. Please use Chrome or Edge.");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition: any = new SR();
    recognition.lang = langCode;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript: string = event.results[0][0].transcript;
      setIsListening(false);
      processTranscript(transcript);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event.error === "not-allowed") {
        onError("Microphone access denied. Please allow mic access in your browser.");
      } else if (event.error !== "no-speech" && event.error !== "aborted") {
        onError(`Speech recognition error: ${event.error}`);
      }
      // no-speech / aborted are normal timeouts — reset silently
    };

    recognition.onend = () => setIsListening(false);
    recognition.start();
    setIsListening(true);
  }, [langCode, onError, processTranscript]);

  const handleClick = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      startListening();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isProcessing}
      title={isListening ? "Tap to stop listening" : "Tap to speak a command"}
      className={`p-2 rounded-lg transition-colors ${
        isListening
          ? "bg-red-500 text-white animate-pulse"
          : isProcessing
          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
          : "bg-[#1D9E75] text-white hover:bg-[#178862]"
      }`}
    >
      {isProcessing ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : isListening ? (
        <MicOff className="h-5 w-5" />
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </button>
  );
}
