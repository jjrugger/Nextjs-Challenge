import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { Inter } from "next/font/google";
import { fetchWeatherApi } from "openmeteo";
import { Suspense, useEffect, useState } from "react";

interface WeatherData {
  hourly: {
    time: Date[];
    temperature2m: Float32Array;
    precipitationProbability: Float32Array;
    precipitation: Float32Array;
  };
}

function nearestDate(
  dates: Date[],
  target: Date | number = Date.now()
): number {
  if (target instanceof Date) {
    target = target.getTime();
  }

  if (dates.length === 0) return -1; // Early return if the array is empty

  let nearest = Infinity;
  let winner = -1;

  dates.forEach((date, index) => {
    const distance = Math.abs(date.getTime() - target);
    if (distance < nearest) {
      nearest = distance;
      winner = index;
    }
  });

  console.log(winner);
  return winner;
}

const inter = Inter({ subsets: ["latin"] });
const getWeather = async () => {
  const params = {
    latitude: 53.79533908531724,
    longitude: -1.5470320409628342,
    current: "is_day",
    hourly: ["temperature_2m", "precipitation_probability", "precipitation"],
    forecast_days: 1,
  };
  const url = "https://api.open-meteo.com/v1/forecast";
  const responses = await fetchWeatherApi(url, params);
  // Helper function to form time ranges
  const range = (start: number, stop: number, step: number) =>
    Array.from({ length: (stop - start) / step }, (_, i) => start + i * step);

  // Process first location. Add a for-loop for multiple locations or weather models
  const response = responses[0];

  // Attributes for timezone and location
  const utcOffsetSeconds = response.utcOffsetSeconds();
  const timezone = response.timezone();
  const timezoneAbbreviation = response.timezoneAbbreviation();
  const latitude = response.latitude();
  const longitude = response.longitude();

  const hourly = response.hourly()!;

  // Note: The order of weather variables in the URL query and the indices below need to match!
  const weatherData = {
    hourly: {
      time: range(
        Number(hourly.time()),
        Number(hourly.timeEnd()),
        hourly.interval()
      ).map((t) => new Date((t + utcOffsetSeconds) * 1000)),
      temperature2m: hourly.variables(0)!.valuesArray()!,
      precipitationProbability: hourly.variables(1)!.valuesArray()!,
      precipitation: hourly.variables(2)!.valuesArray()!,
    },
  };

  for (let i = 0; i < weatherData.hourly.time.length; i++) {
    console.log(
      weatherData.hourly.time[i].toISOString(),
      weatherData.hourly.temperature2m[i],
      weatherData.hourly.precipitationProbability[i],
      weatherData.hourly.precipitation[i]
    );
  }
  return weatherData;
};

export default function Weather({
  weatherData,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  console.log(weatherData);
  const [weather, setWeather] = useState<WeatherData>();
  const [timeIndex, setTimeIndex] = useState(0);
  useEffect(() => {
    getWeather().then((newWeather) => {
      setWeather(newWeather);
      setTimeIndex(nearestDate(newWeather.hourly.time));
    });
  }, []);
  return (
    <main className={`flex min-h-screen flex-col ${inter.className}`}>
      <div className="bg-white w-screen lg:h-96 h-48"></div>
      <div className="p-12 lg:p-24 flex flex-col gap-12">
        <div>
          <h1 className="text-2xl">Leeds&apos; Current Temperature</h1>
          <h2 className="text-5xl">
            {Math.round(weather?.hourly?.temperature2m?.[timeIndex] ?? 0)}&deg;C
          </h2>
        </div>
        <h3>This is what it will look like later on Today:</h3>
        <ul className="flex gap-12 flex-wrap">
          {weather?.hourly.time.map((time, i) => {
            if (time < new Date(Date.now())) return null;
            return (
              <li
                key={time.toISOString()}
                className="flex flex-col items-center"
              >
                <p>
                  {time.toLocaleString("en-GB", {
                    timeStyle: "short",
                    formatMatcher: "basic",
                  })}{" "}
                </p>
                <p>{Math.round(weather?.hourly.temperature2m[i])}&deg;C</p>
                <p>
                  precipitation chance{" "}
                  {Math.round(weather.hourly.precipitationProbability[i])}%
                </p>
              </li>
            );
          }) ?? "Loading..."}
        </ul>
      </div>
    </main>
  );
}

export const getServerSideProps = (async () => {
  const weatherData = await getWeather();
  console.log(weatherData, "hello fromt server");
  return { props: { weatherData } };
}) satisfies GetServerSideProps<{ weatherData: WeatherData }>;
