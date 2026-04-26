import { useState, useEffect } from 'react';
import { Building2, Calendar, DollarSign, Eye, Heart, MessageCircle, Loader } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { KpiCard } from '../../components/ui/KpiCard';
import { ClayCard } from '../../components/ui/ClayCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { agentApi } from '../../api/agent';

const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;

export function AgentDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await agentApi.getDashboard();
      if (response.success && response.data) {
        setOverview(response.data.overview);
        setListings(response.data.recentListings || []);
        setBookings(response.data.recentBookings || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout role="agent" title="Dashboard" subtitle="Welcome back, James">
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-mustard" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="agent" title="Dashboard" subtitle="Welcome back" onReload={fetchDashboard}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          title="Total Listings"
          value={overview?.totalListings || 0}
          icon={Building2}
          variant={1}
        />
        <KpiCard
          title="Active Listings"
          value={overview?.activeListings || 0}
          icon={Building2}
          variant={2}
        />
        <KpiCard
          title="Total Bookings"
          value={overview?.totalBookings || 0}
          icon={Calendar}
          variant={2}
        />
        <KpiCard
          title="Monthly Revenue"
          value={formatCurrency(overview?.monthlyRevenue || 0)}
          change={overview?.trends?.revenue ? `${overview.trends.revenue}%` : undefined}
          icon={DollarSign}
          variant={1}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <ClayCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-text-primary">Recent Listings</h2>
            <a href="/agent/listings" className="text-sm text-mustard hover:underline">
              View all
            </a>
          </div>
          <div className="space-y-3 overflow-x-auto">
            {listings.length > 0 ? (
              listings.map((listing: any) => (
                <div key={listing.id} className="flex items-center gap-3 p-3 rounded-clay-sm bg-clay-border-light">
                  <div className="w-12 h-12 rounded-clay-sm bg-burnt-brown-pale overflow-hidden flex-shrink-0">
                    {listing.images?.[0] && (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {listing.title}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      {listing.location?.city || listing.city}
                    </p>
                  </div>
                  <StatusBadge variant={listing.status === 'active' ? 'success' : 'warning'}>
                    {listing.status}
                  </StatusBadge>
                </div>
              ))
            ) : (
              <p className="text-text-tertiary text-sm">No listings yet</p>
            )}
          </div>
        </ClayCard>

        <ClayCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-text-primary">Recent Bookings</h2>
            <a href="/agent/bookings" className="text-sm text-mustard hover:underline">
              View all
            </a>
          </div>
          <div className="space-y-3 overflow-x-auto">
            {bookings.length > 0 ? (
              bookings.map((booking: any) => (
                <div key={booking.id} className="p-3 rounded-clay-sm bg-clay-border-light">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {booking.listingTitle || booking.listing?.title}
                    </p>
                    <StatusBadge
                      variant={
                        booking.status === 'confirmed' ? 'success' :
                        booking.status === 'pending' ? 'warning' :
                        booking.status === 'cancelled' ? 'error' : 'default'
                      }
                    >
                      {booking.status}
                    </StatusBadge>
                  </div>
                  <p className="text-xs text-text-tertiary mt-1">
                    {booking.userName} • {formatCurrency(booking.price)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-text-tertiary text-sm">No bookings yet</p>
            )}
          </div>
        </ClayCard>
      </div>

      <div className="mt-6">
        <ClayCard className="p-5">
          <h2 className="font-bold text-text-primary mb-4">Listing Performance</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-clay-sm bg-mustard-pale flex items-center justify-center">
                <Eye className="w-5 h-5 text-mustard" />
              </div>
              <div>
                <p className="text-lg font-bold text-text-primary">{(overview?.totalViews || 0).toLocaleString()}</p>
                <p className="text-xs text-text-tertiary">Total Views</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-clay-sm bg-status-success/10 flex items-center justify-center">
                <Heart className="w-5 h-5 text-status-success" />
              </div>
              <div>
                <p className="text-lg font-bold text-text-primary">{(overview?.totalSaves || 0).toLocaleString()}</p>
                <p className="text-xs text-text-tertiary">Total Saves</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-clay-sm bg-status-info/10 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-status-info" />
              </div>
              <div>
                <p className="text-lg font-bold text-text-primary">{overview?.totalInquiries || 0}</p>
                <p className="text-xs text-text-tertiary">Inquiries</p>
              </div>
            </div>
          </div>
        </ClayCard>
      </div>
    </AppLayout>
  );
}