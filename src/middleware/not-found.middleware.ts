import type { RequestHandler } from 'express';
import { ApiError } from '../utils/api-error';
import { HTTP_STATUS } from '../utils/constants';

export const notFoundMiddleware: RequestHandler = (req, _res, next) => {
  next(new ApiError(HTTP_STATUS.NOT_FOUND, `Route not found: ${req.originalUrl}`));
};
