/**
 * Coordinator Agent — brain of the system.
 * Receives a new food request, finds the best supply match,
 * creates a Match document, and triggers downstream agents.
 * Never talks to users directly.
 */

import { Timestamp } from "firebase/firestore";
import {
  getAvailableListings,
  createMatch,
  updateRequest,
  updateListing,
  logAgentDecision,
  createNotification,
} from "@/lib/firebase/db";
import type { FoodRequest, FoodListing, Match } from "@/lib/types";
import { runSupplyAgent } from "./supply";

const SLA_MINUTES = 5; // restaurant must respond within 5 min

export async function runCoordinatorAgent(request: FoodRequest): Promise<string | null> {
  await logAgentDecision("coordinator", "receive_request", {
    requestId: request.id,
    ngoId: request.ngoId,
    servingsNeeded: request.servingsNeeded,
  });

  // 1. Ask Supply agent to find best match
  const listing = await runSupplyAgent(request);

  if (!listing) {
    await logAgentDecision("coordinator", "no_supply_found", { requestId: request.id });
    await updateRequest(request.id, { status: "failed" });
    await createNotification({
      userId: request.ngoId,
      title: "No supply found",
      body: "We couldn't find a matching food source right now. We'll keep looking.",
      type: "alert",
      read: false,
      metadata: { requestId: request.id },
    });
    return null;
  }

  // 2. Create Match document
  const slaDeadline = Timestamp.fromDate(
    new Date(Date.now() + SLA_MINUTES * 60 * 1000)
  );

  const matchId = await createMatch({
    requestId: request.id,
    listingId: listing.id,
    ngoId: request.ngoId,
    ngoName: request.ngoName,
    restaurantId: listing.restaurantId,
    restaurantName: listing.restaurantName,
    status: "pending_approval",
    slaDeadline,
  });

  // 3. Lock the listing and request
  await Promise.all([
    updateListing(listing.id, { status: "pending" }),
    updateRequest(request.id, { status: "matched" }),
  ]);

  // 4. Notify restaurant
  await createNotification({
    userId: listing.restaurantId,
    title: "Food request matched!",
    body: `${request.ngoName} needs ${request.servingsNeeded} servings. Please approve within ${SLA_MINUTES} minutes.`,
    type: "match",
    read: false,
    metadata: { matchId, requestId: request.id, listingId: listing.id },
  });

  // 5. Notify NGO
  await createNotification({
    userId: request.ngoId,
    title: "Match found!",
    body: `${listing.restaurantName} has surplus food for you. Waiting for their approval.`,
    type: "match",
    read: false,
    metadata: { matchId },
  });

  await logAgentDecision("coordinator", "match_created", {
    matchId,
    requestId: request.id,
    listingId: listing.id,
    restaurantId: listing.restaurantId,
  });

  return matchId;
}

export async function handleRestaurantApproval(
  matchId: string,
  approved: boolean,
  restaurantId: string,
  reason?: string
): Promise<void> {
  const { getMatchById, updateMatch } = await import("@/lib/firebase/db");
  const match = await getMatchById(matchId);
  if (!match) return;

  if (!approved) {
    // Unlock listing, re-queue request
    await Promise.all([
      updateMatch(matchId, { status: "rejected", rejectionReason: reason }),
      updateListing(match.listingId, { status: "available" }),
      updateRequest(match.requestId, { status: "pending" }),
    ]);

    await logAgentDecision("coordinator", "match_rejected", { matchId, reason });

    // Let Escalation agent handle finding next match
    const { runEscalationAgent } = await import("./escalation");
    const { getPendingRequestById } = await import("./supply");
    const request = await getPendingRequestById(match.requestId);
    if (request) await runEscalationAgent("no_restaurant_response", { matchId, request });
    return;
  }

  // Approved — trigger Dispatch agent
  await updateMatch(matchId, {
    status: "approved",
    restaurantApprovalTime: Timestamp.now(),
  });

  await logAgentDecision("coordinator", "match_approved", { matchId });

  const { runDispatchAgent } = await import("./dispatch");
  await runDispatchAgent(match);
}
