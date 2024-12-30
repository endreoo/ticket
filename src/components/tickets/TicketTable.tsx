import { useState } from 'react';
import { ArrowUpDown, MoreVertical, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import type { Ticket } from '../../types';
import { Badge } from '../../components/ui/badge';
import axios from 'axios';

interface TicketTableProps {
  tickets: Ticket[];
  onTicketUpdate: () => void;
  onTicketSelect: (ticket: Ticket) => void;
}

interface RowData {
  original: Ticket;
}

export function TicketTable({ tickets, onTicketUpdate, onTicketSelect }: TicketTableProps) {
  const [sortField, setSortField] = useState<keyof Ticket>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [analyzing, setAnalyzing] = useState<number | null>(null);

  const handleSort = (field: keyof Ticket) => {
    setSortField(field);
    setSortDirection(current => current === 'asc' ? 'desc' : 'asc');
  };

  const sortedTickets = [...tickets].sort((a, b) => {
    const aStr = String(a[sortField] ?? '');
    const bStr = String(b[sortField] ?? '');
    
    if (sortField === 'sentiment' || 
        sortField === 'id' || 
        sortField === 'hotel_id' || 
        sortField === 'uid' || 
        sortField === 'full_content_id') {
      const aNum = String(Number(aStr) || 0).padStart(20, '0');
      const bNum = String(Number(bStr) || 0).padStart(20, '0');
      return sortDirection === 'asc'
        ? aNum.localeCompare(bNum)
        : bNum.localeCompare(aNum);
    }

    return sortDirection === 'asc'
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr);
  });

  const handleAnalyze = async (ticketId: number) => {
    try {
      setAnalyzing(ticketId);
      await axios.post(`/api/tickets/${ticketId}/analyze`);
      onTicketUpdate(); // Refresh ticket list
    } catch (error) {
      console.error('Error analyzing ticket:', error);
    } finally {
      setAnalyzing(null);
    }
  };

  const columns = [
    {
      header: 'Subject',
      accessorKey: 'subject',
      cell: ({ row }: { row: RowData }) => (
        <div className="max-w-xs truncate">{row.original.subject}</div>
      ),
    },
    {
      header: 'Priority',
      accessorKey: 'priority',
      cell: ({ row }: { row: RowData }) => (
        <Badge 
          variant={
            row.original.priority === 'high' ? 'destructive' : 
            row.original.priority === 'normal' ? 'default' : 
            'secondary'
          }
        >
          {row.original.priority}
        </Badge>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }: { row: RowData }) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
          ${row.original.status === 'open' ? 'bg-blue-100 text-blue-800' : ''}
          ${row.original.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : ''}
          ${row.original.status === 'resolved' ? 'bg-green-100 text-green-800' : ''}
        `}>
          {row.original.status.split('_').map((word: string) => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ')}
        </span>
      ),
    },
    {
      header: 'Created',
      accessorKey: 'created_at',
      cell: ({ row }: { row: RowData }) => (
        <div className="text-sm text-gray-500">
          {format(new Date(row.original.created_at), 'MMM dd, yyyy')}
        </div>
      ),
    },
    {
      header: 'Full Content',
      accessorKey: 'has_full_content',
      cell: ({ row }: { row: RowData }) => (
        <div className="max-w-xs truncate">
          {row.original.has_full_content && (
            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
              Full Content Available
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Category',
      accessorKey: 'category',
      cell: ({ row }: { row: RowData }) => (
        <Badge variant={row.original.category === 'booking' ? 'default' : 'secondary'}>
          {row.original.category}
        </Badge>
      ),
    },
    {
      header: 'Sentiment',
      accessorKey: 'sentiment',
      cell: ({ row }: { row: RowData }) => {
        const sentimentValue = parseFloat(row.original.sentiment);
        const variant: 'default' | 'secondary' | 'destructive' = 
          sentimentValue > 0.6 ? 'default' : 
          sentimentValue < 0.4 ? 'destructive' : 
          'secondary';
        return (
          <Badge variant={variant}>
            {row.original.sentiment}
          </Badge>
        );
      },
    },
    {
      header: 'Key Info',
      accessorKey: 'extracted_info',
      cell: ({ row }: { row: RowData }) => {
        const info = JSON.parse(row.original.extracted_info || '{}');
        return (
          <div className="max-w-xs truncate">
            {info.hotel_name && (
              <div>Hotel: {info.hotel_name}</div>
            )}
            {info.guest_name && (
              <div>Guest: {info.guest_name}</div>
            )}
            {info.dates && info.dates.length > 0 && (
              <div>Dates: {info.dates.join(' to ')}</div>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.accessorKey}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort(column.accessorKey as keyof Ticket)}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.header}</span>
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </th>
            ))}
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedTickets.map((ticket) => (
            <tr 
              key={ticket.id} 
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => onTicketSelect(ticket)}
            >
              {columns.map((column) => (
                <td key={column.accessorKey} className="px-6 py-4 whitespace-nowrap">
                  {column.accessorKey === 'subject' && (
                    <div className="max-w-xs truncate">{ticket.subject}</div>
                  )}
                  {column.accessorKey === 'priority' && (
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${ticket.priority === 'high' ? 'bg-red-100 text-red-800' : ''}
                      ${ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${ticket.priority === 'low' ? 'bg-green-100 text-green-800' : ''}
                      ${!ticket.priority ? 'bg-gray-100 text-gray-800' : ''}
                    `}>
                      {ticket.priority ? ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1) : 'None'}
                    </span>
                  )}
                  {column.accessorKey === 'status' && (
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${ticket.status === 'open' ? 'bg-blue-100 text-blue-800' : ''}
                      ${ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${ticket.status === 'resolved' ? 'bg-green-100 text-green-800' : ''}
                    `}>
                      {ticket.status.split('_').map((word: string) => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </span>
                  )}
                  {column.accessorKey === 'created_at' && (
                    <div className="text-sm text-gray-500">
                      {format(new Date(ticket.created_at), 'MMM dd, yyyy')}
                    </div>
                  )}
                  {column.accessorKey === 'has_full_content' && (
                    <div className="max-w-xs truncate">
                      {ticket.has_full_content && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                          Full Content Available
                        </span>
                      )}
                    </div>
                  )}
                  {column.accessorKey === 'category' && (
                    <Badge variant={ticket.category === 'booking' ? 'default' : 'secondary'}>
                      {ticket.category}
                    </Badge>
                  )}
                  {column.accessorKey === 'sentiment' && (
                    <Badge 
                      variant={
                        parseFloat(ticket.sentiment) > 0.6 ? 'default' : 
                        parseFloat(ticket.sentiment) < 0.4 ? 'destructive' : 
                        'secondary'
                      }
                    >
                      {parseFloat(ticket.sentiment).toFixed(2)}
                    </Badge>
                  )}
                  {column.accessorKey === 'extracted_info' && (
                    <div className="max-w-xs truncate">
                      {JSON.parse(ticket.extracted_info || '{}').hotel_name && <div>Hotel: {JSON.parse(ticket.extracted_info || '{}').hotel_name}</div>}
                      {JSON.parse(ticket.extracted_info || '{}').guest_name && <div>Guest: {JSON.parse(ticket.extracted_info || '{}').guest_name}</div>}
                      {JSON.parse(ticket.extracted_info || '{}').dates?.length > 0 && (
                        <div>Dates: {JSON.parse(ticket.extracted_info || '{}').dates.join(' to ')}</div>
                      )}
                    </div>
                  )}
                </td>
              ))}
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button 
                  className="text-gray-400 hover:text-gray-500 mr-2"
                  onClick={() => handleAnalyze(ticket.id)}
                  disabled={analyzing === ticket.id}
                >
                  <RefreshCw 
                    className={`h-5 w-5 ${analyzing === ticket.id ? 'animate-spin' : ''}`} 
                  />
                </button>
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