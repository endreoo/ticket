import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { Mail, Paperclip, Loader, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { EmailView } from '../components/tickets/EmailView';
import debounce from 'lodash/debounce';

interface Ticket {
  id: number;
  subject: string;
  message: string;
  from_email?: string;
  status: string;
  priority?: string;
  hotel_id?: number;
  category: string;
  created_at: string;
  updated_at: string;
  has_attachments?: boolean;
  html_content?: string;
  hotel_name?: string;
}

interface PaginationMetadata {
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
}

export function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { token } = useAuth();
  const currentSearchRef = useRef(searchTerm);

  const fetchTickets = async (pageNum: number, search?: string) => {
    try {
      setLoading(true);
      console.log('Fetching tickets with search:', search);
      const response = await api.tickets.list({ 
        page: pageNum, 
        limit,
        search: search || undefined
      });
      console.log('API Response:', response);
      const { tickets: newTickets, pagination } = response;
      setTickets(newTickets || []);
      setTotal(pagination.totalItems);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchTickets(1);
  }, [token]);

  // Handle search changes with debounce
  const debouncedSearch = useCallback(
    debounce((search: string) => {
      console.log('Debounced search:', search);
      currentSearchRef.current = search;
      setPage(1);
      fetchTickets(1, search);
    }, 500),
    []
  );

  useEffect(() => {
    console.log('Search term changed:', searchTerm);
    debouncedSearch(searchTerm);
  }, [searchTerm]);

  // Handle pagination
  useEffect(() => {
    fetchTickets(page, currentSearchRef.current);
  }, [page, limit]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Search input changed:', e.target.value);
    setSearchTerm(e.target.value);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-orange-100 text-orange-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalPages = Math.ceil(total / limit);

  const getVisiblePages = () => {
    const delta = 2; // Number of pages to show before and after current page
    const pages = [];
    const leftBound = Math.max(1, page - delta);
    const rightBound = Math.min(totalPages, page + delta);

    // Always show first page
    if (leftBound > 1) {
      pages.push(1);
      if (leftBound > 2) pages.push('...');
    }

    // Add pages around current page
    for (let i = leftBound; i <= rightBound; i++) {
      pages.push(i);
    }

    // Always show last page
    if (rightBound < totalPages) {
      if (rightBound < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Support Tickets</h1>
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search in tickets..."
            value={searchTerm}
            onChange={handleSearch}
            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      <div className="space-y-6">
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <EmailView
              id={ticket.id}
              subject={ticket.subject}
              fromEmail={ticket.from_email || ''}
              message={ticket.message}
              htmlContent={ticket.html_content}
              hasAttachments={ticket.has_attachments}
              createdAt={ticket.created_at}
              hotelName={ticket.hotel_name}
              onOpenTicket={() => setSelectedTicket(ticket)}
            />
            
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div className="flex gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                  {ticket.status}
                </span>
                {ticket.priority && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                )}
                {ticket.category && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {ticket.category}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-center py-4">
            <Loader className="h-6 w-6 animate-spin text-gray-500" />
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="relative inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-[#00BCD4] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ring-1 ring-inset ring-gray-300"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="relative ml-3 inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-[#00BCD4] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ring-1 ring-inset ring-gray-300"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{Math.min((page - 1) * limit + 1, total)}</span> to{' '}
              <span className="font-medium">{Math.min(page * limit, total)}</span> of{' '}
              <span className="font-medium">{total}</span> results
            </p>
          </div>
          <div className="flex items-center gap-6">
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#00BCD4] sm:text-sm sm:leading-6 cursor-pointer hover:bg-gray-50"
            >
              <option value="10">10 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </select>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Previous</span>
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              {getVisiblePages().map((number, index) => (
                number === '...' ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={number}
                    onClick={() => setPage(number as number)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      page === number
                        ? 'z-10 bg-[#00BCD4] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00BCD4] hover:bg-[#00ACC1]'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                    }`}
                  >
                    {number}
                  </button>
                )
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Next</span>
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Ticket Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Ticket Details</h2>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <EmailView
                id={selectedTicket.id}
                subject={selectedTicket.subject}
                fromEmail={selectedTicket.from_email || ''}
                message={selectedTicket.message}
                htmlContent={selectedTicket.html_content}
                hasAttachments={selectedTicket.has_attachments}
                createdAt={selectedTicket.created_at}
                hotelName={selectedTicket.hotel_name}
                forceExpanded={true}
                hideExpand={true}
              />
              
              <div className="mt-6 space-y-4">
                <h3 className="font-semibold text-lg">Actions</h3>
                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Reply
                  </button>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                    Forward
                  </button>
                  {selectedTicket.has_attachments && (
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                      Download Attachments
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}