import { Types } from 'mongoose';
import { TripModel } from '../database/models/trip.model';
import * as hotelService from '../modules/hotels/hotel.service';
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
const hotelId = new Types.ObjectId().toString();

describe('hotel service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('enriches hotel recommendations with metadata and booking options', async () => {
    mockedVerifyOwnership.mockResolvedValueOnce({
      destinationCity: 'Paris',
      destinationCountry: 'France',
      startDate: undefined,
      endDate: undefined,
      hotelRecommendations: [
        {
          _id: { toString: () => hotelId },
          name: 'Hotel Lumiere',
          toObject: () => ({ _id: hotelId, name: 'Hotel Lumiere' }),
        },
      ],
    } as never);
    mockedTripModel.findOneAndUpdate.mockResolvedValueOnce({ _id: tripId } as never);

    await hotelService.enrichHotels(ownerId, tripId);

    expect(mockedTripModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: tripId, owner: ownerId },
      {
        $set: {
          hotelRecommendations: [
            expect.objectContaining({
              name: 'Hotel Lumiere',
              rating: expect.any(Number),
              reviewCount: expect.any(Number),
              bookingOptions: expect.any(Array),
            }),
          ],
        },
      },
      expect.objectContaining({ new: true }),
    );
  });
});
