import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Edit, Archive, Trash2, Eye, Heart, X, MapPin, Home, DollarSign, Image, Check, CheckCircle, Loader } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ClayCard } from '../../components/ui/ClayCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { agentApi } from '../../api/agent';
import type { Listing } from '../../types';
import { propertyTypes } from '../../constants/listingVocabulary';

const amenityOptions = ['WiFi', 'Security', 'Water', 'Electricity', 'Parking', 'AC', 'Laundry', 'Generator', 'Balcony', 'Common Room'];

export function AgentListingsPage() {
  const navigate = useNavigate();
  // 'fully_booked' is the real status value; the tab used to send 'occupied',
  // which is in no enum, so the Occupied tab was always empty.
  const [filter, setFilter] = useState<'all' | 'active' | 'fully_booked' | 'archived'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showRentedModal, setShowRentedModal] = useState(false);
  const [showPermanentDeleteModal, setShowPermanentDeleteModal] = useState(false);
  const [targetPermanentDeleteListing, setTargetPermanentDeleteListing] = useState<any | null>(null);
  const [deletingPermanently, setDeletingPermanently] = useState(false);
  const [rentedTargetListing, setRentedTargetListing] = useState<any | null>(null);
  const [rentedReason, setRentedReason] = useState<'rented_off_platform' | 'rented_on_platform' | 'temporarily_unavailable'>('rented_off_platform');
  const [markingRented, setMarkingRented] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingListing, setEditingListing] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    propertyType: 'hostel_room',
    rentAnnual: '',
    cautionFee: '',
    agencyFee: '',
    serviceCharge: '',
    address: '',
    city: '',
    state: '',
    landmark: '',
    furnishing: 'unfurnished',
    power: 'gen_dependent',
    water: 'borehole',
    maxOccupants: '1',
    amenities: [] as string[],
    petsAllowed: false,
    smokingAllowed: false,
    studentsOnly: false,
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  // BUGFIX (QA-AGT-023): the header search routes here with ?search=<term>; read it so
  // the term is actually applied instead of the page opening unfiltered.
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [listings, setListings] = useState<any[]>([]);
  
  const [newListing, setNewListing] = useState({
    title: '',
    description: '',
    type: 'hostel_room',
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
        // Required fields with sensible defaults (user can edit later via full form).
        // These must be canonical values from constants/listingVocabulary —
        // 'within_5km' and 'irregular' were in no enum and failed validation.
        distanceBucket: 'close',
        maxOccupants: 1,
        genderRestriction: 'any',
        furnishing: 'unfurnished',
        power: 'gen_dependent',
        water: 'borehole',
      } as any);

      if (response.success) {
        showToast('Listing created successfully!', 'success');
        setShowAddModal(false);
        setNewListing({
          title: '',
          description: '',
          type: 'hostel_room',
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

  const handleOpenMarkRented = (listing: any) => {
    setRentedTargetListing(listing);
    setRentedReason('rented_off_platform');
    setShowRentedModal(true);
  };

  const handleConfirmMarkRented = async () => {
    if (!rentedTargetListing) return;
    setMarkingRented(true);
    try {
      const response = await agentApi.markListingRented(rentedTargetListing._id, rentedReason);
      if (response.success) {
        showToast(
          response.pointsAwarded
            ? `Listing marked as rented! 1 listing slot freed up (+${response.pointsAwarded} reward points earned).`
            : 'Listing marked as rented and slot released!',
          'success'
        );
        setShowRentedModal(false);
        setRentedTargetListing(null);
        fetchListings();
      } else {
        showToast(response.error?.message || 'Failed to mark listing as rented', 'error');
      }
    } catch {
      showToast('Failed to mark listing as rented', 'error');
    } finally {
      setMarkingRented(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSubmitting(true);
    try {
      // Safe soft delete: moves to archive so agent retains property details & photos
      const response = await agentApi.deleteListing(id, false);
      if (response.success) {
        showToast('Listing moved to your Archive. You can view or restore it anytime.', 'success');
        fetchListings();
      } else {
        showToast(response.message || 'Failed to delete listing', 'error');
      }
    } catch {
      showToast('Failed to delete listing', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenPermanentDelete = (listing: any) => {
    setTargetPermanentDeleteListing(listing);
    setShowPermanentDeleteModal(true);
  };

  const handleConfirmPermanentDelete = async () => {
    if (!targetPermanentDeleteListing) return;
    setDeletingPermanently(true);
    try {
      const response = await agentApi.deleteListing(targetPermanentDeleteListing._id || targetPermanentDeleteListing.id, true);
      if (response.success) {
        showToast('Listing permanently deleted.', 'success');
        setShowPermanentDeleteModal(false);
        setTargetPermanentDeleteListing(null);
        fetchListings();
      } else {
        showToast(response.message || 'Failed to permanently delete listing', 'error');
      }
    } catch {
      showToast('Failed to permanently delete listing', 'error');
    } finally {
      setDeletingPermanently(false);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const response = await agentApi.restoreListing(id);
      if (response.success) {
        showToast('Listing restored and published back online!', 'success');
        fetchListings();
      } else {
        showToast(response.error?.message || 'Failed to restore listing', 'error');
      }
    } catch {
      showToast('Failed to restore listing', 'error');
    }
  };

  const handleView = async (listing: any) => {
    setSelectedListing(listing);
    setShowViewModal(true);
    try {
      const listingId = listing.id || listing._id;
      if (listingId) {
        const res = await agentApi.getListing(listingId);
        if (res.success && (res.data?.listing || res.data)) {
          const full = (res.data as any).listing || res.data;
          setSelectedListing((prev: any) => ({ ...prev, ...full }));
        }
      }
    } catch {
      // Keep existing listing state
    }
  };

  const toggleAmenity = (amenity: string) => {
    setNewListing(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleOpenEdit = (listing: any) => {
    setEditingListing(listing);
    const loc = listing.location || {};
    const priceVal = listing.rentAnnual || listing.price || listing.annualRent || '';
    setEditForm({
      title: listing.title || '',
      description: listing.description || '',
      propertyType: listing.propertyType || listing.type || 'hostel_room',
      rentAnnual: priceVal ? String(priceVal) : '',
      cautionFee: listing.cautionFee != null ? String(listing.cautionFee) : '',
      agencyFee: listing.agencyFee != null ? String(listing.agencyFee) : '',
      serviceCharge: listing.serviceCharge != null ? String(listing.serviceCharge) : '',
      address: listing.address || loc.address || '',
      city: listing.city || loc.city || listing.areaCluster || '',
      state: listing.state || loc.state || '',
      landmark: listing.landmark || loc.landmark || '',
      furnishing: listing.furnishing || 'unfurnished',
      power: listing.power || 'gen_dependent',
      water: listing.water || 'borehole',
      maxOccupants: String(listing.maxOccupants || 1),
      amenities: Array.isArray(listing.amenities) ? [...listing.amenities] : [],
      petsAllowed: Boolean(listing.petsAllowed),
      smokingAllowed: Boolean(listing.smokingAllowed),
      studentsOnly: Boolean(listing.studentsOnly),
    });
    setShowEditModal(true);
  };

  const toggleEditAmenity = (amenity: string) => {
    setEditForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleSaveEdit = async () => {
    if (!editingListing) return;
    if (!editForm.title.trim()) {
      showToast('Listing title is required', 'error');
      return;
    }
    if (!editForm.rentAnnual || Number(editForm.rentAnnual) <= 0) {
      showToast('A valid annual rent is required', 'error');
      return;
    }

    setSavingEdit(true);
    try {
      const listingId = editingListing.id || editingListing._id;
      const payload: any = {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        propertyType: editForm.propertyType,
        rentAnnual: Number(editForm.rentAnnual),
        annualRent: Number(editForm.rentAnnual),
        price: Number(editForm.rentAnnual),
        cautionFee: editForm.cautionFee ? Number(editForm.cautionFee) : 0,
        agencyFee: editForm.agencyFee ? Number(editForm.agencyFee) : 0,
        serviceCharge: editForm.serviceCharge ? Number(editForm.serviceCharge) : 0,
        address: editForm.address.trim(),
        city: editForm.city.trim(),
        state: editForm.state.trim(),
        areaCluster: editForm.city.trim() || editForm.state.trim(),
        landmark: editForm.landmark.trim(),
        furnishing: editForm.furnishing,
        power: editForm.power,
        water: editForm.water,
        maxOccupants: Number(editForm.maxOccupants) || 1,
        amenities: editForm.amenities,
        petsAllowed: editForm.petsAllowed,
        smokingAllowed: editForm.smokingAllowed,
        studentsOnly: editForm.studentsOnly,
        rules: [
          editForm.petsAllowed && 'pets_allowed',
          editForm.smokingAllowed && 'smoking_allowed',
          editForm.studentsOnly && 'students_only',
        ].filter(Boolean),
      };

      const res = await agentApi.updateListing(String(listingId), payload);
      if (res.success) {
        showToast('Listing updated successfully!', 'success');
        setShowEditModal(false);
        setEditingListing(null);
        fetchListings();
      } else {
        showToast(res.error?.message || 'Failed to update listing', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to update listing', 'error');
    } finally {
      setSavingEdit(false);
    }
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
          {/* NOTE: this type selector is still unwired — agentApi.getListings
              takes no propertyType param. Its options are canonical now so it
              stops advertising types that do not exist. */}
          <select className="clay-input">
            <option value="all">All Types</option>
            {propertyTypes.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <Button variant="primary" onClick={() => navigate('/agent/create-listing')}>
            <Plus className="w-4 h-4 mr-2" /> Add Listing
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {(['all', 'active', 'fully_booked', 'archived'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-pill text-sm font-medium transition-all ${
              filter === f
                ? 'bg-burnt-brown text-white'
                : 'bg-white text-text-secondary hover:bg-clay-border-light'
            }`}
          >
            {f === 'fully_booked' ? 'Occupied' : f === 'archived' ? 'Archived / Inactive' : f.charAt(0).toUpperCase() + f.slice(1)}
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
              const isShortlet = listing.propertyType?.toLowerCase() === 'shortlet';
              return (
                <ClayCard key={listingId} hover={!isFullyBooked} className={`overflow-hidden ${isFullyBooked ? 'opacity-60 grayscale' : ''}`}>
                  <div className="relative h-56">
                    {listing.images?.[0] ? (
                      <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-clay-border-light flex items-center justify-center">
                        <Home className="w-8 h-8 text-text-tertiary" />
                      </div>
                    )}
                    {/* Progressive Gradient Fade to White */}
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/80 to-transparent z-0"></div>
                    
                    <div className="absolute top-3 right-3 z-10">
                      <StatusBadge variant={listing.status === 'active' ? 'success' : 'warning'}>
                        {listing.status}
                      </StatusBadge>
                    </div>
                  </div>
                  <div className="relative z-10 p-4 -mt-6">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-text-primary truncate">{listing.title}</h3>
                        <p className="text-xs text-text-tertiary">{[city, state].filter(Boolean).join(', ') || '—'}</p>
                      </div>
                      {isShortlet && listing.shortletPricing ? (
                        <div className="text-right">
                          {listing.shortletPricing.hourly && <p className="text-lg font-bold text-mustard">₦{listing.shortletPricing.hourly.toLocaleString()}/hr</p>}
                          {listing.shortletPricing.daily && <p className="text-lg font-bold text-mustard">₦{listing.shortletPricing.daily.toLocaleString()}/day</p>}
                          {!listing.shortletPricing.hourly && !listing.shortletPricing.daily && listing.shortletPricing.weekly && <p className="text-lg font-bold text-mustard">₦{listing.shortletPricing.weekly.toLocaleString()}/wk</p>}
                          {!listing.shortletPricing.hourly && !listing.shortletPricing.daily && listing.shortletPricing.monthly && <p className="text-lg font-bold text-mustard">₦{listing.shortletPricing.monthly.toLocaleString()}/mo</p>}
                        </div>
                      ) : (
                        <p className="text-lg font-bold text-mustard">{formatCurrency(price)}</p>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary line-clamp-2 mb-3">{listing.description}</p>
                    <div className="flex items-center gap-4 text-xs text-text-tertiary">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {listing.views || listing.interestCount || 0}</span>
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {listing.saves || 0}</span>
                    </div>
                    <div className="flex gap-2 mt-4 pt-4 border-t border-clay-border-light items-center">
                      <Button variant="secondary" size="sm" className="flex-1" onClick={() => handleView(listing)}>
                        <Eye className="w-3 h-3 mr-1" /> View
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => handleOpenEdit(listing)} title="Edit listing details and pricing">
                        <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                      </Button>
                      {listing.status === 'active' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenMarkRented(listing)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-2.5 py-1.5 rounded-clay-sm flex items-center gap-1 shadow-sm transition-all"
                          title="Quick Delist: Mark as Rented to free up listing slot"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Rented</span>
                        </Button>
                      )}
                      {listing.status === 'archived' ? (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleRestore(String(listingId))}
                            className="bg-burnt-brown hover:bg-burnt-brown/90 text-white text-xs px-2.5 py-1.5 rounded-clay-sm"
                            title="Restore and relist this property"
                          >
                            Restore
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenPermanentDelete(listing)}
                            className="text-red-500 hover:bg-red-50 border border-red-200"
                            title="Delete Permanently (Irreversible)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDelete(String(listingId))}
                          title="Move to Archive (Safe Delete)"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-text-tertiary hover:text-red-500" />
                        </Button>
                      )}
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
                {propertyTypes.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
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
        {selectedListing && (() => {
          const loc = selectedListing.location || {};
          const address = selectedListing.address || loc.address || '';
          const city = selectedListing.city || loc.city || '';
          const stateOrArea = selectedListing.areaCluster || selectedListing.state || loc.state || '';
          const landmark = selectedListing.landmark || loc.landmark || '';
          const fullAddress = [address, city, stateOrArea].filter(Boolean).join(', ');
          const mapQuery = [address, city, landmark, stateOrArea].filter(Boolean).join(' ') || selectedListing.title || '';
          
          const rawStatus = (selectedListing.status || 'active').toLowerCase();
          const statusText = rawStatus.replace(/_/g, ' ').toUpperCase();
          const statusVariant = rawStatus === 'active' ? 'success' : rawStatus === 'fully_booked' ? 'default' : 'warning';

          const propTypeLabel = propertyTypes.find(p => p.value === (selectedListing.propertyType || selectedListing.type))?.label 
            || (selectedListing.propertyType || selectedListing.type || 'Residential').replace(/_/g, ' ');

          return (
            <div className="space-y-5">
              {selectedListing.images?.length > 0 && (
                <div className="relative w-full h-56 flex overflow-x-auto snap-x snap-mandatory rounded-clay-sm scrollbar-hide border border-clay-border bg-black/5">
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

              {/* Status and Price Banner */}
              <div className="flex items-center justify-between gap-3 p-3.5 bg-mustard-pale/30 rounded-clay-sm border border-mustard/20 flex-wrap">
                <div className="flex items-center gap-2">
                  <StatusBadge variant={statusVariant}>
                    {statusText}
                  </StatusBadge>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-pill bg-white border border-clay-border text-text-secondary capitalize">
                    {propTypeLabel}
                  </span>
                </div>
                <div>
                  {selectedListing.propertyType === 'shortlet' && selectedListing.shortletPricing ? (
                    <div className="text-right space-y-0.5">
                      {selectedListing.shortletPricing.hourly && <p className="text-lg font-bold text-mustard">₦{selectedListing.shortletPricing.hourly.toLocaleString()}/hr</p>}
                      {selectedListing.shortletPricing.daily && <p className="text-xl font-bold text-mustard">₦{selectedListing.shortletPricing.daily.toLocaleString()}/day</p>}
                      {selectedListing.shortletPricing.weekly && <p className="text-sm font-bold text-mustard">₦{selectedListing.shortletPricing.weekly.toLocaleString()}/wk</p>}
                      {selectedListing.shortletPricing.monthly && <p className="text-sm font-bold text-mustard">₦{selectedListing.shortletPricing.monthly.toLocaleString()}/mo</p>}
                    </div>
                  ) : (
                    <div className="text-right">
                      <p className="text-2xl font-black text-mustard leading-none">
                        {formatCurrency(selectedListing.price || selectedListing.rentAnnual || 0)}
                      </p>
                      <span className="text-[11px] font-medium text-text-tertiary">
                        /{selectedListing.duration === 'monthly' ? 'month' : selectedListing.duration === 'weekly' ? 'week' : selectedListing.duration === 'daily' ? 'day' : 'year'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">Description</p>
                <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line bg-white p-3 rounded-clay-sm border border-clay-border">
                  {selectedListing.description || 'No description provided.'}
                </p>
              </div>

              {/* Location Card */}
              <div className="p-3.5 bg-clay-border-light/40 rounded-clay-sm border border-clay-border space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-mustard shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-text-primary">
                      {fullAddress || landmark || selectedListing.areaCluster || 'Location available on inspection'}
                    </p>
                    {landmark && (
                      <p className="text-xs text-text-tertiary mt-0.5">
                        <span className="font-medium text-text-secondary">Nearby Landmark:</span> {landmark}
                      </p>
                    )}
                  </div>
                </div>
                {mapQuery && (
                  <div className="pt-1 pl-6">
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-mustard hover:underline"
                    >
                      <span>View on Google Maps</span>
                      <span className="text-[10px]">↗</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Key Details Grid */}
              <div>
                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Key Specifications</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-clay-sm bg-white border border-clay-border">
                    <p className="text-text-tertiary text-[10px]">Furnishing</p>
                    <p className="font-semibold text-text-primary capitalize mt-0.5">
                      {(selectedListing.furnishing || 'unfurnished').replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-clay-sm bg-white border border-clay-border">
                    <p className="text-text-tertiary text-[10px]">Power Supply</p>
                    <p className="font-semibold text-text-primary capitalize mt-0.5">
                      {(selectedListing.power || 'constant').replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-clay-sm bg-white border border-clay-border">
                    <p className="text-text-tertiary text-[10px]">Water Supply</p>
                    <p className="font-semibold text-text-primary capitalize mt-0.5">
                      {(selectedListing.water || 'borehole').replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-clay-sm bg-white border border-clay-border">
                    <p className="text-text-tertiary text-[10px]">Max Occupants</p>
                    <p className="font-semibold text-text-primary mt-0.5">
                      {selectedListing.maxOccupants || 1} person{(selectedListing.maxOccupants || 1) > 1 ? 's' : ''}
                    </p>
                  </div>
                  {selectedListing.cautionFee !== undefined && Number(selectedListing.cautionFee) > 0 && (
                    <div className="p-2.5 rounded-clay-sm bg-white border border-clay-border">
                      <p className="text-text-tertiary text-[10px]">Caution Fee</p>
                      <p className="font-semibold text-text-primary mt-0.5">
                        {formatCurrency(Number(selectedListing.cautionFee))}
                      </p>
                    </div>
                  )}
                  {selectedListing.agencyFee !== undefined && Number(selectedListing.agencyFee) > 0 && (
                    <div className="p-2.5 rounded-clay-sm bg-white border border-clay-border">
                      <p className="text-text-tertiary text-[10px]">Agency Fee</p>
                      <p className="font-semibold text-text-primary mt-0.5">
                        {formatCurrency(Number(selectedListing.agencyFee))}
                      </p>
                    </div>
                  )}
                  {selectedListing.leaseDuration && (
                    <div className="p-2.5 rounded-clay-sm bg-white border border-clay-border">
                      <p className="text-text-tertiary text-[10px]">Lease Duration</p>
                      <p className="font-semibold text-text-primary mt-0.5 capitalize">
                        {selectedListing.leaseDuration}
                      </p>
                    </div>
                  )}
                  {selectedListing.genderRestriction && selectedListing.genderRestriction !== 'any' && (
                    <div className="p-2.5 rounded-clay-sm bg-white border border-clay-border">
                      <p className="text-text-tertiary text-[10px]">Gender Preference</p>
                      <p className="font-semibold text-text-primary capitalize mt-0.5">
                        {selectedListing.genderRestriction.replace(/_/g, ' ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Amenities & Features</p>
                {selectedListing.amenities && selectedListing.amenities.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedListing.amenities.map((a: string) => (
                      <span key={a} className="px-3 py-1 bg-white border border-clay-border text-xs font-medium rounded-pill shadow-xs text-text-primary">
                        {a}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-text-tertiary italic">Standard amenities included. Contact agent for custom details.</p>
                )}
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-clay-border">
                <div className="text-center p-2 rounded-clay-sm bg-white border border-clay-border/50">
                  <p className="text-lg font-black text-text-primary">{selectedListing.views || 0}</p>
                  <p className="text-[11px] font-medium text-text-tertiary">Views</p>
                </div>
                <div className="text-center p-2 rounded-clay-sm bg-white border border-clay-border/50">
                  <p className="text-lg font-black text-text-primary">{selectedListing.saves || 0}</p>
                  <p className="text-[11px] font-medium text-text-tertiary">Saves</p>
                </div>
                <div className="text-center p-2 rounded-clay-sm bg-white border border-clay-border/50">
                  <p className="text-lg font-black text-text-primary">{selectedListing.inquiries || 0}</p>
                  <p className="text-[11px] font-medium text-text-tertiary">Inquiries</p>
                </div>
              </div>

              {/* Action Buttons in View Modal */}
              <div className="pt-3 border-t border-clay-border flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const target = selectedListing;
                    setShowViewModal(false);
                    handleOpenEdit(target);
                  }}
                >
                  <Edit className="w-3.5 h-3.5 mr-1" /> Edit Listing
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Quick Mark as Rented Modal */}
      <Modal
        isOpen={showRentedModal}
        onClose={() => !markingRented && setShowRentedModal(false)}
        title="Mark Property as Rented / Taken"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Taking down <strong className="text-text-primary">"{rentedTargetListing?.title}"</strong> immediately removes it from public search and frees up <strong>1 active listing slot</strong> on your plan. All photos and details remain saved safely in your Archive.
          </p>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Where was this property rented?
            </label>
            <div className="space-y-2">
              {[
                {
                  id: 'rented_off_platform',
                  label: 'Rented outside iléSure (Offline client / WhatsApp / Walk-in)',
                  desc: 'Found a tenant directly outside the platform.',
                },
                {
                  id: 'rented_on_platform',
                  label: 'Rented through an iléSure tenant',
                  desc: 'A tenant connected or booked via iléSure.',
                },
                {
                  id: 'temporarily_unavailable',
                  label: 'Temporarily unavailable / Maintenance / Withdrawn',
                  desc: 'Pause inquiries while the property is being serviced or held.',
                },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-start gap-3 p-3 rounded-clay-sm border cursor-pointer transition-all ${
                    rentedReason === opt.id
                      ? 'border-emerald-500 bg-emerald-50/50'
                      : 'border-clay-border-light hover:bg-clay-border-light/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="rentedReason"
                    value={opt.id}
                    checked={rentedReason === opt.id}
                    onChange={() => setRentedReason(opt.id as any)}
                    className="mt-1 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-text-primary block">{opt.label}</span>
                    <span className="text-xs text-text-tertiary block mt-0.5">{opt.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="p-3 bg-mustard-pale/40 border border-mustard/30 rounded-clay-sm text-xs text-text-secondary flex items-center gap-2">
            <span className="text-base">🎁</span>
            <span>You will earn <strong>+25 reward points</strong> for promptly updating this listing!</span>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowRentedModal(false)}
              disabled={markingRented}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleConfirmMarkRented}
              loading={markingRented}
            >
              Confirm & Delist
            </Button>
          </div>
        </div>
      </Modal>

      {/* Permanent Deletion Danger Modal */}
      <Modal
        isOpen={showPermanentDeleteModal}
        onClose={() => !deletingPermanently && setShowPermanentDeleteModal(false)}
        title="Permanently Delete Property?"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-clay-sm flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-sm font-bold text-red-700">This action cannot be undone!</p>
              <p className="text-xs text-red-600 mt-0.5">
                Permanently deleting this property will completely erase its details, photos, and view records from your account. It cannot be recovered.
              </p>
            </div>
          </div>

          <p className="text-sm text-text-secondary">
            Are you sure you want to permanently delete <strong className="text-text-primary">"{targetPermanentDeleteListing?.title}"</strong>?
          </p>

          <div className="flex gap-2 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowPermanentDeleteModal(false)}
              disabled={deletingPermanently}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              onClick={handleConfirmPermanentDelete}
              loading={deletingPermanently}
            >
              Yes, Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Listing Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => !savingEdit && setShowEditModal(false)}
        title="Edit Listing & Pricing"
        size="lg"
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* Legal / Policy Note */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-clay-sm text-xs text-amber-800 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-amber-900">
              <span>⚖️</span>
              <span>Pricing & Listing Update Policy</span>
            </p>
            <p className="text-[11px] leading-relaxed">
              You are legally and commercially permitted to adjust asking rent and fees for vacant or relisted properties. Price updates immediately apply to public searches and new applicants. Under Nigerian tenancy regulations, price increases cannot alter active, binding leases without tenant consent.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Property Title</label>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              placeholder="e.g., Spacious 2-Bedroom Flat with Generator Backup"
              className="clay-input w-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Property Type</label>
              <select
                value={editForm.propertyType}
                onChange={(e) => setEditForm({ ...editForm, propertyType: e.target.value })}
                className="clay-input w-full"
              >
                {propertyTypes.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Annual Rent (₦) *</label>
              <input
                type="number"
                value={editForm.rentAnnual}
                onChange={(e) => setEditForm({ ...editForm, rentAnnual: e.target.value })}
                placeholder="400000"
                className="clay-input w-full font-bold text-mustard"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Caution Fee (₦)</label>
              <input
                type="number"
                value={editForm.cautionFee}
                onChange={(e) => setEditForm({ ...editForm, cautionFee: e.target.value })}
                placeholder="50000"
                className="clay-input w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Agency Fee (₦)</label>
              <input
                type="number"
                value={editForm.agencyFee}
                onChange={(e) => setEditForm({ ...editForm, agencyFee: e.target.value })}
                placeholder="40000"
                className="clay-input w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Service Charge (₦)</label>
              <input
                type="number"
                value={editForm.serviceCharge}
                onChange={(e) => setEditForm({ ...editForm, serviceCharge: e.target.value })}
                placeholder="0"
                className="clay-input w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              placeholder="Describe the property highlights, layout, and nearby attractions..."
              className="clay-input w-full h-24 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Street Address</label>
            <input
              type="text"
              value={editForm.address}
              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              placeholder="e.g., 45 Commercial Avenue, Sabo"
              className="clay-input w-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">City</label>
              <input
                type="text"
                value={editForm.city}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                placeholder="Ibadan"
                className="clay-input w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">State / Area</label>
              <input
                type="text"
                value={editForm.state}
                onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                placeholder="Oyo"
                className="clay-input w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Landmark</label>
              <input
                type="text"
                value={editForm.landmark}
                onChange={(e) => setEditForm({ ...editForm, landmark: e.target.value })}
                placeholder="e.g. Opposite Sabo Market"
                className="clay-input w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Furnishing</label>
              <select
                value={editForm.furnishing}
                onChange={(e) => setEditForm({ ...editForm, furnishing: e.target.value })}
                className="clay-input w-full"
              >
                <option value="unfurnished">Unfurnished</option>
                <option value="semi_furnished">Semi Furnished</option>
                <option value="fully_furnished">Fully Furnished</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Power Supply</label>
              <select
                value={editForm.power}
                onChange={(e) => setEditForm({ ...editForm, power: e.target.value })}
                className="clay-input w-full"
              >
                <option value="constant">Constant (24/7)</option>
                <option value="gen_dependent">Gen Dependent</option>
                <option value="solar_backed">Solar Backed</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Water Source</label>
              <select
                value={editForm.water}
                onChange={(e) => setEditForm({ ...editForm, water: e.target.value })}
                className="clay-input w-full"
              >
                <option value="borehole">Borehole</option>
                <option value="public">Public Water</option>
                <option value="tank">Water Tank</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Max Occupants</label>
              <input
                type="number"
                min="1"
                max="20"
                value={editForm.maxOccupants}
                onChange={(e) => setEditForm({ ...editForm, maxOccupants: e.target.value })}
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
                  onClick={() => toggleEditAmenity(amenity)}
                  className={`px-3 py-1.5 rounded-pill text-xs font-medium transition-all ${
                    editForm.amenities.includes(amenity)
                      ? 'bg-mustard text-white shadow-sm font-semibold'
                      : 'bg-clay-border-light text-text-secondary hover:bg-mustard-pale'
                  }`}
                >
                  {editForm.amenities.includes(amenity) ? `✓ ${amenity}` : `+ ${amenity}`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2 border-t border-clay-border">
            <label className="flex items-center gap-2 text-xs font-medium text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={editForm.petsAllowed}
                onChange={(e) => setEditForm({ ...editForm, petsAllowed: e.target.checked })}
                className="rounded text-mustard focus:ring-mustard"
              />
              <span>Pets Allowed</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={editForm.smokingAllowed}
                onChange={(e) => setEditForm({ ...editForm, smokingAllowed: e.target.checked })}
                className="rounded text-mustard focus:ring-mustard"
              />
              <span>Smoking Allowed</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={editForm.studentsOnly}
                onChange={(e) => setEditForm({ ...editForm, studentsOnly: e.target.checked })}
                className="rounded text-mustard focus:ring-mustard"
              />
              <span>Students Only</span>
            </label>
          </div>

          <div className="flex gap-3 pt-3 border-t border-clay-border">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowEditModal(false)}
              disabled={savingEdit}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleSaveEdit}
              loading={savingEdit}
            >
              {savingEdit ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}