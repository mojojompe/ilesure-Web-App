import { useState } from 'react';
import { Plus, Search, Edit, Archive, Eye, Heart, X, MapPin, Home, DollarSign, Image, Check, Loader } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ClayCard } from '../../components/ui/ClayCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { mockListings } from '../../data/mockData';
import type { Listing } from '../../types';

export function AgentListingsPage() {
  const [filter, setFilter] = useState<'all' | 'active' | 'occupied'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [newListing, setNewListing] = useState({
    title: '',
    description: '',
    type: 'hostel' as const,
    price: '',
    address: '',
    city: '',
    state: '',
    landmark: '',
    amenities: [] as string[],
  });

  const listings = mockListings
    .filter(l => filter === 'all' || l.status === filter)
    .filter(l => l.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddListing = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
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
    showToast('Listing created successfully!', 'success');
  };

  const handleArchive = async (id: string) => {
    showToast('Listing archived', 'success');
  };

  const handleView = (listing: Listing) => {
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

  const amenityOptions = ['WiFi', 'Security', 'Water', 'Electricity', 'Parking', 'AC', 'Laundry', 'Generator', 'Balcony', 'Common Room'];

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
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
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
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-text-primary truncate">{listing.title}</h3>
                  <p className="text-xs text-text-tertiary">{listing.location.city}, {listing.location.state}</p>
                </div>
                <p className="text-lg font-bold text-mustard">{formatCurrency(listing.price)}</p>
              </div>
              <p className="text-sm text-text-secondary line-clamp-2 mb-3">{listing.description}</p>
              <div className="flex items-center gap-4 text-xs text-text-tertiary">
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {listing.views}</span>
                <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {listing.saves}</span>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-clay-border-light">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => handleView(listing)}>
                  <Eye className="w-3 h-3 mr-1" /> View
                </Button>
                <Button variant="secondary" size="sm" onClick={() => handleArchive(listing.id)}>
                  <Archive className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </ClayCard>
        ))}
      </div>

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
                onChange={(e) => setNewListing({ ...newListing, type: e.target.value as any })}
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
            <Button variant="primary" className="flex-1" onClick={handleAddListing} loading={loading}>
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : 'Create Listing'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title={selectedListing?.title || 'Listing Details'} size="lg">
        {selectedListing && (
          <div className="space-y-4">
            <img src={selectedListing.images[0]} alt={selectedListing.title} className="w-full h-48 object-cover rounded-clay-sm" />
            <StatusBadge variant={selectedListing.status === 'active' ? 'success' : 'warning'}>
              {selectedListing.status}
            </StatusBadge>
            <div>
              <p className="text-2xl font-bold text-mustard">{formatCurrency(selectedListing.price)}</p>
              <p className="text-sm text-text-tertiary capitalize">/ {selectedListing.type.replace('_', ' ')}</p>
            </div>
            <p className="text-text-secondary">{selectedListing.description}</p>
            <div className="flex items-center gap-2 text-text-tertiary">
              <MapPin className="w-4 h-4" />
              <span>{selectedListing.location.address}, {selectedListing.location.city}, {selectedListing.location.state}</span>
            </div>
            {selectedListing.location.landmark && (
              <div className="text-sm text-text-tertiary">
                Landmark: {selectedListing.location.landmark}
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase mb-2">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {selectedListing.amenities.map(a => (
                  <span key={a} className="px-2 py-1 bg-clay-border-light text-xs rounded-pill">{a}</span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-clay-border">
              <div className="text-center">
                <p className="text-lg font-bold text-text-primary">{selectedListing.views}</p>
                <p className="text-xs text-text-tertiary">Views</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-text-primary">{selectedListing.saves}</p>
                <p className="text-xs text-text-tertiary">Saves</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-text-primary">{selectedListing.inquiries}</p>
                <p className="text-xs text-text-tertiary">Inquiries</p>
              </div>
            </div>
            <Button variant="primary" className="w-full" onClick={() => window.location.href = '/agent/create-listing'}>
              <Edit className="w-4 h-4 mr-2" /> Edit Listing
            </Button>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}