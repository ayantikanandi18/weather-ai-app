"use client";

import { useState, useEffect } from "react";
import { WeatherData, GeoLocation } from "@/types/weather";
import { getWeatherCondition } from "@/lib/weather-codes";
import WeatherBackground from "@/components/WeatherBackground";
import CurrentWeatherCard from "@/components/CurrentWeatherCard";
import ForecastChart from "@/components/ForecastChart";
import ActivityAdvisor from "@/components/ActivityAdvisor";
import SunriseSunset from "@/components/SunriseSunset";
import AIChat from "@/components/AIChat";
import SearchBar from "@/components/SearchBar";
import { RefreshCw, AlertTriangle } from "lucide-react";

const DEFAULT_LOCATION: GeoLocation = {
  name: "New York",
  latitude: 40.7128,
  longitude: -74.006,
  country: "United States",
  country_code: "US",
  admin1: "New York",
};

export default function Home() {
  const [location, setLocation] = useState<GeoLocation>(DEFAULT_LOCATION);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function fetchWeather(loc: GeoLocation) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/weather?lat=${loc.latitude}&lon=${loc.longitude}`);
      if (!res.ok) throw new Error("Weather fetch failed");
      const data = await res.json();
      setWeather({ ...data, location: loc });
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load weather");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Try to get user's real location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            const res = await fetch(
              `https://geocoding-api.open-meteo.com/v1/search?name=&count=1&language=en&format=json&latitude=${latitude}&longitude=${longitude}`
            );
            // Open-Meteo doesn't support reverse geocoding, use Nominatim
            const nomRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            );
            const nom = await nomRes.json();
            const loc: GeoLocation = {
              name: nom.address?.city || nom.address?.town || nom.address?.village || "Your Location",
              latitude,
              longitude,
              country: nom.address?.country || "Unknown",
              country_code: nom.address?.country_code?.toUpperCase() || "",
              admin1: nom.address?.state,
            };
            setLocation(loc);
            fetchWeather(loc);
          } catch {
            fetchWeather(DEFAULT_LOCATION);
          }
        },
        () => fetchWeather(DEFAULT_LOCATION)
      );
    } else {
      fetchWeather(DEFAULT_LOCATION);
    }
  }, []);

  function handleLocationSelect(loc: GeoLocation) {
    setLocation(loc);
    fetchWeather(loc);
  }

  const condition = weather ? getWeatherCondition(weather.current.weatherCode) : "clear";
  const isDay = weather?.current.isDay ?? true;

  return (
    <div className="min-h-screen relative">
      <WeatherBackground condition={condition} isDay={isDay} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 flex flex-col gap-4" style={{ minHeight: "100vh" }}>
        {/* Header */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-white">
              Weather<span className="text-blue-400">Mind</span>
            </div>
            <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">
              AI-Powered
            </span>
          </div>
          <div className="flex items-center gap-3">
            <SearchBar onSelect={handleLocationSelect} />
            <button
              onClick={() => fetchWeather(location)}
              disabled={loading}
              className="w-10 h-10 glass rounded-2xl flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={16} className={`text-slate-300 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </header>

        {lastUpdated && (
          <p className="text-slate-500 text-xs text-right -mt-2">
            Updated {lastUpdated.toLocaleTimeString()}
          </p>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 glass rounded-2xl p-4 border border-red-500/30">
            <AlertTriangle size={18} className="text-red-400" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`glass rounded-3xl ${i === 0 ? "lg:col-span-2" : ""} h-48 bg-white/5`} />
            ))}
          </div>
        )}

        {/* Main content */}
        {!loading && weather && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
            {/* Left column */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <CurrentWeatherCard current={weather.current} location={weather.location} />
              <ForecastChart hourly={weather.hourly} daily={weather.daily} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ActivityAdvisor current={weather.current} />
                <SunriseSunset daily={weather.daily} />
              </div>
            </div>

            {/* Right column — AI Chat */}
            <div className="lg:col-span-1 flex flex-col" style={{ minHeight: "600px" }}>
              <AIChat locationName={`${weather.location.name}, ${weather.location.country}`} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
