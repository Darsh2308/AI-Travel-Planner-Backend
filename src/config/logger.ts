import pino from 'pino';
import { config } from './env';

export const logger = pino({
  level: config.logger.level,
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie'],
    remove: true,
  },
});
