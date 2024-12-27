import React from 'react';
import { Modal } from '../ui/Modal';
import { CreditCard } from '../ui/CreditCard';
import type { VirtualCard } from '../../types';

interface CardDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: VirtualCard;
}

export function CardDetailsModal({ isOpen, onClose, card }: CardDetailsModalProps) {
  // Mock card details - in a real app, these would come from the backend
  const cardDetails = {
    number: "4111111111111234",
    expiry: "12/25",
    cvv: "123"
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Card Details">
      <div className="space-y-6">
        <div className="flex justify-center">
          <CreditCard
            cardNumber={cardDetails.number}
            expiryDate={cardDetails.expiry}
            cardHolder={card.guestName}
            currency={card.currency}
            balance={card.remainingBalance}
            cvv={cardDetails.cvv}
          />
        </div>
        
        <div className="mt-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Security Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500">CVV</label>
                <p className="text-sm font-mono">{cardDetails.cvv}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500">Status</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${card.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                  ${card.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                  ${card.status === 'completed' ? 'bg-blue-100 text-blue-800' : ''}
                  ${card.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                `}>
                  {card.status.charAt(0).toUpperCase() + card.status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Hotel Information</h4>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-500">Hotel Name</label>
                <p className="text-sm">{card.hotelName}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500">Check-in</label>
                  <p className="text-sm">{card.checkInDate}</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Check-out</label>
                  <p className="text-sm">{card.checkOutDate}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}