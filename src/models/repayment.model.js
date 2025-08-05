module.exports = (sequelize, DataTypes) => {
  const Repayment = sequelize.define('Repayment', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    amountPaid: { type: DataTypes.FLOAT, allowNull: false },
    paidOn: { type: DataTypes.DATEONLY, allowNull: false },
  });

  return Repayment;
};
