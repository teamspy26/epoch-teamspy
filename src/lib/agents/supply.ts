/**
 * Supply Agent — monitors all available food listings.
 * Finds the best match for a given request based on:
 * - Sufficient servings
 * - Expiry time (prefers items expiring soon but not yet)
 * - (Future: geo-distance)
 */

import { getAvailableListings, COLLECTIONS } from "@/lib/firebase/db";
import { db } from "@/lib/firebase/config";
import type { FoodListing, FoodRequest } from "@/lib/types";

export async function runSupplyAgent(request: FoodRequest): Promise<FoodListing | null> {
  const listings = await getAvailableListings();

  const now = Date.now();

  // Filter listings that can satisfy the request
  const eligible = listings.filter((l) => {
    const notExpired = l.expiryTime.toDate().getTime() > now;
    const sufficientServings = l.totalServings >= request.servingsNeeded * 0.8; // allow 80% match
    return notExpired && sufficientServings;
  });

  if (eligible.length === 0) return null;

  // Score each listing: prefer items expiring sooner (urgency) but still fresh
  const scored = eligible.map((l) => {
    const msUntilExpiry = l.expiryTime.toDate().getTime() - now;
    const hoursUntilExpiry = msUntilExpiry / (1000 * 60 * 60);
    // Best score: expiring in 1–4 hrs. Penalize very long or very short windows.
    const expiryScore = hoursUntilExpiry < 1 ? 0.3 : hoursUntilExpiry <= 4 ? 1 : 0.7;
    const servingScore = Math.min(l.totalServings / request.servingsNeeded, 1);
    return { listing: l, score: expiryScore * 0.6 + servingScore * 0.4 };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].listing;
}

export async function getPendingRequestById(requestId: string): Promise<FoodRequest | null> {
  const snap = await import("firebase/firestore").then(({ getDoc, doc }) =>
    getDoc(doc(db, COLLECTIONS.REQUESTS, requestId))
  );
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as FoodRequest) : null;
}
