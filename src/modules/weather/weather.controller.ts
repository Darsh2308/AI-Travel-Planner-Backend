import type { RequestHandler } from 'express';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';
import { HTTP_STATUS } from '../../utils/constants';
import { validate } from '../../utils/validate';
import {
  regenerateWeatherImpactedDayDto,
  weatherReviewDto,
} from './weather.dto';
import * as weatherService from './weather.service';

const getUserId = (req: Parameters<RequestHandler>[0]) => {
  if (!req.user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
  }

  return req.user.id;
};

const getTripId = (req: Parameters<RequestHandler>[0]) => {
  const { tripId } = req.params;

  if (typeof tripId !== 'string') {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid tripId');
  }

  return tripId;
};

export const getTripWeather: RequestHandler = asyncHandler(async (req, res) => {
  const trip = await weatherService.enrichTripWeather(getUserId(req), getTripId(req));

  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, 'Weather enriched', { trip }));
});

export const reviewWeather: RequestHandler = asyncHandler(async (req, res) => {
  const dto = validate(weatherReviewDto, req.body);
  const trip = await weatherService.reviewWeatherCheckpoint(
    getUserId(req),
    getTripId(req),
    dto,
  );

  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, 'Weather review saved', { trip }));
});

export const regenerateWeatherImpactedDay: RequestHandler = asyncHandler(
  async (req, res) => {
    const dto = validate(regenerateWeatherImpactedDayDto, req.body);
    const trip = await weatherService.regenerateWeatherImpactedDay(
      getUserId(req),
      getTripId(req),
      dto.affectedDay,
    );

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse(HTTP_STATUS.OK, 'Weather impacted day regenerated', {
        trip,
      }),
    );
  },
);
