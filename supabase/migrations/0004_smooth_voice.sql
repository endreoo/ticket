-- Create database
CREATE DATABASE IF NOT EXISTS hotel_crm;
USE hotel_crm;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(36) PRIMARY KEY,
  guest_name VARCHAR(255) NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  room_type VARCHAR(50) NOT NULL,
  status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id VARCHAR(36) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority ENUM('low', 'medium', 'high') DEFAULT 'low',
  status ENUM('open', 'in_progress', 'resolved') DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id VARCHAR(36) NOT NULL,
  booking_id VARCHAR(36),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- Indexes
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_booking_id ON tickets(booking_id);

-- Insert test user (password: test123)
INSERT INTO users (id, email, password, full_name) 
VALUES (
  UUID(), 
  'test@test.com',
  '$2b$10$3w5dFcXRsR5DVsN9.K8Sce1LnxFYZUhQ9nFvqQH9oHkV2xPA.DJVq',
  'Test User'
);