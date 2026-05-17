import { TripModel } from '../../database/models/trip.model';
import { ApiError } from '../../utils/api-error';
import { HTTP_STATUS } from '../../utils/constants';
import {
  classifyActivityBookingRequirement,
  generateActivityBookingLinks,
} from '../../services/activity-booking.service';
import { enrichActivityMetadata } from '../../services/activity-provider.service';
import { verifyOwnership } from '../../services/trip.service';

export const enrichTripActivities = async (ownerId: string, tripId: string) => {
  const trip = await verifyOwnership(ownerId, tripId);
  const itinerary = await Promise.all(
    trip.itinerary.map(async (day) => {
      const dayObject = day.toObject?.() ?? day;
      const activities = await Promise.all(
        day.activities.map(async (activity) => {
          const activityObject = activity.toObject?.() ?? activity;
          const metadata = await enrichActivityMetadata(
            activity.title,
            trip.destinationCity,
          );

          return {
            ...activityObject,
            ...(metadata ?? {}),
            bookingRequired: classifyActivityBookingRequirement(activity.title),
            bookingOptions: generateActivityBookingLinks(
              activity.title,
              trip.destinationCity,
            ),
          };
        }),
      );

      return {
        ...dayObject,
        activities,
      };
    }),
  );

  const updatedTrip = await TripModel.findOneAndUpdate(
    { _id: tripId, owner: ownerId },
    { $set: { itinerary } },
    { new: true, runValidators: true },
  );

  if (!updatedTrip) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Trip not found');
  }

  return updatedTrip;
};

export const getActivityBookingOptions = async (
  ownerId: string,
  tripId: string,
  activityId: string,
) => {
  const trip = await verifyOwnership(ownerId, tripId);

  for (const day of trip.itinerary) {
    const activity = day.activities.find((item) => item._id?.toString() === activityId);

    if (activity) {
      return activity.bookingOptions;
    }
  }

  throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Activity not found');
};
