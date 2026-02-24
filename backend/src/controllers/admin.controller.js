/**
 * Admin Controller
 * Comprehensive admin operations for user management, logs, permissions, and analytics
 */

const argon2 = require('argon2');
const { success, created, error, paginated } = require('../utils/response');
const prisma = require('../config/database');
const auditService = require('../services/audit.service');

/**
 * Get all employees with pagination, search, and filters
 */
exports.getAllEmployees = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      role,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      lastLoginDaysAgo
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {};

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { emp_id: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (role) {
      where.roles = {
        some: {
          role: {
            name: role
          }
        }
      };
    }

    if (lastLoginDaysAgo) {
      const daysAgo = parseInt(lastLoginDaysAgo);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      where.lastLoginAt = {
        gte: date
      };
    }

    const [employees, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: {
          [sortBy]: sortOrder
        },
        select: {
          id: true,
          email: true,
          username: true,
          emp_id: true,
          firstName: true,
          lastName: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          lastLoginAt: true,
          roles: {
            select: {
              role: {
                select: { id: true, name: true }
              }
            }
          },
          sessions: {
            where: { isActive: true },
            select: { id: true, createdAt: true }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    return paginated(res, employees, {
      page: parseInt(page),
      limit: parseInt(limit),
      total
    }, 'Employees retrieved successfully');
  } catch (err) {
    console.error('Error fetching employees:', err);
    return error(res, 'Failed to fetch employees', 500);
  }
};
exports.downloadFeedbackExport = async (req, res) => {
  try {
    const format = req.query.format === 'excel' ? 'excel' : 'csv';
    const feedbacks = await prisma.feedback.findMany({
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
        executive: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    const exportRows = feedbacks.map(fb => ({
      FeedbackID: fb.id,
      CaseID: fb.case?.id || '',
      AccountID: fb.case?.acc_id || '',
      CustomerName: fb.case?.customer_name || '',
      PhoneNumber: fb.case?.phone_number || '',
      Address: fb.case?.address || '',
      POSAmount: fb.case?.pos_amount || '',
      ExecutiveID: fb.executive?.id || '',
      ExecutiveName: fb.executive ? `${fb.executive.firstName} ${fb.executive.lastName}` : '',
      ExecutiveEmail: fb.executive?.email || '',
      Latitude: fb.lat,
      Longitude: fb.lng,
      VisitCode: fb.visit_code,
      MeetingPlace: fb.meeting_place,
      AssetStatus: fb.asset_status,
      Remarks: fb.remarks,
      PhotoURL: fb.photo_url,
      PTPDate: fb.ptp_date ? fb.ptp_date.toISOString() : '',
      IsFakeVisit: fb.is_fake_visit,
      DistanceFromAddress: fb.distance_from_address,
      DeviceInfo: fb.device_info ? JSON.stringify(fb.device_info) : '',
      PTPBroken: fb.ptp_broken,
      FakeVisitReason: fb.fake_visit_reason || '',
      Status: fb.status || '',
      CreatedAt: fb.createdAt ? fb.createdAt.toISOString() : '',
      UpdatedAt: fb.updatedAt ? fb.updatedAt.toISOString() : '',
      // Add any other custom fields here
    }));
    const xlsx = require('xlsx');
    let fileBuffer, fileName, mimeType;
    if (format === 'excel') {
      const ws = xlsx.utils.json_to_sheet(exportRows);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, 'FeedbackExport');
      fileBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
      fileName = `feedback_export_${Date.now()}.xlsx`;
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else {
      const ws = xlsx.utils.json_to_sheet(exportRows);
      const csv = xlsx.utils.sheet_to_csv(ws);
      fileBuffer = Buffer.from(csv);
      fileName = `feedback_export_${Date.now()}.csv`;
      mimeType = 'text/csv';
    }
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', mimeType);
    res.send(fileBuffer);
  } catch (err) {
    console.error('Error exporting feedback:', err);
    return error(res, 'Failed to export feedback', 500);
  }
};

/**
 * Create new user
 */
exports.createUser = async (req, res) => {
  try {
    const { email, username, password, firstName, lastName, emp_id, roleId } = req.body;

    if (!email || !username || !password) {
      return error(res, 'Email, username, and password are required', 400);
    }

    // Check if user exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existing) {
      return error(res, 'Email or username already exists', 400);
    }

    // Hash password with argon2id
    const hashedPassword = await argon2.hash(password, { type: argon2.argon2id });

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        firstName: firstName || '',
        lastName: lastName || '',
        emp_id: emp_id || null,
        isActive: true,
        isVerified: false,
        ...(roleId && {
          roles: {
            create: {
              roleId
            }
          }
        })
      },
      include: {
        roles: {
          select: {
            role: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    // Log audit
    await auditService.log({
      userId: req.user?.id,
      action: 'USER_CREATED',
      resource: 'user',
      details: { userId: user.id, email: user.email },
    });

    return created(res, user, 'User created successfully');
  } catch (err) {
    console.error('Error creating user:', err);
    return error(res, 'Failed to create user', 500);
  }
};

// ...existing code...
// Remove duplicate module.exports

/**
 * Update user role
 */
exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { roleIds } = req.body; // Array of role IDs

    if (!roleIds || !Array.isArray(roleIds)) {
      return error(res, 'roleIds array is required', 400);
    }

    // Remove all existing roles
    await prisma.userRole.deleteMany({
      where: { userId }
    });

    // Add new roles
    const userRoles = await Promise.all(
      roleIds.map(roleId =>
        prisma.userRole.create({
          data: { userId, roleId }
        })
      )
    );

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          select: {
            role: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    return success(res, user, 'User roles updated successfully');
  } catch (err) {
    console.error('Error updating user role:', err);
    return error(res, 'Failed to update user role', 500);
  }
};

/**
 * Get audit logs (login, uploads, data modifications)
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      action,
      userId,
      startDate,
      endDate
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    if (action) where.action = action;
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              firstName: true,
              lastName: true
            }
          }
        }
      }),
      prisma.auditLog.count({ where })
    ]);

    return paginated(res, logs, {
      page: parseInt(page),
      limit: parseInt(limit),
      total
    }, 'Audit logs retrieved successfully');
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    return error(res, 'Failed to fetch audit logs', 500);
  }
};

/**
 * Get online/active users (sessions)
 */
exports.getOnlineUsers = async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { isActive: true },
      orderBy: { lastActiveAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    const onlineUsers = sessions.map(session => {
      const now = new Date();
      const lastActive = new Date(session.lastActiveAt);
      const diffMs = now - lastActive;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      let timeOnline = `${diffMins}m`;
      if (diffHours > 0) timeOnline = `${diffHours}h ${diffMins % 60}m`;
      if (diffDays > 0) timeOnline = `${diffDays}d ${diffHours % 24}h`;

      return {
        ...session,
        timeOnline,
        lastActivityMins: diffMins
      };
    });

    return success(res, onlineUsers, 'Online users retrieved successfully');
  } catch (err) {
    console.error('Error fetching online users:', err);
    return error(res, 'Failed to fetch online users', 500);
  }
};

/**
 * Logout a user session (admin action)
 */
exports.logoutUser = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.session.update({
      where: { id: sessionId },
      data: { isActive: false }
    });

    return success(res, session, 'User session terminated');
  } catch (err) {
    console.error('Error logging out user:', err);
    return error(res, 'Failed to logout user', 500);
  }
};

/**
 * Create new role
 */
exports.createRole = async (req, res) => {
  try {
    const { name, description, permissionIds } = req.body;

    if (!name) {
      return error(res, 'Role name is required', 400);
    }

    const role = await prisma.role.create({
      data: {
        name,
        description: description || '',
        ...(permissionIds && permissionIds.length > 0 && {
          permissions: {
            create: permissionIds.map(permissionId => ({
              permissionId
            }))
          }
        })
      },
      include: {
        permissions: {
          select: {
            permission: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    return created(res, role, 'Role created successfully');
  } catch (err) {
    console.error('Error creating role:', err);
    return error(res, 'Failed to create role', 500);
  }
};

/**
 * Create new permission
 */
exports.createPermission = async (req, res) => {
  try {
    const { name, description, resource, action } = req.body;

    if (!name || !resource || !action) {
      return error(res, 'Name, resource, and action are required', 400);
    }

    const permission = await prisma.permission.create({
      data: {
        name,
        description: description || '',
        resource,
        action
      }
    });

    return created(res, permission, 'Permission created successfully');
  } catch (err) {
    console.error('Error creating permission:', err);
    return error(res, 'Failed to create permission', 500);
  }
};

/**
 * Grant permission to role
 */
exports.grantPermissionToRole = async (req, res) => {
  try {
    const { roleId, permissionIds } = req.body;

    if (!roleId || !permissionIds || permissionIds.length === 0) {
      return error(res, 'Role ID and permission IDs are required', 400);
    }

    // Remove existing permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId }
    });

    // Add new permissions
    const rolePermissions = await Promise.all(
      permissionIds.map(permissionId =>
        prisma.rolePermission.create({
          data: { roleId, permissionId }
        })
      )
    );

    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          select: {
            permission: {
              select: { id: true, name: true, resource: true, action: true }
            }
          }
        }
      }
    });

    return success(res, role, 'Permissions granted successfully');
  } catch (err) {
    console.error('Error granting permissions:', err);
    return error(res, 'Failed to grant permissions', 500);
  }
};

/**
 * Get all roles and permissions
 */
exports.getRolesAndPermissions = async (req, res) => {
  try {
    const [roles, permissions] = await Promise.all([
      prisma.role.findMany({
        include: {
          permissions: {
            select: {
              permission: {
                select: { id: true, name: true, resource: true, action: true }
              }
            }
          }
        }
      }),
      prisma.permission.findMany()
    ]);

    return success(res, { roles, permissions }, 'Roles and permissions retrieved');
  } catch (err) {
    console.error('Error fetching roles:', err);
    return error(res, 'Failed to fetch roles', 500);
  }
};

/**
 * Get user activity (performance metrics)
 */
exports.getUserActivity = async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;

    const metrics = await prisma.performanceMetric.findMany({
      where: {
        ...(userId && { executiveId: userId }),
        ...(startDate || endDate) && {
          createdAt: {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(endDate) })
          }
        }
      },
      include: {
        executive: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return success(res, metrics, 'User activity retrieved successfully');
  } catch (err) {
    console.error('Error fetching user activity:', err);
    return error(res, 'Failed to fetch user activity', 500);
  }
};

/**
 * Get performance analytics (individual or team)
 */
exports.getPerformanceAnalytics = async (req, res) => {
  try {
    const { type = 'all', userId } = req.query; // 'individual', 'team', or 'all'

    let metrics;

    if (type === 'individual' && userId) {
      metrics = await prisma.performanceMetric.findMany({
        where: { executiveId: userId },
        include: {
          executive: {
            select: {
              id: true,
              email: true,
              username: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });
    } else {
      // Get all metrics
      metrics = await prisma.performanceMetric.findMany({
        include: {
          executive: {
            select: {
              id: true,
              email: true,
              username: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });
    }

    // Calculate aggregates
    const totalCases = metrics.reduce((sum, m) => sum + m.total_cases, 0);
    const totalRecovered = metrics.reduce((sum, m) => sum + m.recovered_pos, 0);
    const totalEarnings = metrics.reduce((sum, m) => sum + m.earnings, 0);
    const avgPerformance = metrics.length > 0
      ? (totalRecovered / totalCases * 100).toFixed(2)
      : 0;

    return success(res, {
      metrics,
      analytics: {
        totalCases,
        totalRecovered,
        totalEarnings,
        avgPerformance,
        employeeCount: metrics.length
      }
    }, 'Performance analytics retrieved successfully');
  } catch (err) {
    console.error('Error fetching analytics:', err);
    return error(res, 'Failed to fetch analytics', 500);
  }
};

/**
 * Get all data uploaded/filled by users
 */
exports.getAllUserData = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      dataType, // 'cases', 'feedback', 'blog', etc.
      userId,
      startDate,
      endDate
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    let data = [];
    let total = 0;

    if (dataType === 'cases' || !dataType) {
      const [cases, count] = await Promise.all([
        prisma.case.findMany({
          where: {
            ...(userId && { executiveId: userId }),
            ...(startDate || endDate) && {
              createdAt: {
                ...(startDate && { gte: new Date(startDate) }),
                ...(endDate && { lte: new Date(endDate) })
              }
            }
          },
          skip,
          take,
          include: {
            executive: {
              select: { id: true, email: true, username: true }
            }
          }
        }),
        prisma.case.count()
      ]);
      data = cases;
      total = count;
    }

    if (dataType === 'feedback' || !dataType) {
      const [feedbacks, count] = await Promise.all([
        prisma.feedback.findMany({
          where: {
            ...(userId && { executiveId: userId }),
            ...(startDate || endDate) && {
              createdAt: {
                ...(startDate && { gte: new Date(startDate) }),
                ...(endDate && { lte: new Date(endDate) })
              }
            }
          },
          skip,
          take,
          include: {
            executive: {
              select: { id: true, email: true, username: true }
            }
          }
        }),
        prisma.feedback.count()
      ]);
      data = [...data, ...feedbacks];
      total += count;
    }

    return paginated(res, data, {
      page: parseInt(page),
      limit: parseInt(limit),
      total
    }, 'User data retrieved successfully');
  } catch (err) {
    console.error('Error fetching user data:', err);
    return error(res, 'Failed to fetch user data', 500);
  }
};


