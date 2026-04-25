import { useState } from 'react';
import { Search, MessageCircle, Phone, Mail, MapPin, Calendar, ChevronRight, ChevronLeft, Send, CheckCircle, XCircle, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { AppLayout } from '../../components/layout/AppLayout';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { mockListings, mockBookings } from '../../data/mockData';

interface Inquiry {
  id: string;
  user: {
    name: string;
    phone: string;
  };
  listing: string;
  message: string;
  status: 'new' | 'responded' | 'booked' | 'expired';
  date: string;
}

const mockInquiries: Inquiry[] = [
  {
    id: 'i1',
    user: { name: 'Adebola Mohammed', phone: '08012345678' },
    listing: 'Modern Student Hostel - Gbagada',
    message: 'Hi, I\'m interested in this property. Is it still available?',
    status: 'new',
    date: '2025-02-25',
  },
  {
    id: 'i2',
    user: { name: 'Sarah Johnson', phone: '08023456789' },
    listing: 'Single Room - Yaba',
    message: 'Can I come to view tomorrow?',
    status: 'responded',
    date: '2025-02-24',
  },
  {
    id: 'i3',
    user: { name: 'Mike Ibrahim', phone: '08034567890' },
    listing: 'Bedsitter - Ikeja',
    message: 'What\'s included in the rent?',
    status: 'new',
    date: '2025-02-25',
  },
  {
    id: 'i4',
    user: { name: 'Grace Adeyemi', phone: '08045678901' },
    listing: 'Luxury Apartment - Ikoyi',
    message: 'I\'d like to book this property.',
    status: 'booked',
    date: '2025-02-23',
  },
];

export function CompanyInquiriesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'new' | 'responded' | 'booked'>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);

  const filteredInquiries = mockInquiries.filter(inquiry => {
    const matchesSearch = inquiry.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.listing.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || inquiry.status === filter;
    return matchesSearch && matchesFilter;
  });

  const getStatusVariant = (status: Inquiry['status']) => {
    switch (status) {
      case 'new': return 'mustard';
      case 'responded': return 'info';
      case 'booked': return 'success';
      case 'expired': return 'error';
    }
  };

  const handleReply = async () => {
    if (!replyMessage.trim() || !selectedInquiry) return;
    setSending(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSending(false);
    setReplyMessage('');
    setSelectedInquiry({ ...selectedInquiry, status: 'responded' });
    setToast({ message: 'Reply sent successfully', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <AppLayout role="company" title="Inquiries" subtitle="Messages from potential clients">
      {toast && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-clay-sm shadow-clay z-50 ${
          toast.type === 'success' ? 'bg-status-success text-white' : 'bg-status-error text-white'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="clay-card overflow-hidden">
        <div className="p-4 border-b border-clay-border">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search inquiries..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="clay-input w-full pl-10"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'new', 'responded', 'booked'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={clsx(
                    'px-3 py-2 rounded-clay-sm text-xs font-medium capitalize transition-all',
                    filter === f
                      ? 'bg-mustard text-white'
                      : 'bg-clay-border-light text-text-secondary hover:bg-clay-border'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          <div className={clsx('divide-y divide-clay-border-light', selectedInquiry ? 'hidden lg:block lg:w-1/2' : 'w-full')}>
            {filteredInquiries.map(inquiry => (
              <div
                key={inquiry.id}
                onClick={() => setSelectedInquiry(inquiry)}
                className="p-4 hover:bg-clay-border-light cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-burnt-brown-pale flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-burnt-brown">
                      {inquiry.user.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-text-primary">{inquiry.user.name}</p>
                      <StatusBadge variant={getStatusVariant(inquiry.status)}>
                        {inquiry.status}
                      </StatusBadge>
                    </div>
                    <p className="text-xs text-text-tertiary mt-0.5 truncate">{inquiry.listing}</p>
                    <p className="text-sm text-text-secondary mt-1 line-clamp-2">{inquiry.message}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-text-tertiary">
                      <span>{inquiry.date}</span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {inquiry.user.phone}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-tertiary flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>

          {selectedInquiry && (
            <div className="lg:w-1/2 border-l border-clay-border-light flex flex-col">
              <div className="p-4 border-b border-clay-border-light flex items-center justify-between">
                <button onClick={() => setSelectedInquiry(null)} className="lg:hidden flex items-center gap-2 text-text-secondary">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <h3 className="font-semibold text-text-primary">Inquiry Details</h3>
              </div>
              <div className="p-4 flex-1 overflow-y-auto">
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-burnt-brown-pale flex items-center justify-center">
                      <span className="text-lg font-semibold text-burnt-brown">
                        {selectedInquiry.user.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary">{selectedInquiry.user.name}</p>
                      <p className="text-sm text-text-tertiary">{selectedInquiry.user.phone}</p>
                    </div>
                  </div>
                  <div className="bg-clay-border-light p-3 rounded-clay-sm">
                    <p className="text-xs text-text-tertiary mb-1">Property</p>
                    <p className="text-sm font-medium text-text-primary">{selectedInquiry.listing}</p>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-xs text-text-tertiary mb-2">Message</p>
                  <div className="bg-mustard/10 p-3 rounded-clay-sm">
                    <p className="text-sm text-text-primary">{selectedInquiry.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <StatusBadge variant={getStatusVariant(selectedInquiry.status)}>
                    {selectedInquiry.status}
                  </StatusBadge>
                  <span className="text-xs text-text-tertiary">{selectedInquiry.date}</span>
                </div>

                {selectedInquiry.status === 'new' && (
                  <div className="border-t border-clay-border-light pt-4">
                    <p className="text-sm font-medium text-text-primary mb-2">Reply</p>
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your reply..."
                      rows={4}
                      className="clay-input w-full resize-none"
                    />
                    <Button
                      variant="primary"
                      className="w-full mt-3"
                      onClick={handleReply}
                      disabled={!replyMessage.trim() || sending}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {sending ? 'Sending...' : 'Send Reply'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}