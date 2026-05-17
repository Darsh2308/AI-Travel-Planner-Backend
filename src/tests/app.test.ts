import request from 'supertest';
import app from '../app';

describe('app routes and middleware', () => {
  it('returns a healthy response', async () => {
    const response = await request(app).get('/health').expect(200);

    expect(response.body).toMatchObject({
      success: true,
      statusCode: 200,
      message: 'Server is healthy',
      data: {
        status: 'ok',
      },
    });
    expect(response.headers['x-request-id']).toBeDefined();
  });

  it('returns a structured 404 response for unknown routes', async () => {
    const response = await request(app).get('/missing-route').expect(404);

    expect(response.body).toMatchObject({
      success: false,
      message: 'Route not found: /missing-route',
    });
    expect(response.body.requestId).toBeDefined();
  });
});
