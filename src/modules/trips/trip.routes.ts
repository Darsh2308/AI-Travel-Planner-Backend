import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import * as tripController from './trip.controller';

export const tripRoutes = Router();

tripRoutes.use(authMiddleware);
tripRoutes.post('/', tripController.createTrip);
tripRoutes.get('/', tripController.listTrips);
tripRoutes.get('/:tripId', tripController.getTripById);
tripRoutes.patch('/:tripId', tripController.updateTrip);
tripRoutes.delete('/:tripId', tripController.deleteTrip);
