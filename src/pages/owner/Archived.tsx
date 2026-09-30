import { useState, useEffect } from 'react';
import { Search01Icon, ReloadIcon, ViewIcon, Delete02Icon, Loading02Icon } from '@hugeicons/react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ClayCard } from '../../components/ui/ClayCard';
import { Button } from '../../components/ui/Button';
import { ownerApi, type OwnerRole, type OwnerListing } from '../../api/owner';
import { formatCurrency, formatDate } from '../../utils/format';

export function OwnerArchivedPage({ role }: { role: OwnerRole }) {
  const api = ownerApi(role);
  const [listings, setListings] = useState<OwnerListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [restoring, setRestoring] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const response = await api.getListings({ status: 'archived' });
      if (response.success) setListings(response.data.listings);
      else showToast(response.error.message, 'error');
      setLoading(false);
    })();
  }, [role]);

  const filteredListings = listings.filter(l => (l.title || '').toLowerCase().includes(searchQuery.toLowerCase()));

  const handleRestore = async (id: string) => {
    setRestoring(id);
    // LL-P0-4: the dedicated endpoint restores to `statusBeforeArchive`; a generic update
    // with `{ status: 'active' }` is ignored by the backend's field whitelist.
    const response = await api.restoreListing(id);
    if (response.success) {
      setListings(prev => prev.filter(l => l._id !== id));
      showToast('Listing restored successfully', 'success');
    } else {
      showToast(response.error.message || 'Failed to restore listing', 'error');
    }
    setRestoring(null);
  };

  if (loading) {
    return (
      <AppLayout role={role} title="Archived Listings" subtitle="Previously archived properties">
        <div className="clay-card p-12 flex items-center justify-center">
          <Loading02Icon className="w-6 h-6 animate-spin text-mustard" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout role={role} title="Archived Listings" subtitle="Previously archived properties">
      {toast && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-clay-sm shadow-clay z-50 ${toast.type === 'success' ? 'bg-status-success text-white' : 'bg-status-error text-white'}`}>
          {toast.message}
        </div>
      )}

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search01Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
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
            <Delete02Icon className="w-8 h-8 text-text-tertiary" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">No archived listings</h3>
          <p className="text-text-tertiary">Listings you archive will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredListings.map(listing => (
            <ClayCard key={listing._id} className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-clay-sm bg-burnt-brown-pale overflow-hidden flex-shrink-0">
                  {listing.images && listing.images[0] ? (
                    <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-tertiary">
                      <ViewIcon className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-text-primary truncate">{listing.title}</h3>
                  <p className="text-sm text-text-tertiary">{listing.city}, {listing.address}</p>
                  <p className="text-lg font-bold text-mustard mt-1">{formatCurrency(listing.rentAnnual)}</p>
                  {listing.createdAt && (
                    <p className="text-xs text-text-tertiary mt-1">Archived: {formatDate(listing.createdAt)}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleRestore(listing._id)}
                    disabled={restoring === listing._id}
                    loading={restoring === listing._id}
                  >
                    <ReloadIcon className="w-4 h-4 mr-1" />
                    {restoring === listing._id ? 'Restoring...' : 'Restore'}
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
