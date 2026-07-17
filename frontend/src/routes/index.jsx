import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Layouts
import AppLayout from '../layouts/AppLayout';

// Common route guard
import ProtectedRoute from '../components/common/ProtectedRoute';

// Lazy-loaded pages
const HomePage = React.lazy(() => import('../pages/HomePage'));
const LoginPage = React.lazy(() => import('../pages/LoginPage'));
const RegisterPage = React.lazy(() => import('../pages/RegisterPage'));
const VerifyOtpPage = React.lazy(() => import('../pages/VerifyOtpPage'));
const SearchPage = React.lazy(() => import('../pages/SearchPage'));
const SeatSelectionPage = React.lazy(() => import('../pages/SeatSelectionPage'));
const BookingPage = React.lazy(() => import('../pages/BookingPage'));
const BookingDetailPage = React.lazy(() => import('../pages/BookingDetailPage'));
const MyBookingsPage = React.lazy(() => import('../pages/MyBookingsPage'));
const ProfilePage = React.lazy(() => import('../pages/ProfilePage'));
const AdminPage = React.lazy(() => import('../pages/AdminPage'));
const NotFoundPage = React.lazy(() => import('../pages/NotFoundPage'));

// Helper to wrap lazy components with a loading state
const lazyLoad = (Component) => (
  <React.Suspense
    fallback={
      <div className="flex-1 flex flex-col items-center justify-center min-h-[40vh] text-slate-400">
        <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold tracking-wide animate-pulse">Loading view...</p>
      </div>
    }
  >
    <Component />
  </React.Suspense>
);

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        {/* Public Routes */}
        <Route index element={lazyLoad(HomePage)} />
        <Route path="login" element={lazyLoad(LoginPage)} />
        <Route path="register" element={lazyLoad(RegisterPage)} />
        <Route path="verify-otp" element={lazyLoad(VerifyOtpPage)} />
        <Route path="search" element={lazyLoad(SearchPage)} />

        {/* Private User Routes */}
        <Route
          path="booking/seats/:scheduleId"
          element={<ProtectedRoute>{lazyLoad(SeatSelectionPage)}</ProtectedRoute>}
        />
        <Route
          path="booking/checkout"
          element={<ProtectedRoute>{lazyLoad(BookingPage)}</ProtectedRoute>}
        />
        <Route
          path="bookings"
          element={<ProtectedRoute>{lazyLoad(MyBookingsPage)}</ProtectedRoute>}
        />
        <Route
          path="bookings/:bookingId"
          element={<ProtectedRoute>{lazyLoad(BookingDetailPage)}</ProtectedRoute>}
        />
        <Route
          path="profile"
          element={<ProtectedRoute>{lazyLoad(ProfilePage)}</ProtectedRoute>}
        />

        {/* Admin Panels */}
        <Route
          path="admin"
          element={
            <ProtectedRoute adminOnly>
              {lazyLoad(AdminPage)}
            </ProtectedRoute>
          }
        />

        {/* Catch-All 404 Route */}
        <Route path="*" element={lazyLoad(NotFoundPage)} />
      </Route>
    </Routes>
  );
}
