# ✅ Quick Testing Checklist - Transaction Management

Gunakan checklist ini untuk **rapid testing** sebelum commit atau deployment.

---

## 🚀 Quick Start (5 menit)

### 1. Environment Check
```bash
# Backend running?
curl http://localhost:1234/health

# Dashboard running?
curl http://localhost:3000

# Database ready?
cd backend && npx prisma studio
```

### 2. Login Test
- [ ] Buka http://localhost:3000/auth/login
- [ ] Login sebagai OWNER: `owner@boss.com` / `password123`
- [ ] Verify redirect ke dashboard

### 3. Transaction List
- [ ] Navigate ke `/admin/transactions` atau `/owner/transactions`
- [ ] Verify list muncul dengan pagination
- [ ] Verify status badges tampil (PENDING, SUCCESS, FAILED)

### 4. Approve Payment (OWNER/ADMIN)
- [ ] Cari transaction dengan status PENDING
- [ ] Click "Approve Payment"
- [ ] Confirm dialog
- [ ] Verify success toast
- [ ] Verify status berubah ke SUCCESS

### 5. Reject Payment (OWNER/ADMIN)
- [ ] Cari transaction PENDING lainnya
- [ ] Click "Reject Payment"
- [ ] Isi reason (optional)
- [ ] Confirm
- [ ] Verify status berubah ke FAILED

---

## 🎯 Critical Path (10 menit)

### Happy Path - OWNER
1. ✅ Login → Dashboard
2. ✅ View Transactions → List muncul
3. ✅ Pagination → Page 2, Page 3
4. ✅ Filter PENDING → Only pending shown
5. ✅ Approve → Success + toast
6. ✅ Reject → Failed + toast
7. ✅ View Detail → Single transaction
8. ✅ Logout

### Happy Path - ADMIN
1. ✅ Login sebagai ADMIN
2. ✅ Same tests as OWNER
3. ✅ Verify approve/reject works

### Negative Path - USER
1. ✅ Login sebagai USER
2. ✅ View only own transactions
3. ✅ Verify NO approve/reject buttons
4. ✅ Verify direct API call returns 403

---

## 🐛 Edge Cases (5 menit)

- [ ] **Empty State**: No transactions → Shows empty state
- [ ] **Network Error**: Offline mode → Error toast
- [ ] **Already Processed**: Approve SUCCESS transaction → Error
- [ ] **Invalid ID**: Call API dengan fake UUID → 404
- [ ] **Concurrent Approve**: 2 tabs approve same transaction → One fails

---

## 📱 Browser Compatibility (Quick)

- [ ] Chrome: Works ✅
- [ ] Firefox: Works ✅
- [ ] Edge: Works ✅
- [ ] Safari: Works ✅ (if Mac available)

---

## 🔐 Security Quick Check

```javascript
// Run di browser console

// 1. Check CORS
fetch('http://localhost:1234/api/v1/transactions', { credentials: 'include' })
  .then(r => console.log('CORS OK'))
  .catch(e => console.error('CORS FAILED', e));

// 2. Check Authorization
// Login as USER, try approve
fetch('http://localhost:1234/api/v1/transactions/ANY-ID/approve', {
  method: 'PATCH',
  credentials: 'include'
}).then(r => r.json()).then(d => {
  console.assert(d.success === false, 'Should fail for USER');
  console.log('Auth check OK');
});

// 3. Check XSS
// Try XSS in reject reason
// Verify output is escaped
```

---

## 📊 Performance Quick Check

```javascript
// Measure React Query performance
console.time('TransactionList');
// Load transaction list page
// Wait for render
console.timeEnd('TransactionList');
// Should be < 1000ms

// Check cache
// Navigate to detail → back to list
// Should load instantly
```

---

## 🧪 API Quick Test (cURL)

```bash
# Login
curl -X POST http://localhost:1234/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@boss.com","password":"password123"}' \
  -c cookies.txt -v

# List
curl http://localhost:1234/api/v1/transactions?page=1&limit=10 \
  -b cookies.txt | jq '.pagination'

# Detail (replace ID)
curl http://localhost:1234/api/v1/transactions/YOUR-ID \
  -b cookies.txt | jq '.data.status'

# Approve (replace ID)
curl -X PATCH http://localhost:1234/api/v1/transactions/YOUR-ID/approve \
  -b cookies.txt | jq '.success'

# Reject (replace ID)
curl -X PATCH http://localhost:1234/api/v1/transactions/YOUR-ID/reject \
  -H "Content-Type: application/json" \
  -d '{"reason":"Test"}' \
  -b cookies.txt | jq '.success'
```

---

## 🎬 One-Command Test Suite

Buat file `test-transactions.sh`:

```bash
#!/bin/bash

echo "🧪 Testing Transaction Management..."

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Test 1: Backend Health
echo -n "1. Backend health check... "
if curl -s http://localhost:1234/health > /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    exit 1
fi

# Test 2: Login
echo -n "2. Login test... "
LOGIN=$(curl -s -X POST http://localhost:1234/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@boss.com","password":"password123"}' \
  -c cookies.txt)

if echo $LOGIN | grep -q "success.*true"; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    exit 1
fi

# Test 3: Get Transactions
echo -n "3. Get transactions... "
TRANSACTIONS=$(curl -s http://localhost:1234/api/v1/transactions?page=1&limit=10 -b cookies.txt)

if echo $TRANSACTIONS | grep -q "pagination"; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    exit 1
fi

# Test 4: Get first pending transaction
echo -n "4. Find pending transaction... "
PENDING_ID=$(echo $TRANSACTIONS | jq -r '.data[] | select(.status == "PENDING") | .id' | head -1)

if [ ! -z "$PENDING_ID" ]; then
    echo -e "${GREEN}✓${NC} (ID: $PENDING_ID)"
else
    echo -e "${RED}✗ No pending transaction${NC}"
fi

# Test 5: Approve (if pending exists)
if [ ! -z "$PENDING_ID" ]; then
    echo -n "5. Approve payment... "
    APPROVE=$(curl -s -X PATCH http://localhost:1234/api/v1/transactions/$PENDING_ID/approve -b cookies.txt)
    
    if echo $APPROVE | grep -q "success.*true"; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
    fi
fi

echo ""
echo "✅ All tests completed!"
rm -f cookies.txt
```

**Jalankan:**
```bash
chmod +x test-transactions.sh
./test-transactions.sh
```

---

## 📝 Pre-Commit Checklist

Sebelum commit, pastikan:

- [ ] `npm run build` sukses (no TypeScript errors)
- [ ] `npm run lint` sukses (no ESLint errors)
- [ ] Manual test approve/reject works
- [ ] No console errors
- [ ] Components render correctly
- [ ] Loading states work
- [ ] Error states work
- [ ] Success states work

---

## 🚨 Known Issues Checklist

Jika menemukan issue, catat di sini:

- [ ] Issue 1: [Description]
  - Severity: 
  - Status: 
  - Fixed in: 

- [ ] Issue 2: [Description]
  - Severity: 
  - Status: 
  - Fixed in: 

---

## 📞 Quick Help

**Backend not starting?**
```bash
cd backend
rm -rf node_modules
npm install
npm run db:generate
npm run dev
```

**Dashboard build errors?**
```bash
cd dashboard
rm -rf .next node_modules
npm install
npm run dev
```

**Database issues?**
```bash
cd backend
npm run db:reset
npm run db:seed
```

**CORS errors?**
- Check `CLIENT_URL` in backend `.env`
- Should include dashboard URL
- Example: `CLIENT_URL=http://localhost:3000,http://localhost:3010`

---

**Last Updated**: 12 Oktober 2025  
**Quick Test Time**: ~15 menit total
