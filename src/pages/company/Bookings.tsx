import { useState, useEffect } from 'react';
import { Search, Check, X, Loader } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ClayCard } from '../../components/ui/ClayCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { companyApi } from '../../api/company';

export function CompanyBookingsPage() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
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

      const response = await companyApi.getBookings(params);
      if (response.success) {
        setBookings(response.bookings || []);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;

  const handleStatusChange = async (id: string, status: string) => {
    setUpdating(true);
    try {
      await companyApi.updateBookingStatus(id, status);
      fetchBookings();
      setShowDetailModal(false);
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
    <AppLayout role="company" title="Bookings" subtitle="All company bookings">
      <div className="flex gap-2 mb-6">
        {(['all', 'pending', 'confirmed', 'completed'] as const).map(f => (
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
                  <th>Move-in</th>
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
                      <p className="text-sm text-text-primary">{booking.userName}</p>
                      <p className="text-xs text-text-tertiary">{booking.userPhone}</p>
                    </td>
                    <td>
                      <p className="font-bold text-mustard">{formatCurrency(booking.price)}</p>
                    </td>
                    <td>
                      <p className="text-sm text-text-secondary">{booking.moveInDate}</p>
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
                      <Button variant="secondary" size="sm" onClick={() => handleView(booking)}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
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
        {selectedBooking && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-text-primary">{selectedBooking.listingTitle}</p>
              <StatusBadge variant={selectedBooking.status === 'confirmed' ? 'success' : 'warning'}>
                {selectedBooking.status}
              </StatusBadge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-text-tertiary">Tenant</p>
                <p className="text-sm font-medium text-text-primary">{selectedBooking.userName}</p>
                <p className="text-xs text-text-tertiary">{selectedBooking.userPhone}</p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary">Price</p>
                <p className="text-lg font-bold text-mustard">{formatCurrency(selectedBooking.price)}</p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary">Move-in Date</p>
                <p className="text-sm text-text-primary">{selectedBooking.moveInDate}</p>
              </div>
            </div>
            {selectedBooking.status === 'pending' && (
              <div className="flex gap-2 pt-4">
                <Button variant="success" className="flex-1" onClick={() => handleStatusChange(selectedBooking.id, 'confirmed')} loading={updating}>
                  <Check className="w-4 h-4 mr-2" /> Confirm
                </Button>
                <Button variant="danger" className="flex-1" onClick={() => handleStatusChange(selectedBooking.id, 'cancelled')} loading={updating}>
                  <X className="w-4 h-4 mr-2" /> Cancel
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}