import { z } from 'zod';

export const weatherReviewDto = z.object({
  affectedDay: z.number().int().positive(),
  userDecision: z.enum(['accept_risk', 'regenerate', 'dismiss']),
});

export const regenerateWeatherImpactedDayDto = z.object({
  affectedDay: z.number().int().positive(),
});

export type WeatherReviewDto = z.infer<typeof weatherReviewDto>;
export type RegenerateWeatherImpactedDayDto = z.infer<
  typeof regenerateWeatherImpactedDayDto
>;
