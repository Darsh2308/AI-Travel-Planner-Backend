import { z } from 'zod';

export const budgetTierSchema = z.enum(['budget', 'standard', 'premium', 'luxury']);
export const tripStatusSchema = z.enum([
  'draft',
  'planned',
  'weather_review_pending',
  'booked',
  'completed',
  'cancelled',
]);

const bookingOptionSchema = z.object({
  providerName: z.string().trim().optional().default(''),
  providerType: z.string().trim().optional().default(''),
  bookingUrl: z.string().trim().optional().default(''),
  priceEstimate: z.number().finite().min(0).optional().default(0),
  currency: z.string().trim().length(3).optional().default('USD'),
  availabilityStatus: z.string().trim().optional().default('unknown'),
});

const estimatedCostSchema = z.object({
  flights: z.number().finite().min(0).optional().default(0),
  accommodation: z.number().finite().min(0).optional().default(0),
  food: z.number().finite().min(0).optional().default(0),
  activities: z.number().finite().min(0).optional().default(0),
  localTransport: z.number().finite().min(0).optional().default(0),
  contingency: z.number().finite().min(0).optional().default(0),
  total: z.number().finite().min(0).optional().default(0),
});

const activitySchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(500).optional().default(''),
  category: z.string().trim().optional().default(''),
  locationName: z.string().trim().optional().default(''),
  address: z.string().trim().optional().default(''),
  latitude: z.number().finite().optional(),
  longitude: z.number().finite().optional(),
  estimatedCost: z.number().finite().min(0).optional().default(0),
  startTime: z.string().trim().optional().default(''),
  endTime: z.string().trim().optional().default(''),
  bookingRequired: z.boolean().optional().default(false),
  rating: z.number().finite().min(0).max(5).optional().default(0),
  reviewCount: z.number().int().min(0).optional().default(0),
  notes: z.string().trim().optional().default(''),
  bookingOptions: z.array(bookingOptionSchema).optional().default([]),
});

const weatherSnapshotSchema = z.object({
  forecastDate: z.coerce.date().optional(),
  temperatureCelsius: z.number().finite().optional(),
  feelsLikeCelsius: z.number().finite().optional(),
  humidity: z.number().finite().min(0).max(100).optional(),
  windSpeed: z.number().finite().min(0).optional(),
  precipitationChance: z.number().finite().min(0).max(100).optional(),
  weatherType: z.string().trim().optional().default(''),
  advisoryMessage: z.string().trim().optional().default(''),
  isOutdoorFriendly: z.boolean().optional().default(true),
  source: z.string().trim().optional().default(''),
});

const dayPlanSchema = z.object({
  dayNumber: z.number().int().positive(),
  title: z.string().trim().optional().default(''),
  summary: z.string().trim().optional().default(''),
  dayStatus: z
    .enum(['draft', 'planned', 'confirmed', 'completed'])
    .optional()
    .default('draft'),
  activities: z.array(activitySchema).optional().default([]),
  weatherSnapshot: weatherSnapshotSchema.optional().default({
    weatherType: '',
    advisoryMessage: '',
    isOutdoorFriendly: true,
    source: '',
  }),
});

const hotelRecommendationSchema = z.object({
  name: z.string().trim().min(1),
  tier: z.string().trim().optional().default(''),
  address: z.string().trim().optional().default(''),
  latitude: z.number().finite().optional(),
  longitude: z.number().finite().optional(),
  nightlyRateEstimate: z.number().finite().min(0).optional().default(0),
  currency: z.string().trim().length(3).optional().default('USD'),
  rating: z.number().finite().min(0).max(5).optional().default(0),
  reviewCount: z.number().int().min(0).optional().default(0),
  bookingOptions: z.array(bookingOptionSchema).optional().default([]),
});

const decisionCheckpointSchema = z.object({
  checkpointType: z.string().trim().min(1),
  message: z.string().trim().min(1),
  triggeredAt: z.coerce.date().optional().default(() => new Date()),
  userDecision: z.string().trim().optional().default(''),
  affectedDay: z.number().int().positive().optional(),
});

export const tripFieldsSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  destinationCity: z
    .string()
    .trim()
    .min(1, 'Destination city is required')
    .max(160),
  destinationCountry: z.string().trim().max(160).optional().default(''),
  latitude: z.number().finite().optional(),
  longitude: z.number().finite().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  totalDays: z.number().int().positive('Days must be greater than zero'),
  budgetTier: budgetTierSchema,
  allocatedBudgetAmount: z.number().finite().min(0).optional().default(0),
  estimatedCost: estimatedCostSchema.optional().default({
    flights: 0,
    accommodation: 0,
    food: 0,
    activities: 0,
    localTransport: 0,
    contingency: 0,
    total: 0,
  }),
  tripStatus: tripStatusSchema.optional().default('draft'),
  itinerary: z.array(dayPlanSchema).optional().default([]),
  hotelRecommendations: z.array(hotelRecommendationSchema).optional().default([]),
  decisionCheckpoints: z.array(decisionCheckpointSchema).optional().default([]),
  generateWithAi: z.boolean().optional().default(false),
});

export const createTripDto = tripFieldsSchema.refine(
  (data) => !data.startDate || !data.endDate || data.endDate >= data.startDate,
  {
    message: 'Trip end date cannot be before start date',
    path: ['endDate'],
  },
);

export type CreateTripDto = z.infer<typeof createTripDto>;
