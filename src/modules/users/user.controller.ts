import type { RequestHandler } from 'express';
import * as userService from '../../services/user.service';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';
import { HTTP_STATUS } from '../../utils/constants';
import { validate } from '../../utils/validate';
import {
  updatePreferencesDto,
  updateProfileDto,
} from './dto/updateProfile.dto';

const getAuthenticatedUserId = (req: Parameters<RequestHandler>[0]): string => {
  if (!req.user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
  }

  return req.user.id;
};

export const getProfile: RequestHandler = asyncHandler(async (req, res) => {
  const profile = await userService.getProfile(getAuthenticatedUserId(req));

  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, 'Profile fetched', { profile }));
});

export const updateProfile: RequestHandler = asyncHandler(async (req, res) => {
  const dto = validate(updateProfileDto, req.body);
  const profile = await userService.updateProfile(getAuthenticatedUserId(req), dto);

  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, 'Profile updated', { profile }));
});

export const updatePreferences: RequestHandler = asyncHandler(async (req, res) => {
  const dto = validate(updatePreferencesDto, req.body);
  const profile = await userService.updatePreferences(
    getAuthenticatedUserId(req),
    dto,
  );

  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, 'Preferences updated', { profile }));
});
