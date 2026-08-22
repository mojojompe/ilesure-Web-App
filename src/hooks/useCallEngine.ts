import { useCallback, useEffect, useRef, useState } from 'react';
import { socketService } from '../api/socket';
import {
  callApi,
  FALLBACK_ICE,
  type CallEndedPayload,
  type CallSignalPayload,
  type CallType,
  type IncomingCallPayload,
} from '../api/callApi';

const getSocket = () => socketService.getSocket();

/**
 * One-to-one voice and video calling.
 *
 * Three properties matter, and each of them is a bug that is invisible when you get it
 * wrong — the call simply sits there showing nothing, with no error anywhere:
 *
 * 1. **A connection carries the tracks it had when it was created.** `getUserMedia` is
 *    asynchronous, so signalling that arrives before the camera resolves has to be queued
 *    and replayed once media settles. Negotiating early produces a connection with nothing
 *    on it: ICE succeeds, no error appears, and both sides look at a black tile.
 *
 * 2. **ICE candidates arriving before the remote description must be queued.**
 *    `addIceCandidate` throws if there is no remote description yet, and the candidates it
 *    rejects are frequently the only ones that would have worked.
 *
 * 3. **Exactly one side offers.** Here that is always the caller, so the glare handling a
 *    mesh needs does not arise. The caller offers when the callee accepts; the callee only
 *    ever answers.
 *
 * Refusing the camera is not a failure: that user contributes no video but still receives
 * the other side, and audio flows in both directions.
 */

export type CallPhase = 'idle' | 'outgoing' | 'incoming' | 'connecting' | 'active' | 'ended';
export type MediaError = 'denied' | 'not-found' | 'unsupported' | null;

export interface CallPeer {
  id: string;
  fullName: string;
  avatar?: string;
}

export interface CallState {
  phase: CallPhase;
  callId: string | null;
  chatId: string | null;
  callType: CallType;
  peer: CallPeer | null;
  isCaller: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  micEnabled: boolean;
  cameraEnabled: boolean;
  mediaError: MediaError;
  /** False when the server has no TURN configured — relay-dependent peers will fail. */
  relayAvailable: boolean;
  /** Human-readable reason the last call ended, shown briefly before the UI closes. */
  endedReason: string | null;
  durationSeconds: number;
}

const IDLE: CallState = {
  phase: 'idle',
  callId: null,
  chatId: null,
  callType: 'audio',
  peer: null,
  isCaller: false,
  localStream: null,
  remoteStream: null,
  micEnabled: true,
  cameraEnabled: true,
  mediaError: null,
  relayAvailable: true,
  endedReason: null,
  durationSeconds: 0,
};

/** How long the "call ended" state stays on screen before the UI dismisses itself. */
const ENDED_LINGER_MS = 2500;

const trace = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.info('[call]', ...args);
};

/**
 * @param enabled  whether the engine should run at all. Calling is meaningless
 *   before sign-in, and its ICE request 401s there.
 */
export function useCallEngine(enabled: boolean = true) {
  const [state, setState] = useState<CallState>(IDLE);

  /**
   * Bumped when the shared socket appears.
   *
   * The socket is connected asynchronously after login, so on first render there is
   * nothing to attach listeners to. Without this the provider mounts, finds no socket,
   * and never hears an incoming call for the rest of the session.
   */
  const [socketEpoch, setSocketEpoch] = useState(0);

  const pc = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const iceConfig = useRef<RTCConfiguration>(FALLBACK_ICE);

  const callIdRef = useRef<string | null>(null);
  const isCallerRef = useRef(false);

  /**
   * Signalling that arrived before local media settled, replayed once it has.
   * See note 1 at the top of this file.
   */
  const mediaSettled = useRef(false);
  const pendingOffer = useRef<RTCSessionDescriptionInit | null>(null);
  const candidateQueue = useRef<RTCIceCandidateInit[]>([]);
  const remoteDescriptionSet = useRef(false);
  /** Guards ensureIceConfig so the credentials are fetched at most once. */
  const iceFetched = useRef(false);

  const endedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (getSocket()) return;
    const poll = setInterval(() => {
      if (getSocket()) setSocketEpoch((e) => e + 1);
    }, 500);
    return () => clearInterval(poll);
  }, [socketEpoch, enabled]);

  /* ---------------------------------------------------------------------- */
  /* ICE configuration                                                      */
  /* ---------------------------------------------------------------------- */

  /**
   * Fetches the ICE configuration the first time a call actually needs it.
   *
   * This used to run on mount. Two problems with that: it fired an
   * authenticated request during app start — so a stale token in storage
   * produced a 401 on /calls/ice before the user had done anything, and it was
   * that background request which discovered the dead session. And TURN
   * credentials are time-limited (12-24h), so a long-lived tab could reach a
   * call holding expired ones.
   *
   * Fetching at call setup costs one request on a path that is already doing
   * network round trips, and the result is cached for the rest of the session.
   */
  const ensureIceConfig = useCallback(async () => {
    if (iceFetched.current) return;
    iceFetched.current = true;
    try {
      const config = await callApi.getIceConfig();
      if (config?.iceServers?.length) {
        iceConfig.current = { iceServers: config.iceServers };
        setState((s) => ({ ...s, relayAvailable: config.turnConfigured }));
      }
    } catch {
      // Falls back to whatever default iceConfig already holds; a call over
      // STUN alone is better than no call at all.
      iceFetched.current = false;
    }
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Teardown                                                               */
  /* ---------------------------------------------------------------------- */

  const teardown = useCallback(() => {
    pc.current?.close();
    pc.current = null;

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;

    callIdRef.current = null;
    isCallerRef.current = false;
    mediaSettled.current = false;
    pendingOffer.current = null;
    candidateQueue.current = [];
    remoteDescriptionSet.current = false;
  }, []);

  const finish = useCallback(
    (reason: string) => {
      teardown();
      setState((s) => ({
        ...IDLE,
        relayAvailable: s.relayAvailable,
        phase: 'ended',
        endedReason: reason,
        durationSeconds: s.durationSeconds,
        // The ended card still shows who the call was with, so the peer and the
        // call type have to survive the reset. Spreading IDLE alone wiped them,
        // which is why it read "Unknown" with no avatar.
        peer: s.peer,
        callType: s.callType,
        isCaller: s.isCaller,
      }));

      if (endedTimer.current) clearTimeout(endedTimer.current);
      endedTimer.current = setTimeout(() => {
        setState((s) => (s.phase === 'ended' ? { ...IDLE, relayAvailable: s.relayAvailable } : s));
      }, ENDED_LINGER_MS);
    },
    [teardown]
  );

  /* ---------------------------------------------------------------------- */
  /* Local media                                                            */
  /* ---------------------------------------------------------------------- */

  /**
   * Acquires the microphone (and camera for video calls).
   *
   * Never rejects. A refused or missing device downgrades the call rather than ending it:
   * the user still hears and is heard where possible, which is far better than a dead call
   * and an error toast.
   */
  const acquireMedia = useCallback(async (callType: CallType): Promise<MediaStream | null> => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState((s) => ({ ...s, mediaError: 'unsupported' }));
      mediaSettled.current = true;
      return null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video' ? { facingMode: 'user' } : false,
      });
      localStreamRef.current = stream;
      setState((s) => ({ ...s, localStream: stream, mediaError: null }));
      return stream;
    } catch (error) {
      const name = (error as DOMException)?.name;
      // A video call whose camera is refused still works as a voice call. Retry audio-only
      // before giving up on media entirely.
      if (callType === 'video') {
        try {
          const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          localStreamRef.current = audioOnly;
          setState((s) => ({ ...s, localStream: audioOnly, cameraEnabled: false, mediaError: 'denied' }));
          return audioOnly;
        } catch {
          /* fall through */
        }
      }
      setState((s) => ({
        ...s,
        mediaError: name === 'NotFoundError' ? 'not-found' : 'denied',
      }));
      return null;
    } finally {
      mediaSettled.current = true;
    }
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Peer connection                                                        */
  /* ---------------------------------------------------------------------- */

  const createPeerConnection = useCallback(
    (callId: string): RTCPeerConnection => {
      const connection = new RTCPeerConnection(iceConfig.current);

      const stream = localStreamRef.current;
      if (stream) {
        // Tracks must be attached before negotiation — see note 1 at the top of this file.
        stream.getTracks().forEach((track) => connection.addTrack(track, stream));
      }

      connection.onicecandidate = (event) => {
        if (event.candidate) callApi.sendIceCandidate(callId, event.candidate.toJSON());
      };

      connection.ontrack = (event) => {
        const [remote] = event.streams;
        if (remote) {
          trace('remote track', event.track.kind);
          setState((s) => ({ ...s, remoteStream: remote }));
        }
      };

      connection.onconnectionstatechange = () => {
        const connectionState = connection.connectionState;
        trace('connection state', connectionState);

        if (connectionState === 'connected') {
          callApi.reportConnected(callId);
          setState((s) => (s.phase === 'active' ? s : { ...s, phase: 'active' }));
        } else if (connectionState === 'failed') {
          // ICE exhausted every candidate pair. Almost always a relay problem: without
          // TURN, peers behind symmetric NAT reach exactly this state.
          callApi.end(callId, 'ice_failed');
          finish('Connection failed');
        }
      };

      pc.current = connection;
      return connection;
    },
    [finish]
  );

  /** Candidates that arrived before the remote description existed. */
  const flushCandidateQueue = useCallback(async () => {
    const connection = pc.current;
    if (!connection || !remoteDescriptionSet.current) return;
    const queued = candidateQueue.current;
    candidateQueue.current = [];
    for (const candidate of queued) {
      try {
        await connection.addIceCandidate(candidate);
      } catch (error) {
        trace('failed to add queued candidate', error);
      }
    }
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Negotiation                                                            */
  /* ---------------------------------------------------------------------- */

  /** Caller side: the callee picked up, so offer. */
  const sendOffer = useCallback(
    async (callId: string) => {
      await ensureIceConfig();
      const connection = pc.current ?? createPeerConnection(callId);
      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);
      callApi.sendOffer(callId, offer);
      trace('offer sent');
    },
    [createPeerConnection, ensureIceConfig]
  );

  /** Callee side: answer the caller's offer. */
  const answerOffer = useCallback(
    async (callId: string, sdp: RTCSessionDescriptionInit) => {
      await ensureIceConfig();
      const connection = pc.current ?? createPeerConnection(callId);
      await connection.setRemoteDescription(sdp);
      remoteDescriptionSet.current = true;
      await flushCandidateQueue();

      const answer = await connection.createAnswer();
      await connection.setLocalDescription(answer);
      callApi.sendAnswer(callId, answer);
      trace('answer sent');
    },
    [createPeerConnection, flushCandidateQueue]
  );

  /* ---------------------------------------------------------------------- */
  /* Public actions                                                         */
  /* ---------------------------------------------------------------------- */

  const startCall = useCallback(
    async (chatId: string, callType: CallType, peer: CallPeer) => {
      if (callIdRef.current) return;

      setState({
        ...IDLE,
        phase: 'outgoing',
        chatId,
        callType,
        peer,
        isCaller: true,
        cameraEnabled: callType === 'video',
        relayAvailable: state.relayAvailable,
      });
      isCallerRef.current = true;

      // Acquire media before dialling. The alternative — ringing first and asking for the
      // camera afterwards — means the permission prompt lands while the other side is
      // already picking up.
      await acquireMedia(callType);

      const result = await callApi.initiate(chatId, callType);
      if (!result.ok || !result.callId) {
        const reasons: Record<string, string> = {
          PEER_BUSY: 'They are on another call',
          ALREADY_IN_CALL: 'You are already in a call',
          RATE_LIMITED: 'Too many call attempts. Please wait a moment.',
          FORBIDDEN: 'You cannot call this person',
          SOCKET_DISCONNECTED: 'You appear to be offline',
          TIMEOUT: 'Could not reach the server',
        };
        finish(reasons[result.error ?? ''] ?? 'Call failed');
        return;
      }

      callIdRef.current = result.callId;
      setState((s) => ({ ...s, callId: result.callId! }));
    },
    [acquireMedia, finish, state.relayAvailable]
  );

  const acceptCall = useCallback(async () => {
    const callId = callIdRef.current;
    if (!callId) return;

    setState((s) => ({ ...s, phase: 'connecting' }));
    // Only now — asking for the camera while the phone is still ringing would prompt a
    // user who has not yet decided to answer.
    await acquireMedia(state.callType);
    callApi.accept(callId);

    // The caller's offer may already have arrived while media was being acquired.
    const queued = pendingOffer.current;
    if (queued) {
      pendingOffer.current = null;
      await answerOffer(callId, queued);
    }
  }, [acquireMedia, answerOffer, state.callType]);

  const declineCall = useCallback(() => {
    const callId = callIdRef.current;
    if (callId) callApi.decline(callId);
    finish('Call declined');
  }, [finish]);

  const endCall = useCallback(() => {
    const callId = callIdRef.current;
    if (callId) callApi.end(callId);
    finish('Call ended');
  }, [finish]);

  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const enabled = !stream.getAudioTracks().every((t) => t.enabled);
    stream.getAudioTracks().forEach((t) => (t.enabled = enabled));
    setState((s) => ({ ...s, micEnabled: enabled }));
  }, []);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const tracks = stream.getVideoTracks();
    if (!tracks.length) return;
    const enabled = !tracks.every((t) => t.enabled);
    tracks.forEach((t) => (t.enabled = enabled));
    setState((s) => ({ ...s, cameraEnabled: enabled }));
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Socket wiring                                                          */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!enabled) return;
    const socket = getSocket();
    if (!socket) return;

    const onIncoming = (payload: IncomingCallPayload) => {
      // Already busy: the server enforces one call at a time, so this only happens in a
      // race. Decline rather than dropping the current call on the floor.
      if (callIdRef.current) {
        callApi.decline(payload.callId, 'busy');
        return;
      }
      trace('incoming', payload.callId);
      callIdRef.current = payload.callId;
      isCallerRef.current = false;
      setState((s) => ({
        ...IDLE,
        relayAvailable: s.relayAvailable,
        phase: 'incoming',
        callId: payload.callId,
        chatId: payload.chatId,
        callType: payload.callType,
        cameraEnabled: payload.callType === 'video',
        peer: {
          id: payload.caller._id,
          fullName: payload.caller.fullName,
          avatar: payload.caller.avatar,
        },
      }));
    };

    const onAccepted = async (payload: { callId: string }) => {
      if (payload.callId !== callIdRef.current) return;
      setState((s) => (s.phase === 'outgoing' ? { ...s, phase: 'connecting' } : s));
      // Only the caller offers — see note 3 at the top of this file.
      if (isCallerRef.current) await sendOffer(payload.callId);
    };

    const onOffer = async (payload: CallSignalPayload) => {
      if (payload.callId !== callIdRef.current || !payload.sdp) return;
      // Media may still be resolving; hold the offer rather than negotiating a connection
      // with no tracks on it.
      if (!mediaSettled.current) {
        trace('offer queued until media settles');
        pendingOffer.current = payload.sdp;
        return;
      }
      await answerOffer(payload.callId, payload.sdp);
    };

    const onAnswer = async (payload: CallSignalPayload) => {
      if (payload.callId !== callIdRef.current || !payload.sdp || !pc.current) return;
      await pc.current.setRemoteDescription(payload.sdp);
      remoteDescriptionSet.current = true;
      await flushCandidateQueue();
    };

    const onIce = async (payload: CallSignalPayload) => {
      if (payload.callId !== callIdRef.current || !payload.candidate) return;
      if (!pc.current || !remoteDescriptionSet.current) {
        candidateQueue.current.push(payload.candidate);
        return;
      }
      try {
        await pc.current.addIceCandidate(payload.candidate);
      } catch (error) {
        trace('failed to add candidate', error);
      }
    };

    const onEnded = (payload: CallEndedPayload) => {
      if (payload.callId !== callIdRef.current) return;
      const reasons: Record<string, string> = {
        missed: 'No answer',
        declined: 'Call declined',
        failed: 'Call failed',
        ended: 'Call ended',
      };
      finish(reasons[payload.status] ?? 'Call ended');
    };

    const onBusy = () => finish('They are on another call');
    const onError = (payload: { message?: string }) => finish(payload?.message || 'Call failed');

    socket.on('call:incoming', onIncoming);
    socket.on('call:accepted', onAccepted);
    socket.on('call:offer', onOffer);
    socket.on('call:answer', onAnswer);
    socket.on('call:ice', onIce);
    socket.on('call:ended', onEnded);
    socket.on('call:busy', onBusy);
    socket.on('call:error', onError);

    return () => {
      socket.off('call:incoming', onIncoming);
      socket.off('call:accepted', onAccepted);
      socket.off('call:offer', onOffer);
      socket.off('call:answer', onAnswer);
      socket.off('call:ice', onIce);
      socket.off('call:ended', onEnded);
      socket.off('call:busy', onBusy);
      socket.off('call:error', onError);
    };
  }, [answerOffer, finish, flushCandidateQueue, sendOffer, socketEpoch, enabled]);

  /* ---------------------------------------------------------------------- */
  /* Call timer                                                             */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (state.phase !== 'active') return;
    const timer = setInterval(() => {
      setState((s) => ({ ...s, durationSeconds: s.durationSeconds + 1 }));
    }, 1000);
    return () => clearInterval(timer);
  }, [state.phase]);

  /** Release the camera if the tab is closed mid-call. */
  useEffect(() => teardown, [teardown]);

  return {
    ...state,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMic,
    toggleCamera,
  };
}

export default useCallEngine;
