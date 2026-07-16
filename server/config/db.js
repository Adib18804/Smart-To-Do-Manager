const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Ensure env variables are loaded (useful if db.js is loaded first or in isolation)
dotenv.config({ path: path.join(__dirname, '../../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'student_life_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Test database connection instantly
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Successfully connected to MySQL database: ' + dbConfig.database);
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed. Please check your MySQL server settings in .env.');
    console.error(error.message);
  }
}

testConnection();

module.exports = pool;
