import type { RequestHandler } from 'express';
import * as budgetService from '../../services/budget.service';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';
import { HTTP_STATUS } from '../../utils/constants';
import { validate } from '../../utils/validate';
import {
  budgetAllocationDto,
  updateBudgetDto,
} from './dto/updateBudget.dto';

const getAuthenticatedUserId = (req: Parameters<RequestHandler>[0]): string => {
  if (!req.user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
  }

  return req.user.id;
};

export const getBudget: RequestHandler = asyncHandler(async (req, res) => {
  const budget = await budgetService.getBudget(getAuthenticatedUserId(req));

  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, 'Budget fetched', { budget }));
});

export const updateBudget: RequestHandler = asyncHandler(async (req, res) => {
  const dto = validate(updateBudgetDto, req.body);
  const budget = await budgetService.updateUserBudget(
    getAuthenticatedUserId(req),
    dto,
  );

  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, 'Budget updated', { budget }));
});

export const allocateBudget: RequestHandler = asyncHandler(async (req, res) => {
  const dto = validate(budgetAllocationDto, req.body);
  const budget = await budgetService.allocateUserBudget(
    getAuthenticatedUserId(req),
    dto,
  );

  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, 'Budget allocated', { budget }));
});

export const releaseBudget: RequestHandler = asyncHandler(async (req, res) => {
  const dto = validate(budgetAllocationDto, req.body);
  const budget = await budgetService.releaseUserBudget(
    getAuthenticatedUserId(req),
    dto,
  );

  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, 'Budget released', { budget }));
});

export const getLedger: RequestHandler = asyncHandler(async (req, res) => {
  const budget = await budgetService.getBudget(getAuthenticatedUserId(req));

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, 'Budget ledger fetched', {
      ledger: budget.entries,
      budget,
    }),
  );
});
