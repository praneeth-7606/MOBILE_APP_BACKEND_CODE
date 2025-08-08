import jwt from 'jsonwebtoken';
import { CONFIG } from '../config/database.js';
import { generateOTP, generateSessionId, log } from './helpers.js';

export const generateJWT = (payload, expiresIn = '24h') => {
  return jwt.sign(payload, CONFIG.JWT_SECRET, { expiresIn });
};

export const createOTPSession = () => {
  return {
    sessionId: generateSessionId(),
    otp: generateOTP()
  };
};

export const createLoginSession = async (pool, identifier, otp, sessionId, userId, loginMethod, req) => {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');
  
  await pool.execute(
    'INSERT INTO login_sessions (identifier, otp, session_id, expires_at, user_id, login_method, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [identifier, otp, sessionId, expiresAt, userId, loginMethod, ipAddress, userAgent]
  );
};

export const verifyOTPSession = async (pool, otp, sessionId, loginMethod) => {
  const [sessions] = await pool.execute(
    'SELECT * FROM login_sessions WHERE otp = ? AND session_id = ? AND expires_at > NOW() AND otp_used = FALSE AND login_method = ? ORDER BY created_at DESC LIMIT 1',
    [otp, sessionId, loginMethod]
  );
  
  return sessions.length > 0 ? sessions[0] : null;
};

export const markOTPUsed = async (pool, sessionId) => {
  await pool.execute('UPDATE login_sessions SET otp_used = TRUE WHERE id = ?', [sessionId]);
};

export const getActiveSession = async (pool, sessionId, loginMethod) => {
  const [sessions] = await pool.execute(
    'SELECT * FROM login_sessions WHERE session_id = ? AND expires_at > NOW() AND login_method = ? ORDER BY created_at DESC LIMIT 1',
    [sessionId, loginMethod]
  );
  
  return sessions.length > 0 ? sessions[0] : null;
};

export const updateOTPSession = async (pool, sessionId, sessionDbId, newOTP) => {
  const newExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  
  await pool.execute(
    'UPDATE login_sessions SET otp = ?, expires_at = ?, otp_used = FALSE, created_at = NOW() WHERE session_id = ? AND id = ?',
    [newOTP, newExpiresAt, sessionId, sessionDbId]
  );
};

export const cleanupExpiredSessions = async (pool) => {
  try {
    const [result] = await pool.execute('DELETE FROM login_sessions WHERE expires_at < NOW()');
    if (result.affectedRows > 0) {
      log('info', `🧹 Cleaned up ${result.affectedRows} expired sessions`);
    }
  } catch (error) {
    log('error', 'Cleanup error', { error: error.message });
  }
};