import { z } from 'zod';

const bookingOptionSchema = z.object({
  providerName: z.string().default(''),
  providerType: z.string().default(''),
  bookingUrl: z.string().default(''),
  priceEstimate: z.number().min(0).default(0),
  currency: z.string().length(3).default('USD'),
  availabilityStatus: z.string().default('unknown'),
});

const activitySchema = z.object({
  title: z.string().min(1),
  description: z.string().default(''),
  category: z.string().default(''),
  locationName: z.string().default(''),
  address: z.string().default(''),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  estimatedCost: z.number().min(0).default(0),
  startTime: z.string().default(''),
  endTime: z.string().default(''),
  bookingRequired: z.boolean().default(false),
  rating: z.number().min(0).max(5).default(0),
  reviewCount: z.number().int().min(0).default(0),
  notes: z.string().default(''),
  bookingOptions: z.array(bookingOptionSchema).default([]),
});

const weatherSnapshotSchema = z.object({
  forecastDate: z.string().optional(),
  temperatureCelsius: z.number().optional(),
  feelsLikeCelsius: z.number().optional(),
  humidity: z.number().min(0).max(100).optional(),
  windSpeed: z.number().min(0).optional(),
  precipitationChance: z.number().min(0).max(100).optional(),
  weatherType: z.string().default(''),
  advisoryMessage: z.string().default(''),
  isOutdoorFriendly: z.boolean().default(true),
  source: z.string().default('ai_estimate'),
});

const dayPlanSchema = z.object({
  dayNumber: z.number().int().positive(),
  title: z.string().default(''),
  summary: z.string().default(''),
  dayStatus: z.enum(['draft', 'planned', 'confirmed', 'completed']).default('draft'),
  activities: z.array(activitySchema).default([]),
  weatherSnapshot: weatherSnapshotSchema.default({
    weatherType: '',
    advisoryMessage: '',
    isOutdoorFriendly: true,
    source: 'ai_estimate',
  }),
});

export const aiEstimatedCostSchema = z.object({
  flights: z.number().min(0).default(0),
  accommodation: z.number().min(0).default(0),
  food: z.number().min(0).default(0),
  activities: z.number().min(0).default(0),
  localTransport: z.number().min(0).default(0),
  contingency: z.number().min(0).default(0),
  total: z.number().min(0).default(0),
});

export const aiHotelSchema = z.object({
  name: z.string().min(1),
  tier: z.string().default(''),
  address: z.string().default(''),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  nightlyRateEstimate: z.number().min(0).default(0),
  currency: z.string().length(3).default('USD'),
  rating: z.number().min(0).max(5).default(0),
  reviewCount: z.number().int().min(0).default(0),
  bookingOptions: z.array(bookingOptionSchema).default([]),
});

export const aiTripGenerationSchema = z.object({
  itinerary: z.array(dayPlanSchema).min(1),
  estimatedCost: aiEstimatedCostSchema,
  hotels: z.array(aiHotelSchema).default([]),
});

export type AiTripGenerationSchema = z.infer<typeof aiTripGenerationSchema>;

export const aiHotelSuggestionsSchema = z.object({
  hotels: z.array(aiHotelSchema).default([]),
});
