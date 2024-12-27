import React from 'react';
import { CreditCard, AlertCircle, DollarSign } from 'lucide-react';
import { SummaryCard } from './SummaryCard';
import { VirtualCard } from '../../types';
import { calculateSummaryMetrics } from '../../utils/cardMetrics';

interface DashboardSummaryProps {
  cards: VirtualCard[];
}

export function DashboardSummary({ cards }: DashboardSummaryProps) {
  const { 
    cardsToCharge,
    totalAmountToCharge,
    expiredCards 
  } = calculateSummaryMetrics(cards);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <SummaryCard
        title="Cards to Charge"
        value={cardsToCharge.length}
        subValue={`${cardsToCharge.length} cards pending charge`}
        icon={CreditCard}
        iconColor="bg-blue-500"
      />
      <SummaryCard
        title="Total Amount to Charge"
        value={`$${totalAmountToCharge.toLocaleString()}`}
        subValue="Pending charges"
        icon={DollarSign}
        iconColor="bg-green-500"
      />
      <SummaryCard
        title="Expired Cards"
        value={expiredCards.length}
        subValue="Older than 6 months"
        icon={AlertCircle}
        iconColor="bg-red-500"
      />
    </div>
  );
}