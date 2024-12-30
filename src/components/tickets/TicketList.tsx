import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { X, Search, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { EmailView } from './EmailView';
import { TicketTable } from './TicketTable';
import { Badge } from '../ui/badge';
import axios from 'axios';
import type { Ticket } from '../../types';

export function TicketList() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [analyzing, setAnalyzing] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [page, limit, searchTerm, statusFilter, priorityFilter]);

  async function handleRefresh() {
    try {
      setRefreshing(true);
      await axios.post('/tickets/check-imap');
      await fetchTickets();
    } catch (error) {
      console.error('Error checking IMAP:', error);
      alert('Failed to check for new emails. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }

  async function fetchTickets() {
    try {
      setLoading(true);
      const response = await api.tickets.list({
        page,
        limit,
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined
      });
      if (response && response.tickets) {
        const processedTickets = response.tickets.map(rawTicket => {
          // Convert raw ticket data to match Ticket interface
          const ticket: Ticket = {
            id: rawTicket.id,
            subject: rawTicket.subject,
            message: rawTicket.message,
            from_email: rawTicket.from_email || '',
            status: rawTicket.status,
            category: rawTicket.category || '',
            created_at: rawTicket.created_at,
            sentiment: rawTicket.sentiment?.toString() || '0.5',
            extracted_info: rawTicket.extracted_info || '{}',
            key_phrases: rawTicket.key_phrases || '[]',
            priority: rawTicket.priority,
            hotel_id: rawTicket.hotel_id,
            html_content: rawTicket.html_content,
            has_attachments: rawTicket.has_attachments || false,
            hotel_name: rawTicket.hotel_name || '',
            updated_at: rawTicket.updated_at,
            bert_processed: rawTicket.bert_processed || false,
            message_id: rawTicket.message_id,
            email_raw: rawTicket.email_raw,
            uid: rawTicket.uid,
            full_content_id: rawTicket.full_content_id,
            has_full_content: rawTicket.has_full_content || false
          };
          return ticket;
        });
        setTickets(processedTickets);
        setTotal(response.pagination.totalItems);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleAnalyze = async (ticketId: number) => {
    try {
      setAnalyzing(ticketId);
      
      // Send to BERT API and update in one step
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/tickets/${ticketId}/analyze`);
      
      // Update the ticket in the list with new analysis
      if (response.data.analysis) {
        setTickets(tickets.map(ticket => {
          if (ticket.id === ticketId) {
            return {
              ...ticket,
              category: response.data.analysis.analysis.category,
              sentiment: response.data.analysis.analysis.sentiment_confidence.toString(),
              extracted_info: JSON.stringify(response.data.analysis.analysis.booking_info || {}),
              key_phrases: '[]'
            };
          }
          return ticket;
        }));
      }
    } catch (error) {
      console.error('Error analyzing ticket:', error);
      // Show error to user
      alert('Failed to analyze ticket. Please try again later.');
    } finally {
      setAnalyzing(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Support Tickets</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-6 py-2 bg-[#00BCD4] text-white rounded-lg hover:bg-[#00ACC1] flex items-center gap-2 disabled:opacity-50 shadow-md font-medium min-w-[180px] h-10"
        >
          <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Checking Emails...' : 'Check New Emails'}
        </button>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-lg border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#00BCD4] focus:border-[#00BCD4]"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => {
            setPriorityFilter(e.target.value);
            setPage(1);
          }}
          className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#00BCD4] focus:border-[#00BCD4]"
        >
          <option value="all">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <TicketTable 
        tickets={tickets} 
        onTicketUpdate={fetchTickets} 
        onTicketSelect={setSelectedTicket}
      />

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
            
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`${
                    activeTab === 'details'
                      ? 'border-[#00BCD4] text-[#00BCD4]'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                >
                  Details
                </button>
                <button
                  onClick={() => setActiveTab('bert')}
                  className={`${
                    activeTab === 'bert'
                      ? 'border-[#00BCD4] text-[#00BCD4]'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                >
                  BERT Analysis
                </button>
              </nav>
            </div>
            
            <div className="p-6">
              {activeTab === 'details' ? (
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
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <h3 className="font-medium text-gray-900 mb-2">Category</h3>
                      <div className="text-sm text-gray-500">
                        <Badge variant={selectedTicket.category === 'booking' ? 'default' : 'secondary'}>
                          {selectedTicket.category}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <h3 className="font-medium text-gray-900 mb-2">Priority</h3>
                      <div className="text-sm text-gray-500">
                        <Badge 
                          variant={
                            selectedTicket.priority === 'high' ? 'destructive' : 
                            selectedTicket.priority === 'normal' ? 'default' : 
                            'secondary'
                          }
                        >
                          {selectedTicket.priority}
                        </Badge>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <h3 className="font-medium text-gray-900 mb-2">Sentiment Score</h3>
                      <div className="text-sm text-gray-500">
                        <Badge 
                          variant={
                            parseFloat(selectedTicket.sentiment) > 0.6 ? 'default' : 
                            parseFloat(selectedTicket.sentiment) < 0.4 ? 'destructive' : 
                            'secondary'
                          }
                        >
                          {parseFloat(selectedTicket.sentiment).toFixed(2)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <h3 className="font-medium text-gray-900 mb-2">Extracted Information</h3>
                      <div className="text-sm text-gray-500 space-y-2">
                        {(() => {
                          const info = JSON.parse(selectedTicket.extracted_info || '{}');
                          return (
                            <>
                              {info.hotel_name && (
                                <div>
                                  <span className="font-medium">Hotel:</span> {info.hotel_name}
                                </div>
                              )}
                              {info.guest_name && (
                                <div>
                                  <span className="font-medium">Guest:</span> {info.guest_name}
                                </div>
                              )}
                              {info.room_type && (
                                <div>
                                  <span className="font-medium">Room:</span> {info.room_type}
                                </div>
                              )}
                              {info.dates?.length > 0 && (
                                <div>
                                  <span className="font-medium">Dates:</span> {info.dates.join(' to ')}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h3 className="font-medium text-gray-900 mb-2">Key Phrases</h3>
                    <div className="flex flex-wrap gap-2">
                      {JSON.parse(selectedTicket.key_phrases || '[]').map((phrase: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {phrase}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleAnalyze(selectedTicket.id)}
                    disabled={analyzing === selectedTicket.id}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${analyzing === selectedTicket.id ? 'animate-spin' : ''}`} />
                    Reanalyze
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
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
          <div className="flex items-center gap-4">
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="border rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-[#00BCD4] focus:border-[#00BCD4]"
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
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
              >
                <span className="sr-only">Previous</span>
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                <button
                  key={number}
                  onClick={() => setPage(number)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    page === number
                      ? 'z-10 bg-[#00BCD4] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00BCD4]'
                      : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                  }`}
                >
                  {number}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
              >
                <span className="sr-only">Next</span>
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}