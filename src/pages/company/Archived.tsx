import { useState } from 'react';
import { Search, RotateCcw, Eye, Trash2 } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ClayCard } from '../../components/ui/ClayCard';
import { Button } from '../../components/ui/Button';
import { mockListings } from '../../data/mockData';

export function CompanyArchivedPage() {
  const archivedListings = mockListings.filter(l => l.status === 'archived');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);

  const filteredListings = archivedListings.filter(l => 
    l.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRestore = async (id: string) => {
    showToast('Listing restored successfully', 'success');
  };

  return (
    <AppLayout role="company" title="Archived Listings" subtitle="Previously archived properties">
      {toast && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-clay-sm shadow-clay z-50 ${
          toast.type === 'success' ? 'bg-status-success text-white' : 'bg-status-error text-white'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search archived listings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="clay-input w-full pl-11"
          />
        </div>
      </div>

      {filteredListings.length === 0 ? (
        <div className="clay-card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-clay-border-light flex items-center justify-center">
            <Trash2 className="w-8 h-8 text-text-tertiary" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">No archived listings</h3>
          <p className="text-text-tertiary">Listings you archive will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredListings.map(listing => (
            <ClayCard key={listing.id} className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-clay-sm bg-burnt-brown-pale overflow-hidden flex-shrink-0">
                  <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-text-primary truncate">{listing.title}</h3>
                  <p className="text-sm text-text-tertiary">{listing.location.city}, {listing.location.state}</p>
                  <p className="text-lg font-bold text-mustard mt-1">{formatCurrency(listing.price)}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => handleRestore(listing.id)}>
                    <RotateCcw className="w-4 h-4 mr-1" /> Restore
                  </Button>
                </div>
              </div>
            </ClayCard>
          ))}
        </div>
      )}
    </AppLayout>
  );
}