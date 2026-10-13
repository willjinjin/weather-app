import { z } from "zod";

export const geocodingResponseSchema = z.object({
  results: z
    .array(
      z.object({
        name: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        country: z.string().optional(),
        admin1: z.string().optional(),
        timezone: z.string().optional(),
      })
    )
    .optional(),
});

export interface GeocodedLocation {
  name: string;
  lat: number;
  lng: number;
  country?: string;
  region?: string;
  timezone?: string;
}

export const forecastResponseSchema = z.object({
  timezone: z.string(),
  daily: z.object({
    time: z.array(z.string()),
    weather_code: z.array(z.number().nullable()),
    temperature_2m_max: z.array(z.number().nullable()),
    temperature_2m_min: z.array(z.number().nullable()),
    precipitation_probability_max: z.array(z.number().nullable()),
    precipitation_sum: z.array(z.number().nullable()),
  }),
});

export interface DailyForecast {
  date: string;
  weatherCode: number | null; 
  tempMax: number | null; 
  tempMin: number | null; 
  precipitationProbability: number | null; 
  precipitationSum: number | null;
}

export interface Forecast {
  timezone: string;
  days: DailyForecast[];
}