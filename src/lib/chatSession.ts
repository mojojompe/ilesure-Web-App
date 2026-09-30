/**
 * Chat session state, as a pure reducer. Owns the conversation list, the open
 * conversation's messages, and how socket events (new message, typing, read receipt) merge
 * into them. `useChatSession` feeds it from the chat API and socket; nothing here touches
 * the network, so the merge rules are testable on their own.
 */
import type { ReadReceipt } from '../api/chat';

export interface ChatSummary {
  id: string;
  participant: { id: string; fullName: string; avatar?: string; online?: boolean };
  listing?: { id: string; title: string };
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  sender?: { _id: string; fullName: string };
  text: string;
  createdAt: string;
  readAt?: string | null;
}

export interface ChatSessionState {
  chats: ChatSummary[];
  selectedChatId: string | null;
  messages: ChatMessage[];
  partnerTyping: boolean;
}

export const initialChatSessionState: ChatSessionState = {
  chats: [],
  selectedChatId: null,
  messages: [],
  partnerTyping: false,
};

export type ChatSessionEvent =
  | { type: 'chatsLoaded'; chats: ChatSummary[] }
  | { type: 'chatSelected'; chatId: string | null }
  | { type: 'messagesLoaded'; chatId: string; messages: unknown[] }
  | { type: 'messageReceived'; chatId: string; message: unknown }
  | { type: 'messageSent'; chatId: string; message: unknown; at: string }
  | { type: 'typing'; chatId: string; isTyping: boolean }
  | { type: 'read'; receipt: ReadReceipt; selfId: string | undefined; at: string };

/** Accepts either server shape (`id` or `_id`) and returns a message with a stable `id`. */
export function normalizeMessage(raw: any): ChatMessage {
  return {
    ...raw,
    id: String(raw?.id ?? raw?._id ?? ''),
    senderId: raw?.senderId ?? raw?.sender?._id ?? '',
    text: raw?.text ?? '',
  };
}

function appendUnique(messages: ChatMessage[], message: ChatMessage): ChatMessage[] {
  if (message.id && messages.some((m) => m.id === message.id)) return messages;
  return [...messages, message];
}

export function isOwnMessage(message: ChatMessage, userId: string | undefined): boolean {
  return !!userId && (message.senderId === userId || message.sender?._id === userId);
}

export function filterChats(chats: ChatSummary[], query: string): ChatSummary[] {
  const q = query.toLowerCase();
  return chats.filter(
    (chat) => (chat.participant?.fullName || '').toLowerCase().includes(q) || (chat.lastMessage || '').toLowerCase().includes(q)
  );
}

export function chatSessionReducer(state: ChatSessionState, event: ChatSessionEvent): ChatSessionState {
  switch (event.type) {
    case 'chatsLoaded':
      return { ...state, chats: event.chats };

    case 'chatSelected':
      if (event.chatId === state.selectedChatId) return state;
      return {
        ...state,
        selectedChatId: event.chatId,
        messages: [],
        partnerTyping: false,
        chats: state.chats.map((chat) => (chat.id === event.chatId ? { ...chat, unreadCount: 0 } : chat)),
      };

    case 'messagesLoaded':
      // A slow response for a conversation the user has already left is dropped.
      if (event.chatId !== state.selectedChatId) return state;
      return { ...state, messages: event.messages.map(normalizeMessage) };

    case 'messageReceived': {
      const message = normalizeMessage(event.message);
      const isOpen = event.chatId === state.selectedChatId;
      return {
        ...state,
        messages: isOpen ? appendUnique(state.messages, message) : state.messages,
        chats: state.chats.map((chat) =>
          chat.id === event.chatId
            ? {
                ...chat,
                lastMessage: message.text,
                lastMessageAt: message.createdAt,
                unreadCount: isOpen ? 0 : (chat.unreadCount || 0) + 1,
              }
            : chat
        ),
      };
    }

    case 'messageSent': {
      const message = normalizeMessage(event.message);
      return {
        ...state,
        messages: event.chatId === state.selectedChatId ? appendUnique(state.messages, message) : state.messages,
        chats: state.chats.map((chat) =>
          chat.id === event.chatId ? { ...chat, lastMessage: message.text, lastMessageAt: event.at } : chat
        ),
      };
    }

    case 'typing':
      if (event.chatId !== state.selectedChatId) return state;
      return { ...state, partnerTyping: event.isTyping };

    case 'read': {
      // `messages_read` is broadcast to the whole room, including the reader. A receipt
      // means the reader has seen what the OTHER participant sent, so only messages not
      // sent by the reader are marked, and our own reading is ignored.
      const { receipt, selfId } = event;
      if (receipt.chatId !== state.selectedChatId) return state;
      if (receipt.readerId && receipt.readerId === selfId) return state;
      const readAt = receipt.readAt || event.at;
      let changed = false;
      const messages = state.messages.map((msg) => {
        if (msg.readAt) return msg;
        if (receipt.messageId && msg.id !== receipt.messageId) return msg;
        const senderId = msg.senderId || msg.sender?._id;
        if (receipt.readerId && senderId === receipt.readerId) return msg;
        changed = true;
        return { ...msg, readAt };
      });
      return changed ? { ...state, messages } : state;
    }

    default:
      return state;
  }
}

/** "3:04 PM" today, "Yesterday", else "Sep 28". */
export function formatChatTime(time: string, now: Date = new Date()): string {
  const date = new Date(time);
  if (Number.isNaN(date.getTime())) return '';
  const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (days === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
