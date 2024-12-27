import { VirtualCard } from '../types';

export type SortField = keyof VirtualCard;
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export function sortCards(cards: VirtualCard[], { field, direction }: SortConfig): VirtualCard[] {
  return [...cards].sort((a, b) => {
    let comparison = 0;
    
    // Handle numeric ID (remove 'VC' prefix and convert to number)
    if (field === 'id') {
      const aNum = parseInt(a[field].replace('VC', ''));
      const bNum = parseInt(b[field].replace('VC', ''));
      comparison = aNum - bNum;
    }
    // Handle numeric values
    else if (field === 'remainingBalance') {
      comparison = a[field] - b[field];
    }
    // Handle dates
    else if (field === 'checkInDate' || field === 'checkOutDate') {
      comparison = new Date(a[field]).getTime() - new Date(b[field]).getTime();
    }
    // Handle strings
    else {
      comparison = String(a[field]).localeCompare(String(b[field]));
    }

    return direction === 'asc' ? comparison : -comparison;
  });
}