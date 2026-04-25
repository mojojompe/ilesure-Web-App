import { useState } from 'react';
import { DollarSign, TrendingUp, CreditCard, Download } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ClayCard } from '../../components/ui/ClayCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { mockTransactions, mockSubscriptionPayments } from '../../data/mockData';

export function CompanyPaymentsPage() {
  const [tab, setTab] = useState<'transactions' | 'subscriptions'>('transactions');

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;

  const totalPaid = mockTransactions.filter(t => t.status === 'success').reduce((sum, t) => sum + t.amount, 0);

  return (
    <AppLayout role="company" title="Payments" subtitle="Track earnings and subscriptions">
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
            <span className="text-sm text-text-tertiary">This Month</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">{formatCurrency(450000)}</p>
        </ClayCard>
        <ClayCard className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-clay-sm bg-status-info/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-status-info" />
            </div>
            <span className="text-sm text-text-tertiary">Pending</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">{formatCurrency(0)}</p>
        </ClayCard>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('transactions')} className={`px-4 py-2 rounded-pill text-sm font-medium transition-all ${tab === 'transactions' ? 'bg-burnt-brown text-white' : 'bg-white text-text-secondary hover:bg-clay-border-light'}`}>
          Transactions
        </button>
        <button onClick={() => setTab('subscriptions')} className={`px-4 py-2 rounded-pill text-sm font-medium transition-all ${tab === 'subscriptions' ? 'bg-burnt-brown text-white' : 'bg-white text-text-secondary hover:bg-clay-border-light'}`}>
          Subscriptions
        </button>
      </div>

      <ClayCard className="overflow-hidden">
        <div className="overflow-x-auto">
          {tab === 'transactions' ? (
          <table className="clay-table">
            <thead><tr><th>Description</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {mockTransactions.map(transaction => (
                <tr key={transaction.id}>
                  <td className="font-medium text-text-primary">{transaction.description}</td>
                  <td className="font-semibold text-text-primary">{formatCurrency(transaction.amount)}</td>
                  <td className="text-text-secondary">{new Date(transaction.createdAt).toLocaleDateString()}</td>
                  <td><StatusBadge variant={transaction.status === 'success' ? 'success' : 'error'}>{transaction.status}</StatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="clay-table">
            <thead><tr><th>Plan</th><th>Amount</th><th>Billing</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {mockSubscriptionPayments.map(payment => (
                <tr key={payment.id}>
                  <td className="font-medium text-text-primary">{payment.tierName}</td>
                  <td className="font-semibold text-text-primary">{formatCurrency(payment.amount)}</td>
                  <td className="text-text-secondary capitalize">{payment.billingCycle}</td>
                  <td className="text-text-secondary">{new Date(payment.createdAt).toLocaleDateString()}</td>
                  <td><StatusBadge variant={payment.status === 'success' ? 'success' : 'error'}>{payment.status}</StatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        </div>
      </ClayCard>
    </AppLayout>
  );
}