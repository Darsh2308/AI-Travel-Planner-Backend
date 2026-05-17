import type { ZodType } from 'zod';
import { ApiError } from './api-error';
import { HTTP_STATUS } from './constants';

export const validate = <T>(parser: ZodType<T>, data: unknown): T => {
  const result = parser.safeParse(data);

  if (!result.success) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Validation failed', result.error);
  }

  return result.data;
};
