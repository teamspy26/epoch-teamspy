/**
 * Sarvam AI Service
 * Handles speech-to-text transcription and intent detection
 */

interface SarvamTranscribeResponse {
  transcript: string;
  language: string;
  duration: number;
}

interface TranscriptionResult {
  success: boolean;
  transcript: string;
  language: string;
  duration: number;
  error?: string;
}

export async function transcribeAudio(
  audioBlob: Blob,
  language: string = "en-IN"
): Promise<TranscriptionResult> {
  try {
    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.webm");
    formData.append("language_code", language);

    const response = await fetch("/api/voice", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.detail || "Transcription failed");
    }

    const data = await response.json();
    return {
      success: true,
      transcript: data.transcript,
      language: language,
      duration: 0, // Backend might not provide duration
    };
  } catch (error) {
    console.error("[Voice] Transcription error:", error);
    return {
      success: false,
      transcript: "",
      language: "",
      duration: 0,
      error: error instanceof Error ? error.message : "Transcription failed",
    };
  }
}

/**
 * Intent Detection for different roles
 * Analyzes transcribed text and extracts intent + parameters
 */

export type VoiceIntent =
  | "create_request" // NGO: create food request
  | "find_food" // NGO: find available food
  | "check_status" // NGO/Restaurant/Volunteer: check status
  | "approve_match" // Restaurant: approve food match
  | "decline_match" // Restaurant: decline food match
  | "accept_delivery" // Volunteer: accept delivery
  | "mark_picked_up" // Volunteer: mark picked up
  | "mark_in_transit" // Volunteer: mark in transit
  | "mark_delivered" // Volunteer: mark delivered
  | "start_pickups" // Volunteer: start route
  | "show_stats" // Admin: show statistics
  | "list_escalations" // Admin: list escalations
  | "resolve_escalation" // Admin: resolve escalation
  | "toggle_auto_approve" // Restaurant: toggle auto-approve
  | "unknown"; // Unable to determine intent

export interface VoiceIntentResult {
  intent: VoiceIntent;
  confidence: number; // 0-1
  parameters: Record<string, unknown>;
  rawTranscript: string;
}

// Intent keyword mapping for each role
const INTENT_KEYWORDS: Record<string, Record<string, VoiceIntent>> = {
  ngo: {
    "need food|request food|require food|need meals|request meals": "create_request",
    "show food|find food|available food|nearby food": "find_food",
    "check status|status|what status": "check_status",
  },
  restaurant: {
    "approve|yes|ok|accept": "approve_match",
    "decline|no|reject|refuse": "decline_match",
    "check status|status": "check_status",
    "auto approve|turn on approval|enable auto": "toggle_auto_approve",
  },
  volunteer: {
    "accept|i'll do|i will do|take this": "accept_delivery",
    "picked up|mark picked|pickup done": "mark_picked_up",
    "in transit|on the way|started delivery": "mark_in_transit",
    "delivered|dropped|completed": "mark_delivered",
    "start|begin|start pickups|route": "start_pickups",
    "check status|status": "check_status",
  },
  admin: {
    "show stats|today stats|statistics|tell me stats": "show_stats",
    "escalations|show escalations|list escalations": "list_escalations",
    "resolve|resolve escalation": "resolve_escalation",
    "check status|status": "check_status",
  },
};

export function detectIntent(
  transcript: string,
  role: "ngo" | "restaurant" | "volunteer" | "admin"
): VoiceIntentResult {
  const normalizedTranscript = transcript.toLowerCase().trim();
  const roleKeywords = INTENT_KEYWORDS[role] || {};

  // Find matching intent
  let matchedIntent: VoiceIntent = "unknown";
  let maxMatchLength = 0;

  for (const [keywords, intent] of Object.entries(roleKeywords)) {
    const keywordList = keywords.split("|");
    for (const keyword of keywordList) {
      if (normalizedTranscript.includes(keyword) && keyword.length > maxMatchLength) {
        matchedIntent = intent;
        maxMatchLength = keyword.length;
      }
    }
  }

  // Extract parameters based on intent
  const parameters = extractParameters(normalizedTranscript, matchedIntent);

  // Confidence based on match quality
  const confidence = maxMatchLength > 0 ? 0.8 + Math.min(0.2, maxMatchLength / 50) : 0.2;

  return {
    intent: matchedIntent,
    confidence,
    parameters,
    rawTranscript: transcript,
  };
}

function extractParameters(
  transcript: string,
  intent: VoiceIntent
): Record<string, unknown> {
  const params: Record<string, unknown> = {};

  switch (intent) {
    case "create_request":
      // Extract quantity from text like "5 meals" or "50 servings"
      const quantityMatch = transcript.match(/(\d+)\s*(meal|serving|person|people)/i);
      if (quantityMatch) {
        params.quantity = parseInt(quantityMatch[1]);
      }
      // Extract urgency from text like "urgent" or "asap"
      if (transcript.match(/urgent|asap|immediately|right now/i)) {
        params.urgency = "urgent";
      }
      break;

    case "approve_match":
      params.approval = true;
      break;

    case "decline_match":
      params.approval = false;
      break;

    case "mark_picked_up":
      params.status = "picked_up";
      break;

    case "mark_in_transit":
      params.status = "in_transit";
      break;

    case "mark_delivered":
      params.status = "delivered";
      break;

    case "toggle_auto_approve":
      params.toggle = true;
      break;
  }

  return params;
}

/**
 * Main voice processing pipeline
 */
export async function processVoiceCommand(
  audioBlob: Blob,
  role: "ngo" | "restaurant" | "volunteer" | "admin",
  language: string = "en-IN"
): Promise<VoiceIntentResult & { error?: string }> {
  // Step 1: Transcribe audio
  const transcriptionResult = await transcribeAudio(audioBlob, language);

  if (!transcriptionResult.success) {
    return {
      intent: "unknown",
      confidence: 0,
      parameters: {},
      rawTranscript: "",
      error: transcriptionResult.error,
    };
  }

  // Step 2: Detect intent from transcript
  const intentResult = detectIntent(transcriptionResult.transcript, role);

  return intentResult;
}

/**
 * Map role names from different dashboard types
 */
export function normalizeRole(role: string): "ngo" | "restaurant" | "volunteer" | "admin" {
  const roleMap: Record<string, "ngo" | "restaurant" | "volunteer" | "admin"> = {
    ngo: "ngo",
    restaurant: "restaurant",
    donor: "restaurant", // Donor dashboard uses restaurant role
    supplier: "restaurant",
    volunteer: "volunteer",
    admin: "admin",
  };
  return roleMap[role.toLowerCase()] || "volunteer";
}
