/**
 * Feedback Routes
 */

const express = require('express');
const multer = require('multer');
const feedbackController = require('../controllers/feedback.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// All routes require authentication
router.use(authenticate);

/**
 * Feedback Submission Routes
 */

// Submit feedback (Executive) - with file upload support
router.post('/', upload.single('photo'), authorize(['executive']), feedbackController.submitFeedback);

// Get all feedbacks for a case
router.get('/case/:caseId', feedbackController.getFeedbacksByCase);

// Get all feedbacks for an executive
router.get('/executive/:executiveId', feedbackController.getFeedbacksByExecutive);

// Get single feedback (MUST BE LAST - dynamic id)
router.get('/:feedbackId', feedbackController.getFeedbackById);

/**
 * Audit Routes (Supervisor & Admin)
 */

// Mark feedback as fake visit (manual audit)
router.post('/:feedbackId/mark-fake', authorize(['super_admin', 'supervisor']), feedbackController.markAsFakeVisit);

// Reject feedback
router.delete('/:feedbackId', authorize(['super_admin', 'supervisor']), feedbackController.rejectFeedback);

// Get fake visit summary
router.get('/audit/fake-visits', authorize(['super_admin', 'supervisor']), feedbackController.getFakeVisitSummary);

/**
 * PTP (Promise to Pay) Routes
 */

// Get PTP alerts (accessible to executives and supervisors)
router.get('/alerts/ptp', authorize(['executive', 'super_admin', 'supervisor']), feedbackController.getPTPAlerts);

// Check for broken PTPs (scheduled task)
router.post('/check-broken-ptp', authorize(['super_admin']), feedbackController.checkBrokenPTP);

module.exports = router;
