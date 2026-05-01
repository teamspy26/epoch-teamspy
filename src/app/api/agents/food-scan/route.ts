import { NextRequest, NextResponse } from "next/server";
import openai, { MODELS } from "@/lib/openai";
import { logAgentDecision } from "@/lib/firebase/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    // Accept either base64 data URL (preferred) or a remote imageUrl
    const { imageData, imageUrl, userId } = await req.json() as {
      imageData?: string;
      imageUrl?: string;
      userId: string;
    };

    const imageSource = imageData ?? imageUrl;
    if (!imageSource) {
      return NextResponse.json({ error: "imageData or imageUrl required" }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: MODELS.vision,
      messages: [
        {
          role: "system",
          content: `You are a food safety expert for Prasadam, India's food redistribution platform.
An individual donor has uploaded a photo of food they want to donate.

Assess the food and respond ONLY with valid JSON in this exact shape:
{
  "safe": true | false,
  "foodName": "descriptive name (e.g. 'Rice and dal', 'Biryani', 'Rotis')",
  "estimatedServings": number (how many people this can feed, minimum 1),
  "freshness": "fresh" | "acceptable" | "questionable" | "expired",
  "confidence": "high" | "medium" | "low",
  "issues": ["issue1", "issue2"] or [],
  "recommendation": "one warm, clear sentence — encourage if safe, explain kindly if not",
  "category": "cooked_meal" | "raw_produce" | "packaged" | "bakery" | "other"
}

Guidelines:
- "safe": true for fresh/acceptable food. false only for visibly moldy, rotten, or clearly expired food.
- Be encouraging — lean towards accepting borderline cases.
- If the image is blurry or not food, set safe: false and explain in recommendation.`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Assess this food donation photo:" },
            { type: "image_url", image_url: { url: imageSource, detail: "auto" } },
          ],
        },
      ],
      max_tokens: 600,
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0].message.content ?? "{}";
    const result = JSON.parse(raw) as {
      safe: boolean;
      foodName: string;
      estimatedServings: number;
      freshness: string;
      confidence: string;
      issues: string[];
      recommendation: string;
      category: string;
    };

    // Ensure required fields have defaults so UI never crashes
    result.foodName = result.foodName ?? "Unknown food";
    result.estimatedServings = result.estimatedServings ?? 1;
    result.freshness = result.freshness ?? "questionable";
    result.confidence = result.confidence ?? "low";
    result.issues = result.issues ?? [];
    result.recommendation = result.recommendation ?? "Please try a clearer photo.";
    result.category = result.category ?? "other";

    // Fire-and-forget — never let logging block or fail the response
    logAgentDecision("food_scan", result.safe ? "approved" : "rejected", {
      userId,
      foodName: result.foodName,
      estimatedServings: result.estimatedServings,
      freshness: result.freshness,
      confidence: result.confidence,
    }).catch(() => {});

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[Food Scan Agent]", error);
    return NextResponse.json({ error: "Scan failed. Please try again." }, { status: 500 });
  }
}
