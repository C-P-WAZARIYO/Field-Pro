/**
 * Referral Routes
 * Routes for referral program management
 */

const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referral.controller');

/**
 * POST /api/v1/referrals - Generate referral code
 */
router.post('/:userId/generate-code', referralController.generateReferralCode);

/**
 * POST /api/v1/referrals/process-signup - Process referral signup
 */
router.post('/process-signup', referralController.processReferralSignup);

/**
 * POST /api/v1/referrals/record-payment - Record payment from referred user
 */
router.post('/record-payment', referralController.recordReferralPayment);

/**
 * GET /api/v1/referrals - Get all referrals (admin)
 */
router.get('/', referralController.getAllReferrals);

/**
 * GET /api/v1/referrals/validate/:referralCode - Validate referral code
 */
router.get('/validate/:referralCode', referralController.validateReferralCode);

module.exports = router;
