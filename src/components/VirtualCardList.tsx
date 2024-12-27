import React, { useState } from 'react';
import { Search } from 'lucide-react';
import type { VirtualCard } from '../types';
import { VirtualCardActions } from './actions/VirtualCardActions';
import { DateRangeFilter } from './filters/DateRangeFilter';
import { DashboardSummary } from './dashboard/DashboardSummary';
import { VirtualCardTable } from './table/VirtualCardTable';

// Extended mock data for better testing
const mockData: VirtualCard[] = [
  {
    id: "VC001",
    guestName: "John Doe",
    hotelName: "Grand Hotel",
    checkInDate: "2024-03-15",
    checkOutDate: "2024-03-20",
    remainingBalance: 1500,
    currency: "USD",
    status: "active",
    source: "Booking.com"
  },
  {
    id: "VC002",
    guestName: "Jane Smith",
    hotelName: "Luxury Resort",
    checkInDate: "2023-08-10",
    checkOutDate: "2023-08-15",
    remainingBalance: 0.25,
    currency: "USD",
    status: "completed",
    source: "Expedia"
  },
  {
    id: "VC003",
    guestName: "Alice Johnson",
    hotelName: "Seaside Hotel",
    checkInDate: "2023-05-20",
    checkOutDate: "2023-05-25",
    remainingBalance: 750,
    currency: "USD",
    status: "active",
    source: "Direct"
  }
];

export default function VirtualCardList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredCards = mockData.filter(card => {
    const matchesSearch = 
      card.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.hotelName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || card.status === statusFilter;
    const matchesDateRange = (!startDate || card.checkInDate >= startDate) && 
                           (!endDate || card.checkInDate <= endDate);

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  return (
    <div className="p-6">
      <DashboardSummary cards={mockData} />
      
      <div className="mb-6 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Virtual Cards</h1>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search cards..."
                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
      </div>

      <VirtualCardTable cards={filteredCards} />
    </div>
  );
}