import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

interface AddBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddBookingModal({ isOpen, onClose }: AddBookingModalProps) {
  const [formData, setFormData] = useState({
    guestName: '',
    checkIn: '',
    checkOut: '',
    roomType: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await api.bookings.create({
        guest_name: formData.guestName,
        check_in: formData.checkIn,
        check_out: formData.checkOut,
        room_type: formData.roomType,
        status: 'pending'
      });

      toast.success('Booking created successfully');
      onClose();
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Failed to create booking');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Booking">
      {/* Form content remains the same */}
    </Modal>
  );
}