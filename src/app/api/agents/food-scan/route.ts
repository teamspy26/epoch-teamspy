/**
 * Food Scan Agent — OpenAI Vision analyses a photo uploaded by an individual donor.
 * Returns: freshness, food name, estimated servings, and whether it's safe to donate.
 */

import { NextRequest, NextResponse } from "next/server";
import openai, { MODELS } from "@/lib/openai";
import { logAgentDecision } from "@/lib/firebase/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, userId } = await req.json() as { imageUrl: string; userId: string };

    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl required" }, { status: 400 });
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
  "foodName": "descriptive name of the food (e.g. 'Rice and dal', 'Biryani', 'Rotis')",
  "estimatedServings": number (estimate how many people this can feed, minimum 1),
  "freshness": "fresh" | "acceptable" | "questionable" | "expired",
  "confidence": "high" | "medium" | "low",
  "issues": ["issue1", "issue2"] or [],
  "recommendation": "one warm, clear sentence on what to do — if safe, encourage them; if not, explain kindly",
  "category": "cooked_meal" | "raw_produce" | "packaged" | "bakery" | "other"
}

Be encouraging to donors. If there's reasonable doubt, lean towards accepting — we never want to discourage genuine generosity.
A dish that looks slightly imperfect but is clearly fresh and cooked should pass.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please assess this food donation photo for safe redistribution:",
            },
            {
              type: "image_url",
              image_url: { url: imageUrl, detail: "high" },
            },
          ],
        },
      ],
      max_tokens: 400,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content ?? "{}") as {
      safe: boolean;
      foodName: string;
      estimatedServings: number;
      freshness: string;
      confidence: string;
      issues: string[];
      recommendation: string;
      category: string;
    };

    await logAgentDecision("food_scan", result.safe ? "approved" : "rejected", {
      userId,
      foodName: result.foodName,
      estimatedServings: result.estimatedServings,
      freshness: result.freshness,
      confidence: result.confidence,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[Food Scan Agent]", error);
    return NextResponse.json({ error: "Scan failed" }, { status: 500 });
  }
}
