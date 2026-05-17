import { z } from 'zod';
import {
  budgetTierSchema,
  tripFieldsSchema,
  tripStatusSchema,
} from './createTrip.dto';

export const updateTripDto = tripFieldsSchema
  .pick({
    title: true,
    destinationCity: true,
    destinationCountry: true,
    latitude: true,
    longitude: true,
    startDate: true,
    endDate: true,
    totalDays: true,
    allocatedBudgetAmount: true,
    estimatedCost: true,
    itinerary: true,
    hotelRecommendations: true,
    decisionCheckpoints: true,
  })
  .extend({
    budgetTier: budgetTierSchema.optional(),
    tripStatus: tripStatusSchema.optional(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one trip field is required',
  })
  .refine(
    (data) =>
      !data.startDate || !data.endDate || data.endDate >= data.startDate,
    {
      message: 'Trip end date cannot be before start date',
      path: ['endDate'],
    },
  );

export type UpdateTripDto = z.infer<typeof updateTripDto>;
