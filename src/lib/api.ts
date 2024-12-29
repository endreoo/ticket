import { User, Booking, Ticket, Guest } from '../types';
import type { Hotel, Contact, HotelContact } from '../types/database';

const API_URL = import.meta.env.VITE_API_URL || 'http://37.27.56.102:5181';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const url = `${API_URL}${endpoint}`;
  console.log('Making API request:', {
    url,
    method: options.method || 'GET',
    headers,
  });

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log('API response status:', response.status);
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        // Clear token and user data on authentication errors
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        throw new Error('Authentication failed');
      }

      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: 'An error occurred' };
      }
      
      console.error('API error response:', errorData);
      throw new Error(errorData.message || 'Something went wrong');
    }

    const data = await response.json();
    console.log('API response data:', data);
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  priority?: string;
}

export interface PaginatedResponse<T> {
  hotels?: T[];
  tickets?: T[];
  pagination: {
    totalItems: number;
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
  };
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
  },
  bookings: {
    list: () => request<Booking[]>('/bookings'),
    create: (booking: Omit<Booking, 'id' | 'created_at' | 'user_id'>) =>
      request<Booking>('/bookings', {
        method: 'POST',
        body: JSON.stringify(booking),
      }),
    update: (id: string, data: Partial<Booking>) =>
      request<Booking>(`/bookings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },
  tickets: {
    list: (params?: PaginationParams) => {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      const query = queryParams.toString();
      return request<PaginatedResponse<Ticket>>(`/tickets${query ? `?${query}` : ''}`);
    },
    create: (ticket: Omit<Ticket, 'id' | 'created_at' | 'user_id'>) =>
      request<Ticket>('/tickets', {
        method: 'POST',
        body: JSON.stringify(ticket),
      }),
    update: (id: string, data: Partial<Ticket>) =>
      request<Ticket>(`/tickets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },
  hotels: {
    list: (params?: PaginationParams) => {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      const query = queryParams.toString();
      return request<PaginatedResponse<Hotel>>(`/hotels${query ? `?${query}` : ''}`);
    },
    getById: (id: string) => request<Hotel>(`/hotels/${id}`),
    create: (hotel: Omit<Hotel, 'id' | 'created_at' | 'updated_at'>) =>
      request<Hotel>('/hotels', {
        method: 'POST',
        body: JSON.stringify(hotel),
      }),
    update: (id: string, data: Partial<Hotel>) =>
      request<Hotel>(`/hotels/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/hotels/${id}`, {
        method: 'DELETE',
      }),
    getContacts: (hotelId: number) =>
      request<HotelContact[]>(`/hotels/${hotelId}/contacts`),
    addContact: (hotelId: number, contactData: Omit<HotelContact, 'id'>) =>
      request<HotelContact>(`/hotels/${hotelId}/contacts`, {
        method: 'POST',
        body: JSON.stringify(contactData),
      }),
    updateContact: (hotelId: number, contactId: number, data: Partial<HotelContact>) =>
      request<HotelContact>(`/hotels/${hotelId}/contacts/${contactId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    removeContact: (hotelId: number, contactId: number) =>
      request<{ message: string }>(`/hotels/${hotelId}/contacts/${contactId}`, {
        method: 'DELETE',
      }),
  },
  contacts: {
    list: () => request<Contact[]>('/contacts'),
    getById: (id: string) => request<Contact>(`/contacts/${id}`),
    create: (contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>) =>
      request<Contact>('/contacts', {
        method: 'POST',
        body: JSON.stringify(contact),
      }),
    update: (id: string, data: Partial<Contact>) =>
      request<Contact>(`/contacts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/contacts/${id}`, {
        method: 'DELETE',
      }),
  },
  guests: {
    list: () => request<Guest[]>('/guests'),
    getById: (id: string) => request<Guest>(`/guests/${id}`),
    create: (guest: Omit<Guest, 'id' | 'created_at' | 'updated_at'>) =>
      request<Guest>('/guests', {
        method: 'POST',
        body: JSON.stringify(guest),
      }),
    update: (id: string, data: Partial<Guest>) =>
      request<Guest>(`/guests/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/guests/${id}`, {
        method: 'DELETE',
      }),
  },
};