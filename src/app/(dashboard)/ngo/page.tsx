"use client";

import { useAuth } from "@/context/auth-context";
import { useNgoRequests } from "@/hooks/use-requests";
import { ImpactCounter } from "@/components/impact-counter";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MapComponent from "@/components/ui/map";
import { formatTimestamp, urgencyColor, timeFromNow } from "@/lib/utils";
import { Users, Package, Clock, CheckCircle, Plus } from "lucide-react";
import Link from "next/link";

export default function NgoDashboard() {
  const { appUser } = useAuth();
  const { requests, loading } = useNgoRequests(appUser?.uid);

  const delivered = requests.filter((r) => r.status === "delivered").length;
  const active = requests.filter((r) => !["delivered", "failed"].includes(r.status)).length;
  const totalBeneficiaries = requests.reduce((s, r) => s + (r.beneficiaryCount ?? 0), 0);

  const mapMarkers = requests
    .filter(req => req.location?.latitude && req.location?.longitude)
    .map(req => ({
      id: req.id,
      lat: req.location!.latitude,
      lng: req.location!.longitude,
      title: `${req.servingsNeeded} servings needed`,
    }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome, {appUser?.orgName ?? appUser?.name}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Your food redistribution dashboard</p>
        </div>
        <Link href="/ngo/request">
          <Button size="lg">
            <Plus className="h-4 w-4" />
            Request Food
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ImpactCounter label="Active requests" value={active} icon={<Package />} />
        <ImpactCounter label="Delivered" value={delivered} icon={<CheckCircle />} color="text-emerald-600" />
        <ImpactCounter label="Total requests" value={requests.length} icon={<Clock />} color="text-blue-600" />
        <ImpactCounter label="Beneficiaries served" value={totalBeneficiaries} icon={<Users />} color="text-[#EF9F27]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-900">Recent Requests</h2>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No requests yet.</p>
                <Link href="/ngo/request">
                  <Button variant="outline" className="mt-4">Make your first request</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 max-h-[400px] overflow-auto">
                {requests.map((req) => (
                  <div key={req.id} className="py-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status={req.status} />
                        <span
                          className={`text-xs rounded-full px-2 py-0.5 font-medium ${urgencyColor(req.urgency)}`}
                        >
                          {req.urgency}
                        </span>
                      </div>
                      <p className="text-sm text-slate-900 font-medium">
                        {req.servingsNeeded} servings · {req.beneficiaryCount} beneficiaries
                      </p>
                      {req.approvedByRestaurant && (
                        <p className="text-xs text-emerald-700 font-medium mt-0.5 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Approved by {req.approvedByRestaurant}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-0.5">
                        Needed {timeFromNow(req.neededBy)} · {req.address}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400">{formatTimestamp(req.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-900">Request Locations</h2>
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
