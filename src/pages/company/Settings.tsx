import { useState, useEffect } from 'react';
import { Save, Loader, Banknote, CheckCircle } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ClayCard } from '../../components/ui/ClayCard';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { companyApi } from '../../api/company';
import { userApi } from '../../api/user';
import { paymentsApi, Bank } from '../../api/payments';

export function CompanySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
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
  });

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

  useEffect(() => {
    fetchData();
    loadBanks();
    loadSubaccount();
  }, []);

  const loadBanks = async () => {
    const bankList = await paymentsApi.listBanks();
    setBanks(bankList);
  };

  const loadSubaccount = async () => {
    const res = await companyApi.getSubaccount();
    if (res.success && res.data) {
      setSubaccount(res.data);
      if (res.data.subaccountCode) {
        setBankForm({
          businessName: '',
          bankCode: res.data.bankCode || '',
          accountNumber: res.data.accountNumber || '',
          accountName: res.data.accountName || '',
        });
        setResolved(true);
      }
    }
  };

  const handleResolveAccount = async () => {
    if (!bankForm.bankCode || !bankForm.accountNumber || bankForm.accountNumber.length < 10) return;
    setResolving(true);
    try {
      const result = await paymentsApi.resolveAccount(bankForm.accountNumber, bankForm.bankCode);
      setBankForm(prev => ({ ...prev, accountName: result.accountName }));
      setResolved(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to resolve account', 'error');
    } finally {
      setResolving(false);
    }
  };

  const handleSetupSubaccount = async () => {
    if (!bankForm.businessName || !bankForm.bankCode || !bankForm.accountNumber || !bankForm.accountName) {
      showToast('Please fill in all bank details and resolve your account', 'error');
      return;
    }
    setSetupLoading(true);
    try {
      const res = await companyApi.setupSubaccount(bankForm);
      if (res.success) {
        setSubaccount(res.data || null);
        showToast('Company bank account and subaccount setup successfully!');
      } else {
        showToast(res.error?.message || 'Failed to setup subaccount', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to setup subaccount', 'error');
    } finally {
      setSetupLoading(false);
    }
  };

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

          <ClayCard className="p-5">
            <h2 className="font-bold text-text-primary mb-4 flex items-center gap-2">
              <Banknote className="w-5 h-5 text-mustard" />
              Company Bank Account
            </h2>
            {subaccount?.subaccountCode ? (
              <div className="space-y-3 p-4 rounded-clay-sm bg-status-success/10">
                <div className="flex items-center gap-2 text-status-success font-medium">
                  <CheckCircle className="w-5 h-5" />
                  Subaccount Active
                </div>
                <div className="text-sm text-text-secondary space-y-1">
                  <p><span className="font-medium">Bank Code:</span> {subaccount.bankCode}</p>
                  <p><span className="font-medium">Account Number:</span> {subaccount.accountNumber}</p>
                  <p><span className="font-medium">Account Name:</span> {subaccount.accountName}</p>
                  <p className="text-xs text-text-tertiary mt-2">
                    Rent payments are split automatically — 5% to IleSure, balance to your company account.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-text-tertiary">
                  Set up your company bank account to receive rent payments directly. IleSure takes a 5% commission.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={bankForm.businessName}
                    onChange={(e) => setBankForm({ ...bankForm, businessName: e.target.value })}
                    className="clay-input w-full"
                    placeholder="e.g. ABC Properties Ltd"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    Bank
                  </label>
                  <select
                    value={bankForm.bankCode}
                    onChange={(e) => { setBankForm({ ...bankForm, bankCode: e.target.value }); setResolved(false); }}
                    className="clay-input w-full"
                  >
                    <option value="">Select a bank</option>
                    {banks.map(b => (
                      <option key={b.code} value={b.code}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    Account Number
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={bankForm.accountNumber}
                      onChange={(e) => { setBankForm({ ...bankForm, accountNumber: e.target.value.replace(/\D/g, '').slice(0, 10) }); setResolved(false); }}
                      className="clay-input flex-1"
                      placeholder="0123456789"
                      maxLength={10}
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleResolveAccount}
                      loading={resolving}
                      disabled={!bankForm.bankCode || bankForm.accountNumber.length < 10}
                    >
                      Verify
                    </Button>
                  </div>
                </div>
                {resolved && bankForm.accountName && (
                  <div className="p-3 rounded-clay-sm bg-status-success/10 border border-status-success/20">
                    <p className="text-sm font-medium text-status-success">Account verified</p>
                    <p className="text-sm text-text-primary font-semibold">{bankForm.accountName}</p>
                  </div>
                )}
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleSetupSubaccount}
                  loading={setupLoading}
                  disabled={!resolved || !bankForm.businessName}
                >
                  <Banknote className="w-4 h-4 mr-2" /> Setup Subaccount
                </Button>
              </div>
            )}
          </ClayCard>
        </div>

        <div className="space-y-6">
          <ClayCard className="p-5">
            <h2 className="font-bold text-text-primary mb-4">Current Plan</h2>
            <div className="text-center p-4 rounded-clay-sm bg-mustard-pale">
              <p className="text-lg font-bold text-text-primary capitalize">{subscription?.name || company?.tier || 'Free'}</p>
              <p className="text-sm text-text-tertiary capitalize">{subscription?.billingCycle || 'monthly'}</p>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-tertiary">Agent Slots:</span>
                <span className="font-medium">{subscription?.slotUsage?.total ?? 50}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-tertiary">Listings Used:</span>
                <span className="font-medium">{subscription?.slotUsage?.used ?? 0}</span>
              </div>
            </div>
            <a href="/tiers" className="block btn-secondary text-center mt-4">
              Upgrade Plan
            </a>
          </ClayCard>
        </div>
      </div>
      <div className="mt-12 text-center pb-6">
        <p className="text-sm font-semibold text-text-tertiary">Sponsored by Waltik Labs</p>
      </div>
    </AppLayout>
  );
}