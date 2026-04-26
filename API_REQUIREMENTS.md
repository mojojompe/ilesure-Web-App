# ilesure-Web-App API Requirements

## Overview

This document maps each screen in `ilesure-Web-App` to the required backend endpoints and expected API responses.

---

## Table of Contents
1. [Authentication Pages](#authentication-pages)
2. [Agent Pages](#agent-pages)
3. [Company Pages](#company-pages)
4. [Onboarding Pages](#onboarding-pages)

---

## Authentication Pages

### 1. Login.tsx
**File:** `src/pages/Login.tsx`

**UI Elements:**
- Email input
- Password input (with show/hide toggle)
- "Forgot password?" link
- Sign in button

**Required Endpoints:**

| Action | Method | Endpoint | Body |
|--------|--------|----------|-------|
| Login | POST | `/api/v1/auth/login` | `{ email, password }` |

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "agent@example.com",
      "fullName": "James Okonkwo",
      "role": "agent",
      "phone": "+2348012345678",
      "verificationStatus": "verified",
      "tier": "basic",
      "company": {
        "id": "company_123",
        "name": "Property Masters Ltd",
        "verified": true
      } | null
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### 2. Signup.tsx
**File:** `src/pages/Signup.tsx`

**UI Elements (Multi-step form):**
- Step 1: Full Name, Email, Phone, Password
- Step 2: Role Selection (Agent/Company)
- Step 3: Verification Documents Upload

**Required Endpoints:**

| Action | Method | Endpoint | Body |
|--------|--------|----------|-------|
| Send OTP | POST | `/api/v1/auth/otp` | `{ phone }` |
| Verify OTP | POST | `/api/v1/auth/verify` | `{ phone, otp }` |
| Register | POST | `/api/v1/auth/register` | `{ fullName, email, phone, password, role, referrerCode? }` |
| Upload Document | POST | `/api/v1/uploads` | multipart/form-data |
| Submit Verification | POST | `/api/v1/verifications` | `{ documentType, documentUrl }` |

**Expected Responses:**

*Send OTP:*
```json
{
  "success": true,
  "message": "OTP sent to +2348012345678"
}
```

*Register:*
```json
{
  "success": true,
  "data": {
    "user": { "id": "user_123", "email": "agent@example.com" },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### 3. ForgotPassword.tsx
**File:** `src/pages/ForgotPassword.tsx`

**Required Endpoints:**

| Action | Method | Endpoint | Body |
|--------|--------|----------|-------|
| Request Reset | POST | `/api/v1/auth/forgot-password` | `{ email }` |
| Reset Password | POST | `/api/v1/auth/reset-password` | `{ token, newPassword }` |

---

### 4. RoleSelection.tsx
**File:** `src/pages/RoleSelection.tsx`

**Required Endpoints:** None (local selection)

---

### 5. TierSelection.tsx
**File:** `src/pages/TierSelection.tsx`

**UI Elements:**
- Tier cards (Free, Basic, Starter, Premium)
- Feature comparison

**Required Endpoints:**

| Action | Method | Endpoint |
|--------|--------|----------|
| Get Tiers | GET | `/api/v1/tiers` |

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "tiers": [
      {
        "id": "free",
        "name": "Free",
        "price": 0,
        "billingCycle": "monthly",
        "limits": {
          "maxListings": 3,
          "featuredListings": 0,
          "analytics": false
        },
        "features": ["Basic listings", "Standard support"]
      }
    ]
  }
}
```

---

### 6. Payment.tsx
**File:** `src/pages/Payment.tsx`

**Required Endpoints:**

| Action | Method | Endpoint | Body |
|--------|--------|----------|-------|
| Initialize Payment | POST | `/api/v1/payments/initialize` | `{ tierId, paymentMethod }` |
| Verify Payment | GET | `/api/v1/payments/{reference}/verify` | - |

---

## Agent Pages

### 1. agent/Dashboard.tsx
**File:** `src/pages/agent/Dashboard.tsx`

**UI Elements:**
- 4 KPI Cards (Total Listings, Active Listings, Total Bookings, Monthly Revenue)
- Recent Listings (3 items)
- Recent Bookings (3 items)
- Listing Performance (Total Views, Total Saves, Inquiries)

**Required Endpoints:**

| Action | Method | Endpoint |
|--------|--------|----------|
| Get Agent Dashboard | GET | `/api/v1/agent/dashboard` |
| Get Agent Listings | GET | `/api/v1/agent/listings?limit=3&sort=createdAt` |
| Get Agent Bookings | GET | `/api/v1/agent/bookings?limit=3&sort=createdAt` |

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalListings": 12,
      "activeListings": 8,
      "totalBookings": 45,
      "monthlyRevenue": 850000,
      "totalViews": 6439,
      "totalSaves": 807,
      "totalInquiries": 174,
      "trends": {
        "listings": 15,
        "bookings": 8,
        "revenue": 12
      }
    },
    "recentListings": [
      {
        "id": "listing_123",
        "title": "Modern Student Hostel - Gbagada",
        "status": "active",
        "price": 450000,
        "location": { "city": "Lagos", "state": "Lagos" },
        "images": ["https://..."]
      }
    ],
    "recentBookings": [
      {
        "id": "booking_123",
        "listingTitle": "Modern Student Hostel - Gbagada",
        "userName": "Adebola Mohammed",
        "status": "confirmed",
        "price": 450000,
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ]
  }
}
```

---

### 2. agent/Listings.tsx
**File:** `src/pages/agent/Listings.tsx`

**UI Elements:**
- Search input
- Filter dropdown (All, Active, Occupied)
- Add Listing button
- Listings grid (with cards)
- View/Archive buttons
- Add Listing Modal
- View Listing Modal

**Required Endpoints:**

| Action | Method | Endpoint | Body |
|--------|--------|----------|-------|
| Get Listings | GET | `/api/v1/agent/listings?status={status}&search={search}` | - |
| Create Listing | POST | `/api/v1/agent/listings` | `{ title, description, type, price, address, city, state, landmarks, amenities, images[] }` |
| Get Listing | GET | `/api/v1/agent/listings/{id}` | - |
| Update Listing | PUT | `/api/v1/agent/listings/{id}` | `{ title?, description?, ... }` |
| Archive Listing | PUT | `/api/v1/agent/listings/{id}/archive` | - |
| Upload Image | POST | `/api/v1/uploads` | multipart/form-data |

**Create Listing Expected Response:**
```json
{
  "success": true,
  "data": {
    "listing": {
      "id": "listing_456",
      "title": "Modern Student Hostel - Gbagada",
      "status": "pending_approval",
      "message": "Listing created successfully and pending approval"
    }
  }
}
```

---

### 3. agent/CreateListing.tsx
**File:** `src/pages/agent/CreateListing.tsx`

**Required Endpoints:** Same as Listings.tsx (Create)

---

### 4. agent/Bookings.tsx
**File:** `src/pages/agent/Bookings.tsx`

**UI Elements:**
- Search input
- Filter tabs (All, Pending, Confirmed, Completed)
- Bookings table
- Status change actions

**Required Endpoints:**

| Action | Method | Endpoint | Body |
|--------|--------|----------|-------|
| Get Bookings | GET | `/api/v1/agent/bookings?status={status}` | - |
| Update Booking Status | PUT | `/api/v1/agent/bookings/{id}` | `{ status: "confirmed" | "completed" | "cancelled" }` |
| Get Booking Details | GET | `/api/v1/agent/bookings/{id}` | - |

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "booking_123",
        "listing": {
          "id": "listing_123",
          "title": "Modern Student Hostel - Gbagada",
          "images": ["https://..."]
        },
        "user": {
          "id": "user_456",
          "fullName": "Adebola Mohammed",
          "phone": "+2348012345678",
          "email": "adebola@example.com"
        },
        "status": "pending",
        "moveInDate": "2024-02-01",
        "duration": 12,
        "totalPrice": 450000,
        "paymentStatus": "pending",
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25
    }
  }
}
```

---

### 5. agent/Chats.tsx
**File:** `src/pages/agent/Chats.tsx`

**UI Elements:**
- Chat list sidebar
- Search conversations
- Chat view with messages
- Message input with send button

**Required Endpoints:**

| Action | Method | Endpoint |
|--------|--------|----------|
| Get Chats | GET | `/api/v1/chats` |
| Get Chat Messages | GET | `/api/v1/chats/{chatId}/messages` |
| Send Message | POST | `/api/v1/chats/{chatId}/messages` |
| Mark Read | PUT | `/api/v1/chats/{chatId}/read` |

**Note:** Real-time via Socket.io

**Expected Response (Chats):**
```json
{
  "success": true,
  "data": {
    "chats": [
      {
        "id": "chat_123",
        "participant": {
          "id": "user_456",
          "fullName": "Adebola Mohammed",
          "avatar": "https://..."
        },
        "listing": {
          "id": "listing_123",
          "title": "Modern Student Hostel - Gbagada"
        },
        "lastMessage": "Is the room still available?",
        "lastMessageAt": "2024-01-15T14:30:00Z",
        "unreadCount": 2
      }
    ]
  }
}
```

**Expected Response (Messages):**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg_123",
        "senderId": "user_456",
        "text": "Hello, is this still available?",
        "createdAt": "2024-01-15T14:15:00Z"
      },
      {
        "id": "msg_124",
        "senderId": "agent_001",
        "text": "Yes, it is! Are you interested in viewing?",
        "createdAt": "2024-01-15T14:20:00Z"
      }
    ]
  }
}
```

---

### 6. agent/Inquiries.tsx
**File:** `src/pages/agent/Inquiries.tsx`

**UI Elements:**
- Inquiries list
- Reply/View actions

**Required Endpoints:**

| Action | Method | Endpoint |
|--------|--------|----------|
| Get Inquiries | GET | `/api/v1/inquiries?type=listing` |
| Reply to Inquiry | POST | `/api/v1/inquiries/{id}/reply` |

---

### 7. agent/Analytics.tsx
**File:** `src/pages/agent/Analytics.tsx`

**UI Elements:**
- 4 KPI Cards (Total Views, Total Saves, Inquiries, Conversion Rate)
- Views Trend chart
- Top Performing Listings

**Required Endpoints:**

| Action | Method | Endpoint |
|--------|--------|----------|
| Get Agent Analytics | GET | `/api/v1/agent/analytics` |
| Get Views Trend | GET | `/api/v1/agent/analytics/views?period=30d` |
| Get Top Listings | GET | `/api/v1/agent/analytics/listings?sort=views` |

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "totalViews": 6439,
    "totalSaves": 807,
    "totalInquiries": 174,
    "conversionRate": 12.5,
    "changes": {
      "views": 8,
      "saves": 15,
      "inquiries": -5
    },
    "viewsTrend": [
      { "date": "2024-01-01", "value": 120 },
      { "date": "2024-01-02", "value": 150 }
    ],
    "topListings": [
      {
        "id": "listing_123",
        "title": "Modern Student Hostel - Gbagada",
        "views": 1200,
        "saves": 150
      }
    ]
  }
}
```

---

### 8. agent/Payments.tsx
**File:** `src/pages/agent/Payments.tsx`

**UI Elements:**
- Transaction history table
- Subscription payments table
- Summary cards

**Required Endpoints:**

| Action | Method | Endpoint |
|--------|--------|----------|
| Get Transactions | GET | `/api/v1/agent/payments?type=transaction` |
| Get Subscription | GET | `/api/v1/agent/payments?type=subscription` |

---

### 9. agent/Notifications.tsx
**File:** `src/pages/agent/Notifications.tsx`

**Required Endpoints:**

| Action | Method | Endpoint | Body |
|--------|--------|----------|-------|
| Get Settings | GET | `/api/v1/users/notifications` | - |
| Update Settings | PUT | `/api/v1/users/notifications` | `{ newBooking, listingInquiry, ... }` |

---

### 10. agent/Settings.tsx
**File:** `src/pages/agent/Settings.tsx`

**UI Elements:**
- Profile form (Name, Email, Phone, WhatsApp, Bio)
- Notification toggles
- Current Plan card
- Company info card

**Required Endpoints:**

| Action | Method | Endpoint | Body |
|--------|--------|----------|-------|
| Get Profile | GET | `/api/v1/users/profile` | - |
| Update Profile | PUT | `/api/v1/users/profile` | `{ fullName, phone, whatsapp, bio }` |
| Get Notification Settings | GET | `/api/v1/users/notifications` | - |
| Update Notification Settings | PUT | `/api/v1/users/notifications` | `{ ... }` |
| Get Subscription | GET | `/api/v1/tiers/my` | - |

**Expected Profile Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "agent_001",
      "fullName": "James Okonkwo",
      "email": "james@example.com",
      "phone": "+2348012345678",
      "whatsapp": "+2348012345678",
      "bio": "Experienced property manager",
      "verificationStatus": "verified",
      "avatar": "https://...",
      "tier": {
        "name": "Basic",
        "billingCycle": "monthly",
        "limits": {
          "maxListings": 10,
          "featuredListings": 2
        }
      },
      "company": {
        "id": "company_123",
        "name": "Property Masters Ltd",
        "verified": true
      } | null
    }
  }
}
```

---

### 11. agent/Archived.tsx
**File:** `src/pages/agent/Archived.tsx`

**Required Endpoints:**

| Action | Method | Endpoint |
|--------|--------|----------|
| Get Archived Listings | GET | `/api/v1/agent/listings?status=archived` |
| Restore Listing | PUT | `/api/v1/agent/listings/{id}/restore` |

---

## Company Pages

### 1. company/Dashboard.tsx
**File:** `src/pages/company/Dashboard.tsx`

**UI Elements:**
- 4 KPI Cards (Total Listings, Total Agents, Active Bookings, Monthly Revenue)
- Recent Listings (3)
- Recent Agents (3)
- Current Plan card

**Required Endpoints:**

| Action | Method | Endpoint |
|--------|--------|----------|
| Get Company Dashboard | GET | `/api/v1/company/dashboard` |
| Get Company Listings | GET | `/api/v1/company/listings?limit=3` |
| Get Company Agents | GET | `/api/v1/company/agents?limit=3` |
| Get Subscription | GET | `/api/v1/company/subscription` |

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalListings": 45,
      "totalAgents": 12,
      "activeBookings": 28,
      "monthlyRevenue": 2500000,
      "trends": {
        "listings": 5,
        "agents": 2,
        "bookings": 12,
        "revenue": 15
      }
    },
    "plan": {
      "name": "Premium",
      "billingCycle": "monthly",
      "slotUsage": {
        "used": 12,
        "total": 50,
        "percentage": 24
      }
    }
  }
}
```

---

### 2. company/Listings.tsx
**File:** `src/pages/company/Listings.tsx`

**Required Endpoints:**

| Action | Method | Endpoint |
|--------|--------|----------|
| Get All Listings | GET | `/api/v1/company/listings?status={status}` |
| Create Listing | POST | `/api/v1/company/listings` |
| Update Listing | PUT | `/api/v1/company/listings/{id}` |
| Archive Listing | PUT | `/api/v1/company/listings/{id}/archive` |

---

### 3. company/Agents.tsx
**File:** `src/pages/company/Agents.tsx`

**UI Elements:**
- Search input
- Invite Agent button
- Agent cards grid
- Invite Modal
- View Agent Modal
- Edit Agent Modal

**Required Endpoints:**

| Action | Method | Endpoint | Body |
|--------|--------|----------|
| Get Agents | GET | `/api/v1/company/agents?search={search}` | - |
| Invite Agent | POST | `/api/v1/company/agents/invite` | `{ email }` |
| Get Agent | GET | `/api/v1/company/agents/{id}` | - |
| Update Agent | PUT | `/api/v1/company/agents/{id}` | `{ fullName?, phone?, status? }` |
| Remove Agent | DELETE | `/api/v1/company/agents/{id}` | - |

**Invite Agent Expected Response:**
```json
{
  "success": true,
  "data": {
    "invite": {
      "id": "invite_123",
      "email": "agent@example.com",
      "expiresAt": "2024-01-22T10:00:00Z",
      "status": "pending"
    },
    "message": "Invitation sent successfully"
  }
}
```

---

### 4. company/Bookings.tsx
**File:** `src/pages/company/Bookings.tsx`

**Required Endpoints:**

| Action | Method | Endpoint |
|--------|--------|----------|
| Get All Bookings | GET | `/api/v1/company/bookings?status={status}` |
| Update Booking | PUT | `/api/v1/company/bookings/{id}` |

---

### 5. company/Chats.tsx
**File:** `src/pages/company/Chats.tsx`

**Required Endpoints:** Same as agent/Chats.tsx

---

### 6. company/Inquiries.tsx
**File:** `src/pages/company/Inquiries.tsx`

**Required Endpoints:** Same as agent/Inquiries.tsx

---

### 7. company/Analytics.tsx
**File:** `src/pages/company/Analytics.tsx`

**UI Elements:**
- Revenue chart
- Bookings chart
- Top performing listings

**Required Endpoints:**

| Action | Method | Endpoint |
|--------|--------|----------|
| Get Company Analytics | GET | `/api/v1/company/analytics` |
| Get Revenue Breakdown | GET | `/api/v1/company/analytics/revenue` |
| Get Bookings Trend | GET | `/api/v1/company/analytics/bookings` |

---

### 8. company/Payments.tsx
**File:** `src/pages/company/Payments.tsx`

**Required Endpoints:**

| Action | Method | Endpoint |
|--------|--------|----------|
| Get Company Transactions | GET | `/api/v1/company/payments` |
| Get Subscription | GET | `/api/v1/company/subscription` |

---

### 9. company/Notifications.tsx
**File:** `src/pages/company/Notifications.tsx`

**Required Endpoints:** Same as agent/Notifications.tsx

---

### 10. company/Settings.tsx
**File:** `src/pages/company/Settings.tsx`

**UI Elements:**
- Company Profile form
- Notification settings
- Plan info

**Required Endpoints:**

| Action | Method | Endpoint | Body |
|--------|--------|----------|-------|
| Get Company Profile | GET | `/api/v1/company/profile` | - |
| Update Company Profile | PUT | `/api/v1/company/profile` | `{ name?, phone?, address?, description? }` |
| Get Notification Settings | GET | `/api/v1/users/notifications` | - |
| Update Notification Settings | PUT | `/api/v1/users/notifications` | `{ ... }` |

---

### 11. company/Archived.tsx
**File:** `src/pages/company/Archived.tsx`

**Required Endpoints:**

| Action | Method | Endpoint |
|--------|--------|----------|
| Get Archived Listings | GET | `/api/v1/company/listings?status=archived` |

---

## Onboarding Pages

### 1. Verification.tsx
**File:** `src/pages/Verification.tsx`

**UI Elements:**
- Document upload areas (NIN, BVN, Utility Bill, Selfie, etc.)
- Submit button

**Required Endpoints:**

| Action | Method | Endpoint | Body |
|--------|--------|----------|-------|
| Submit Verification | POST | `/api/v1/verifications` | `{ documentType, documentUrl }` |
| Upload Document | POST | `/api/v1/uploads` | multipart/form-data |

---

### 2. VerificationPending.tsx
**File:** `src/pages/VerificationPending.tsx`

**Required Endpoints:**

| Action | Method | Endpoint |
|--------|--------|----------|
| Get Verification Status | GET | `/api/v1/verifications/status` |

---

### 3. Tiers.tsx
**File:** `src/pages/Tiers.tsx`

**Required Endpoints:** Same as TierSelection.tsx

---

## API Summary Table

| Screen | Endpoint | Method | Priority |
|--------|----------|--------|---------|
| Login | `/api/v1/auth/login` | POST | HIGH |
| Signup | `/api/v1/auth/register` | POST | HIGH |
| Forgot Password | `/api/v1/auth/forgot-password` | POST | MEDIUM |
| Tiers | `/api/v1/tiers` | GET | HIGH |
| Agent Dashboard | `/api/v1/agent/dashboard` | GET | HIGH |
| Agent Listings | `/api/v1/agent/listings` | GET/POST | HIGH |
| Agent Create Listing | `/api/v1/agent/listings` | POST | HIGH |
| Agent Bookings | `/api/v1/agent/bookings` | GET/PUT | HIGH |
| Agent Chats | `/api/v1/chats` | GET/POST | HIGH |
| Agent Analytics | `/api/v1/agent/analytics` | GET | MEDIUM |
| Agent Settings | `/api/v1/users/profile` | GET/PUT | HIGH |
| Company Dashboard | `/api/v1/company/dashboard` | GET | HIGH |
| Company Listings | `/api/v1/company/listings` | GET/POST | HIGH |
| Company Agents | `/api/v1/company/agents` | GET/POST/DELETE | HIGH |
| Company Settings | `/api/v1/company/profile` | GET/PUT | HIGH |
| Verification | `/api/v1/verifications` | POST | HIGH |

---

*Document Version: 1.0.0*
*Last Updated: April 2026*