import { UserModel } from '../database/models/user.model';
import * as userService from '../services/user.service';

jest.mock('../database/models/user.model', () => ({
  UserModel: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

const mockedUserModel = UserModel as jest.Mocked<typeof UserModel>;

const userDocument = {
  _id: { toString: () => 'user-id' },
  fullName: 'Test User',
  email: 'test@example.com',
  phone: '',
  country: '',
  city: '',
  avatarUrl: '',
  isEmailVerified: false,
  preferences: {
    travelStyle: 'relaxed',
    hotelTier: 'standard',
    preferredCurrency: 'USD',
    dietaryPreferences: [],
    activityPreferences: [],
    avoidActivities: [],
  },
  budgetLedger: {
    currency: 'USD',
    totalBudget: 1000,
    allocatedBudget: 250,
    spentBudget: 0,
    remainingBudget: 750,
    entries: [],
  },
  isActive: true,
};

describe('user service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('gets a profile', async () => {
    mockedUserModel.findOne.mockResolvedValueOnce(userDocument as never);

    const profile = await userService.getProfile('user-id');

    expect(profile.email).toBe('test@example.com');
    expect(profile.budgetLedger).toMatchObject({
      totalBudget: 1000,
      remainingBudget: 750,
    });
  });

  it('updates a profile', async () => {
    mockedUserModel.findOneAndUpdate.mockResolvedValueOnce({
      ...userDocument,
      fullName: 'Updated User',
    } as never);

    const profile = await userService.updateProfile('user-id', {
      fullName: 'Updated User',
    });

    expect(profile.fullName).toBe('Updated User');
  });

  it('updates preferences', async () => {
    mockedUserModel.findOneAndUpdate.mockResolvedValueOnce({
      ...userDocument,
      preferences: {
        travelStyle: 'fast',
        hotelTier: 'standard',
        preferredCurrency: 'USD',
        dietaryPreferences: [],
        activityPreferences: [],
        avoidActivities: [],
      },
    } as never);

    const profile = await userService.updatePreferences('user-id', {
      preferences: {
        travelStyle: 'fast',
        hotelTier: 'standard',
        preferredCurrency: 'USD',
        dietaryPreferences: [],
        activityPreferences: [],
        avoidActivities: [],
      },
    });

    expect(profile.preferences).toMatchObject({ travelStyle: 'fast' });
  });
});
