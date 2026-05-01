import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { COLLECTIONS } from "@/lib/firebase/db";
import type { Match } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { matchId } = await req.json();
    if (!matchId) return NextResponse.json({ error: "matchId required" }, { status: 400 });

    const snap = await getDoc(doc(db, COLLECTIONS.MATCHES, matchId));
    if (!snap.exists()) return NextResponse.json({ error: "Match not found" }, { status: 404 });

    const match = { id: snap.id, ...snap.data() } as Match;

    const { runDispatchAgent } = await import("@/lib/agents/dispatch");
    const deliveryId = await runDispatchAgent(match);

    return NextResponse.json({ success: true, deliveryId });
  } catch (error) {
    console.error("Dispatch agent error:", error);
    return NextResponse.json({ error: "Agent failed" }, { status: 500 });
  }
}
