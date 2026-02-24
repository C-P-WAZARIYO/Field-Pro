/**
 * Feedback Controller
 * Handles feedback submissions with GPS validation
 */

const feedbackService = require('../services/feedback.service');

/**
 * Submit feedback for a case
 * POST /api/feedbacks
 */
const submitFeedback = async (req, res) => {
  try {
    // Handle both JSON and FormData requests

    // Accept all fields from the feedback form
    // Accept all fields from the feedback form (camelCase from frontend)
    const {
      caseId,
      lat,
      lng,
      visit_code,
      meeting_place,
      customPlace,
      distance,
      whoMet,
      metName,
      relation,
      assetAvailable,
      assetLocation,
      assetStatus,
      remarks,
      photo_url,
      ptp_date
    } = req.body;
    const executiveId = req.user.id;

    // Get device info from request
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip || req.connection.remoteAddress || '';

    // Handle photo from multer if file was uploaded
    let photoUrl = photo_url;
    if (req.file) {
      photoUrl = req.file.originalname;
    }

    // Map frontend fields to backend model
    // Map camelCase to snake_case for Prisma
    const feedbackData = {
      caseId,
      executiveId,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      visit_code,
      meeting_place,
      custom_place: customPlace,
      distance,
      who_met: whoMet,
      met_name: metName,
      relation,
      asset_available: assetAvailable,
      asset_location: assetLocation,
      asset_status: assetStatus,
      remarks,
      photo_url: photoUrl,
      ptp_date,
    };

    const result = await feedbackService.createFeedback(feedbackData, userAgent, ipAddress);

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: result.feedback,
      gpsValidation: result.gpsValidation,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get feedback by ID
 * GET /api/feedbacks/:feedbackId
 */
const getFeedbackById = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const feedback = await feedbackService.getFeedbackById(feedbackId);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }

    res.status(200).json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get all feedbacks for a case
 * GET /api/feedbacks/case/:caseId
 */
const getFeedbacksByCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const feedbacks = await feedbackService.getFeedbacksByCase(caseId);

    res.status(200).json({
      success: true,
      data: feedbacks,
      total: feedbacks.length,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get all feedbacks for an executive
 * GET /api/feedbacks/executive/:executiveId
 */
const getFeedbacksByExecutive = async (req, res) => {
  try {
    const { executiveId } = req.params;
    const { is_fake_visit, ptp_broken } = req.query;

    const filters = {};
    if (is_fake_visit !== undefined) {
      filters.is_fake_visit = is_fake_visit === 'true';
    }
    if (ptp_broken !== undefined) {
      filters.ptp_broken = ptp_broken === 'true';
    }

    // Authorization: supervisors/managers/admins can view any executive's feedbacks.
    // Executives can only view their own feedbacks.
    const roles = (req.user && req.user.roles) || [];
    const isExecutive = roles.includes('executive');
    if (isExecutive && req.user.id !== executiveId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const feedbacks = await feedbackService.getFeedbacksByExecutive(executiveId, filters);

    res.status(200).json({
      success: true,
      data: feedbacks,
      total: feedbacks.length,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Mark feedback as fake visit (manual audit)
 * POST /api/feedbacks/:feedbackId/mark-fake
 */
const markAsFakeVisit = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const feedback = await feedbackService.markAsFakeVisit(feedbackId);

    res.status(200).json({
      success: true,
      message: 'Feedback marked as fake visit',
      data: feedback,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Reject feedback
 * DELETE /api/feedbacks/:feedbackId
 */
const rejectFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    await feedbackService.rejectFeedback(feedbackId);

    res.status(200).json({
      success: true,
      message: 'Feedback rejected and deleted',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get fake visit summary for supervisor audit
 * GET /api/feedbacks/audit/fake-visits
 */
const getFakeVisitSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const result = await feedbackService.getFakeVisitSummary({ startDate, endDate });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get PTP (Promise to Pay) alerts
 * GET /api/feedbacks/alerts/ptp
 */
const getPTPAlerts = async (req, res) => {
  try {
    const { filter } = req.query; // 'today' or 'broken'

    const alerts = await feedbackService.getPTPAlerts(filter || 'today');

    res.status(200).json({
      success: true,
      data: alerts,
      total: alerts.length,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Check for broken PTPs (runs as scheduled job)
 * POST /api/feedbacks/check-broken-ptp
 */
const checkBrokenPTP = async (req, res) => {
  try {
    const result = await feedbackService.checkBrokenPTP();

    res.status(200).json({
      success: true,
      message: 'PTP check completed',
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  submitFeedback,
  getFeedbackById,
  getFeedbacksByCase,
  getFeedbacksByExecutive,
  markAsFakeVisit,
  rejectFeedback,
  getFakeVisitSummary,
  getPTPAlerts,
  checkBrokenPTP,
};
