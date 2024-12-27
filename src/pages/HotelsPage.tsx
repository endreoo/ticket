import { useState } from 'react';
import { Plus } from 'lucide-react';
import { HotelList } from '../components/hotels/HotelList';
import { AddHotelModal } from '../components/hotels/AddHotelModal';

export function HotelsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Hotels</h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Hotel
        </button>
      </div>

      <HotelList />
      
      <AddHotelModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}