import * as assistantService from '../modules/assistant/assistant.service';
import { verifyOwnership } from '../services/trip.service';

jest.mock('../services/trip.service', () => ({
  verifyOwnership: jest.fn(),
}));

const mockedVerifyOwnership = verifyOwnership as jest.MockedFunction<
  typeof verifyOwnership
>;

describe('assistant service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedVerifyOwnership.mockResolvedValue({
      destinationCity: 'Paris',
      allocatedBudgetAmount: 1000,
      estimatedCost: { total: 900 },
      itinerary: [],
    } as never);
  });

  it('checks conflicts with ownership enforcement', async () => {
    const result = await assistantService.checkConflicts('user-id', {
      tripId: 'trip-id',
    });

    expect(mockedVerifyOwnership).toHaveBeenCalledWith('user-id', 'trip-id');
    expect(result.hasConflicts).toBe(false);
  });

  it('returns optimization result', async () => {
    const result = await assistantService.optimize('user-id', {
      tripId: 'trip-id',
      optimizationGoal: 'reduce cost',
    });

    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.score.score).toBeGreaterThan(0);
  });
});
