/**
 * Call-session core: one-to-one voice and video calling, platform-free.
 *
 * VENDORED FILE. The canonical copy is ilesure-pwa/src/lib/call/callSession.ts.
 * Byte-identical copies live in IleSure/src/lib/call/ and ilesure-Web-App/src/lib/call/.
 * Sync rule: edit the PWA copy only, copy it verbatim to the other two repos, and run
 * `npm run check:call-core` in each; the check fails on any drift. Tests for this file
 * live next to the canonical copy (callSession.test.ts, run with `npm test` in the PWA).
 *
 * This module owns the call-phase machine and the signalling ordering. It knows nothing
 * about React, react-native-webrtc, the browser, sockets or environment flags: those come
 * in through two ports (PeerAdapter for media and peer connections, SignallingPort for
 * the call:* socket events) plus an injected ICE fetcher and logger.
 *
 * Three properties matter, and each of them is a bug that is invisible when you get it
 * wrong, the call simply sits there showing nothing, with no error anywhere:
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
 * A fourth property is enforced here rather than left to luck: **work from a call that has
 * ended never touches the next one.** Every async step captures a generation number and
 * bails if a teardown happened while it was awaiting, so a late getUserMedia, initiate ack
 * or setRemoteDescription cannot leak a camera or resurrect a finished call.
 *
 * Refusing the camera is not a failure: that user contributes no video but still receives
 * the other side, and audio flows in both directions.
 */

/* -------------------------------------------------------------------------- */
/* Domain types                                                               */
/* -------------------------------------------------------------------------- */

export type CallType = 'audio' | 'video';
export type CallPhase = 'idle' | 'outgoing' | 'incoming' | 'connecting' | 'active' | 'ended';
export type MediaError = 'denied' | 'not-found' | 'unsupported' | null;

export interface CallPeer {
  id: string;
  fullName: string;
  avatar?: string;
}

/** The slice of a media track the core needs. Browser and react-native-webrtc tracks both fit. */
export interface TrackLike {
  readonly kind: string;
  enabled: boolean;
  stop(): void;
}

/** The slice of a media stream the core needs. */
export interface StreamLike {
  getTracks(): TrackLike[];
  getAudioTracks(): TrackLike[];
  getVideoTracks(): TrackLike[];
}

export type TrackOf<TStream extends StreamLike> = ReturnType<TStream['getTracks']>[number];

/** Opaque to the core: relayed verbatim between the peer connection and the socket. */
export interface SessionDescription {
  type: string;
  sdp?: string;
}

/** Opaque to the core: relayed verbatim between the peer connection and the socket. */
export interface IceCandidate {
  candidate?: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
}

export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface IceConfig {
  iceServers?: IceServer[];
}

export interface CallSessionState<TStream> {
  phase: CallPhase;
  callId: string | null;
  chatId: string | null;
  callType: CallType;
  peer: CallPeer | null;
  isCaller: boolean;
  localStream: TStream | null;
  remoteStream: TStream | null;
  micEnabled: boolean;
  cameraEnabled: boolean;
  /** Which camera the local video track is currently using (only meaningful with switchCamera). */
  frontCamera: boolean;
  /** True when audio is routed to the loudspeaker (only meaningful with an audioRoute). */
  speakerOn: boolean;
  mediaError: MediaError;
  /** False when the server has no TURN configured, relay-dependent peers will fail. */
  relayAvailable: boolean;
  /** Human-readable reason the last call ended, shown briefly before the UI closes. */
  endedReason: string | null;
  durationSeconds: number;
}

export function idleCallState<TStream>(): CallSessionState<TStream> {
  return {
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
    frontCamera: true,
    speakerOn: false,
    mediaError: null,
    relayAvailable: true,
    endedReason: null,
    durationSeconds: 0,
  };
}

/* -------------------------------------------------------------------------- */
/* Ports                                                                      */
/* -------------------------------------------------------------------------- */

/** One RTCPeerConnection, reduced to what negotiation needs. */
export interface PeerConnectionPort<TStream extends StreamLike> {
  addTrack(track: TrackOf<TStream>, stream: TStream): void;
  createOffer(): Promise<SessionDescription>;
  createAnswer(): Promise<SessionDescription>;
  setLocalDescription(description: SessionDescription): Promise<void>;
  setRemoteDescription(description: SessionDescription): Promise<void>;
  addIceCandidate(candidate: IceCandidate): Promise<void>;
  close(): void;
}

export interface PeerConnectionEvents<TStream> {
  onIceCandidate(candidate: IceCandidate): void;
  onRemoteStream(stream: TStream, trackKind?: string): void;
  /** RTCPeerConnection.connectionState: 'new' | 'connecting' | 'connected' | 'failed' | ... */
  onConnectionStateChange(state: string): void;
}

export interface MediaConstraints {
  audio: true;
  video: false | { facingMode: 'user' };
}

/**
 * Media and peer-connection port. Two adapters exist: browser (RTCPeerConnection +
 * navigator.mediaDevices) and React Native (react-native-webrtc + InCallManager).
 */
export interface PeerAdapter<TStream extends StreamLike> {
  createPeerConnection(config: IceConfig, events: PeerConnectionEvents<TStream>): PeerConnectionPort<TStream>;
  /** Rejects when the user refuses or no device exists; `error.name` is read for 'NotFoundError'. */
  getUserMedia(constraints: MediaConstraints): Promise<TStream>;
  /** Optional: false when the platform has no getUserMedia at all (insecure origin, old browser). */
  isMediaSupported?(): boolean;
  /** Optional capability: call audio mode and earpiece/loudspeaker routing. */
  audioRoute?: {
    start(callType: CallType): void;
    stop(): void;
    setSpeaker(on: boolean): void;
  };
  /** Optional capability: flip front/back camera in place. Returns true when it switched. */
  switchCamera?(stream: TStream): boolean;
}

export interface IncomingCallEvent {
  callId: string;
  chatId: string;
  callType: CallType;
  caller: { _id: string; fullName: string; avatar?: string };
}

export interface CallSignalEvent {
  callId: string;
  sdp?: SessionDescription;
  candidate?: IceCandidate;
}

export interface CallEndedEvent {
  callId: string;
  status: string;
}

export interface SignallingHandlers {
  incoming(payload: IncomingCallEvent): void;
  accepted(payload: { callId: string }): void;
  offer(payload: CallSignalEvent): void;
  answer(payload: CallSignalEvent): void;
  ice(payload: CallSignalEvent): void;
  ended(payload: CallEndedEvent): void;
  busy(payload?: { chatId?: string } | null): void;
  error(payload?: { message?: string } | null): void;
}

export interface InitiateResult {
  ok: boolean;
  callId?: string;
  error?: string;
}

/** The call:* socket contract: emits plus one subscription to the inbound events. */
export interface SignallingPort {
  initiate(chatId: string, callType: CallType): Promise<InitiateResult>;
  accept(callId: string): void;
  decline(callId: string, reason?: string): void;
  end(callId: string, reason?: string): void;
  sendOffer(callId: string, sdp: SessionDescription): void;
  sendAnswer(callId: string, sdp: SessionDescription): void;
  sendIceCandidate(callId: string, candidate: IceCandidate): void;
  reportConnected(callId: string): void;
  /** Attaches the handlers to call:incoming/accepted/offer/answer/ice/ended/busy/error. */
  subscribe(handlers: SignallingHandlers): () => void;
}

export interface IceConfigResult {
  iceServers?: IceServer[];
  turnConfigured?: boolean;
}

export interface CallSessionDeps<TStream extends StreamLike> {
  peer: PeerAdapter<TStream>;
  signalling: SignallingPort;
  /** Fetched lazily at negotiation time, see ensureIceConfig. May resolve null. */
  fetchIceConfig(): Promise<IceConfigResult | null>;
  /** Used until the server's ICE configuration arrives, and if that request fails. */
  fallbackIce: IceConfig;
  /** Debug trace. The host decides whether it prints (__DEV__, import.meta.env.DEV). */
  log?(...args: unknown[]): void;
  /** How long the "call ended" state stays on screen. Default 2500ms. */
  endedLingerMs?: number;
}

export interface CallSession<TStream extends StreamLike> {
  getState(): CallSessionState<TStream>;
  /** Called after every state change. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;
  /** Attaches the signalling handlers. Call when the socket exists; returns detach. */
  connect(): () => void;
  startCall(chatId: string, callType: CallType, peer: CallPeer): Promise<void>;
  acceptCall(): Promise<void>;
  declineCall(): void;
  endCall(): void;
  toggleMic(): void;
  toggleCamera(): void;
  toggleSpeaker(): void;
  switchCamera(): void;
  /** Releases media and the connection (unmount). The session stays usable afterwards. */
  dispose(): void;
}

/* -------------------------------------------------------------------------- */
/* Implementation                                                             */
/* -------------------------------------------------------------------------- */

const DEFAULT_ENDED_LINGER_MS = 2500;

const INITIATE_FAILURES: Record<string, string> = {
  PEER_BUSY: 'They are on another call',
  ALREADY_IN_CALL: 'You are already in a call',
  RATE_LIMITED: 'Too many call attempts. Please wait a moment.',
  FORBIDDEN: 'You cannot call this person',
  SOCKET_DISCONNECTED: 'You appear to be offline',
  TIMEOUT: 'Could not reach the server',
};

const ENDED_REASONS: Record<string, string> = {
  missed: 'No answer',
  declined: 'Call declined',
  failed: 'Call failed',
  ended: 'Call ended',
};

/** Phases in which this device is on, or setting up, a call. */
const LIVE_PHASES: ReadonlySet<CallPhase> = new Set<CallPhase>(['outgoing', 'incoming', 'connecting', 'active']);

export function createCallSession<TStream extends StreamLike>(deps: CallSessionDeps<TStream>): CallSession<TStream> {
  const { peer: media, signalling } = deps;
  const log = (...args: unknown[]) => deps.log?.(...args);
  const endedLingerMs = deps.endedLingerMs ?? DEFAULT_ENDED_LINGER_MS;

  let state: CallSessionState<TStream> = idleCallState<TStream>();
  const listeners = new Set<() => void>();

  let pc: PeerConnectionPort<TStream> | null = null;
  let localStream: TStream | null = null;
  let iceConfig: IceConfig = deps.fallbackIce;
  let iceRequest: Promise<void> | null = null;

  let callId: string | null = null;
  let isCaller = false;
  /** Bumped by every teardown; async work compares against the value it started with. */
  let generation = 0;

  /**
   * Signalling that arrived before local media settled, replayed once it has.
   * See note 1 at the top of this file.
   */
  let mediaSettled = false;
  let pendingOffer: SessionDescription | null = null;
  let candidateQueue: IceCandidate[] = [];
  let remoteDescriptionSet = false;
  /** Set synchronously when negotiation starts, so duplicate accepted/offer/answer events are no-ops. */
  let offerStarted = false;
  let answerStarted = false;
  let remoteAnswerApplied = false;

  let endedTimer: ReturnType<typeof setTimeout> | null = null;
  let durationTimer: ReturnType<typeof setInterval> | null = null;

  const isStale = (gen: number) => gen !== generation;

  /* ---- State ------------------------------------------------------------ */

  function setState(next: CallSessionState<TStream>) {
    if (next === state) return;
    state = next;
    syncDurationTimer();
    listeners.forEach((listener) => listener());
  }

  function update(patch: Partial<CallSessionState<TStream>>) {
    setState({ ...state, ...patch });
  }

  function syncDurationTimer() {
    if (state.phase === 'active' && !durationTimer) {
      durationTimer = setInterval(() => update({ durationSeconds: state.durationSeconds + 1 }), 1000);
    } else if (state.phase !== 'active' && durationTimer) {
      clearInterval(durationTimer);
      durationTimer = null;
    }
  }

  /* ---- ICE configuration ------------------------------------------------ */

  /**
   * Fetches the ICE configuration the first time a call actually needs it.
   *
   * Not on mount: that fired an authenticated request during app start, so a stale token
   * produced a 401 on /calls/ice before the user had done anything (and on mobile a failed
   * refresh clears auth, signing the user out). TURN credentials are also time-limited
   * (12-24h), so a long-lived session could reach a call holding expired ones.
   *
   * One request is shared by concurrent callers and cached on success; a failed or empty
   * response is retried at the next negotiation. Until then the fallback (STUN) applies: a
   * call over STUN alone is better than no call at all.
   */
  function ensureIceConfig(): Promise<void> {
    if (!iceRequest) {
      iceRequest = fetchIce().then((ok) => {
        if (!ok) iceRequest = null;
      });
    }
    return iceRequest;
  }

  async function fetchIce(): Promise<boolean> {
    try {
      const config = await deps.fetchIceConfig();
      if (config?.iceServers?.length) {
        iceConfig = { iceServers: config.iceServers };
        update({ relayAvailable: config.turnConfigured === true });
        return true;
      }
    } catch (error) {
      log('ice config fetch failed', error);
    }
    return false;
  }

  /* ---- Teardown --------------------------------------------------------- */

  function teardown() {
    generation += 1;

    try {
      media.audioRoute?.stop();
    } catch {
      // Nothing to restore if it never started.
    }

    try {
      pc?.close();
    } catch (error) {
      log('close failed', error);
    }
    pc = null;

    stopStream(localStream);
    localStream = null;

    callId = null;
    isCaller = false;
    mediaSettled = false;
    pendingOffer = null;
    candidateQueue = [];
    remoteDescriptionSet = false;
    offerStarted = false;
    answerStarted = false;
    remoteAnswerApplied = false;
  }

  function stopStream(stream: TStream | null) {
    stream?.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch {
        /* already stopped */
      }
    });
  }

  function finish(reason: string) {
    teardown();
    const previous = state;
    setState({
      ...idleCallState<TStream>(),
      relayAvailable: previous.relayAvailable,
      phase: 'ended',
      endedReason: reason,
      durationSeconds: previous.durationSeconds,
      // The ended card still shows who the call was with, so the peer and the call type
      // have to survive the reset. Spreading IDLE alone wiped them, which is why it read
      // "Unknown" with no avatar.
      peer: previous.peer,
      callType: previous.callType,
      isCaller: previous.isCaller,
    });

    if (endedTimer) clearTimeout(endedTimer);
    endedTimer = setTimeout(() => {
      endedTimer = null;
      if (state.phase === 'ended') setState({ ...idleCallState<TStream>(), relayAvailable: state.relayAvailable });
    }, endedLingerMs);
  }

  /** Negotiation threw. Nothing will recover the connection, so end rather than hang. */
  function failNegotiation(gen: number, id: string, error: unknown) {
    if (isStale(gen)) return;
    log('negotiation failed', error);
    signalling.end(id, 'negotiation_failed');
    finish('Connection failed');
  }

  /* ---- Local media ------------------------------------------------------ */

  /**
   * Acquires the microphone (and camera for video calls).
   *
   * Never rejects. A refused or missing device downgrades the call rather than ending it:
   * the user still hears and is heard where possible, which is far better than a dead call
   * and an error toast. A stream that arrives after the call ended is stopped at once.
   */
  async function acquireMedia(callType: CallType, gen: number): Promise<void> {
    try {
      if (media.isMediaSupported && !media.isMediaSupported()) {
        update({ mediaError: 'unsupported' });
        return;
      }

      let stream: TStream;
      try {
        stream = await media.getUserMedia({
          audio: true,
          video: callType === 'video' ? { facingMode: 'user' } : false,
        });
      } catch (error) {
        if (isStale(gen)) return;
        // A video call whose camera is refused still works as a voice call. Retry
        // audio-only before giving up on media entirely.
        if (callType === 'video') {
          try {
            const audioOnly = await media.getUserMedia({ audio: true, video: false });
            if (isStale(gen)) {
              stopStream(audioOnly);
              return;
            }
            localStream = audioOnly;
            startAudioRoute(callType);
            update({ localStream: audioOnly, cameraEnabled: false, mediaError: 'denied' });
            return;
          } catch {
            /* fall through */
          }
        }
        if (isStale(gen)) return;
        const name = (error as { name?: string } | null)?.name;
        update({ mediaError: name === 'NotFoundError' ? 'not-found' : 'denied' });
        return;
      }

      if (isStale(gen)) {
        stopStream(stream);
        return;
      }
      localStream = stream;
      startAudioRoute(callType);
      update({ localStream: stream, mediaError: null });
    } finally {
      if (!isStale(gen)) mediaSettled = true;
    }
  }

  /**
   * Puts the device into call audio mode where the platform has one: earpiece for a voice
   * call, speaker for video (the phone is held away from the ear).
   */
  function startAudioRoute(callType: CallType) {
    if (!media.audioRoute) return;
    try {
      media.audioRoute.start(callType);
      const speakerDefault = callType === 'video';
      media.audioRoute.setSpeaker(speakerDefault);
      update({ speakerOn: speakerDefault });
    } catch {
      // Best-effort; the call still works on the OS default route.
    }
  }

  /* ---- Peer connection -------------------------------------------------- */

  function createPeerConnection(id: string, gen: number): PeerConnectionPort<TStream> {
    const connection = media.createPeerConnection(iceConfig, {
      onIceCandidate: (candidate) => {
        if (!isStale(gen)) signalling.sendIceCandidate(id, candidate);
      },
      onRemoteStream: (stream, kind) => {
        if (isStale(gen)) return;
        log('remote track', kind);
        update({ remoteStream: stream });
      },
      onConnectionStateChange: (connectionState) => {
        if (isStale(gen)) return;
        log('connection state', connectionState);
        if (connectionState === 'connected') {
          signalling.reportConnected(id);
          if (state.phase !== 'active') update({ phase: 'active' });
        } else if (connectionState === 'failed') {
          // ICE exhausted every candidate pair. Almost always a relay problem: without
          // TURN, peers behind symmetric NAT reach exactly this state.
          signalling.end(id, 'ice_failed');
          finish('Connection failed');
        }
      },
    });

    const stream = localStream;
    if (stream) {
      // Tracks must be attached before negotiation, see note 1 at the top of this file.
      stream.getTracks().forEach((track) => connection.addTrack(track as TrackOf<TStream>, stream));
    }

    pc = connection;
    return connection;
  }

  /** Candidates that arrived before the remote description existed. */
  async function flushCandidateQueue(gen: number) {
    const connection = pc;
    if (!connection || !remoteDescriptionSet) return;
    const queued = candidateQueue;
    candidateQueue = [];
    for (const candidate of queued) {
      if (isStale(gen)) return;
      try {
        await connection.addIceCandidate(candidate);
      } catch (error) {
        log('failed to add queued candidate', error);
      }
    }
  }

  /* ---- Negotiation ------------------------------------------------------ */

  /** Caller side: the callee picked up, so offer. */
  async function sendOffer(id: string, gen: number) {
    if (offerStarted) return;
    offerStarted = true;
    try {
      await ensureIceConfig();
      if (isStale(gen)) return;
      const connection = pc ?? createPeerConnection(id, gen);
      const offer = await connection.createOffer();
      if (isStale(gen)) return;
      await connection.setLocalDescription(offer);
      if (isStale(gen)) return;
      signalling.sendOffer(id, offer);
      log('offer sent');
    } catch (error) {
      failNegotiation(gen, id, error);
    }
  }

  /** Callee side: answer the caller's offer. */
  async function answerOffer(id: string, sdp: SessionDescription, gen: number) {
    if (answerStarted) return;
    answerStarted = true;
    try {
      await ensureIceConfig();
      if (isStale(gen)) return;
      const connection = pc ?? createPeerConnection(id, gen);
      await connection.setRemoteDescription(sdp);
      if (isStale(gen)) return;
      remoteDescriptionSet = true;
      await flushCandidateQueue(gen);
      if (isStale(gen)) return;

      const answer = await connection.createAnswer();
      if (isStale(gen)) return;
      await connection.setLocalDescription(answer);
      if (isStale(gen)) return;
      signalling.sendAnswer(id, answer);
      log('answer sent');
    } catch (error) {
      failNegotiation(gen, id, error);
    }
  }

  /* ---- Public actions --------------------------------------------------- */

  async function startCall(chatId: string, callType: CallType, peer: CallPeer): Promise<void> {
    // Also refuses while a previous dial is still waiting for its call id.
    if (callId || LIVE_PHASES.has(state.phase)) return;
    const gen = generation;

    setState({
      ...idleCallState<TStream>(),
      phase: 'outgoing',
      chatId,
      callType,
      peer,
      isCaller: true,
      cameraEnabled: callType === 'video',
      relayAvailable: state.relayAvailable,
    });
    isCaller = true;

    // Acquire media before dialling. The alternative, ringing first and asking for the
    // camera afterwards, means the permission prompt lands while the other side is
    // already picking up.
    await acquireMedia(callType, gen);
    if (isStale(gen)) return;

    let result: InitiateResult;
    try {
      result = await signalling.initiate(chatId, callType);
    } catch (error) {
      log('initiate failed', error);
      result = { ok: false };
    }

    if (isStale(gen)) {
      // Hung up while the server was placing the call: cancel it rather than leave the
      // other side ringing for a caller who is gone.
      if (result.ok && result.callId) signalling.end(result.callId);
      return;
    }

    if (!result.ok || !result.callId) {
      finish(INITIATE_FAILURES[result.error ?? ''] ?? 'Call failed');
      return;
    }

    callId = result.callId;
    update({ callId: result.callId });
  }

  async function acceptCall(): Promise<void> {
    const id = callId;
    // Only a ringing call can be accepted; a second tap (or the notification action racing
    // the in-app button) must not re-acquire media or re-send call:accept.
    if (!id || state.phase !== 'incoming') return;
    const gen = generation;

    update({ phase: 'connecting' });
    // Only now, asking for the camera while the phone is still ringing would prompt a
    // user who has not yet decided to answer.
    await acquireMedia(state.callType, gen);
    if (isStale(gen)) return;
    signalling.accept(id);

    // The caller's offer may already have arrived while media was being acquired.
    const queued = pendingOffer;
    if (queued) {
      pendingOffer = null;
      await answerOffer(id, queued, gen);
    }
  }

  function declineCall() {
    const id = callId;
    if (!id && !LIVE_PHASES.has(state.phase)) return;
    if (id) signalling.decline(id);
    finish('Call declined');
  }

  function endCall() {
    const id = callId;
    if (!id && !LIVE_PHASES.has(state.phase)) return;
    if (id) signalling.end(id);
    finish('Call ended');
  }

  function toggleMic() {
    const stream = localStream;
    if (!stream) return;
    const tracks = stream.getAudioTracks();
    const enabled = !tracks.every((t) => t.enabled);
    tracks.forEach((t) => (t.enabled = enabled));
    update({ micEnabled: enabled });
  }

  function toggleCamera() {
    const stream = localStream;
    if (!stream) return;
    const tracks = stream.getVideoTracks();
    if (!tracks.length) return;
    const enabled = !tracks.every((t) => t.enabled);
    tracks.forEach((t) => (t.enabled = enabled));
    update({ cameraEnabled: enabled });
  }

  /**
   * Routes call audio between the earpiece and the loudspeaker.
   *
   * A video call starts on speaker because the phone is held away from the ear; a voice
   * call starts on the earpiece, which is what a caller expects.
   */
  function toggleSpeaker() {
    const next = !state.speakerOn;
    try {
      media.audioRoute?.setSpeaker(next);
    } catch {
      // Audio routing is best-effort: if the native module is unavailable the call still
      // works, it just stays on whatever route the OS picked.
    }
    update({ speakerOn: next });
  }

  /** Front/back camera swap. Flips the track in place, so no renegotiation is needed. */
  function switchCamera() {
    const stream = localStream;
    if (!stream || !media.switchCamera) return;
    if (media.switchCamera(stream)) update({ frontCamera: !state.frontCamera });
  }

  /* ---- Inbound signalling ------------------------------------------------ */

  const handlers: SignallingHandlers = {
    incoming(payload) {
      // A re-delivered ring for the call we are already showing is not a second call.
      if (payload.callId === callId) return;
      // Already busy: the server enforces one call at a time, so this only happens in a
      // race. Decline rather than dropping the current call on the floor.
      if (callId || LIVE_PHASES.has(state.phase)) {
        signalling.decline(payload.callId, 'busy');
        return;
      }
      log('incoming', payload.callId);
      callId = payload.callId;
      isCaller = false;
      setState({
        ...idleCallState<TStream>(),
        relayAvailable: state.relayAvailable,
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
      });
    },

    accepted(payload) {
      if (!payload || payload.callId !== callId) return;
      if (state.phase === 'outgoing') update({ phase: 'connecting' });
      // Only the caller offers, see note 3 at the top of this file.
      if (isCaller) void sendOffer(payload.callId, generation);
    },

    offer(payload) {
      if (!payload || payload.callId !== callId || !payload.sdp) return;
      // The caller never answers an offer (note 3); one arriving here is glare or a replay.
      if (isCaller) return;
      // Media may still be resolving (or the user has not accepted yet); hold the offer
      // rather than negotiating a connection with no tracks on it.
      if (!mediaSettled) {
        log('offer queued until media settles');
        pendingOffer = payload.sdp;
        return;
      }
      void answerOffer(payload.callId, payload.sdp, generation);
    },

    answer(payload) {
      if (!payload || payload.callId !== callId || !payload.sdp || !pc || !isCaller) return;
      if (remoteAnswerApplied) return;
      remoteAnswerApplied = true;
      const gen = generation;
      const connection = pc;
      const id = payload.callId;
      void (async () => {
        try {
          await connection.setRemoteDescription(payload.sdp!);
          if (isStale(gen)) return;
          remoteDescriptionSet = true;
          await flushCandidateQueue(gen);
        } catch (error) {
          failNegotiation(gen, id, error);
        }
      })();
    },

    ice(payload) {
      if (!payload || payload.callId !== callId || !payload.candidate) return;
      if (!pc || !remoteDescriptionSet) {
        candidateQueue.push(payload.candidate);
        return;
      }
      pc.addIceCandidate(payload.candidate).catch((error) => log('failed to add candidate', error));
    },

    ended(payload) {
      if (!payload || payload.callId !== callId) return;
      finish(ENDED_REASONS[payload.status] ?? 'Call ended');
    },

    busy(payload) {
      // Sent alongside a PEER_BUSY initiate ack, before this side has a call id.
      if (state.phase !== 'outgoing') return;
      if (payload?.chatId && state.chatId && payload.chatId !== state.chatId) return;
      finish('They are on another call');
    },

    error(payload) {
      // call:error carries no call id; it only means something while a call is live.
      if (!LIVE_PHASES.has(state.phase)) return;
      finish(payload?.message || 'Call failed');
    },
  };

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    connect: () => signalling.subscribe(handlers),
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMic,
    toggleCamera,
    toggleSpeaker,
    switchCamera,
    dispose() {
      teardown();
      if (durationTimer) {
        clearInterval(durationTimer);
        durationTimer = null;
      }
    },
  };
}
