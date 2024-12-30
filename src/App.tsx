import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/auth/LoginPage';
import { BookingsPage } from './pages/BookingsPage';
import { TicketsPage } from './pages/TicketsPage';
import { HotelsPage } from './pages/HotelsPage';
import { ContactsPage } from './pages/ContactsPage';
import { GuestsPage } from './pages/GuestsPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<BookingsPage />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/hotels" element={<HotelsPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/guests" element={<GuestsPage />} />
          </Route>
        </Routes>
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;