/**
 * Manager Controller
 * Handles manager operations: employee management, case reassignment, analytics
 */

const prisma = require('../config/database');
const { success, error } = require('../utils/response');

/**
 * Get all employees with service status
 */
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: {
              name: {
                in: ['Executive', 'Supervisor', 'HR']
              }
            }
          }
        }
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        emp_id: true,
        isActive: true,
        serviceControl: true,
        roles: {
          select: {
            role: {
              select: { name: true }
            }
          }
        }
      }
    });

    return success(res, employees, 'Employees retrieved successfully');
  } catch (err) {
    console.error('Error fetching employees:', err);
    return error(res, 'Failed to fetch employees', 500);
  }
};

/**
 * Disable/Enable employee access (Kill Switch)
 */
exports.toggleEmployeeService = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { isActive, reason } = req.body;

    // Check if service control record exists
    let serviceControl = await prisma.employeeServiceControl.findUnique({
      where: { employee_id: employeeId }
    });

    if (!serviceControl) {
      // Create new service control record
      serviceControl = await prisma.employeeServiceControl.create({
        data: {
          employee_id: employeeId,
          is_active: isActive,
          disabled_reason: !isActive ? reason : null,
          disabled_at: !isActive ? new Date() : null,
        },
        include: {
          employee: {
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
    } else {
      // Update existing record
      serviceControl = await prisma.employeeServiceControl.update({
        where: { employee_id: employeeId },
        data: {
          is_active: isActive,
          disabled_reason: !isActive ? reason : null,
          disabled_at: !isActive ? new Date() : null,
        },
        include: {
          employee: {
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
    }

    return success(res, serviceControl, `Employee access ${isActive ? 'enabled' : 'disabled'} successfully`);
  } catch (err) {
    console.error('Error toggling employee service:', err);
    return error(res, 'Failed to toggle employee service', 500);
  }
};

/**
 * Reassign cases from one employee to another
 */
exports.reassignCases = async (req, res) => {
  try {
    const { fromEmployeeId, toEmployeeId, caseIds } = req.body;

    if (!fromEmployeeId || !toEmployeeId || !caseIds || caseIds.length === 0) {
      return error(res, 'Missing required parameters', 400);
    }

    // Update all cases
    const updatedCases = await prisma.case.updateMany({
      where: {
        id: {
          in: caseIds
        },
        emp_id: fromEmployeeId
      },
      data: {
        emp_id: toEmployeeId
      }
    });

    if (updatedCases.count === 0) {
      return error(res, 'No cases found to reassign', 404);
    }

    return success(res, {
      count: updatedCases.count,
      fromEmployee: fromEmployeeId,
      toEmployee: toEmployeeId
    }, `${updatedCases.count} cases reassigned successfully`);
  } catch (err) {
    console.error('Error reassigning cases:', err);
    return error(res, 'Failed to reassign cases', 500);
  }
};

/**
 * Get supervisor performance metrics (team average)
 */
exports.getSupervisorPerformance = async (req, res) => {
  try {
    const { supervisorId } = req.params;
    const { month, year } = req.query;

    // Get all employees under this supervisor
    // (In a real setup, you'd have a supervisor-subordinate relationship table)
    const metrics = await prisma.performanceMetric.findMany({
      where: {
        ...(month && year && {
          month: parseInt(month),
          year: parseInt(year)
        })
      },
      include: {
        executive: {
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

    // Calculate team average
    if (metrics.length === 0) {
      return success(res, {
        supervisorId,
        teamAverage: 0,
        teamSize: 0,
        totalCases: 0,
        totalRecovered: 0
      }, 'No performance metrics found');
    }

    const teamSize = metrics.length;
    const avgMetrics = {
      totalCases: Math.round(metrics.reduce((sum, m) => sum + m.total_cases, 0) / teamSize),
      visitedCases: Math.round(metrics.reduce((sum, m) => sum + m.visited_cases, 0) / teamSize),
      totalPos: metrics.reduce((sum, m) => sum + m.total_pos, 0),
      recoveredPos: metrics.reduce((sum, m) => sum + m.recovered_pos, 0),
      avgEarnings: metrics.reduce((sum, m) => sum + m.earnings, 0) / teamSize,
    };

    const recoveryRate = avgMetrics.totalPos > 0
      ? (avgMetrics.recoveredPos / avgMetrics.totalPos * 100).toFixed(2)
      : 0;

    const teamPerformanceScore = ((avgMetrics.visitedCases / avgMetrics.totalCases) * 100).toFixed(2) || 0;

    return success(res, {
      supervisorId,
      teamSize,
      teamAverage: parseFloat(teamPerformanceScore),
      recoveryRate: parseFloat(recoveryRate),
      metrics: avgMetrics,
      allMetrics: metrics
    }, 'Supervisor performance retrieved successfully');
  } catch (err) {
    console.error('Error fetching supervisor performance:', err);
    return error(res, 'Failed to fetch supervisor performance', 500);
  }
};

/**
 * Create or update payout grid
 */
exports.savePayoutGrid = async (req, res) => {
  try {
    const { bank, product, bkt, target_percent, payout_type, payout_amount, createdBy } = req.body;

    // Validate required fields
    if (!bank || !product || !bkt || target_percent === undefined || !payout_amount || !createdBy) {
      return error(res, 'Missing required fields', 400);
    }

    // Check if it exists
    const existingGrid = await prisma.payoutGrid.findUnique({
      where: {
        bank_product_bkt_target_percent: {
          bank,
          product,
          bkt,
          target_percent: parseFloat(target_percent)
        }
      }
    });

    let payoutGrid;

    if (existingGrid) {
      // Update
      payoutGrid = await prisma.payoutGrid.update({
        where: {
          bank_product_bkt_target_percent: {
            bank,
            product,
            bkt,
            target_percent: parseFloat(target_percent)
          }
        },
        data: {
          payout_type,
          payout_amount: parseFloat(payout_amount),
          created_by: createdBy
        }
      });
    } else {
      // Create
      payoutGrid = await prisma.payoutGrid.create({
        data: {
          bank,
          product,
          bkt,
          target_percent: parseFloat(target_percent),
          payout_type,
          payout_amount: parseFloat(payout_amount),
          created_by: createdBy
        }
      });
    }

    return success(res, payoutGrid, 'Payout grid saved successfully');
  } catch (err) {
    console.error('Error saving payout grid:', err);
    return error(res, 'Failed to save payout grid', 500);
  }
};

/**
 * Get all payout grids
 */
exports.getPayoutGrids = async (req, res) => {
  try {
    const { bank, product, bkt } = req.query;

    const where = {};
    if (bank) where.bank = bank;
    if (product) where.product = product;
    if (bkt) where.bkt = bkt;

    const payoutGrids = await prisma.payoutGrid.findMany({
      where,
      orderBy: [
        { bank: 'asc' },
        { product: 'asc' },
        { bkt: 'asc' }
      ]
    });

    return success(res, payoutGrids, 'Payout grids retrieved successfully');
  } catch (err) {
    console.error('Error fetching payout grids:', err);
    return error(res, 'Failed to fetch payout grids', 500);
  }
};
