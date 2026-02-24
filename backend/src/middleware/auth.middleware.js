/**
 * Authentication Middleware
 * Handles JWT token verification and user authentication
 */

const tokenService = require('../services/token.service');
const prisma = require('../config/database');
const AppError = require('../utils/AppError');

/**
 * Authenticate user via JWT access token
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('Access token is required', 'TOKEN_REQUIRED');
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = tokenService.verifyAccessToken(token);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        isActive: true,
        isVerified: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw AppError.unauthorized('User not found', 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      throw AppError.forbidden('Account has been disabled', 'ACCOUNT_DISABLED');
    }

    // Extract roles and permissions
    const roles = user.roles.map((ur) => ur.role.name);
    const permissions = new Set();
    
    user.roles.forEach((ur) => {
      ur.role.permissions.forEach((rp) => {
        permissions.add(`${rp.permission.resource}:${rp.permission.action}`);
      });
    });

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      isActive: user.isActive,
      isVerified: user.isVerified,
      roles,
      permissions: Array.from(permissions),
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = tokenService.verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        isActive: true,
        isVerified: true,
      },
    });

    if (user && user.isActive) {
      req.user = user;
    }

    next();
  } catch (error) {
    // Silently continue without auth
    next();
  }
};

/**
 * Authorization middleware - Check if user has required roles
 * @param {string[]} allowedRoles - Array of role names
 */
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required', 'AUTH_REQUIRED'));
    }

    const userRoles = req.user.roles || [];
    const hasRole = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      return next(
        AppError.forbidden(
          `Access denied. Required role(s): ${allowedRoles.join(', ')}`,
          'INSUFFICIENT_ROLE'
        )
      );
    }

    next();
  };
};

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
};