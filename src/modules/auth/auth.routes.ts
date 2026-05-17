import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import * as authController from './auth.controller';

export const authRoutes = Router();

authRoutes.post('/register', authController.register);
authRoutes.post('/login', authController.login);
authRoutes.post('/logout', authController.logout);
authRoutes.post('/refresh', authController.refresh);
authRoutes.get('/me', authMiddleware, authController.me);
