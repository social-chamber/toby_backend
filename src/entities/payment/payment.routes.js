import express from 'express'
import { getBookingDetails, payment } from './payment.controller.js'


const router = express.Router()

router.post('/payment-intent', payment)
router.get('/booking/:bookingId',getBookingDetails)


export default router