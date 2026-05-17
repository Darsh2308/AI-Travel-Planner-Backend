import { z } from 'zod';

export const optimizeTripDto = z.object({
  tripId: z.string().min(1),
  optimizationGoal: z.enum([
    'reduce cost',
    'luxury upgrade',
    'family friendly',
    'less walking',
    'food focused',
    'fewer transitions',
  ]),
});

export const checkConflictsDto = z.object({
  tripId: z.string().min(1),
});

export const recommendAlternativesDto = z.object({
  tripId: z.string().min(1),
  affectedDay: z.number().int().positive(),
  reason: z.enum([
    'bad weather',
    'attraction unavailable',
    'user preference change',
    'budget concern',
  ]),
});

export type OptimizeTripDto = z.infer<typeof optimizeTripDto>;
export type CheckConflictsDto = z.infer<typeof checkConflictsDto>;
export type RecommendAlternativesDto = z.infer<typeof recommendAlternativesDto>;
