import { useState } from 'react';
import { Plus, Search, Edit, Eye, Heart } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ClayCard } from '../../components/ui/ClayCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { mockListings } from '../../data/mockData';

export function CompanyListingsPage() {
  const [filter, setFilter] = useState<'all' | 'active' | 'occupied'>('all');
  const listings = mockListings.filter(l => filter === 'all' || l.status === filter);

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;

  return (
    <AppLayout role="company" title="Listings" subtitle="Manage company properties">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input type="text" placeholder="Search listings..." className="clay-input w-full pl-11" />
        </div>
        <Button variant="primary">
          <Plus className="w-4 h-4 mr-2" /> Add Listing
        </Button>
      </div>

      <div className="flex gap-2 mb-6">
        {(['all', 'active', 'occupied'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-pill text-sm font-medium transition-all ${
              filter === f ? 'bg-burnt-brown text-white' : 'bg-white text-text-secondary hover:bg-clay-border-light'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {listings.map(listing => (
          <ClayCard key={listing.id} hover className="overflow-hidden">
            <div className="relative h-40">
              <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
              <div className="absolute top-3 right-3">
                <StatusBadge variant={listing.status === 'active' ? 'success' : 'warning'}>
                  {listing.status}
                </StatusBadge>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-text-primary truncate">{listing.title}</h3>
              <p className="text-xs text-text-tertiary">{listing.location.city}, {listing.location.state}</p>
              <div className="flex items-center justify-between mt-3">
                <p className="text-lg font-bold text-mustard">{formatCurrency(listing.price)}</p>
                <div className="flex items-center gap-3 text-xs text-text-tertiary">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {listing.views}</span>
                  <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {listing.saves}</span>
                </div>
              </div>
            </div>
          </ClayCard>
        ))}
      </div>
    </AppLayout>
  );
}