import { geocode } from "./geocodingClient";
import { parseQuery } from "./parser";
import type { DailyForecast, GeocodedLocation } from "./schemas";
import { getForecast } from "./weatherClient";
import { describeWeather, type WeatherIcon } from "./weatherCodes";

export interface DayView extends DailyForecast {
  description: string;
  icon: WeatherIcon;
}

export interface ForecastResult {
  kind: "forecast";
  location: GeocodedLocation;
  timezone: string;
  days: DayView[];
}

export interface ChoicesResult {
  kind: "choices";
  locations: GeocodedLocation[];
}

export type WeatherResult = ForecastResult | ChoicesResult;

export async function lookupWeather(query: string): Promise<WeatherResult> {
  const parsed = parseQuery(query);

  if (parsed.type === "coordinates") {
    return buildForecast({
      name: `${parsed.lat}, ${parsed.lng}`,
      lat: parsed.lat,
      lng: parsed.lng,
    });
  }

  const matches = await geocode(parsed.query);
  if (matches.length > 1) {
    return { kind: "choices", locations: matches };
  }
  return buildForecast(matches[0]);
}

async function buildForecast(location: GeocodedLocation): Promise<ForecastResult> {
  const forecast = await getForecast(location.lat, location.lng);
  return {
    kind: "forecast",
    location,
    timezone: forecast.timezone,
    days: forecast.days.map((day) => ({ ...day, ...describeWeather(day.weatherCode) })),
  };
}