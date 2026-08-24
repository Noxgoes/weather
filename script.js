const DEFAULT_CITY = "Chennai";
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

const weatherCodes = {
  0: ["Clear sky", "☀"],
  1: ["Mainly clear", "🌤"],
  2: ["Partly cloudy", "⛅"],
  3: ["Overcast", "☁"],
  45: ["Fog", "🌫"],
  48: ["Depositing rime fog", "🌫"],
  51: ["Light drizzle", "🌦"],
  53: ["Moderate drizzle", "🌦"],
  55: ["Dense drizzle", "🌧"],
  61: ["Slight rain", "🌧"],
  63: ["Moderate rain", "🌧"],
  65: ["Heavy rain", "🌧"],
  71: ["Slight snow", "🌨"],
  73: ["Moderate snow", "🌨"],
  75: ["Heavy snow", "🌨"],
  80: ["Slight showers", "🌦"],
  81: ["Moderate showers", "🌧"],
  82: ["Violent showers", "⛈"],
  95: ["Thunderstorm", "⛈"],
  96: ["Thunderstorm with hail", "⛈"],
  99: ["Thunderstorm with heavy hail", "⛈"],
};

const form = document.querySelector("#weather-form");
const cityInput = document.querySelector("#city-input");
const statusMessage = document.querySelector("#status-message");
const locationName = document.querySelector("#location-name");
const locationMeta = document.querySelector("#location-meta");
const weatherIcon = document.querySelector("#weather-icon");
const temperature = document.querySelector("#temperature");
const conditionText = document.querySelector("#condition-text");
const metricTemperature = document.querySelector("#metric-temperature");
const metricHumidity = document.querySelector("#metric-humidity");
const metricWind = document.querySelector("#metric-wind");
const metricPressure = document.querySelector("#metric-pressure");
const feelsSummary = document.querySelector("#feels-summary");
const windDirection = document.querySelector("#wind-direction");
const updatedTime = document.querySelector("#updated-time");
const jsonList = document.querySelector("#json-list");
const forecastList = document.querySelector("#forecast-list");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();
  if (!city) return;
  await loadWeather(city);
});

loadWeather(DEFAULT_CITY);

async function loadWeather(city) {
  setLoading(city);

  try {
    const place = await fetchCity(city);
    const weather = await fetchWeather(place);
    renderWeather(place, weather);
  } catch (error) {
    renderError(error);
  }
}

async function fetchCity(city) {
  const url = new URL(GEOCODING_URL);
  url.search = new URLSearchParams({
    name: city,
    count: "1",
    language: "en",
    format: "json",
  });

  const data = await fetchJson(url, "Unable to search for that city.");
  const [place] = data.results || [];

  if (!place) {
    throw new Error(`No matching city found for "${city}". Try a larger nearby city.`);
  }

  return place;
}

async function fetchWeather(place) {
  const url = new URL(FORECAST_URL);
  url.search = new URLSearchParams({
    latitude: place.latitude,
    longitude: place.longitude,
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "weather_code",
      "wind_speed_10m",
      "wind_direction_10m",
    ].join(","),
    hourly: [
      "temperature_2m",
      "relative_humidity_2m",
      "surface_pressure",
      "wind_speed_10m",
      "weather_code",
    ].join(","),
    forecast_days: "2",
    timezone: "auto",
  });

  return fetchJson(url, "Unable to retrieve live weather data.");
}

async function fetchJson(url, fallbackMessage) {
  let response;

  try {
    response = await fetch(url);
  } catch {
    throw new Error(`${fallbackMessage} Check your internet connection and try again.`);
  }

  if (!response.ok) {
    throw new Error(`${fallbackMessage} The API returned HTTP ${response.status}.`);
  }

  try {
    return await response.json();
  } catch {
    throw new Error(`${fallbackMessage} The API response was not valid JSON.`);
  }
}

function renderWeather(place, weather) {
  const current = weather.current;
  const units = weather.current_units;
  const condition = weatherCodes[current.weather_code] || ["Weather code unavailable", "☁"];
  const pressure = findNearestHourlyValue(weather.hourly, "surface_pressure", current.time);

  statusMessage.textContent = "Live data loaded successfully.";
  locationName.textContent = `${place.name}, ${place.country_code}`;
  locationMeta.textContent = [place.admin1, place.country].filter(Boolean).join(", ");
  weatherIcon.textContent = condition[1];
  temperature.textContent = `${Math.round(current.temperature_2m)}°`;
  conditionText.textContent = condition[0];
  metricTemperature.textContent = formatUnit(current.temperature_2m, units.temperature_2m, 1);
  metricHumidity.textContent = formatUnit(current.relative_humidity_2m, units.relative_humidity_2m, 0);
  metricWind.textContent = formatUnit(current.wind_speed_10m, units.wind_speed_10m, 1);
  metricPressure.textContent = pressure === null ? "-- hPa" : `${Math.round(pressure)} hPa`;
  feelsSummary.textContent = `Observed at ${formatDateTime(current.time)}`;
  windDirection.textContent = `${toCompass(current.wind_direction_10m)} wind`;
  updatedTime.dateTime = current.time;
  updatedTime.textContent = `Updated ${formatDateTime(current.time)}`;

  renderJsonHighlights(place, weather, pressure);
  renderForecast(weather);
}

function renderJsonHighlights(place, weather, pressure) {
  const rows = [
    ["results[0].latitude", place.latitude.toFixed(4)],
    ["results[0].longitude", place.longitude.toFixed(4)],
    ["current.temperature_2m", formatUnit(weather.current.temperature_2m, weather.current_units.temperature_2m, 1)],
    ["current.relative_humidity_2m", formatUnit(weather.current.relative_humidity_2m, weather.current_units.relative_humidity_2m, 0)],
    ["current.wind_speed_10m", formatUnit(weather.current.wind_speed_10m, weather.current_units.wind_speed_10m, 1)],
    ["hourly.surface_pressure", pressure === null ? "Unavailable" : `${Math.round(pressure)} hPa`],
    ["timezone", weather.timezone],
  ];

  jsonList.replaceChildren(...rows.map(([key, value]) => {
    const wrapper = document.createElement("div");
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = key;
    description.textContent = value;
    wrapper.append(term, description);
    return wrapper;
  }));
}

function renderForecast(weather) {
  const nowIndex = weather.hourly.time.findIndex((time) => time >= weather.current.time);
  const startIndex = Math.max(nowIndex, 0);
  const items = weather.hourly.time.slice(startIndex, startIndex + 6).map((time, offset) => {
    const index = startIndex + offset;
    const code = weather.hourly.weather_code[index];
    const condition = weatherCodes[code] || ["Unknown", "☁"];

    const article = document.createElement("article");
    article.className = "forecast-item";
    article.innerHTML = `
      <time datetime="${time}">${formatHour(time)}</time>
      <span aria-hidden="true">${condition[1]}</span>
      <strong>${Math.round(weather.hourly.temperature_2m[index])}°C</strong>
      <p>${condition[0]}</p>
    `;
    return article;
  });

  forecastList.replaceChildren(...items);
}

function setLoading(city) {
  statusMessage.textContent = `Fetching live weather for ${city}...`;
  locationName.textContent = "Loading...";
  locationMeta.textContent = "Resolving city and forecast";
  conditionText.textContent = "Calling public REST APIs with async/await.";
  weatherIcon.textContent = "...";
  [temperature, metricTemperature, metricHumidity, metricWind, metricPressure].forEach((node) => {
    node.textContent = "--";
  });
}

function renderError(error) {
  statusMessage.textContent = error.message;
  locationName.textContent = "Weather unavailable";
  locationMeta.textContent = "Request failed";
  conditionText.textContent = "Please revise the city name or try again in a moment.";
  weatherIcon.textContent = "!";
  forecastList.replaceChildren();
}

function findNearestHourlyValue(hourly, key, currentTime) {
  if (!hourly?.time?.length || !hourly[key]?.length) return null;
  const index = hourly.time.findIndex((time) => time >= currentTime);
  return hourly[key][Math.max(index, 0)] ?? null;
}

function formatUnit(value, unit, digits) {
  if (value === null || value === undefined) return `-- ${unit || ""}`.trim();
  return `${Number(value).toFixed(digits)} ${unit}`;
}

function formatDateTime(value) {
  const [datePart, timePart = ""] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour = 0, minute = 0] = timePart.split(":").map(Number);
  const localApiDate = new Date(year, month - 1, day, hour, minute);

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(localApiDate);
}

function formatHour(value) {
  const [, timePart = ""] = value.split("T");
  const [hour = 0, minute = 0] = timePart.split(":").map(Number);
  const localApiDate = new Date(2000, 0, 1, hour, minute);

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(localApiDate);
}

function toCompass(degrees) {
  if (degrees === null || degrees === undefined) return "Unknown";
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(degrees / 45) % 8];
}
