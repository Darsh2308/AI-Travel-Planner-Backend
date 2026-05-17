import type { Server } from 'http';
import app from './app';
import { config } from './config/env';
import { logger } from './config/logger';
import {
  connectDatabase,
  disconnectDatabase,
  registerDatabaseEventHandlers,
} from './database/connection';

let server: Server | undefined;

const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
  logger.info({ signal }, 'Shutdown signal received');

  if (server) {
    await new Promise<void>((resolve, reject) => {
      server?.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }

  await disconnectDatabase();
  logger.info('Graceful shutdown complete');
  process.exit(0);
};

const startServer = async (): Promise<void> => {
  registerDatabaseEventHandlers();
  await connectDatabase();

  server = app.listen(config.port, () => {
    logger.info({ port: config.port }, 'Server running');
  });
};

process.on('SIGTERM', (signal) => {
  shutdown(signal).catch((error) => {
    logger.error({ error }, 'Graceful shutdown failed');
    process.exit(1);
  });
});

process.on('SIGINT', (signal) => {
  shutdown(signal).catch((error) => {
    logger.error({ error }, 'Graceful shutdown failed');
    process.exit(1);
  });
});

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught exception');
  process.exit(1);
});

startServer().catch((error) => {
  logger.fatal({ error }, 'Failed to start server');
  process.exit(1);
});
