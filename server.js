


// import express from 'express';
// import mysql from 'mysql2/promise';
// import { createTransport } from 'nodemailer';
// import jwt from 'jsonwebtoken';
// import validator from 'validator';
// import cors from 'cors';
// import helmet from 'helmet';
// import rateLimit from 'express-rate-limit';
// import multer from 'multer';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import fs from 'fs/promises';

// // Get current directory for ES modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Load environment variables in development
// if (process.env.NODE_ENV !== 'production') {
//   try {
//     const dotenv = await import('dotenv');
//     dotenv.config();
//     console.log('✅ Environment variables loaded from .env file');
//   } catch (e) {
//     console.warn('⚠️  dotenv not found, using system environment variables');
//   }
// }

// // Environment-based Configuration (Render-ready)
// const CONFIG = {
//   // Server
//   PORT: process.env.PORT || 3000,
//   NODE_ENV: process.env.NODE_ENV || 'development',
  
//   // Database (supports both local and cloud databases)
//   DB_HOST: process.env.DB_HOST || 'localhost',
//   DB_USER: process.env.DB_USER || 'root',
//   DB_PASSWORD: process.env.DB_PASSWORD || '',
//   DB_NAME: process.env.DB_NAME || 'auth_system_db',
//   DB_PORT: process.env.DB_PORT || 3306,
  
//   // JWT Secret
//   JWT_SECRET: process.env.JWT_SECRET || 'fallback_jwt_secret_change_in_production',
  
//   // Email Configuration
//   EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
//   EMAIL_PORT: parseInt(process.env.EMAIL_PORT) || 587,
//   EMAIL_USER: process.env.EMAIL_USER || '',
//   EMAIL_PASS: process.env.EMAIL_PASS || '',
  
//   // Twilio Configuration (for SMS)
//   TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
//   TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
//   TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',
  
//   // App Configuration
//   APP_NAME: process.env.APP_NAME || 'Auth System'
// };

// // Debug environment variables in development
// if (CONFIG.NODE_ENV === 'development') {
//   console.log('🔍 Debug Environment Variables:');
//   console.log('   DB_PASSWORD set:', !!CONFIG.DB_PASSWORD);
//   console.log('   EMAIL_USER set:', !!CONFIG.EMAIL_USER);
//   console.log('   TWILIO_SID set:', !!CONFIG.TWILIO_ACCOUNT_SID);
  
//   if (!CONFIG.DB_PASSWORD) {
//     console.log('❌ DB_PASSWORD is empty! Check your .env file');
//     console.log('💡 Your .env file should contain:');
//     console.log('   DB_PASSWORD=your_mysql_password_here');
//   }
// }

// const app = express();

// // Create uploads directory if it doesn't exist
// const uploadsDir = path.join(__dirname, 'uploads');
// try {
//   await fs.access(uploadsDir);
// } catch {
//   await fs.mkdir(uploadsDir, { recursive: true });
//   console.log('📁 Created uploads directory');
// }

// // Multer configuration for file uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadsDir);
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, 'gov-id-' + uniqueSuffix + path.extname(file.originalname));
//   }
// });

// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 5 * 1024 * 1024, // 5MB limit
//   },
//   fileFilter: (req, file, cb) => {
//     const allowedTypes = /jpeg|jpg|png|pdf/;
//     const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
//     const mimetype = allowedTypes.test(file.mimetype);
    
//     if (mimetype && extname) {
//       return cb(null, true);
//     } else {
//       cb(new Error('Only JPEG, PNG, and PDF files are allowed'));
//     }
//   }
// });

// // Middleware
// app.use(helmet());
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Rate limiting
// const generalLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 200, // Increased for production
//   message: { success: false, message: 'Too many requests, please try again later.' },
//   standardHeaders: true,
//   legacyHeaders: false
// });

// const otpLimiter = rateLimit({
//   windowMs: 5 * 60 * 1000, // 5 minutes
//   max: 10, // Increased for production
//   message: { success: false, message: 'Too many OTP requests, please try again later.' }
// });

// const resendLimiter = rateLimit({
//   windowMs: 1 * 60 * 1000, // 1 minute window
//   max: 5, // Allow 5 resend attempts per minute
//   message: { success: false, message: 'Too many resend requests, please wait before trying again.' }
// });

// const bookingLimiter = rateLimit({
//   windowMs: 10 * 60 * 1000, // 10 minutes
//   max: 20, // 20 booking operations per 10 minutes
//   message: { success: false, message: 'Too many booking requests, please try again later.' }
// });

// app.use('/api/', generalLimiter);

// // Database connection
// let pool;

// // Email and SMS transporters
// let emailTransporter;
// let twilioClient;

// // Import Twilio if available
// let twilio;
// try {
//   twilio = await import('twilio');
// } catch (e) {
//   console.warn('⚠️  Twilio not installed. Phone features will not work in production.');
// }

// // Utility Functions
// const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
// const generateSessionId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
// const generateBookingId = () => 'BK' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
// const generateJWT = (payload, expiresIn = '24h') => jwt.sign(payload, CONFIG.JWT_SECRET, { expiresIn });

// const maskEmail = (email) => {
//   if (!email || !validator.isEmail(email)) return '';
//   const [localPart, domain] = email.split('@');
//   if (localPart.length <= 2) return `${localPart[0]}***@${domain}`;
//   return `${localPart.substring(0, 2)}***@${domain}`;
// };

// const maskPhone = (phone) => {
//   if (!phone) return '';
//   if (phone.length <= 6) return `${phone.substring(0, 3)}***`;
//   const start = phone.substring(0, 4);
//   const end = phone.substring(phone.length - 4);
//   return `${start}***${end}`;
// };

// const formatResponse = (success, message, data = null) => {
//   const response = { success, message };
//   if (data) Object.assign(response, data);
//   return response;
// };

// const isValidPhone = (phone) => {
//   const phoneRegex = /^\+?[1-9]\d{1,14}$/;
//   return phoneRegex.test(phone);
// };

// const isValidDate = (dateString) => {
//   const date = new Date(dateString);
//   return date instanceof Date && !isNaN(date) && dateString.match(/^\d{4}-\d{2}-\d{2}$/);
// };

// const log = (level, message, data = null) => {
//   const timestamp = new Date().toISOString();
//   const logData = data ? JSON.stringify(data) : '';
//   console.log(`[${timestamp}] ${level.toUpperCase()}: ${message} ${logData}`);
// };

// // Authentication Middleware
// const authenticateToken = async (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return res.status(401).json(formatResponse(false, 'Authorization token required'));
//     }
    
//     const token = authHeader.substring(7);
//     const decoded = jwt.verify(token, CONFIG.JWT_SECRET);
    
//     if (decoded.type !== 'authentication') {
//       return res.status(401).json(formatResponse(false, 'Invalid token type'));
//     }
    
//     // Verify user exists
//     const [users] = await pool.execute('SELECT * FROM users WHERE id = ?', [decoded.userId]);
//     if (users.length === 0) {
//       return res.status(404).json(formatResponse(false, 'User not found'));
//     }
    
//     req.user = users[0];
//     req.token = decoded;
//     next();
//   } catch (error) {
//     res.status(401).json(formatResponse(false, 'Invalid or expired token'));
//   }
// };

// // Database Functions
// const setupDatabase = async () => {
//   try {
//     log('info', '🔧 Setting up database...');
    
//     // Connect to MySQL without database first
//     const connection = await mysql.createConnection({
//       host: CONFIG.DB_HOST,
//       user: CONFIG.DB_USER,
//       password: CONFIG.DB_PASSWORD,
//       port: CONFIG.DB_PORT
//     });
    
//     // Create database if it doesn't exist
//     await connection.execute(`CREATE DATABASE IF NOT EXISTS ${CONFIG.DB_NAME}`);
//     log('info', `✅ Database '${CONFIG.DB_NAME}' ready`);
    
//     // Close initial connection
//     await connection.end();
    
//     // Create pool connection to the specific database
//     pool = mysql.createPool({
//       host: CONFIG.DB_HOST,
//       user: CONFIG.DB_USER,
//       password: CONFIG.DB_PASSWORD,
//       database: CONFIG.DB_NAME,
//       port: CONFIG.DB_PORT,
//       waitForConnections: true,
//       connectionLimit: 10,
//       queueLimit: 0,
//       acquireTimeout: 60000,
//       timeout: 60000
//     });
    
//     // Create tables
//     await createTables();
    
//     // Insert sample data (only in development)
//     if (CONFIG.NODE_ENV === 'development') {
//       await insertSampleData();
//     }
    
//     log('info', '🎉 Database setup complete!');
    
//   } catch (error) {
//     log('error', '❌ Database setup failed', { error: error.message, code: error.code });
    
//     if (error.code === 'ER_ACCESS_DENIED_ERROR') {
//       log('info', '💡 Check your database credentials in environment variables');
//     }
    
//     throw error;
//   }
// };




// const createTables = async () => {
//   const createUsersTable = `
//     CREATE TABLE IF NOT EXISTS users (
//       id INT AUTO_INCREMENT PRIMARY KEY,
//       email VARCHAR(255) UNIQUE NULL,
//       phone VARCHAR(20) UNIQUE NULL,
//       first_name VARCHAR(100) NULL,
//       last_name VARCHAR(100) NULL,
//       login_method ENUM('email', 'phone') NULL,
//       profile_completed BOOLEAN DEFAULT FALSE,
//       marketing_consent BOOLEAN DEFAULT FALSE,
//       email_verified BOOLEAN DEFAULT FALSE,
//       phone_verified BOOLEAN DEFAULT FALSE,
//       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
//       INDEX idx_email (email),
//       INDEX idx_phone (phone),
//       INDEX idx_profile_completed (profile_completed),
//       INDEX idx_login_method (login_method)
//     )
//   `;
  
//   const createSessionsTable = `
//     CREATE TABLE IF NOT EXISTS login_sessions (
//       id INT AUTO_INCREMENT PRIMARY KEY,
//       identifier VARCHAR(255) NOT NULL,
//       otp VARCHAR(6) NOT NULL,
//       session_id VARCHAR(255) NOT NULL UNIQUE,
//       otp_used BOOLEAN DEFAULT FALSE,
//       expires_at TIMESTAMP NOT NULL,
//       user_id INT NULL,
//       login_method ENUM('email', 'phone') NOT NULL,
//       ip_address VARCHAR(45) NULL,
//       user_agent TEXT NULL,
//       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
//       INDEX idx_session_id (session_id),
//       INDEX idx_identifier (identifier),
//       INDEX idx_expires_at (expires_at),
//       INDEX idx_login_method (login_method),
//       INDEX idx_cleanup (expires_at, otp_used)
//     )
//   `;

//   // UPDATED: Separate user details from guest details
//   const createBookingsTable = `
//     CREATE TABLE IF NOT EXISTS bookings (
//       id INT AUTO_INCREMENT PRIMARY KEY,
//       booking_id VARCHAR(20) UNIQUE NOT NULL,
//       user_id INT NOT NULL,
      
//       -- User Personal Details (from authenticated user)
//       user_first_name VARCHAR(100) NOT NULL,
//       user_last_name VARCHAR(100) NOT NULL,
//       user_email VARCHAR(255) NOT NULL,
//       user_phone VARCHAR(20) NOT NULL,
//       user_gender ENUM('male', 'female', 'other') NULL,
//       user_age INT NULL,
      
//       -- Address Details
//       permanent_address TEXT NULL,
//       city VARCHAR(100) NULL,
//       state VARCHAR(100) NULL,
//       country VARCHAR(100) NULL,
//       pincode VARCHAR(20) NULL,
      
//       -- Professional Details
//       occupation VARCHAR(200) NULL,
//       occupation_email VARCHAR(255) NULL,
//       gst_number VARCHAR(50) NULL,
      
//       -- Booking Details
//       room_description TEXT NOT NULL,
//       check_in_date DATE NOT NULL,
//       check_out_date DATE NOT NULL,
//       total_guests INT NOT NULL DEFAULT 1,
//       payment_method ENUM('credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash') NOT NULL,
//       payment_name VARCHAR(100) NOT NULL,
//       total_payment DECIMAL(10, 2) NOT NULL,
//       booking_status ENUM('confirmed', 'checked_in', 'checked_out', 'cancelled') DEFAULT 'confirmed',
//       special_requests TEXT NULL,
      
//       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
//       FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
//       INDEX idx_booking_id (booking_id),
//       INDEX idx_user_last_name (user_last_name),
//       INDEX idx_user_id (user_id),
//       INDEX idx_check_in_date (check_in_date),
//       INDEX idx_booking_status (booking_status),
//       INDEX idx_booking_lookup (booking_id, user_last_name)
//     )
//   `;

//   // NEW: Separate guests table
//   const createBookingGuestsTable = `
//     CREATE TABLE IF NOT EXISTS booking_guests (
//       id INT AUTO_INCREMENT PRIMARY KEY,
//       booking_id VARCHAR(20) NOT NULL,
//       guest_first_name VARCHAR(100) NOT NULL,
//       guest_last_name VARCHAR(100) NOT NULL,
//       guest_age INT NULL,
//       guest_gender ENUM('male', 'female', 'other') NULL,
//       guest_id_type ENUM('aadhar', 'passport', 'driving_license', 'voter_id') NULL,
//       guest_id_number VARCHAR(50) NULL,
//       is_primary_guest BOOLEAN DEFAULT FALSE,
//       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
//       FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
//       INDEX idx_booking_id (booking_id),
//       INDEX idx_guest_name (guest_first_name, guest_last_name),
//       INDEX idx_primary_guest (is_primary_guest)
//     )
//   `;

//   const createBookingDocumentsTable = `
//     CREATE TABLE IF NOT EXISTS booking_documents (
//       id INT AUTO_INCREMENT PRIMARY KEY,
//       booking_id VARCHAR(20) NOT NULL,
//       document_type ENUM('government_id', 'passport', 'driving_license') NOT NULL,
//       file_name VARCHAR(255) NOT NULL,
//       file_path VARCHAR(500) NOT NULL,
//       file_size INT NOT NULL,
//       uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
//       FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
//       INDEX idx_booking_id (booking_id),
//       INDEX idx_document_type (document_type)
//     )
//   `;
  
//   await pool.execute(createUsersTable);
//   await pool.execute(createSessionsTable);
//   await pool.execute(createBookingsTable);
//   await pool.execute(createBookingGuestsTable);
//   await pool.execute(createBookingDocumentsTable);
  
//   log('info', '✅ Tables created successfully');
// };

// const insertSampleData = async () => {
//   try {
//     const [existing] = await pool.execute('SELECT COUNT(*) as count FROM users');
    
//     if (existing[0].count === 0) {
//       await pool.execute(`
//         INSERT INTO users (email, phone, login_method, profile_completed) VALUES
//         ('test.user@example.com', NULL, 'email', FALSE),
//         ('demo@example.com', NULL, 'email', FALSE),
//         (NULL, '+1234567890', 'phone', FALSE),
//         (NULL, '+1987654321', 'phone', FALSE),
//         ('complete.user@example.com', '+1555000111', 'email', TRUE)
//       `);
//       log('info', '✅ Sample users inserted');
//     }

//     // Insert sample bookings
//     const [existingBookings] = await pool.execute('SELECT COUNT(*) as count FROM bookings');
//     if (existingBookings[0].count === 0) {
//       await pool.execute(`
//         INSERT INTO bookings (
//           booking_id, user_id, guest_first_name, guest_last_name, guest_email, guest_phone,
//           room_description, check_in_date, check_out_date, number_of_guests,
//           payment_method, payment_name, total_payment, booking_status
//         ) VALUES
//         ('BK12345001', 5, 'John', 'Doe', 'john.doe@example.com', '+1555000111', 
//          'Deluxe Ocean View Room with King Bed, Balcony, and Complimentary Breakfast', 
//          '2024-08-15', '2024-08-18', 2, 'credit_card', 'John Doe', 450.00, 'confirmed'),
//         ('BK12345002', NULL, 'Jane', 'Smith', 'jane.smith@example.com', '+1555000222',
//          'Standard Twin Room with Garden View and Free WiFi',
//          '2024-08-20', '2024-08-22', 1, 'paypal', 'Jane Smith', 200.00, 'confirmed'),
//         ('BK12345003', NULL, 'Robert', 'Johnson', 'robert.j@example.com', '+1555000333',
//          'Executive Suite with Living Area, Kitchenette, and Premium Amenities',
//          '2024-08-25', '2024-08-28', 3, 'debit_card', 'Robert Johnson', 750.00, 'confirmed')
//       `);
//       log('info', '✅ Sample bookings inserted');
//     }
//   } catch (error) {
//     log('warn', '⚠️  Sample data insertion skipped', { error: error.message });
//   }
// };

// // Communication Setup
// const setupCommunication = () => {
//   // Email setup
//   if (CONFIG.EMAIL_USER && CONFIG.EMAIL_PASS) {
//     emailTransporter = createTransport({
//       host: CONFIG.EMAIL_HOST,
//       port: CONFIG.EMAIL_PORT,
//       secure: false,
//       auth: {
//         user: CONFIG.EMAIL_USER,
//         pass: CONFIG.EMAIL_PASS
//       }
//     });
//     log('info', '✅ Email transporter configured');
//   } else {
//     log('warn', '⚠️  Email not configured - email OTPs will be shown in console');
//   }
  
//   // Twilio setup
//   if (CONFIG.TWILIO_ACCOUNT_SID && CONFIG.TWILIO_AUTH_TOKEN && twilio) {
//     twilioClient = twilio.default(CONFIG.TWILIO_ACCOUNT_SID, CONFIG.TWILIO_AUTH_TOKEN);
//     log('info', '✅ Twilio SMS configured');
//   } else {
//     log('warn', '⚠️  Twilio not configured - phone OTPs will be shown in console');
//   }
// };

// // Communication Functions
// const sendEmail = async (to, subject, html) => {
//   try {
//     await emailTransporter.sendMail({
//       from: `"${CONFIG.APP_NAME}" <${CONFIG.EMAIL_USER}>`,
//       to,
//       subject,
//       html
//     });
//     return { success: true };
//   } catch (error) {
//     log('error', 'Email sending failed', { error: error.message, to });
//     return { success: false, error: error.message };
//   }
// };

// const sendSMS = async (to, message) => {
//   try {
//     await twilioClient.messages.create({
//       body: message,
//       from: CONFIG.TWILIO_PHONE_NUMBER,
//       to
//     });
//     return { success: true };
//   } catch (error) {
//     log('error', 'SMS sending failed', { error: error.message, to });
//     return { success: false, error: error.message };
//   }
// };

// const sendLoginOTP = async (email, otp, isResend = false) => {
//   const subject = isResend ? 'New Login Verification Code' : 'Login Verification Code';
//   const emailHtml = `
//     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//       <h2 style="color: #333; text-align: center;">
//         ${isResend ? 'New ' : ''}Email Login Verification
//       </h2>
//       <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
//         <p style="font-size: 16px; color: #555;">
//           ${isResend ? 'You requested a new verification code.' : 'Hello! Someone is trying to login to your account using email.'}
//         </p>
//         <p style="font-size: 16px; color: #555;">Your verification code is:</p>
//         <div style="text-align: center; margin: 20px 0;">
//           <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px;">
//             ${otp}
//           </span>
//         </div>
//         <p style="font-size: 14px; color: #666;">
//           This code will expire in 10 minutes. If you didn't request this, please ignore this email.
//         </p>
//       </div>
//     </div>
//   `;
  
//   return await sendEmail(email, subject, emailHtml);
// };

// const sendPhoneOTP = async (phone, otp, isResend = false) => {
//   const message = `${CONFIG.APP_NAME}: Your ${isResend ? 'new ' : ''}verification code is ${otp}. This code expires in 10 minutes. If you didn't request this, please ignore.`;
//   return await sendSMS(phone, message);
// };

// // User Functions
// const findUserByIdentifier = async (identifier, loginMethod) => {
//   if (loginMethod === 'email' && validator.isEmail(identifier)) {
//     const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [identifier]);
//     return rows.length > 0 ? rows[0] : null;
//   }
  
//   if (loginMethod === 'phone' && isValidPhone(identifier)) {
//     const [rows] = await pool.execute('SELECT * FROM users WHERE phone = ?', [identifier]);
//     return rows.length > 0 ? rows[0] : null;
//   }
  
//   return null;
// };

// const createUser = async (identifier, loginMethod) => {
//   if (loginMethod === 'email') {
//     const [result] = await pool.execute(
//       'INSERT INTO users (email, login_method, profile_completed) VALUES (?, ?, FALSE)',
//       [identifier.toLowerCase().trim(), 'email']
//     );
//     return result.insertId;
//   }
  
//   if (loginMethod === 'phone') {
//     const [result] = await pool.execute(
//       'INSERT INTO users (phone, login_method, profile_completed) VALUES (?, ?, FALSE)',
//       [identifier, 'phone']
//     );
//     return result.insertId;
//   }
  
//   return null;
// };

// const findOrCreateUser = async (identifier, loginMethod) => {
//   let user = await findUserByIdentifier(identifier, loginMethod);
  
//   if (!user) {
//     if (loginMethod === 'email' && validator.isEmail(identifier)) {
//       const userId = await createUser(identifier, 'email');
//       const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId]);
//       user = rows[0];
//     } else if (loginMethod === 'phone' && isValidPhone(identifier)) {
//       const userId = await createUser(identifier, 'phone');
//       const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId]);
//       user = rows[0];
//     }
//   }
  
//   return user;
// };

// // Session Management
// const createLoginSession = async (identifier, otp, sessionId, userId, loginMethod, req) => {
//   const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
//   const ipAddress = req.ip || req.connection.remoteAddress;
//   const userAgent = req.get('User-Agent');
  
//   await pool.execute(
//     'INSERT INTO login_sessions (identifier, otp, session_id, expires_at, user_id, login_method, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
//     [identifier, otp, sessionId, expiresAt, userId, loginMethod, ipAddress, userAgent]
//   );
// };

// // API Routes

// // Health Check (Render requires this)
// app.get('/health', (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'Server is healthy',
//     timestamp: new Date().toISOString(),
//     environment: CONFIG.NODE_ENV
//   });
// });

// app.get('/api/health', (req, res) => {
//   res.json({
//     success: true,
//     message: 'API is running',
//     timestamp: new Date().toISOString(),
//     database: pool ? 'Connected' : 'Disconnected',
//     environment: CONFIG.NODE_ENV,
//     services: {
//       email: !!emailTransporter,
//       sms: !!twilioClient
//     }
//   });
// });

// // EMAIL LOGIN APIs

// // 1. Email Login API
// app.post('/api/auth/login', otpLimiter, async (req, res) => {
//   try {
//     const { identifier, termsAccepted } = req.body;
    
//     if (!identifier || !termsAccepted) {
//       return res.status(400).json(formatResponse(false, 'Email and terms acceptance are required'));
//     }
    
//     if (!validator.isEmail(identifier)) {
//       return res.status(400).json(formatResponse(false, 'Please enter a valid email address'));
//     }
    
//     // Find or create user
//     const user = await findOrCreateUser(identifier, 'email');
//     if (!user) {
//       return res.status(500).json(formatResponse(false, 'Unable to process request'));
//     }
    
//     // Generate OTP and session
//     const sessionId = generateSessionId();
//     const otp = generateOTP();
    
//     // Store session
//     await createLoginSession(identifier, otp, sessionId, user.id, 'email', req);
    
//     // Send OTP email
//     if (emailTransporter) {
//       const emailResult = await sendLoginOTP(identifier, otp);
//       if (!emailResult.success) {
//         log('warn', 'Failed to send email OTP', { email: identifier });
//       }
//     } else {
//       log('info', `🔧 Email OTP for ${identifier}: ${otp} (Session: ${sessionId})`);
//     }
    
//     log('info', 'Email login initiated', { email: identifier, sessionId });
    
//     res.json(formatResponse(true, 'Verification code sent to your email address', {
//       sessionId,
//       emailSent: maskEmail(identifier),
//       loginType: 'email',
//       devMode: CONFIG.NODE_ENV === 'development' ? { otp } : undefined
//     }));
    
//   } catch (error) {
//     log('error', 'Email login error', { error: error.message });
//     res.status(500).json(formatResponse(false, 'Internal server error'));
//   }
// });

// // 2. Email OTP Verification API
// app.post('/api/auth/verify-otp', async (req, res) => {
//   try {
//     const { otp, sessionId } = req.body;
    
//     if (!otp || !sessionId) {
//       return res.status(400).json(formatResponse(false, 'OTP and session ID are required'));
//     }
    
//     // Verify OTP
//     const [sessions] = await pool.execute(
//       'SELECT * FROM login_sessions WHERE otp = ? AND session_id = ? AND expires_at > NOW() AND otp_used = FALSE AND login_method = "email" ORDER BY created_at DESC LIMIT 1',
//       [otp, sessionId]
//     );
    
//     if (sessions.length === 0) {
//       return res.status(400).json(formatResponse(false, 'Invalid or expired OTP'));
//     }
    
//     const session = sessions[0];
    
//     // Mark OTP as used
//     await pool.execute('UPDATE login_sessions SET otp_used = TRUE WHERE id = ?', [session.id]);
    
//     // Get user
//     const [users] = await pool.execute('SELECT * FROM users WHERE id = ?', [session.user_id]);
//     const user = users[0];
    
//     // Generate temporary token
//     const tempToken = generateJWT({
//       userId: user.id,
//       sessionId,
//       identifier: session.identifier,
//       loginMethod: 'email',
//       type: 'profile_completion'
//     }, '30m');
    
//     log('info', 'Email OTP verified', { email: session.identifier, userId: user.id });
    
//     res.json(formatResponse(true, 'OTP verified successfully', {
//       tempToken,
//       user: {
//         id: user.id,
//         email: user.email,
//         phone: user.phone,
//         loginMethod: user.login_method,
//         profileCompleted: user.profile_completed || false,
//         needsProfileCompletion: !user.profile_completed
//       }
//     }));
    
//   } catch (error) {
//     log('error', 'Email OTP verification error', { error: error.message });
//     res.status(500).json(formatResponse(false, 'Internal server error'));
//   }
// });

// // 3. Resend Email OTP API
// app.post('/api/auth/resend-otp', resendLimiter, async (req, res) => {
//   try {
//     const { sessionId } = req.body;
    
//     if (!sessionId) {
//       return res.status(400).json(formatResponse(false, 'Session ID is required'));
//     }
    
//     // Get active session
//     const [sessions] = await pool.execute(
//       'SELECT * FROM login_sessions WHERE session_id = ? AND expires_at > NOW() AND login_method = "email" ORDER BY created_at DESC LIMIT 1',
//       [sessionId]
//     );
    
//     if (sessions.length === 0) {
//       return res.status(404).json(formatResponse(false, 'Session not found or expired. Please start login again'));
//     }
    
//     const session = sessions[0];
    
//     // Check cooldown (20 seconds)
//     const twentySecondsAgo = new Date(Date.now() - 20 * 1000);
//     if (new Date(session.created_at) > twentySecondsAgo) {
//       const remainingSeconds = Math.ceil((new Date(session.created_at).getTime() + 20000 - Date.now()) / 1000);
//       return res.status(400).json(formatResponse(false, `Please wait ${remainingSeconds} seconds before requesting a new code`));
//     }
    
//     // Generate new OTP
//     const newOTP = generateOTP();
//     const newExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
//     // Update session
//     await pool.execute(
//       'UPDATE login_sessions SET otp = ?, expires_at = ?, otp_used = FALSE, created_at = NOW() WHERE session_id = ? AND id = ?',
//       [newOTP, newExpiresAt, sessionId, session.id]
//     );
    
//     // Send new OTP
//     if (emailTransporter) {
//       const emailResult = await sendLoginOTP(session.identifier, newOTP, true);
//       if (!emailResult.success) {
//         log('warn', 'Failed to resend email OTP', { email: session.identifier });
//       }
//     } else {
//       log('info', `🔄 Resend Email OTP for ${session.identifier}: ${newOTP} (Session: ${sessionId})`);
//     }
    
//     res.json(formatResponse(true, 'New verification code sent to your email address', {
//       sessionId,
//       emailSent: maskEmail(session.identifier),
//       devMode: CONFIG.NODE_ENV === 'development' ? { otp: newOTP } : undefined
//     }));
    
//   } catch (error) {
//     log('error', 'Email resend OTP error', { error: error.message });
//     res.status(500).json(formatResponse(false, 'Internal server error'));
//   }
// });

// // PHONE LOGIN APIs

// // 4. Phone Login API
// app.post('/api/auth/login-phone', otpLimiter, async (req, res) => {
//   try {
//     const { identifier, termsAccepted } = req.body;
    
//     if (!identifier || !termsAccepted) {
//       return res.status(400).json(formatResponse(false, 'Phone number and terms acceptance are required'));
//     }
    
//     if (!isValidPhone(identifier)) {
//       return res.status(400).json(formatResponse(false, 'Please enter a valid phone number'));
//     }
    
//     // Find or create user
//     const user = await findOrCreateUser(identifier, 'phone');
//     if (!user) {
//       return res.status(500).json(formatResponse(false, 'Unable to process request'));
//     }
    
//     // Generate OTP and session
//     const sessionId = generateSessionId();
//     const otp = generateOTP();
    
//     // Store session
//     await createLoginSession(identifier, otp, sessionId, user.id, 'phone', req);
    
//     // Send OTP SMS
//     if (twilioClient) {
//       const smsResult = await sendPhoneOTP(identifier, otp);
//       if (!smsResult.success) {
//         log('warn', 'Failed to send SMS OTP', { phone: identifier });
//       }
//     } else {
//       log('info', `🔧 Phone OTP for ${identifier}: ${otp} (Session: ${sessionId})`);
//     }
    
//     log('info', 'Phone login initiated', { phone: identifier, sessionId });
    
//     res.json(formatResponse(true, 'Verification code sent to your phone number', {
//       sessionId,
//       phoneSent: maskPhone(identifier),
//       loginType: 'phone',
//       devMode: CONFIG.NODE_ENV === 'development' ? { otp } : undefined
//     }));
    
//   } catch (error) {
//     log('error', 'Phone login error', { error: error.message });
//     res.status(500).json(formatResponse(false, 'Internal server error'));
//   }
// });

// // 5. Phone OTP Verification API
// app.post('/api/auth/verify-phone-otp', async (req, res) => {
//   try {
//     const { otp, sessionId } = req.body;
    
//     if (!otp || !sessionId) {
//       return res.status(400).json(formatResponse(false, 'OTP and session ID are required'));
//     }
    
//     // Verify OTP
//     const [sessions] = await pool.execute(
//       'SELECT * FROM login_sessions WHERE otp = ? AND session_id = ? AND expires_at > NOW() AND otp_used = FALSE AND login_method = "phone" ORDER BY created_at DESC LIMIT 1',
//       [otp, sessionId]
//     );
    
//     if (sessions.length === 0) {
//       return res.status(400).json(formatResponse(false, 'Invalid or expired OTP'));
//     }
    
//     const session = sessions[0];
    
//     // Mark OTP as used
//     await pool.execute('UPDATE login_sessions SET otp_used = TRUE WHERE id = ?', [session.id]);
    
//     // Get user
//     const [users] = await pool.execute('SELECT * FROM users WHERE id = ?', [session.user_id]);
//     const user = users[0];
    
//     // Generate temporary token
//     const tempToken = generateJWT({
//       userId: user.id,
//       sessionId,
//       identifier: session.identifier,
//       loginMethod: 'phone',
//       type: 'profile_completion'
//     }, '30m');
    
//     log('info', 'Phone OTP verified', { phone: session.identifier, userId: user.id });
    
//     res.json(formatResponse(true, 'OTP verified successfully', {
//       tempToken,
//       user: {
//         id: user.id,
//         email: user.email,
//         phone: user.phone,
//         loginMethod: user.login_method,
//         profileCompleted: user.profile_completed || false,
//         needsProfileCompletion: !user.profile_completed
//       }
//     }));
    
//   } catch (error) {
//     log('error', 'Phone OTP verification error', { error: error.message });
//     res.status(500).json(formatResponse(false, 'Internal server error'));
//   }
// });

// // 6. Resend Phone OTP API
// app.post('/api/auth/resend-phone-otp', resendLimiter, async (req, res) => {
//   try {
//     const { sessionId } = req.body;
    
//     if (!sessionId) {
//       return res.status(400).json(formatResponse(false, 'Session ID is required'));
//     }
    
//     // Get active session
//     const [sessions] = await pool.execute(
//       'SELECT * FROM login_sessions WHERE session_id = ? AND expires_at > NOW() AND login_method = "phone" ORDER BY created_at DESC LIMIT 1',
//       [sessionId]
//     );
    
//     if (sessions.length === 0) {
//       return res.status(404).json(formatResponse(false, 'Session not found or expired. Please start login again'));
//     }
    
//     const session = sessions[0];
    
//     // Check cooldown (20 seconds)
//     const twentySecondsAgo = new Date(Date.now() - 20 * 1000);
//     if (new Date(session.created_at) > twentySecondsAgo) {
//       const remainingSeconds = Math.ceil((new Date(session.created_at).getTime() + 20000 - Date.now()) / 1000);
//       return res.status(400).json(formatResponse(false, `Please wait ${remainingSeconds} seconds before requesting a new code`));
//     }
    
//     // Generate new OTP
//     const newOTP = generateOTP();
//     const newExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
//     // Update session
//     await pool.execute(
//       'UPDATE login_sessions SET otp = ?, expires_at = ?, otp_used = FALSE, created_at = NOW() WHERE session_id = ? AND id = ?',
//       [newOTP, newExpiresAt, sessionId, session.id]
//     );
    
//     // Send new OTP
//     if (twilioClient) {
//       const smsResult = await sendPhoneOTP(session.identifier, newOTP, true);
//       if (!smsResult.success) {
//         log('warn', 'Failed to resend SMS OTP', { phone: session.identifier });
//       }
//     } else {
//       log('info', `🔄 Resend Phone OTP for ${session.identifier}: ${newOTP} (Session: ${sessionId})`);
//     }
    
//     res.json(formatResponse(true, 'New verification code sent to your phone number', {
//       sessionId,
//       phoneSent: maskPhone(session.identifier),
//       devMode: CONFIG.NODE_ENV === 'development' ? { otp: newOTP } : undefined
//     }));
    
//   } catch (error) {
//     log('error', 'Phone resend OTP error', { error: error.message });
//     res.status(500).json(formatResponse(false, 'Internal server error'));
//   }
// });

// // PROFILE COMPLETION API (Smart - handles both email and phone login)

// app.post('/api/user/complete-profile', async (req, res) => {
//   try {
//     const { firstName, lastName, email, phone, marketingConsent, tempToken } = req.body;
    
//     if (!firstName || !lastName || !tempToken) {
//       return res.status(400).json(formatResponse(false, 'First name, last name, and token are required'));
//     }
    
//     // Verify token
//     let decoded;
//     try {
//       decoded = jwt.verify(tempToken, CONFIG.JWT_SECRET);
//       if (decoded.type !== 'profile_completion') throw new Error('Invalid token type');
//     } catch (tokenError) {
//       return res.status(401).json(formatResponse(false, 'Invalid or expired token'));
//     }
    
//     // Get user
//     const [users] = await pool.execute('SELECT * FROM users WHERE id = ?', [decoded.userId]);
//     if (users.length === 0) {
//       return res.status(404).json(formatResponse(false, 'User not found'));
//     }
    
//     const user = users[0];
    
//     // Smart validation based on login method
//     if (decoded.loginMethod === 'email') {
//       // Email login users need to provide phone number
//       if (!phone || !isValidPhone(phone)) {
//         return res.status(400).json(formatResponse(false, 'Valid phone number is required to complete your profile'));
//       }
      
//       // Check if phone is already taken
//       const [existingPhone] = await pool.execute('SELECT id FROM users WHERE phone = ? AND id != ?', [phone, user.id]);
//       if (existingPhone.length > 0) {
//         return res.status(409).json(formatResponse(false, 'This phone number is already registered with another account'));
//       }
//     } else if (decoded.loginMethod === 'phone') {
//       // Phone login users need to provide email
//       if (!email || !validator.isEmail(email)) {
//         return res.status(400).json(formatResponse(false, 'Valid email address is required to complete your profile'));
//       }
      
//       // Check if email is already taken
//       const [existingEmail] = await pool.execute('SELECT id FROM users WHERE email = ? AND id != ?', [email.toLowerCase(), user.id]);
//       if (existingEmail.length > 0) {
//         return res.status(409).json(formatResponse(false, 'This email address is already registered with another account'));
//       }
//     }
    
//     // Update user profile
//     const updateQuery = `
//       UPDATE users 
//       SET first_name = ?, last_name = ?, email = COALESCE(?, email), phone = COALESCE(?, phone), 
//           marketing_consent = ?, profile_completed = TRUE, updated_at = NOW() 
//       WHERE id = ?
//     `;
    
//     await pool.execute(updateQuery, [
//       firstName.trim(),
//       lastName.trim(),
//       email ? email.toLowerCase().trim() : null,
//       phone || null,
//       marketingConsent || false,
//       decoded.userId
//     ]);
    
//     // Get updated user
//     const [updatedUsers] = await pool.execute('SELECT * FROM users WHERE id = ?', [decoded.userId]);
//     const updatedUser = updatedUsers[0];
    
//     // Generate auth token
//     const authToken = generateJWT({
//       userId: updatedUser.id,
//       email: updatedUser.email,
//       phone: updatedUser.phone,
//       loginMethod: updatedUser.login_method,
//       type: 'authentication'
//     });
    
//     log('info', 'Profile completed', { 
//       userId: updatedUser.id, 
//       loginMethod: decoded.loginMethod,
//       email: updatedUser.email,
//       phone: updatedUser.phone 
//     });
    
//     res.json(formatResponse(true, 'Profile completed successfully', {
//       authToken,
//       user: {
//         id: updatedUser.id,
//         email: updatedUser.email,
//         phone: updatedUser.phone,
//         firstName: updatedUser.first_name,
//         lastName: updatedUser.last_name,
//         loginMethod: updatedUser.login_method,
//         profileCompleted: updatedUser.profile_completed,
//         marketingConsent: updatedUser.marketing_consent
//       }
//     }));
    
//   } catch (error) {
//     log('error', 'Profile completion error', { error: error.message });
//     res.status(500).json(formatResponse(false, 'Internal server error'));
//   }
// });

// // PROTECTED ROUTES

// // Get Profile API
// app.get('/api/user/profile', authenticateToken, async (req, res) => {
//   try {
//     const user = req.user;
//     res.json(formatResponse(true, 'Profile retrieved successfully', {
//       user: {
//         id: user.id,
//         email: user.email,
//         phone: user.phone,
//         firstName: user.first_name,
//         lastName: user.last_name,
//         loginMethod: user.login_method,
//         profileCompleted: user.profile_completed,
//         marketingConsent: user.marketing_consent,
//         memberSince: user.created_at
//       }
//     }));
    
//   } catch (error) {
//     log('error', 'Profile fetch error', { error: error.message });
//     res.status(500).json(formatResponse(false, 'Internal server error'));
//   }
// });

// // BOOKING MANAGEMENT APIs

// // 9. Create Booking API
// app.post('/api/booking/create', bookingLimiter, authenticateToken, async (req, res) => {
//   try {
//     const {
//       // User details (taken from authenticated user + form)
//       userGender,
//       userAge,
      
//       // Address details
//       permanentAddress,
//       city,
//       state,
//       country,
//       pincode,
      
//       // Professional details
//       occupation,
//       occupationEmail,
//       gstNumber,
      
//       // Booking details
//       roomDescription,
//       checkInDate,
//       checkOutDate,
//       totalGuests,
//       paymentMethod,
//       paymentName,
//       totalPayment,
//       specialRequests
//     } = req.body;
    
//     // Validation
//     if (!roomDescription || !checkInDate || !checkOutDate || 
//         !totalGuests || !paymentMethod || !paymentName || !totalPayment) {
//       return res.status(400).json(formatResponse(false, 'Missing required booking fields'));
//     }
    
//     if (!isValidDate(checkInDate) || !isValidDate(checkOutDate)) {
//       return res.status(400).json(formatResponse(false, 'Invalid date format. Use YYYY-MM-DD'));
//     }
    
//     if (new Date(checkInDate) >= new Date(checkOutDate)) {
//       return res.status(400).json(formatResponse(false, 'Check-out date must be after check-in date'));
//     }
    
//     if (totalGuests < 1 || totalGuests > 20) {
//       return res.status(400).json(formatResponse(false, 'Number of guests must be between 1 and 20'));
//     }
    
//     const validPaymentMethods = ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash'];
//     if (!validPaymentMethods.includes(paymentMethod)) {
//       return res.status(400).json(formatResponse(false, 'Invalid payment method'));
//     }
    
//     if (occupationEmail && !validator.isEmail(occupationEmail)) {
//       return res.status(400).json(formatResponse(false, 'Invalid occupation email format'));
//     }
    
//     if (isNaN(totalPayment) || totalPayment <= 0) {
//       return res.status(400).json(formatResponse(false, 'Invalid total payment amount'));
//     }
    
//     // Generate unique booking ID
//     const bookingId = generateBookingId();
    
//     // Create booking with user details from authentication
//     await pool.execute(`
//       INSERT INTO bookings (
//         booking_id, user_id, user_first_name, user_last_name, user_email, user_phone,
//         user_gender, user_age, permanent_address, city, state, country, pincode,
//         occupation, occupation_email, gst_number, room_description, check_in_date, 
//         check_out_date, total_guests, payment_method, payment_name, total_payment, special_requests
//       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `, [
//       bookingId,
//       req.user.id,
//       req.user.first_name,
//       req.user.last_name,
//       req.user.email,
//       req.user.phone,
//       userGender || null,
//       userAge || null,
//       permanentAddress?.trim() || null,
//       city?.trim() || null,
//       state?.trim() || null,
//       country?.trim() || null,
//       pincode?.trim() || null,
//       occupation?.trim() || null,
//       occupationEmail?.toLowerCase().trim() || null,
//       gstNumber?.trim() || null,
//       roomDescription.trim(),
//       checkInDate,
//       checkOutDate,
//       totalGuests,
//       paymentMethod,
//       paymentName.trim(),
//       parseFloat(totalPayment),
//       specialRequests?.trim() || null
//     ]);
    
//     log('info', 'Booking created with new schema', { 
//       bookingId, 
//       userId: req.user.id, 
//       userLastName: req.user.last_name,
//       totalGuests
//     });
    
//     res.status(201).json(formatResponse(true, 'Booking created successfully', {
//       bookingId,
//       checkInDate,
//       checkOutDate,
//       totalPayment: parseFloat(totalPayment),
//       totalGuests,
//       status: 'confirmed',
//       nextStep: 'Add guests using /api/booking/add-guest endpoint'
//     }));
    
//   } catch (error) {
//     log('error', 'Booking creation error', { error: error.message });
//     res.status(500).json(formatResponse(false, 'Internal server error'));
//   }
// });

// // 10. Get Booking Details by ID and Last Name API
// app.get('/api/booking/details', async (req, res) => {
//   try {
//     const { bookingId, lastName } = req.query;
    
//     if (!bookingId || !lastName) {
//       return res.status(400).json(formatResponse(false, 'Booking ID and user last name are required'));
//     }
    
//     // Find booking by booking ID and USER's last name (not guest)
//     const [bookings] = await pool.execute(
//       'SELECT * FROM bookings WHERE booking_id = ? AND user_last_name = ?',
//       [bookingId.trim(), lastName.trim()]
//     );
    
//     if (bookings.length === 0) {
//       return res.status(404).json(formatResponse(false, 'Booking not found with provided booking ID and user last name'));
//     }
    
//     const booking = bookings[0];
    
//     // Get all guests for this booking
//     const [guests] = await pool.execute(
//       'SELECT * FROM booking_guests WHERE booking_id = ? ORDER BY is_primary_guest DESC, created_at ASC',
//       [bookingId]
//     );
    
//     // Get uploaded documents
//     const [documents] = await pool.execute(
//       'SELECT document_type, file_name, uploaded_at FROM booking_documents WHERE booking_id = ?',
//       [bookingId]
//     );
    
//     log('info', 'Booking details retrieved', { bookingId, userLastName: lastName });
    
//     res.json(formatResponse(true, 'Booking details retrieved successfully', {
//       booking: {
//         bookingId: booking.booking_id,
        
//         // User Details (Main Booker)
//         userDetails: {
//           firstName: booking.user_first_name,
//           lastName: booking.user_last_name,
//           email: booking.user_email,
//           phone: booking.user_phone,
//           gender: booking.user_gender,
//           age: booking.user_age
//         },
        
//         // Address Details
//         address: {
//           permanentAddress: booking.permanent_address,
//           city: booking.city,
//           state: booking.state,
//           country: booking.country,
//           pincode: booking.pincode
//         },
        
//         // Professional Details
//         professional: {
//           occupation: booking.occupation,
//           occupationEmail: booking.occupation_email,
//           gstNumber: booking.gst_number
//         },
        
//         // Booking Details
//         bookingDetails: {
//           roomDescription: booking.room_description,
//           checkInDate: booking.check_in_date,
//           checkOutDate: booking.check_out_date,
//           totalGuests: booking.total_guests,
//           paymentMethod: booking.payment_method,
//           paymentName: booking.payment_name,
//           totalPayment: parseFloat(booking.total_payment),
//           bookingStatus: booking.booking_status,
//           specialRequests: booking.special_requests
//         },
        
//         // Guest List
//         guests: guests.map(guest => ({
//           id: guest.id,
//           firstName: guest.guest_first_name,
//           lastName: guest.guest_last_name,
//           age: guest.guest_age,
//           gender: guest.guest_gender,
//           idType: guest.guest_id_type,
//           idNumber: guest.guest_id_number,
//           isPrimaryGuest: guest.is_primary_guest,
//           addedAt: guest.created_at
//         })),
        
//         // Metadata
//         createdAt: booking.created_at,
//         updatedAt: booking.updated_at
//       },
      
//       // Documents
//       documents: documents.map(doc => ({
//         type: doc.document_type,
//         fileName: doc.file_name,
//         uploadedAt: doc.uploaded_at
//       })),
      
//       // Summary
//       summary: {
//         totalGuests: guests.length,
//         primaryGuest: guests.find(g => g.is_primary_guest),
//         documentsUploaded: documents.length
//       }
//     }));
    
//   } catch (error) {
//     log('error', 'Get booking details error', { error: error.message });
//     res.status(500).json(formatResponse(false, 'Internal server error'));
//   }
// });

// // 11. Get Booking Personal Details API (requires authentication)
// app.get('/api/booking/personal-details', authenticateToken, async (req, res) => {
//   try {
//     const { bookingId } = req.query;
    
//     if (!bookingId) {
//       return res.status(400).json(formatResponse(false, 'Booking ID is required'));
//     }
    
//     // Find booking (ensure it belongs to the authenticated user)
//     const [bookings] = await pool.execute(
//       'SELECT * FROM bookings WHERE booking_id = ? AND user_id = ?',
//       [bookingId.trim(), req.user.id]
//     );
    
//     if (bookings.length === 0) {
//       return res.status(404).json(formatResponse(false, 'Booking not found or access denied'));
//     }
    
//     const booking = bookings[0];
    
//     res.json(formatResponse(true, 'Booking personal details retrieved successfully', {
//       personalDetails: {
//         guestFirstName: booking.guest_first_name,
//         guestLastName: booking.guest_last_name,
//         guestEmail: booking.guest_email,
//         guestPhone: booking.guest_phone,
//         specialRequests: booking.special_requests
//       }
//     }));
    
//   } catch (error) {
//     log('error', 'Get booking personal details error', { error: error.message });
//     res.status(500).json(formatResponse(false, 'Internal server error'));
//   }
// });

// // 12. Update Booking Personal Details API
// app.put('/api/booking/personal-details', bookingLimiter, authenticateToken, async (req, res) => {
//   try {
//     const { 
//       bookingId, 
//       // User details (phone/email NOT allowed to update)
//       userFirstName,
//       userGender,
//       userAge,
      
//       // Address details
//       permanentAddress,
//       city,
//       state,
//       country,
//       pincode,
      
//       // Professional details
//       occupation,
//       occupationEmail,
//       gstNumber,
      
//       // Booking details
//       specialRequests
//     } = req.body;
    
//     if (!bookingId) {
//       return res.status(400).json(formatResponse(false, 'Booking ID is required'));
//     }
    
//     // Verify booking belongs to user
//     const [existingBookings] = await pool.execute(
//       'SELECT id, user_email, user_phone FROM bookings WHERE booking_id = ? AND user_id = ?',
//       [bookingId.trim(), req.user.id]
//     );
    
//     if (existingBookings.length === 0) {
//       return res.status(404).json(formatResponse(false, 'Booking not found or access denied'));
//     }
    
//     // Validation for updatable fields
//     if (userAge && (userAge < 1 || userAge > 120)) {
//       return res.status(400).json(formatResponse(false, 'Age must be between 1 and 120'));
//     }
    
//     if (userGender && !['male', 'female', 'other'].includes(userGender)) {
//       return res.status(400).json(formatResponse(false, 'Invalid gender value'));
//     }
    
//     if (occupationEmail && !validator.isEmail(occupationEmail)) {
//       return res.status(400).json(formatResponse(false, 'Invalid occupation email format'));
//     }
    
//     // Update booking personal details (excluding phone and email)
//     await pool.execute(`
//       UPDATE bookings 
//       SET 
//         user_first_name = COALESCE(?, user_first_name),
//         user_gender = COALESCE(?, user_gender),
//         user_age = COALESCE(?, user_age),
//         permanent_address = COALESCE(?, permanent_address),
//         city = COALESCE(?, city),
//         state = COALESCE(?, state),
//         country = COALESCE(?, country),
//         pincode = COALESCE(?, pincode),
//         occupation = COALESCE(?, occupation),
//         occupation_email = COALESCE(?, occupation_email),
//         gst_number = COALESCE(?, gst_number),
//         special_requests = COALESCE(?, special_requests),
//         updated_at = NOW()
//       WHERE booking_id = ? AND user_id = ?
//     `, [
//       userFirstName?.trim() || null,
//       userGender || null,
//       userAge || null,
//       permanentAddress?.trim() || null,
//       city?.trim() || null,
//       state?.trim() || null,
//       country?.trim() || null,
//       pincode?.trim() || null,
//       occupation?.trim() || null,
//       occupationEmail?.toLowerCase().trim() || null,
//       gstNumber?.trim() || null,
//       specialRequests?.trim() || null,
//       bookingId.trim(),
//       req.user.id
//     ]);
    
//     log('info', 'Booking personal details updated (restricted)', { 
//       bookingId, 
//       userId: req.user.id,
//       updatedFields: {
//         userFirstName: !!userFirstName,
//         userGender: !!userGender,
//         userAge: !!userAge,
//         address: !!(permanentAddress || city || state || country || pincode),
//         professional: !!(occupation || occupationEmail || gstNumber),
//         specialRequests: !!specialRequests
//       }
//     });
    
//     res.json(formatResponse(true, 'Booking personal details updated successfully (phone and email are protected)', {
//       restrictedFields: ['user_email', 'user_phone', 'user_last_name'],
//       note: 'Phone number, email, and last name cannot be updated for security reasons'
//     }));
    
//   } catch (error) {
//     log('error', 'Update booking personal details error', { error: error.message });
//     res.status(500).json(formatResponse(false, 'Internal server error'));
//   }
// });

// // 13. Upload Government ID for Booking API
// // 13. Upload Government ID for Booking API (FIXED)
// app.post('/api/booking/upload-id', bookingLimiter, upload.single('governmentId'), async (req, res) => {
//   try {
//     const { bookingId, lastName } = req.body;
    
//     if (!bookingId || !lastName) {
//       return res.status(400).json(formatResponse(false, 'Booking ID and user last name are required'));
//     }
    
//     if (!req.file) {
//       return res.status(400).json(formatResponse(false, 'Government ID file is required'));
//     }
    
//     // ✅ FIXED: Check against USER's last name, not guest last name
//     const [bookings] = await pool.execute(
//       'SELECT id FROM bookings WHERE booking_id = ? AND user_last_name = ?',
//       [bookingId.trim(), lastName.trim()]
//     );
    
//     if (bookings.length === 0) {
//       // Delete uploaded file if booking verification fails
//       try {
//         await fs.unlink(req.file.path);
//       } catch {}
//       return res.status(404).json(formatResponse(false, 'Booking not found with provided booking ID and user last name'));
//     }
    
//     // Check if document already exists
//     const [existingDocs] = await pool.execute(
//       'SELECT id FROM booking_documents WHERE booking_id = ? AND document_type = "government_id"',
//       [bookingId.trim()]
//     );
    
//     if (existingDocs.length > 0) {
//       // Delete old document file
//       const [oldDoc] = await pool.execute(
//         'SELECT file_path FROM booking_documents WHERE booking_id = ? AND document_type = "government_id"',
//         [bookingId.trim()]
//       );
      
//       if (oldDoc.length > 0) {
//         try {
//           await fs.unlink(oldDoc[0].file_path);
//         } catch {}
//       }
      
//       // Update existing document record
//       await pool.execute(`
//         UPDATE booking_documents 
//         SET file_name = ?, file_path = ?, file_size = ?, uploaded_at = NOW()
//         WHERE booking_id = ? AND document_type = "government_id"
//       `, [req.file.filename, req.file.path, req.file.size, bookingId.trim()]);
//     } else {
//       // Insert new document record
//       await pool.execute(`
//         INSERT INTO booking_documents (booking_id, document_type, file_name, file_path, file_size)
//         VALUES (?, "government_id", ?, ?, ?)
//       `, [bookingId.trim(), req.file.filename, req.file.path, req.file.size]);
//     }
    
//     log('info', 'Government ID uploaded', { bookingId, fileName: req.file.filename });
    
//     res.json(formatResponse(true, 'Government ID uploaded successfully', {
//       fileName: req.file.filename,
//       fileSize: req.file.size,
//       uploadedAt: new Date().toISOString()
//     }));
    
//   } catch (error) {
//     // Clean up uploaded file on error
//     if (req.file) {
//       try {
//         await fs.unlink(req.file.path);
//       } catch {}
//     }
    
//     log('error', 'Government ID upload error', { error: error.message });
//     res.status(500).json(formatResponse(false, 'Internal server error'));
//   }
// });


// app.post('/api/booking/add-guest', bookingLimiter, authenticateToken, async (req, res) => {
//   try {
//     const {
//       bookingId,
//       guestFirstName,
//       guestLastName,
//       guestAge,
//       guestGender,
//       guestIdType,
//       guestIdNumber,
//       isPrimaryGuest = false
//     } = req.body;
    
//     if (!bookingId || !guestFirstName || !guestLastName) {
//       return res.status(400).json(formatResponse(false, 'Booking ID, guest first name, and last name are required'));
//     }
    
//     // Verify booking belongs to user
//     const [bookings] = await pool.execute(
//       'SELECT id, total_guests FROM bookings WHERE booking_id = ? AND user_id = ?',
//       [bookingId.trim(), req.user.id]
//     );
    
//     if (bookings.length === 0) {
//       return res.status(404).json(formatResponse(false, 'Booking not found or access denied'));
//     }
    
//     // Check current guest count
//     const [guestCount] = await pool.execute(
//       'SELECT COUNT(*) as count FROM booking_guests WHERE booking_id = ?',
//       [bookingId.trim()]
//     );
    
//     if (guestCount[0].count >= bookings[0].total_guests) {
//       return res.status(400).json(formatResponse(false, `Maximum ${bookings[0].total_guests} guests allowed for this booking`));
//     }
    
//     // Validation
//     if (guestAge && (guestAge < 1 || guestAge > 120)) {
//       return res.status(400).json(formatResponse(false, 'Guest age must be between 1 and 120'));
//     }
    
//     if (guestGender && !['male', 'female', 'other'].includes(guestGender)) {
//       return res.status(400).json(formatResponse(false, 'Invalid guest gender'));
//     }
    
//     if (guestIdType && !['aadhar', 'passport', 'driving_license', 'voter_id'].includes(guestIdType)) {
//       return res.status(400).json(formatResponse(false, 'Invalid guest ID type'));
//     }
    
//     // If setting as primary guest, remove primary status from others
//     if (isPrimaryGuest) {
//       await pool.execute(
//         'UPDATE booking_guests SET is_primary_guest = FALSE WHERE booking_id = ?',
//         [bookingId.trim()]
//       );
//     }
    
//     // Add guest
//     const [result] = await pool.execute(`
//       INSERT INTO booking_guests (
//         booking_id, guest_first_name, guest_last_name, guest_age, 
//         guest_gender, guest_id_type, guest_id_number, is_primary_guest
//       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
//     `, [
//       bookingId.trim(),
//       guestFirstName.trim(),
//       guestLastName.trim(),
//       guestAge || null,
//       guestGender || null,
//       guestIdType || null,
//       guestIdNumber?.trim() || null,
//       isPrimaryGuest
//     ]);
    
//     log('info', 'Guest added to booking', { 
//       bookingId, 
//       guestId: result.insertId,
//       guestName: `${guestFirstName} ${guestLastName}`,
//       isPrimaryGuest
//     });
    
//     res.status(201).json(formatResponse(true, 'Guest added successfully', {
//       guestId: result.insertId,
//       guestName: `${guestFirstName.trim()} ${guestLastName.trim()}`,
//       isPrimaryGuest,
//       totalGuests: guestCount[0].count + 1
//     }));
    
//   } catch (error) {
//     log('error', 'Add guest error', { error: error.message });
//     res.status(500).json(formatResponse(false, 'Internal server error'));
//   }
// });


// // 404 handler



// // Add this endpoint to your server.js file
// app.put('/api/booking/update-guest', bookingLimiter, authenticateToken, async (req, res) => {
//   try {
//     const {
//       bookingId,
//       guestId,
//       guestFirstName,
//       guestLastName,
//       guestAge,
//       guestGender,
//       guestIdType,
//       guestIdNumber,
//       isPrimaryGuest
//     } = req.body;
    
//     if (!bookingId || !guestId) {
//       return res.status(400).json(formatResponse(false, 'Booking ID and guest ID are required'));
//     }
    
//     // Verify booking belongs to user and guest exists
//     const [guests] = await pool.execute(`
//       SELECT bg.id 
//       FROM booking_guests bg 
//       JOIN bookings b ON bg.booking_id = b.booking_id 
//       WHERE bg.booking_id = ? AND bg.id = ? AND b.user_id = ?
//     `, [bookingId.trim(), guestId, req.user.id]);
    
//     if (guests.length === 0) {
//       return res.status(404).json(formatResponse(false, 'Guest not found or access denied'));
//     }
    
//     // Update guest details
//     await pool.execute(`
//       UPDATE booking_guests 
//       SET 
//         guest_first_name = COALESCE(?, guest_first_name),
//         guest_last_name = COALESCE(?, guest_last_name),
//         guest_age = COALESCE(?, guest_age),
//         guest_gender = COALESCE(?, guest_gender),
//         guest_id_type = COALESCE(?, guest_id_type),
//         guest_id_number = COALESCE(?, guest_id_number),
//         is_primary_guest = COALESCE(?, is_primary_guest)
//       WHERE id = ? AND booking_id = ?
//     `, [
//       guestFirstName?.trim() || null,
//       guestLastName?.trim() || null,
//       guestAge || null,
//       guestGender || null,
//       guestIdType || null,
//       guestIdNumber?.trim() || null,
//       isPrimaryGuest !== undefined ? isPrimaryGuest : null,
//       guestId,
//       bookingId.trim()
//     ]);
    
//     res.json(formatResponse(true, 'Guest details updated successfully'));
    
//   } catch (error) {
//     log('error', 'Update guest error', { error: error.message });
//     res.status(500).json(formatResponse(false, 'Internal server error'));
//   }
// });
// // =============================================================================
// // NEW API 16: Delete Guest from Booking
// // =============================================================================

// app.delete('/api/booking/delete-guest', bookingLimiter, authenticateToken, async (req, res) => {
//   try {
//     const { bookingId, guestId } = req.body;
    
//     if (!bookingId || !guestId) {
//       return res.status(400).json(formatResponse(false, 'Booking ID and guest ID are required'));
//     }
    
//     // Verify booking belongs to user and guest exists
//     const [guests] = await pool.execute(`
//       SELECT bg.id, bg.guest_first_name, bg.guest_last_name, bg.is_primary_guest
//       FROM booking_guests bg 
//       JOIN bookings b ON bg.booking_id = b.booking_id 
//       WHERE bg.booking_id = ? AND bg.id = ? AND b.user_id = ?
//     `, [bookingId.trim(), guestId, req.user.id]);
    
//     if (guests.length === 0) {
//       return res.status(404).json(formatResponse(false, 'Guest not found or access denied'));
//     }
    
//     const guest = guests[0];
    
//     // Delete guest
//     await pool.execute(
//       'DELETE FROM booking_guests WHERE id = ? AND booking_id = ?',
//       [guestId, bookingId.trim()]
//     );
    
//     log('info', 'Guest deleted from booking', { 
//       bookingId, 
//       guestId, 
//       guestName: `${guest.guest_first_name} ${guest.guest_last_name}`,
//       wasPrimary: guest.is_primary_guest
//     });
    
//     res.json(formatResponse(true, 'Guest removed successfully', {
//       deletedGuest: `${guest.guest_first_name} ${guest.guest_last_name}`,
//       wasPrimaryGuest: guest.is_primary_guest
//     }));
    
//   } catch (error) {
//     log('error', 'Delete guest error', { error: error.message });
//     res.status(500).json(formatResponse(false, 'Internal server error'));
//   }
// });

// app.use((req, res) => {
//   res.status(404).json(formatResponse(false, 'Endpoint not found'));
// });

// // Error handler
// app.use((error, req, res, next) => {
//   // Handle multer errors
//   if (error instanceof multer.MulterError) {
//     if (error.code === 'LIMIT_FILE_SIZE') {
//       return res.status(400).json(formatResponse(false, 'File size too large. Maximum 5MB allowed'));
//     }
//     return res.status(400).json(formatResponse(false, 'File upload error'));
//   }
  
//   if (error.message.includes('Only JPEG, PNG, and PDF files are allowed')) {
//     return res.status(400).json(formatResponse(false, error.message));
//   }
  
//   log('error', 'Unhandled error', { error: error.message, stack: error.stack });
//   res.status(500).json(formatResponse(false, 'Internal server error'));
// });
// // Cleanup expired sessions every hour
// setInterval(async () => {
//   if (pool) {
//     try {
//       const [result] = await pool.execute('DELETE FROM login_sessions WHERE expires_at < NOW()');
//       if (result.affectedRows > 0) {
//         log('info', `🧹 Cleaned up ${result.affectedRows} expired sessions`);
//       }
//     } catch (error) {
//       log('error', 'Cleanup error', { error: error.message });
//     }
//   }
// }, 60 * 60 * 1000);

// // Start server
// const startServer = async () => {
//   try {
//     log('info', '🚀 Starting Auth & Booking System Server...');
//     log('info', `📋 Environment: ${CONFIG.NODE_ENV}`);
//     log('info', `   Database: ${CONFIG.DB_USER}@${CONFIG.DB_HOST}:${CONFIG.DB_PORT}/${CONFIG.DB_NAME}`);
//     log('info', `   Email: ${CONFIG.EMAIL_USER ? 'Configured' : 'Not configured'}`);
//     log('info', `   SMS: ${CONFIG.TWILIO_ACCOUNT_SID ? 'Configured' : 'Not configured'}`);
    
//     // Setup database
//     await setupDatabase();
    
//     // Setup communication services
//     setupCommunication();
    
//     // Start server
//     app.listen(CONFIG.PORT, () => {
//       log('info', `🎉 Server running on port ${CONFIG.PORT}`);
//       log('info', `📋 API Endpoints:`);
//       log('info', `   GET  /health - Health check (Render)`);
//       log('info', `   GET  /api/health - API health check`);
//       log('info', `   --- AUTHENTICATION ---`);
//       log('info', `   POST /api/auth/login - Email login`);
//       log('info', `   POST /api/auth/verify-otp - Verify email OTP`);
//       log('info', `   POST /api/auth/resend-otp - Resend email OTP`);
//       log('info', `   POST /api/auth/login-phone - Phone login`);
//       log('info', `   POST /api/auth/verify-phone-otp - Verify phone OTP`);
//       log('info', `   POST /api/auth/resend-phone-otp - Resend phone OTP`);
//       log('info', `   POST /api/user/complete-profile - Complete profile (smart)`);
//       log('info', `   GET  /api/user/profile - Get profile (protected)`);
//       log('info', `   --- BOOKING MANAGEMENT ---`);
//       log('info', `   POST /api/booking/create - Create booking (protected)`);
//       log('info', `   GET  /api/booking/details - Get booking by ID & last name`);
//       log('info', `   GET  /api/booking/personal-details - Get booking personal details (protected)`);
//       log('info', `   PUT  /api/booking/personal-details - Update booking personal details (protected)`);
//       log('info', `   POST /api/booking/upload-id - Upload government ID`);
      
//       if (CONFIG.NODE_ENV === 'development') {
//         log('info', `\n🧪 Test Commands:`);
//         log('info', `   curl http://localhost:${CONFIG.PORT}/api/health`);
//         log('info', `   curl "http://localhost:${CONFIG.PORT}/api/booking/details?bookingId=BK12345001&lastName=Doe"`);
//       }
      
//       if (!CONFIG.EMAIL_USER && !CONFIG.TWILIO_ACCOUNT_SID) {
//         log('warn', '⚠️  Both email and SMS are not configured - OTPs will be shown in console');
//       }
//     });
    
//   } catch (error) {
//     log('error', '❌ Failed to start server', { error: error.message });
    
//     if (error.code === 'ER_ACCESS_DENIED_ERROR') {
//       log('info', '💡 Check your database credentials in environment variables');
//     }
    
//     process.exit(1);
//   }
// };

// // Graceful shutdown
// const shutdown = async (signal) => {
//   log('info', `🛑 Received ${signal}, shutting down gracefully...`);
  
//   if (pool) {
//     await pool.end();
//     log('info', '✅ Database connections closed');
//   }
  
//   process.exit(0);
// };

// process.on('SIGINT', () => shutdown('SIGINT'));
// process.on('SIGTERM', () => shutdown('SIGTERM'));

// startServer();

// export default app;





// =============================================================================
// 📁 server.js - FIXED VERSION WITH BOOKING ROUTES
// =============================================================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';
import multer from 'multer';

// Config imports
import { createDatabaseConnection } from './config/database.js';
import { setupEmailTransporter, setupTwilioClient } from './config/email.js';

// Middleware imports
import { generalLimiter } from './middleware/ratelimiter.js';
import { authenticateToken } from './middleware/auth.js';

// Utils imports
import { sendEmail, sendSMS } from './utils/emailservice.js';
import { formatResponse, log } from './utils/helpers.js';

// Models imports
import { User } from './models/user.js';
import { LoginSession } from './models/loginsession.js';

// Controllers imports
import { AuthController } from './controllers/authcontroller.js';
import { UserController } from './controllers/usercontroller.js';
import { BookingController } from './controllers/bookingcontroller.js'; // ← ADDED THIS

// Routes imports
import { createAuthRoutes } from './routes/authroutes.js';
import { createUserRoutes } from './routes/userroutes.js';
import { createBookingRoutes } from './routes/bookingroutes.js'; // ← ADDED THIS

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  try {
    const dotenv = await import('dotenv');
    dotenv.config();
    console.log('✅ Environment variables loaded from .env file');
  } catch (e) {
    console.warn('⚠️  dotenv not found, using system environment variables');
  }
}

// Configuration
const CONFIG = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'auth_system_db',
  DB_PORT: process.env.DB_PORT || 3306,
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_jwt_secret_change_in_production',
  EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT) || 587,
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_PASS: process.env.EMAIL_PASS || '',
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',
  APP_NAME: process.env.APP_NAME || 'Auth System'
};

const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
try {
  await fs.access(uploadsDir);
} catch {
  await fs.mkdir(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

// ← ADDED MULTER CONFIGURATION
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'gov-id-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and PDF files are allowed'));
    }
  }
});

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/', generalLimiter);

// Global variables
let pool;
let emailTransporter;
let twilioClient;

const startServer = async () => {
  try {
    log('info', '🚀 Starting Auth & Booking System Server...');
    log('info', `📋 Environment: ${CONFIG.NODE_ENV}`);
    
    // Setup database
    pool = await createDatabaseConnection(CONFIG);
    
    // Setup communication services
    emailTransporter = setupEmailTransporter(CONFIG);
    twilioClient = await setupTwilioClient(CONFIG);
    
    // Create service instances
    const emailService = sendEmail(emailTransporter, CONFIG);
    const smsService = sendSMS(twilioClient, CONFIG);
    
    // Create models
    const userModel = new User(pool);
    const loginSessionModel = new LoginSession(pool);
    
    // Create controllers
    const authController = new AuthController(pool, userModel, loginSessionModel, emailService, smsService, CONFIG);
    const userController = new UserController(pool, CONFIG);
    const bookingController = new BookingController(pool, CONFIG); // ← ADDED THIS
    
    // Create auth middleware
    const authMiddleware = authenticateToken(pool, CONFIG.JWT_SECRET);
    
    // ← ADDED FILE UPLOAD MIDDLEWARE
    const uploadMiddleware = upload.single('governmentId');
    
    // Setup routes
    app.use('/api/auth', createAuthRoutes(authController));
    app.use('/api/user', createUserRoutes(userController, authMiddleware));
    app.use('/api/booking', createBookingRoutes(bookingController, authMiddleware, uploadMiddleware)); // ← ADDED THIS
    
    // Health endpoints
    app.get('/health', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Server is healthy',
        timestamp: new Date().toISOString(),
        environment: CONFIG.NODE_ENV
      });
    });
    
    app.get('/api/health', (req, res) => {
      res.json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString(),
        database: pool ? 'Connected' : 'Disconnected',
        environment: CONFIG.NODE_ENV,
        services: {
          email: !!emailTransporter,
          sms: !!twilioClient
        }
      });
    });
    
    // 404 handler
    app.use((req, res) => {
      res.status(404).json(formatResponse(false, 'Endpoint not found'));
    });
    
    // Error handler
    app.use((error, req, res, next) => {
      // Handle multer errors
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json(formatResponse(false, 'File size too large. Maximum 5MB allowed'));
        }
        return res.status(400).json(formatResponse(false, 'File upload error'));
      }
      
      if (error.message.includes('Only JPEG, PNG, and PDF files are allowed')) {
        return res.status(400).json(formatResponse(false, error.message));
      }
      
      log('error', 'Unhandled error', { error: error.message, stack: error.stack });
      res.status(500).json(formatResponse(false, 'Internal server error'));
    });
    
    // Start server
    app.listen(CONFIG.PORT, () => {
      log('info', `🎉 Server running on port ${CONFIG.PORT}`);
      log('info', `📋 API Endpoints:`);
      log('info', `   GET  /health - Health check`);
      log('info', `   GET  /api/health - API health check`);
      log('info', `   --- AUTHENTICATION ---`);
      log('info', `   POST /api/auth/login - Email login`);
      log('info', `   POST /api/auth/verify-otp - Verify email OTP`);
      log('info', `   POST /api/auth/resend-otp - Resend email OTP`);
      log('info', `   POST /api/auth/login-phone - Phone login`);
      log('info', `   POST /api/auth/verify-phone-otp - Verify phone OTP`);
      log('info', `   POST /api/auth/resend-phone-otp - Resend phone OTP`);
      log('info', `   --- USER MANAGEMENT ---`);
      log('info', `   POST /api/user/complete-profile - Complete profile`);
      log('info', `   GET  /api/user/profile - Get profile (protected)`);
      log('info', `   --- BOOKING MANAGEMENT ---`); // ← ADDED THESE LOGS
      log('info', `   POST /api/booking/create - Create booking (protected)`);
      log('info', `   GET  /api/booking/details - Get booking by ID & last name`);
      log('info', `   PUT  /api/booking/personal-details - Update booking personal details (protected)`);
      log('info', `   POST /api/booking/add-guest - Add guest to booking (protected)`);
      log('info', `   PUT  /api/booking/update-guest - Update guest details (protected)`);
      log('info', `   DELETE /api/booking/delete-guest - Delete guest from booking (protected)`);
      log('info', `   POST /api/booking/upload-id - Upload government ID`);
      
      if (CONFIG.NODE_ENV === 'development') {
        log('info', `\n🧪 Test Commands:`);
        log('info', `   curl http://localhost:${CONFIG.PORT}/api/health`);
        log('info', `   curl "http://localhost:${CONFIG.PORT}/api/booking/details?bookingId=BK12345001&lastName=Doe"`);
      }
    });
    
  } catch (error) {
    log('error', '❌ Failed to start server', { error: error.message });
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async (signal) => {
  log('info', `🛑 Received ${signal}, shutting down gracefully...`);
  
  if (pool) {
    await pool.end();
    log('info', '✅ Database connections closed');
  }
  
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer();

export default app;