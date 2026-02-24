/**
 * Manager Routes
 * Routes for manager operations and controls
 */

const express = require('express');
const router = express.Router();
const managerController = require('../controllers/manager.controller');

/**
 * GET /api/v1/manager/employees - Get all employees
 */
router.get('/employees', managerController.getAllEmployees);

/**
 * PUT /api/v1/manager/employees/:employeeId/toggle-service - Toggle employee service (Kill Switch)
 */
router.put('/employees/:employeeId/toggle-service', managerController.toggleEmployeeService);

/**
 * POST /api/v1/manager/cases/reassign - Reassign cases
 */
router.post('/cases/reassign', managerController.reassignCases);

/**
 * GET /api/v1/manager/supervisor/:supervisorId/performance - Get supervisor/team performance
 */
router.get('/supervisor/:supervisorId/performance', managerController.getSupervisorPerformance);

/**
 * POST /api/v1/manager/payout-grid - Save payout grid
 */
router.post('/payout-grid', managerController.savePayoutGrid);

/**
 * GET /api/v1/manager/payout-grid - Get all payout grids
 */
router.get('/payout-grid', managerController.getPayoutGrids);

module.exports = router;
