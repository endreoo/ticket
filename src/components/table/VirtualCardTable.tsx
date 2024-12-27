import React, { useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { VirtualCard } from '../../types';
import { VirtualCardActions } from '../actions/VirtualCardActions';
import { sortCards, type SortConfig, type SortField } from '../../utils/sorting';

interface VirtualCardTableProps {
  cards: VirtualCard[];
}

interface ColumnHeader {
  field: SortField;
  label: string;
  width?: string;
}

const columns: ColumnHeader[] = [
  { field: 'id', label: 'ID', width: 'w-[80px]' },
  { field: 'guestName', label: 'Guest', width: 'w-[140px]' },
  { field: 'hotelName', label: 'Hotel', width: 'w-[140px]' },
  { field: 'checkInDate', label: 'Check-in', width: 'w-[100px]' },
  { field: 'checkOutDate', label: 'Check-out', width: 'w-[100px]' },
  { field: 'remainingBalance', label: 'Balance', width: 'w-[100px]' },
  { field: 'status', label: 'Status', width: 'w-[100px]' },
  { field: 'source', label: 'Source', width: 'w-[120px]' }
];

export function VirtualCardTable({ cards }: VirtualCardTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'id',
    direction: 'asc'
  });

  const handleSort = (field: SortField) => {
    setSortConfig(current => ({
      field,
      direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedCards = sortCards(cards, sortConfig);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-x-auto">
      <table className="w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map(({ field, label, width }) => (
              <th
                key={field}
                scope="col"
                className={`${width} px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group`}
                onClick={() => handleSort(field)}
              >
                <div className="flex items-center space-x-1">
                  <span>{label}</span>
                  <ArrowUpDown className={`h-4 w-4 transition-colors ${
                    sortConfig.field === field
                      ? 'text-blue-500'
                      : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                </div>
              </th>
            ))}
            <th scope="col" className="w-[120px] px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedCards.map((card) => (
            <tr key={card.id} className="hover:bg-gray-50">
              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                {card.id}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                {card.guestName}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                {card.hotelName}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                {card.checkInDate}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                {card.checkOutDate}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                {card.currency} {card.remainingBalance.toLocaleString()}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                  ${card.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                  ${card.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                  ${card.status === 'completed' ? 'bg-blue-100 text-blue-800' : ''}
                  ${card.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                `}>
                  {card.status.charAt(0).toUpperCase() + card.status.slice(1)}
                </span>
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                {card.source}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                <VirtualCardActions card={card} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}