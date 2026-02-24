/**
 * Payout Routes
 */

const express = require('express');
const payoutController = require('../controllers/payout.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Payout Grid Management Routes (Manager & Super Admin)
 */

// Create a new payout grid
router.post('/grids', authorize(['manager', 'super_admin']), payoutController.createPayoutGrid);

// Get all payout grids (with filters)
router.get('/grids/all', authorize(['manager', 'super_admin']), payoutController.getAllPayoutGrids);

// Get payout grids by bank and product
router.get('/grids', authorize(['manager', 'super_admin']), payoutController.getPayoutGridsByBankAndProduct);

// Update payout grid
router.put('/grids/:gridId', authorize(['manager', 'super_admin']), payoutController.updatePayoutGrid);

// Copy payout grid to another product
router.post('/grids/copy', authorize(['manager', 'super_admin']), payoutController.copyPayoutGrid);

/**
 * Earnings Calculation Routes
 */

// Calculate earnings for an executive
router.post('/calculate-earnings', authorize(['manager', 'super_admin']), payoutController.calculateEarnings);

module.exports = router;
