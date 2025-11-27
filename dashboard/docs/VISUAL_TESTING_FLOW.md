# 🎨 Visual Testing Flow Diagram

Diagram visual untuk alur testing Transaction Management Dashboard.

---

## 🔄 Overall Testing Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    TESTING WORKFLOW                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │   1. PRE-TESTING SETUP              │
        │   ✓ Backend running                 │
        │   ✓ Database ready                  │
        │   ✓ Test data available             │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │   2. UNIT TESTING                   │
        │   → Authorization Utils             │
        │   → API Service                     │
        │   → React Query Hooks               │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │   3. INTEGRATION TESTING            │
        │   → Component + Hooks               │
        │   → API + Backend                   │
        │   → Full Flow                       │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │   4. E2E TESTING                    │
        │   → User Journeys                   │
        │   → Role-based Scenarios            │
        │   → Edge Cases                      │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │   5. PERFORMANCE & SECURITY         │
        │   → Load Testing                    │
        │   → Security Audit                  │
        │   → Browser Compatibility           │
        └─────────────────────────────────────┘
                              │
                              ▼
                         ✅ READY
```

---

## 👤 User Role Testing Flow

```
┌──────────────────────────────────────────────────────────────┐
│                     ROLE-BASED TESTING                        │
└──────────────────────────────────────────────────────────────┘

        OWNER Role                ADMIN Role              USER Role
            │                         │                       │
            ▼                         ▼                       ▼
    ┌───────────────┐         ┌───────────────┐      ┌───────────────┐
    │  Full Access  │         │  Full Access  │      │ Limited Access│
    └───────────────┘         └───────────────┘      └───────────────┘
            │                         │                       │
            ├─ View All              ├─ View All             ├─ View Own
            ├─ Approve ✅            ├─ Approve ✅           ├─ Approve ❌
            ├─ Reject ✅             ├─ Reject ✅            ├─ Reject ❌
            └─ Update ✅             └─ Update ✅            └─ Update ❌
```

---

## 📊 Approve Payment Flow

```
┌─────────────────────────────────────────────────────────────┐
│              APPROVE PAYMENT WORKFLOW                        │
└─────────────────────────────────────────────────────────────┘

START: User clicks "Approve Payment"
   │
   ▼
┌──────────────────────────┐
│ 1. Authorization Check   │ ──→ ❌ User not OWNER/ADMIN
│    canApprovePayment()   │        │
└──────────────────────────┘        │
   │ ✅ Authorized                  ▼
   ▼                          Show Error Toast
┌──────────────────────────┐        │
│ 2. Status Validation     │        │
│    status === 'PENDING'  │ ──→ ❌ Not PENDING
└──────────────────────────┘        │
   │ ✅ Valid                       ▼
   ▼                          Show Error Message
┌──────────────────────────┐        │
│ 3. Show Confirmation     │        │
│    AlertDialog           │        │
└──────────────────────────┘        │
   │                                │
   ├─→ ❌ Cancel ──────────────────┘
   │
   ▼ ✅ Confirm
┌──────────────────────────┐
│ 4. API Call              │
│    PATCH /approve        │
│    Loading State ON      │
└──────────────────────────┘
   │
   ├─→ ❌ Error
   │      │
   │      ▼
   │   Show Error Toast
   │   Loading State OFF
   │      │
   │      └─→ END
   │
   ▼ ✅ Success
┌──────────────────────────┐
│ 5. Update UI             │
│    - Invalidate Cache    │
│    - Auto Refresh        │
│    - Show Success Toast  │
│    - Hide Button         │
└──────────────────────────┘
   │
   ▼
SUCCESS: Status updated to "SUCCESS"
```

---

## 🚫 Reject Payment Flow

```
┌─────────────────────────────────────────────────────────────┐
│              REJECT PAYMENT WORKFLOW                         │
└─────────────────────────────────────────────────────────────┘

START: User clicks "Reject Payment"
   │
   ▼
┌──────────────────────────┐
│ 1. Authorization Check   │ ──→ ❌ User not OWNER/ADMIN
│    canRejectPayment()    │        │
└──────────────────────────┘        │
   │ ✅ Authorized                  ▼
   ▼                          Return Early
┌──────────────────────────┐   (Button Hidden)
│ 2. Show Dialog           │
│    with Textarea         │
│    for Reason (optional) │
└──────────────────────────┘
   │
   ├─→ ❌ Cancel
   │      │
   │      ▼
   │    Close Dialog
   │      │
   │      └─→ END
   │
   ▼ ✅ Submit
┌──────────────────────────┐
│ 3. API Call              │
│    PATCH /reject         │
│    Body: { reason }      │
│    Loading State ON      │
└──────────────────────────┘
   │
   ├─→ ❌ Error
   │      │
   │      ▼
   │   Show Error Toast
   │   Keep Dialog Open
   │   Loading State OFF
   │      │
   │      └─→ Can Retry
   │
   ▼ ✅ Success
┌──────────────────────────┐
│ 4. Update UI             │
│    - Close Dialog        │
│    - Invalidate Cache    │
│    - Auto Refresh        │
│    - Show Success Toast  │
│    - Hide Button         │
└──────────────────────────┘
   │
   ▼
SUCCESS: Status updated to "FAILED"
```

---

## 🔄 React Query Flow

```
┌─────────────────────────────────────────────────────────────┐
│              REACT QUERY CACHE FLOW                          │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│  Component Mount     │
└──────────────────────┘
         │
         ▼
┌──────────────────────┐
│ useTransactionList() │
└──────────────────────┘
         │
         ▼
┌──────────────────────┐     ┌─────────────┐
│ Check Cache          │────→│ Cache Hit   │
│ ['transactions',     │     │ Return Data │
│  {page:1,limit:10}]  │     └─────────────┘
└──────────────────────┘            │
         │ Cache Miss               │
         ▼                           ▼
┌──────────────────────┐     ┌─────────────┐
│ Fetch from API       │     │ Render UI   │
│ GET /transactions    │     │ with Data   │
└──────────────────────┘     └─────────────┘
         │
         ▼
┌──────────────────────┐
│ Store in Cache       │
│ staleTime: 5 min     │
└──────────────────────┘
         │
         ▼
┌──────────────────────┐
│ Render UI            │
└──────────────────────┘

─────── USER APPROVES PAYMENT ────────

┌──────────────────────┐
│ useApprovePayment    │
│ Mutation             │
└──────────────────────┘
         │
         ▼
┌──────────────────────┐
│ PATCH /approve       │
└──────────────────────┘
         │
         ▼
┌──────────────────────┐
│ onSuccess:           │
│ Invalidate Cache     │
│ ['transactions']     │
└──────────────────────┘
         │
         ▼
┌──────────────────────┐
│ Auto Refetch         │
│ GET /transactions    │
└──────────────────────┘
         │
         ▼
┌──────────────────────┐
│ Update UI            │
│ with Fresh Data      │
└──────────────────────┘
```

---

## 📱 Component Interaction Flow

```
┌─────────────────────────────────────────────────────────────┐
│           COMPONENT HIERARCHY & DATA FLOW                    │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│              TransactionListPage                  │
│  ┌────────────────────────────────────────────┐  │
│  │  const { data, isLoading } =               │  │
│  │    useTransactionList({ page, limit })     │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
                      │
                      │ data.data (transactions[])
                      │ data.pagination
                      ▼
┌──────────────────────────────────────────────────┐
│                  Table Component                  │
│  ┌────────────────────────────────────────────┐  │
│  │  {transactions.map(tx => (                 │  │
│  │    <TableRow key={tx.id}>                  │  │
│  │      <TableCell>{tx.amount}</TableCell>    │  │
│  │      <TableCell>{tx.status}</TableCell>    │  │
│  │      <TableCell>                           │  │
│  │        {tx.status === 'PENDING' && (       │  │
│  │          <>                                 │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
┌────────────────────┐  ┌────────────────────┐
│ ApprovePayment     │  │ RejectPayment      │
│ Button             │  │ Button             │
│                    │  │                    │
│ ┌────────────────┐ │  │ ┌────────────────┐ │
│ │ Authorization  │ │  │ │ Authorization  │ │
│ │ Check          │ │  │ │ Check          │ │
│ └────────────────┘ │  │ └────────────────┘ │
│         │          │  │         │          │
│         ▼          │  │         ▼          │
│ ┌────────────────┐ │  │ ┌────────────────┐ │
│ │ Render Button  │ │  │ │ Render Button  │ │
│ └────────────────┘ │  │ └────────────────┘ │
│         │          │  │         │          │
│    User Click      │  │    User Click      │
│         │          │  │         │          │
│         ▼          │  │         ▼          │
│ ┌────────────────┐ │  │ ┌────────────────┐ │
│ │ AlertDialog    │ │  │ │ Dialog with    │ │
│ │ Confirm        │ │  │ │ Reason Input   │ │
│ └────────────────┘ │  │ └────────────────┘ │
│         │          │  │         │          │
│    Confirmed       │  │    Confirmed       │
│         │          │  │         │          │
│         ▼          │  │         ▼          │
│ ┌────────────────┐ │  │ ┌────────────────┐ │
│ │ useApprove     │ │  │ │ useReject      │ │
│ │ Payment        │ │  │ │ Payment        │ │
│ │ Mutation       │ │  │ │ Mutation       │ │
│ └────────────────┘ │  │ └────────────────┘ │
└────────────────────┘  └────────────────────┘
          │                       │
          └───────────┬───────────┘
                      ▼
            ┌──────────────────┐
            │ API Call Success │
            └──────────────────┘
                      │
                      ▼
            ┌──────────────────┐
            │ Invalidate Cache │
            │ ['transactions'] │
            └──────────────────┘
                      │
                      ▼
            ┌──────────────────┐
            │ List Auto Refresh│
            └──────────────────┘
```

---

## 🔐 Authorization Flow

```
┌─────────────────────────────────────────────────────────────┐
│              AUTHORIZATION CHECK FLOW                        │
└─────────────────────────────────────────────────────────────┘

User Request
   │
   ▼
┌──────────────────────┐
│ Get User from Auth   │
│ const { user } =     │
│   useAuth()          │
└──────────────────────┘
   │
   ▼
┌──────────────────────┐
│ Check Role           │
│ user.role === ?      │
└──────────────────────┘
   │
   ├─→ OWNER ─────────────────┐
   │                           │
   ├─→ ADMIN ─────────────────┤
   │                           │
   ├─→ USER ──────────────────┤
   │                           │
   └─→ null/undefined ────────┤
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Authorization.      │
                    │ canApprovePayment() │
                    └─────────────────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
              OWNER/ADMIN                    USER
                │                             │
                ▼                             ▼
        ┌───────────────┐            ┌───────────────┐
        │ Return true   │            │ Return false  │
        └───────────────┘            └───────────────┘
                │                             │
                ▼                             ▼
        ┌───────────────┐            ┌───────────────┐
        │ Show Button   │            │ Hide Button   │
        └───────────────┘            └───────────────┘
                │                             │
          User Clicks                   No Action
                │                             │
                ▼                             ▼
        ┌───────────────┐                   END
        │ Backend Check │
        │ (Double Check)│
        └───────────────┘
                │
        ┌───────┴───────┐
        │               │
     Allowed        Forbidden
        │               │
        ▼               ▼
    Process        403 Error
    Request
```

---

## 🐛 Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  ERROR HANDLING FLOW                         │
└─────────────────────────────────────────────────────────────┘

API Call
   │
   ▼
Try Request
   │
   ├─→ Network Error ──────────┐
   │                            │
   ├─→ Timeout ────────────────┤
   │                            │
   ├─→ 400 Bad Request ────────┤
   │                            │
   ├─→ 401 Unauthorized ───────┤
   │                            │
   ├─→ 403 Forbidden ──────────┤
   │                            │
   ├─→ 404 Not Found ──────────┤
   │                            │
   ├─→ 500 Server Error ───────┤
   │                            │
   └─→ Success (200) ──────────┤
                                │
                                ▼
                    ┌──────────────────────┐
                    │ Error Handler        │
                    │ (React Query)        │
                    └──────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
            Network         HTTP Error       Success
            Error              │               │
                │              ▼               ▼
                │     ┌─────────────────┐  ┌────────────┐
                │     │ Extract Message │  │ Process    │
                │     │ from Response   │  │ Data       │
                │     └─────────────────┘  └────────────┘
                │              │               │
                └──────────────┴───────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Show Toast           │
                    │ Notification         │
                    └──────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Reset Loading State  │
                    └──────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Log to Console       │
                    │ (Dev Mode)           │
                    └──────────────────────┘
                               │
                               ▼
                             END
```

---

## 📈 Performance Testing Flow

```
┌─────────────────────────────────────────────────────────────┐
│              PERFORMANCE TESTING FLOW                        │
└─────────────────────────────────────────────────────────────┘

Start Performance Test
   │
   ▼
┌──────────────────────┐
│ 1. Initial Load      │
│    Measure TTFB      │
│    Measure FCP       │
│    Measure LCP       │
└──────────────────────┘
   │
   ▼
┌──────────────────────┐
│ 2. API Response Time │
│    GET /transactions │
│    Expected: <500ms  │
└──────────────────────┘
   │
   ▼
┌──────────────────────┐
│ 3. Render Time       │
│    Table with 10     │
│    Expected: <100ms  │
└──────────────────────┘
   │
   ▼
┌──────────────────────┐
│ 4. Cache Performance │
│    Navigate away     │
│    Navigate back     │
│    Expected: Instant │
└──────────────────────┘
   │
   ▼
┌──────────────────────┐
│ 5. Mutation Speed    │
│    Approve Payment   │
│    Expected: <1s     │
└──────────────────────┘
   │
   ▼
┌──────────────────────┐
│ 6. Memory Usage      │
│    Check for Leaks   │
│    Heap Snapshots    │
└──────────────────────┘
   │
   ▼
Generate Report
```

---

## 🎬 Complete Testing Journey Map

```
START
  │
  ├─→ Unit Tests ─────────────→ Pass/Fail ─┐
  │                                         │
  ├─→ Integration Tests ──────→ Pass/Fail ─┤
  │                                         │
  ├─→ E2E Tests ──────────────→ Pass/Fail ─┤
  │                                         │
  ├─→ Performance Tests ──────→ Pass/Fail ─┤
  │                                         │
  ├─→ Security Tests ─────────→ Pass/Fail ─┤
  │                                         │
  └─→ Manual QA ──────────────→ Pass/Fail ─┤
                                            │
                            All Pass? ──────┴─────→ Yes → ✅ DEPLOY
                                │
                                No
                                │
                                ▼
                            Fix Issues
                                │
                                ▼
                            Re-test
                                │
                                ▼
                         Repeat until Pass
```

---

**Visual Flow Created**: 12 Oktober 2025  
**Format**: Markdown ASCII Diagrams  
**Usage**: Reference untuk memahami alur testing lengkap
