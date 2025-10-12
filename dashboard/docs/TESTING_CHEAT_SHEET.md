# 📋 Transaction Management - Testing Cheat Sheet

**Quick Reference untuk Testing Dashboard Transaction Management**

---

## ⚡ 5-Minute Quick Test

```bash
# 1. Start Services
docker-compose -f docker-compose.local.yml up -d
cd dashboard && npm run dev

# 2. Open Browser
http://localhost:3000/auth/login

# 3. Login
OWNER: owner@boss.com / password123
ADMIN: admin@boss.com / password123
USER: user@boss.com / password123

# 4. Test Approve
Navigate → Transactions → Click "Approve Payment" → Confirm → ✅

# 5. Test Reject
Click "Reject Payment" → Enter reason → Confirm → ✅
```

---

## 🎯 Critical Test Scenarios

### ✅ Happy Path (OWNER/ADMIN)
1. Login → View List → Pagination Works
2. Filter PENDING → Approve → Status = SUCCESS
3. Reject → Status = FAILED
4. View Detail → Approve/Reject from detail

### ❌ Negative Path (USER)
1. Login as USER → No approve/reject buttons
2. Direct API call → Returns 403 Forbidden

---

## 🧪 API Quick Test (cURL)

```bash
# Login
curl -X POST http://localhost:1234/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@boss.com","password":"password123"}' \
  -c cookies.txt

# Get Transactions
curl http://localhost:1234/api/v1/transactions?page=1&limit=10 -b cookies.txt

# Approve (replace {ID})
curl -X PATCH http://localhost:1234/api/v1/transactions/{ID}/approve -b cookies.txt

# Reject (replace {ID})
curl -X PATCH http://localhost:1234/api/v1/transactions/{ID}/reject \
  -H "Content-Type: application/json" \
  -d '{"reason":"Test rejection"}' \
  -b cookies.txt
```

---

## 🔐 Authorization Matrix

| Action | OWNER | ADMIN | USER |
|--------|-------|-------|------|
| View All | ✅ | ✅ | ❌ (own only) |
| View Detail | ✅ | ✅ | ✅ (own only) |
| Approve | ✅ | ✅ | ❌ |
| Reject | ✅ | ✅ | ❌ |
| Update Status | ✅ | ✅ | ❌ |

---

## 📊 Expected API Response

### Success Response
```json
{
  "success": true,
  "message": "Pembayaran berhasil disetujui",
  "data": { "id": "...", "status": "SUCCESS" },
  "pagination": { "page": 1, "limit": 10, "total": 50 }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Unauthorized",
  "error": "Only OWNER/ADMIN can approve"
}
```

---

## 🐛 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| CORS Error | `CLIENT_URL` not set | Add dashboard URL to backend `.env` |
| 403 Forbidden | Wrong role | Login as OWNER/ADMIN |
| Button not showing | Status not PENDING | Check transaction status |
| Network Error | Backend down | Start backend service |
| Pagination error | Type mismatch | Ensure PaginatedResponse type |

---

## ✅ Pre-Commit Checklist

- [ ] `npm run build` → No errors
- [ ] `npm run lint` → No warnings
- [ ] Manual approve test → Works
- [ ] Manual reject test → Works
- [ ] No console errors
- [ ] All TypeScript errors resolved

---

## 🎬 Test Commands

```bash
# Backend
cd backend && npm run dev

# Dashboard
cd dashboard && npm run dev

# Database Reset
cd backend && npm run db:reset && npm run db:seed

# Prisma Studio
cd backend && npx prisma studio

# TypeScript Check
cd dashboard && npx tsc --noEmit

# Build Test
cd dashboard && npm run build
```

---

## 📁 Key Files

```
dashboard/
├── lib/apis/transaction.ts           # API service
├── hooks/useTransactions.ts          # Factory hooks
├── lib/utils/authorization.ts        # RBAC utils
├── components/transactions/
│   ├── ApprovePaymentButton.tsx
│   ├── RejectPaymentButton.tsx
│   ├── example-list-page.tsx
│   └── example-detail-page.tsx
└── docs/
    ├── TESTING_README.md             # Master guide
    ├── QUICK_TESTING_CHECKLIST.md
    └── TRANSACTION_TESTING_FLOW.md
```

---

## 🚀 Performance Benchmarks

| Metric | Target | Actual |
|--------|--------|--------|
| First Load | <1s | ⏱️ |
| API Response | <500ms | ⏱️ |
| Approve Action | <1s | ⏱️ |
| Pagination | <500ms | ⏱️ |
| Cache Load | Instant | ⏱️ |

---

## 🔒 Security Checklist

- [ ] JWT authentication active
- [ ] httpOnly cookies enabled
- [ ] CORS properly configured
- [ ] Authorization enforced (frontend + backend)
- [ ] XSS prevention (input sanitization)
- [ ] SQL injection prevented (Prisma ORM)

---

## 📞 Quick Help

**Backend not starting?**
```bash
cd backend && rm -rf node_modules && npm install && npm run dev
```

**Dashboard build errors?**
```bash
cd dashboard && rm -rf .next node_modules && npm install && npm run dev
```

**Database issues?**
```bash
cd backend && npm run db:reset && npm run db:seed
```

---

## 📚 Full Documentation

For complete documentation, see:
- **Master Index**: `dashboard/docs/README.md`
- **Full Testing Guide**: `dashboard/docs/TRANSACTION_TESTING_FLOW.md`
- **Quick Checklist**: `dashboard/docs/QUICK_TESTING_CHECKLIST.md`
- **Visual Flows**: `dashboard/docs/VISUAL_TESTING_FLOW.md`

---

**Version**: 1.0.0 | **Last Updated**: 12 Oktober 2025 | **Print-Friendly** ✅
