import jwt from 'jsonwebtoken';
import { UserModel } from '../database/models/user.model';
import { asyncHandler } from '../utils/async-handler';
import { ApiError } from '../utils/api-error';
import { HTTP_STATUS } from '../utils/constants';
import { verifyAccessToken } from '../services/token.service';

export const authMiddleware = asyncHandler(async (req, _res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authorization token is required');
  }

  const token = authorization.slice('Bearer '.length);

  try {
    const payload = verifyAccessToken(token);
    const user = await UserModel.findOne({
      _id: payload.sub,
      isActive: true,
    });

    if (!user) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid authorization token');
    }

    req.user = {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      country: user.country,
      city: user.city,
      avatarUrl: user.avatarUrl,
      isEmailVerified: user.isEmailVerified,
      preferences: user.preferences,
      budgetLedger: user.budgetLedger,
      isActive: user.isActive,
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authorization token expired');
    }

    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid authorization token');
  }
});
