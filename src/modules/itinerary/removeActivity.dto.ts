import { z } from 'zod';

export const removeActivityQueryDto = z.object({
  releaseBudget: z
    .string()
    .optional()
    .transform((v) => v !== 'false')
    .pipe(z.boolean())
    .default(true),
});

export type RemoveActivityQueryDto = z.infer<typeof removeActivityQueryDto>;
