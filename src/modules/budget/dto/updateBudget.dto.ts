import { z } from 'zod';

const nonNegativeMoney = z.number().finite().min(0, 'Value cannot be negative');

export const updateBudgetDto = z.object({
  currency: z.string().trim().length(3, 'Currency must be a 3-letter code'),
  total: nonNegativeMoney,
});

export const budgetAllocationDto = z.object({
  amount: z.number().finite().positive('Amount must be greater than zero'),
  description: z.string().trim().min(1).max(200),
});

export type UpdateBudgetDto = z.infer<typeof updateBudgetDto>;
export type BudgetAllocationDto = z.infer<typeof budgetAllocationDto>;
