// src/controllers/case.controller.js

const caseService = require('../services/case.service');
const { success, paginated, created } = require('../utils/response');

/**
 * @route   POST /api/v1/cases/import
 * @desc    Upload Excel/CSV and process 50k+ records
 * @access  Private (requires cases:import)
 */
const importCases = async (req, res, next) => {
  try {
    // req.file is the Excel buffer from Multer
    const result = await caseService.importFromExcel(req.file.buffer, {
      month: req.body.month,
      year: req.body.year
    });

    return created(res, result, 'Data import and auto-allocation completed');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/cases
 * @desc    Get cases (Filtered by Role: Admin sees all, Exec sees assigned)
 * @access  Private (requires cases:read)
 */
const getCases = async (req, res, next) => {
  try {
    const { page, limit, search, bkt, status } = req.query;
    
    // We pass req.user so the service knows if it should filter by executiveId
    const result = await caseService.getAllCases({
      page, limit, search, bkt, status,
      userId: req.user.id,
      userRole: req.user.role // e.g., 'FIELD_EXECUTIVE'
    });

    return paginated(res, result.cases, {
      page: result.page,
      limit: result.limit,
      total: result.total
    }, 'Cases retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/v1/cases/:id/reassign
 * @desc    Manually move a case from one executive to another
 * @access  Private (requires cases:manage)
 */
const reassignCase = async (req, res, next) => {
  try {
    const { targetExecutiveId } = req.body;
    const updatedCase = await caseService.reassign(req.params.id, targetExecutiveId);
    
    return success(res, updatedCase, 'Case reassigned successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/v1/cases/reset
 * @desc    The "Monthly Reset" - Clear old allocations for a new month
 * @access  Private (requires cases:reset)
 */
const resetMonthlyData = async (req, res, next) => {
  try {
    const { month, year } = req.body;
    await caseService.bulkReset(month, year);
    return success(res, null, `System reset for ${month}/${year} successful`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  importCases,
  getCases,
  reassignCase,
  resetMonthlyData
};