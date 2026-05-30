import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, CreditCard } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ClayCard } from '../../components/ui/ClayCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import paymentsApi, { Transaction } from '../../api/payments';

export function AgentPaymentsPage() {
  const [tab, setTab] = useState<'transactions' | 'subscriptions'>('transactions');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const data = await paymentsApi.getHistory(1, 50);
      setTransactions(data.transactions);
      setTotalPaid(data.totalPaid);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;

  const subscriptions = transactions.filter(t => t.type === 'tier_subscription');

  return (
    <AppLayout role="agent" title="Payments" subtitle="Track your earnings and payments">
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <ClayCard className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-clay-sm bg-status-success/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-status-success" />
            </div>
            <span className="text-sm text-text-tertiary">Total Paid</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">{formatCurrency(totalPaid)}</p>
        </ClayCard>
        <ClayCard className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-clay-sm bg-mustard/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-mustard" />
            </div>
            <span className="text-sm text-text-tertiary">Pending Commission</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">₦0</p>
        </ClayCard>
        <ClayCard className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-clay-sm bg-status-info/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-status-info" />
            </div>
            <span className="text-sm text-text-tertiary">This Month</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">{formatCurrency(totalPaid)}</p>
        </ClayCard>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('transactions')}
          className={`px-4 py-2 rounded-pill text-sm font-medium transition-all ${
            tab === 'transactions'
              ? 'bg-burnt-brown text-white'
              : 'bg-white text-text-secondary hover:bg-clay-border-light'
          }`}
        >
          Transactions
        </button>
        <button
          onClick={() => setTab('subscriptions')}
          className={`px-4 py-2 rounded-pill text-sm font-medium transition-all ${
            tab === 'subscriptions'
              ? 'bg-burnt-brown text-white'
              : 'bg-white text-text-secondary hover:bg-clay-border-light'
          }`}
        >
          Subscriptions
        </button>
      </div>

      <ClayCard className="overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-text-tertiary">Loading...</div>
          ) : tab === 'transactions' ? (
            <table className="clay-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Tier</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-text-tertiary py-8">No transactions yet</td></tr>
              ) : (
                transactions.map(t => (
                  <tr key={t.id}>
                    <td className="font-medium text-text-primary capitalize">{t.type.replace('_', ' ')}</td>
                    <td className="text-text-secondary">{t.tier || '-'}</td>
                    <td className="font-semibold text-text-primary">{formatCurrency(t.amount)}</td>
                    <td className="text-text-secondary capitalize">{t.type.replace('_', ' ')}</td>
                    <td className="text-text-secondary">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <StatusBadge variant={t.status === 'completed' ? 'success' : t.status === 'pending' ? 'warning' : 'error'}>
                        {t.status}
                      </StatusBadge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="clay-table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.length === 0 ? (
                <tr><td colSpan={4} className="text-center text-text-tertiary py-8">No subscriptions yet</td></tr>
              ) : (
                subscriptions.map(s => (
                  <tr key={s.id}>
                    <td className="font-medium text-text-primary">{s.tier || 'Subscription'}</td>
                    <td className="font-semibold text-text-primary">{formatCurrency(s.amount)}</td>
                    <td className="text-text-secondary">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <StatusBadge variant={s.status === 'completed' ? 'success' : s.status === 'pending' ? 'warning' : 'error'}>
                        {s.status}
                      </StatusBadge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          )}
        </div>
      </ClayCard>
    </AppLayout>
  );
}
