/**
 * Browser adapter for the call-session core's PeerAdapter port:
 * RTCPeerConnection + navigator.mediaDevices.
 *
 * VENDORED FILE. The canonical copy is ilesure-pwa/src/lib/call/browserPeerAdapter.ts, with
 * a byte-identical copy in ilesure-Web-App/src/lib/call/ (the React Native app has its own
 * adapter). Edit the PWA copy, copy it verbatim, run `npm run check:call-core` in both.
 */
import type {
  IceCandidate,
  IceConfig,
  PeerAdapter,
  PeerConnectionEvents,
  PeerConnectionPort,
  SessionDescription,
} from './callSession';

function createBrowserPeerConnection(
  config: IceConfig,
  events: PeerConnectionEvents<MediaStream>
): PeerConnectionPort<MediaStream> {
  const connection = new RTCPeerConnection(config as RTCConfiguration);

  connection.onicecandidate = (event) => {
    if (event.candidate) events.onIceCandidate(event.candidate.toJSON() as IceCandidate);
  };

  connection.ontrack = (event) => {
    const [remote] = event.streams ?? [];
    if (remote) events.onRemoteStream(remote, event.track?.kind);
  };

  connection.onconnectionstatechange = () => {
    events.onConnectionStateChange(connection.connectionState);
  };

  return {
    addTrack: (track, stream) => {
      connection.addTrack(track, stream);
    },
    createOffer: async () => (await connection.createOffer()) as SessionDescription,
    createAnswer: async () => (await connection.createAnswer()) as SessionDescription,
    setLocalDescription: (description) =>
      connection.setLocalDescription(description as RTCSessionDescriptionInit),
    setRemoteDescription: (description) =>
      connection.setRemoteDescription(description as RTCSessionDescriptionInit),
    addIceCandidate: (candidate) => connection.addIceCandidate(candidate as RTCIceCandidateInit),
    close: () => connection.close(),
  };
}

export const browserPeerAdapter: PeerAdapter<MediaStream> = {
  createPeerConnection: createBrowserPeerConnection,
  isMediaSupported: () => typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia,
  getUserMedia: (constraints) => navigator.mediaDevices.getUserMedia(constraints),
};

export default browserPeerAdapter;
