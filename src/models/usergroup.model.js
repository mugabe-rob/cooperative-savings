const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserGroup = sequelize.define('UserGroup', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  groupId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'groups',
      key: 'id'
    }
  },
  role: {
    type: DataTypes.ENUM('member', 'leader', 'treasurer', 'secretary'),
    defaultValue: 'member',
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    defaultValue: 'active',
    allowNull: false
  },
  joinedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  leftAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'usergroups',
  timestamps: true,
  paranoid: true, // Enables soft delete
  indexes: [
    {
      unique: true,
      fields: ['userId', 'groupId'],
      where: {
        deletedAt: null
      }
    },
    {
      fields: ['userId']
    },
    {
      fields: ['groupId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['role']
    }
  ]
});

module.exports = UserGroup;
