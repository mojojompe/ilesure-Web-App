import type { Agent, Company, Listing, Booking, Transaction, CompanyAgent, DashboardOverview, CompanyDashboardOverview, AnalyticsData, NotificationSettings, Tier, VerificationDocuments, PaymentMethod, SubscriptionPayment, InviteLink } from '../types';

export const mockAgent: Agent = {
  id: 'a_001',
  fullName: 'James Okonkwo',
  email: 'james.okonkwo@email.com',
  phone: '08012345678',
  whatsapp: '2348012345678',
  bio: 'Experienced property manager with 5+ years in student housing.',
  avatar: '',
  rating: 4.7,
  reviewCount: 28,
  verificationStatus: 'verified',
  company: {
    id: 'c_789',
    name: 'Property Masters Ltd',
    verified: true,
  },
  tier: {
    name: 'premium',
    price: 25000,
    billingCycle: 'monthly',
    limits: {
      maxListings: 50,
      featuredListings: 10,
    },
    features: ['Unlimited listings', 'Featured listings', 'Analytics', 'Priority support'],
  },
};

export const mockPendingAgent: Agent = {
  ...mockAgent,
  verificationStatus: 'pending',
  tier: {
    name: 'basic',
    price: 0,
    billingCycle: 'monthly',
    limits: {
      maxListings: 5,
      featuredListings: 1,
    },
    features: ['Up to 5 listings', 'Basic analytics'],
  },
};

export const mockUnverifiedAgent: Agent = {
  ...mockAgent,
  verificationStatus: 'unverified',
  tier: {
    name: 'basic',
    price: 0,
    billingCycle: 'monthly',
    limits: {
      maxListings: 5,
      featuredListings: 1,
    },
    features: ['Up to 5 listings', 'Basic analytics'],
  },
};

export const mockCompany: Company = {
  id: 'c_001',
  name: 'Property Masters Ltd',
  tradingName: 'Property Masters',
  email: 'info@propertymasters.com',
  phone: '+2348012345678',
  address: '15 Adeola Odeku Street, Victoria Island, Lagos',
  description: 'Premium student housing provider.',
  logo: '',
  cacNumber: 'RC-1234567',
  status: 'verified',
};

export const mockPendingCompany: Company = {
  ...mockCompany,
  status: 'pending',
};

export const mockUnverifiedCompany: Company = {
  ...mockCompany,
  status: 'unverified',
};

export const mockCompanyPlan = {
  name: 'enterprise',
  price: 500000,
  billingCycle: 'annually' as const,
  features: ['Unlimited listings', 'Priority support', 'Analytics dashboard', 'Custom branding'],
  slotUsage: {
    used: 4,
    total: 50,
    percentage: 8,
  },
};

export const mockAgentDocuments: VerificationDocuments = {
  idCard: 'https://example.com/id-card.jpg',
  otherDocuments: ['https://example.com/utility.jpg'],
};

export const mockCompanyDocuments = {
  cacCertificate: 'https://example.com/cac.pdf',
  businessPermit: 'https://example.com/permit.pdf',
  addressProof: 'https://example.com/utility.pdf',
};

export const tiers: Tier[] = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Perfect for getting started',
    price: 0,
    billingCycle: 'monthly',
    features: ['Up to 5 listings', 'Basic analytics', 'Email support', 'Standard listing duration'],
    limits: {
      maxListings: 5,
      featuredListings: 1,
    },
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'For growing agents',
    price: 15000,
    billingCycle: 'monthly',
    features: ['Up to 15 listings', '5 featured listings', 'Advanced analytics', 'Priority support', 'Custom branding'],
    limits: {
      maxListings: 15,
      featuredListings: 5,
    },
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'For professional agents',
    price: 25000,
    billingCycle: 'monthly',
    features: ['Up to 50 listings', '15 featured listings', 'All analytics', '24/7 priority support', 'Custom branding', 'API access'],
    limits: {
      maxListings: 50,
      featuredListings: 15,
    },
    isPopular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For property companies',
    price: 50000,
    billingCycle: 'monthly',
    features: ['Unlimited listings', 'Unlimited featured', 'Dedicated account manager', 'White-label solution', 'Bulk upload'],
    limits: {
      maxListings: 9999,
      featuredListings: 999,
    },
  },
];

export const companyTiers: Tier[] = [
  {
    id: 'startup',
    name: 'Startup',
    description: 'For small property companies',
    price: 150000,
    billingCycle: 'monthly',
    features: ['Up to 20 listings', '5 agent slots', 'Analytics dashboard', 'Email support'],
    limits: {
      maxListings: 20,
      featuredListings: 10,
      agentSlots: 5,
    },
  },
  {
    id: 'business',
    name: 'Business',
    description: 'For growing companies',
    price: 300000,
    billingCycle: 'monthly',
    features: ['Up to 50 listings', '15 agent slots', 'Advanced analytics', 'Priority support'],
    limits: {
      maxListings: 50,
      featuredListings: 20,
      agentSlots: 15,
    },
    isPopular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large property companies',
    price: 500000,
    billingCycle: 'monthly',
    features: ['Unlimited listings', 'Unlimited agent slots', 'Dedicated manager', 'Custom branding', 'API access'],
    limits: {
      maxListings: 9999,
      featuredListings: 999,
      agentSlots: 999,
    },
  },
];

export const mockListings = [
  {
    id: 'l_001',
    title: 'Modern Student Hostel - Gbagada',
    description: 'Clean, safe and affordable hostel accommodation opposite UNILAG.',
    type: 'hostel',
    price: 180000,
    currency: 'NGN',
    images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800'],
    location: { address: '12 Sadiku Street', city: 'Lagos', state: 'Lagos', landmark: 'UNILAG Main Gate' },
    amenities: ['WiFi', 'Security', 'Water', 'Electricity', 'Laundry', 'Common Room'],
    status: 'active',
    views: 1248,
    saves: 89,
    inquiries: 23,
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    id: 'l_002',
    title: 'Single Room - Yaba',
    description: 'Private self-contained room in a mini flat.',
    type: 'single_room',
    price: 250000,
    currency: 'NGN',
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'],
    location: { address: '45 Montgomery Road', city: 'Lagos', state: 'Lagos', landmark: 'Yaba Tech' },
    amenities: ['WiFi', 'Security', 'Parking', 'AC Ready'],
    status: 'active',
    views: 892,
    saves: 56,
    inquiries: 15,
    createdAt: '2025-01-20T14:30:00Z',
  },
  {
    id: 'l_003',
    title: 'Bedsitter - Ikeja',
    description: 'Cozy bedsitter in a quiet neighborhood.',
    type: 'bedsitter',
    price: 200000,
    currency: 'NGN',
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'],
    location: { address: '8 Allen Avenue', city: 'Lagos', state: 'Lagos' },
    amenities: ['WiFi', 'Security', 'Generator'],
    status: 'active',
    views: 654,
    saves: 34,
    inquiries: 8,
    createdAt: '2025-02-01T09:00:00Z',
  },
  {
    id: 'l_004',
    title: '2 Bedroom Apartment - Surulere',
    description: 'Full apartment suitable for students.',
    type: 'apartment',
    price: 350000,
    currency: 'NGN',
    images: ['https://images.unsplash.com/photo-1493809842364-78847cab4294?w=800'],
    location: { address: '22 Ogunlana Drive', city: 'Lagos', state: 'Lagos' },
    amenities: ['WiFi', 'Security', 'Parking', 'Balcony'],
    status: 'active',
    views: 445,
    saves: 28,
    inquiries: 5,
    createdAt: '2025-02-10T11:00:00Z',
  },
  {
    id: 'l_005',
    title: 'Hostel Bed Space - Akoka',
    description: 'Available bed space in a well-managed hostel.',
    type: 'hostel',
    price: 120000,
    currency: 'NGN',
    images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800'],
    location: { address: '5 Yaba Road', city: 'Lagos', state: 'Lagos', landmark: 'UNIBEN' },
    amenities: ['WiFi', 'Security', 'Water', 'Electricity'],
    status: 'occupied',
    views: 2100,
    saves: 180,
    inquiries: 45,
    createdAt: '2024-12-01T10:00:00Z',
    occupiedBy: { name: 'Chidi Okwu', moveInDate: '2025-01-01' },
  },
  {
    id: 'l_006',
    title: 'Luxury Apartment - Ikoyi',
    description: 'Premium serviced apartment in Ikoyi.',
    type: 'apartment',
    price: 850000,
    currency: 'NGN',
    images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'],
    location: { address: '15 Alfred Rewane Road', city: 'Lagos', state: 'Lagos' },
    amenities: ['WiFi', 'Security', 'Pool', 'Gym', 'Parking', 'AC'],
    status: 'active',
    views: 3200,
    saves: 420,
    inquiries: 78,
    createdAt: '2025-02-15T08:00:00Z',
  },
];

export const mockArchivedListings = mockListings.map(l => ({
  ...l,
  id: `archived_${l.id}`,
  title: `${l.title} (Archived)`,
  status: 'archived' as const,
}));

export const mockBookings = [
  {
    id: 'b_001',
    listingId: 'l_001',
    listingTitle: 'Modern Student Hostel - Gbagada',
    userId: 'u_001',
    userName: 'Adebola Mohammed',
    userPhone: '08056789012',
    status: 'pending',
    moveInDate: '2025-03-01',
    createdAt: '2025-02-20T10:00:00Z',
    price: 180000,
  },
  {
    id: 'b_002',
    listingId: 'l_002',
    listingTitle: 'Single Room - Yaba',
    userId: 'u_002',
    userName: 'Sarah Johnson',
    userPhone: '08067890123',
    status: 'confirmed',
    moveInDate: '2025-02-25',
    createdAt: '2025-02-18T14:30:00Z',
    price: 250000,
  },
  {
    id: 'b_003',
    listingId: 'l_001',
    listingTitle: 'Modern Student Hostel - Gbagada',
    userId: 'u_003',
    userName: 'Mike Ibrahim',
    userPhone: '08078901234',
    status: 'completed',
    moveInDate: '2025-01-15',
    createdAt: '2025-01-10T09:00:00Z',
    price: 180000,
  },
  {
    id: 'b_004',
    listingId: 'l_006',
    listingTitle: 'Luxury Apartment - Ikoyi',
    userId: 'u_004',
    userName: 'Grace Adeyemi',
    userPhone: '08089012345',
    status: 'confirmed',
    moveInDate: '2025-03-15',
    createdAt: '2025-02-22T16:00:00Z',
    price: 850000,
  },
  {
    id: 'b_005',
    listingId: 'l_004',
    listingTitle: '2 Bedroom Apartment - Surulere',
    userId: 'u_005',
    userName: 'David Ojo',
    userPhone: '08090123456',
    status: 'cancelled',
    moveInDate: '2025-02-20',
    createdAt: '2025-02-15T11:00:00Z',
    price: 350000,
  },
];

export const mockTransactions = [
  {
    id: 't_001',
    type: 'payment',
    amount: 180000,
    currency: 'NGN',
    description: 'Booking payment for Modern Student Hostel - Gbagada',
    status: 'success',
    createdAt: '2025-02-18T10:00:00Z',
    listingId: 'l_001',
    listingTitle: 'Modern Student Hostel - Gbagada',
  },
  {
    id: 't_002',
    type: 'commission',
    amount: 18000,
    currency: 'NGN',
    description: 'Platform commission - Booking b_002',
    status: 'success',
    createdAt: '2025-02-18T10:00:00Z',
    listingId: 'l_002',
    listingTitle: 'Single Room - Yaba',
  },
  {
    id: 't_003',
    type: 'payment',
    amount: 250000,
    currency: 'NGN',
    description: 'Booking payment for Single Room - Yaba',
    status: 'success',
    createdAt: '2025-02-19T14:30:00Z',
    listingId: 'l_002',
    listingTitle: 'Single Room - Yaba',
  },
  {
    id: 't_004',
    type: 'payment',
    amount: 850000,
    currency: 'NGN',
    description: 'Booking payment for Luxury Apartment - Ikoyi',
    status: 'success',
    createdAt: '2025-02-23T09:00:00Z',
    listingId: 'l_006',
    listingTitle: 'Luxury Apartment - Ikoyi',
  },
];

export const mockPaymentMethods: PaymentMethod[] = [
  {
    id: 'pm_001',
    type: 'card',
    details: { cardLast4: '4242', cardBrand: 'Visa', expiryDate: '12/26' },
    isDefault: true,
  },
  {
    id: 'pm_002',
    type: 'bank_transfer',
    details: { bankName: 'GTBank', accountNumber: '0123456789', accountName: 'iléSure Properties Ltd' },
    isDefault: false,
  },
];

export const mockSubscriptionPayments: SubscriptionPayment[] = [
  {
    id: 'sub_001',
    tierName: 'Premium',
    amount: 25000,
    currency: 'NGN',
    billingCycle: 'monthly',
    status: 'success',
    createdAt: '2025-01-15T10:00:00Z',
    paidAt: '2025-01-15T10:05:00Z',
  },
  {
    id: 'sub_002',
    tierName: 'Premium',
    amount: 25000,
    currency: 'NGN',
    billingCycle: 'monthly',
    status: 'success',
    createdAt: '2025-02-15T10:00:00Z',
    paidAt: '2025-02-15T10:02:00Z',
  },
];

export const mockCompanyAgents: CompanyAgent[] = [
  {
    id: 'a_001',
    fullName: 'James Okonkwo',
    email: 'james.okonkwo@email.com',
    phone: '08012345678',
    avatar: '',
    rating: 4.7,
    reviewCount: 28,
    status: 'active',
    joinedAt: '2024-06-15T10:00:00Z',
    listingsCount: 8,
  },
  {
    id: 'a_002',
    fullName: 'Funke Adebayo',
    email: 'funke.adebayo@email.com',
    phone: '08023456789',
    avatar: '',
    rating: 4.5,
    reviewCount: 15,
    status: 'active',
    joinedAt: '2024-08-20T10:00:00Z',
    listingsCount: 5,
  },
  {
    id: 'a_003',
    fullName: 'Emeka Nwachukwu',
    email: 'emeka.nwachukwu@email.com',
    phone: '08034567890',
    avatar: '',
    rating: 4.2,
    reviewCount: 8,
    status: 'active',
    joinedAt: '2024-10-01T10:00:00Z',
    listingsCount: 3,
  },
  {
    id: 'a_004',
    fullName: 'Aisha Bello',
    email: 'aisha.bello@email.com',
    phone: '08045678901',
    avatar: '',
    rating: 4.9,
    reviewCount: 42,
    status: 'inactive',
    joinedAt: '2024-03-10T10:00:00Z',
    listingsCount: 0,
  },
];

export const mockInviteLinks: InviteLink[] = [
  {
    id: 'inv_001',
    inviteLink: 'https://ilesure.com/invite/abc123xyz',
    email: 'new.agent@email.com',
    status: 'pending',
    expiresAt: '2025-03-01T12:00:00Z',
    createdAt: '2025-02-20T10:00:00Z',
  },
  {
    id: 'inv_002',
    inviteLink: 'https://ilesure.com/invite/def456uvw',
    email: 'another.agent@email.com',
    status: 'accepted',
    expiresAt: '2025-02-25T12:00:00Z',
    createdAt: '2025-02-15T10:00:00Z',
  },
];

export const mockAgentDashboard: DashboardOverview = {
  totalListings: 8,
  activeListings: 5,
  totalBookings: 12,
  pendingBookings: 3,
  monthlyRevenue: 1250000,
};

export const mockCompanyDashboard: CompanyDashboardOverview = {
  totalListings: 12,
  totalAgents: 4,
  activeBookings: 8,
  monthlyRevenue: 450000,
  plan: mockCompanyPlan,
};

export const mockAgentAnalytics: AnalyticsData = {
  totalViews: 1248,
  totalSaves: 342,
  totalInquiries: 89,
  totalBookings: 24,
  conversionRate: 12.5,
  changes: { views: '+12%', saves: '+8%' },
  viewsTrend: [
    { date: '2025-02-19', value: 120 },
    { date: '2025-02-20', value: 180 },
    { date: '2025-02-21', value: 150 },
    { date: '2025-02-22', value: 220 },
    { date: '2025-02-23', value: 280 },
    { date: '2025-02-24', value: 240 },
    { date: '2025-02-25', value: 300 },
  ],
  topListings: [
    { id: 'l_006', title: 'Luxury Apartment - Ikoyi', views: 3200 },
    { id: 'l_005', title: 'Hostel Bed Space - Akoka', views: 2100 },
    { id: 'l_001', title: 'Modern Student Hostel - Gbagada', views: 1248 },
  ],
};

export const mockCompanyAnalytics: AnalyticsData = {
  totalViews: 4890,
  totalSaves: 892,
  totalInquiries: 234,
  totalBookings: 56,
  conversionRate: 8.2,
  changes: { views: '+15%', saves: '+12%', inquiries: '+23%', bookings: '+15%' },
};

export const mockNotificationSettings: NotificationSettings = {
  newBooking: true,
  listingInquiry: true,
  paymentReceived: true,
  listingView: false,
  systemUpdates: true,
  marketingEmails: false,
  pushEnabled: true,
  emailEnabled: true,
  smsEnabled: false,
};