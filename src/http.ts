import { config } from "./config";
import { UpstreamError } from "./errors";

export async function fetchJson(url: URL, service: string): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(config.requestTimeoutMs) });
  } catch (err) {
    throw new UpstreamError(`Could not reach the ${service} service.`, { cause: err });
  }

  if (!res.ok) {
    throw new UpstreamError(`The ${service} service returned status ${res.status}.`);
  }

  try {
    return await res.json();
  } catch (err) {
    throw new UpstreamError(`The ${service} service returned invalid JSON.`, { cause: err });
  }
}