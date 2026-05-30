import { useState, useEffect } from 'react';
import { Search, Check, X, Loader } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ClayCard } from '../../components/ui/ClayCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { agentApi } from '../../api/agent';

export function AgentBookingsPage() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params: { status?: string } = {};
      if (filter !== 'all') params.status = filter;

      const response = await agentApi.getBookings(params);
      if (response.success && response.data) {
        setBookings(response.data.bookings || []);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;

  const handleStatusChange = async (booking: any, newStatus: string) => {
    setUpdating(true);
    try {
      const bookingId = booking._id || booking.id;
      const listingId = booking.listingId?._id || booking.listingId;
      const response = await agentApi.updateBookingStatus(bookingId, newStatus, listingId);
      if (response.success) {
        fetchBookings();
        setShowDetailModal(false);
      } else {
        console.error('Failed to update booking:', response.error?.message);
      }
    } catch (error) {
      console.error('Failed to update booking:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleView = (booking: any) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
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
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="w-8 h-8 animate-spin text-mustard" />
          </div>
        ) : bookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="clay-table">
              <thead>
                <tr>
                  <th>Listing</th>
                  <th>Tenant</th>
                  <th>Price</th>
                  <th>Move-in Date</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(booking => {
                  const bookingId = booking._id || booking.id;
                  const listingTitle = booking.listingId?.title || booking.listingTitle || '—';
                  const tenantName = booking.userId?.fullName || booking.userName || '—';
                  const tenantPhone = booking.userId?.phone || booking.userPhone || '—';
                  const rent = booking.listingId?.rentAnnual || booking.price || 0;
                  const moveIn = booking.moveInDate
                    ? new Date(booking.moveInDate).toLocaleDateString()
                    : '—';
                  return (
                    <tr key={bookingId}>
                      <td>
                        <p className="font-medium text-text-primary">{listingTitle}</p>
                      </td>
                      <td>
                        <div>
                          <p className="text-sm text-text-primary">{tenantName}</p>
                          <p className="text-xs text-text-tertiary">{tenantPhone}</p>
                        </div>
                      </td>
                      <td>
                        <p className="font-bold text-mustard">{formatCurrency(rent)}</p>
                      </td>
                      <td>
                        <p className="text-sm text-text-secondary">{moveIn}</p>
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
                        <StatusBadge
                          variant={
                            booking.paymentStatus === 'paid' ? 'success' :
                            booking.paymentStatus === 'pending' ? 'warning' : 'error'
                          }
                        >
                          {booking.paymentStatus || 'unpaid'}
                        </StatusBadge>
                      </td>
                      <td>
                        <Button variant="secondary" size="sm" onClick={() => handleView(booking)}>
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-text-tertiary">No bookings found</p>
          </div>
        )}
      </ClayCard>

      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Booking Details" size="md">
            {selectedBooking && (() => {
              const listingTitle = selectedBooking.listingId?.title || selectedBooking.listingTitle || '—';
              const listingArea = selectedBooking.listingId?.areaCluster || selectedBooking.listing?.address || '—';
              const tenantName = selectedBooking.userId?.fullName || selectedBooking.userName || '—';
              const tenantPhone = selectedBooking.userId?.phone || selectedBooking.userPhone || '—';
              const rent = selectedBooking.listingId?.rentAnnual || selectedBooking.price || 0;
              const moveIn = selectedBooking.moveInDate
                ? new Date(selectedBooking.moveInDate).toLocaleDateString()
                : '—';
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-text-primary">{listingTitle}</p>
                      <p className="text-sm text-text-tertiary">{listingArea}</p>
                    </div>
                    <StatusBadge
                      variant={
                        selectedBooking.status === 'confirmed' ? 'success' :
                        selectedBooking.status === 'pending' ? 'warning' : 'default'
                      }
                    >
                      {selectedBooking.status}
                    </StatusBadge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-text-tertiary">Tenant</p>
                      <p className="text-sm font-medium text-text-primary">{tenantName}</p>
                      <p className="text-xs text-text-tertiary">{tenantPhone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-tertiary">Annual Rent</p>
                      <p className="text-lg font-bold text-mustard">{formatCurrency(rent)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-tertiary">Move-in Date</p>
                      <p className="text-sm text-text-primary">{moveIn}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-tertiary">Duration</p>
                      <p className="text-sm text-text-primary">{selectedBooking.duration || '—'}</p>
                    </div>
                    {selectedBooking.message && (
                      <div className="col-span-2">
                        <p className="text-xs text-text-tertiary">Message</p>
                        <p className="text-sm text-text-primary">{selectedBooking.message}</p>
                      </div>
                    )}
                  </div>

                  {selectedBooking.status === 'pending' && (
                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="success"
                        className="flex-1"
                        onClick={() => handleStatusChange(selectedBooking, 'confirmed')}
                        loading={updating}
                      >
                        <Check className="w-4 h-4 mr-2" /> Confirm
                      </Button>
                      <Button
                        variant="danger"
                        className="flex-1"
                        onClick={() => handleStatusChange(selectedBooking, 'rejected')}
                        loading={updating}
                      >
                        <X className="w-4 h-4 mr-2" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              );
            })()}
      </Modal>
    </AppLayout>
  );
}