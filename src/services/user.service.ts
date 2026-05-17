import { UserModel, type UserDocument } from '../database/models/user.model';
import type {
  UpdatePreferencesDto,
  UpdateProfileDto,
} from '../modules/users/dto/updateProfile.dto';
import { ApiError } from '../utils/api-error';
import { HTTP_STATUS } from '../utils/constants';
import { normalizeLedger } from './budget.service';

export type UserProfile = {
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

const toUserProfile = (user: UserDocument): UserProfile => ({
  id: user._id.toString(),
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  country: user.country,
  city: user.city,
  avatarUrl: user.avatarUrl,
  isEmailVerified: user.isEmailVerified,
  preferences: user.preferences,
  budgetLedger: normalizeLedger(user.budgetLedger),
  isActive: user.isActive,
});

export const getProfile = async (userId: string): Promise<UserProfile> => {
  const user = await UserModel.findOne({
    _id: userId,
    isActive: true,
  });

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
  }

  return toUserProfile(user);
};

export const updateProfile = async (
  userId: string,
  dto: UpdateProfileDto,
): Promise<UserProfile> => {
  const user = await UserModel.findOneAndUpdate(
    {
      _id: userId,
      isActive: true,
    },
    {
      $set: dto,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
  }

  return toUserProfile(user);
};

export const updatePreferences = async (
  userId: string,
  dto: UpdatePreferencesDto,
): Promise<UserProfile> => {
  const user = await UserModel.findOneAndUpdate(
    {
      _id: userId,
      isActive: true,
    },
    {
      $set: {
        preferences: dto.preferences,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
  }

  return toUserProfile(user);
};
