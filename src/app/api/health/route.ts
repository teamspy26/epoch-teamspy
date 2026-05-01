import { NextResponse } from "next/server";

export async function GET() {
  const checks = {
    openaiApiKey: !!process.env.OPENAI_API_KEY,
    sarvamApiKey: !!process.env.NEXT_PUBLIC_SARVAM_API_KEY,
    firebaseProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    whatsappApiKey: !!process.env.WHATSAPP_API_KEY,
  };

  const allConfigured = Object.values(checks).every((v) => v);

  return NextResponse.json(
    {
      status: allConfigured ? "✅ All configured" : "⚠️ Some keys missing",
      checks,
      missingKeys: Object.entries(checks)
        .filter(([, v]) => !v)
        .map(([k]) => k),
    },
    {
      status: allConfigured ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
