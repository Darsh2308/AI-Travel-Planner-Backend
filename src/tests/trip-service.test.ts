import { Types } from 'mongoose';
import { TripModel } from '../database/models/trip.model';
import * as tripService from '../services/trip.service';

jest.mock('../database/models/trip.model', () => ({
  TripModel: {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
  },
}));

const mockedTripModel = TripModel as jest.Mocked<typeof TripModel>;

const ownerId = new Types.ObjectId().toString();
const foreignOwnerId = new Types.ObjectId().toString();
const tripId = new Types.ObjectId().toString();

const makeTripDocument = (overrides = {}) =>
  ({
    _id: { toString: () => tripId },
    owner: { toString: () => ownerId },
    title: 'Goa trip',
    destinationCity: 'Goa',
    destinationCountry: 'India',
    latitude: 15.49,
    longitude: 73.82,
    startDate: undefined,
    endDate: undefined,
    totalDays: 3,
    budgetTier: 'standard',
    allocatedBudgetAmount: 0,
    estimatedCost: {
      flights: 0,
      accommodation: 0,
      food: 0,
      activities: 0,
      localTransport: 0,
      contingency: 0,
      total: 500,
    },
    tripStatus: 'draft',
    itinerary: [],
    hotelRecommendations: [],
    decisionCheckpoints: [],
    ...overrides,
  }) as never;

describe('trip service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a trip', async () => {
    mockedTripModel.create.mockResolvedValueOnce(makeTripDocument());

    const trip = await tripService.createTrip(ownerId, {
      destinationCity: 'Goa',
      destinationCountry: 'India',
      totalDays: 3,
      budgetTier: 'standard',
      estimatedCost: {
        flights: 0,
        accommodation: 0,
        food: 0,
        activities: 0,
        localTransport: 0,
        contingency: 0,
        total: 500,
      },
      tripStatus: 'draft',
      itinerary: [],
      allocatedBudgetAmount: 0,
      generateWithAi: false,
      hotelRecommendations: [],
      decisionCheckpoints: [],
    });

    expect(mockedTripModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: ownerId,
        title: 'Goa trip',
        destinationCity: 'Goa',
      }),
    );
    expect(trip.destinationCity).toBe('Goa');
  });

  it('fetches trips for an owner', async () => {
    mockedTripModel.find.mockReturnValueOnce({
      sort: jest.fn().mockResolvedValueOnce([makeTripDocument()]),
    } as never);

    const trips = await tripService.listTrips(ownerId);

    expect(mockedTripModel.find).toHaveBeenCalledWith({ owner: ownerId });
    expect(trips).toHaveLength(1);
  });

  it('fetches one owned trip', async () => {
    mockedTripModel.findOne.mockResolvedValueOnce(makeTripDocument());

    const trip = await tripService.getTripById(ownerId, tripId);

    expect(mockedTripModel.findOne).toHaveBeenCalledWith({
      _id: tripId,
      owner: ownerId,
    });
    expect(trip.id).toBe(tripId);
  });

  it('updates an owned trip', async () => {
    mockedTripModel.findOneAndUpdate.mockResolvedValueOnce(
      makeTripDocument({
        title: 'Updated trip',
      }),
    );

    const trip = await tripService.updateTrip(ownerId, tripId, {
      title: 'Updated trip',
    });

    expect(mockedTripModel.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: tripId,
        owner: ownerId,
      },
      expect.any(Object),
      expect.objectContaining({ new: true }),
    );
    expect(trip.title).toBe('Updated trip');
  });

  it('deletes an owned trip', async () => {
    mockedTripModel.findOne.mockResolvedValueOnce(makeTripDocument());
    mockedTripModel.deleteOne.mockResolvedValueOnce({ deletedCount: 1 } as never);

    await tripService.deleteTrip(ownerId, tripId);

    expect(mockedTripModel.deleteOne).toHaveBeenCalledWith({
      _id: tripId,
      owner: ownerId,
    });
  });

  it('rejects access to a foreign trip', async () => {
    mockedTripModel.findOne.mockResolvedValueOnce(null);

    await expect(
      tripService.getTripById(foreignOwnerId, tripId),
    ).rejects.toThrow('Trip not found');

    expect(mockedTripModel.findOne).toHaveBeenCalledWith({
      _id: tripId,
      owner: foreignOwnerId,
    });
  });

  it('rejects invalid trip IDs', async () => {
    await expect(tripService.getTripById(ownerId, 'not-valid')).rejects.toThrow(
      'Invalid tripId',
    );
  });
});
