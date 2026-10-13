import { describe, it, expect, vi, afterEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";

const json = (body: unknown, status = 200) => () =>
  new Response(JSON.stringify(body), { status });

function mockUpstream(handlers: {
  geocoding?: () => Response;
  forecast?: () => Response;
}) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const host = new URL(String(input)).hostname;
    const handler = host.startsWith("geocoding-api") ? handlers.geocoding : handlers.forecast;
    if (!handler) throw new Error(`Unexpected call to ${host}`);
    return handler();
  });
}

const auckland = {
  name: "Auckland",
  latitude: -36.85,
  longitude: 174.76,
  country: "New Zealand",
  admin1: "Auckland",
  timezone: "Pacific/Auckland",
};

function forecastBody(days = 7) {
  const fill = (v: number) => Array(days).fill(v);
  return {
    timezone: "Pacific/Auckland",
    daily: {
      time: Array.from({ length: days }, (_, i) => `2026-10-${13 + i}`),
      weather_code: fill(61),
      temperature_2m_max: fill(18),
      temperature_2m_min: fill(10),
      precipitation_probability_max: fill(40),
      precipitation_sum: fill(1.5),
    },
  };
}

const get = (q?: string) =>
  request(createApp()).get("/api/weather").query(q === undefined ? {} : { q });

afterEach(() => vi.restoreAllMocks());

describe("GET /api/weather: success", () => {
  it("returns a forecast for coordinates without calling the geocoder", async () => {
    const spy = mockUpstream({ forecast: json(forecastBody()) });

    const res = await get("-36.85, 174.76");

    expect(res.status).toBe(200);
    expect(res.body.kind).toBe("forecast");
    expect(res.body.days).toHaveLength(7);
    expect(spy).toHaveBeenCalledTimes(1); 
  });

  it("adds a readable description and icon to each day", async () => {
    mockUpstream({ forecast: json(forecastBody()) });

    const res = await get("-36.85, 174.76");

    expect(res.body.days[0]).toMatchObject({
      date: "2026-10-13",
      description: "Slight rain",
      icon: "rain",
      tempMax: 18,
      tempMin: 10,
    });
  });

  it("geocodes an address with one match, then fetches the forecast", async () => {
    const spy = mockUpstream({
      geocoding: json({ results: [auckland] }),
      forecast: json(forecastBody()),
    });

    const res = await get("Auckland");

    expect(res.status).toBe(200);
    expect(res.body.kind).toBe("forecast");
    expect(res.body.location).toMatchObject({ name: "Auckland", lat: -36.85, lng: 174.76 });
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("returns choices when an address has several matches", async () => {
    const spy = mockUpstream({
      geocoding: json({ results: [auckland, { ...auckland, country: "Elsewhere" }] }),
    });

    const res = await get("Auckland");

    expect(res.status).toBe(200);
    expect(res.body.kind).toBe("choices");
    expect(res.body.locations).toHaveLength(2);
    expect(spy).toHaveBeenCalledTimes(1); 
  });
});

describe("GET /api/weather: errors", () => {
  it.each([
    ["missing q", undefined],
    ["empty q", ""],
    ["latitude out of range", "95, 174"],
  ])("returns 400 for %s without calling Open-Meteo", async (_label, q) => {
    const spy = mockUpstream({});

    const res = await get(q);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_input");
    expect(res.body.error.message).toBeTruthy();
    expect(spy).not.toHaveBeenCalled();
  });

  it("returns 404 when no location matches", async () => {
    mockUpstream({ geocoding: json({ generationtime_ms: 0.4 }) });

    const res = await get("Asdfgh");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("not_found");
  });

  it("returns 502 when the weather service fails", async () => {
    mockUpstream({ forecast: json({ error: true }, 500) });

    const res = await get("-36.85, 174.76");

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe("upstream_error");
  });

  it("returns 502 when the network is down", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("fetch failed"));

    const res = await get("-36.85, 174.76");

    expect(res.status).toBe(502);
  });
});