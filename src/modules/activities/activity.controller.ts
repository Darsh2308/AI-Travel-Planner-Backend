import type { RequestHandler } from 'express';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';
import { HTTP_STATUS } from '../../utils/constants';
import * as activityService from './activity.service';

const getUserId = (req: Parameters<RequestHandler>[0]) => {
  if (!req.user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
  }
  return req.user.id;
};

const getParam = (req: Parameters<RequestHandler>[0], key: string) => {
  const value = req.params[key];

  if (typeof value !== 'string') {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Invalid ${key}`);
  }

  return value;
};

export const enrichActivities: RequestHandler = asyncHandler(async (req, res) => {
  const trip = await activityService.enrichTripActivities(
    getUserId(req),
    getParam(req, 'tripId'),
  );

  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, 'Activities enriched', { trip }));
});

export const getActivityBookingOptions: RequestHandler = asyncHandler(
  async (req, res) => {
    const bookingOptions = await activityService.getActivityBookingOptions(
      getUserId(req),
      getParam(req, 'tripId'),
      getParam(req, 'activityId'),
    );

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse(HTTP_STATUS.OK, 'Activity booking options fetched', {
        bookingOptions,
      }),
    );
  },
);
