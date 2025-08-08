-- Create database
CREATE DATABASE IF NOT EXISTS auth_system_db;
USE auth_system_db;

-- Users table
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
);

-- Login sessions table
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
);

-- Sample data (for development)
INSERT INTO users (email, phone, login_method, profile_completed) VALUES
('test.user@example.com', NULL, 'email', FALSE),
('demo@example.com', NULL, 'email', FALSE),
(NULL, '+1234567890', 'phone', FALSE),
(NULL, '+1987654321', 'phone', FALSE),
('complete.user@example.com', '+1555000111', 'email', TRUE)
ON DUPLICATE KEY UPDATE email = VALUES(email);