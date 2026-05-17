import type { RequestHandler } from 'express';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';
import { HTTP_STATUS } from '../../utils/constants';
import { validate } from '../../utils/validate';
import { createTripDto } from '../trips/dto/createTrip.dto';
import * as aiService from './ai.service';

const getAuthenticatedUserId = (req: Parameters<RequestHandler>[0]): string => {
  if (!req.user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
  }

  return req.user.id;
};

export const generateTripPlan: RequestHandler = asyncHandler(async (req, res) => {
  const dto = validate(createTripDto, req.body);
  const result = await aiService.generateTripPlan({
    userId: getAuthenticatedUserId(req),
    destinationCity: dto.destinationCity,
    destinationCountry: dto.destinationCountry,
    totalDays: dto.totalDays,
    budgetTier: dto.budgetTier,
    startDate: dto.startDate,
    endDate: dto.endDate,
    preferredCurrency: 'USD',
  });

  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, 'Trip plan generated', { result }));
});
