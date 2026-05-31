import { useState, useEffect } from 'react';
import { Save, Loader } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ClayCard } from '../../components/ui/ClayCard';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { userApi } from '../../api/user';

export function AgentSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [user, setUser] = useState<any>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  const [notifications, setNotifications] = useState({
    newBooking: true,
    listingInquiry: true,
    paymentReceived: true,
    listingView: true,
    systemUpdates: true,
  });
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    whatsapp: '',
    bio: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await userApi.getProfile();
      if (response.success && response.data) {
        setUser(response.data);
        setFormData({
          fullName: response.data.fullName || '',
          phone: response.data.phone || '',
          whatsapp: response.data.whatsapp || '',
          bio: response.data.bio || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await userApi.updateProfile(formData);
      if (response.success) {
        showToast('Profile saved successfully!');
      } else {
        showToast(response.error?.message || 'Failed to save profile', 'error');
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationChange = async (key: string, value: boolean) => {
    const newSettings = { ...notifications, [key]: value };
    setNotifications(newSettings);
    try {
      await userApi.updateNotificationSettings(newSettings);
    } catch (error) {
      console.error('Failed to update notifications:', error);
    }
  };

  if (loading) {
    return (
      <AppLayout role="agent" title="Settings" subtitle="Manage your account">
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-mustard" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="agent" title="Settings" subtitle="Manage your account">
      {/* Toast notification overlay */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-clay shadow-clay-lg text-sm font-semibold animate-fade-in ${
          toast.type === 'success' ? 'bg-status-success text-white' : 'bg-status-error text-white'
        }`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.message}
        </div>
      )}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ClayCard className="p-5">
            <h2 className="font-bold text-text-primary mb-4">Profile Information</h2>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-mustard-light flex items-center justify-center text-burnt-brown-dark text-2xl font-bold">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="font-semibold text-text-primary">{user?.fullName}</p>
                <StatusBadge variant={user?.verificationStatus === 'verified' ? 'success' : 'warning'}>
                  {user?.verificationStatus || 'unverified'}
                </StatusBadge>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="clay-input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Email
                </label>
                <input type="email" defaultValue={user?.email} className="clay-input w-full" disabled />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="clay-input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="clay-input w-full"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="clay-input w-full h-24 resize-none"
                />
              </div>
            </div>
            <Button variant="primary" className="mt-4" loading={saving} onClick={handleSaveProfile}>
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
              <p className="text-lg font-bold text-text-primary">{user?.tier?.name || 'Free'}</p>
              <p className="text-sm text-text-tertiary capitalize">{user?.tier?.billingCycle || 'monthly'}</p>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-tertiary">Max Listings:</span>
                <span className="font-medium">{user?.tier?.limits?.maxListings || 3}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-tertiary">Featured:</span>
                <span className="font-medium">{user?.tier?.limits?.featuredListings || 0}</span>
              </div>
            </div>
            <a href="/tiers" className="block btn-secondary text-center mt-4">
              Upgrade Plan
            </a>
          </ClayCard>

          <ClayCard className="p-5">
            <h2 className="font-bold text-text-primary mb-4">Company</h2>
            {user?.company ? (
              <div>
                <p className="font-medium text-text-primary">{user.company.name}</p>
                <StatusBadge variant={user.company.verified ? 'success' : 'default'} className="mt-2">
                  {user.company.verified ? 'Verified' : 'Unverified'}
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