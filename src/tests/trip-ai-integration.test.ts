import { Types } from 'mongoose';
import { TripModel } from '../database/models/trip.model';
import { UserModel } from '../database/models/user.model';
import * as tripService from '../services/trip.service';
import { generateTripPlan } from '../modules/ai/ai.service';
import { allocateUserBudget, getBudget } from '../services/budget.service';

jest.mock('../database/models/trip.model', () => ({
  TripModel: {
    create: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

jest.mock('../database/models/user.model', () => ({
  UserModel: {
    findOne: jest.fn(),
  },
}));

jest.mock('../modules/ai/ai.service', () => ({
  generateTripPlan: jest.fn(),
}));

jest.mock('../services/budget.service', () => ({
  normalizeLedger: jest.fn(() => ({
    currency: 'USD',
    totalBudget: 5000,
    allocatedBudget: 0,
    spentBudget: 0,
    remainingBudget: 5000,
    entries: [],
  })),
  getBudget: jest.fn(),
  allocateUserBudget: jest.fn(),
  releaseUserBudget: jest.fn(),
}));

const mockedTripModel = TripModel as jest.Mocked<typeof TripModel>;
const mockedUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockedGenerateTripPlan = generateTripPlan as jest.MockedFunction<
  typeof generateTripPlan
>;
const mockedGetBudget = getBudget as jest.MockedFunction<typeof getBudget>;
const mockedAllocateUserBudget = allocateUserBudget as jest.MockedFunction<
  typeof allocateUserBudget
>;

const ownerId = new Types.ObjectId().toString();
const tripId = new Types.ObjectId().toString();

describe('trip AI integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('generates itinerary, persists generated fields, and allocates budget', async () => {
    mockedUserModel.findOne.mockResolvedValueOnce({
      preferences: {
        preferredCurrency: 'USD',
        travelStyle: 'relaxed',
        activityPreferences: ['museums'],
        dietaryPreferences: [],
        avoidActivities: [],
      },
      budgetLedger: {},
    } as never);
    mockedGetBudget.mockResolvedValueOnce({
      currency: 'USD',
      totalBudget: 5000,
      allocatedBudget: 0,
      spentBudget: 0,
      remainingBudget: 5000,
      entries: [],
    });
    mockedGenerateTripPlan.mockResolvedValueOnce({
      itinerary: [
        {
          dayNumber: 1,
          title: 'Arrival',
          summary: 'Arrive',
          dayStatus: 'draft',
          activities: [],
          weatherSnapshot: {
            weatherType: '',
            advisoryMessage: '',
            isOutdoorFriendly: true,
            source: 'ai_estimate',
          },
        },
      ],
      estimatedCost: {
        flights: 100,
        accommodation: 100,
        food: 50,
        activities: 25,
        localTransport: 10,
        contingency: 15,
        total: 300,
      },
      hotels: [
        {
          name: 'AI Hotel',
          tier: 'standard',
          address: '',
          nightlyRateEstimate: 100,
          currency: 'USD',
          rating: 4,
          reviewCount: 10,
          bookingOptions: [],
        },
      ],
      metadata: {
        rawResponse: '{}',
        model: 'primary',
        latencyMs: 10,
        tokenUsage: {
          promptTokens: 1,
          completionTokens: 1,
          totalTokens: 2,
        },
        fallbackTriggered: false,
      },
    });
    mockedTripModel.create.mockResolvedValueOnce({
      _id: { toString: () => tripId },
      owner: { toString: () => ownerId },
      title: 'Paris trip',
      destinationCity: 'Paris',
      destinationCountry: 'France',
      latitude: undefined,
      longitude: undefined,
      startDate: undefined,
      endDate: undefined,
      totalDays: 1,
      budgetTier: 'standard',
      allocatedBudgetAmount: 300,
      estimatedCost: {
        total: 300,
      },
      tripStatus: 'draft',
      itinerary: [{ dayNumber: 1 }],
      hotelRecommendations: [{ name: 'AI Hotel' }],
      decisionCheckpoints: [],
    } as never);
    mockedTripModel.findOne.mockResolvedValue({
      _id: { toString: () => tripId },
      owner: { toString: () => ownerId },
      title: 'Paris trip',
      destinationCity: 'Paris',
      destinationCountry: 'France',
      startDate: undefined,
      endDate: undefined,
      hotelRecommendations: [
        {
          _id: { toString: () => 'hotel-id' },
          name: 'AI Hotel',
          toObject: () => ({ _id: 'hotel-id', name: 'AI Hotel' }),
        },
      ],
      itinerary: [
        {
          dayNumber: 1,
          toObject: () => ({ dayNumber: 1 }),
          activities: [
            {
              _id: { toString: () => 'activity-id' },
              title: 'Louvre Museum',
              toObject: () => ({
                _id: 'activity-id',
                title: 'Louvre Museum',
              }),
            },
          ],
        },
      ],
    } as never);
    mockedTripModel.findOneAndUpdate.mockResolvedValue({
      _id: { toString: () => tripId },
      owner: { toString: () => ownerId },
      title: 'Paris trip',
      destinationCity: 'Paris',
      destinationCountry: 'France',
      latitude: undefined,
      longitude: undefined,
      startDate: undefined,
      endDate: undefined,
      totalDays: 1,
      budgetTier: 'standard',
      allocatedBudgetAmount: 300,
      estimatedCost: {
        total: 300,
      },
      tripStatus: 'draft',
      itinerary: [{ dayNumber: 1, activities: [{ title: 'Louvre Museum' }] }],
      hotelRecommendations: [{ name: 'AI Hotel' }],
      decisionCheckpoints: [],
    } as never);
    mockedAllocateUserBudget.mockResolvedValueOnce({
      currency: 'USD',
      totalBudget: 5000,
      allocatedBudget: 300,
      spentBudget: 0,
      remainingBudget: 4700,
      entries: [],
    });

    const trip = await tripService.createTrip(ownerId, {
      destinationCity: 'Paris',
      destinationCountry: 'France',
      totalDays: 1,
      budgetTier: 'standard',
      allocatedBudgetAmount: 0,
      estimatedCost: {
        flights: 0,
        accommodation: 0,
        food: 0,
        activities: 0,
        localTransport: 0,
        contingency: 0,
        total: 0,
      },
      tripStatus: 'draft',
      itinerary: [],
      hotelRecommendations: [],
      decisionCheckpoints: [],
      generateWithAi: true,
    });

    expect(mockedGenerateTripPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: ownerId,
        destinationCity: 'Paris',
        totalDays: 1,
      }),
    );
    expect(mockedTripModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        itinerary: expect.any(Array),
        estimatedCost: expect.objectContaining({ total: 300 }),
        hotelRecommendations: expect.any(Array),
        allocatedBudgetAmount: 300,
      }),
    );
    expect(mockedAllocateUserBudget).toHaveBeenCalledWith(ownerId, {
      amount: 300,
      description: 'Trip allocation: Paris trip',
    });
    expect(trip.allocatedBudgetAmount).toBe(300);
  });
});
