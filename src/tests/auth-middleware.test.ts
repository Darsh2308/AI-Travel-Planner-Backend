import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { UserModel } from '../database/models/user.model';
import { errorMiddleware } from '../middleware/error.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { requestLoggerMiddleware } from '../middleware/request-logger.middleware';
import { verifyAccessToken } from '../services/token.service';

jest.mock('../database/models/user.model', () => ({
  UserModel: {
    findOne: jest.fn(),
  },
}));

jest.mock('../services/token.service', () => ({
  verifyAccessToken: jest.fn(),
}));

const mockedUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockedVerifyAccessToken = verifyAccessToken as jest.MockedFunction<
  typeof verifyAccessToken
>;

const buildApp = () => {
  const app = express();
  app.use(requestLoggerMiddleware);
  app.get('/protected', authMiddleware, (req, res) => {
    res.json({ user: req.user });
  });
  app.use(errorMiddleware);
  return app;
};

describe('auth middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows requests with a valid token', async () => {
    mockedVerifyAccessToken.mockReturnValueOnce({
      sub: 'user-id',
      email: 'test@example.com',
    });
    mockedUserModel.findOne.mockResolvedValueOnce({
      _id: { toString: () => 'user-id' },
      fullName: 'Test User',
      email: 'test@example.com',
      phone: '',
      country: '',
      city: '',
      avatarUrl: '',
      isEmailVerified: false,
      preferences: {},
      budgetLedger: {},
      isActive: true,
    } as never);

    const response = await request(buildApp())
      .get('/protected')
      .set('Authorization', 'Bearer valid-token')
      .expect(200);

    expect(response.body.user.email).toBe('test@example.com');
  });

  it('rejects invalid tokens', async () => {
    mockedVerifyAccessToken.mockImplementationOnce(() => {
      throw new jwt.JsonWebTokenError('invalid token');
    });

    const response = await request(buildApp())
      .get('/protected')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);

    expect(response.body.message).toBe('Invalid authorization token');
  });

  it('rejects expired tokens', async () => {
    mockedVerifyAccessToken.mockImplementationOnce(() => {
      throw new jwt.TokenExpiredError('jwt expired', new Date());
    });

    const response = await request(buildApp())
      .get('/protected')
      .set('Authorization', 'Bearer expired-token')
      .expect(401);

    expect(response.body.message).toBe('Authorization token expired');
  });
});
