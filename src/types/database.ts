import { Ticket } from '../types';

export interface Database {
  public: {
    Tables: {
      bookings: {
        Row: {
          id: string;
          guest_name: string;
          check_in: string;
          check_out: string;
          room_type: string;
          status: 'pending' | 'confirmed' | 'cancelled';
          created_at: string;
          user_id: string;
        };
      };
      tickets: {
        Row: Ticket;
      };
    };
  };
}

export interface Hotel {
  id: number;
  name: string;
  location: string;
  sub_location?: string;
  bcom_id?: string;
  url?: string;
  review_score?: string;
  number_of_reviews?: number;
  description?: string;
  address?: string;
  google_review_score?: number;
  google_number_of_reviews?: number;
  market?: string;
  segment?: string;
  agreement?: string;
  sales_process?: string;
  Bcom_status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  position?: string;
  linkedin_url?: string;
  created_at?: string;
  updated_at?: string;
  is_hotel_contact?: boolean;
  is_guest?: boolean;
}

export interface HotelContact extends Contact {
  role: string;
  is_primary: boolean;
}