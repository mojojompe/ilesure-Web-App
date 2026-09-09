import { useState } from 'react';
import { SparklesIcon as Sparkles, Message01Icon as MessageSquare, MailSend01Icon as Send, CheckmarkBadge02Icon as CheckCircle2, HelpCircleIcon as HelpCircle, TelephoneIcon as Phone, Mail01Icon as Mail, BubbleChatIcon as MessageCircle, ArrowDown01Icon as ChevronDown, ArrowUp01Icon as ChevronUp, LinkSquare01Icon as ExternalLink, BotIcon as Bot, SecurityCheckIcon as ShieldCheck, Clock01Icon as Clock, Alert01Icon as AlertCircle, Loading02Icon as Loader2 } from '@hugeicons/react';
import { ClayCard } from '../ui/ClayCard';
import { Button } from '../ui/Button';
import { useAuth } from '../../api/authContext';
import apiClient from '../../api/client';

interface SupportContentProps {
  role: 'agent' | 'company';
}

const FAQS = [
  {
    q: 'How does listing verification and approval work?',
    a: 'Once you submit a new listing, our quality and safety team verifies the address, photos, and amenities against local student accommodation standards. Listings are reviewed within 2-6 business hours.'
  },
  {
    q: 'When and how do I receive rent payouts?',
    a: 'Tenant payments made through iléSure are held securely in escrow until move-in verification. Funds are then automatically settled to your configured Paystack subaccount within 24 hours of successful check-in.'
  },
  {
    q: 'How do I connect my bank account for automatic payouts?',
    a: 'Navigate to Settings > Payout & Bank Account. Choose your verified Nigerian bank, enter your 10-digit NUBAN account number, and verify the resolved account name to generate your Paystack subaccount code.'
  },
  {
    q: 'What happens when my active listing limit is reached?',
    a: 'Basic plans allow up to 15 active listings, Premium allows 30, and Enterprise offers unlimited listings. You can upgrade your tier anytime under Settings > Subscription Plan or archive inactive properties to free up slots.'
  },
  {
    q: 'How do company admins manage sub-agents?',
    a: 'Company accounts can invite and assign sub-agents under the Agents tab. Sub-agents can draft and manage listings under company oversight, while financial payouts and billing remain restricted to company admins.'
  }
];

export function SupportContent({ role }: SupportContentProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'ai' | 'ticket' | 'faq'>('ai');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Ticket Form State
  const [ticketCategory, setTicketCategory] = useState('Listing Approval');
  const [ticketPriority, setTicketPriority] = useState('normal');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState<{ id: string; message: string } | null>(null);
  const [ticketError, setTicketError] = useState<string | null>(null);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      setTicketError('Please provide both a subject and a description of your issue.');
      return;
    }

    setTicketSubmitting(true);
    setTicketError(null);

    try {
      const payload = {
        name: user?.fullName || (role === 'company' ? 'Company Admin' : 'Agent'),
        email: user?.email || '',
        subject: `[${ticketPriority.toUpperCase()}] [${ticketCategory}] ${ticketSubject.trim()}`,
        message: ticketMessage.trim(),
      };

      const res: any = await apiClient.post('/support/chat', payload);
      if (res.data?.success || res.success) {
        const ticketData = res.data?.data || res.data;
        setTicketSuccess({
          id: ticketData?.ticketId || 'TKT-' + Math.floor(100000 + Math.random() * 900000),
          message: res.data?.message || 'Your support ticket has been received by our engineering and ops team.',
        });
        setTicketSubject('');
        setTicketMessage('');
      } else {
        setTicketError(res.data?.error?.message || 'Failed to submit support ticket. Please try again.');
      }
    } catch (err: any) {
      console.error('Failed to submit ticket', err);
      setTicketError(err.response?.data?.error?.message || err.message || 'Error submitting ticket');
    } finally {
      setTicketSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner / Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ClayCard className="p-5 flex items-center gap-4 bg-gradient-to-br from-mustard-light/30 via-white to-white border-mustard-light/50">
          <div className="w-12 h-12 rounded-clay-sm bg-mustard-light flex items-center justify-center text-burnt-brown-dark shadow-clay-sm flex-shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-burnt-brown-dark">iléSure AI Assistant</span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live 24/7
              </span>
            </div>
            <p className="text-xs text-text-tertiary mt-0.5">Instant answers for listing rules, payouts & platform guides.</p>
          </div>
        </ClayCard>

        <ClayCard className="p-5 flex items-center gap-4 bg-white">
          <div className="w-12 h-12 rounded-clay-sm bg-burnt-brown-pale flex items-center justify-center text-burnt-brown shadow-clay-sm flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sm font-bold text-text-primary">Direct Agent Support</span>
            <p className="text-xs text-text-tertiary mt-0.5">Tickets investigated and resolved within 24 business hours.</p>
          </div>
        </ClayCard>

        <ClayCard className="p-5 flex items-center gap-4 bg-white">
          <div className="w-12 h-12 rounded-clay-sm bg-status-success/15 flex items-center justify-center text-status-success shadow-clay-sm flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sm font-bold text-text-primary">Escrow & Verification</span>
            <p className="text-xs text-text-tertiary mt-0.5">Dedicated dispute management and payout security.</p>
          </div>
        </ClayCard>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-clay-border gap-2">
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors duration-150 ${
            activeTab === 'ai'
              ? 'border-burnt-brown text-burnt-brown'
              : 'border-transparent text-text-tertiary hover:text-text-primary'
          }`}
        >
          <Sparkles className="w-4 h-4 text-mustard" />
          iléSure AI Assistant
        </button>

        <button
          onClick={() => setActiveTab('ticket')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors duration-150 ${
            activeTab === 'ticket'
              ? 'border-burnt-brown text-burnt-brown'
              : 'border-transparent text-text-tertiary hover:text-text-primary'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-burnt-brown" />
          Submit Ticket
        </button>

        <button
          onClick={() => setActiveTab('faq')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors duration-150 ${
            activeTab === 'faq'
              ? 'border-burnt-brown text-burnt-brown'
              : 'border-transparent text-text-tertiary hover:text-text-primary'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-text-secondary" />
          Contact & FAQs
        </button>
      </div>

      {/* TAB 1: AI Chatbot */}
      {activeTab === 'ai' && (
        <ClayCard className="p-0 overflow-hidden border border-clay-border bg-white shadow-clay">
          <div className="p-4 bg-cream-50/50 border-b border-clay-border flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-mustard-light flex items-center justify-center text-burnt-brown-dark shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  iléSure AI Support Assistant
                  <span className="text-[10px] font-bold bg-mustard-light text-burnt-brown-dark px-2 py-0.5 rounded-full">
                    Official AI
                  </span>
                </h2>
                <p className="text-xs text-text-tertiary">Ask anything about listing approvals, pricing tiers, commission, or student verification.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="https://wa.me/2348071455374"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-clay-sm border border-emerald-200 transition-colors flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                Live Agent WhatsApp
              </a>
            </div>
          </div>

          <div className="w-full h-[650px] relative bg-white">
            <iframe
              src="https://www.chatbase.co/chatbot-iframe/4G95TFjKNyu5gD5mDwt4G"
              title="iléSure AI Support Assistant"
              className="w-full h-full border-0"
              allow="microphone"
            />
          </div>
        </ClayCard>
      )}

      {/* TAB 2: Submit Ticket */}
      {activeTab === 'ticket' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ClayCard className="p-6">
              <h2 className="text-lg font-bold text-text-primary mb-1">Open a Priority Support Ticket</h2>
              <p className="text-xs text-text-tertiary mb-6">Our dedicated support desk will review and reply directly to your verified email address.</p>

              {ticketSuccess ? (
                <div className="p-6 rounded-clay bg-emerald-50 border border-emerald-200 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-emerald-900">Support Ticket Created</h3>
                    <p className="text-xs text-emerald-700 mt-1">{ticketSuccess.message}</p>
                    <div className="mt-3 inline-block px-3 py-1.5 bg-white border border-emerald-300 rounded-clay-sm text-xs font-mono font-bold text-emerald-800">
                      Ticket ID: {ticketSuccess.id}
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setTicketSuccess(null)}
                    className="mt-2"
                  >
                    Submit Another Request
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmitTicket} className="space-y-4">
                  {ticketError && (
                    <div className="p-3 rounded-clay-sm bg-status-error/10 border border-status-error/30 text-status-error text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{ticketError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1">Your Name</label>
                      <input
                        type="text"
                        disabled
                        value={user?.fullName || ''}
                        className="w-full px-3.5 py-2.5 rounded-clay-sm border border-clay-border bg-gray-50 text-sm text-text-primary cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1">Contact Email</label>
                      <input
                        type="email"
                        disabled
                        value={user?.email || ''}
                        className="w-full px-3.5 py-2.5 rounded-clay-sm border border-clay-border bg-gray-50 text-sm text-text-primary cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1">Issue Category</label>
                      <select
                        value={ticketCategory}
                        onChange={(e) => setTicketCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-clay-sm border border-clay-border bg-white text-sm text-text-primary focus:outline-none focus:border-burnt-brown"
                      >
                        <option value="Listing Approval">Listing Approval / Rejection</option>
                        <option value="Payout & Bank Account">Payout / Paystack Subaccount</option>
                        <option value="Booking & Tenant Dispute">Tenant Booking Dispute</option>
                        <option value="KYC & Verification">KYC & Document Verification</option>
                        <option value="Plan & Billing">Subscription Tier & Billing</option>
                        <option value="Technical Issue">Technical Bug / System Issue</option>
                        <option value="Other">Other Inquiry</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1">Priority</label>
                      <select
                        value={ticketPriority}
                        onChange={(e) => setTicketPriority(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-clay-sm border border-clay-border bg-white text-sm text-text-primary focus:outline-none focus:border-burnt-brown"
                      >
                        <option value="normal">Normal (Under 24 hours)</option>
                        <option value="high">High (Urgent tenant / payout issue)</option>
                        <option value="urgent">Urgent (Critical listing / account lock)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Subject</label>
                    <input
                      type="text"
                      placeholder="Brief summary of the issue (e.g., Cannot resolve bank account details)"
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-clay-sm border border-clay-border bg-white text-sm text-text-primary focus:outline-none focus:border-burnt-brown"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Detailed Description</label>
                    <textarea
                      rows={5}
                      placeholder="Please include listing IDs, bank details, or error messages where applicable..."
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-clay-sm border border-clay-border bg-white text-sm text-text-primary focus:outline-none focus:border-burnt-brown resize-none"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="submit"
                      disabled={ticketSubmitting}
                      className="flex items-center gap-2"
                    >
                      {ticketSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Submit Support Ticket
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </ClayCard>
          </div>

          <div className="space-y-4">
            <ClayCard className="p-5">
              <h3 className="text-sm font-bold text-text-primary mb-3">Support SLA Guidelines</h3>
              <ul className="space-y-3 text-xs text-text-secondary">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-burnt-brown mt-1 flex-shrink-0" />
                  <span><strong>Listing Verification:</strong> Reviewed daily between 8:00 AM – 6:00 PM WAT.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-burnt-brown mt-1 flex-shrink-0" />
                  <span><strong>Rent Payout Disputes:</strong> Escalated to our finance officer immediately.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-burnt-brown mt-1 flex-shrink-0" />
                  <span><strong>KYC Reviews:</strong> Automated via Dojah; manual overrides handled within 12h.</span>
                </li>
              </ul>
            </ClayCard>

            <ClayCard className="p-5 bg-gradient-to-br from-cream-50 to-white">
              <h3 className="text-sm font-bold text-burnt-brown mb-2">Need Immediate Assistance?</h3>
              <p className="text-xs text-text-tertiary mb-4">You can reach our on-call agent operations team via WhatsApp or telephone.</p>
              <a
                href="https://wa.me/2348071455374"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-clay-sm bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-clay-sm"
              >
                <Phone className="w-4 h-4" />
                Chat on WhatsApp (+234 807 145 5374)
              </a>
            </ClayCard>
          </div>
        </div>
      )}

      {/* TAB 3: FAQs & Direct Channels */}
      {activeTab === 'faq' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-base font-bold text-text-primary mb-2">Frequently Asked Questions</h2>
            {FAQS.map((faq, index) => {
              const isOpen = expandedFaq === index;
              return (
                <ClayCard key={index} className="p-0 overflow-hidden">
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : index)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-cream-50/50 transition-colors"
                  >
                    <span className="text-sm font-semibold text-text-primary">{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-burnt-brown flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-text-secondary leading-relaxed border-t border-clay-border/50 bg-white">
                      {faq.a}
                    </div>
                  )}
                </ClayCard>
              );
            })}
          </div>

          <div className="space-y-4">
            <ClayCard className="p-5">
              <h3 className="text-sm font-bold text-text-primary mb-3">Direct Support Channels</h3>
              <div className="space-y-2.5">
                <a
                  href="mailto:ilesuresupport@gmail.com"
                  className="flex items-center gap-3 p-3 rounded-clay-sm border border-clay-border hover:border-burnt-brown/40 hover:bg-cream-50/40 transition-all group"
                >
                  <div className="w-8 h-8 rounded-clay-sm bg-burnt-brown-pale text-burnt-brown flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-text-primary">Email Support</div>
                    <div className="text-[11px] text-text-tertiary truncate">ilesuresupport@gmail.com</div>
                  </div>
                </a>

                <a
                  href="https://wa.me/2348071455374"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-clay-sm border border-clay-border hover:border-emerald-300 hover:bg-emerald-50/30 transition-all group"
                >
                  <div className="w-8 h-8 rounded-clay-sm bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-text-primary">WhatsApp Helpline</div>
                    <div className="text-[11px] text-text-tertiary">+234 807 145 5374</div>
                  </div>
                </a>

                <a
                  href="https://x.com/ilesuresupport"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-clay-sm border border-clay-border hover:border-sky-300 hover:bg-sky-50/30 transition-all group"
                >
                  <div className="w-8 h-8 rounded-clay-sm bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-text-primary">Twitter / X</div>
                    <div className="text-[11px] text-text-tertiary">@ilesuresupport</div>
                  </div>
                </a>
              </div>
            </ClayCard>
          </div>
        </div>
      )}
    </div>
  );
}
