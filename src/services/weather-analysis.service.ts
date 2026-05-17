export type NormalizedForecast = {
  forecastDate: Date;
  temperatureCelsius?: number;
  feelsLikeCelsius?: number;
  humidity?: number;
  windSpeed?: number;
  precipitationChance?: number;
  weatherType: string;
  source: string;
};

const STORM_TYPES = ['thunderstorm', 'storm', 'tornado'];
const HEAVY_RAIN_TYPES = ['rain', 'drizzle'];
const SNOW_TYPES = ['snow', 'sleet'];

export const detectWeatherConflict = (forecast: NormalizedForecast): string[] => {
  const conflicts: string[] = [];
  const weatherType = forecast.weatherType.toLowerCase();

  if (STORM_TYPES.some((type) => weatherType.includes(type))) {
    conflicts.push('thunderstorm');
  }

  if (
    HEAVY_RAIN_TYPES.some((type) => weatherType.includes(type)) &&
    (forecast.precipitationChance ?? 0) >= 70
  ) {
    conflicts.push('heavy_rain');
  }

  if ((forecast.temperatureCelsius ?? 0) >= 38) {
    conflicts.push('extreme_heat');
  }

  if (SNOW_TYPES.some((type) => weatherType.includes(type))) {
    conflicts.push('snow');
  }

  if ((forecast.windSpeed ?? 0) >= 15) {
    conflicts.push('high_winds');
  }

  return conflicts;
};

export const isOutdoorFriendly = (forecast: NormalizedForecast): boolean => {
  return detectWeatherConflict(forecast).length === 0;
};

export const generateAdvisory = (forecast: NormalizedForecast): string => {
  const conflicts = detectWeatherConflict(forecast);

  if (!conflicts.length) {
    return 'Weather looks suitable for planned activities.';
  }

  const labels = conflicts.map((conflict) => conflict.replace('_', ' ')).join(', ');
  return `Weather risk detected: ${labels}. Consider indoor or lower-risk alternatives.`;
};
