import express from 'express';
// import { AuthController } from '../controllers/authController.js';
import { AuthController } from '../controllers/authcontroller.js';
import { otpLimiter, resendLimiter } from '../middleware/ratelimiter.js';
import { validateEmailLogin, validatePhoneLogin, validateOTP } from '../middleware/validation.js';

export const createAuthRoutes = (pool) => {
  const router = express.Router();
  const authController = new AuthController(pool);

  // Email login routes
  router.post('/login', otpLimiter, validateEmailLogin, (req, res) => authController.emailLogin(req, res));
  router.post('/verify-otp', validateOTP, (req, res) => authController.verifyOTP(req, res));
  router.post('/resend-otp', resendLimiter, (req, res) => authController.resendOTP(req, res));

  // Phone login routes
  router.post('/login-phone', otpLimiter, validatePhoneLogin, (req, res) => authController.phoneLogin(req, res));
  router.post('/verify-phone-otp', validateOTP, (req, res) => authController.verifyOTP(req, res));
  router.post('/resend-phone-otp', resendLimiter, (req, res) => authController.resendOTP(req, res));

  return router;
};