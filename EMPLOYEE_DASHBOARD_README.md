# Employee Dashboard - Complete Implementation Guide

## Overview

The Employee Dashboard is a comprehensive tool for field executives to manage their daily tasks, track performance, submit feedback with GPS validation, and receive intelligent notifications for pending actions.

## Features

### 1. **Overview Tab** 📋
- **Today's Priority Cases**: Shows all cases with next action due today
  - Quick access to case details (Account ID, Customer Name, Amount, Product, Bank)
  - One-click feedback submission
  - CSV download for offline reference
  
- **Action Alerts**: Real-time notifications for overdue PTP (Promise to Pay) dates
  - Shows severity status
  - Indicates days overdue
  - Prioritizes by urgency

- **Visit Plan**: Intelligent scheduling for next 7 days
  - Downloads all cases with pending next action dates
  - Organized by date
  - Includes priority and case details

### 2. **Performance Tab** 📊
- **Performance Filtering**:
  - Timeframe: Month, Quarter, Year
  - Group By: Overall, Bank-wise, Product-wise, BKT-wise
  - View Type: Count-wise (volume) or POS-wise (value-based)

- **Key Metrics**:
  - Total Cases Assigned
  - Visited Cases (completed)
  - Total POS (Principal Outstanding Amount)
  - Recovered POS (Collections)

- **Category Breakdown**: 
  - Detailed performance by bank, product, or bucket
  - Easy comparison across categories

### 3. **Feedback Form Tab** 📝
Complete feedback form with all features from Employee.jsx, including:

- **Photo Capture**:
  - Live camera capture with GPS metadata
  - Automatic timestamp recording
  - GPS coordinates in LAT/LON format
  - Retake option

- **Visit Information**:
  - Account ID (auto-populated)
  - Visit Code (Paid, PTP, RTP, Not Available, etc.)
  - Meeting Place (Home, Office, Farm, Anywhere else)
  - Custom location with distance for "Anywhere else"

- **Person Met**:
  - Who Met (Customer or Relations list)
  - Name of person (auto-required if not customer)
  - Relationship description for "Someone else"

- **Asset Status**:
  - Available/Not Available toggle
  - If not available: Location, Reason (Sold, Stolen, Pledged)

- **Next Action Date**:
  - Mandatory for non-paid accounts
  - Creates automatic notifications and alerts

- **Visit Observations**:
  - Detailed remarks textarea
  - Required field for submission

### 4. **Profile Tab** 👤
- View user profile information
- Employee ID and role information
- Total cases assigned count

## Notification System

### PTP Alert Notifications

The dashboard includes intelligent notification triggers:

1. **Initial Alert**: When a case's next action date is set
2. **Recurring Alerts**: 
   - Every 3 hours starting from 9 AM
   - Until 7 PM same day
   - Only for unpaid accounts
   - Browser notifications (if permitted)

3. **Smart Checks**:
   - Time-based filtering (9 AM - 7 PM)
   - Account payment status verification
   - No duplicate notifications

### Browser Notification Permission

The dashboard automatically requests browser notification permission on first load.

## Data Downloads

### 1. Today's Cases CSV
**File**: `today-cases-YYYY-MM-DD.csv`

**Columns**:
- Account ID
- Customer Name
- Phone
- POS Amount
- Bucket
- Product
- Bank
- Address
- Last Feedback

### 2. Visit Plan CSV
**File**: `visit-plan-YYYY-MM-DD.csv`

**Columns**:
- Account ID
- Customer Name
- Next Action Date
- Priority
- Address
- Phone
- POS Amount

## Technical Implementation

### Frontend Stack
- **Framework**: React with Hooks
- **State Management**: React Context (AuthContext)
- **API Client**: Axios with interceptors
- **Styling**: Custom CSS with modern design system
- **Responsive**: Mobile-first, tablet & desktop optimized

### API Endpoints Required

#### User Routes
```
GET /api/v1/users/:id - Get profile
GET /api/v1/users/:id/performance-metrics - Performance data
GET /api/v1/users/:id/performance-breakdown - Category breakdown
GET /api/v1/users/:id/todays-actions - Cases due today
GET /api/v1/users/:id/upcoming-actions - Next 7 days cases
```

#### Cases Routes
```
GET /api/v1/cases/assigned/:userId - All assigned cases
GET /api/v1/cases/:id - Single case details
```

#### Feedback Routes
```
POST /api/v1/feedbacks - Submit feedback
GET /api/v1/feedbacks/case/:caseId - Case feedbacks
GET /api/v1/feedbacks/executive/:userId - User feedbacks
GET /api/v1/feedbacks/alerts/ptp - All PTP alerts
GET /api/v1/feedbacks/alerts/ptp/:userId - User PTP alerts
PATCH /api/v1/feedbacks/:id/ptp-date - Update PTP date
PATCH /api/v1/feedbacks/:id/ptp-broken - Mark PTP broken
```

## Installation & Setup

### 1. Update Imports
The routing has been updated in `src/route/projectRoute.jsx`:
```jsx
import EmployeeDashboard from "../pages/EmployeeDashboard";
// ...
<Route path="/employee" element={user ? <EmployeeDashboard /> : <Navigate to="/auth/login" />} />
```

### 2. Backend Endpoints
Implement the required endpoints as documented in `BACKEND_IMPLEMENTATION_GUIDE.md`:
- Add routes to respective controller files
- Implement data aggregation for performance metrics
- Set up PTP alert logic

### 3. Styling
- CSS file: `src/styles/EmployeeDashboard.css`
- Pre-built theme with Slate/Blue color scheme
- Fully responsive design

### 4. API Service
Frontend API calls are centralized in `src/api/dashboardService.js`:
```javascript
import {
  getUserProfile,
  getPerformanceMetrics,
  getAssignedCases,
  submitFeedback,
  getPTPAlerts,
  downloadCasesAsCSV,
  downloadVisitPlanAsCSV
} from '../api/dashboardService';
```

## Usage Flow

### Daily Workflow
1. **Morning Check-in**: Login → Overview tab shows today's cases
2. **Review Tasks**: Check Action Alerts for overdue PTPs
3. **Plan Day**: Download Visit Plan for scheduling
4. **Field Work**: 
   - Navigate to Feedback Form
   - Select case
   - Capture photo with GPS
   - Fill form details
   - Submit feedback
5. **Sync Updates**: Dashboard auto-refreshes every 5 minutes

### Performance Tracking
1. Go to Performance tab
2. Select timeframe (month/quarter/year)
3. Choose group by (overall/bank/product/bkt)
4. Switch between count-wise and POS-wise views
5. Track progress and identify high-performing categories

## Design System

### Colors
- **Primary**: #0ea5e9 (Sky Blue)
- **Success**: #22c55e (Green)
- **Warning**: #f59e0b (Amber)
- **Error**: #ef4444 (Red)
- **Background**: #0f172a (Dark Slate)
- **Card**: #1e293b (Slate)

### Typography
- **Font**: 'Instrument Sans', System fonts
- **Heading**: 900 weight, 2rem (header)
- **Title**: 700 weight, 1.25rem
- **Body**: 400 weight, 0.95rem

### Spacing
- Consistent 1.5rem gaps
- 2rem padding in containers
- 1rem internal spacing

## Mobile Optimization

- Stacked layout on screens < 768px
- Touch-friendly buttons (min 44px height)
- Responsive forms with full-width inputs
- Modal optimized for mobile viewing
- Tab navigation remains accessible

## Browser Notifications

### Permission Flow
1. User clicks notification button
2. Browser requests permission
3. If granted, alerts show as browser notifications
4. Rich notifications with case details

### Notification Structure
```
Title: "Action Required"
Body: "Account <AccId> needs update. PTP: <Date>"
Icon: 🔔
```

## Error Handling

- Graceful API error messages
- Form validation before submission
- GPS fallback (shows "GPS Access Denied" if unavailable)
- Network error handling with retry capability
- Photo capture permission handling

## Performance Optimization

- Data refreshes every 5 minutes (configurable)
- Lazy loading of modules
- CSV generation in-memory (no server call)
- Efficient re-renders with React hooks
- Debounced search and filters

## Feature Roadmap

### Phase 2 (Upcoming)
- [ ] Real-time GPS tracking during field visit
- [ ] Photo compression and optimization
- [ ] Offline support with sync queue
- [ ] Advanced filters and search
- [ ] Performance analytics charts
- [ ] Team collaboration features

### Phase 3
- [ ] AI-based case recommendation
- [ ] Route optimization for visits
- [ ] Voice note support
- [ ] Multi-language support
- [ ] Advanced reporting dashboard

## Troubleshooting

### Issue: Notifications not working
**Solution**: 
- Check browser notification permissions
- Grant notification access when prompted
- Ensure browser supports Web Notifications API

### Issue: GPS not capturing
**Solution**:
- Check browser location permissions
- Allow "Always" for location access
- Use HTTPS in production (required for GPS)

### Issue: Photo upload failing
**Solution**:
- Check file size (should be < 5MB)
- Verify file format (JPG/PNG)
- Check network connection
- Retry after 5 seconds

### Issue: Form fields not validating
**Solution**:
- Ensure all required fields are filled
- Check for proper date format (YYYY-MM-DD)
- Verify visit code and place selections

## Support & Documentation

For detailed API documentation, see: `src/api/API_DOCUMENTATION.md`
For backend implementation, see: `BACKEND_IMPLEMENTATION_GUIDE.md`

## License

Part of AuthX Portal - All Rights Reserved
