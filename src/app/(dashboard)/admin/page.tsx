"use client";

import { useEffect, useState } from "react";
import {
  subscribeToEscalations,
  subscribeToAgentLogs,
  updateEscalation,
  getPendingRequests,
  getAvailableListings,
  type AgentLog,
} from "@/lib/firebase/db";
import { ImpactCounter } from "@/components/impact-counter";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MapComponent from "@/components/ui/map";
import { formatTimestamp, timeFromNow } from "@/lib/utils";
import { AlertTriangle, Package, Users, Activity, CheckCircle, Bot, Zap, Brain, Truck, ShieldCheck, Bell, TrendingUp } from "lucide-react";
import type { Escalation, FoodRequest, FoodListing } from "@/lib/types";
import toast from "react-hot-toast";

const escalationLabels: Record<string, string> = {
  no_restaurant_response: "Restaurant no response",
  volunteer_no_show: "Volunteer no-show",
  food_expiring: "Food expiring",
  quality_fail: "Quality check failed",
};

const AGENT_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  coordinator: { label: "Coordinator", icon: <Brain className="h-3.5 w-3.5" />, color: "bg-violet-100 text-violet-700 border-violet-200" },
  supply:       { label: "Supply",      icon: <Package className="h-3.5 w-3.5" />, color: "bg-blue-100 text-blue-700 border-blue-200" },
  dispatch:     { label: "Dispatch",    icon: <Truck className="h-3.5 w-3.5" />,   color: "bg-amber-100 text-amber-700 border-amber-200" },
  escalation:   { label: "Escalation",  icon: <AlertTriangle className="h-3.5 w-3.5" />, color: "bg-red-100 text-red-700 border-red-200" },
  quality_check:{ label: "Quality",     icon: <ShieldCheck className="h-3.5 w-3.5" />, color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  notification: { label: "Notify",      icon: <Bell className="h-3.5 w-3.5" />,    color: "bg-pink-100 text-pink-700 border-pink-200" },
  prediction:   { label: "Prediction",  icon: <TrendingUp className="h-3.5 w-3.5" />, color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
};

function agentTimestamp(log: AgentLog): string {
  const ms = log.timestamp?.toMillis?.();
  if (!ms) return "";
  const diff = Date.now() - ms;
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

export default function AdminDashboard() {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FoodRequest[]>([]);
  const [availableListings, setAvailableListings] = useState<FoodListing[]>([]);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [resolving, setResolving] = useState<string | null>(null);
  const [logsExpanded, setLogsExpanded] = useState(false);

  useEffect(() => {
    const unsub = subscribeToEscalations(setEscalations, (err) => {
      console.error("[Escalations]", err);
      toast.error("Could not load escalations — check Firestore rules.");
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeToAgentLogs(setAgentLogs, (err) => {
      console.error("[AgentLogs]", err);
      toast.error("Could not load agent logs — check Firestore rules.");
    });
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

  const mapMarkers = [
    ...pendingRequests
      .filter((r: unknown) => (r as any).location?.latitude && (r as any).location?.longitude)
      .map((r) => ({
        id: `req-${r.id}`,
        lat: (r as any).location.latitude,
        lng: (r as any).location.longitude,
        title: `Request: ${r.ngoName} (${r.servingsNeeded} servings)`,
      })),
    ...availableListings
      .filter((l: unknown) => (l as any).location?.latitude && (l as any).location?.longitude)
      .map((l) => ({
        id: `list-${l.id}`,
        lat: (l as any).location.latitude,
        lng: (l as any).location.longitude,
        title: `Listing: ${l.restaurantName} (${l.totalServings} servings)`,
      })),
  ];

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

      {/* Agent Activity Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-violet-500" />
              <h2 className="font-semibold text-slate-900">Agent Activity</h2>
              {agentLogs.length > 0 && (
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400">{agentLogs.length} events</span>
          </div>
        </CardHeader>
        <CardContent>
          {agentLogs.length === 0 ? (
            <div className="text-center py-10">
              <Zap className="h-8 w-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No agent activity yet. Agents fire when food requests and listings are created.</p>
            </div>
          ) : (
            <>
              {/* Agent summary chips */}
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(AGENT_META).map(([key, meta]) => {
                  const count = agentLogs.filter((l) => l.agent === key).length;
                  if (count === 0) return null;
                  return (
                    <span key={key} className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${meta.color}`}>
                      {meta.icon}{meta.label}: {count}
                    </span>
                  );
                })}
              </div>

              {/* Log entries */}
              <div className="space-y-1.5 max-h-[420px] overflow-auto">
                {(logsExpanded ? agentLogs : agentLogs.slice(0, 15)).map((log) => {
                  const meta = AGENT_META[log.agent] ?? { label: log.agent, icon: <Bot className="h-3.5 w-3.5" />, color: "bg-slate-100 text-slate-600 border-slate-200" };
                  return (
                    <div key={log.id} className="flex items-start gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full border flex-shrink-0 mt-0.5 ${meta.color}`}>
                        {meta.icon}
                        {meta.label}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-800">{log.action.replace(/_/g, " ")}</p>
                        {log.context && Object.keys(log.context).length > 0 && (
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {Object.entries(log.context)
                              .slice(0, 3)
                              .map(([k, v]) => `${k}: ${String(v).slice(0, 30)}`)
                              .join(" · ")}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 flex-shrink-0">{agentTimestamp(log)}</span>
                    </div>
                  );
                })}
              </div>

              {agentLogs.length > 15 && (
                <button
                  onClick={() => setLogsExpanded((x) => !x)}
                  className="mt-3 text-xs text-[#1D9E75] hover:underline w-full text-center"
                >
                  {logsExpanded ? "Show less" : `Show all ${agentLogs.length} events`}
                </button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Map + Unmatched Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-900">System Map</h2>
          </CardHeader>
          <CardContent>
            <MapComponent markers={mapMarkers} height="400px" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-900">Unmatched Requests ({pendingRequests.length})</h2>
          </CardHeader>
          <CardContent>
            {pendingRequests.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">All requests matched.</p>
            ) : (
              <div className="divide-y divide-slate-50 max-h-[400px] overflow-auto">
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
    </div>
  );
}
