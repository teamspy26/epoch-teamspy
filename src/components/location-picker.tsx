"use client";
import { useState } from "react";
import { MapPin, Navigation, Loader2 } from "lucide-react";

export interface LocationResult {
  address: string;
  latitude: number;
  longitude: number;
}

interface LocationPickerProps {
  label?: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  onChange: (address: string) => void;
  onLocationSelect?: (result: LocationResult) => void;
}

export function LocationPicker({
  label,
  required,
  placeholder = "Enter full address",
  value,
  onChange,
  onLocationSelect,
}: LocationPickerProps) {
  const [loading, setLoading] = useState(false);
  const [gpsPinned, setGpsPinned] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  async function handleGPS() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported in this browser.");
      return;
    }

    setLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0,
        })
      );

      const { latitude, longitude } = position.coords;

      // Reverse geocode with OpenStreetMap Nominatim (free, no API key)
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        { headers: { "Accept-Language": "en-IN,en" } }
      );

      let address = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      if (res.ok) {
        const data = await res.json();
        if (data.display_name) address = data.display_name;
      }

      setCoords({ lat: latitude, lng: longitude });
      setGpsPinned(true);
      onChange(address);
      onLocationSelect?.({ address, latitude, longitude });
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        if (err.code === err.PERMISSION_DENIED) {
          alert("Location access denied. Please allow location access and try again.");
        } else {
          alert("Could not detect location. Please enter address manually.");
        }
      }
    } finally {
      setLoading(false);
    }
  }

  function handleManualChange(val: string) {
    onChange(val);
    // Clear GPS pin when user types manually
    if (gpsPinned) { setGpsPinned(false); setCoords(null); }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="flex gap-2 items-stretch">
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => handleManualChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1D9E75] focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 transition"
          />
          {gpsPinned && (
            <MapPin className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1D9E75]" />
          )}
        </div>

        <button
          type="button"
          onClick={handleGPS}
          disabled={loading}
          title="Auto-fill from current GPS location"
          className="flex items-center gap-1.5 px-3 rounded-xl bg-[#1D9E75] text-white text-xs font-semibold hover:bg-[#178862] active:scale-95 transition disabled:opacity-60 whitespace-nowrap"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
          {loading ? "Locating…" : "GPS"}
        </button>
      </div>

      {coords && (
        <p className="text-xs text-[#1D9E75] flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)} — location pinned
        </p>
      )}
    </div>
  );
}
