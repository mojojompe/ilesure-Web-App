import { useState } from 'react';
import { Save } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ClayCard } from '../../components/ui/ClayCard';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { mockCompany, mockNotificationSettings, mockCompanyPlan } from '../../data/mockData';

export function CompanySettingsPage() {
  const company = mockCompany;
  const [notifications, setNotifications] = useState(mockNotificationSettings);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  return (
    <AppLayout role="company" title="Settings" subtitle="Manage your company">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ClayCard className="p-5">
            <h2 className="font-bold text-text-primary mb-4">Company Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Company Name</label>
                <input type="text" defaultValue={company.name} className="clay-input w-full" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Trading Name</label>
                <input type="text" defaultValue={company.tradingName} className="clay-input w-full" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Email</label>
                <input type="email" defaultValue={company.email} className="clay-input w-full" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Phone</label>
                <input type="tel" defaultValue={company.phone} className="clay-input w-full" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Address</label>
                <input type="text" defaultValue={company.address} className="clay-input w-full" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Description</label>
                <textarea defaultValue={company.description} className="clay-input w-full h-24 resize-none" />
              </div>
            </div>
            <Button variant="primary" className="mt-4" loading={loading} onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" /> Save Changes
            </Button>
          </ClayCard>

          <ClayCard className="p-5">
            <h2 className="font-bold text-text-primary mb-4">Notification Preferences</h2>
            <div className="space-y-3">
              {[
                { key: 'newBooking', label: 'New Booking' },
                { key: 'listingInquiry', label: 'Listing Inquiry' },
                { key: 'paymentReceived', label: 'Payment Received' },
                { key: 'systemUpdates', label: 'System Updates' },
              ].map(item => (
                <label key={item.key} className="flex items-center justify-between p-3 rounded-clay-sm bg-clay-border-light cursor-pointer">
                  <span className="text-sm text-text-primary">{item.label}</span>
                  <input
                    type="checkbox"
                    checked={notifications[item.key as keyof typeof notifications]}
                    onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                    className="w-5 h-5 rounded border-clay-border accent-mustard"
                  />
                </label>
              ))}
            </div>
            <Button variant="primary" className="mt-4" loading={loading} onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" /> Save Preferences
            </Button>
          </ClayCard>
        </div>

        <div className="space-y-6">
          <ClayCard className="p-5">
            <h2 className="font-bold text-text-primary mb-4">Verification Status</h2>
            <StatusBadge variant={company.status === 'verified' ? 'success' : company.status === 'pending' ? 'warning' : 'error'}>
              {company.status}
            </StatusBadge>
            <p className="text-sm text-text-tertiary mt-2">CAC: {company.cacNumber}</p>
          </ClayCard>

          <ClayCard className="p-5">
            <h2 className="font-bold text-text-primary mb-4">Current Plan</h2>
            <div className="p-4 rounded-clay-sm bg-mustard-pale text-center">
              <p className="text-lg font-bold text-text-primary">{mockCompanyPlan.name}</p>
              <p className="text-sm text-text-tertiary capitalize">{mockCompanyPlan.billingCycle}</p>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-tertiary">Agent Slots:</span>
                <span className="font-medium">{mockCompanyPlan.slotUsage.used} / {mockCompanyPlan.slotUsage.total}</span>
              </div>
            </div>
            <a href="/tiers" className="block btn-secondary text-center mt-4">Upgrade Plan</a>
          </ClayCard>
        </div>
      </div>
    </AppLayout>
  );
}