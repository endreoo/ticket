import React from 'react';
import { Modal } from '../ui/Modal';
import type { VirtualCard } from '../../types';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: VirtualCard;
}

export function InfoModal({ isOpen, onClose, card }: InfoModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Card Information">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">ID</label>
            <p className="mt-1 text-sm text-gray-900">{card.id}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Guest Name</label>
            <p className="mt-1 text-sm text-gray-900">{card.guestName}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Hotel</label>
            <p className="mt-1 text-sm text-gray-900">{card.hotelName}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Source</label>
            <p className="mt-1 text-sm text-gray-900">{card.source}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Check-in</label>
            <p className="mt-1 text-sm text-gray-900">{card.checkInDate}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Check-out</label>
            <p className="mt-1 text-sm text-gray-900">{card.checkOutDate}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}