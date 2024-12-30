import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Ticket } from '../types';
import { RefreshCw, X, Search, Loader, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { EmailView } from '../components/tickets/EmailView';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import debounce from 'lodash/debounce';

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
  const [activeTab, setActiveTab] = useState('details');
  const [analyzing, setAnalyzing] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<Array<{id: string, name: string}>>([]);
  const [training, setTraining] = useState(false);
  const [trainingId, setTrainingId] = useState('');
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    if (activeTab === 'training' && selectedTicket) {
      const fetchCategories = async () => {
        try {
          const response = await api.tickets.getCategories();
          if (!response.categories) {
            throw new Error('Invalid response format - missing categories array');
          }
          setCategories(response.categories);
        } catch (error) {
          console.error('Error fetching categories:', error);
          if (error instanceof Error) {
            toast.error(`Failed to load categories: ${error.message}`);
          } else {
            toast.error('Failed to load categories');
          }
        }
      };
      fetchCategories();
    }
  }, [activeTab, selectedTicket]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await api.tickets.checkImap();
      await fetchTickets(page, searchTerm);
      toast.success('Successfully checked for new emails');
    } catch (error) {
      console.error('Error checking IMAP:', error);
      toast.error('Failed to check for new emails');
    } finally {
      setRefreshing(false);
    }
  };

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
      if (newTickets) {
        setTickets(newTickets.map(ticket => ({
          ...ticket,
          sentiment: (ticket as any).sentiment || '0.5',
          extracted_info: (ticket as any).extracted_info || '{}',
          key_phrases: (ticket as any).key_phrases || '[]'
        })));
      } else {
        setTickets([]);
      }
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

  const handleAnalyze = async (ticket: Ticket) => {
    try {
      if (!ticket.subject || !ticket.message) {
        toast.error('Ticket must have a subject and message');
        return;
      }

      setAnalyzing(ticket.id);
      console.log('Analyzing ticket:', ticket);
      
      const result = await api.tickets.analyze({
        subject: ticket.subject.trim(),
        message: ticket.message.trim(),
        from_email: ticket.from_email?.trim() || ''
      });
      
      console.log('Analysis result:', result);
      
      // Update ticket with analysis results
      await api.tickets.update(ticket.id, {
        category: result.analysis.category,
        priority: result.analysis.category.includes('urgent') ? 'high' : 
                 result.analysis.category.includes('complaint') ? 'high' :
                 result.analysis.category.includes('booking') ? 'medium' : 'normal',
        sentiment: result.analysis.sentiment_confidence,
        extracted_info: JSON.stringify(result.analysis.booking_info || {}),
        key_phrases: JSON.stringify([]),
        bert_processed: true
      });
      
      // Refresh the tickets list
      await fetchTickets(page, currentSearchRef.current);
      toast.success('Analysis completed successfully');
      
    } catch (error) {
      console.error('Error analyzing ticket:', error);
      if (axios.isAxiosError(error) && error.response) {
        const errorMessage = error.response.data?.message || error.response.data || error.message;
        toast.error(`Analysis failed: ${errorMessage}`);
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to analyze ticket');
      }
    } finally {
      setAnalyzing(null);
    }
  };

  const handleTrainBert = async () => {
    if (!selectedTicket || !selectedCategory) return;
    
    try {
      setTraining(true);
      const response = await api.tickets.trainBert({
        ticketId: selectedTicket.id,
        categoryId: selectedCategory
      });
      setTrainingId(response.id);
      toast.success('Training started successfully');
    } catch (error) {
      console.error('Error training BERT:', error);
      if (axios.isAxiosError(error) && error.response) {
        const errorMessage = error.response.data?.message || error.response.data || error.message;
        toast.error(`Training failed: ${errorMessage}`);
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to train BERT');
      }
    } finally {
      setTraining(false);
    }
  };

  const handleApproveTraining = async () => {
    if (!trainingId) return;
    
    try {
      setApproving(true);
      await api.tickets.approveTraining(trainingId);
      toast.success('Training approved successfully');
      setTrainingId(''); // Clear training ID after approval
    } catch (error) {
      console.error('Error approving training:', error);
      if (axios.isAxiosError(error) && error.response) {
        const errorMessage = error.response.data?.message || error.response.data || error.message;
        toast.error(`Approving failed: ${errorMessage}`);
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to approve training');
      }
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 bg-white border-b">
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

      <div className="p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={handleSearch}
            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-[#00BCD4]"
          />
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
                  <button
                    onClick={() => setActiveTab('training')}
                    className={`${
                      activeTab === 'training'
                        ? 'border-[#00BCD4] text-[#00BCD4]'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                  >
                    BERT Training
                  </button>
                </nav>
              </div>
              
              <div className="p-6">
                {activeTab === 'details' ? (
                  <>
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
                  </>
                ) : activeTab === 'bert' ? (
                  <div className="p-6 space-y-6">
                    {analyzing === selectedTicket.id ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00BCD4]"></div>
                        <p className="mt-4 text-gray-500">Analyzing ticket...</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <h3 className="font-medium text-gray-900 mb-2">Category</h3>
                            <div className="text-sm text-gray-500">
                              <Badge variant={selectedTicket.category === 'booking' ? 'default' : 'secondary'}>
                                {selectedTicket.category || 'Uncategorized'}
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
                                {selectedTicket.priority || 'Normal'}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <h3 className="font-medium text-gray-900 mb-2">Sentiment Score</h3>
                            <div className="text-sm text-gray-500">
                              {selectedTicket.sentiment && (
                                <Badge 
                                  variant={
                                    parseFloat(selectedTicket.sentiment) > 0.6 ? 'default' : 
                                    parseFloat(selectedTicket.sentiment) < 0.4 ? 'destructive' : 
                                    'secondary'
                                  }
                                >
                                  {parseFloat(selectedTicket.sentiment).toFixed(2)}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <h3 className="font-medium text-gray-900 mb-2">Extracted Information</h3>
                            <div className="text-sm text-gray-500 space-y-2">
                              {(() => {
                                try {
                                  const info = typeof selectedTicket.extracted_info === 'string' 
                                    ? JSON.parse(selectedTicket.extracted_info) 
                                    : selectedTicket.extracted_info || {};
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
                                } catch (error) {
                                  console.error('Error parsing extracted info:', error);
                                  return <div className="text-red-500">Error displaying information</div>;
                                }
                              })()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <h3 className="font-medium text-gray-900 mb-2">Key Phrases</h3>
                          <div className="flex flex-wrap gap-2">
                            {(() => {
                              try {
                                const phrases = typeof selectedTicket.key_phrases === 'string' 
                                  ? JSON.parse(selectedTicket.key_phrases) 
                                  : selectedTicket.key_phrases || [];
                                return phrases.map((phrase: string, index: number) => (
                                  <Badge key={index} variant="secondary">
                                    {phrase}
                                  </Badge>
                                ));
                              } catch (error) {
                                console.error('Error parsing key phrases:', error);
                                return <div className="text-red-500">Error displaying key phrases</div>;
                              }
                            })()}
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => handleAnalyze(selectedTicket)}
                          disabled={analyzing === selectedTicket.id}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
                        >
                          <RefreshCw className={`h-4 w-4 ${analyzing === selectedTicket.id ? 'animate-spin' : ''}`} />
                          Reanalyze
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <h3 className="font-medium text-gray-900 mb-4">Train BERT Model</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Current Category</label>
                          <div className="mt-1">
                            <Badge variant={selectedTicket.category === 'booking' ? 'default' : 'secondary'}>
                              {selectedTicket.category || 'Uncategorized'}
                            </Badge>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Update Category</label>
                          <select 
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#00BCD4] focus:border-[#00BCD4] sm:text-sm rounded-md"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                          >
                            <option value="">Select category...</option>
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex justify-between">
                          <button
                            onClick={() => handleTrainBert()}
                            disabled={!selectedCategory || training}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#00BCD4] hover:bg-[#00ACC1] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00BCD4] disabled:opacity-50"
                          >
                            {training ? (
                              <>
                                <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                Training...
                              </>
                            ) : (
                              'Train BERT'
                            )}
                          </button>

                          <button
                            onClick={() => handleApproveTraining()}
                            disabled={!trainingId || approving}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                          >
                            {approving ? (
                              <>
                                <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                Approving...
                              </>
                            ) : (
                              'Approve Training'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}