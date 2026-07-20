import { Train, ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-slate-150 bg-white text-slate-500 text-sm font-sans mt-auto shadow-inner">
      
      {/* Upper Footer Links Section */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-8 border-b border-slate-100">
        
        {/* Column 1: Brand Info */}
        <div className="md:col-span-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary-50 text-primary-700">
              <Train className="h-5 w-5" />
            </div>
            <span className="font-black text-primary-950 text-base tracking-tight">BharatRail</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-semibold max-w-sm">
            Experience next-generation, premium train ticket bookings across India. Real-time availability, instant hold systems, and secure Razorpay payment gateway options.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50/50 border border-green-100 px-3 py-1 rounded-xl w-fit font-bold">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            <span>Secure SSL Encrypted</span>
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div className="md:col-span-2 space-y-3">
          <h4 className="text-xs font-black text-primary-950 uppercase tracking-widest">Bookings</h4>
          <ul className="space-y-2 text-xs font-bold text-slate-400">
            <li>
              <Link to="/" className="hover:text-secondary-600 transition-colors">Search Trains</Link>
            </li>
            <li>
              <Link to="/bookings" className="hover:text-secondary-600 transition-colors">Booking History</Link>
            </li>
            <li>
              <Link to="/profile" className="hover:text-secondary-600 transition-colors">User Account</Link>
            </li>
            <li>
              <Link to="/admin" className="hover:text-secondary-600 transition-colors">Admin Portal</Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Legal & Rules */}
        <div className="md:col-span-2 space-y-3">
          <h4 className="text-xs font-black text-primary-950 uppercase tracking-widest">Legal</h4>
          <ul className="space-y-2 text-xs font-bold text-slate-400">
            <li>
              <span className="hover:text-secondary-600 transition-colors cursor-pointer">Privacy Policy</span>
            </li>
            <li>
              <span className="hover:text-secondary-600 transition-colors cursor-pointer">Terms of Service</span>
            </li>
            <li>
              <span className="hover:text-secondary-600 transition-colors cursor-pointer">Refund Rules</span>
            </li>
            <li>
              <span className="hover:text-secondary-600 transition-colors cursor-pointer">Ticket Clauses</span>
            </li>
          </ul>
        </div>

        {/* Column 4: Help Center */}
        <div className="md:col-span-4 space-y-3">
          <h4 className="text-xs font-black text-primary-950 uppercase tracking-widest">Customer Support</h4>
          <ul className="space-y-2.5 text-xs font-bold text-slate-400">
            <li className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-350 shrink-0" />
              <span>1800-419-5432 (24/7 Helpline)</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-350 shrink-0" />
              <span className="hover:text-secondary-600 transition-colors cursor-pointer">support@bharatrail.com</span>
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-350 shrink-0" />
              <span>IRCTC Corporate Office, New Delhi, India</span>
            </li>
          </ul>
        </div>

      </div>

      {/* Bottom Footer Section */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-slate-400 font-bold">
          &copy; {new Date().getFullYear()} BharatRail Reservation System. All rights reserved.
        </p>
        <p className="text-[10px] text-slate-350 font-bold tracking-wide">
          Designed for high-reliability railway reservations & commercial ticketing.
        </p>
      </div>

    </footer>
  );
}
