import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './api/authContext';
import { LoginPage } from './pages/Login';
import { SignupPage } from './pages/Signup';
import { CreateOTPPage } from './pages/CreateOTP';
import { ForgotPasswordPage } from './pages/ForgotPassword';
import { RoleSelectionPage } from './pages/RoleSelection';
import { TierSelectionPage } from './pages/TierSelection';
import { VerificationPage } from './pages/Verification';
import { VerificationPendingPage } from './pages/VerificationPending';
import { TierPage } from './pages/Tiers';
import { PaymentPage } from './pages/Payment';
import { AgentDashboardPage } from './pages/agent/Dashboard';
import { AgentListingsPage } from './pages/agent/Listings';
import { AgentCreateListingPage } from './pages/agent/CreateListing';
import { AgentBookingsPage } from './pages/agent/Bookings';
import { AgentChatsPage } from './pages/agent/Chats';
import { AgentInquiriesPage } from './pages/agent/Inquiries';
import { AgentPaymentsPage } from './pages/agent/Payments';
import { AgentAnalyticsPage } from './pages/agent/Analytics';
import { AgentNotificationsPage } from './pages/agent/Notifications';
import { AgentSettingsPage } from './pages/agent/Settings';
import { CompanyDashboardPage } from './pages/company/Dashboard';
import { CompanyListingsPage } from './pages/company/Listings';
import { CompanyAgentsPage } from './pages/company/Agents';
import { CompanyBookingsPage } from './pages/company/Bookings';
import { CompanyChatsPage } from './pages/company/Chats';
import { CompanyInquiriesPage } from './pages/company/Inquiries';
import { CompanyPaymentsPage } from './pages/company/Payments';
import { CompanyAnalyticsPage } from './pages/company/Analytics';
import { CompanyNotificationsPage } from './pages/company/Notifications';
import { CompanySettingsPage } from './pages/company/Settings';

import { AgentArchivedPage } from './pages/agent/Archived';
import { CompanyArchivedPage } from './pages/company/Archived';

function ProtectedRoute({ children, role }: { children: React.ReactNode; role: 'agent' | 'company' }) {
  const { isAuthenticated, role: userRole } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (userRole && userRole !== role) {
    return <Navigate to={userRole === 'company' ? '/company' : '/agent'} replace />;
  }
  
  return <>{children}</>;
}

function VerificationRoute() {
  const { role } = useParams<{ role: string }>();
  return <VerificationPage role={role as 'agent' | 'company'} />;
}

function TierRoute() {
  const { role } = useParams<{ role: string }>();
  return <TierPage role={role as 'agent' | 'company'} />;
}

function GenericTierRoute() {
  return <TierPage role="agent" />;
}

function AppRoutes() {
  const { role } = useAuth();
  
  useEffect(() => {
    if (role === 'agent') {
      document.title = 'iléSure | Agent — Your Sure Home Near Campus';
    } else if (role === 'company') {
      document.title = 'iléSure | Company — Your Sure Home Near Campus';
    } else {
      document.title = 'iléSure — Your Sure Home Near Campus';
    }
  }, [role]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/create-otp" element={<CreateOTPPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/role-selection" element={<RoleSelectionPage />} />
      <Route path="/tier-selection" element={<TierSelectionPage />} />
      <Route path="/verification/:role" element={<VerificationRoute />} />
      <Route path="/verification/pending" element={<VerificationPendingPage />} />
      <Route path="/tiers/:role" element={<TierRoute />} />
      <Route path="/tiers" element={<GenericTierRoute />} />
      <Route path="/payment" element={<PaymentPage />} />
      
      <Route path="/agent" element={
        <ProtectedRoute role="agent">
          <AgentDashboardPage />
        </ProtectedRoute>
      } />
      <Route path="/agent/listings" element={
        <ProtectedRoute role="agent">
          <AgentListingsPage />
        </ProtectedRoute>
      } />
      <Route path="/agent/archived" element={
        <ProtectedRoute role="agent">
          <AgentArchivedPage />
        </ProtectedRoute>
      } />
      <Route path="/agent/create-listing" element={
        <ProtectedRoute role="agent">
          <AgentCreateListingPage />
        </ProtectedRoute>
      } />
      <Route path="/agent/bookings" element={
        <ProtectedRoute role="agent">
          <AgentBookingsPage />
        </ProtectedRoute>
      } />
      <Route path="/agent/chats" element={
        <ProtectedRoute role="agent">
          <AgentChatsPage />
        </ProtectedRoute>
      } />
      <Route path="/agent/inquiries" element={
        <ProtectedRoute role="agent">
          <AgentInquiriesPage />
        </ProtectedRoute>
      } />
      <Route path="/agent/payments" element={
        <ProtectedRoute role="agent">
          <AgentPaymentsPage />
        </ProtectedRoute>
      } />
      <Route path="/agent/analytics" element={
        <ProtectedRoute role="agent">
          <AgentAnalyticsPage />
        </ProtectedRoute>
      } />
      <Route path="/agent/notifications" element={
        <ProtectedRoute role="agent">
          <AgentNotificationsPage />
        </ProtectedRoute>
      } />
      <Route path="/agent/settings" element={
        <ProtectedRoute role="agent">
          <AgentSettingsPage />
        </ProtectedRoute>
      } />
      
      <Route path="/company" element={
        <ProtectedRoute role="company">
          <CompanyDashboardPage />
        </ProtectedRoute>
      } />
      <Route path="/company/listings" element={
        <ProtectedRoute role="company">
          <CompanyListingsPage />
        </ProtectedRoute>
      } />
      <Route path="/company/archived" element={
        <ProtectedRoute role="company">
          <CompanyArchivedPage />
        </ProtectedRoute>
      } />
      <Route path="/company/agents" element={
        <ProtectedRoute role="company">
          <CompanyAgentsPage />
        </ProtectedRoute>
      } />
      <Route path="/company/bookings" element={
        <ProtectedRoute role="company">
          <CompanyBookingsPage />
        </ProtectedRoute>
      } />
      <Route path="/company/chats" element={
        <ProtectedRoute role="company">
          <CompanyChatsPage />
        </ProtectedRoute>
      } />
      <Route path="/company/inquiries" element={
        <ProtectedRoute role="company">
          <CompanyInquiriesPage />
        </ProtectedRoute>
      } />
      <Route path="/company/payments" element={
        <ProtectedRoute role="company">
          <CompanyPaymentsPage />
        </ProtectedRoute>
      } />
      <Route path="/company/analytics" element={
        <ProtectedRoute role="company">
          <CompanyAnalyticsPage />
        </ProtectedRoute>
      } />
      <Route path="/company/notifications" element={
        <ProtectedRoute role="company">
          <CompanyNotificationsPage />
        </ProtectedRoute>
      } />
      <Route path="/company/settings" element={
        <ProtectedRoute role="company">
          <CompanySettingsPage />
        </ProtectedRoute>
      } />
      
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}