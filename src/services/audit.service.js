/**
 * Audit Logging Service
 * Implements URS requirements FR19-FR20
 */

const { sequelize } = require('../config/database');

// Create audit log table
const createAuditTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT (UUID()),
      user_id UUID,
      action VARCHAR(100) NOT NULL,
      resource VARCHAR(100) NOT NULL,
      resource_id UUID,
      ip_address VARCHAR(45),
      user_agent TEXT,
      request_method VARCHAR(10),
      request_url VARCHAR(500),
      request_params JSON,
      request_query JSON,
      response_status INT,
      success BOOLEAN DEFAULT TRUE,
      error_message TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id),
      INDEX idx_action (action),
      INDEX idx_resource (resource),
      INDEX idx_timestamp (timestamp)
    );
  `;
  
  try {
    await sequelize.query(query);
    console.log('✅ Audit log table created/verified');
  } catch (error) {
    console.error('❌ Error creating audit log table:', error.message);
  }
};

// Log audit entry
const logAudit = async (auditData) => {
  try {
    const query = `
      INSERT INTO audit_logs (
        user_id, action, resource, resource_id, ip_address, 
        user_agent, request_method, request_url, request_params, 
        request_query, response_status, success, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await sequelize.query(query, {
      replacements: [
        auditData.userId || null,
        auditData.action,
        auditData.resource,
        auditData.resourceId || null,
        auditData.ip,
        auditData.userAgent,
        auditData.details?.method,
        auditData.details?.url,
        JSON.stringify(auditData.details?.params || {}),
        JSON.stringify(auditData.details?.query || {}),
        auditData.responseStatus || 200,
        auditData.success !== false,
        auditData.errorMessage || null
      ]
    });
  } catch (error) {
    console.error('❌ Error logging audit:', error.message);
  }
};

// Get audit logs with filtering
const getAuditLogs = async (options = {}) => {
  try {
    const {
      page = 1,
      limit = 50,
      userId,
      action,
      resource,
      startDate,
      endDate,
      success
    } = options;

    const offset = (page - 1) * limit;
    
    let whereConditions = [];
    let replacements = [];

    if (userId) {
      whereConditions.push('user_id = ?');
      replacements.push(userId);
    }

    if (action) {
      whereConditions.push('action = ?');
      replacements.push(action);
    }

    if (resource) {
      whereConditions.push('resource = ?');
      replacements.push(resource);
    }

    if (startDate) {
      whereConditions.push('timestamp >= ?');
      replacements.push(startDate);
    }

    if (endDate) {
      whereConditions.push('timestamp <= ?');
      replacements.push(endDate);
    }

    if (success !== undefined) {
      whereConditions.push('success = ?');
      replacements.push(success);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ') 
      : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM audit_logs 
      ${whereClause}
    `;
    
    const [[{ total }]] = await sequelize.query(countQuery, {
      replacements
    });

    // Get logs
    const logsQuery = `
      SELECT 
        al.*,
        u.fullName as user_name,
        u.role as user_role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.timestamp DESC
      LIMIT ? OFFSET ?
    `;

    const [logs] = await sequelize.query(logsQuery, {
      replacements: [...replacements, limit, offset]
    });

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('❌ Error fetching audit logs:', error.message);
    throw error;
  }
};

// Export audit logs (for external auditors)
const exportAuditLogs = async (options = {}) => {
  try {
    const {
      startDate,
      endDate,
      userId,
      format = 'json'
    } = options;

    let whereConditions = [];
    let replacements = [];

    if (userId) {
      whereConditions.push('user_id = ?');
      replacements.push(userId);
    }

    if (startDate) {
      whereConditions.push('timestamp >= ?');
      replacements.push(startDate);
    }

    if (endDate) {
      whereConditions.push('timestamp <= ?');
      replacements.push(endDate);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ') 
      : '';

    const query = `
      SELECT 
        al.*,
        u.fullName as user_name,
        u.role as user_role,
        u.email as user_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.timestamp DESC
    `;

    const [logs] = await sequelize.query(query, {
      replacements
    });

    if (format === 'csv') {
      return convertToCSV(logs);
    }

    return logs;
  } catch (error) {
    console.error('❌ Error exporting audit logs:', error.message);
    throw error;
  }
};

// Convert logs to CSV format
const convertToCSV = (logs) => {
  if (!logs.length) return '';

  const headers = [
    'ID', 'User ID', 'User Name', 'User Role', 'Action', 'Resource', 
    'Resource ID', 'IP Address', 'Method', 'URL', 'Success', 'Timestamp'
  ];

  const csvRows = [headers.join(',')];

  logs.forEach(log => {
    const row = [
      log.id,
      log.user_id || '',
      log.user_name || 'System',
      log.user_role || '',
      log.action,
      log.resource,
      log.resource_id || '',
      log.ip_address || '',
      log.request_method || '',
      log.request_url || '',
      log.success ? 'Yes' : 'No',
      log.timestamp
    ];
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
};

// Get audit statistics
const getAuditStats = async (options = {}) => {
  try {
    const {
      startDate,
      endDate,
      userId
    } = options;

    let whereConditions = ['1=1'];
    let replacements = [];

    if (userId) {
      whereConditions.push('user_id = ?');
      replacements.push(userId);
    }

    if (startDate) {
      whereConditions.push('timestamp >= ?');
      replacements.push(startDate);
    }

    if (endDate) {
      whereConditions.push('timestamp <= ?');
      replacements.push(endDate);
    }

    const whereClause = 'WHERE ' + whereConditions.join(' AND ');

    // Get overall stats
    const statsQuery = `
      SELECT 
        COUNT(*) as total_actions,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(CASE WHEN success = 1 THEN 1 END) as successful_actions,
        COUNT(CASE WHEN success = 0 THEN 1 END) as failed_actions
      FROM audit_logs 
      ${whereClause}
    `;

    const [[stats]] = await sequelize.query(statsQuery, {
      replacements
    });

    // Get action breakdown
    const actionQuery = `
      SELECT action, COUNT(*) as count
      FROM audit_logs 
      ${whereClause}
      GROUP BY action
      ORDER BY count DESC
      LIMIT 10
    `;

    const [actionStats] = await sequelize.query(actionQuery, {
      replacements
    });

    // Get resource breakdown
    const resourceQuery = `
      SELECT resource, COUNT(*) as count
      FROM audit_logs 
      ${whereClause}
      GROUP BY resource
      ORDER BY count DESC
      LIMIT 10
    `;

    const [resourceStats] = await sequelize.query(resourceQuery, {
      replacements
    });

    return {
      overall: stats,
      actions: actionStats,
      resources: resourceStats
    };
  } catch (error) {
    console.error('❌ Error fetching audit stats:', error.message);
    throw error;
  }
};

// Middleware to automatically log audit trails
const auditMiddleware = (req, res, next) => {
  // Store original send method
  const originalSend = res.send;

  // Override send method to capture response
  res.send = function(data) {
    // Log audit if audit info exists
    if (req.audit) {
      const auditData = {
        ...req.audit,
        responseStatus: res.statusCode,
        success: res.statusCode < 400,
        errorMessage: res.statusCode >= 400 ? 
          (typeof data === 'string' ? data : JSON.stringify(data)) : null
      };

      // Log async without blocking response
      setImmediate(() => logAudit(auditData));
    }

    // Call original send
    originalSend.call(this, data);
  };

  next();
};

module.exports = {
  createAuditTable,
  logAudit,
  getAuditLogs,
  exportAuditLogs,
  getAuditStats,
  auditMiddleware
};
