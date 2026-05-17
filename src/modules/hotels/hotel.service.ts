import { TripModel } from '../../database/models/trip.model';
import { ApiError } from '../../utils/api-error';
import { HTTP_STATUS } from '../../utils/constants';
import { generateHotelBookingLinks } from '../../services/booking-link.service';
import { searchHotelMetadata } from '../../services/hotel-provider.service';
import { verifyOwnership } from '../../services/trip.service';

export const enrichHotels = async (ownerId: string, tripId: string) => {
  const trip = await verifyOwnership(ownerId, tripId);
  const hotelRecommendations = await Promise.all(
    trip.hotelRecommendations.map(async (hotel) => {
      const metadata = await searchHotelMetadata(
        hotel.name,
        trip.destinationCity,
        trip.destinationCountry,
      );
      const bookingOptions = generateHotelBookingLinks({
        name: hotel.name,
        city: trip.destinationCity,
        country: trip.destinationCountry,
        checkIn: trip.startDate || undefined,
        checkOut: trip.endDate || undefined,
      });

      return {
        ...(hotel.toObject?.() ?? hotel),
        ...(metadata
          ? {
              address: metadata.address,
              latitude: metadata.latitude,
              longitude: metadata.longitude,
              nightlyRateEstimate: metadata.nightlyRateEstimate,
              currency: metadata.currency,
              rating: metadata.rating,
              reviewCount: metadata.reviewCount,
              amenities: metadata.amenities,
            }
          : {}),
        bookingOptions,
      };
    }),
  );

  const updatedTrip = await TripModel.findOneAndUpdate(
    { _id: tripId, owner: ownerId },
    { $set: { hotelRecommendations } },
    { new: true, runValidators: true },
  );

  if (!updatedTrip) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Trip not found');
  }

  return updatedTrip;
};

export const getHotels = async (ownerId: string, tripId: string) => {
  const trip = await verifyOwnership(ownerId, tripId);
  return trip.hotelRecommendations;
};

export const getHotelBookingOptions = async (
  ownerId: string,
  tripId: string,
  hotelId: string,
) => {
  const trip = await verifyOwnership(ownerId, tripId);
  const hotel = trip.hotelRecommendations.find(
    (item) => item._id?.toString() === hotelId,
  );

  if (!hotel) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Hotel recommendation not found');
  }

  return hotel.bookingOptions;
};
