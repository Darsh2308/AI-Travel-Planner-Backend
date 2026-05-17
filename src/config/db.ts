import { config } from './env';

export const dbConfig = {
  uri: config.database.uri,
  dbName: config.database.dbName,
  connectTimeoutMs: 10000,
  serverSelectionTimeoutMs: 5000,
  maxReconnectAttempts: 5,
  reconnectDelayMs: 5000,
} as const;
