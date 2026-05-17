import { z } from 'zod';

export const regenerateDayDto = z.object({
  dayNumber: z.number().int().positive(),
  regenerationIntent: z.string().trim().min(1),
  customPrompt: z.string().trim().optional().default(''),
});

export type RegenerateDayDto = z.infer<typeof regenerateDayDto>;
