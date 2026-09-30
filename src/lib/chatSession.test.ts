import { describe, it, expect } from 'vitest';
import {
  chatSessionReducer as reduce,
  initialChatSessionState,
  filterChats,
  isOwnMessage,
  normalizeMessage,
  type ChatSessionState,
  type ChatSummary,
} from './chatSession';

const chat = (id: string, unreadCount = 0): ChatSummary => ({
  id,
  participant: { id: `p-${id}`, fullName: `Person ${id}` },
  lastMessage: 'hi',
  lastMessageAt: '2026-09-01T00:00:00Z',
  unreadCount,
});

const msg = (id: string, senderId: string, extra: Record<string, unknown> = {}) => ({
  id, senderId, text: `text ${id}`, createdAt: '2026-09-30T10:00:00Z', ...extra,
});

function openChat(): ChatSessionState {
  let s = reduce(initialChatSessionState, { type: 'chatsLoaded', chats: [chat('a', 3), chat('b', 1)] });
  s = reduce(s, { type: 'chatSelected', chatId: 'a' });
  return reduce(s, { type: 'messagesLoaded', chatId: 'a', messages: [msg('m1', 'me'), msg('m2', 'them')] });
}

describe('chatSessionReducer', () => {
  it('selecting a chat clears its unread badge, messages and typing flag', () => {
    let s = reduce(initialChatSessionState, { type: 'chatsLoaded', chats: [chat('a', 3)] });
    s = { ...s, partnerTyping: true };
    s = reduce(s, { type: 'chatSelected', chatId: 'a' });
    expect(s.chats[0].unreadCount).toBe(0);
    expect(s.partnerTyping).toBe(false);
    expect(s.messages).toEqual([]);
  });

  it('drops a message page that arrives for a chat no longer open', () => {
    let s = openChat();
    s = reduce(s, { type: 'chatSelected', chatId: 'b' });
    s = reduce(s, { type: 'messagesLoaded', chatId: 'a', messages: [msg('late', 'x')] });
    expect(s.messages).toEqual([]);
  });

  it('appends an incoming message to the open chat once, even if delivered twice', () => {
    let s = openChat();
    const incoming = { chatId: 'a', message: { _id: 'm3', senderId: 'them', text: 'new', createdAt: '2026-09-30T11:00:00Z' } };
    s = reduce(s, { type: 'messageReceived', ...incoming });
    s = reduce(s, { type: 'messageReceived', ...incoming });
    expect(s.messages.map((m) => m.id)).toEqual(['m1', 'm2', 'm3']);
    expect(s.chats[0]).toMatchObject({ lastMessage: 'new', unreadCount: 0 });
  });

  it('counts an incoming message for another chat as unread and leaves the open thread alone', () => {
    let s = openChat();
    s = reduce(s, { type: 'messageReceived', chatId: 'b', message: msg('x1', 'them', { text: 'ping' }) });
    expect(s.messages).toHaveLength(2);
    expect(s.chats[1]).toMatchObject({ lastMessage: 'ping', unreadCount: 2 });
  });

  it('dedupes a sent message against the socket echo of the same message', () => {
    let s = openChat();
    s = reduce(s, { type: 'messageReceived', chatId: 'a', message: msg('m9', 'me', { text: 'yo' }) });
    s = reduce(s, { type: 'messageSent', chatId: 'a', message: msg('m9', 'me', { text: 'yo' }), at: '2026-09-30T12:00:00Z' });
    expect(s.messages.filter((m) => m.id === 'm9')).toHaveLength(1);
    expect(s.chats[0].lastMessageAt).toBe('2026-09-30T12:00:00Z');
  });

  it('shows typing only for the open chat', () => {
    let s = openChat();
    s = reduce(s, { type: 'typing', chatId: 'b', isTyping: true });
    expect(s.partnerTyping).toBe(false);
    s = reduce(s, { type: 'typing', chatId: 'a', isTyping: true });
    expect(s.partnerTyping).toBe(true);
  });

  describe('read receipts', () => {
    const at = '2026-09-30T13:00:00Z';

    it("marks my messages read when the other participant reads", () => {
      const s = reduce(openChat(), { type: 'read', receipt: { chatId: 'a', readerId: 'them', readAt: at }, selfId: 'me', at });
      expect(s.messages.find((m) => m.id === 'm1')?.readAt).toBe(at);
      // The reader's own message is not "read" by their reading.
      expect(s.messages.find((m) => m.id === 'm2')?.readAt).toBeUndefined();
    });

    it('ignores the echo of my own reading', () => {
      const before = openChat();
      const s = reduce(before, { type: 'read', receipt: { chatId: 'a', readerId: 'me' }, selfId: 'me', at });
      expect(s).toBe(before);
    });

    it('limits a single-message receipt to that message', () => {
      let s = reduce(openChat(), { type: 'messageReceived', chatId: 'a', message: msg('m3', 'me') });
      s = reduce(s, { type: 'read', receipt: { chatId: 'a', readerId: 'them', messageId: 'm3' }, selfId: 'me', at });
      expect(s.messages.filter((m) => m.readAt).map((m) => m.id)).toEqual(['m3']);
    });

    it('ignores receipts for other chats', () => {
      const before = openChat();
      expect(reduce(before, { type: 'read', receipt: { chatId: 'b', readerId: 'them' }, selfId: 'me', at })).toBe(before);
    });
  });
});

describe('helpers', () => {
  it('normalizes either message id shape', () => {
    expect(normalizeMessage({ _id: 'x', sender: { _id: 'u', fullName: 'U' }, text: 't' })).toMatchObject({ id: 'x', senderId: 'u' });
  });

  it('recognises my messages by senderId or sender._id', () => {
    expect(isOwnMessage(normalizeMessage({ id: '1', sender: { _id: 'me', fullName: 'Me' } }), 'me')).toBe(true);
    expect(isOwnMessage(normalizeMessage({ id: '1', senderId: 'you' }), 'me')).toBe(false);
    expect(isOwnMessage(normalizeMessage({ id: '1', senderId: '' }), undefined)).toBe(false);
  });

  it('filters chats by participant name or last message', () => {
    const chats = [chat('a'), { ...chat('b'), lastMessage: 'Is the flat free?' }];
    expect(filterChats(chats, 'FLAT').map((c) => c.id)).toEqual(['b']);
    expect(filterChats(chats, 'person a').map((c) => c.id)).toEqual(['a']);
  });
});
