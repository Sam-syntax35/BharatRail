import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import OfflineDetector from '../components/common/OfflineDetector';
import ToastContainer from '../components/common/ToastContainer';

export default function AppLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Offline Status Warning Indicator */}
      <OfflineDetector />

      {/* Global Toast Alerts */}
      <ToastContainer />

      {/* Main Header navigation */}
      <Navbar />

      {/* Dynamic Content scroll viewport */}
      <main className="flex-1 flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Static Footer */}
      <Footer />
    </div>
  );
}
