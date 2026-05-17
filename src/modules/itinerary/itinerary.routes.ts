import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import * as itineraryController from './itinerary.controller';

export const itineraryRoutes = Router();

itineraryRoutes.use(authMiddleware);
itineraryRoutes.post(
  '/trips/:tripId/activities',
  itineraryController.addActivityController,
);
itineraryRoutes.patch(
  '/trips/:tripId/activities/:activityId',
  itineraryController.updateActivityController,
);
itineraryRoutes.delete(
  '/trips/:tripId/activities/:activityId',
  itineraryController.removeActivityController,
);
itineraryRoutes.patch(
  '/trips/:tripId/itinerary/day/:day/regenerate',
  itineraryController.regenerateDayController,
);
