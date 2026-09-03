import { useState } from 'react';
import { CalendarClock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';

/**
 * The agent/landlord's view of a booking's viewing step.
 *
 * Agents previously had no inspection UI at all: they could not see when a tenant had booked a
 * viewing, who confirmed it, or record a no-show. Confirming that the apartment matches the
 * listing stays with the tenant — that is the gate before payment — so the only action offered
 * here is marking a scheduled viewing as missed.
 */

interface InspectionPanelBooking {
  timelineStep?: number;
  inspectionDate?: string;
  inspectionTime?: string;
  inspectorName?: string;
  inspectionStatus?: 'pending' | 'scheduled' | 'completed' | 'missed';
  isVerified?: boolean;
  inspectionVerifiedBy?: 'tenant' | 'agent';
  inspectionVerifiedAt?: string;
}

interface InspectionPanelProps {
  booking: InspectionPanelBooking;
  onMarkMissed?: () => void | Promise<void>;
  busy?: boolean;
}

function formatDate(value?: string) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toLocaleDateString();
}

export function InspectionPanel({ booking, onMarkMissed, busy = false }: InspectionPanelProps) {
  const [confirming, setConfirming] = useState(false);

  const scheduledOn = formatDate(booking.inspectionDate);
  const status = booking.inspectionStatus || 'pending';
  const canMarkMissed = status === 'scheduled' && !booking.isVerified && !!onMarkMissed;

  let summary: { icon: JSX.Element; text: string };
  if (booking.isVerified) {
    summary = {
      icon: <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" />,
      text:
        booking.inspectionVerifiedBy === 'tenant'
          ? 'The tenant confirmed the apartment matches the listing. They can now pay.'
          : 'Inspection confirmed. The tenant can now pay.',
    };
  } else if (booking.timelineStep === 3) {
    summary = {
      icon: <XCircle className="w-4 h-4 text-status-error shrink-0" />,
      text: 'The tenant reported that the apartment does not match the listing.',
    };
  } else if (status === 'missed') {
    summary = {
      icon: <AlertTriangle className="w-4 h-4 text-status-warning shrink-0" />,
      text: 'The viewing was marked as missed. The tenant can schedule another.',
    };
  } else if (status === 'scheduled') {
    summary = {
      icon: <CalendarClock className="w-4 h-4 text-text-secondary shrink-0" />,
      text: scheduledOn
        ? `Viewing booked for ${scheduledOn}${booking.inspectionTime ? ` at ${booking.inspectionTime}` : ''}. Waiting for the tenant to confirm after they attend.`
        : 'Viewing booked. Waiting for the tenant to confirm after they attend.',
    };
  } else {
    summary = {
      icon: <CalendarClock className="w-4 h-4 text-text-tertiary shrink-0" />,
      text: 'The tenant has not booked a viewing yet.',
    };
  }

  const handleMissed = async () => {
    if (!onMarkMissed) return;
    await onMarkMissed();
    setConfirming(false);
  };

  return (
    <div className="col-span-2 mt-2 pt-2 border-t border-clay-border-light">
      <p className="text-xs text-text-tertiary mb-1">Inspection</p>

      <div className="flex items-start gap-2">
        {summary.icon}
        <p className="text-sm text-text-primary flex-1">{summary.text}</p>
      </div>

      {booking.inspectorName && status !== 'pending' && (
        <p className="text-xs text-text-tertiary mt-1">Inspector: {booking.inspectorName}</p>
      )}

      {canMarkMissed && (
        <div className="mt-3">
          {confirming ? (
            <div className="flex items-center gap-2">
              <Button variant="danger" size="sm" onClick={handleMissed} loading={busy}>
                Yes, mark missed
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setConfirming(false)} disabled={busy}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setConfirming(true)}>
              Mark viewing as missed
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
