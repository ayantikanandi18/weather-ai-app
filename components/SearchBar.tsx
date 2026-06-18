"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { GeoLocation } from "@/types/weather";
import { Search, MapPin, Loader } from "lucide-react";

interface Props {
  onSelect: (loc: GeoLocation) => void;
}

export default function SearchBar({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/geocode?city=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  function select(loc: GeoLocation) {
    onSelect(loc);
    setQuery(`${loc.name}, ${loc.country}`);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <div className="flex items-center gap-2 glass rounded-2xl px-4 py-3 border border-white/10 focus-within:border-blue-500/50">
        {loading ? <Loader size={16} className="text-blue-400 animate-spin shrink-0" /> : <Search size={16} className="text-slate-400 shrink-0" />}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search city..."
          className="bg-transparent text-white placeholder-slate-500 outline-none text-sm flex-1"
        />
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full glass-dark rounded-2xl overflow-hidden z-50 border border-white/10">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => select(r)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-left transition-colors"
            >
              <MapPin size={14} className="text-blue-400 shrink-0" />
              <div>
                <p className="text-slate-200 text-sm font-medium">{r.name}</p>
                <p className="text-slate-500 text-xs">{r.admin1 ? `${r.admin1}, ` : ""}{r.country}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
