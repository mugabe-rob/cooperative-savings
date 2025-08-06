/**
 * Enhanced Role-Based Access Control Middleware
 * Implements URS security requirements NFR4
 */

// Role hierarchy and permissions
const ROLE_HIERARCHY = {
  'admin': 4,
  'leader': 3,
  'member': 2,
  'auditor': 1
};

const PERMISSIONS = {
  // User Management (FR1-FR3)
  'users:read': ['admin', 'leader', 'auditor'],
  'users:create': ['admin'],
  'users:update': ['admin', 'leader'], // Leaders can update group members
  'users:delete': ['admin'],
  'users:suspend': ['admin', 'leader'],
  'users:profile_update': ['admin', 'leader', 'member'], // Own profile

  // Group Management (FR4-FR6)
  'groups:read': ['admin', 'leader', 'member', 'auditor'],
  'groups:create': ['admin'],
  'groups:update': ['admin', 'leader'], // Leaders can update their groups
  'groups:delete': ['admin'],
  'groups:archive': ['admin', 'leader'],
  'groups:assign_leader': ['admin'],

  // Contribution Management (FR7-FR9)
  'contributions:read': ['admin', 'leader', 'member', 'auditor'],
  'contributions:create': ['admin', 'leader', 'member'],
  'contributions:update': ['admin', 'leader'],
  'contributions:delete': ['admin'],

  // Loan Management (FR10-FR12)
  'loans:read': ['admin', 'leader', 'member', 'auditor'],
  'loans:create': ['admin', 'leader', 'member'],
  'loans:approve': ['admin', 'leader'],
  'loans:reject': ['admin', 'leader'],
  'loans:disburse': ['admin', 'leader'],
  'loans:update': ['admin', 'leader'],
  'loans:delete': ['admin'],

  // Reporting & Analytics (FR16-FR18)
  'reports:read': ['admin', 'leader', 'auditor'],
  'reports:export': ['admin', 'leader', 'auditor'],
  'reports:dashboard': ['admin', 'leader'],

  // Audit & Logging (FR19-FR20)
  'audit:read': ['admin', 'auditor'],
  'audit:export': ['admin', 'auditor'],

  // System Administration
  'system:settings': ['admin'],
  'system:backup': ['admin'],
  'system:users_bulk': ['admin']
};

/**
 * Check if user has required permission
 */
const hasPermission = (userRole, permission) => {
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles && allowedRoles.includes(userRole);
};

/**
 * Check if user has sufficient role level
 */
const hasRoleLevel = (userRole, requiredRole) => {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
  return userLevel >= requiredLevel;
};

/**
 * Basic role-based middleware
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

/**
 * Permission-based middleware
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied',
        required: permission,
        role: req.user.role
      });
    }

    next();
  };
};

/**
 * Resource ownership middleware
 * Allows users to access their own resources
 */
const requireOwnershipOrRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user has required role
    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    // Check if user is accessing their own resource
    const resourceUserId = req.params.userId || req.params.id || req.body.userId;
    if (resourceUserId && resourceUserId === req.user.id) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. Insufficient permissions or not resource owner.'
    });
  };
};

/**
 * Group membership middleware
 * Ensures user is member of the group they're trying to access
 */
const requireGroupMembership = () => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Admins can access any group
      if (req.user.role === 'admin') {
        return next();
      }

      const groupId = req.params.groupId || req.body.groupId;
      if (!groupId) {
        return res.status(400).json({
          success: false,
          message: 'Group ID required'
        });
      }

      // Check if user is member of the group
      const { UserGroup } = require('../models');
      const membership = await UserGroup.findOne({
        where: {
          userId: req.user.id,
          groupId: groupId
        }
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not a member of this group.'
        });
      }

      // Add membership info to request
      req.groupMembership = membership;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking group membership',
        error: error.message
      });
    }
  };
};

/**
 * Audit logging middleware
 * Logs user actions for audit trail (FR19)
 */
const auditLog = (action, resource) => {
  return (req, res, next) => {
    // Store audit info in request for later processing
    req.audit = {
      userId: req.user?.id,
      action,
      resource,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date(),
      details: {
        method: req.method,
        url: req.originalUrl,
        params: req.params,
        query: req.query
      }
    };

    // Continue to next middleware
    next();
  };
};

/**
 * Account status check middleware
 * Ensures user account is active and not suspended
 */
const checkAccountStatus = () => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next();
      }

      const { User } = require('../models');
      const user = await User.findByPk(req.user.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User account not found'
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated. Please contact administrator.'
        });
      }

      if (user.isSuspended) {
        return res.status(403).json({
          success: false,
          message: 'Account is suspended. Please contact administrator.',
          suspendedAt: user.suspendedAt,
          reason: user.suspensionReason
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking account status',
        error: error.message
      });
    }
  };
};

module.exports = {
  requireRole,
  requirePermission,
  requireOwnershipOrRole,
  requireGroupMembership,
  auditLog,
  checkAccountStatus,
  hasPermission,
  hasRoleLevel,
  ROLE_HIERARCHY,
  PERMISSIONS
};
