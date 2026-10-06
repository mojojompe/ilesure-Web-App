import { useState, useEffect } from 'react';
<<<<<<< HEAD
import { FloppyDiskIcon, Loading02Icon, Money01Icon, CheckmarkBadge02Icon, SecurityIcon, Note01Icon, Upload01Icon, Cancel02Icon, Alert01Icon, Clock01Icon as Clock, Camera01Icon } from '@hugeicons/react';
=======
import { FloppyDiskIcon, Loading02Icon, CheckmarkBadge02Icon, SecurityIcon, Note01Icon, Upload01Icon, Cancel02Icon, Alert01Icon, Clock01Icon as Clock } from '@hugeicons/react';
>>>>>>> 21ce651445f5a3ea146e667ef4a319f0a9b7327f
import { AppLayout } from '../../components/layout/AppLayout';
import { ClayCard } from '../../components/ui/ClayCard';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { companyApi } from '../../api/company';
import { userApi } from '../../api/user';
import { tiersApi, resolveMyTierUsage } from '../../api/tiers';
import { PayoutAccountCard } from '../../components/payout/PayoutAccountCard';
import { DojahKYCSection } from '../../components/kyc/DojahKYCSection';
import { DeleteAccountModal } from '../../components/common/DeleteAccountModal';
import { companyDocumentsState } from '../../lib/companyVerification';

export function CompanySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [tierUsage, setTierUsage] = useState<{ limit?: number; used?: number } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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
    name: '',
    phone: '',
    address: '',
    description: '',
    logo: '',
  });

<<<<<<< HEAD
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image too large. Max 5MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const [banks, setBanks] = useState<Bank[]>([]);
  const [subaccount, setSubaccount] = useState<any>(null);
  const [bankForm, setBankForm] = useState({
    businessName: '',
    bankCode: '',
    accountNumber: '',
    accountName: '',
  });
  const [resolving, setResolving] = useState(false);
  const [resolved, setResolved] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);

=======
>>>>>>> 21ce651445f5a3ea146e667ef4a319f0a9b7327f
  const [cacFile, setCacFile] = useState<File | null>(null);
  const [permitFile, setPermitFile] = useState<File | null>(null);
  const [officeAddress, setOfficeAddress] = useState('');
  const [docUploading, setDocUploading] = useState(false);
  const [docSubmitted, setDocSubmitted] = useState(false);
  const docsState = companyDocumentsState(company, docSubmitted);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [companyRes, subRes, tierRes] = await Promise.all([
        companyApi.getProfile(),
        companyApi.getSubscription(),
        tiersApi.getMyTier(),
      ]);
      // GET /tiers/me is the authority on the listing cap/usage (entitlements first).
      if (tierRes.success && tierRes.data) {
        setTierUsage(resolveMyTierUsage(tierRes.data));
      }

      if (companyRes.success && companyRes.company) {
        setCompany(companyRes.company);
        setFormData({
          name: companyRes.company.name || '',
          phone: companyRes.company.phone || '',
          address: (companyRes.company as any).officeAddress || (companyRes.company as any).address || '',
          description: companyRes.company.description || '',
          logo: (companyRes.company as any).logo || (companyRes.company as any).avatar || '',
        });
      }
      if (subRes.success && subRes.subscription) {
        setSubscription(subRes.subscription);
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
        showToast('Company saved successfully!');
      } else {
        showToast(response.message || 'Failed to save', 'error');
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

  const handleDocumentUpload = async () => {
    if (!cacFile) {
      showToast('CAC Certificate is required', 'error');
      return;
    }
    if (!officeAddress.trim()) {
      showToast('Office address is required', 'error');
      return;
    }
    setDocUploading(true);
    try {
      const formData = new FormData();
      formData.append('officeAddress', officeAddress.trim());
      formData.append('cacCertificate', cacFile);
      if (permitFile) {
        formData.append('businessPermit', permitFile);
      }
      const res = await userApi.submitCompanyVerification(formData);
      if (res.success) {
        setDocSubmitted(true);
        showToast('Company documents submitted successfully!');
      } else {
        showToast(res.message || 'Failed to submit documents', 'error');
      }
    } catch {
      showToast('Failed to submit documents. Please try again.', 'error');
    } finally {
      setDocUploading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout role="company" title="Settings" subtitle="Manage your company">
        <div className="flex items-center justify-center h-64">
          <Loading02Icon className="w-8 h-8 animate-spin text-mustard" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="company" title="Settings" subtitle="Manage your company">

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
            <h2 className="font-bold text-text-primary mb-4">Company Information</h2>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative group cursor-pointer" onClick={() => document.getElementById('logo-upload')?.click()}>
                {formData.logo || company?.logo || company?.avatar ? (
                  <img src={formData.logo || company?.logo || company?.avatar} alt="Logo" className="w-20 h-20 rounded-full object-cover border-2 border-mustard" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-mustard-light flex items-center justify-center text-burnt-brown-dark text-2xl font-bold border-2 border-transparent">
                    {(company?.tradingName || company?.name || 'C').charAt(0)}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <Camera01Icon className="w-6 h-6 text-white" />
                </div>
                <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
              </div>
              <div>
                <p className="font-semibold text-text-primary">{company?.tradingName || company?.name}</p>
                <div className="mt-2">
                  <StatusBadge variant={company?.verified ? 'success' : 'default'}>
                    {company?.verified ? 'Verified' : 'Unverified'}
                  </StatusBadge>
                </div>
              </div>
            </div>
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
              <FloppyDiskIcon className="w-4 h-4 mr-2" /> Save Changes
            </Button>
          </ClayCard>

          <ClayCard className="p-5">
            <h2 className="font-bold text-text-primary mb-4 flex items-center gap-2">
              <SecurityIcon className="w-5 h-5 text-mustard" />
              Director Identity Verification
            </h2>
            <p className="text-sm text-text-tertiary mb-4">
              The company director must complete NIN and BVN verification.
            </p>
            <DojahKYCSection
              userRole="company"
              userName={company?.director || company?.name}
              userEmail={company?.email}
              onVerified={fetchData}
            />
          </ClayCard>

          <ClayCard className="p-5">
            <h2 className="font-bold text-text-primary mb-4 flex items-center gap-2">
              <Note01Icon className="w-5 h-5 text-mustard" />
              Company Documents
            </h2>
            {docsState === 'verified' ? (
              <div className="flex items-center gap-2 p-3 rounded-clay-sm bg-status-success/10 border border-status-success/20">
                <CheckmarkBadge02Icon className="w-4 h-4 text-status-success" />
                <p className="text-sm font-medium text-status-success">Company is verified</p>
              </div>
            ) : docsState === 'under_review' ? (
              <div className="flex items-center gap-2 p-3 rounded-clay-sm bg-mustard/10 border border-mustard/20">
                <Alert01Icon className="w-4 h-4 text-mustard" />
                <p className="text-sm font-medium text-mustard">Documents submitted, under review</p>
              </div>
            ) : (
              <div className="space-y-4">
                {docsState === 'rejected' && (
                  <div className="p-3 rounded-clay-sm bg-status-error/10 border border-status-error/20">
                    <p className="text-sm font-medium text-status-error">Your company verification was not approved.</p>
                    {company?.rejectionReason && (
                      <p className="text-sm text-text-secondary mt-1">Reason: {company.rejectionReason}</p>
                    )}
                    <p className="text-xs text-text-tertiary mt-1">Upload corrected documents below to resubmit.</p>
                  </div>
                )}
                <p className="text-sm text-text-tertiary">
                  Upload your CAC certificate and business permit for verification.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    Office Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={officeAddress}
                    onChange={(e) => setOfficeAddress(e.target.value)}
                    placeholder="e.g. 14 Lagos Island, Victoria Island, Lagos"
                    className="clay-input w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    CAC Certificate <span className="text-red-500">*</span>
                  </label>
                  {cacFile ? (
                    <div className="flex items-center gap-3 p-3 bg-status-success/5 border border-status-success/30 rounded-clay-sm">
                      <CheckmarkBadge02Icon className="w-4 h-4 text-status-success flex-shrink-0" />
                      <span className="text-sm text-text-primary truncate flex-1">{cacFile.name}</span>
                      <button onClick={() => setCacFile(null)} className="p-1 rounded-full hover:bg-clay-border-light">
                        <Cancel02Icon className="w-3.5 h-3.5 text-text-tertiary" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-clay-border rounded-clay-sm cursor-pointer hover:border-mustard hover:bg-mustard-pale/40 transition-all">
                      <Upload01Icon className="w-5 h-5 text-text-tertiary" />
                      <span className="text-sm text-text-secondary">Click to upload CAC certificate</span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) setCacFile(f); }}
                      />
                    </label>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    Business Permit (Optional)
                  </label>
                  {permitFile ? (
                    <div className="flex items-center gap-3 p-3 bg-status-success/5 border border-status-success/30 rounded-clay-sm">
                      <CheckmarkBadge02Icon className="w-4 h-4 text-status-success flex-shrink-0" />
                      <span className="text-sm text-text-primary truncate flex-1">{permitFile.name}</span>
                      <button onClick={() => setPermitFile(null)} className="p-1 rounded-full hover:bg-clay-border-light">
                        <Cancel02Icon className="w-3.5 h-3.5 text-text-tertiary" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-clay-border rounded-clay-sm cursor-pointer hover:border-mustard hover:bg-mustard-pale/40 transition-all">
                      <Upload01Icon className="w-5 h-5 text-text-tertiary" />
                      <span className="text-sm text-text-secondary">Click to upload business permit</span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) setPermitFile(f); }}
                      />
                    </label>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-clay-sm p-3 flex gap-2 text-xs text-blue-700">
                  <Alert01Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Documents are securely stored and reviewed by iléSure's team. Approval usually takes 1–2 business days.</span>
                </div>

                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleDocumentUpload}
                  loading={docUploading}
                  disabled={docUploading || !cacFile || !officeAddress.trim()}
                >
                  <Upload01Icon className="w-4 h-4 mr-2" /> Submit Documents
                </Button>
              </div>
            )}
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

          <PayoutAccountCard
            role="company"
            title="Company Bank Account"
            intro="Set up your company bank account to receive rent payments directly. iléSure deducts its service fee from each payment. The account name must match your company's registered or trading name, or your own verified name."
            activeNote="Rent payments are split automatically, the iléSure service fee to us, the balance to your company account."
            businessLabel="Business Name"
            businessPlaceholder="e.g. ABC Properties Ltd"
            onToast={showToast}
          />
        </div>

        <div className="space-y-6">
          {(() => {
            const expDate = subscription?.expiresAt ? new Date(subscription.expiresAt) : null;
            const isExp = expDate ? expDate.getTime() <= Date.now() : true;
            const daysLeft = expDate && !isExp
              ? Math.max(0, Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
              : 0;

            return (
              <ClayCard className="p-5">
                <h2 className="font-bold text-text-primary mb-4">Current Plan</h2>
                <div className="text-center p-4 rounded-clay-sm bg-mustard-pale">
                  <p className="text-lg font-bold text-text-primary capitalize">{subscription?.name || company?.tier || 'Free'}</p>
                  <p className="text-sm text-text-tertiary capitalize">{subscription?.billingCycle || 'monthly'}</p>
                  {expDate && !isExp && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-burnt-brown text-white text-xs font-semibold shadow-sm">
                      <Clock className="w-3.5 h-3.5 text-mustard" />
                      <span>{daysLeft} day{daysLeft === 1 ? '' : 's'} remaining</span>
                    </div>
                  )}
                  {expDate && isExp && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-status-danger text-white text-xs font-semibold">
                      <span>Expired</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    {/* slotUsage is the LISTING cap (Tier.features.maxListings), not agent seats;
                        it was labelled "Agent Slots" with a hard-coded 50 fallback. */}
                    <span className="text-text-tertiary">Listing Slots:</span>
                    <span className="font-medium">{tierUsage?.limit ?? subscription?.slotUsage?.total ?? '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-tertiary">Listings Used:</span>
                    <span className="font-medium">{tierUsage?.used ?? subscription?.slotUsage?.used ?? 0}</span>
                  </div>
                  {expDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-text-tertiary">Expires On:</span>
                      <span className="font-medium">{expDate.toLocaleDateString('en-NG', { dateStyle: 'medium' })}</span>
                    </div>
                  )}
                </div>
                <a href="/tiers" className="block btn-secondary text-center mt-4">
                  {subscription?.name && subscription.name.toLowerCase() !== 'free' && !isExp ? 'Manage / Renew Plan' : 'Upgrade Plan'}
                </a>
              </ClayCard>
            );
          })()}

          <ClayCard className="p-5">
            <h2 className="font-bold text-text-primary mb-4 flex items-center gap-2">
              <SecurityIcon className="w-5 h-5 text-status-danger" />
              Account Management
            </h2>
            <p className="text-sm text-text-tertiary mb-4">
              Deleting your account will remove your access to the platform and unpublish your company's active listings. 
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