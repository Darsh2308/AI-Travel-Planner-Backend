import {
  buildContextualRegenerationPrompt,
  replaceDayPlan,
} from '../services/itinerary-regeneration.service';

describe('itinerary regeneration service', () => {
  it('builds contextual regeneration prompt', () => {
    const prompt = buildContextualRegenerationPrompt(
      {
        destinationCity: 'Paris',
        destinationCountry: 'France',
        budgetTier: 'standard',
        allocatedBudgetAmount: 1000,
        itinerary: [
          {
            dayNumber: 3,
            title: 'Rain day',
            summary: 'Outdoor plan',
            weatherSnapshot: { weatherType: 'Rain' },
          },
        ],
      } as never,
      3,
      'rainy day alternatives',
      'avoid outdoor activities',
    );

    expect(prompt).toContain('rainy day alternatives');
    expect(prompt).toContain('Paris');
    expect(prompt).toContain('avoid outdoor activities');
  });

  it('replaces only the target day', () => {
    const result = replaceDayPlan(
      [{ dayNumber: 1 }, { dayNumber: 2 }],
      2,
      { dayNumber: 2, title: 'New day' },
    );

    expect(result).toEqual([{ dayNumber: 1 }, { dayNumber: 2, title: 'New day' }]);
  });
});
