// Frontend for the weather app. No build step: plain JavaScript served by Express.
// All API data is written with textContent (never innerHTML), so a strange place
// name can never inject markup.

const form = document.getElementById("search-form");
const input = document.getElementById("query");
const button = document.getElementById("search-button");
const resultsEl = document.getElementById("results");
const announcer = document.getElementById("announcer");
const themeButton = document.getElementById("theme-toggle");
const themeLabel = document.getElementById("theme-label");

/* ---------- Pixel icons ---------- */

const SVG_NS = "http://www.w3.org/2000/svg";

// Each icon is a list of [css class, path data]. Colors come from style.css.
const CLOUD = [
  ["icon-cloud-dark", "M7 15h3v-3h4V9h7v3h3v3h3v8H7z"],
  ["icon-cloud", "M5 16h4v-3h5v-2h6v3h4v3h3v5H5z"],
  ["icon-cloud-light", "M10 14h9v2h4v2H10z"],
];

const ICON_PARTS = {
  sun: [
    ["icon-sun-ray", "M14 2h4v5h-4zM14 25h4v5h-4zM2 14h5v4H2zM25 14h5v4h-5zM5 5h4v4H5zM23 5h4v4h-4zM5 23h4v4H5zM23 23h4v4h-4z"],
    ["icon-sun-dark", "M10 8h12v3h3v11h-3v3H10v-3H7V11h3z"],
    ["icon-sun", "M11 9h10v3h3v9h-3v3H11v-3H8v-9h3z"],
    ["icon-sun-light", "M12 10h6v3h-6z"],
  ],
  "partly-cloudy": [
    ["icon-sun-ray", "M17 2h3v4h-3zM7 7h4v3H7zM25 7h3v3h-3zM27 15h4v3h-4z"],
    ["icon-sun-dark", "M15 6h8v2h3v9h-2v3H13V9h2z"],
    ["icon-sun", "M16 7h6v2h3v7h-3v3h-8V9h2z"],
    ...CLOUD,
  ],
  cloud: CLOUD,
  fog: [...CLOUD, ["icon-fog", "M4 25h23v2H4zM8 29h18v2H8z"]],
  drizzle: [...CLOUD, ["icon-rain", "M8 25h3v3H8zM15 27h3v3h-3zM22 25h3v3h-3z"]],
  rain: [...CLOUD, ["icon-rain", "M8 24h3v5H8zM15 26h3v5h-3zM22 24h3v5h-3z"]],
  snow: [
    ...CLOUD,
    ["icon-snow", "M8 24h2v2h2v2h-2v2H8v-2H6v-2h2zM21 24h2v2h2v2h-2v2h-2v-2h-2v-2h2z"],
  ],
  thunderstorm: [
    ...CLOUD,
    ["icon-lightning", "M15 22h7l-4 4h3l-7 6 2-5h-4z"],
    ["icon-rain", "M7 25h3v5H7zM24 25h3v5h-3z"],
  ],
};

// The API's icon keys (see src/weatherCodes.ts) mapped to the icons above.
const API_ICON_TO_KIND = {
  clear: "sun",
  "partly-cloudy": "partly-cloudy",
  cloudy: "cloud",
  fog: "fog",
  drizzle: "drizzle",
  rain: "rain",
  snow: "snow",
  thunderstorm: "thunderstorm",
  unknown: "cloud",
};

// Icons are decorative: the visible description next to them says the same in text.
function pixelIcon(kind) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "weather-icon");
  svg.setAttribute("viewBox", "0 0 32 32");
  svg.setAttribute("shape-rendering", "crispEdges");
  svg.setAttribute("aria-hidden", "true");
  for (const [cls, d] of ICON_PARTS[kind] ?? ICON_PARTS.cloud) {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("class", cls);
    path.setAttribute("d", d);
    svg.append(path);
  }
  return svg;
}

/* ---------- Small helpers ---------- */

// Builds an element. Children can be strings or nodes.
function el(tag, className, ...children) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.append(...children);
  return node;
}

function announce(message) {
  announcer.textContent = message;
}

// Dates arrive as YYYY-MM-DD in the searched location's own timezone.
// Parsing and formatting both use UTC so the day never shifts with the viewer's timezone.
const weekdayFormat = new Intl.DateTimeFormat(undefined, { weekday: "long", timeZone: "UTC" });
const dateFormat = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
const utcDate = (iso) => new Date(`${iso}T00:00:00Z`);

function formatTemp(value) {
  return value === null ? "n/a" : `${Math.round(value)}°`;
}

// "Auckland, Auckland, New Zealand" becomes "Auckland, New Zealand".
function locationLabel(location) {
  const parts = [location.name, location.region, location.country].filter(Boolean);
  return parts.filter((part, i) => parts.indexOf(part) === i).join(", ");
}

// A short, honest summary computed from the data (no canned advice).
function weekSummary(days) {
  let wettest = null;
  let warmest = null;
  for (const day of days) {
    if (day.precipitationProbability !== null &&
        (!wettest || day.precipitationProbability > wettest.precipitationProbability)) {
      wettest = day;
    }
    if (day.tempMax !== null && (!warmest || day.tempMax > warmest.tempMax)) {
      warmest = day;
    }
  }

  const parts = [];
  if (wettest && wettest.precipitationProbability >= 30) {
    parts.push(
      `Wettest day: ${weekdayFormat.format(utcDate(wettest.date))} (${wettest.precipitationProbability}% chance of rain).`
    );
  } else if (wettest) {
    parts.push("Mostly dry all week.");
  }
  if (warmest) {
    parts.push(`Warmest day: ${weekdayFormat.format(utcDate(warmest.date))}, ${formatTemp(warmest.tempMax)}.`);
  }
  return parts.join(" ");
}

/* ---------- Renderers ---------- */

function showLoading() {
  const panel = el(
    "section",
    "state-panel loading-panel",
    el("div", "loading-icon", pixelIcon("partly-cloudy")),
    el(
      "div",
      "",
      el("p", "state-kicker", "Reading the skies"),
      el("h2", "", "Gathering your forecast..."),
      el("p", "", "Just a moment while we count the clouds.")
    ),
    el("div", "loading-dots", el("span"), el("span"), el("span"))
  );
  panel.querySelector(".loading-dots").setAttribute("aria-hidden", "true");
  resultsEl.replaceChildren(panel);
  announce("Loading forecast");
}

const ERROR_COPY = {
  invalid_input: { kicker: "Let's check that", title: "That search didn't look right" },
  not_found: { kicker: "Well, that's cloudy", title: "We couldn't find that place" },
  upstream_error: { kicker: "Weather service hiccup", title: "The forecast is unavailable" },
  network: { kicker: "No connection", title: "We couldn't reach the server" },
};
const DEFAULT_ERROR = { kicker: "Something went wrong", title: "Please try again" };

// The message text comes from the API, so the server decides the wording.
function showError(code, message) {
  const copy = ERROR_COPY[code] ?? DEFAULT_ERROR;

  const art = el("div", "error-art", el("span", "", "?"));
  art.setAttribute("aria-hidden", "true");

  const retry = el("button", "secondary-button", "Try another search");
  retry.type = "button";
  retry.addEventListener("click", () => {
    resultsEl.replaceChildren();
    input.focus();
    input.select();
  });

  const panel = el(
    "section",
    "state-panel error-panel",
    art,
    el(
      "div",
      "",
      el("p", "state-kicker", copy.kicker),
      el("h2", "", copy.title),
      el("p", "", message || "Something went wrong. Please try again.")
    ),
    retry
  );
  panel.setAttribute("role", "alert");
  resultsEl.replaceChildren(panel);
}

function showForecast(data, displayName) {
  const heading = displayName ?? locationLabel(data.location);

  const dot = el("span");
  dot.setAttribute("aria-hidden", "true");

  const section = el(
    "section",
    "forecast-section",
    el(
      "div",
      "section-heading forecast-heading",
      el(
        "div",
        "",
        el("p", "section-label", "7-day forecast"),
        Object.assign(el("h2", "", heading), { id: "forecast-title" })
      ),
      el("p", "updated", dot, `Dates in ${data.timezone} time`)
    )
  );
  section.setAttribute("aria-labelledby", "forecast-title");

  const grid = el("ol", "forecast-grid");
  data.days.forEach((day, index) => {
    const date = utcDate(day.date);

    const high = el("strong", "", el("span", "sr-only", "High "), formatTemp(day.tempMax));
    const low = el("span", "", el("span", "sr-only", "Low "), formatTemp(day.tempMin));

    const drop = el("span", "drop");
    drop.setAttribute("aria-hidden", "true");
    const rain =
      day.precipitationProbability === null
        ? "Rain n/a"
        : `${day.precipitationProbability}% rain`;

    const card = el(
      "li",
      index === 0 ? "forecast-card today" : "forecast-card",
      el(
        "div",
        "card-day",
        el("h3", "", weekdayFormat.format(date)),
        el("p", "", dateFormat.format(date))
      ),
      pixelIcon(API_ICON_TO_KIND[day.icon] ?? "cloud"),
      el("p", "weather-description", day.description),
      el("p", "temperatures", high, low),
      el("p", "rain-chance", drop, rain)
    );
    if (index === 0) card.prepend(el("span", "today-tag", "Today"));
    grid.append(card);
  });
  section.append(grid);

  const summary = weekSummary(data.days);
  if (summary) {
    section.append(
      el("aside", "week-note", pixelIcon("sun"), el("p", "", el("strong", "", "The week ahead. "), summary))
    );
  }

  resultsEl.replaceChildren(section);
  announce(`Forecast loaded for ${heading}`);
}

// Shown when an address matches several places, so the user picks instead of us guessing.
function showChoices(locations) {
  const list = el("ul", "place-list");
  for (const location of locations) {
    const label = [location.name, location.region].filter(Boolean).join(", ");
    const details = [
      location.country,
      `${location.lat.toFixed(2)}, ${location.lng.toFixed(2)}`,
    ].filter(Boolean).join(" · ");

    const pin = el("span", "place-pin", "+");
    pin.setAttribute("aria-hidden", "true");
    const arrow = el("span", "place-arrow", "→");
    arrow.setAttribute("aria-hidden", "true");

    const choice = el(
      "button",
      "",
      pin,
      el("span", "", el("strong", "", label), el("small", "", details)),
      arrow
    );
    choice.type = "button";
    // Search by exact coordinates, which the parser handles without geocoding again.
    choice.addEventListener("click", () =>
      search(`${location.lat}, ${location.lng}`, locationLabel(location))
    );
    list.append(el("li", "", choice));
  }

  const section = el(
    "section",
    "picker-section",
    el(
      "div",
      "section-heading",
      el(
        "div",
        "",
        el("p", "section-label", "A few possibilities"),
        Object.assign(el("h2", "", `Which ${locations[0].name} did you mean?`), { id: "picker-title" })
      ),
      el("p", "", "Choose a location to see its 7-day forecast.")
    ),
    list
  );
  section.setAttribute("aria-labelledby", "picker-title");

  resultsEl.replaceChildren(section);
  announce("Several places match. Choose one from the list.");
}

/* ---------- Search ---------- */

let controller = null;

async function search(query, displayName) {
  // A newer search cancels the previous one, so results can never arrive out of order.
  controller?.abort();
  controller = new AbortController();
  const { signal } = controller;

  showLoading();
  button.disabled = true;

  try {
    const res = await fetch(`/api/weather?q=${encodeURIComponent(query)}`, { signal });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      showError(data?.error?.code, data?.error?.message);
      return;
    }
    if (!data) {
      showError("internal_error");
      return;
    }

    if (data.kind === "choices") {
      showChoices(data.locations);
    } else {
      showForecast(data, displayName);
    }
  } catch (err) {
    if (err.name === "AbortError") return; // replaced by a newer search
    showError("network", "Check your connection and try again.");
  } finally {
    if (!signal.aborted) button.disabled = false;
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = input.value.trim();
  if (query) search(query);
});

/* ---------- Theme ---------- */

// index.html sets the initial theme before first paint. This keeps the button in sync.
function syncThemeButton() {
  const dark = document.documentElement.dataset.theme === "dark";
  themeLabel.textContent = dark ? "Light" : "Dark";
  themeButton.setAttribute("aria-label", `Switch to ${dark ? "light" : "dark"} mode`);
}

themeButton.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem("theme", next); // remember an explicit choice only
  } catch {
    // Storage can be blocked (private windows). The toggle still works for this visit.
  }
  syncThemeButton();
});

syncThemeButton();
