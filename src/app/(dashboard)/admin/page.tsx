"use client";

import { useEffect, useState } from "react";
import {
  subscribeToEscalations,
  updateEscalation,
  getPendingRequests,
  getAvailableListings,
} from "@/lib/firebase/db";
import { ImpactCounter } from "@/components/impact-counter";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatTimestamp, timeFromNow } from "@/lib/utils";
import { AlertTriangle, Package, Users, Activity, CheckCircle } from "lucide-react";
import type { Escalation, FoodRequest, FoodListing } from "@/lib/types";
import toast from "react-hot-toast";

const escalationLabels: Record<string, string> = {
  no_restaurant_response: "Restaurant no response",
  volunteer_no_show: "Volunteer no-show",
  food_expiring: "Food expiring",
  quality_fail: "Quality check failed",
};

export default function AdminDashboard() {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FoodRequest[]>([]);
  const [availableListings, setAvailableListings] = useState<FoodListing[]>([]);
  const [resolving, setResolving] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToEscalations(setEscalations);
    return unsub;
  }, []);

  useEffect(() => {
    getPendingRequests().then(setPendingRequests);
    getAvailableListings().then(setAvailableListings);
  }, []);

  async function resolveEscalation(id: string, adminNote: string) {
    setResolving(id);
    try {
      await updateEscalation(id, {
        status: "resolved",
        adminNote,
        resolvedBy: "admin",
      });
      toast.success("Escalation resolved.");
    } catch {
      toast.error("Failed to resolve.");
    } finally {
      setResolving(null);
    }
  }

  const openCount = escalations.filter((e) => e.status !== "resolved").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Operations</h1>
        <p className="text-slate-500 text-sm mt-0.5">System health and escalation management</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ImpactCounter
          label="Open escalations"
          value={openCount}
          icon={<AlertTriangle />}
          color={openCount > 0 ? "text-red-600" : "text-emerald-600"}
        />
        <ImpactCounter label="Pending requests" value={pendingRequests.length} icon={<Users />} color="text-blue-600" />
        <ImpactCounter label="Available supply" value={availableListings.length} icon={<Package />} color="text-[#1D9E75]" />
        <ImpactCounter label="System status" value="Live" icon={<Activity />} color="text-emerald-600" />
      </div>

      {/* Escalations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h2 className="font-semibold text-slate-900">Escalations</h2>
            </div>
            {openCount > 0 && (
              <span className="bg-red-100 text-red-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {openCount} open
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {escalations.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-10 w-10 text-emerald-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No escalations. System running smoothly.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {escalations.map((esc) => (
                <div
                  key={esc.id}
                  className={`rounded-xl border p-4 ${
                    esc.status === "resolved"
                      ? "border-slate-100 bg-slate-50"
                      : "border-red-100 bg-red-50/50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-slate-900">
                        {escalationLabels[esc.type] ?? esc.type}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Attempts: {esc.attempts} · {formatTimestamp(esc.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={esc.status} />
                  </div>
                  {esc.matchId && (
                    <p className="text-xs text-slate-500 mb-3">Match: {esc.matchId}</p>
                  )}
                  {esc.status !== "resolved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveEscalation(esc.id, "Resolved by admin")}
                      loading={resolving === esc.id}
                    >
                      Mark Resolved
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending requests overview */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-900">Unmatched Requests ({pendingRequests.length})</h2>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">All requests matched.</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {pendingRequests.slice(0, 10).map((req) => (
                <div key={req.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{req.ngoName}</p>
                    <p className="text-xs text-slate-500">
                      {req.servingsNeeded} servings · {req.urgency} urgency · {req.address}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={req.status} />
                    <span className="text-xs text-slate-400">{timeFromNow(req.neededBy)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
