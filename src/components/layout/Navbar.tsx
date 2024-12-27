import { useAuth } from '../../contexts/AuthContext';
import { LogOut } from 'lucide-react';

export function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* HO Logo */}
            <div className="flex items-center">
              <span className="text-[#00BCD4] text-3xl font-bold">H</span>
              <span className="text-[#00BCD4] text-3xl font-bold">O</span>
              <span className="ml-2 text-[#00BCD4] text-xl font-semibold">
                Hotel<span className="border-b-2 border-[#00BCD4]">Online</span>
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">{user?.full_name}</span>
            <button
              onClick={signOut}
              className="p-2 text-gray-500 hover:text-gray-700"
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}