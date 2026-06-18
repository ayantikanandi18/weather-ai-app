import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WeatherMind — AI Weather Intelligence",
  description: "Agentic AI weather app with natural language queries, activity planning, and smart insights",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
