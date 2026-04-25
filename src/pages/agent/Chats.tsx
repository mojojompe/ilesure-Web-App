import { useState } from 'react';
import { Search, Send, MoreVertical, Phone, Video } from 'lucide-react';
import { clsx } from 'clsx';
import { AppLayout } from '../../components/layout/AppLayout';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { mockListings } from '../../data/mockData';

interface Chat {
  id: string;
  user: {
    name: string;
    avatar: string;
    online: boolean;
  };
  lastMessage: string;
  time: string;
  unread: number;
  listing?: string;
}

const mockChats: Chat[] = [
  {
    id: 'c1',
    user: { name: 'Adebola Mohammed', avatar: '', online: true },
    lastMessage: 'Is the room still available?',
    time: '2:30 PM',
    unread: 2,
    listing: 'Modern Student Hostel - Gbagada',
  },
  {
    id: 'c2',
    user: { name: 'Sarah Johnson', avatar: '', online: false },
    lastMessage: 'Thank you for the quick response!',
    time: '1:15 PM',
    unread: 0,
    listing: 'Single Room - Yaba',
  },
  {
    id: 'c3',
    user: { name: 'Mike Ibrahim', avatar: '', online: true },
    lastMessage: 'When can I come to view?',
    time: '11:45 AM',
    unread: 1,
    listing: 'Bedsitter - Ikeja',
  },
  {
    id: 'c4',
    user: { name: 'Grace Adeyemi', avatar: '', online: false },
    lastMessage: 'I need to discuss the terms.',
    time: 'Yesterday',
    unread: 0,
    listing: 'Luxury Apartment - Ikoyi',
  },
];

const mockMessages = [
  { id: 'm1', sender: 'other', text: 'Hello, is this still available?', time: '2:15 PM' },
  { id: 'm2', sender: 'me', text: 'Yes, it is! Are you interested in viewing?', time: '2:20 PM' },
  { id: 'm3', sender: 'other', text: 'Definitely! When can I come see it?', time: '2:25 PM' },
  { id: 'm4', sender: 'me', text: 'You can come anytime today between 9am and 5pm.', time: '2:30 PM' },
];

export function AgentChatsPage() {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');

  const filteredChats = mockChats.filter(chat =>
    chat.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    setNewMessage('');
  };

  const formatTime = (time: string) => time;

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
              {filteredChats.map(chat => (
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
                        {chat.user.name.charAt(0)}
                      </span>
                    </div>
                    {chat.user.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-status-success border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-text-primary truncate">{chat.user.name}</p>
                      <span className="text-xs text-text-tertiary">{chat.time}</span>
                    </div>
                    <p className="text-xs text-text-tertiary truncate mt-0.5">{chat.listing}</p>
                    <p className="text-sm text-text-secondary truncate mt-1">{chat.lastMessage}</p>
                  </div>
                  {chat.unread > 0 && (
                    <div className="w-5 h-5 rounded-full bg-mustard text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
                      {chat.unread}
                    </div>
                  )}
                </button>
              ))}
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
                        {selectedChat.user.name.charAt(0)}
                      </span>
                    </div>
                    {selectedChat.user.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-status-success border-2 border-white" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{selectedChat.user.name}</p>
                    <p className="text-xs text-text-tertiary">{selectedChat.listing}</p>
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
                {mockMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={clsx(
                      'flex',
                      msg.sender === 'me' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={clsx(
                        'max-w-[70%] rounded-clay-sm px-4 py-2',
                        msg.sender === 'me'
                          ? 'bg-mustard text-white'
                          : 'bg-clay-border-light text-text-primary'
                      )}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <p className={clsx('text-xs mt-1', msg.sender === 'me' ? 'text-white/70' : 'text-text-tertiary')}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-clay-border">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    className="clay-input flex-1"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="p-2 rounded-full bg-mustard text-white hover:bg-mustard-light"
                  >
                    <Send className="w-5 h-5" />
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