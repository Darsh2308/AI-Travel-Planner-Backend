import { z } from 'zod';
import { ACTIVITY_CATEGORIES } from './itinerary.types';

export const updateActivityDto = z
  .object({
    title: z.string().trim().min(1).max(160).optional(),
    description: z.string().trim().max(500).optional(),
    category: z.enum(ACTIVITY_CATEGORIES).optional(),
    location: z.string().trim().min(1).optional(),
    estimatedCost: z.number().finite().min(0).optional(),
    startTime: z.string().trim().optional(),
    endTime: z.string().trim().optional(),
    bookingRequired: z.boolean().optional(),
    notes: z.string().trim().optional(),
    preferredTimeSlot: z.string().trim().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one activity field is required',
  });

export type UpdateActivityDto = z.infer<typeof updateActivityDto>;
