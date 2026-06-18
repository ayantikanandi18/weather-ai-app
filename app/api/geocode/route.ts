import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city");
  if (!city) return NextResponse.json({ error: "city required" }, { status: 400 });

  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=en&format=json`,
    { next: { revalidate: 3600 } }
  );

  if (!res.ok) return NextResponse.json({ error: "Geocoding failed" }, { status: 502 });

  const data = await res.json();
  return NextResponse.json(data.results ?? []);
}
