"use client";

import { DailyWeather } from "@/types/weather";

export default function SunriseSunset({ daily }: { daily: DailyWeather }) {
  const sunrise = daily.sunrise[0];
  const sunset = daily.sunset[0];

  const toTime = (dt: string) =>
    new Date(dt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  const srMs = new Date(sunrise).getTime();
  const ssMs = new Date(sunset).getTime();
  const now = Date.now();
  const dayLen = ssMs - srMs;
  const progress = Math.min(100, Math.max(0, ((now - srMs) / dayLen) * 100));

  return (
    <div className="glass rounded-3xl p-5">
      <h3 className="text-white font-semibold mb-4">Sun & Daylight</h3>
      <div className="relative h-16 mb-4">
        <svg viewBox="0 0 200 60" className="w-full h-full">
          <path d="M 10 55 Q 100 5 190 55" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
          {progress > 0 && (
            <path
              d={`M 10 55 Q 100 5 ${10 + (180 * progress) / 100} ${55 - Math.sin((progress / 100) * Math.PI) * 50}`}
              fill="none" stroke="#fbbf24" strokeWidth="2.5"
            />
          )}
          <circle
            cx={10 + (180 * progress) / 100}
            cy={55 - Math.sin((progress / 100) * Math.PI) * 50}
            r="5" fill="#fbbf24"
          />
        </svg>
      </div>
      <div className="flex justify-between text-sm">
        <div className="text-center">
          <p className="text-2xl">🌅</p>
          <p className="text-slate-400 text-xs">Sunrise</p>
          <p className="text-slate-200 font-medium">{toTime(sunrise)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400">Daylight</p>
          <p className="text-slate-200 font-semibold text-lg">
            {Math.floor(dayLen / 3600000)}h {Math.floor((dayLen % 3600000) / 60000)}m
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl">🌇</p>
          <p className="text-slate-400 text-xs">Sunset</p>
          <p className="text-slate-200 font-medium">{toTime(sunset)}</p>
        </div>
      </div>
    </div>
  );
}
