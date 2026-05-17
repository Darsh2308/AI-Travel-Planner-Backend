import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import * as activityController from './activity.controller';

export const activityRoutes = Router();

activityRoutes.use(authMiddleware);
activityRoutes.post('/trips/:tripId/activities/enrich', activityController.enrichActivities);
activityRoutes.get(
  '/trips/:tripId/activities/:activityId/booking-options',
  activityController.getActivityBookingOptions,
);
