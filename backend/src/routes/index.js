/**
 * API Routes Index
 * Combines all route modules
 */

const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const roleRoutes = require('./role.routes');
const permissionRoutes = require('./permission.routes');
const casesRoutes = require('./cases.routes');
const feedbackRoutes = require('./feedback.routes');
const blogRoutes = require('./blog.routes');
const payoutRoutes = require('./payout.routes');
const subscriptionRoutes = require('./subscription.routes');
const referralRoutes = require('./referral.routes');
const managerRoutes = require('./manager.routes');
const adminRoutes = require('./admin.routes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AuthX API is running',
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || 'v1',
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);
router.use('/cases', casesRoutes);
router.use('/feedbacks', feedbackRoutes);
router.use('/blogs', blogRoutes);
router.use('/payouts', payoutRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/referrals', referralRoutes);
router.use('/manager', managerRoutes);
router.use('/admin', adminRoutes);

module.exports = router;