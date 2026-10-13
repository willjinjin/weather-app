import { describe, it, expect, vi, afterEach } from "vitest";
import { getForecast } from "../src/weatherClient";
import { UpstreamError } from "../src/errors";

function mockFetch(body: unknown, status = 200) {
  return vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(new Response(JSON.stringify(body), { status }));
}

function fakeBody(n = 7) {
  const range = (fn: (i: number) => number | null) => Array.from({ length: n }, (_, i) => fn(i));
  return {
    timezone: "Pacific/Auckland",
    daily: {
      time: range((i) => i).map((i) => `2026-10-${String(13 + i).padStart(2, "0")}`),
      weather_code: range(() => 3),
      temperature_2m_max: range((i) => 18 + i),
      temperature_2m_min: range((i) => 10 + i),
      precipitation_probability_max: range(() => 40),
      precipitation_sum: range(() => 1.5),
    },
  };
}

afterEach(() => vi.restoreAllMocks());

describe("getForecast: success", () => {
  it("returns 7 days", async () => {
    mockFetch(fakeBody());
    const forecast = await getForecast(-36.85, 174.76);
    expect(forecast.days).toHaveLength(7);
    expect(forecast.timezone).toBe("Pacific/Auckland");
  });

  it("maps parallel arrays into one object per day", async () => {
    mockFetch(fakeBody());
    const { days } = await getForecast(-36.85, 174.76);
    expect(days[0]).toEqual({
      date: "2026-10-13",
      weatherCode: 3,
      tempMax: 18,
      tempMin: 10,
      precipitationProbability: 40,
      precipitationSum: 1.5,
    });
    expect(days[6].tempMax).toBe(24);
  });

  it("keeps null values instead of failing", async () => {
    const body = fakeBody();
    body.daily.precipitation_probability_max[0] = null;
    mockFetch(body);
    const { days } = await getForecast(-36.85, 174.76);
    expect(days[0].precipitationProbability).toBeNull();
  });

  it("sends coordinates and options as URL parameters", async () => {
    const spy = mockFetch(fakeBody());
    await getForecast(-36.85, 174.76);

    const url = new URL(String(spy.mock.calls[0][0]));
    expect(url.hostname).toBe("api.open-meteo.com");
    expect(url.searchParams.get("latitude")).toBe("-36.85");
    expect(url.searchParams.get("longitude")).toBe("174.76");
    expect(url.searchParams.get("forecast_days")).toBe("7");
    expect(url.searchParams.get("timezone")).toBe("auto");
    expect(url.searchParams.get("daily")).toContain("temperature_2m_max");
  });
});

describe("getForecast: failures", () => {
  it("throws UpstreamError on a non-OK status", async () => {
    mockFetch({ error: true, reason: "bad request" }, 400);
    await expect(getForecast(-36.85, 174.76)).rejects.toThrow(UpstreamError);
  });

  it("throws UpstreamError when the network fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("fetch failed"));
    await expect(getForecast(-36.85, 174.76)).rejects.toThrow(UpstreamError);
  });

  it("throws UpstreamError on an unexpected response shape", async () => {
    mockFetch({ timezone: "Pacific/Auckland", daily: { time: "not an array" } });
    await expect(getForecast(-36.85, 174.76)).rejects.toThrow(UpstreamError);
  });

  it("throws UpstreamError when the arrays have different lengths", async () => {
    const body = fakeBody();
    body.daily.temperature_2m_max = body.daily.temperature_2m_max.slice(0, 3);
    mockFetch(body);
    await expect(getForecast(-36.85, 174.76)).rejects.toThrow(UpstreamError);
  });
});