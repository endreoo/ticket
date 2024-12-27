import React from 'react';
import type { VirtualCard } from '../../types';

interface StripeChargeFormProps {
  card: VirtualCard;
  onSuccess: () => void;
}

export function StripeChargeForm({ card, onSuccess }: StripeChargeFormProps) {
  // This would integrate with Stripe's API in a real implementation
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-700">
          Redirecting to Stripe payment portal...
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