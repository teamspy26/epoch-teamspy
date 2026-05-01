"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { storage } from "@/lib/firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { createListing } from "@/lib/firebase/db";
import { Timestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Camera, CheckCircle, AlertTriangle, Sparkles, Upload,
  Leaf, Info, UtensilsCrossed, RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

type ScanResult = {
  safe: boolean;
  foodName: string;
  estimatedServings: number;
  freshness: string;
  confidence: string;
  issues: string[];
  recommendation: string;
  category: string;
};

const freshnessColor: Record<string, string> = {
  fresh: "text-emerald-600",
  acceptable: "text-blue-600",
  questionable: "text-amber-600",
  expired: "text-red-600",
};

export default function DonorDashboard() {
  const { appUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [donating, setDonating] = useState(false);
  const [address, setAddress] = useState(appUser?.address ?? "");
  const [donated, setDonated] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setResult(null);
    setDonated(false);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleScan() {
    if (!imageFile || !appUser) return;
    setScanning(true);
    try {
      const storageRef = ref(storage, `donor-scans/${appUser.uid}/${Date.now()}`);
      await uploadBytes(storageRef, imageFile);
      const imageUrl = await getDownloadURL(storageRef);

      const res = await fetch("/api/agents/food-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, userId: appUser.uid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scan failed");
      setResult(data as ScanResult);
    } catch {
      toast.error("Scan failed. Please try again.");
    } finally {
      setScanning(false);
    }
  }

  async function handleDonate() {
    if (!result || !appUser || !address.trim()) {
      toast.error("Please add a pickup address.");
      return;
    }
    setDonating(true);
    try {
      await createListing({
        restaurantId: appUser.uid,
        restaurantName: appUser.name,
        restaurantPhone: appUser.phone,
        foodItems: [{ name: result.foodName, quantity: result.estimatedServings, unit: "servings" }],
        totalServings: result.estimatedServings,
        expiryTime: Timestamp.fromDate(new Date(Date.now() + 4 * 60 * 60 * 1000)),
        address: address.trim(),
        status: "available",
        notes: `Individual donor. Freshness: ${result.freshness}. Category: ${result.category}.`,
      });
      setDonated(true);
      toast.success("Your food is listed! A volunteer will be dispatched soon. 🙏");
    } catch {
      toast.error("Failed to list food. Please try again.");
    } finally {
      setDonating(false);
    }
  }

  function reset() {
    setPreview(null);
    setImageFile(null);
    setResult(null);
    setDonated(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Leaf className="h-6 w-6 text-[#1D9E75]" />
          Hello, {appUser?.name}!
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Snap your food, our AI checks it, and it reaches someone in need. 🙏
        </p>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { icon: Camera, label: "Photo food", step: "1" },
          { icon: Sparkles, label: "AI checks it", step: "2" },
          { icon: UtensilsCrossed, label: "Listed for pickup", step: "3" },
        ].map(({ icon: Icon, label, step }) => (
          <div key={step} className="bg-white rounded-2xl border border-slate-100 p-3">
            <div className="h-9 w-9 rounded-xl bg-[#1D9E75]/10 flex items-center justify-center mx-auto mb-2">
              <Icon className="h-4 w-4 text-[#1D9E75]" />
            </div>
            <p className="text-xs font-medium text-slate-700">{label}</p>
            <p className="text-xs text-slate-400">Step {step}</p>
          </div>
        ))}
      </div>

      {/* Upload card */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <Camera className="h-4 w-4 text-[#1D9E75]" />
            Donate Food
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Image preview / upload area */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />

          {!preview ? (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full h-52 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 hover:border-[#1D9E75] hover:bg-[#1D9E75]/5 transition-all group"
            >
              <div className="h-14 w-14 rounded-2xl bg-slate-100 group-hover:bg-[#1D9E75]/10 flex items-center justify-center transition-all">
                <Upload className="h-6 w-6 text-slate-400 group-hover:text-[#1D9E75]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-700">Tap to take photo or upload</p>
                <p className="text-xs text-slate-400 mt-1">Works with leftovers, cooked meals, raw produce</p>
              </div>
            </button>
          ) : (
            <div className="relative">
              <img
                src={preview}
                alt="Food preview"
                className="w-full h-52 object-cover rounded-2xl"
              />
              {!result && (
                <button
                  onClick={reset}
                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/90 flex items-center justify-center shadow text-slate-500 hover:text-slate-900"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Scan button */}
          {preview && !result && !donated && (
            <Button
              className="w-full"
              size="lg"
              onClick={handleScan}
              loading={scanning}
            >
              <Sparkles className="h-4 w-4" />
              {scanning ? "AI is checking your food…" : "Scan with AI"}
            </Button>
          )}

          {/* Scan result */}
          {result && !donated && (
            <div className="space-y-4">
              <div className={`rounded-2xl border p-4 ${result.safe ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                <div className="flex items-start gap-3">
                  {result.safe
                    ? <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    : <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  }
                  <div className="flex-1">
                    <p className={`font-semibold text-sm ${result.safe ? "text-emerald-800" : "text-red-800"}`}>
                      {result.safe ? "✓ Safe to donate!" : "Not suitable for donation"}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">{result.recommendation}</p>
                  </div>
                </div>
              </div>

              {/* Food details */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-slate-900">{result.estimatedServings}</p>
                  <p className="text-xs text-slate-500">servings</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className={`text-sm font-bold capitalize ${freshnessColor[result.freshness] ?? "text-slate-700"}`}>
                    {result.freshness}
                  </p>
                  <p className="text-xs text-slate-500">freshness</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-sm font-bold text-slate-700 capitalize">{result.confidence}</p>
                  <p className="text-xs text-slate-500">confidence</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-100 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">Detected</p>
                <p className="text-sm font-semibold text-slate-900">{result.foodName}</p>
              </div>

              {result.issues.length > 0 && (
                <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2.5">
                  <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  <span>{result.issues.join(" · ")}</span>
                </div>
              )}

              {/* Confirm donation */}
              {result.safe && (
                <div className="space-y-3 pt-1">
                  <Input
                    label="Your pickup address *"
                    placeholder="e.g. 12, MG Road, Bangalore"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                  <Button className="w-full" size="lg" onClick={handleDonate} loading={donating}>
                    <UtensilsCrossed className="h-4 w-4" />
                    Confirm Donation
                  </Button>
                </div>
              )}

              {!result.safe && (
                <Button variant="outline" className="w-full" onClick={reset}>
                  Try a different photo
                </Button>
              )}
            </div>
          )}

          {/* Donated success */}
          {donated && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-6 text-center">
              <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-7 w-7 text-emerald-600" />
              </div>
              <p className="font-semibold text-emerald-800 text-lg">Food listed! 🙏</p>
              <p className="text-sm text-emerald-700 mt-1">
                Your <strong>{result?.foodName}</strong> ({result?.estimatedServings} servings) is now available for pickup. A volunteer will be assigned shortly.
              </p>
              <button
                onClick={reset}
                className="mt-4 text-sm text-[#1D9E75] font-medium hover:underline"
              >
                Donate more food →
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
