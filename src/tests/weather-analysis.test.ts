import {
  detectWeatherConflict,
  generateAdvisory,
  isOutdoorFriendly,
} from '../services/weather-analysis.service';

describe('weather analysis service', () => {
  it('marks sunny weather as outdoor friendly', () => {
    const forecast = {
      forecastDate: new Date(),
      temperatureCelsius: 25,
      windSpeed: 3,
      precipitationChance: 0,
      weatherType: 'Clear',
      source: 'test',
    };

    expect(detectWeatherConflict(forecast)).toEqual([]);
    expect(isOutdoorFriendly(forecast)).toBe(true);
  });

  it('detects heavy rain', () => {
    const forecast = {
      forecastDate: new Date(),
      precipitationChance: 80,
      weatherType: 'Rain',
      source: 'test',
    };

    expect(detectWeatherConflict(forecast)).toContain('heavy_rain');
    expect(generateAdvisory(forecast)).toContain('heavy rain');
  });

  it('detects storms, heat, snow, and wind', () => {
    const storm = {
      forecastDate: new Date(),
      temperatureCelsius: 39,
      windSpeed: 16,
      precipitationChance: 20,
      weatherType: 'Thunderstorm Snow',
      source: 'test',
    };

    expect(detectWeatherConflict(storm)).toEqual(
      expect.arrayContaining([
        'thunderstorm',
        'extreme_heat',
        'snow',
        'high_winds',
      ]),
    );
    expect(isOutdoorFriendly(storm)).toBe(false);
  });
});
