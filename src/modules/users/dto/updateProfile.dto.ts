import { z } from 'zod';

export const updateProfileDto = z
  .object({
    fullName: z.string().trim().min(2).max(120).optional(),
    phone: z.string().trim().max(40).optional(),
    country: z.string().trim().max(120).optional(),
    city: z.string().trim().max(120).optional(),
    avatarUrl: z.string().trim().url().optional().or(z.literal('')),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one profile field is required',
  });

export const preferencesDto = z.object({
  travelStyle: z.string().trim().optional().default(''),
  hotelTier: z.string().trim().optional().default(''),
  preferredCurrency: z.string().trim().length(3).optional().default('USD'),
  dietaryPreferences: z.array(z.string().trim()).optional().default([]),
  activityPreferences: z.array(z.string().trim()).optional().default([]),
  avoidActivities: z.array(z.string().trim()).optional().default([]),
});

export const updatePreferencesDto = z.object({
  preferences: preferencesDto,
});

export type UpdateProfileDto = z.infer<typeof updateProfileDto>;
export type UpdatePreferencesDto = z.infer<typeof updatePreferencesDto>;
