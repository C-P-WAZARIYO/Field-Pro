/**
 * Feedback Service
 * Handles feedback submissions with GPS validation and device fingerprinting
 */

const prisma = require('../config/database');

/**
 * Calculate distance between two GPS coordinates (Haversine formula)
 * Returns distance in meters
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Validate GPS coordinates against case location
 * Flags fake visits if distance > 300m
 */
const validateGPS = (executiveCurrentLat, executiveCurrentLng, caseLat, caseLng) => {
  if (!caseLat || !caseLng) {
    return { is_valid: true, distance: null, reason: 'No known location to validate' };
  }

  const distance = calculateDistance(
    executiveCurrentLat,
    executiveCurrentLng,
    caseLat,
    caseLng
  );

  return {
    is_valid: distance <= 300, // 300 meters threshold
    distance: distance,
    reason: distance > 300 ? `Visit location is ${Math.round(distance)}m away from known address` : 'GPS validated',
  };
};

/**
 * Create a feedback submission
 */
const createFeedback = async (feedbackData, userAgent, ipAddress) => {
  try {

    // Destructure all possible fields
    const {
      caseId,
      executiveId,
      lat,
      lng,
      visit_code,
      meeting_place,
      custom_place,
      distance,
      who_met,
      met_name,
      relation,
      asset_available,
      asset_location,
      asset_status,
      remarks,
      photo_url,
      ptp_date
    } = feedbackData;

    // Fetch case to validate GPS
    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
    });

    if (!caseRecord) {
      throw new Error('Case not found');
    }

    // Validate GPS
    const gpsValidation = validateGPS(lat, lng, caseRecord.lat, caseRecord.lng);

    // Create device fingerprint
    const deviceInfo = {
      userAgent,
      ipAddress,
      timestamp: new Date().toISOString(),
      lat: lat,
      lng: lng,
    };

    // Create feedback
    const feedback = await prisma.feedback.create({
      data: {
        caseId,
        executiveId,
        lat,
        lng,
        distance_from_address: gpsValidation.distance,
        is_fake_visit: !gpsValidation.is_valid,
        visit_code,
        meeting_place,
        custom_place,
        distance,
        who_met,
        met_name,
        relation,
        asset_available,
        asset_location,
        asset_status,
        remarks,
        photo_url,
        ptp_date: ptp_date ? new Date(ptp_date) : null,
        device_info: deviceInfo,
      },
    });

    // Update case lastVisitAt and status
    await prisma.case.update({
      where: { id: caseId },
      data: {
        lastVisitAt: new Date(),
        status: 'VISITED',
      },
    });

    return {
      feedback,
      gpsValidation,
    };
  } catch (error) {
    throw new Error(`Failed to create feedback: ${error.message}`);
  }
};

/**
 * Get feedback by ID
 */
const getFeedbackById = async (feedbackId) => {
  try {
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      include: {
        case: true,
        executive: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
    return feedback;
  } catch (error) {
    throw new Error(`Failed to fetch feedback: ${error.message}`);
  }
};

/**
 * Get all feedbacks for a case
 */
const getFeedbacksByCase = async (caseId) => {
  try {
    const feedbacks = await prisma.feedback.findMany({
      where: { caseId },
      include: {
        executive: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return feedbacks;
  } catch (error) {
    throw new Error(`Failed to fetch feedbacks: ${error.message}`);
  }
};

/**
 * Get all feedbacks for an executive
 */
const getFeedbacksByExecutive = async (executiveId, filters = {}) => {
  try {
    const where = { executiveId };

    if (filters.is_fake_visit !== undefined) {
      where.is_fake_visit = filters.is_fake_visit;
    }
    if (filters.ptp_broken !== undefined) {
      where.ptp_broken = filters.ptp_broken;
    }

    const feedbacks = await prisma.feedback.findMany({
      where,
      include: {
        case: {
          select: {
            id: true,
            acc_id: true,
            customer_name: true,
            phone_number: true,
            address: true,
            pos_amount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return feedbacks;
  } catch (error) {
    throw new Error(`Failed to fetch feedbacks: ${error.message}`);
  }
};

/**
 * Mark a feedback as fake visit (manual audit)
 */
const markAsFakeVisit = async (feedbackId) => {
  try {
    const feedback = await prisma.feedback.update({
      where: { id: feedbackId },
      data: { is_fake_visit: true },
    });
    return feedback;
  } catch (error) {
    throw new Error(`Failed to mark feedback: ${error.message}`);
  }
};

/**
 * Reject a feedback
 */
const rejectFeedback = async (feedbackId) => {
  try {
    const feedback = await prisma.feedback.delete({
      where: { id: feedbackId },
    });
    return feedback;
  } catch (error) {
    throw new Error(`Failed to reject feedback: ${error.message}`);
  }
};

/**
 * Check for broken PTP (Promise to Pay)
 * PTP is broken if today's date > ptp_date and no new feedback created after ptp_date
 */
const checkBrokenPTP = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all feedbacks with PTP date in the past
    const pastPTPFeedbacks = await prisma.feedback.findMany({
      where: {
        ptp_date: {
          lt: today,
        },
        ptp_broken: false,
      },
    });

    // For each, check if there's a newer feedback for that case
    const updates = [];
    for (const feedback of pastPTPFeedbacks) {
      const newerFeedback = await prisma.feedback.findFirst({
        where: {
          caseId: feedback.caseId,
          createdAt: {
            gt: feedback.ptp_date,
          },
        },
      });

      if (!newerFeedback) {
        // No action taken after PTP date - mark as broken
        updates.push(
          prisma.feedback.update({
            where: { id: feedback.id },
            data: { ptp_broken: true },
          })
        );
      }
    }

    if (updates.length > 0) {
      await Promise.all(updates);
    }

    return { checked: pastPTPFeedbacks.length, broken: updates.length };
  } catch (error) {
    throw new Error(`Failed to check broken PTPs: ${error.message}`);
  }
};

/**
 * Get fake visit summary for supervisor audit
 */
const getFakeVisitSummary = async (filters = {}) => {
  try {
    const where = { is_fake_visit: true };

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    const fakeVisits = await prisma.feedback.findMany({
      where,
      include: {
        case: {
          select: {
            id: true,
            acc_id: true,
            customer_name: true,
            address: true,
          },
        },
        executive: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      total: fakeVisits.length,
      list: fakeVisits,
    };
  } catch (error) {
    throw new Error(`Failed to fetch fake visit summary: ${error.message}`);
  }
};

/**
 * Get PTP alerts
 */
const getPTPAlerts = async (filter = 'today') => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let where = {};

    if (filter === 'today') {
      // PTP alerts for today
      where = {
        ptp_date: {
          gte: today,
          lt: tomorrow,
        },
        ptp_broken: false,
      };
    } else if (filter === 'broken') {
      // Broken PTPs
      where = {
        ptp_broken: true,
      };
    }

    const alerts = await prisma.feedback.findMany({
      where,
      include: {
        case: {
          select: {
            id: true,
            acc_id: true,
            customer_name: true,
            phone_number: true,
            pos_amount: true,
          },
        },
        executive: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { ptp_date: 'asc' },
    });

    return alerts;
  } catch (error) {
    throw new Error(`Failed to fetch PTP alerts: ${error.message}`);
  }
};

module.exports = {
  createFeedback,
  getFeedbackById,
  getFeedbacksByCase,
  getFeedbacksByExecutive,
  markAsFakeVisit,
  rejectFeedback,
  checkBrokenPTP,
  getFakeVisitSummary,
  getPTPAlerts,
  validateGPS,
};
