import React from 'react';
import DatePicker from 'react-datepicker';
import { Calendar } from 'lucide-react';
import "react-datepicker/dist/react-datepicker.css";

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export function DateRangeFilter({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange 
}: DateRangeFilterProps) {
  return (
    <div className="flex gap-4 items-end bg-white p-4 rounded-lg shadow-sm">
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Check-in From
        </label>
        <div className="relative">
          <DatePicker
            selected={startDate ? new Date(startDate) : null}
            onChange={(date: Date) => onStartDateChange(date.toISOString().split('T')[0])}
            dateFormat="yyyy-MM-dd"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholderText="Select start date"
          />
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </div>
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Check-in To
        </label>
        <div className="relative">
          <DatePicker
            selected={endDate ? new Date(endDate) : null}
            onChange={(date: Date) => onEndDateChange(date.toISOString().split('T')[0])}
            dateFormat="yyyy-MM-dd"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholderText="Select end date"
          />
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </div>
    </div>
  );
}