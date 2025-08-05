module.exports = (sequelize, DataTypes) => {
  const Group = sequelize.define('Group', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.STRING },
    createdBy: { type: DataTypes.UUID, allowNull: false },
  });

  return Group;
};
