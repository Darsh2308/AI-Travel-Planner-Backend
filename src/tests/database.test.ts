import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../database/connection';

jest.mock('mongoose', () => ({
  __esModule: true,
  default: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    connection: {
      name: 'test',
      readyState: 1,
      on: jest.fn(),
    },
  },
}));

const mockedMongoose = mongoose as jest.Mocked<typeof mongoose>;

describe('database connection', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('throws when MongoDB is unavailable', async () => {
    const error = new Error('database unavailable');
    mockedMongoose.connect.mockRejectedValueOnce(error);

    await expect(connectDatabase()).rejects.toThrow('database unavailable');
  });

  it('disconnects when a connection is active', async () => {
    mockedMongoose.disconnect.mockResolvedValueOnce(undefined);

    await disconnectDatabase();

    expect(mockedMongoose.disconnect).toHaveBeenCalledTimes(1);
  });
});
