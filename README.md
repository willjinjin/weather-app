## weather-app
Takes a user LatLng or address and presents the weather data for next 7 days. 

## Quick start

Requires Node.js 20 or newer.

```bash
npm install
npm run dev      # http://localhost:3000
npm test         
```


## Using it

The search box accepts a place name, an address, or coordinates:

| Input                               | Treated as                                   |
| ----------------------------------- | -------------------------------------------- |
| `Auckland`, `1 Queen St, Auckland`  | Address, looked up with Open-Meteo geocoding |
| `-36.85, 174.76` or `-36.85 174.76` | Coordinates (latitude, longitude)            |
| `36.85S 174.76E`                    | Coordinates with hemisphere letters          |

- If an address matches several places, you choose one from a list.
- Coordinates outside -90 to 90 (latitude) or -180 to 180 (longitude) are rejected with a clear message.
- The interface has light and dark themes and works on phone screens.

## API

`GET /api/weather?q=<query>`

| Status | Body                                                                            |
| ------ | ------------------------------------------------------------------------------- |
| 200    | `{ "kind": "forecast", "location", "timezone", "days": [...] }`                 |
| 200    | `{ "kind": "choices", "locations": [...] }` when an address has several matches |
| 400    | `{ "error": { "code": "invalid_input", "message": "..." } }`                    |
| 404    | `{ "error": { "code": "not_found", "message": "..." } }`                        |
| 502    | `{ "error": { "code": "upstream_error", "message": "..." } }`                   |
| 500    | `{ "error": { "code": "internal_error", "message": "..." } }`                   |

Each day has `date`, `description`, `icon`, `tempMax`, `tempMin` (Celsius), `precipitationProbability` (%) and `precipitationSum` (mm). Values that Open-Meteo doesn't provide are `null` and show as "n/a".

`GET /health` returns `{ "status": "ok" }`.

## How it works

1. The parser decides whether the input is coordinates or an address, with no network calls.
2. Addresses are looked up with Open-Meteo geocoding. If several places match, the user chooses one, and the app searches again by that place's exact coordinates.
3. The forecast is fetched for the chosen coordinates, and each weather code is converted to a description and icon.
4. The browser shows the result as seven day cards.

Behaviour worth knowing:

- Coordinates outside the valid range are rejected, not treated as an address.
- Every Open-Meteo response is validated, and failures show a message.
- Requests to Open-Meteo time out after 5 seconds.
- Dates follow the searched location's own timezone.

## Testing

```bash
npm test
```

All HTTP calls are mocked, so the tests are fast and never touch the live API. They cover:

- **Parser:** accepted formats, boundary values, addresses, and invalid input.
- **Clients:** successful responses, bad status codes, network failures, invalid JSON, and unexpected response shapes.
- **Weather codes:** known codes and fallbacks for unknown ones.
- **Route:** status codes and response shapes for forecasts, choices, and each error type.

## Known limitations

- Temperatures are in Celsius only.
- There is no caching, so every search calls Open-Meteo.
- Hemisphere letters on the wrong axis (for example `36.85E 174.76S`) are accepted as typed.
- Addresses are matched by place name, because Open-Meteo's geocoder doesn't resolve full street addresses.
- The free Open-Meteo API is rate limited and intended for non-commercial use.

## Tech stack

- **Node.js and TypeScript**
- **Express 5:** HTTP server and static files
- **Zod:** runtime validation of API responses
- **Vitest and Supertest:** tests
- **tsx:** runs TypeScript directly in development
- **Open-Meteo:** forecast and geocoding APIs

## Credits

- Weather data by [Open-Meteo](https://open-meteo.com/) (CC BY 4.0).
- UI designed with Figma Make
- Fonts: DM Sans and Pixelify Sans (SIL Open Font License)