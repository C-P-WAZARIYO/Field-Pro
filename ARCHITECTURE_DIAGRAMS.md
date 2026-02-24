# AuthX Enterprise - System Architecture & Flow Diagrams

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React/Vite)                   │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Executive   │  │ Supervisor   │  │   Manager    │      │
│  │  Dashboard   │  │  Dashboard   │  │  Dashboard   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│  ┌──────────────┐                            │              │
│  │ Feedback Form│ ← GPS Geolocation          │              │
│  │ + Upload     │ ← Device Fingerprint       │              │
│  └──────────────┘                            │              │
└────────────┬──────────────────────────────────┬──────────────┘
             │ REST API (axios)                 │
             ↓                                  ↓
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (Express.js)                            │
│                                                               │
│  ┌──────────────────────────────────────┐                   │
│  │  API ROUTES                          │                   │
│  │  ├─ /cases           (Case Mgmt)     │                   │
│  │  ├─ /feedbacks       (GPS Validation)│                   │
│  │  ├─ /payouts        (Grid + Calc)   │                   │
│  │  ├─ /blogs          (Blog Module)   │                   │
│  │  └─ /auth, /users   (Existing)      │                   │
│  └──────────────────────────────────────┘                   │
│           ↓                                                   │
│  ┌──────────────────────────────────────┐                   │
│  │  CONTROLLERS                         │                   │
│  │  ├─ cases.controller.js              │                   │
│  │  ├─ feedback.controller.js           │                   │
│  │  ├─ payout.controller.js             │                   │
│  │  └─ blog.controller.js               │                   │
│  └──────────────────────────────────────┘                   │
│           ↓                                                   │
│  ┌──────────────────────────────────────┐                   │
│  │  SERVICES (Business Logic)           │                   │
│  │  ├─ case.service.js                  │                   │
│  │  ├─ feedback.service.js              │                   │
│  │  │  └─ Haversine Formula             │                   │
│  │  │  └─ PTP Tracking                  │                   │
│  │  │  └─ Fake Visit Detection          │                   │
│  │  ├─ payout.service.js                │                   │
│  │  │  └─ Tree-based Calculation        │                   │
│  │  │  └─ Bonus Management              │                   │
│  │  └─ blog.service.js                  │                   │
│  └──────────────────────────────────────┘                   │
└────────────┬──────────────────────────────────────┬──────────┘
             │ Prisma ORM                           │
             ↓                                      ↓
┌─────────────────────────────────────────────────────────────┐
│              DATABASE (PostgreSQL)                           │
│                                                               │
│  Tables:                                                      │
│  ├─ users, roles, permissions, user_roles                   │
│  ├─ cases (50k+ records)                                     │
│  ├─ feedbacks (with GPS, device_info)                        │
│  ├─ payout_grids (Bank→Product→BKT→Payout)                 │
│  ├─ performance_metrics (Monthly aggregation)               │
│  ├─ posts, post_likes, post_comments (Blog)                 │
│  ├─ sessions, refresh_tokens (Auth)                         │
│  └─ audit_logs (Security tracking)                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Case Management Flow

```
SUPERVISOR UPLOADS EXCEL
         ↓
    [File Parser]
         ↓
BULK CREATE CASES (emp_id based)
    ├─ Create: cases[]
    ├─ Save: upload_mode (MODIFICATION/ORIGINAL)
    └─ Trigger: Email notification to executives
         ↓
ALLOCATE CASES TO EXECUTIVES
    ├─ emp_id → executiveId mapping
    ├─ One emp_id → Multiple executives (one-to-many)
    └─ Status: PENDING
         ↓
EXECUTIVE VIEWS ASSIGNED CASES
    ├─ Filter: BKT, Product, NPA Status, Priority
    ├─ Metrics: Visit rate, Recovery rate
    └─ Deep filtering available
         ↓
SUBMIT FEEDBACK
    ├─ GPS location capture
    ├─ Distance validation (vs Case.lat/lng)
    │   └─ If > 300m: is_fake_visit = true
    ├─ Device fingerprinting
    └─ Status updated: VISITED
         ↓
SUPERVISOR AUDITS FAKE VISITS
    ├─ View: Distance metrics
    ├─ Action: Mark-fake or Approve
    └─ Track: Device info for patterns
         ↓
PERFORMANCE METRICS CALCULATED
    ├─ Volume: Total cases, visited cases
    ├─ Value: Total POS, recovered POS
    ├─ By Category: BKT, Product, Bank
    └─ Aggregation: PerformanceMetric table
```

---

## 3. Geospatial Validation Flow

```
EXECUTIVE SUBMITS FEEDBACK
         │
         ├─ Enable GPS ──→ navigator.geolocation.getCurrentPosition()
         │
         ├─ Get: { lat: 28.7041, lng: 77.1025 }
         │
         ↓
FETCH CASE LOCATION
         │
         └─ From Case: { lat: 28.6139, lng: 77.2090 }
         │
         ↓
CALCULATE DISTANCE (Haversine Formula)
         │
         ├─ d = 2R * arcsin(√[sin²(Δlat/2) + cos(lat1)*cos(lat2)*sin²(Δlng/2)])
         │
         ├─ R = 6,371,000 meters (Earth radius)
         │
         └─ Distance: 6,500 meters
         │
         ↓
VALIDATE AGAINST THRESHOLD
         │
         ├─ If distance ≤ 300m: ✅ is_valid = true
         │
         └─ If distance > 300m: ❌ is_fake_visit = true
                                   ├─ Flag for audit
                                   ├─ Capture device_info
                                   │  ├─ userAgent
                                   │  ├─ ipAddress
                                   │  ├─ timestamp
                                   │  └─ coordinates
                                   └─ Store as JSON in database
         │
         ↓
SUPERVISOR AUDIT
         │
         ├─ View distance in /feedbacks/audit/fake-visits
         │
         ├─ Review: Device fingerprint (IP, User Agent)
         │
         ├─ Decision:
         │  ├─ APPROVE: Mark as valid visit
         │  └─ REJECT: Delete feedback (POST /feedbacks/:id/mark-fake)
         │
         └─ Pattern Analysis: Multiple visits from same IP/device
```

---

## 4. Payout Grid Hierarchy

```
PAYOUT GRID STRUCTURE
│
└─ BANK LEVEL
   │
   ├─ HDFC Bank
   │  │
   │  └─ PRODUCT LEVEL
   │     │
   │     ├─ Agriculture
   │     │  │
   │     │  └─ BKT LEVEL (Collection Age)
   │     │     │
   │     │     ├─ BKT-0 (0-30 days)
   │     │     │  ├─ Target %: 90%
   │     │     │  ├─ Payout: ₹500 (FIXED)
   │     │     │  ├─ Norm Bonus: +₹100
   │     │     │  ├─ Rollback Bonus: +₹150
   │     │     │  └─ Max Earning Cap: ₹50,000
   │     │     │
   │     │     ├─ BKT-1 (31-60 days)
   │     │     │  ├─ Target %: 75%
   │     │     │  ├─ Payout: 3% of POS
   │     │     │  └─ ...
   │     │     │
   │     │     ├─ BKT-2 (61-90 days)
   │     │     └─ BKT-3+ (90+ days)
   │     │
   │     ├─ Wheels Loan
   │     │  └─ BKT LEVELS...
   │     │
   │     └─ Mortgage
   │        └─ BKT LEVELS...
   │
   └─ Other Banks...

EARNINGS CALCULATION
│
├─ Base Payout = 
│  ├─ If FIXED: Use payout_amount directly
│  └─ If PERCENTAGE: (posAmount * payout_amount / 100)
│
├─ Add Case-Specific Bonuses
│  ├─ If NORM case: + norm_bonus
│  └─ If ROLLBACK: + rollback_bonus
│
├─ Apply Capping
│  └─ If total_earnings > max_earning: cap it
│
└─ Store in PerformanceMetric (monthly aggregation)
```

---

## 5. PTP (Promise to Pay) Tracking

```
FEEDBACK SUBMISSION
         │
         ├─ ptp_date: "2026-02-20" (Next action promised by customer)
         │
         ↓
AUTOMATIC PTP MONITORING
         │
    DAILY SCHEDULED CHECK (POST /feedbacks/check-broken-ptp)
         │
         ├─ Today: 2026-02-20
         │
         ├─ Find: All feedbacks where ptp_date < today
         │
         ├─ For each:
         │  ├─ Check if newer feedback exists after ptp_date
         │  │
         │  ├─ If YES: No action needed
         │  │
         │  └─ If NO: ptp_broken = true ❌
         │
         ↓
SUPERVISOR ALERTS
         │
         ├─ GET /feedbacks/alerts/ptp?filter=today
         │  └─ Show "TODAY'S PTP" cases
         │
         ├─ GET /feedbacks/alerts/ptp?filter=broken
         │  └─ Show "BROKEN PTP" (no action taken)
         │
         └─ Dashboard displays:
            ├─ Red alert for broken promises
            ├─ Customer contact details
            ├─ Amount outstanding
            └─ Executive responsible for follow-up
```

---

## 6. Role-Based Access Control (RBAC)

```
REQUEST COMES IN
         │
         ↓
AUTHENTICATION
    ├─ Check JWT token
    └─ Extract user ID & roles
         │
         ↓
AUTHORIZATION
    ├─ Fetch user → role → permissions
    │
    ├─ SUPER ADMIN
    │  └─ ALL endpoints ✅
    │
    ├─ MANAGER
    │  ├─ POST /payouts/grids ✅
    │  ├─ PUT /payouts/grids/:id ✅
    │  ├─ GET /cases ✅ (view only)
    │  └─ POST /payouts/calculate-earnings ✅
    │
    ├─ SUPERVISOR
    │  ├─ GET /cases ✅
    │  ├─ POST /cases/allocate/* ✅
    │  ├─ GET /feedbacks/audit/fake-visits ✅
    │  ├─ POST /feedbacks/:id/mark-fake ✅
    │  └─ GET /feedbacks/alerts/ptp ✅
    │
    ├─ FIELD EXECUTIVE
    │  ├─ GET /cases/executive/:id ✅
    │  ├─ POST /feedbacks ✅
    │  ├─ GET /cases/performance/:id ✅
    │  └─ GET /blogs/* ✅
    │
    ├─ ANALYST
    │  ├─ GET /cases/performance/* ✅ (read-only)
    │  └─ GET /blogs/* ✅
    │
    └─ GUEST/BLOGGER
       ├─ GET /blogs/published ✅ (read-only)
       └─ Cannot access cases/feedbacks ❌
         │
         ↓
    If authorized: Process request ✅
    If denied: Return 403 Forbidden ❌
```

---

## 7. Device Fingerprinting Capture

```
FEEDBACK SUBMISSION
         │
         ↓
CAPTURE DEVICE INFO
│
├─ req.headers['user-agent']
│  └─ "Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
│
├─ req.ip
│  └─ "192.168.1.100"
│
├─ GPS Coordinates (from geolocation)
│  ├─ lat: 28.7041
│  └─ lng: 77.1025
│
├─ Timestamp
│  └─ "2026-02-11T14:30:00Z"
│
└─ Store as JSON in feedback.device_info
   │
   ↓
FORENSICS & PATTERN ANALYSIS
   │
   ├─ Multiple visits from same IP/Device?
   │  └─ Potential: Collusion, Device sharing
   │
   ├─ Visits at impossible distances in short time?
   │  └─ Potential: Data falsification
   │
   └─ Same device for multiple fake visits?
      └─ Escalate to supervisor for investigation
```

---

## 8. Performance Metrics Aggregation

```
RAW DATA
├─ Cases
│  ├─ Total: 15 cases assigned
│  ├─ Visited: 12 cases (with feedback)
│  ├─ Not Visited: 3 cases
│  └─ POS: ₹15,00,000
│
└─ Feedbacks
   ├─ Valid: 11
   ├─ Fake: 1
   └─ Recovered: ₹12,00,000
         │
         ↓
MONTHLY AGGREGATION (PerformanceMetric)
         │
         ├─ executiveId: "exec-123"
         ├─ month: 2
         ├─ year: 2026
         │
         ├─ VOLUME METRICS
         │  ├─ total_cases: 15
         │  └─ visited_cases: 12
         │     └─ Visit Rate: 80%
         │
         ├─ VALUE METRICS
         │  ├─ total_pos: 15,00,000
         │  └─ recovered_pos: 12,00,000
         │     └─ Recovery Rate: 80%
         │
         ├─ EARNINGS
         │  └─ earnings: ₹45,000 (calculated from payout grids)
         │
         └─ BREAKDOWN
            ├─ By BKT
            │  ├─ BKT-0: 8 cases, ₹8,00,000 POS
            │  ├─ BKT-1: 4 cases, ₹4,00,000 POS
            │  └─ BKT-3+: 3 cases, ₹3,00,000 POS
            │
            └─ By Product
               ├─ Agriculture: 10 cases, ₹10,00,000 POS
               └─ Wheels: 5 cases, ₹5,00,000 POS
         │
         ↓
DASHBOARD VISUALIZATION
         │
         ├─ Pie charts by category
         ├─ Progress bars for targets
         ├─ Line charts for trends
         └─ KPI cards for summaries
```

---

## 9. Data Flow: Case Upload to Earnings

```
STEP 1: FILE UPLOAD
┌────────────────────┐
│ Supervisor uploads │
│ Excel with 1000    │
│ cases (emp_id col) │
└────────────────────┘
         │
         ↓
STEP 2: BULK CREATE
┌────────────────────┐
│ Service:           │
│ bulkCreateCases()  │
│ Creates 1000 Case  │
│ records            │
└────────────────────┘
         │
         ↓
STEP 3: ALLOCATE
┌────────────────────┐
│ Service:           │
│ allocateCases()    │
│ emp_id → executive │
│ mapping            │
└────────────────────┘
         │
         ↓
STEP 4: EXECUTIVE ACTION
┌────────────────────┐
│ Executive views    │
│ assigned cases &   │
│ submits feedback   │
│ with GPS + PTP     │
└────────────────────┘
         │
         ↓
STEP 5: GPS VALIDATION
┌────────────────────┐
│ Service:           │
│ validateGPS()      │
│ Distance check     │
│ Device capture     │
└────────────────────┘
         │
         ↓
STEP 6: AUDIT
┌────────────────────┐
│ Supervisor views   │
│ feedbacks & marks  │
│ fake visits or     │
│ approves          │
└────────────────────┘
         │
         ↓
STEP 7: CALCULATION
┌────────────────────┐
│ Service:           │
│ calculateEarnings()│
│ Lookup payout grid │
│ Apply bonuses &    │
│ caps               │
└────────────────────┘
         │
         ↓
STEP 8: STORAGE
┌────────────────────┐
│ PerformanceMetric: │
│ ├─ earnings        │
│ ├─ total_cases     │
│ ├─ visited_cases   │
│ └─ recovery_rate   │
└────────────────────┘
         │
         ↓
STEP 9: DASHBOARD
┌────────────────────┐
│ Manager views:     │
│ ├─ Earnings summary│
│ ├─ By BKT/Product  │
│ ├─ Trends          │
│ └─ Payouts due     │
└────────────────────┘
```

---

## 10. Security Layers

```
INCOMING REQUEST
         │
         ↓
LAYER 1: HTTPS/TLS
    └─ Encrypt in transit
         │
         ↓
LAYER 2: HELMET HEADERS
    ├─ CSP (Content Security Policy)
    ├─ X-Frame-Options
    └─ Other security headers
         │
         ↓
LAYER 3: CORS VALIDATION
    └─ Whitelist frontend domain
         │
         ↓
LAYER 4: RATE LIMITING
    └─ 100 requests / 15 minutes per IP
         │
         ↓
LAYER 5: AUTHENTICATION
    ├─ Check JWT token
    ├─ Validate expiry
    └─ Extract user info
         │
         ↓
LAYER 6: INPUT VALIDATION
    ├─ express-validator rules
    ├─ Sanitize data
    └─ Check data types
         │
         ↓
LAYER 7: AUTHORIZATION (RBAC)
    ├─ Check user role
    ├─ Verify permissions
    └─ Grant/Deny access
         │
         ↓
LAYER 8: BUSINESS LOGIC
    ├─ Process request
    ├─ Apply constraints
    └─ Validate state
         │
         ↓
LAYER 9: DATABASE
    ├─ Parameterized queries (Prisma ORM)
    ├─ Foreign key constraints
    └─ Unique constraints
         │
         ↓
LAYER 10: AUDIT LOG
    └─ Log all sensitive actions
```

---

## Database Relationships Diagram

```
USER
├─ 1 → M: UserRole
├─ 1 → M: Case (executive)
├─ 1 → M: Feedback
├─ 1 → M: Post
├─ 1 → M: PostLike
├─ 1 → M: PostComment
└─ 1 → M: PerformanceMetric

ROLE
├─ M ← 1: UserRole
└─ 1 → M: RolePermission

PERMISSION
└─ M ← 1: RolePermission

CASE
├─ M ← 1: User (executive)
└─ 1 → M: Feedback

FEEDBACK
├─ M ← 1: Case
└─ M ← 1: User (executive)

PAYOUTGRID
└─ Standalone (referenced in calculations)

POST
├─ M ← 1: User (author)
├─ 1 → M: PostLike
└─ 1 → M: PostComment

POSTLIKE
├─ M ← 1: Post
└─ M ← 1: User (who liked)

POSTCOMMENT
├─ M ← 1: Post
└─ M ← 1: User (author)

PERFORMANCEMETRIC
└─ M ← 1: User (executive)
```

---

**Diagrams Last Updated:** February 11, 2026
**System Status:** ✅ Production Ready
