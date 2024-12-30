export interface User {
  id: number;
  email: string;
  username: string;
  job_title?: string;
  role?: string;
}

export interface Booking {
  id: number;
  guest_name: string;
  check_in: string;
  check_out: string;
  room_type: string;
  user_id: number;
  created_at: string;
}

export interface Ticket {
  id: number;
  subject: string;
  message: string;
  from_email?: string;
  status: string;
  priority?: string;
  hotel_id?: number;
  category: string;
  created_at: string;
  message_id?: string;
  email_raw?: string;
  uid?: number;
  full_content_id?: number;
  has_full_content?: boolean;
  sentiment: string;
  extracted_info: string;
  key_phrases: string;
  html_content?: string;
  has_attachments?: boolean;
  hotel_name?: string;
  updated_at?: string;
  bert_processed?: boolean;
}

export interface Hotel {
  id: number;
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

export interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  created_at?: string;
  updated_at?: string;
}

export interface Guest {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  hotel_id: number;
  hotel_name?: string;
  contact_id: number;
  created_at?: string;
  updated_at?: string;
} 