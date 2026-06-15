import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { AuthProvider } from './services/authService';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import BookingCreate from './pages/BookingCreate';
import BookingDetailPage from './pages/BookingDetailPage';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Tasks from './pages/Tasks';
import Calendar from './pages/Calendar';
import Documents from './pages/Documents';
import Payments from './pages/Payments';
import AirlineRates from './pages/AirlineRates';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Assistant from './pages/Assistant';
import Profile from './pages/Profile';
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="/bookings" element={<Bookings />} />
              <Route path="/shipments" element={<Bookings />} />
              <Route path="/bookings/new" element={<BookingCreate />} />
              <Route path="/bookings/:id" element={<BookingDetailPage />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/customers/:id" element={<CustomerDetail />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/airline-rates" element={<AirlineRates />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/assistant" element={<Assistant />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
