export type UserRole = 'agent' | 'company';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  role: UserRole | null;
}

export interface Agent {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  whatsapp: string;
  bio: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  verificationStatus: 'verified' | 'pending' | 'unverified';
  company?: {
    id: string;
    name: string;
    verified: boolean;
  };
  tier: TierDetails;
}

export interface Company {
  id: string;
  name: string;
  tradingName: string;
  email: string;
  phone: string;
  address: string;
  description: string;
  logo: string;
  cacNumber: string;
  status: 'verified' | 'pending' | 'unverified';
}

export interface CompanyPlan {
  name: string;
  price: number;
  billingCycle: 'monthly' | 'annually';
  features: string[];
  slotUsage: {
    used: number;
    total: number;
    percentage: number;
  };
}

export interface TierDetails {
  name: string;
  price: number;
  billingCycle: 'monthly' | 'annually';
  limits: {
    maxListings: number;
    featuredListings: number;
    agentSlots?: number;
  };
  features: string[];
}

export interface Tier {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'annually';
  features: string[];
  limits: {
    maxListings: number;
    featuredListings: number;
    agentSlots?: number;
  };
  isPopular?: boolean;
}

export type VerificationStatus = 'unverified' | 'pending' | 'approved' | 'rejected';

export interface VerificationDocuments {
  idCard?: string;
  cacCertificate?: string;
  businessPermit?: string;
  addressProof?: string;
  otherDocuments?: string[];
}

export interface AgentVerification {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  idNumber: string;
  idType: 'nin' | 'drivers_license' | 'passport' | 'voters_card';
  documents: VerificationDocuments;
  status: VerificationStatus;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface CompanyVerification {
  id: string;
  userId: string;
  companyName: string;
  tradingName: string;
  email: string;
  phone: string;
  address: string;
  cacNumber: string;
  cacCertificate: string;
  businessPermit: string;
  taxCertificate?: string;
  directorName: string;
  directorIdNumber: string;
  status: VerificationStatus;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface SignupData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword?: string;
  role: UserRole;
}

export interface CompanySignupData extends SignupData {
  companyName: string;
  tradingName: string;
  cacNumber: string;
  companyAddress: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  type: 'hostel' | 'apartment' | 'single_room' | 'bedsitter';
  price: number;
  currency: string;
  images: string[];
  location: {
    address: string;
    city: string;
    state: string;
    landmark?: string;
  };
  amenities: string[];
  status: 'active' | 'occupied' | 'archived' | 'pending';
  views: number;
  saves: number;
  inquiries: number;
  createdAt: string;
  occupiedBy?: {
    name: string;
    moveInDate: string;
  };
}

export interface Booking {
  id: string;
  listingId: string;
  listingTitle: string;
  userId: string;
  userName: string;
  userPhone: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  moveInDate: string;
  createdAt: string;
  price: number;
}

export interface Transaction {
  id: string;
  type: 'payment' | 'commission' | 'refund' | 'subscription';
  amount: number;
  currency: string;
  description: string;
  status: 'success' | 'pending' | 'failed';
  createdAt: string;
  listingId?: string;
  listingTitle?: string;
}

export interface CompanyAgent {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  status: 'active' | 'inactive';
  joinedAt: string;
  listingsCount: number;
}

export interface DashboardOverview {
  totalListings: number;
  activeListings: number;
  totalBookings: number;
  pendingBookings: number;
  monthlyRevenue: number;
}

export interface CompanyDashboardOverview {
  totalListings: number;
  totalAgents: number;
  activeBookings: number;
  monthlyRevenue: number;
  plan: CompanyPlan;
}

export interface AnalyticsData {
  totalViews: number;
  totalSaves: number;
  totalInquiries: number;
  totalBookings: number;
  conversionRate: number;
  changes: {
    views: string;
    saves: string;
    inquiries?: string;
    bookings?: string;
  };
  viewsTrend?: { date: string; value: number }[];
  topListings?: { id: string; title: string; views: number }[];
}

export interface NotificationSettings {
  newBooking: boolean;
  listingInquiry: boolean;
  paymentReceived: boolean;
  listingView: boolean;
  systemUpdates: boolean;
  marketingEmails: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_transfer' | 'ussd';
  details: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    cardLast4?: string;
    cardBrand?: string;
    expiryDate?: string;
  };
  isDefault: boolean;
}

export interface SubscriptionPayment {
  id: string;
  tierName: string;
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'annually';
  status: 'pending' | 'success' | 'failed';
  createdAt: string;
  paidAt?: string;
}

export interface InviteAgentData {
  email: string;
  name: string;
  phone?: string;
}

export interface InviteLink {
  id: string;
  inviteLink: string;
  email: string;
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: string;
  createdAt: string;
}