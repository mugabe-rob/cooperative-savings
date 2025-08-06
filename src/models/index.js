const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.User = require('./user.model')(sequelize, DataTypes);
db.Group = require('./group.model')(sequelize, DataTypes);
db.Contribution = require('./contribution.model')(sequelize, DataTypes);
db.Loan = require('./loan.model')(sequelize, DataTypes);
db.Repayment = require('./repayment.model')(sequelize, DataTypes);

// Associations
db.User.belongsToMany(db.Group, { through: 'UserGroups', foreignKey: 'userId' });
db.Group.belongsToMany(db.User, { through: 'UserGroups', foreignKey: 'groupId' });

db.Group.hasMany(db.Contribution);
db.Contribution.belongsTo(db.Group);

db.User.hasMany(db.Contribution);
db.Contribution.belongsTo(db.User);

db.Group.hasMany(db.Loan);
db.Loan.belongsTo(db.Group);

db.User.hasMany(db.Loan);
db.Loan.belongsTo(db.User);

db.Loan.hasMany(db.Repayment);
db.Repayment.belongsTo(db.Loan);

module.exports = db;
