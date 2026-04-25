import { useState } from 'react';
import { Search, Check, X, MessageSquare } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ClayCard } from '../../components/ui/ClayCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { mockBookings } from '../../data/mockData';

export function CompanyBookingsPage() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed'>('all');
  const bookings = mockBookings.filter(b => filter === 'all' || b.status === filter);

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;

  return (
    <AppLayout role="company" title="Bookings" subtitle="All company bookings">
      <div className="flex gap-2 mb-6">
        {(['all', 'pending', 'confirmed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-pill text-sm font-medium transition-all ${
              filter === f ? 'bg-burnt-brown text-white' : 'bg-white text-text-secondary hover:bg-clay-border-light'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <ClayCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="clay-table">
          <thead>
            <tr>
              <th>Listing</th>
              <th>Tenant</th>
              <th>Move-in Date</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(booking => (
              <tr key={booking.id}>
                <td className="font-medium text-text-primary">{booking.listingTitle}</td>
                <td>
                  <p className="font-medium text-text-primary">{booking.userName}</p>
                  <p className="text-xs text-text-tertiary">{booking.userPhone}</p>
                </td>
                <td className="text-text-secondary">
                  {new Date(booking.moveInDate).toLocaleDateString()}
                </td>
                <td className="font-semibold text-text-primary">{formatCurrency(booking.price)}</td>
                <td>
                  <StatusBadge variant={booking.status === 'confirmed' ? 'success' : booking.status === 'pending' ? 'warning' : 'default'}>
                    {booking.status}
                  </StatusBadge>
                </td>
                <td>
                  <button className="p-2 rounded-clay-sm bg-status-info/10 text-status-info hover:bg-status-info/20">
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </ClayCard>
    </AppLayout>
  );
}