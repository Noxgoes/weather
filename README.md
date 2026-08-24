# WeatherPulse Dashboard

WeatherPulse is a client-side weather dashboard built with HTML, CSS, and vanilla JavaScript. It uses asynchronous JavaScript, the Fetch API, and public REST endpoints to retrieve and render live weather for any searched city.

## Features

- Fetch live city coordinates from the Open-Meteo Geocoding API
- Fetch current and hourly weather from the Open-Meteo Forecast API
- Use `async` / `await` for readable asynchronous control flow
- Handle network errors, HTTP errors, invalid JSON, and unknown city searches
- Parse nested JSON objects including `current`, `current_units`, `hourly`, and geocoding `results`
- Search weather by city name
- Display temperature, humidity, wind speed, pressure, weather condition, and short forecast
- Responsive dashboard UI with accessible status updates

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Public Open-Meteo REST APIs

## Project Structure

```text
.
├── index.html
├── styles.css
├── script.js
└── README.md
```

## How to Run

Open `index.html` directly in your browser, or serve the folder with any static web server.

No build step, package installation, backend server, or API key is required.
