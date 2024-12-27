import { VirtualCard } from '../types';
import { subMonths } from 'date-fns';

const MIN_CHARGE_AMOUNT = 0.5;

export function calculateSummaryMetrics(cards: VirtualCard[]) {
  const now = new Date();
  const sixMonthsAgo = subMonths(now, 6);

  const cardsToCharge = cards.filter(card => 
    card.remainingBalance > MIN_CHARGE_AMOUNT && 
    card.status === 'active'
  );

  const totalAmountToCharge = cardsToCharge.reduce(
    (sum, card) => sum + card.remainingBalance,
    0
  );

  const expiredCards = cards.filter(card => {
    const checkInDate = new Date(card.checkInDate);
    return checkInDate < sixMonthsAgo;
  });

  return {
    cardsToCharge,
    totalAmountToCharge,
    expiredCards
  };
}