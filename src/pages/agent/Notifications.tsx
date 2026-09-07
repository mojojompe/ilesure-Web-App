import { useState, useEffect } from 'react';
import { Bell, Mail, Phone, MessageSquare, Check, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { AppLayout } from '../../components/layout/AppLayout';
import notificationsApi, { NotificationSettings, Notification } from '../../api/notifications';

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

export function AgentNotificationsPage() {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // BUGFIX (QA-AGT-022): the notifications themselves were never loaded here.
  const [inbox, setInbox] = useState<Notification[]>([]);
  const [inboxLoading, setInboxLoading] = useState(true);

  useEffect(() => {
    loadSettings();
    loadInbox();
  }, []);

  const loadInbox = async () => {
    setInboxLoading(true);
    try {
      const response = await notificationsApi.getNotifications(1, 20);
      if (response.success && response.data) setInbox(response.data.notifications);
    } catch {
      // The preferences half of the page still works; don't block it on this.
    } finally {
      setInboxLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    setInbox((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    try {
      await notificationsApi.markAsRead(id);
    } catch {
      // Put it back if the server rejected it, rather than showing a false state.
      setInbox((prev) => prev.map((n) => (n._id === id ? { ...n, read: false } : n)));
    }
  };

  const handleMarkAllRead = async () => {
    const unread = inbox.filter((n) => !n.read);
    setInbox((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await Promise.all(unread.map((n) => notificationsApi.markAsRead(n._id)));
    } catch {
      loadInbox();
    }
  };

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
      <AppLayout role="agent" title="Notifications" subtitle="Manage your notification preferences">
        <div className="clay-card p-6 flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-mustard" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="agent" title="Notifications" subtitle="Your notifications and preferences">
      {/* BUGFIX (QA-AGT-022): this page contained ONLY preference switches. The actual
          notifications — which the API returns and the header bell already shows — were
          unreachable from the page named "Notifications". */}
      <div className="clay-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-primary">Recent Notifications</h2>
          {inbox.some((n) => !n.read) && (
            <button
              onClick={handleMarkAllRead}
              className="text-sm font-semibold text-mustard hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>

        {inboxLoading ? (
          <div className="flex items-center gap-2 py-6 justify-center text-text-tertiary">
            <Loader2 className="w-4 h-4 animate-spin" /> <span className="text-sm">Loading notifications…</span>
          </div>
        ) : inbox.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-tertiary">You have no notifications yet.</p>
        ) : (
          <ul className="space-y-2">
            {inbox.map((n) => (
              <li
                key={n._id}
                className={clsx(
                  'rounded-clay-sm p-3 transition-colors',
                  n.read ? 'bg-clay-border-light' : 'bg-mustard-pale'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary">{n.title}</p>
                    <p className="text-sm text-text-secondary">{n.body}</p>
                    <p className="mt-1 text-xs text-text-tertiary">
                      {new Date(n.createdAt).toLocaleDateString('en-NG', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </div>
                  {!n.read && (
                    <button
                      onClick={() => handleMarkRead(n._id)}
                      className="shrink-0 text-xs font-semibold text-mustard hover:underline"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

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