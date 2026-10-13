const form = document.getElementById("search-form");
const input = document.getElementById("query");
const button = document.getElementById("search-button");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");

const ICONS = {
  clear: "☀️",
  "partly-cloudy": "⛅",
  cloudy: "☁️",
  fog: "🌫️",
  drizzle: "🌦️",
  rain: "🌧️",
  snow: "❄️",
  thunderstorm: "⛈️",
  unknown: "❔",
};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.className = isError ? "status error" : "status";
}

function formatTemp(value) {
  return value === null ? "n/a" : `${Math.round(value)}°`;
}

function formatDay(isoDate, index) {
  if (index === 0) return "Today"; 
  const date = new Date(`${isoDate}T00:00:00Z`);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

function locationLabel(location) {
  const parts = [location.name, location.region, location.country].filter(Boolean);
  return parts.filter((part, i) => parts.indexOf(part) === i).join(", ");
}

function renderForecast(data, displayName) {
  const section = el("div", "forecast");
  section.append(el("h2", "", displayName ?? locationLabel(data.location)));

  const list = el("ul", "cards");
  data.days.forEach((day, index) => {
    const card = el("li", "card");

    const icon = el("span", "icon", ICONS[day.icon] ?? ICONS.unknown);
    icon.setAttribute("aria-hidden", "true");

    const temps = el("p", "temps");
    temps.append(el("span", "high", formatTemp(day.tempMax)), " ", el("span", "low", formatTemp(day.tempMin)));

    const rain =
      day.precipitationProbability === null ? "Rain: n/a" : `Rain: ${day.precipitationProbability}%`;

    card.append(
      el("h3", "day", formatDay(day.date, index)),
      icon,
      el("p", "description", day.description),
      temps,
      el("p", "rain", rain)
    );
    list.append(card);
  });

  section.append(list);
  resultsEl.replaceChildren(section);
}

function renderChoices(locations) {
  const section = el("div", "choices");
  section.append(el("h2", "", "Several places match. Which one?"));

  const list = el("ul", "choice-list");
  for (const location of locations) {
    const label = locationLabel(location);
    const choice = el("button", "choice", label);
    choice.type = "button";
    choice.addEventListener("click", () => search(`${location.lat}, ${location.lng}`, label));
    const item = el("li");
    item.append(choice);
    list.append(item);
  }

  section.append(list);
  resultsEl.replaceChildren(section);
}

async function search(query, displayName) {
  resultsEl.replaceChildren();
  setStatus("Loading forecast...");
  button.disabled = true;

  try {
    const res = await fetch(`/api/weather?q=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (!res.ok) {
      setStatus(data.error?.message ?? "Something went wrong. Please try again.", true);
      return;
    }

    setStatus("");
    if (data.kind === "choices") {
      renderChoices(data.locations);
    } else {
      renderForecast(data, displayName);
    }
  } catch {
    setStatus("Could not reach the server. Check your connection and try again.", true);
  } finally {
    button.disabled = false;
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = input.value.trim();
  if (query) search(query);
});