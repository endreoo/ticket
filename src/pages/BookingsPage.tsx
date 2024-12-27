import { useState } from 'react';
import { Plus } from 'lucide-react';
import { BookingList } from '../components/bookings/BookingList';
import { AddBookingModal } from '../components/bookings/AddBookingModal';

export function BookingsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Bookings</h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#00BCD4] hover:bg-[#00ACC1]"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Booking
        </button>
      </div>

      <BookingList />
      
      <AddBookingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}