import crypto from 'crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { Types } from 'mongoose';
import { config } from '../config/env';
import { RefreshTokenModel } from '../database/models/refresh-token.model';
import { ApiError } from '../utils/api-error';
import { HTTP_STATUS } from '../utils/constants';

export type AccessTokenPayload = {
  sub: string;
  email: string;
};

export type RefreshTokenPayload = {
  sub: string;
  tokenId: string;
};

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const signToken = (
  payload: string | object | Buffer,
  secret: string,
  expiresIn: string,
): string => {
  return jwt.sign(payload, secret, {
    expiresIn,
  } as SignOptions);
};

export const signAccessToken = (payload: AccessTokenPayload): string => {
  return signToken(payload, config.auth.accessTokenSecret, config.auth.accessTokenExpiresIn);
};

export const signRefreshToken = async (userId: string): Promise<string> => {
  const tokenId = new Types.ObjectId().toString();
  const refreshToken = signToken(
    { sub: userId, tokenId },
    config.auth.refreshTokenSecret,
    config.auth.refreshTokenExpiresIn,
  );
  const decoded = jwt.decode(refreshToken);
  const expiresAt =
    decoded && typeof decoded === 'object' && typeof decoded.exp === 'number'
      ? new Date(decoded.exp * 1000)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await RefreshTokenModel.create({
    userId,
    tokenHash: hashToken(refreshToken),
    expiresAt,
  });

  return refreshToken;
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, config.auth.accessTokenSecret) as AccessTokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, config.auth.refreshTokenSecret) as RefreshTokenPayload;
};

export const rotateRefreshToken = async (
  refreshToken: string,
): Promise<{ userId: string; refreshToken: string }> => {
  const payload = verifyRefreshToken(refreshToken);
  const tokenHash = hashToken(refreshToken);
  const storedToken = await RefreshTokenModel.findOneAndDelete({
    userId: payload.sub,
    tokenHash,
    expiresAt: { $gt: new Date() },
  });

  if (!storedToken) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid refresh token');
  }

  const nextRefreshToken = await signRefreshToken(payload.sub);

  return {
    userId: payload.sub,
    refreshToken: nextRefreshToken,
  };
};

export const revokeRefreshToken = async (refreshToken: string): Promise<void> => {
  await RefreshTokenModel.deleteOne({
    tokenHash: hashToken(refreshToken),
  });
};
