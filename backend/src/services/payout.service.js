/**
 * Payout Service
 * Handles payout grid management and earnings calculations
 */

const prisma = require('../config/database');

/**
 * Create a new payout grid
 */
const createPayoutGrid = async (gridData) => {
  try {
    const grid = await prisma.payoutGrid.create({
      data: {
        bank: gridData.bank,
        product: gridData.product,
        bkt: gridData.bkt,
        target_percent: gridData.target_percent,
        payout_type: gridData.payout_type || 'FIXED',
        payout_amount: gridData.payout_amount,
        norm_bonus: gridData.norm_bonus || 0,
        rollback_bonus: gridData.rollback_bonus || 0,
        max_earning: gridData.max_earning || null,
        created_by: gridData.created_by,
      },
    });
    return grid;
  } catch (error) {
    throw new Error(`Failed to create payout grid: ${error.message}`);
  }
};

/**
 * Get payout grid by bank, product, and BKT
 */
const getPayoutGrid = async (bank, product, bkt, targetPercent = null) => {
  try {
    const where = { bank, product, bkt };
    if (targetPercent) {
      where.target_percent = targetPercent;
    }

    const grid = await prisma.payoutGrid.findFirst({
      where,
      orderBy: { target_percent: 'desc' }, // Get highest applicable target
    });

    return grid;
  } catch (error) {
    throw new Error(`Failed to fetch payout grid: ${error.message}`);
  }
};

/**
 * Get all payout grids for a specific bank & product
 */
const getPayoutGridsByBankAndProduct = async (bank, product) => {
  try {
    const grids = await prisma.payoutGrid.findMany({
      where: { bank, product },
      orderBy: [{ bkt: 'asc' }, { target_percent: 'desc' }],
    });
    return grids;
  } catch (error) {
    throw new Error(`Failed to fetch payout grids: ${error.message}`);
  }
};

/**
 * Calculate payout for an executive based on performance
 * params: {
 *   executiveId: string,
 *   casesVisited: number,
 *   totalPOSRecovered: number,
 *   caseDetails: { bkt, product, bank, type (NORM/ROLLBACK) }[]
 *   month: number,
 *   year: number
 * }
 */
const calculateExecutiveEarnings = async (params) => {
  try {
    const { executiveId, casesVisited, totalPOSRecovered, caseDetails, month, year } = params;

    let totalEarnings = 0;
    const breakdown = {};

    // Process each case
    for (const caseDetail of caseDetails) {
      const { bkt, product, bank, type, posAmount } = caseDetail;

      // Find applicable payout grid
      const grid = await getPayoutGrid(bank, product, bkt);

      if (!grid) {
        console.warn(`No payout grid found for ${bank}/${product}/${bkt}`);
        continue;
      }

      let payout = 0;

      if (grid.payout_type === 'FIXED') {
        payout = grid.payout_amount;
      } else if (grid.payout_type === 'PERCENTAGE') {
        payout = (posAmount * grid.payout_amount) / 100;
      }

      // Add bonuses
      if (type === 'NORM') {
        payout += grid.norm_bonus || 0;
      } else if (type === 'ROLLBACK') {
        payout += grid.rollback_bonus || 0;
      }

      totalEarnings += payout;

      // Track breakdown by category
      const key = `${bank}_${product}_${bkt}`;
      if (!breakdown[key]) {
        breakdown[key] = { payout: 0, cases: 0 };
      }
      breakdown[key].payout += payout;
      breakdown[key].cases += 1;
    }

    // Apply earning cap if exists
    const highestGrid = await prisma.payoutGrid.findFirst({
      where: {
        max_earning: { not: null },
      },
      orderBy: { max_earning: 'desc' },
    });

    if (highestGrid?.max_earning && totalEarnings > highestGrid.max_earning) {
      totalEarnings = highestGrid.max_earning;
    }

    // Save performance metrics
    const metric = await prisma.performanceMetric.upsert({
      where: {
        executiveId_month_year_bkt_product: {
          executiveId,
          month,
          year,
          bkt: null,
          product: null,
        },
      },
      create: {
        executiveId,
        month,
        year,
        total_cases: casesVisited,
        visited_cases: casesVisited,
        total_pos: totalPOSRecovered,
        recovered_pos: totalPOSRecovered,
        earnings: totalEarnings,
      },
      update: {
        total_cases: casesVisited,
        visited_cases: casesVisited,
        total_pos: totalPOSRecovered,
        recovered_pos: totalPOSRecovered,
        earnings: totalEarnings,
      },
    });

    return {
      totalEarnings,
      breakdown,
      metric,
    };
  } catch (error) {
    throw new Error(`Failed to calculate earnings: ${error.message}`);
  }
};

/**
 * Copy payout grid to another product
 */
const copyPayoutGrid = async (fromBank, fromProduct, toBank, toProduct, createdBy) => {
  try {
    const sourceGrids = await getPayoutGridsByBankAndProduct(fromBank, fromProduct);

    const copiedGrids = [];
    for (const grid of sourceGrids) {
      const newGrid = await createPayoutGrid({
        bank: toBank,
        product: toProduct,
        bkt: grid.bkt,
        target_percent: grid.target_percent,
        payout_type: grid.payout_type,
        payout_amount: grid.payout_amount,
        norm_bonus: grid.norm_bonus,
        rollback_bonus: grid.rollback_bonus,
        max_earning: grid.max_earning,
        created_by: createdBy,
      });
      copiedGrids.push(newGrid);
    }

    return copiedGrids;
  } catch (error) {
    throw new Error(`Failed to copy payout grids: ${error.message}`);
  }
};

/**
 * Update payout grid
 */
const updatePayoutGrid = async (gridId, updateData) => {
  try {
    const grid = await prisma.payoutGrid.update({
      where: { id: gridId },
      data: updateData,
    });
    return grid;
  } catch (error) {
    throw new Error(`Failed to update payout grid: ${error.message}`);
  }
};

/**
 * Get all payout grids (with optional filters)
 */
const getAllPayoutGrids = async (filters = {}) => {
  try {
    const grids = await prisma.payoutGrid.findMany({
      where: filters,
      orderBy: [{ bank: 'asc' }, { product: 'asc' }, { bkt: 'asc' }],
    });
    return grids;
  } catch (error) {
    throw new Error(`Failed to fetch payout grids: ${error.message}`);
  }
};

module.exports = {
  createPayoutGrid,
  getPayoutGrid,
  getPayoutGridsByBankAndProduct,
  calculateExecutiveEarnings,
  copyPayoutGrid,
  updatePayoutGrid,
  getAllPayoutGrids,
};
