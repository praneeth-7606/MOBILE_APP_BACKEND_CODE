import mysql from 'mysql2/promise';

// // export const createDatabaseConnection = async (config) => {
// //   try {
// //     // Connect without database first
// //     const connection = await mysql.createConnection({
// //       host: config.DB_HOST,
// //       user: config.DB_USER,
// //       password: config.DB_PASSWORD,
// //       port: config.DB_PORT
// //     });
    
// //     // Create database if it doesn't exist
// //     await connection.execute(`CREATE DATABASE IF NOT EXISTS ${config.DB_NAME}`);
// //     console.log(`✅ Database '${config.DB_NAME}' ready`);
    
// //     await connection.end();
    
// //     // Create pool connection
// //     const pool = mysql.createPool({
// //       host: config.DB_HOST,
// //       user: config.DB_USER,
// //       password: config.DB_PASSWORD,
// //       database: config.DB_NAME,
// //       port: config.DB_PORT,
// //       ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
// //       waitForConnections: true,
// //       connectionLimit: 10,
// //       queueLimit: 0,
// //       acquireTimeout: 60000,
// //       timeout: 60000
// //     });
    
// //     return pool;
// //   } catch (error) {
// //     console.error('❌ Database connection failed:', error.message);
// //     throw error;
// //   }
// // };


// import mysql from 'mysql2/promise';

// export const createDatabaseConnection = async (config) => {
//   try {
//     // Connect without database first
//     const connection = await mysql.createConnection({
//       host: config.DB_HOST,
//       user: config.DB_USER,
//       password: config.DB_PASSWORD,
//       port: config.DB_PORT,
//       // FIX: Railway MySQL SSL settings
//       ssl: config.NODE_ENV === 'production' ? { 
//         rejectUnauthorized: false  // Changed from true to false
//       } : false,
//       connectTimeout: 60000,  // Add connection timeout
//       timeout: 60000
//     });
    
//     // Create database if it doesn't exist
//     await connection.execute(`CREATE DATABASE IF NOT EXISTS ${config.DB_NAME}`);
//     console.log(`✅ Database '${config.DB_NAME}' ready`);
    
//     await connection.end();
    
//     // Create pool connection
//     const pool = mysql.createPool({
//       host: config.DB_HOST,
//       user: config.DB_USER,
//       password: config.DB_PASSWORD,
//       database: config.DB_NAME,
//       port: config.DB_PORT,
//       // FIX: Same SSL settings for pool
//       ssl:  false,
//       waitForConnections: true,
//       connectionLimit: 10,
//       queueLimit: 0,
//       acquireTimeout: 60000,
//       timeout: 60000,
//       connectTimeout: 60000  // Add this
//     });
    
//     return pool;
//   } catch (error) {
//     console.error('❌ Database connection failed:', error.message);
//     throw error;
//   }
// };
// export const createDatabaseConnection = async (config) => {
//   try {
//     console.log('🔗 Attempting to connect to database...');
//     console.log(`   Host: ${config.DB_HOST}`);
//     console.log(`   Port: ${config.DB_PORT}`);
//     console.log(`   User: ${config.DB_USER}`);
//     console.log(`   Database: ${config.DB_NAME}`);
    
//     const connection = await mysql.createConnection({
//       host: config.DB_HOST,
//       user: config.DB_USER,
//       password: config.DB_PASSWORD,
//       port: config.DB_PORT,
//       // REQUIRED for Railway external connections
//       ssl: { rejectUnauthorized: false },
//       connectTimeout: 30000
//     });
    
//     console.log('✅ Initial database connection successful!');
    
//     await connection.execute(`CREATE DATABASE IF NOT EXISTS ${config.DB_NAME}`);
//     console.log(`✅ Database '${config.DB_NAME}' created/verified successfully!`);
    
//     await connection.end();
//     console.log('🔌 Initial connection closed, creating connection pool...');
    
//     const pool = mysql.createPool({
//       host: config.DB_HOST,
//       user: config.DB_USER,
//       password: config.DB_PASSWORD,
//       database: config.DB_NAME,
//       port: config.DB_PORT,
//       ssl: { rejectUnauthorized: false },
//       waitForConnections: true,
//       connectionLimit: 10,
//       acquireTimeout: 30000
//     });
    
//     // Test the pool connection
//     const testConnection = await pool.getConnection();
//     console.log('✅ Database connection pool created successfully!');
//     console.log('🎉 Ready to execute database operations!');
//     testConnection.release();
    
//     return pool;
//   } catch (error) {
//     console.error('❌ Database connection failed:', error.message);
//     console.error('💡 Check your database credentials and network connection');
//     throw error;
//   }
// };


// import mysql from 'mysql2/promise';

let pool;

// Function to drop all existing tables
const dropAllTables = async (pool) => {
  console.log('🧹 Dropping all existing tables...');
  
  try {
    // Disable foreign key checks to allow dropping tables with foreign keys
    await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // Drop tables in reverse order (children first, then parents)
    const tablesToDrop = [
      'booking_documents',
      'booking_guests', 
      'bookings',
      'login_sessions',
      'users'
    ];
    
    for (const table of tablesToDrop) {
      try {
        await pool.execute(`DROP TABLE IF EXISTS ${table}`);
        console.log(`✅ Dropped table: ${table}`);
      } catch (error) {
        console.log(`⚠️ Could not drop table ${table}: ${error.message}`);
      }
    }
    
    // Re-enable foreign key checks
    await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('🧹 All existing tables dropped successfully');
    
  } catch (error) {
    await pool.execute('SET FOREIGN_KEY_CHECKS = 1'); // Always re-enable
    console.error('❌ Error dropping tables:', error.message);
    throw error;
  }
};

// Function to create fresh tables
const createFreshTables = async (pool) => {
  console.log('📝 Creating fresh database tables...');
  
  // 1. Users table (no foreign keys)
  const createUsersTable = `
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;
  
  // 2. Login sessions table (no foreign keys)
  const createSessionsTable = `
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  // 3. Bookings table (with foreign key to users)
  const createBookingsTable = `
    CREATE TABLE bookings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      booking_id VARCHAR(20) UNIQUE NOT NULL,
      user_id INT NOT NULL,
      
      user_first_name VARCHAR(100) NOT NULL,
      user_last_name VARCHAR(100) NOT NULL,
      user_email VARCHAR(255) NOT NULL,
      user_phone VARCHAR(20) NOT NULL,
      user_gender ENUM('male', 'female', 'other') NULL,
      user_age INT NULL,
      
      permanent_address TEXT NULL,
      city VARCHAR(100) NULL,
      state VARCHAR(100) NULL,
      country VARCHAR(100) NULL,
      pincode VARCHAR(20) NULL,
      
      occupation VARCHAR(200) NULL,
      occupation_email VARCHAR(255) NULL,
      gst_number VARCHAR(50) NULL,
      
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
      INDEX idx_user_id (user_id),
      INDEX idx_check_in_date (check_in_date),
      INDEX idx_booking_status (booking_status),
      INDEX idx_booking_lookup (booking_id, user_last_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  // 4. Booking guests table (with foreign key to bookings)
  const createBookingGuestsTable = `
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
      
      INDEX idx_booking_id (booking_id),
      INDEX idx_guest_name (guest_first_name, guest_last_name),
      INDEX idx_primary_guest (is_primary_guest)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  // 5. Booking documents table (with foreign key to bookings)
  const createBookingDocumentsTable = `
    CREATE TABLE booking_documents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      booking_id VARCHAR(20) NOT NULL,
      document_type ENUM('government_id', 'passport', 'driving_license') NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      file_size INT NOT NULL,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
      
      INDEX idx_booking_id (booking_id),
      INDEX idx_document_type (document_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;
  
  try {
    // Create tables in correct order (parents first, then children)
    await pool.execute(createUsersTable);
    console.log('✅ Users table created with all columns');
    
    await pool.execute(createSessionsTable);
    console.log('✅ Login sessions table created');
    
    await pool.execute(createBookingsTable);
    console.log('✅ Bookings table created with foreign key');
    
    await pool.execute(createBookingGuestsTable);
    console.log('✅ Booking guests table created with foreign key');
    
    await pool.execute(createBookingDocumentsTable);
    console.log('✅ Booking documents table created with foreign key');
    
    console.log('✅ All fresh tables created successfully');
    
    // Verify users table structure
    const [userColumns] = await pool.execute('DESCRIBE users');
    console.log('📋 Users table columns:', userColumns.map(c => c.Field));
    
    // Verify phone column exists
    const phoneColumn = userColumns.find(c => c.Field === 'phone');
    if (phoneColumn) {
      console.log('✅ Phone column verified in users table');
    } else {
      throw new Error('❌ Phone column still missing after fresh creation');
    }
    
  } catch (error) {
    console.error('❌ Fresh table creation failed:', error.message);
    throw error;
  }
};

// Function to insert sample data
const insertSampleData = async (pool, nodeEnv) => {
  if (nodeEnv !== 'development') {
    console.log('ℹ️ Skipping sample data (not in development mode)');
    return;
  }
  
  try {
    console.log('📝 Inserting sample data...');
    
    // Insert sample users
    await pool.execute(`
      INSERT INTO users (email, phone, first_name, last_name, login_method, profile_completed) VALUES
      ('test.user@example.com', NULL, 'Test', 'User', 'email', FALSE),
      ('demo@example.com', NULL, 'Demo', 'User', 'email', FALSE),
      (NULL, '+1234567890', 'Phone', 'User1', 'phone', FALSE),
      (NULL, '+1987654321', 'Phone', 'User2', 'phone', FALSE),
      ('complete.user@example.com', '+1555000111', 'Complete', 'User', 'email', TRUE)
    `);
    console.log('✅ Sample users inserted');
    
    // Insert sample bookings
    await pool.execute(`
      INSERT INTO bookings (
        booking_id, user_id, user_first_name, user_last_name, user_email, user_phone,
        room_description, check_in_date, check_out_date, total_guests,
        payment_method, payment_name, total_payment, booking_status
      ) VALUES
      ('BK12345001', 5, 'Complete', 'User', 'complete.user@example.com', '+1555000111', 
       'Deluxe Ocean View Room with King Bed', 
       '2025-08-20', '2025-08-23', 2, 'credit_card', 'Complete User', 450.00, 'confirmed'),
      ('BK12345002', 5, 'Complete', 'User', 'complete.user@example.com', '+1555000111',
       'Standard Twin Room with Garden View',
       '2025-08-25', '2025-08-27', 1, 'paypal', 'Complete User', 200.00, 'confirmed')
    `);
    console.log('✅ Sample bookings inserted');
    
  } catch (error) {
    console.warn('⚠️ Sample data insertion failed:', error.message);
  }
};

// Main database connection function
export const createDatabaseConnection = async (config) => {
  try {
    console.log('🔗 Attempting to connect to database...');
    console.log(`   Host: ${config.DB_HOST}`);
    console.log(`   Port: ${config.DB_PORT}`);
    console.log(`   User: ${config.DB_USER}`);
    console.log(`   Database: ${config.DB_NAME}`);
    
    // Connect without database first
    const connection = await mysql.createConnection({
      host: config.DB_HOST,
      user: config.DB_USER,
      password: config.DB_PASSWORD,
      port: config.DB_PORT,
      ssl: { rejectUnauthorized: false },
      connectTimeout: 30000
    });
    
    console.log('✅ Initial database connection successful!');
    
    // Create database if it doesn't exist
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${config.DB_NAME}`);
    console.log(`✅ Database '${config.DB_NAME}' created/verified successfully!`);
    
    await connection.end();
    console.log('🔌 Initial connection closed, creating connection pool...');
    
    // Create pool connection to the specific database
    pool = mysql.createPool({
      host: config.DB_HOST,
      user: config.DB_USER,
      password: config.DB_PASSWORD,
      database: config.DB_NAME,
      port: config.DB_PORT,
      ssl: { rejectUnauthorized: false },
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      acquireTimeout: 30000
    });
    
    // Test the pool connection
    const testConnection = await pool.getConnection();
    console.log('✅ Database connection pool created successfully!');
    testConnection.release();
    
    // Check existing tables
    console.log('🔍 Checking existing tables...');
    const [existingTables] = await pool.execute('SHOW TABLES');
    console.log(`📋 Found ${existingTables.length} existing tables:`, 
                existingTables.map(t => Object.values(t)[0]));
    
    // FRESH START: Drop all existing tables and create new ones
    await dropAllTables(pool);
    await createFreshTables(pool);
    
    // Verify final table count
    const [finalTables] = await pool.execute('SHOW TABLES');
    console.log(`📋 Total tables after fresh creation: ${finalTables.length}`);
    
    // Insert sample data in development
    await insertSampleData(pool, config.NODE_ENV);
    
    console.log('🎉 Fresh database setup complete!');
    
    return pool;
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('💡 Check your database credentials and network connection');
    throw error;
  }
};

export const getPool = () => pool;

export default { createDatabaseConnection, getPool };