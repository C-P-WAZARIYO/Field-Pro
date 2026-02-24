/**
 * Payout Controller
 * Handles payout grid management and earnings calculations
 */

const payoutService = require('../services/payout.service');

/**
 * Create a new payout grid
 * POST /api/payouts/grids
 */
const createPayoutGrid = async (req, res) => {
  try {
    const {
      bank,
      product,
      bkt,
      target_percent,
      payout_type,
      payout_amount,
      norm_bonus,
      rollback_bonus,
      max_earning,
    } = req.body;

    const grid = await payoutService.createPayoutGrid({
      bank,
      product,
      bkt,
      target_percent,
      payout_type: payout_type || 'FIXED',
      payout_amount,
      norm_bonus: norm_bonus || 0,
      rollback_bonus: rollback_bonus || 0,
      max_earning,
      created_by: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Payout grid created successfully',
      data: grid,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get payout grids by bank and product
 * GET /api/payouts/grids?bank=HDFC&product=Agriculture
 */
const getPayoutGridsByBankAndProduct = async (req, res) => {
  try {
    const { bank, product } = req.query;

    if (!bank || !product) {
      return res.status(400).json({
        success: false,
        message: 'Bank and product are required',
      });
    }

    const grids = await payoutService.getPayoutGridsByBankAndProduct(bank, product);

    res.status(200).json({
      success: true,
      data: grids,
      total: grids.length,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get all payout grids (with optional filters)
 * GET /api/payouts/grids/all
 */
const getAllPayoutGrids = async (req, res) => {
  try {
    const { bank, product, bkt } = req.query;

    const filters = {};
    if (bank) filters.bank = bank;
    if (product) filters.product = product;
    if (bkt) filters.bkt = bkt;

    const grids = await payoutService.getAllPayoutGrids(filters);

    res.status(200).json({
      success: true,
      data: grids,
      total: grids.length,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update payout grid
 * PUT /api/payouts/grids/:gridId
 */
const updatePayoutGrid = async (req, res) => {
  try {
    const { gridId } = req.params;
    const { payout_amount, norm_bonus, rollback_bonus, max_earning } = req.body;

    const updateData = {};
    if (payout_amount !== undefined) updateData.payout_amount = payout_amount;
    if (norm_bonus !== undefined) updateData.norm_bonus = norm_bonus;
    if (rollback_bonus !== undefined) updateData.rollback_bonus = rollback_bonus;
    if (max_earning !== undefined) updateData.max_earning = max_earning;

    const grid = await payoutService.updatePayoutGrid(gridId, updateData);

    res.status(200).json({
      success: true,
      message: 'Payout grid updated successfully',
      data: grid,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Copy payout grid to another product
 * POST /api/payouts/grids/copy
 */
const copyPayoutGrid = async (req, res) => {
  try {
    const { fromBank, fromProduct, toBank, toProduct } = req.body;

    const copiedGrids = await payoutService.copyPayoutGrid(
      fromBank,
      fromProduct,
      toBank,
      toProduct,
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: `${copiedGrids.length} payout grids copied successfully`,
      data: copiedGrids,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Calculate earnings for an executive
 * POST /api/payouts/calculate-earnings
 */
const calculateEarnings = async (req, res) => {
  try {
    const { executiveId, casesVisited, totalPOSRecovered, caseDetails, month, year } = req.body;

    const result = await payoutService.calculateExecutiveEarnings({
      executiveId,
      casesVisited,
      totalPOSRecovered,
      caseDetails,
      month: month || new Date().getMonth() + 1,
      year: year || new Date().getFullYear(),
    });

    res.status(200).json({
      success: true,
      message: 'Earnings calculated successfully',
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
  createPayoutGrid,
  getPayoutGridsByBankAndProduct,
  getAllPayoutGrids,
  updatePayoutGrid,
  copyPayoutGrid,
  calculateEarnings,
};
