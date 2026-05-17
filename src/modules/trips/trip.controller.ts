import type { RequestHandler } from 'express';
import * as tripService from '../../services/trip.service';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';
import { HTTP_STATUS } from '../../utils/constants';
import { validate } from '../../utils/validate';
import { createTripDto } from './dto/createTrip.dto';
import { updateTripDto } from './dto/updateTrip.dto';

const getAuthenticatedUserId = (req: Parameters<RequestHandler>[0]): string => {
  if (!req.user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
  }

  return req.user.id;
};

const getTripId = (req: Parameters<RequestHandler>[0]): string => {
  const { tripId } = req.params;

  if (typeof tripId !== 'string') {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid tripId');
  }

  return tripId;
};

export const createTrip: RequestHandler = asyncHandler(async (req, res) => {
  const dto = validate(createTripDto, req.body);
  const trip = await tripService.createTrip(getAuthenticatedUserId(req), dto);

  res
    .status(HTTP_STATUS.CREATED)
    .json(new ApiResponse(HTTP_STATUS.CREATED, 'Trip created', { trip }));
});

export const listTrips: RequestHandler = asyncHandler(async (req, res) => {
  const trips = await tripService.listTrips(getAuthenticatedUserId(req));

  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, 'Trips fetched', { trips }));
});

export const getTripById: RequestHandler = asyncHandler(async (req, res) => {
  const trip = await tripService.getTripById(
    getAuthenticatedUserId(req),
    getTripId(req),
  );

  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, 'Trip fetched', { trip }));
});

export const updateTrip: RequestHandler = asyncHandler(async (req, res) => {
  const dto = validate(updateTripDto, req.body);
  const trip = await tripService.updateTrip(
    getAuthenticatedUserId(req),
    getTripId(req),
    dto,
  );

  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, 'Trip updated', { trip }));
});

export const deleteTrip: RequestHandler = asyncHandler(async (req, res) => {
  await tripService.deleteTrip(getAuthenticatedUserId(req), getTripId(req));

  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, 'Trip deleted'));
});
