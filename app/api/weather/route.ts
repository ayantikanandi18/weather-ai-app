import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get("lat");
  const lon = req.nextUrl.searchParams.get("lon");

  if (!lat || !lon) return NextResponse.json({ error: "lat/lon required" }, { status: 400 });

  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: [
      "temperature_2m", "apparent_temperature", "relative_humidity_2m",
      "wind_speed_10m", "wind_direction_10m", "weather_code",
      "precipitation", "uv_index", "visibility", "cloud_cover",
      "surface_pressure", "dew_point_2m", "is_day",
    ].join(","),
    hourly: [
      "temperature_2m", "precipitation", "weather_code",
      "wind_speed_10m", "relative_humidity_2m", "uv_index",
      "apparent_temperature", "cloud_cover",
    ].join(","),
    daily: [
      "temperature_2m_max", "temperature_2m_min", "precipitation_sum",
      "weather_code", "wind_speed_10m_max", "uv_index_max",
      "sunrise", "sunset", "precipitation_probability_max",
    ].join(","),
    wind_speed_unit: "kmh",
    timezone: "auto",
    forecast_days: "7",
    forecast_hours: "24",
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
    next: { revalidate: 600 },
  });

  if (!res.ok) return NextResponse.json({ error: "Weather fetch failed" }, { status: 502 });

  const raw = await res.json();

  return NextResponse.json({
    timezone: raw.timezone,
    current: {
      time: raw.current.time,
      temperature: raw.current.temperature_2m,
      feelsLike: raw.current.apparent_temperature,
      humidity: raw.current.relative_humidity_2m,
      windSpeed: raw.current.wind_speed_10m,
      windDirection: raw.current.wind_direction_10m,
      weatherCode: raw.current.weather_code,
      precipitation: raw.current.precipitation,
      uvIndex: raw.current.uv_index,
      visibility: raw.current.visibility,
      cloudCover: raw.current.cloud_cover,
      pressure: raw.current.surface_pressure,
      dewPoint: raw.current.dew_point_2m,
      isDay: raw.current.is_day === 1,
    },
    hourly: {
      time: raw.hourly.time,
      temperature: raw.hourly.temperature_2m,
      precipitation: raw.hourly.precipitation,
      weatherCode: raw.hourly.weather_code,
      windSpeed: raw.hourly.wind_speed_10m,
      humidity: raw.hourly.relative_humidity_2m,
      uvIndex: raw.hourly.uv_index,
      feelsLike: raw.hourly.apparent_temperature,
      cloudCover: raw.hourly.cloud_cover,
    },
    daily: {
      time: raw.daily.time,
      temperatureMax: raw.daily.temperature_2m_max,
      temperatureMin: raw.daily.temperature_2m_min,
      precipitation: raw.daily.precipitation_sum,
      weatherCode: raw.daily.weather_code,
      windSpeedMax: raw.daily.wind_speed_10m_max,
      uvIndexMax: raw.daily.uv_index_max,
      sunrise: raw.daily.sunrise,
      sunset: raw.daily.sunset,
      precipitationProbabilityMax: raw.daily.precipitation_probability_max,
    },
  });
}
