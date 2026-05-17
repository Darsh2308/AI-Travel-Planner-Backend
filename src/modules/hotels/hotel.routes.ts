import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import * as hotelController from './hotel.controller';

export const hotelRoutes = Router();

hotelRoutes.use(authMiddleware);
hotelRoutes.post('/trips/:tripId/hotels/enrich', hotelController.enrichHotels);
hotelRoutes.get('/trips/:tripId/hotels', hotelController.getHotels);
hotelRoutes.get(
  '/trips/:tripId/hotels/:hotelId/booking-options',
  hotelController.getHotelBookingOptions,
);
