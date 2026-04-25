import { Building2, Users, Calendar, DollarSign, TrendingUp, Eye, Heart, MessageCircle } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { KpiCard } from '../../components/ui/KpiCard';
import { ClayCard } from '../../components/ui/ClayCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { mockCompanyDashboard, mockListings, mockBookings, mockCompanyAgents } from '../../data/mockData';

export function CompanyDashboardPage() {
  const overview = mockCompanyDashboard;
  const listings = mockListings.slice(0, 3);
  const agents = mockCompanyAgents.slice(0, 3);

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;

  return (
    <AppLayout role="company" title="Dashboard" subtitle="Welcome back, Property Masters Ltd">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          title="Total Listings"
          value={overview.totalListings}
          icon={Building2}
          variant={1}
        />
        <KpiCard
          title="Total Agents"
          value={overview.totalAgents}
          icon={Users}
          variant={2}
        />
        <KpiCard
          title="Active Bookings"
          value={overview.activeBookings}
          icon={Calendar}
          variant={2}
        />
        <KpiCard
          title="Monthly Revenue"
          value={formatCurrency(overview.monthlyRevenue)}
          change="+15%"
          icon={DollarSign}
          variant={1}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <ClayCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-text-primary">Recent Listings</h2>
            <a href="/company/listings" className="text-sm text-mustard hover:underline">
              View all
            </a>
          </div>
          <div className="space-y-3 overflow-x-auto">
            {listings.map(listing => (
              <div key={listing.id} className="flex items-center gap-3 p-3 rounded-clay-sm bg-clay-border-light">
                <div className="w-12 h-12 rounded-clay-sm bg-burnt-brown-pale overflow-hidden flex-shrink-0">
                  <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{listing.title}</p>
                  <p className="text-xs text-text-tertiary">{listing.location.city}</p>
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
            <h2 className="font-bold text-text-primary">Agents</h2>
            <a href="/company/agents" className="text-sm text-mustard hover:underline">
              View all
            </a>
          </div>
          <div className="space-y-3 overflow-x-auto">
            {agents.map(agent => (
              <div key={agent.id} className="flex items-center gap-3 p-3 rounded-clay-sm bg-clay-border-light">
                <div className="w-10 h-10 rounded-full bg-mustard-light flex items-center justify-center text-burnt-brown-dark font-bold">
                  {agent.fullName.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">{agent.fullName}</p>
                  <p className="text-xs text-text-tertiary">{agent.listingsCount} listings</p>
                </div>
                <StatusBadge variant={agent.status === 'active' ? 'success' : 'default'}>
                  {agent.status}
                </StatusBadge>
              </div>
            ))}
          </div>
        </ClayCard>
      </div>

      <div className="mt-6">
        <ClayCard className="p-5">
          <h2 className="font-bold text-text-primary mb-4">Current Plan</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-text-tertiary">Plan</p>
              <p className="font-semibold text-text-primary capitalize">{overview.plan.name}</p>
            </div>
            <div>
              <p className="text-xs text-text-tertiary">Billing</p>
              <p className="font-semibold text-text-primary capitalize">{overview.plan.billingCycle}</p>
            </div>
            <div>
              <p className="text-xs text-text-tertiary">Slots Used</p>
              <p className="font-semibold text-text-primary">{overview.plan.slotUsage.used} / {overview.plan.slotUsage.total}</p>
            </div>
          </div>
          <div className="mt-4 h-2 bg-clay-border-light rounded-full overflow-hidden">
            <div className="h-full bg-mustard rounded-full" style={{ width: `${overview.plan.slotUsage.percentage}%` }} />
          </div>
        </ClayCard>
      </div>
    </AppLayout>
  );
}