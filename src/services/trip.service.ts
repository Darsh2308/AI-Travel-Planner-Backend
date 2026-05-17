import { Types } from 'mongoose';
import { TripModel, type TripDocument } from '../database/models/trip.model';
import { UserModel } from '../database/models/user.model';
import type { CreateTripDto } from '../modules/trips/dto/createTrip.dto';
import type { UpdateTripDto } from '../modules/trips/dto/updateTrip.dto';
import { ApiError } from '../utils/api-error';
import { HTTP_STATUS } from '../utils/constants';
import * as aiService from '../modules/ai/ai.service';
import { enrichHotels } from '../modules/hotels/hotel.service';
import { enrichTripActivities } from '../modules/activities/activity.service';
import {
  allocateUserBudget,
  getBudget,
  normalizeLedger,
  releaseUserBudget,
} from './budget.service';

export type TripView = {
  id: string;
  owner: string;
  title: string;
  destinationCity: string;
  destinationCountry: string;
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  startDate: Date | null | undefined;
  endDate: Date | null | undefined;
  totalDays: number;
  budgetTier: string;
  allocatedBudgetAmount: number;
  estimatedCost: unknown;
  tripStatus: string;
  itinerary: unknown;
  hotelRecommendations: unknown;
  decisionCheckpoints: unknown;
};

const ensureValidTripId = (tripId: string): void => {
  if (!Types.ObjectId.isValid(tripId)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid tripId');
  }
};

const toTripView = (trip: TripDocument): TripView => ({
  id: trip._id.toString(),
  owner: trip.owner.toString(),
  title: trip.title,
  destinationCity: trip.destinationCity,
  destinationCountry: trip.destinationCountry,
  latitude: trip.latitude,
  longitude: trip.longitude,
  startDate: trip.startDate,
  endDate: trip.endDate,
  totalDays: trip.totalDays,
  budgetTier: trip.budgetTier,
  allocatedBudgetAmount: trip.allocatedBudgetAmount,
  estimatedCost: trip.estimatedCost,
  tripStatus: trip.tripStatus,
  itinerary: trip.itinerary,
  hotelRecommendations: trip.hotelRecommendations,
  decisionCheckpoints: trip.decisionCheckpoints,
});

const getDefaultTitle = (dto: CreateTripDto): string => {
  return dto.title || `${dto.destinationCity} trip`;
};

const shouldGenerateAiPlan = (dto: CreateTripDto): boolean => {
  return (
    dto.generateWithAi ||
    (dto.itinerary.length === 0 &&
      dto.hotelRecommendations.length === 0 &&
      dto.estimatedCost.total === 0)
  );
};

const getAiContext = async (ownerId: string) => {
  const user = await UserModel.findOne({
    _id: ownerId,
    isActive: true,
  });

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
  }

  const preferences = user.preferences as {
    preferredCurrency?: string;
    travelStyle?: string;
    activityPreferences?: string[];
    dietaryPreferences?: string[];
    avoidActivities?: string[];
  };
  const budgetLedger = normalizeLedger(user.budgetLedger);

  return {
    preferredCurrency: preferences.preferredCurrency || budgetLedger.currency || 'USD',
    totalBudget: budgetLedger.totalBudget,
    travelStyle: preferences.travelStyle || '',
    activityPreferences: preferences.activityPreferences || [],
    dietaryPreferences: preferences.dietaryPreferences || [],
    avoidActivities: preferences.avoidActivities || [],
  };
};

const allocateTripBudget = async (
  ownerId: string,
  amount: number,
  title: string,
): Promise<void> => {
  if (amount <= 0) {
    return;
  }

  await allocateUserBudget(ownerId, {
    amount,
    description: `Trip allocation: ${title}`,
  });
};

const releaseTripBudget = async (
  ownerId: string,
  trip: TripDocument,
): Promise<void> => {
  if (!trip.allocatedBudgetAmount || trip.allocatedBudgetAmount <= 0) {
    return;
  }

  await releaseUserBudget(ownerId, {
    amount: trip.allocatedBudgetAmount,
    description: `Trip deleted: ${trip.title}`,
  });
};

export const verifyOwnership = async (
  ownerId: string,
  tripId: string,
): Promise<TripDocument> => {
  ensureValidTripId(tripId);

  const trip = await TripModel.findOne({
    _id: tripId,
    owner: ownerId,
  });

  if (!trip) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Trip not found');
  }

  return trip;
};

export const createTrip = async (
  ownerId: string,
  dto: CreateTripDto,
): Promise<TripView> => {
  const { generateWithAi, ...createPayload } = dto;
  void generateWithAi;
  const tripPayload: Record<string, unknown> = {
    ...createPayload,
    title: getDefaultTitle(dto),
    owner: ownerId,
  };

  if (shouldGenerateAiPlan(dto)) {
    const aiContext = await getAiContext(ownerId);
    const generated = await aiService.generateTripPlan({
      userId: ownerId,
      destinationCity: dto.destinationCity,
      destinationCountry: dto.destinationCountry,
      totalDays: dto.totalDays,
      budgetTier: dto.budgetTier,
      startDate: dto.startDate,
      endDate: dto.endDate,
      ...aiContext,
    });

    tripPayload.itinerary = generated.itinerary;
    tripPayload.estimatedCost = generated.estimatedCost;
    tripPayload.hotelRecommendations = generated.hotels;
    tripPayload.allocatedBudgetAmount = generated.estimatedCost.total;

    const budget = await getBudget(ownerId);

    if (generated.estimatedCost.total > budget.remainingBudget) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Generated trip estimate exceeds remaining budget',
      );
    }
  }

  const trip = await TripModel.create({
    ...tripPayload,
  });

  await allocateTripBudget(ownerId, trip.allocatedBudgetAmount || 0, trip.title);

  let enrichedTrip: TripDocument = trip;

  if (enrichedTrip.hotelRecommendations.length) {
    enrichedTrip = await enrichHotels(ownerId, enrichedTrip._id.toString());
  }

  if (enrichedTrip.itinerary.some((day) => day.activities.length > 0)) {
    enrichedTrip = await enrichTripActivities(ownerId, enrichedTrip._id.toString());
  }

  return toTripView(enrichedTrip);
};

export const listTrips = async (ownerId: string): Promise<TripView[]> => {
  const trips = await TripModel.find({
    owner: ownerId,
  }).sort({ createdAt: -1 });

  return trips.map(toTripView);
};

export const getTripById = async (
  ownerId: string,
  tripId: string,
): Promise<TripView> => {
  const trip = await verifyOwnership(ownerId, tripId);

  return toTripView(trip);
};

export const updateTrip = async (
  ownerId: string,
  tripId: string,
  dto: UpdateTripDto,
): Promise<TripView> => {
  ensureValidTripId(tripId);

  const trip = await TripModel.findOneAndUpdate(
    {
      _id: tripId,
      owner: ownerId,
    },
    {
      $set: dto,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!trip) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Trip not found');
  }

  return toTripView(trip);
};

export const deleteTrip = async (
  ownerId: string,
  tripId: string,
): Promise<void> => {
  const trip = await verifyOwnership(ownerId, tripId);

  await releaseTripBudget(ownerId, trip);
  await TripModel.deleteOne({
    _id: tripId,
    owner: ownerId,
  });
};
