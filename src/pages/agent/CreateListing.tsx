import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, MapPin, DollarSign, Building, Sofa, Zap, Wifi, Shield, Camera, ArrowRight, ArrowLeft, Check, Upload, X } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../../components/ui/Button';
import { AppLayout } from '../../components/layout/AppLayout';
import agentApi from '../../api/agent';
import { useAuth } from '../../api/authContext';

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

type PropertyType = 'selfcon' | '1bedroom' | '2bedroom' | 'miniflat' | 'studio' | 'penthouse' | 'hostel' | 'shortlet';
type GenderPreference = 'any' | 'female' | 'male';
type Furnishing = 'furnished' | 'semifurnished' | 'unfurnished';
type PowerSource = 'phcn' | 'generator' | 'solar' | 'hybrid';
type WaterSource = 'borehole' | 'public' | 'tank';
type DistanceFromSchool = 'veryclose' | 'close' | 'budget';
type PaymentFrequency = 'annually' | 'bi-annually' | 'quarterly' | 'monthly' | 'custom';

const propertyTypes: { value: PropertyType; label: string }[] = [
  { value: 'selfcon', label: 'Self-con' },
  { value: '1bedroom', label: '1-Bedroom' },
  { value: '2bedroom', label: '2-Bedroom' },
  { value: 'miniflat', label: 'Mini Flat' },
  { value: 'studio', label: 'Studio' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'hostel', label: 'Hostel Room' },
  { value: 'shortlet', label: 'Shortlet' },
];

const distanceOptions: { value: DistanceFromSchool; label: string }[] = [
  { value: 'veryclose', label: 'Very Close' },
  { value: 'close', label: 'Close' },
  { value: 'budget', label: 'Budget Stretch' },
];

const paymentFrequencyOptions: { value: PaymentFrequency; label: string }[] = [
  { value: 'annually', label: 'Yearly' },
  { value: 'bi-annually', label: 'Bi-annually' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom' },
];

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
  shortletHourly: string;
  shortletDaily: string;
  shortletWeekly: string;
  shortletMonthly: string;
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
  duration: string;
  isRecurring: boolean;
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
  propertyType: 'selfcon',
  shortletHourly: '',
  shortletDaily: '',
  shortletWeekly: '',
  shortletMonthly: '',
  minStay: '',
  minStayUnit: 'day',
  maxStay: '',
  maxStayUnit: 'month',
  maxOccupants: '1',
  gender: 'any',
  furnishing: 'unfurnished',
  power: 'phcn',
  water: 'public',
  hasWifi: false,
  hasParking: false,
  hasSecurity: false,
  petsAllowed: false,
  smokingAllowed: false,
  studentsOnly: false,
  photos: [],
  duration: 'yearly',
  isRecurring: false,
};

export function AgentCreateListingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ListingFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof ListingFormData, value: ListingFormData[keyof ListingFormData]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleToggle = (field: keyof ListingFormData) => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
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
    try {
      setLoading(true);
      const apiData = {
        title: formData.title,
        description: formData.description,
        propertyType: formData.propertyType,
        rentAnnual: formData.propertyType === 'shortlet'
          ? (formData.shortletMonthly ? Number(formData.shortletMonthly) * 12 : 0)
          : Number(formData.annualRent),
        cautionFee: formData.cautionFee ? Number(formData.cautionFee) : undefined,
        agencyFee: formData.agencyFee ? Number(formData.agencyFee) : undefined,
        paymentFrequency: formData.paymentFrequency,
        customPaymentPlan: formData.paymentFrequency === 'custom' ? {
          installments: Number(formData.customInstallments),
          interval: formData.customInterval,
          amountPerInstallment: Number(formData.customAmountPerInstallment),
        } : undefined,
        duration: formData.duration,
        isRecurring: formData.isRecurring,
        additionalNotes: formData.additionalNotes || undefined,
        shortletPricing: formData.propertyType === 'shortlet' ? {
          ...(formData.shortletHourly ? { hourly: Number(formData.shortletHourly) } : {}),
          ...(formData.shortletDaily ? { daily: Number(formData.shortletDaily) } : {}),
          ...(formData.shortletWeekly ? { weekly: Number(formData.shortletWeekly) } : {}),
          ...(formData.shortletMonthly ? { monthly: Number(formData.shortletMonthly) } : {}),
        } : undefined,
        minStay: formData.minStay ? Number(formData.minStay) : undefined,
        minStayUnit: formData.minStay ? formData.minStayUnit : undefined,
        maxStay: formData.maxStay ? Number(formData.maxStay) : undefined,
        maxStayUnit: formData.maxStay ? formData.maxStayUnit : undefined,
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
      };
      const response = await agentApi.createListing(apiData);
      if (response.success) {
        const listing = (response as any).data;
        const listingId = listing?._id || listing?.id;

        if (listingId && photoFiles.length > 0) {
          setUploading(true);
          const fd = new FormData();
          photoFiles.forEach(file => fd.append('images', file));
          await agentApi.uploadImages(listingId, fd);
        }

        navigate('/agent/listings');
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
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type="text"
            value={formData.address}
            onChange={e => handleChange('address', e.target.value)}
            placeholder="Street address"
            className="clay-input w-full pl-11"
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
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Distance from School</label>
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
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Shortlet Pricing</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1">Hourly (₦)</label>
                <input type="number" value={formData.shortletHourly} onChange={e => handleChange('shortletHourly', e.target.value)} placeholder="10000" className="clay-input w-full" />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Daily (₦)</label>
                <input type="number" value={formData.shortletDaily} onChange={e => handleChange('shortletDaily', e.target.value)} placeholder="150000" className="clay-input w-full" />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Weekly (₦)</label>
                <input type="number" value={formData.shortletWeekly} onChange={e => handleChange('shortletWeekly', e.target.value)} placeholder="700000" className="clay-input w-full" />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Monthly (₦)</label>
                <input type="number" value={formData.shortletMonthly} onChange={e => handleChange('shortletMonthly', e.target.value)} placeholder="2500000" className="clay-input w-full" />
              </div>
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
          {(['any', 'female', 'male'] as const).map(g => (
            <button
              key={g}
              type="button"
              onClick={() => handleChange('gender', g)}
              className={clsx(
                'py-3 rounded-clay-sm border-2 text-sm font-medium transition-all capitalize',
                formData.gender === g
                  ? 'border-mustard bg-mustard-pale text-mustard'
                  : 'border-clay-border text-text-secondary hover:border-mustard'
              )}
            >
              {g === 'any' ? 'Any' : g === 'female' ? 'Female Only' : 'Male Only'}
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
          {(['furnished', 'semifurnished', 'unfurnished'] as const).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => handleChange('furnishing', f)}
              className={clsx(
                'py-3 rounded-clay-sm border-2 text-sm font-medium transition-all capitalize',
                formData.furnishing === f
                  ? 'border-mustard bg-mustard-pale text-mustard'
                  : 'border-clay-border text-text-secondary hover:border-mustard'
              )}
            >
              {f}
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
          {[{ value: 'phcn', label: 'Constant PHCN' }, { value: 'generator', label: 'Gen Backup' }, { value: 'solar', label: 'Solar-Backed' }, { value: 'hybrid', label: 'Hybrid' }].map(opt => (
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
          {[{ value: 'borehole', label: 'Borehole' }, { value: 'public', label: 'Public Supply' }, { value: 'tank', label: 'Water Tank' }].map(opt => (
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
          <div className="flex justify-between border-b border-clay-border-light pb-2"><span className="text-text-tertiary">Rent Price:</span> <span className="font-medium font-bold text-mustard">₦{Number(formData.annualRent).toLocaleString()} / {formData.duration} {formData.isRecurring ? '(Recurring)' : ''}</span></div>
          <div className="flex justify-between border-b border-clay-border-light pb-2"><span className="text-text-tertiary">Payment:</span> <span className="font-medium capitalize">{formData.paymentFrequency === 'custom' ? `${formData.customInstallments} x ₦${Number(formData.customAmountPerInstallment).toLocaleString()} (${formData.customInterval})` : formData.paymentFrequency}</span></div>
          {formData.propertyType === 'shortlet' ? (
            <div className="flex justify-between border-b border-clay-border-light pb-2"><span className="text-text-tertiary">Pricing:</span> <span className="font-medium text-right">
              {formData.shortletHourly && `₦${Number(formData.shortletHourly).toLocaleString()}/hr `}
              {formData.shortletDaily && `₦${Number(formData.shortletDaily).toLocaleString()}/day `}
              {formData.shortletWeekly && `₦${Number(formData.shortletWeekly).toLocaleString()}/wk `}
              {formData.shortletMonthly && `₦${Number(formData.shortletMonthly).toLocaleString()}/mo`}
            </span></div>
          ) : (
            <>
              <div className="flex justify-between border-b border-clay-border-light pb-2"><span className="text-text-tertiary">Rent/Year:</span> <span className="font-medium font-bold text-mustard">₦{Number(formData.annualRent).toLocaleString()}</span></div>
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
        </div>
      </div>
    </div>
  );

  if (user?.verificationStatus !== 'verified') {
    return (
      <AppLayout role="agent" title="Create Listing">
        <div className="max-w-3xl mx-auto flex flex-col items-center justify-center py-24 px-4 text-center">
          <div className="w-20 h-20 bg-status-error/10 rounded-full flex items-center justify-center mb-6">
            <Shield className="w-10 h-10 text-status-error" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-3">Verification Required</h2>
          <p className="text-text-secondary max-w-md mb-8">
            You must verify your identity before you can create and publish listings on iléSure. This helps us maintain a safe platform for all users.
          </p>
          <Button variant="primary" onClick={() => navigate('/verification/agent')}>
            Verify Identity Now
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="agent" title="Create Listing" subtitle={`Step ${step} of 9`}>
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