import { NavLink } from 'react-router-dom';
import { CalendarDays, TicketCheck } from 'lucide-react';

const navigation = [
  { name: 'Bookings', to: '/', icon: CalendarDays },
  { name: 'Tickets', to: '/tickets', icon: TicketCheck },
];

export function Sidebar() {
  return (
    <div className="w-64 bg-white shadow-sm min-h-screen">
      <nav className="mt-5 px-2">
        <div className="space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive }) =>
                `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-[#00BCD4]/10 text-[#00BCD4]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <item.icon
                className="mr-3 h-5 w-5 flex-shrink-0"
                aria-hidden="true"
              />
              {item.name}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}