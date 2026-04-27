import { useState, useEffect } from 'react';
import { Bell, Mail, Phone, MessageSquare, Check, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { AppLayout } from '../../components/layout/AppLayout';
import notificationsApi, { NotificationSettings } from '../../api/notifications';

interface NotificationToggleProps {
  label: string;
  description: string;
  enabled: boolean;
  onChange: () => void;
}

function NotificationToggle({ label, description, enabled, onChange }: NotificationToggleProps) {
  return (
    <button
      onClick={onChange}
      className="w-full flex items-center justify-between p-4 rounded-clay-sm border-2 border-clay-border transition-all"
    >
      <div className="text-left">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="text-xs text-text-tertiary mt-0.5">{description}</p>
      </div>
      <div
        className={clsx(
          'w-11 h-6 rounded-full p-1 transition-colors',
          enabled ? 'bg-mustard' : 'bg-clay-border'
        )}
      >
        <div
          className={clsx(
            'w-4 h-4 rounded-full bg-white shadow-sm transition-transform',
            enabled ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </div>
    </button>
  );
}

const defaultSettings: NotificationSettings = {
  newBooking: true,
  listingInquiry: true,
  paymentReceived: true,
  systemUpdates: false,
  marketingEmails: false,
};

export function CompanyNotificationsPage() {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const response = await notificationsApi.getSettings();
    if (response.success && response.data) {
      setSettings(response.data);
    }
    setLoading(false);
  };

  const handleToggle = async (key: keyof NotificationSettings) => {
    const newValue = !settings[key];
    setSettings(prev => ({ ...prev, [key]: newValue }));
    setSaving(true);
    setError('');

    const response = await notificationsApi.updateSettings({ [key]: newValue });
    if (!response.success) {
      setSettings(prev => ({ ...prev, [key]: !newValue }));
      setError('Failed to save. Please try again.');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <AppLayout role="company" title="Notifications" subtitle="Manage your notification preferences">
        <div className="clay-card p-6 flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-mustard" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="company" title="Notifications" subtitle="Manage your notification preferences">
      <div className="clay-card p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-clay-sm text-red-600 text-sm">
            {error}
          </div>
        )}

        <h2 className="text-lg font-bold text-text-primary mb-4">Push Notifications</h2>
        <div className="space-y-3 mb-6">
          <NotificationToggle
            label="New Inquiry"
            description="When someone sends an inquiry about your listing"
            enabled={settings.listingInquiry ?? false}
            onChange={() => handleToggle('listingInquiry')}
          />
          <NotificationToggle
            label="Booking Request"
            description="When someone requests to book your property"
            enabled={settings.newBooking ?? false}
            onChange={() => handleToggle('newBooking')}
          />
          <NotificationToggle
            label="Payment Received"
            description="When you receive a payment"
            enabled={settings.paymentReceived ?? false}
            onChange={() => handleToggle('paymentReceived')}
          />
          <NotificationToggle
            label="System Updates"
            description="Important updates from iléSure"
            enabled={settings.systemUpdates ?? false}
            onChange={() => handleToggle('systemUpdates')}
          />
        </div>

        <h2 className="text-lg font-bold text-text-primary mb-4">Email Notifications</h2>
        <div className="space-y-3">
          <NotificationToggle
            label="Marketing Emails"
            description="Receive updates and promotions via email"
            enabled={settings.marketingEmails ?? false}
            onChange={() => handleToggle('marketingEmails')}
          />
        </div>

        {saving && (
          <div className="mt-4 flex items-center justify-center gap-2 text-text-tertiary">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Saving...</span>
          </div>
        )}
      </div>
    </AppLayout>
  );
}