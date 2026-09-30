import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Money01Icon, SecurityIcon, ArrowRight01Icon, ArrowLeft01Icon, Tick02Icon, Upload01Icon, Cancel02Icon, Loading02Icon, Alert01Icon } from '@hugeicons/react';
import { clsx } from 'clsx';
import { Button } from '../../components/ui/Button';
import { AppLayout } from '../../components/layout/AppLayout';
import { DojahKYCSection } from '../../components/kyc/DojahKYCSection';
import { TenancyAgreementUpload } from '../../components/listing/TenancyAgreementUpload';
import { AddressAutocomplete } from '../../components/ui/AddressAutocomplete';
import { useAuth } from '../../api/authContext';
import { userApi } from '../../api/user';
import type { OwnerRole } from '../../api/owner';
import { useListingWizard, type ListingWizard } from '../../hooks/useListingWizard';
import {
  paymentFrequencyOptions,
  isVerifiedToList,
  leaseLabel,
  WEEK_DAYS,
  PRESET_TIME_SLOTS,
  MAX_PHOTOS,
  type ListingFormData,
  type StayUnit,
} from '../../lib/listingWizard';
import {
  amenityOptions,
  propertyTypes,
  distanceOptions,
  furnishingOptions,
  powerOptions,
  waterOptions,
  genderOptions,
} from '../../constants/listingVocabulary';

const labelClass = 'block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2';

function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
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

/** A grid of mutually exclusive option buttons. */
function OptionGrid<V extends string>({ options, value, onChange, columns }: {
  options: readonly { value: V; label: string }[];
  value: V;
  onChange: (value: V) => void;
  columns: 2 | 3 | 4;
}) {
  return (
    <div className={clsx('grid gap-2', columns === 2 ? 'grid-cols-2' : columns === 3 ? 'grid-cols-3' : 'grid-cols-4')}>
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={clsx(
            'py-3 rounded-clay-sm border-2 text-sm font-medium transition-all',
            value === option.value ? 'border-mustard bg-mustard-pale text-mustard' : 'border-clay-border text-text-secondary hover:border-mustard'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ToggleRow({ label, selected, onClick, className }: { label: string; selected: boolean; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={clsx('flex items-center justify-between gap-2 p-3 rounded-clay-sm border-2 transition-all text-left', selected ? 'border-mustard bg-mustard-pale' : 'border-clay-border', className)}
    >
      <span className="text-sm font-medium text-text-primary">{label}</span>
      <div className={clsx('w-5 h-5 rounded-full flex items-center justify-center shrink-0', selected ? 'bg-mustard' : 'bg-clay-border')}>
        {selected && <Tick02Icon className="w-3 h-3 text-white" />}
      </div>
    </button>
  );
}

function StayUnitSelect({ value, onChange }: { value: StayUnit; onChange: (value: StayUnit) => void }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value as StayUnit)} className="clay-input flex-1">
      <option value="hour">Hours</option>
      <option value="day">Days</option>
      <option value="week">Weeks</option>
      <option value="month">Months</option>
    </select>
  );
}

function MoneyInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Money01Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
      <input type="number" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="clay-input w-full pl-11" />
    </div>
  );
}

// ---------------------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------------------

function BasicsStep({ w }: { w: ListingWizard }) {
  const { form, setField } = w;
  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Title</label>
        <input type="text" value={form.title} onChange={e => setField('title', e.target.value)} placeholder="e.g., Modern Self-con near UNILAG" className="clay-input w-full" />
      </div>
      <div>
        <label className={labelClass}>Description</label>
        <textarea value={form.description} onChange={e => setField('description', e.target.value)} placeholder="Describe your property..." rows={4} className="clay-input w-full resize-none" />
      </div>
      <div>
        <label className={labelClass}>Additional Notes (Optional)</label>
        <textarea value={form.additionalNotes} onChange={e => setField('additionalNotes', e.target.value)} placeholder="Special instructions, property rules, or any extra info..." rows={3} className="clay-input w-full resize-none" />
      </div>
    </div>
  );
}

function LocationStep({ w }: { w: ListingWizard }) {
  const { form, setField } = w;
  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Address</label>
        <div className="relative">
          <AddressAutocomplete value={form.address} onChange={v => setField('address', v)} onSelectCoordinates={w.setCoordinates} />
        </div>
      </div>
      <div>
        <label className={labelClass}>City</label>
        <input type="text" value={form.city} onChange={e => setField('city', e.target.value)} placeholder="e.g., Ibadan" className="clay-input w-full" />
      </div>
      <div>
        <label className={labelClass}>Landmarks Around</label>
        <input type="text" value={form.landmark} onChange={e => setField('landmark', e.target.value)} placeholder="e.g., Near UI Second Gate" className="clay-input w-full" />
      </div>
      <div>
        <label className={labelClass}>Area / Corridor</label>
        <input type="text" value={form.area} onChange={e => setField('area', e.target.value)} placeholder="e.g., Toll Gate, Bodija" className="clay-input w-full" />
      </div>
      <div>
        <label className={labelClass}>Distance from Campus / Town Centre</label>
        <OptionGrid options={distanceOptions} value={form.distanceFromSchool} onChange={v => setField('distanceFromSchool', v)} columns={3} />
      </div>
    </div>
  );
}

function PropertyStep({ w }: { w: ListingWizard }) {
  const { form, setField } = w;
  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Property Type</label>
        <OptionGrid options={propertyTypes} value={form.propertyType} onChange={v => setField('propertyType', v)} columns={2} />
      </div>
      <div>
        <label className={labelClass}>Max Occupants</label>
        <input type="number" value={form.maxOccupants} onChange={e => setField('maxOccupants', e.target.value)} placeholder="1" className="clay-input w-full" />
      </div>
      <div>
        <label className={labelClass}>Gender Preference</label>
        <OptionGrid options={genderOptions} value={form.gender} onChange={v => setField('gender', v)} columns={3} />
      </div>
    </div>
  );
}

function PricingStep({ w }: { w: ListingWizard }) {
  const { form, setField } = w;
  const isShortlet = form.propertyType === 'shortlet';
  return (
    <div className="space-y-4">
      {isShortlet ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Shortlet Pricing Tiers</p>
            <button type="button" onClick={w.addShortletRate} className="text-xs font-semibold text-mustard hover:underline">+ Add tier</button>
          </div>
          <p className="text-xs text-text-tertiary -mt-2">Define your priced packages, e.g. "1 Hour" ₦20,000, "Full Day" ₦100,000, "Weekend" ₦180,000. Guests pick a tier and quantity when booking.</p>
          {form.shortletRates.length === 0 && (
            <div className="text-center py-4 border-2 border-dashed border-clay-border rounded-clay-sm text-xs text-text-tertiary">
              No pricing tiers yet. Tap "+ Add tier" to create one.
            </div>
          )}
          <div className="space-y-3">
            {form.shortletRates.map((rate, index) => (
              <div key={index} className="p-3 border-2 border-clay-border rounded-clay-sm space-y-2">
                <div className="flex items-center gap-2">
                  <input type="text" value={rate.label} onChange={e => w.updateShortletRate(index, 'label', e.target.value)} placeholder="Tier name (e.g. Full Day)" className="clay-input flex-1" />
                  <button type="button" onClick={() => w.removeShortletRate(index)} className="text-xs font-semibold text-red-500 hover:underline flex-shrink-0">Remove</button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Every</label>
                    <input type="number" min="1" value={rate.durationValue} onChange={e => w.updateShortletRate(index, 'durationValue', e.target.value)} placeholder="1" className="clay-input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Unit</label>
                    <select value={rate.durationUnit} onChange={e => w.updateShortletRate(index, 'durationUnit', e.target.value)} className="clay-input w-full">
                      <option value="hour">Hour(s)</option>
                      <option value="day">Day(s)</option>
                      <option value="week">Week(s)</option>
                      <option value="month">Month(s)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Price (₦)</label>
                    <input type="number" value={rate.price} onChange={e => w.updateShortletRate(index, 'price', e.target.value)} placeholder="100000" className="clay-input w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-secondary mb-1">Min Stay</label>
              <div className="flex gap-2">
                <input type="number" value={form.minStay} onChange={e => setField('minStay', e.target.value)} placeholder="1" className="clay-input w-20 flex-shrink-0" />
                <StayUnitSelect value={form.minStayUnit} onChange={v => setField('minStayUnit', v)} />
              </div>
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Max Stay</label>
              <div className="flex gap-2">
                <input type="number" value={form.maxStay} onChange={e => setField('maxStay', e.target.value)} placeholder="12" className="clay-input w-20 flex-shrink-0" />
                <StayUnitSelect value={form.maxStayUnit} onChange={v => setField('maxStayUnit', v)} />
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div>
            <label className={labelClass}>Annual Rent (₦)</label>
            <MoneyInput value={form.annualRent} onChange={v => setField('annualRent', v)} placeholder="250000" />
          </div>
          <div>
            <label className={labelClass}>Rent Duration</label>
            <input type="text" value={form.rentDuration || ''} onChange={e => setField('rentDuration', e.target.value)} placeholder="e.g. 1 Year, 6 Months" className="clay-input w-full mb-4" />
          </div>
          <div>
            <label className={labelClass}>Lease Duration</label>
            <div className="grid grid-cols-4 gap-2">
              {['1', '2', '3', '5'].map(yrs => (
                <button
                  key={yrs}
                  type="button"
                  onClick={() => { setField('leaseDurationValue', yrs); setField('leaseDurationUnit', 'year'); }}
                  className={clsx(
                    'py-3 rounded-clay-sm border-2 text-sm font-medium transition-all',
                    form.leaseDurationUnit === 'year' && form.leaseDurationValue === yrs
                      ? 'border-mustard bg-mustard-pale text-mustard'
                      : 'border-clay-border text-text-secondary hover:border-mustard'
                  )}
                >
                  {yrs} yr{Number(yrs) > 1 ? 's' : ''}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <input type="number" min="1" value={form.leaseDurationValue} onChange={e => setField('leaseDurationValue', e.target.value)} placeholder="Custom" className="clay-input w-24 flex-shrink-0" />
              <select value={form.leaseDurationUnit} onChange={e => setField('leaseDurationUnit', e.target.value as ListingFormData['leaseDurationUnit'])} className="clay-input flex-1">
                <option value="year">Year(s)</option>
                <option value="month">Month(s)</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Payment Frequency</label>
            <OptionGrid options={paymentFrequencyOptions} value={form.paymentFrequency} onChange={v => setField('paymentFrequency', v)} columns={2} />
            {form.paymentFrequency === 'custom' && (
              <div className="mt-3 space-y-3 p-3 border-2 border-mustard rounded-clay-sm bg-mustard-pale/30">
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Custom Payment Plan</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Number of Installments</label>
                    <input type="number" value={form.customInstallments} onChange={e => setField('customInstallments', e.target.value)} placeholder="6" className="clay-input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Interval</label>
                    <select value={form.customInterval} onChange={e => setField('customInterval', e.target.value as ListingFormData['customInterval'])} className="clay-input w-full">
                      <option value="monthly">Monthly</option>
                      <option value="bi-monthly">Bi-monthly</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Amount per Installment (₦)</label>
                  <input type="number" value={form.customAmountPerInstallment} onChange={e => setField('customAmountPerInstallment', e.target.value)} placeholder="50000" className="clay-input w-full" />
                </div>
              </div>
            )}
          </div>
        </>
      )}
      {/* Shortlets are charged rent only, the backend zeroes caution and agency fees for them,
          so showing these here would promise money that is never collected. */}
      {!isShortlet && (
        <div className="border-t border-clay-border-light pt-4">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Fees</p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-text-secondary mb-1">Caution Fee (Optional)</label>
              <MoneyInput value={form.cautionFee} onChange={v => setField('cautionFee', v)} placeholder="50000" />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Agency Fee (Optional)</label>
              <MoneyInput value={form.agencyFee} onChange={v => setField('agencyFee', v)} placeholder="25000" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FurnishingStep({ w }: { w: ListingWizard }) {
  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Furnishing Status</label>
        <OptionGrid options={furnishingOptions} value={w.form.furnishing} onChange={v => w.setField('furnishing', v)} columns={3} />
      </div>
    </div>
  );
}

function UtilitiesStep({ w }: { w: ListingWizard }) {
  const { form, setField } = w;
  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Power Source</label>
        <OptionGrid options={powerOptions} value={form.power} onChange={v => setField('power', v)} columns={2} />
      </div>
      <div>
        <label className={labelClass}>Water Source</label>
        <OptionGrid options={waterOptions} value={form.water} onChange={v => setField('water', v)} columns={3} />
      </div>
      <div>
        <label className={labelClass}>Amenities</label>
        {/* Canonical amenity tokens, shared with the guest apps' label lookup. */}
        <div className="grid grid-cols-2 gap-2">
          {amenityOptions.map(amenity => (
            <ToggleRow key={amenity.value} label={amenity.label} selected={form.amenities.includes(amenity.value)} onClick={() => w.toggleInList('amenities', amenity.value)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function RulesStep({ w }: { w: ListingWizard }) {
  const { form } = w;
  const [customSlot, setCustomSlot] = useState('');
  const customSlots = form.availableTimeSlots.filter(s => !PRESET_TIME_SLOTS.includes(s));
  const addCustomSlot = () => { if (w.addTimeSlot(customSlot)) setCustomSlot(''); };
  const chipClass = (selected: boolean) => clsx(
    'px-3 py-2 text-xs font-semibold rounded-clay-sm border-2 transition-all',
    selected ? 'border-mustard bg-mustard text-white' : 'border-clay-border text-text-primary bg-clay-surface hover:border-mustard'
  );
  return (
    <div className="space-y-6">
      <div>
        <label className={labelClass}>House Rules</label>
        <div className="space-y-2">
          {([
            { key: 'petsAllowed', label: 'Pets Allowed' },
            { key: 'smokingAllowed', label: 'Smoking Allowed' },
            { key: 'studentsOnly', label: 'Students Only' },
          ] as const).map(rule => (
            <ToggleRow key={rule.key} label={rule.label} selected={form[rule.key]} onClick={() => w.toggleField(rule.key)} className="w-full" />
          ))}
        </div>
      </div>

      <div className="border-t border-clay-border-light pt-4">
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Inspection Available Days</label>
        <p className="text-xs text-text-tertiary mb-3">Select the days you are available to host property viewings:</p>
        <div className="flex flex-wrap gap-2">
          {WEEK_DAYS.map(day => (
            <button key={day} type="button" onClick={() => w.toggleInList('availableDays', day)} className={chipClass(form.availableDays.includes(day))}>
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Inspection Time Slots</label>
        <p className="text-xs text-text-tertiary mb-3">Select preset time slots or add custom times suitable for viewing this property:</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {PRESET_TIME_SLOTS.map(slot => (
            <button key={slot} type="button" onClick={() => w.toggleInList('availableTimeSlots', slot)} className={chipClass(form.availableTimeSlots.includes(slot))}>
              {slot}
            </button>
          ))}
        </div>

        {customSlots.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {customSlots.map(slot => (
              <span key={slot} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-clay-sm bg-mustard text-white">
                {slot}
                <button type="button" onClick={() => w.toggleInList('availableTimeSlots', slot)} className="hover:opacity-80 transition-opacity">
                  <Cancel02Icon className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 max-w-sm">
          <input
            type="text"
            value={customSlot}
            onChange={e => setCustomSlot(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomSlot(); } }}
            placeholder="Add custom time (e.g. 10:00 AM)"
            className="clay-input flex-1 text-xs py-2"
          />
          <Button type="button" variant="secondary" size="sm" onClick={addCustomSlot} disabled={!customSlot.trim()}>
            + Add Time
          </Button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Inspection Notes / Instructions (Optional)</label>
        <textarea
          value={form.inspectionNotes}
          onChange={e => w.setField('inspectionNotes', e.target.value)}
          placeholder="e.g. Inspections available Mon-Sat 9am to 4pm with 2hrs notice"
          rows={2}
          className="clay-input w-full text-sm"
        />
      </div>
    </div>
  );
}

function PhotoThumb({ file, index, onRemove }: { file: File; index: number; onRemove: () => void }) {
  const [url, setUrl] = useState<string>('');
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return (
    <div className="aspect-square rounded-clay-sm border-2 border-clay-border overflow-hidden relative group">
      {url && <img src={url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Cancel02Icon className="w-4 h-4 text-white" />
      </button>
    </div>
  );
}

function PhotosStep({ w, role }: { w: ListingWizard; role: OwnerRole }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    w.addPhotos(files);
  };
  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Property Photos ({w.photoFiles.length}/{MAX_PHOTOS})</label>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: MAX_PHOTOS }).map((_, i) => {
            const file = w.photoFiles[i];
            if (file) return <PhotoThumb key={i} file={file} index={i} onRemove={() => w.removePhoto(i)} />;
            if (i === w.photoFiles.length) {
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-clay-sm border-2 border-dashed border-clay-border hover:border-mustard transition-colors flex items-center justify-center bg-clay-border-light cursor-pointer"
                >
                  <Upload01Icon className="w-6 h-6 text-text-tertiary" />
                </button>
              );
            }
            return <div key={i} className="aspect-square rounded-clay-sm border-2 border-dashed border-clay-border bg-clay-border-light" />;
          })}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
        <p className="text-xs text-text-tertiary mt-2">Include bedroom, bathroom, kitchen, living area, exterior.</p>
      </div>

      <div className="pt-4 border-t border-clay-border-light">
        <TenancyAgreementUpload role={role} value={w.tenancyAgreement} onChange={w.setTenancyAgreement} />
      </div>
    </div>
  );
}

function ReviewRow({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('flex justify-between', className ?? 'border-b border-clay-border-light pb-2')}>
      <span className="text-text-tertiary">{label}:</span> {children}
    </div>
  );
}

function ReviewStep({ w }: { w: ListingWizard }) {
  const { form } = w;
  return (
    <div className="space-y-4">
      <div className="clay-card p-4 bg-clay-surface mb-4">
        <h3 className="font-bold text-text-primary mb-2">Review Your Listing</h3>
        <p className="text-sm text-text-secondary mb-4">Please review the details below before publishing.</p>

        <div className="space-y-3 text-sm">
          <ReviewRow label="Title"><span className="font-medium text-right max-w-[60%] truncate">{form.title || '-'}</span></ReviewRow>
          <ReviewRow label="Type"><span className="font-medium capitalize">{form.propertyType}</span></ReviewRow>
          {form.propertyType === 'shortlet' ? (
            <ReviewRow label="Pricing">
              <span className="font-medium text-right max-w-[60%]">
                {form.shortletRates.filter(r => r.label.trim() && Number(r.price) > 0).map(r => `${r.label}: ₦${Number(r.price).toLocaleString()}`).join(' · ') || '-'}
              </span>
            </ReviewRow>
          ) : (
            <>
              <ReviewRow label="Rent"><span className="font-medium font-bold text-mustard">₦{Number(form.annualRent).toLocaleString()} / {leaseLabel(form)}</span></ReviewRow>
              <ReviewRow label="Payment">
                <span className="font-medium capitalize">
                  {form.paymentFrequency === 'custom'
                    ? `${form.customInstallments} x ₦${Number(form.customAmountPerInstallment).toLocaleString()} (${form.customInterval})`
                    : form.paymentFrequency}
                </span>
              </ReviewRow>
            </>
          )}
          <ReviewRow label="Location"><span className="font-medium text-right max-w-[60%]">{form.address}, {form.area}</span></ReviewRow>
          <ReviewRow label="Landmark"><span className="font-medium text-right max-w-[60%]">{form.landmark || '-'}</span></ReviewRow>
          <ReviewRow label="Occupants"><span className="font-medium">{form.maxOccupants}</span></ReviewRow>
          <ReviewRow label="Gender"><span className="font-medium capitalize">{form.gender}</span></ReviewRow>
          <ReviewRow label="Power"><span className="font-medium capitalize">{form.power}</span></ReviewRow>
          {form.additionalNotes && (
            <ReviewRow label="Notes"><span className="font-medium text-right max-w-[60%] truncate">{form.additionalNotes}</span></ReviewRow>
          )}
          <ReviewRow label="Photos" className=""><span className="font-medium">{w.photoFiles.length} Added</span></ReviewRow>
          <ReviewRow label="Tenancy Agreement" className="border-t border-clay-border-light pt-2 mt-2">
            <span className="font-medium text-right max-w-[60%] truncate">{w.tenancyAgreement ? w.tenancyAgreement.fileName : 'Standard iléSure template'}</span>
          </ReviewRow>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------
// Verification gate: the backend refuses to create listings for unverified agents AND
// companies (listingController.createListing, QA-AGT-026), so both roles see it.
// ---------------------------------------------------------------------------------------

function useListingVerification(fallbackRole: string, cachedVerified: boolean) {
  const [verified, setVerified] = useState<boolean | null>(cachedVerified ? true : null);
  const check = async () => {
    const res = await userApi.getKycStatus();
    setVerified(res.success && res.data ? isVerifiedToList(res.data, fallbackRole) : cachedVerified);
  };
  useEffect(() => { void check(); }, []);
  return { verified, recheck: check };
}

function VerificationGate({ role, userRole, onVerified }: { role: OwnerRole; userRole: string; onVerified: () => void }) {
  return (
    <AppLayout role={role} title="Create Listing">
      <div className="max-w-lg mx-auto py-12 px-4">
        <div className="clay-card p-6 text-center mb-6">
          <div className="w-20 h-20 bg-mustard-pale rounded-full flex items-center justify-center mx-auto mb-6">
            <SecurityIcon className="w-10 h-10 text-mustard" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-3">Verification Required</h2>
          <p className="text-text-secondary max-w-md mx-auto mb-2">
            You must verify your identity before you can create and publish listings on iléSure. This helps us maintain a safe platform for all users.
          </p>
        </div>
        <div className="clay-card p-5">
          <DojahKYCSection userRole={userRole} onVerified={onVerified} />
        </div>
      </div>
    </AppLayout>
  );
}

export function OwnerCreateListingPage({ role }: { role: OwnerRole }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = user?.role || role;
  const { verified, recheck } = useListingVerification(userRole, user?.verificationStatus === 'verified');
  const w = useListingWizard(role, () => navigate(`/${role}/listings`));

  if (verified === null) {
    return (
      <AppLayout role={role} title="Create Listing">
        <div className="flex items-center justify-center h-64">
          <Loading02Icon className="w-8 h-8 animate-spin text-mustard" />
        </div>
      </AppLayout>
    );
  }

  if (!verified) {
    return <VerificationGate role={role} userRole={userRole} onVerified={() => void recheck()} />;
  }

  const stepViews = [
    <BasicsStep w={w} />,
    <LocationStep w={w} />,
    <PropertyStep w={w} />,
    <PricingStep w={w} />,
    <FurnishingStep w={w} />,
    <UtilitiesStep w={w} />,
    <RulesStep w={w} />,
    <PhotosStep w={w} role={role} />,
    <ReviewStep w={w} />,
  ];

  return (
    <AppLayout role={role} title="Create Listing" subtitle={`Step ${w.step} of ${w.totalSteps}`}>
      <div className="max-w-lg mx-auto pb-12">
        <div className="clay-card p-6">
          <StepIndicator currentStep={w.step} totalSteps={w.totalSteps} />

          <h2 className="text-lg font-bold text-text-primary text-center mb-6">{w.stepTitle}</h2>

          {stepViews[w.step - 1]}

          {/* QA-AGT-010 / QA-CO-014: per-step problems and server rejections both show here. */}
          {w.error && (
            <div className="mt-6 flex items-start gap-2 rounded-clay-sm bg-status-error/10 p-3 text-sm text-status-error">
              <Alert01Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{w.error}</span>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {w.step > 1 && (
              <Button type="button" variant="secondary" onClick={w.back} className="flex-1">
                <ArrowLeft01Icon className="w-4 h-4 mr-2" /> Back
              </Button>
            )}
            {w.step < w.totalSteps ? (
              <Button type="button" variant="primary" onClick={w.next} className="flex-1">
                Continue <ArrowRight01Icon className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button type="button" variant="primary" onClick={() => void w.submit()} className="flex-1" loading={w.submitting || w.uploading}>
                {w.uploading ? 'Uploading Photos...' : 'Publish Listing'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
