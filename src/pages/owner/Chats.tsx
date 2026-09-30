import { useState, useEffect, useRef } from 'react';
import { Search01Icon, SentIcon, MoreVerticalIcon, TelephoneIcon, Video01Icon, Loading02Icon, BubbleChatIcon } from '@hugeicons/react';
import { clsx } from 'clsx';
import { AppLayout } from '../../components/layout/AppLayout';
import { useAuth } from '../../api/authContext';
import { callApi, type CallAvailability } from '../../api/callApi';
import { useCall } from '../../contexts/CallContext';
import type { OwnerRole } from '../../api/owner';
import { useChatSession } from '../../hooks/useChatSession';
import { filterChats, formatChatTime as formatTime, isOwnMessage } from '../../lib/chatSession';

/** Thin view over `useChatSession`; role only chooses the layout. */
export function OwnerChatsPage({ role }: { role: OwnerRole }) {
  const { user } = useAuth();
  const session = useChatSession(user?.id);
  const { chats, selectedChat, messages, partnerTyping, loading, sending } = session;
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const call = useCall();
  // Fetched per conversation so the buttons can show the peer as busy before the user
  // taps, rather than after a call that goes nowhere.
  const [callAvailability, setCallAvailability] = useState<CallAvailability | null>(null);

  useEffect(() => {
    if (!selectedChat) { setCallAvailability(null); return; }
    let cancelled = false;
    callApi.getAvailability(selectedChat.id).then((data) => {
      if (!cancelled) setCallAvailability(data);
    });
    return () => { cancelled = true; };
  }, [selectedChat?.id]);

  const placeCall = (callType: 'audio' | 'video') => {
    if (!selectedChat) return;
    call.startCall(selectedChat.id, callType, {
      id: callAvailability?.peerId ?? selectedChat.participant.id,
      fullName: selectedChat.participant.fullName,
      avatar: selectedChat.participant.avatar,
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    const error = await session.send(newMessage);
    if (error) alert(error);
    else setNewMessage('');
  };

  const handleTyping = (text: string) => {
    setNewMessage(text);
    session.notifyTyping();
  };

  const setSelectedChat = (chat: { id: string } | null) => session.selectChat(chat ? chat.id : null);
  const filteredChats = filterChats(chats, searchQuery);

  return (
    <AppLayout role={role} title="Chats" subtitle="Messages from clients">
      <div className="clay-card overflow-hidden h-[calc(100vh-10rem)]">
        <div className="flex h-full">
          <div className={clsx('w-full md:w-80 border-r border-clay-border flex flex-col', selectedChat ? 'hidden md:flex' : 'flex')}>
            <div className="p-4 border-b border-clay-border">
              <div className="relative">
                <Search01Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="clay-input w-full pl-10 text-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loading02Icon className="w-6 h-6 animate-spin text-mustard" />
                </div>
              ) : filteredChats.length > 0 ? (
                filteredChats.map(chat => (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={clsx(
                      'w-full p-4 text-left flex items-start gap-3 border-b border-clay-border-light transition-colors',
                      selectedChat?.id === chat.id ? 'bg-mustard-pale' : 'hover:bg-clay-border-light'
                    )}
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-burnt-brown-pale flex items-center justify-center">
                        <span className="text-sm font-semibold text-burnt-brown">
                          {chat.participant.fullName.charAt(0)}
                        </span>
                      </div>
                      {chat.participant.online && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-status-success border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-text-primary truncate">{chat.participant.fullName}</p>
                        <span className="text-xs text-text-tertiary">{formatTime(chat.lastMessageAt)}</span>
                      </div>
                      <p className="text-xs text-text-tertiary truncate mt-0.5">{chat.listing?.title}</p>
                      <p className="text-sm text-text-secondary truncate mt-1">{chat.lastMessage}</p>
                    </div>
                    {chat.unreadCount > 0 && (
                      <div className="w-5 h-5 rounded-full bg-mustard text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
                        {chat.unreadCount}
                      </div>
                    )}
                  </button>
                ))
              ) : (
                <div className="p-12 text-center">
                  <BubbleChatIcon className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
                  <p className="text-text-secondary">No conversations yet</p>
                </div>
              )}
            </div>
          </div>

          {selectedChat ? (
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-clay-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedChat(null)} className="md:hidden text-text-secondary">
                    ←
                  </button>
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-burnt-brown-pale flex items-center justify-center">
                      <span className="text-sm font-semibold text-burnt-brown">
                        {selectedChat.participant.fullName.charAt(0)}
                      </span>
                    </div>
                    {selectedChat.participant.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-status-success border-2 border-white" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{selectedChat.participant.fullName}</p>
                    <p className="text-xs text-text-tertiary">{selectedChat.listing?.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => placeCall('audio')}
                    disabled={callAvailability?.peerBusy}
                    aria-label="Start voice call"
                    title={callAvailability?.peerBusy ? 'They are on another call' : 'Voice call'}
                    className="p-2 rounded-full hover:bg-clay-border-light disabled:opacity-40"
                  >
                    <TelephoneIcon className="w-5 h-5 text-text-secondary" />
                  </button>
                  <button
                    onClick={() => placeCall('video')}
                    disabled={callAvailability?.peerBusy}
                    aria-label="Start video call"
                    title={callAvailability?.peerBusy ? 'They are on another call' : 'Video call'}
                    className="p-2 rounded-full hover:bg-clay-border-light disabled:opacity-40"
                  >
                    <Video01Icon className="w-5 h-5 text-text-secondary" />
                  </button>
                  <button aria-label="More options" className="p-2 rounded-full hover:bg-clay-border-light">
                    <MoreVerticalIcon className="w-5 h-5 text-text-secondary" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={clsx(
                      'flex',
                      isOwnMessage(msg, user?.id) ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={clsx(
                        'max-w-[70%] rounded-clay-sm px-4 py-2',
                        isOwnMessage(msg, user?.id)
                          ? 'bg-mustard text-white'
                          : 'bg-clay-border-light text-text-primary'
                      )}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <p className={clsx('text-xs mt-1', isOwnMessage(msg, user?.id) ? 'text-white/70' : 'text-text-tertiary')}>
                        {formatTime(msg.createdAt)}
                        {isOwnMessage(msg, user?.id) && (
                          <span className="ml-1">{msg.readAt ? '· Read' : '· Sent'}</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
                {partnerTyping && (
                  <div className="flex justify-start">
                    <div className="bg-clay-border-light rounded-clay-sm px-4 py-2">
                      <p className="text-sm text-text-tertiary italic">Typing...</p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-clay-border">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={e => handleTyping(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    className="clay-input flex-1"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="p-2 rounded-full bg-mustard text-white hover:bg-mustard-light disabled:opacity-50"
                  >
                    {sending ? (
                      <Loading02Icon className="w-5 h-5 animate-spin" />
                    ) : (
                      <SentIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex flex-1 flex-col items-center justify-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-clay-border-light flex items-center justify-center">
                <BubbleChatIcon className="w-8 h-8 text-text-tertiary" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">No conversation selected</h3>
              <p className="text-text-tertiary">Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}