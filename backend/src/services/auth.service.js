/**
 * Authentication Service
 * Handles user authentication, registration, and session management
 * Implementation: Prisma 7 + Argon2id
 */

const argon2 = require('argon2');
const prisma = require('../config/database');
const tokenService = require('./token.service');
const auditService = require('./audit.service');
const AppError = require('../utils/AppError');

/**
 * Register a new user with Argon2id
 */
const register = async (userData, metadata = {}) => {
  const { email, username, password, firstName, lastName, phone, emp_id } = userData;

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }, { phone }] },
  });

  if (existingUser) {
    throw AppError.conflict(
      existingUser.email === email ? 'Email already registered' : 'Username already taken', 
      'AUTH_EXISTS'
    );
  }

  // 1. Argon2id Hashing
  const hashedPassword = await argon2.hash(password, { type: argon2.argon2id });

  // 2. Atomic Transaction for User Creation (NO role assigned)
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email,
        username,
        phone,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        emp_id: emp_id || null,
      },
    });

    // No role assigned - admin will assign later
    return newUser;
  });

  // 3. Generate tokens and log audit
  const tokens = await tokenService.generateTokenPair(user, metadata);
  await auditService.log({ 
    userId: user.id, 
    action: 'REGISTER', 
    resource: 'auth', 
    details: { email: user.email }, 
    ...metadata 
  });

  return { user: sanitizeUser(user), tokens };
};

/**
 * Login user with Argon2id Verification and Session Tracking
 */
const login = async (credentials, metadata = {}) => {
  const { email, username, password } = credentials;

  // 1. Find user with full RBAC includes
  const user = await prisma.user.findFirst({
    where: { 
      OR: [
        { email: email || undefined }, 
        { username: username || undefined }
      ] 
    },
    include: { 
      roles: { 
        include: { 
          role: { 
            include: { 
              permissions: { include: { permission: true } } 
            } 
          } 
        } 
      } 
    },
  });

  // 2. Security Checks
  if (!user || !user.isActive) {
    await auditService.log({ 
      action: 'LOGIN_FAILED', 
      resource: 'auth', 
      details: { reason: !user ? 'User not found' : 'Account inactive' }, 
      success: false, 
      ...metadata 
    });
    throw AppError.unauthorized('Invalid credentials', 'AUTH_FAILED');
  }

  // 3. Argon2id Password Verification
  const isPasswordValid = await argon2.verify(user.password, password);
  if (!isPasswordValid) {
    await auditService.log({ 
      userId: user.id, 
      action: 'LOGIN_FAILED', 
      resource: 'auth', 
      details: { reason: 'Invalid password' }, 
      success: false, 
      ...metadata 
    });
    throw AppError.unauthorized('Invalid credentials', 'AUTH_FAILED');
  }

  // 4. Update Database State (Last Login & Session)
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      userAgent: metadata.userAgent || null,
      ipAddress: metadata.ipAddress || null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 Days
    },
  });

  // 5. Generate Tokens
  const tokens = await tokenService.generateTokenPair(user, metadata);

  // 6. Log successful login
  await auditService.log({
    userId: user.id,
    action: 'LOGIN',
    resource: 'auth',
    details: { sessionId: session.id },
    ...metadata,
  });

  return { user: sanitizeUser(user), tokens };
};

/**
 * Logout user - revoke current refresh token and deactivate session
 */
const logout = async (refreshToken, userId, metadata = {}) => {
  if (refreshToken) {
    await tokenService.revokeRefreshToken(refreshToken);
  }

  await prisma.session.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false },
  });

  await auditService.log({ userId, action: 'LOGOUT', resource: 'auth', ...metadata });
};

/**
 * Logout from all devices - Global Revocation
 */
const logoutAll = async (userId, metadata = {}) => {
  await tokenService.revokeAllUserTokens(userId);
  await prisma.session.updateMany({
    where: { userId },
    data: { isActive: false },
  });

  await auditService.log({ userId, action: 'LOGOUT_ALL', resource: 'auth', ...metadata });
};

/**
 * Refresh access token via rotation
 */
const refreshToken = async (token, metadata = {}) => {
  return await tokenService.rotateRefreshToken(token, metadata);
};

/**
 * Change password with Global Logout for security
 */
const changePassword = async (userId, currentPassword, newPassword, metadata = {}) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) throw AppError.notFound('User not found', 'USER_NOT_FOUND');

  // Verify current password with Argon2id
  const isPasswordValid = await argon2.verify(user.password, currentPassword);
  if (!isPasswordValid) {
    await auditService.log({ 
      userId, 
      action: 'PASSWORD_CHANGE_FAILED', 
      resource: 'auth', 
      success: false, 
      ...metadata 
    });
    throw AppError.unauthorized('Current password incorrect', 'INVALID_PASSWORD');
  }

  // Hash new password
  const hashedPassword = await argon2.hash(newPassword, { type: argon2.argon2id });

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  // Security: Force logout on all other devices
  await tokenService.revokeAllUserTokens(userId);
  await auditService.log({ userId, action: 'PASSWORD_CHANGED', resource: 'auth', ...metadata });

  return true;
};

/**
 * Get current user with flattened permissions
 */
const getCurrentUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: {
            include: { permissions: { include: { permission: true } } }
          }
        }
      },
    },
  });

  if (!user) throw AppError.notFound('User not found', 'USER_NOT_FOUND');
  return sanitizeUser(user);
};

/**
 * Utility: Remove password and flatten RBAC for frontend
 */
const sanitizeUser = (user) => {
  const { password, ...sanitized } = user;

  if (sanitized.roles) {
    // Extract readable roles
    const roles = sanitized.roles.map((ur) => ({
      id: ur.role.id,
      name: ur.role.name,
    }));

    // Flatten permissions into unique string array: ["resource:action"]
    const permissions = [...new Set(
      sanitized.roles.flatMap((ur) => 
        ur.role.permissions.map((rp) => `${rp.permission.resource}:${rp.permission.action}`)
      )
    )];

    return { ...sanitized, roles, permissions };
  }

  return sanitized;
};

module.exports = {
  register,
  login,
  logout,
  logoutAll,
  refreshToken,
  changePassword,
  getCurrentUser,
  sanitizeUser,
};