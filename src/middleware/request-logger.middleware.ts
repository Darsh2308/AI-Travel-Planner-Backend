import crypto from 'crypto';
import pinoHttp from 'pino-http';
import { logger } from '../config/logger';
import { REQUEST_ID_HEADER } from '../utils/constants';

export const requestLoggerMiddleware = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const existingRequestId = req.headers[REQUEST_ID_HEADER];
    const requestId =
      typeof existingRequestId === 'string'
        ? existingRequestId
        : crypto.randomUUID();

    res.setHeader(REQUEST_ID_HEADER, requestId);
    return requestId;
  },
  customLogLevel: (_req, res, error) => {
    if (error || res.statusCode >= 500) {
      return 'error';
    }

    if (res.statusCode >= 400) {
      return 'warn';
    }

    return 'info';
  },
});
