import { HTTP_STATUS } from './constants';

export class ApiError extends Error {
  public readonly statusCode: number;

  public readonly isOperational: boolean;

  public readonly details?: unknown;

  constructor(
    statusCode: number,
    message: string,
    details?: unknown,
    isOperational = true,
  ) {
    super(message);

    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }

  static internal(message = 'Internal server error', details?: unknown) {
    return new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message,
      details,
      false,
    );
  }
}
