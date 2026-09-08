import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Shield, MapPin, Navigation, Clock, CheckCircle2, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { journeyApi, PublicJourneyData } from '../api/journey';

export function LiveJourneyPublicPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PublicJourneyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJourney = async (isManual = false) => {
    if (!shareToken) return;
    if (isManual) setRefreshing(true);
    try {
      const res = await journeyApi.getPublicJourney(shareToken);
      if (res.success && res.data) {
        setData(res.data);
        setError(null);
      } else {
        setError(res.error?.message || 'Journey session not found or has expired.');
      }
    } catch {
      setError('Failed to connect to IleSure live tracking servers.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJourney();
    // Poll every 15 seconds while en route
    const interval = setInterval(() => {
      if (data?.status === 'en_route') {
        fetchJourney();
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [shareToken, data?.status]);

  if (loading) {
    return (
      <div className="min-h-screen bg-clay-bg flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-mustard border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-text-secondary">Loading live journey tracking…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-clay-bg flex flex-col items-center justify-center p-4 text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-600">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-text-primary mb-2">Tracking Unavailable</h1>
        <p className="text-sm text-text-secondary max-w-sm mb-6">{error || 'This live tracking link is invalid or has expired.'}</p>
        <Button variant="primary" onClick={() => fetchJourney(true)}>
          Retry
        </Button>
      </div>
    );
  }

  const isArrived = data.status === 'arrived';
  const destCoords = data.destinationLocation;
  const mapUrl = destCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${destCoords[1]},${destCoords[0]}`
    : '#';

  return (
    <div className="min-h-screen bg-clay-bg py-8 px-4 sm:px-6">
      <div className="max-w-md mx-auto space-y-4">
        {/* Branding Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-clay-sm bg-mustard flex items-center justify-center text-white font-bold text-sm">
              iS
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary leading-tight">iléSure</p>
              <p className="text-[11px] text-text-tertiary flex items-center gap-1">
                <Shield className="w-3 h-3 text-status-success" /> Live Safety Journey
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchJourney(true)}
            disabled={refreshing}
            className="flex items-center gap-1 text-xs text-text-secondary hover:text-mustard px-2 py-1 rounded border border-clay-border bg-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Main Status Hero Card */}
        <div className="bg-white rounded-clay-md border border-clay-border p-5 shadow-clay space-y-4">
          <div className="flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                isArrived
                  ? 'bg-green-100 text-green-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {isArrived ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  ARRIVED AT PROPERTY
                </>
              ) : (
                <>
                  <Navigation className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                  EN ROUTE TO INSPECTION
                </>
              )}
            </span>

            <span className="text-[11px] text-text-tertiary">
              Updated {new Date(data.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div>
            <h1 className="text-lg font-bold text-text-primary">
              Tracking {data.travelerName}'s Trip
            </h1>
            <p className="text-xs text-text-secondary mt-0.5">
              Viewing appointment at <span className="font-semibold text-text-primary">{data.propertyTitle}</span>
            </p>
            {data.destinationAddress && (
              <p className="text-xs text-text-tertiary mt-1 flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-mustard shrink-0 mt-0.5" />
                <span>{data.destinationAddress}</span>
              </p>
            )}
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-clay-border-light">
            <div className="bg-clay-surface p-3 rounded-clay-sm border border-clay-border">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-text-tertiary">Distance Left</p>
              <p className="text-base font-bold text-text-primary mt-0.5">
                {data.distanceRemainingMeters !== undefined
                  ? data.distanceRemainingMeters >= 1000
                    ? `${(data.distanceRemainingMeters / 1000).toFixed(1)} km`
                    : `${data.distanceRemainingMeters} meters`
                  : isArrived
                  ? '0 m'
                  : '—'}
              </p>
            </div>

            <div className="bg-clay-surface p-3 rounded-clay-sm border border-clay-border">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-text-tertiary">Estimated Time</p>
              <p className="text-base font-bold text-mustard mt-0.5">
                {isArrived ? 'Arrived' : data.etaMinutes !== undefined ? `~${data.etaMinutes} mins` : '—'}
              </p>
            </div>
          </div>

          {/* Destination Map Link */}
          {destCoords && (
            <a
              href={mapUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-clay-sm bg-clay-surface border border-clay-border text-text-primary text-xs font-semibold hover:border-mustard transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-mustard" />
              <span>View Destination on Google Maps</span>
            </a>
          )}
        </div>

        {/* Security & Verification Guarantee */}
        <div className="bg-emerald-50 rounded-clay-md border border-emerald-200 p-3.5 flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-900 leading-relaxed">
            <p className="font-semibold">Secured by IleSure Safety Guardian</p>
            <p className="text-emerald-800 text-[11px] mt-0.5">
              Live telemetry is active during the inspection trip. Coordinates are automatically verified with the verified host agent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveJourneyPublicPage;
