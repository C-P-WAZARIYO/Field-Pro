/**
 * Case Routes
 */

const express = require('express');
const casesController = require('../controllers/cases.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Case Management Routes
 */

// Create a single case
router.post('/', authorize(['super_admin', 'supervisor']), casesController.createCase);

// Get all cases (with filters) - Supervisor & Admin
router.get('/', authorize(['super_admin', 'supervisor', 'manager']), casesController.getAllCases);

// Get cases for a specific executive
router.get('/executive/:executiveId', casesController.getCasesForExecutive);

// Lookup case by account id (acc_id)
router.get('/lookup', casesController.getCaseByAccId);

// Upload cases via Excel (Supervisor)
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
router.post('/upload', upload.single('file'), authorize(['super_admin', 'supervisor']), casesController.uploadCases);

// Preview uploaded Excel files (Manager/Admin)
router.get('/uploads', authorize(['super_admin', 'manager', 'admin']), casesController.getUploadedFiles);

// Download uploaded Excel file by id (Manager/Admin)
router.get('/uploads/:uploadId/download', authorize(['super_admin', 'manager', 'admin']), casesController.downloadUploadedFile);

// Get audit logs for uploads (Manager/Admin)
router.get('/uploads/audit', authorize(['super_admin', 'manager', 'admin']), casesController.getUploadAuditLogs);

// Get performance summary for executive
router.get('/performance/:executiveId', casesController.getPerformance);

// Leaderboard (Supervisor/Manager/Admin)
router.get('/leaderboard', authorize(['super_admin', 'supervisor', 'manager']), casesController.getLeaderboard);


// Visited cases (Supervisor/Manager/Admin)
router.get('/visited', authorize(['super_admin', 'supervisor', 'manager']), casesController.getVisitedCases);

// Export visited cases (Supervisor/Manager/Admin)
router.get('/visited/export', authorize(['super_admin', 'supervisor', 'manager']), casesController.exportVisitedCases);

// Get single case with all feedbacks
router.get('/:caseId', casesController.getCaseById);

// Allocate cases to executive
router.post('/allocate/single', authorize(['super_admin', 'supervisor']), casesController.allocateCases);

// Bulk allocate cases
router.post('/allocate/bulk', authorize(['super_admin', 'supervisor']), casesController.bulkAllocate);

// Allocate cases by emp_id to an executive
router.post('/allocate-by-empid', authorize(['super_admin', 'supervisor']), casesController.allocateByEmpId);

// Get allocation status
router.get('/allocation-status', casesController.getAllocationStatus);

// Get single case with all feedbacks (MUST BE LAST - catch-all route)
router.get('/:caseId', casesController.getCaseById);

module.exports = router;
