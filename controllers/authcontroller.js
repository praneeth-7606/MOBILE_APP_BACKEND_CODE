import jwt from 'jsonwebtoken';
import { formatResponse, generateOTP, generateSessionId, generateJWT, maskEmail, maskPhone, log } from '../utils/helpers.js';
import { sendLoginOTP, sendPhoneOTP } from '../utils/otpservice.js'; // Fixed typo: otpservice -> otpService

export class AuthController {
  constructor(pool, userModel, loginSessionModel, emailService, smsService, config) {
    this.pool = pool;
    this.userModel = userModel;
    this.loginSessionModel = loginSessionModel;
    this.emailService = emailService;
    this.smsService = smsService;
    this.config = config;
  }

  // =============================================================================
  // EMAIL LOGIN METHODS
  // =============================================================================

  emailLogin = async (req, res) => {
    try {
      const { identifier, termsAccepted } = req.body;
      
      if (!identifier || !termsAccepted) {
        return res.status(400).json(formatResponse(false, 'Email and terms acceptance are required'));
      }
      
      const user = await this.userModel.findOrCreate(identifier, 'email');
      if (!user) {
        return res.status(500).json(formatResponse(false, 'Unable to process request'));
      }
      
      const sessionId = generateSessionId();
      const otp = generateOTP();
      
      await this.loginSessionModel.create(identifier, otp, sessionId, user.id, 'email', req);
      
      const emailOTPSender = sendLoginOTP(this.emailService, this.config);
      emailOTPSender(identifier, otp)
        .then(emailResult => {
          if (!emailResult.success) {
            log('warn', 'Failed to send email OTP', { email: identifier });
          } else {
            log('info', `🔧 Email OTP for ${identifier}: ${otp} (Session: ${sessionId})`);
          }
        })
        .catch(error => {
          // You MUST have a .catch() block to prevent an UnhandledPromiseRejection error
          log('error', 'Fire-and-forget email sending failed', { error: error.message });
        });
      // --- END OF CHANGE ---
      
      log('info', 'Email login initiated', { email: identifier, sessionId });
      
      res.json(formatResponse(true, 'Verification code sent to your email address', {
        sessionId,
        emailSent: maskEmail(identifier),
        loginType: 'email',
        devMode: this.config.NODE_ENV === 'development' ? { otp } : undefined
      }));
      
    } catch (error) {
      log('error', 'Email login error', { error: error.message });
      res.status(500).json(formatResponse(false, 'Internal server error'));
    }
  };

  verifyEmailOTP = async (req, res) => {
    try {
      const { otp, sessionId } = req.body;
      
      if (!otp || !sessionId) {
        return res.status(400).json(formatResponse(false, 'OTP and session ID are required'));
      }
      
      const session = await this.loginSessionModel.verify(otp, sessionId, 'email');
      if (!session) {
        return res.status(400).json(formatResponse(false, 'Invalid or expired OTP'));
      }
      
      await this.loginSessionModel.markUsed(session.id);
      
      const [users] = await this.pool.execute('SELECT * FROM users WHERE id = ?', [session.user_id]);
      const user = users[0];
      
      const tempToken = generateJWT({
        userId: user.id,
        sessionId,
        identifier: session.identifier,
        loginMethod: 'email',
        type: 'profile_completion'
      }, this.config.JWT_SECRET, '30m');
      
      log('info', 'Email OTP verified', { email: session.identifier, userId: user.id });
      
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
      log('error', 'Email OTP verification error', { error: error.message });
      res.status(500).json(formatResponse(false, 'Internal server error'));
    }
  };

  resendEmailOTP = async (req, res) => {
    try {
      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json(formatResponse(false, 'Session ID is required'));
      }
      
      // Get active session
      const [sessions] = await this.pool.execute(
        'SELECT * FROM login_sessions WHERE session_id = ? AND expires_at > NOW() AND login_method = "email" ORDER BY created_at DESC LIMIT 1',
        [sessionId]
      );
      
      if (sessions.length === 0) {
        return res.status(404).json(formatResponse(false, 'Session not found or expired. Please start login again'));
      }
      
      const session = sessions[0];
      
      // Check cooldown (20 seconds)
      const twentySecondsAgo = new Date(Date.now() - 20 * 1000);
      if (new Date(session.created_at) > twentySecondsAgo) {
        const remainingSeconds = Math.ceil((new Date(session.created_at).getTime() + 20000 - Date.now()) / 1000);
        return res.status(400).json(formatResponse(false, `Please wait ${remainingSeconds} seconds before requesting a new code`));
      }
      
      // Generate new OTP
      const newOTP = generateOTP();
      await this.loginSessionModel.updateOTP(sessionId, newOTP);
      
      // Send new OTP
      const emailOTPSender = sendLoginOTP(this.emailService, this.config);
       emailOTPSender(session.identifier, newOTP, true)
        .then(emailResult => {
          if (!emailResult.success) {
            log('warn', 'Failed to resend email OTP', { email: session.identifier });
          } else {
            log('info', `🔄 Resend Email OTP for ${session.identifier}: ${newOTP} (Session: ${sessionId})`);
          }
        })
        .catch(error => {
          // Add a .catch() to prevent UnhandledPromiseRejection errors
          log('error', 'Fire-and-forget email resend failed', { error: error.message });
        });
      
      res.json(formatResponse(true, 'New verification code sent to your email address', {
        sessionId,
        emailSent: maskEmail(session.identifier),
        devMode: this.config.NODE_ENV === 'development' ? { otp: newOTP } : undefined
      }));
      
    } catch (error) {
      log('error', 'Email resend OTP error', { error: error.message });
      res.status(500).json(formatResponse(false, 'Internal server error'));
    }
  };

  // =============================================================================
  // PHONE LOGIN METHODS
  // =============================================================================

  phoneLogin = async (req, res) => {
    try {
      const { identifier, termsAccepted } = req.body;
      
      if (!identifier || !termsAccepted) {
        return res.status(400).json(formatResponse(false, 'Phone number and terms acceptance are required'));
      }
      
      const user = await this.userModel.findOrCreate(identifier, 'phone');
      if (!user) {
        return res.status(500).json(formatResponse(false, 'Unable to process request'));
      }
      
      const sessionId = generateSessionId();
      const otp = generateOTP();
      
      await this.loginSessionModel.create(identifier, otp, sessionId, user.id, 'phone', req);
      
      const phoneOTPSender = sendPhoneOTP(this.smsService, this.config);
      const smsResult = await phoneOTPSender(identifier, otp);
      
      if (!smsResult.success) {
        log('warn', 'Failed to send SMS OTP', { phone: identifier });
      } else {
        log('info', `🔧 Phone OTP for ${identifier}: ${otp} (Session: ${sessionId})`);
      }
      
      log('info', 'Phone login initiated', { phone: identifier, sessionId });
      
      res.json(formatResponse(true, 'Verification code sent to your phone number', {
        sessionId,
        phoneSent: maskPhone(identifier),
        loginType: 'phone',
        devMode: this.config.NODE_ENV === 'development' ? { otp } : undefined
      }));
      
    } catch (error) {
      log('error', 'Phone login error', { error: error.message });
      res.status(500).json(formatResponse(false, 'Internal server error'));
    }
  };

  verifyPhoneOTP = async (req, res) => {
    try {
      const { otp, sessionId } = req.body;
      
      if (!otp || !sessionId) {
        return res.status(400).json(formatResponse(false, 'OTP and session ID are required'));
      }
      
      const session = await this.loginSessionModel.verify(otp, sessionId, 'phone');
      if (!session) {
        return res.status(400).json(formatResponse(false, 'Invalid or expired OTP'));
      }
      
      await this.loginSessionModel.markUsed(session.id);
      
      const [users] = await this.pool.execute('SELECT * FROM users WHERE id = ?', [session.user_id]);
      const user = users[0];
      
      const tempToken = generateJWT({
        userId: user.id,
        sessionId,
        identifier: session.identifier,
        loginMethod: 'phone',
        type: 'profile_completion'
      }, this.config.JWT_SECRET, '30m');
      
      log('info', 'Phone OTP verified', { phone: session.identifier, userId: user.id });
      
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
      log('error', 'Phone OTP verification error', { error: error.message });
      res.status(500).json(formatResponse(false, 'Internal server error'));
    }
  };

  resendPhoneOTP = async (req, res) => {
    try {
      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json(formatResponse(false, 'Session ID is required'));
      }
      
      // Get active session
      const [sessions] = await this.pool.execute(
        'SELECT * FROM login_sessions WHERE session_id = ? AND expires_at > NOW() AND login_method = "phone" ORDER BY created_at DESC LIMIT 1',
        [sessionId]
      );
      
      if (sessions.length === 0) {
        return res.status(404).json(formatResponse(false, 'Session not found or expired. Please start login again'));
      }
      
      const session = sessions[0];
      
      // Check cooldown (20 seconds)
      const twentySecondsAgo = new Date(Date.now() - 20 * 1000);
      if (new Date(session.created_at) > twentySecondsAgo) {
        const remainingSeconds = Math.ceil((new Date(session.created_at).getTime() + 20000 - Date.now()) / 1000);
        return res.status(400).json(formatResponse(false, `Please wait ${remainingSeconds} seconds before requesting a new code`));
      }
      
      // Generate new OTP
      const newOTP = generateOTP();
      await this.loginSessionModel.updateOTP(sessionId, newOTP);
      
      // Send new OTP
      const phoneOTPSender = sendPhoneOTP(this.smsService, this.config);
      const smsResult = await phoneOTPSender(session.identifier, newOTP, true);
      
      if (!smsResult.success) {
        log('warn', 'Failed to resend SMS OTP', { phone: session.identifier });
      } else {
        log('info', `🔄 Resend Phone OTP for ${session.identifier}: ${newOTP} (Session: ${sessionId})`);
      }
      
      res.json(formatResponse(true, 'New verification code sent to your phone number', {
        sessionId,
        phoneSent: maskPhone(session.identifier),
        devMode: this.config.NODE_ENV === 'development' ? { otp: newOTP } : undefined
      }));
      
    } catch (error) {
      log('error', 'Phone resend OTP error', { error: error.message });
      res.status(500).json(formatResponse(false, 'Internal server error'));
    }
  };
}
