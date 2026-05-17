import { Types } from 'mongoose';
import { TripModel } from '../database/models/trip.model';
import * as itineraryService from '../modules/itinerary/itinerary.service';
import { applyAllocationDelta, releaseAllocationDelta } from '../services/itinerary-budget.service';
import { verifyOwnership } from '../services/trip.service';

jest.mock('../database/models/trip.model', () => ({
  TripModel: {
    findOneAndUpdate: jest.fn(),
  },
}));

jest.mock('../services/trip.service', () => ({
  verifyOwnership: jest.fn(),
}));

jest.mock('../services/itinerary-budget.service', () => ({
  calculateAddedCostDelta: jest.fn((cost: number) => cost),
  calculateRemovedCostDelta: jest.fn((cost: number) => cost),
  calculateUpdatedCostDelta: jest.fn((oldCost: number, newCost: number) => newCost - oldCost),
  applyAllocationDelta: jest.fn(),
  releaseAllocationDelta: jest.fn(),
}));

const mockedTripModel = TripModel as jest.Mocked<typeof TripModel>;
const mockedVerifyOwnership = verifyOwnership as jest.MockedFunction<typeof verifyOwnership>;
const mockedApplyAllocationDelta = applyAllocationDelta as jest.MockedFunction<typeof applyAllocationDelta>;
const mockedReleaseAllocationDelta = releaseAllocationDelta as jest.MockedFunction<typeof releaseAllocationDelta>;

const ownerId = new Types.ObjectId().toString();
const tripId = new Types.ObjectId().toString();
const activityId = new Types.ObjectId().toString();

const trip = {
  itinerary: [
    {
      dayNumber: 1,
      toObject: () => ({ dayNumber: 1, activities: [] }),
      activities: [
        {
          _id: { toString: () => activityId },
          title: 'Old Activity',
          estimatedCost: 100,
          toObject: () => ({
            _id: activityId,
            title: 'Old Activity',
            estimatedCost: 100,
          }),
        },
      ],
    },
  ],
  destinationCity: 'Paris',
} as never;

describe('itinerary service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedVerifyOwnership.mockResolvedValue(trip);
    mockedTripModel.findOneAndUpdate.mockResolvedValue({ _id: tripId } as never);
  });

  it('adds an activity and allocates budget', async () => {
    await itineraryService.addActivity(ownerId, tripId, {
      dayNumber: 1,
      title: 'Louvre Museum',
      description: '',
      category: 'museum',
      location: 'Paris',
      estimatedCost: 80,
      startTime: '10:00',
      endTime: '',
      bookingRequired: false,
      notes: '',
      preferredTimeSlot: '10:00',
    });

    expect(mockedApplyAllocationDelta).toHaveBeenCalledWith(
      ownerId,
      80,
      'Activity added: Louvre Museum',
    );
  });

  it('rejects invalid day', async () => {
    await expect(
      itineraryService.addActivity(ownerId, tripId, {
        dayNumber: 99,
        title: 'Louvre Museum',
        description: '',
        category: 'museum',
        location: 'Paris',
        estimatedCost: 80,
        startTime: '',
        endTime: '',
        bookingRequired: false,
        notes: '',
        preferredTimeSlot: '',
      }),
    ).rejects.toThrow('Day plan not found');
  });

  it('updates an activity and applies only cost delta', async () => {
    await itineraryService.updateActivity(ownerId, tripId, activityId, {
      estimatedCost: 180,
    });

    expect(mockedApplyAllocationDelta).toHaveBeenCalledWith(
      ownerId,
      80,
      'Activity updated: Old Activity',
    );
  });

  it('removes an activity and releases funds', async () => {
    await itineraryService.removeActivity(ownerId, tripId, activityId, {
      releaseBudget: true,
    });

    expect(mockedReleaseAllocationDelta).toHaveBeenCalledWith(
      ownerId,
      100,
      'Activity removed: Old Activity',
    );
  });

  it('rejects invalid activity', async () => {
    await expect(
      itineraryService.removeActivity(ownerId, tripId, new Types.ObjectId().toString(), {
        releaseBudget: true,
      }),
    ).rejects.toThrow('Activity not found');
  });
});
