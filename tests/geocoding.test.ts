import { describe, it, expect, vi, afterEach } from "vitest";
import { geocode } from "../src/geocodingClient";
import { NotFoundError, UpstreamError } from "../src/errors";

function mockFetch(body: unknown, status = 200) {
  return vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(new Response(JSON.stringify(body), { status }));
}

const auckland = {
  name: "Auckland",
  latitude: -36.85,
  longitude: 174.76,
  country: "New Zealand",
  admin1: "Auckland",
  timezone: "Pacific/Auckland",
};

afterEach(() => vi.restoreAllMocks());

describe("geocode: success", () => {
  it("maps results to GeocodedLocation", async () => {
    mockFetch({ results: [auckland] });

    expect(await geocode("Auckland")).toEqual([
      {
        name: "Auckland",
        lat: -36.85,
        lng: 174.76,
        country: "New Zealand",
        region: "Auckland",
        timezone: "Pacific/Auckland",
      },
    ]);
  });

  it("returns multiple matches so the UI can disambiguate", async () => {
    mockFetch({ results: [auckland, { ...auckland, country: "Elsewhere" }] });
    expect(await geocode("Auckland")).toHaveLength(2);
  });

  it("sends the query and options as URL parameters", async () => {
    const spy = mockFetch({ results: [auckland] });
    await geocode("São Paulo");

    const url = new URL(String(spy.mock.calls[0][0]));
    expect(url.hostname).toBe("geocoding-api.open-meteo.com");
    expect(url.searchParams.get("name")).toBe("São Paulo");
    expect(url.searchParams.get("count")).toBe("5");
  });
});

describe("geocode: failures", () => {
  it("throws NotFoundError when there are no results", async () => {
    mockFetch({ generationtime_ms: 0.5 }); 
    await expect(geocode("Asdfgh")).rejects.toThrow(NotFoundError);
  });

  it("throws UpstreamError on a non-OK status", async () => {
    mockFetch({ error: true }, 500);
    await expect(geocode("Auckland")).rejects.toThrow(UpstreamError);
  });

  it("throws UpstreamError when the network fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("fetch failed"));
    await expect(geocode("Auckland")).rejects.toThrow(UpstreamError);
  });

  it("throws UpstreamError on an unexpected response shape", async () => {
    mockFetch({ results: [{ name: "Auckland", latitude: "not a number" }] });
    await expect(geocode("Auckland")).rejects.toThrow(UpstreamError);
  });

  it("throws UpstreamError on invalid JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("<html>oops</html>"));
    await expect(geocode("Auckland")).rejects.toThrow(UpstreamError);
  });
});