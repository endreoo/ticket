import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import type { VirtualCard } from '../../types';

interface DoNotChargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: VirtualCard;
}

export function DoNotChargeModal({ isOpen, onClose, card }: DoNotChargeModalProps) {
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle do not charge submission
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Do Not Charge">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Confirm
          </button>
        </div>
      </form>
    </Modal>
  );
}