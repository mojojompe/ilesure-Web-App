import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, MapPin, DollarSign, Building, Sofa, Zap, Wifi, Shield, Camera, ArrowRight, ArrowLeft, Check, Upload, X } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../../components/ui/Button';
import { AppLayout } from '../../components/layout/AppLayout';

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

interface ListingFormData {
  title: string;
  description: string;
  address: string;
  area: string;
  distanceFromSchool: DistanceFromSchool;
  annualRent: string;
  cautionFee: string;
  agencyFee: string;
  propertyType: PropertyType;
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
}

const initialFormData: ListingFormData = {
  title: '',
  description: '',
  address: '',
  area: '',
  distanceFromSchool: 'close',
  annualRent: '',
  cautionFee: '',
  agencyFee: '',
  propertyType: 'selfcon',
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
};

export function AgentCreateListingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ListingFormData>(initialFormData);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof ListingFormData, value: ListingFormData[keyof ListingFormData]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleToggle = (field: keyof ListingFormData) => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleNext = () => {
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    navigate('/agent/listings');
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Basic Info';
      case 2: return 'Location';
      case 3: return 'Pricing';
      case 4: return 'Property Type';
      case 5: return 'Furnishing';
      case 6: return 'Utilities';
      case 7: return 'Rules';
      case 8: return 'Photos';
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
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Area</label>
        <input
          type="text"
          value={formData.area}
          onChange={e => handleChange('area', e.target.value)}
          placeholder="e.g., Gbagada, Yaba"
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

  const renderStep3 = () => (
    <div className="space-y-4">
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
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Caution Fee (Optional)</label>
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
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Agency Fee (Optional)</label>
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
  );

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
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Property Photos (6 required)</label>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-clay-sm border-2 border-dashed border-clay-border hover:border-mustard transition-colors flex items-center justify-center bg-clay-border-light cursor-pointer"
            >
              <Upload className="w-6 h-6 text-text-tertiary" />
            </div>
          ))}
        </div>
        <p className="text-xs text-text-tertiary mt-2">Click to upload photos. Include bedroom, bathroom, kitchen, living area, exterior.</p>
      </div>
    </div>
  );

  return (
    <AppLayout role="agent" title="Create Listing" subtitle={`Step ${step} of 8`}>
      <div className="max-w-lg mx-auto">
        <div className="clay-card p-6 max-h-[80vh] overflow-y-auto">
          <StepIndicator currentStep={step} totalSteps={8} />

          <h2 className="text-lg font-bold text-text-primary text-center mb-6">{getStepTitle()}</h2>

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
          {step === 6 && renderStep6()}
          {step === 7 && renderStep7()}
          {step === 8 && renderStep8()}

          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <Button type="button" variant="secondary" onClick={handleBack} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            )}
            {step < 8 ? (
              <Button type="button" variant="primary" onClick={handleNext} className="flex-1">
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button type="button" variant="primary" onClick={handleSubmit} className="flex-1" loading={loading}>
                Publish Listing
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}