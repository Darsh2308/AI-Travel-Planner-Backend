import { UserModel, type UserDocument } from '../database/models/user.model';
import type { LoginDto } from '../modules/auth/dto/login.dto';
import type { RegisterDto } from '../modules/auth/dto/register.dto';
import { ApiError } from '../utils/api-error';
import { HTTP_STATUS } from '../utils/constants';
import { comparePassword, hashPassword } from './password.service';
import {
  rotateRefreshToken,
  revokeRefreshToken,
  signAccessToken,
  signRefreshToken,
} from './token.service';

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  avatarUrl: string;
  isEmailVerified: boolean;
  preferences: unknown;
  budgetLedger: unknown;
  isActive: boolean;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

const toAuthUser = (user: UserDocument): AuthUser => ({
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
});

const issueTokens = async (user: UserDocument): Promise<AuthTokens> => {
  const payload = {
    sub: user._id.toString(),
    email: user.email,
  };

  return {
    accessToken: signAccessToken(payload),
    refreshToken: await signRefreshToken(user._id.toString()),
  };
};

export const register = async (
  dto: RegisterDto,
): Promise<{ user: AuthUser; tokens: AuthTokens }> => {
  const existingUser = await UserModel.exists({ email: dto.email });

  if (existingUser) {
    throw new ApiError(HTTP_STATUS.CONFLICT, 'Email is already registered');
  }

  const user = await UserModel.create({
    fullName: dto.fullName,
    email: dto.email,
    passwordHash: await hashPassword(dto.password),
    phone: dto.phone,
    country: dto.country,
    city: dto.city,
    avatarUrl: dto.avatarUrl,
    isEmailVerified: false,
    preferences: dto.preferences ?? {},
    budgetLedger: dto.budgetLedger ?? {},
    isActive: true,
  });

  return {
    user: toAuthUser(user),
    tokens: await issueTokens(user),
  };
};

export const login = async (
  dto: LoginDto,
): Promise<{ user: AuthUser; tokens: AuthTokens }> => {
  const user = await UserModel.findOne({
    email: dto.email,
    isActive: true,
  }).select('+passwordHash');

  if (!user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid email or password');
  }

  const passwordMatches = await comparePassword(dto.password, user.passwordHash);

  if (!passwordMatches) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid email or password');
  }

  return {
    user: toAuthUser(user),
    tokens: await issueTokens(user),
  };
};

export const refresh = async (
  refreshToken: string,
): Promise<{ user: AuthUser; tokens: AuthTokens }> => {
  const rotated = await rotateRefreshToken(refreshToken);
  const user = await UserModel.findOne({
    _id: rotated.userId,
    isActive: true,
  });

  if (!user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid refresh token');
  }

  return {
    user: toAuthUser(user),
    tokens: {
      accessToken: signAccessToken({
        sub: user._id.toString(),
        email: user.email,
      }),
      refreshToken: rotated.refreshToken,
    },
  };
};

export const logout = async (refreshToken: string): Promise<void> => {
  await revokeRefreshToken(refreshToken);
};

export const getMe = async (userId: string): Promise<AuthUser> => {
  const user = await UserModel.findOne({
    _id: userId,
    isActive: true,
  });

  if (!user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'User is no longer active');
  }

  return toAuthUser(user);
};
