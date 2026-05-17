import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import * as budgetController from './budget.controller';

export const budgetRoutes = Router();

budgetRoutes.use(authMiddleware);
budgetRoutes.get('/', budgetController.getBudget);
budgetRoutes.put('/', budgetController.updateBudget);
budgetRoutes.post('/allocate', budgetController.allocateBudget);
budgetRoutes.post('/release', budgetController.releaseBudget);
budgetRoutes.get('/ledger', budgetController.getLedger);
