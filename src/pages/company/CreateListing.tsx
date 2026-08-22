import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, MapPin, DollarSign, Building, Sofa, Zap, Wifi, Shield, Camera, ArrowRight, ArrowLeft, Check, Upload, X } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../../components/ui/Button';
import { AppLayout } from '../../components/layout/AppLayout';
import companyApi from '../../api/company';
import { useAuth } from '../../api/authContext';
import { TenancyAgreementUpload } from '../../components/listing/TenancyAgreementUpload';
import type { TenancyAgreementDocument } from '../../api/agent';
import { AddressAutocomplete } from '../../components/ui/AddressAutocomplete';
import {
  propertyTypes,
  distanceOptions,
  furnishingOptions,
  powerOptions,
  waterOptions,
  genderOptions,
  PropertyType,
  Furnishing,
  PowerSource,
  WaterSource,
  GenderRestriction,
  DistanceBucket,
} from '../../constants/listingVocabulary';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-1 mb-6">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div key={i} className="flex items-center">
          <div
            className={clsx(
              'w-2 h-2 rounded-full transition-all',
              i + 1 === currentStep ? 'bg-mustard w-4' : i + 1 < currentStep ? 'bg-status-success' : 'bg-clay-border'
            )}
          />
        </div>
      ))}
    </div>
  );
}

// Enumerated values come from the shared canonical vocabulary rather than
// being redeclared per form — see constants/listingVocabulary.
type GenderPreference = GenderRestriction;
type DistanceFromSchool = DistanceBucket;
type PaymentFrequency = 'annually' | 'bi-annually' | 'quarterly' | 'monthly' | 'custom';


const paymentFrequencyOptions: { value: PaymentFrequency; label: string }[] = [
  { value: 'annually', label: 'Yearly' },
  { value: 'bi-annually', label: 'Bi-annually' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom' },
];

interface ShortletRateForm {
  id?: string;
  label: string;
  durationValue: string;
  durationUnit: 'hour' | 'day' | 'week' | 'month';
  price: string;
}

interface ListingFormData {
  title: string;
  description: string;
  additionalNotes: string;
  address: string;
  city: string;
  landmark: string;
  area: string;
  distanceFromSchool: DistanceFromSchool;
  annualRent: string;
  cautionFee: string;
  agencyFee: string;
  paymentFrequency: PaymentFrequency;
  customInstallments: string;
  customInterval: 'monthly' | 'bi-monthly';
  customAmountPerInstallment: string;
  propertyType: PropertyType;
  shortletRates: ShortletRateForm[];
  minStay: string;
  minStayUnit: 'hour' | 'day' | 'week' | 'month';
  maxStay: string;
  maxStayUnit: 'hour' | 'day' | 'week' | 'month';
  maxOccupants: string;
  gender: GenderPreference;
  furnishing: Furnishing;
  power: PowerSource;
  water: WaterSource;
  hasWifi: boolean;
  hasParking: boolean;
  hasSecurity: boolean;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  studentsOnly: boolean;
  photos: string[];
  leaseDurationValue: string;
  leaseDurationUnit: 'year' | 'month';
}

const initialFormData: ListingFormData = {
  title: '',
  description: '',
  additionalNotes: '',
  address: '',
  city: '',
  landmark: '',
  area: '',
  distanceFromSchool: 'close',
  annualRent: '',
  cautionFee: '',
  agencyFee: '',
  paymentFrequency: 'annually',
  customInstallments: '',
  customInterval: 'monthly',
  customAmountPerInstallment: '',
  propertyType: 'self_con',
  shortletRates: [],
  minStay: '',
  minStayUnit: 'day',
  maxStay: '',
  maxStayUnit: 'month',
  maxOccupants: '1',
  gender: 'any',
  furnishing: 'unfurnished',
  power: 'constant',
  water: 'public',
  hasWifi: false,
  hasParking: false,
  hasSecurity: false,
  petsAllowed: false,
  smokingAllowed: false,
  studentsOnly: false,
  photos: [],
  leaseDurationValue: '1',
  leaseDurationUnit: 'year',
};

export function CompanyCreateListingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ListingFormData>(initialFormData);
  /**
   * Coordinates from a picked address suggestion, in GeoJSON order [lng, lat].
   * Optional: with none, the backend geocodes the address fields on save.
   */
  const [pickedCoordinates, setPickedCoordinates] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  // Uploaded ahead of listing creation; the metadata rides along in the payload.
  const [tenancyAgreement, setTenancyAgreement] = useState<TenancyAgreementDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof ListingFormData, value: ListingFormData[keyof ListingFormData]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleToggle = (field: keyof ListingFormData) => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const addShortletRate = () => {
    setFormData(prev => ({
      ...prev,
      shortletRates: [...prev.shortletRates, { label: '', durationValue: '1', durationUnit: 'day', price: '' }],
    }));
  };

  const updateShortletRate = (index: number, field: keyof ShortletRateForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      shortletRates: prev.shortletRates.map((rate, i) => (i === index ? { ...rate, [field]: value } : rate)),
    }));
  };

  const removeShortletRate = (index: number) => {
    setFormData(prev => ({
      ...prev,
      shortletRates: prev.shortletRates.filter((_, i) => i !== index),
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 6 - photoFiles.length;
    setPhotoFiles(prev => [...prev, ...files.slice(0, remaining)].slice(0, 6));
    e.target.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (formData.propertyType === 'shortlet') {
      const validTiers = formData.shortletRates.filter(r => r.label.trim() && Number(r.price) > 0 && Number(r.durationValue) >= 1);
      if (validTiers.length === 0) {
        alert('Add at least one shortlet pricing tier (label, duration, and price).');
        return;
      }
    }
    try {
      setLoading(true);
      const apiData = {
        title: formData.title,
        description: formData.description,
        propertyType: formData.propertyType,
        rentAnnual: formData.propertyType === 'shortlet' ? 0 : Number(formData.annualRent),
        cautionFee: formData.cautionFee ? Number(formData.cautionFee) : undefined,
        agencyFee: formData.agencyFee ? Number(formData.agencyFee) : undefined,
        paymentFrequency: formData.paymentFrequency,
        customPaymentPlan: formData.paymentFrequency === 'custom' ? {
          installments: Number(formData.customInstallments),
          interval: formData.customInterval,
          amountPerInstallment: Number(formData.customAmountPerInstallment),
        } : undefined,
        // Lease term (regular rentals only)
        leaseDurationValue: formData.propertyType === 'shortlet' ? undefined : Number(formData.leaseDurationValue) || 1,
        leaseDurationUnit: formData.propertyType === 'shortlet' ? undefined : formData.leaseDurationUnit,
        leaseDuration: formData.propertyType === 'shortlet'
          ? undefined
          : `${Number(formData.leaseDurationValue) || 1} ${formData.leaseDurationUnit}${(Number(formData.leaseDurationValue) || 1) > 1 ? 's' : ''}`,
        additionalNotes: formData.additionalNotes || undefined,
        // Flexible custom shortlet tiers
        shortletRates: formData.propertyType === 'shortlet'
          ? formData.shortletRates
              .filter(r => r.label.trim() && Number(r.price) > 0 && Number(r.durationValue) >= 1)
              .map(r => ({
                label: r.label.trim(),
                durationValue: Number(r.durationValue),
                durationUnit: r.durationUnit,
                price: Number(r.price),
              }))
          : undefined,
        minStay: formData.minStay ? Number(formData.minStay) : undefined,
        minStayUnit: formData.minStay ? formData.minStayUnit : undefined,
        maxStay: formData.maxStay ? Number(formData.maxStay) : undefined,
        maxStayUnit: formData.maxStay ? formData.maxStayUnit : undefined,
        // Only sent when the lister picked a suggestion; otherwise the server
        // geocodes address/city/areaCluster itself.
        ...(pickedCoordinates ? { location: { type: 'Point', coordinates: pickedCoordinates } } : {}),
        address: formData.address,
        city: formData.city,
        landmark: formData.landmark,
        areaCluster: formData.area,
        distanceBucket: formData.distanceFromSchool,
        maxOccupants: Number(formData.maxOccupants),
        genderRestriction: formData.gender,
        furnishing: formData.furnishing,
        power: formData.power,
        water: formData.water,
        amenities: [
          ...(formData.hasWifi ? ['wifi'] : []),
          ...(formData.hasParking ? ['parking'] : []),
          ...(formData.hasSecurity ? ['security'] : []),
        ],
        rules: [
          ...(formData.petsAllowed ? ['pets_allowed'] : []),
          ...(formData.smokingAllowed ? ['smoking_allowed'] : []),
          ...(formData.studentsOnly ? ['students_only'] : []),
        ],
        images: [],
        tenancyAgreement,
      };
      const response = await companyApi.createListing(apiData);
      if (response.success) {
        const listingId = response.listing?._id;

        if (listingId && photoFiles.length > 0) {
          setUploading(true);
          const fd = new FormData();
          photoFiles.forEach(file => fd.append('images', file));
          await companyApi.uploadImages(listingId, fd);
        }

        navigate('/company/listings');
      }
    } catch (error: any) {
      console.error('Create listing error:', error);
      alert(error.response?.data?.error?.message || 'Failed to create listing');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Basic Info';
      case 2: return 'Location';
      case 3: return 'Property Type';
      case 4: return 'Pricing';
      case 5: return 'Furnishing';
      case 6: return 'Utilities';
      case 7: return 'Rules';
      case 8: return 'Photos';
      case 9: return 'Review & Submit';
      default: return '';
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={e => handleChange('title', e.target.value)}
          placeholder="e.g., Modern Self-con near UNILAG"
          className="clay-input w-full"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={e => handleChange('description', e.target.value)}
          placeholder="Describe your property..."
          rows={4}
          className="clay-input w-full resize-none"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Additional Notes (Optional)</label>
        <textarea
          value={formData.additionalNotes}
          onChange={e => handleChange('additionalNotes', e.target.value)}
          placeholder="Special instructions, property rules, or any extra info..."
          rows={3}
          className="clay-input w-full resize-none"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Address</label>
        <div className="relative">
          <AddressAutocomplete
            value={formData.address}
            onChange={v => handleChange('address', v)}
            onSelectCoordinates={setPickedCoordinates}
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">City</label>
        <input
          type="text"
          value={formData.city}
          onChange={e => handleChange('city', e.target.value)}
          placeholder="e.g., Ibadan"
          className="clay-input w-full"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Landmarks Around</label>
        <input
          type="text"
          value={formData.landmark}
          onChange={e => handleChange('landmark', e.target.value)}
          placeholder="e.g., Near UI Second Gate"
          className="clay-input w-full"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Area / Corridor</label>
        <input
          type="text"
          value={formData.area}
          onChange={e => handleChange('area', e.target.value)}
          placeholder="e.g., Toll Gate, Bodija"
          className="clay-input w-full"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Distance from Campus / Town Centre</label>
        <div className="grid grid-cols-3 gap-2">
          {distanceOptions.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleChange('distanceFromSchool', option.value)}
              className={clsx(
                'py-3 rounded-clay-sm border-2 text-sm font-medium transition-all',
                formData.distanceFromSchool === option.value
                  ? 'border-mustard bg-mustard-pale text-mustard'
                  : 'border-clay-border text-text-secondary hover:border-mustard'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => {
    const isShortlet = formData.propertyType === 'shortlet';
    return (
    <div className="space-y-4">
      {isShortlet ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Shortlet Pricing Tiers</p>
            <button type="button" onClick={addShortletRate} className="text-xs font-semibold text-mustard hover:underline">+ Add tier</button>
          </div>
          <p className="text-xs text-text-tertiary -mt-2">Define your priced packages, e.g. "1 Hour" ₦20,000, "Full Day" ₦100,000, "Weekend" ₦180,000. Guests pick a tier and quantity when booking.</p>
          {formData.shortletRates.length === 0 && (
            <div className="text-center py-4 border-2 border-dashed border-clay-border rounded-clay-sm text-xs text-text-tertiary">
              No pricing tiers yet. Tap "+ Add tier" to create one.
            </div>
          )}
          <div className="space-y-3">
            {formData.shortletRates.map((rate, index) => (
              <div key={index} className="p-3 border-2 border-clay-border rounded-clay-sm space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={rate.label}
                    onChange={e => updateShortletRate(index, 'label', e.target.value)}
                    placeholder="Tier name (e.g. Full Day)"
                    className="clay-input flex-1"
                  />
                  <button type="button" onClick={() => removeShortletRate(index)} className="text-xs font-semibold text-red-500 hover:underline flex-shrink-0">Remove</button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Every</label>
                    <input type="number" min="1" value={rate.durationValue} onChange={e => updateShortletRate(index, 'durationValue', e.target.value)} placeholder="1" className="clay-input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Unit</label>
                    <select value={rate.durationUnit} onChange={e => updateShortletRate(index, 'durationUnit', e.target.value)} className="clay-input w-full">
                      <option value="hour">Hour(s)</option>
                      <option value="day">Day(s)</option>
                      <option value="week">Week(s)</option>
                      <option value="month">Month(s)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Price (₦)</label>
                    <input type="number" value={rate.price} onChange={e => updateShortletRate(index, 'price', e.target.value)} placeholder="100000" className="clay-input w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-secondary mb-1">Min Stay</label>
              <div className="flex gap-2">
                <input type="number" value={formData.minStay} onChange={e => handleChange('minStay', e.target.value)} placeholder="1" className="clay-input w-20 flex-shrink-0" />
                <select value={formData.minStayUnit} onChange={e => handleChange('minStayUnit', e.target.value)} className="clay-input flex-1">
                  <option value="hour">Hours</option>
                  <option value="day">Days</option>
                  <option value="week">Weeks</option>
                  <option value="month">Months</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Max Stay</label>
              <div className="flex gap-2">
                <input type="number" value={formData.maxStay} onChange={e => handleChange('maxStay', e.target.value)} placeholder="12" className="clay-input w-20 flex-shrink-0" />
                <select value={formData.maxStayUnit} onChange={e => handleChange('maxStayUnit', e.target.value)} className="clay-input flex-1">
                  <option value="hour">Hours</option>
                  <option value="day">Days</option>
                  <option value="week">Weeks</option>
                  <option value="month">Months</option>
                </select>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Annual Rent (₦)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
              <input
                type="number"
                value={formData.annualRent}
                onChange={e => handleChange('annualRent', e.target.value)}
                placeholder="250000"
                className="clay-input w-full pl-11"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Lease Duration</label>
            <div className="grid grid-cols-4 gap-2">
              {['1', '2', '3', '5'].map(yrs => (
                <button
                  key={yrs}
                  type="button"
                  onClick={() => { handleChange('leaseDurationValue', yrs); handleChange('leaseDurationUnit', 'year'); }}
                  className={clsx(
                    'py-3 rounded-clay-sm border-2 text-sm font-medium transition-all',
                    formData.leaseDurationUnit === 'year' && formData.leaseDurationValue === yrs
                      ? 'border-mustard bg-mustard-pale text-mustard'
                      : 'border-clay-border text-text-secondary hover:border-mustard'
                  )}
                >
                  {yrs} yr{Number(yrs) > 1 ? 's' : ''}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <input
                type="number"
                min="1"
                value={formData.leaseDurationValue}
                onChange={e => handleChange('leaseDurationValue', e.target.value)}
                placeholder="Custom"
                className="clay-input w-24 flex-shrink-0"
              />
              <select value={formData.leaseDurationUnit} onChange={e => handleChange('leaseDurationUnit', e.target.value)} className="clay-input flex-1">
                <option value="year">Year(s)</option>
                <option value="month">Month(s)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Payment Frequency</label>
            <div className="grid grid-cols-2 gap-2">
              {paymentFrequencyOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange('paymentFrequency', option.value)}
                  className={clsx(
                    'py-3 rounded-clay-sm border-2 text-sm font-medium transition-all',
                    formData.paymentFrequency === option.value
                      ? 'border-mustard bg-mustard-pale text-mustard'
                      : 'border-clay-border text-text-secondary hover:border-mustard'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {formData.paymentFrequency === 'custom' && (
              <div className="mt-3 space-y-3 p-3 border-2 border-mustard rounded-clay-sm bg-mustard-pale/30">
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Custom Payment Plan</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Number of Installments</label>
                    <input type="number" value={formData.customInstallments} onChange={e => handleChange('customInstallments', e.target.value)} placeholder="6" className="clay-input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Interval</label>
                    <select value={formData.customInterval} onChange={e => handleChange('customInterval', e.target.value)} className="clay-input w-full">
                      <option value="monthly">Monthly</option>
                      <option value="bi-monthly">Bi-monthly</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Amount per Installment (₦)</label>
                  <input type="number" value={formData.customAmountPerInstallment} onChange={e => handleChange('customAmountPerInstallment', e.target.value)} placeholder="50000" className="clay-input w-full" />
                </div>
              </div>
            )}
          </div>
        </>
      )}
      <div className="border-t border-clay-border-light pt-4">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Fees</p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-text-secondary mb-1">Caution Fee (Optional)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
              <input
                type="number"
                value={formData.cautionFee}
                onChange={e => handleChange('cautionFee', e.target.value)}
                placeholder="50000"
                className="clay-input w-full pl-11"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">Agency Fee (Optional)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
              <input
                type="number"
                value={formData.agencyFee}
                onChange={e => handleChange('agencyFee', e.target.value)}
                placeholder="25000"
                className="clay-input w-full pl-11"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  };

  const renderStep4 = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Property Type</label>
        <div className="grid grid-cols-2 gap-2">
          {propertyTypes.map(type => (
            <button
              key={type.value}
              type="button"
              onClick={() => handleChange('propertyType', type.value)}
              className={clsx(
                'py-3 rounded-clay-sm border-2 text-sm font-medium transition-all',
                formData.propertyType === type.value
                  ? 'border-mustard bg-mustard-pale text-mustard'
                  : 'border-clay-border text-text-secondary hover:border-mustard'
              )}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Max Occupants</label>
        <input
          type="number"
          value={formData.maxOccupants}
          onChange={e => handleChange('maxOccupants', e.target.value)}
          placeholder="1"
          className="clay-input w-full"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Gender Preference</label>
        <div className="grid grid-cols-3 gap-2">
          {genderOptions.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleChange('gender', opt.value)}
              className={clsx(
                'py-3 rounded-clay-sm border-2 text-sm font-medium transition-all',
                formData.gender === opt.value
                  ? 'border-mustard bg-mustard-pale text-mustard'
                  : 'border-clay-border text-text-secondary hover:border-mustard'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Furnishing Status</label>
        <div className="grid grid-cols-3 gap-2">
          {furnishingOptions.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleChange('furnishing', opt.value)}
              className={clsx(
                'py-3 rounded-clay-sm border-2 text-sm font-medium transition-all',
                formData.furnishing === opt.value
                  ? 'border-mustard bg-mustard-pale text-mustard'
                  : 'border-clay-border text-text-secondary hover:border-mustard'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Power Source</label>
        <div className="grid grid-cols-2 gap-2">
          {powerOptions.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleChange('power', opt.value as PowerSource)}
              className={clsx(
                'py-3 rounded-clay-sm border-2 text-sm font-medium transition-all',
                formData.power === opt.value
                  ? 'border-mustard bg-mustard-pale text-mustard'
                  : 'border-clay-border text-text-secondary hover:border-mustard'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Water Source</label>
        <div className="grid grid-cols-3 gap-2">
          {waterOptions.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleChange('water', opt.value as WaterSource)}
              className={clsx(
                'py-3 rounded-clay-sm border-2 text-sm font-medium transition-all',
                formData.water === opt.value
                  ? 'border-mustard bg-mustard-pale text-mustard'
                  : 'border-clay-border text-text-secondary hover:border-mustard'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Amenities</label>
        <div className="space-y-2">
          {[
            { key: 'hasWifi', label: 'WiFi' },
            { key: 'hasParking', label: 'Parking' },
            { key: 'hasSecurity', label: '24hr Security' },
          ].map(amenity => (
            <button
              key={amenity.key}
              type="button"
              onClick={() => handleToggle(amenity.key as keyof ListingFormData)}
              className={clsx(
                'w-full flex items-center justify-between p-3 rounded-clay-sm border-2 transition-all',
                formData[amenity.key as keyof ListingFormData]
                  ? 'border-mustard bg-mustard-pale'
                  : 'border-clay-border'
              )}
            >
              <span className="text-sm font-medium text-text-primary">{amenity.label}</span>
              <div
                className={clsx(
                  'w-5 h-5 rounded-full flex items-center justify-center',
                  formData[amenity.key as keyof ListingFormData] ? 'bg-mustard' : 'bg-clay-border'
                )}
              >
                {formData[amenity.key as keyof ListingFormData] && <Check className="w-3 h-3 text-white" />}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep7 = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">House Rules</label>
        <div className="space-y-2">
          {[
            { key: 'petsAllowed', label: 'Pets Allowed' },
            { key: 'smokingAllowed', label: 'Smoking Allowed' },
            { key: 'studentsOnly', label: 'Students Only' },
          ].map(rule => (
            <button
              key={rule.key}
              type="button"
              onClick={() => handleToggle(rule.key as keyof ListingFormData)}
              className={clsx(
                'w-full flex items-center justify-between p-3 rounded-clay-sm border-2 transition-all',
                formData[rule.key as keyof ListingFormData]
                  ? 'border-mustard bg-mustard-pale'
                  : 'border-clay-border'
              )}
            >
              <span className="text-sm font-medium text-text-primary">{rule.label}</span>
              <div
                className={clsx(
                  'w-5 h-5 rounded-full flex items-center justify-center',
                  formData[rule.key as keyof ListingFormData] ? 'bg-mustard' : 'bg-clay-border'
                )}
              >
                {formData[rule.key as keyof ListingFormData] && <Check className="w-3 h-3 text-white" />}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep8 = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Property Photos ({photoFiles.length}/6)</label>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => {
            const file = photoFiles[i];
            if (file) {
              return (
                <div key={i} className="aspect-square rounded-clay-sm border-2 border-clay-border overflow-hidden relative group">
                  <img src={URL.createObjectURL(file)} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(i)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              );
            }
            if (i === photoFiles.length) {
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-clay-sm border-2 border-dashed border-clay-border hover:border-mustard transition-colors flex items-center justify-center bg-clay-border-light cursor-pointer"
                >
                  <Upload className="w-6 h-6 text-text-tertiary" />
                </button>
              );
            }
            return (
              <div key={i} className="aspect-square rounded-clay-sm border-2 border-dashed border-clay-border bg-clay-border-light" />
            );
          })}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <p className="text-xs text-text-tertiary mt-2">Include bedroom, bathroom, kitchen, living area, exterior.</p>
      </div>

      <div className="pt-4 border-t border-clay-border-light">
        <TenancyAgreementUpload value={tenancyAgreement} onChange={setTenancyAgreement} />
      </div>
    </div>
  );

  const renderStep9 = () => (
    <div className="space-y-4">
      <div className="clay-card p-4 bg-clay-surface mb-4">
        <h3 className="font-bold text-text-primary mb-2">Review Your Listing</h3>
        <p className="text-sm text-text-secondary mb-4">Please review the details below before publishing.</p>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between border-b border-clay-border-light pb-2"><span className="text-text-tertiary">Title:</span> <span className="font-medium text-right max-w-[60%] truncate">{formData.title || '-'}</span></div>
          <div className="flex justify-between border-b border-clay-border-light pb-2"><span className="text-text-tertiary">Type:</span> <span className="font-medium capitalize">{formData.propertyType}</span></div>
          {formData.propertyType === 'shortlet' ? (
            <div className="flex justify-between border-b border-clay-border-light pb-2"><span className="text-text-tertiary">Pricing:</span> <span className="font-medium text-right max-w-[60%]">
              {formData.shortletRates.filter(r => r.label.trim() && Number(r.price) > 0).map(r => `${r.label}: ₦${Number(r.price).toLocaleString()}`).join(' · ') || '-'}
            </span></div>
          ) : (
            <>
              <div className="flex justify-between border-b border-clay-border-light pb-2"><span className="text-text-tertiary">Rent:</span> <span className="font-medium font-bold text-mustard">₦{Number(formData.annualRent).toLocaleString()} / {Number(formData.leaseDurationValue) || 1} {formData.leaseDurationUnit}{(Number(formData.leaseDurationValue) || 1) > 1 ? 's' : ''}</span></div>
              <div className="flex justify-between border-b border-clay-border-light pb-2"><span className="text-text-tertiary">Payment:</span> <span className="font-medium capitalize">{formData.paymentFrequency === 'custom' ? `${formData.customInstallments} x ₦${Number(formData.customAmountPerInstallment).toLocaleString()} (${formData.customInterval})` : formData.paymentFrequency}</span></div>
            </>
          )}
          <div className="flex justify-between border-b border-clay-border-light pb-2"><span className="text-text-tertiary">Location:</span> <span className="font-medium text-right max-w-[60%]">{formData.address}, {formData.area}</span></div>
          <div className="flex justify-between border-b border-clay-border-light pb-2"><span className="text-text-tertiary">Landmark:</span> <span className="font-medium text-right max-w-[60%]">{formData.landmark || '-'}</span></div>
          <div className="flex justify-between border-b border-clay-border-light pb-2"><span className="text-text-tertiary">Occupants:</span> <span className="font-medium">{formData.maxOccupants}</span></div>
          <div className="flex justify-between border-b border-clay-border-light pb-2"><span className="text-text-tertiary">Gender:</span> <span className="font-medium capitalize">{formData.gender}</span></div>
          <div className="flex justify-between border-b border-clay-border-light pb-2"><span className="text-text-tertiary">Power:</span> <span className="font-medium capitalize">{formData.power}</span></div>
          {formData.additionalNotes && (
          <div className="flex justify-between border-b border-clay-border-light pb-2"><span className="text-text-tertiary">Notes:</span> <span className="font-medium text-right max-w-[60%] truncate">{formData.additionalNotes}</span></div>
          )}
          <div className="flex justify-between"><span className="text-text-tertiary">Photos:</span> <span className="font-medium">{photoFiles.length} Added</span></div>
          <div className="flex justify-between border-t border-clay-border-light pt-2 mt-2"><span className="text-text-tertiary">Tenancy Agreement:</span> <span className="font-medium text-right max-w-[60%] truncate">{tenancyAgreement ? tenancyAgreement.fileName : 'Standard iléSure template'}</span></div>
        </div>
      </div>
    </div>
  );

  if (user?.verificationStatus !== 'verified') {
    return (
      <AppLayout role="company" title="Create Listing">
        <div className="max-w-3xl mx-auto flex flex-col items-center justify-center py-24 px-4 text-center">
          <div className="w-20 h-20 bg-status-error/10 rounded-full flex items-center justify-center mb-6">
            <Shield className="w-10 h-10 text-status-error" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-3">Verification Required</h2>
          <p className="text-text-secondary max-w-md mb-8">
            You must verify your company before you can create and publish listings on iléSure. This helps us maintain a safe platform for all users.
          </p>
          <Button variant="primary" onClick={() => navigate('/verification/company')}>
            Verify Company Now
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="company" title="Create Listing" subtitle={`Step ${step} of 9`}>
      <div className="max-w-lg mx-auto pb-12">
        <div className="clay-card p-6">
          <StepIndicator currentStep={step} totalSteps={9} />

          <h2 className="text-lg font-bold text-text-primary text-center mb-6">{getStepTitle()}</h2>

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep4()}
          {step === 4 && renderStep3()}
          {step === 5 && renderStep5()}
          {step === 6 && renderStep6()}
          {step === 7 && renderStep7()}
          {step === 8 && renderStep8()}
          {step === 9 && renderStep9()}

          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <Button type="button" variant="secondary" onClick={handleBack} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            )}
            {step < 9 ? (
              <Button type="button" variant="primary" onClick={handleNext} className="flex-1">
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button type="button" variant="primary" onClick={handleSubmit} className="flex-1" loading={loading || uploading}>
                {uploading ? 'Uploading Photos...' : 'Publish Listing'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
