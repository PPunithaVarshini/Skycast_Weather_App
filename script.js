/**
 * SkyCast Weather Dashboard Application
 * Architecture Layout: Configuration -> State -> DOM -> Helpers -> API -> Render -> History -> Events
 */

// ==========================================================================
// 1. GLOBAL CONFIGURATION & DICTIONARIES
// ==========================================================================
const codes = {
  0: ['Clear sky', '☀️'],
  1: ['Mainly clear', '🌤️'],
  2: ['Partly cloudy', '⛅'],
  3: ['Overcast', '☁️'],
  45: ['Fog', '🌫️'],
  48: ['Fog', '🌫️'],
  51: ['Light drizzle', '🌦️'],
  53: ['Drizzle', '🌦️'],
  55: ['Heavy drizzle', '🌧️'],
  61: ['Light rain', '🌦️'],
  63: ['Rain', '🌧️'],
  65: ['Heavy rain', '🌧️'],
  71: ['Light snow', '🌨️'],
  73: ['Snow', '🌨️'],
  75: ['Heavy snow', '❄️'],
  80: ['Rain showers', '🌦️'],
  81: ['Rain showers', '🌧️'],
  82: ['Heavy showers', '⛈️'],
  95: ['Thunderstorm', '⛈️'],
  96: ['Thunderstorm with hail', '⛈️'],
  99: ['Thunderstorm with hail', '⛈️']
};

// ==========================================================================
// 2. APPLICATION STATE MANAGEMENT
// ==========================================================================
let fahrenheit = false;
let latest = null;
let recent = readRecent();

// ==========================================================================
// 3. DOM ELEMENT REFERENCES
// ==========================================================================
const $ = id => document.getElementById(id);
const form = $('searchForm');
const input = $('cityInput');
const status = $('status');
const content = $('content');

// ==========================================================================
// 4. UTILITY HELPER FUNCTIONS
// ==========================================================================
function info(code) {
  return codes[code] || ['Weather conditions', '🌡️'];
}

function temp(c) {
  return `${Math.round(fahrenheit ? (c * 9) / 5 + 32 : c)}°${fahrenheit ? 'F' : 'C'}`;
}

function say(message, error = false) {
  status.textContent = message;
  status.classList.toggle('error', error);
}

function placeName(p) {
  return [p.name, p.admin1, p.country]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(', ');
}

function dayName(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(new Date(y, m - 1, d));
}

function timeName(s) {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).format(new Date(s));
}

// ==========================================================================
// 5. ASYNCHRONOUS DATA / API SERVICES
// ==========================================================================
async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('Weather service error. Please try again.');
  return r.json();
}

  
async function findCity(name) {
  const url = new URL(
    'https://geocoding-api.open-meteo.com/v1/search'
  );

  url.search = new URLSearchParams({
    name: name.trim(),
    count: '8',
    language: 'en',
    format: 'json'
  }).toString();

  const data = await getJSON(url.toString());

  if (!data.results?.length) {
    throw new Error('City not found. Check the spelling and try again.');
  }

  return (
    data.results.find(
      city => city.name.toLowerCase() === name.trim().toLowerCase()
    ) || data.results[0]
  );
}



  
async function getWeather(lat, lon) {
  const url = new URL(
    'https://api.open-meteo.com/v1/forecast'
  );

  url.search = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
    hourly: 'temperature_2m,weather_code',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    forecast_days: '5',
    timezone: 'auto'
  }).toString();

  return getJSON(url.toString());
}


async function searchCity(name) {
  name = name.trim();
  if (!name) {
    say('Enter a city name.', true);
    return;
  }
  say(`Loading weather for ${name}…`);
  content.hidden = true;
  try {
    const p = await findCity(name);
    const w = await getWeather(p.latitude, p.longitude);
    latest = { p, w };
    render();
    addRecent(placeName(p));
    content.hidden = false;
    say(`Weather updated for ${placeName(p)}.`);
  } catch (e) {
    say(e.message || 'Something went wrong. Please try again.', true);
  }
}

// ==========================================================================
// 6. UI RENDERING ENGINES
// ==========================================================================
function render() {
  if (!latest) return;
  const { p, w } = latest;
  const c = w.current;
  const d = w.daily;
  const [desc, emoji] = info(c.weather_code);

  $('date').textContent = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
  $('city').textContent = placeName(p);
  $('description').textContent = desc;
  $('icon').textContent = emoji;
  $('temperature').textContent = temp(c.temperature_2m);
  $('feels').textContent = `Feels like ${temp(c.apparent_temperature)}`;
  $('humidity').textContent = `${c.relative_humidity_2m}%`;
  $('wind').textContent = `${Math.round(c.wind_speed_10m)} km/h`;
  $('range').textContent = `${temp(d.temperature_2m_min)} / ${temp(d.temperature_2m_max)}`;

  // Render Hourly Forecast Elements
  const hours = $('hourly');
  hours.replaceChildren();
  let start = Math.max(0, w.hourly.time.findIndex(t => t >= c.time));
  for (let i = start; i < Math.min(start + 6, w.hourly.time.length); i++) {
    const [text, icon] = info(w.hourly.weather_code[i]);
    const a = document.createElement('article');
    a.className = 'hour';
    a.innerHTML = `
      <span class="time">${i === start ? 'Now' : timeName(w.hourly.time[i])}</span>
      <span class="weather-icon" aria-label="${text}">${icon}</span>
      <strong>${temp(w.hourly.temperature_2m[i])}</strong>
    `;
    hours.append(a);
  }

  // Render Daily Forecast Row Elements
  const days = $('daily');
  days.replaceChildren();
  d.time.forEach((date, i) => {
    const [text, icon] = info(d.weather_code[i]);
    const row = document.createElement('div');
    row.className = 'day';

    const nameNode = document.createElement('strong');
    nameNode.textContent = i === 0 ? 'Today' : dayName(date);

    const im = document.createElement('span');
    im.className = 'day-icon';
    im.textContent = icon;
    im.setAttribute('aria-label', text);

    const descEl = document.createElement('span');
    descEl.className = 'day-desc';
    descEl.textContent = text;

    const temps = document.createElement('span');
    temps.className = 'temps';

    const hi = document.createElement('span');
    hi.textContent = temp(d.temperature_2m_max[i]);

    const lo = document.createElement('span');
    lo.className = 'low';
    lo.textContent = temp(d.temperature_2m_min[i]);

    temps.append(hi, lo);
    row.append(nameNode, im, descEl, temps);
    days.append(row);
  });
}

// ==========================================================================
// 7. PERSISTENT STORAGE MANAGEMENT (RECENT SEARCHES)
// ==========================================================================
function readRecent() {
  try {
    const a = JSON.parse(localStorage.getItem('skycast-recent') || '[]');
    return Array.isArray(a) ? a.filter(x => typeof x === 'string').slice(0, 5) : [];
  } catch {
    return [];
  }
}

function addRecent(name) {
  recent = [name, ...recent.filter(x => x.toLowerCase() !== name.toLowerCase())].slice(0, 5);
  try {
    localStorage.setItem('skycast-recent', JSON.stringify(recent));
  } catch {}
  renderRecent();
}

function renderRecent() {
  const box = $('recent');
  box.replaceChildren();
  if (!recent.length) {
    const p = document.createElement('p');
    p.className = 'muted';
    p.textContent = 'Your recent cities will appear here.';
    box.append(p);
    return;
  }
  recent.forEach(name => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = name;
    b.addEventListener('click', () => {
      input.value = name.split(',')[0];
      searchCity(input.value);
    });
    box.append(b);
  });
}

// ==========================================================================
// 8. BINDINGS & GLOBAL EVENT LISTENERS
// ==========================================================================
form.addEventListener('submit', e => {
  e.preventDefault();
  searchCity(input.value);
});

$('unitToggle').addEventListener('click', () => {
  fahrenheit = !fahrenheit;
  $('unitToggle').textContent = fahrenheit ? '°F / °C' : '°C / °F';
  render();
});

$('clearRecent').addEventListener('click', () => {
  recent = [];
  try {
    localStorage.removeItem('skycast-recent');
  } catch {}
  renderRecent();
});

$('locationButton').addEventListener('click', () => {
  if (!navigator.geolocation) {
    say('Location is unsupported. Search for a city instead.', true);
    return;
  }
  say('Requesting location permission…');
  navigator.geolocation.getCurrentPosition(
    async pos => {
      try {
        const { latitude, longitude } = pos.coords;
        const w = await getWeather(latitude, longitude);
        latest = { p: { name: 'Your location', admin1: '', country: '' }, w };
        render();
        content.hidden = false;
        say('Weather updated for your location.');
      } catch (e) {
        say(e.message, true);
      }
    },
    () => say('Location permission denied. Search for a city instead.', true),
    { timeout: 10000, maximumAge: 300000 }
  );
});

// ==========================================================================
// 9. APP INITIALIZATION ENTRYPOINT
// ==========================================================================
renderRecent();
