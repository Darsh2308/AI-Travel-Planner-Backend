import type { LoginDto } from '../modules/auth/dto/login.dto';
import type { RegisterDto } from '../modules/auth/dto/register.dto';
import * as authService from '../services/auth.service';
import { UserModel } from '../database/models/user.model';
import { comparePassword, hashPassword } from '../services/password.service';
import {
  rotateRefreshToken,
  signAccessToken,
  signRefreshToken,
} from '../services/token.service';

jest.mock('../database/models/user.model', () => ({
  UserModel: {
    exists: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
  },
}));

jest.mock('../services/password.service', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}));

jest.mock('../services/token.service', () => ({
  rotateRefreshToken: jest.fn(),
  revokeRefreshToken: jest.fn(),
  signAccessToken: jest.fn(),
  signRefreshToken: jest.fn(),
}));

const mockedUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockedHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>;
const mockedComparePassword = comparePassword as jest.MockedFunction<
  typeof comparePassword
>;
const mockedSignAccessToken = signAccessToken as jest.MockedFunction<
  typeof signAccessToken
>;
const mockedSignRefreshToken = signRefreshToken as jest.MockedFunction<
  typeof signRefreshToken
>;
const mockedRotateRefreshToken = rotateRefreshToken as jest.MockedFunction<
  typeof rotateRefreshToken
>;

const userDocument = {
  _id: { toString: () => 'user-id' },
  fullName: 'Test User',
  email: 'test@example.com',
  phone: '',
  country: '',
  city: '',
  avatarUrl: '',
  isEmailVerified: false,
  passwordHash: 'hash',
  preferences: {},
  budgetLedger: {},
  isActive: true,
} as never;

const registerDto: RegisterDto = {
  fullName: 'Test User',
  email: 'test@example.com',
  password: 'Password1',
  phone: '',
  country: '',
  city: '',
  avatarUrl: '',
};

describe('auth service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedSignAccessToken.mockReturnValue('access-token');
    mockedSignRefreshToken.mockResolvedValue('refresh-token');
  });

  it('registers a new user successfully', async () => {
    mockedUserModel.exists.mockResolvedValueOnce(null);
    mockedHashPassword.mockResolvedValueOnce('password-hash');
    mockedUserModel.create.mockResolvedValueOnce(userDocument);

    const result = await authService.register(registerDto);

    expect(mockedHashPassword).toHaveBeenCalledWith('Password1');
    expect(result.tokens).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(result.user.email).toBe('test@example.com');
  });

  it('rejects duplicate registration emails with conflict status', async () => {
    mockedUserModel.exists.mockResolvedValueOnce({
      _id: { toString: () => 'existing-user-id' },
    } as never);

    const result = authService.register(registerDto);

    await expect(result).rejects.toThrow('Email is already registered');
    await expect(result).rejects.toMatchObject({ statusCode: 409 });
  });

  it('logs in a user successfully', async () => {
    mockedUserModel.findOne.mockReturnValueOnce({
      select: jest.fn().mockResolvedValueOnce(userDocument),
    } as never);
    mockedComparePassword.mockResolvedValueOnce(true);

    const dto: LoginDto = {
      email: 'test@example.com',
      password: 'Password1',
    };

    const result = await authService.login(dto);

    expect(mockedComparePassword).toHaveBeenCalledWith('Password1', 'hash');
    expect(result.tokens.accessToken).toBe('access-token');
  });

  it('rejects login for a nonexistent user', async () => {
    mockedUserModel.findOne.mockReturnValueOnce({
      select: jest.fn().mockResolvedValueOnce(null),
    } as never);

    await expect(
      authService.login({
        email: 'missing@example.com',
        password: 'Password1',
      }),
    ).rejects.toThrow('Invalid email or password');
  });

  it('rejects login with a wrong password', async () => {
    mockedUserModel.findOne.mockReturnValueOnce({
      select: jest.fn().mockResolvedValueOnce(userDocument),
    } as never);
    mockedComparePassword.mockResolvedValueOnce(false);

    await expect(
      authService.login({
        email: 'test@example.com',
        password: 'WrongPassword1',
      }),
    ).rejects.toThrow('Invalid email or password');
  });

  it('rotates refresh tokens', async () => {
    mockedRotateRefreshToken.mockResolvedValueOnce({
      userId: 'user-id',
      refreshToken: 'next-refresh-token',
    });
    mockedUserModel.findOne.mockResolvedValueOnce(userDocument);

    const result = await authService.refresh('old-refresh-token');

    expect(mockedRotateRefreshToken).toHaveBeenCalledWith('old-refresh-token');
    expect(result.tokens).toEqual({
      accessToken: 'access-token',
      refreshToken: 'next-refresh-token',
    });
  });
});
