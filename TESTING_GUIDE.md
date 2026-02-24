# AuthX Enterprise - Testing Guide

## ✅ Current Status

Both servers are **running successfully**:
- **Backend**: http://localhost:5000 ✓
- **Frontend**: http://localhost:5173 ✓
- **Database**: PostgreSQL (authx_enterprise) ✓
- **API**: All 13 endpoints responding ✓

---

## 🧪 Testing Options

### Option 1: Quick cURL Testing
```bash
# API Health
curl http://localhost:5000/api/v1/health

# Register User
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@authx.com",
    "username":"testuser",
    "password":"Test123!"
  }'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@authx.com",
    "password":"Test123!"
  }'
```

### Option 2: Run Full API Test Suite
```bash
bash test-api.sh
```
This runs 13 endpoint tests and shows pass/fail status.

### Option 3: Use Postman Collection
1. Open Postman
2. Import: `AuthX-API.postman_collection.json`
3. Set `YOUR_TOKEN` in Authorization headers
4. Test all endpoints with pre-built requests

---

## 📋 Key Test Scenarios

### Scenario 1: User Registration & Login
```
1. Register → GET 400 (missing fields) or 201 (success)
2. Login → GET 401 (invalid) or 200 (success + token)
3. Use token in subsequent requests
```

### Scenario 2: Case Management
```
1. Create Case → POST /cases with full details
2. List Cases → GET /cases (requires auth)
3. Get Performance → GET /cases/performance/{id}
4. Allocate → POST /cases/allocate/single
```

### Scenario 3: GPS Feedback Submission
```
1. Get user's GPS coordinates
2. Submit Feedback → POST /feedbacks
3. System auto-validates distance (300m threshold)
4. Check fake_visit flag in response
```

### Scenario 4: Payout Grid Configuration
```
1. Create Grid → POST /payouts/grids
2. List Grids → GET /payouts/grids
3. Calculate Earnings → POST /payouts/calculate-earnings
```

### Scenario 5: Blog Module
```
1. Get Posts → GET /blogs/published (no auth needed)
2. Create Post → POST /blogs (auth required)
3. Like Post → POST /blogs/{id}/like
4. Comment → POST /blogs/{id}/comments
```

---

## 🔍 Testing with Actual Data

### Create a Test Case
```bash
curl -X POST http://localhost:5000/api/v1/cases \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "acc_id": "ACC-TEST-001",
    "customer_name": "Rajesh Kumar",
    "phone_number": "9876543210",
    "address": "Farm, Delhi",
    "lat": 28.7041,
    "lng": 77.1025,
    "pos_amount": 500000,
    "overdue_amount": 250000,
    "dpd": 120,
    "bkt": "BKT-0",
    "product_type": "Agriculture",
    "bank_name": "HDFC"
  }'
```

### Submit GPS Feedback
```bash
curl -X POST http://localhost:5000/api/v1/feedbacks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "caseId": "CASE_ID_FROM_ABOVE",
    "lat": 28.7045,
    "lng": 77.1020,
    "visit_code": "V001",
    "meeting_place": "Farm Gate",
    "asset_status": "GOOD",
    "ptp_date": "2026-02-20"
  }'
```

Response will include:
```json
{
  "id": "feedback-uuid",
  "distance_from_address": 0.65,
  "is_fake_visit": false,
  "device_info": {...}
}
```

### Test GPS Validation (Fake Visit)
Submit feedback from a location >300m away:
```bash
curl -X POST http://localhost:5000/api/v1/feedbacks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "caseId": "CASE_ID",
    "lat": 28.65,
    "lng": 77.15,
    "visit_code": "V002",
    "meeting_place": "Different Location",
    "asset_status": "GOOD",
    "ptp_date": "2026-02-21"
  }'
```

This will return: `"is_fake_visit": true` ⚠️

---

## 📊 Frontend Testing

### Access Dashboards
- **Executive Dashboard**: http://localhost:5173/executive
- **Supervisor Dashboard**: http://localhost:5173/supervisor
- **Manager Dashboard**: http://localhost:5173/manager
- **Blog Feed**: http://localhost:5173/blog

### Test Frontend Components
1. Go to Executive Dashboard
2. Try deep filtering (BKT, Product, Status)
3. Click "Submit Feedback" button
4. Allow GPS location access
5. Fill feedback form and submit
6. Check if feedback appears in Supervisor's audit queue

---

## 🗄️ Database Verification

### View Tables in Prisma Studio
```bash
cd backend && npx prisma studio
```
Opens interactive database explorer at http://localhost:5555

### Direct Database Queries
```bash
# Connect to database
psql -U postgres -d authx_enterprise

# List tables
\dt

# Count records
SELECT COUNT(*) FROM "Case";
SELECT COUNT(*) FROM "Feedback";
SELECT COUNT(*) FROM "User";

# View data
SELECT * FROM "Case" LIMIT 5;
SELECT * FROM "Feedback" WHERE is_fake_visit = true;
```

---

## 🔐 Authentication Testing

### Get a Valid Token
1. Register a user
2. Login to get token
3. Copy token from response
4. Add to requests: `Authorization: Bearer TOKEN`

### Token Format
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI....[payload]....[signature]
```

### Test Protected Endpoints
```bash
# Without token → 401 Unauthorized
curl http://localhost:5000/api/v1/cases

# With token → 200 OK
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/v1/cases
```

---

## 📈 Performance Testing

### Load Testing (Optional)
```bash
# Install Apache Bench (ab)
sudo apt-get install apache2-utils

# Test 100 requests
ab -n 100 -c 10 http://localhost:5000/api/v1/health

# Results show response time, throughput, etc.
```

---

## 🐛 Debugging

### Check Backend Logs
```bash
# If running in terminal, watch console output
# Or check the log file
tail -f /tmp/backend.log

# Common errors:
# - 401: Missing or invalid token
# - 400: Invalid request data
# - 500: Server error (check logs)
```

### Check Frontend Logs
```bash
# Browser console (F12)
# Or check terminal where npm run dev is running
tail -f /tmp/frontend.log
```

### Database Issues
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Restart if needed
sudo systemctl restart postgresql

# Verify connection
psql -U postgres -d authx_enterprise -c "SELECT NOW();"
```

---

## ✨ Expected Test Results

| Endpoint | Method | Auth | Status | Description |
|----------|--------|------|--------|-------------|
| `/health` | GET | No | 200 | Server is running |
| `/auth/register` | POST | No | 201/400 | Create account |
| `/auth/login` | POST | No | 200/401 | Get token |
| `/cases` | GET | Yes | 200 | List cases |
| `/cases` | POST | Yes | 201 | Create case |
| `/feedbacks` | POST | Yes | 201 | Submit feedback |
| `/feedbacks/audit/fake-visits` | GET | Yes | 200 | Fake visit audit |
| `/payouts/grids` | GET | Yes | 200 | List payout grids |
| `/payouts/grids` | POST | Yes | 201 | Create payout grid |
| `/blogs/published` | GET | No | 200 | Get blog posts |
| `/blogs` | POST | Yes | 201 | Create blog post |

---

## 🎯 Next Steps

1. **Create Sample Data**: Use test scripts to populate DB
2. **Test GPS Validation**: Submit feedback from different GPS coords
3. **Test Payout Calculation**: Create grids and calculate earnings
4. **Test RBAC**: Try endpoints with different user roles
5. **Mobile Testing**: Test on actual mobile device with GPS
6. **Load Testing**: Test with bulk case uploads
7. **Email Notifications**: Configure and test PTP alerts

---

## 📚 Reference Files

- **API Docs**: `API_DOCUMENTATION.md` (40+ endpoints)
- **Setup Guide**: `SETUP_GUIDE.md` (installation steps)
- **Architecture**: `ARCHITECTURE_DIAGRAMS.md` (system design)
- **Implementation**: `IMPLEMENTATION_SUMMARY.md` (feature status)
- **Quick Ref**: `QUICK_REFERENCE.md` (common commands)

---

## 💡 Tips for Testing

1. **Always include Authorization header** for protected endpoints
2. **Use valid UUIDs** for IDs (case, user, etc.)
3. **Test error cases**: missing fields, invalid data, wrong tokens
4. **Validate GPS**: Try coordinates near and far from address
5. **Check responses**: Verify all expected fields are returned
6. **Monitor logs**: Always watch backend logs during testing
7. **Use timestamps**: PTP dates should be in future

---

**Status**: ✅ System Ready for Testing  
**Last Updated**: February 11, 2026  
**API Version**: v1  
**Database**: PostgreSQL 17.7
