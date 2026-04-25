import { Clock, Mail, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function VerificationPendingPage() {
  return (
    <div className="min-h-screen bg-off-white flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="clay-card p-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-mustard-pale flex items-center justify-center animate-pulse">
            <Clock className="w-10 h-10 text-mustard" />
          </div>

          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Verification Pending
          </h1>
          <p className="text-text-tertiary mb-6">
            Your documents are being reviewed by our team
          </p>

          <div className="bg-burnt-brown-pale rounded-clay-sm p-4 text-left mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-mustard flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-text-primary">What happens next?</p>
                <ul className="text-sm text-text-secondary mt-2 space-y-1">
                  <li>1. Our team will review your documents within 24-48 hours</li>
                  <li>2. You'll receive an email notification once verified</li>
                  <li>3. You can choose a subscription plan while you wait</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              to="/tiers"
              className="block btn-primary"
            >
              Choose a Plan
            </Link>
            <Link
              to="/"
              className="block btn-secondary"
            >
              Back to Home
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-clay-border">
            <div className="flex items-center justify-center gap-2 text-sm text-text-tertiary">
              <Mail className="w-4 h-4" />
              <span>Need help? Contact support@ilesure.com</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}