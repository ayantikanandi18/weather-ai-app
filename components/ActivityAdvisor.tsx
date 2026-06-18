"use client";

import { CurrentWeather } from "@/types/weather";
import { computeActivityRatings } from "@/lib/weather-codes";

const COLOR = {
  Great:  { bar: "bg-green-500",  badge: "bg-green-500/20 text-green-300" },
  Okay:   { bar: "bg-yellow-500", badge: "bg-yellow-500/20 text-yellow-300" },
  Risky:  { bar: "bg-orange-500", badge: "bg-orange-500/20 text-orange-300" },
  Avoid:  { bar: "bg-red-500",    badge: "bg-red-500/20 text-red-300" },
};

export default function ActivityAdvisor({ current }: { current: CurrentWeather }) {
  const ratings = computeActivityRatings(current);

  return (
    <div className="glass rounded-3xl p-5">
      <h3 className="text-white font-semibold mb-4">Activity Advisor</h3>
      <div className="grid grid-cols-2 gap-3">
        {ratings.map((r) => {
          const color = COLOR[r.verdict as keyof typeof COLOR];
          return (
            <div key={r.activity} className="bg-white/5 rounded-2xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{r.icon}</span>
                  <span className="text-slate-200 text-sm font-medium">{r.activity}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color.badge}`}>
                  {r.verdict}
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${color.bar}`}
                  style={{ width: `${r.score}%` }}
                />
              </div>
              <p className="text-slate-400 text-xs mt-1.5">{r.score}/100</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
