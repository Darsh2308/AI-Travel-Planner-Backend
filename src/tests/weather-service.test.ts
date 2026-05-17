import { Types } from 'mongoose';
import { TripModel } from '../database/models/trip.model';
import * as weatherService from '../modules/weather/weather.service';
import {
  fetchForecast,
  getCoordinates,
} from '../services/weather-provider.service';
import { verifyOwnership } from '../services/trip.service';

jest.mock('../database/models/trip.model', () => ({
  TripModel: {
    findOneAndUpdate: jest.fn(),
  },
}));

jest.mock('../services/weather-provider.service', () => ({
  getCoordinates: jest.fn(),
  fetchForecast: jest.fn(),
}));

jest.mock('../services/trip.service', () => ({
  verifyOwnership: jest.fn(),
}));

const mockedTripModel = TripModel as jest.Mocked<typeof TripModel>;
const mockedGetCoordinates = getCoordinates as jest.MockedFunction<typeof getCoordinates>;
const mockedFetchForecast = fetchForecast as jest.MockedFunction<typeof fetchForecast>;
const mockedVerifyOwnership = verifyOwnership as jest.MockedFunction<
  typeof verifyOwnership
>;

const ownerId = new Types.ObjectId().toString();
const tripId = new Types.ObjectId().toString();

describe('weather service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates weather conflict checkpoints and sets review status', async () => {
    mockedVerifyOwnership.mockResolvedValueOnce({
      latitude: undefined,
      longitude: undefined,
      destinationCity: 'Paris',
      destinationCountry: 'France',
      decisionCheckpoints: [],
      itinerary: [
        {
          dayNumber: 1,
          toObject: () => ({
            dayNumber: 1,
            title: 'Day 1',
            activities: [],
          }),
        },
      ],
    } as never);
    mockedGetCoordinates.mockResolvedValueOnce({ latitude: 1, longitude: 2 });
    mockedFetchForecast.mockResolvedValueOnce([
      {
        forecastDate: new Date(),
        precipitationChance: 90,
        weatherType: 'Rain',
        source: 'openweather',
      },
    ]);
    mockedTripModel.findOneAndUpdate.mockResolvedValueOnce({ _id: tripId } as never);

    await weatherService.enrichTripWeather(ownerId, tripId);

    expect(mockedTripModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: tripId, owner: ownerId },
      expect.objectContaining({
        $set: expect.objectContaining({
          tripStatus: 'weather_review_pending',
          decisionCheckpoints: expect.arrayContaining([
            expect.objectContaining({
              checkpointType: 'weather_conflict',
              affectedDay: 1,
              userDecision: 'pending',
            }),
          ]),
        }),
      }),
      expect.objectContaining({ new: true }),
    );
  });
});
