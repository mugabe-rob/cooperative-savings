module.exports = (sequelize, DataTypes) => {
  const Loan = sequelize.define('Loan', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    amount: { type: DataTypes.FLOAT, allowNull: false },
    interestRate: { type: DataTypes.FLOAT, allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'approved', 'rejected', 'paid'), defaultValue: 'pending' },
    issuedDate: { type: DataTypes.DATEONLY },
    dueDate: { type: DataTypes.DATEONLY },
  });

  return Loan;
};
