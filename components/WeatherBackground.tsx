"use client";

import { useEffect, useRef } from "react";

const GRADIENTS: Record<string, string[]> = {
  clear:   ["#0f2460", "#1565c0", "#0ea5e9"],
  cloudy:  ["#1e293b", "#334155", "#475569"],
  rain:    ["#0c1445", "#1e3a8a", "#1d4ed8"],
  drizzle: ["#0c1445", "#1e3a8a", "#2563eb"],
  snow:    ["#1e3a5f", "#2563eb", "#93c5fd"],
  thunder: ["#0f0f1a", "#2d1b69", "#7c3aed"],
  fog:     ["#1e2533", "#374151", "#6b7280"],
};

export default function WeatherBackground({ condition, isDay }: { condition: string; isDay?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const colors = GRADIENTS[condition] ?? GRADIENTS.clear;
    const particles: { x: number; y: number; size: number; speed: number; opacity: number; angle: number }[] = [];

    const isRain = condition === "rain" || condition === "drizzle";
    const isSnow = condition === "snow";
    const isStars = condition === "clear" && !isDay;

    const count = isRain ? 120 : isSnow ? 60 : isStars ? 80 : 0;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: isRain ? Math.random() * 1.5 + 0.5 : isSnow ? Math.random() * 4 + 1 : Math.random() * 1.5 + 0.5,
        speed: isRain ? Math.random() * 8 + 5 : isSnow ? Math.random() * 1.5 + 0.5 : Math.random() * 0.3 + 0.1,
        opacity: Math.random() * 0.6 + 0.3,
        angle: isRain ? 0.2 : isSnow ? (Math.random() - 0.5) * 0.02 : 0,
      });
    }

    let animId: number;
    const draw = () => {
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, colors[0]);
      grad.addColorStop(0.5, colors[1]);
      grad.addColorStop(1, colors[2]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        ctx.beginPath();
        ctx.globalAlpha = p.opacity;
        if (isRain) {
          ctx.strokeStyle = "#93c5fd";
          ctx.lineWidth = p.size;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.angle * 20, p.y + 20);
          ctx.stroke();
          p.x += p.angle * p.speed;
          p.y += p.speed;
          if (p.y > canvas.height) { p.y = -20; p.x = Math.random() * canvas.width; }
        } else if (isSnow) {
          ctx.fillStyle = "#e0f2fe";
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          p.x += p.angle * 10;
          p.y += p.speed;
          if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width; }
        } else if (isStars) {
          ctx.fillStyle = "#ffffff";
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          p.opacity = 0.3 + Math.abs(Math.sin(Date.now() * p.speed * 0.001)) * 0.7;
        }
        ctx.globalAlpha = 1;
      });

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [condition, isDay]);

  return <canvas ref={canvasRef} className="fixed inset-0 -z-10" />;
}
