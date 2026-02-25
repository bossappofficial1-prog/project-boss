# Subscription Management - Owner Restrictions & Renewal

This document explains the subscription management system, including owner restrictions and renewal logic.

## Overview

The system implements subscription-based access control where:
- Each business owner has a subscription plan (TRIAL, BASIC, PRO, etc.)
- Plans have different feature limits (outlets, products, staff)
- Subscriptions can expire and need renewal
- Automated cron jobs handle expiry
- Owners can upgrade/renew their subscription

## Backend Implementation

### 1. Onboarding Endpoint

**POST `/auth/onboarding/complete`**

Completes the registration process by:
- Creating a business for the user
- Setting up initial subscription
- Generating invoice for paid plans
- Activating trial plans immediately

Request body:
```json
{
  "businessName": "My Business",
  "description": "Business description",
  "selectedPlan": "TRIAL" // or "BASIC", "PRO"
}
```

### 2. Subscription Limits Middleware

Three middleware functions enforce feature limits:

#### `checkOutletLimit`
- Applied to: POST `/outlets`
- Checks: Current outlet count vs plan limit
- Error: Returns 403 if limit reached

#### `checkProductLimit`
- Applied to: POST `/products`, POST `/products/bulk`
- Checks: Total product count across all outlets vs plan limit
- Error: Returns 403 if limit reached

#### `checkStaffLimit`
- Applied to: POST `/staff`
- Checks: Total staff count across all outlets vs plan limit
- Error: Returns 403 if limit reached

#### `checkReportExportPermission`
- Applied to: Export endpoints
- Checks: If plan allows report export
- Error: Returns 403 if not allowed

### 3. Subscription Renewal

**POST `/auth/subscription/renew`**

Renews or upgrades subscription:
- Creates new subscription record
- Generates invoice for payment
- Extends subscription from current end date if still active
- Starts from today if expired

Request body:
```json
{
  "planCode": "PRO" // Optional, defaults to current plan
}
```

### 4. Subscription Status

**GET `/auth/subscription/status`**

Returns current subscription information:
```json
{
  "business": {
    "id": "...",
    "name": "...",
    "subscriptionPlan": "BASIC",
    "subscriptionStatus": "ACTIVE",
    "subscriptionEndDate": "2025-03-01T00:00:00.000Z"
  },
  "subscription": {
    "id": "...",
    "status": "ACTIVE",
    "startDate": "2025-02-01T00:00:00.000Z",
    "endDate": "2025-03-01T00:00:00.000Z",
    "plan": {
      "name": "Basic",
      "code": "BASIC",
      "price": 100000,
      "durationDays": 30,
      "features": {
        "maxOutlets": 2,
        "maxProducts": 50,
        "maxStaff": 5,
        "canExportReport": false,
        "supportLevel": "EMAIL"
      }
    }
  },
  "invoices": [...]
}
```

### 5. Usage Statistics

**GET `/business/usage-statistics`**

Returns current usage vs limits:
```json
{
  "usage": {
    "outlets": 1,
    "products": 25,
    "staff": 3
  },
  "limits": {
    "outlets": 2,
    "products": 50,
    "staff": 5
  },
  "plan": "BASIC",
  "status": "ACTIVE",
  "endDate": "2025-03-01T00:00:00.000Z"
}
```

### 6. Cron Jobs

Two automated jobs run daily:

#### Subscription Expiry Check (1 AM daily)
- Finds subscriptions with endDate < now
- Updates subscription status to "EXPIRED"
- Updates business status to "EXPIRED"

#### Expiry Notifications (9 AM daily)
- Finds subscriptions expiring in next 7 days
- Sends notifications to owners
- TODO: Integrate with email/WhatsApp service

## Frontend Implementation

### 1. Custom Hooks

#### `useSubscriptionStatus()`
Fetches current subscription status.

#### `useRenewSubscription()`
Mutation hook for renewing subscription. Automatically redirects to payment page.

#### `useUsageStatistics()`
Fetches usage statistics (outlets, products, staff).

### 2. Subscription Management Page

**Location:** `/owner/subscription`

Features:
- Display current subscription status
- Show days until expiry with warning
- List available plans for upgrade/renewal
- Show invoice history
- One-click renewal/upgrade buttons

### 3. Usage Widget

**Component:** `SubscriptionUsageWidget`

Can be embedded in dashboard to show:
- Current usage vs limits with progress bars
- Visual warnings when near limit (80%+)
- Quick link to subscription management page
- Days until expiry alert

Usage:
```tsx
import { SubscriptionUsageWidget } from '@/components/owner/SubscriptionUsageWidget';

<SubscriptionUsageWidget />
```

## Subscription Plan Features

Plans support the following features:

```typescript
interface PlanFeatures {
  maxOutlets: number;      // -1 = unlimited
  maxProducts: number;     // -1 = unlimited
  maxStaff: number;        // -1 = unlimited
  canExportReport: boolean;
  supportLevel: 'EMAIL' | 'WHATSAPP' | 'PRIORITY';
}
```

## Error Messages

When limits are reached:
- **Outlets:** "Limit outlet untuk paket BASIC adalah 2. Upgrade paket untuk menambah outlet."
- **Products:** "Limit produk untuk paket BASIC adalah 50. Upgrade paket untuk menambah produk."
- **Staff:** "Limit staff untuk paket BASIC adalah 5. Upgrade paket untuk menambah staff."
- **Export:** "Fitur export laporan tidak tersedia di paket BASIC. Upgrade paket untuk menggunakan fitur ini."

## Database Schema

### BusinessSubscription
```prisma
model BusinessSubscription {
  id         String             @id @default(uuid())
  status     SubscriptionStatus
  startDate  DateTime           @default(now())
  endDate    DateTime
  businessId String
  business   Business           @relation("BusinessHistory", ...)
  planId     String
  plan       SubscriptionPlan   @relation(...)
  invoices   SubscriptionInvoice[]
  autoRenew  Boolean            @default(true)
  createdAt  DateTime           @default(now())
  updatedAt  DateTime           @updatedAt
}
```

### SubscriptionInvoice
```prisma
model SubscriptionInvoice {
  id             String        @id @default(uuid())
  invoiceNumber  String        @unique
  amount         Float
  status         PaymentStatus
  businessId     String
  business       Business      @relation(...)
  subscriptionId String
  subscription   BusinessSubscription @relation(...)
  paidAt         DateTime?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
}
```

## Testing Checklist

### Onboarding Flow
- [ ] Register new user with email
- [ ] Complete onboarding with TRIAL plan
- [ ] Verify business created
- [ ] Verify subscription status is TRIAL
- [ ] Complete onboarding with paid plan (BASIC/PRO)
- [ ] Verify invoice created
- [ ] Verify redirect to payment page

### Subscription Limits
- [ ] Try creating outlet beyond limit
- [ ] Try creating product beyond limit
- [ ] Try creating staff beyond limit
- [ ] Try exporting report without permission
- [ ] Verify error messages are correct

### Renewal Flow
- [ ] Renew with same plan
- [ ] Upgrade to higher plan
- [ ] Verify invoice created
- [ ] Complete payment
- [ ] Verify subscription extended

### Expiry Handling
- [ ] Manually set subscription to expired date
- [ ] Run expiry cron job
- [ ] Verify status updated to EXPIRED
- [ ] Try accessing restricted features
- [ ] Renew expired subscription

## Payment Integration

After renewal/upgrade, the system:
1. Creates a SubscriptionInvoice with PENDING status
2. Redirects to `/subscription/payment?invoiceId=xxx`
3. Payment page handles payment gateway integration
4. On successful payment, webhook updates invoice to SUCCESS
5. OnboardingService.activateSubscription() activates the new subscription

## Future Enhancements

1. **Auto-renewal:** Implement automatic renewal before expiry
2. **Downgrade:** Allow downgrading to lower plans
3. **Prorated billing:** Calculate prorated charges for mid-cycle changes
4. **Usage alerts:** Send email/WhatsApp when approaching limits
5. **Grace period:** Allow X days grace period after expiry
6. **Suspension:** Suspend instead of expire, allow reactivation
