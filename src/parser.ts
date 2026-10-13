import { InvalidInputError } from "./errors";

export type ParsedQuery =
  | { type: "coordinates"; lat: number; lng: number }
  | { type: "address"; query: string };

const NUM = "(-?\\d+(?:\\.\\d+)?)\\s*([NSEWnsew])?";

const COORD_PATTERN = new RegExp(`^${NUM}(?:\\s*,\\s*|\\s+)${NUM}$`);

export function parseQuery(input: string): ParsedQuery {
  const trimmed = input.trim();

  if (trimmed === "") {
    throw new InvalidInputError("Please enter a location.");
  }

  const match = COORD_PATTERN.exec(trimmed);
  if (!match) {
    return { type: "address", query: trimmed };
  }

  const [, latStr, latHem, lngStr, lngHem] = match;
  const lat = applyHemisphere(Number(latStr), latHem);
  const lng = applyHemisphere(Number(lngStr), lngHem);

  if (Math.abs(lat) > 90) {
    throw new InvalidInputError("Latitude must be between -90 and 90.");
  }
  if (Math.abs(lng) > 180) {
    throw new InvalidInputError("Longitude must be between -180 and 180.");
  }

  return { type: "coordinates", lat, lng };
}

function applyHemisphere(value: number, hemisphere?: string): number {
  if (!hemisphere) return value;
  const h = hemisphere.toUpperCase();
  return h === "S" || h === "W" ? -Math.abs(value) : Math.abs(value);
}