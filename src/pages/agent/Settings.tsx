import { useState, useEffect } from 'react';
import { FloppyDiskIcon, Loading02Icon, SecurityIcon, Clock01Icon as Clock, Camera01Icon } from '@hugeicons/react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ClayCard } from '../../components/ui/ClayCard';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { userApi } from '../../api/user';
import { tiersApi, resolveMyTierUsage, catalogueMaxListings } from '../../api/tiers';
import { useAuth } from '../../api/authContext';
import { PayoutAccountCard } from '../../components/payout/PayoutAccountCard';
import { DojahKYCSection } from '../../components/kyc/DojahKYCSection';
import { DeleteAccountModal } from '../../components/common/DeleteAccountModal';

export function AgentSettingsPage() {
  const { user: authUser, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [user, setUser] = useState<any>(authUser);

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
    avatar: '',
  });

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image too large. Max 5MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };
  useEffect(() => {
    fetchProfile();
    loadNotificationSettings();
  }, []);

  // BUGFIX (QA-AGT-008): the toggles were initialised to all-true and
  // `getNotificationSettings()` was never called anywhere in the app, so the screen
  // always showed every preference as ON regardless of what the server held, and a
  // save-then-return looked like it had been discarded even when it had persisted.
  const loadNotificationSettings = async () => {
    try {
      const res = await userApi.getNotificationSettings();
      if (res.success && res.data) {
        setNotifications((prev) => ({ ...prev, ...res.data }));
      }
    } catch {
      // Leave the defaults in place; the save path reports its own failures.
    }
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const [profileRes, tierRes] = await Promise.all([
        userApi.getProfile(),
        tiersApi.getMyTier(),
      ]);
      if (profileRes.success && profileRes.data) {
        const profileData: any = { ...profileRes.data };

        // The listing cap comes from the server (GET /tiers/me entitlements, else its
        // older listingsLimit field, else the public GET /tiers catalogue). This used to
        // fall back to a hard-coded 3/10/50 table and invent "featured" counts
        // (premium 2, enterprise 10) that the backend has never had.
        const previousTier = typeof profileData.tier === 'object' && profileData.tier ? profileData.tier : null;
        const featuredFromServer = typeof previousTier?.limits?.featuredListings === 'number'
          ? { featuredListings: previousTier.limits.featuredListings }
          : {};
        if (tierRes.success && tierRes.data) {
          const usage = resolveMyTierUsage(tierRes.data);
          const tId = usage.tierId;
          const tName = tierRes.data.name || tId.charAt(0).toUpperCase() + tId.slice(1);
          const maxListings = usage.limit ?? catalogueMaxListings((await tiersApi.getTiers()).data?.tiers, tId);
          profileData.tier = {
            name: tName,
            billingCycle: tierRes.data.billingCycle || previousTier?.billingCycle || 'monthly',
            expiresAt: tierRes.data.expiresAt ?? previousTier?.expiresAt ?? null,
            limits: {
              ...(maxListings !== undefined ? { maxListings } : {}),
              ...featuredFromServer,
            },
          };
        } else if (profileData.tier && typeof profileData.tier === 'string') {
          const tId = profileData.tier;
          const tName = tId.charAt(0).toUpperCase() + tId.slice(1);
          const maxListings = catalogueMaxListings((await tiersApi.getTiers()).data?.tiers, tId);
          profileData.tier = {
            name: tName,
            billingCycle: 'monthly',
            limits: maxListings !== undefined ? { maxListings } : {},
          };
        }

        setUser(profileData);
        updateUser(profileData);
        setFormData({
          fullName: profileData.fullName || '',
          phone: profileData.phone || '',
          whatsapp: profileData.whatsapp || '',
          bio: profileData.bio || '',
          avatar: profileData.avatar || '',
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
        // QA-AGT-004: reflect the values the server actually persisted and mirror them into the
        // cached session so the header/sidebar and the next refresh show what was saved.
        const saved = response.data;
        if (saved) {
          setFormData({
            fullName: saved.fullName || '',
            phone: saved.phone || '',
            whatsapp: saved.whatsapp || '',
            bio: saved.bio || '',
            avatar: saved.avatar || '',
          });
          updateUser({ fullName: saved.fullName, phone: saved.phone, whatsapp: saved.whatsapp, bio: saved.bio, avatar: saved.avatar });
        }
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
    const previous = notifications;
    const newSettings = { ...notifications, [key]: value };
    setNotifications(newSettings);
    try {
      // BUGFIX (QA-AGT-008): a failure was only ever written to console.error, so the
      // toggle stayed flipped on screen while the server still held the old value.
      // Roll the UI back and say so.
      const res = await userApi.updateNotificationSettings(newSettings);
      if (!res.success) throw new Error('rejected');
      showToast('Notification preferences saved', 'success');
    } catch (error) {
      console.error('Failed to update notifications:', error);
      setNotifications(previous);
      showToast('Could not save that preference. Please try again.', 'error');
    }
  };

  if (loading) {
    return (
      <AppLayout role="agent" title="Settings" subtitle="Manage your account">
        <div className="flex items-center justify-center h-64">
          <Loading02Icon className="w-8 h-8 animate-spin text-mustard" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="agent" title="Settings" subtitle="Manage your account">

      {/* Toast notification overlay */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-clay shadow-clay-lg text-sm font-semibold animate-fade-in ${toast.type === 'success' ? 'bg-status-success text-white' : 'bg-status-error text-white'
          }`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.message}
        </div>
      )}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ClayCard className="p-5">
            <h2 className="font-bold text-text-primary mb-4">Profile Information</h2>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-upload')?.click()}>
                {formData.avatar || user?.avatar ? (
                  <img src={formData.avatar || user.avatar} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-mustard" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-mustard-light flex items-center justify-center text-burnt-brown-dark text-2xl font-bold border-2 border-transparent">
                    {user?.fullName?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <Camera01Icon className="w-6 h-6 text-white" />
                </div>
                <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
              </div>
              <div>
                <p className="font-semibold text-text-primary">{user?.fullName}</p>
                <div className="flex flex-row gap-2 mt-2">
                  <StatusBadge
                    variant={
                      user?.verificationStatus === 'verified'
                        ? 'success'
                        : user?.verificationStatus === 'rejected'
                          ? 'error'
                          : 'warning'
                    }
                  >
                    {user?.verificationStatus === 'more_info'
                      ? 'more info needed'
                      : user?.verificationStatus || 'unverified'}
                  </StatusBadge>
                  <div className="bg-[#E1AD01]/10 px-3 py-1 rounded-full border border-[#E1AD01]/20 flex items-center gap-1">
                    <span className="text-xs font-bold text-[#E1AD01]">{user?.rewardPoints || 0} Points</span>
                  </div>
                </div>
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
                {((user as any)?.ninVerified || (user as any)?.bvnVerified) && (
                  <p className="text-xs text-text-tertiary mt-1">
                    Must match the name on your verified ID. You can add a middle name or change the order.
                  </p>
                )}
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
                  autoComplete="tel"
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
              <FloppyDiskIcon className="w-4 h-4 mr-2" /> Save Changes
            </Button>
          </ClayCard>

          <ClayCard className="p-5">
            <h2 className="font-bold text-text-primary mb-4 flex items-center gap-2">
              <SecurityIcon className="w-5 h-5 text-mustard" />
              Identity Verification
            </h2>
            <p className="text-sm text-text-tertiary mb-4">
              Complete your NIN and BVN verification to unlock all platform features.
            </p>
            <DojahKYCSection
              userRole={user?.role || 'agent'}
              userName={user?.fullName}
              userEmail={user?.email}
              onVerified={fetchProfile}
            />
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

          {user?.role !== 'sub_agent' && (
            <PayoutAccountCard
              role="agent"
              title="Bank Account for Payments"
              intro="Set up your bank account to receive rent payments directly. The account name must match your verified name."
              activeNote="Rent payments will be settled automatically to your account."
              businessLabel="Business / Agency Name"
              businessPlaceholder="e.g. ABC Properties"
              onToast={showToast}
            />
          )}
        </div>

        <div className="space-y-6">
          {user?.role !== 'sub_agent' && (() => {
            const tierExpiresDate = user?.tier?.expiresAt ? new Date(user.tier.expiresAt) : null;
            const isTierExpired = tierExpiresDate ? tierExpiresDate.getTime() <= Date.now() : true;
            const tierDaysRemaining = tierExpiresDate && !isTierExpired
              ? Math.max(0, Math.ceil((tierExpiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
              : 0;

            return (
              <ClayCard className="p-5">
                <h2 className="font-bold text-text-primary mb-4">Current Plan</h2>
                <div className="text-center p-4 rounded-clay-sm bg-mustard-pale">
                  <p className="text-lg font-bold text-text-primary">{user?.tier?.name || 'Free'}</p>
                  <p className="text-sm text-text-tertiary capitalize">{user?.tier?.billingCycle || 'monthly'}</p>
                  {tierExpiresDate && !isTierExpired && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-burnt-brown text-white text-xs font-semibold shadow-sm">
                      <Clock className="w-3.5 h-3.5 text-mustard" />
                      <span>{tierDaysRemaining} day{tierDaysRemaining === 1 ? '' : 's'} remaining</span>
                    </div>
                  )}
                  {tierExpiresDate && isTierExpired && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-status-danger text-white text-xs font-semibold">
                      <span>Expired</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-tertiary">Max Listings:</span>
                    <span className="font-medium">{user?.tier?.limits?.maxListings ?? '—'}</span>
                  </div>
                  {typeof user?.tier?.limits?.featuredListings === 'number' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-text-tertiary">Featured:</span>
                      <span className="font-medium">{user.tier.limits.featuredListings}</span>
                    </div>
                  )}
                  {tierExpiresDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-text-tertiary">Expires On:</span>
                      <span className="font-medium">{tierExpiresDate.toLocaleDateString('en-NG', { dateStyle: 'medium' })}</span>
                    </div>
                  )}
                </div>
                <a href="/tiers" className="block btn-secondary text-center mt-4">
                  {user?.tier?.name && user.tier.name.toLowerCase() !== 'free' && !isTierExpired ? 'Manage / Renew Plan' : 'Upgrade Plan'}
                </a>
              </ClayCard>
            );
          })()}

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

          <ClayCard className="p-5">
            <h2 className="font-bold text-text-primary mb-4 flex items-center gap-2">
              <SecurityIcon className="w-5 h-5 text-status-danger" />
              Account Management
            </h2>
            <p className="text-sm text-text-tertiary mb-4">
              Deleting your account will remove your access to the platform. 
              Your data will be retained securely, but you will not be able to log in without reactivating your account.
            </p>
            <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
              Delete Account
            </Button>
          </ClayCard>
        </div>
      </div>
      <div className="mt-12 text-center pb-6">
        <p className="text-sm font-semibold text-text-tertiary">Sponsored by Waltik Labs</p>
      </div>

      <DeleteAccountModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} />
    </AppLayout>
  );
}