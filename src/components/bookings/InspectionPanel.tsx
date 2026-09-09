import { useState } from 'react';
import { Calendar02Icon, CheckmarkBadge02Icon, Cancel02Icon, Alert01Icon, Clock01Icon } from '@hugeicons/react';
import { Button } from '../ui/Button';

/**
 * The agent/landlord's view of a booking's viewing step.
 *
 * Allows agents to view inspection state, record a no-show, or edit/reschedule
 * the viewing appointment date and time.
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
  onReschedule?: (data: { inspectionDate: string; inspectionTime: string; inspectorName?: string }) => void | Promise<void>;
  busy?: boolean;
}

function formatDate(value?: string) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toLocaleDateString();
}

function toISODate(value?: string) {
  if (!value) return '';
  const d = new Date(value);
  return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
}

const PRESET_TIME_SLOTS = ['09:00 AM', '11:00 AM', '01:00 PM', '03:00 PM', '05:00 PM'];

export function InspectionPanel({ booking, onMarkMissed, onReschedule, busy = false }: InspectionPanelProps) {
  const [confirming, setConfirming] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState(toISODate(booking.inspectionDate));
  const [editTime, setEditTime] = useState(booking.inspectionTime || '10:00 AM');
  const [editInspector, setEditInspector] = useState(booking.inspectorName || '');
  const [saving, setSaving] = useState(false);

  const scheduledOn = formatDate(booking.inspectionDate);
  const status = booking.inspectionStatus || 'pending';
  const canMarkMissed = status === 'scheduled' && !booking.isVerified && !!onMarkMissed;
  const canReschedule = !booking.isVerified && !!onReschedule;

  let summary: { icon: JSX.Element; text: string };
  if (booking.isVerified) {
    summary = {
      icon: <CheckmarkBadge02Icon className="w-4 h-4 text-status-success shrink-0" />,
      text:
        booking.inspectionVerifiedBy === 'tenant'
          ? 'The tenant confirmed the apartment matches the listing. They can now pay.'
          : 'Inspection confirmed. The tenant can now pay.',
    };
  } else if (booking.timelineStep === 3) {
    summary = {
      icon: <Cancel02Icon className="w-4 h-4 text-status-error shrink-0" />,
      text: 'The tenant reported that the apartment does not match the listing.',
    };
  } else if (status === 'missed') {
    summary = {
      icon: <Alert01Icon className="w-4 h-4 text-status-warning shrink-0" />,
      text: 'The viewing was marked as missed. You or the tenant can reschedule.',
    };
  } else if (status === 'scheduled') {
    summary = {
      icon: <Calendar02Icon className="w-4 h-4 text-text-secondary shrink-0" />,
      text: scheduledOn
        ? `Viewing booked for ${scheduledOn}${booking.inspectionTime ? ` at ${booking.inspectionTime}` : ''}. Waiting for the tenant to confirm after they attend.`
        : 'Viewing booked. Waiting for the tenant to confirm after they attend.',
    };
  } else {
    summary = {
      icon: <Calendar02Icon className="w-4 h-4 text-text-tertiary shrink-0" />,
      text: 'The tenant has not booked a viewing yet.',
    };
  }

  const handleMissed = async () => {
    if (!onMarkMissed) return;
    await onMarkMissed();
    setConfirming(false);
  };

  const handleSaveReschedule = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!onReschedule || !editDate || !editTime) return;
    try {
      setSaving(true);
      await onReschedule({
        inspectionDate: editDate,
        inspectionTime: editTime,
        inspectorName: editInspector.trim() || undefined,
      });
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="col-span-2 mt-2 pt-2 border-t border-clay-border-light">
      <p className="text-xs text-text-tertiary mb-1">Inspection</p>

      <div className="flex items-start gap-2">
        {summary.icon}
        <p className="text-sm text-text-primary flex-1">{summary.text}</p>
      </div>

      {booking.inspectorName && status !== 'pending' && !isEditing && (
        <p className="text-xs text-text-tertiary mt-1">Inspector: {booking.inspectorName}</p>
      )}

      {/* Reschedule / Edit Form */}
      {isEditing ? (
        <div className="mt-3 p-3 bg-clay-surface rounded-clay-md border border-clay-border space-y-3">
          <p className="text-xs font-semibold text-text-primary">
            {status === 'scheduled' ? 'Edit / Reschedule Viewing' : 'Set Viewing Appointment'}
          </p>
          
          <div>
            <label className="block text-[11px] font-medium text-text-secondary mb-1">Date</label>
            <input
              type="date"
              value={editDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setEditDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-clay-border rounded-clay-sm text-text-primary focus:outline-none focus:border-mustard"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-text-secondary mb-1">Time Slot</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESET_TIME_SLOTS.map(slot => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setEditTime(slot)}
                  className={`px-2 py-1 text-[11px] rounded-clay-sm border font-medium transition-colors ${
                    editTime === slot
                      ? 'bg-mustard border-mustard text-white'
                      : 'bg-white border-clay-border text-text-primary hover:border-mustard'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={editTime}
              onChange={e => setEditTime(e.target.value)}
              placeholder="Or enter time, e.g. 10:30 AM"
              className="w-full px-3 py-1.5 text-xs bg-white border border-clay-border rounded-clay-sm text-text-primary focus:outline-none focus:border-mustard"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-text-secondary mb-1">Inspector Name (Optional)</label>
            <input
              type="text"
              value={editInspector}
              onChange={e => setEditInspector(e.target.value)}
              placeholder="e.g. John Doe (Agent)"
              className="w-full px-3 py-1.5 text-xs bg-white border border-clay-border rounded-clay-sm text-text-primary focus:outline-none focus:border-mustard"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveReschedule}
              loading={saving || busy}
              disabled={!editDate || !editTime}
            >
              Save Viewing Time
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEditing(false)}
              disabled={saving || busy}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {canReschedule && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setEditDate(toISODate(booking.inspectionDate) || new Date().toISOString().split('T')[0]);
                setEditTime(booking.inspectionTime || '10:00 AM');
                setEditInspector(booking.inspectorName || '');
                setIsEditing(true);
              }}
              disabled={busy}
            >
              <Calendar02Icon className="w-3.5 h-3.5 mr-1" />
              {status === 'scheduled' ? 'Edit / Reschedule' : 'Set Viewing Time'}
            </Button>
          )}

          {canMarkMissed && (
            <div>
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
                <Button variant="secondary" size="sm" onClick={() => setConfirming(true)} disabled={busy}>
                  Mark viewing as missed
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
