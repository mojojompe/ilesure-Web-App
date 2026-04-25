import { useState } from 'react';
import { Search, Filter, Check, X, Calendar, Phone, MessageSquare } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ClayCard } from '../../components/ui/ClayCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { mockBookings } from '../../data/mockData';

export function AgentBookingsPage() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');
  const bookings = mockBookings.filter(b => filter === 'all' || b.status === filter);

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;

  const handleStatusChange = (id: string, status: string) => {
    console.log('Status change:', id, status);
  };

  return (
    <AppLayout role="agent" title="Bookings" subtitle="Manage your bookings">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search bookings..."
            className="clay-input w-full pl-11"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {(['all', 'pending', 'confirmed', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-pill text-sm font-medium transition-all ${
              filter === f
                ? 'bg-burnt-brown text-white'
                : 'bg-white text-text-secondary hover:bg-clay-border-light'
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
                <td>
                  <p className="font-medium text-text-primary">{booking.listingTitle}</p>
                </td>
                <td>
                  <p className="font-medium text-text-primary">{booking.userName}</p>
                  <p className="text-xs text-text-tertiary">{booking.userPhone}</p>
                </td>
                <td className="text-text-secondary">
                  {new Date(booking.moveInDate).toLocaleDateString()}
                </td>
                <td className="font-semibold text-text-primary">
                  {formatCurrency(booking.price)}
                </td>
                <td>
                  <StatusBadge
                    variant={
                      booking.status === 'confirmed' ? 'success' :
                      booking.status === 'pending' ? 'warning' :
                      booking.status === 'cancelled' ? 'error' : 'default'
                    }
                  >
                    {booking.status}
                  </StatusBadge>
                </td>
                <td>
                  <div className="flex gap-1">
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(booking.id, 'confirmed')}
                          className="p-2 rounded-clay-sm bg-status-success/10 text-status-success hover:bg-status-success/20"
                          title="Confirm"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(booking.id, 'cancelled')}
                          className="p-2 rounded-clay-sm bg-status-error/10 text-status-error hover:bg-status-error/20"
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      className="p-2 rounded-clay-sm bg-status-info/10 text-status-info hover:bg-status-info/20"
                      title="Contact"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
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