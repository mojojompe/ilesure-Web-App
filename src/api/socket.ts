import { io, Socket } from 'socket.io-client';
import API_BASE_URL from './config';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string): void {
    if (this.socket?.connected) return;

    const socketUrl = API_BASE_URL.replace('/api/v1', '');
    this.socket = io(socketUrl, {
      auth: { token },
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

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
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

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
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