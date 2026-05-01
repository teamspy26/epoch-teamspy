/**
 * Demand Agent — Queue and prioritize NGO food requests
 * Ranks requests by: urgency, beneficiary count, geography
 * Splits large requests across multiple suppliers
 * Sends confirmations and tracks fulfillment
 */

import { Timestamp } from "firebase/firestore";
import {
  createRequest,
  updateRequest,
  getPendingRequests,
  logAgentDecision,
  createNotification,
  getUser,
} from "@/lib/firebase/db";
import type { FoodRequest } from "@/lib/types";

interface RequestPriority {
  requestId: string;
  score: number;
  urgency: number;
  beneficiaryCount: number;
  geography: {
    latitude: number;
    longitude: number;
    region: string;
  };
}

/**
 * Run Demand Agent - Process NGO food request
 */
export async function runDemandAgent(rawRequest: {
  ngoId: string;
  ngoName: string;
  ngoPhone: string;
  servingsNeeded: number;
  urgency: "low" | "medium" | "high" | "critical";
  beneficiaryCount: number;
  address: string;
  latitude?: number;
  longitude?: number;
  description?: string;
}): Promise<string | null> {
  try {
    // 1. Create request in Firestore
    const requestId = await createRequest({
      ngoId: rawRequest.ngoId,
      ngoName: rawRequest.ngoName,
      ngoPhone: rawRequest.ngoPhone,
      servingsNeeded: rawRequest.servingsNeeded,
      urgency: rawRequest.urgency,
      beneficiaryCount: rawRequest.beneficiaryCount,
      address: rawRequest.address,
      status: "pending",
      priority: calculatePriority(rawRequest.urgency),
      neededBy: Timestamp.fromDate(new Date(Date.now() + 4 * 60 * 60 * 1000)), // 4 hours from now
      notes: rawRequest.description || "",
    });

    // 2. Log decision
    await logAgentDecision("demand", "request_queued", {
      requestId,
      ngoId: rawRequest.ngoId,
      urgency: rawRequest.urgency,
      servingsNeeded: rawRequest.servingsNeeded,
      beneficiaryCount: rawRequest.beneficiaryCount,
    });

    // 3. Send confirmation to NGO
    await createNotification({
      userId: rawRequest.ngoId,
      title: "Request Received",
      body: `Your request for ${rawRequest.servingsNeeded} servings has been queued. We're finding the best match for you.`,
      type: "alert",
      read: false,
      metadata: { requestId },
    });

    console.log(`[Demand] Request queued: ${requestId}`);
    return requestId;
  } catch (error) {
    console.error("[Demand] Error:", error);
    return null;
  }
}

/**
 * Score and rank pending requests by priority
 */
export async function rankPendingRequests(): Promise<RequestPriority[]> {
  const requests = await getPendingRequests();

  const scored = requests.map((req) => {
    // Urgency score (0-1)
    const urgencyMap = { low: 0.2, medium: 0.5, high: 0.8, critical: 1.0 };
    const urgencyScore = urgencyMap[req.urgency as keyof typeof urgencyMap] || 0.5;

    // Beneficiary count score (normalized)
    const beneficiaryScore = Math.min(req.beneficiaryCount / 100, 1);

    // Time-based score (older requests get higher priority)
    const ageMs = Date.now() - req.createdAt.toDate().getTime();
    const ageHours = ageMs / (1000 * 60 * 60);
    const timeScore = Math.min(ageHours / 24, 1); // Max score after 24 hours

    // Combined score
    const score = urgencyScore * 0.5 + beneficiaryScore * 0.3 + timeScore * 0.2;

    return {
      requestId: req.id,
      score,
      urgency: urgencyScore,
      beneficiaryCount: req.beneficiaryCount,
      geography: {
        latitude: req.location?.latitude || 0,
        longitude: req.location?.longitude || 0,
        region: extractRegion(req.address),
      },
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

/**
 * Check if large request should be split
 */
export function shouldSplitRequest(
  servingsNeeded: number,
  maxPerSupplier: number = 100
): number {
  // Return number of suppliers needed
  return Math.ceil(servingsNeeded / maxPerSupplier);
}

/**
 * Track NGO fulfillment rate (placeholder - implement in analytics service)
 */
export async function trackFulfillmentRate(ngoId: string): Promise<{
  totalRequests: number;
  fulfilledRequests: number;
  rate: number;
}> {
  // TODO: Implement analytics tracking in dedicated service
  // For now, return placeholder
  return { totalRequests: 0, fulfilledRequests: 0, rate: 0 };
}

function extractRegion(address: string): string {
  // Simple extraction - in production, use geocoding API
  const parts = address.split(",");
  return parts[parts.length - 1]?.trim() || "unknown";
}

function calculatePriority(urgency: "low" | "medium" | "high" | "critical"): number {
  const priorityMap = { low: 1, medium: 2, high: 3, critical: 4 };
  return priorityMap[urgency] || 2;
}

export async function sendConfirmationToNGO(
  ngoId: string,
  requestId: string,
  message: string
): Promise<void> {
  const ngo = await getUser(ngoId);
  if (!ngo) return;

  await createNotification({
    userId: ngoId,
    title: "Request Update",
    body: message,
    type: "alert",
    read: false,
    metadata: { requestId },
  });

  // Also send WhatsApp
  const { sendWhatsApp } = await import("@/lib/whatsapp");
  await sendWhatsApp(ngo.phone, message).catch(() => {});
}
