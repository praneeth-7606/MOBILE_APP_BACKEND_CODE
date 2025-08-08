import jwt from 'jsonwebtoken';
import { formatResponse } from '../utils/helpers.js';

export const authenticateToken = (pool, jwtSecret) => async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(formatResponse(false, 'Authorization token required'));
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, jwtSecret);
    
    if (decoded.type !== 'authentication') {
      return res.status(401).json(formatResponse(false, 'Invalid token type'));
    }
    
    const [users] = await pool.execute('SELECT * FROM users WHERE id = ?', [decoded.userId]);
    if (users.length === 0) {
      return res.status(404).json(formatResponse(false, 'User not found'));
    }
    
    req.user = users[0];
    req.token = decoded;
    next();
  } catch (error) {
    res.status(401).json(formatResponse(false, 'Invalid or expired token'));
  }
};