import express from 'express';
import { bookingLimiter } from '../middleware/ratelimiter.js';

export const createBookingRoutes = (bookingController, authMiddleware, uploadMiddleware) => {
  const router = express.Router();

  // Booking management routes
  router.post('/create', bookingLimiter, authMiddleware, bookingController.createBooking);
  router.get('/details', bookingController.getBookingDetails);
  router.put('/personal-details', bookingLimiter, authMiddleware, bookingController.updatePersonalDetails);
  
  // Guest management routes
  router.post('/add-guest', bookingLimiter, authMiddleware, bookingController.addGuest);
  router.put('/update-guest', bookingLimiter, authMiddleware, bookingController.updateGuest);
  router.delete('/delete-guest', bookingLimiter, authMiddleware, bookingController.deleteGuest);
  
  // Document upload route
  router.post('/upload-id', bookingLimiter, uploadMiddleware, async (req, res) => {
    // This would be implemented with file upload logic
    res.json({ success: true, message: 'File upload endpoint - implement with multer' });
  });

  return router;
};
