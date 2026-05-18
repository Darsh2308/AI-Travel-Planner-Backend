import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { getAnalyticsSummary } from './analytics.controller';

export const analyticsRoutes = Router();

analyticsRoutes.use(authMiddleware);
analyticsRoutes.get('/', getAnalyticsSummary);
