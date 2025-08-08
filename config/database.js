import mysql from 'mysql2/promise';

// Load environment variables in development
if (process.env.NODE_ENV !== 'production') {
  try {
    const dotenv = await import('dotenv');
    dotenv.config();
    console.log('✅ Environment variables loaded from .env file');
  } catch (e) {
    console.warn('⚠️  dotenv not found, using system environment variables');
  }
}

// Environment-based Configuration
export const CONFIG = {
  // Server
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'auth_system_db',
  DB_PORT: process.env.DB_PORT || 3306,
  
  // JWT Secret
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_jwt_secret_change_in_production',
  
  // Email Configuration
  EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT) || 587,
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_PASS: process.env.EMAIL_PASS || '',
  
  // Twilio Configuration
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',
  
  // App Configuration
  APP_NAME: process.env.APP_NAME || 'Auth System'
};

let pool;

const log = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logData = data ? JSON.stringify(data) : '';
  console.log(`[${timestamp}] ${level.toUpperCase()}: ${message} ${logData}`);
};

export const setupDatabase = async () => {
  try {
    log('info', '🔧 Setting up database...');
    
    // Connect to MySQL without database first
    const connection = await mysql.createConnection({
      host: CONFIG.DB_HOST,
      user: CONFIG.DB_USER,
      password: CONFIG.DB_PASSWORD,
      port: CONFIG.DB_PORT
    });
    
    // Create database if it doesn't exist
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${CONFIG.DB_NAME}`);
    log('info', `✅ Database '${CONFIG.DB_NAME}' ready`);
    
    // Close initial connection
    await connection.end();
    
    // Create pool connection to the specific database
    pool = mysql.createPool({
      host: CONFIG.DB_HOST,
      user: CONFIG.DB_USER,
      password: CONFIG.DB_PASSWORD,
      database: CONFIG.DB_NAME,
      port: CONFIG.DB_PORT,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      acquireTimeout: 60000,
      timeout: 60000
    });
    
    // Create tables
    await createTables();
    
    // Insert sample data (only in development)
    if (CONFIG.NODE_ENV === 'development') {
      await insertSampleData();
    }
    
    log('info', '🎉 Database setup complete!');
    
  } catch (error) {
    log('error', '❌ Database setup failed', { error: error.message, code: error.code });
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      log('info', '💡 Check your database credentials in environment variables');
    }
    
    throw error;
  }
};

const createTables = async () => {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NULL,
      phone VARCHAR(20) UNIQUE NULL,
      first_name VARCHAR(100) NULL,
      last_name VARCHAR(100) NULL,
      login_method ENUM('email', 'phone') NULL,
      profile_completed BOOLEAN DEFAULT FALSE,
      marketing_consent BOOLEAN DEFAULT FALSE,
      email_verified BOOLEAN DEFAULT FALSE,
      phone_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      INDEX idx_email (email),
      INDEX idx_phone (phone),
      INDEX idx_profile_completed (profile_completed),
      INDEX idx_login_method (login_method)
    )
  `;
  
  const createSessionsTable = `
    CREATE TABLE IF NOT EXISTS login_sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      identifier VARCHAR(255) NOT NULL,
      otp VARCHAR(6) NOT NULL,
      session_id VARCHAR(255) NOT NULL UNIQUE,
      otp_used BOOLEAN DEFAULT FALSE,
      expires_at TIMESTAMP NOT NULL,
      user_id INT NULL,
      login_method ENUM('email', 'phone') NOT NULL,
      ip_address VARCHAR(45) NULL,
      user_agent TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      INDEX idx_session_id (session_id),
      INDEX idx_identifier (identifier),
      INDEX idx_expires_at (expires_at),
      INDEX idx_login_method (login_method),
      INDEX idx_cleanup (expires_at, otp_used)
    )
  `;
  
  await pool.execute(createUsersTable);
  await pool.execute(createSessionsTable);
  
  log('info', '✅ Tables created successfully');
};

const insertSampleData = async () => {
  try {
    const [existing] = await pool.execute('SELECT COUNT(*) as count FROM users');
    
    if (existing[0].count === 0) {
      await pool.execute(`
        INSERT INTO users (email, phone, login_method, profile_completed) VALUES
        ('test.user@example.com', NULL, 'email', FALSE),
        ('demo@example.com', NULL, 'email', FALSE),
        (NULL, '+1234567890', 'phone', FALSE),
        (NULL, '+1987654321', 'phone', FALSE),
        ('complete.user@example.com', '+1555000111', 'email', TRUE)
      `);
      log('info', '✅ Sample users inserted');
    } else {
      log('info', '✅ Sample data already exists');
    }
  } catch (error) {
    log('warn', '⚠️  Sample data insertion skipped', { error: error.message });
  }
};

export const getPool = () => pool;

export const closeDatabase = async () => {
  if (pool) {
    await pool.end();
    log('info', '✅ Database connections closed');
  }
};