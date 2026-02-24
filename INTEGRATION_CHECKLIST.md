# Employee Dashboard - Integration Checklist

## Pre-Integration Verification

Before implementing backend endpoints, verify:

- [ ] Frontend dashboard loads without errors
- [ ] AuthContext is properly configured
- [ ] Axios API client is working
- [ ] Database models (Case, Feedback, PerformanceMetric) exist in Prisma schema
- [ ] User authentication flow works

## Backend Implementation Phases

### Phase 1: User Performance Endpoints (30 min)

**File**: `backend/src/controllers/user.controller.js`

- [ ] Add `getPerformanceMetrics` method
  - Query PerformanceMetric table
  - Filter by executiveId, month, year
  - Aggregate results
  - Return aggregated metrics

- [ ] Add `getPerformanceBreakdown` method
  - Support grouping: bankwise, productwise, bktwise
  - Calculate count and POS for each category
  - Support view types: count, poswise

- [ ] Add `getTodaysActions` method
  - Find feedbacks with ptp_date = today
  - Filter by executiveId
  - Include related case data
  - Order by date

- [ ] Add `getUpcomingActions` method
  - Find feedbacks with ptp_date in next N days
  - Parameter: days (default 7)
  - Filter by executiveId
  - Order by ptp_date ascending

**Routes to add** in `backend/src/routes/user.routes.js`:
```javascript
router.get('/:id/performance-metrics', authenticate, getPerformanceMetrics);
router.get('/:id/performance-breakdown', authenticate, getPerformanceBreakdown);
router.get('/:id/todays-actions', authenticate, getTodaysActions);
router.get('/:id/upcoming-actions', authenticate, getUpcomingActions);
```

**Testing**:
```bash
GET /api/v1/users/USER_ID/performance-metrics?timeframe=month
GET /api/v1/users/USER_ID/performance-breakdown?groupBy=bankwise&viewType=count
GET /api/v1/users/USER_ID/todays-actions
GET /api/v1/users/USER_ID/upcoming-actions?days=7
```

### Phase 2: Cases Endpoints (20 min)

**File**: `backend/src/controllers/cases.controller.js`

- [ ] Add `getAssignedCases` method
  - Query cases by executiveId
  - Optional: filter by status parameter
  - Include feedbacks in response
  - Order by createdAt descending

- [ ] Add `getCaseById` method
  - Query single case by ID
  - Include all feedbacks
  - Include executive details
  - Include case history

**Routes to add** in `backend/src/routes/cases.routes.js`:
```javascript
router.get('/assigned/:userId', authenticate, getAssignedCases);
router.get('/:id', authenticate, getCaseById);
```

**Testing**:
```bash
GET /api/v1/cases/assigned/USER_ID
GET /api/v1/cases/assigned/USER_ID?status=PENDING
GET /api/v1/cases/CASE_ID
```

### Phase 3: PTP Alert Endpoints (30 min)

**File**: `backend/src/controllers/feedback.controller.js`

- [ ] Add `getPTPAlerts` method
  - Find all feedbacks with ptp_date ≤ today
  - Filter: not paid, not broken PTP
  - Include case details
  - Calculate overdue days
  - Determine severity (high > 7 days, medium ≤ 7 days)
  - Order by ptp_date ascending

- [ ] Add `getPTPAlertsByUser` method
  - Same as above but filter by executiveId
  - User-specific alerts only

- [ ] Add `updatePTPDate` method
  - PATCH endpoint to update ptp_date
  - Set ptp_broken = false
  - Return updated feedback

- [ ] Add `markPTPBroken` method
  - PATCH endpoint to mark PTP as broken
  - Set ptp_broken = true
  - Useful for manual overrides

**Routes to add** in `backend/src/routes/feedback.routes.js`:
```javascript
router.get('/alerts/ptp', authenticate, getPTPAlerts);
router.get('/alerts/ptp/:userId', authenticate, getPTPAlertsByUser);
router.patch('/:id/ptp-date', authenticate, updatePTPDate);
router.patch('/:id/ptp-broken', authenticate, markPTPBroken);
```

**Testing**:
```bash
GET /api/v1/feedbacks/alerts/ptp
GET /api/v1/feedbacks/alerts/ptp/USER_ID
PATCH /api/v1/feedbacks/FEEDBACK_ID/ptp-date -d '{"ptp_date":"2026-02-20"}'
PATCH /api/v1/feedbacks/FEEDBACK_ID/ptp-broken
```

## Implementation Tips

### Database Query Optimization
```javascript
// Use includes for relationships (avoid N+1 queries)
await prisma.case.findMany({
  where: { executiveId: userId },
  include: { feedbacks: true, executive: true }
});

// Use select to limit fields
await prisma.feedback.findMany({
  where: { ptp_date: { lte: today } },
  select: { id: true, case: { select: { acc_id: true } } }
});
```

### Date Handling
```javascript
// Get today (start of day)
const today = new Date();
today.setHours(0, 0, 0, 0);

// Check if date is today
const isToday = date.toDateString() === new Date().toDateString();

// Add days for range queries
const futureDate = new Date(today);
futureDate.setDate(futureDate.getDate() + 7);
```

### Aggregation Queries
```javascript
// Group by category
const grouped = {};
results.forEach(item => {
  const key = item.category;
  if (!grouped[key]) grouped[key] = { count: 0, total: 0 };
  grouped[key].count++;
  grouped[key].total += item.amount;
});

const breakdown = Object.entries(grouped).map(([key, val]) => ({
  category: key,
  count: val.count,
  total: val.total
}));
```

### Error Handling
```javascript
// Consistent error response format
if (!user) {
  return res.status(404).json({
    success: false,
    message: 'User not found'
  });
}

// Use try-catch in async functions
try {
  const result = await prisma.case.findMany({...});
  return res.status(200).json({
    success: true,
    data: { cases: result }
  });
} catch (error) {
  next(error); // Pass to error middleware
}
```

## Testing Workflow

### 1. Unit Tests
```bash
# Test individual endpoints with Postman or curl
curl http://localhost:5000/api/v1/users/SAMPLE_ID/performance-metrics
```

### 2. Integration Tests
```javascript
// Example test case
describe('Performance Metrics', () => {
  it('should return aggregated metrics for timeframe', async () => {
    const res = await api.get('/users/123/performance-metrics?timeframe=month');
    expect(res.status).toBe(200);
    expect(res.body.data.metrics).toBeDefined();
    expect(res.body.data.metrics.total_cases).toBeGreaterThanOrEqual(0);
  });
});
```

### 3. Frontend Integration Tests
```bash
# Navigate to /employee route
# Check if dashboard loads data
# Verify tabs switch correctly
# Test CSV downloads
# Check notifications
```

## Performance Considerations

### Database Indexes Needed
```prisma
// Already in schema, verify they exist:
@@index([emp_id])
@@index([executiveId])
@@index([bkt])
@@index([product_type])
@@index([month, year])
@@index([ptp_date])  // Add this if missing
```

### Response Time Targets
- User profile: < 100ms
- Performance metrics: < 500ms
- Cases list (100 records): < 1s
- PTP alerts: < 500ms

### Caching Strategy
```javascript
// Cache performance metrics for 5 minutes
const cacheKey = `perf_${userId}_${timeframe}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const result = /* fetch from DB */;
await redis.setex(cacheKey, 300, JSON.stringify(result));
return result;
```

## Validation & Error Handling

### Input Validation
```javascript
// Validate user exists
const user = await prisma.user.findUnique({ where: { id: userId } });
if (!user) throw new Error('User not found');

// Validate date format
if (!isValidDate(dateString)) throw new Error('Invalid date format');

// Validate enum values
const validTimeframes = ['month', 'quarter', 'year'];
if (!validTimeframes.includes(timeframe)) throw new Error('Invalid timeframe');
```

### Response Format Consistency
```javascript
// Always use this format
{
  success: true/false,
  data: { /* actual data */ },
  message: 'optional message',
  error: 'optional error details'
}
```

## Deployment Checklist

- [ ] All endpoints implemented
- [ ] Tests written and passing
- [ ] Code reviewed
- [ ] Database migrations run
- [ ] Environment variables configured
- [ ] CORS settings updated if needed
- [ ] Deployed to staging
- [ ] Full E2E testing on staging
- [ ] Performance testing completed
- [ ] Security review passed
- [ ] Documentation updated
- [ ] Ready for production deployment

## Rollback Plan

If issues occur:

1. **Frontend Rollback** (Quick - 2 min)
   - Update `projectRoute.jsx` to use old `Employee` component
   - Restart front end server
   - Users redirected to old dashboard

2. **Backend Rollback** (Quick - 5 min)
   - Revert controller changes
   - Revert route changes
   - Restart backend server
   - API calls fail gracefully

3. **Data Rollback**
   - No data changes made
   - Database unchanged
   - Safe to switch between versions

## Post-Implementation Support

### Monitoring
- [ ] Set up logging for new endpoints
- [ ] Monitor API response times
- [ ] Track error rates
- [ ] Alert on performance degradation

### Analytics
- [ ] Track user dashboard usage
- [ ] Monitor feature adoption
- [ ] Collect performance metrics insights

### Feedback
- [ ] Collect user feedback on new dashboard
- [ ] Track bug reports
- [ ] Plan improvements for v2

## Timeline Estimate

| Task | Time | Dependencies |
|------|------|--------------|
| Phase 1 (User endpoints) | 30 min | None |
| Phase 2 (Cases endpoints) | 20 min | Phase 1 complete |
| Phase 3 (PTP endpoints) | 30 min | Phases 1-2 complete |
| Testing & QA | 60 min | All phases complete |
| Deployment | 30 min | All tests passing |
| **Total** | **2.5 hours** | Sequential |

## Success Criteria

✅ **All endpoints responding correctly**
- Status 200 for successful requests
- Correct status codes for errors (404, 401, etc.)
- Response format matches documentation

✅ **Data accuracy**
- Performance metrics aggregate correctly
- PTP alerts show only overdue items
- Cases filtered properly by status
- Dates calculated correctly

✅ **Performance**
- All endpoints respond < 1 second
- No N+1 queries
- Database indexes working

✅ **User experience**
- Dashboard loads all data
- Filters work correctly
- CSV downloads contain correct data
- Notifications trigger appropriately

✅ **Error handling**
- Invalid inputs rejected gracefully
- Network errors handled
- Missing data returns empty rather than crashing
- User sees helpful error messages

## Documentation
- [ ] Backend code documented with JSDoc comments
- [ ] README updated with new endpoints
- [ ] API routes documented
- [ ] Update deployment guide
- [ ] Team briefing completed

---

**Ready to implement?** Follow phases 1-3 in order. Estimated time: 2.5 hours total.

**Questions?** Refer to `BACKEND_IMPLEMENTATION_GUIDE.md` for detailed code examples.

**Ready to deploy?** Complete all checklist items above.
