import { buildTripGenerationPrompt } from '../modules/ai/ai.prompts';

describe('AI prompts', () => {
  it('builds a strict JSON trip generation prompt', async () => {
    const prompt = await buildTripGenerationPrompt({
      userId: 'user-id',
      destinationCity: 'Paris',
      destinationCountry: 'France',
      totalDays: 3,
      budgetTier: 'standard',
      preferredCurrency: 'USD',
    });

    expect(prompt).toContain('Return strict JSON only');
    expect(prompt).toContain('"itinerary"');
    expect(prompt).toContain('"estimatedCost"');
    expect(prompt).toContain('"hotels"');
    expect(prompt).toContain('Paris');
  });
});
