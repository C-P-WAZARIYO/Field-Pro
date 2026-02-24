# AuthX Enterprise - Quick Reference Guide

## 🚀 Quick Start (5 Minutes)

### Backend Setup
```bash
cd backend
npm install
# Configure .env with DATABASE_URL
npx prisma db push
npm run dev
```

### Frontend Setup
```bash
npm install
# Configure .env with VITE_API_BASE_URL
npm run dev
```

**URLs:**
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`
- API Docs: See `API_DOCUMENTATION.md`

---

## 📁 Key Files Created

### Backend Services
| File | Purpose |
|------|---------|
| `src/services/case.service.js` | Case CRUD, allocation, performance |
| `src/services/feedback.service.js` | GPS validation, fake visit detection |
| `src/services/payout.service.js` | Payout grid management, earnings calc |
| `src/services/blog.service.js` | Blog CRUD with likes/comments |

### Backend Controllers
| File | Purpose |
|------|---------|
| `src/controllers/cases.controller.js` | Case endpoints |
| `src/controllers/feedback.controller.js` | Feedback & audit endpoints |
| `src/controllers/payout.controller.js` | Payout grid endpoints |
| `src/controllers/blog.controller.js` | Blog endpoints |

### Backend Routes
| File | Purpose |
|------|---------|
| `src/routes/cases.routes.js` | Case routes + allocation |
| `src/routes/feedback.routes.js` | Feedback + audit routes |
| `src/routes/payout.routes.js` | Payout grid routes |
| `src/routes/blog.routes.js` | Blog routes |

### Frontend Components
| File | Purpose |
|------|---------|
| `src/pages/ExecutiveDashboard.jsx` | Executive case & performance view |
| `src/pages/SupervisorDashboard.jsx` | Cases, PTP alerts, audit queue |
| `src/pages/ManagerDashboard.jsx` | Payout grid configuration |
| `src/components/FeedbackForm.jsx` | GPS feedback submission form |

### Documentation
| File | Purpose |
|------|---------|
| `API_DOCUMENTATION.md` | 40+ endpoint reference |
| `SETUP_GUIDE.md` | Installation & deployment |
| `IMPLEMENTATION_SUMMARY.md` | Complete feature summary |
| `ARCHITECTURE_DIAGRAMS.md` | Visual system diagrams |

---

## 🔌 Most Important Endpoints

### Case Management
```
GET  /cases                          # All cases (Supervisor)
GET  /cases/executive/:id            # Cases for executive
GET  /cases/performance/:id          # Performance metrics
POST /cases/allocate/single          # Allocate emp_id to executive
```

### Feedback & Geospatial
```
POST /feedbacks                      # Submit with GPS validation
GET  /feedbacks/case/:id             # Feedbacks for case
GET  /feedbacks/audit/fake-visits    # Fake visit audit
GET  /feedbacks/alerts/ptp           # PTP alerts
```

### Payout Management
```
POST /payouts/grids                  # Create payout grid
GET  /payouts/grids                  # Get grids by bank/product
POST /payouts/calculate-earnings     # Calculate executive earnings
```

### Blog Module
```
POST /blogs                          # Create post
GET  /blogs/published                # Published posts
POST /blogs/:id/like                 # Like/Unlike
POST /blogs/:id/comments             # Add comment
```

---

## 🔐 Default Roles & Their Access

| Role | Cases | Feedback | Payouts | Blog | Audit |
|------|-------|----------|---------|------|-------|
| 🔴 Super Admin | ✅ All | ✅ All | ✅ All | ✅ All | ✅ All |
| 🟠 Manager | ✅ View | ✅ View | ✅ CRUD | ✅ All | ❌ |
| 🟡 Supervisor | ✅ Manage | ✅ Audit | ❌ | ✅ All | ✅ All |
| 🟢 Field Exec | ✅ Own | ✅ Submit | ❌ | ✅ All | ❌ |
| 🔵 Analyst | ✅ Analytics | ✅ View | ❌ | ✅ All | ❌ |
| ⚪ Guest | ❌ | ❌ | ❌ | ✅ Read | ❌ |

---

## 💡 Core Features at a Glance

### 🌍 Geospatial Validation
```javascript
// Automatic fake visit detection if distance > 300m from known address
POST /feedbacks → is_fake_visit = true → Supervisor audit
```

### 💰 Payout Calculation
```javascript
// Tree-based: Bank → Product → BKT → Payout
// Formula: BaseAmount + NormBonus (or RollbackBonus) - Cap
Example: HDFC Agriculture BKT-0 → 90% target → ₹500 fixed + ₹100 bonus
```

### 📅 PTP Tracking
```javascript
// Promise to Pay monitoring
Feedback.ptp_date = "2026-02-20" → Auto-check if action taken → ptp_broken flag
```

### 📊 Performance Metrics
```javascript
// Count-wise (Volume) & POS-wise (Value)
{
  totalCases: 15,
  visitedCases: 12,
  visitRate: 80%,
  totalPOS: ₹15,00,000,
  recoveredPOS: ₹12,00,000,
  recoveryRate: 80%
}
```

---

## 🎯 Common Workflows

### Executive Submitting Feedback
```
1. View assigned cases: GET /cases/executive/:id
2. Enable GPS location (browser geolocation)
3. Submit feedback: POST /feedbacks
   └─ System validates distance automatically
4. View performance: GET /cases/performance/:id
```

### Supervisor Monitoring
```
1. View all cases: GET /cases?filters...
2. Check PTP alerts: GET /feedbacks/alerts/ptp
3. Review fake visits: GET /feedbacks/audit/fake-visits
4. Approve/Reject: POST /feedbacks/:id/mark-fake or DELETE
```

### Manager Setting Payouts
```
1. Create grid: POST /payouts/grids
   └─ Bank, Product, BKT, Target %, Payout, Bonuses
2. Copy to product: POST /payouts/grids/copy
3. Calculate earnings: POST /payouts/calculate-earnings
   └─ Returns total with breakdown by category
```

---

## 🗄️ Database Schema Quick Ref

### Case
```
id, acc_id (unique), customer_name, phone_number, address
lat, lng (known location), pos_amount, overdue_amount, dpd
bkt, product_type, bank_name, npa_status
emp_id, executiveId, status, month, year, lastVisitAt
```

### Feedback
```
id, caseId, executiveId
lat, lng, distance_from_address, is_fake_visit
visit_code, meeting_place, asset_status, remarks, photo_url
ptp_date, ptp_broken
device_info (JSON: userAgent, ipAddress, timestamp)
```

### PayoutGrid
```
id, bank, product, bkt, target_percent
payout_type (FIXED|PERCENTAGE), payout_amount
norm_bonus, rollback_bonus, max_earning
created_by
```

### PerformanceMetric
```
id, executiveId, month, year
total_cases, visited_cases, total_pos, recovered_pos
earnings
```

---

## ⚡ Performance Tips

1. **Indexing:** `emp_id`, `executiveId`, `bkt`, `is_fake_visit` on Feedback
2. **Pagination:** Always use `?limit=100&offset=0` for large queries
3. **Caching:** Payout grids change infrequently → can cache
4. **Batch Operations:** Use `/allocate/bulk` instead of single allocations
5. **Aggregation:** Use PerformanceMetric for dashboard queries (not raw cases)

---

## 🧪 Testing Key Endpoints

### Create Test Case
```bash
curl -X POST http://localhost:5000/api/cases \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "acc_id": "ACC001",
    "customer_name": "Test User",
    "pos_amount": 100000,
    "bkt": "BKT-0",
    "product_type": "Agriculture",
    "bank_name": "HDFC"
  }'
```

### Submit Feedback with GPS
```bash
curl -X POST http://localhost:5000/api/feedbacks \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "caseId": "uuid",
    "lat": 28.7041,
    "lng": 77.1025,
    "visit_code": "V001",
    "meeting_place": "Office",
    "asset_status": "GOOD",
    "ptp_date": "2026-02-20"
  }'
```

### Create Payout Grid
```bash
curl -X POST http://localhost:5000/api/payouts/grids \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bank": "HDFC",
    "product": "Agriculture",
    "bkt": "BKT-0",
    "target_percent": 90,
    "payout_type": "FIXED",
    "payout_amount": 500,
    "norm_bonus": 100,
    "rollback_bonus": 150
  }'
```

---

## 📋 Deployment Checklist

- [ ] Create PostgreSQL database
- [ ] Set `NODE_ENV=production`
- [ ] Configure environment variables
- [ ] Run `npm run build` for frontend
- [ ] Run `npx prisma db push`
- [ ] Seed initial roles/permissions
- [ ] Setup SSL/HTTPS
- [ ] Configure email (SMTP)
- [ ] Test all endpoints
- [ ] Setup monitoring/logging
- [ ] Configure backups

---

## 📞 Useful Commands

```bash
# Backend
npm run dev              # Start in development
npm start               # Start in production
npx prisma studio      # View database
npx prisma generate    # Regenerate client
npx prisma db push     # Push schema
npm run db:seed        # Seed data

# Frontend
npm run dev            # Start dev server
npm run build          # Production build
npm run preview        # Preview build
npm run lint           # ESLint check
```

---

## 🐛 Common Issues

### Prisma Client Not Found
```bash
npx prisma generate
npm install @prisma/client
```

### Database Connection Error
```
Check DATABASE_URL in .env
Ensure PostgreSQL is running
```

### Port Already in Use
```bash
kill -9 $(lsof -i :5000 | grep LISTEN | awk '{print $2}')
```

### CORS Error
```
Check CORS_ORIGIN in backend .env
Ensure frontend URL matches
```

### GPS Not Working
```
Test in HTTPS or localhost
Check browser permissions
Use console: navigator.geolocation.getCurrentPosition()
```

---

## 📚 Further Reading

- **Prisma ORM:** https://www.prisma.io/docs/
- **Express.js:** https://expressjs.com/
- **React:** https://react.dev/
- **PostgreSQL:** https://www.postgresql.org/docs/
- **Geolocation API:** https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
- **Haversine Formula:** https://en.wikipedia.org/wiki/Haversine_formula

---

## 📊 Useful Metrics to Monitor

- **API Response Time:** Target < 200ms
- **Database Query Time:** Target < 50ms
- **Case Processing:** Monitor bulk uploads
- **GPS Accuracy:** Track distance validation failures
- **PTP Compliance:** Monitor broken promise rates
- **Earnings Accuracy:** Verify payout calculations

---

**Last Updated:** February 11, 2026  
**Version:** 1.0.0 - Production Ready  
**Status:** ✅ All Systems Go
