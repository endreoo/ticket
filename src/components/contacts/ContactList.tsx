import { useState } from 'react';
import { Search } from 'lucide-react';
import { ContactTable } from './ContactTable';

export function ContactList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [hotelFilter, setHotelFilter] = useState('all');

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={hotelFilter}
          onChange={(e) => setHotelFilter(e.target.value)}
          className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Hotels</option>
          <option value="1">Sample Hotel</option>
        </select>
      </div>

      <ContactTable searchTerm={searchTerm} hotelFilter={hotelFilter} />
    </div>
  );
}