import type { RequestHandler } from 'express';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';
import { HTTP_STATUS } from '../../utils/constants';
import { getAnalytics } from './analytics.service';

const getAuthenticatedUserId = (req: Parameters<RequestHandler>[0]): string => {
  if (!req.user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
  }
  return req.user.id;
};

export const getAnalyticsSummary: RequestHandler = asyncHandler(async (req, res) => {
  const analytics = await getAnalytics(getAuthenticatedUserId(req));

  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, 'Analytics fetched', { analytics }));
});
