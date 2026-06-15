import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const labels = {
  bookings: 'Bookings',
  shipments: 'Shipments',
  customers: 'Customers',
  tasks: 'Staff',
  documents: 'Documents',
  payments: 'Revenue',
  'airline-rates': 'Rates',
  calendar: 'Calendar',
  reports: 'Reports',
  assistant: 'AI Assistant',
  notifications: 'Alerts',
  profile: 'Profile',
  settings: 'Settings',
  new: 'New'
};

export default function Breadcrumbs() {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  if (!parts.length) {
    return (
      <nav className="flex flex-wrap items-center gap-1 text-xs text-[#64748b] no-print" aria-label="Breadcrumb">
        <span className="inline-flex items-center gap-1 rounded-lg bg-[#f5f7fb] px-2 py-1 font-semibold text-[#172033]">
          <Home className="h-3.5 w-3.5" />
          Dashboard
        </span>
      </nav>
    );
  }

  let currentPath = '';
  return (
    <nav className="flex flex-wrap items-center gap-1 text-xs text-[#64748b] no-print" aria-label="Breadcrumb">
      <Link to="/" className="inline-flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-[#f5f7fb] hover:text-[#172033]">
        <Home className="h-3.5 w-3.5" />
        Dashboard
      </Link>
      {parts.map((part, index) => {
        currentPath += `/${part}`;
        const isLast = index === parts.length - 1;
        const label = labels[part] || (part.startsWith('ORB-') ? part : part.replace(/-/g, ' '));
        return (
          <span key={`${part}-${index}`} className="inline-flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5" />
            {isLast ? (
              <span className="rounded-lg bg-[#f5f7fb] px-2 py-1 font-semibold text-[#172033]">{label}</span>
            ) : (
              <Link to={currentPath} className="rounded-lg px-2 py-1 hover:bg-[#f5f7fb] hover:text-[#172033]">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
