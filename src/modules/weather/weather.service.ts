import { TripModel } from '../../database/models/trip.model';
import { ApiError } from '../../utils/api-error';
import { HTTP_STATUS } from '../../utils/constants';
import {
  detectWeatherConflict,
  generateAdvisory,
  isOutdoorFriendly,
  type NormalizedForecast,
} from '../../services/weather-analysis.service';
import {
  fetchForecast,
  getCoordinates,
} from '../../services/weather-provider.service';
import { verifyOwnership } from '../../services/trip.service';
import * as aiService from '../ai/ai.service';
import type { WeatherReviewDto } from './weather.dto';

const selectForecastForDay = (
  forecasts: NormalizedForecast[],
  dayIndex: number,
): NormalizedForecast => {
  return forecasts[Math.min(dayIndex, forecasts.length - 1)] || forecasts[0];
};

export const enrichTripWeather = async (ownerId: string, tripId: string) => {
  const trip = await verifyOwnership(ownerId, tripId);
  const coordinates =
    trip.latitude && trip.longitude
      ? { latitude: trip.latitude, longitude: trip.longitude }
      : await getCoordinates(trip.destinationCity, trip.destinationCountry);
  const forecasts = await fetchForecast(coordinates);

  if (!forecasts.length) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'No forecast data available');
  }

  const checkpoints: Array<Record<string, unknown>> = trip.decisionCheckpoints.map(
    (checkpoint) => checkpoint.toObject?.() ?? checkpoint,
  );
  const itinerary = trip.itinerary.map((day, index) => {
    const forecast = selectForecastForDay(forecasts, index);
    const conflicts = detectWeatherConflict(forecast);
    const advisoryMessage = generateAdvisory(forecast);

    if (conflicts.length) {
      checkpoints.push({
        checkpointType: 'weather_conflict',
        message: advisoryMessage,
        triggeredAt: new Date(),
        userDecision: 'pending',
        affectedDay: day.dayNumber,
      });
    }

    return {
      ...(day.toObject?.() ?? day),
      weatherSnapshot: {
        forecastDate: forecast.forecastDate,
        temperatureCelsius: forecast.temperatureCelsius,
        feelsLikeCelsius: forecast.feelsLikeCelsius,
        humidity: forecast.humidity,
        windSpeed: forecast.windSpeed,
        precipitationChance: forecast.precipitationChance,
        weatherType: forecast.weatherType,
        advisoryMessage,
        isOutdoorFriendly: isOutdoorFriendly(forecast),
        source: forecast.source,
      },
    };
  });

  const hasConflict = checkpoints.some(
    (checkpoint) =>
      checkpoint.checkpointType === 'weather_conflict' &&
      checkpoint.userDecision === 'pending',
  );

  const updatedTrip = await TripModel.findOneAndUpdate(
    { _id: tripId, owner: ownerId },
    {
      $set: {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        itinerary,
        decisionCheckpoints: checkpoints,
        ...(hasConflict ? { tripStatus: 'weather_review_pending' } : {}),
      },
    },
    { new: true, runValidators: true },
  );

  if (!updatedTrip) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Trip not found');
  }

  return updatedTrip;
};

export const reviewWeatherCheckpoint = async (
  ownerId: string,
  tripId: string,
  dto: WeatherReviewDto,
) => {
  const trip = await verifyOwnership(ownerId, tripId);
  const decisionCheckpoints: Array<Record<string, unknown>> = trip.decisionCheckpoints.map((checkpoint) => {
    const checkpointObject = (checkpoint.toObject?.() ?? checkpoint) as Record<
      string,
      unknown
    >;

    if (
      checkpoint.checkpointType === 'weather_conflict' &&
      checkpoint.affectedDay === dto.affectedDay
    ) {
      return {
        ...checkpointObject,
        userDecision: dto.userDecision,
      };
    }

    return checkpointObject;
  });
  const hasPending = decisionCheckpoints.some(
    (checkpoint) =>
      checkpoint.checkpointType === 'weather_conflict' &&
      checkpoint.userDecision === 'pending',
  );

  const updatedTrip = await TripModel.findOneAndUpdate(
    { _id: tripId, owner: ownerId },
    {
      $set: {
        decisionCheckpoints,
        tripStatus: hasPending ? 'weather_review_pending' : 'planned',
      },
    },
    { new: true, runValidators: true },
  );

  if (!updatedTrip) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Trip not found');
  }

  return updatedTrip;
};

export const regenerateWeatherImpactedDay = async (
  ownerId: string,
  tripId: string,
  affectedDay: number,
) => {
  const trip = await verifyOwnership(ownerId, tripId);
  const day = trip.itinerary.find((item) => item.dayNumber === affectedDay);

  if (!day) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Day plan not found');
  }

  const generated = await aiService.generateTripPlan(
    {
      userId: ownerId,
      destinationCity: trip.destinationCity,
      destinationCountry: trip.destinationCountry,
      totalDays: 1,
      budgetTier: trip.budgetTier,
      startDate: day.weatherSnapshot?.forecastDate || undefined,
      preferredCurrency: 'USD',
      travelStyle: 'weather-safe indoor alternatives',
      avoidActivities: ['outdoor activities during bad weather'],
    },
    tripId,
  );
  const generatedDay =
    typeof generated.itinerary[0] === 'object' && generated.itinerary[0] !== null
      ? (generated.itinerary[0] as Record<string, unknown>)
      : {};
  const replacement = {
    ...generatedDay,
    dayNumber: affectedDay,
    weatherSnapshot: day.weatherSnapshot,
  };
  const itinerary = trip.itinerary.map((item) =>
    item.dayNumber === affectedDay ? replacement : item,
  );

  const updatedTrip = await TripModel.findOneAndUpdate(
    { _id: tripId, owner: ownerId },
    { $set: { itinerary } },
    { new: true, runValidators: true },
  );

  if (!updatedTrip) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Trip not found');
  }

  return updatedTrip;
};
