export type VoiceIntentResult = {
  intent: string;
  confidence: number;
  parameters: Record<string, unknown>;
  answerText: string;
  audioBase64?: string | null;
};
