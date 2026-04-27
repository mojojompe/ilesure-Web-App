import { useState, useEffect } from 'react';
import { Eye, Heart, MessageCircle, TrendingUp, DollarSign, Loader } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { AppLayout } from '../../components/layout/AppLayout';
import { KpiCard } from '../../components/ui/KpiCard';
import { ClayCard } from '../../components/ui/ClayCard';
import { companyApi } from '../../api/company';

export function CompanyAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await companyApi.getDashboard();
      if (response.success && response.data) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `₦${(amount || 0).toLocaleString()}`;

  if (loading) {
    return (
      <AppLayout role="company" title="Analytics" subtitle="Company performance">
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-mustard" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="company" title="Analytics" subtitle="Company performance">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard title="Total Views" value={analytics?.overview?.totalViews?.toLocaleString() || '0'} icon={Eye} variant={1} />
        <KpiCard title="Total Saves" value={analytics?.overview?.totalSaves?.toLocaleString() || '0'} icon={Heart} variant={2} />
        <KpiCard title="Inquiries" value={analytics?.overview?.totalInquiries || '0'} icon={MessageCircle} variant={2} />
        <KpiCard title="Revenue" value={formatCurrency(analytics?.overview?.monthlyRevenue || 0)} icon={DollarSign} variant={1} />
      </div>

      <ClayCard className="p-5 mb-6">
        <h2 className="font-bold text-text-primary mb-4">Revenue Trend</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics?.revenueTrend || []}>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#A07860" />
              <YAxis tick={{ fontSize: 12 }} stroke="#A07860" />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Line type="monotone" dataKey="value" stroke="#D4821A" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ClayCard>

      <ClayCard className="p-5">
        <h2 className="font-bold text-text-primary mb-4">Top Performing Listings</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics?.topListings || []} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="#A07860" />
              <YAxis dataKey="title" type="category" tick={{ fontSize: 12 }} stroke="#A07860" width={150} />
              <Tooltip />
              <Bar dataKey="views" fill="#D4821A" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ClayCard>
    </AppLayout>
  );
}