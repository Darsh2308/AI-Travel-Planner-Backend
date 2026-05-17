import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import * as assistantController from './assistant.controller';

export const assistantRoutes = Router();

assistantRoutes.use(authMiddleware);
assistantRoutes.post('/optimize-trip', assistantController.optimizeTripController);
assistantRoutes.post('/check-conflicts', assistantController.checkConflictsController);
assistantRoutes.post(
  '/recommend-alternatives',
  assistantController.recommendAlternativesController,
);
assistantRoutes.get('/trips/:tripId/score', assistantController.scoreController);
