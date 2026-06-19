import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Eye, Heart, Archive, Loader, MapPin } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ClayCard } from '../../components/ui/ClayCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { companyApi } from '../../api/company';

export function CompanyListingsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any>(null);

  useEffect(() => {
    fetchListings();
  }, [filter, searchQuery]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params: { status?: string; search?: string } = {};
      if (filter !== 'all') params.status = filter;
      if (searchQuery) params.search = searchQuery;

      const response = await companyApi.getListings(params);
      if (response.success && response.data) {
        setListings(response.data.listings || []);
      }
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;

  const handleView = (listing: any) => {
    setSelectedListing(listing);
    setShowViewModal(true);
  };

  return (
    <AppLayout role="company" title="Listings" subtitle="Manage company properties">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search listings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="clay-input w-full pl-11"
          />
        </div>
        <Button variant="primary" onClick={() => navigate('/company/create-listing')}>
          <Plus className="w-4 h-4 mr-2" /> Add Listing
        </Button>
      </div>

      <div className="flex gap-2 mb-6">
        {(['all', 'active', 'archived'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-pill text-sm font-medium transition-all ${
              filter === f
                ? 'bg-burnt-brown text-white'
                : 'bg-white text-text-secondary hover:bg-clay-border-light'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-mustard" />
        </div>
      ) : listings.length > 0 ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {listings.map(listing => {
            const isFullyBooked = listing.status === 'fully_booked';
            const isShortlet = listing.propertyType === 'shortlet';
            return (
            <ClayCard key={listing.id} hover={!isFullyBooked} className={`overflow-hidden ${isFullyBooked ? 'opacity-60 grayscale' : ''}`}>
              <div className="relative h-40">
                {listing.images?.[0] ? (
                  <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-clay-border-light flex items-center justify-center">
                    <Eye className="w-8 h-8 text-text-tertiary" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <StatusBadge variant={listing.status === 'active' ? 'success' : 'warning'}>
                    {listing.status}
                  </StatusBadge>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-text-primary truncate">{listing.title}</h3>
                <p className="text-xs text-text-tertiary">{listing.city}, {listing.state}</p>
                {isShortlet && listing.shortletPricing ? (
                  <div className="mt-2">
                    {listing.shortletPricing.hourly && <p className="text-lg font-bold text-mustard">₦{listing.shortletPricing.hourly.toLocaleString()}/hr</p>}
                    {listing.shortletPricing.daily && <p className="text-lg font-bold text-mustard">₦{listing.shortletPricing.daily.toLocaleString()}/day</p>}
                    {!listing.shortletPricing.hourly && !listing.shortletPricing.daily && listing.shortletPricing.weekly && <p className="text-lg font-bold text-mustard">₦{listing.shortletPricing.weekly.toLocaleString()}/wk</p>}
                    {!listing.shortletPricing.hourly && !listing.shortletPricing.daily && listing.shortletPricing.monthly && <p className="text-lg font-bold text-mustard">₦{listing.shortletPricing.monthly.toLocaleString()}/mo</p>}
                  </div>
                ) : (
                  <p className="text-lg font-bold text-mustard mt-2">{formatCurrency(listing.price || listing.rentAnnual || 0)}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-text-tertiary mt-2">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {listing.views || 0}</span>
                  <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {listing.saves || 0}</span>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-clay-border-light">
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => handleView(listing)} disabled={isFullyBooked}>
                    <Eye className="w-3 h-3 mr-1" /> View
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleView(listing)} disabled={isFullyBooked}>
                    <Edit className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </ClayCard>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-text-tertiary">No listings found</p>
        </div>
      )}

      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title={selectedListing?.title || 'Listing Details'} size="lg">
        {selectedListing && (
          <div className="space-y-4">
            {selectedListing.images?.[0] && (
              <img src={selectedListing.images[0]} alt={selectedListing.title} className="w-full h-48 object-cover rounded-clay-sm" />
            )}
            <StatusBadge variant={selectedListing.status === 'active' ? 'success' : 'warning'}>
              {selectedListing.status}
            </StatusBadge>
            <div>
              {selectedListing.propertyType === 'shortlet' && selectedListing.shortletPricing ? (
                <div className="space-y-1">
                  {selectedListing.shortletPricing.hourly && <p className="text-2xl font-bold text-mustard">₦{selectedListing.shortletPricing.hourly.toLocaleString()}/hr</p>}
                  {selectedListing.shortletPricing.daily && <p className="text-2xl font-bold text-mustard">₦{selectedListing.shortletPricing.daily.toLocaleString()}/day</p>}
                  {selectedListing.shortletPricing.weekly && <p className="text-2xl font-bold text-mustard">₦{selectedListing.shortletPricing.weekly.toLocaleString()}/wk</p>}
                  {selectedListing.shortletPricing.monthly && <p className="text-2xl font-bold text-mustard">₦{selectedListing.shortletPricing.monthly.toLocaleString()}/mo</p>}
                </div>
              ) : (
                <p className="text-2xl font-bold text-mustard">{formatCurrency(selectedListing.price || selectedListing.rentAnnual || 0)}</p>
              )}
              <p className="text-sm text-text-tertiary capitalize">{selectedListing.propertyType?.replace(/_/g, ' ') || selectedListing.type}</p>
            </div>
            <p className="text-text-secondary">{selectedListing.description}</p>
            <div className="flex flex-col gap-2 text-text-tertiary">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{selectedListing.address}, {selectedListing.city}, {selectedListing.state}</span>
              </div>
              {selectedListing.landmark && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-text-secondary">Landmarks:</span>
                  <span>{selectedListing.landmark}</span>
                </div>
              )}
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selectedListing.address || ''} ${selectedListing.city || ''} ${selectedListing.landmark || ''}`.trim())}`}
                target="_blank" 
                rel="noreferrer"
                className="text-mustard hover:underline text-sm inline-block mt-1"
              >
                View on Google Maps
              </a>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}