import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { api } from '../lib/api';

interface Guest {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  hotel_id: number;
  hotel_name: string;
  contact_id: number;
}

export function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const { token } = useAuth();

  useEffect(() => {
    fetchGuests();
  }, [token]);

  const fetchGuests = async () => {
    try {
      const data = await api.guests.list();
      setGuests(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load guests');
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Guests</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {guests.map(guest => (
          <div key={guest.id} className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold">
              {guest.first_name} {guest.last_name}
            </h2>
            <p className="text-gray-600">
              🏨 {guest.hotel_name || 'No hotel assigned'}
            </p>
            <div className="mt-2">
              <p className="text-sm">📞 {guest.phone}</p>
              <p className="text-sm">✉️ {guest.email}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 