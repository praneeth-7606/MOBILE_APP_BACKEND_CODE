// export class LoginSession {
//   constructor(pool) {
//     this.pool = pool;
//   }

//   async create(identifier, otp, sessionId, userId, loginMethod, req) {
//     const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
//     const ipAddress = req.ip || req.connection.remoteAddress;
//     const userAgent = req.get('User-Agent');
    
//     await this.pool.execute(
//       'INSERT INTO login_sessions (identifier, otp, session_id, expires_at, user_id, login_method, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
//       [identifier, otp, sessionId, expiresAt, userId, loginMethod, ipAddress, userAgent]
//     );
//   }

//   async verify(otp, sessionId, loginMethod) {
//     const [sessions] = await this.pool.execute(
//       'SELECT * FROM login_sessions WHERE otp = ? AND session_id = ? AND expires_at > NOW() AND otp_used = FALSE AND login_method = ? ORDER BY created_at DESC LIMIT 1',
//       [otp, sessionId, loginMethod]
//     );
    
//     return sessions.length > 0 ? sessions[0] : null;
//   }

//   async markUsed(sessionId) {
//     await this.pool.execute('UPDATE login_sessions SET otp_used = TRUE WHERE id = ?', [sessionId]);
//   }

//   async updateOTP(sessionId, newOTP) {
//     const newExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
//     await this.pool.execute(
//       'UPDATE login_sessions SET otp = ?, expires_at = ?, otp_used = FALSE, created_at = NOW() WHERE session_id = ?',
//       [newOTP, newExpiresAt, sessionId]
//     );
//   }
// }
export class LoginSession {
  constructor(pool) {
    this.pool = pool;
  }

  async create(identifier, otp, sessionId, userId, loginMethod, req) {
    try {
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');
      
      await this.pool.execute(
        'INSERT INTO login_sessions (identifier, otp, session_id, expires_at, user_id, login_method, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [identifier, otp, sessionId, expiresAt, userId, loginMethod, ipAddress, userAgent]
      );
      
      return sessionId;
    } catch (error) {
      console.error('Error creating login session:', error.message);
      throw error;
    }
  }

  async verify(otp, sessionId, loginMethod) {
    try {
      const [sessions] = await this.pool.execute(
        'SELECT * FROM login_sessions WHERE otp = ? AND session_id = ? AND expires_at > NOW() AND otp_used = FALSE AND login_method = ? ORDER BY created_at DESC LIMIT 1',
        [otp, sessionId, loginMethod]
      );
      
      return sessions.length > 0 ? sessions[0] : null;
    } catch (error) {
      console.error('Error verifying login session:', error.message);
      throw error;
    }
  }

  async markUsed(sessionId) {
    try {
      await this.pool.execute(
        'UPDATE login_sessions SET otp_used = TRUE WHERE id = ?',
        [sessionId]
      );
    } catch (error) {
      console.error('Error marking session as used:', error.message);
      throw error;
    }
  }

  async findActiveSession(sessionId, loginMethod) {
    try {
      const [sessions] = await this.pool.execute(
        'SELECT * FROM login_sessions WHERE session_id = ? AND expires_at > NOW() AND login_method = ? ORDER BY created_at DESC LIMIT 1',
        [sessionId, loginMethod]
      );
      
      return sessions.length > 0 ? sessions[0] : null;
    } catch (error) {
      console.error('Error finding active session:', error.message);
      throw error;
    }
  }

  async updateOTP(sessionId, newOTP) {
    try {
      const newExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      await this.pool.execute(
        'UPDATE login_sessions SET otp = ?, expires_at = ?, otp_used = FALSE, created_at = NOW() WHERE session_id = ?',
        [newOTP, newExpiresAt, sessionId]
      );
    } catch (error) {
      console.error('Error updating session OTP:', error.message);
      throw error;
    }
  }

  async findBySessionId(sessionId) {
    try {
      const [sessions] = await this.pool.execute(
        'SELECT * FROM login_sessions WHERE session_id = ?',
        [sessionId]
      );
      
      return sessions.length > 0 ? sessions[0] : null;
    } catch (error) {
      console.error('Error finding session by ID:', error.message);
      throw error;
    }
  }

  async checkCooldown(sessionId, cooldownSeconds = 20) {
    try {
      const session = await this.findBySessionId(sessionId);
      if (!session) return { canResend: false, remainingSeconds: 0 };
      
      const cooldownTime = new Date(Date.now() - cooldownSeconds * 1000);
      const canResend = new Date(session.created_at) <= cooldownTime;
      
      if (!canResend) {
        const remainingSeconds = Math.ceil((new Date(session.created_at).getTime() + (cooldownSeconds * 1000) - Date.now()) / 1000);
        return { canResend: false, remainingSeconds };
      }
      
      return { canResend: true, remainingSeconds: 0 };
    } catch (error) {
      console.error('Error checking cooldown:', error.message);
      throw error;
    }
  }

  async cleanupExpiredSessions() {
    try {
      const [result] = await this.pool.execute(
        'DELETE FROM login_sessions WHERE expires_at < NOW()'
      );
      
      return result.affectedRows;
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error.message);
      throw error;
    }
  }

  async getSessionStats() {
    try {
      const [totalSessions] = await this.pool.execute('SELECT COUNT(*) as total FROM login_sessions');
      const [activeSessions] = await this.pool.execute('SELECT COUNT(*) as count FROM login_sessions WHERE expires_at > NOW() AND otp_used = FALSE');
      const [usedSessions] = await this.pool.execute('SELECT COUNT(*) as count FROM login_sessions WHERE otp_used = TRUE');
      const [expiredSessions] = await this.pool.execute('SELECT COUNT(*) as count FROM login_sessions WHERE expires_at <= NOW()');
      
      return {
        total: totalSessions[0].total,
        active: activeSessions[0].count,
        used: usedSessions[0].count,
        expired: expiredSessions[0].count
      };
    } catch (error) {
      console.error('Error getting session stats:', error.message);
      throw error;
    }
  }

  async getRecentSessions(limit = 20) {
    try {
      const [sessions] = await this.pool.execute(
        'SELECT identifier, login_method, otp_used, expires_at, ip_address, created_at FROM login_sessions ORDER BY created_at DESC LIMIT ?',
        [limit]
      );
      
      return sessions;
    } catch (error) {
      console.error('Error getting recent sessions:', error.message);
      throw error;
    }
  }

  async deleteSession(sessionId) {
    try {
      await this.pool.execute(
        'DELETE FROM login_sessions WHERE session_id = ?',
        [sessionId]
      );
    } catch (error) {
      console.error('Error deleting session:', error.message);
      throw error;
    }
  }

  async deleteUserSessions(userId) {
    try {
      await this.pool.execute(
        'DELETE FROM login_sessions WHERE user_id = ?',
        [userId]
      );
    } catch (error) {
      console.error('Error deleting user sessions:', error.message);
      throw error;
    }
  }
}