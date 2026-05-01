import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Maps API key not configured" }, { status: 503 });
  }

  try {
    const { origin, destination } = await req.json() as {
      origin: string;
      destination: string;
    };

    if (!origin || !destination) {
      return NextResponse.json({ error: "origin and destination required" }, { status: 400 });
    }

    const params = new URLSearchParams({
      origins: origin,
      destinations: destination,
      mode: "driving",
      units: "metric",
      key: apiKey,
    });

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?${params}`
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Maps API request failed" }, { status: 502 });
    }

    const data = await res.json() as {
      status: string;
      rows?: Array<{
        elements: Array<{
          status: string;
          distance?: { text: string; value: number };
          duration?: { text: string; value: number };
          duration_in_traffic?: { text: string; value: number };
        }>;
      }>;
    };

    if (data.status !== "OK" || !data.rows?.[0]?.elements?.[0]) {
      return NextResponse.json({ error: "Could not calculate route" }, { status: 422 });
    }

    const element = data.rows[0].elements[0];
    if (element.status !== "OK") {
      return NextResponse.json({ error: "Route not found" }, { status: 422 });
    }

    return NextResponse.json({
      distance: element.distance?.text ?? "Unknown",
      distanceMeters: element.distance?.value ?? 0,
      duration: element.duration_in_traffic?.text ?? element.duration?.text ?? "Unknown",
      durationSeconds: element.duration_in_traffic?.value ?? element.duration?.value ?? 0,
    });
  } catch (err) {
    console.error("[Maps ETA]", err);
    return NextResponse.json({ error: "ETA calculation failed" }, { status: 500 });
  }
}
