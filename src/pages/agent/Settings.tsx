import { useState } from 'react';
import { User, Mail, Phone, Building2, Save } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ClayCard } from '../../components/ui/ClayCard';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { mockAgent, mockNotificationSettings } from '../../data/mockData';

export function AgentSettingsPage() {
  const agent = mockAgent;
  const [notifications, setNotifications] = useState(mockNotificationSettings);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  return (
    <AppLayout role="agent" title="Settings" subtitle="Manage your account">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ClayCard className="p-5">
            <h2 className="font-bold text-text-primary mb-4">Profile Information</h2>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-mustard-light flex items-center justify-center text-burnt-brown-dark text-2xl font-bold">
                {agent.fullName.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-text-primary">{agent.fullName}</p>
                <StatusBadge variant={agent.verificationStatus === 'verified' ? 'success' : 'warning'}>
                  {agent.verificationStatus}
                </StatusBadge>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input type="text" defaultValue={agent.fullName} className="clay-input w-full" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Email
                </label>
                <input type="email" defaultValue={agent.email} className="clay-input w-full" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Phone
                </label>
                <input type="tel" defaultValue={agent.phone} className="clay-input w-full" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  WhatsApp
                </label>
                <input type="tel" defaultValue={agent.whatsapp} className="clay-input w-full" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Bio
                </label>
                <textarea defaultValue={agent.bio} className="clay-input w-full h-24 resize-none" />
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
                { key: 'listingView', label: 'Listing Views' },
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
            <h2 className="font-bold text-text-primary mb-4">Current Plan</h2>
            <div className="text-center p-4 rounded-clay-sm bg-mustard-pale">
              <p className="text-lg font-bold text-text-primary">{agent.tier.name}</p>
              <p className="text-sm text-text-tertiary capitalize">{agent.tier.billingCycle}</p>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-tertiary">Max Listings:</span>
                <span className="font-medium">{agent.tier.limits.maxListings}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-tertiary">Featured:</span>
                <span className="font-medium">{agent.tier.limits.featuredListings}</span>
              </div>
            </div>
            <a href="/tiers" className="block btn-secondary text-center mt-4">
              Upgrade Plan
            </a>
          </ClayCard>

          <ClayCard className="p-5">
            <h2 className="font-bold text-text-primary mb-4">Company</h2>
            {agent.company ? (
              <div>
                <p className="font-medium text-text-primary">{agent.company.name}</p>
                <StatusBadge variant={agent.company.verified ? 'success' : 'default'} className="mt-2">
                  {agent.company.verified ? 'Verified' : 'Unverified'}
                </StatusBadge>
              </div>
            ) : (
              <p className="text-sm text-text-tertiary">Not affiliated with any company</p>
            )}
          </ClayCard>
        </div>
      </div>
    </AppLayout>
  );
}