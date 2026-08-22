import apiClient from './client';
import { socketService } from './socket';

/**
 * Client half of the calling contract. See IleSure_Backend/src/services/callService.ts
 * for the server side and the reasoning behind the event shapes.
 */

export type CallType = 'audio' | 'video';

export interface IncomingCallPayload {
  callId: string;
  chatId: string;
  callType: CallType;
  caller: { _id: string; fullName: string; avatar?: string };
  listingId?: string;
  listingTitle?: string;
  expiresInMs: number;
}

export interface CallSignalPayload {
  callId: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  senderUserId: string;
}

export interface CallEndedPayload {
  callId: string;
  status: 'ended' | 'declined' | 'missed' | 'failed';
  reason: string;
  durationSeconds: number;
}

export interface IceConfigResponse {
  iceServers: RTCIceServer[];
  ttl: number;
  turnConfigured: boolean;
}

export interface CallAvailability {
  canCall: boolean;
  peerId: string | null;
  peerOnline: boolean;
  peerBusy: boolean;
}

/**
 * Used until the server's ICE configuration arrives, and if that request fails.
 *
 * STUN alone cannot connect peers behind symmetric NAT, so this is a floor rather than a
 * working default — the server supplies TURN when it is configured.
 */
export const FALLBACK_ICE: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ],
};

export const callApi = {
  async getIceConfig(): Promise<IceConfigResponse | null> {
    try {
      const { data } = await apiClient.get<{ success: boolean; data: IceConfigResponse }>('/calls/ice');
      return data?.data ?? null;
    } catch {
      return null;
    }
  },

  async getAvailability(chatId: string): Promise<CallAvailability | null> {
    try {
      const { data } = await apiClient.get<{ success: boolean; data: CallAvailability }>(
        `/calls/availability/${chatId}`
      );
      return data?.data ?? null;
    } catch {
      return null;
    }
  },

  /**
   * Places a call. Resolves with the server-assigned call id, which every subsequent
   * signalling message is keyed by.
   */
  initiate(chatId: string, callType: CallType): Promise<{ ok: boolean; callId?: string; error?: string }> {
    return new Promise((resolve) => {
      const socket = socketService.getSocket();
      if (!socket?.connected) {
        resolve({ ok: false, error: 'SOCKET_DISCONNECTED' });
        return;
      }
      // Guard against the ack never arriving: a socket that is "connected" but wedged
      // would otherwise leave the caller on a dialling screen forever.
      const timer = setTimeout(() => resolve({ ok: false, error: 'TIMEOUT' }), 10000);
      socket.emit(
        'call:initiate',
        { chatId, callType },
        (result: { ok: boolean; callId?: string; error?: string }) => {
          clearTimeout(timer);
          resolve(result);
        }
      );
    });
  },

  accept(callId: string) {
    socketService.getSocket()?.emit('call:accept', { callId });
  },

  decline(callId: string, reason?: string) {
    socketService.getSocket()?.emit('call:decline', { callId, reason });
  },

  end(callId: string, reason?: string) {
    socketService.getSocket()?.emit('call:end', { callId, reason });
  },

  sendOffer(callId: string, sdp: RTCSessionDescriptionInit) {
    socketService.getSocket()?.emit('call:offer', { callId, sdp });
  },

  sendAnswer(callId: string, sdp: RTCSessionDescriptionInit) {
    socketService.getSocket()?.emit('call:answer', { callId, sdp });
  },

  sendIceCandidate(callId: string, candidate: RTCIceCandidateInit) {
    socketService.getSocket()?.emit('call:ice', { callId, candidate });
  },

  /** Reported by the client because the server sees signalling only, never media. */
  reportConnected(callId: string) {
    socketService.getSocket()?.emit('call:connected', { callId });
  },
};

export default callApi;
