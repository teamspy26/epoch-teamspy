import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { COLLECTIONS } from "@/lib/firebase/db";
import type { FoodRequest } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { requestId } = await req.json();
    if (!requestId) return NextResponse.json({ error: "requestId required" }, { status: 400 });

    const snap = await getDoc(doc(db, COLLECTIONS.REQUESTS, requestId));
    if (!snap.exists()) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    const request = { id: snap.id, ...snap.data() } as FoodRequest;

    // Run coordinator agent
    const { runCoordinatorAgent } = await import("@/lib/agents/coordinator");
    const matchId = await runCoordinatorAgent(request);

    return NextResponse.json({ success: true, matchId });
  } catch (error) {
    console.error("Coordinator agent error:", error);
    return NextResponse.json({ error: "Agent failed" }, { status: 500 });
  }
}
