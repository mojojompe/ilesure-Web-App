import { useState, useEffect } from 'react';
import { Save, Loader } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ClayCard } from '../../components/ui/ClayCard';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { companyApi } from '../../api/company';
import { userApi } from '../../api/user';

export function CompanySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [notifications, setNotifications] = useState({
    newBooking: true,
    listingInquiry: true,
    paymentReceived: true,
    listingView: true,
    systemUpdates: true,
  });
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [companyRes, subRes] = await Promise.all([
        companyApi.getProfile(),
        companyApi.getSubscription(),
      ]);

      if (companyRes.success && companyRes.company) {
        setCompany(companyRes.company);
        setFormData({
          name: companyRes.company.name || '',
          phone: companyRes.company.phone || '',
          address: companyRes.company.address || '',
          description: companyRes.company.description || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await companyApi.updateProfile(formData);
      if (response.success) {
        alert('Company saved successfully!');
      } else {
        alert(response.message || 'Failed to save');
      }
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationChange = async (key: string, value: boolean) => {
    const newSettings = { ...notifications, [key]: value };
    setNotifications(newSettings);
    await userApi.updateNotificationSettings(newSettings);
  };

  if (loading) {
    return (
      <AppLayout role="company" title="Settings" subtitle="Manage your company">
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-mustard" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="company" title="Settings" subtitle="Manage your company">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ClayCard className="p-5">
            <h2 className="font-bold text-text-primary mb-4">Company Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Company Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="clay-input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Email</label>
                <input type="email" defaultValue={company?.email} className="clay-input w-full" disabled />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="clay-input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="clay-input w-full"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="clay-input w-full h-24 resize-none"
                />
              </div>
            </div>
            <Button variant="primary" className="mt-4" loading={saving} onClick={handleSave}>
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
                    onChange={(e) => handleNotificationChange(item.key, e.target.checked)}
                    className="w-5 h-5 rounded border-clay-border accent-mustard"
                  />
                </label>
              ))}
            </div>
          </ClayCard>
        </div>

        <div className="space-y-6">
          <ClayCard className="p-5">
            <h2 className="font-bold text-text-primary mb-4">Current Plan</h2>
            <div className="text-center p-4 rounded-clay-sm bg-mustard-pale">
              <p className="text-lg font-bold text-text-primary">Premium</p>
              <p className="text-sm text-text-tertiary capitalize">monthly</p>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-tertiary">Agent Slots:</span>
                <span className="font-medium">50</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-tertiary">Listings:</span>
                <span className="font-medium">Unlimited</span>
              </div>
            </div>
            <a href="/tiers" className="block btn-secondary text-center mt-4">
              Upgrade Plan
            </a>
          </ClayCard>
        </div>
      </div>
    </AppLayout>
  );
}