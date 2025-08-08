import jwt from 'jsonwebtoken';
import validator from 'validator';
import { formatResponse, generateJWT, log } from '../utils/helpers.js';
import { isValidPhone } from '../middleware/validation.js';

export class UserController {
  constructor(pool, config) {
    this.pool = pool;
    this.config = config;
  }

  completeProfile = async (req, res) => {
    try {
      const { firstName, lastName, email, phone, marketingConsent, tempToken } = req.body;
      
      if (!firstName || !lastName || !tempToken) {
        return res.status(400).json(formatResponse(false, 'First name, last name, and token are required'));
      }
      
      let decoded;
      try {
        decoded = jwt.verify(tempToken, this.config.JWT_SECRET);
        if (decoded.type !== 'profile_completion') throw new Error('Invalid token type');
      } catch (tokenError) {
        return res.status(401).json(formatResponse(false, 'Invalid or expired token'));
      }
      
      const [users] = await this.pool.execute('SELECT * FROM users WHERE id = ?', [decoded.userId]);
      if (users.length === 0) {
        return res.status(404).json(formatResponse(false, 'User not found'));
      }
      
      const user = users[0];
      
      // Smart validation based on login method
      if (decoded.loginMethod === 'email') {
        if (!phone || !isValidPhone(phone)) {
          return res.status(400).json(formatResponse(false, 'Valid phone number is required to complete your profile'));
        }
        
        const [existingPhone] = await this.pool.execute('SELECT id FROM users WHERE phone = ? AND id != ?', [phone, user.id]);
        if (existingPhone.length > 0) {
          return res.status(409).json(formatResponse(false, 'This phone number is already registered with another account'));
        }
      } else if (decoded.loginMethod === 'phone') {
        if (!email || !validator.isEmail(email)) {
          return res.status(400).json(formatResponse(false, 'Valid email address is required to complete your profile'));
        }
        
        const [existingEmail] = await this.pool.execute('SELECT id FROM users WHERE email = ? AND id != ?', [email.toLowerCase(), user.id]);
        if (existingEmail.length > 0) {
          return res.status(409).json(formatResponse(false, 'This email address is already registered with another account'));
        }
      }
      
      await this.pool.execute(`
        UPDATE users 
        SET first_name = ?, last_name = ?, email = COALESCE(?, email), phone = COALESCE(?, phone), 
            marketing_consent = ?, profile_completed = TRUE, updated_at = NOW() 
        WHERE id = ?
      `, [
        firstName.trim(),
        lastName.trim(),
        email ? email.toLowerCase().trim() : null,
        phone || null,
        marketingConsent || false,
        decoded.userId
      ]);
      
      const [updatedUsers] = await this.pool.execute('SELECT * FROM users WHERE id = ?', [decoded.userId]);
      const updatedUser = updatedUsers[0];
      
      const authToken = generateJWT({
        userId: updatedUser.id,
        email: updatedUser.email,
        phone: updatedUser.phone,
        loginMethod: updatedUser.login_method,
        type: 'authentication'
      }, this.config.JWT_SECRET);
      
      log('info', 'Profile completed', { 
        userId: updatedUser.id, 
        loginMethod: decoded.loginMethod,
        email: updatedUser.email,
        phone: updatedUser.phone 
      });
      
      res.json(formatResponse(true, 'Profile completed successfully', {
        authToken,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          phone: updatedUser.phone,
          firstName: updatedUser.first_name,
          lastName: updatedUser.last_name,
          loginMethod: updatedUser.login_method,
          profileCompleted: updatedUser.profile_completed,
          marketingConsent: updatedUser.marketing_consent
        }
      }));
      
    } catch (error) {
      log('error', 'Profile completion error', { error: error.message });
      res.status(500).json(formatResponse(false, 'Internal server error'));
    }
  };

  getProfile = async (req, res) => {
    try {
      const user = req.user;
      res.json(formatResponse(true, 'Profile retrieved successfully', {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstName: user.first_name,
          lastName: user.last_name,
          loginMethod: user.login_method,
          profileCompleted: user.profile_completed,
          marketingConsent: user.marketing_consent,
          memberSince: user.created_at
        }
      }));
    } catch (error) {
      log('error', 'Profile fetch error', { error: error.message });
      res.status(500).json(formatResponse(false, 'Internal server error'));
    }
  };
}
