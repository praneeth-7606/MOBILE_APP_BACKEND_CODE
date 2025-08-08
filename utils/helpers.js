import jwt from 'jsonwebtoken';
import validator from 'validator';

export const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
export const generateSessionId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
export const generateBookingId = () => 'BK' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
export const generateJWT = (payload, secret, expiresIn = '24h') => jwt.sign(payload, secret, { expiresIn });

export const maskEmail = (email) => {
  if (!email || !validator.isEmail(email)) return '';
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) return `${localPart[0]}***@${domain}`;
  return `${localPart.substring(0, 2)}***@${domain}`;
};

export const maskPhone = (phone) => {
  if (!phone) return '';
  if (phone.length <= 6) return `${phone.substring(0, 3)}***`;
  const start = phone.substring(0, 4);
  const end = phone.substring(phone.length - 4);
  return `${start}***${end}`;
};

export const formatResponse = (success, message, data = null) => {
  const response = { success, message };
  if (data) Object.assign(response, data);
  return response;
};

export const log = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logData = data ? JSON.stringify(data) : '';
  console.log(`[${timestamp}] ${level.toUpperCase()}: ${message} ${logData}`);
};
