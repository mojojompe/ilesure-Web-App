import { Eye, Heart, MessageCircle, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { AppLayout } from '../../components/layout/AppLayout';
import { KpiCard } from '../../components/ui/KpiCard';
import { ClayCard } from '../../components/ui/ClayCard';
import { mockCompanyAnalytics, mockListings } from '../../data/mockData';

export function CompanyAnalyticsPage() {
  const analytics = mockCompanyAnalytics;

  return (
    <AppLayout role="company" title="Analytics" subtitle="Company performance">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard title="Total Views" value={analytics.totalViews.toLocaleString()} change={analytics.changes.views} icon={Eye} variant={1} />
        <KpiCard title="Total Saves" value={analytics.totalSaves.toLocaleString()} change={analytics.changes.saves} icon={Heart} variant={2} />
        <KpiCard title="Inquiries" value={analytics.totalInquiries} change="+23%" icon={MessageCircle} variant={2} />
        <KpiCard title="Bookings" value={analytics.totalBookings} change="+15%" icon={TrendingUp} variant={1} />
      </div>

      <ClayCard className="p-5 mb-6">
        <h2 className="font-bold text-text-primary mb-4">Views Trend</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={[
              { date: '02/19', value: 450 }, { date: '02/20', value: 520 }, { date: '02/21', value: 480 },
              { date: '02/22', value: 610 }, { date: '02/23', value: 720 }, { date: '02/24', value: 680 }, { date: '02/25', value: 850 },
            ]}>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#A07860" />
              <YAxis tick={{ fontSize: 12 }} stroke="#A07860" />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#D4821A" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ClayCard>

      <ClayCard className="p-5">
        <h2 className="font-bold text-text-primary mb-4">Top Listings</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockListings.slice(0, 5)} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="#A07860" />
              <YAxis type="category" dataKey="title" width={150} tick={{ fontSize: 11 }} stroke="#A07860" />
              <Tooltip />
              <Bar dataKey="views" fill="#D4821A" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ClayCard>
    </AppLayout>
  );
}