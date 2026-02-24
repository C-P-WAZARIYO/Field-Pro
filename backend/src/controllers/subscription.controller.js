/**
 * Subscription Controller
 * Handles subscription-related requests for the Founding Member Program
 */

const prisma = require('../config/database');
const { success, created, error } = require('../utils/response');

/**
 * Create or activate subscription for a user
 */
exports.createSubscription = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if subscription already exists
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId }
    });

    if (existingSubscription) {
      return success(res, existingSubscription, 'Subscription already exists');
    }

    // Create new subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        plan_name: 'Founding Member Program',
        monthly_price: 799,
        status: 'ACTIVE',
        start_date: new Date(),
        renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        carryover_active: false,
        carryover_months: 0,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    return created(res, subscription, 'Subscription created successfully');
  } catch (err) {
    console.error('Error creating subscription:', err);
    return error(res, 'Failed to create subscription', 500);
  }
};

/**
 * Get subscription details for a user
 */
exports.getSubscription = async (req, res) => {
  try {
    const { userId } = req.params;

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
          }
        },
        referrals: {
          select: {
            id: true,
            status: true,
            commission_rate: true,
            commission_amount: true,
            payment_status: true,
          }
        }
      }
    });

    if (!subscription) {
      return error(res, 'Subscription not found', 404);
    }

    return success(res, subscription, 'Subscription retrieved successfully');
  } catch (err) {
    console.error('Error fetching subscription:', err);
    return error(res, 'Failed to fetch subscription', 500);
  }
};

/**
 * Update subscription status (activate 6-month carryover)
 */
exports.activateCarryover = async (req, res) => {
  try {
    const { userId } = req.params;

    const subscription = await prisma.subscription.update({
      where: { userId },
      data: {
        carryover_active: true,
        carryover_months: 6,
        carryover_until: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000), // 6 months
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          }
        }
      }
    });

    return success(res, subscription, 'Carryover activated successfully');
  } catch (err) {
    console.error('Error activating carryover:', err);
    return error(res, 'Failed to activate carryover', 500);
  }
};

/**
 * Get all referrals for a user
 */
exports.getUserReferrals = async (req, res) => {
  try {
    const { userId } = req.params;

    const referrals = await prisma.referral.findMany({
      where: { referrer_id: userId },
      include: {
        referee: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return success(res, referrals, 'Referrals retrieved successfully');
  } catch (err) {
    console.error('Error fetching referrals:', err);
    return error(res, 'Failed to fetch referrals', 500);
  }
};

/**
 * Get referral statistics for dashboard
 */
exports.getReferralStats = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Fetch referral stats
    const referralCodes = await prisma.referral.findMany({
      where: { referrer_id: userId }
    });

    const paidReferrals = referralCodes.filter(r => r.status === 'PAID').length;
    const totalEarnings = referralCodes.reduce((sum, r) => sum + (r.commission_amount || 0), 0);
    const pendingEarnings = referralCodes
      .filter(r => r.payment_status === 'PENDING')
      .reduce((sum, r) => sum + (r.commission_amount || 0), 0);

    // Get monthly share count
    const monthlyShare = await prisma.referralShare.findUnique({
      where: {
        user_id_month_year: {
          user_id: userId,
          month: currentMonth,
          year: currentYear
        }
      }
    });

    const stats = {
      referralCode: referralCodes[0]?.referral_code || 'FM-' + userId.substring(0, 8).toUpperCase(),
      totalReferred: referralCodes.length,
      paidSignups: paidReferrals,
      totalEarnings,
      pendingEarnings,
      monthlyShares: monthlyShare?.share_count || 0,
      targetShares: 15,
      targetMet: (monthlyShare?.share_count || 0) >= 15
    };

    return success(res, stats, 'Referral stats retrieved successfully');
  } catch (err) {
    console.error('Error fetching referral stats:', err);
    return error(res, 'Failed to fetch referral stats', 500);
  }
};

/**
 * Record a referral share (when user shares their code)
 */
exports.recordShare = async (req, res) => {
  try {
    const { userId } = req.params;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Find or create referral share record
    let referralShare = await prisma.referralShare.findUnique({
      where: {
        user_id_month_year: {
          user_id: userId,
          month: currentMonth,
          year: currentYear
        }
      }
    });

    if (!referralShare) {
      referralShare = await prisma.referralShare.create({
        data: {
          user_id: userId,
          month: currentMonth,
          year: currentYear,
          share_count: 1,
          target_shares: 15,
          target_met: false,
        }
      });
    } else {
      const newShareCount = referralShare.share_count + 1;
      referralShare = await prisma.referralShare.update({
        where: {
          user_id_month_year: {
            user_id: userId,
            month: currentMonth,
            year: currentYear
          }
        },
        data: {
          share_count: newShareCount,
          target_met: newShareCount >= 15,
        }
      });
    }

    return success(res, referralShare, 'Share recorded successfully');
  } catch (err) {
    console.error('Error recording share:', err);
    return error(res, 'Failed to record share', 500);
  }
};
