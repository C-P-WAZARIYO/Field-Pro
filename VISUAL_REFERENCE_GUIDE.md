# Employee Dashboard - Visual Reference & Information Architecture

## Layout Structure

### Desktop View (1024px+)
```
┌─────────────────────────────────────────────────────────────────┐
│ 📊 Employee Dashboard                    🔔 [Notifications]      │
│ Welcome, FirstName LastName                                      │
├─────────────────────────────────────────────────────────────────┤
│ [Overview] [Performance] [Feedback Form] [Profile]              │
├─────────────────────────────────────────────────────────────────┤
│                          Main Content Area                       │
│                                                                  │
│  ┌─────────────────────────────────────┐                        │
│  │ 📋 Today's Priority Cases      (3)  │                        │
│  │ [📥 Download Cases]                 │                        │
│  ├─────────────────────────────────────┤                        │
│  │ [Case 1] Account: ACC001            │                        │
│  │ Customer: John Doe | ₹50,000        │                        │
│  │ 📦 Agriculture 🏦 HDFC               │                        │
│  │ [Update Feedback]                   │                        │
│  │                                     │                        │
│  │ [Case 2] Account: ACC002            │                        │
│  │ Customer: Jane Smith | ₹75,000      │                        │
│  │ 📦 Wheels 🏦 ICICI                   │                        │
│  │ [Update Feedback]                   │                        │
│  └─────────────────────────────────────┘                        │
│                                                                  │
│  ┌─────────────────────────────────────┐                        │
│  │ ⚠️ Action Alerts                (2) │                        │
│  ├─────────────────────────────────────┤                        │
│  │ 🔴 ACC003: PTP was Feb 10 | Overdue │                        │
│  │ 🟡 ACC004: PTP was Feb 12 | Overdue │                        │
│  └─────────────────────────────────────┘                        │
│                                                                  │
│  ┌─────────────────────────────────────┐                        │
│  │ 📅 Visit Plan                       │                        │
│  │ Next 7 days schedule based on PTP   │                        │
│  │ [📥 Download Visit Plan]            │                        │
│  └─────────────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

### Tablet View (768px - 1023px)
```
┌──────────────────────────────────┐
│ 📊 Dashboard          🔔         │
│ Welcome, FirstName LastName       │
├──────────────────────────────────┤
│ [Overview]  [Performance]         │
│ [Feedback]  [Profile]             │
├──────────────────────────────────┤
│      Main Content (Full Width)    │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ 📋 Today's Cases      (3)    │ │
│ │ [📥 Download]                │ │
│ │                              │ │
│ │ [Case 1...]  [Case 2...]     │ │
│ └──────────────────────────────┘ │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ ⚠️ Alerts           (2)      │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

### Mobile View (< 768px)
```
┌─────────────────────┐
│ 📊 Dashboard        │
│ Welcome, FirstName  │
│               🔔    │
├─────────────────────┤
│ [Overview]          │
│ [Performance]       │
│ [Feedback]          │
│ [Profile]           │
├─────────────────────┤
│ Main Content        │
│ (Full Width)        │
│                     │
│ ┌─────────────────┐ │
│ │ 📋 Today's     │ │
│ │ Cases      (3) │ │
│ │ [📥 Download]  │ │
│ │                │ │
│ │ [Case 1]       │ │
│ │ [Case 2]       │ │
│ └─────────────────┘ │
│                     │
│ ┌─────────────────┐ │
│ │ ⚠️ Alerts  (2) │ │
│ └─────────────────┘ │
└─────────────────────┘
```

## Tab Content Hierarchy

### Overview Tab
```
📋 Tab: Overview
├── ┌─────────────────────────┐
│   │ TODAY'S PRIORITY CASES │
│   ├─────────────────────────┤
│   │ [📥 Download Cases]     │
│   │                         │
│   │ Task Item 1            │
│   │ ├─ Account: ACC001     │
│   │ ├─ Customer: John Doe  │
│   │ ├─ Amount: ₹50,000     │
│   │ ├─ Details Row         │
│   │ │  💰 ₹50,000          │
│   │ │  📦 Agriculture       │
│   │ │  🏦 HDFC              │
│   │ └─ [Update Feedback]   │
│   │                         │
│   │ Task Item 2            │
│   │ ... similar ...         │
│   └─────────────────────────┘
│
├── ┌─────────────────────────┐
│   │ ACTION ALERTS (PTP)    │
│   ├─────────────────────────┤
│   │ Alert Item 1           │
│   │ ├─ Account: ACC003     │
│   │ ├─ Status: Overdue     │
│   │ └─ Flag: Red           │
│   │                         │
│   │ Alert Item 2           │
│   │ ... similar ...         │
│   └─────────────────────────┘
│
└── ┌─────────────────────────┐
    │ VISIT PLAN (7 Days)    │
    ├─────────────────────────┤
    │ Scheduled by date       │
    │ [📥 Download Visit Plan]│
    └─────────────────────────┘
```

### Performance Tab
```
📊 Tab: Performance
└── ┌──────────────────────────┐
    │ FILTER SECTION           │
    ├──────────────────────────┤
    │ Timeframe: [Month ▼]     │
    │ Group By: [Overall ▼]    │
    │ View Type: [Count ▼]     │
    └──────────────────────────┘
    
    ┌──────────────────────────┐
    │ PERFORMANCE METRICS GRID │
    ├──────────────────────────┤
    │ ┌──────┐ ┌──────┐        │
    │ │Total │ │Visited│       │
    │ │Cases │ │Cases │        │
    │ │ 150  │ │ 95   │        │
    │ └──────┘ └──────┘        │
    │ ┌──────┐ ┌──────┐        │
    │ │Total │ │Recovered│    │
    │ │ POS  │ │ POS   │       │
    │ │₹2.5M │ │₹1.2M  │       │
    │ └──────┘ └──────┘        │
    └──────────────────────────┘
    
    ┌──────────────────────────┐
    │ CATEGORY BREAKDOWN       │
    ├──────────────────────────┤
    │ Bank A     | 45 cases    │
    │ Bank B     | 38 cases    │
    │ Bank C     | 67 cases    │
    └──────────────────────────┘
```

### Feedback Form Tab
```
📝 Tab: Feedback Form
└── ┌──────────────────────────┐
    │ CASE SELECTOR (Initially)│
    ├──────────────────────────┤
    │ ┌────────┐ ┌────────┐   │
    │ │ACC001  │ │ACC002  │   │
    │ │John Doe│ │Jane    │   │
    │ │₹50,000 │ │₹75,000 │   │
    │ └────────┘ └────────┘   │
    │                          │
    │ ┌────────┐ ┌────────┐   │
    │ │ACC003  │ │ACC004  │   │
    │ │Michael │ │Sarah   │   │
    │ │₹60,000 │ │₹45,000 │   │
    │ └────────┘ └────────┘   │
    └──────────────────────────┘
    
    ↓ (Click case to select)
    
    FEEDBACK FORM (Modal/Full Screen)
    ┌──────────────────────────┐
    │ Feedback for ACC001      │
    │ John Doe | ₹50,000       │
    ├──────────────────────────┤
    │ [📸 CAMERA SECTION]      │
    │ ┌────────────────────┐   │
    │ │  📸 Tap to Snap    │   │
    │ │    Evidence        │   │
    │ └────────────────────┘   │
    │                          │
    │ [VISIT CODE]             │
    │ [-- Select Code --] ▼    │
    │                          │
    │ [WHO MET]                │
    │ [-- Select --] ▼         │
    │ Person Name: [_______]   │
    │                          │
    │ [MEETING PLACE]          │
    │ [-- Select --] ▼         │
    │ Distance: [_______]      │
    │                          │
    │ [ASSET STATUS]           │
    │ ◉ Yes  ○ No              │
    │                          │
    │ [NEXT ACTION DATE]       │
    │ [_______] (Date Picker)  │
    │                          │
    │ [OBSERVATIONS]           │
    │ [________________       │
    │  ________________       │
    │  ________________]      │
    │                          │
    │ [Cancel] [Submit ✨]    │
    └──────────────────────────┘
```

### Profile Tab
```
👤 Tab: Profile
└── ┌──────────────────────────┐
    │ USER PROFILE INFORMATION │
    ├──────────────────────────┤
    │ ┌────────────────────┐   │
    │ │ First Name         │   │
    │ │ John               │   │
    │ └────────────────────┘   │
    │                          │
    │ ┌────────────────────┐   │
    │ │ Last Name          │   │
    │ │ Doe                │   │
    │ └────────────────────┘   │
    │                          │
    │ ┌────────────────────┐   │
    │ │ Email              │   │
    │ │ john@example.com   │   │
    │ └────────────────────┘   │
    │                          │
    │ ┌────────────────────┐   │
    │ │ Phone              │   │
    │ │ +91-9123456789     │   │
    │ └────────────────────┘   │
    │                          │
    │ ┌────────────────────┐   │
    │ │ Employee ID        │   │
    │ │ EMP-2025-001       │   │
    │ └────────────────────┘   │
    │                          │
    │ ┌────────────────────┐   │
    │ │ Cases Assigned     │   │
    │ │ 142                │   │
    │ └────────────────────┘   │
    └──────────────────────────┘
```

## Color Scheme Reference

### Primary Colors
- **Blue (Primary)**: #0ea5e9 - CTA, links, active states
- **Dark Slate (Background)**: #0f172a - Main background
- **Slate (Cards)**: #1e293b - Card backgrounds

### Semantic Colors
- **Green (Success)**: #22c55e - Success messages, positive metrics
- **Red (Error)**: #ef4444 - Errors, alerts, critical items
- **Amber (Warning)**: #f59e0b - Warnings, caution items

### Text Colors
- **White**: #fff - Primary text on dark backgrounds
- **Light Gray**: #f1f5f9 - Main text color
- **Medium Gray**: #cbd5e1 - Secondary text
- **Dark Gray**: #64748b - Tertiary text, labels

## Component Interaction Flow

```
User Logs In
    ↓
Navigates to /employee
    ↓
Dashboard Loads
├─ Fetch user profile
├─ Fetch assigned cases
├─ Fetch performance metrics
├─ Fetch PTP alerts
└─ Setup notification checker
    ↓
Display Overview Tab (Default)
    ├─ Today's Priority Cases [Show cases with today's PTP]
    ├─ Action Alerts [Show overdue PTPs]
    └─ Visit Plan [Show next 7 days]
    ↓
User Actions Available:
├─ [Switch Tabs]
│   ├─ performance → Load metrics & breakdown
│   ├─ feedback → Show case selector
│   └─ profile → Show user info
├─ [Update Feedback]
│   ├─ Select Case
│   ├─ Fill Form
│   └─ Submit Feedback
├─ [Download CSV]
│   ├─ Today's Cases
│   └─ Visit Plan
└─ [Check Notifications]
    └─ Browser permission + alert display
```

## Data Flow Diagram

```
Dashboard Component
    ↓
├─── User Profile Data
│    ↓
│    useEffect (on mount)
│    ↓
│    api.get(/users/:id)
│    ↓
│    setProfile(data)
│    ↓
│    Display in Header & Profile Tab
│
├─── Performance Metrics
│    ↓
│    api.get(/users/:id/performance-metrics)
│    ↓
│    setPerformance(data)
│    ↓
│    Display in Performance Tab
│    ├─ Performance Cards
│    └─ Category Breakdown
│
├─── Assigned Cases
│    ↓
│    api.get(/cases/assigned/:id)
│    ↓
│    setCases(data)
│    ↓
│    Used by:
│    ├─ Today's Tasks (filter)
│    ├─ Case Selector (display)
│    └─ Visit Plan (filter)
│
├─── PTP Alerts
│    ↓
│    api.get(/feedbacks/alerts/ptp)
│    ↓
│    setPtpAlerts(data)
│    ↓
│    setNotificationCount(length)
│    ↓
│    Display in Action Alerts
│
└─── Notification Checker
     ↓
     setupNotificationChecker()
     ↓
     Check Every 3 Hours (9 AM - 7 PM)
     ↓
     Filter unpaid accounts with overdue PTP
     ↓
     Send Browser Notification
```

## Form Validation Flow

```
User Submits Feedback
    ↓
Validation Check: isReadyToSubmit()
    ├─ ✓ Photo captured?
    ├─ ✓ Visit code selected?
    ├─ ✓ Who met selected?
    │   └─ If not "Customer":
    │       ├─ ✓ Person name entered?
    │       └─ If "Someone else":
    │           └─ ✓ Relationship described?
    ├─ ✓ Meeting place selected?
    │   └─ If "Anywhere else":
    │       ├─ ✓ Custom location entered?
    │       └─ ✓ Distance entered?
    ├─ ✓ Asset status set?
    │   └─ If "No" (not available):
    │       ├─ ✓ Asset location entered?
    │       └─ ✓ Reason selected?
    ├─ ✓ Next action date set?
    │   └─ If code ≠ "Paid"
    └─ ✓ Observations entered?
        ↓
    All Valid? → Button Enabled ✓
    Missing Any? → Button Disabled ✗
        ↓
    [Submit] Clicked
        ↓
    Form Data Prepared
        ↓
    POST /api/v1/feedbacks
        ↓
    Success → Close form + Show success message
    Error → Show error message + Keep form open
```

## State Management Overview

```
EmployeeDashboard Component State:
├─ activeTab (string) - Current tab
├─ profile (object) - User profile data
├─ performance (object) - Performance metrics
├─ cases (array) - All assigned cases
├─ todayTasks (array) - Cases with today's PTP
├─ ptpAlerts (array) - Overdue PTP alerts
├─ loading (boolean) - Loading state
├─ notificationCount (number) - Alert count
├─ selectedCase (object) - Currently selected case
├─ showFeedbackForm (boolean) - Show/hide form
└─ perfFilter (object)
   ├─ timeframe (string)
   ├─ groupBy (string)
   └─ viewType (string)

FeedbackForm Component State:
├─ photo (object) - Photo blob
├─ metaData (object)
│   ├─ location (string)
│   └─ time (string)
├─ feedback (object)
│   ├─ code (string)
│   ├─ whoMet (string)
│   ├─ metName (string)
│   ├─ relation (string)
│   ├─ place (string)
│   ├─ customPlace (string)
│   ├─ distance (string)
│   ├─ assetAvailable (string)
│   ├─ assetLocation (string)
│   ├─ assetStatus (string)
│   ├─ nextActionDate (string)
│   └─ fullFeedback (string)
└─ submitting (boolean) - Submission state
```

## Responsive Breakpoints

```
Mobile: 0px - 480px
├─ Single column layout
├─ Full-width buttons
├─ Stack cards vertically
└─ Touch-optimized padding

Tablet Portrait: 481px - 768px
├─ Two column grid where applicable
├─ Medium padding
├─ Optimized modals
└─ Larger touch targets

Tablet Landscape: 769px - 1024px
├─ 2-4 column grid
├─ Mixed layouts
└─ Balanced spacing

Desktop: 1025px+
├─ Full multi-column layouts
├─ Side-by-side cards
├─ Optimal readability
└─ Maximum information density
```

## Key Performance Indicators (KPIs)

```
Metrics Tracked:
├─ Total Cases
│   └─ Volume of work assigned
├─ Visited Cases
│   └─ Work completion rate
├─ Total POS
│   └─ Total amount to recover
├─ Recovered POS
│   └─ Collections achieved
├─ Earnings
│   └─ Payout calculated
├─ Alerts (PTP)
│   └─ Action items requiring attention
└─ Performance by:
    ├─ Bank (which bank)
    ├─ Product (loan type)
    └─ BKT (delinquency status)
```

---

This visual reference guide provides a complete overview of the Employee Dashboard structure, layout, styling, and data flow.
