import type { RequestHandler } from 'express';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';
import { HTTP_STATUS } from '../../utils/constants';
import { validate } from '../../utils/validate';
import { addActivityDto } from './addActivity.dto';
import { regenerateDayDto } from './regenerateDay.dto';
import { removeActivityDto } from './removeActivity.dto';
import { updateActivityDto } from './updateActivity.dto';
import * as itineraryService from './itinerary.service';

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

export const addActivityController: RequestHandler = asyncHandler(
  async (req, res) => {
    const dto = validate(addActivityDto, req.body);
    const trip = await itineraryService.addActivity(
      getUserId(req),
      getParam(req, 'tripId'),
      dto,
    );

    res
      .status(HTTP_STATUS.CREATED)
      .json(new ApiResponse(HTTP_STATUS.CREATED, 'Activity added', { trip }));
  },
);

export const updateActivityController: RequestHandler = asyncHandler(
  async (req, res) => {
    const dto = validate(updateActivityDto, req.body);
    const trip = await itineraryService.updateActivity(
      getUserId(req),
      getParam(req, 'tripId'),
      getParam(req, 'activityId'),
      dto,
    );

    res
      .status(HTTP_STATUS.OK)
      .json(new ApiResponse(HTTP_STATUS.OK, 'Activity updated', { trip }));
  },
);

export const removeActivityController: RequestHandler = asyncHandler(
  async (req, res) => {
    const dto = validate(removeActivityDto, req.body);
    const trip = await itineraryService.removeActivity(
      getUserId(req),
      getParam(req, 'tripId'),
      getParam(req, 'activityId'),
      dto,
    );

    res
      .status(HTTP_STATUS.OK)
      .json(new ApiResponse(HTTP_STATUS.OK, 'Activity removed', { trip }));
  },
);

export const regenerateDayController: RequestHandler = asyncHandler(
  async (req, res) => {
    const body = validate(regenerateDayDto, {
      ...req.body,
      dayNumber: Number(req.params.day),
    });
    const trip = await itineraryService.regenerateDay(
      getUserId(req),
      getParam(req, 'tripId'),
      body,
    );

    res
      .status(HTTP_STATUS.OK)
      .json(new ApiResponse(HTTP_STATUS.OK, 'Day regenerated', { trip }));
  },
);
