import jwt from 'jsonwebtoken';
import { CONFIG } from '../config/database.js';
import { formatResponse } from '../utils/helpers.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(formatResponse(false, 'Authorization token required'));
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET);
    
    if (decoded.type !== 'authentication') {
      return res.status(401).json(formatResponse(false, 'Invalid token type'));
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json(formatResponse(false, 'Invalid or expired token'));
  }
};

export const authenticateTempToken = (req, res, next) => {
  const { tempToken } = req.body;
  
  if (!tempToken) {
    return res.status(400).json(formatResponse(false, 'Temporary token is required'));
  }
  
  try {
    const decoded = jwt.verify(tempToken, CONFIG.JWT_SECRET);
    
    if (decoded.type !== 'profile_completion') {
      return res.status(401).json(formatResponse(false, 'Invalid token type'));
    }
    
    req.tempUser = decoded;
    next();
  } catch (error) {
    return res.status(401).json(formatResponse(false, 'Invalid or expired token'));
  }
};