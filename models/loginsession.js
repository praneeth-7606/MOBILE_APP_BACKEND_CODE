export class LoginSession {
  constructor(pool) {
    this.pool = pool;
  }

  async create(identifier, otp, sessionId, userId, loginMethod, req) {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    await this.pool.execute(
      'INSERT INTO login_sessions (identifier, otp, session_id, expires_at, user_id, login_method, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [identifier, otp, sessionId, expiresAt, userId, loginMethod, ipAddress, userAgent]
    );
  }

  async verify(otp, sessionId, loginMethod) {
    const [sessions] = await this.pool.execute(
      'SELECT * FROM login_sessions WHERE otp = ? AND session_id = ? AND expires_at > NOW() AND otp_used = FALSE AND login_method = ? ORDER BY created_at DESC LIMIT 1',
      [otp, sessionId, loginMethod]
    );
    
    return sessions.length > 0 ? sessions[0] : null;
  }

  async markUsed(sessionId) {
    await this.pool.execute('UPDATE login_sessions SET otp_used = TRUE WHERE id = ?', [sessionId]);
  }

  async updateOTP(sessionId, newOTP) {
    const newExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.pool.execute(
      'UPDATE login_sessions SET otp = ?, expires_at = ?, otp_used = FALSE, created_at = NOW() WHERE session_id = ?',
      [newOTP, newExpiresAt, sessionId]
    );
  }
}
