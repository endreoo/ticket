import React from 'react';
import { CreditCard as CardIcon } from 'lucide-react';

interface CreditCardProps {
  cardNumber: string;
  expiryDate: string;
  cardHolder: string;
  currency: string;
  balance: number;
  cvv?: string;
}

export function CreditCard({ cardNumber, expiryDate, cardHolder, currency, balance, cvv = "***" }: CreditCardProps) {
  return (
    <div className="w-96 h-56 relative rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 text-white p-8 shadow-xl transform transition-transform hover:scale-105">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px]"></div>
      </div>

      {/* Card Content */}
      <div className="relative h-full flex flex-col justify-between">
        {/* Card Type & Chip */}
        <div className="flex justify-between items-start">
          <div className="text-lg font-bold tracking-wider">VIRTUAL CARD</div>
          <div className="w-12 h-9 bg-yellow-300/90 rounded-md rotate-90 shadow-inner flex items-center justify-center">
            <CardIcon className="h-6 w-6 text-yellow-600/80" />
          </div>
        </div>

        {/* Card Number */}
        <div className="mt-4">
          <div className="font-mono text-2xl tracking-wider">
            {cardNumber.match(/.{1,4}/g)?.join(' ')}
          </div>
        </div>

        {/* Card Details */}
        <div className="mt-4 flex justify-between items-end">
          <div className="space-y-1">
            <div className="text-xs opacity-75">CARD HOLDER</div>
            <div className="font-medium tracking-wider">{cardHolder}</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-xs opacity-75">CVV</div>
            <div className="font-medium font-mono">{cvv}</div>
          </div>
          <div className="text-right space-y-1">
            <div className="text-xs opacity-75">EXPIRES</div>
            <div className="font-medium">{expiryDate}</div>
          </div>
        </div>

        {/* Balance */}
        <div className="absolute top-0 right-0 bg-white/20 backdrop-blur-sm px-4 py-1 rounded-bl-xl rounded-tr-xl">
          <div className="text-xs opacity-75">BALANCE</div>
          <div className="font-medium">
            {currency} {balance.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}