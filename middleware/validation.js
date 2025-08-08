import validator from 'validator';
import { formatResponse } from '../utils/helpers.js';

export const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

export const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date) && dateString.match(/^\d{4}-\d{2}-\d{2}$/);
};

export const validateEmail = (req, res, next) => {
  const { identifier } = req.body;
  if (!validator.isEmail(identifier)) {
    return res.status(400).json(formatResponse(false, 'Please enter a valid email address'));
  }
  next();
};

export const validatePhone = (req, res, next) => {
  const { identifier } = req.body;
  if (!isValidPhone(identifier)) {
    return res.status(400).json(formatResponse(false, 'Please enter a valid phone number'));
  }
  next();
};
