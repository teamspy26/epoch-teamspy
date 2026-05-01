"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useRestaurantListings } from "@/hooks/use-listings";
import { subscribeToRestaurantMatches, updateMatch, updateListing } from "@/lib/firebase/db";
import { handleRestaurantApproval } from "@/lib/agents/coordinator";
import { ImpactCounter } from "@/components/impact-counter";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MapComponent from "@/components/ui/map";
import { formatTimestamp, timeFromNow } from "@/lib/utils";
import { Package, CheckCircle, Clock, Plus, Bell } from "lucide-react";
import Link from "next/link";
import type { Match } from "@/lib/types";
import toast from "react-hot-toast";

export default function RestaurantDashboard() {
  const { appUser } = useAuth();
  const { listings, loading } = useRestaurantListings(appUser?.uid);
  const [pendingMatches, setPendingMatches] = useState<Match[]>([]);
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => {
    if (!appUser?.uid) return;
    const unsub = subscribeToRestaurantMatches(appUser.uid, setPendingMatches);
    return unsub;
  }, [appUser?.uid]);

  const available = listings.filter((l) => l.status === "available").length;
  const matched = listings.filter((l) => ["matched", "pending", "collected"].includes(l.status)).length;

  const mapMarkers = listings
    .filter(l => l.location?.latitude && l.location?.longitude)
    .map(l => ({
      id: l.id,
      lat: l.location!.latitude,
      lng: l.location!.longitude,
      title: `${l.totalServings} servings available`,
    }));

  async function handleApproval(matchId: string, approved: boolean) {
    setApproving(matchId);
    try {
      await handleRestaurantApproval(matchId, approved, appUser!.uid);
      toast.success(approved ? "Request approved! Volunteer will be dispatched." : "Request declined.");
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setApproving(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {appUser?.orgName ?? appUser?.name}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Your surplus food dashboard</p>
        </div>
        <Link href="/restaurant/new-listing">
          <Button size="lg">
            <Plus className="h-4 w-4" />
            Add Surplus
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <ImpactCounter label="Available listings" value={available} icon={<Package />} />
        <ImpactCounter label="Matched / Collected" value={matched} icon={<CheckCircle />} color="text-emerald-600" />
        <ImpactCounter label="Total listings" value={listings.length} icon={<Clock />} color="text-blue-600" />
      </div>

      {/* Pending approval requests */}
      {pendingMatches.length > 0 && (
        <Card className="border-[#EF9F27]/40 bg-amber-50/50">
          <CardHeader>
            <div className="flex items-center gap-2 text-[#EF9F27]">
              <Bell className="h-5 w-5" />
              <h2 className="font-semibold text-slate-900">
                Approval Needed ({pendingMatches.length})
              </h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingMatches.map((match) => (
                <div
                  key={match.id}
                  className="bg-white rounded-xl p-4 border border-amber-100"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-slate-900">{match.ngoName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        SLA deadline: {timeFromNow(match.slaDeadline)}
                      </p>
                    </div>
                    <StatusBadge status={match.status} />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApproval(match.id, true)}
                      loading={approving === match.id}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApproval(match.id, false)}
                      disabled={approving === match.id}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Listings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-900">My Listings</h2>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No listings yet.</p>
                <Link href="/restaurant/new-listing">
                  <Button variant="outline" className="mt-4">Add your first surplus listing</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 max-h-[400px] overflow-auto">
                {listings.map((listing) => (
                  <div key={listing.id} className="py-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status={listing.status} />
                      </div>
                      <p className="text-sm font-medium text-slate-900">
                        {listing.totalServings} servings ·{" "}
                        {listing.foodItems.map((f) => f.name).join(", ")}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Expires {timeFromNow(listing.expiryTime)}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400">{formatTimestamp(listing.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-900">Listing Locations</h2>
          </CardHeader>
          <CardContent>
            {loading ? (
               <div className="h-[400px] bg-slate-100 rounded-xl animate-pulse w-full"></div>
            ) : (
                <MapComponent markers={mapMarkers} height="400px" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
