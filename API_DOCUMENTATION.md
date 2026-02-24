# AuthX Enterprise API Documentation

## Base URL
```
http://localhost:5000/api
```

---

## Authentication
All protected endpoints require a JWT token in the `Authorization` header:
```
Authorization: Bearer <token>
```

---

## Endpoints Overview

### 1. CASE MANAGEMENT

#### Get Cases for Executive
```
GET /cases/executive/:executiveId
Query Params: ?bkt=BKT-0&product_type=Agriculture&npa_status=NPA&priority=HIGH&status=PENDING
Response: { success, data: [cases], total }
```

#### Get All Cases (Supervisor/Admin)
```
GET /cases
Query Params: ?status=PENDING&bkt=BKT-1&product_type=Wheels&month=2&year=2026&bank_name=HDFC&limit=100&offset=0
Response: { success, data: [cases], pagination: { total, limit, offset } }
```

#### Get Single Case with Feedbacks
```
GET /cases/:caseId
Response: { success, data: { id, acc_id, customer_name, feedbacks[], ... } }
```

#### Get Executive Performance Metrics
```
GET /cases/performance/:executiveId
Query Params: ?month=2&year=2026
Response: {
  success,
  data: {
    totalCases: number,
    visitedCases: number,
    visitRate: percentage,
    totalPOS: amount,
    recoveredPOS: amount,
    recoveryRate: percentage,
    byBKT: { BKT-0: { count, pos, visited }, ... },
    byProduct: { Agriculture: { count, pos, visited }, ... }
  }
}
```

#### Allocate Cases to Executive
```
POST /cases/allocate/single
Body: { emp_id: "string", executiveId: "uuid" }
Response: { success, message, data: { count: updated } }
```

#### Bulk Allocate Cases
```
POST /cases/allocate/bulk
Body: {
  allocations: [
    { emp_id: "E001", executiveId: "uuid1" },
    { emp_id: "E002", executiveId: "uuid2" }
  ]
}
Response: { success, message, data: [{ emp_id, executiveId, updated }, ...] }
```

---

### 2. FEEDBACK & GPS VALIDATION

#### Submit Feedback (Executive)
```
POST /feedbacks
Body: {
  caseId: "uuid",
  lat: number,              # Current GPS latitude
  lng: number,              # Current GPS longitude
  visit_code: "string",
  meeting_place: "string",
  asset_status: "GOOD|FAIR|POOR|NOT_FOUND",
  remarks: "string",
  photo_url: "string",      # Optional S3 URL
  ptp_date: "2026-02-15"   # Next action date
}
Response: {
  success,
  message,
  data: { feedback object },
  gpsValidation: {
    is_valid: boolean,
    distance: meters,
    reason: "string"
  }
}
```

#### Get Feedbacks by Case
```
GET /feedbacks/case/:caseId
Response: { success, data: [feedback objects], total }
```

#### Get Feedbacks by Executive
```
GET /feedbacks/executive/:executiveId
Query Params: ?is_fake_visit=false&ptp_broken=false
Response: { success, data: [feedback objects], total }
```

#### Mark Feedback as Fake Visit
```
POST /feedbacks/:feedbackId/mark-fake
Response: { success, message, data: { feedback object with is_fake_visit: true } }
```

#### Reject Feedback
```
DELETE /feedbacks/:feedbackId
Response: { success, message }
```

#### Get Fake Visit Summary (Supervisor Audit)
```
GET /feedbacks/audit/fake-visits
Query Params: ?startDate=2026-02-01&endDate=2026-02-28
Response: { success, data: { total, list: [fake visit objects] } }
```

#### Get PTP Alerts
```
GET /feedbacks/alerts/ptp
Query Params: ?filter=today|broken
Response: { success, data: [ptp alert objects], total }
```

#### Check for Broken PTPs (Scheduled Task)
```
POST /feedbacks/check-broken-ptp
Response: { success, message, data: { checked: count, broken: count } }
```

---

### 3. PAYOUT MANAGEMENT

#### Create Payout Grid
```
POST /payouts/grids
Body: {
  bank: "HDFC",
  product: "Agriculture",
  bkt: "BKT-0",
  target_percent: 90,
  payout_type: "FIXED|PERCENTAGE",
  payout_amount: 500,       # Fixed amount or percentage
  norm_bonus: 100,
  rollback_bonus: 150,
  max_earning: 50000        # Optional cap
}
Response: { success, message, data: { grid object } }
```

#### Get Payout Grids by Bank & Product
```
GET /payouts/grids
Query Params: ?bank=HDFC&product=Agriculture
Response: { success, data: [grid objects], total }
```

#### Get All Payout Grids (with filters)
```
GET /payouts/grids/all
Query Params: ?bank=HDFC&product=Agriculture&bkt=BKT-0
Response: { success, data: [grid objects], total }
```

#### Update Payout Grid
```
PUT /payouts/grids/:gridId
Body: {
  payout_amount: 600,
  norm_bonus: 120,
  rollback_bonus: 160,
  max_earning: 60000
}
Response: { success, message, data: { updated grid } }
```

#### Copy Payout Grid to Another Product
```
POST /payouts/grids/copy
Body: {
  fromBank: "HDFC",
  fromProduct: "Agriculture",
  toBank: "HDFC",
  toProduct: "Wheels"
}
Response: { success, message, data: [copied grids] }
```

#### Calculate Executive Earnings
```
POST /payouts/calculate-earnings
Body: {
  executiveId: "uuid",
  casesVisited: 10,
  totalPOSRecovered: 100000,
  month: 2,
  year: 2026,
  caseDetails: [
    {
      bkt: "BKT-0",
      product: "Agriculture",
      bank: "HDFC",
      type: "NORM|ROLLBACK",
      posAmount: 50000
    },
    ...
  ]
}
Response: {
  success,
  message,
  data: {
    totalEarnings: amount,
    breakdown: { "bank_product_bkt": { payout, cases }, ... },
    metric: { performance metric object }
  }
}
```

---

### 4. BLOG MODULE

#### Create Blog Post
```
POST /blogs
Body: {
  title: "string",
  content: "string",
  status: "DRAFT|PUBLISHED"
}
Response: { success, message, data: { post object } }
```

#### Get Published Posts
```
GET /blogs/published
Query Params: ?limit=20&offset=0
Response: {
  success,
  data: [{ post with likesCount, commentsCount }, ...],
  pagination: { total, limit, offset }
}
```

#### Get User's Own Posts
```
GET /blogs/my-posts
Response: { success, data: [post objects] }
```

#### Get Single Post
```
GET /blogs/:postId
Response: { success, data: { post with likes[], comments[] } }
```

#### Update Post
```
PUT /blogs/:postId
Body: {
  title: "string",
  content: "string",
  status: "DRAFT|PUBLISHED"
}
Response: { success, message, data: { updated post } }
```

#### Delete Post
```
DELETE /blogs/:postId
Response: { success, message }
```

#### Like/Unlike Post
```
POST /blogs/:postId/like
Response: { success, message, data: { liked: boolean } }
```

#### Get Post Likes
```
GET /blogs/:postId/likes
Response: { success, data: [like objects with user info], total }
```

#### Add Comment to Post
```
POST /blogs/:postId/comments
Body: { content: "string" }
Response: { success, message, data: { comment object } }
```

#### Get Post Comments
```
GET /blogs/:postId/comments
Response: { success, data: [comment objects], total }
```

#### Delete Comment
```
DELETE /blogs/comments/:commentId
Response: { success, message }
```

#### Search Posts
```
GET /blogs/search
Query Params: ?q=keyword
Response: { success, data: [post objects], total }
```

---

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "message": "Error description"
}
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

---

## Role-Based Access Control

### Super Admin
- Full access to all endpoints
- Case management, allocation, payout configuration
- Audit logs and system monitoring

### Manager
- `/payouts/*` - Full access
- `/cases` - View all
- Payout grid creation and management

### Supervisor
- `/cases` - View and allocate
- `/feedbacks/audit/*` - Audit fake visits
- `/feedbacks/alerts/*` - PTP monitoring
- Case upload and management

### Field Executive
- `/cases/executive/:id` - View own cases
- `/feedbacks` - Submit feedback
- `/blogs/*` - Blog access

### Analyst
- `/cases/performance/*` - View only
- `/blogs/*` - Blog access

### Guest/Blogger
- `/blogs/published` - Read only
- `/blogs/search` - Search only
- Cannot submit feedback or manage cases

---

## Database Schema Quick Reference

### Case Model
- `id`, `acc_id` (unique), `customer_name`, `phone_number`, `address`, `lat`, `lng`
- `pos_amount`, `overdue_amount`, `dpd`, `bkt`, `product_type`, `bank_name`, `npa_status`, `priority`
- `emp_id`, `executiveId`, `status`, `upload_mode`
- `month`, `year`, `lastVisitAt`, `createdAt`, `updatedAt`

### Feedback Model
- `id`, `caseId`, `executiveId`, `lat`, `lng`, `distance_from_address`, `is_fake_visit`
- `visit_code`, `meeting_place`, `asset_status`, `remarks`, `photo_url`
- `ptp_date`, `ptp_broken`, `device_info` (JSON), `visitedAt`, `createdAt`, `updatedAt`

### PayoutGrid Model
- `id`, `bank`, `product`, `bkt`, `target_percent`, `payout_type`, `payout_amount`
- `norm_bonus`, `rollback_bonus`, `max_earning`, `created_by`, `createdAt`, `updatedAt`

### PerformanceMetric Model
- `id`, `executiveId`, `month`, `year`, `bkt`, `product`
- `total_cases`, `visited_cases`, `total_pos`, `recovered_pos`, `earnings`

### Post Model (Blog)
- `id`, `title`, `content`, `status` (DRAFT/PUBLISHED), `authorId`, `createdAt`, `updatedAt`

### PostLike & PostComment Models
- Tracks blog interactions with user and timestamp info

---

## Geographic Validation Rules

- **Fake Visit Flag:** Distance > 300 meters from known address
- **GPS Coordinates:** Required in Feedback submission
- **Device Fingerprinting:** Captures IP, User Agent, Location on every submission

---

## Example Workflows

### Executive Submitting Feedback
1. User enables GPS location
2. POST /feedbacks with case details
3. System validates GPS (distance check)
4. Feedback saved with device fingerprint
5. If distance > 300m, is_fake_visit = true

### Supervisor Auditing Visits
1. GET /feedbacks/audit/fake-visits
2. Review flagged visits
3. POST /feedbacks/:id/mark-fake or DELETE /feedbacks/:id
4. GET /feedbacks/alerts/ptp for PTP monitoring

### Manager Setting Payouts
1. POST /payouts/grids to create grid structure
2. PUT /payouts/grids/:id to update
3. POST /payouts/grids/copy to replicate across products
4. POST /payouts/calculate-earnings to compute bonuses

---

## Notes

- All timestamps are in ISO 8601 format
- Currency in INR (₹)
- Coordinates in decimal degrees format (latitude, longitude)
- PTP = Promise to Pay (next action date from customer)
- BKT = Bucket (collection age category: 0, 1, 2, 3+)
