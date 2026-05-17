import type { TripDocument } from '../database/models/trip.model';

export const optimizeBudget = () => [
  'Prioritize free attractions and reduce paid activity density.',
  'Shift meals toward local casual restaurants and markets.',
];

export const optimizeComfort = () => [
  'Reduce early starts and add recovery gaps between activities.',
  'Cluster nearby stops to reduce walking and transit fatigue.',
];

export const optimizeFlow = () => [
  'Group activities by neighborhood.',
  'Avoid crossing the city more than once per day.',
];

export const optimizeTrip = (trip: TripDocument, optimizationGoal: string) => {
  if (optimizationGoal === 'reduce cost') {
    return optimizeBudget();
  }

  if (['less walking', 'family friendly'].includes(optimizationGoal)) {
    return optimizeComfort();
  }

  if (optimizationGoal === 'fewer transitions') {
    return optimizeFlow();
  }

  if (optimizationGoal === 'luxury upgrade') {
    return ['Upgrade hotel tier and add premium dining or private transfers.'];
  }

  if (optimizationGoal === 'food focused') {
    return [`Add local food experiences and restaurant anchors in ${trip.destinationCity}.`];
  }

  return ['No optimization suggestions available for this goal.'];
};
