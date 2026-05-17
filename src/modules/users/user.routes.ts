import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import * as userController from './user.controller';

export const userRoutes = Router();

userRoutes.use(authMiddleware);
userRoutes.get('/profile', userController.getProfile);
userRoutes.patch('/profile', userController.updateProfile);
userRoutes.patch('/profile/preferences', userController.updatePreferences);
