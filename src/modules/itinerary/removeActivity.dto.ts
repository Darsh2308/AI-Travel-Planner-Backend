import { z } from 'zod';

export const removeActivityDto = z.object({
  releaseBudget: z.boolean().optional().default(true),
});

export type RemoveActivityDto = z.infer<typeof removeActivityDto>;
