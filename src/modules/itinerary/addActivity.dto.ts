import { z } from 'zod';
import { ACTIVITY_CATEGORIES } from './itinerary.types';

export const addActivityDto = z.object({
  dayNumber: z.number().int().positive(),
  title: z.string().trim().min(1),
  category: z.enum(ACTIVITY_CATEGORIES),
  location: z.string().trim().min(1),
  estimatedCost: z.number().finite().min(0),
  bookingRequired: z.boolean().optional().default(false),
  notes: z.string().trim().optional().default(''),
  preferredTimeSlot: z.string().trim().optional().default(''),
});

export type AddActivityDto = z.infer<typeof addActivityDto>;
