/**
 * Admin Routes
 * Comprehensive admin management endpoints
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');

// Employee Management
router.get('/employees', adminController.getAllEmployees);
router.post('/employees', adminController.createUser);
router.put('/employees/:userId/role', adminController.updateUserRole);

// Audit Logs
router.get('/audit-logs', adminController.getAuditLogs);

// Online Users & Sessions
router.get('/online-users', adminController.getOnlineUsers);
router.post('/sessions/:sessionId/logout', adminController.logoutUser);

// Roles & Permissions
router.post('/roles', adminController.createRole);
router.post('/permissions', adminController.createPermission);
router.post('/roles/:roleId/permissions', adminController.grantPermissionToRole);
router.get('/roles-permissions', adminController.getRolesAndPermissions);

// Activity & Analytics
router.get('/user-activity', adminController.getUserActivity);
router.get('/performance-analytics', adminController.getPerformanceAnalytics);

// User Data
router.get('/user-data', adminController.getAllUserData);

module.exports = router;
