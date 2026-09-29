import { io, Socket } from 'socket.io-client';
import API_BASE_URL from './config';
import apiClient from './client';

/** True when a JWT's `exp` has passed (or is about to). Unparseable tokens count as not expired. */
function isTokenExpired(token: string, skewMs = 5000): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now() + skewMs;
  } catch {
    return false;
  }
}

/**
 * The one app-wide socket. `SocketConnection` in App.tsx owns its lifetime (connect on
 * sign-in, disconnect on sign-out); pages only add and remove their own listeners and
 * join/leave rooms. The Socket instance is kept across reconnects so listeners attached
 * to the raw socket (call signalling) survive them.
 */
class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private authRetryInFlight = false;

  constructor() {
    // After any refresh, a socket that is down (typically because its handshake was
    // refused with the expired token) reconnects; the auth callback supplies the new token.
    apiClient.onAccessTokenRefreshed(() => {
      if (this.socket && !this.socket.connected) this.socket.connect();
    });
  }

  /**
   * Idempotent. The token is read from storage at every (re)connect attempt, so the
   * `token` argument is accepted only for backward compatibility and ignored.
   */
  connect(_token?: string): void {
    if (this.socket) {
      if (!this.socket.connected) this.socket.connect();
      return;
    }
    if (!apiClient.getAccessToken()) return;

    const socketUrl = API_BASE_URL.replace('/api/v1', '');
    this.socket = io(socketUrl, {
      // A function, not a fixed object: socket.io calls it on every (re)connect, so a
      // reconnect after the access token rotated presents the current token, not the
      // one captured when the socket was first created.
      auth: (cb) => cb({ token: apiClient.getAccessToken() }),
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      // SECURITY-FIX (W-M3): removed console logging of socket lifecycle to avoid
      // leaking connection internals / user context in production builds.
      this.reconnectAttempts = 0;
      this.emit('connect', undefined);
    });

    this.socket.on('disconnect', () => {
      // SECURITY-FIX (W-M3): removed console logging of disconnect reason.
      this.emit('disconnect', undefined);
    });

    this.socket.on('connect_error', () => {
      // SECURITY-FIX (W-M3): removed console logging of the error object (may carry
      // handshake/token details).
      this.reconnectAttempts++;
      void this.recoverFromAuthRefusal();
    });

    this.socket.on('new_message', (data: { id: string; chatId: string; senderId: string; sender: { _id: string; fullName: string }; text: string; type: string; createdAt: string }) => {
      this.emit('message', { chatId: data.chatId, message: data });
    });

    this.socket.on('user_typing', (data: { chatId: string; userId: string; isTyping: boolean }) => {
      this.emit('typing', data);
    });

    this.socket.on('messages_read', (data: { chatId: string; messageId?: string; readerId: string; readAt: string }) => {
      this.emit('read', data);
    });

    this.socket.on('message_notification', (data: { chatId: string; senderId: string; preview: string; createdAt: string }) => {
      this.emit('notification', data);
    });

    this.socket.on('kyc_status_changed', (data: { ninVerified: boolean; bvnVerified: boolean; verificationStatus: string }) => {
      this.emit('kyc_status_changed', data);
    });
  }

  /**
   * Tears down the shared socket. Only for sign-out (App.tsx `SocketConnection`); a page
   * must never call this, it would cut calls, presence and KYC updates app-wide.
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * A handshake refused by the server's auth middleware is not retried by socket.io
   * (`socket.active` goes false). If that happened because the access token expired,
   * refresh it once (single-flight, shared with the HTTP client); the refresh listener
   * above then reconnects.
   */
  private async recoverFromAuthRefusal(): Promise<void> {
    if (!this.socket || this.socket.active || this.authRetryInFlight) return;
    const token = apiClient.getAccessToken();
    if (!token || !isTokenExpired(token)) return;
    this.authRetryInFlight = true;
    try {
      await apiClient.refreshSession();
    } finally {
      this.authRetryInFlight = false;
    }
  }

  joinChat(chatId: string): void {
    this.socket?.emit('join_chat', chatId);
  }

  leaveChat(chatId: string): void {
    this.socket?.emit('leave_chat', chatId);
  }

  sendMessage(chatId: string, recipientId: string, text: string): void {
    this.socket?.emit('send_message', {
      chatId,
      recipientId,
      message: text,
      messageId: `msg_${Date.now()}`,
      type: 'text',
    });
  }

  sendTyping(chatId: string, isTyping: boolean): void {
    this.socket?.emit('typing', { chatId, isTyping });
  }

  markAsRead(chatId: string, messageId?: string): void {
    this.socket?.emit('mark_read', { chatId, messageId });
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Raw socket access, for call signalling.
   *
   * The re-emitting wrapper above exists to give chat a stable event surface; call
   * signalling is high-frequency and strictly request/response, so it attaches its own
   * listeners directly rather than routing every ICE candidate through the fan-out map.
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /** Adds a fan-out listener. Returns a function that removes exactly this listener. */
  on(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  off(event: string, callback: Function): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }
}

export const socketService = new SocketService();
export default socketService;