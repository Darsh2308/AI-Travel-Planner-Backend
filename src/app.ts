import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { env } from './config/env';
import { openApiDocument } from './docs/openapi';
import { errorMiddleware } from './middleware/error.middleware';
import { notFoundMiddleware } from './middleware/not-found.middleware';
import { requestLoggerMiddleware } from './middleware/request-logger.middleware';
import { authRoutes } from './modules/auth/auth.routes';
import { assistantRoutes } from './modules/assistant/assistant.routes';
import { aiRoutes } from './modules/ai/ai.routes';
import { activityRoutes } from './modules/activities/activity.routes';
import { budgetRoutes } from './modules/budget/budget.routes';
import { hotelRoutes } from './modules/hotels/hotel.routes';
import { itineraryRoutes } from './modules/itinerary/itinerary.routes';
import { tripRoutes } from './modules/trips/trip.routes';
import { userRoutes } from './modules/users/user.routes';
import { weatherRoutes } from './modules/weather/weather.routes';
import { ApiResponse } from './utils/api-response';
import { HTTP_STATUS } from './utils/constants';

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'script-src': ["'self'", 'https://cdn.jsdelivr.net'],
        'style-src': ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
        'connect-src': ["'self'"],
      },
    },
  }),
);
app.use(
  cors({
    origin: env.frontendUrl || true,
    credentials: true,
  }),
);
app.use(compression());
app.use(express.json());
app.use(cookieParser());
app.use(requestLoggerMiddleware);

app.get('/health', (_, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  const status = dbReady ? HTTP_STATUS.OK : 503;
  res.status(status).json(
    new ApiResponse(status, dbReady ? 'Server is healthy' : 'Database unavailable', {
      status: dbReady ? 'ok' : 'degraded',
      db: dbReady ? 'connected' : 'disconnected',
    }),
  );
});

app.get('/openapi.json', (_, res) => {
  res.json(openApiDocument);
});

app.get('/docs', (_, res) => {
  res.type('html').send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>AI Travel Planner API Docs</title>
  </head>
  <body>
    <script id="api-reference" data-url="/openapi.json"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`);
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/assistant', assistantRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/budget', budgetRoutes);
app.use('/api/v1/trips', tripRoutes);
app.use('/api/v1', weatherRoutes);
app.use('/api/v1', hotelRoutes);
app.use('/api/v1', activityRoutes);
app.use('/api/v1', itineraryRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
