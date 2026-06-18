import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const tools: Anthropic.Tool[] = [
  {
    name: "get_weather",
    description:
      "Fetch current weather and forecast for a location by name. Returns temperature, conditions, humidity, wind, UV index, and 7-day forecast.",
    input_schema: {
      type: "object" as const,
      properties: {
        location: { type: "string", description: "City name, e.g. 'New York' or 'Paris, France'" },
      },
      required: ["location"],
    },
  },
  {
    name: "compare_cities",
    description: "Compare current weather conditions between 2-4 cities side by side.",
    input_schema: {
      type: "object" as const,
      properties: {
        cities: {
          type: "array",
          items: { type: "string" },
          description: "List of 2-4 city names to compare",
        },
      },
      required: ["cities"],
    },
  },
  {
    name: "activity_advisor",
    description:
      "Given weather conditions, evaluate suitability for outdoor activities like running, cycling, hiking, picnic, beach, photography.",
    input_schema: {
      type: "object" as const,
      properties: {
        location: { type: "string", description: "City to check weather for" },
        activity: { type: "string", description: "The specific activity to evaluate" },
        date_offset: {
          type: "number",
          description: "0 = today, 1 = tomorrow, 2 = day after, etc.",
          default: 0,
        },
      },
      required: ["location", "activity"],
    },
  },
  {
    name: "outfit_recommender",
    description:
      "Based on current or forecasted weather for a location, suggest what to wear.",
    input_schema: {
      type: "object" as const,
      properties: {
        location: { type: "string" },
        occasion: {
          type: "string",
          description: "e.g. 'casual', 'office', 'outdoor workout', 'formal event'",
        },
      },
      required: ["location"],
    },
  },
];

async function fetchWeatherForLocation(location: string) {
  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
  );
  const geoData = await geoRes.json();
  if (!geoData.results?.length) return null;

  const { latitude, longitude, name, country } = geoData.results[0];

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,precipitation,uv_index,is_day",
    daily: "temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,precipitation_sum",
    wind_speed_unit: "kmh",
    timezone: "auto",
    forecast_days: "7",
  });

  const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  const w = await weatherRes.json();

  return {
    location: `${name}, ${country}`,
    current: {
      temperature: w.current.temperature_2m,
      feelsLike: w.current.apparent_temperature,
      humidity: w.current.relative_humidity_2m,
      windSpeed: w.current.wind_speed_10m,
      weatherCode: w.current.weather_code,
      precipitation: w.current.precipitation,
      uvIndex: w.current.uv_index,
      isDay: w.current.is_day === 1,
    },
    daily: {
      time: w.daily.time,
      tempMax: w.daily.temperature_2m_max,
      tempMin: w.daily.temperature_2m_min,
      weatherCode: w.daily.weather_code,
      precipChance: w.daily.precipitation_probability_max,
    },
  };
}

function weatherCodeToText(code: number): string {
  const map: Record<number, string> = {
    0: "clear sky", 1: "mainly clear", 2: "partly cloudy", 3: "overcast",
    45: "foggy", 48: "icy fog", 51: "light drizzle", 53: "drizzle", 55: "heavy drizzle",
    61: "light rain", 63: "rain", 65: "heavy rain", 71: "light snow", 73: "snow",
    75: "heavy snow", 80: "rain showers", 81: "showers", 82: "heavy showers",
    95: "thunderstorm", 96: "thunderstorm with hail", 99: "severe thunderstorm",
  };
  return map[code] ?? `weather code ${code}`;
}

async function handleToolCall(name: string, input: Record<string, unknown>): Promise<string> {
  if (name === "get_weather") {
    const data = await fetchWeatherForLocation(input.location as string);
    if (!data) return `Could not find weather data for "${input.location}".`;

    const c = data.current;
    const forecast = data.daily.time
      .slice(0, 5)
      .map((t: string, i: number) => {
        const date = new Date(t).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        return `  ${date}: ${data.daily.tempMin[i]}°C – ${data.daily.tempMax[i]}°C, ${weatherCodeToText(data.daily.weatherCode[i])}, ${data.daily.precipChance[i]}% rain chance`;
      })
      .join("\n");

    return `Weather for ${data.location}:
Current: ${c.temperature}°C (feels like ${c.feelsLike}°C), ${weatherCodeToText(c.weatherCode)}
Humidity: ${c.humidity}%, Wind: ${c.windSpeed} km/h, UV: ${c.uvIndex}, Precip: ${c.precipitation}mm

5-Day Forecast:
${forecast}`;
  }

  if (name === "compare_cities") {
    const cities = input.cities as string[];
    const results = await Promise.all(cities.map(fetchWeatherForLocation));
    return results
      .map((d) => {
        if (!d) return "Not found";
        const c = d.current;
        return `${d.location}: ${c.temperature}°C (feels ${c.feelsLike}°C), ${weatherCodeToText(c.weatherCode)}, humidity ${c.humidity}%, wind ${c.windSpeed} km/h`;
      })
      .join("\n");
  }

  if (name === "activity_advisor") {
    const data = await fetchWeatherForLocation(input.location as string);
    if (!data) return `Could not find data for "${input.location}".`;

    const offset = (input.date_offset as number) ?? 0;
    const c = offset === 0 ? data.current : {
      temperature: data.daily.tempMax[offset],
      weatherCode: data.daily.weatherCode[offset],
      precipitation: data.daily.precipChance[offset],
      windSpeed: data.current.windSpeed,
      humidity: data.current.humidity,
      uvIndex: data.current.uvIndex,
    };

    const dateLabel = offset === 0 ? "today" : offset === 1 ? "tomorrow" : `in ${offset} days`;
    const cond = weatherCodeToText(c.weatherCode);
    const isRain = c.weatherCode >= 51;
    const isThunder = c.weatherCode >= 95;

    return `Activity advisor for ${input.activity || "outdoor activities"} in ${data.location} ${dateLabel}:
Weather: ${c.temperature}°C, ${cond}
${isThunder ? "⚠️ AVOID: Active thunderstorm — dangerous outdoors." : isRain ? "⚠️ Rain expected — consider waterproof gear or rescheduling." : c.temperature > 35 ? "🌡️ Very hot — hydrate frequently, go early morning or evening." : c.uvIndex > 7 ? "☀️ High UV — wear sunscreen, hat, and seek shade." : "✅ Conditions look reasonable for outdoor activity."}
Recommendation: ${isThunder ? "Stay indoors." : isRain ? `If ${input.activity}, bring waterproof gear.` : "Good to go with standard precautions."}`;
  }

  if (name === "outfit_recommender") {
    const data = await fetchWeatherForLocation(input.location as string);
    if (!data) return `Could not find data for "${input.location}".`;

    const c = data.current;
    const occasion = (input.occasion as string) ?? "casual";
    const cond = weatherCodeToText(c.weatherCode);
    const isRain = c.weatherCode >= 51 && c.weatherCode < 95;
    const isSnow = c.weatherCode >= 71 && c.weatherCode < 80;

    let base = "";
    if (c.temperature < 0) base = "heavy winter coat, thermal underlayers, wool socks, insulated boots";
    else if (c.temperature < 10) base = "warm coat or parka, sweater, jeans/trousers, boots";
    else if (c.temperature < 18) base = "light jacket or hoodie, long-sleeved shirt, trousers";
    else if (c.temperature < 25) base = "t-shirt or light shirt, jeans or chinos";
    else base = "light clothing, shorts or dress, breathable fabrics";

    const extras = [
      isRain ? "☂️ rain jacket or umbrella" : null,
      isSnow ? "🧤 gloves and waterproof boots" : null,
      c.uvIndex > 5 ? "🕶️ sunglasses and sunscreen" : null,
      c.windSpeed > 25 ? "💨 windproof layer" : null,
    ].filter(Boolean);

    return `Outfit for ${data.location} (${c.temperature}°C, ${cond}) — ${occasion}:
Base: ${base}
${extras.length ? `Extras: ${extras.join(", ")}` : "No special extras needed."}
Feels like ${c.feelsLike}°C — ${c.feelsLike < c.temperature ? "dress warmer than the thermometer suggests." : "temperature is comfortable."}`;
  }

  return "Unknown tool";
}

export async function POST(req: NextRequest) {
  const { messages, location } = await req.json();

  const systemPrompt = `You are WeatherMind, an expert AI weather assistant with access to real-time weather data. You help users understand weather conditions, plan activities, and make smart decisions based on weather.

${location ? `The user's current location is: ${location}. Use this as the default location unless they specify otherwise.` : ""}

Guidelines:
- Be conversational, warm, and concise
- When fetching weather, always use the tools provided — don't make up data
- Proactively suggest relevant insights (e.g., if rain is coming, mention it)
- Format responses with clear structure when comparing or listing things
- Use emojis sparingly but effectively
- If asked about multiple days, reference the forecast data`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicMessages: Anthropic.MessageParam[] = messages.map(
          (m: { role: string; content: string }) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })
        );

        let continueLoop = true;
        let currentMessages = anthropicMessages;

        while (continueLoop) {
          const response = await anthropic.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 1024,
            system: systemPrompt,
            tools,
            messages: currentMessages,
          });

          if (response.stop_reason === "tool_use") {
            const toolUses = response.content.filter((b) => b.type === "tool_use");
            const toolResults: Anthropic.ToolResultBlockParam[] = [];

            for (const toolUse of toolUses) {
              if (toolUse.type !== "tool_use") continue;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "tool_call", name: toolUse.name })}\n\n`));
              const result = await handleToolCall(toolUse.name, toolUse.input as Record<string, unknown>);
              toolResults.push({ type: "tool_result", tool_use_id: toolUse.id, content: result });
            }

            currentMessages = [
              ...currentMessages,
              { role: "assistant", content: response.content },
              { role: "user", content: toolResults },
            ];
          } else {
            for (const block of response.content) {
              if (block.type === "text") {
                const words = block.text.split(" ");
                for (const word of words) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "text", text: word + " " })}\n\n`));
                  await new Promise((r) => setTimeout(r, 15));
                }
              }
            }
            continueLoop = false;
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: msg })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
