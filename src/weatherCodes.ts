export type WeatherIcon =
  | "clear"
  | "partly-cloudy"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "thunderstorm"
  | "unknown";

export interface WeatherInfo {
  description: string;
  icon: WeatherIcon;
}

const WEATHER_CODES: Record<number, WeatherInfo> = {
  0: { description: "Clear sky", icon: "clear" },
  1: { description: "Mainly clear", icon: "partly-cloudy" },
  2: { description: "Partly cloudy", icon: "partly-cloudy" },
  3: { description: "Overcast", icon: "cloudy" },
  45: { description: "Fog", icon: "fog" },
  48: { description: "Freezing fog", icon: "fog" },
  51: { description: "Light drizzle", icon: "drizzle" },
  53: { description: "Moderate drizzle", icon: "drizzle" },
  55: { description: "Heavy drizzle", icon: "drizzle" },
  56: { description: "Light freezing drizzle", icon: "drizzle" },
  57: { description: "Heavy freezing drizzle", icon: "drizzle" },
  61: { description: "Slight rain", icon: "rain" },
  63: { description: "Moderate rain", icon: "rain" },
  65: { description: "Heavy rain", icon: "rain" },
  66: { description: "Light freezing rain", icon: "rain" },
  67: { description: "Heavy freezing rain", icon: "rain" },
  71: { description: "Slight snow", icon: "snow" },
  73: { description: "Moderate snow", icon: "snow" },
  75: { description: "Heavy snow", icon: "snow" },
  77: { description: "Snow grains", icon: "snow" },
  80: { description: "Slight rain showers", icon: "rain" },
  81: { description: "Moderate rain showers", icon: "rain" },
  82: { description: "Violent rain showers", icon: "rain" },
  85: { description: "Slight snow showers", icon: "snow" },
  86: { description: "Heavy snow showers", icon: "snow" },
  95: { description: "Thunderstorm", icon: "thunderstorm" },
  96: { description: "Thunderstorm with slight hail", icon: "thunderstorm" },
  99: { description: "Thunderstorm with heavy hail", icon: "thunderstorm" },
};

const UNKNOWN: WeatherInfo = { description: "Unknown", icon: "unknown" };

export function describeWeather(code: number | null): WeatherInfo {
  if (code === null) return UNKNOWN;
  return WEATHER_CODES[code] ?? UNKNOWN;
}