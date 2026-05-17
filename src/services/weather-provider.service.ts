import { config } from '../config/env';
import { ApiError } from '../utils/api-error';
import { HTTP_STATUS } from '../utils/constants';
import type { NormalizedForecast } from './weather-analysis.service';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

type OpenWeatherGeoResponse = Array<{
  lat: number;
  lon: number;
}>;

type OpenWeatherForecastResponse = {
  list: Array<{
    dt: number;
    main?: {
      temp?: number;
      feels_like?: number;
      humidity?: number;
    };
    weather?: Array<{
      main?: string;
      description?: string;
    }>;
    wind?: {
      speed?: number;
    };
    pop?: number;
  }>;
};

const ensureApiKey = (): string => {
  if (!config.integrations.openWeatherApiKey) {
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'OPENWEATHER_API_KEY is required for weather intelligence',
    );
  }

  return config.integrations.openWeatherApiKey;
};

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      `OpenWeather request failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<T>;
};

export const getCoordinates = async (
  city: string,
  country?: string,
): Promise<Coordinates> => {
  const apiKey = ensureApiKey();
  const query = encodeURIComponent([city, country].filter(Boolean).join(','));
  const url = `${config.integrations.openWeatherBaseUrl}/geo/1.0/direct?q=${query}&limit=1&appid=${apiKey}`;
  const results = await fetchJson<OpenWeatherGeoResponse>(url);

  if (!results.length) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Unable to geocode destination city');
  }

  return {
    latitude: results[0].lat,
    longitude: results[0].lon,
  };
};

export const fetchForecast = async (
  coordinates: Coordinates,
): Promise<NormalizedForecast[]> => {
  const apiKey = ensureApiKey();
  const url = `${config.integrations.openWeatherBaseUrl}/data/2.5/forecast?lat=${coordinates.latitude}&lon=${coordinates.longitude}&appid=${apiKey}&units=metric`;
  const response = await fetchJson<OpenWeatherForecastResponse>(url);

  return response.list.map((item) => ({
    forecastDate: new Date(item.dt * 1000),
    temperatureCelsius: item.main?.temp,
    feelsLikeCelsius: item.main?.feels_like,
    humidity: item.main?.humidity,
    windSpeed: item.wind?.speed,
    precipitationChance: Math.round((item.pop || 0) * 100),
    weatherType: item.weather?.[0]?.main || item.weather?.[0]?.description || '',
    source: 'openweather',
  }));
};
