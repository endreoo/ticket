import { User, Booking, Ticket } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Something went wrong');
  }

  return response.json();
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
    list: () => request<Ticket[]>('/tickets'),
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
};