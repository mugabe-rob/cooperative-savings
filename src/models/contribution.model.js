module.exports = (sequelize, DataTypes) => {
  const Contribution = sequelize.define('Contribution', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    amount: { type: DataTypes.FLOAT, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
  });

  return Contribution;
};
