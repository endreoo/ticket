import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { CreditCard, Wallet, FileText } from 'lucide-react';
import type { VirtualCard } from '../../types';
import { StripeChargeForm } from '../payments/StripeChargeForm';
import { FlutterwaveChargeForm } from '../payments/FlutterwaveChargeForm';
import { ManualChargeForm } from '../payments/ManualChargeForm';

interface ChargeCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: VirtualCard;
}

type PaymentMethod = 'stripe' | 'flutterwave' | 'manual';

export function ChargeCardModal({ isOpen, onClose, card }: ChargeCardModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  const renderPaymentForm = () => {
    switch (selectedMethod) {
      case 'stripe':
        return <StripeChargeForm card={card} onSuccess={onClose} />;
      case 'flutterwave':
        return <FlutterwaveChargeForm card={card} onSuccess={onClose} />;
      case 'manual':
        return <ManualChargeForm card={card} onSuccess={onClose} />;
      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Charge Card">
      {!selectedMethod ? (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Select Payment Method</h3>
          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => setSelectedMethod('stripe')}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <CreditCard className="h-6 w-6 text-blue-500" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Stripe</p>
                  <p className="text-sm text-gray-500">Process payment via Stripe</p>
                </div>
              </div>
              <span className="text-blue-500">→</span>
            </button>

            <button
              onClick={() => setSelectedMethod('flutterwave')}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Wallet className="h-6 w-6 text-purple-500" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Flutterwave</p>
                  <p className="text-sm text-gray-500">Process payment via Flutterwave</p>
                </div>
              </div>
              <span className="text-purple-500">→</span>
            </button>

            <button
              onClick={() => setSelectedMethod('manual')}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <FileText className="h-6 w-6 text-green-500" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Manual Entry</p>
                  <p className="text-sm text-gray-500">Enter payment details manually</p>
                </div>
              </div>
              <span className="text-green-500">→</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <button
            onClick={() => setSelectedMethod(null)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <span>← Back to payment methods</span>
          </button>
          {renderPaymentForm()}
        </div>
      )}
    </Modal>
  );
}