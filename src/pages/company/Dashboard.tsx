import { useState, useEffect } from 'react';
import { Building2, Users, Calendar, DollarSign, Loader } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { KpiCard } from '../../components/ui/KpiCard';
import { ClayCard } from '../../components/ui/ClayCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { companyApi } from '../../api/company';

export function CompanyDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await companyApi.getDashboard();
      if (response.success && response.data) {
        setOverview(response.data.overview);
      }

      const listingsRes = await companyApi.getListings({ limit: 3 });
      if (listingsRes.success && listingsRes.data) {
        setListings(listingsRes.data.listings || []);
      }

      const agentsRes = await companyApi.getAgents({ limit: 3 });
      if (agentsRes.success && agentsRes.data) {
        setAgents(agentsRes.data.agents || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;

  if (loading) {
    return (
      <AppLayout role="company" title="Dashboard" subtitle="Welcome back">
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-mustard" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="company" title="Dashboard" subtitle="Welcome back">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          title="Total Listings"
          value={overview?.totalListings || 0}
          icon={Building2}
          variant={1}
        />
        <KpiCard
          title="Total Agents"
          value={overview?.totalAgents || 0}
          icon={Users}
          variant={2}
        />
        <KpiCard
          title="Active Bookings"
          value={overview?.activeBookings || 0}
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
            <a href="/company/listings" className="text-sm text-mustard hover:underline">
              View all
            </a>
          </div>
          <div className="space-y-3 overflow-x-auto">
            {listings.length > 0 ? (
              listings.map(listing => (
                <div key={listing.id} className="flex items-center gap-3 p-3 rounded-clay-sm bg-clay-border-light">
                  <div className="w-12 h-12 rounded-clay-sm bg-burnt-brown-pale overflow-hidden flex-shrink-0">
                    {listing.images?.[0] && (
                      <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{listing.title}</p>
                    <p className="text-xs text-text-tertiary">{listing.city}</p>
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
            <h2 className="font-bold text-text-primary">Agents</h2>
            <a href="/company/agents" className="text-sm text-mustard hover:underline">
              View all
            </a>
          </div>
          <div className="space-y-3 overflow-x-auto">
            {agents.length > 0 ? (
              agents.map(agent => (
                <div key={agent.id} className="flex items-center gap-3 p-3 rounded-clay-sm bg-clay-border-light">
                  <div className="w-10 h-10 rounded-full bg-mustard-light flex items-center justify-center text-burnt-brown-dark font-bold">
                    {agent.fullName?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">{agent.fullName}</p>
                    <p className="text-xs text-text-tertiary">{agent.listingsCount} listings</p>
                  </div>
                  <StatusBadge variant={agent.status === 'active' ? 'success' : 'default'}>
                    {agent.status}
                  </StatusBadge>
                </div>
              ))
            ) : (
              <p className="text-text-tertiary text-sm">No agents yet</p>
            )}
          </div>
        </ClayCard>
      </div>

      <div className="mt-6">
        <ClayCard className="p-5">
          <h2 className="font-bold text-text-primary mb-4">Current Plan</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-text-tertiary">Plan</p>
              <p className="font-semibold text-text-primary capitalize">{overview?.plan?.name || 'Free'}</p>
            </div>
            <div>
              <p className="text-xs text-text-tertiary">Billing</p>
              <p className="font-semibold text-text-primary capitalize">{overview?.plan?.billingCycle || 'monthly'}</p>
            </div>
            <div>
              <p className="text-xs text-text-tertiary">Slots Used</p>
              <p className="font-semibold text-text-primary">
                {overview?.plan?.slotUsage?.used || 0} / {overview?.plan?.slotUsage?.total || 0}
              </p>
            </div>
          </div>
          {overview?.plan?.slotUsage && (
            <div className="mt-4 h-2 bg-clay-border-light rounded-full overflow-hidden">
              <div className="h-full bg-mustard rounded-full" style={{ width: `${overview.plan.slotUsage.percentage}%` }} />
            </div>
          )}
        </ClayCard>
      </div>
    </AppLayout>
  );
}