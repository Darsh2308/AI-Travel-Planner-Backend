import type { RequestHandler } from 'express';
import { ApiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';
import { HTTP_STATUS } from '../../utils/constants';
import { loginDto } from './dto/login.dto';
import { refreshDto } from './dto/refresh.dto';
import { registerDto } from './dto/register.dto';
import * as authService from '../../services/auth.service';
import { ApiError } from '../../utils/api-error';
import { validate } from '../../utils/validate';

export const register: RequestHandler = asyncHandler(async (req, res) => {
  const dto = validate(registerDto, req.body);
  const result = await authService.register(dto);

  res
    .status(HTTP_STATUS.CREATED)
    .json(new ApiResponse(HTTP_STATUS.CREATED, 'Registration successful', result));
});

export const login: RequestHandler = asyncHandler(async (req, res) => {
  const dto = validate(loginDto, req.body);
  const result = await authService.login(dto);

  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, 'Login successful', result));
});

export const logout: RequestHandler = asyncHandler(async (req, res) => {
  const dto = validate(refreshDto, req.body);
  await authService.logout(dto.refreshToken);

  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, 'Logout successful'));
});

export const refresh: RequestHandler = asyncHandler(async (req, res) => {
  const dto = validate(refreshDto, req.body);
  const result = await authService.refresh(dto.refreshToken);

  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, 'Token refreshed', result));
});

export const me: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
  }

  const user = await authService.getMe(req.user.id);

  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, 'Current user fetched', { user }));
});
