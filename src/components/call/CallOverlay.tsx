import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { clsx } from 'clsx';
import { useCall } from '../../contexts/CallContext';

/**
 * The call surface: incoming, dialling, and in-call.
 *
 * Rendered in a portal above everything else so a call is never trapped inside whatever
 * page the user happened to be on when it arrived.
 */

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function initialsOf(name?: string): string {
  if (!name) return '?';
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

/** Attaches a MediaStream to a media element; `srcObject` cannot be set via JSX. */
function useMediaStream<T extends HTMLMediaElement>(stream: MediaStream | null) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (ref.current && ref.current.srcObject !== stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);
  return ref;
}

export function CallOverlay() {
  const call = useCall();
  const {
    phase,
    callType,
    peer,
    localStream,
    remoteStream,
    micEnabled,
    cameraEnabled,
    mediaError,
    relayAvailable,
    endedReason,
    durationSeconds,
  } = call;

  const remoteVideoRef = useMediaStream<HTMLVideoElement>(remoteStream);
  const localVideoRef = useMediaStream<HTMLVideoElement>(localStream);
  // A voice call has no video element to carry the remote audio, so it needs its own sink.
  const remoteAudioRef = useMediaStream<HTMLAudioElement>(remoteStream);

  if (phase === 'idle') return null;

  const isVideo = callType === 'video';
  const showRemoteVideo = isVideo && remoteStream?.getVideoTracks().some((t) => t.enabled);

  const statusLine = (() => {
    switch (phase) {
      case 'outgoing':
        return 'Calling…';
      case 'incoming':
        return isVideo ? 'Incoming video call' : 'Incoming voice call';
      case 'connecting':
        return 'Connecting…';
      case 'active':
        return formatDuration(durationSeconds);
      case 'ended':
        return endedReason ?? 'Call ended';
      default:
        return '';
    }
  })();

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="relative flex h-full max-h-[720px] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-[#0E0E10] text-white shadow-2xl">
        {showRemoteVideo && (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

        <div className="relative flex flex-1 flex-col items-center justify-center gap-4 px-6">
          {!showRemoteVideo && (
            <>
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-white/10 text-3xl font-bold">
                {peer?.avatar ? (
                  <img src={peer.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  initialsOf(peer?.fullName)
                )}
              </div>
              <div className="text-center">
                <p className="text-xl font-semibold">{peer?.fullName ?? 'Unknown'}</p>
                <p className="mt-1 text-sm text-white/60">{statusLine}</p>
              </div>
            </>
          )}

          {showRemoteVideo && (
            <div className="absolute left-0 right-0 top-0 flex flex-col items-center gap-1 bg-gradient-to-b from-black/60 to-transparent px-4 pb-10 pt-6">
              <p className="text-lg font-semibold">{peer?.fullName ?? 'Unknown'}</p>
              <p className="text-xs text-white/70">{statusLine}</p>
            </div>
          )}

          {/* Self-view, only while there is something to see. */}
          {isVideo && localStream && cameraEnabled && phase !== 'ended' && (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute right-4 top-4 h-40 w-28 rounded-xl border border-white/20 object-cover shadow-lg"
            />
          )}

          {mediaError === 'denied' && (
            <p className="max-w-xs text-center text-xs text-amber-300">
              {isVideo
                ? 'Camera unavailable — continuing with voice only.'
                : 'Microphone unavailable. Check your browser permissions.'}
            </p>
          )}
          {mediaError === 'unsupported' && (
            <p className="max-w-xs text-center text-xs text-amber-300">
              Calling is not supported in this browser.
            </p>
          )}
          {/* Relay-dependent peers cannot connect without TURN; say so rather than letting
              the call fail with no explanation. */}
          {!relayAvailable && phase !== 'ended' && (
            <p className="max-w-xs text-center text-[11px] text-white/40">
              Connection quality may be limited on this network.
            </p>
          )}
        </div>

        <div className="relative pb-10 pt-4">
          {phase === 'incoming' ? (
            <div className="flex items-center justify-center gap-16">
              <button
                onClick={call.declineCall}
                aria-label="Decline call"
                className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 transition-transform active:scale-95"
              >
                <PhoneOff className="h-6 w-6" />
              </button>
              <button
                onClick={call.acceptCall}
                aria-label="Accept call"
                className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 transition-transform active:scale-95"
              >
                <Phone className="h-6 w-6" />
              </button>
            </div>
          ) : phase === 'ended' ? null : (
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={call.toggleMic}
                aria-label={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
                className={clsx(
                  'flex h-14 w-14 items-center justify-center rounded-full transition-colors',
                  micEnabled ? 'bg-white/15' : 'bg-white text-[#0E0E10]'
                )}
              >
                {micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </button>

              <button
                onClick={call.endCall}
                aria-label="End call"
                className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 transition-transform active:scale-95"
              >
                <PhoneOff className="h-6 w-6" />
              </button>

              {isVideo && (
                <button
                  onClick={call.toggleCamera}
                  aria-label={cameraEnabled ? 'Turn camera off' : 'Turn camera on'}
                  className={clsx(
                    'flex h-14 w-14 items-center justify-center rounded-full transition-colors',
                    cameraEnabled ? 'bg-white/15' : 'bg-white text-[#0E0E10]'
                  )}
                >
                  {cameraEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default CallOverlay;
