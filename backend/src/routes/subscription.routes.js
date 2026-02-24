/**
 * Subscription Routes
 * Routes for subscription management
 */

const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');

/**
 * POST /api/v1/subscriptions - Create subscription
 */
router.post('/:userId', subscriptionController.createSubscription);

/**
 * GET /api/v1/subscriptions/:userId - Get subscription details
 */
router.get('/:userId', subscriptionController.getSubscription);

/**
 * PUT /api/v1/subscriptions/:userId/carryover - Activate 6-month carryover
 */
router.put('/:userId/carryover', subscriptionController.activateCarryover);

/**
 * GET /api/v1/subscriptions/:userId/referrals - Get all referrals for user
 */
router.get('/:userId/referrals', subscriptionController.getUserReferrals);

/**
 * GET /api/v1/subscriptions/:userId/stats - Get referral statistics
 */
router.get('/:userId/stats', subscriptionController.getReferralStats);

/**
 * POST /api/v1/subscriptions/:userId/record-share - Record a share
 */
router.post('/:userId/record-share', subscriptionController.recordShare);

module.exports = router;
