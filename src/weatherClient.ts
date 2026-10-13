import { config } from "./config";
import { UpstreamError } from "./errors";
import { fetchJson } from "./http";
import { forecastResponseSchema, type DailyForecast, type Forecast } from "./schemas";

const DAILY_FIELDS = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "precipitation_probability_max",
  "precipitation_sum",
];

export async function getForecast(lat: number, lng: number): Promise<Forecast> {
  const url = new URL(config.forecastBaseUrl);
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set("daily", DAILY_FIELDS.join(","));
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", String(config.forecastDays));

  const body = await fetchJson(url, "weather");

  const parsed = forecastResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new UpstreamError("Unexpected response from the weather service.");
  }

  const { time, ...fields } = parsed.data.daily;
  const lengths = Object.values(fields).map((a) => a.length);
  if (lengths.some((len) => len !== time.length)) {
    throw new UpstreamError("Weather service returned inconsistent data.");
  }

  const days: DailyForecast[] = time.map((date, i) => ({
    date,
    weatherCode: fields.weather_code[i],
    tempMax: fields.temperature_2m_max[i],
    tempMin: fields.temperature_2m_min[i],
    precipitationProbability: fields.precipitation_probability_max[i],
    precipitationSum: fields.precipitation_sum[i],
  }));

  return { timezone: parsed.data.timezone, days };
}