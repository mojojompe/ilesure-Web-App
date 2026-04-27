import { useState, useEffect } from 'react';
import { Eye, Heart, MessageCircle, TrendingUp, Loader } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { AppLayout } from '../../components/layout/AppLayout';
import { KpiCard } from '../../components/ui/KpiCard';
import { ClayCard } from '../../components/ui/ClayCard';
import { analyticsApi } from '../../api/analytics';

export function AgentAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await analyticsApi.getAgentAnalytics();
      if (response.success && response.data) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout role="agent" title="Analytics" subtitle="Track your performance">
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-mustard" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="agent" title="Analytics" subtitle="Track your performance">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          title="Total Views"
          value={analytics?.totalViews?.toLocaleString() || '0'}
          change={analytics?.changes?.views}
          icon={Eye}
          variant={1}
        />
        <KpiCard
          title="Total Saves"
          value={analytics?.totalSaves?.toLocaleString() || '0'}
          change={analytics?.changes?.saves}
          icon={Heart}
          variant={2}
        />
        <KpiCard
          title="Inquiries"
          value={analytics?.totalInquiries || '0'}
          icon={MessageCircle}
          variant={2}
        />
        <KpiCard
          title="Conversion Rate"
          value={`${analytics?.conversionRate || 0}%`}
          icon={TrendingUp}
          variant={1}
        />
      </div>

      <ClayCard className="p-5 mb-6">
        <h2 className="font-bold text-text-primary mb-4">Views Trend</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics?.viewsTrend || []}>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#A07860" />
              <YAxis tick={{ fontSize: 12 }} stroke="#A07860" />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#D4821A" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ClayCard>

      <ClayCard className="p-5">
        <h2 className="font-bold text-text-primary mb-4">Top Performing Listings</h2>
        <div className="space-y-3">
          {(analytics?.topListings || []).length > 0 ? (
            analytics.topListings.map((listing: any, index: number) => (
              <div key={listing.id} className="flex items-center gap-3 p-3 rounded-clay-sm bg-clay-border-light">
                <span className="w-6 h-6 rounded-full bg-mustard text-white text-sm font-bold flex items-center justify-center">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-text-primary">{listing.title}</p>
                </div>
                <div className="flex items-center gap-1 text-mustard">
                  <Eye className="w-4 h-4" />
                  <span className="font-semibold">{listing.views?.toLocaleString()}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-text-tertiary text-sm">No listings yet</p>
          )}
        </div>
      </ClayCard>
    </AppLayout>
  );
}