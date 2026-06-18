"use client";

import { CurrentWeather, GeoLocation } from "@/types/weather";
import { getWeatherDescription, getWeatherEmoji, getWeatherCondition, getWindDirection, getUvLabel } from "@/lib/weather-codes";
import { Wind, Droplets, Eye, Gauge, Thermometer, Sun } from "lucide-react";

interface Props {
  current: CurrentWeather;
  location: GeoLocation;
}

export default function CurrentWeatherCard({ current, location }: Props) {
  const emoji = getWeatherEmoji(current.weatherCode, current.isDay);
  const desc = getWeatherDescription(current.weatherCode);
  const uv = getUvLabel(current.uvIndex);

  const metrics = [
    { icon: <Droplets size={16} />, label: "Humidity", value: `${current.humidity}%` },
    { icon: <Wind size={16} />, label: "Wind", value: `${current.windSpeed} km/h ${getWindDirection(current.windDirection)}` },
    { icon: <Eye size={16} />, label: "Visibility", value: `${(current.visibility / 1000).toFixed(1)} km` },
    { icon: <Gauge size={16} />, label: "Pressure", value: `${current.pressure?.toFixed(0)} hPa` },
    { icon: <Thermometer size={16} />, label: "Dew Point", value: `${current.dewPoint?.toFixed(1)}°C` },
    { icon: <Sun size={16} />, label: "UV Index", value: <span className={uv.color}>{current.uvIndex} {uv.label}</span> },
  ];

  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{location.name}</h2>
          <p className="text-slate-400 text-sm">{location.admin1 ? `${location.admin1}, ` : ""}{location.country}</p>
          <p className="text-slate-300 text-sm mt-1">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
        <div className="text-right">
          <div className="text-6xl">{emoji}</div>
          <p className="text-slate-300 text-sm mt-1">{desc}</p>
        </div>
      </div>

      <div className="flex items-end gap-4 mb-6">
        <div className="text-8xl font-thin text-white">{Math.round(current.temperature)}°</div>
        <div className="pb-3">
          <p className="text-slate-400 text-sm">Feels like</p>
          <p className="text-slate-200 text-2xl font-light">{Math.round(current.feelsLike)}°C</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="text-blue-400">{m.icon}</span>
            <span className="text-slate-400">{m.label}:</span>
            <span className="text-slate-200 font-medium">{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
