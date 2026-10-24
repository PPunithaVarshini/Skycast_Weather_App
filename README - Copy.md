# SkyCast — Intermediate Weather App

Responsive weather app built with HTML, CSS, and vanilla JavaScript.

## Features
- Search cities worldwide using geocoding
- Current temperature, feels-like temperature, humidity, wind speed and daily range
- Six-hour preview and five-day forecast
- Celsius/Fahrenheit conversion
- Optional browser geolocation
- Recent searches stored with localStorage
- Loading, error and empty states
- Responsive mobile layout

## Run it
1. Extract the ZIP and open the folder in VS Code.
2. Install the **Live Server** extension (recommended).
3. Right-click `index.html` → **Open with Live Server**.
4. Search for `Madurai` or `London`.

The app uses Open-Meteo APIs, which do not require an API key for this learning project:
- https://geocoding-api.open-meteo.com/v1/search
- https://api.open-meteo.com/v1/forecast

Credit: https://open-meteo.com/

## Explain these concepts
HTML forms, CSS Flexbox/Grid and media queries, JavaScript events and DOM manipulation, arrays and objects, fetch, async/await, JSON, error handling, localStorage, geolocation permissions, public APIs.

## Test before adding to your resume
- Search Madurai and London.
- Search a nonsense city and confirm the error message.
- Toggle Celsius/Fahrenheit.
- Refresh and check recent searches persist.
- Test in a narrow browser window.
- Try location only if you are comfortable granting browser permission.

This is a learning project, not an emergency warning service. Forecast data may differ from local observations.
