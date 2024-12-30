import mysql, { Pool } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'scraper',
  password: process.env.DB_PASSWORD || 'Jk8$Qe3#Zp2!BnL9',
  database: process.env.DB_NAME || 'properties',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

console.log('Database config:', {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database
});

export const pool: Pool = mysql.createPool(dbConfig);