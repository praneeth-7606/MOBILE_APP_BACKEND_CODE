import mysql from 'mysql2/promise';

export const createDatabaseConnection = async (config) => {
  try {
    // Connect without database first
    const connection = await mysql.createConnection({
      host: config.DB_HOST,
      user: config.DB_USER,
      password: config.DB_PASSWORD,
      port: config.DB_PORT
    });
    
    // Create database if it doesn't exist
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${config.DB_NAME}`);
    console.log(`✅ Database '${config.DB_NAME}' ready`);
    
    await connection.end();
    
    // Create pool connection
    const pool = mysql.createPool({
      host: config.DB_HOST,
      user: config.DB_USER,
      password: config.DB_PASSWORD,
      database: config.DB_NAME,
      port: config.DB_PORT,
      ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      acquireTimeout: 60000,
      timeout: 60000
    });
    
    return pool;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
};