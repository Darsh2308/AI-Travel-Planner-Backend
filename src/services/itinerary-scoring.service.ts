import type { TripDocument } from '../database/models/trip.model';
import { generateConflictReport } from './conflict-detector.service';
import type { ItineraryScore } from '../modules/assistant/assistant.types';

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export const scoreItinerary = (trip: TripDocument): ItineraryScore => {
  const conflicts = generateConflictReport(trip);
  const weatherIssues = conflicts.filter((item) => item.type === 'weather_mismatch');
  const scheduleIssues = conflicts.filter((item) => item.type === 'schedule_overlap');
  const fatigueIssues = conflicts.filter((item) => item.type === 'fatigue_overload');
  const budgetRatio =
    (trip.estimatedCost?.total || 0) > 0 && (trip.allocatedBudgetAmount || 0) > 0
      ? (trip.allocatedBudgetAmount || 0) / (trip.estimatedCost?.total || 1)
      : 1;
  const dimensions = {
    budgetEfficiency: clamp(budgetRatio >= 1 ? 90 : budgetRatio * 70),
    weatherSuitability: clamp(100 - weatherIssues.length * 20),
    scheduleRealism: clamp(100 - scheduleIssues.length * 30),
    travelConvenience: clamp(90 - scheduleIssues.length * 15),
    activityBalance: clamp(100 - fatigueIssues.length * 25),
    preferenceAlignment: 80,
  };
  const score = clamp(
    Object.values(dimensions).reduce((sum, value) => sum + value, 0) /
      Object.values(dimensions).length,
  );

  return {
    score,
    dimensions,
    weakAreas: Object.entries(dimensions)
      .filter(([, value]) => value < 75)
      .map(([key]) => key),
  };
};
