import express from 'express';
import { otpLimiter, resendLimiter } from '../middleware/ratelimiter.js';
import { validateEmail, validatePhone } from '../middleware/validation.js';

export const createAuthRoutes = (authController) => {
  const router = express.Router();

  // Email Login Routes
  router.post('/login', otpLimiter, validateEmail, authController.emailLogin);
  router.post('/verify-otp', authController.verifyEmailOTP);
  router.post('/resend-otp', resendLimiter, authController.resendEmailOTP);

  // Phone Login Routes
  router.post('/login-phone', otpLimiter, validatePhone, authController.phoneLogin);
  router.post('/verify-phone-otp', authController.verifyPhoneOTP);
  router.post('/resend-phone-otp', resendLimiter, authController.resendPhoneOTP);

  return router;
};