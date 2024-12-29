import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { Mail, Paperclip, Loader, X, Search } from 'lucide-react';
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
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const observer = useRef<IntersectionObserver>();
  const { token } = useAuth();
  const currentSearchRef = useRef(searchTerm);

  const fetchTickets = async (pageNum: number, search?: string) => {
    try {
      setLoading(true);
      console.log('Fetching tickets with search:', search);
      const response = await api.tickets.list({ 
        page: pageNum, 
        limit: 10,
        search: search || undefined
      });
      console.log('API Response:', response);
      const { tickets: newTickets, pagination } = response;
      
      if (pageNum === 1) {
        setTickets(newTickets);
      } else {
        setTickets(prev => [...prev, ...newTickets]);
      }
      
      setHasMore(pageNum < pagination.totalPages);
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
    if (page > 1) {
      fetchTickets(page, currentSearchRef.current);
    }
  }, [page]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Search input changed:', e.target.value);
    setSearchTerm(e.target.value);
  };

  const lastTicketElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

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
        {tickets.map((ticket, index) => (
          <div
            key={ticket.id}
            ref={index === tickets.length - 1 ? lastTicketElementRef : undefined}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <EmailView
              id={ticket.id}
              subject={ticket.subject}
              fromEmail={ticket.from_email || ''}
              message={ticket.message}
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