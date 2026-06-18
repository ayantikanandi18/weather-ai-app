export interface GeoLocation {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  country_code: string;
  admin1?: string;
}

export interface CurrentWeather {
  time: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  weatherCode: number;
  precipitation: number;
  uvIndex: number;
  visibility: number;
  cloudCover: number;
  pressure: number;
  dewPoint: number;
  isDay: boolean;
}

export interface HourlyWeather {
  time: string[];
  temperature: number[];
  precipitation: number[];
  weatherCode: number[];
  windSpeed: number[];
  humidity: number[];
  uvIndex: number[];
  feelsLike: number[];
  cloudCover: number[];
}

export interface DailyWeather {
  time: string[];
  temperatureMax: number[];
  temperatureMin: number[];
  precipitation: number[];
  weatherCode: number[];
  windSpeedMax: number[];
  uvIndexMax: number[];
  sunrise: string[];
  sunset: string[];
  precipitationProbabilityMax: number[];
}

export interface WeatherData {
  location: GeoLocation;
  current: CurrentWeather;
  hourly: HourlyWeather;
  daily: DailyWeather;
  timezone: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface ActivityRating {
  activity: string;
  icon: string;
  score: number;
  verdict: string;
  reason: string;
}

export type WeatherCondition =
  | "clear"
  | "cloudy"
  | "rain"
  | "snow"
  | "thunder"
  | "fog"
  | "drizzle";
