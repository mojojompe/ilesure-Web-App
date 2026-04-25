import { Building2, Users, Calendar, DollarSign, TrendingUp, Eye, Heart, MessageCircle } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { KpiCard } from '../../components/ui/KpiCard';
import { ClayCard } from '../../components/ui/ClayCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { mockAgentDashboard, mockListings, mockBookings } from '../../data/mockData';

export function AgentDashboardPage() {
  const overview = mockAgentDashboard;
  const listings = mockListings.slice(0, 3);
  const bookings = mockBookings.slice(0, 3);

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;

  return (
    <AppLayout role="agent" title="Dashboard" subtitle="Welcome back, James">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          title="Total Listings"
          value={overview.totalListings}
          icon={Building2}
          variant={1}
        />
        <KpiCard
          title="Active Listings"
          value={overview.activeListings}
          icon={Building2}
          variant={2}
        />
        <KpiCard
          title="Total Bookings"
          value={overview.totalBookings}
          icon={Calendar}
          variant={2}
        />
        <KpiCard
          title="Monthly Revenue"
          value={formatCurrency(overview.monthlyRevenue)}
          change="+12%"
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
            {listings.map(listing => (
              <div key={listing.id} className="flex items-center gap-3 p-3 rounded-clay-sm bg-clay-border-light">
                <div className="w-12 h-12 rounded-clay-sm bg-burnt-brown-pale overflow-hidden flex-shrink-0">
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {listing.title}
                  </p>
                  <p className="text-xs text-text-tertiary">
                    {listing.location.city}
                  </p>
                </div>
                <StatusBadge variant={listing.status === 'active' ? 'success' : 'warning'}>
                  {listing.status}
                </StatusBadge>
              </div>
            ))}
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
            {bookings.map(booking => (
              <div key={booking.id} className="p-3 rounded-clay-sm bg-clay-border-light">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {booking.listingTitle}
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
            ))}
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
                <p className="text-lg font-bold text-text-primary">6,439</p>
                <p className="text-xs text-text-tertiary">Total Views</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-clay-sm bg-status-success/10 flex items-center justify-center">
                <Heart className="w-5 h-5 text-status-success" />
              </div>
              <div>
                <p className="text-lg font-bold text-text-primary">807</p>
                <p className="text-xs text-text-tertiary">Total Saves</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-clay-sm bg-status-info/10 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-status-info" />
              </div>
              <div>
                <p className="text-lg font-bold text-text-primary">174</p>
                <p className="text-xs text-text-tertiary">Inquiries</p>
              </div>
            </div>
          </div>
        </ClayCard>
      </div>
    </AppLayout>
  );
}