/*
  # Initial Schema Setup

  1. New Tables
    - `hotels`
      - Basic hotel information
      - Status tracking
      - Timestamps
    - `contacts`
      - Contact details for hotel staff
      - Links to hotels
      - Primary contact flag
    - `virtual_cards`
      - Virtual card information
      - Links to hotels
      - Payment tracking
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Hotels table
CREATE TABLE IF NOT EXISTS hotels (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  country text NOT NULL,
  phone text,
  email text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id uuid REFERENCES hotels(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  position text,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Virtual Cards table
CREATE TABLE IF NOT EXISTS virtual_cards (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id uuid REFERENCES hotels(id) ON DELETE CASCADE,
  guest_name text NOT NULL,
  check_in_date date NOT NULL,
  check_out_date date NOT NULL,
  remaining_balance decimal(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending',
  source text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_cards ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read hotels" ON hotels
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert hotels" ON hotels
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update hotels" ON hotels
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Users can read contacts" ON contacts
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert contacts" ON contacts
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update contacts" ON contacts
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Users can read virtual_cards" ON virtual_cards
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert virtual_cards" ON virtual_cards
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update virtual_cards" ON virtual_cards
  FOR UPDATE TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_hotels_name ON hotels(name);
CREATE INDEX IF NOT EXISTS idx_contacts_hotel_id ON contacts(hotel_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_virtual_cards_hotel_id ON virtual_cards(hotel_id);
CREATE INDEX IF NOT EXISTS idx_virtual_cards_status ON virtual_cards(status);