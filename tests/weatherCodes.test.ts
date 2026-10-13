import { describe, it, expect } from "vitest";
import { describeWeather } from "../src/weatherCodes";

describe("describeWeather: known codes", () => {
  it.each([
    [0, "Clear sky", "clear"],
    [1, "Mainly clear", "partly-cloudy"],
    [2, "Partly cloudy", "partly-cloudy"],
    [3, "Overcast", "cloudy"],
    [45, "Fog", "fog"],
    [53, "Moderate drizzle", "drizzle"],
    [61, "Slight rain", "rain"],
    [65, "Heavy rain", "rain"],
    [67, "Heavy freezing rain", "rain"],
    [75, "Heavy snow", "snow"],
    [81, "Moderate rain showers", "rain"],
    [86, "Heavy snow showers", "snow"],
    [95, "Thunderstorm", "thunderstorm"],
    [99, "Thunderstorm with heavy hail", "thunderstorm"],
  ])("code %i is %s", (code, description, icon) => {
    expect(describeWeather(code)).toEqual({ description, icon });
  });
});

describe("describeWeather: fallbacks", () => {
  it("returns an unknown result for null", () => {
    expect(describeWeather(null)).toEqual({ description: "Unknown", icon: "unknown" });
  });

  it("returns an unknown result for an unrecognised code", () => {
    expect(describeWeather(42)).toEqual({ description: "Unknown", icon: "unknown" });
  });
});