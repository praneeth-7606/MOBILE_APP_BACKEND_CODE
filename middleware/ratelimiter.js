// import rateLimit from 'express-rate-limit';

// export const generalLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 200, // Increased for production
//   message: { success: false, message: 'Too many requests, please try again later.' },
//   standardHeaders: true,
//   legacyHeaders: false
// });

// export const otpLimiter = rateLimit({
//   windowMs: 5 * 60 * 1000, // 5 minutes
//   max: 10, // Increased for production
//   message: { success: false, message: 'Too many OTP requests, please try again later.' }
// });

// export const resendLimiter = rateLimit({
//   windowMs: 1 * 60 * 1000, // 1 minute window
//   max: 5, // Allow 5 resend attempts per minute
//   message: { success: false, message: 'Too many resend requests, please wait before trying again.' }
// });

import rateLimit from 'express-rate-limit';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

export const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10,
  message: { success: false, message: 'Too many OTP requests, please try again later.' }
});

export const resendLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
  message: { success: false, message: 'Too many resend requests, please wait before trying again.' }
});

export const bookingLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20,
  message: { success: false, message: 'Too many booking requests, please try again later.' }
});