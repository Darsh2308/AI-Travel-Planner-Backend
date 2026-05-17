import type { RequestHandler } from 'express';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';
import { HTTP_STATUS } from '../../utils/constants';
import { validate } from '../../utils/validate';
import {
  checkConflictsDto,
  optimizeTripDto,
  recommendAlternativesDto,
} from './assistant.dto';
import * as assistantService from './assistant.service';

const getUserId = (req: Parameters<RequestHandler>[0]) => {
  if (!req.user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
  }
  return req.user.id;
};

export const optimizeTripController: RequestHandler = asyncHandler(
  async (req, res) => {
    const dto = validate(optimizeTripDto, req.body);
    const result = await assistantService.optimize(getUserId(req), dto);
    res
      .status(HTTP_STATUS.OK)
      .json(new ApiResponse(HTTP_STATUS.OK, 'Trip optimization generated', result));
  },
);

export const checkConflictsController: RequestHandler = asyncHandler(
  async (req, res) => {
    const dto = validate(checkConflictsDto, req.body);
    const result = await assistantService.checkConflicts(getUserId(req), dto);
    res
      .status(HTTP_STATUS.OK)
      .json(new ApiResponse(HTTP_STATUS.OK, 'Conflict report generated', result));
  },
);

export const recommendAlternativesController: RequestHandler = asyncHandler(
  async (req, res) => {
    const dto = validate(recommendAlternativesDto, req.body);
    const result = await assistantService.recommendAlternatives(getUserId(req), dto);
    res
      .status(HTTP_STATUS.OK)
      .json(new ApiResponse(HTTP_STATUS.OK, 'Alternatives generated', result));
  },
);

export const scoreController: RequestHandler = asyncHandler(async (req, res) => {
  const tripId = req.params.tripId;

  if (typeof tripId !== 'string') {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid tripId');
  }

  const score = await assistantService.getScore(getUserId(req), tripId);
  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, 'Itinerary score generated', { score }));
});
