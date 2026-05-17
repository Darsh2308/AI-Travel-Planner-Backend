import { z } from 'zod';
import { preferencesDto } from '../../users/dto/updateProfile.dto';

const budgetLedgerDto = z.object({
  totalBudget: z.number().finite().min(0).optional().default(0),
  currency: z.string().trim().length(3).optional().default('USD'),
});

export const registerDto = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().toLowerCase(),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[a-z]/, 'Password must include a lowercase letter')
    .regex(/[A-Z]/, 'Password must include an uppercase letter')
    .regex(/[0-9]/, 'Password must include a number'),
  phone: z.string().trim().max(40).optional().default(''),
  country: z.string().trim().max(120).optional().default(''),
  city: z.string().trim().max(120).optional().default(''),
  avatarUrl: z.string().trim().url().optional().or(z.literal('')).default(''),
  preferences: preferencesDto.optional(),
  budgetLedger: budgetLedgerDto.optional(),
});

export type RegisterDto = z.infer<typeof registerDto>;
