const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment');

router.post('/create-checkout-session', paymentController.createCheckoutSession);
router.get('/check-payment-status/:paymentId', paymentController.checkPaymentStatus);

module.exports = router; 