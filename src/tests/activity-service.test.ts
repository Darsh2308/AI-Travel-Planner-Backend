import { Types } from 'mongoose';
import { TripModel } from '../database/models/trip.model';
import * as activityService from '../modules/activities/activity.service';
import { verifyOwnership } from '../services/trip.service';

jest.mock('../database/models/trip.model', () => ({
  TripModel: {
    findOneAndUpdate: jest.fn(),
  },
}));

jest.mock('../services/trip.service', () => ({
  verifyOwnership: jest.fn(),
}));

const mockedTripModel = TripModel as jest.Mocked<typeof TripModel>;
const mockedVerifyOwnership = verifyOwnership as jest.MockedFunction<
  typeof verifyOwnership
>;

const ownerId = new Types.ObjectId().toString();
const tripId = new Types.ObjectId().toString();

describe('activity service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('enriches itinerary activities with metadata and booking links', async () => {
    mockedVerifyOwnership.mockResolvedValueOnce({
      destinationCity: 'Paris',
      itinerary: [
        {
          toObject: () => ({ dayNumber: 1 }),
          activities: [
            {
              _id: { toString: () => 'activity-id' },
              title: 'Louvre Museum',
              toObject: () => ({ _id: 'activity-id', title: 'Louvre Museum' }),
            },
          ],
        },
      ],
    } as never);
    mockedTripModel.findOneAndUpdate.mockResolvedValueOnce({ _id: tripId } as never);

    await activityService.enrichTripActivities(ownerId, tripId);

    expect(mockedTripModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: tripId, owner: ownerId },
      {
        $set: {
          itinerary: [
            expect.objectContaining({
              activities: [
                expect.objectContaining({
                  title: 'Louvre Museum',
                  bookingRequired: true,
                  bookingOptions: expect.any(Array),
                  rating: expect.any(Number),
                }),
              ],
            }),
          ],
        },
      },
      expect.objectContaining({ new: true }),
    );
  });
});
