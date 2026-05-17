import { Types } from 'mongoose';
import { TripModel, type TripDocument } from '../../database/models/trip.model';
import { ApiError } from '../../utils/api-error';
import { HTTP_STATUS } from '../../utils/constants';
import { classifyActivity } from '../../services/activity-classifier.service';
import {
  applyAllocationDelta,
  calculateAddedCostDelta,
  calculateRemovedCostDelta,
  calculateUpdatedCostDelta,
  releaseAllocationDelta,
} from '../../services/itinerary-budget.service';
import {
  regenerateSpecificDay,
  replaceDayPlan,
} from '../../services/itinerary-regeneration.service';
import { verifyOwnership } from '../../services/trip.service';
import type { AddActivityDto } from './addActivity.dto';
import type { RemoveActivityDto } from './removeActivity.dto';
import type { RegenerateDayDto } from './regenerateDay.dto';
import type { UpdateActivityDto } from './updateActivity.dto';

export const validateDayExists = (trip: TripDocument, dayNumber: number) => {
  const day = trip.itinerary.find((item) => item.dayNumber === dayNumber);

  if (!day) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Day plan not found');
  }

  return day;
};

export const validateActivityExists = (trip: TripDocument, activityId: string) => {
  for (const day of trip.itinerary) {
    const activity = day.activities.find(
      (item) => item._id?.toString() === activityId,
    );

    if (activity) {
      return { day, activity };
    }
  }

  throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Activity not found');
};

const saveItinerary = async (
  ownerId: string,
  tripId: string,
  itinerary: unknown[],
  costDelta: number,
) => {
  const trip = await TripModel.findOneAndUpdate(
    { _id: tripId, owner: ownerId },
    {
      $set: {
        itinerary,
      },
      $inc: {
        'estimatedCost.activities': costDelta,
        'estimatedCost.total': costDelta,
        allocatedBudgetAmount: costDelta,
      },
    },
    { new: true, runValidators: true },
  );

  if (!trip) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Trip not found');
  }

  return trip;
};

export const getDayPlan = async (
  ownerId: string,
  tripId: string,
  dayNumber: number,
) => {
  const trip = await verifyOwnership(ownerId, tripId);
  return validateDayExists(trip, dayNumber);
};

export const addActivity = async (
  ownerId: string,
  tripId: string,
  dto: AddActivityDto,
) => {
  const trip = await verifyOwnership(ownerId, tripId);
  const delta = calculateAddedCostDelta(dto.estimatedCost);
  await applyAllocationDelta(ownerId, delta, `Activity added: ${dto.title}`);

  const itinerary = trip.itinerary.map((day) => {
    const dayObject = day.toObject?.() ?? day;

    if (day.dayNumber !== dto.dayNumber) {
      return dayObject;
    }

    const classified = classifyActivity(dto.title, trip.destinationCity);

    return {
      ...dayObject,
      activities: [
        ...day.activities.map((activity) => activity.toObject?.() ?? activity),
        {
          _id: new Types.ObjectId(),
          title: dto.title,
          description: '',
          category: dto.category,
          locationName: dto.location,
          address: dto.location,
          estimatedCost: dto.estimatedCost,
          startTime: dto.preferredTimeSlot,
          endTime: '',
          bookingRequired: dto.bookingRequired || classified.bookingRequired,
          rating: 0,
          reviewCount: 0,
          notes: dto.notes,
          bookingOptions: classified.bookingOptions,
        },
      ],
    };
  });

  validateDayExists(trip, dto.dayNumber);
  return saveItinerary(ownerId, tripId, itinerary, delta);
};

export const updateActivity = async (
  ownerId: string,
  tripId: string,
  activityId: string,
  dto: UpdateActivityDto,
) => {
  const trip = await verifyOwnership(ownerId, tripId);
  const { activity } = validateActivityExists(trip, activityId);
  const oldCost = activity.estimatedCost || 0;
  const newCost = dto.estimatedCost ?? oldCost;
  const delta = calculateUpdatedCostDelta(oldCost, newCost);

  if (delta > 0) {
    await applyAllocationDelta(ownerId, delta, `Activity updated: ${activity.title}`);
  }

  if (delta < 0) {
    await releaseAllocationDelta(
      ownerId,
      Math.abs(delta),
      `Activity cost reduced: ${activity.title}`,
    );
  }

  const itinerary = trip.itinerary.map((day) => ({
    ...(day.toObject?.() ?? day),
    activities: day.activities.map((item) => {
      const activityObject = item.toObject?.() ?? item;

      if (item._id?.toString() !== activityId) {
        return activityObject;
      }

      const nextTitle = dto.title ?? item.title;
      const classified = classifyActivity(nextTitle, trip.destinationCity);

      return {
        ...activityObject,
        ...(dto.title ? { title: dto.title } : {}),
        ...(dto.description ? { description: dto.description } : {}),
        ...(dto.category ? { category: dto.category } : {}),
        ...(dto.location ? { locationName: dto.location, address: dto.location } : {}),
        ...(dto.estimatedCost !== undefined
          ? { estimatedCost: dto.estimatedCost }
          : {}),
        ...(dto.bookingRequired !== undefined
          ? { bookingRequired: dto.bookingRequired }
          : { bookingRequired: classified.bookingRequired }),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.preferredTimeSlot !== undefined
          ? { startTime: dto.preferredTimeSlot }
          : {}),
        bookingOptions: classified.bookingOptions,
      };
    }),
  }));

  return saveItinerary(ownerId, tripId, itinerary, delta);
};

export const removeActivity = async (
  ownerId: string,
  tripId: string,
  activityId: string,
  dto: RemoveActivityDto,
) => {
  const trip = await verifyOwnership(ownerId, tripId);
  const { activity } = validateActivityExists(trip, activityId);
  const delta = calculateRemovedCostDelta(activity.estimatedCost || 0);

  if (dto.releaseBudget) {
    await releaseAllocationDelta(ownerId, delta, `Activity removed: ${activity.title}`);
  }

  const itinerary = trip.itinerary.map((day) => ({
    ...(day.toObject?.() ?? day),
    activities: day.activities
      .filter((item) => item._id?.toString() !== activityId)
      .map((item) => item.toObject?.() ?? item),
  }));

  return saveItinerary(ownerId, tripId, itinerary, -delta);
};

export const regenerateDay = async (
  ownerId: string,
  tripId: string,
  dto: RegenerateDayDto,
) => {
  const trip = await verifyOwnership(ownerId, tripId);
  validateDayExists(trip, dto.dayNumber);
  const replacement = await regenerateSpecificDay(
    ownerId,
    trip,
    dto.dayNumber,
    dto.regenerationIntent,
    dto.customPrompt,
  );
  const itinerary = replaceDayPlan(
    trip.itinerary.map((day) => day.toObject?.() ?? day),
    dto.dayNumber,
    replacement,
  );

  return saveItinerary(ownerId, tripId, itinerary, 0);
};
