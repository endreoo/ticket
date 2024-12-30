export interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export interface Booking {
  id: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  room_type: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  user_id: string;
}

export type { Ticket } from '../types';