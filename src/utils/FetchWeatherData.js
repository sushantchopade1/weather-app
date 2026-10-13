import axios from "axios";
import axiosRetry from "axios-retry";
import { API, WEATHER_DATA } from "../constants";
import isValid from "./ValidityChecker";

// Exponential back-off retry delay between requests
axiosRetry(axios, { retryDelay: axiosRetry.exponentialDelay, retries: 1 });

const weatherCodeMap = {
  0: { code: 1000, text: "Clear" },
  1: { code: 1003, text: "Mostly cloudy" },
  2: { code: 1003, text: "Partly cloudy" },
  3: { code: 1006, text: "Cloudy" },
  45: { code: 1135, text: "Fog" },
  48: { code: 1135, text: "Fog" },
  51: { code: 1183, text: "Light drizzle" },
  53: { code: 1183, text: "Drizzle" },
  55: { code: 1189, text: "Heavy drizzle" },
  56: { code: 1201, text: "Freezing drizzle" },
  57: { code: 1201, text: "Freezing drizzle" },
  61: { code: 1150, text: "Light rain" },
  63: { code: 1189, text: "Rain" },
  65: { code: 1195, text: "Heavy rain" },
  66: { code: 1201, text: "Freezing rain" },
  67: { code: 1201, text: "Freezing rain" },
  71: { code: 1210, text: "Light snow" },
  73: { code: 1210, text: "Snow" },
  75: { code: 1216, text: "Heavy snow" },
  77: { code: 1237, text: "Snow grains" },
  80: { code: 1180, text: "Rain showers" },
  81: { code: 1192, text: "Heavy rain showers" },
  82: { code: 1195, text: "Violent rain showers" },
  85: { code: 1210, text: "Snow showers" },
  86: { code: 1216, text: "Heavy snow showers" },
  95: { code: 1273, text: "Thunderstorm" },
  96: { code: 1273, text: "Thunderstorm" },
  99: { code: 1276, text: "Thunderstorm" },
};

const getMappedWeather = (code) => {
  return weatherCodeMap[code] || { code: 1003, text: "Cloudy" };
};

const getDayStatus = (timeString, sunrise, sunset) => {
  const time = new Date(timeString);
  const sunriseTime = new Date(sunrise);
  const sunsetTime = new Date(sunset);

  return time >= sunriseTime && time <= sunsetTime ? 1 : 0;
};

const computedWeatherData = (weatherData) => {
  const timezone = weatherData.location?.tz_id || weatherData.timezone;

  let weatherCurrent = {},
    weatherForecast = {},
    alerts = {};

  if (isValid(weatherData)) {
    const current = weatherData.current || weatherData.current_data;
    const forecast = weatherData.forecast || { forecastday: [] };
    const location = weatherData.location || {
      name: "Mumbai",
      country: "India",
      tz_id: weatherData.timezone,
    };

    const todaysForecast = forecast.forecastday?.[0] || {};
    const currentCondition = getMappedWeather(current.condition?.code || 0);
    const currentTime = current.last_updated || current.time;
    const localDate = new Date(currentTime);
    let sunrise = todaysForecast.astro?.sunrise || "06:00 AM";
    let sunset = todaysForecast.astro?.sunset || "06:00 PM";

    if (weatherData.timezone && weatherData.daily?.sunrise?.[0]) {
      sunrise = weatherData.daily.sunrise[0];
      sunset = weatherData.daily.sunset[0];
    }

    const isDay = getDayStatus(
      localDate,
      sunrise,
      sunset
    );

    weatherCurrent = {
      ...current,
      ...location,
      ...todaysForecast.astro,
      condition: {
        code: currentCondition.code,
        text: currentCondition.text,
      },
      temp_c: current.temp_c ?? current.temperature_2m,
      temp_f: current.temp_f ?? (current.temperature_2m * 9) / 5 + 32,
      feelslike_c: current.feelslike_c ?? current.apparent_temperature,
      feelslike_f:
        current.feelslike_f ?? (current.apparent_temperature * 9) / 5 + 32,
      humidity: current.humidity ?? current.relative_humidity_2m,
      wind_kph: current.wind_kph ?? current.wind_speed_10m,
      wind_mph: current.wind_mph ?? current.wind_speed_10m * 0.621371,
      pressure_mb: current.pressure_mb ?? current.pressure_msl,
      pressure_in: current.pressure_in ?? current.pressure_msl / 33.863886,
      chance_of_rain:
        todaysForecast.day?.daily_chance_of_rain ??
        weatherData.daily?.precipitation_probability_max?.[0] ??
        0,
      tz_id: timezone,
      localtime_epoch: current.localtime_epoch ?? Math.floor(Date.now() / 1000),
      localtime: current.localtime ?? current.time,
      is_day: isDay,
    };

    const days = (forecast.forecastday || []).map((day) => {
      const condition = getMappedWeather(day.day?.condition?.code || 0);
      const sunriseTime = day.astro?.sunrise || "06:00 AM";
      const sunsetTime = day.astro?.sunset || "06:00 PM";
      return {
        ...day.day,
        ...location,
        date: day.date,
        condition: {
          code: condition.code,
          text: condition.text,
        },
        maxtemp_c: day.day?.maxtemp_c ?? day.temperature_2m_max,
        maxtemp_f: day.day?.maxtemp_f ?? day.temperature_2m_max * 1.8 + 32,
        mintemp_c: day.day?.mintemp_c ?? day.temperature_2m_min,
        mintemp_f: day.day?.mintemp_f ?? day.temperature_2m_min * 1.8 + 32,
        is_day: getDayStatus(
          `${day.date}T12:00:00`,
          sunriseTime,
          sunsetTime
        ),
        sunrise: day.astro?.sunrise || sunriseTime,
        sunset: day.astro?.sunset || sunsetTime,
      };
    });

    const timeframes = (forecast.forecastday || []).flatMap((forecastDay) => {
      return (forecastDay.hour || []).map((hour) => {
        const condition = getMappedWeather(hour.condition?.code || 0);
        return {
          ...hour,
          time: hour.time,
          time_epoch: hour.time_epoch || Math.floor(new Date(hour.time).getTime() / 1000),
          temp_c: hour.temp_c ?? hour.temperature_2m,
          temp_f: hour.temp_f ?? hour.temperature_2m * 1.8 + 32,
          condition: {
            code: condition.code,
            text: condition.text,
          },
          is_day: hour.is_day ?? 1,
          wind_kph: hour.wind_kph ?? hour.wind_speed_10m,
          wind_mph: hour.wind_mph ?? hour.wind_speed_10m * 0.621371,
          wind_degree: hour.wind_degree ?? 180,
        };
      });
    });

    weatherForecast = { days, timeframes, timezone };
  }

  return {
    weatherCurrent,
    weatherForecast,
    alerts,
  };
};

const FetchWeatherData = async (q, days, sample = true) => {
  const shouldUseSampleData =
    sample || !isValid(q);

  let weatherData = null;
  let error = null;

  try {
    if (shouldUseSampleData) {
      weatherData = WEATHER_DATA;
    } else {
      const params = {
        latitude: 19.076,
        longitude: 72.8777,
        current:
          "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,pressure_msl",
        hourly:
          "temperature_2m,weather_code,wind_speed_10m",
        daily:
          "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset",
        timezone: "auto",
        forecast_days: days || 3,
      };

      const response = await axios.get(API.URL + "/forecast", {
        params,
      });

      weatherData = {
        location: {
          name: "Mumbai",
          country: "India",
          tz_id: response.data.timezone,
        },
        current: {
          temp_c: response.data.current.temperature_2m,
          temp_f: (response.data.current.temperature_2m * 9) / 5 + 32,
          feelslike_c: response.data.current.apparent_temperature,
          feelslike_f:
            (response.data.current.apparent_temperature * 9) / 5 + 32,
          humidity: response.data.current.relative_humidity_2m,
          wind_kph: response.data.current.wind_speed_10m,
          wind_mph: response.data.current.wind_speed_10m * 0.621371,
          pressure_mb: response.data.current.pressure_msl,
          pressure_in: response.data.current.pressure_msl / 33.863886,
          condition: {
            code: getMappedWeather(response.data.current.weather_code).code,
          },
          localtime_epoch: Math.floor(
            new Date(response.data.current.time).getTime() / 1000
          ),
          localtime: response.data.current.time,
          last_updated: response.data.current.time,
          time: response.data.current.time,
        },
        timezone: response.data.timezone,
        daily: response.data.daily,
        forecast: {
          forecastday: response.data.daily.time.map((day, index) => ({
            date: day,
            day: {
              maxtemp_c: response.data.daily.temperature_2m_max[index],
              mintemp_c: response.data.daily.temperature_2m_min[index],
              daily_chance_of_rain:
                response.data.daily.precipitation_probability_max?.[index] ?? 0,
              condition: {
                code: getMappedWeather(response.data.daily.weather_code[index]).code,
              },
            },
            astro: {
              sunrise: response.data.daily.sunrise[index],
              sunset: response.data.daily.sunset[index],
            },
            hour: response.data.hourly.time
              .filter((time) => time.startsWith(day))
              .map((time, hourIndex) => ({
                time,
                time_epoch: Math.floor(new Date(time).getTime() / 1000),
                temp_c: response.data.hourly.temperature_2m[response.data.hourly.time.indexOf(time)],
                temp_f:
                  (response.data.hourly.temperature_2m[response.data.hourly.time.indexOf(time)] * 9) / 5 + 32,
                condition: {
                  code: getMappedWeather(response.data.hourly.weather_code[response.data.hourly.time.indexOf(time)]).code,
                },
                is_day: 1,
                wind_kph: response.data.hourly.wind_speed_10m[response.data.hourly.time.indexOf(time)],
                wind_mph:
                  response.data.hourly.wind_speed_10m[response.data.hourly.time.indexOf(time)] * 0.621371,
                wind_degree: 180,
              })),
          })),
        },
      };
    }
  } catch (err) {
    console.warn("Falling back to the built-in sample weather data.", err);
    weatherData = WEATHER_DATA;
    error = null;
  }

  return {
    ...computedWeatherData(weatherData),
    error,
  };
};

export default FetchWeatherData;
