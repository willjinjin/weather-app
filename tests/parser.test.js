import { describe, it, expect } from "vitest";
import { parseQuery } from "../src/parser";
import { InvalidInputError } from "../src/errors";

describe("parseQuery: coordinates", () => {
  it.each([
    ["comma separated", "-36.85, 174.76", -36.85, 174.76],
    ["comma, no space", "-36.85,174.76", -36.85, 174.76],
    ["space separated", "-36.85 174.76", -36.85, 174.76],
    ["positive values", "51.5, -0.12", 51.5, -0.12],
    ["integers", "40, -74", 40, -74],
    ["hemisphere letters", "36.85S 174.76E", -36.85, 174.76],
    ["hemisphere with comma", "51.5N, 0.12W", 51.5, -0.12],
    ["lowercase letters", "36.85s 174.76e", -36.85, 174.76],
    ["surrounding whitespace", "  -36.85,   174.76  ", -36.85, 174.76],
  ])("parses %s", (_label, input, lat, lng) => {
    expect(parseQuery(input)).toEqual({ type: "coordinates", lat, lng });
  });

  it("accepts boundary values", () => {
    expect(parseQuery("90, 180")).toEqual({ type: "coordinates", lat: 90, lng: 180 });
    expect(parseQuery("-90, -180")).toEqual({ type: "coordinates", lat: -90, lng: -180 });
  });
});

describe("parseQuery: addresses", () => {
  it.each([
    ["city name", "Auckland"],
    ["street address", "1 Queen St, Auckland"],
    ["address starting with a number", "10 Downing Street, London"],
    ["name with a comma", "Springfield, IL"],
  ])("treats %s as an address", (_label, input) => {
    expect(parseQuery(input)).toEqual({ type: "address", query: input });
  });

  it("trims whitespace around addresses", () => {
    expect(parseQuery("  Wellington  ")).toEqual({ type: "address", query: "Wellington" });
  });
});

describe("parseQuery: invalid input", () => {
  it.each([
    ["empty string", ""],
    ["whitespace only", "   "],
    ["latitude above 90", "95, 174"],
    ["latitude below -90", "-91, 174"],
    ["longitude above 180", "36, 181"],
    ["longitude below -180", "36, -181"],
    ["out of range with letters", "95S 174E"],
  ])("rejects %s", (_label, input) => {
    expect(() => parseQuery(input)).toThrow(InvalidInputError);
  });
});