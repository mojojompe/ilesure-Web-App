import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, User, Briefcase, Building2, ArrowRight, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../components/ui/Button';
import type { UserRole } from '../types';

interface Role {
  id: UserRole;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  features: string[];
}

const roles: Role[] = [
  {
    id: 'agent',
    name: 'Agent / Landlord',
    icon: Briefcase,
    description: 'List and manage properties',
    features: ['List properties', 'Manage bookings', 'Get inquiries', 'Analytics'],
  },
  {
    id: 'company',
    name: 'Company',
    icon: Building2,
    description: 'Full company account',
    features: ['Unlimited listings', 'Team management', 'Priority support', 'Advanced analytics'],
  },
];

export function RoleSelectionPage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleContinue = () => {
    if (selectedRole) {
      navigate('/signup');
    }
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat py-8 px-4"
      style={{ backgroundImage: "linear-gradient(rgba(249, 248, 246, 0.85), rgba(249, 248, 246, 0.85)), url('/bg_role.png')" }}
    >
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-clay overflow-hidden shadow-clay">
            <img src="/NoBG Logo.png" alt="iléSure" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Choose Your Role</h1>
          <p className="text-text-tertiary mt-1">Select how you want to use iléSure</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {roles.map(role => (
            <button
              key={role.id}
              type="button"
              onClick={() => setSelectedRole(role.id)}
              className={clsx(
                'clay-card p-5 text-left transition-all',
                selectedRole === role.id
                  ? 'ring-2 ring-mustard bg-mustard-pale'
                  : 'hover:shadow-clay-hover hover:-translate-y-0.5'
              )}
            >
              <div className="flex items-start gap-4">
                <div className={clsx(
                  'w-12 h-12 rounded-clay-sm flex items-center justify-center flex-shrink-0',
                  selectedRole === role.id ? 'bg-mustard' : 'bg-burnt-brown-pale'
                )}>
                  <role.icon className={clsx('w-6 h-6', selectedRole === role.id ? 'text-white' : 'text-burnt-brown')} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-text-primary">{role.name}</h3>
                    {selectedRole === role.id && (
                      <Check className="w-5 h-5 text-mustard" />
                    )}
                  </div>
                  <p className="text-sm text-text-tertiary mt-1">{role.description}</p>
                  
                  <div className="mt-3 space-y-1">
                    {role.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                        <div className="w-1 h-1 rounded-full bg-mustard" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <Button
          variant="primary"
          className="w-full"
          disabled={!selectedRole}
          onClick={handleContinue}
        >
          Continue <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}