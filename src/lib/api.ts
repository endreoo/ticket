import { User, Booking, Ticket, Guest } from '../types';
import type { Hotel, Contact, HotelContact } from '../types/database';
import axios from 'axios';

// Configure axios defaults
axios.defaults.baseURL = '';  // Use relative URLs
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Add request interceptor to include token
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  console.log('Making API request:', {
    url: endpoint,
    method: options.method || 'GET',
  });

  try {
    const response = await axios.request<T>({
      url: endpoint,
      method: options.method || 'GET',
      data: options.body ? JSON.parse(options.body as string) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers as Record<string, string>
      }
    });

    console.log('API response status:', response.status);
    console.log('API response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('API request failed:', error);
    if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw new Error('Authentication failed');
    }
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
    login: async (email: string, password: string) => {
      try {
        const response = await axios.post('/auth/login', { email, password });
        return response.data;
      } catch (error) {
        console.error('Login failed:', error);
        throw error;
      }
    }
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
    list: async (params?: PaginationParams) => {
      const response = await axios.get<PaginatedResponse<Ticket>>('/tickets', { params });
      return response.data;
    },
    checkImap: async () => {
      const response = await axios.post('/tickets/check-imap');
      return response.data;
    },
    create: async (ticket: Omit<Ticket, 'id' | 'created_at' | 'user_id'>) => {
      const response = await axios.post<Ticket>('/tickets', ticket);
      return response.data;
    },
    update: async (id: number, data: Partial<Ticket>) => {
      const response = await axios.post<Ticket>(`/tickets/${id}/update`, data);
      return response.data;
    },
    analyze: async (data: { subject: string, message: string, from_email: string }) => {
      try {
        // Clean up the data
        const cleanData = {
          subject: data.subject?.replace(/[<>\[\]]/g, '').replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim() || '',
          body: data.message?.replace(/[\r\n\t]+/g, ' ')
            .replace(/\\"/g, '"')
            .replace(/\\/g, '')
            .replace(/\u2028/g, ' ')
            .replace(/\u2029/g, ' ')
            .replace(/\s+/g, ' ')
            .trim() || '',
          from_email: data.from_email?.replace(/[<>"]/g, '')
            .replace(/[\r\n\t]+/g, ' ')
            .replace(/\s+/g, ' ')
            .split(/\s+/)
            .pop() || ''
        };

        console.log('Sending BERT analysis request with cleaned data:', JSON.stringify(cleanData, null, 2));
      
        // Send request through our backend
        const response = await axios.post('/tickets/analyze-bert', cleanData);
        
        console.log('BERT analysis response:', JSON.stringify(response.data, null, 2));
        return response.data;
      } catch (error) {
        console.error('BERT API request failed:', error);
        if (axios.isAxiosError(error) && error.response) {
          throw new Error(`BERT analysis failed: ${JSON.stringify(error.response.data)}`);
        }
        throw error;
      }
    }
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