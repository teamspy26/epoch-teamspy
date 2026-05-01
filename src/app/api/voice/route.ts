import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Sarvam API key not configured" }, { status: 503 });
  }

  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as File | null;
    const languageCode = (formData.get("language_code") as string) || "unknown";

    if (!audio) {
      return NextResponse.json({ error: "audio file required" }, { status: 400 });
    }

    // Preserve the actual content-type so Sarvam knows the format (webm, mp4, wav, etc.)
    const mimeType = audio.type || "audio/webm";
    const ext = mimeType.includes("mp4") ? "mp4" : mimeType.includes("wav") ? "wav" : "webm";

    const sarvamForm = new FormData();
    sarvamForm.append("file", new Blob([await audio.arrayBuffer()], { type: mimeType }), `recording.${ext}`);
    sarvamForm.append("model", "saarika:v2");
    sarvamForm.append("language_code", languageCode);
    sarvamForm.append("with_timestamps", "false");
    sarvamForm.append("with_disfluencies", "false");

    const res = await fetch("https://api.sarvam.ai/speech-to-text", {
      method: "POST",
      headers: { "api-subscription-key": apiKey },
      body: sarvamForm,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[Sarvam STT]", res.status, errText);
      return NextResponse.json({ error: "Speech recognition failed", detail: errText }, { status: 502 });
    }

    const data = await res.json() as { transcript?: string; request_id?: string };
    const transcript = (data.transcript ?? "").trim();

    return NextResponse.json({ transcript, requestId: data.request_id });
  } catch (err) {
    console.error("[Voice route]", err);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }
}
