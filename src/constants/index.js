export const API = {
  URL: "https://api.open-meteo.com/v1",
  FORECAST: "/forecast",
};

const buildSampleHour = (offsetHours) => {
  const hour = new Date(Date.now() + offsetHours * 60 * 60 * 1000);
  const time = hour.toISOString().slice(0, 16).replace("T", " ");

  return {
    time,
    temp_c: 22 + ((offsetHours % 6) * 2),
    temp_f: 72 + ((offsetHours % 6) * 3),
    is_day: hour.getHours() >= 6 && hour.getHours() < 18 ? 1 : 0,
    condition: { code: 1000, text: "Sunny" },
    wind_kph: 12 + (offsetHours % 4),
    wind_mph: 7 + (offsetHours % 4),
    humidity: 40 + (offsetHours % 5),
    chance_of_rain: 10 + (offsetHours % 4) * 5,
  };
};

const buildSampleForecast = () => {
  const date = new Date();
  const day1 = new Date(date);
  const day2 = new Date(date);
  const day3 = new Date(date);
  day2.setDate(day2.getDate() + 1);
  day3.setDate(day3.getDate() + 2);

  return [
    {
      date: day1.toISOString().slice(0, 10),
      day: {
        maxtemp_c: 29,
        maxtemp_f: 84,
        mintemp_c: 19,
        mintemp_f: 66,
        daily_chance_of_rain: 20,
        condition: { code: 1000, text: "Sunny" },
      },
      astro: { sunrise: "05:58 AM", sunset: "07:00 PM" },
      hour: Array.from({ length: 24 }, (_, index) => buildSampleHour(index)),
    },
    {
      date: day2.toISOString().slice(0, 10),
      day: {
        maxtemp_c: 30,
        maxtemp_f: 86,
        mintemp_c: 20,
        mintemp_f: 68,
        daily_chance_of_rain: 25,
        condition: { code: 1003, text: "Partly cloudy" },
      },
      astro: { sunrise: "05:57 AM", sunset: "07:01 PM" },
      hour: Array.from({ length: 24 }, (_, index) => buildSampleHour(index + 24)),
    },
    {
      date: day3.toISOString().slice(0, 10),
      day: {
        maxtemp_c: 28,
        maxtemp_f: 82,
        mintemp_c: 18,
        mintemp_f: 64,
        daily_chance_of_rain: 30,
        condition: { code: 1030, text: "Mist" },
      },
      astro: { sunrise: "05:56 AM", sunset: "07:02 PM" },
      hour: Array.from({ length: 24 }, (_, index) => buildSampleHour(index + 48)),
    },
  ];
};

const sampleNow = new Date();

export const WEATHER_DATA = {
  location: {
    name: "Mumbai",
    region: "Maharashtra",
    country: "India",
    tz_id: "Asia/Kolkata",
    localtime_epoch: Math.floor(sampleNow.getTime() / 1000),
    localtime: sampleNow.toISOString().slice(0, 16).replace("T", " "),
  },
  current: {
    last_updated_epoch: Math.floor(sampleNow.getTime() / 1000),
    last_updated: sampleNow.toISOString().slice(0, 16).replace("T", " "),
    temp_c: 27,
    temp_f: 81,
    is_day: sampleNow.getHours() >= 6 && sampleNow.getHours() < 18 ? 1 : 0,
    condition: { code: 1000, text: "Sunny" },
    wind_kph: 14,
    wind_mph: 9,
    wind_degree: 180,
    wind_dir: "S",
    pressure_mb: 1014,
    pressure_in: 30,
    precip_mm: 0,
    precip_in: 0,
    humidity: 43,
    cloud: 12,
    feelslike_c: 28,
    feelslike_f: 82,
    uv: 7,
    gust_kph: 17,
    gust_mph: 11,
  },
  forecast: {
    forecastday: buildSampleForecast(),
  },
};
