import { useState } from 'react';
import { Alert01Icon } from '@hugeicons/react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { authApi } from '../../api/authApi';
import { useAuth } from '../../api/authContext';
import { useNavigate } from 'react-router-dom';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const [step, setStep] = useState<'warning' | 'otp' | 'success'>('warning');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleRequestDeletion = async () => {
    setLoading(true);
    setError('');
    try {
      await authApi.requestAccountDeletion();
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to request account deletion.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDeletion = async () => {
    if (otp.length < 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const confirmText = user?.role === 'company' || user?.role === 'company_admin'
        ? `DELETE-${user.company?.name || 'COMPANY'}`.toUpperCase()
        : `DELETE-${user?.fullName || 'ACCOUNT'}`.toUpperCase();
      
      await authApi.confirmAccountDeletion(otp, confirmText.replace(/\s+/g, ''));
      setStep('success');
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Invalid code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setStep('warning');
    setOtp('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={resetState} title={step === 'warning' ? 'Delete Account' : step === 'otp' ? 'Confirm Deletion' : ''}>
      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 text-sm rounded-clay-sm bg-status-danger/10 text-status-danger border border-status-danger/20">
          <Alert01Icon className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {step === 'warning' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#FFF9E6] border border-[#FFE082] rounded-clay-sm text-[#B77B00]">
            <h3 className="font-bold flex items-center gap-2 mb-2">
              <Alert01Icon className="w-5 h-5" />
              Warning: Account Deletion
            </h3>
            <p className="text-sm">
              Deleting your account will remove your access to the platform and unpublish your active listings. 
              Your data will be retained securely, but you will not be able to log in without reactivating your account.
            </p>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="secondary" onClick={resetState} disabled={loading}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleRequestDeletion} loading={loading}>
              Request Deletion
            </Button>
          </div>
        </div>
      )}

      {step === 'otp' && (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Enter the 6-digit code sent to your email to confirm the deletion of your account.
          </p>
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Confirmation Code
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              maxLength={6}
              className="clay-input w-full text-center tracking-widest text-lg font-bold"
              placeholder="000000"
            />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="secondary" onClick={resetState} disabled={loading}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDeletion} loading={loading} disabled={otp.length < 6}>
              Confirm & Delete
            </Button>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-status-success/20 text-status-success rounded-full flex items-center justify-center mx-auto mb-4">
            <Alert01Icon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-2">Account Deleted</h3>
          <p className="text-sm text-text-secondary">
            Your account has been deleted successfully. You will be logged out shortly.
          </p>
        </div>
      )}
    </Modal>
  );
}
