import type { ErrorRequestHandler } from 'express';
import { config } from '../config/env';
import { logger } from '../config/logger';
import { ApiError } from '../utils/api-error';
import { HTTP_STATUS } from '../utils/constants';

export const errorMiddleware: ErrorRequestHandler = (error, req, res, _next) => {
  const requestId = req.id ? String(req.id) : undefined;
  const apiError =
    error instanceof ApiError
      ? error
      : ApiError.internal(error.message || 'Internal server error');

  logger.error(
    {
      error,
      method: req.method,
      path: req.originalUrl,
      requestId,
    },
    'Request failed',
  );

  res.status(apiError.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: apiError.message,
    requestId,
    ...(apiError.details ? { details: apiError.details } : {}),
    ...(!config.isProduction ? { stack: apiError.stack } : {}),
  });
};
