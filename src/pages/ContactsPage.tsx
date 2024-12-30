import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { api } from '../lib/api';

interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
}

export function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const { token } = useAuth();

  useEffect(() => {
    fetchContacts();
  }, [token]);

  const fetchContacts = async () => {
    try {
      const data = await api.contacts.list();
      setContacts(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load contacts');
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Contacts</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contacts.map(contact => (
          <div key={contact.id} className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold">
              {contact.first_name} {contact.last_name}
            </h2>
            <p className="text-gray-600">{contact.position}</p>
            <p className="text-gray-600">{contact.company}</p>
            <div className="mt-2">
              <p className="text-sm">📞 {contact.phone}</p>
              <p className="text-sm">✉️ {contact.email}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}