import express from 'express';
import {
  getBookingById,
  getAllBookings,
  updateBooking,
  deleteBooking,
  createBookingController,
  getBookingStats,
  getBookingByEmail,
  cleanupExpiredBookings,
  cleanupExpiredHoldsAndFailedPayments,
  checkAvailabilityController,
} from './booking.controller.js';
import { verifyToken, adminMiddleware , optionalVerifyToken } from '../../core/middlewares/authMiddleware.js';


const router = express.Router();


router
  .route('/')
  .post(optionalVerifyToken, createBookingController)   
  .get(verifyToken, adminMiddleware, getAllBookings);    


router.get('/stats', getBookingStats);                  

router.get('/by-email', getBookingByEmail);              

router.post('/check-availability', checkAvailabilityController);  

router.post('/cleanup-expired', cleanupExpiredBookings);  
router.post('/cleanup-holds', cleanupExpiredHoldsAndFailedPayments);  

router
  .route('/:id')
  .get(getBookingById)                                     
  .put(verifyToken, adminMiddleware, updateBooking)       
  .delete(verifyToken, adminMiddleware, deleteBooking);
  
export default router;
