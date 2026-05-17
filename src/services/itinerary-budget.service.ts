import { ApiError } from '../utils/api-error';
import { HTTP_STATUS } from '../utils/constants';
import {
  allocateUserBudget,
  getBudget,
  releaseUserBudget,
} from './budget.service';

export const calculateAddedCostDelta = (newCost: number): number => newCost;

export const calculateRemovedCostDelta = (oldCost: number): number => oldCost;

export const calculateUpdatedCostDelta = (
  oldCost: number,
  newCost: number,
): number => newCost - oldCost;

export const applyAllocationDelta = async (
  userId: string,
  delta: number,
  description: string,
): Promise<void> => {
  if (delta <= 0) {
    return;
  }

  const budget = await getBudget(userId);

  if (delta > budget.remainingBudget) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Insufficient remaining budget for itinerary change',
    );
  }

  await allocateUserBudget(userId, {
    amount: delta,
    description,
  });
};

export const releaseAllocationDelta = async (
  userId: string,
  delta: number,
  description: string,
): Promise<void> => {
  if (delta <= 0) {
    return;
  }

  await releaseUserBudget(userId, {
    amount: delta,
    description,
  });
};
