import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import * as aiController from './ai.controller';

export const aiRoutes = Router();

aiRoutes.use(authMiddleware);
aiRoutes.post('/trips/generate', aiController.generateTripPlan);
