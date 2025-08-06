const { Group } = require('../models');

/**
 * Get all groups
 */
exports.getAllGroups = async (req, res) => {
  try {
    const groups = await Group.findAll();
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
    const group = await Group.findByPk(id);
    
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
 * Create a new group
 */
exports.createGroup = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Group name is required'
      });
    }

    const group = await Group.create({
      name,
      description
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
 * Update group
 */
exports.updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const group = await Group.findByPk(id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    await group.update(updates);

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
    const group = await Group.findByPk(id);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    await group.destroy();

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
 * Add user to group (placeholder)
 */
exports.addUserToGroup = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Add user to group functionality - coming soon'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding user to group',
      error: error.message
    });
  }
};

/**
 * Get all groups
 */
exports.getAllGroups = async (req, res) => {
  try {
    const groups = await Group.findAll();
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
    const group = await Group.findByPk(id);
    
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
 * Create a new group
 */
exports.createGroup = async (req, res) => {
  try {
    const { name, description, location, maxMembers } = req.body;

    if (!name || !location) {
      return res.status(400).json({
        success: false,
        message: 'Group name and location are required'
      });
    }

    const group = await Group.create({
      name,
      description,
      location,
      maxMembers: maxMembers || 25,
      createdBy: req.user?.id,
      updatedBy: req.user?.id
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
 * Update group
 */
exports.updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const group = await Group.findByPk(id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    await group.update({
      ...updates,
      updatedBy: req.user?.id
    });

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
    const group = await Group.findByPk(id);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    await group.destroy();

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
