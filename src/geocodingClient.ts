import { config } from "./config";
import { NotFoundError, UpstreamError } from "./errors";
import { geocodingResponseSchema, type GeocodedLocation } from "./schemas";

export async function geocode(query: string): Promise<GeocodedLocation[]> {
  const url = new URL(config.geocodingBaseUrl);
  url.searchParams.set("name", query);
  url.searchParams.set("count", String(config.geocodingResultCount));
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(config.requestTimeoutMs) });
  } catch (err) {
    throw new UpstreamError("Could not reach the geocoding service.", { cause: err });
  }

  if (!res.ok) {
    throw new UpstreamError(`Geocoding service returned status ${res.status}.`);
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch (err) {
    throw new UpstreamError("Geocoding service returned invalid JSON.", { cause: err });
  }

  const parsed = geocodingResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new UpstreamError("Unexpected response from the geocoding service.");
  }

  const results = parsed.data.results ?? [];
  if (results.length === 0) {
    throw new NotFoundError(`No locations found for "${query}".`);
  }

  return results.map((r) => ({
    name: r.name,
    lat: r.latitude,
    lng: r.longitude,
    country: r.country,
    region: r.admin1,
    timezone: r.timezone,
  }));
}