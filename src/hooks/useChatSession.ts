import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { chatApi } from '../api/chat';
import { chatSessionReducer, initialChatSessionState, type ChatSummary } from '../lib/chatSession';

const TYPING_IDLE_MS = 2000;

/**
 * One chat session for the signed-in user: conversation list, the open conversation's
 * messages, typing and read receipts, room join/leave, and rejoin after a reconnect.
 *
 * The socket itself belongs to App.tsx `SocketConnection` (calls, presence and
 * kyc_status_changed ride on it too). This hook only adds listeners through the chat API
 * helpers and removes exactly those on unmount; it never disconnects the socket.
 */
export function useChatSession(userId: string | undefined) {
  const [state, dispatch] = useReducer(chatSessionReducer, initialChatSessionState);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Socket callbacks are registered once; they read the latest values through refs.
  const selectedRef = useRef<string | null>(null);
  const userIdRef = useRef(userId);
  selectedRef.current = state.selectedChatId;
  userIdRef.current = userId;

  const typingRef = useRef<{ active: boolean; timer: ReturnType<typeof setTimeout> | null }>({ active: false, timer: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const response = await chatApi.getChats();
      if (cancelled) return;
      if (response.success && response.data) {
        dispatch({ type: 'chatsLoaded', chats: (response.data.chats || []) as ChatSummary[] });
      } else {
        console.error('Failed to fetch chats:', response.error?.message);
      }
      setLoading(false);
    })();

    const unsubscribe = [
      // A reconnect is a new server-side connection with no rooms; rejoin the open chat.
      chatApi.onConnect(() => {
        if (selectedRef.current) chatApi.joinChat(selectedRef.current);
      }),
      chatApi.onMessage((data) => {
        dispatch({ type: 'messageReceived', chatId: data.chatId, message: data.message });
        if (data.chatId === selectedRef.current) void chatApi.markAsRead(data.chatId);
      }),
      chatApi.onTyping((data) => dispatch({ type: 'typing', chatId: data.chatId, isTyping: data.isTyping })),
      chatApi.onRead((receipt) =>
        dispatch({ type: 'read', receipt, selfId: userIdRef.current, at: new Date().toISOString() })
      ),
    ];

    return () => {
      cancelled = true;
      unsubscribe.forEach((off) => off());
      if (typingRef.current.timer) clearTimeout(typingRef.current.timer);
    };
  }, []);

  useEffect(() => {
    const chatId = state.selectedChatId;
    if (!chatId) return;
    let cancelled = false;
    chatApi.getMessages(chatId).then((response) => {
      if (cancelled) return;
      if (response.success && response.data) {
        dispatch({ type: 'messagesLoaded', chatId, messages: response.data.messages || [] });
      } else {
        console.error('Failed to fetch messages:', response.error?.message);
      }
    });
    chatApi.joinChat(chatId);
    void chatApi.markAsRead(chatId);
    // Leave this chat's room when switching to another chat or leaving the page.
    return () => {
      cancelled = true;
      chatApi.leaveChat(chatId);
    };
  }, [state.selectedChatId]);

  const selectChat = useCallback((chatId: string | null) => dispatch({ type: 'chatSelected', chatId }), []);

  /** Announces typing, and "stopped" after a quiet spell. Call on every keystroke. */
  const notifyTyping = useCallback(() => {
    const chatId = selectedRef.current;
    if (!chatId) return;
    const typing = typingRef.current;
    if (!typing.active) {
      typing.active = true;
      chatApi.sendTyping(chatId, true);
    }
    if (typing.timer) clearTimeout(typing.timer);
    typing.timer = setTimeout(() => {
      chatApi.sendTyping(chatId, false);
      typing.active = false;
    }, TYPING_IDLE_MS);
  }, []);

  /** Sends to the open conversation. Resolves to an error message, or null on success. */
  const send = useCallback(async (text: string): Promise<string | null> => {
    const chatId = selectedRef.current;
    const trimmed = text.trim();
    if (!chatId || !trimmed) return null;
    setSending(true);
    try {
      const response = await chatApi.sendMessage(chatId, trimmed);
      if (response.success && response.message) {
        dispatch({ type: 'messageSent', chatId, message: response.message, at: new Date().toISOString() });
        return null;
      }
      return response.error || 'Failed to send message';
    } finally {
      setSending(false);
    }
  }, []);

  const selectedChat = state.chats.find((chat) => chat.id === state.selectedChatId) ?? null;

  return {
    chats: state.chats,
    selectedChat,
    messages: state.messages,
    partnerTyping: state.partnerTyping,
    loading,
    sending,
    selectChat,
    notifyTyping,
    send,
  };
}
