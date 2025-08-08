-- Drop existing tables if they exist
DROP TABLE IF EXISTS booking_documents;
DROP TABLE IF EXISTS booking_guests; 
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS login_sessions;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
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

-- Create login sessions table
CREATE TABLE login_sessions (
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

-- Create bookings table
CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id VARCHAR(20) UNIQUE NOT NULL,
  user_id INT NOT NULL,
  
  -- User Details
  user_first_name VARCHAR(100) NOT NULL,
  user_last_name VARCHAR(100) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  user_phone VARCHAR(20) NOT NULL,
  user_gender ENUM('male', 'female', 'other') NULL,
  user_age INT NULL,
  
  -- Address Details
  permanent_address TEXT NULL,
  city VARCHAR(100) NULL,
  state VARCHAR(100) NULL,
  country VARCHAR(100) NULL,
  pincode VARCHAR(20) NULL,
  
  -- Professional Details
  occupation VARCHAR(200) NULL,
  occupation_email VARCHAR(255) NULL,
  gst_number VARCHAR(50) NULL,
  
  -- Booking Details
  room_description TEXT NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  total_guests INT NOT NULL DEFAULT 1,
  payment_method ENUM('credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash') NOT NULL,
  payment_name VARCHAR(100) NOT NULL,
  total_payment DECIMAL(10, 2) NOT NULL,
  booking_status ENUM('confirmed', 'checked_in', 'checked_out', 'cancelled') DEFAULT 'confirmed',
  special_requests TEXT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_booking_id (booking_id),
  INDEX idx_user_last_name (user_last_name),
  INDEX idx_user_id (user_id)
);

-- Create booking guests table
CREATE TABLE booking_guests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id VARCHAR(20) NOT NULL,
  guest_first_name VARCHAR(100) NOT NULL,
  guest_last_name VARCHAR(100) NOT NULL,
  guest_age INT NULL,
  guest_gender ENUM('male', 'female', 'other') NULL,
  guest_id_type ENUM('aadhar', 'passport', 'driving_license', 'voter_id') NULL,
  guest_id_number VARCHAR(50) NULL,
  is_primary_guest BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
  INDEX idx_booking_id (booking_id)
);

-- Create booking documents table
CREATE TABLE booking_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id VARCHAR(20) NOT NULL,
  document_type ENUM('government_id', 'passport', 'driving_license') NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
  INDEX idx_booking_id (booking_id)
);

-- Insert sample data
INSERT INTO users (email, phone, login_method, profile_completed, first_name, last_name) VALUES
('test.user@example.com', NULL, 'email', TRUE, 'Test', 'User'),
('demo@example.com', NULL, 'email', FALSE, NULL, NULL),
(NULL, '+1234567890', 'phone', FALSE, NULL, NULL),
(NULL, '+1987654321', 'phone', FALSE, NULL, NULL),
('complete.user@example.com', '+1555000111', 'email', TRUE, 'Complete', 'User');
