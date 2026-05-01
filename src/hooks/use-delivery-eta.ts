"use client";

import { useState, useEffect } from "react";

interface ETAResult {
  distance: string;
  duration: string;
  durationSeconds: number;
  loading: boolean;
  error: string | null;
}

export function useDeliveryETA(origin?: string, destination?: string): ETAResult {
  const [state, setState] = useState<ETAResult>({
    distance: "",
    duration: "",
    durationSeconds: 0,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!origin || !destination) return;

    setState((s) => ({ ...s, loading: true, error: null }));

    fetch("/api/maps/eta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin, destination }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setState((s) => ({ ...s, loading: false, error: data.error }));
        } else {
          setState({
            distance: data.distance,
            duration: data.duration,
            durationSeconds: data.durationSeconds,
            loading: false,
            error: null,
          });
        }
      })
      .catch(() => {
        setState((s) => ({ ...s, loading: false, error: "Could not fetch ETA" }));
      });
  }, [origin, destination]);

  return state;
}
