import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Send, MoreVertical, Phone, Video, Loader } from 'lucide-react';
import { clsx } from 'clsx';
import { AppLayout } from '../../components/layout/AppLayout';
import { chatApi } from '../../api/chat';
import { useAuth } from '../../api/authContext';

interface Chat {
  id: string;
  participant: {
    id: string;
    fullName: string;
    avatar?: string;
    online?: boolean;
  };
  listing?: {
    id: string;
    title: string;
  };
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface Message {
  id: string;
  senderId: string;
  sender?: { _id: string; fullName: string };
  text: string;
  createdAt: string;
}

export function AgentChatsPage() {
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchChats();
    connectSocket();
    return () => {
      if (selectedChat) {
        chatApi.leaveChat(selectedChat.id);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
      chatApi.joinChat(selectedChat.id);
    }
  }, [selectedChat?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const connectSocket = useCallback(() => {
    const authData = localStorage.getItem('ilesure_web_auth');
    if (authData) {
      const parsed = JSON.parse(authData);
      if (parsed.accessToken) {
        chatApi.connectToSocket(parsed.accessToken);

        chatApi.onConnect(() => {
          if (selectedChat) {
            chatApi.joinChat(selectedChat.id);
          }
        });

        chatApi.onMessage((data) => {
          if (selectedChat && data.chatId === selectedChat.id) {
            setMessages(prev => [...prev, data.message]);
          }
          setChats(prev => prev.map(chat => 
            chat.id === data.chatId 
              ? { ...chat, lastMessage: data.message.text, lastMessageAt: data.message.createdAt }
              : chat
          ));
        });

        chatApi.onTyping((data) => {
          if (selectedChat && data.chatId === selectedChat.id) {
            setPartnerTyping(data.isTyping);
          }
        });

        chatApi.onRead((data) => {
          if (selectedChat && data.chatId === selectedChat.id) {
            setMessages(prev => prev.map(msg => 
              msg.id === data.messageId ? { ...msg, readBy: data.userId } : msg
            ));
          }
        });
      }
    }
  }, [selectedChat]);

  const fetchChats = async () => {
    setLoading(true);
    try {
      const response = await chatApi.getChats();
      if (response.success && response.data) {
        setChats(response.data.chats || []);
      }
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      const response = await chatApi.getMessages(chatId);
      if (response.success && response.data) {
        setMessages(response.data.messages || []);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;
    
    setSending(true);
    try {
      const response = await chatApi.sendMessage(selectedChat.id, newMessage.trim());
      if (response.success) {
        setMessages(prev => [...prev, response.message]);
        setChats(prev => prev.map(chat => 
          chat.id === selectedChat.id 
            ? { ...chat, lastMessage: newMessage.trim(), lastMessageAt: new Date().toISOString() }
            : chat
        ));
        setNewMessage('');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (text: string) => {
    setNewMessage(text);
    
    if (selectedChat && !isTyping) {
      setIsTyping(true);
      chatApi.sendTyping(selectedChat.id, true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (selectedChat) {
        chatApi.sendTyping(selectedChat.id, false);
        setIsTyping(false);
      }
    }, 2000);
  };

  const formatTime = (time: string) => {
    const date = new Date(time);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.participant.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout role="agent" title="Chats" subtitle="Messages from clients">
      <div className="clay-card overflow-hidden h-[calc(100vh-10rem)]">
        <div className="flex h-full">
          <div className={clsx('w-full md:w-80 border-r border-clay-border flex flex-col', selectedChat ? 'hidden md:flex' : 'flex')}>
            <div className="p-4 border-b border-clay-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
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
                  <Loader className="w-6 h-6 animate-spin text-mustard" />
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
                <div className="text-center py-8 text-text-tertiary">
                  No conversations yet
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
                  <button className="p-2 rounded-full hover:bg-clay-border-light">
                    <Phone className="w-5 h-5 text-text-secondary" />
                  </button>
                  <button className="p-2 rounded-full hover:bg-clay-border-light">
                    <Video className="w-5 h-5 text-text-secondary" />
                  </button>
                  <button className="p-2 rounded-full hover:bg-clay-border-light">
                    <MoreVertical className="w-5 h-5 text-text-secondary" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={clsx(
                      'flex',
                      (msg.senderId === user?.id || msg.sender?._id === user?.id) ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={clsx(
                        'max-w-[70%] rounded-clay-sm px-4 py-2',
                        (msg.senderId === user?.id || msg.sender?._id === user?.id)
                          ? 'bg-mustard text-white'
                          : 'bg-clay-border-light text-text-primary'
                      )}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <p className={clsx('text-xs mt-1', (msg.senderId === user?.id || msg.sender?._id === user?.id) ? 'text-white/70' : 'text-text-tertiary')}>
                        {formatTime(msg.createdAt)}
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
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex flex-1 items-center justify-center">
              <p className="text-text-tertiary">Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}