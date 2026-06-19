# WeatherMind — AI-Powered Weather App

WeatherMind is a weather app with a built-in AI assistant that answers questions, compares cities, suggests outfits, and advises on activities — all based on real-time weather data.

**Live demo:** [weathermind on Vercel] *(link will be added after deployment)*

---

## What it does

- **Real-time weather** — current conditions, hourly and 7-day forecast for any city in the world
- **AI chat** — ask anything: *"Should I go hiking tomorrow?"*, *"What should I wear in Paris today?"*, *"Compare weather in Tokyo vs London"*
- **Activity advisor** — tells you if conditions are good for running, cycling, hiking, beach trips, and more
- **Outfit recommender** — suggests what to wear based on temperature, rain, wind, and UV index
- **Dynamic backgrounds** — the app's visual theme changes based on current weather and time of day
- **Auto-location** — detects your location automatically, or search any city

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org) (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| AI | [Claude](https://anthropic.com) via Anthropic SDK |
| Weather data | [Open-Meteo](https://open-meteo.com) (free, no key needed) |
| Geocoding | Open-Meteo Geocoding + OpenStreetMap Nominatim |

---

## Running locally

### Prerequisites
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com)

### Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/ayantikanandi18/weather-ai-app.git
   cd weather-ai-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Add your API key**

   Create a `.env.local` file in the root folder:
   ```
   ANTHROPIC_API_KEY=your_key_here
   ```
   Get a key at [console.anthropic.com](https://console.anthropic.com).

4. **Start the dev server**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deploying to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New Project** and import `weather-ai-app`
3. Under **Environment Variables**, add:
   - `ANTHROPIC_API_KEY` → your Anthropic API key
4. Click **Deploy**

---

## Project structure

```
app/
  page.tsx              # Main UI
  api/
    weather/route.ts    # Fetches weather from Open-Meteo
    geocode/route.ts    # Location search
    agent/route.ts      # AI chat endpoint (Claude + tools)
components/
  AIChat.tsx            # Chat panel
  CurrentWeatherCard.tsx
  ForecastChart.tsx
  ActivityAdvisor.tsx
  SunriseSunset.tsx
  WeatherBackground.tsx
  SearchBar.tsx
lib/
  weather-codes.ts      # WMO weather code mappings
types/
  weather.ts            # TypeScript types
```

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Powers the AI chat assistant |

Weather and geocoding data come from free public APIs — no additional keys needed.
