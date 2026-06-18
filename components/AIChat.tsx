"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { ChatMessage } from "@/types/weather";
import { Send, Bot, Sparkles, MapPin } from "lucide-react";

const SUGGESTIONS = [
  "Should I go for a run tomorrow?",
  "What should I wear today?",
  "Compare weather with London",
  "Any storms this week?",
  "Best day this week for hiking?",
  "Is it good beach weather?",
];

interface Props {
  locationName?: string;
}

export default function AIChat({ locationName }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "0",
      role: "assistant",
      content: `Hi! I'm **WeatherMind**, your AI weather assistant. I can analyze real-time weather data to help you plan activities, suggest outfits, compare cities, and answer any weather question.\n\n${locationName ? `I can see you're in **${locationName}**. ` : ""}What would you like to know?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [toolInUse, setToolInUse] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, toolInUse]);

  async function sendMessage(text: string) {
    if (!text.trim() || isStreaming) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    const assistantId = (Date.now() + 1).toString();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setIsStreaming(true);
    setToolInUse(null);

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, location: locationName }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (!reader) throw new Error("No stream");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "text") {
              fullText += parsed.text;
              setMessages((prev) =>
                prev.map((m) => m.id === assistantId ? { ...m, content: fullText } : m)
              );
              setToolInUse(null);
            } else if (parsed.type === "tool_call") {
              setToolInUse(parsed.name);
            } else if (parsed.type === "error") {
              fullText = `Sorry, I encountered an error: ${parsed.message}`;
              setMessages((prev) =>
                prev.map((m) => m.id === assistantId ? { ...m, content: fullText } : m)
              );
            }
          } catch {}
        }
      }

      setMessages((prev) =>
        prev.map((m) => m.id === assistantId ? { ...m, isStreaming: false } : m)
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: "Connection error. Please try again.", isStreaming: false } : m
        )
      );
    } finally {
      setIsStreaming(false);
      setToolInUse(null);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function renderContent(text: string) {
    return text.split("\n").map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={i} className={i > 0 ? "mt-1" : ""}>
          {parts.map((p, j) =>
            p.startsWith("**") && p.endsWith("**")
              ? <strong key={j} className="text-white font-semibold">{p.slice(2, -2)}</strong>
              : p
          )}
        </p>
      );
    });
  }

  const TOOL_LABELS: Record<string, string> = {
    get_weather: "Fetching weather data...",
    compare_cities: "Comparing cities...",
    activity_advisor: "Analyzing conditions...",
    outfit_recommender: "Checking weather for outfit...",
  };

  return (
    <div className="glass rounded-3xl flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
          <Bot size={18} className="text-white" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-sm">WeatherMind AI</h3>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 relative">
              <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
            </span>
            <span className="text-slate-400 text-xs">Live · Claude AI</span>
          </div>
        </div>
        {locationName && (
          <div className="ml-auto flex items-center gap-1 text-xs text-slate-400">
            <MapPin size={12} />
            <span>{locationName}</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-bubble flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center mr-2 mt-1 shrink-0">
                <Sparkles size={13} className="text-white" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-tr-sm"
                  : "bg-white/8 text-slate-200 rounded-tl-sm border border-white/10"
              }`}
            >
              {renderContent(msg.content)}
              {msg.isStreaming && !msg.content && (
                <span className="flex gap-1 py-1">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400 typing-dot" />
                  ))}
                </span>
              )}
            </div>
          </div>
        ))}

        {toolInUse && (
          <div className="flex items-center gap-2 text-xs text-slate-400 pl-9">
            <span className="animate-spin">⚙️</span>
            <span>{TOOL_LABELS[toolInUse] ?? "Working..."}</span>
          </div>
        )}

        {/* Suggestions */}
        {messages.length === 1 && (
          <div className="grid grid-cols-2 gap-2 pt-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-left text-xs text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-2 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about the weather..."
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/50 focus:bg-white/8 transition-all"
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="w-10 h-10 rounded-2xl bg-blue-500 hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <Send size={16} className="text-white" />
          </button>
        </div>
      </form>
    </div>
  );
}
