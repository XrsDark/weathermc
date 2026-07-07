// WeatherMC - Full Weather App JS

// Weather code to icon mapping
const weatherIcons = {
    0: 'fa-sun', 1: 'fa-sun', 2: 'fa-cloud-sun', 3: 'fa-cloud',
    45: 'fa-smog', 48: 'fa-smog', 51: 'fa-cloud-drizzle', 53: 'fa-cloud-drizzle',
    55: 'fa-cloud-drizzle', 61: 'fa-cloud-rain', 63: 'fa-cloud-rain', 65: 'fa-cloud-showers-heavy',
    71: 'fa-snowflake', 73: 'fa-snowflake', 75: 'fa-snowflake', 80: 'fa-cloud-rain',
    81: 'fa-cloud-rain', 82: 'fa-cloud-showers-heavy', 95: 'fa-bolt', 96: 'fa-bolt', 99: 'fa-bolt'
};

const weatherDescriptions = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Foggy', 48: 'Depositing rime fog', 51: 'Light drizzle', 53: 'Moderate drizzle',
    55: 'Dense drizzle', 61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
    71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow', 80: 'Slight rain showers',
    81: 'Moderate rain showers', 82: 'Violent rain showers', 95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with heavy hail'
};

// Update time every second
function updateTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    document.getElementById('currentTime').textContent = timeStr;
    document.getElementById('currentDate').textContent = dateStr;
}

setInterval(updateTime, 1000);
updateTime();

// Get weather data
async function getWeather(lat, lon) {
    try {
        // Get city name
        const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
        const geoData = await geoRes.json();
        document.getElementById('cityName').textContent = geoData.city || geoData.locality || 'Unknown';

        // Get weather + air quality
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,visibility&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=auto`;
        
        const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,us_aqi&timezone=auto`;

        const [weatherRes, aqRes] = await Promise.all([
            fetch(weatherUrl),
            fetch(aqUrl)
        ]);

        const weatherData = await weatherRes.json();
        const aqData = await aqRes.json();

        updateCurrentWeather(weatherData.current, weatherData.daily);
        updateHourlyForecast(weatherData.hourly);
        updateDailyForecast(weatherData.daily);
        updateWeatherDetails(weatherData.current, weatherData.daily, aqData.current);

    } catch (error) {
        console.error('Weather fetch error:', error);
        document.getElementById('cityName').textContent = 'Error loading weather';
    }
}

function updateCurrentWeather(current, daily) {
    document.getElementById('currentTemp').textContent = Math.round(current.temperature_2m) + '°';
    document.getElementById('feelsLike').textContent = Math.round(current.apparent_temperature) + '°';
    document.getElementById('weatherDesc').textContent = weatherDescriptions[current.weather_code] || 'Unknown';
    document.getElementById('weatherIcon').className = `fas ${weatherIcons[current.weather_code] || 'fa-cloud'} weather-icon`;
}

function updateHourlyForecast(hourly) {
    const container = document.getElementById('hourlyForecast');
    container.innerHTML = '';
    
    for (let i = 0; i < 24; i++) {
        const time = new Date(hourly.time[i]);
        const hour = time.getHours();
        const temp = Math.round(hourly.temperature_2m[i]);
        const icon = weatherIcons[hourly.weather_code[i]] || 'fa-cloud';
        
        const item = document.createElement('div');
        item.className = 'hourly-item';
        item.innerHTML = `
            <div class="hour">${hour}:00</div>
            <i class="fas ${icon}"></i>
            <div class="hour-temp">${temp}°</div>
        `;
        container.appendChild(item);
    }
}

function updateDailyForecast(daily) {
    const container = document.getElementById('dailyForecast');
    container.innerHTML = '';
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(daily.time[i]);
        const dayName = i === 0? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
        const maxTemp = Math.round(daily.temperature_2m_max[i]);
        const minTemp = Math.round(daily.temperature_2m_min[i]);
        const icon = weatherIcons[daily.weather_code[i]] || 'fa-cloud';
        
        const item = document.createElement('div');
        item.className = 'daily-item';
        item.innerHTML = `
            <div class="daily-day">${dayName}</div>
            <i class="fas ${icon} daily-icon"></i>
            <div class="daily-temps">
                <span class="daily-high">${maxTemp}°</span>
                <span class="daily-low">${minTemp}°</span>
            </div>
        `;
        container.appendChild(item);
    }
}

function updateWeatherDetails(current, daily, aq) {
    document.getElementById('humidity').textContent = current.relative_humidity_2m + '%';
    document.getElementById('windSpeed').textContent = Math.round(current.wind_speed_10m) + ' km/h';
    document.getElementById('pressure').textContent = Math.round(current.pressure_msl) + ' mb';
    document.getElementById('visibility').textContent = Math.round(current.visibility / 1000) + ' km';
    document.getElementById('dewPoint').textContent = Math.round(current.temperature_2m - ((100 - current.relative_humidity_2m) / 5)) + '°';
    
    // UV Index with level
    const uv = Math.round(daily.uv_index_max[0]);
    let uvLevel = 'Low';
    if (uv >= 3 && uv < 6) uvLevel = 'Moderate';
    else if (uv >= 6 && uv < 8) uvLevel = 'High';
    else if (uv >= 8 && uv < 11) uvLevel = 'Very High';
    else if (uv >= 11) uvLevel = 'Extreme';
    document.getElementById('uvIndex').textContent = `${uv} ${uvLevel}`;
    
    // Sunrise/Sunset
    const sunrise = new Date(daily.sunrise[0]);
    const sunset = new Date(daily.sunset[0]);
    document.getElementById('sunrise').textContent = sunrise.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('sunset').textContent = sunset.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    // AQI
    if (aq && aq.us_aqi) {
        let aqiLevel = 'Good';
        if (aq.us_aqi > 50 && aq.us_aqi <= 100) aqiLevel = 'Moderate';
        else if (aq.us_aqi > 100 && aq.us_aqi <= 150) aqiLevel = 'Unhealthy';
        else if (aq.us_aqi > 150) aqiLevel = 'Very Unhealthy';
        document.getElementById('aqi').textContent = `${aq.us_aqi} ${aqiLevel}`;
    }
    
    // Precipitation
    document.getElementById('precipitation').textContent = daily.precipitation_probability_max[0] + '%';
}

// Get user location and load weather
function initWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                getWeather(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
                console.error('Geolocation error:', error);
                document.getElementById('cityName').textContent = 'Location denied';
                // Default to Delhi
                getWeather(28.6139, 77.2090);
            }
        );
    } else {
        document.getElementById('cityName').textContent = 'Geolocation not supported';
    }
}

// Start app
initWeather();
