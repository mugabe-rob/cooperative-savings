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
    }
  }, {
    timestamps: true,
    tableName: 'groups'
  });

  return Group;
};
