"use client";

import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { HourlyWeather, DailyWeather } from "@/types/weather";
import { getWeatherEmoji } from "@/lib/weather-codes";
import { useState } from "react";

interface Props {
  hourly: HourlyWeather;
  daily: DailyWeather;
}

export default function ForecastChart({ hourly, daily }: Props) {
  const [tab, setTab] = useState<"hourly" | "daily">("hourly");

  const hourlyData = hourly.time.slice(0, 24).map((t, i) => ({
    time: new Date(t).toLocaleTimeString("en-US", { hour: "numeric", hour12: true }),
    temp: Math.round(hourly.temperature[i]),
    precip: hourly.precipitation[i],
    humidity: hourly.humidity[i],
  }));

  const dailyData = daily.time.map((t, i) => ({
    time: new Date(t).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    emoji: getWeatherEmoji(daily.weatherCode[i]),
    max: Math.round(daily.temperatureMax[i]),
    min: Math.round(daily.temperatureMin[i]),
    rain: daily.precipitationProbabilityMax[i],
  }));

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; dataKey: string }[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="glass-dark rounded-xl p-3 text-xs text-slate-200">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-blue-300">
            {p.dataKey === "temp" ? `${p.value}°C` : p.dataKey === "precip" ? `${p.value}mm rain` : `${p.value}% humidity`}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="glass rounded-3xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Forecast</h3>
        <div className="flex gap-1 bg-white/5 rounded-full p-1">
          {(["hourly", "daily"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                tab === t ? "bg-blue-500 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {t === "hourly" ? "24h" : "7-Day"}
            </button>
          ))}
        </div>
      </div>

      {tab === "hourly" ? (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={hourlyData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="time" tick={{ fill: "#94a3b8", fontSize: 10 }} tickLine={false} axisLine={false} interval={3} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="temp" stroke="#3b82f6" fill="url(#tempGrad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="space-y-2">
          {dailyData.map((d, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
              <span className="text-xl w-8">{d.emoji}</span>
              <span className="text-slate-300 text-sm flex-1">{d.time}</span>
              <div className="flex items-center gap-1 text-xs text-blue-400 w-16">
                <span>💧</span>
                <span>{d.rain}%</span>
              </div>
              <div className="flex gap-2 text-sm font-medium">
                <span className="text-blue-300">{d.min}°</span>
                <span className="text-slate-500">–</span>
                <span className="text-orange-300">{d.max}°</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
