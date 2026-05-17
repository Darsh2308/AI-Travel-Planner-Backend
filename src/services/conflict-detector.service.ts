import type { TripDocument } from '../database/models/trip.model';
import type { AssistantConflict } from '../modules/assistant/assistant.types';

const parseTime = (value?: string): number | null => {
  if (!value) return null;
  const [hour, minute] = value.split(':').map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
};

export const detectScheduleConflicts = (trip: TripDocument): AssistantConflict[] => {
  const conflicts: AssistantConflict[] = [];

  for (const day of trip.itinerary) {
    const activities = [...day.activities].sort(
      (a, b) => (parseTime(a.startTime) ?? 0) - (parseTime(b.startTime) ?? 0),
    );

    for (let index = 1; index < activities.length; index += 1) {
      const previousEnd = parseTime(activities[index - 1].endTime);
      const currentStart = parseTime(activities[index].startTime);

      if (previousEnd !== null && currentStart !== null && currentStart < previousEnd) {
        conflicts.push({
          type: 'schedule_overlap',
          severity: 'high',
          dayNumber: day.dayNumber,
          message: `Schedule overlap detected on day ${day.dayNumber}.`,
        });
      }
    }
  }

  return conflicts;
};

export const detectWeatherConflicts = (trip: TripDocument): AssistantConflict[] =>
  trip.itinerary
    .filter((day) => day.weatherSnapshot?.isOutdoorFriendly === false)
    .map((day) => ({
      type: 'weather_mismatch',
      severity: 'medium',
      dayNumber: day.dayNumber,
      message: day.weatherSnapshot?.advisoryMessage || 'Weather may affect this day.',
    }));

export const detectBudgetConflicts = (trip: TripDocument): AssistantConflict[] => {
  if ((trip.estimatedCost?.total || 0) <= (trip.allocatedBudgetAmount || 0)) {
    return [];
  }

  return [
    {
      type: 'budget_overflow',
      severity: 'high',
      message: 'Estimated trip cost exceeds allocated trip budget.',
    },
  ];
};

export const detectFatigueConflicts = (trip: TripDocument): AssistantConflict[] =>
  trip.itinerary
    .filter((day) => day.activities.length > 4)
    .map((day) => ({
      type: 'fatigue_overload',
      severity: 'medium',
      dayNumber: day.dayNumber,
      message: `Day ${day.dayNumber} has too many activities.`,
    }));

export const generateConflictReport = (trip: TripDocument): AssistantConflict[] => [
  ...detectScheduleConflicts(trip),
  ...detectWeatherConflicts(trip),
  ...detectBudgetConflicts(trip),
  ...detectFatigueConflicts(trip),
];
