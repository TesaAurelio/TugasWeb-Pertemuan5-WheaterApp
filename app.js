const API_KEY = '0c324e96871be24d19284e11c59d785f';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';
const HISTORY_KEY = 'weatherApp_history';
const MAX_HISTORY = 5;

const form = document.querySelector('#searchForm');
const input = document.querySelector('#cityInput');
const loading = document.querySelector('#loading');
const errorBox = document.querySelector('#error');
const result = document.querySelector('#weatherResult');
const statRow = document.querySelector('#statRow');
const btnC = document.querySelector('#btnC');
const btnF = document.querySelector('#btnF');
const historyList = document.querySelector('#historyList');
const clearHistoryBtn = document.querySelector('#clearHistoryBtn');
const clockEl = document.querySelector('#clock');
const dateLabelEl = document.querySelector('#dateLabel');
const greetingEl = document.querySelector('#greeting');

let currentUnit = 'metric'; // 'metric' = °C, 'imperial' = °F
let lastCity = '';

const showLoading = () => {
  loading.classList.remove('hidden');
  errorBox.classList.add('hidden');
  result.classList.add('hidden');
  statRow.classList.add('hidden');
};

const hideLoading = () => loading.classList.add('hidden');

const showError = (message) => {
  errorBox.textContent = `⚠️ ${message}`;
  errorBox.classList.remove('hidden');
  result.classList.add('hidden');
};

const clearError = () => errorBox.classList.add('hidden');

const getHistory = () => {
  const saved = localStorage.getItem(HISTORY_KEY);
  return saved ? JSON.parse(saved) : [];
};

const saveHistory = (city) => {
  let history = getHistory().filter(
    (item) => item.toLowerCase() !== city.toLowerCase()
  );
  history.unshift(city);
  history = history.slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  renderHistory();
};

const renderHistory = () => {
  const history = getHistory();
  historyList.innerHTML = '';

  if (history.length === 0) {
    historyList.innerHTML = '<li class="history-empty">Belum ada riwayat pencarian.</li>';
    return;
  }

  const items = history.map((city) => {
    const li = document.createElement('li');
    li.textContent = city;
    li.addEventListener('click', () => {
      input.value = city;
      getWeather(city);
    });
    return li;
  });

  items.forEach((li) => historyList.appendChild(li));
};

clearHistoryBtn.addEventListener('click', () => {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
});

const updateClock = () => {
  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  dateLabelEl.textContent = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const hour = now.getHours();
  let greeting = 'Selamat malam!';
  if (hour >= 5 && hour < 11) greeting = 'Selamat pagi!';
  else if (hour >= 11 && hour < 15) greeting = 'Selamat siang!';
  else if (hour >= 15 && hour < 18) greeting = 'Selamat sore!';
  greetingEl.textContent = greeting;
};

updateClock();
setInterval(updateClock, 60 * 1000); // update tiap 1 menit

const setUnit = (unit) => {
  currentUnit = unit;
  btnC.classList.toggle('active', unit === 'metric');
  btnF.classList.toggle('active', unit === 'imperial');

  if (lastCity) getWeather(lastCity);
};

btnC.addEventListener('click', () => setUnit('metric'));
btnF.addEventListener('click', () => setUnit('imperial'));

async function getWeather(city) {
  if (!city || city.trim() === '') {
    showError('Nama kota tidak boleh kosong!');
    return;
  }

  try {
    showLoading();
    clearError();

    const url = `${BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=${currentUnit}&lang=id`;
    const res = await fetch(url);

    if (res.status === 404) {
      throw new Error(`Kota "${city}" tidak ditemukan. Periksa kembali penulisannya.`);
    }
    if (!res.ok) {
      throw new Error(`Terjadi kesalahan server (kode: ${res.status}). Coba lagi nanti.`);
    }

    const data = await res.json();
    displayWeather(data);

    lastCity = city;
    saveHistory(data.name); 
  } catch (err) {
    if (err instanceof TypeError) {
      showError('Gagal terhubung ke server. Periksa koneksi internet Anda.');
    } else {
      showError(err.message);
    }
  } finally {
    hideLoading();
  }
}

function displayWeather(data) {
  const { name, main, weather, wind, dt } = data;
  const [info] = weather; 

  const unitSymbol = currentUnit === 'metric' ? '°C' : '°F';
  const windUnit = currentUnit === 'metric' ? 'm/s' : 'mph';

  document.querySelector('#cityName').textContent = `${name}, ${data.sys?.country ?? ''}`;
  document.querySelector('#dateTime').textContent = new Date(dt * 1000).toLocaleString('id-ID', {
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
  document.querySelector('#temperature').textContent = `${Math.round(main.temp)}${unitSymbol}`;
  document.querySelector('#description').textContent = info.description;
  document.querySelector('#weatherIcon').src = `https://openweathermap.org/img/wn/${info.icon}@2x.png`;
  document.querySelector('#humidity').textContent = `${main.humidity}%`;
  document.querySelector('#wind').textContent = `${wind.speed} ${windUnit}`;
  document.querySelector('#feelsLike').textContent = `${Math.round(main.feels_like)}${unitSymbol}`;

  result.classList.remove('hidden');
  statRow.classList.remove('hidden');
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const city = input.value.trim();
  if (city) getWeather(city);
});

renderHistory();