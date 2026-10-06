import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PlusSignIcon, Search01Icon, PencilEdit01Icon as Edit, Delete02Icon as Trash2, ViewIcon as Eye, FavouriteIcon, Location01Icon as MapPin, Home01Icon, CheckmarkBadge02Icon as CheckCircle, Loading02Icon } from '@hugeicons/react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ClayCard } from '../../components/ui/ClayCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ownerApi, type OwnerRole, type OwnerListing, type MarkRentedReason } from '../../api/owner';
import { propertyTypes } from '../../constants/listingVocabulary';
import { formatCurrency } from '../../utils/format';

/** 'pending_approval' -> 'Pending approval'. */
const statusLabel = (status?: string): string =>
  status ? status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ') : '';

const amenityOptions = ['WiFi', 'Security', 'Water', 'Electricity', 'Parking', 'AC', 'Laundry', 'Generator', 'Balcony', 'Common Room'];

const PAGE_COPY: Record<OwnerRole, { title: string; subtitle: string }> = {
  agent: { title: 'My Listings', subtitle: 'Manage your properties' },
  company: { title: 'Listings', subtitle: 'Manage company properties' },
};

// 'fully_booked' is the real status value; the tab used to send 'occupied', which is in
// no enum, so the Occupied tab was always empty.
type ListingFilter = 'all' | 'active' | 'fully_booked' | 'archived';

const RENTED_REASONS: { id: MarkRentedReason; label: string; desc: string }[] = [
  { id: 'rented_off_platform', label: 'Rented outside iléSure (Offline client / WhatsApp / Walk-in)', desc: 'Found a tenant directly outside the platform.' },
  { id: 'rented_on_platform', label: 'Rented through an iléSure tenant', desc: 'A tenant connected or booked via iléSure.' },
  { id: 'temporarily_unavailable', label: 'Temporarily unavailable / Maintenance / Withdrawn', desc: 'Pause inquiries while the property is being serviced or held.' },
];

interface EditForm {
  title: string;
  description: string;
  propertyType: string;
  rentAnnual: string;
  cautionFee: string;
  agencyFee: string;
  serviceCharge: string;
  address: string;
  city: string;
  state: string;
  landmark: string;
  furnishing: string;
  power: string;
  water: string;
  maxOccupants: string;
  amenities: string[];
  petsAllowed: boolean;
  smokingAllowed: boolean;
  studentsOnly: boolean;
}

function toEditForm(listing: OwnerListing): EditForm {
  const loc = listing.location || {};
  return {
    title: listing.title || '',
    description: listing.description || '',
    propertyType: listing.propertyType || listing.type || 'hostel_room',
    rentAnnual: listing.rentAnnual ? String(listing.rentAnnual) : '',
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
  };
}

function toUpdatePayload(form: EditForm) {
  const rent = Number(form.rentAnnual);
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    propertyType: form.propertyType,
    rentAnnual: rent,
    annualRent: rent,
    price: rent,
    cautionFee: form.cautionFee ? Number(form.cautionFee) : 0,
    agencyFee: form.agencyFee ? Number(form.agencyFee) : 0,
    serviceCharge: form.serviceCharge ? Number(form.serviceCharge) : 0,
    address: form.address.trim(),
    city: form.city.trim(),
    state: form.state.trim(),
    areaCluster: form.city.trim() || form.state.trim(),
    landmark: form.landmark.trim(),
    furnishing: form.furnishing,
    power: form.power,
    water: form.water,
    maxOccupants: Number(form.maxOccupants) || 1,
    amenities: form.amenities,
    petsAllowed: form.petsAllowed,
    smokingAllowed: form.smokingAllowed,
    studentsOnly: form.studentsOnly,
    rules: [
      form.petsAllowed && 'pets_allowed',
      form.smokingAllowed && 'smoking_allowed',
      form.studentsOnly && 'students_only',
    ].filter(Boolean),
  };
}

function ShortletPrices({ pricing, compact }: { pricing: NonNullable<OwnerListing['shortletPricing']>; compact: boolean }) {
  if (compact) {
    return (
      <div className="text-right">
        {pricing.hourly && <p className="text-lg font-bold text-mustard">₦{pricing.hourly.toLocaleString()}/hr</p>}
        {pricing.daily && <p className="text-lg font-bold text-mustard">₦{pricing.daily.toLocaleString()}/day</p>}
        {!pricing.hourly && !pricing.daily && pricing.weekly && <p className="text-lg font-bold text-mustard">₦{pricing.weekly.toLocaleString()}/wk</p>}
        {!pricing.hourly && !pricing.daily && pricing.monthly && <p className="text-lg font-bold text-mustard">₦{pricing.monthly.toLocaleString()}/mo</p>}
      </div>
    );
  }
  return (
    <div className="text-right space-y-0.5">
      {pricing.hourly && <p className="text-lg font-bold text-mustard">₦{pricing.hourly.toLocaleString()}/hr</p>}
      {pricing.daily && <p className="text-xl font-bold text-mustard">₦{pricing.daily.toLocaleString()}/day</p>}
      {pricing.weekly && <p className="text-sm font-bold text-mustard">₦{pricing.weekly.toLocaleString()}/wk</p>}
      {pricing.monthly && <p className="text-sm font-bold text-mustard">₦{pricing.monthly.toLocaleString()}/mo</p>}
    </div>
  );
}

function Spec({ label, children, capitalize }: { label: string; children: React.ReactNode; capitalize?: boolean }) {
  return (
    <div className="p-2.5 rounded-clay-sm bg-white border border-clay-border">
      <p className="text-text-tertiary text-[10px]">{label}</p>
      <p className={`font-semibold text-text-primary mt-0.5${capitalize ? ' capitalize' : ''}`}>{children}</p>
    </div>
  );
}

function ListingDetails({ listing, onClose, onEdit }: { listing: OwnerListing; onClose: () => void; onEdit: () => void }) {
  const loc = listing.location || {};
  const address = listing.address || loc.address || '';
  const city = listing.city || loc.city || '';
  const stateOrArea = listing.areaCluster || listing.state || loc.state || '';
  const landmark = listing.landmark || loc.landmark || '';
  const fullAddress = [address, city, stateOrArea].filter(Boolean).join(', ');
  const mapQuery = [address, city, landmark, stateOrArea].filter(Boolean).join(' ') || listing.title || '';
  const rawStatus = (listing.status || 'active').toLowerCase();
  const statusText = rawStatus.replace(/_/g, ' ').toUpperCase();
  const statusVariant = rawStatus === 'active' ? 'success' : rawStatus === 'fully_booked' ? 'default' : 'warning';
  const typeValue = listing.propertyType || listing.type;
  const propTypeLabel = propertyTypes.find(p => p.value === typeValue)?.label || (typeValue || 'Residential').replace(/_/g, ' ');
  const period = listing.duration === 'monthly' ? 'month' : listing.duration === 'weekly' ? 'week' : listing.duration === 'daily' ? 'day' : 'year';

  return (
    <div className="space-y-5">
      {listing.images?.length > 0 && (
        <div className="relative w-full h-56 flex overflow-x-auto snap-x snap-mandatory rounded-clay-sm scrollbar-hide border border-clay-border bg-black/5">
          {listing.images.map((url: string, index: number) => (
            <div key={index} className="w-full flex-none snap-center h-full">
              {url.match(/\.(mp4|mov|webm)$/i) ? (
                <video src={url} controls className="w-full h-full object-cover" />
              ) : (
                <img src={url} alt={`${listing.title} ${index + 1}`} className="w-full h-full object-cover" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Status and Price Banner */}
      <div className="flex items-center justify-between gap-3 p-3.5 bg-mustard-pale/30 rounded-clay-sm border border-mustard/20 flex-wrap">
        <div className="flex items-center gap-2">
          <StatusBadge variant={statusVariant}>{statusText}</StatusBadge>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-pill bg-white border border-clay-border text-text-secondary capitalize">{propTypeLabel}</span>
        </div>
        <div>
          {listing.propertyType === 'shortlet' && listing.shortletPricing ? (
            <ShortletPrices pricing={listing.shortletPricing} compact={false} />
          ) : (
            <div className="text-right">
              <p className="text-2xl font-black text-mustard leading-none">{formatCurrency(listing.rentAnnual)}</p>
              <span className="text-[11px] font-medium text-text-tertiary">/{period}</span>
            </div>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">Description</p>
        <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line bg-white p-3 rounded-clay-sm border border-clay-border">
          {listing.description || 'No description provided.'}
        </p>
      </div>

      {/* Location Card */}
      <div className="p-3.5 bg-clay-border-light/40 rounded-clay-sm border border-clay-border space-y-2">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-mustard shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-text-primary">{fullAddress || landmark || listing.areaCluster || 'Location available on inspection'}</p>
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

      <div>
        <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Key Specifications</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <Spec label="Furnishing" capitalize>{(listing.furnishing || 'unfurnished').replace(/_/g, ' ')}</Spec>
          <Spec label="Power Supply" capitalize>{(listing.power || 'constant').replace(/_/g, ' ')}</Spec>
          <Spec label="Water Supply" capitalize>{(listing.water || 'borehole').replace(/_/g, ' ')}</Spec>
          <Spec label="Max Occupants">{listing.maxOccupants || 1} person{(listing.maxOccupants || 1) > 1 ? 's' : ''}</Spec>
          {listing.cautionFee !== undefined && Number(listing.cautionFee) > 0 && <Spec label="Caution Fee">{formatCurrency(Number(listing.cautionFee))}</Spec>}
          {listing.agencyFee !== undefined && Number(listing.agencyFee) > 0 && <Spec label="Agency Fee">{formatCurrency(Number(listing.agencyFee))}</Spec>}
          {listing.leaseDuration && <Spec label="Lease Duration" capitalize>{listing.leaseDuration}</Spec>}
          {listing.genderRestriction && listing.genderRestriction !== 'any' && (
            <Spec label="Gender Preference" capitalize>{listing.genderRestriction.replace(/_/g, ' ')}</Spec>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Amenities & Features</p>
        {listing.amenities && listing.amenities.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {listing.amenities.map((a: string) => (
              <span key={a} className="px-3 py-1 bg-white border border-clay-border text-xs font-medium rounded-pill shadow-xs text-text-primary">{a}</span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-text-tertiary italic">Standard amenities included. Contact agent for custom details.</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-clay-border">
        {[['Views', listing.views], ['Saves', listing.saves], ['Inquiries', listing.inquiries]].map(([label, value]) => (
          <div key={label} className="text-center p-2 rounded-clay-sm bg-white border border-clay-border/50">
            <p className="text-lg font-black text-text-primary">{value || 0}</p>
            <p className="text-[11px] font-medium text-text-tertiary">{label}</p>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-clay-border flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
        <Button variant="primary" size="sm" onClick={onEdit}>
          <Edit className="w-3.5 h-3.5 mr-1" /> Edit Listing
        </Button>
      </div>
    </div>
  );
}

function EditListingFields({ form, setForm }: { form: EditForm; setForm: (form: EditForm) => void }) {
  const field = (key: keyof EditForm) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, [key]: e.target.value }),
  });
  const check = (key: 'petsAllowed' | 'smokingAllowed' | 'studentsOnly', label: string) => (
    <label className="flex items-center gap-2 text-xs font-medium text-text-secondary cursor-pointer">
      <input type="checkbox" checked={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} className="rounded text-mustard focus:ring-mustard" />
      <span>{label}</span>
    </label>
  );
  const label = 'block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5';
  const toggleAmenity = (amenity: string) =>
    setForm({ ...form, amenities: form.amenities.includes(amenity) ? form.amenities.filter(a => a !== amenity) : [...form.amenities, amenity] });

  return (
    <>
      <div>
        <label className={label}>Property Title</label>
        <input type="text" {...field('title')} placeholder="e.g., Spacious 2-Bedroom Flat with Generator Backup" className="clay-input w-full" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={label}>Property Type</label>
          <select {...field('propertyType')} className="clay-input w-full">
            {propertyTypes.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Annual Rent (₦) *</label>
          <input type="number" {...field('rentAnnual')} placeholder="400000" className="clay-input w-full font-bold text-mustard" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className={label}>Caution Fee (₦)</label>
          <input type="number" {...field('cautionFee')} placeholder="50000" className="clay-input w-full" />
        </div>
        <div>
          <label className={label}>Agency Fee (₦)</label>
          <input type="number" {...field('agencyFee')} placeholder="40000" className="clay-input w-full" />
        </div>
        <div>
          <label className={label}>Service Charge (₦)</label>
          <input type="number" {...field('serviceCharge')} placeholder="0" className="clay-input w-full" />
        </div>
      </div>

      <div>
        <label className={label}>Description</label>
        <textarea {...field('description')} placeholder="Describe the property highlights, layout, and nearby attractions..." className="clay-input w-full h-24 resize-none" />
      </div>

      <div>
        <label className={label}>Street Address</label>
        <input type="text" {...field('address')} placeholder="e.g., 45 Commercial Avenue, Sabo" className="clay-input w-full" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className={label}>City</label>
          <input type="text" {...field('city')} placeholder="Ibadan" className="clay-input w-full" />
        </div>
        <div>
          <label className={label}>State / Area</label>
          <input type="text" {...field('state')} placeholder="Oyo" className="clay-input w-full" />
        </div>
        <div>
          <label className={label}>Landmark</label>
          <input type="text" {...field('landmark')} placeholder="e.g. Opposite Sabo Market" className="clay-input w-full" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className={label}>Furnishing</label>
          <select {...field('furnishing')} className="clay-input w-full">
            <option value="unfurnished">Unfurnished</option>
            <option value="semi_furnished">Semi Furnished</option>
            <option value="fully_furnished">Fully Furnished</option>
          </select>
        </div>
        <div>
          <label className={label}>Power Supply</label>
          <select {...field('power')} className="clay-input w-full">
            <option value="constant">Constant (24/7)</option>
            <option value="gen_dependent">Gen Dependent</option>
            <option value="solar_backed">Solar Backed</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
        <div>
          <label className={label}>Water Source</label>
          <select {...field('water')} className="clay-input w-full">
            <option value="borehole">Borehole</option>
            <option value="public">Public Water</option>
            <option value="tank">Water Tank</option>
          </select>
        </div>
        <div>
          <label className={label}>Max Occupants</label>
          <input type="number" min="1" max="20" {...field('maxOccupants')} className="clay-input w-full" />
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
              className={`px-3 py-1.5 rounded-pill text-xs font-medium transition-all ${form.amenities.includes(amenity)
                ? 'bg-mustard text-white shadow-sm font-semibold'
                : 'bg-clay-border-light text-text-secondary hover:bg-mustard-pale'
                }`}
            >
              {form.amenities.includes(amenity) ? `✓ ${amenity}` : `+ ${amenity}`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-6 pt-2 border-t border-clay-border">
        {check('petsAllowed', 'Pets Allowed')}
        {check('smokingAllowed', 'Smoking Allowed')}
        {check('studentsOnly', 'Students Only')}
      </div>
    </>
  );
}

export function OwnerListingsPage({ role }: { role: OwnerRole }) {
  const api = ownerApi(role);
  const navigate = useNavigate();
  const [filter, setFilter] = useState<ListingFilter>('all');
  const [typeFilter, setTypeFilter] = useState('all');
  // QA-AGT-023: the header search routes here with ?search=<term>.
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [listings, setListings] = useState<OwnerListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [viewing, setViewing] = useState<OwnerListing | null>(null);
  const [editing, setEditing] = useState<OwnerListing | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(() => toEditForm({} as OwnerListing));
  const [savingEdit, setSavingEdit] = useState(false);
  const [rentedTarget, setRentedTarget] = useState<OwnerListing | null>(null);
  const [rentedReason, setRentedReason] = useState<MarkRentedReason>('rented_off_platform');
  const [markingRented, setMarkingRented] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<OwnerListing | null>(null);
  const [deletingPermanently, setDeletingPermanently] = useState(false);

  useEffect(() => {
    fetchListings();
  }, [filter, searchQuery]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchListings = async () => {
    setLoading(true);
    const response = await api.getListings({
      ...(filter !== 'all' ? { status: filter } : {}),
      ...(searchQuery ? { search: searchQuery } : {}),
    });
    if (response.success) {
      setListings(response.data.listings);
    } else {
      showToast(response.error.message, 'error');
    }
    setLoading(false);
  };

  /** Runs an action, toasts its outcome, and refreshes the grid on success. */
  const act = async (run: () => Promise<{ success: boolean; error?: { message: string } }>, success: string): Promise<boolean> => {
    const result = await run();
    if (result.success) {
      showToast(success, 'success');
      fetchListings();
      return true;
    }
    showToast(result.error?.message || 'Something went wrong', 'error');
    return false;
  };

  const handleView = async (listing: OwnerListing) => {
    setViewing(listing);
    const res = await api.getListing(listing._id);
    // The grid row is already on screen; a failed detail fetch just leaves it there.
    if (res.success) setViewing(prev => (prev && prev._id === listing._id ? { ...prev, ...res.data } : prev));
  };

  const handleOpenEdit = (listing: OwnerListing) => {
    setEditing(listing);
    setEditForm(toEditForm(listing));
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    if (!editForm.title.trim()) return showToast('Listing title is required', 'error');
    if (!editForm.rentAnnual || Number(editForm.rentAnnual) <= 0) return showToast('A valid annual rent is required', 'error');
    setSavingEdit(true);
    const ok = await act(() => api.updateListing(editing._id, toUpdatePayload(editForm)), 'Listing updated successfully!');
    if (ok) setEditing(null);
    setSavingEdit(false);
  };

  const handleConfirmMarkRented = async () => {
    if (!rentedTarget) return;
    setMarkingRented(true);
    const result = await api.markListingRented(rentedTarget._id, rentedReason);
    if (result.success) {
      showToast(
        result.data.pointsAwarded
          ? `Listing marked as rented! 1 listing slot freed up (+${result.data.pointsAwarded} reward points earned).`
          : 'Listing marked as rented and slot released!',
        'success'
      );
      setRentedTarget(null);
      fetchListings();
    } else {
      showToast(result.error.message, 'error');
    }
    setMarkingRented(false);
  };

  const handleConfirmPermanentDelete = async () => {
    if (!deleteTarget) return;
    setDeletingPermanently(true);
    const ok = await act(() => api.deleteListing(deleteTarget._id, true), 'Listing permanently deleted.');
    if (ok) setDeleteTarget(null);
    setDeletingPermanently(false);
  };

  const visibleListings = typeFilter === 'all' ? listings : listings.filter(l => (l.propertyType || l.type) === typeFilter);
  const copy = PAGE_COPY[role];

  return (
    <AppLayout role={role} title={copy.title} subtitle={copy.subtitle}>
      {toast && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-clay-sm shadow-clay z-50 ${toast.type === 'success' ? 'bg-status-success text-white' : 'bg-status-error text-white'}`}>
          {toast.message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search01Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input type="text" placeholder="Search listings..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="clay-input w-full pl-11" />
        </div>
        <div className="flex gap-2">
          <select className="clay-input" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All Types</option>
            {propertyTypes.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <Button variant="primary" onClick={() => navigate(`/${role}/create-listing`)}>
            <PlusSignIcon className="w-4 h-4 mr-2" /> Add Listing
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {(['all', 'active', 'fully_booked', 'archived'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-pill text-sm font-medium transition-all ${filter === f ? 'bg-burnt-brown text-white' : 'bg-white text-text-secondary hover:bg-clay-border-light'}`}
          >
            {f === 'fully_booked' ? 'Occupied' : f === 'archived' ? 'Archived / Inactive' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loading02Icon className="w-8 h-8 animate-spin text-mustard" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleListings.length > 0 ? (
            visibleListings.map(listing => {
              const city = listing.location?.city || listing.areaCluster || listing.city || '';
              const state = listing.location?.state || listing.state || '';
              const isFullyBooked = listing.status === 'fully_booked';
              const isShortlet = listing.propertyType?.toLowerCase() === 'shortlet';
              return (
                <ClayCard key={listing._id} hover={!isFullyBooked} className={`overflow-hidden ${isFullyBooked ? 'opacity-60 grayscale' : ''}`}>
                  <div className="relative h-56">
                    {listing.images?.[0] ? (
                      <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-clay-border-light flex items-center justify-center">
                        <Home01Icon className="w-8 h-8 text-text-tertiary" />
                      </div>
                    )}
                    {/* Progressive Gradient Fade to White */}
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/80 to-transparent z-0"></div>
                    <div className="absolute top-3 right-3 z-10">
                      <StatusBadge variant={listing.status === 'active' ? 'success' : 'warning'}>{statusLabel(listing.status)}</StatusBadge>
                    </div>
                  </div>
                  <div className="relative z-10 p-4 -mt-6">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-text-primary truncate">{listing.title}</h3>
                        <p className="text-xs text-text-tertiary">{[city, state].filter(Boolean).join(', ') || '—'}</p>
                      </div>
                      {isShortlet && listing.shortletPricing ? (
                        <ShortletPrices pricing={listing.shortletPricing} compact />
                      ) : (
                        <p className="text-lg font-bold text-mustard">{formatCurrency(listing.rentAnnual)}</p>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary line-clamp-2 mb-3">{listing.description}</p>
                    <div className="flex items-center gap-4 text-xs text-text-tertiary">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {listing.views || listing.interestCount || 0}</span>
                      <span className="flex items-center gap-1"><FavouriteIcon className="w-3 h-3" /> {listing.saves || 0}</span>
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
                          onClick={() => { setRentedTarget(listing); setRentedReason('rented_off_platform'); }}
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
                            onClick={() => act(() => api.restoreListing(listing._id), 'Listing restored and published back online!')}
                            className="bg-burnt-brown hover:bg-burnt-brown/90 text-white text-xs px-2.5 py-1.5 rounded-clay-sm"
                            title="Restore and relist this property"
                          >
                            Restore
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setDeleteTarget(listing)}
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
                          // Safe soft delete: moves to archive so the owner keeps details & photos.
                          onClick={() => act(() => api.deleteListing(listing._id, false), 'Listing moved to your Archive. You can view or restore it anytime.')}
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

      <Modal isOpen={!!viewing} onClose={() => setViewing(null)} title={viewing?.title || 'Listing Details'} size="lg">
        {viewing && (
          <ListingDetails
            listing={viewing}
            onClose={() => setViewing(null)}
            onEdit={() => { const target = viewing; setViewing(null); handleOpenEdit(target); }}
          />
        )}
      </Modal>

      <Modal isOpen={!!rentedTarget} onClose={() => !markingRented && setRentedTarget(null)} title="Mark Property as Rented / Taken" size="md">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Taking down <strong className="text-text-primary">"{rentedTarget?.title}"</strong> immediately removes it from public search and frees up <strong>1 active listing slot</strong> on your plan. All photos and details remain saved safely in your Archive.
          </p>
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Where was this property rented?</label>
            <div className="space-y-2">
              {RENTED_REASONS.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-start gap-3 p-3 rounded-clay-sm border cursor-pointer transition-all ${rentedReason === opt.id ? 'border-emerald-500 bg-emerald-50/50' : 'border-clay-border-light hover:bg-clay-border-light/30'}`}
                >
                  <input
                    type="radio"
                    name="rentedReason"
                    value={opt.id}
                    checked={rentedReason === opt.id}
                    onChange={() => setRentedReason(opt.id)}
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
            <Button variant="secondary" className="flex-1" onClick={() => setRentedTarget(null)} disabled={markingRented}>Cancel</Button>
            <Button variant="primary" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleConfirmMarkRented} loading={markingRented}>
              Confirm & Delist
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => !deletingPermanently && setDeleteTarget(null)} title="Permanently Delete Property?" size="md">
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
            Are you sure you want to permanently delete <strong className="text-text-primary">"{deleteTarget?.title}"</strong>?
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteTarget(null)} disabled={deletingPermanently}>Cancel</Button>
            <Button variant="primary" className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={handleConfirmPermanentDelete} loading={deletingPermanently}>
              Yes, Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!editing} onClose={() => !savingEdit && setEditing(null)} title="Edit Listing & Pricing" size="lg">
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-clay-sm text-xs text-amber-800 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-amber-900">
              <span>⚖️</span>
              <span>Pricing & Listing Update Policy</span>
            </p>
            <p className="text-[11px] leading-relaxed">
              You are legally and commercially permitted to adjust asking rent and fees for vacant or relisted properties. Price updates immediately apply to public searches and new applicants. Under Nigerian tenancy regulations, price increases cannot alter active, binding leases without tenant consent.
            </p>
          </div>

          <EditListingFields form={editForm} setForm={setEditForm} />

          <div className="flex gap-3 pt-3 border-t border-clay-border">
            <Button variant="secondary" className="flex-1" onClick={() => setEditing(null)} disabled={savingEdit}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={handleSaveEdit} loading={savingEdit}>
              {savingEdit ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
