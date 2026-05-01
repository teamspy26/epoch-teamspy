/**
 * SLA Monitor — Check for matches that breached approval deadline
 * Called by Google Cloud Scheduler or external cron service
 * Runs every 1 minute to catch SLA breaches within 60 seconds
 *
 * Protected by: CRON_SECRET environment variable
 */

import { NextRequest, NextResponse } from "next/server";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { logAgentDecision, getRequestById, getListingById, getMatchById } from "@/lib/firebase/db";
import type { Match } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CRON_SECRET = process.env.CRON_SECRET || "default-secret";

export async function POST(req: NextRequest) {
  // Verify authorization
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = Timestamp.now();

    // Find all matches still pending after SLA deadline
    const matchesRef = collection(db, "matches");
    const expiredMatches = await getDocs(
      query(
        matchesRef,
        where("status", "==", "pending_approval"),
        where("slaDeadline", "<=", now)
      )
    );

    const escalations = [];

    for (const docSnap of expiredMatches.docs) {
      const match = { id: docSnap.id, ...docSnap.data() } as Match;

      console.log(`[SLA Monitor] Breach detected for match ${match.id}`);

      // Get related request and listing
      const request = await getRequestById(match.requestId);
      const listing = await getListingById(match.listingId);

      if (!request) {
        console.warn(`[SLA Monitor] Request ${match.requestId} not found`);
        continue;
      }

      // Trigger escalation for SLA breach
      try {
        const escalationRes = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/agents/escalation`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "no_restaurant_response",
              context: {
                matchId: match.id,
                requestId: request.id,
                slaBreach: true,
                restaurantId: match.restaurantId,
                ngoId: match.ngoId,
              },
            }),
          }
        );

        if (escalationRes.ok) {
          escalations.push({ matchId: match.id, escalated: true });

          // Log the SLA breach decision
          await logAgentDecision("sla_monitor", "sla_breach_escalated", {
            matchId: match.id,
            requestId: request.id,
            restaurantId: match.restaurantId,
            ngoId: match.ngoId,
            slaBreach: true,
          });
        } else {
          escalations.push({ matchId: match.id, escalated: false, error: "Escalation failed" });
        }
      } catch (error) {
        console.error(`[SLA Monitor] Escalation failed for match ${match.id}:`, error);
        escalations.push({ matchId: match.id, escalated: false, error: String(error) });
      }
    }

    return NextResponse.json({
      success: true,
      breachedMatches: expiredMatches.docs.length,
      escalations,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[SLA Monitor] Error:", error);
    return NextResponse.json(
      { error: "SLA monitoring failed", details: String(error) },
      { status: 500 }
    );
  }
}
