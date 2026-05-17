import type { TripDocument } from '../database/models/trip.model';

export const recommendWeatherSafeOptions = (trip: TripDocument, affectedDay: number) => [
  `Move outdoor activities on day ${affectedDay} to indoor museums or food experiences in ${trip.destinationCity}.`,
  'Keep flexible transit buffers and avoid exposed viewpoints during severe weather.',
];

export const recommendBudgetAlternatives = () => [
  'Replace premium paid attractions with free walking routes or public viewpoints.',
  'Use local transit instead of private transfers.',
];

export const recommendPreferenceMatches = (
  trip: TripDocument,
  reason: string,
  affectedDay: number,
) => [
  `Adapt day ${affectedDay} around ${reason} while preserving the trip pace in ${trip.destinationCity}.`,
];

export const generateAlternatives = (
  trip: TripDocument,
  affectedDay: number,
  reason: string,
) => {
  if (reason === 'bad weather') {
    return recommendWeatherSafeOptions(trip, affectedDay);
  }

  if (reason === 'budget concern') {
    return recommendBudgetAlternatives();
  }

  return recommendPreferenceMatches(trip, reason, affectedDay);
};
