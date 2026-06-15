import { Navigate, Outlet, useLocation } from 'react-router-dom';
import LoadingState from '../common/LoadingState';
import { useAuth } from '../../services/authService';

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
        <div className="w-full max-w-xl">
          <LoadingState rows={4} />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
