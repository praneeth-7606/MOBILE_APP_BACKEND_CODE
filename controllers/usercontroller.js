import validator from 'validator';
import { User } from '../models/user.js';
import { generateJWT } from '../utils/otpservice.js';
import { formatResponse, isValidPhone, log } from '../utils/helpers.js';

export class UserController {
  constructor(pool) {
    this.pool = pool;
    this.userModel = new User(pool);
  }

  async completeProfile(req, res) {
    try {
      const { firstName, lastName, email, phone, marketingConsent } = req.body;
      const { tempUser } = req;
      
      // Get user
      const user = await this.userModel.findById(tempUser.userId);
      if (!user) {
        return res.status(404).json(formatResponse(false, 'User not found'));
      }
      
      // Smart validation based on login method
      if (tempUser.loginMethod === 'email') {
        // Email login users need to provide phone number
        if (!phone || !isValidPhone(phone)) {
          return res.status(400).json(formatResponse(false, 'Valid phone number is required to complete your profile'));
        }
        
        // Check if phone is already taken
        const phoneExists = await this.userModel.checkPhoneExists(phone, user.id);
        if (phoneExists) {
          return res.status(409).json(formatResponse(false, 'This phone number is already registered with another account'));
        }
      } else if (tempUser.loginMethod === 'phone') {
        // Phone login users need to provide email
        if (!email || !validator.isEmail(email)) {
          return res.status(400).json(formatResponse(false, 'Valid email address is required to complete your profile'));
        }
        
        // Check if email is already taken
        const emailExists = await this.userModel.checkEmailExists(email, user.id);
        if (emailExists) {
          return res.status(409).json(formatResponse(false, 'This email address is already registered with another account'));
        }
      }
      
      // Update user profile
      const updatedUser = await this.userModel.updateProfile(tempUser.userId, {
        firstName,
        lastName,
        email,
        phone,
        marketingConsent
      });
      
      // Generate auth token
      const authToken = generateJWT({
        userId: updatedUser.id,
        email: updatedUser.email,
        phone: updatedUser.phone,
        loginMethod: updatedUser.login_method,
        type: 'authentication'
      });
      
      log('info', 'Profile completed', { 
        userId: updatedUser.id, 
        loginMethod: tempUser.loginMethod,
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
  }

  async getProfile(req, res) {
    try {
      const { user: authUser } = req;
      
      const user = await this.userModel.findById(authUser.userId);
      if (!user) {
        return res.status(404).json(formatResponse(false, 'User not found'));
      }
      
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
  }
}