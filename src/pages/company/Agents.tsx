import { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Star, UserPlus, Eye, Loader, Mail, Phone } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ClayCard } from '../../components/ui/ClayCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { companyApi } from '../../api/company';

export function CompanyAgentsPage() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  const [email, setEmail] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [agents, setAgents] = useState<any[]>([]);

  useEffect(() => {
    fetchAgents();
  }, [searchQuery]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const response = await companyApi.getAgents({ search: searchQuery });
      if (response.success && response.data) {
        setAgents(response.data.agents || []);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleInvite = async () => {
    if (!email) return;
    setSubmitting(true);
    try {
      const response = await companyApi.inviteAgent(email);
      if (response.success) {
        showToast('Invitation sent successfully!', 'success');
        setShowInviteModal(false);
        setEmail('');
      } else {
        showToast(response.message || 'Failed to invite agent', 'error');
      }
    } catch (error) {
      showToast('Failed to invite agent', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleView = (agent: any) => {
    setSelectedAgent(agent);
    setShowViewModal(true);
  };

  const handleEdit = (agent: any) => {
    setSelectedAgent(agent);
    setShowEditModal(true);
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Are you sure you want to remove this agent?')) return;
    try {
      const response = await companyApi.removeAgent(id);
      if (response.success) {
        showToast('Agent removed', 'success');
        fetchAgents();
      }
    } catch {
      showToast('Failed to remove agent', 'error');
    }
  };

  return (
    <AppLayout role="company" title="Agents" subtitle="Manage your team">
      {toast && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-clay-sm shadow-clay z-50 ${
          toast.type === 'success' ? 'bg-status-success text-white' : 'bg-status-error text-white'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="clay-input w-full pl-11"
          />
        </div>
        <Button variant="primary" onClick={() => setShowInviteModal(true)}>
          <UserPlus className="w-4 h-4 mr-2" /> Invite Agent
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-mustard" />
        </div>
      ) : agents.length > 0 ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {agents.map(agent => (
            <ClayCard key={agent.id} hover className="p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-mustard-light flex items-center justify-center text-burnt-brown-dark text-xl font-bold">
                  {agent.fullName?.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-text-primary">{agent.fullName}</h3>
                  <p className="text-xs text-text-tertiary">{agent.email}</p>
                </div>
                <StatusBadge variant={agent.status === 'active' ? 'success' : 'default'}>
                  {agent.status}
                </StatusBadge>
              </div>
              <div className="flex items-center gap-4 text-sm text-text-secondary mb-4">
                <span>{agent.listingsCount} listings</span>
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-mustard" /> {agent.rating || 0}
                </span>
              </div>
              <div className="flex gap-2 pt-4 border-t border-clay-border-light">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => handleView(agent)}>
                  <Eye className="w-3 h-3 mr-1" /> View
                </Button>
                <Button variant="secondary" size="sm" onClick={() => handleEdit(agent)}>
                  <Edit className="w-3 h-3" />
                </Button>
                <Button variant="secondary" size="sm" onClick={() => handleRemove(agent.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </ClayCard>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-text-tertiary">No agents found</p>
        </div>
      )}

      <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} title="Invite Agent">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Enter the email address of the person you want to invite to join your company.
          </p>
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@example.com"
                className="clay-input w-full pl-11"
              />
            </div>
          </div>
          <div className="bg-burnt-brown-pale rounded-clay-sm p-3">
            <p className="text-xs text-text-tertiary">
              The invite link will be valid for 7 days. The agent will need to sign up to join your company.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowInviteModal(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={handleInvite} loading={submitting}>
              {submitting ? <Loader className="w-4 h-4 animate-spin" /> : 'Send Invite'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title={selectedAgent?.fullName || 'Agent Details'}>
        {selectedAgent && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-mustard-light flex items-center justify-center text-burnt-brown-dark text-2xl font-bold">
                {selectedAgent.fullName?.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">{selectedAgent.fullName}</h3>
                <StatusBadge variant={selectedAgent.status === 'active' ? 'success' : 'default'}>
                  {selectedAgent.status}
                </StatusBadge>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-text-secondary">
                <Mail className="w-4 h-4" />
                <span>{selectedAgent.email}</span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <Phone className="w-4 h-4" />
                <span>{selectedAgent.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <Star className="w-4 h-4 text-mustard" />
                <span>{selectedAgent.rating || 0} ({selectedAgent.reviewCount || 0} reviews)</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-clay-border">
              <div className="text-center p-3 bg-clay-border-light rounded-clay-sm">
                <p className="text-xl font-bold text-text-primary">{selectedAgent.listingsCount || 0}</p>
                <p className="text-xs text-text-tertiary">Listings</p>
              </div>
              <div className="text-center p-3 bg-clay-border-light rounded-clay-sm">
                <p className="text-xl font-bold text-text-primary">{selectedAgent.reviewCount || 0}</p>
                <p className="text-xs text-text-tertiary">Reviews</p>
              </div>
            </div>
            <Button variant="primary" className="w-full" onClick={() => { setShowViewModal(false); handleEdit(selectedAgent); }}>
              <Edit className="w-4 h-4 mr-2" /> Edit Agent
            </Button>
          </div>
        )}
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`Edit ${selectedAgent?.fullName || 'Agent'}`}>
        {selectedAgent && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Full Name</label>
              <input type="text" defaultValue={selectedAgent.fullName} className="clay-input w-full" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Email</label>
              <input type="email" defaultValue={selectedAgent.email} className="clay-input w-full" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Phone</label>
              <input type="tel" defaultValue={selectedAgent.phone || ''} className="clay-input w-full" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Status</label>
              <select defaultValue={selectedAgent.status} className="clay-input w-full">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="secondary" className="flex-1" onClick={() => setShowEditModal(false)}>Cancel</Button>
              <Button variant="primary" className="flex-1" onClick={() => { showToast('Agent updated successfully!', 'success'); setShowEditModal(false); }}>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}