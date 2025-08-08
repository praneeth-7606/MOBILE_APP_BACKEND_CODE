import validator from 'validator';
import { formatResponse, isValidPhone } from '../utils/helpers.js';

export const validateEmailLogin = (req, res, next) => {
  const { identifier, termsAccepted } = req.body;
  
  if (!identifier || !termsAccepted) {
    return res.status(400).json(formatResponse(false, 'Email and terms acceptance are required'));
  }
  
  if (!validator.isEmail(identifier)) {
    return res.status(400).json(formatResponse(false, 'Please enter a valid email address'));
  }
  
  req.body.identifier = identifier.toLowerCase().trim();
  next();
};

export const validatePhoneLogin = (req, res, next) => {
  const { identifier, termsAccepted } = req.body;
  
  if (!identifier || !termsAccepted) {
    return res.status(400).json(formatResponse(false, 'Phone number and terms acceptance are required'));
  }
  
  if (!isValidPhone(identifier)) {
    return res.status(400).json(formatResponse(false, 'Please enter a valid phone number'));
  }
  
  next();
};

export const validateOTP = (req, res, next) => {
  const { otp, sessionId } = req.body;
  
  if (!otp || !sessionId) {
    return res.status(400).json(formatResponse(false, 'OTP and session ID are required'));
  }
  
  next();
};

export const validateProfileCompletion = (req, res, next) => {
  const { firstName, lastName } = req.body;
  
  if (!firstName || !lastName) {
    return res.status(400).json(formatResponse(false, 'First name and last name are required'));
  }
  
  next();
};