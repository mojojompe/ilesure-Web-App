export type UserRole = 'student' | 'landlord' | 'agent' | 'company' | 'company_admin' | 'sub_agent';

// ── AI Roommate Matching Types ──────────────────────────────────────

export interface RoommateProfile {
  // Lifestyle preferences (categorical)
  sleepSchedule?:    'early_bird' | 'night_owl' | 'flexible';
  noiseTolerance?:  'very_quiet' | 'moderate' | 'noisy_ok';
  cleanliness?:      'neat_freak' | 'organized' | 'casual' | 'messy';
  cookingFrequency?: 'daily' | 'few_times_week' | 'rarely' | 'never';
  studySchedule?:   'morning' | 'afternoon' | 'evening' | 'late_night' | 'distributed';
  socialActivity?:  'very_social' | 'moderate' | 'private' | 'hermit';
  guestComfort?:   'love_guests' | 'ok_with_notice' | 'rare_guests' | 'no_guests';
  smokingAlcohol?:  'no' | 'socially' | 'yes';
  powerUsage?:      'low' | 'medium' | 'high';

  // Numeric preferences
  openness?:         number;  // 1-5 scale
  religionImportance?: number;  // 1-5 scale
  budgetMin?:        number;
  budgetMax?:        number;
  age?:             number;
  preferredGender?:  'male' | 'female' | 'any';
  preferredZone?:    string;  // Campus area preference

  // Meta
  bio?:             string;
  courseOfStudy?:   string;
  yearOfStudy?:     string;
  updatedAt?:        string;
}

export interface CategoryScores {
  lifestyle:  number;  // 0-100
  numeric:    number;  // 0-100
  preference: number;  // 0-100
}

export interface MatchResult {
  userId:           string;
  fullName?:       string;
  avatar?:          string;
  overallScore:     number;  // 0-100
  confidence:        number;  // 0-1 (how reliable is this match)
  categoryScores:   CategoryScores;
  strengths:        string[];
  concerns:         string[];
  recommendation:    'excellent' | 'good' | 'fair' | 'poor';
  aInterested?:    boolean;
  bInterested?:    boolean;
  contactReleasedAt?: string;
  createdAt:        string;
  aiPowered?:       boolean;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  phone?: string;
  whatsapp?: string;
  bio?: string;
  avatar?: string;
  status?: 'active' | 'pending' | 'inactive';
  verificationStatus?: 'verified' | 'pending' | 'unverified';
  companyId?: string | { _id: string; name: string; tradingName?: string; logo?: string; tier?: string; };
  gender?: 'male' | 'female';
  tier?: {
    name: string;
    billingCycle: string;
    limits: {
      maxListings: number;
      featuredListings: number;
    };
  };
  company?: {
    id: string;
    name: string;
    verified: boolean;
  };
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
  features: {
    maxListings: number;
    analytics?: string;
    support?: string;
    visibility?: string;
  };
}

export interface Tier {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'annually';
  features: {
    maxListings: number;
    analytics?: string;
    support?: string;
    visibility?: string;
  };
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
  _id: string;
  landlordId: string;
  title: string;
  description: string;
  rentAnnual: number;
  areaCluster: string;
  distanceBucket: string;
  address?: string;
  city?: string;
  landmark?: string;
  propertyType: 'self_con' | '1_bed' | '2_bed' | '3_bed' | 'mini_flat' | 'hostel_room' | 'shared_apartment' | 'shortlet' | 'selfcon' | '1bedroom' | '2bedroom' | 'miniflat' | 'studio' | 'penthouse' | 'hostel';
  furnishing: 'fully_furnished' | 'semi-furnished' | 'unfurnished' | 'furnished' | 'semifurnished';
  power: 'constant' | 'gen-dependent' | 'solar-backed' | 'phcn' | 'generator' | 'solar' | 'hybrid';
  water: 'borehole' | 'public' | 'tank';
  maxOccupants: number;
  genderRestriction: 'any' | 'male_only' | 'female_only' | 'mixed' | 'male' | 'female';
  status: 'pending_approval' | 'active' | 'needs_roommate' | 'fully_booked' | 'archived' | 'rejected';
  images: string[];
  agentId?: string;
  companyId?: string;
  interestCount?: number;
  cautionFee?: number;
  agencyFee?: number;
  additionalNotes?: string;
  paymentFrequency?: 'annually' | 'bi-annually' | 'quarterly' | 'monthly' | 'custom';
  customPaymentPlan?: {
    installments: number;
    interval: 'monthly' | 'bi-monthly';
    amountPerInstallment: number;
  };
  totalMoveinCost?: number;
  shortletPricing?: {
    hourly?: number;
    daily?: number;
    weekly?: number;
    monthly?: number;
  };
  minStay?: number;
  minStayUnit?: 'hour' | 'day' | 'week' | 'month';
  maxStay?: number;
  maxStayUnit?: 'hour' | 'day' | 'week' | 'month';
  hasWifi?: boolean;
  securityType?: string;
  distanceFromLCU?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  _id: string;
  listingId: { _id: string; title: string; images: string[]; rentAnnual: number; areaCluster: string; paymentFrequency?: string; customPaymentPlan?: { installments: number; interval: string; amountPerInstallment: number } };
  userId: { _id: string; fullName: string; email: string; phone: string };
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';
  moveInDate: string;
  duration?: string;
  message?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Chat {
  id: string;
  participant: {
    id: string;
    fullName: string;
    avatar?: string;
  };
  listing?: {
    id: string;
    title: string;
  };
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface Message {
  id: string;
  senderId: string;
  sender?: { _id: string; fullName: string };
  text: string;
  createdAt: string;
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