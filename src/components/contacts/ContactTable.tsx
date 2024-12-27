import { useState } from 'react';
import { ArrowUpDown, MoreVertical } from 'lucide-react';
import type { Contact } from '../../types';

interface ContactTableProps {
  searchTerm: string;
  hotelFilter: string;
}

export function ContactTable({ searchTerm, hotelFilter }: ContactTableProps) {
  const [sortField, setSortField] = useState<keyof Contact>('first_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: keyof Contact) => {
    if (field === sortField) {
      setSortDirection(current => current === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('first_name')}
            >
              <div className="flex items-center space-x-1">
                <span>Name</span>
                <ArrowUpDown className="h-4 w-4" />
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Hotel
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('position')}
            >
              <div className="flex items-center space-x-1">
                <span>Position</span>
                <ArrowUpDown className="h-4 w-4" />
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Contact Info
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Primary
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          <tr>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm font-medium text-gray-900">John Doe</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              Sample Hotel
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              General Manager
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-gray-900">john@example.com</div>
              <div className="text-sm text-gray-500">+1 234 567 8900</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                Primary
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button className="text-gray-400 hover:text-gray-500">
                <MoreVertical className="h-5 w-5" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}