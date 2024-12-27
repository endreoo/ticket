import React from 'react';
import type { VirtualCard } from '../../types';

interface FlutterwaveChargeFormProps {
  card: VirtualCard;
  onSuccess: () => void;
}

export function FlutterwaveChargeForm({ card, onSuccess }: FlutterwaveChargeFormProps) {
  // This would integrate with Flutterwave's API in a real implementation
  return (
    <div className="space-y-4">
      <div className="bg-purple-50 p-4 rounded-lg">
        <p className="text-sm text-purple-700">
          Redirecting to Flutterwave payment portal...
        </p>
      </div>
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Payment Details</h4>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Amount: {card.currency} {card.remainingBalance}</p>
          <p className="text-sm text-gray-600">Guest: {card.guestName}</p>
          <p className="text-sm text-gray-600">Hotel: {card.hotelName}</p>
        </div>
      </div>
    </div>
  );
}