import {
  detectBudgetConflicts,
  detectFatigueConflicts,
  detectScheduleConflicts,
  detectWeatherConflicts,
} from '../services/conflict-detector.service';
import { optimizeTrip } from '../services/optimization-engine.service';
import { generateAlternatives } from '../services/recommendation-engine.service';
import { scoreItinerary } from '../services/itinerary-scoring.service';

const trip = {
  destinationCity: 'Paris',
  allocatedBudgetAmount: 1000,
  estimatedCost: { total: 1200 },
  itinerary: [
    {
      dayNumber: 1,
      weatherSnapshot: {
        isOutdoorFriendly: false,
        advisoryMessage: 'Storm risk',
      },
      activities: [
        { title: 'A', startTime: '10:00', endTime: '12:00' },
        { title: 'B', startTime: '11:00', endTime: '13:00' },
        { title: 'C' },
        { title: 'D' },
        { title: 'E' },
      ],
    },
  ],
} as never;

describe('assistant engines', () => {
  it('detects schedule, weather, budget, and fatigue conflicts', () => {
    expect(detectScheduleConflicts(trip)).toHaveLength(1);
    expect(detectWeatherConflicts(trip)).toHaveLength(1);
    expect(detectBudgetConflicts(trip)).toHaveLength(1);
    expect(detectFatigueConflicts(trip)).toHaveLength(1);
  });

  it('generates optimization suggestions', () => {
    expect(optimizeTrip(trip, 'reduce cost')[0]).toContain('free attractions');
    expect(optimizeTrip(trip, 'fewer transitions')[0]).toContain('neighborhood');
  });

  it('generates alternatives', () => {
    expect(generateAlternatives(trip, 1, 'bad weather')[0]).toContain('indoor');
    expect(generateAlternatives(trip, 1, 'budget concern')[0]).toContain('free');
  });

  it('scores itinerary with weak areas', () => {
    const score = scoreItinerary(trip);

    expect(score.score).toBeGreaterThanOrEqual(0);
    expect(score.score).toBeLessThanOrEqual(100);
    expect(score.weakAreas.length).toBeGreaterThan(0);
  });
});
