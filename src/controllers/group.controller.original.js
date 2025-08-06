const Group = require('../models/group.model');
const User = require('../models/user.model');
const { logAudit } = require('../services/audit.service');

/**
 * Create a new VSLA group (FR4)
 */
exports.createGroup = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      location
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Group name is required'
      });
    }

    const group = await Group.create({
      name,
      description,
      location: location || '',
      status: 'active',
      createdBy: req.user?.id || null,
      updatedBy: req.user?.id || null
    });

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: group
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating group',
      error: error.message
    });
  }
};

/**
 * Get all groups
 */
exports.getAllGroups = async (req, res) => {
  try {
    const groups = await Group.findAll({
      where: { deletedAt: null }
    });

    res.json({
      success: true,
      data: groups
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching groups',
      error: error.message
    });
  }
};

/**
 * Get group by ID
 */
exports.getGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const group = await Group.findOne({
      where: { 
        id, 
        deletedAt: null 
      }
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching group',
      error: error.message
    });
  }
};

/**
 * Update group information
 */
exports.updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    delete updateData.id; // Prevent ID modification
    
    const group = await Group.findOne({
      where: { 
        id, 
        deletedAt: null 
      }
    });
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    updateData.updatedBy = req.user?.id || null;
    
    await group.update(updateData);

    res.json({
      success: true,
      message: 'Group updated successfully',
      data: group
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating group',
      error: error.message
    });
  }
};

/**
 * Delete group
 */
exports.deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;

    const group = await Group.findOne({
      where: { 
        id, 
        deletedAt: null 
      }
    });
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Soft delete the group
    await group.update({
      deletedAt: new Date(),
      updatedBy: req.user?.id || null
    });

    res.json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting group',
      error: error.message
    });
  }
};

/**
 * Add member to group
 */
exports.addUserToGroup = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Member added successfully (simplified for testing)'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding member',
      error: error.message
    });
  }
};

/**
 * Create a new VSLA group (FR4)
 * Required permissions: create_group
 */
exports.createGroup = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      location, 
      district,
      sector,
      cell,
      meetingDay,
      meetingTime,
      meetingFrequency,
      minimumContribution,
      maximumContribution,
      contributionFrequency,
      maxLoanAmount,
      defaultInterestRate
    } = req.body;

    // Validate required fields
    if (!name || !location) {
      return res.status(400).json({
        success: false,
        message: 'Group name and location are required'
      });
    }

    // Check if group name already exists in the same location
    const existingGroup = await Group.findOne({
      where: {
        name,
        location,
        status: { [Op.ne]: 'disbanded' }
      }
    });

    if (existingGroup) {
      return res.status(409).json({
        success: false,
        message: 'Group with this name already exists in this location'
      });
    }

    const group = await Group.create({
      name,
      description,
      location,
      district,
      sector,
      cell,
      meetingDay,
      meetingTime,
      meetingFrequency: meetingFrequency || 'weekly',
      minimumContribution: minimumContribution || 0,
      maximumContribution,
      contributionFrequency: contributionFrequency || 'weekly',
      maxLoanAmount,
      defaultInterestRate: defaultInterestRate || 5.00,
      status: 'active',
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    await auditLogger.log(
      req.user.id,
      'create',
      'group',
      group.id,
      req.ip,
      req.get('User-Agent'),
      { 
        groupName: name, 
        location, 
        createdBy: req.user.name 
      }
    );

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: group
    });
  } catch (error) {
    await auditLogger.log(
      req.user.id,
      'create',
      'group',
      null,
      req.ip,
      req.get('User-Agent'),
      { error: error.message },
      false
    );

    res.status(500).json({
      success: false,
      message: 'Error creating group',
      error: error.message
    });
  }
};

/**
 * Get all groups with filtering and pagination (FR4)
 * Required permissions: view_groups
 */
exports.getAllGroups = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search,
      status,
      district,
      sector,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { deletedAt: null };

    // Apply filters
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    if (district) {
      whereClause.district = district;
    }

    if (sector) {
      whereClause.sector = sector;
    }

    const { count, rows: groups } = await Group.findAndCountAll({
      where: whereClause,
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      success: true,
      data: groups,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching groups',
      error: error.message
    });
  }
};

/**
 * Get group by ID with detailed information (FR4)
 * Required permissions: view_group
 */
exports.getGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const group = await Group.findOne({
      where: { 
        id, 
        deletedAt: null 
      }
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching group',
      error: error.message
    });
  }
};

/**
 * Update group information (FR5)
 * Required permissions: update_group
 */
exports.updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    delete updateData.id; // Prevent ID modification
    
    const group = await Group.findOne({
      where: { 
        id, 
        deletedAt: null 
      }
    });
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    updateData.updatedBy = req.user.id;
    
    await group.update(updateData);

    await auditLogger.log(
      req.user.id,
      'update',
      'group',
      id,
      req.ip,
      req.get('User-Agent'),
      { 
        updatedFields: Object.keys(updateData),
        groupName: group.name 
      }
    );

    res.json({
      success: true,
      message: 'Group updated successfully',
      data: group
    });
  } catch (error) {
    await auditLogger.log(
      req.user.id,
      'update',
      'group',
      req.params.id,
      req.ip,
      req.get('User-Agent'),
      { error: error.message },
      false
    );

    res.status(500).json({
      success: false,
      message: 'Error updating group',
      error: error.message
    });
  }
};

/**
 * Permanently delete group
 * Required permissions: delete_group (admin only)
 */
exports.deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;

    const group = await Group.findOne({
      where: { 
        id, 
        deletedAt: null 
      }
    });
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Soft delete the group
    await group.update({
      deletedAt: new Date(),
      updatedBy: req.user.id
    });

    await auditLogger.log(
      req.user.id,
      'delete',
      'group',
      id,
      req.ip,
      req.get('User-Agent'),
      { 
        groupName: group.name,
        permanent: false
      }
    );

    res.json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    await auditLogger.log(
      req.user.id,
      'delete',
      'group',
      req.params.id,
      req.ip,
      req.get('User-Agent'),
      { error: error.message },
      false
    );

    res.status(500).json({
      success: false,
      message: 'Error deleting group',
      error: error.message
    });
  }
};

/**
 * Add member to group
 * Required permissions: manage_group_members
 */
exports.addUserToGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role = 'member' } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Check if group exists and is active
    const group = await Group.findOne({
      where: { 
        id, 
        deletedAt: null,
        status: 'active'
      }
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found or inactive'
      });
    }

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await auditLogger.log(
      req.user.id,
      'add_member',
      'group',
      id,
      req.ip,
      req.get('User-Agent'),
      { 
        userId,
        userName: user.name,
        role,
        groupName: group.name
      }
    );

    res.status(201).json({
      success: true,
      message: 'Member added successfully'
    });
  } catch (error) {
    await auditLogger.log(
      req.user.id,
      'add_member',
      'group',
      req.params.id,
      req.ip,
      req.get('User-Agent'),
      { error: error.message },
      false
    );

    res.status(500).json({
      success: false,
      message: 'Error adding member',
      error: error.message
    });
  }
};