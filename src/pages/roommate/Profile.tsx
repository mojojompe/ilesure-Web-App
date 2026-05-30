import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Bed, BookOpen, Users, Moon, Volume2, Sparkles, Heart, DollarSign, Calendar } from 'lucide-react';
import { clsx } from 'clsx';
import { AppLayout } from '../../components/layout/AppLayout';
import { roommateApi } from '../../api/roommate';
import type { RoommateProfile } from '../../types';

const LIFESTYLE_CATEGORIES = [
  { key: 'sleepSchedule',    label: 'Sleep Schedule',    icon: Moon,       options: ['early_bird', 'night_owl', 'flexible'] },
  { key: 'noiseTolerance',   label: 'Noise Tolerance',   icon: Volume2,    options: ['very_quiet', 'moderate', 'noisy_ok'] },
  { key: 'cleanliness',      label: 'Cleanliness',        icon: Sparkles,   options: ['neat_freak', 'organized', 'casual', 'messy'] },
  { key: 'cookingFrequency', label: 'Cooking Habits',    icon: null,        options: ['daily', 'few_times_week', 'rarely', 'never'] },
  { key: 'studySchedule',    label: 'Study Habits',       icon: BookOpen,   options: ['morning', 'afternoon', 'evening', 'late_night', 'distributed'] },
  { key: 'socialActivity',   label: 'Social Level',        icon: Users,       options: ['very_social', 'moderate', 'private', 'hermit'] },
  { key: 'guestComfort',     label: 'Guest Policy',       icon: null,        options: ['love_guests', 'ok_with_notice', 'rare_guests', 'no_guests'] },
  { key: 'smokingAlcohol',   label: 'Smoking/Alcohol',    icon: null,        options: ['no', 'socially', 'yes'] },
  { key: 'powerUsage',       label: 'Power Usage',        icon: null,        options: ['low', 'medium', 'high'] },
];

const BUDGET_RANGES = [
  { min: 50000,  max: 100000 },
  { min: 100000, max: 200000 },
  { min: 200000, max: 300000 },
  { min: 300000, max: 500000 },
  { min: 500000, max: 1000000 },
];

export function RoommateProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Partial<RoommateProfile>>({});
  const [step, setStep] = useState(1);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await roommateApi.getProfile();
      if (response.success && response.data) {
        setProfile(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLifestyleChange = (key: string, value: string) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  const handleNumericChange = (key: string, value: string) => {
    setProfile(prev => ({ ...prev, [key]: value ? Number(value) : undefined }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = profile.updatedAt
        ? await roommateApi.updateProfile(profile)
        : await roommateApi.createProfile(profile);

      if (response.success) {
        if (step === 1) {
          setStep(2);
        } else {
          navigate('/roommate/matches');
        }
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatOption = (opt: string) => opt.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  if (loading) {
    return (
      <AppLayout role="student" title="Roommate Profile" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mustard"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      role="student"
      title="Roommate Profile"
      subtitle="Tell us about your lifestyle for AI-powered matching"
    >
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-secondary">Step {step} of 2</span>
            <span className="text-sm text-mustard font-semibold">
              {step === 1 ? 'Lifestyle' : 'Preferences'}
            </span>
          </div>
          <div className="w-full bg-clay-border rounded-full h-2">
            <div
              className="bg-mustard h-full rounded-full transition-all"
              style={{ width: `${step === 1 ? 50 : 100}%` }}
            />
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div className="clay-card p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Bed className="w-5 h-5 text-mustard" />
                Lifestyle Preferences
              </h3>
              <p className="text-sm text-text-tertiary mb-6">
                Our AI uses these to find your most compatible roommates
              </p>

              {LIFESTYLE_CATEGORIES.map(cat => (
                <div key={cat.key} className="mb-6 last:mb-0">
                  <label className="block text-sm font-medium text-text-primary mb-3">
                    {cat.icon && <cat.icon className="inline w-4 h-4 mr-2 text-mustard" />}
                    {cat.label}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {cat.options.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleLifestyleChange(cat.key, opt)}
                        className={clsx(
                          'p-3 rounded-clay-sm border-2 transition-all text-sm',
                          profile[cat.key as keyof RoommateProfile] === opt
                            ? 'border-mustard bg-mustard/10 text-mustard font-medium'
                            : 'border-clay-border hover:border-mustard/50 bg-white'
                        )}
                      >
                        {formatOption(opt)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Numeric preferences */}
            <div className="clay-card p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-mustard" />
                Personality & Values
              </h3>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Openness (1-5)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={profile.openness || 3}
                    onChange={e => handleNumericChange('openness', e.target.value)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-text-tertiary mt-1">
                    <span>Reserved</span>
                    <span className="font-medium text-mustard">{profile.openness || 3}</span>
                    <span>Very Open</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Religion Importance (1-5)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={profile.religionImportance || 3}
                    onChange={e => handleNumericChange('religionImportance', e.target.value)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-text-tertiary mt-1">
                    <span>Not Important</span>
                    <span className="font-medium text-mustard">{profile.religionImportance || 3}</span>
                    <span>Very Important</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-6 py-3 bg-mustard text-white rounded-clay-sm font-medium hover:bg-mustard/90 transition-colors"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="clay-card p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-mustard" />
                Budget & Preferences
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Budget Range (₦)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="number"
                      placeholder="Min (e.g. 100000)"
                      value={profile.budgetMin || ''}
                      onChange={e => handleNumericChange('budgetMin', e.target.value)}
                      className="clay-input w-full"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Max (e.g. 300000)"
                      value={profile.budgetMax || ''}
                      onChange={e => handleNumericChange('budgetMax', e.target.value)}
                      className="clay-input w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Age
                </label>
                <input
                  type="number"
                  placeholder="Your age"
                  value={profile.age || ''}
                  onChange={e => handleNumericChange('age', e.target.value)}
                  className="clay-input w-full max-w-xs"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Preferred Gender
                </label>
                <div className="flex gap-2">
                  {['any', 'male', 'female'].map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setProfile(prev => ({ ...prev, preferredGender: g as any }))}
                      className={clsx(
                        'px-4 py-2 rounded-clay-sm border-2 transition-all',
                        profile.preferredGender === g || (!profile.preferredGender && g === 'any')
                          ? 'border-mustard bg-mustard/10 text-mustard font-medium'
                          : 'border-clay-border hover:border-mustard/50 bg-white'
                      )}
                    >
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Preferred Campus Area
                </label>
                <input
                  type="text"
                  placeholder="e.g. Campus North, GRA"
                  value={profile.preferredZone || ''}
                  onChange={e => setProfile(prev => ({ ...prev, preferredZone: e.target.value }))}
                  className="clay-input w-full"
                />
              </div>
            </div>

            <div className="clay-card p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-mustard" />
                Academic Info
              </h3>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Course of Study
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science"
                    value={profile.courseOfStudy || ''}
                    onChange={e => setProfile(prev => ({ ...prev, courseOfStudy: e.target.value }))}
                    className="clay-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Year of Study
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2nd Year"
                    value={profile.yearOfStudy || ''}
                    onChange={e => setProfile(prev => ({ ...prev, yearOfStudy: e.target.value }))}
                    className="clay-input w-full"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Bio
                </label>
                <textarea
                  placeholder="Tell potential roommates about yourself..."
                  value={profile.bio || ''}
                  onChange={e => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  className="clay-input w-full min-h-[100px]"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-6 py-3 border-2 border-clay-border rounded-clay-sm font-medium hover:border-mustard/50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-mustard text-white rounded-clay-sm font-medium hover:bg-mustard/90 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Find My Matches'} <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
