import { NavLink } from 'react-router-dom';
import { Calendar, Ticket, Building2, Users, UserRound } from 'lucide-react';

const navItems = [
  { to: '/', icon: Calendar, label: 'Bookings' },
  { to: '/tickets', icon: Ticket, label: 'Tickets' },
  { to: '/hotels', icon: Building2, label: 'Hotels' },
  { to: '/contacts', icon: Users, label: 'Contacts' },
  { to: '/guests', icon: UserRound, label: 'Guests' }
];

export function Navigation() {
  return (
    <nav className="space-y-1">
      {navItems.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              isActive
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`
          }
        >
          <item.icon className="mr-3 h-6 w-6" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
} 