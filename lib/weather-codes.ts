export function getWeatherDescription(code: number): string {
  const codes: Record<number, string> = {
    0: "Clear Sky", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
    45: "Fog", 48: "Icy Fog",
    51: "Light Drizzle", 53: "Drizzle", 55: "Heavy Drizzle",
    61: "Light Rain", 63: "Rain", 65: "Heavy Rain",
    71: "Light Snow", 73: "Snow", 75: "Heavy Snow", 77: "Snow Grains",
    80: "Light Showers", 81: "Showers", 82: "Heavy Showers",
    85: "Snow Showers", 86: "Heavy Snow Showers",
    95: "Thunderstorm", 96: "Thunderstorm w/ Hail", 99: "Thunderstorm w/ Heavy Hail",
  };
  return codes[code] ?? "Unknown";
}

export function getWeatherEmoji(code: number, isDay = true): string {
  if (code === 0) return isDay ? "☀️" : "🌙";
  if (code <= 2) return isDay ? "🌤️" : "🌤️";
  if (code === 3) return "☁️";
  if (code <= 48) return "🌫️";
  if (code <= 55) return "🌦️";
  if (code <= 65) return "🌧️";
  if (code <= 77) return "❄️";
  if (code <= 82) return "🌦️";
  if (code <= 86) return "🌨️";
  return "⛈️";
}

export function getWeatherCondition(code: number): string {
  if (code === 0 || code === 1) return "clear";
  if (code <= 3) return "cloudy";
  if (code <= 48) return "fog";
  if (code <= 55) return "drizzle";
  if (code <= 67) return "rain";
  if (code <= 77) return "snow";
  if (code <= 82) return "rain";
  if (code <= 86) return "snow";
  return "thunder";
}

export function getWindDirection(degrees: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(degrees / 45) % 8];
}

export function getUvLabel(uv: number): { label: string; color: string } {
  if (uv <= 2) return { label: "Low", color: "text-green-400" };
  if (uv <= 5) return { label: "Moderate", color: "text-yellow-400" };
  if (uv <= 7) return { label: "High", color: "text-orange-400" };
  if (uv <= 10) return { label: "Very High", color: "text-red-400" };
  return { label: "Extreme", color: "text-purple-400" };
}

export function getAqiLabel(aqi: number): { label: string; color: string } {
  if (aqi <= 50) return { label: "Good", color: "text-green-400" };
  if (aqi <= 100) return { label: "Moderate", color: "text-yellow-400" };
  if (aqi <= 150) return { label: "Unhealthy for Sensitive", color: "text-orange-400" };
  if (aqi <= 200) return { label: "Unhealthy", color: "text-red-400" };
  return { label: "Very Unhealthy", color: "text-purple-400" };
}

export function computeActivityRatings(current: {
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  humidity: number;
  uvIndex: number;
  precipitation: number;
}) {
  const { temperature, weatherCode, windSpeed, humidity, uvIndex, precipitation } = current;
  const isRain = weatherCode >= 51 && weatherCode <= 82;
  const isSnow = weatherCode >= 71 && weatherCode <= 77;
  const isThunder = weatherCode >= 95;
  const isHot = temperature > 35;
  const isCold = temperature < 5;
  const isWindy = windSpeed > 30;
  const isHumid = humidity > 80;

  const score = (base: number, penalties: number[]) =>
    Math.max(0, Math.min(100, penalties.reduce((acc, p) => acc - p, base)));

  return [
    {
      activity: "Running", icon: "🏃",
      score: score(90, [
        isThunder ? 90 : 0, isRain ? 35 : 0, isWindy ? 20 : 0,
        isHot ? 30 : 0, isCold ? 15 : 0,
      ]),
    },
    {
      activity: "Cycling", icon: "🚴",
      score: score(90, [
        isThunder ? 90 : 0, isRain ? 45 : 0, isWindy ? 30 : 0,
        isSnow ? 50 : 0, isCold ? 20 : 0,
      ]),
    },
    {
      activity: "Hiking", icon: "🥾",
      score: score(85, [
        isThunder ? 90 : 0, isRain ? 30 : 0, isSnow ? 25 : 0,
        isHot ? 20 : 0, uvIndex > 8 ? 20 : 0,
      ]),
    },
    {
      activity: "Picnic", icon: "🧺",
      score: score(85, [
        isRain ? 85 : 0, isThunder ? 90 : 0, isWindy ? 25 : 0,
        isHot ? 20 : 0, isCold ? 30 : 0,
      ]),
    },
    {
      activity: "Beach", icon: "🏖️",
      score: score(80, [
        isRain ? 70 : 0, isThunder ? 90 : 0, isCold ? 60 : 0,
        isWindy ? 20 : 0, isHumid ? 10 : 0,
      ]),
    },
    {
      activity: "Photography", icon: "📸",
      score: score(80, [
        isThunder ? 40 : 0, isRain ? 20 : 0,
        weatherCode <= 2 ? -10 : 0,
        weatherCode === 3 ? -5 : 0,
      ]),
    },
  ].map((a) => ({
    ...a,
    verdict: a.score >= 75 ? "Great" : a.score >= 50 ? "Okay" : a.score >= 25 ? "Risky" : "Avoid",
  }));
}
