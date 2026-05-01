import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import type { EscalationType } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { type, context } = await req.json() as {
      type: EscalationType;
      context: Record<string, unknown>;
    };

    const { runEscalationAgent } = await import("@/lib/agents/escalation");
    await runEscalationAgent(type, context);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Escalation agent error:", error);
    return NextResponse.json({ error: "Agent failed" }, { status: 500 });
  }
}
