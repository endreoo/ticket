-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS hotel_crm;
USE hotel_crm;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert test user (password is 'admin123' hashed with bcrypt)
INSERT INTO users (id, email, password, full_name) 
VALUES (
  UUID(), 
  'admin@example.com',
  '$2b$10$3w5dFcXRsR5DVsN9.K8Sce1LnxFYZUhQ9nFvqQH9oHkV2xPA.DJVq',
  'Admin User'
);