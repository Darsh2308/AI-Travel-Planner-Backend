import type { RequestHandler } from 'express';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';
import { HTTP_STATUS } from '../../utils/constants';
import * as hotelService from './hotel.service';

const getUserId = (req: Parameters<RequestHandler>[0]) => {
  if (!req.user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
  }
  return req.user.id;
};

const getParam = (req: Parameters<RequestHandler>[0], key: string): string => {
  const value = req.params[key];

  if (typeof value !== 'string') {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Invalid ${key}`);
  }

  return value;
};

export const enrichHotels: RequestHandler = asyncHandler(async (req, res) => {
  const trip = await hotelService.enrichHotels(getUserId(req), getParam(req, 'tripId'));
  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, 'Hotels enriched', { trip }));
});

export const getHotels: RequestHandler = asyncHandler(async (req, res) => {
  const hotels = await hotelService.getHotels(getUserId(req), getParam(req, 'tripId'));
  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, 'Hotels fetched', { hotels }));
});

export const getHotelBookingOptions: RequestHandler = asyncHandler(
  async (req, res) => {
    const bookingOptions = await hotelService.getHotelBookingOptions(
      getUserId(req),
      getParam(req, 'tripId'),
      getParam(req, 'hotelId'),
    );
    res.status(HTTP_STATUS.OK).json(
      new ApiResponse(HTTP_STATUS.OK, 'Hotel booking options fetched', {
        bookingOptions,
      }),
    );
  },
);
