/**
 * Employee Dashboard - Backend API Setup
 * 
 * This file documents the required API endpoints for the Employee Dashboard.
 * These endpoints should be added to the backend controllers and routes.
 */

// ============================================================
// USER ROUTES - /api/v1/users
// ============================================================

/**
 * GET /api/v1/users/:id
 * Description: Get user profile information
 * Auth: Required
 * Response: { success: true, data: { user } }
 */

/**
 * GET /api/v1/users/:id/performance-metrics
 * Description: Get performance metrics for a specific timeframe
 * Query Params:
 *   - timeframe: 'month' | 'quarter' | 'year'
 * Auth: Required
 * Response: { 
 *   success: true, 
 *   data: { 
 *     metrics: {
 *       total_cases: number,
 *       visited_cases: number,
 *       total_pos: number,
 *       recovered_pos: number,
 *       earnings: number,
 *       breakdown?: Array
 *     }
 *   }
 * }
 */

/**
 * GET /api/v1/users/:id/performance-breakdown
 * Description: Get performance breakdown by category
 * Query Params:
 *   - groupBy: 'bankwise' | 'productwise' | 'bktwise'
 *   - viewType: 'count' | 'poswise'
 * Auth: Required
 * Response: {
 *   success: true,
 *   data: {
 *     breakdown: [
 *       { category: string, count: number, pos: number }
 *     ]
 *   }
 * }
 */

/**
 * GET /api/v1/users/:id/todays-actions
 * Description: Get cases where next action date is today
 * Auth: Required
 * Response: {
 *   success: true,
 *   data: { actions: Array<Case> }
 * }
 */

/**
 * GET /api/v1/users/:id/upcoming-actions
 * Description: Get cases with upcoming action dates
 * Query Params:
 *   - days: number (default: 7)
 * Auth: Required
 * Response: {
 *   success: true,
 *   data: { actions: Array<Case> }
 * }
 */

// ============================================================
// CASES ROUTES - /api/v1/cases
// ============================================================

/**
 * GET /api/v1/cases/assigned/:userId
 * Description: Get all cases assigned to a user
 * Query Params:
 *   - status?: 'PENDING' | 'VISITED' | 'PAID' | 'CLOSED'
 * Auth: Required
 * Response: {
 *   success: true,
 *   data: { cases: Array<Case> }
 * }
 */

/**
 * GET /api/v1/cases/:id
 * Description: Get single case with all feedbacks
 * Auth: Required
 * Response: {
 *   success: true,
 *   data: { case: Case }
 * }
 */

// ============================================================
// FEEDBACKS ROUTES - /api/v1/feedbacks
// ============================================================

/**
 * POST /api/v1/feedbacks
 * Description: Submit feedback for a case
 * Auth: Required (field_executive role)
 * Body:
 *   - caseId: string (required)
 *   - visit_code: string (required)
 *   - meeting_place: string (required)
 *   - asset_status: string
 *   - remarks: string (required)
 *   - photo: File (required)
 *   - lat: number (required)
 *   - lng: number (required)
 *   - ptp_date: string (ISO date, optional)
 * Response: {
 *   success: true,
 *   data: { feedback: Feedback }
 * }
 */

/**
 * GET /api/v1/feedbacks/case/:caseId
 * Description: Get all feedbacks for a case
 * Auth: Required
 * Response: {
 *   success: true,
 *   data: { feedbacks: Array<Feedback> }
 * }
 */

/**
 * GET /api/v1/feedbacks/executive/:executiveId
 * Description: Get all feedbacks submitted by an executive
 * Auth: Required
 * Response: {
 *   success: true,
 *   data: { feedbacks: Array<Feedback> }
 * }
 */

/**
 * GET /api/v1/feedbacks/alerts/ptp
 * Description: Get PTP alerts (unpaid accounts with overdue PTP dates)
 * Auth: Required
 * Response: {
 *   success: true,
 *   data: {
 *     alerts: [
 *       {
 *         feedback: Feedback,
 *         case: Case,
 *         overdueDays: number,
 *         severity: 'high' | 'medium' | 'low'
 *       }
 *     ]
 *   }
 * }
 */

/**
 * GET /api/v1/feedbacks/alerts/ptp/:userId
 * Description: Get PTP alerts for a specific user
 * Auth: Required
 * Response: {
 *   success: true,
 *   data: { alerts: Array<Alert> }
 * }
 */

/**
 * PATCH /api/v1/feedbacks/:id/ptp-broken
 * Description: Mark a PTP as broken
 * Auth: Required
 * Response: {
 *   success: true,
 *   data: { feedback: Feedback }
 * }
 */

/**
 * PATCH /api/v1/feedbacks/:id/ptp-date
 * Description: Update PTP date for a feedback
 * Auth: Required
 * Body:
 *   - ptp_date: string (ISO date)
 * Response: {
 *   success: true,
 *   data: { feedback: Feedback }
 * }
 */

// ============================================================
// NOTIFICATIONS ROUTES - /api/v1/notifications
// ============================================================

/**
 * GET /api/v1/notifications/pending
 * Description: Get pending notifications for the user
 * Auth: Required
 * Response: {
 *   success: true,
 *   data: { notifications: Array<Notification> }
 * }
 */

/**
 * POST /api/v1/notifications/:id/read
 * Description: Mark notification as read
 * Auth: Required
 * Response: {
 *   success: true,
 *   data: { notification: Notification }
 * }
 */

/**
 * DELETE /api/v1/notifications/:id
 * Description: Delete a notification
 * Auth: Required
 * Response: {
 *   success: true,
 *   message: 'Notification deleted'
 * }
 */

// ============================================================
// DATA MODELS
// ============================================================

/**
 * Case Model
 * {
 *   id: string,
 *   acc_id: string,
 *   customer_name: string,
 *   phone_number: string,
 *   address: string,
 *   pincode: string,
 *   lat: number,
 *   lng: number,
 *   pos_amount: number,
 *   overdue_amount: number,
 *   dpd: number,
 *   bkt: string,
 *   product_type: string,
 *   bank_name: string,
 *   npa_status: string,
 *   priority: string,
 *   executiveId: string,
 *   status: 'PENDING' | 'VISITED' | 'PAID' | 'CLOSED',
 *   lastVisitAt: datetime,
 *   feedbacks: Array<Feedback>,
 *   createdAt: datetime,
 *   updatedAt: datetime
 * }
 */

/**
 * Feedback Model
 * {
 *   id: string,
 *   caseId: string,
 *   executiveId: string,
 *   lat: number,
 *   lng: number,
 *   distance_from_address: number,
 *   is_fake_visit: boolean,
 *   visit_code: string,
 *   meeting_place: string,
 *   asset_status: string,
 *   remarks: string,
 *   photo_url: string,
 *   ptp_date: datetime,
 *   ptp_broken: boolean,
 *   device_info: object,
 *   visitedAt: datetime,
 *   createdAt: datetime,
 *   updatedAt: datetime
 * }
 */

/**
 * PerformanceMetric Model
 * {
 *   id: string,
 *   executiveId: string,
 *   month: number,
 *   year: number,
 *   total_cases: number,
 *   visited_cases: number,
 *   total_pos: number,
 *   recovered_pos: number,
 *   bkt: string,
 *   product: string,
 *   earnings: number,
 *   createdAt: datetime,
 *   updatedAt: datetime
 * }
 */

/**
 * Notification Model
 * {
 *   id: string,
 *   userId: string,
 *   type: 'ptp_alert' | 'action_due' | 'task_assigned' | 'feedback_rejected',
 *   title: string,
 *   message: string,
 *   relatedCaseId?: string,
 *   relatedFeedbackId?: string,
 *   isRead: boolean,
 *   createdAt: datetime
 * }
 */

export default {};
