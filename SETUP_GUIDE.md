# AuthX Enterprise - Setup & Deployment Guide

## Project Overview

**AuthX Enterprise** is a high-security MERN stack platform (Prisma + PostgreSQL) for large-scale financial recovery management. It features:

- 🏢 Role-Based Access Control (RBAC) with 6+ roles
- 📦 Case Management for 50k+ financial records
- 💰 Dynamic Payout Grid system (Bank → Product → BKT → Target → Payout)
- 📍 Geospatial GPS validation with fake visit detection
- 💬 Community blog module with likes & comments
- 📊 Performance metrics (Count-wise vs POS-wise)
- 🔐 Argon2id password hashing + JWT authentication
- 📱 Mobile-optimized executive dashboards

---

## System Architecture

```
Frontend (React/Vite)
    ↓
API Routes (Express)
    ↓
Services & Controllers
    ↓
Prisma ORM
    ↓
PostgreSQL Database
```

### Folder Structure

```
/backend
  ├─ src/
  │   ├─ controllers/
  │   │   ├─ cases.controller.js
  │   │   ├─ feedback.controller.js
  │   │   ├─ blog.controller.js
  │   │   ├─ payout.controller.js
  │   │   └─ [existing: auth, user, role]
  │   ├─ services/
  │   │   ├─ case.service.js
  │   │   ├─ feedback.service.js
  │   │   ├─ blog.service.js
  │   │   ├─ payout.service.js
  │   │   └─ [existing: auth, user, role, token, audit]
  │   ├─ routes/
  │   │   ├─ cases.routes.js
  │   │   ├─ feedback.routes.js
  │   │   ├─ blog.routes.js
  │   │   ├─ payout.routes.js
  │   │   └─ index.js (main routes file)
  │   ├─ middleware/
  │   ├─ config/
  │   ├─ app.js
  │   └─ server.js
  ├─ prisma/
  │   ├─ schema.prisma (updated with new models)
  │   ├─ seed.js
  │   └─ migrations/
  └─ package.json

/src (frontend)
  ├─ pages/
  │   ├─ ExecutiveDashboard.jsx
  │   ├─ SupervisorDashboard.jsx
  │   ├─ ManagerDashboard.jsx
  │   └─ [existing pages]
  ├─ components/
  │   ├─ FeedbackForm.jsx
  │   └─ [existing components]
  ├─ api/
  │   └─ axios.js
  └─ styles/
```

---

## Installation & Setup

### Prerequisites

- Node.js v18+
- PostgreSQL 13+
- npm or yarn

### Backend Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Create .env file:**
   ```bash
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/authx_enterprise"

   # Server
   NODE_ENV=development
   PORT=5000
   API_VERSION=v1

   # JWT
   JWT_SECRET=your-super-secret-key
   JWT_EXPIRY=7d
   JWT_REFRESH_SECRET=your-refresh-secret
   JWT_REFRESH_EXPIRY=30d

   # CORS
   CORS_ORIGIN=http://localhost:5173

   # Email (Nodemailer)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

3. **Setup Database:**
   ```bash
   # Push schema to database
   npx prisma db push

   # Generate Prisma client
   npx prisma generate

   # Seed initial data (optional)
   npm run db:seed
   ```

4. **Start Backend:**
   ```bash
   npm run dev
   ```

   Server will run on `http://localhost:5000`

### Frontend Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create .env file:**
   ```bash
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

3. **Start Frontend:**
   ```bash
   npm run dev
   ```

   App will run on `http://localhost:5173`

---

## Database Schema Summary

### New Models Added

1. **PayoutGrid** - Tree-based earnings structure (Bank → Product → BKT → Payout)
2. **Feedback** - GPS-validated case feedback with PTP tracking
3. **PostLike** - Blog post interactions
4. **PostComment** - Blog post comments
5. **PerformanceMetric** - Executive performance aggregation
6. **CaseUpload** - Case batch upload tracking

### Key Features

- **GPS Validation:** Distance > 300m flags fake visits
- **Device Fingerprinting:** IP, User Agent, Coordinates captured on each submission
- **PTP Tracking:** Promise to Pay dates with broken alert detection
- **Hierarchical Payout:** Fixed or Percentage payouts with bonuses

---

## Role-Based Endpoints

### Super Admin
- All system endpoints
- User management
- Role configuration
- Audit logs

### Manager
- `POST /payouts/grids` - Create payout structures
- `PUT /payouts/grids/:id` - Update grids
- `POST /payouts/grids/copy` - Copy grids between products
- `POST /payouts/calculate-earnings` - Calculate bonuses

### Supervisor
- `GET /cases` - View all cases
- `POST /cases/allocate/*` - Allocate to executives
- `GET /feedbacks/audit/fake-visits` - Audit fake visits
- `GET /feedbacks/alerts/ptp` - Monitor PTP alerts
- `POST /feedbacks/:id/mark-fake` - Mark suspicious visits

### Field Executive
- `GET /cases/executive/:id` - View assigned cases
- `POST /feedbacks` - Submit GPS-validated feedback
- `GET /cases/performance/:id` - View personal metrics
- `GET /blogs/*` - Access blog

### Analyst
- `GET /cases/performance/*` - Read-only analytics
- `GET /blogs/*` - Blog access

### Guest/Blogger
- `GET /blogs/published` - Read blog posts
- `GET /blogs/search` - Search posts
- Cannot access case/feedback features

---

## API Usage Examples

### Submit Feedback (Executive)
```javascript
const feedbackData = {
  caseId: "abc-123",
  lat: 28.7041,
  lng: 77.1025,
  visit_code: "V001",
  meeting_place: "Customer's office",
  asset_status: "GOOD",
  ptp_date: "2026-02-20",
  remarks: "Customer promised payment by 20th"
};

await axios.post('/feedbacks', feedbackData);
// Response includes: { feedback, gpsValidation: { is_valid, distance } }
```

### Get PTP Alerts (Supervisor)
```javascript
const alerts = await axios.get('/feedbacks/alerts/ptp?filter=today');
// Shows all cases with PTP due today
```

### Calculate Earnings (Manager)
```javascript
const earnings = await axios.post('/payouts/calculate-earnings', {
  executiveId: "exec-123",
  casesVisited: 15,
  totalPOSRecovered: 150000,
  month: 2,
  year: 2026,
  caseDetails: [
    { bkt: "BKT-0", product: "Agriculture", bank: "HDFC", type: "NORM", posAmount: 50000 },
    // ... more cases
  ]
});
// Returns: { totalEarnings, breakdown by category, metric }
```

---

## Frontend Dashboard Components

### Executive Dashboard (`ExecutiveDashboard.jsx`)
- View assigned cases with deep filtering
- Performance metrics (visit rate, recovery rate)
- Submit feedback with GPS location
- Track PTP follow-ups

### Supervisor Dashboard (`SupervisorDashboard.jsx`)
- Monitor all cases with allocation tracking
- PTP alerts for today and broken promises
- Audit queue for fake visit detection
- Reject suspicious submissions

### Manager Dashboard (`ManagerDashboard.jsx`)
- Create/update payout grid structures
- Copy grids between products for consistency
- View all bank/product/BKT combinations
- Edit bonuses and earning caps

### Feedback Form Component (`FeedbackForm.jsx`)
- GPS location capture (📍 geolocation API)
- Mandatory fields validation
- Photo upload input
- Real-time PTP date selection

---

## Geospatial Validation Logic

```javascript
// Distance calculation (Haversine formula)
const distance = calculateDistance(lat1, lon1, lat2, lon2); // Returns meters

// Fake visit flagging
if (distance > 300) {
  feedback.is_fake_visit = true;
  feedback.reason = `Visit location is ${distance}m away from known address`;
}
```

### Device Fingerprinting
Captured on every submission:
```javascript
{
  userAgent: "Mozilla/5.0...",
  ipAddress: "192.168.x.x",
  timestamp: "2026-02-11T10:30:00Z",
  lat: 28.7041,
  lng: 77.1025
}
```

---

## Performance Optimization

### Database Indexes
- `cases.emp_id` - Employee allocation lookup
- `cases.executiveId` - Executive case retrieval
- `cases.bkt` - BKT filtering
- `feedbacks.caseId` - Case feedback lookup
- `feedbacks.is_fake_visit` - Fake visit audits
- `feedbacks.ptp_date` - PTP alert queries

### Query Optimization
- Batch feedback checks for broken PTPs
- Aggregate performance metrics monthly
- Cache payout grids in memory
- Pagination on case listing (limit: 100)

---

## Security Features

1. **Argon2id** password hashing
2. **JWT** (Access + Refresh tokens)
3. **RBAC** - Role & Permission system
4. **Rate Limiting** - 100 requests/15 mins
5. **Helmet** - Security headers
6. **CORS** - Whitelist configured
7. **Input Validation** - express-validator
8. **Device Fingerprinting** - Track suspicious logins

---

## Deployment Checklist

- [ ] Create PostgreSQL database
- [ ] Configure `.env` with production credentials
- [ ] Run `prisma db push` on production
- [ ] Set `NODE_ENV=production`
- [ ] Install & build frontend: `npm run build`
- [ ] Serve static build from backend or CDN
- [ ] Enable HTTPS/SSL
- [ ] Setup automated backups
- [ ] Configure logging & monitoring
- [ ] Setup CI/CD pipeline (GitHub Actions)

---

## Troubleshooting

### Prisma Errors
```bash
# Regenerate Prisma client
npx prisma generate

# Reset database (⚠️ deletes data)
npx prisma migrate reset

# Check schema
npx prisma studio
```

### Port Already in Use
```bash
# Backend (5000)
lsof -i :5000
kill -9 <PID>

# Frontend (5173)
lsof -i :5173
kill -9 <PID>
```

### GPS Not Working
- Ensure HTTPS in production (geolocation requires secure context)
- Test with `navigator.geolocation.getCurrentPosition()` in browser console
- Check user granted location permission

---

## Next Steps

1. **Seed Initial Data:** Create sample cases, executives, payout grids
2. **Setup Email:** Configure Nodemailer for PTP notifications
3. **Add File Upload:** Integrate AWS S3 for photo uploads
4. **Create Reports:** Build Excel download functionality
5. **Mobile App:** Convert React app to React Native
6. **Analytics:** Setup performance dashboards with Recharts
7. **Automated Tasks:** Schedule PTP break checks and earnings calculations

---

## Support & Documentation

- API Docs: See [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- Prisma Docs: https://www.prisma.io/docs/
- Express Docs: https://expressjs.com/
- React Docs: https://react.dev/

---

**Project Status:** ✅ Backend Complete | ✅ Frontend Dashboards Ready | 🔄 In Production

Last Updated: February 11, 2026
