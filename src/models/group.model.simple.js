module.exports = (sequelize, DataTypes) => {
  const Group = sequelize.define('Group', {
    id: { 
      type: DataTypes.UUID, 
      defaultValue: DataTypes.UUIDV4, 
      primaryKey: true 
    },
    name: { 
      type: DataTypes.STRING(255), 
      allowNull: false, 
      unique: true
    },
    description: { 
      type: DataTypes.TEXT,
      allowNull: true 
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    maxMembers: {
      type: DataTypes.INTEGER,
      defaultValue: 25
    }
  }, {
    timestamps: true,
    tableName: 'groups'
  });

  return Group;
};
