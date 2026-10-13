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