import { z } from 'zod';

export const refreshDto = z.object({
  refreshToken: z.string().min(1),
});

export type RefreshDto = z.infer<typeof refreshDto>;
