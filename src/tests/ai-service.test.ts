import { AiLogModel } from '../database/models/ai-log.model';
import * as aiService from '../modules/ai/ai.service';
import {
  invokeFallbackModel,
  invokePrimaryModel,
} from '../services/groq.service';

jest.mock('../database/models/ai-log.model', () => ({
  AiLogModel: {
    create: jest.fn(),
  },
}));

jest.mock('../services/groq.service', () => ({
  invokePrimaryModel: jest.fn(),
  invokeFallbackModel: jest.fn(),
}));

const mockedAiLogModel = AiLogModel as jest.Mocked<typeof AiLogModel>;
const mockedInvokePrimaryModel = invokePrimaryModel as jest.MockedFunction<
  typeof invokePrimaryModel
>;
const mockedInvokeFallbackModel = invokeFallbackModel as jest.MockedFunction<
  typeof invokeFallbackModel
>;

const validAiJson = JSON.stringify({
  itinerary: [
    {
      dayNumber: 1,
      title: 'Arrival',
      summary: 'Arrive and explore',
      dayStatus: 'draft',
      activities: [
        {
          title: 'Walk',
          description: 'City walk',
          category: 'sightseeing',
          locationName: 'Center',
          address: '',
          estimatedCost: 0,
          startTime: '09:00',
          endTime: '10:00',
          bookingRequired: false,
          rating: 0,
          reviewCount: 0,
          notes: '',
          bookingOptions: [],
        },
      ],
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
      name: 'Test Hotel',
      tier: 'standard',
      address: '',
      nightlyRateEstimate: 100,
      currency: 'USD',
      rating: 4,
      reviewCount: 10,
      bookingOptions: [],
    },
  ],
});

const llmResponse = (content: string, model = 'primary') => ({
  content,
  model,
  latencyMs: 15,
  tokenUsage: {
    promptTokens: 10,
    completionTokens: 20,
    totalTokens: 30,
  },
});

const input = {
  userId: 'user-id',
  destinationCity: 'Paris',
  destinationCountry: 'France',
  totalDays: 1,
  budgetTier: 'standard',
  preferredCurrency: 'USD',
};

describe('AI service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAiLogModel.create.mockResolvedValue({} as never);
    mockedInvokeFallbackModel.mockResolvedValue(llmResponse(validAiJson, 'fallback'));
  });

  it('generates a structured trip plan from primary model', async () => {
    mockedInvokePrimaryModel.mockResolvedValueOnce(llmResponse(validAiJson));

    const result = await aiService.generateTripPlan(input);

    expect(result.itinerary).toHaveLength(1);
    expect(result.estimatedCost.total).toBe(300);
    expect(result.hotels).toHaveLength(1);
    expect(result.metadata.fallbackTriggered).toBe(false);
    expect(mockedAiLogModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        interactionType: 'trip_generation',
        fallbackTriggered: false,
      }),
    );
  });

  it('falls back when Groq primary times out', async () => {
    mockedInvokePrimaryModel.mockRejectedValueOnce(new Error('timeout'));

    const result = await aiService.generateTripPlan(input);

    expect(result.metadata.fallbackTriggered).toBe(true);
    expect(result.metadata.model).toBe('fallback');
  });

  it('falls back when primary returns malformed AI response', async () => {
    mockedInvokePrimaryModel.mockResolvedValueOnce(llmResponse(''));

    const result = await aiService.generateTripPlan(input);

    expect(result.metadata.fallbackTriggered).toBe(true);
    expect(result.itinerary).toHaveLength(1);
  });
});
