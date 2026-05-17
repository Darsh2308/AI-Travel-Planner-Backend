import express from 'express';
import request from 'supertest';
import { errorMiddleware } from '../middleware/error.middleware';
import { requestLoggerMiddleware } from '../middleware/request-logger.middleware';
import { ApiError } from '../utils/api-error';

describe('error middleware', () => {
  it('returns ApiError details consistently', async () => {
    const app = express();
    app.use(requestLoggerMiddleware);
    app.get('/boom', () => {
      throw new ApiError(400, 'Invalid request', { field: 'tripId' });
    });
    app.use(errorMiddleware);

    const response = await request(app).get('/boom').expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: 'Invalid request',
      details: {
        field: 'tripId',
      },
    });
    expect(response.body.requestId).toBeDefined();
  });
});
