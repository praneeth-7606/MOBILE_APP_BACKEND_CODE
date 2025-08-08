import validator from 'validator';
import { User } from '../models/user.js';

import { LoginSession } from '../models/loginsession.js';
import { generateJWT,createOTPSession } from '../utils/otpservice.js';

import { sendLoginOTP,sendPhoneOTP } from '../utils/emailservice.js';

import { formatResponse, maskEmail, maskPhone, log } from '../utils/helpers.js';
import { CONFIG } from '../config/database.js';

export class AuthController {
  constructor(pool) {
    this.pool = pool;
    this.userModel = new User(pool);
    this.sessionModel = new LoginSession(pool);
  }

  async emailLogin(req, res) {
    try {
      const { identifier } = req.body;
      
      // Find or create user
      const user = await this.userModel.findOrCreate(identifier, 'email');
      if (!user) {
        return res.status(500).json(formatResponse(false, 'Unable to process request'));
      }
      
      // Generate OTP and session
      const { sessionId, otp } = createOTPSession();
      
      // Store session
      await this.sessionModel.create(identifier, otp, sessionId, user.id, 'email', req);
      
      // Send OTP email
      const emailResult = await sendLoginOTP(identifier, otp);
      if (!emailResult.success) {
        log('warn', 'Failed to send email OTP', { email: identifier });
      }
      
      log('info', 'Email login initiated', { email: identifier, sessionId });
      
      res.json(formatResponse(true, 'Verification code sent to your email address', {
        sessionId,
        emailSent: maskEmail(identifier),
        loginType: 'email',
        devMode: CONFIG.NODE_ENV === 'development' ? { otp } : undefined
      }));
      
    } catch (error) {
      log('error', 'Email login error', { error: error.message });
      res.status(500).json(formatResponse(false, 'Internal server error'));
    }
  }

  async phoneLogin(req, res) {
    try {
      const { identifier } = req.body;
      
      // Find or create user
      const user = await this.userModel.findOrCreate(identifier, 'phone');
      if (!user) {
        return res.status(500).json(formatResponse(false, 'Unable to process request'));
      }
      
      // Generate OTP and session
      const { sessionId, otp } = createOTPSession();
      
      // Store session
      await this.sessionModel.create(identifier, otp, sessionId, user.id, 'phone', req);
      
      // Send OTP SMS
      const smsResult = await sendPhoneOTP(identifier, otp);
      if (!smsResult.success) {
        log('warn', 'Failed to send SMS OTP', { phone: identifier });
      }
      
      log('info', 'Phone login initiated', { phone: identifier, sessionId });
      
      res.json(formatResponse(true, 'Verification code sent to your phone number', {
        sessionId,
        phoneSent: maskPhone(identifier),
        loginType: 'phone',
        devMode: CONFIG.NODE_ENV === 'development' ? { otp } : undefined
      }));
      
    } catch (error) {
      log('error', 'Phone login error', { error: error.message });
      res.status(500).json(formatResponse(false, 'Internal server error'));
    }
  }

  async verifyOTP(req, res) {
    try {
      const { otp, sessionId } = req.body;
      const loginMethod = req.path.includes('phone') ? 'phone' : 'email';
      
      // Verify OTP
      const session = await this.sessionModel.verifyOTP(otp, sessionId, loginMethod);
      if (!session) {
        return res.status(400).json(formatResponse(false, 'Invalid or expired OTP'));
      }
      
      // Mark OTP as used
      await this.sessionModel.markOTPUsed(session.id);
      
      // Get user
      const user = await this.userModel.findById(session.user_id);
      
      // Generate temporary token
      const tempToken = generateJWT({
        userId: user.id,
        sessionId,
        identifier: session.identifier,
        loginMethod,
        type: 'profile_completion'
      }, '30m');
      
      log('info', `${loginMethod} OTP verified`, { 
        [loginMethod === 'email' ? 'email' : 'phone']: session.identifier, 
        userId: user.id 
      });
      
      res.json(formatResponse(true, 'OTP verified successfully', {
        tempToken,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          loginMethod: user.login_method,
          profileCompleted: user.profile_completed || false,
          needsProfileCompletion: !user.profile_completed
        }
      }));
      
    } catch (error) {
      log('error', 'OTP verification error', { error: error.message });
      res.status(500).json(formatResponse(false, 'Internal server error'));
    }
  }

  async resendOTP(req, res) {
    try {
      const { sessionId } = req.body;
      const loginMethod = req.path.includes('phone') ? 'phone' : 'email';
      
      // Get active session
      const session = await this.sessionModel.findActiveSession(sessionId, loginMethod);
      if (!session) {
        return res.status(404).json(formatResponse(false, 'Session not found or expired. Please start login again'));
      }
      
      // Check cooldown (20 seconds)
      const twentySecondsAgo = new Date(Date.now() - 20 * 1000);
      if (new Date(session.created_at) > twentySecondsAgo) {
        const remainingSeconds = Math.ceil((new Date(session.created_at).getTime() + 20000 - Date.now()) / 1000);
        return res.status(400).json(formatResponse(false, `Please wait ${remainingSeconds} seconds before requesting a new code`));
      }
      
      // Generate new OTP
      const { otp: newOTP } = createOTPSession();
      
      // Update session
      await this.sessionModel.updateOTP(sessionId, session.id, newOTP);
      
      // Send new OTP
      if (loginMethod === 'email') {
        const emailResult = await sendLoginOTP(session.identifier, newOTP, true);
        if (!emailResult.success) {
          log('warn', 'Failed to resend email OTP', { email: session.identifier });
        }
      } else {
        const smsResult = await sendPhoneOTP(session.identifier, newOTP, true);
        if (!smsResult.success) {
          log('warn', 'Failed to resend SMS OTP', { phone: session.identifier });
        }
      }
      
      const responseData = {
        sessionId,
        devMode: CONFIG.NODE_ENV === 'development' ? { otp: newOTP } : undefined
      };
      
      if (loginMethod === 'email') {
        responseData.emailSent = maskEmail(session.identifier);
        res.json(formatResponse(true, 'New verification code sent to your email address', responseData));
      } else {
        responseData.phoneSent = maskPhone(session.identifier);
        res.json(formatResponse(true, 'New verification code sent to your phone number', responseData));
      }
      
    } catch (error) {
      log('error', 'Resend OTP error', { error: error.message });
      res.status(500).json(formatResponse(false, 'Internal server error'));
    }
  }
}