import { useState } from 'react';
import { ArrowUpDown, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import type { Database } from '../../types/database';

type Ticket = Database['public']['Tables']['tickets']['Row'];

interface TicketTableProps {
  tickets: Ticket[];
  onTicketUpdate: () => void;
}

export function TicketTable({ tickets, onTicketUpdate }: TicketTableProps) {
  const [sortField, setSortField] = useState<keyof Ticket>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof Ticket) => {
    setSortField(field);
    setSortDirection(current => current === 'asc' ? 'desc' : 'asc');
  };

  const sortedTickets = [...tickets].sort((a, b) => {
    const aValue = a[sortField] ?? '';
    const bValue = b[sortField] ?? '';
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('subject')}
            >
              <div className="flex items-center space-x-1">
                <span>Subject</span>
                <ArrowUpDown className="h-4 w-4" />
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('priority')}
            >
              <div className="flex items-center space-x-1">
                <span>Priority</span>
                <ArrowUpDown className="h-4 w-4" />
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center space-x-1">
                <span>Status</span>
                <ArrowUpDown className="h-4 w-4" />
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('created_at')}
            >
              <div className="flex items-center space-x-1">
                <span>Created</span>
                <ArrowUpDown className="h-4 w-4" />
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              <div className="flex items-center space-x-1">
                <span>Full Content</span>
              </div>
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedTickets.map((ticket) => (
            <tr key={ticket.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {ticket.subject}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                  ${ticket.priority === 'high' ? 'bg-red-100 text-red-800' : ''}
                  ${ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : ''}
                  ${ticket.priority === 'low' ? 'bg-green-100 text-green-800' : ''}
                  ${!ticket.priority ? 'bg-gray-100 text-gray-800' : ''}
                `}>
                  {ticket.priority ? ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1) : 'None'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                  ${ticket.status === 'open' ? 'bg-blue-100 text-blue-800' : ''}
                  ${ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : ''}
                  ${ticket.status === 'resolved' ? 'bg-green-100 text-green-800' : ''}
                `}>
                  {ticket.status.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {format(new Date(ticket.created_at), 'MMM dd, yyyy')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {ticket.has_full_content && (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                    Full Content Available
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button className="text-gray-400 hover:text-gray-500">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}