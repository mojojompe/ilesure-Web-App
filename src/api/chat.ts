import apiClient from './client';
import { socketService } from './socket';

interface ChatsResponse {
  success: boolean;
  data?: {
    chats: Array<{
      id: string;
      participant: {
        id: string;
        fullName: string;
        avatar?: string;
      };
      listing?: {
        id: string;
        title: string;
      };
      lastMessage: string;
      lastMessageAt: string;
      unreadCount: number;
    }>;
  };
  error?: { message: string };
}

interface MessagesResponse {
  success: boolean;
  data?: {
      messages: Array<{
      id: string;
      senderId: string;
      sender?: { _id: string; fullName: string };
      text: string;
      createdAt: string;
    }>;
  };
  error?: { message: string };
}

export const chatApi = {
  async getChats(): Promise<ChatsResponse> {
    try {
      const response = await apiClient.get<ChatsResponse>('/chats');
      return response.data;
    } catch {
      return { success: false, error: { message: 'Failed to fetch chats' } };
    }
  },

  async getMessages(chatId: string): Promise<MessagesResponse> {
    try {
      const response = await apiClient.get<MessagesResponse>(`/chats/${chatId}/messages`);
      return response.data;
    } catch {
      return { success: false, error: { message: 'Failed to fetch messages' } };
    }
  },

  async sendMessage(chatId: string, text: string, recipientId?: string): Promise<{ success: boolean; message?: any; error?: string }> {
    return new Promise((resolve) => {
      if (!socketService.isConnected()) {
        resolve({ success: false, error: 'Not connected' });
        return;
      }

      const timeout = setTimeout(() => {
        resolve({ success: false, error: 'Timeout' });
      }, 10000);

      const handleMessage = (data: { chatId: string; message: any }) => {
        if (data.chatId === chatId && data.message) {
          clearTimeout(timeout);
          socketService.off('message', handleMessage);
          resolve({ success: true, message: data.message });
        }
      };

      socketService.on('message', handleMessage);
      socketService.sendMessage(chatId, recipientId || '', text);
    });
  },

  async markAsRead(chatId: string, messageId: string): Promise<{ success: boolean }> {
    try {
      await apiClient.patch(`/chats/${chatId}/read`, { messageId });
      socketService.markAsRead(chatId, messageId);
      return { success: true };
    } catch {
      return { success: false };
    }
  },

  connectToSocket(token: string): void {
    socketService.connect(token);
  },

  disconnectFromSocket(): void {
    socketService.disconnect();
  },

  joinChat(chatId: string): void {
    socketService.joinChat(chatId);
  },

  leaveChat(chatId: string): void {
    socketService.leaveChat(chatId);
  },

  sendTyping(chatId: string, isTyping: boolean): void {
    socketService.sendTyping(chatId, isTyping);
  },

  onMessage(callback: (data: { chatId: string; message: any }) => void): void {
    socketService.on('message', callback);
  },

  onTyping(callback: (data: { chatId: string; userId: string; isTyping: boolean }) => void): void {
    socketService.on('typing', callback);
  },

  onRead(callback: (data: { chatId: string; messageId: string; userId: string }) => void): void {
    socketService.on('read', callback);
  },

  onOnline(callback: (data: { userId: string; isOnline: boolean }) => void): void {
    socketService.on('online', callback);
  },

  onConnect(callback: () => void): void {
    socketService.on('connect', callback);
  },

  onDisconnect(callback: () => void): void {
    socketService.on('disconnect', callback);
  },
};

export default chatApi;