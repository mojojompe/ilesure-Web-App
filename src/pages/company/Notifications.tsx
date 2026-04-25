import { useState } from 'react';
import { Bell, Mail, Phone, MessageSquare, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { AppLayout } from '../../components/layout/AppLayout';
import { mockNotificationSettings } from '../../data/mockData';

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

export function CompanyNotificationsPage() {
  const [settings, setSettings] = useState(mockNotificationSettings);
  const [pushEnabled, setPushEnabled] = useState(settings.pushEnabled);
  const [emailEnabled, setEmailEnabled] = useState(settings.emailEnabled);
  const [smsEnabled, setSmsEnabled] = useState(settings.smsEnabled);

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <AppLayout role="company" title="Notifications" subtitle="Manage your notification preferences">
      <div className="clay-card p-6">
        <h2 className="text-lg font-bold text-text-primary mb-4">Push Notifications</h2>
        <div className="space-y-3 mb-6">
          <NotificationToggle
            label="New Inquiry"
            description="When someone sends an inquiry about your listing"
            enabled={settings.listingInquiry}
            onChange={() => toggleSetting('listingInquiry')}
          />
          <NotificationToggle
            label="Booking Request"
            description="When someone requests to book your property"
            enabled={settings.newBooking}
            onChange={() => toggleSetting('newBooking')}
          />
          <NotificationToggle
            label="Listing Views"
            description="When your listing gets new views"
            enabled={settings.listingView}
            onChange={() => toggleSetting('listingView')}
          />
          <NotificationToggle
            label="Payment Received"
            description="When you receive a payment"
            enabled={settings.paymentReceived}
            onChange={() => toggleSetting('paymentReceived')}
          />
          <NotificationToggle
            label="System Updates"
            description="Important updates from iléSure"
            enabled={settings.systemUpdates}
            onChange={() => toggleSetting('systemUpdates')}
          />
        </div>

        <h2 className="text-lg font-bold text-text-primary mb-4">Notification Channels</h2>
        <div className="space-y-3">
          <NotificationToggle
            label="Push Notifications"
            description="Enable push notifications on this device"
            enabled={pushEnabled}
            onChange={() => setPushEnabled(!pushEnabled)}
          />
          <NotificationToggle
            label="Email Notifications"
            description="Receive updates via email"
            enabled={emailEnabled}
            onChange={() => setEmailEnabled(!emailEnabled)}
          />
          <NotificationToggle
            label="SMS Notifications"
            description="Receive updates via SMS"
            enabled={smsEnabled}
            onChange={() => setSmsEnabled(!smsEnabled)}
          />
        </div>
      </div>
    </AppLayout>
  );
}