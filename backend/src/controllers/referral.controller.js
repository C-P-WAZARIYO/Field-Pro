/**
 * Referral Controller
 * Handles referral program management
 */

const prisma = require('../config/database');
const { success, created, error } = require('../utils/response');

/**
 * Generate referral code for a user
 */
exports.generateReferralCode = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user has active subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    });

    if (!subscription) {
      return error(res, 'User must have active subscription to generate referral code', 400);
    }

    // Generate unique referral code
    const referralCode = 'FM-' + userId.substring(0, 8).toUpperCase();

    // Check if code already exists
    const existingReferral = await prisma.referral.findUnique({
      where: { referral_code: referralCode }
    });

    if (existingReferral) {
      return success(res, { referral_code: referralCode }, 'Referral code already exists');
    }

    // Create referral code record
    const referral = await prisma.referral.create({
      data: {
        referrer_id: userId,
        referral_code: referralCode,
        status: 'PENDING',
        commission_rate: 0.20, // Default 20%
        commission_amount: 0,
        payment_status: 'PENDING'
      },
      include: {
        referrer: {
          select: {
            id: true,
            email: true,
            username: true,
          }
        }
      }
    });

    return created(res, referral, 'Referral code generated successfully');
  } catch (err) {
    console.error('Error generating referral code:', err);
    return error(res, 'Failed to generate referral code', 500);
  }
};

/**
 * Process referral signup (when someone signs up with referral code)
 */
exports.processReferralSignup = async (req, res) => {
  try {
    const { referralCode, newUserId } = req.body;

    if (!referralCode || !newUserId) {
      return error(res, 'Referral code and new user ID required', 400);
    }

    // Find the referral record
    let referral = await prisma.referral.findUnique({
      where: { referral_code: referralCode }
    });

    if (!referral) {
      return error(res, 'Invalid referral code', 400);
    }

    // Update referral with referee info
    referral = await prisma.referral.update({
      where: { referral_code: referralCode },
      data: {
        referee_id: newUserId,
        status: 'SIGNED_UP',
        signed_up_at: new Date(),
      },
      include: {
        referrer: {
          select: {
            id: true,
            email: true,
            username: true,
          }
        },
        referee: {
          select: {
            id: true,
            email: true,
            username: true,
          }
        }
      }
    });

    return success(res, referral, 'Referral signup processed successfully');
  } catch (err) {
    console.error('Error processing referral signup:', err);
    return error(res, 'Failed to process referral signup', 500);
  }
};

/**
 * Record payment from referred user (triggers commission calculation)
 */
exports.recordReferralPayment = async (req, res) => {
  try {
    const { referralCode } = req.body;

    if (!referralCode) {
      return error(res, 'Referral code required', 400);
    }

    // Find referral
    let referral = await prisma.referral.findUnique({
      where: { referral_code: referralCode }
    });

    if (!referral) {
      return error(res, 'Invalid referral code', 400);
    }

    if (!referral.referee_id) {
      return error(res, 'Referee not signed up yet', 400);
    }

    // Calculate commission (20% of ₹799)
    const baseAmount = 799;
    const commissionRate = referral.commission_rate || 0.20;
    const commissionAmount = baseAmount * commissionRate;

    // Update referral status
    referral = await prisma.referral.update({
      where: { referral_code: referralCode },
      data: {
        status: 'PAID',
        paid_at: new Date(),
        commission_amount: commissionAmount,
        payment_status: 'PENDING', // Will be marked PAID when commission is disbursed
      },
      include: {
        referrer: {
          select: {
            id: true,
            email: true,
            username: true,
          }
        },
        referee: {
          select: {
            id: true,
            email: true,
            username: true,
          }
        }
      }
    });

    return success(res, referral, 'Referral payment recorded successfully');
  } catch (err) {
    console.error('Error recording referral payment:', err);
    return error(res, 'Failed to record referral payment', 500);
  }
};

/**
 * Get all referrals for analytics
 */
exports.getAllReferrals = async (req, res) => {
  try {
    const { status, paymentStatus } = req.query;

    const where = {};
    if (status) where.status = status;
    if (paymentStatus) where.payment_status = paymentStatus;

    const referrals = await prisma.referral.findMany({
      where,
      include: {
        referrer: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
          }
        },
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
 * Validate referral code
 */
exports.validateReferralCode = async (req, res) => {
  try {
    const { referralCode } = req.params;

    const referral = await prisma.referral.findUnique({
      where: { referral_code: referralCode },
      include: {
        referrer: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    if (!referral) {
      return error(res, 'Invalid referral code', 400);
    }

    return success(res, {
      valid: true,
      referralCode: referral.referral_code,
      referrer: referral.referrer
    }, 'Referral code is valid');
  } catch (err) {
    console.error('Error validating referral code:', err);
    return error(res, 'Failed to validate referral code', 500);
  }
};
