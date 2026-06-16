import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Archive, Eye, Heart, X, MapPin, Home, DollarSign, Image, Check, Loader } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ClayCard } from '../../components/ui/ClayCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { agentApi } from '../../api/agent';
import type { Listing } from '../../types';

const amenityOptions = ['WiFi', 'Security', 'Water', 'Electricity', 'Parking', 'AC', 'Laundry', 'Generator', 'Balcony', 'Common Room'];

export function AgentListingsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'active' | 'occupied'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [listings, setListings] = useState<any[]>([]);
  
  const [newListing, setNewListing] = useState({
    title: '',
    description: '',
    type: 'hostel',
    price: '',
    address: '',
    city: '',
    state: '',
    landmark: '',
    amenities: [] as string[],
  });

  useEffect(() => {
    fetchListings();
  }, [filter, searchQuery]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params: { status?: string; search?: string } = {};
      if (filter !== 'all') params.status = filter;
      if (searchQuery) params.search = searchQuery;

      const response = await agentApi.getListings(params);
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

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddListing = async () => {
    setSubmitting(true);
    try {
      // NOTE: This simplified modal captures basic fields only.
      // The full 9-step CreateListing page (/agent/listings/create) is the
      // recommended flow for complete listing data.
      const response = await agentApi.createListing({
        title: newListing.title,
        description: newListing.description,
        propertyType: newListing.type,
        rentAnnual: Number(newListing.price),
        address: newListing.address,
        city: newListing.city,
        state: newListing.state,
        landmark: newListing.landmark,
        amenities: newListing.amenities,
        areaCluster: newListing.city,
        // Required fields with sensible defaults (user can edit later via full form)
        distanceBucket: 'within_5km',
        maxOccupants: 1,
        genderRestriction: 'any',
        furnishing: 'unfurnished',
        power: 'irregular',
        water: 'borehole',
      } as any);

      if (response.success) {
        showToast('Listing created successfully!', 'success');
        setShowAddModal(false);
        setNewListing({
          title: '',
          description: '',
          type: 'hostel',
          price: '',
          address: '',
          city: '',
          state: '',
          landmark: '',
          amenities: [],
        });
        fetchListings();
      } else {
        showToast(response.error?.message || 'Failed to create listing', 'error');
      }
    } catch (error) {
      showToast('Failed to create listing', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      const response = await agentApi.archiveListing(id);
      if (response.success) {
        showToast('Listing archived', 'success');
        fetchListings();
      }
    } catch {
      showToast('Failed to archive listing', 'error');
    }
  };

  const handleView = (listing: any) => {
    setSelectedListing(listing);
    setShowViewModal(true);
  };

  const toggleAmenity = (amenity: string) => {
    setNewListing(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  return (
    <AppLayout role="agent" title="My Listings" subtitle="Manage your properties">
      {toast && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-clay-sm shadow-clay z-50 ${
          toast.type === 'success' ? 'bg-status-success text-white' : 'bg-status-error text-white'
        }`}>
          {toast.message}
        </div>
      )}

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
        <div className="flex gap-2">
          <select className="clay-input">
            <option value="all">All Types</option>
            <option value="hostel">Hostel</option>
            <option value="apartment">Apartment</option>
            <option value="single_room">Single Room</option>
            <option value="bedsitter">Bedsitter</option>
          </select>
          <Button variant="primary" onClick={() => navigate('/agent/create-listing')}>
            <Plus className="w-4 h-4 mr-2" /> Add Listing
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {(['all', 'active', 'occupied'] as const).map(f => (
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
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {listings.length > 0 ? (
            listings.map(listing => {
              const listingId = listing.id || listing._id;
              const price = listing.price || listing.rentAnnual || 0;
              const city = listing.location?.city || listing.areaCluster || listing.city || '';
              const state = listing.location?.state || listing.state || '';
              const isFullyBooked = listing.status === 'fully_booked';
              return (
                <ClayCard key={listingId} hover={!isFullyBooked} className={`overflow-hidden ${isFullyBooked ? 'opacity-60 grayscale' : ''}`}>
                  <div className="relative h-40">
                    {listing.images?.[0] ? (
                      <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-clay-border-light flex items-center justify-center">
                        <Home className="w-8 h-8 text-text-tertiary" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <StatusBadge variant={listing.status === 'active' ? 'success' : 'warning'}>
                        {listing.status}
                      </StatusBadge>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-text-primary truncate">{listing.title}</h3>
                        <p className="text-xs text-text-tertiary">{[city, state].filter(Boolean).join(', ') || '—'}</p>
                      </div>
                      <p className="text-lg font-bold text-mustard">{formatCurrency(price)}</p>
                    </div>
                    <p className="text-sm text-text-secondary line-clamp-2 mb-3">{listing.description}</p>
                    <div className="flex items-center gap-4 text-xs text-text-tertiary">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {listing.views || listing.interestCount || 0}</span>
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {listing.saves || 0}</span>
                    </div>
                    <div className="flex gap-2 mt-4 pt-4 border-t border-clay-border-light">
                      <Button variant="secondary" size="sm" className="flex-1" onClick={() => handleView(listing)} disabled={isFullyBooked}>
                        <Eye className="w-3 h-3 mr-1" /> View
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => handleArchive(String(listingId))} disabled={isFullyBooked}>
                        <Archive className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </ClayCard>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-text-tertiary">No listings found</p>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Listing" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Title</label>
            <input
              type="text"
              value={newListing.title}
              onChange={(e) => setNewListing({ ...newListing, title: e.target.value })}
              placeholder="e.g., Modern Student Hostel - Gbagada"
              className="clay-input w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Description</label>
            <textarea
              value={newListing.description}
              onChange={(e) => setNewListing({ ...newListing, description: e.target.value })}
              placeholder="Describe your property..."
              className="clay-input w-full h-24 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Type</label>
              <select
                value={newListing.type}
                onChange={(e) => setNewListing({ ...newListing, type: e.target.value })}
                className="clay-input w-full"
              >
                <option value="hostel">Hostel</option>
                <option value="apartment">Apartment</option>
                <option value="single_room">Single Room</option>
                <option value="bedsitter">Bedsitter</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Price (₦)</label>
              <input
                type="number"
                value={newListing.price}
                onChange={(e) => setNewListing({ ...newListing, price: e.target.value })}
                placeholder="150000"
                className="clay-input w-full"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Address</label>
            <input
              type="text"
              value={newListing.address}
              onChange={(e) => setNewListing({ ...newListing, address: e.target.value })}
              placeholder="Street address"
              className="clay-input w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">City</label>
              <input
                type="text"
                value={newListing.city}
                onChange={(e) => setNewListing({ ...newListing, city: e.target.value })}
                placeholder="Lagos"
                className="clay-input w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">State</label>
              <input
                type="text"
                value={newListing.state}
                onChange={(e) => setNewListing({ ...newListing, state: e.target.value })}
                placeholder="Lagos"
                className="clay-input w-full"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {amenityOptions.map(amenity => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`px-3 py-1.5 rounded-pill text-sm transition-all ${
                    newListing.amenities.includes(amenity)
                      ? 'bg-mustard text-white'
                      : 'bg-clay-border-light text-text-secondary hover:bg-mustard-pale'
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <Button variant="secondary" className="flex-1" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={handleAddListing} loading={submitting}>
              {submitting ? <Loader className="w-4 h-4 animate-spin" /> : 'Create Listing'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title={selectedListing?.title || 'Listing Details'} size="lg">
        {selectedListing && (
          <div className="space-y-4">
            {selectedListing.images?.length > 0 && (
              <div className="relative w-full h-48 flex overflow-x-auto snap-x snap-mandatory rounded-clay-sm scrollbar-hide">
                {selectedListing.images.map((url: string, index: number) => {
                  const isVideo = url.match(/\.(mp4|mov|webm)$/i);
                  return (
                    <div key={index} className="w-full flex-none snap-center h-full">
                      {isVideo ? (
                        <video src={url} controls className="w-full h-full object-cover" />
                      ) : (
                        <img src={url} alt={`${selectedListing.title} ${index + 1}`} className="w-full h-full object-cover" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <StatusBadge variant={selectedListing.status === 'active' ? 'success' : 'warning'}>
              {selectedListing.status}
            </StatusBadge>
            <div>
              <p className="text-2xl font-bold text-mustard">{formatCurrency(selectedListing.price)}</p>
              <p className="text-sm text-text-tertiary capitalize">/ {selectedListing.type}</p>
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
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase mb-2">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {(selectedListing.amenities || []).map((a: string) => (
                  <span key={a} className="px-2 py-1 bg-clay-border-light text-xs rounded-pill">{a}</span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-clay-border">
              <div className="text-center">
                <p className="text-lg font-bold text-text-primary">{selectedListing.views || 0}</p>
                <p className="text-xs text-text-tertiary">Views</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-text-primary">{selectedListing.saves || 0}</p>
                <p className="text-xs text-text-tertiary">Saves</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-text-primary">{selectedListing.inquiries || 0}</p>
                <p className="text-xs text-text-tertiary">Inquiries</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}