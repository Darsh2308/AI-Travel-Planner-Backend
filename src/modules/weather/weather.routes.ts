import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import * as weatherController from './weather.controller';

export const weatherRoutes = Router();

weatherRoutes.use(authMiddleware);
weatherRoutes.get('/trips/:tripId/weather', weatherController.getTripWeather);
weatherRoutes.post('/trips/:tripId/weather/review', weatherController.reviewWeather);
weatherRoutes.post(
  '/trips/:tripId/regenerate-weather-impacted-day',
  weatherController.regenerateWeatherImpactedDay,
);
