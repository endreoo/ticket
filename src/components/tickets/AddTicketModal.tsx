import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

interface AddTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddTicketModal({ isOpen, onClose }: AddTicketModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'low',
    bookingId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await api.tickets.create({
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        booking_id: formData.bookingId || undefined,
        status: 'open'
      });

      toast.success('Ticket created successfully');
      onClose();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Ticket">
      {/* Form content remains the same */}
    </Modal>
  );
}