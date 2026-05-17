import mongoose from 'mongoose';
import { dbConfig } from '../config/db';
import { logger } from '../config/logger';

let reconnectAttempts = 0;

export const connectDatabase = async (): Promise<typeof mongoose> => {
  try {
    const connection = await mongoose.connect(dbConfig.uri, {
      dbName: dbConfig.dbName,
      connectTimeoutMS: dbConfig.connectTimeoutMs,
      serverSelectionTimeoutMS: dbConfig.serverSelectionTimeoutMs,
    });

    reconnectAttempts = 0;
    logger.info({ database: connection.connection.name }, 'MongoDB connected');

    return connection;
  } catch (error) {
    logger.error({ error }, 'MongoDB connection failed');
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
};

export const registerDatabaseEventHandlers = (): void => {
  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    reconnectAttempts = 0;
    logger.info('MongoDB reconnected');
  });

  mongoose.connection.on('error', (error) => {
    logger.error({ error }, 'MongoDB connection error');
  });
};

export const reconnectDatabase = async (): Promise<void> => {
  if (reconnectAttempts >= dbConfig.maxReconnectAttempts) {
    logger.error(
      { attempts: reconnectAttempts },
      'MongoDB reconnect attempts exhausted',
    );
    return;
  }

  reconnectAttempts += 1;
  logger.warn({ attempt: reconnectAttempts }, 'Attempting MongoDB reconnect');

  await new Promise((resolve) => {
    setTimeout(resolve, dbConfig.reconnectDelayMs);
  });

  await connectDatabase();
};
